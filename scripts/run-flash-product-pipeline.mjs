import {mkdir, readFile, rmdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {runPipeline} from './lib/flash-product-pipeline.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const recipePath = 'skills/flash-to-js/references/product-pipeline.g4-l3.json';
const recipe = JSON.parse(await readFile(path.join(root, recipePath), 'utf8'));
const args = process.argv.slice(2);
const untilIndex = args.indexOf('--until');
const until = untilIndex >= 0 ? args[untilIndex + 1] : undefined;
if (args.some((value, index) => !['--plan', '--resume', '--until'].includes(value) && !(untilIndex >= 0 && index === untilIndex + 1))
  || (untilIndex >= 0 && !recipe.stages.some(stage => stage.id === until))) throw new Error('Use --plan, --resume, or --until <stage-id>');
const version = command => {
  const result = spawnSync(command, ['--version'], {encoding: 'utf8'});
  if (result.status !== 0) throw new Error(`${command} unavailable`);
  return result.stdout.trim();
};
// Each run rechecks inputs and outputs. --resume never trusts an old timestamp.
const stages = recipe.stages.map(stage => ({...stage, inputs: [...stage.inputs, recipePath,
  'scripts/check-flash-product-bindings.mjs']}));
const directory = path.join(root, 'work/flash-product-pipeline');
await mkdir(directory, {recursive: true});
const lock = path.join(directory, 'running.lock');
await mkdir(lock); // Never run two writers against the shared generated registry.
try {
const result = await runPipeline({root, stages, tools: {node: process.version, python: version('python3'),
  playwright: require('@playwright/test/package.json').version, tsx: require('tsx/package.json').version,
  platform: process.platform, architecture: process.arch}, directory: path.join(root, 'work/flash-product-pipeline'),
  plan: args.includes('--plan'), until});
console.log(JSON.stringify({status: result.receipt.status, receipt: result.runDir && path.join(result.runDir, 'receipt.json'),
  stages: result.receipt.stages.map(({id, status, pages}) => ({id, status, pages}))}, null, 2));
if (result.receipt.status === 'failed') process.exitCode = 1;
} finally {
  await rmdir(lock);
}
