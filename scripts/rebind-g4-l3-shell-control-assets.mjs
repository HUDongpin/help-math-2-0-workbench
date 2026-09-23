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
const UPSTREAM = Object.freeze({
  directory:
    'public/flash-assets/courses/course-g04-l03-ts-006/diagnostic-composite-assets',
  manifest:
    'public/flash-assets/courses/course-g04-l03-ts-006/diagnostic-composite-assets/manifest.json',
  manifestSha256:
    'aa99f9637c17026d8f763579ed907b8c7a2933ad2c95cd867d6cf2a3f6ee2a0d',
});
const OUTPUT_DIRECTORY =
  'public/flash-assets/courses/shell-course-g04-l03-index-local/control-assets';
const CONTROL_FILES = Object.freeze([
  'lesson-shell-spanish-page-audio-up.png',
  'lesson-shell-replay-up.png',
  'lesson-shell-play-up.png',
  'lesson-shell-pause-up.png',
  'lesson-shell-volume-icon-up.png',
  'lesson-shell-volume-muted-icon-up.png',
  'lesson-shell-next-neutral-up.png',
  'lesson-shell-previous-neutral-up.png',
  'lesson-shell-rewind-up.png',
  'lesson-shell-forward-up.png',
  'lesson-shell-key-terms-up.png',
  'lesson-shell-map-up.png',
  'lesson-shell-calculator-up.png',
  'lesson-shell-volume-slider-source-static.png',
]);
const FFDEC = Object.freeze({
  executable: 'ffdec',
  version: '26.2.1',
});
const NAVIGATION_VECTOR_STATES = Object.freeze([
  Object.freeze({
    exportFile: '1_up.svg',
    file: 'lesson-shell-navigation-up.svg',
    sourceState: 'up',
    bytes: 7_250,
    sha256:
      '5beb704f49f7fac739a40923b7dc1f071901465e53ae8d7222bad672683c2460',
  }),
  Object.freeze({
    exportFile: '2_over.svg',
    file: 'lesson-shell-navigation-over.svg',
    sourceState: 'over',
    bytes: 7_505,
    sha256:
      '048f66e87606c503fcd9654fdae2fb9e6574a5da503b599341b467871945bed5',
  }),
  Object.freeze({
    exportFile: '3_down.svg',
    file: 'lesson-shell-navigation-down.svg',
    sourceState: 'down',
    bytes: 7_634,
    sha256:
      'c5d8b9bc887fab46337efd60e62dfd12f55e39ca09db327769aa91b48693151c',
  }),
]);
const NAVIGATION_HOVER_FRAME_OFFSETS = Object.freeze([
  0,
  2.95,
  5.9,
  8.85,
  6.35,
  3.8,
  1.3,
  -1.25,
  -3.75,
  -2.8,
  -1.85,
  -0.95,
  0,
]);
const NAVIGATION_CHROME_FILE =
  'lesson-shell-chrome-frame-0049-without-navigation.svg';

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
  invariant(fileStat.isFile() && !fileStat.isSymbolicLink(), `${relativePath} must be a regular file`);
  return {resolved, bytes: await readFile(resolved)};
}

async function extractNavigationVectorStates(sourcePath) {
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
    path.join(tmpdir(), 'g4-l3-shell-navigation-'),
  );
  try {
    await execFileAsync(
      FFDEC.executable,
      [
        '-selectid',
        '340,342',
        '-format',
        'button:svg',
        '-export',
        'button',
        temporaryDirectory,
        sourcePath,
      ],
      {maxBuffer: 16 * 1024 * 1024},
    );
    await execFileAsync(
      FFDEC.executable,
      [
        '-select',
        '119:1-13',
        '-selectid',
        '119',
        '-format',
        'sprite:svg',
        '-export',
        'sprite',
        temporaryDirectory,
        sourcePath,
      ],
      {maxBuffer: 16 * 1024 * 1024},
    );
    await execFileAsync(
      FFDEC.executable,
      [
        '-select',
        '0:49',
        '-format',
        'frame:svg',
        '-export',
        'frame',
        temporaryDirectory,
        sourcePath,
      ],
      {maxBuffer: 16 * 1024 * 1024},
    );

    const assets = [];
    for (const state of NAVIGATION_VECTOR_STATES) {
      const nextPath = path.join(
        temporaryDirectory,
        'DefineButton2_340',
        state.exportFile,
      );
      const previousPath = path.join(
        temporaryDirectory,
        'DefineButton2_342',
        state.exportFile,
      );
      const [nextStat, previousStat, nextBytes, previousBytes] =
        await Promise.all([
          lstat(nextPath),
          lstat(previousPath),
          readFile(nextPath),
          readFile(previousPath),
        ]);
      invariant(
        nextStat.isFile() &&
          !nextStat.isSymbolicLink() &&
          previousStat.isFile() &&
          !previousStat.isSymbolicLink(),
        `FFDec navigation ${state.sourceState} exports must be regular files`,
      );
      invariant(
        nextBytes.equals(previousBytes),
        `button 340 and 342 ${state.sourceState} states diverged`,
      );
      invariant(
        nextBytes.length === state.bytes &&
          sha256(nextBytes) === state.sha256,
        `FFDec navigation ${state.sourceState} export drifted`,
      );
      assets.push({
        file: state.file,
        bytes: state.bytes,
        sha256: state.sha256,
        sourceKind: 'DefineButton2',
        sourceCharacterIds: [340, 342],
        sourceState: state.sourceState,
        sourceCrop: null,
        sourceRootFrame: null,
        disabledAsset: null,
        statesPersisted: [state.sourceState],
        bytesBuffer: nextBytes,
      });
    }

    const rawOverAsset = assets.find(
      ({file}) => file === 'lesson-shell-navigation-over.svg',
    );
    invariant(rawOverAsset, 'FFDec navigation over state is missing');
    const rawOverText = rawOverAsset.bytesBuffer.toString('utf8');
    const nestedHandPattern =
      /(<use ffdec:characterId="118"[^>]*transform="matrix\(1\.0, 0\.0, 0\.0, 1\.0, )(-?\d+(?:\.\d+)?)(, 0\.0\)"[^>]*xlink:href="#shape2"\/>)/;
    invariant(
      [...rawOverText.matchAll(new RegExp(nestedHandPattern, 'g'))].length === 1,
      'expected one nested Hand placement in the FFDec over state',
    );
    const hoverFrameFiles = [rawOverAsset.file];
    for (
      let frameIndex = 1;
      frameIndex < NAVIGATION_HOVER_FRAME_OFFSETS.length;
      frameIndex += 1
    ) {
      const sourceFrame = frameIndex + 1;
      const spriteFramePath = path.join(
        temporaryDirectory,
        'DefineSprite_119_Hand',
        `${sourceFrame}.svg`,
      );
      const spriteFrameText = (await readFile(spriteFramePath)).toString('utf8');
      const spriteHandMatch = spriteFrameText.match(
        /<use ffdec:characterId="118"[^>]*transform="matrix\(1\.0, 0\.0, 0\.0, 1\.0, (-?\d+(?:\.\d+)?), 0\.0\)"/,
      );
      invariant(
        spriteHandMatch &&
          Number(spriteHandMatch[1]) ===
            NAVIGATION_HOVER_FRAME_OFFSETS[frameIndex],
        `nested Hand frame ${sourceFrame} translation drifted`,
      );
      const composedText = rawOverText.replace(
        nestedHandPattern,
        `$1${spriteHandMatch[1]}$3`,
      );
      invariant(
        composedText !== rawOverText ||
          NAVIGATION_HOVER_FRAME_OFFSETS[frameIndex] === 0,
        `nested Hand frame ${sourceFrame} was not composed`,
      );
      const composedBytes = Buffer.from(composedText);
      const file =
        `lesson-shell-navigation-over-frame-${String(sourceFrame).padStart(2, '0')}.svg`;
      hoverFrameFiles.push(file);
      assets.push({
        file,
        bytes: composedBytes.length,
        sha256: sha256(composedBytes),
        sourceKind: 'DefineButton2-with-nested-DefineSprite-frame',
        sourceCharacterIds: [340, 342, 119],
        sourceState: 'over',
        sourceNestedFrame: sourceFrame,
        sourceHandTranslationX:
          NAVIGATION_HOVER_FRAME_OFFSETS[frameIndex],
        sourceCrop: null,
        sourceRootFrame: null,
        disabledAsset: null,
        statesPersisted: [`over-frame-${sourceFrame}`],
        bytesBuffer: composedBytes,
      });
    }

    const rootFramePath = path.join(temporaryDirectory, '49.svg');
    const rootFrameBytes = await readFile(rootFramePath);
    const rootFrameText = rootFrameBytes.toString('utf8');
    const navigationPlacementPattern =
      /^    <use ffdec:characterId="(341|343)"[^\n]*\n/gm;
    const navigationPlacements = [
      ...rootFrameText.matchAll(navigationPlacementPattern),
    ];
    invariant(
      navigationPlacements.length === 2 &&
        navigationPlacements.map((match) => Number(match[1])).join(',') ===
          '341,343',
      'root frame 49 navigation placements drifted',
    );
    const navigationFreeChromeBytes = Buffer.from(
      rootFrameText.replace(navigationPlacementPattern, ''),
    );
    invariant(
      navigationFreeChromeBytes.length < rootFrameBytes.length,
      'root frame 49 navigation placements were not removed',
    );
    assets.push({
      file: NAVIGATION_CHROME_FILE,
      bytes: navigationFreeChromeBytes.length,
      sha256: sha256(navigationFreeChromeBytes),
      sourceKind: 'root-frame-svg-with-navigation-placements-removed',
      sourceCharacterIds: [341, 343],
      sourceState: 'up-placements-removed',
      sourceCrop: null,
      sourceRootFrame: 49,
      disabledAsset: null,
      statesPersisted: ['root-frame-49-without-navigation'],
      bytesBuffer: navigationFreeChromeBytes,
    });
    return {
      assets,
      hoverFrameFiles,
      navigationFreeChrome: {
        file: NAVIGATION_CHROME_FILE,
        bytes: navigationFreeChromeBytes.length,
        sha256: sha256(navigationFreeChromeBytes),
        sourceRootFrame: 49,
        removedSourceSpriteCharacterIds: [341, 343],
      },
    };
  } finally {
    await rm(temporaryDirectory, {force: true, recursive: true});
  }
}

export async function buildG4L3ShellControlAssetsRebind() {
  const [source, upstreamManifestFile, generator] = await Promise.all([
    regularFile(SHELL.path),
    regularFile(UPSTREAM.manifest),
    regularFile(path.relative(ROOT, SCRIPT_PATH)),
  ]);
  invariant(
    source.bytes.length === SHELL.bytes && sha256(source.bytes) === SHELL.sha256,
    'G4 L3 shell source identity changed',
  );
  invariant(
    sha256(upstreamManifestFile.bytes) === UPSTREAM.manifestSha256,
    'upstream diagnostic manifest identity changed',
  );
  const upstreamManifest = JSON.parse(upstreamManifestFile.bytes.toString('utf8'));
  invariant(
    upstreamManifest?.animationId === 'course-g04-l03-ts-006' &&
      upstreamManifest?.lessonShellSource?.path === SHELL.path &&
      upstreamManifest?.lessonShellSource?.bytes === SHELL.bytes &&
      upstreamManifest?.lessonShellSource?.sha256 === SHELL.sha256,
    'upstream manifest does not bind the exact G4 L3 shell',
  );
  invariant(Array.isArray(upstreamManifest.assets), 'upstream assets are missing');
  const assets = [];
  for (const file of CONTROL_FILES) {
    const candidates = upstreamManifest.assets.filter((asset) => asset?.file === file);
    invariant(candidates.length === 1, `expected one upstream asset: ${file}`);
    const candidate = candidates[0];
    invariant(
      (candidate.sourceKind === 'DefineButton2' && candidate.sourceState === 'up') ||
        (candidate.sourceKind === 'DefineSprite' && candidate.sourceState === 'frame-1'),
      `unexpected structural state: ${file}`,
    );
    const upstreamAsset = await regularFile(path.join(UPSTREAM.directory, file));
    invariant(
      upstreamAsset.bytes.length === candidate.bytes &&
        sha256(upstreamAsset.bytes) === candidate.sha256,
      `upstream control asset drifted: ${file}`,
    );
    assets.push({
      file,
      bytes: candidate.bytes,
      sha256: candidate.sha256,
      sourceKind: candidate.sourceKind,
      sourceCharacterId: candidate.sourceCharacterId,
      sourceState: candidate.sourceState,
      sourceCrop: candidate.sourceCrop ?? null,
      sourceRootFrame: candidate.sourcePlacement?.rootFrame ?? null,
      disabledAsset: null,
      statesPersisted: candidate.sourceKind === 'DefineButton2'
        ? ['up']
        : ['frame-1'],
      bytesBuffer: upstreamAsset.bytes,
    });
  }
  const navigationExtraction =
    await extractNavigationVectorStates(source.resolved);
  assets.push(...navigationExtraction.assets);
  const manifest = {
    schemaVersion: 2,
    evidenceType: 'g4-l3-shell-control-assets-source-rebind',
    animationId: SHELL.animationId,
    status: 'structural-only',
    classification:
      'hash-bound-rebind-plus-fresh-ffdec-vector-navigation-state-extraction',
    authority: {
      statement:
        'The existing PNG bytes are rebound to the exact hash-bound G4 L3 course shell, and the up, over, and down navigation vectors are freshly extracted from its byte-identical DefineButton2 340 and 342 states with FFDec 26.2.1.',
      authorityBoundary:
        'The extraction preserves static button state vectors and source placement metadata only. It does not execute ActionScript or prove runtime reachability, audio, original-runtime composition, RMSE, human review, owner acceptance, strict completion, or publication.',
      freshFfdecExtractionPerformed: true,
      actionScriptExecuted: false,
      originalRuntimeBaseline: false,
      originalRuntimeAccepted: false,
      ownerAccepted: false,
      strictCompletion: false,
      publicRelease: false,
    },
    source: SHELL,
    upstream: {
      manifest: UPSTREAM.manifest,
      manifestSha256: UPSTREAM.manifestSha256,
      carrierAnimationId: 'course-g04-l03-ts-006',
      carrierRole: 'historical-diagnostic-package-only',
      lessonShellSourceBindingVerified: true,
    },
    ffdec: {
      executable: FFDEC.executable,
      version: FFDEC.version,
      exportFormat: 'button:svg',
      selectedCharacterIds: [340, 342],
    },
    navigationControlStates: {
      sourceButtonCharacterIds: [340, 342],
      states: NAVIGATION_VECTOR_STATES.map(
        ({exportFile: _exportFile, ...state}) => state,
      ),
      sourceSpritePlacements: {
        next: {
          sourceSpriteCharacterId: 341,
          sourceButtonCharacterId: 340,
          scaleX: 0.8,
          scaleY: 0.8,
        },
        previous: {
          sourceSpriteCharacterId: 343,
          sourceButtonCharacterId: 342,
          scaleX: -0.8,
          scaleY: 0.8,
        },
      },
      hoverAnimation: {
        sourceNestedSpriteCharacterId: 119,
        fps: 12,
        frameCount: 13,
        durationMs: 13 / 12 * 1000,
        localHandTranslationX: NAVIGATION_HOVER_FRAME_OFFSETS,
        files: navigationExtraction.hoverFrameFiles,
      },
      navigationFreeChrome: navigationExtraction.navigationFreeChrome,
      implementationBoundary:
        'The shared vector states and 13-frame nested Hand timeline are rendered at 44 by 44 authored-stage pixels over a frame-49 SVG with only sprite placements 341 and 343 removed. Previous mirrors the complete vector on the x axis and Next does not.',
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
  const result = await buildG4L3ShellControlAssetsRebind();
  for (const asset of result.assets) {
    await emit(path.join(OUTPUT_DIRECTORY, asset.file), asset.bytesBuffer, mode);
  }
  await emit(
    path.join(OUTPUT_DIRECTORY, 'manifest.json'),
    result.manifestBytes,
    mode,
  );
  return {
    mode,
    outputDirectory: OUTPUT_DIRECTORY,
    animationId: SHELL.animationId,
    assetCount: result.assets.length,
    freshFfdecExtractionPerformed:
      result.manifest.authority.freshFfdecExtractionPerformed,
    strictCompletion: result.manifest.authority.strictCompletion,
    publicRelease: result.manifest.authority.publicRelease,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const result = await run(parseArguments(process.argv.slice(2)));
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
