import {createHash, randomUUID} from 'node:crypto';
import {mkdir, readFile, rename, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const hash = value => createHash('sha256').update(value).digest('hex');
export async function bindings(root, files) {
  return Promise.all([...new Set(files)].sort().map(async file => {
    const absolute = path.resolve(root, file);
    if (!absolute.startsWith(`${path.resolve(root)}${path.sep}`)) throw new Error(`Outside root: ${file}`);
    const data = await readFile(absolute);
    return {path: file, bytes: data.length, sha256: hash(data)};
  }));
}
export function stageKey(stage, inputs, parents, tools) {
  return hash(JSON.stringify({stage, inputs, parents, tools}));
}
async function atomicJson(file, value) {
  await mkdir(path.dirname(file), {recursive: true});
  const temporary = `${file}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  await rename(temporary, file);
}
export async function runPipeline({root, stages, tools, directory, plan = false, until}) {
  const runId = `${new Date().toISOString().replaceAll(':', '-')}-${randomUUID()}`;
  const runDir = path.join(directory, 'runs', runId);
  const receipt = {schemaVersion: 1, runId, tools, status: 'running', stages: [], acceptanceEffect: 'none'};
  const keys = new Map();
  if (!plan) await atomicJson(path.join(runDir, 'receipt.json'), receipt);
  try {
  for (const stage of stages) {
    const parents = stage.requires.map(id => {
      if (!keys.has(id)) throw new Error(`Dependency not completed: ${id}`);
      return {id, key: keys.get(id)};
    });
    const inputs = await bindings(root, stage.inputs);
    const key = stageKey(stage, inputs, parents, tools);
    const cachePath = path.join(directory, 'cache', `${key}.json`);
    let cache;
    try { cache = JSON.parse(await readFile(cachePath, 'utf8')); } catch (error) {
      if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error;
    }
    let outputs;
    try { outputs = await bindings(root, stage.outputs); } catch { outputs = null; }
    const hit = stage.cacheable !== false && cache?.key === key
      && cache?.status === 'passed' && JSON.stringify(cache.outputs) === JSON.stringify(outputs);
    const row = {id: stage.id, pages: stage.pages, key, inputs, parents,
      command: stage.command, cwd: stage.cwd ?? '.', environment: stage.env,
      disposition: stage.disposition, status: hit ? 'cache-hit' : 'pending',
      reusedFromRun: hit ? cache.runId : undefined, outputs};
    receipt.stages.push(row);
    if (!plan) {
      await atomicJson(path.join(runDir, 'receipt.json'), receipt);
      if (!hit) {
        const result = spawnSync(stage.command[0], stage.command.slice(1), {
          cwd: path.resolve(root, stage.cwd ?? '.'), encoding: 'utf8',
          env: {...process.env, ...Object.fromEntries(Object.entries(stage.env ?? {})
            .map(([key, value]) => [key, value.replaceAll('{runDir}', runDir)]))}, maxBuffer: 16 * 1024 * 1024,
        });
        await writeFile(path.join(runDir, `${stage.id}.log`), `${result.stdout ?? ''}${result.stderr ?? ''}`);
        row.exitCode = result.status;
        row.status = result.status === 0 ? 'passed' : 'failed';
        if (result.error) row.error = result.error.message;
        if (row.status === 'passed') {
          // A file edited during execution cannot produce a valid cache entry.
          if (JSON.stringify(inputs) !== JSON.stringify(await bindings(root, stage.inputs))) {
            row.status = 'failed'; row.error = 'inputs changed during stage';
          } else {
            row.outputs = await bindings(root, stage.outputs);
            if (stage.cacheable !== false) await atomicJson(cachePath, {key, status: 'passed', outputs: row.outputs, runId});
          }
        }
        if (row.status === 'failed') {
          receipt.status = 'failed';
          await atomicJson(path.join(runDir, 'receipt.json'), receipt);
          return {receipt, runDir};
        }
      }
      await atomicJson(path.join(runDir, 'receipt.json'), receipt);
    }
    keys.set(stage.id, key);
    if (stage.id === until) break;
  }
  if (!plan) {
    for (const row of receipt.stages) {
      if (JSON.stringify(row.inputs) !== JSON.stringify(await bindings(root, row.inputs.map(x => x.path)))
          || JSON.stringify(row.outputs) !== JSON.stringify(await bindings(root, row.outputs.map(x => x.path)))) {
        throw new Error(`Input/output drift before run completion: ${row.id}`);
      }
    }
  }
  receipt.status = plan ? 'plan' : receipt.stages.at(-1)?.id === 'my-lesson' ? 'product-host-verified' : 'partial';
  } catch (error) {
    receipt.status = 'failed';
    receipt.error = error.message;
  }
  if (!plan) await atomicJson(path.join(runDir, 'receipt.json'), receipt);
  return {receipt, runDir: plan ? null : runDir};
}
