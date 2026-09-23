import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

import {loadAnimationModule} from '../src/animation-registry';
import courseShell from '../src/modules/shell-course-g04-l01-index-local';
import {matchPrototype} from '../src/prototype-manifest';
import {
  COURSE_SHELL_G04_L01_MOVIE,
  COURSE_SHELL_G04_L01_SECTIONS,
  COURSE_SHELL_G04_L01_SOURCE,
  courseShellInteractionForScenario,
  courseShellPhaseAtFrame,
  getCourseShellFrameState,
  normalizeCourseShellFrame,
  transitionCourseShell
} from '../src/timelines/shell-course-g04-l01-index-local';

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));
const migrationRoot = `${repositoryRoot}migrations/shell-course-g04-l01-index-local`;

function sha256(bytes: Buffer | string): string {
  return createHash('sha256').update(bytes).digest('hex');
}

test('course shell preserves immutable source identity and root movie metadata', async () => {
  assert.deepEqual(COURSE_SHELL_G04_L01_MOVIE.stage, {width: 800, height: 600});
  assert.equal(COURSE_SHELL_G04_L01_MOVIE.fps, 12);
  assert.equal(COURSE_SHELL_G04_L01_MOVIE.frameCount, 50);
  assert.equal(COURSE_SHELL_G04_L01_MOVIE.durationMs, (50 * 1_000) / 12);
  assert.equal(courseShell.playbackMode, 'once');
  assert.equal(courseShell.reducedMotionFrame, 50);

  const swf = await readFile(
    `${repositoryRoot}source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L1/index_local.swf`
  );
  const xml = await readFile(
    `${repositoryRoot}source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L1/index.xml`
  );
  assert.equal(sha256(swf), COURSE_SHELL_G04_L01_SOURCE.swfSha256);
  assert.equal(sha256(xml), COURSE_SHELL_G04_L01_SOURCE.courseXmlSha256);
});

test('pure timeline keeps one-indexed boot boundaries and deterministic shell states', () => {
  assert.equal(normalizeCourseShellFrame(Number.NaN), 1);
  assert.equal(normalizeCourseShellFrame(0), 1);
  assert.equal(normalizeCourseShellFrame(49.9), 49);
  assert.equal(normalizeCourseShellFrame(51), 50);
  assert.equal(courseShellPhaseAtFrame(1), 'loading-content');
  assert.equal(courseShellPhaseAtFrame(37), 'loading-content');
  assert.equal(courseShellPhaseAtFrame(38), 'loading-layout');
  assert.equal(courseShellPhaseAtFrame(48), 'loading-layout');
  assert.equal(courseShellPhaseAtFrame(49), 'loading-page');
  assert.equal(courseShellPhaseAtFrame(50), 'ready');

  const spanishSection = getCourseShellFrameState(50, {
    lang: 'es',
    scenario: 'section-vb',
    seed: 4294967295
  });
  assert.equal(spanishSection.frame, 50);
  assert.equal(spanishSection.frameDomain, 'root');
  assert.equal(spanishSection.rootFrame, 50);
  assert.equal(spanishSection.status, 'ready');
  assert.equal(spanishSection.blocker, null);
  assert.equal(spanishSection.lessonTitle, 'Valor posicional');
  assert.equal(spanishSection.view, 'section');
  assert.equal(spanishSection.selectedSection, 'VB');
  assert.equal(spanishSection.seed, 4294967295);

  const preloader = getCourseShellFrameState(49, {
    lang: 'en',
    scenario: 'quit-confirmation',
    seed: 7
  });
  assert.equal(preloader.phase, 'loading-page');
  assert.equal(preloader.view, 'menu');
  assert.equal(preloader.selectedSection, null);
});

test('all 40 declared root endpoint probes echo exact renderer identity', () => {
  let probes = 0;
  for (const {id: scenario} of courseShell.scenarios) {
    for (const lang of ['en', 'es'] as const) {
      for (const frame of [1, 50]) {
        const state = courseShell.getFrameState(frame, {
          frame,
          frameDomain: 'root',
          rootFrame: frame,
          scenario,
          lang,
          seed: 0
        });
        assert.equal(state.frameDomain, 'root');
        assert.equal(state.frame, frame);
        assert.equal(state.rootFrame, frame);
        assert.equal(state.scenario, scenario);
        assert.equal(state.language, lang);
        assert.equal(state.status, 'ready');
        assert.equal(state.blocker, null);
        probes += 1;
      }
    }
  }
  assert.equal(probes, 40);
});

test('course sections and all 80 pages exactly follow the parsed active index.xml order', async () => {
  const inventory = JSON.parse(
    await readFile(`${migrationRoot}/audit/scenario-inventory.json`, 'utf8')
  ) as {
    courseXml: {
      sections: Array<{
        name: string;
        titles: {english: string; spanish: string};
        pages: Array<{path: string; attributes: {Title: string}}>;
      }>;
    };
  };
  assert.deepEqual(
    COURSE_SHELL_G04_L01_SECTIONS.map((section) => section.code),
    inventory.courseXml.sections.map((section) => section.name)
  );
  assert.equal(
    COURSE_SHELL_G04_L01_SECTIONS.reduce((sum, section) => sum + section.pages.length, 0),
    80
  );

  for (const [index, section] of COURSE_SHELL_G04_L01_SECTIONS.entries()) {
    const source = inventory.courseXml.sections[index]!;
    assert.equal(section.titleEnglish, source.titles.english);
    assert.equal(section.titleSpanish, source.titles.spanish);
    assert.deepEqual(
      section.pages.map((page) => [page.sourcePath, page.titleEnglish]),
      source.pages.map((page) => [page.path, page.attributes.Title])
    );
  }
});

test('every child route fails closed unless its animation is strict-complete', async () => {
  const catalog = JSON.parse(
    await readFile(`${repositoryRoot}catalog/animations.json`, 'utf8')
  ) as {
    animations: Array<{
      animationId: string;
      source: {path: string};
    }>;
  };
  const ledger = JSON.parse(
    await readFile(`${repositoryRoot}catalog/completion-ledger.json`, 'utf8')
  ) as {entries: Array<{animationId: string}>};
  const completeIds = new Set(ledger.entries.map((entry) => entry.animationId));
  const catalogByPath = new Map(
    catalog.animations.map((entry) => [entry.source.path, entry.animationId] as const)
  );
  const pages = COURSE_SHELL_G04_L01_SECTIONS.flatMap((section) => section.pages);

  for (const page of pages) {
    const fullPath = `HELP_COURSES/ELMGR4/L1/${page.sourcePath}`;
    // Source custody grew after the shell's fixed 21-member current-JS
    // projection was authored. A newly cataloged SWF is not automatically a
    // renderer registration, strict-complete page, or route admission.
    if (page.animationId) {
      assert.equal(page.animationId, catalogByPath.get(fullPath) ?? null, fullPath);
    }
    if (page.strictRoute) {
      assert.ok(page.animationId);
      assert.equal(completeIds.has(page.animationId), true);
    }
  }
  assert.equal(pages.filter((page) => page.animationId).length, 21);
  assert.equal(pages.filter((page) => page.strictRoute).length, 0);
});

test('course shell interaction state machine is explicit and Replay is deterministic', () => {
  const initial = courseShellInteractionForScenario('default');
  const section = transitionCourseShell(initial, {type: 'select-section', section: 'IN'});
  const modal = transitionCourseShell(section, {type: 'request-quit'});
  assert.deepEqual(section, {view: 'section', selectedSection: 'IN'});
  assert.deepEqual(modal, {view: 'quit-confirmation', selectedSection: 'IN'});
  assert.deepEqual(transitionCourseShell(modal, {type: 'cancel-quit'}), section);
  assert.deepEqual(transitionCourseShell(modal, {type: 'replay'}), initial);
  assert.deepEqual(courseShellInteractionForScenario('section-fq'), {
    view: 'section',
    selectedSection: 'FQ'
  });
  assert.deepEqual(courseShellInteractionForScenario('section-unknown'), initial);
});

test('renderer reports exact query state, bilingual titles, safe controls, and modal semantics', () => {
  const render = (scenario: string, lang: 'en' | 'es', frame = 50, replay = 0) => {
    const state = courseShell.getFrameState(frame, {frame, scenario, lang, seed: 17});
    return renderToStaticMarkup(
      createElement(courseShell.Renderer, {
        entryStateSha256: 'b'.repeat(64),
        frame,
        frameDomain: 'root',
        lang,
        requirementId: `req-root-${scenario}-${lang}`,
        replay,
        rootFrame: frame,
        scenario,
        seed: 17,
        state,
        traceId: `trace-root-${scenario}-${lang}`
      })
    );
  };

  const menu = render('default', 'en');
  assert.match(menu, /data-flash-frame="50"/);
  assert.match(menu, /data-flash-frame-domain="root"/);
  assert.match(menu, /data-flash-root-frame="50"/);
  assert.match(menu, /data-flash-requirement-id="req-root-default-en"/);
  assert.match(menu, /data-flash-trace-id="trace-root-default-en"/);
  assert.match(menu, /data-flash-entry-state-sha256="b{64}"/);
  assert.match(menu, /data-render-state="ready"/);
  assert.match(menu, /data-render-visual="true"/);
  assert.match(menu, /data-runtime-scenario="default"/);
  assert.match(menu, /data-runtime-seed="17"/);
  assert.match(menu, /data-shell-view="menu"/);
  assert.match(menu, /Counting on Numbers/);
  assert.match(menu, /Important Words/);
  assert.doesNotMatch(menu, /href="(?:\/es)?\/animations\//);
  assert.doesNotMatch(menu, /ruffle|\.swf/i);

  const section = render('section-vb', 'es');
  assert.match(section, /data-shell-view="section"/);
  assert.match(section, /Valor posicional/);
  assert.match(section, /Palabras importantes/);
  assert.match(section, /Pendiente de aceptación estricta/);
  assert.match(section, /Fuente no proporcionada/);

  const modal = render('quit-confirmation', 'en');
  assert.match(modal, /role="dialog"/);
  assert.match(modal, /aria-modal="true"/);
  assert.match(modal, /Are you sure you want to close/);
  assert.match(modal, /Yes \(disabled\)/);

  const loading = render('quit-confirmation', 'en', 49);
  assert.match(loading, /data-shell-phase="loading-page"/);
  assert.match(loading, /role="progressbar"/);
  assert.doesNotMatch(loading, /role="dialog"/);

  const replayedSection = render('section-in', 'en', 50, 1);
  assert.match(replayedSection, /data-shell-view="menu"/);
  assert.match(replayedSection, /Lesson sections/);
  assert.doesNotMatch(replayedSection, /course-shell-IN-title/);
});

test('prototype manifest and generated registry expose the shell by placement ID only', async () => {
  const byId = matchPrototype({animationId: 'shell-course-g04-l01-index-local'});
  assert.equal(byId?.key, 'shell-course-g04-l01-index-local');
  assert.equal(byId?.movie.stage.width, 800);
  assert.equal(byId?.title.es, 'Valor posicional');
  assert.equal(matchPrototype({sourcePath: 'HELP_COURSES/ELMGR5/L1/index_local.swf'}), undefined);

  const loaded = await loadAnimationModule('shell-course-g04-l01-index-local');
  assert.equal(loaded?.key, 'shell-course-g04-l01-index-local');
  assert.equal(loaded?.maturity, 'legacy-prototype');
  assert.deepEqual(loaded?.scenarios.map(({id}) => id), [
    'default',
    'section-ir',
    'section-rw',
    'section-vb',
    'section-in',
    'section-ti',
    'section-gs',
    'section-ts',
    'section-fq',
    'quit-confirmation'
  ]);
});
