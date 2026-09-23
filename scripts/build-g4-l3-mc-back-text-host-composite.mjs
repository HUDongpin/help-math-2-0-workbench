#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {gunzipSync} from 'node:zlib';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const execFileAsync = promisify(execFile);

const SHELL = Object.freeze({
  animationId: 'shell-course-g04-l03-index-local',
  bytes: 657_421,
  path:
    'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/index_local.swf',
  sha256:
    '817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e',
});
const COURSE_XML = Object.freeze({
  bytes: 8_976,
  path:
    'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/index.xml',
  sha256:
    '0f1109321a5b65507c36fb8fd30380c4899cb7f381c2959aa7092d59bba990b0',
});
const SWFMILL_AUDIT = Object.freeze({
  bytes: 865_399,
  path:
    'migrations/shell-course-g04-l03-index-local/audit/machine/swfmill.xml.gz',
  sha256:
    'f16d30d4ba6f3ce7c8c6588c50f01534d60d3cb5847a7d55c7ebf5633a9c53de',
});
const INTRODUCTION = Object.freeze({
  animationId: 'course-g04-l03-ir-001-341242cc',
  canvasAsset: Object.freeze({
    bytes: 327_934,
    path:
      'public/flash-assets/courses/course-g04-l03-ir-001-341242cc/canvas-renderer.js',
    sha256:
      'ab495ec627dba24aa501946720de24602d9134ad7f2067a20ee75f2dcef7f72a',
  }),
  loadedSwfRegistryKey:
    'course-g04-l03-ir-001-341242cc-loaded-swf-host',
  sourcePath: 'IR/L3RW01.swf',
  sourceSwf: Object.freeze({
    bytes: 146_730,
    path:
      'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IR/L3RW01.swf',
    sha256:
      '2af6431db3ed786d9b48feec5a649887af92fb219a04e5dbd42e7e4b04087df4',
  }),
});
const SPRITE = Object.freeze({
  characterId: 584,
  exactTagSha256:
    '502317296bf4eaa921202017c90ce4d95e91fa85aff35d4cdaf641392303469e',
  instanceName: 'Mc_BackText',
  rawPayloadSha256:
    'dc59953bb2bbacac1118cb1c1dfad8901c0a5b5a3b2231862f9983732d2cf094',
  rawSvg: Object.freeze({
    bytes: 61_488,
    height: 324.8,
    localOrigin: Object.freeze({x: 368.65, y: 162.5}),
    sha256:
      '7f7ef46f5b4130caf31c9eca95da5f11520b466966c8c85dab7f77eb8358d796',
    width: 762.1,
  }),
  rootColorTransform: Object.freeze({
    alphaMultiplier: 23,
    divisor: 256,
    redMultiplier: 0,
    greenMultiplier: 0,
    blueMultiplier: 0,
    redOffset: 51,
    greenOffset: 51,
    blueOffset: 51,
    alphaOffset: 0,
  }),
  rootDepth: 5,
  rootFrame: 50,
  rootPlacementPixels: Object.freeze({x: 397.45, y: 319.65}),
  rootPlacementTwips: Object.freeze({x: 7_949, y: 6_393}),
});
const PAGE_PLANE = Object.freeze({
  instanceName: 'animation_mc',
  rootDepth: 47,
  rootFrame: 38,
  rootPlacementPixels: Object.freeze({x: -12.5, y: 33.3}),
  rootPlacementTwips: Object.freeze({x: -250, y: 666}),
});
const FFDEC = Object.freeze({
  executable: 'ffdec',
  version: '26.2.1',
});
const OUTPUT_DIRECTORY =
  'public/flash-assets/courses/shell-course-g04-l03-index-local/host-composite-assets';
const OUTPUT_FILES = Object.freeze({
  backgroundSvg: 'lesson-shell-mc-back-text.svg',
  loadedSwfCanvas:
    'course-g04-l03-ir-001-loaded-swf-canvas-renderer.js',
  manifest: 'manifest.json',
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function projectPath(relativePath) {
  const resolved = path.resolve(ROOT, relativePath);
  const relative = path.relative(ROOT, resolved);
  invariant(
    relative &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative),
    `path escapes project root: ${relativePath}`,
  );
  return resolved;
}

async function regularFile(relativePath) {
  const resolved = projectPath(relativePath);
  const fileStat = await lstat(resolved);
  invariant(
    fileStat.isFile() && !fileStat.isSymbolicLink(),
    `${relativePath} must be a regular file`,
  );
  return {resolved, bytes: await readFile(resolved)};
}

function assertBoundFile(file, expected, label) {
  invariant(
    file.bytes.length === expected.bytes &&
      sha256(file.bytes) === expected.sha256,
    `${label} identity changed`,
  );
}

function validateStaticHostEvidence(swfmillBytes, courseXmlBytes) {
  const swfmillXml = gunzipSync(swfmillBytes).toString('utf8');
  const placementFragment = [
    '<PlaceObject2 replace="0" depth="5" objectID="584" morph="49" name="Mc_BackText">',
    '<Transform transX="7949" transY="6393"/>',
    '<ColorTransform2 factorRed="0" factorGreen="0" factorBlue="0" factorAlpha="23" offsetRed="51" offsetGreen="51" offsetBlue="51" offsetAlpha="0"/>',
  ];
  for (const fragment of placementFragment) {
    invariant(
      swfmillXml.split(fragment).length === 2,
      `Mc_BackText source evidence drifted: ${fragment}`,
    );
  }
  const pagePlanePlacementFragment = [
    '<PlaceObject2 replace="0" depth="47" objectID="170" morph="37" name="animation_mc">',
    '<Transform transX="-250" transY="666"/>',
  ];
  for (const fragment of pagePlanePlacementFragment) {
    invariant(
      swfmillXml.split(fragment).length === 2,
      `animation_mc source evidence drifted: ${fragment}`,
    );
  }

  const activeXml = courseXmlBytes
    .toString('utf8')
    .replace(/<!--[\s\S]*?-->/g, '');
  const activeBackgroundPages = [
    ...activeXml.matchAll(
      /<Page\b[^>]*\bBGText="Yes"[^>]*>([^<]+)<\/Page>/g,
    ),
  ].map((match) => match[1].trim());
  invariant(
    activeBackgroundPages.length === 1 &&
      activeBackgroundPages[0] === INTRODUCTION.sourcePath,
    'active course XML background-text membership drifted',
  );
  return activeBackgroundPages;
}

async function extractSpriteSvg(sourcePath) {
  const help = await execFileAsync(FFDEC.executable, ['-help'], {
    maxBuffer: 16 * 1024 * 1024,
  });
  invariant(
    `${help.stdout}\n${help.stderr}`.includes(
      `JPEXS Free Flash Decompiler v.${FFDEC.version}`,
    ),
    `FFDec ${FFDEC.version} is required`,
  );

  const temporaryDirectory = await mkdtemp(
    path.join(tmpdir(), 'g4-l3-mc-back-text-'),
  );
  const exportDirectory = path.join(temporaryDirectory, 'sprite-svg');
  try {
    await execFileAsync(
      FFDEC.executable,
      [
        '-select',
        `${SPRITE.characterId}:1`,
        '-selectid',
        String(SPRITE.characterId),
        '-format',
        'sprite:svg',
        '-export',
        'sprite',
        exportDirectory,
        sourcePath,
      ],
      {maxBuffer: 16 * 1024 * 1024},
    );
    const rawPath = path.join(
      exportDirectory,
      `DefineSprite_${SPRITE.characterId}`,
      '1.svg',
    );
    const rawStat = await lstat(rawPath);
    invariant(
      rawStat.isFile() && !rawStat.isSymbolicLink(),
      'FFDec sprite 584 SVG export must be a regular file',
    );
    const rawBytes = await readFile(rawPath);
    invariant(
      rawBytes.length === SPRITE.rawSvg.bytes &&
        sha256(rawBytes) === SPRITE.rawSvg.sha256,
      'FFDec sprite 584 SVG export drifted',
    );
    return rawBytes;
  } finally {
    await rm(temporaryDirectory, {force: true, recursive: true});
  }
}

function buildFullStageBackgroundSvg(rawBytes) {
  let svg = rawBytes.toString('utf8');
  const sourceRoot =
    '<svg xmlns:ffdec="https://www.free-decompiler.com/flash" xmlns:xlink="http://www.w3.org/1999/xlink" ffdec:objectType="frame" height="324.8px" width="762.1px" xmlns="http://www.w3.org/2000/svg">';
  const outputRoot =
    '<svg xmlns:ffdec="https://www.free-decompiler.com/flash" xmlns:xlink="http://www.w3.org/1999/xlink" ffdec:objectType="frame" data-source-character-id="584" data-source-instance-name="Mc_BackText" height="600px" viewBox="0 0 800 600" width="800px" xmlns="http://www.w3.org/2000/svg">';
  invariant(
    svg.split(sourceRoot).length === 2,
    'FFDec sprite 584 root SVG geometry drifted',
  );
  svg = svg.replace(sourceRoot, outputRoot);

  const sourcePlacement =
    '  <g transform="matrix(1.0, 0.0, 0.0, 1.0, 368.65, 162.5)">';
  const outputPlacement =
    '  <g opacity="0.08984375" transform="matrix(1.0, 0.0, 0.0, 1.0, 397.45, 319.65)">';
  invariant(
    svg.split(sourcePlacement).length === 2,
    'FFDec sprite 584 local origin drifted',
  );
  svg = svg.replace(sourcePlacement, outputPlacement);

  const lightFillCount = svg.split('fill="#cccccc"').length - 1;
  const darkFillCount = svg.split('fill="#000000"').length - 1;
  invariant(
    lightFillCount === 49 && darkFillCount === 80,
    'FFDec sprite 584 fill inventory drifted',
  );
  svg = svg
    .replaceAll('fill="#cccccc"', 'fill="#333333"')
    .replaceAll('fill="#000000"', 'fill="#333333"');
  invariant(
    !svg.includes('fill="#cccccc"') &&
      !svg.includes('fill="#000000"'),
    'root RGB color transform was not fully baked',
  );
  return Buffer.from(svg);
}

function buildLoadedSwfCanvasAsset(sourceBytes) {
  let source = sourceBytes.toString('utf8');
  const sourceBackground = [
    '    ctx.fillStyle = "#b8d8f7";',
    '    ctx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);',
  ].join('\n');
  const transparentBackground =
    '    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);';
  invariant(
    source.split(sourceBackground).length === 2,
    'IR001 standalone Canvas background prelude drifted',
  );
  source = source.replace(sourceBackground, transparentBackground);

  const sourceChildPlacement =
    '        ctx.transform(1, 0, 0, 1, -124.5, 98.5);';
  const hostChildPlacement = [
    '        ctx.transform(1, 0, 0, 1, -12.5, 33.3);',
    sourceChildPlacement,
  ].join('\n');
  invariant(
    source.split(sourceChildPlacement).length === 2,
    'IR001 standalone child placement drifted',
  );
  source = source.replace(sourceChildPlacement, hostChildPlacement);

  const sourceGuard =
    `if (Object.prototype.hasOwnProperty.call(registry, "${INTRODUCTION.animationId}")) {`;
  const hostGuard =
    `if (Object.prototype.hasOwnProperty.call(registry, "${INTRODUCTION.loadedSwfRegistryKey}")) {`;
  const sourceRegistration =
    `registry["${INTRODUCTION.animationId}"] = Object.freeze({metadata: METADATA, ready: ready, resolveFrameState: resolveFrameState, render: render});`;
  const hostRegistration =
    `registry["${INTRODUCTION.loadedSwfRegistryKey}"] = Object.freeze({metadata: METADATA, ready: ready, resolveFrameState: resolveFrameState, render: render});`;
  invariant(
    source.split(sourceGuard).length === 2 &&
      source.split(sourceRegistration).length === 2,
    'IR001 Canvas registry contract drifted',
  );
  source = source
    .replace(sourceGuard, hostGuard)
    .replace(sourceRegistration, hostRegistration);
  invariant(
    source.includes(transparentBackground) &&
      source.includes(hostChildPlacement) &&
      source.includes(hostGuard) &&
      source.includes(hostRegistration) &&
      !source.includes(sourceBackground),
    'IR001 loaded-SWF host derivation was incomplete',
  );
  return Buffer.from(source);
}

export async function buildG4L3McBackTextHostComposite() {
  const [
    shell,
    courseXml,
    swfmillAudit,
    introSwf,
    introCanvas,
    generator,
  ] = await Promise.all([
    regularFile(SHELL.path),
    regularFile(COURSE_XML.path),
    regularFile(SWFMILL_AUDIT.path),
    regularFile(INTRODUCTION.sourceSwf.path),
    regularFile(INTRODUCTION.canvasAsset.path),
    regularFile(path.relative(ROOT, SCRIPT_PATH)),
  ]);
  assertBoundFile(shell, SHELL, 'G4 L3 shell source');
  assertBoundFile(courseXml, COURSE_XML, 'G4 L3 course XML');
  assertBoundFile(swfmillAudit, SWFMILL_AUDIT, 'G4 L3 swfmill audit');
  assertBoundFile(introSwf, INTRODUCTION.sourceSwf, 'G4 L3 IR001 source');
  assertBoundFile(
    introCanvas,
    INTRODUCTION.canvasAsset,
    'G4 L3 IR001 Canvas asset',
  );

  const activeBackgroundPages = validateStaticHostEvidence(
    swfmillAudit.bytes,
    courseXml.bytes,
  );
  const rawSvg = await extractSpriteSvg(shell.resolved);
  const backgroundSvg = buildFullStageBackgroundSvg(rawSvg);
  const loadedSwfCanvas = buildLoadedSwfCanvasAsset(introCanvas.bytes);
  const contentBounds = {
    x: Number(
      (SPRITE.rootPlacementPixels.x - SPRITE.rawSvg.localOrigin.x).toFixed(2),
    ),
    y: Number(
      (SPRITE.rootPlacementPixels.y - SPRITE.rawSvg.localOrigin.y).toFixed(2),
    ),
    width: SPRITE.rawSvg.width,
    height: SPRITE.rawSvg.height,
  };
  const assets = [
    {
      file: OUTPUT_FILES.backgroundSvg,
      bytesBuffer: backgroundSvg,
      bytes: backgroundSvg.length,
      sha256: sha256(backgroundSvg),
      role: 'full-stage-transparent-source-background-companion',
    },
    {
      file: OUTPUT_FILES.loadedSwfCanvas,
      bytesBuffer: loadedSwfCanvas,
      bytes: loadedSwfCanvas.length,
      sha256: sha256(loadedSwfCanvas),
      role: 'ir001-loaded-swf-transparent-host-canvas',
    },
  ];
  const manifest = {
    schemaVersion: 1,
    evidenceType: 'g4-l3-mc-back-text-loaded-swf-host-composite',
    animationId: SHELL.animationId,
    status: 'source-static-engineering-candidate-only',
    classification:
      'hash-bound-ffdec-vector-plus-deterministic-loaded-swf-host-placement-and-background-omission',
    authority: {
      statement:
        'Sprite 584 is freshly exported from the exact G4 L3 shell, placed at its root coordinates, and given its root ColorTransform. The IR001 derivative applies the exact shell animation_mc placement and omits the child SWF standalone stage background so the lower-depth shell companion can remain visible.',
      authorityBoundary:
        'This is a static host-composition candidate. It does not execute ActionScript, establish original-runtime visibility or compositing, compare accepted full frames, prove RMSE, complete human review, grant owner acceptance, close strict completion, or authorize publication.',
      actionScriptExecuted: false,
      originalRuntimeBaseline: false,
      originalRuntimeAccepted: false,
      humanVisualReviewAccepted: false,
      ownerAccepted: false,
      strictCompletion: false,
      publicRelease: false,
    },
    shellSource: SHELL,
    courseXml: {
      ...COURSE_XML,
      activeBackgroundTextSourcePages: activeBackgroundPages,
      activeBackgroundTextAnimationIds: [INTRODUCTION.animationId],
    },
    swfmillAudit: SWFMILL_AUDIT,
    sprite: {
      characterId: SPRITE.characterId,
      instanceName: SPRITE.instanceName,
      rawPayloadSha256: SPRITE.rawPayloadSha256,
      exactTagSha256: SPRITE.exactTagSha256,
      rootFrame: SPRITE.rootFrame,
      rootDepth: SPRITE.rootDepth,
      rootPlacementTwips: SPRITE.rootPlacementTwips,
      rootPlacementPixels: SPRITE.rootPlacementPixels,
      rawSvg: SPRITE.rawSvg,
      contentBounds,
      rootColorTransform: SPRITE.rootColorTransform,
      bakedOutputColor: '#333333',
      bakedOutputOpacity: SPRITE.rootColorTransform.alphaMultiplier /
        SPRITE.rootColorTransform.divisor,
    },
    pagePlane: PAGE_PLANE,
    introductionLoadedSwfHost: {
      animationId: INTRODUCTION.animationId,
      sourceSwf: INTRODUCTION.sourceSwf,
      standaloneCanvasAsset: INTRODUCTION.canvasAsset,
      derivedRegistryKey: INTRODUCTION.loadedSwfRegistryKey,
      backgroundDisposition:
        'ignore-loaded-child-swf-standalone-stage-background',
      derivation:
        'replace the one exact full-stage #b8d8f7 fill prelude with clearRect, prepend the exact shell animation_mc translation (-12.5, 33.3), and change only the global registry key',
    },
    ffdec: {
      executable: FFDEC.executable,
      version: FFDEC.version,
      exportFormat: 'sprite:svg',
      selectedCharacterId: SPRITE.characterId,
      selectedFrame: 1,
      rawSvgBytes: SPRITE.rawSvg.bytes,
      rawSvgSha256: SPRITE.rawSvg.sha256,
    },
    generator: {
      path: path.relative(ROOT, SCRIPT_PATH),
      bytes: generator.bytes.length,
      sha256: sha256(generator.bytes),
    },
    assets: assets.map(({bytesBuffer: _bytesBuffer, ...asset}) => asset),
    strictAcceptanceEffect: 'none',
  };
  return {
    assets,
    manifest,
    manifestBytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`),
  };
}

export function parseArguments(argv) {
  const options = {mode: 'dry-run'};
  for (const argument of argv) {
    if (argument === '--write') {
      invariant(options.mode === 'dry-run', 'choose exactly one mode');
      options.mode = 'write';
    } else if (argument === '--check') {
      invariant(options.mode === 'dry-run', 'choose exactly one mode');
      options.mode = 'check';
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  return options;
}

async function emit(relativePath, bytes, mode) {
  const target = projectPath(relativePath);
  if (mode === 'check') {
    invariant((await readFile(target)).equals(bytes), `${relativePath} is stale`);
    return;
  }
  if (mode !== 'write') return;
  await mkdir(path.dirname(target), {recursive: true});
  const temporary = `${target}.tmp-${process.pid}`;
  try {
    await writeFile(temporary, bytes, {flag: 'wx'});
    await rename(temporary, target);
  } finally {
    await rm(temporary, {force: true});
  }
}

export async function run({mode = 'dry-run'} = {}) {
  const result = await buildG4L3McBackTextHostComposite();
  for (const asset of result.assets) {
    await emit(
      path.join(OUTPUT_DIRECTORY, asset.file),
      asset.bytesBuffer,
      mode,
    );
  }
  await emit(
    path.join(OUTPUT_DIRECTORY, OUTPUT_FILES.manifest),
    result.manifestBytes,
    mode,
  );
  return {
    mode,
    outputDirectory: OUTPUT_DIRECTORY,
    animationId: SHELL.animationId,
    assetCount: result.assets.length,
    activeBackgroundTextAnimationIds:
      result.manifest.courseXml.activeBackgroundTextAnimationIds,
    strictCompletion: result.manifest.authority.strictCompletion,
    publicRelease: result.manifest.authority.publicRelease,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const result = await run(parseArguments(process.argv.slice(2)));
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
