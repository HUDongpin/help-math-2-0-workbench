#!/usr/bin/env node
/** Source flows and a scoped layout matrix in owned Playwright CLI sessions. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn, execFileSync} from 'node:child_process';
import {readJsonPin} from '../../lib/g678-admission-proof.mjs';
import {activeIndexPin} from '../lib/g678-stable-browser-candidate-v1.mjs';
const [directory, planPath] = process.argv.slice(2);
assert(directory?.startsWith('output/playwright/') && !directory.split('/').includes('..'), 'browser output boundary');
const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
const wrapper = '/Users/peter/.codex/skills/playwright/scripts/playwright_cli.sh';
const session = `g678-layout-${directory.split('/').at(-1)}`;
fs.mkdirSync(directory, {recursive: true});
function verifyServer() {
  assert(Number.isSafeInteger(plan.server.pid) && plan.server.origin === 'http://127.0.0.1:3331', 'explicit server identity');
  const cwd = execFileSync('lsof', ['-a', '-p', String(plan.server.pid), '-d', 'cwd', '-Fn'], {encoding: 'utf8'}).split('\n').find(s => s.startsWith('n'))?.slice(1);
  assert.equal(cwd, `${process.cwd()}/apps/web`, 'exact candidate server worktree');
  const listener = execFileSync('lsof', ['-nP', '-a', '-p', String(plan.server.pid), '-iTCP:3331', '-sTCP:LISTEN', '-Fn'], {encoding: 'utf8'});
  assert(listener.includes('n127.0.0.1:3331'), 'owned loopback listener');
}
async function command(file, args, label) {
  verifyServer();
  const child = spawn(file, args, {shell: false, stdio: ['ignore', 'pipe', 'pipe']});
  let text = '';
  child.stdout.on('data', b => text += b); child.stderr.on('data', b => text += b);
  const status = await new Promise((resolve, reject) => {child.once('error', reject); child.once('exit', resolve);});
  fs.writeFileSync(`${directory}/${label}.txt`, text, {flag: 'wx'});
  assert.equal(status, 0, `${label}: command failed; retained log`);
  assert(!text.includes('### Error'), `${label}: browser assertion failed; retained log`);
  return text;
}
const cli = (args, label) => command(wrapper, [`-s=${session}`, ...args], label);
if (plan.sourceFlowReuse) {
  const assessment = readJsonPin(process.cwd(), plan.sourceFlowReuse.assessment);
  const flow = readJsonPin(process.cwd(), plan.sourceFlowReuse.raw);
  const current = readJsonPin(process.cwd(), activeIndexPin(process.cwd()));
  assert.equal(assessment.status, 'reusable-for-source-playback-only');
  assert.deepEqual(assessment.currentHost, current.host, 'reuse bound to current host');
  assert.equal(flow.results.length, 4);
  assert(flow.results.every(r => r.status === 'host-flow-passed' && r.pageErrors.length === 0));
  assert.equal(flow.results.reduce((count, r) => count + r.cases.length, 0), 58);
  fs.writeFileSync(`${directory}/source-flow-reuse.json`, JSON.stringify(plan.sourceFlowReuse, null, 2) + '\n', {flag: 'wx'});
} else {
  await command(process.execPath, ['scripts/browser/run-g678-source-host-bridge-v1.mjs', `${directory}/source-flows`, planPath], 'source-flows');
}
const results = [];
let opened = false;
try {
  await cli(['open', 'about:blank'], 'layout-open'); opened = true;
  for (const locale of ['en', 'es']) for (const page of ['017', '018']) for (const viewport of plan.layoutViewports) {
    const label = `layout-p${page}-${locale}-${viewport.width}`;
    await cli(['run-code', `async page=>{page.__g678LayoutCase=${JSON.stringify({page, locale, viewport, output: directory})};}`], `${label}-plan`);
    await cli(['snapshot'], `${label}-snapshot`);
    const text = await cli(['run-code', '--filename', 'scripts/browser/g678-host-layout-v1.js'], label);
    const match = text.match(/### Result\n([\s\S]*?)\n### /); assert(match, `${label}: raw result missing`);
    const result = JSON.parse(match[1]); assert.equal(result.status, 'scoped-layout-passed');
    fs.writeFileSync(`${directory}/${label}.json`, JSON.stringify(result, null, 2) + '\n', {flag: 'wx'});
    results.push(result);
    console.log(JSON.stringify({case: label, status: result.status, fonts: result.observations.map(r => r.rootFontPx)}));
  }
} finally {
  if (opened) await cli(['close'], 'layout-close');
}
assert.equal(results.length, 16, 'both consumers/locales and four viewports');
fs.writeFileSync(`${directory}/layout-verification-v1.json`, JSON.stringify({
  kind: 'g678-scoped-host-layout-verification-v1', checkedAt: new Date().toISOString(),
  method: 'Chromium DPR1, reduced motion, root font 100% to 200%, same paused source state', results,
  gaps: ['Other pages and teaching states', 'Firefox/WebKit', 'DPR2', 'Browser zoom/pinch', 'Full typography acceptance'],
  acceptanceEffects: {wholeProjectTypography: false, fidelity: false, listening: false, human: false, owner: false, publication: false},
}, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify({status: 'engineering-blocker-browser-checks-passed', layoutCells: 32, sourceFlowRoutes: 4}));
