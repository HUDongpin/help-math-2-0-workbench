import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {runPipeline} from './lib/flash-product-pipeline.mjs';

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'flash-product-pipeline-test-'));
  t.after(() => rm(root, {recursive: true, force: true}));
  await Promise.all(['a', 'b', 'c', 'shared', 'gate'].map(file => writeFile(path.join(root, file), 'initial')));
  const stages = ['a', 'b', 'c'].map(id => ({id, pages: [id], requires: [],
    inputs: id === 'c' ? ['c'] : [id, 'shared'], outputs: [`${id}.out`],
    command: [process.execPath, '-e', `const fs=require('fs');fs.writeFileSync('${id}.out',${JSON.stringify(id)}+fs.readFileSync('${id}','utf8'));`]}));
  stages.push({id: 'my-lesson', pages: ['a', 'b', 'c'], requires: ['a', 'b', 'c'],
    inputs: ['gate'], outputs: [], cacheable: false,
    command: [process.execPath, '-e', "if(require('fs').readFileSync('gate','utf8')==='fail')process.exit(1);"]});
  const run = options => runPipeline({root, stages, tools: {node: process.version}, directory: path.join(root, 'runs'), ...options});
  return {root, stages, run};
}

test('unchanged prerequisites resume from verified cache while host validation always runs', async t => {
  const {run} = await fixture(t);
  assert.equal((await run()).receipt.status, 'product-host-verified');
  const second = await run();
  assert.deepEqual(second.receipt.stages.map(x => x.status), ['cache-hit', 'cache-hit', 'cache-hit', 'passed']);
});

test('shared change invalidates only declared consumers; corrupted output is rebuilt', async t => {
  const {root, run} = await fixture(t);
  await run();
  await writeFile(path.join(root, 'shared'), 'changed');
  assert.deepEqual((await run()).receipt.stages.map(x => x.status), ['passed', 'passed', 'cache-hit', 'passed']);
  await writeFile(path.join(root, 'c.out'), 'tampered');
  assert.equal((await run()).receipt.stages[2].status, 'passed');
  assert.equal(await readFile(path.join(root, 'c.out'), 'utf8'), 'cinitial');
});

test('failed host validation retains evidence and never creates product success; next run resumes', async t => {
  const {root, run} = await fixture(t);
  await writeFile(path.join(root, 'gate'), 'fail');
  const failed = await run();
  assert.equal(failed.receipt.status, 'failed');
  assert.equal(JSON.parse(await readFile(path.join(failed.runDir, 'receipt.json'))).status, 'failed');
  await writeFile(path.join(root, 'gate'), 'fixed');
  assert.deepEqual((await run()).receipt.stages.map(x => x.status), ['cache-hit', 'cache-hit', 'cache-hit', 'passed']);
});

test('plan and bounded execution do not claim host verification; tool changes invalidate cache', async t => {
  const {run} = await fixture(t);
  const plan = await run({plan: true});
  assert.equal(plan.runDir, null);
  assert.equal(plan.receipt.status, 'plan');
  assert.equal((await run({until: 'b'})).receipt.status, 'partial');
  assert.equal((await run({tools: {node: 'changed'}})).receipt.stages[0].status, 'passed');
});

test('missing inputs leave a failed receipt instead of disappearing before execution', async t => {
  const {root, run} = await fixture(t);
  await rm(path.join(root, 'shared'));
  const result = await run();
  assert.equal(result.receipt.status, 'failed');
  assert.match(result.receipt.error, /ENOENT/);
  assert.equal(JSON.parse(await readFile(path.join(result.runDir, 'receipt.json'))).status, 'failed');
});
