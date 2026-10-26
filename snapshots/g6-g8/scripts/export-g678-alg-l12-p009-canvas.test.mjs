import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {Script} from 'node:vm';
import {inspectP009Canvas, inspectP009Xml} from './export-g678-alg-l12-p009-canvas.mjs';

const root = new URL('../', import.meta.url);
const script = new URL('./export-g678-alg-l12-p009-canvas.mjs', import.meta.url);
const output = new URL('migrations/shared-alg001-l12-p009/audit/ffdec-26.2.1-canvas-v1/', root);
const sourceRoot = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const run = (args, source = sourceRoot) => spawnSync(process.execPath,
  [fileURLToPath(script), ...args], {
    cwd: fileURLToPath(root), env: {...process.env, HELP_MATH_G678_SOURCE_ROOT: source},
    encoding: 'utf8', timeout: 30000,
  });
const xmlBytes = readFileSync(new URL('migrations/shared-alg001-l12-p009/audit/movie.xml', root));
const projection = inspectP009Xml(xmlBytes);
const html = relative => readFileSync(new URL(relative, output), 'utf8').replace(/\r\n?/g, '\n');

test('P009 XML proves the two domains and complete source reference closure', () => {
  assert.deepEqual(Object.keys(projection.timelines), ['root', 'sprite-62']);
  assert.equal(projection.timelines.root.frameCount, 10);
  assert.equal(projection.timelines['sprite-62'].frameCount, 394);
  assert.equal(projection.reachableDefinitions.length, 63);
  assert.deepEqual(projection.unreachableCharacterIds, []);
  assert.deepEqual(projection.timelines.root.references, [62, 63]);
  assert.equal(projection.buttonStates.length, 8);
  assert(projection.buttonStates.every(button => button.hitOnly && button.references.join(',') === '5'));
  assert.deepEqual(projection.reachableDefinitions.filter(definition => definition.type === 'DefineFont2Tag').map(definition => definition.characterId), [3]);
  assert.equal(projection.reachableDefinitions.filter(definition => definition.type === 'DefineTextTag').length, 16);
});

test('P009 parser rejects mismatched frames, masks and undefined references', () => {
  const xml = xmlBytes.toString('utf8');
  assert.throws(() => inspectP009Xml(Buffer.from(xml.replace('frameCount="394"', 'frameCount="395"'))), /ShowFrame count/);
  assert.throws(() => inspectP009Xml(Buffer.from(xml.replace('clipDepth="12"', 'clipDepth="13"'))), /Expected values to be strictly deep-equal/);
  assert.throws(() => inspectP009Xml(Buffer.from(xml.replace('characterId="62" depth="1"', 'characterId="999" depth="1"'))), /missing referenced character 999/);
});

test('P009 check binds real source, exact raw output, recovery and complete toolchain', () => {
  const checked = run(['--check']);
  assert.equal(checked.status, 0, checked.stderr);
  const status = JSON.parse(checked.stdout);
  assert.equal(status.files, 8);
  assert.equal(status.closure.maskFramesChecked, 394);
  assert.equal(status.closure.generatedMaskBlockCount, 1144);
  const receipt = JSON.parse(readFileSync(new URL('extraction-receipt.json', output)));
  assert.equal(receipt.source.sha256, 'd8bb6bfb4632fc528a0e14092277d95b2d96998aaeab2f0c1252a0233f35f533');
  assert.deepEqual(receipt.selectedDomains, {root: 10, 'sprite-62': 394});
  assert.deepEqual(receipt.files.map(file => file.path), [
    'export.log', 'frames/canvas.js', 'frames/frames.html', 'help-export.txt',
    'predecessor-exporter.mjs', 'retained-check-failure.json',
    'sprites/DefineSprite_62/canvas.js', 'sprites/DefineSprite_62/frames.html',
  ]);
  assert.equal(receipt.extractionRecovery.originalGeneratorSha256, 'd41b0afd696b7290cb12aca477430aa395b0494aa4abde0e72bbcd5b48a5d59f');
  assert.equal(receipt.extractionRecovery.rawOutputsRewritten, false);
  const failure = JSON.parse(readFileSync(new URL('retained-check-failure.json', output)));
  assert.equal(failure.exporterExitCode, 1);
  assert.equal(failure.ffdecExitCode, 0);
  assert.equal(failure.rawOutputsPreserved, true);
  assert(receipt.under100MiB);
  assert.equal(receipt.fidelityAccepted, false);
  assert.equal(receipt.audioAccepted, false);
  assert.equal(receipt.acceptanceEffect, 'none');
  assert.equal(receipt.tool.version, '26.2.1');
  for (const item of [receipt.tool.java, receipt.tool.ffdecJar, ...receipt.tool.classPath]) {
    assert.equal(realpathSync(item.path), item.path);
    assert(lstatSync(item.path).isFile());
    const bytes = readFileSync(item.path);
    assert.equal(bytes.length, item.bytes);
    assert.equal(sha256(bytes), item.sha256);
  }
  assert.deepEqual(receipt.command.slice(-4), ['-export', 'frame,sprite',
    fileURLToPath(output).replace(/\/$/, ''), `${sourceRoot}/G6-G8-shared/ALG001/L12/VB/L12VB04.swf`]);
  assert(receipt.command.includes('62'));
});

test('P009 cannot overwrite retained extraction or issue a second recovery receipt', () => {
  const receipt = readFileSync(new URL('extraction-receipt.json', output));
  const raw = readFileSync(new URL('frames/frames.html', output));
  assert.notEqual(run(['--check'], '/not-the-source-root').status, 0);
  const reexport = run(['--export']);
  assert.notEqual(reexport.status, 0);
  assert.match(reexport.stderr, /EEXIST/);
  const reresume = run(['--resume-retained']);
  assert.notEqual(reresume.status, 0);
  assert.match(reresume.stderr, /EEXIST/);
  assert(readFileSync(new URL('extraction-receipt.json', output)).equals(receipt));
  assert(readFileSync(new URL('frames/frames.html', output)).equals(raw));
});

test('P009 original Canvas preserves all character declarations and both wrappers', () => {
  const rootHtml = html('frames/frames.html');
  const spriteHtml = html('sprites/DefineSprite_62/frames.html');
  const closure = inspectP009Canvas(rootHtml, projection);
  assert.equal(closure.sourceReachableCharacterCount, 63);
  assert.equal(closure.declaredSourceCharacterFunctions, 63);
  assert.deepEqual(closure.missingPlacedCharacterFunctions, []);
  assert.equal(closure.bitmapCount, 0);
  assert.equal(closure.morphCount, 0);
  assert(rootHtml.includes('function main(ctx,ctrans,frame,ratio,time){\n\tctx.save();\n\tctx.transform(1,0,0,1,0.0,0.0);'));
  assert(rootHtml.includes('place("sprite62",canvas,ctx,[0.05,0.0,0.0,0.05,412.4,283.3],ctrans,1,(0+time)%394,5,time);'));
  assert(rootHtml.includes('place("shape63",canvas,ctx,[0.05,0.0,0.0,0.05,0.0,0.0],ctrans,1,0,0,time);'));
  assert(spriteHtml.includes('function sprite62(ctx,ctrans,frame,ratio,time){\n\tctx.save();\n\tctx.transform(1,0,0,1,376.4,205.35);'));
  assert.equal(sha256(readFileSync(new URL('frames/canvas.js', output))),
    sha256(readFileSync(new URL('sprites/DefineSprite_62/canvas.js', output))));
  new Script(readFileSync(new URL('frames/canvas.js', output), 'utf8'));
});

test('P009 checks every frame mask and rejects incomplete compositor or character', () => {
  const rootHtml = html('frames/frames.html');
  const closure = inspectP009Canvas(rootHtml, projection);
  assert.equal(closure.generatedMaskMechanism, 'clipCanvas plus destination-in raster compositing');
  assert.equal(closure.generatedMaskBlockCount, 1144);
  assert.equal(closure.maskFramesChecked, 394);
  assert.throws(() => inspectP009Canvas(rootHtml.replace('ctx.drawImage(o.clipCanvas,0,0);', '/* omitted mask application */'), projection), /incomplete mask block at frame 12/);
  assert.throws(() => inspectP009Canvas(rootHtml.replace('place("text4"', 'place("text999"'), projection), /missing nested dependency/);
  assert.throws(() => inspectP009Canvas(rootHtml.replace('function font3(', 'function font999('), projection), /source dependency missing: font3/);
  assert.throws(() => inspectP009Canvas(rootHtml.replace('\t\tcase 393:', '\t\tcase 392:'), projection), /source frame case order changed/);
});
