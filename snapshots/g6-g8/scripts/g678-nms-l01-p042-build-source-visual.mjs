#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {mkdir, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import sharp from 'sharp';
import {ROOT, RUN as EXTRACTION, ID, SOURCE, FALSE_GATES, file, desc, hash, json, extract}
  from './g678-nms-l01-p042-extract-source.mjs';
export const RUN = 'work/g678-shared-page-factory/g678-nms-l01-p042-source-visual-v1';
export const GENERATED = 'packages/demos/src/generated/g678-nms-l01-p042-source-visual-v1.ts';
const PARSER = 'scripts/g678-nms-l01-p042-source-projection.py';
const EXTRACTION_PIN = {path: `${EXTRACTION}/extraction.json`, bytes: 50718,
  sha256: '93acf3bbeb18ae8aab7482ba8ba79b234195ca23ad59a79390ce63e106ac27f9'};
const attribute = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
export function normalizeSourceSvg(raw, rootMainMatrix, emptyGlyphEvidence) {
  assert.ok(!/<(?:script|foreignObject|image|style|animate|set)\b|\bon\w+=|javascript:|<!DOCTYPE|<!ENTITY/i.test(raw));
  assert.deepEqual(emptyGlyphEvidence, {sourceCharacterId:17,fontCharacterId:5,glyphIndex:0,unicode:32,advance:120,outlineCommands:['ShapeSetup']});
  assert.equal([...raw.matchAll(/<use\b[^>]*ffdec:characterId="17"[^>]*xlink:href="#text11"[^>]*\/>/g)].length,1);
  assert.ok(!raw.includes('id="text11"'));
  const sourceUse = raw.match(/<use\b[^>]*\bid="animation"[^>]*\/>/g);
  assert.equal(sourceUse?.length, 1); assert.equal(attribute(sourceUse[0], 'ffdec:characterId'), '23');
  assert.equal(attribute(sourceUse[0], 'transform'), 'matrix(1.0, 0.0, 0.0, 1.0, 412.05, 283.4)');
  const restored = sourceUse[0].replace(/\btransform="[^"]*"/, `transform="matrix(${rootMainMatrix.join(', ')})"`);
  // FFDec emitted a reference but omitted the definition of this exact empty
  // space glyph. Preserve its placement and supply only its source-proven no-ink group.
  let svg = raw.replace(sourceUse[0], restored).replace('<defs>','<defs><g id="text11"/>').replace(/<\?xml[^>]*>\s*/, '');
  const ids = [...svg.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]); assert.equal(new Set(ids).size, ids.length);
  const map = new Map(ids.map((id, index) => [id, `nms-l01-p042-${index}`]));
  svg = svg.replace(/\bid="([^"]+)"/g, (_, id) => `id="${map.get(id)}"`)
    .replace(/(xlink:href|href)="([^"]+)"/g, (_, attr, ref) => {
      assert.ok(ref.startsWith('#') && map.has(ref.slice(1))); return `${attr}="#${map.get(ref.slice(1))}"`;
    }).replace(/url\(#([^)]*)\)/g, (_, id) => {assert.ok(map.has(id)); return `url(#${map.get(id)})`;});
  svg = svg.replace(/<svg\b([^>]*)>/, '<svg$1 viewBox="0 0 800 600" aria-hidden="true" focusable="false" style="display:block;width:100%;height:auto">');
  const pathList = text => [...text.matchAll(/<path\b[^>]*>/g)].map(m => m[0]);
  const originalIds = new Map([...map].map(([oldId,newId]) => [newId,oldId]));
  const referenceRestored = svg.replace(/url\(#([^)]*)\)/g, (_, id) => `url(#${originalIds.get(id)})`);
  assert.equal(hash(json(pathList(referenceRestored))), hash(json(pathList(raw))),
    'Source glyph/path bytes must remain unchanged except explicitly mapped reference IDs');
  return {svg, idMap: [...map].map(([sourceId, normalizedId]) => ({sourceId, normalizedId})),
    transformation: {sourceExportMatrix: [1,0,0,1,412.05,283.4], sourceXmlMatrix: rootMainMatrix,
      reason: 'Restore exact source root scale rounded by FFDec SVG export; no glyph/path or source file edits.'}};
}
export async function build({check = false} = {}) {
  await extract({check: true}); const receipt = await file(EXTRACTION_PIN.path, EXTRACTION_PIN);
  const raw = JSON.parse(receipt.buffer), xml = await file(`${EXTRACTION}/source.xml`);
  const python = await realpath((await promisify(execFile)('/usr/bin/which',['python3'])).stdout.trim());
  const result = await promisify(execFile)(python, [PARSER, xml.path], {cwd: ROOT, maxBuffer: 2*1024*1024});
  assert.equal(result.stderr, ''); const projected = JSON.parse(result.stdout);
  const {sourcePayloadBase64, ...audio} = projected.audio;
  assert.equal(projected.main.visualEvents.length, 20); assert.ok(projected.main.visualEvents.every(e => e.frame === 1));
  const mainFrames = raw.files.filter(f => /^svg\/sprites\/DefineSprite_23\/\d+\.svg$/.test(f.path));
  assert.equal(mainFrames.length, 125); assert.equal(new Set(mainFrames.map(f => f.sha256)).size, 1);
  assert.equal(mainFrames[0].sha256, '3796fc5cdda05c77db26cd74fd7daaecd8346e12d26a7191de5d4d126618563d');
  const rootFrames = raw.files.filter(f => /^svg\/frames\/(6|7|8|9|10)\.svg$/.test(f.path));
  assert.equal(rootFrames.length, 5); assert.equal(new Set(rootFrames.map(f => f.sha256)).size, 1);
  assert.equal(rootFrames[0].sha256, 'cbea371d3f37cdf95431956e3d01a1059ff377f065a963ae3eda3995ffb8f72c');
  const sourceSvg = await file(`${EXTRACTION}/svg/frames/6.svg`);
  const mainPlacement = projected.root.placements.find(p => p.characterId === 23), t = mainPlacement.transform;
  const matrix = [Number(t.scaleX ?? 1), Number(t.skewY ?? 0), Number(t.skewX ?? 0), Number(t.scaleY ?? 1), Number(t.transX ?? 0)/20, Number(t.transY ?? 0)/20];
  assert.deepEqual(matrix, [1.000045776367188, 0, 0, 1, 412.05, 283.4]);
  const normalized = normalizeSourceSvg(sourceSvg.buffer.toString(), matrix, projected.emptyTextGlyph);
  const texts = [];
  for (const [characterId, expected] of [[2,'Positive & Negative Numbers: Test Skills'],[16,'Restate the question.'],
    [18,'Organize the information.'],[20,'Solve the problem.'],[22,'Check your answer.']]) {
    const input = await file(`${EXTRACTION}/svg/texts/${characterId}.txt`);
    const literal = input.buffer.toString().replace(/\s*--- RECORDSEPARATOR ---\s*/g,' ').replace(/\s+/g,' ').trim();
    assert.equal(literal, expected); texts.push({characterId, literal, source: desc(input)});
  }
  const value = {schemaVersion: 1, animationId: ID, source: SOURCE, rootFrameCount: 10, sourceEntryRootFrame: 6,
    mainFrameDomain: 'sprite-23', mainFrameCount: 125, fps: 12, terminalStopFrame: 125,
    visualStateCount: 1, visualConstantAcrossMainFrames: true, titleSiblingCharacterId: 3,
    svg: normalized.svg, svgSha256: hash(normalized.svg), sourceRootSvg: desc(sourceSvg),
    literalTitle: texts[0].literal, literalSteps: texts.slice(1).map(t => t.literal), rootMainMatrix: matrix,
    gates: FALSE_GATES};
  const generated = '// Generated by g678-nms-l01-p042-build-source-visual.mjs; do not edit.\nexport const G678_NMS_L01_P042_SOURCE_VISUAL = '+JSON.stringify(value)+' as const;\n';
  const payload = Buffer.from(sourcePayloadBase64,'base64'); assert.equal(payload.length, audio.payloadBytes); assert.equal(hash(payload), audio.payloadSha256);
  const files = new Map([[`${RUN}/source-projection.json`, json({...projected, audio})],
    [`${RUN}/source-root.svg`, sourceSvg.buffer], [`${RUN}/normalized-root.svg`, normalized.svg],
    [`${RUN}/source-stream.mp3`, payload], [GENERATED, generated]]);
  // PNGs are inspection evidence only, never learner assets.
  files.set(`${RUN}/source-root.png`, await sharp(sourceSvg.buffer).png().toBuffer());
  files.set(`${RUN}/normalized-root.png`, await sharp(Buffer.from(normalized.svg)).png().toBuffer());
  const dependencies = ['scripts/g678-nms-l01-p042-build-source-visual.mjs', 'scripts/g678-nms-l01-p042-extract-source.mjs',
    PARSER, 'scripts/build-g4-l3-machine-source-audits.mjs', 'scripts/review-g678-pure-linear-exact-scripts.mjs'];
  const codeDependencyClosure = await Promise.all(dependencies.map(async p => desc(await file(p))));
  const outputs = [...files].map(([p, b]) => ({path:p,bytes:Buffer.byteLength(b),sha256:hash(b)}));
  const run = {schemaVersion: 1, artifactType:'g678-nms-l01-p042-source-visual-build-v1', animationId:ID,
    extraction:desc(receipt), sourceXml:desc(xml), sourceFrameBindings:[...mainFrames,...rootFrames],
    codeDependencyClosure, projectionParser:{command:[python,PARSER,xml.path],exitCode:0},
    toolchain:{nodeVersion:process.version,node:desc(await file(await realpath(process.execPath))),
      python:desc(await file(python)),pythonVersion:(await promisify(execFile)(python,['--version'])).stdout.trim(),
      sharpEntry:desc(await file(fileURLToPath(import.meta.resolve('sharp')))),sharpVersions:sharp.versions},
    normalizer:normalized.transformation, emptySourceGlyphDefinition:projected.emptyTextGlyph,
    sourceIdMapping:normalized.idMap, texts, audio,
    actualVisualStates:1, sourceMainFrames:125, sourceRootFrames:10, outputs,
    checks:{all125MainSvgFilesByteIdentical:true,root6Through10SvgFilesByteIdentical:true,allVisualTagsAtMainFrame1:true,
      noButtonOrRandomAction:true,sourceTitleRetained:true,sourceGlyphPathsUnchanged:true},
    lane:{kind:'advanced-manual',reason:'Exact static full-root source composition; one-target Canvas host omits separate source title; new source-derived SVG renderer uses maintained host clock.'},
    gateDisposition:'Unregistered single-page candidate only; no existing family gate altered or claimed.',gates:FALSE_GATES};
  files.set(`${RUN}/run.json`,json(run));
  if(check) for(const[p,b]of files) assert.ok((await readFile(path.join(ROOT,p))).equals(Buffer.from(b)),`Output drift:${p}`);
  else {await mkdir(path.join(ROOT,RUN)); for(const[p,b]of files) await writeFile(path.join(ROOT,p),b,{flag:'wx',mode:0o444});}
  return {check,generated:outputs.find(f=>f.path===GENERATED),run:`${RUN}/run.json`,visualStates:1,sourceFrames:125};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const args=process.argv.slice(2);assert.ok(args.length<=1&&(!args.length||args[0]==='--check'));
  console.log(json(await build({check:args[0]==='--check'})));
}
