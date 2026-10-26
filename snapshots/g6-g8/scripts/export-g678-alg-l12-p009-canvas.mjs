import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, readdir, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Script} from 'node:vm';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE = 'G6-G8-shared/ALG001/L12/VB/L12VB04.swf';
const SOURCE_SHA = 'd8bb6bfb4632fc528a0e14092277d95b2d96998aaeab2f0c1252a0233f35f533';
const WORK = 'migrations/shared-alg001-l12-p009';
const OUT = `${WORK}/audit/ffdec-26.2.1-canvas-v1`;
const XML_SHA = 'cba1ba1f5ee73ed6f9c33f96d5288dd4aa56e9f51612eda0d49996a68b81c77f';
const TOOLCHAIN_SHA = '07484eaf52751128f91b429b7ce1b7bb46259365c545d17c360b5d0c74c3b41f';
const SOURCE_TOOLCHAIN_SHA = 'a5cd5da56844cf163484d39118b81270532e50f78f96c626fdb64008d0b3b9e4';
const JAVA = '/Users/peter/Library/Application Support/HELP Math Flash Workbench/temurin-jre-21.0.11+10/Contents/Home/bin/java';
const JAR = '/Users/peter/Applications/FFDec.app/Contents/Resources/ffdec.jar';
const PREFIX = ['-Djava.net.preferIPv4Stack=true', '-Djna.nosys=true',
  '-Djava.util.Arrays.useLegacyMergeSort=true', '-Xmx512m', '-Djava.awt.headless=true', '-jar', JAR];
const EXPECTED = [
  'export.log', 'frames/canvas.js', 'frames/frames.html', 'help-export.txt',
  'sprites/DefineSprite_62/canvas.js', 'sprites/DefineSprite_62/frames.html',
].sort((a, b) => a.localeCompare(b, 'en'));
const RETAINED_GENERATOR_SHA = 'd41b0afd696b7290cb12aca477430aa395b0494aa4abde0e72bbcd5b48a5d59f';
const RETAINED_RAW_FILES = [
  ['export.log', 264, '92c9c4ef2aada9ac592ce690a91f71ba6b16638a230bcde7cd73199af7d67b9c'],
  ['frames/canvas.js', 52872, '78256220d01fba044341283703c3923a1ff8ff29499c51f65ab4e6ac825ccb93'],
  ['frames/frames.html', 3660577, '0c33c9fc857c83172ea813f33d5f6e88af4e8d29cd1ac1d97007cb9d2b10dbcb'],
  ['help-export.txt', 10376, '65ca1419d097e5125bfe06fcf3f66a83546a3d278b8a64975b4e486a06af95b7'],
  ['sprites/DefineSprite_62/canvas.js', 52872, '78256220d01fba044341283703c3923a1ff8ff29499c51f65ab4e6ac825ccb93'],
  ['sprites/DefineSprite_62/frames.html', 3648639, 'c916a2aa88b345b4d1db3767f171aeba486252cca8c4c393e0ee89433e88dff6'],
].map(([file, bytes, sha256]) => ({path: file, bytes, sha256}));
const RETAINED_FAILURE = {
  schemaVersion: 1, kind: 'p009-retained-post-extraction-check-failure',
  ffdecExitCode: 0, exporterExitCode: 1, extractionGeneratorSha256: RETAINED_GENERATOR_SHA,
  failure: 'mask clipping was omitted',
  finding: 'Checker incorrectly required ctx.clip(); the original tool output uses clipCanvas and destination-in raster mask compositing.',
  rawOutputsPreserved: true, acceptanceEffect: 'none',
};
const RECOVERY_FILES = ['predecessor-exporter.mjs', 'retained-check-failure.json'];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => `${JSON.stringify(value, null, 2)}\n`;
const statKeys = ['dev', 'ino', 'size', 'mtimeNs', 'ctimeNs', 'nlink'];

/** Read ordinary physical files and fail on a concurrent replacement or edit. */
async function physical(file, expectedSha, expectedBytes) {
  assert.equal(await realpath(file), file, `physical path required: ${file}`);
  const before = await lstat(file, {bigint: true});
  assert(before.isFile() && before.nlink === 1n, `ordinary single-link file required: ${file}`);
  const bytes = await readFile(file);
  const after = await lstat(file, {bigint: true});
  for (const key of statKeys) assert.equal(after[key], before[key], `input changed: ${file}`);
  if (expectedSha) assert.equal(hash(bytes), expectedSha, `hash drift: ${file}`);
  if (expectedBytes !== undefined) assert.equal(bytes.length, expectedBytes, `size drift: ${file}`);
  return bytes;
}

// ElementTree reads the already hash-verified XML bytes through stdin. No source
// edit, ActionScript execution, hidden timeline flattening, or renderer inference.
const XML_PARSER = `import json,sys,xml.etree.ElementTree as E
swf=E.fromstring(sys.stdin.buffer.read()); tags=swf.find('tags'); definitions={}
for e in tags:
    if not e.get('type','').startswith('Define'): continue
    cid=next((e.get(k) for k in ['spriteId','shapeId','characterId','characterID','buttonId','fontID','textId'] if e.get(k) is not None),None)
    if cid is None: raise ValueError('unidentified definition '+e.get('type'))
    cid=int(cid)
    if cid in definitions: raise ValueError('duplicate character ID')
    definitions[cid]=e
def timeline(owner,items,declared):
    frame=1; refs=[]; masks=[]; active={}; maskFrameCounts=[]
    for e in items:
        kind=e.get('type',''); depth=int(e.get('depth','0'))
        if kind.startswith('RemoveObject'): active.pop(depth,None)
        if kind.startswith('PlaceObject'):
            if e.get('placeFlagMove')=='false': active.pop(depth,None)
            if e.get('placeFlagHasClipDepth')=='true': active[depth]=int(e.get('clipDepth'))
        if e.get('type','').startswith('PlaceObject') and e.get('characterId') is not None: refs.append(int(e.get('characterId')))
        if e.get('placeFlagHasClipDepth')=='true': masks.append({'frame':frame,'characterId':int(e.get('characterId')),'depth':int(e.get('depth')),'clipDepth':int(e.get('clipDepth'))})
        if e.get('type')=='ShowFrameTag': maskFrameCounts.append(len(active)); frame+=1
    if frame-1!=declared: raise ValueError('ShowFrame count disagrees with '+owner)
    return {'frameCount':declared,'references':sorted(set(refs)),'masks':masks,'maskFrameCounts':maskFrameCounts}
timelines={'root':timeline('root',tags,int(swf.get('frameCount')))}
for cid,e in definitions.items():
    if e.get('type')=='DefineSpriteTag': timelines['sprite-'+str(cid)]=timeline('sprite-'+str(cid),e.find('subTags'),int(e.get('frameCount')))
direct={cid:[] for cid in definitions}; buttonHits=[]
for cid,e in definitions.items():
    if e.get('type')=='DefineSpriteTag': direct[cid]=timelines['sprite-'+str(cid)]['references']
    elif e.get('type')=='DefineButton2Tag':
        records=list(e.find('characters')); direct[cid]=sorted(set(int(x.get('characterId')) for x in records))
        buttonHits.append({'characterId':cid,'references':direct[cid],'hitOnly':all(x.get('buttonStateHitTest')=='true' and all(x.get(k)=='false' for k in ['buttonStateUp','buttonStateOver','buttonStateDown']) for x in records)})
    elif e.get('type')=='DefineTextTag': direct[cid]=sorted(set(int(x.get('fontId')) for x in e.iter() if x.get('fontId') is not None))
pending=list(timelines['root']['references']); reachable=set()
while pending:
    cid=pending.pop()
    if cid in reachable: continue
    if cid not in definitions: raise ValueError('missing referenced character '+str(cid))
    reachable.add(cid); pending.extend(direct[cid])
rect=swf.find('displayRect')
print(json.dumps({'generator':swf.get('_generator'),'xmlVersion':[swf.get('_xmlExportMajor'),swf.get('_xmlExportMinor')],'frameRate':float(swf.get('frameRate')),'stageTwips':[int(rect.get('Xmin')),int(rect.get('Xmax')),int(rect.get('Ymin')),int(rect.get('Ymax'))],'timelines':timelines,'reachableDefinitions':[{'characterId':cid,'type':definitions[cid].get('type'),'references':direct[cid]} for cid in sorted(reachable)],'unreachableCharacterIds':sorted(set(definitions)-reachable),'buttonStates':buttonHits},separators=(',',':')))
`;

export function inspectP009Xml(bytes) {
  const result = spawnSync('python3', ['-c', XML_PARSER],
    {input: bytes, encoding: 'utf8', timeout: 30000, maxBuffer: 1024 * 1024});
  assert(!result.error && result.status === 0, `XML dependency extraction failed: ${result.error?.message ?? result.stderr}`);
  const xml = JSON.parse(result.stdout);
  assert.equal(xml.generator, 'JPEXS Free Flash Decompiler v.26.2.1');
  assert.deepEqual(xml.xmlVersion, ['2', '2']);
  assert.equal(xml.frameRate, 12);
  assert.deepEqual(xml.stageTwips, [0, 16000, 0, 12000]);
  assert.deepEqual(Object.keys(xml.timelines), ['root', 'sprite-62']);
  assert.equal(xml.timelines.root.frameCount, 10);
  assert.equal(xml.timelines['sprite-62'].frameCount, 394);
  assert.deepEqual(xml.timelines.root.references, [62, 63]);
  assert.deepEqual(xml.timelines.root.masks, []);
  assert.deepEqual(xml.timelines['sprite-62'].masks, [
    {frame: 12, characterId: 1, depth: 1, clipDepth: 12},
    {frame: 72, characterId: 1, depth: 13, clipDepth: 20},
    {frame: 142, characterId: 29, depth: 21, clipDepth: 28},
    {frame: 210, characterId: 29, depth: 29, clipDepth: 31},
  ]);
  assert.deepEqual(xml.unreachableCharacterIds, []);
  assert(xml.buttonStates.length === 8 && xml.buttonStates.every(button => button.hitOnly));
  return xml;
}

export function inspectP009Canvas(text, xml) {
  const html = text.replace(/\r\n?/g, '\n');
  const start = html.indexOf('var scalingGrids = {};');
  const end = html.indexOf('\nvar frame = -1;');
  assert(start >= 0 && end > start, 'generated Canvas declaration boundary missing');
  const declarations = html.slice(start, end);
  new Script(declarations); // Syntax only; no graphics or fidelity claim.
  const names = [...declarations.matchAll(/function ([A-Za-z0-9_]+)\(/g)].map(match => match[1]);
  const defined = new Set(names);
  const placed = [...declarations.matchAll(/place\("([A-Za-z0-9_]+)"/g)].map(match => match[1]);
  const missing = [...new Set(placed)].filter(name => !defined.has(name));
  assert.deepEqual(missing, [], 'generated place() has missing nested dependency');
  for (const [name, frames] of [['main', 10], ['sprite62', 394]]) {
    assert.match(declarations, new RegExp(`function ${name}\\(ctx,ctrans,frame,ratio,time\\)\\{[\\s\\S]*?var frame_cnt = ${frames};`));
  }
  assert.deepEqual(names.filter(name => /^sprite\d+$/.test(name)), ['sprite62']);
  for (const definition of xml.reachableDefinitions) {
    const prefix = definition.type.startsWith('DefineShape') ? 'shape'
      : definition.type.startsWith('DefineText') ? 'text'
      : definition.type.startsWith('DefineFont') ? 'font'
      : definition.type.startsWith('DefineButton') ? 'button' : 'sprite';
    assert(defined.has(`${prefix}${definition.characterId}`), `source dependency missing: ${prefix}${definition.characterId}`);
  }
  assert(!/function (?:image|morph)\d+\(/.test(declarations), 'unexpected bitmap or morph domain');
  // FFDec implements these four timeline masks by drawing clipCanvas through
  // destination-in. Verify every frame's compositing block against XML state.
  const spriteStart = declarations.indexOf('function sprite62(');
  const nextFunction = declarations.indexOf('\nfunction ', spriteStart + 1);
  const sprite = declarations.slice(spriteStart, nextFunction < 0 ? undefined : nextFunction);
  const cases = [...sprite.matchAll(/\t\tcase (\d+):([\s\S]*?)(?=\t\tcase \d+:|\t\})/g)];
  assert.equal(cases.length, 394, 'sprite62 must retain every source frame case');
  const maskFrameCounts = cases.map(([ , number, body], index) => {
    assert.equal(Number(number), index, 'source frame case order changed');
    const pushed = [...body.matchAll(/clips\.push\(\{ctx:ctx,canvas:canvas\}\);/g)].length;
    for (const marker of ['var o = clips.pop();', 'ctx.globalCompositeOperation = "destination-in";', 'ctx.drawImage(o.clipCanvas,0,0);']) {
      assert.equal(body.split(marker).length - 1, pushed, `incomplete mask block at frame ${index + 1}`);
    }
    assert.equal(pushed, xml.timelines['sprite-62'].maskFrameCounts[index], `mask count differs from source at frame ${index + 1}`);
    return pushed;
  });
  return {
    syntaxValid: true, exportedFrameDomains: {root: 10, 'sprite-62': 394},
    nestedSpriteCount: 0, sourceReachableCharacterCount: xml.reachableDefinitions.length,
    declaredSourceCharacterFunctions: names.filter(name => /^(?:shape|font|text|button|sprite)\d+$/.test(name)).length,
    placedCharacterFunctions: [...new Set(placed)].sort(), missingPlacedCharacterFunctions: missing,
    sourceMaskPlacements: xml.timelines['sprite-62'].masks,
    generatedMaskMechanism: 'clipCanvas plus destination-in raster compositing',
    generatedMaskBlockCount: maskFrameCounts.reduce((sum, count) => sum + count, 0),
    maskFramesChecked: maskFrameCounts.length,
    bitmapCount: 0, morphCount: 0,
    buttonGraphicsState: 'eight source buttons have hit-test-only shapes; event behavior is not Canvas authority',
    acceptanceEffect: 'none',
  };
}

async function inventory(directory, base = directory) {
  assert.equal(await realpath(directory), directory, 'physical extraction directory required');
  const records = [];
  for (const name of (await readdir(directory)).sort()) {
    if (directory === base && name === 'extraction-receipt.json') continue;
    const file = path.join(directory, name);
    const stat = await lstat(file);
    assert(!stat.isSymbolicLink(), 'export must contain no symlinks');
    if (stat.isDirectory()) records.push(...await inventory(file, base));
    else {
      const bytes = await physical(file);
      records.push({path: path.relative(base, file), bytes: bytes.length, sha256: hash(bytes)});
    }
  }
  return records.sort((a, b) => a.path.localeCompare(b.path, 'en'));
}

async function verifyRetained(out, files) {
  const expected = [...EXPECTED, ...RECOVERY_FILES].sort((a, b) => a.localeCompare(b, 'en'));
  assert.deepEqual(files.map(file => file.path), expected, 'retained extraction membership changed');
  assert.deepEqual(files.filter(file => EXPECTED.includes(file.path)), RETAINED_RAW_FILES,
    'retained raw tool output changed; recovery cannot substitute new output');
  await physical(path.join(out, 'predecessor-exporter.mjs'), RETAINED_GENERATOR_SHA, 17008);
  assert.equal((await physical(path.join(out, 'retained-check-failure.json'))).toString('utf8'), json(RETAINED_FAILURE));
}

async function preflight() {
  assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT, SOURCE_ROOT, 'exact physical G6-G8 source root required');
  assert((await lstat(SOURCE_ROOT)).isDirectory(), 'source root must be a real directory');
  assert.equal(await realpath(SOURCE_ROOT), SOURCE_ROOT);
  const source = path.join(SOURCE_ROOT, SOURCE);
  await physical(source, SOURCE_SHA, 165405);
  await physical(path.join(ROOT, WORK, 'audit/source-input.swf'), SOURCE_SHA, 165405);
  const migration = JSON.parse(await physical(path.join(ROOT, WORK, 'migration.json')));
  assert.equal(migration.animationId, 'shared-alg001-l12-p009');
  assert.equal(migration.source.swf, source);
  assert.equal(migration.source.swfSha256, SOURCE_SHA);
  const xmlBytes = await physical(path.join(ROOT, WORK, 'audit/movie.xml'), XML_SHA, 1167103);
  const xml = inspectP009Xml(xmlBytes);
  await physical(path.join(ROOT, 'catalog/toolchain.json'), TOOLCHAIN_SHA);
  const sourceToolchain = JSON.parse(await physical(path.join(ROOT, WORK, 'audit/source-toolchain.json'), SOURCE_TOOLCHAIN_SHA));
  assert.deepEqual(sourceToolchain.source, {path: source, bytes: 165405, sha256: SOURCE_SHA});
  assert.deepEqual(sourceToolchain.invocation, {command: JAVA, prefix: PREFIX});
  assert.equal(sourceToolchain.java.path, JAVA);
  assert.equal(sourceToolchain.ffdecJar.path, JAR);
  for (const item of [sourceToolchain.java, sourceToolchain.ffdecJar, ...sourceToolchain.classPath]) {
    await physical(item.path, item.sha256, item.bytes);
  }
  return {source, xml, sourceToolchain};
}

function run(args, timeout = 180000) {
  const result = spawnSync(JAVA, [...PREFIX, ...args],
    {encoding: 'utf8', maxBuffer: 4e6, timeout});
  assert(!result.error, result.error?.message);
  return result;
}

async function main() {
  assert(['--export', '--check', '--resume-retained'].includes(process.argv[2]) && process.argv.length === 3,
    'usage: node scripts/export-g678-alg-l12-p009-canvas.mjs --export|--check|--resume-retained');
  const {source, xml, sourceToolchain} = await preflight();
  const out = path.join(ROOT, OUT);
  const generatorSha256 = hash(await physical(fileURLToPath(import.meta.url)));
  const args = ['-config', 'packJavaScripts=false', '-onerror', 'abort', '-selectid', '62',
    '-format', 'frame:canvas,sprite:canvas', '-export', 'frame,sprite', out, source];
  if (process.argv[2] === '--check') {
    const receipt = JSON.parse(await physical(path.join(out, 'extraction-receipt.json')));
    assert.equal(receipt.animationId, 'shared-alg001-l12-p009');
    assert.deepEqual(receipt.source, {physicalPath: source, bytes: 165405, sha256: SOURCE_SHA});
    assert.equal(receipt.sourceXmlSha256, XML_SHA);
    assert.equal(receipt.toolchainSha256, TOOLCHAIN_SHA);
    assert.equal(receipt.sourceToolchainSha256, SOURCE_TOOLCHAIN_SHA);
    assert.equal(receipt.generatorSha256, generatorSha256);
    if (receipt.extractionRecovery) {
      assert.deepEqual(receipt.extractionRecovery, {kind: 'review of exact retained raw extraction after checker correction',
        originalGeneratorSha256: RETAINED_GENERATOR_SHA, rawOutputsRewritten: false});
    }
    assert.deepEqual(receipt.command, [JAVA, ...PREFIX, ...args]);
    assert.deepEqual(receipt.selectedDomains, {root: 10, 'sprite-62': 394});
    assert.deepEqual(receipt.tool, {version: '26.2.1', java: sourceToolchain.java,
      ffdecJar: sourceToolchain.ffdecJar, classPath: sourceToolchain.classPath});
    assert.deepEqual(receipt.sourceXmlProjection, xml);
    const files = await inventory(out);
    if (receipt.extractionRecovery) await verifyRetained(out, files);
    else assert.deepEqual(files.map(file => file.path), EXPECTED);
    assert.deepEqual(receipt.files, files);
    assert.equal(receipt.outputChecksumSetSha256, hash(Buffer.from(json(files))));
    const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0);
    assert.equal(receipt.totalBytes, totalBytes);
    assert.equal(receipt.under100MiB, totalBytes < 100 * 1024 * 1024);
    const closure = inspectP009Canvas((await physical(path.join(out, 'frames/frames.html'))).toString('utf8'), xml);
    assert.deepEqual(receipt.canvasDependencyClosure, closure);
    assert.equal(receipt.acceptanceEffect, 'none');
    assert.equal(receipt.fidelityAccepted, false);
    assert.equal(receipt.audioAccepted, false);
    console.log(json({checked: true, files: files.length,
      totalBytes: files.reduce((sum, file) => sum + file.bytes, 0), sourceSha256: SOURCE_SHA, closure}));
    return;
  }
  if (process.argv[2] === '--export') {
    const help = run(['-help', '-export']);
    assert.equal(help.status, 0);
    assert(help.stdout.includes('JPEXS Free Flash Decompiler v.26.2.1'));
    for (const option of ['-selectid', 'frame:canvas', 'sprite:canvas']) assert(help.stdout.includes(option), `FFDec help lacks ${option}`);
    await mkdir(out); // Exclusive: retain failed or earlier attempts without overwrite.
    await writeFile(path.join(out, 'help-export.txt'), help.stdout, {flag: 'wx'});
    const result = run(args, 300000);
    await writeFile(path.join(out, 'export.log'), result.stdout + result.stderr, {flag: 'wx'});
    assert.equal(result.status, 0, 'FFDec failed; partial output retained for review');
  }
  await preflight(); // Reverify source, XML and actual tool inputs after extraction.
  assert.equal(hash(await physical(fileURLToPath(import.meta.url))), generatorSha256, 'generator changed during export');
  const files = await inventory(out);
  const recovering = process.argv[2] === '--resume-retained';
  if (recovering) await verifyRetained(out, files);
  else assert.deepEqual(files.map(file => file.path), EXPECTED, 'FFDec output differs from root and the single selected sprite');
  const closure = inspectP009Canvas((await physical(path.join(out, 'frames/frames.html'))).toString('utf8'), xml);
  const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0);
  const receipt = {
    schemaVersion: 1, animationId: 'shared-alg001-l12-p009',
    evidenceKind: 'bounded FFDec Canvas extraction; no runtime authority',
    source: {physicalPath: source, bytes: 165405, sha256: SOURCE_SHA},
    sourceXmlSha256: XML_SHA, sourceXmlProjection: xml,
    toolchainSha256: TOOLCHAIN_SHA, sourceToolchainSha256: SOURCE_TOOLCHAIN_SHA, generatorSha256,
    ...(recovering ? {extractionRecovery: {kind: 'review of exact retained raw extraction after checker correction',
      originalGeneratorSha256: RETAINED_GENERATOR_SHA, rawOutputsRewritten: false}} : {}),
    tool: {version: '26.2.1', java: sourceToolchain.java,
      ffdecJar: sourceToolchain.ffdecJar, classPath: sourceToolchain.classPath},
    command: [JAVA, ...PREFIX, ...args], selectedDomains: {root: 10, 'sprite-62': 394},
    canvasDependencyClosure: closure, files, outputChecksumSetSha256: hash(Buffer.from(json(files))),
    totalBytes, under100MiB: totalBytes < 100 * 1024 * 1024,
    fidelityAccepted: false, audioAccepted: false, acceptanceEffect: 'none',
  };
  await writeFile(path.join(out, 'extraction-receipt.json'), json(receipt), {flag: 'wx'});
  console.log(json({exported: true, files: files.length, totalBytes,
    under100MiB: receipt.under100MiB, sourceSha256: SOURCE_SHA, closure}));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {console.error(error); process.exitCode = 1;});
}
