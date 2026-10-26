#!/usr/bin/env node
/** Cheap candidate-only checks before the full frozen My Lesson browser run.
 * Reads existing rendered plans; never refreshes a pin or grants admission. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {pinFile, readPin, uniquePins} from '../lib/g678-admission-proof.mjs';

const ACTIVATION = 'apps/web/lib/g678-admission-activation.ts';
const ROLES = ['currentHost', 'installedPacket', 'applicationTypecheck', 'candidateProof'];
const same = (a, b) => a?.path === b?.path && a?.bytes === b?.bytes && a?.sha256 === b?.sha256;
const includes = (pins, pin) => pins?.some(p => same(p, pin));

export function preflightHfrBrowser({root, planPin, orderPin, extraDrivers = []}) {
  const startedAt = new Date().toISOString(), begin = performance.now();
  let phase = 'rendered-plan', category = null, error = null, animationId = null;
  let selectedDrivers = [], readCalls = 0, readBytes = 0;
  const observations = new Map();
  const read = pin => {
    const previous = observations.get(pin.path);
    assert(!previous || same(previous, pin), `Conflicting current pin: ${pin.path}`);
    const bytes = readPin(root, pin); readCalls++; readBytes += bytes.length;
    observations.set(pin.path, pin); return bytes;
  };
  const json = pin => JSON.parse(read(pin).toString());
  try {
    const plan = json(planPin), order = json(orderPin);
    assert.equal(plan.mode, 'candidate', 'Candidate-only preflight; registered proofs use host transitions');
    assert.equal(plan.root, root, 'Rendered plan execution root');
    const origin = new URL(plan.origin);
    assert(origin.protocol === 'http:' && origin.hostname === '127.0.0.1' &&
      !origin.username && !origin.password && origin.href === origin.origin + '/', 'Exact loopback origin');
    assert(Array.isArray(plan.actualBindings), 'Actual bindings required');
    const bindings = Object.fromEntries(ROLES.map(role => {
      const found = plan.actualBindings.filter(x => x.role === role);
      assert.equal(found.length, 1, `Exactly one ${role} binding`); return [role, found[0].pin];
    }));
    phase = 'candidate-binding';
    const host = json(bindings.currentHost), packet = json(bindings.installedPacket);
    const app = json(bindings.applicationTypecheck), proof = json(bindings.candidateProof);
    animationId = proof.animationId;
    assert(/^shared-(alg001|dat001|geo001|nms002)-l\d{2}-p\d{3}$/.test(animationId), 'G6-G8 placement');
    assert.equal(packet.entry?.key, animationId, 'Packet/proof placement identity');
    assert.equal(packet.deploymentScope, 'local-only', 'Local candidate only');
    assert(same(proof.packet?.freezeManifest, bindings.installedPacket), 'Proof packet binding');
    assert(includes(proof.files, bindings.applicationTypecheck), 'Proof application receipt binding');
    assert.equal(app.exitCode, 0, 'Application typecheck failed');
    assert(app.inputPreflightMatches === true && app.inputPostflightMatches === true,
      'Application receipt requires matching inputs before and after');
    assert.equal(app.cwd, root, 'Application check execution root');
    assert(app.programContainsAllNewPageSources === true && app.programStillContainsAllFourExtraSources === true,
      'Application typecheck must include the candidate page and required shared sources');
    assert(Number.isFinite(Date.parse(app.startedAt)) && Number.isFinite(Date.parse(app.completedAt)) &&
      Date.parse(app.completedAt) >= Date.parse(app.startedAt), 'Completed application check interval required');
    assert(same(app.hostPin, bindings.currentHost), 'Application host binding');

    phase = 'active-host';
    const activationPin = pinFile(root, ACTIVATION), activation = read(activationPin).toString();
    const match = activation.match(/export const G678_ADMISSION_INDEX = (\{[\s\S]*?\}) as const;/);
    assert(match, 'Maintained activation declaration');
    const index = json(JSON.parse(match[1]));
    assert(same(index.host, bindings.currentHost), 'Rendered host is no longer the active host');
    for (const pin of plan.routeSourcePins ?? []) {
      assert(includes(host.files, pin), `Host does not bind route: ${pin.path}`); read(pin);
    }
    assert((plan.routeSourcePins?.length ?? 0) > 0, 'Route source pins required');

    phase = 'packet-inputs';
    assert((packet.integrity?.files?.length ?? 0) > 0, 'Packet integrity closure required');
    for (const pin of uniquePins(packet.integrity.files)) read(pin);
    for (const pin of uniquePins([...(plan.templatePins ?? []), ...(plan.successorInputPins ?? [])])) read(pin);

    phase = 'adapter-syntax';
    assert(Array.isArray(plan.adapters) && plan.adapters.length > 0, 'Rendered adapters required');
    const drivers = uniquePins([...plan.adapters, ...extraDrivers]);
    for (const pin of drivers) {
      // Parse the actual browser-evaluated function expression without running it.
      new vm.Script('(' + read(pin).toString() + '\n)', {filename: pin.path});
    }
    phase = 'run-order';
    assert(Number.isSafeInteger(order.expected) && order.expected > 0 &&
      order.expected === order.drivers?.length, 'Explicit complete selected run order');
    assert.equal(new Set(order.drivers).size, order.expected, 'Duplicate selected driver');
    selectedDrivers = order.drivers.map(file => {
      const pin = drivers.find(p => p.path === file);
      assert(pin, `Selected driver is not pinned by the plan or explicit extras: ${file}`); return pin;
    });
    // This small final reread detects concurrent changes; full freeze still owns
    // complete source closure, semantic validation and run-long change watching.
    phase = 'final-input-readback';
    for (const pin of [...observations.values()]) read(pin);
  } catch (cause) {
    category = ['adapter-syntax', 'run-order'].includes(phase) ? 'test-adapter' : 'candidate-binding';
    error = cause.message;
  }
  return {kind: 'hfr-browser-preflight-v1', startedAt, finishedAt: new Date().toISOString(),
    elapsedMs: performance.now() - begin, status: error ? 'failed' : 'offline-preflight-passed',
    phase, category, error, animationId, plan: planPin, order: orderPin, selectedDrivers,
    inputs: [...observations.values()], readCalls, readBytes, fullFreezeRequired: true,
    browserExecuted: false, registeredDelta: 0,
    limits: 'Candidate binding and script syntax only; source semantics, current browser readiness, full stable freeze and page acceptance remain separate.'};
}

/** Optional HTTP diagnostic. Never follows redirects or treats HTML as a browser pass. */
export async function probeHfrRoutes({origin, animationId, timeoutMs = 10000}) {
  const base = new URL(origin);
  assert(base.protocol === 'http:' && base.hostname === '127.0.0.1' &&
    !base.username && !base.password && base.href === base.origin + '/', 'Exact loopback origin');
  assert(/^shared-(alg001|dat001|geo001|nms002)-l\d{2}-p\d{3}$/.test(animationId), 'G6-G8 placement');
  const rows = [];
  for (const locale of ['en', 'es']) {
    const url = `${base.origin}/${locale}/migration-status/g678-hfr/${animationId}/candidate`;
    const row = {url, passed: false};
    let response;
    try {
      response = await fetch(url, {redirect: 'manual', signal: AbortSignal.timeout(timeoutMs)});
      row.status = response.status;
      assert.equal(response.status, 200, 'Expected exact candidate HTTP 200');
      assert(response.headers.get('content-type')?.includes('text/html'), 'Expected course HTML');
      const chunks = []; let length = 0;
      for await (const chunk of response.body) {
        length += chunk.length; assert(length <= 8 * 1024 * 1024, 'Bounded candidate HTML'); chunks.push(chunk);
      }
      const html = Buffer.concat(chunks).toString();
      assert(html.includes(`data-hfr-placement="${animationId}"`) &&
        html.includes('data-hfr-review-mode="candidate"'), 'Expected actual HFR placement and mode');
      row.passed = true;
    } catch (cause) {
      row.error = cause.message;
      row.category = response ? 'candidate-route' : 'server-unavailable';
    } finally {
      if (response?.body && !response.bodyUsed) await response.body.cancel().catch(() => {});
    }
    rows.push(row);
  }
  return {kind: 'hfr-route-http-diagnostic-v1', passed: rows.every(x => x.passed), rows,
    browserExecuted: false, note: 'HTTP identity only. The owned browser warmup and full frozen suite are still required.'};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [planPath, orderPath, output, ...options] = process.argv.slice(2);
  assert(planPath && orderPath && output, 'Usage: node scripts/hfr-browser-preflight.mjs PLAN RUN_ORDER NEW_REPORT [--extra-driver FILE] [--probe-routes]');
  const root = process.cwd(), extraDrivers = []; let probe = false;
  for (let i = 0; i < options.length; i++) {
    if (options[i] === '--extra-driver') {assert(options[i + 1], 'Extra driver path'); extraDrivers.push(pinFile(root, options[++i]));}
    else if (options[i] === '--probe-routes') probe = true;
    else throw Error('Unknown option: ' + options[i]);
  }
  assert(!fs.existsSync(output), 'Use a new report path; preserve prior results');
  const result = preflightHfrBrowser({root, planPin: pinFile(root, planPath), orderPin: pinFile(root, orderPath), extraDrivers});
  if (probe && result.status === 'offline-preflight-passed') {
    const plan = JSON.parse(readPin(root, result.plan));
    result.http = await probeHfrRoutes({origin: plan.origin, animationId: result.animationId});
    if (!result.http.passed) result.status = 'failed';
  }
  fs.mkdirSync(path.dirname(output), {recursive: true});
  fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n', {flag: 'wx'});
  console.log(JSON.stringify({status: result.status, phase: result.phase, category: result.category,
    error: result.error, elapsedMs: result.elapsedMs, readCalls: result.readCalls, readBytes: result.readBytes, output}));
  if (result.status === 'failed') process.exitCode = 1;
}
