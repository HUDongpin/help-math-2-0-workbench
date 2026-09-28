import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const json = async file => JSON.parse(await readFile(path.join(root, file), 'utf8'));
const hash = async file => createHash('sha256').update(await readFile(path.join(root, file))).digest('hex');
const recipe = await json('skills/flash-to-js/references/product-pipeline.g4-l3.json');
if (process.argv[2] === 'course-order') {
  const report = await json('reports/g4-l3-lesson-product-navigation-contract.json');
  const source = report.sourceBindings.sourceXml;
  assert.equal(await hash(source.path), source.sha256, 'source XML drift');
  const registry = await json('packages/demos/prototype-registry.json');
  const pages = report.pages.map(page => page.animationId);
  for (const id of ['course-g04-l03-ts-007', 'course-g04-l03-ts-008']) {
    assert.equal(pages.filter(value => value === id).length, 1, 'ambiguous/missing placement');
    const entries = registry.entries.filter(entry => entry.key === id);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].module, `./modules/${id}`);
  }
  assert.equal(pages.indexOf('course-g04-l03-ts-008'), pages.indexOf('course-g04-l03-ts-007') + 1);
  const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', 'tests/g4-l3-lesson-navigation.test.ts'], {cwd: path.join(root, 'apps/web'), stdio: 'inherit'});
  process.exitCode = result.status ?? 1;
} else {
  const stage = recipe.stages.find(stage => stage.id.endsWith('-source') && stage.pages.includes(process.argv[2]));
  assert.ok(stage, 'unadmitted page');
  for (const binding of stage.bindings) assert.equal(await hash(binding.path), binding.sha256, `source/extraction drift: ${binding.path}`);
  const audit = await json(`migrations/${process.argv[2]}/audit/machine/report.json`);
  assert.equal(audit.source.expectedSha256, stage.bindings[0].sha256);
  console.log(JSON.stringify({retainedExtractionTools: Object.fromEntries(
    Object.entries(audit.tools).map(([name, tool]) => [name, tool.version]))}));
  console.log('Preserved source and frozen extraction verified; no fresh extraction claimed.');
}
