import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {pinFile} from '../lib/g678-admission-proof.mjs';
import {preflightHfrBrowser, probeHfrRoutes} from './hfr-browser-preflight.mjs';

function fixture(t, options = {}) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'hfr-preflight-')));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const write = (file, value) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), {recursive: true});
    fs.writeFileSync(path.join(root, file), typeof value === 'string' ? value : JSON.stringify(value));
    return pinFile(root, file);
  };
  const id = 'shared-nms002-l11-p007', css = write('app.css', '.heading { display: flex; }');
  const route = write('route.tsx', 'export const mode="candidate"');
  const host = write('host.json', {files: [css, route]});
  const index = write('index.json', {host: options.staleHost ? {...host, sha256: '0'.repeat(64)} : host});
  write('apps/web/lib/g678-admission-activation.ts', `export const G678_ADMISSION_INDEX = ${JSON.stringify(index)} as const;`);
  const packet = write('packet.json', {entry: {key: id}, deploymentScope: 'local-only', integrity: {files: [css]}});
  const app = write('app.json', {exitCode: options.failedApp ? 1 : 0,
    inputPreflightMatches: true, inputPostflightMatches: !options.driftedApp, hostPin: host,
    cwd: options.wrongRoot ? root + '/other' : root,
    programContainsAllNewPageSources: options.missingCoverage ? undefined : !options.excludedPage,
    programStillContainsAllFourExtraSources: !options.excludedShared,
    startedAt: '2026-10-12T00:00:00Z', completedAt: options.incompleteApp ? undefined : '2026-10-12T00:01:00Z'});
  const proof = write('proof.json', {animationId: id, packet: {freezeManifest: packet}, files: [app]});
  const adapter = write('case.js', options.badSyntax ? 'async()=>{' : 'async()=>({passed:false})');
  const planPin = write('plan.json', {root, origin: 'http://127.0.0.1:3331', mode: options.mode ?? 'candidate',
    actualBindings: [host, packet, app, proof].map((pin, i) => ({role: ['currentHost', 'installedPacket', 'applicationTypecheck', 'candidateProof'][i], pin})),
    routeSourcePins: [route], adapters: [adapter], templatePins: [], successorInputPins: []});
  const orderPin = write('order.json', {expected: options.duplicate ? 2 : 1,
    drivers: options.duplicate ? ['case.js', 'case.js'] : [options.unpinned ? 'other.js' : 'case.js']});
  return {root, write, run: () => preflightHfrBrowser({root, planPin, orderPin})};
}

test('passes cheap bindings and syntax without executing even a failing adapter', t => {
  const result = fixture(t).run();
  assert.equal(result.status, 'offline-preflight-passed');
  assert.equal(result.browserExecuted, false); assert.equal(result.fullFreezeRequired, true);
  assert.equal(result.registeredDelta, 0); assert.equal(result.selectedDrivers.length, 1);
});
test('catches old CSS packet before browser freeze', t => {
  const f = fixture(t); f.write('app.css', '.heading { display: grid; }');
  const result = f.run(); assert.equal(result.status, 'failed');
  assert.equal(result.phase, 'packet-inputs'); assert.match(result.error, /current bytes: app.css/);
});
test('catches active host change even when old host file still hashes correctly', t => {
  const result = fixture(t, {staleHost: true}).run();
  assert.equal(result.status, 'failed'); assert.equal(result.phase, 'active-host');
});
for (const option of ['failedApp', 'driftedApp', 'wrongRoot', 'missingCoverage', 'excludedPage', 'excludedShared', 'incompleteApp']) test('rejects application receipt: ' + option, t => {
  const result = fixture(t, {[option]: true}).run();
  assert.equal(result.status, 'failed'); assert.equal(result.phase, 'candidate-binding');
});
test('classifies actual rendered syntax failure separately', t => {
  const result = fixture(t, {badSyntax: true}).run();
  assert.equal(result.status, 'failed'); assert.equal(result.category, 'test-adapter');
  assert.equal(result.phase, 'adapter-syntax');
});
for (const option of ['duplicate', 'unpinned']) test('rejects invalid run order: ' + option, t => {
  const result = fixture(t, {[option]: true}).run();
  assert.equal(result.status, 'failed'); assert.equal(result.phase, 'run-order');
});
test('does not misapply direct packet checks to registered legacy input transitions', t => {
  const result = fixture(t, {mode: 'registered'}).run();
  assert.equal(result.status, 'failed'); assert.match(result.error, /Candidate-only/);
});

async function server(t, handler) {
  const value = http.createServer(handler);
  await new Promise(resolve => value.listen(0, '127.0.0.1', resolve));
  t.after(() => {value.closeAllConnections(); return new Promise(resolve => value.close(resolve));});
  return {value, origin: `http://127.0.0.1:${value.address().port}`};
}
const animationId = 'shared-nms002-l11-p007';
test('checks EN and ES exact HTTP placement but never claims browser completion', async t => {
  const urls = [];
  const {origin} = await server(t, (req, res) => {urls.push(req.url); res.setHeader('content-type', 'text/html');
    res.end(`<main data-hfr-placement="${animationId}" data-hfr-review-mode="candidate"></main>`);});
  const result = await probeHfrRoutes({origin, animationId});
  assert.equal(result.passed, true); assert.equal(result.browserExecuted, false);
  assert.equal(urls.length, 2); assert.match(urls[0], /^\/en\//); assert.match(urls[1], /^\/es\//);
});
test('rejects redirects without visiting redirect target', async t => {
  let targetVisits = 0;
  const {origin} = await server(t, (req, res) => {
    if (req.url === '/elsewhere') targetVisits++;
    res.writeHead(302, {location: '/elsewhere'}); res.end();
  });
  const result = await probeHfrRoutes({origin, animationId});
  assert.equal(result.passed, false); assert.equal(targetVisits, 0);
  assert(result.rows.every(row => row.category === 'candidate-route'));
});
test('rejects HTTP 200 for the wrong page', async t => {
  const {origin} = await server(t, (_req, res) => {res.setHeader('content-type', 'text/html'); res.end('<main>Not found</main>');});
  assert.equal((await probeHfrRoutes({origin, animationId})).passed, false);
});
test('classifies exited server independently of product failures', async () => {
  const value = http.createServer(); await new Promise(resolve => value.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${value.address().port}`;
  await new Promise(resolve => value.close(resolve));
  const result = await probeHfrRoutes({origin, animationId});
  assert.equal(result.passed, false); assert(result.rows.every(row => row.category === 'server-unavailable'));
});
test('cannot probe non-loopback origins', async () => {
  await assert.rejects(probeHfrRoutes({origin: 'https://example.com', animationId}), /loopback/);
});
