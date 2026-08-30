import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LEGACY_COMPACT_LANDSCAPE_MAX_WIDTH,
  LEGACY_COMPACT_HEIGHT_MAX,
  LEGACY_LESSON_LAYOUT_CONTRACT,
  LEGACY_MAP_RAIL_MIN_WIDTH,
  LEGACY_TOOL_RAIL_MIN_WIDTH,
  LEGACY_WIDE_FUNCTIONAL_MIN_WIDTH,
  MODERN_WIDE_MIN_PLANE_WIDTH,
  resolveLegacyLessonLayout,
} from '../lib/legacy-lesson-layout';

const AUTHORED_STAGE = Object.freeze({height: 600, width: 800});

function policy(
  containerWidth: number,
  viewportHeight: number,
  stageTop = 180,
) {
  return resolveLegacyLessonLayout({
    authoredStage: AUTHORED_STAGE,
    containerWidth,
    stageTop,
    viewportHeight,
    viewportWidth: containerWidth,
  });
}

test('layout contract names the native-stage plus modern-rail strategy', () => {
  assert.equal(
    LEGACY_LESSON_LAYOUT_CONTRACT,
    'native-stage-with-adaptive-functional-rails-v1',
  );
  assert.equal(LEGACY_WIDE_FUNCTIONAL_MIN_WIDTH, 1280);
  assert.equal(LEGACY_MAP_RAIL_MIN_WIDTH, 1600);
  assert.equal(LEGACY_TOOL_RAIL_MIN_WIDTH, 1800);
  assert.equal(LEGACY_COMPACT_HEIGHT_MAX, 880);
  assert.equal(LEGACY_COMPACT_LANDSCAPE_MAX_WIDTH, 1279);
});

test('ordinary and short wide screens preserve the native 800 by 600 stage', () => {
  for (const [width, height] of [
    [1280, 900],
    [1366, 768],
    [1440, 900],
    [1536, 864],
    [1920, 1080],
  ]) {
    const resolved = policy(width, height, 260);
    assert.equal(resolved.layoutMode, 'wide-functional');
    assert.equal(
      resolved.mapPresentation,
      width >= LEGACY_MAP_RAIL_MIN_WIDTH ? 'rail' : 'overlay',
    );
    assert.equal(resolved.stageCapWidth, 800);
  }
});

test('map and tool rails switch only when their complete geometry fits', () => {
  const beforeWide = policy(1279, 900);
  const wideCompanion = policy(1280, 900);
  const beforeMap = policy(1599, 900);
  const mapRail = policy(1600, 900);
  const beforeTool = policy(1799, 1000);
  const toolRail = policy(1800, 1000);

  assert.equal(beforeWide.layoutMode, 'legacy-native');
  assert.equal(wideCompanion.layoutMode, 'wide-functional');
  assert.equal(beforeMap.mapPresentation, 'overlay');
  assert.equal(mapRail.mapPresentation, 'rail');
  assert.equal(beforeTool.toolPresentation, 'overlay');
  assert.equal(toolRail.toolPresentation, 'rail');
});

test('short wide workspaces compact only modern chrome around the native stage', () => {
  const shortWide = policy(1366, 768, 260);
  const commonWide = policy(1536, 864, 260);
  const boundary = policy(1366, 880, 260);
  const comfortable = policy(1366, 881, 260);

  assert.equal(shortWide.layoutMode, 'wide-functional');
  assert.equal(shortWide.stageCapWidth, 800);
  assert.equal(shortWide.workspaceDensity, 'compact-height');
  assert.equal(commonWide.workspaceDensity, 'compact-height');
  assert.equal(boundary.workspaceDensity, 'compact-height');
  assert.equal(comfortable.workspaceDensity, 'comfortable');
});

test('720p and nearby short-wide displays never downscale the authored stage', () => {
  for (const [width, height] of [
    [1280, 720],
    [1366, 768],
  ]) {
    const resolved = policy(width, height, 128);

    assert.equal(resolved.layoutMode, 'wide-functional');
    assert.equal(resolved.workspaceDensity, 'compact-height');
    assert.equal(resolved.mapPresentation, 'overlay');
    assert.equal(resolved.toolPresentation, 'overlay');
    assert.equal(resolved.stageCapWidth, 800);
  }
});

test('compact landscape alone uses remaining height and a modern control column', () => {
  const resolved = policy(720, 450, 110);
  assert.deepEqual(resolved, {
    compactLandscape: true,
    containerWidth: 720,
    layoutMode: 'compact',
    mapPresentation: 'overlay',
    stageCapWidth: 420,
    toolPresentation: 'overlay',
    workspaceDensity: 'comfortable',
  });

  const portrait = policy(390, 844, 110);
  assert.equal(portrait.compactLandscape, false);
  assert.equal(portrait.layoutMode, 'compact');
  assert.equal(portrait.stageCapWidth, 800);
  assert.equal(portrait.workspaceDensity, 'comfortable');
});

test('compact landscape media boundaries match the functional shell contract', () => {
  for (const [width, height] of [
    [681, 500],
    [844, 390],
    [1024, 500],
    [1179, 500],
    [1180, 500],
    [1279, 500],
  ]) {
    assert.equal(policy(width, height, 20).compactLandscape, true);
  }

  assert.equal(policy(680, 500, 20).compactLandscape, false);
  assert.equal(policy(1280, 500, 20).compactLandscape, false);
  assert.equal(policy(1280, 500, 20).layoutMode, 'wide-functional');
  assert.equal(policy(1280, 500, 20).stageCapWidth, 800);
});

test('invalid geometry fails before it can silently distort the stage', () => {
  assert.throws(() => policy(0, 900), /containerWidth/);
  assert.throws(
    () => resolveLegacyLessonLayout({
      authoredStage: {height: 0, width: 800},
      containerWidth: 1366,
      stageTop: 100,
      viewportHeight: 768,
      viewportWidth: 1366,
    }),
    /authoredStage\.height/,
  );
  assert.throws(
    () => resolveLegacyLessonLayout({
      authoredStage: AUTHORED_STAGE,
      containerWidth: 1366,
      stageTop: Number.NaN,
      viewportHeight: 768,
      viewportWidth: 1366,
    }),
    /stageTop/,
  );
});

const PRESENTED_PLANE = Object.freeze({height: 415, width: 800});

function widePolicy(
  containerWidth: number,
  viewportHeight: number,
  viewportWidth: number,
  stageTop = 150,
) {
  return resolveLegacyLessonLayout({
    authoredStage: AUTHORED_STAGE,
    containerWidth,
    presentedPlane: PRESENTED_PLANE,
    stageTop,
    viewportHeight,
    viewportWidth,
  });
}

test('a presented plane grows past the authored 800px cap', () => {
  const policy = widePolicy(1709, 1080, 1920);
  assert.ok(
    policy.stageCapWidth > AUTHORED_STAGE.width,
    `expected the plane to exceed 800px, got ${policy.stageCapWidth}`,
  );
});

test('remaining viewport height binds the presented plane', () => {
  // 1080 - 150 top - 132 reserve = 798 available; 798 * 800/415 = 1538.
  const policy = widePolicy(1709, 1080, 1920);
  assert.equal(policy.stageCapWidth, 1538);
});

test('container width binds the presented plane when height is generous', () => {
  const policy = widePolicy(1200, 2000, 1920);
  assert.equal(policy.stageCapWidth, 1200);
});

test('the presented plane never resolves below its floor', () => {
  const policy = widePolicy(120, 200, 360, 180);
  assert.equal(policy.stageCapWidth, MODERN_WIDE_MIN_PLANE_WIDTH);
});

test('the presented plane keeps its aspect at every breakpoint', () => {
  for (const [w, h] of [[1920, 1080], [1600, 900], [1440, 900], [1366, 768], [1280, 800]]) {
    const policy = widePolicy(w - 220, h, w);
    const planeHeight = policy.stageCapWidth * (PRESENTED_PLANE.height / PRESENTED_PLANE.width);
    const available = h - 150 - 132;
    assert.ok(
      planeHeight <= available + 1,
      `${w}x${h}: plane height ${planeHeight} exceeded available ${available}`,
    );
    assert.ok(policy.stageCapWidth >= MODERN_WIDE_MIN_PLANE_WIDTH);
  }
});

test('omitting the presented plane preserves the native-stage policy exactly', () => {
  const native = policy(1200, 1080);
  assert.equal(native.stageCapWidth, AUTHORED_STAGE.width);
});

test('a presented plane keeps the course map on demand rather than as a rail', () => {
  // The section spine occupies the rail slot, so a second permanent column
  // would push the plane narrower for no gain. The map must stay reachable as
  // an overlay at every width.
  for (const width of [1280, 1600, 1920, 2560]) {
    const policy = widePolicy(width - 220, 1080, width);
    assert.equal(
      policy.mapPresentation,
      'overlay',
      `${width}: map must be an overlay when a plane is presented`,
    );
  }
  // Without a presented plane the legacy rail behaviour is untouched: the rail
  // still appears at and above its own threshold, and not below it.
  assert.equal(policy(LEGACY_MAP_RAIL_MIN_WIDTH, 1080).mapPresentation, 'rail');
  assert.equal(policy(LEGACY_MAP_RAIL_MIN_WIDTH - 1, 1080).mapPresentation, 'overlay');
});
