import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  buildG4L3McBackTextHostComposite,
  parseArguments,
} from './build-g4-l3-mc-back-text-host-composite.mjs';

test('Mc_BackText host composite is source-bound and acceptance-neutral', async () => {
  const result = await buildG4L3McBackTextHostComposite();
  const manifest = result.manifest;

  assert.equal(
    manifest.shellSource.sha256,
    '817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e',
  );
  assert.equal(
    manifest.courseXml.sha256,
    '0f1109321a5b65507c36fb8fd30380c4899cb7f381c2959aa7092d59bba990b0',
  );
  assert.deepEqual(
    manifest.courseXml.activeBackgroundTextSourcePages,
    ['IR/L3RW01.swf'],
  );
  assert.deepEqual(
    manifest.courseXml.activeBackgroundTextAnimationIds,
    ['course-g04-l03-ir-001-341242cc'],
  );
  assert.equal(manifest.sprite.characterId, 584);
  assert.equal(manifest.sprite.instanceName, 'Mc_BackText');
  assert.equal(manifest.sprite.rootFrame, 50);
  assert.equal(manifest.sprite.rootDepth, 5);
  assert.deepEqual(manifest.sprite.rootPlacementPixels, {
    x: 397.45,
    y: 319.65,
  });
  assert.deepEqual(manifest.sprite.contentBounds, {
    x: 28.8,
    y: 157.15,
    width: 762.1,
    height: 324.8,
  });
  assert.equal(manifest.sprite.bakedOutputColor, '#333333');
  assert.equal(manifest.sprite.bakedOutputOpacity, 23 / 256);
  assert.equal(manifest.pagePlane.rootDepth, 47);
  assert.deepEqual(manifest.pagePlane.rootPlacementPixels, {
    x: -12.5,
    y: 33.3,
  });
  assert.equal(
    manifest.introductionLoadedSwfHost.backgroundDisposition,
    'ignore-loaded-child-swf-standalone-stage-background',
  );
  assert.equal(manifest.assets.length, 2);
  assert.ok(manifest.assets.every(
    (asset) => /^[a-f0-9]{64}$/.test(asset.sha256) && asset.bytes > 0,
  ));
  assert.deepEqual(manifest.authority, {
    statement: manifest.authority.statement,
    authorityBoundary: manifest.authority.authorityBoundary,
    actionScriptExecuted: false,
    originalRuntimeBaseline: false,
    originalRuntimeAccepted: false,
    humanVisualReviewAccepted: false,
    ownerAccepted: false,
    strictCompletion: false,
    publicRelease: false,
  });
  assert.equal(manifest.strictAcceptanceEffect, 'none');

  const background = result.assets.find(
    (asset) => asset.file === 'lesson-shell-mc-back-text.svg',
  );
  assert.ok(background);
  const backgroundText = background.bytesBuffer.toString('utf8');
  assert.match(backgroundText, /viewBox="0 0 800 600"/);
  assert.match(backgroundText, /data-source-character-id="584"/);
  assert.match(backgroundText, /opacity="0\.08984375"/);
  assert.match(
    backgroundText,
    /matrix\(1\.0, 0\.0, 0\.0, 1\.0, 397\.45, 319\.65\)/,
  );
  assert.doesNotMatch(backgroundText, /fill="#cccccc"|fill="#000000"/);

  const loadedSwf = result.assets.find(
    (asset) =>
      asset.file ===
        'course-g04-l03-ir-001-loaded-swf-canvas-renderer.js',
  );
  assert.ok(loadedSwf);
  const loadedSwfText = loadedSwf.bytesBuffer.toString('utf8');
  assert.match(
    loadedSwfText,
    /ctx\.clearRect\(0, 0, targetCanvas\.width, targetCanvas\.height\)/,
  );
  assert.doesNotMatch(
    loadedSwfText,
    /ctx\.fillStyle = "#b8d8f7";\s*ctx\.fillRect\(0, 0, targetCanvas\.width, targetCanvas\.height\)/,
  );
  assert.match(
    loadedSwfText,
    /registry\["course-g04-l03-ir-001-341242cc-loaded-swf-host"\]/,
  );
  assert.match(
    loadedSwfText,
    /ctx\.transform\(1, 0, 0, 1, -12\.5, 33\.3\);\s*ctx\.transform\(1, 0, 0, 1, -124\.5, 98\.5\);/,
  );

  const standalone = await readFile(
    new URL(
      '../public/flash-assets/courses/course-g04-l03-ir-001-341242cc/canvas-renderer.js',
      import.meta.url,
    ),
    'utf8',
  );
  assert.match(
    standalone,
    /ctx\.fillStyle = "#b8d8f7";\s*ctx\.fillRect\(0, 0, targetCanvas\.width, targetCanvas\.height\)/,
  );
  assert.doesNotMatch(
    standalone,
    /course-g04-l03-ir-001-341242cc-loaded-swf-host/,
  );
  assert.doesNotMatch(
    standalone,
    /ctx\.transform\(1, 0, 0, 1, -12\.5, 33\.3\)/,
  );
});

test('Mc_BackText generator modes are explicit and fail closed', () => {
  assert.deepEqual(parseArguments([]), {mode: 'dry-run'});
  assert.deepEqual(parseArguments(['--write']), {mode: 'write'});
  assert.deepEqual(parseArguments(['--check']), {mode: 'check'});
  assert.throws(
    () => parseArguments(['--write', '--check']),
    /choose exactly one mode/,
  );
  assert.throws(() => parseArguments(['--unknown']), /unknown argument/);
});
