import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_WHOLE_LESSON_HOST_PRESENTATION,
  isModernWideShellEnabled,
  resolveWholeLessonHostPresentation,
  wholeLessonContentPlane,
} from '../lib/whole-lesson-host-presentation';
import {G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR} from '../lib/g4-l3-whole-lesson-player-descriptor';
import {G5_L4_WHOLE_LESSON_PLAYER_DESCRIPTOR} from '../lib/g5-l4-whole-lesson-player-descriptor';

const AUTHORED_STAGE = Object.freeze({height: 600, width: 800});

test('the content plane is the authored stage minus the declared chrome bands', () => {
  const plane = wholeLessonContentPlane({
    stage: AUTHORED_STAGE,
    headerHeight: 109,
    footerHeight: 76,
  });
  assert.equal(plane.width, 800);
  assert.equal(plane.height, 415);
  assert.equal(plane.top, 109);
});

test('the presented band is wider than 16:9', () => {
  const plane = wholeLessonContentPlane({
    stage: AUTHORED_STAGE,
    headerHeight: 109,
    footerHeight: 76,
  });
  const aspect = plane.width / plane.height;
  assert.ok(aspect > 16 / 9, `expected ${aspect} to exceed 16/9`);
  assert.ok(Math.abs(aspect - 1.9277) < .001);
});

test('the offsets place the authored stage behind the band window', () => {
  const plane = wholeLessonContentPlane({
    stage: AUTHORED_STAGE,
    headerHeight: 109,
    footerHeight: 76,
  });
  // 600 / 415 and -109 / 415, expressed as percentages of the band.
  assert.ok(Math.abs(plane.stageHeightPercent - 144.5783) < .001);
  assert.ok(Math.abs(plane.stageTopPercent - -26.2651) < .001);
  // The band's top edge must land exactly on the authored header height.
  const stageHeightInBandUnits = plane.stageHeightPercent / 100 * plane.height;
  const topInBandUnits = -plane.stageTopPercent / 100 * plane.height;
  assert.ok(Math.abs(stageHeightInBandUnits - AUTHORED_STAGE.height) < 1e-9);
  assert.ok(Math.abs(topInBandUnits - 109) < 1e-9);
});

test('the plane is derived from the G4 L3 descriptor, not restated', () => {
  const skin = G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.visualSkin;
  const plane = wholeLessonContentPlane({
    stage: G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.stage,
    headerHeight: skin.header.height,
    footerHeight: skin.footer.height,
  });
  assert.equal(plane.height, 600 - skin.header.height - skin.footer.height);
  assert.equal(plane.height, 415);
  assert.equal(plane.top, skin.header.height);
});

test('a stage fully consumed by chrome is rejected rather than inverted', () => {
  assert.throws(
    () => wholeLessonContentPlane({
      stage: AUTHORED_STAGE,
      headerHeight: 400,
      footerHeight: 200,
    }),
    /no content band remains/,
  );
});

test('non-finite and negative geometry is rejected', () => {
  assert.throws(() => wholeLessonContentPlane({
    stage: {height: 600, width: 0},
    headerHeight: 109,
    footerHeight: 76,
  }), /stage\.width/);
  assert.throws(() => wholeLessonContentPlane({
    stage: AUTHORED_STAGE,
    headerHeight: -1,
    footerHeight: 76,
  }), /headerHeight/);
  assert.throws(() => wholeLessonContentPlane({
    stage: AUTHORED_STAGE,
    headerHeight: 109,
    footerHeight: Number.NaN,
  }), /footerHeight/);
});

test('a lesson renders modern-wide only when it declares it and the flag is set', () => {
  const declared = ['legacy-composite', 'modern-wide'] as const;
  assert.equal(
    resolveWholeLessonHostPresentation({declared, enabled: true}),
    'modern-wide',
  );
  assert.equal(
    resolveWholeLessonHostPresentation({declared, enabled: false}),
    'legacy-composite',
  );
  assert.equal(
    resolveWholeLessonHostPresentation({
      declared: ['legacy-composite'],
      enabled: true,
    }),
    'legacy-composite',
  );
  assert.equal(
    resolveWholeLessonHostPresentation({declared: undefined, enabled: true}),
    'legacy-composite',
  );
});

test('the legacy composite is the default presentation', () => {
  assert.equal(DEFAULT_WHOLE_LESSON_HOST_PRESENTATION, 'legacy-composite');
});

test('the widescreen shell stays off unless the deployment opts in', () => {
  assert.equal(isModernWideShellEnabled({}), false);
  assert.equal(isModernWideShellEnabled({MODERN_WIDE_SHELL_ENABLED: 'false'}), false);
  assert.equal(isModernWideShellEnabled({MODERN_WIDE_SHELL_ENABLED: '1'}), false);
  assert.equal(isModernWideShellEnabled({MODERN_WIDE_SHELL_ENABLED: 'TRUE'}), false);
  assert.equal(isModernWideShellEnabled({MODERN_WIDE_SHELL_ENABLED: 'true'}), true);
});

test('G4 L3 is the declared widescreen pilot', () => {
  assert.deepEqual(
    [...(G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.visualSkin.presentations ?? [])],
    ['legacy-composite', 'modern-wide'],
  );
});

test('G5 L4 has not been admitted to the widescreen presentation yet', () => {
  // The descriptor-only gate in the rollout plan: turning G5 L4 on must be a
  // change to its own descriptor and nothing else. Until that review happens it
  // must not inherit the presentation from the shared shell.
  const descriptor = G5_L4_WHOLE_LESSON_PLAYER_DESCRIPTOR;
  assert.ok(descriptor, 'G5 L4 descriptor should be constructible');
  const declared = descriptor.visualSkin.presentations;
  assert.equal(
    resolveWholeLessonHostPresentation({declared, enabled: true}),
    'legacy-composite',
  );
});

test('declaring a presentation confers no acceptance', () => {
  // The widescreen presentation is a host decision. Every acceptance gate on
  // the pilot lesson must read exactly as it did before.
  const skin = G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.visualSkin;
  assert.equal(skin.kind, 'legacy-composite');
  assert.equal(skin.evidence.kind, 'ffdec-static-structural-candidate');
  assert.equal(
    skin.layoutId,
    'help-math-course-shell-800x600-v1',
  );
  assert.equal(G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.stage.width, 800);
  assert.equal(G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.stage.height, 600);
});

test('the widescreen control bar ranks controls instead of levelling them', async () => {
  const {readFile} = await import('node:fs/promises');
  const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');
  const block = css.slice(css.indexOf('   Control hierarchy.'));
  const orderOf = (needle: string) => {
    const at = block.indexOf(needle);
    assert.notEqual(at, -1, `${needle} is not ranked in the control hierarchy`);
    const decl = block.slice(at).match(/order:\s*(\d+);/);
    assert.ok(decl, `${needle} has no order declaration`);
    return Number(decl![1]);
  };

  const pause = orderOf("[data-responsive-focus-key='pause']");
  const secondary = orderOf("[data-responsive-focus-key='mute']");
  const lookup = orderOf("[data-responsive-focus-key='exit']");
  const instrument = orderOf('.lesson-shell2__modern-transport-summary');

  assert.ok(pause < secondary, 'moving the lesson outranks adjusting playback');
  assert.ok(secondary < lookup, 'adjusting playback outranks looking things up');
  assert.ok(lookup < instrument, 'every learner control outranks audit tooling');

  // The auto-fit grid is what made thirteen controls look equally important.
  assert.match(block, /\.lesson-shell2__modern-toolbar \{[\s\S]*?display: flex;/);
  assert.match(block, /\.lesson-shell2__modern-toolbar \{[\s\S]*?grid-template-columns: none;/);
});

test('progress is reported exactly once in the widescreen presentation', async () => {
  const {readFile} = await import('node:fs/promises');
  const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');
  const widescreen = css
    .split('}')
    .filter((rule) => rule.includes("[data-host-presentation='modern-wide']"));
  assert.ok(widescreen.length > 0, 'no widescreen rules found');

  const showsBarProgress = widescreen.some((rule) =>
    rule.includes('modern-completion') &&
    /display:\s*(?:grid|flex|block|inline-flex)/.test(rule));
  const hidesSessionBar = widescreen.some((rule) =>
    rule.includes('session-bar') && /display:\s*none/.test(rule));

  // The two must move together. Showing the bar meter while the session bar
  // still reports progress is the duplication this presentation removes;
  // hiding the session bar without the bar meter loses progress entirely.
  assert.equal(
    showsBarProgress,
    hidesSessionBar,
    'the control-bar meter and the hidden session bar must be introduced together',
  );
  assert.ok(showsBarProgress, 'the widescreen bar must carry the progress meter');
});

test('reading support keeps a reading measure instead of the plane width', async () => {
  const {readFile} = await import('node:fs/promises');
  const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');
  const rule = css
    .split('}')
    .find((candidate) =>
      candidate.includes("[data-host-presentation='modern-wide']") &&
      candidate.includes('lesson-shell2__learning-support') &&
      candidate.includes('max-width'));
  assert.ok(rule, 'the widescreen support region must bound its measure');
  assert.match(rule!, /max-width:\s*\d+ch/);
});
