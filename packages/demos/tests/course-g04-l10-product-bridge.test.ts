import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

import fq001 from '../src/modules/course-g04-l10-fq-001';
import ir001, {
  COURSE_G04_L10_IR_001_PRIVATE_AUDIO_CUES,
} from '../src/modules/course-g04-l10-ir-001';
import rw004, {
  COURSE_G04_L10_RW_004_GLOSSARY_TERMS,
} from '../src/modules/course-g04-l10-rw-004';
import vb002, {
  COURSE_G04_L10_VB_002_GLOSSARY_TERMS,
  COURSE_G04_L10_VB_002_PRIVATE_AUDIO_CUES,
} from '../src/modules/course-g04-l10-vb-002';
import vb003, {
  COURSE_G04_L10_VB_003_GLOSSARY_TERMS,
} from '../src/modules/course-g04-l10-vb-003';
import vb004, {
  COURSE_G04_L10_VB_004_GLOSSARY_TERMS,
} from '../src/modules/course-g04-l10-vb-004';
import vb005, {
  COURSE_G04_L10_VB_005_GLOSSARY_TERMS,
} from '../src/modules/course-g04-l10-vb-005';
import vb008, {
  COURSE_G04_L10_VB_008_GLOSSARY_TERMS,
} from '../src/modules/course-g04-l10-vb-008';
import vb010, {
  COURSE_G04_L10_VB_010_GLOSSARY_TERMS,
} from '../src/modules/course-g04-l10-vb-010';
import vb011, {
  COURSE_G04_L10_VB_011_GLOSSARY_TERMS,
} from '../src/modules/course-g04-l10-vb-011';
import ts002, {
  COURSE_G04_L10_TS_002_GLOSSARY_TERMS,
} from '../src/modules/course-g04-l10-ts-002';
import ts005, {
  COURSE_G04_L10_TS_005_GLOSSARY_TERMS,
  COURSE_G04_L10_TS_005_PRIVATE_AUDIO_CUES,
} from '../src/modules/course-g04-l10-ts-005';
import {createPrivateSourceStaticGlossaryCandidate} from '../src/private-source-static-glossary-candidate';
import {COURSE_G04_L10_VB_011_CONFIG} from '../src/timelines/course-g04-l10-vb-011';
import {audioCueMatchesContext} from '../src/runtime';

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));

test('the twelve maintained visual candidates expose private-current-js bridge maturity', () => {
  assert.deepEqual(
    [ir001, rw004, vb002, vb003, vb004, vb005, vb008, vb010, vb011, ts002, ts005, fq001].map((module) => module.maturity),
    [
      'private-current-js',
      'private-current-js',
      'private-current-js',
      'private-current-js',
      'private-current-js',
      'private-current-js',
      'private-current-js',
      'private-current-js',
      'private-current-js',
      'private-current-js',
      'private-current-js',
      'private-current-js',
    ],
  );
  for (const module of [rw004, vb002, vb003, vb004, vb005, vb008, vb010, vb011, ts002, ts005]) {
    assert.deepEqual(module.lessonHost, {
      capabilities: ['glossary'],
      legacyOperations: 'blocked',
      auditStorage: 'memory-only',
      storesPersonalData: false,
    });
  }

  const irMarkup = renderToStaticMarkup(createElement(ir001.Renderer, {
    frame: 1,
    frameDomain: 'sprite-31',
    scenario: 'source-static-frame',
    lang: 'en',
    seed: 1,
  }));
  assert.match(irMarkup, /data-private-current-js="true"/);
  assert.match(irMarkup, /data-complexity-lane="behavior-heavy"/);
  assert.match(irMarkup, /data-random-selection="seed-modulo-2-remainder-1"/);

  const rw004Markup = renderToStaticMarkup(createElement(rw004.Renderer, {
    frame: 818,
    frameDomain: 'sprite-109',
    scenario: 'source-static-frame',
    lang: 'en',
    seed: 0,
    uiLanguage: 'es',
  }));
  assert.match(rw004Markup, /data-complexity-lane="interactive-understood"/);
  assert.match(rw004Markup, /data-legacy-click-record="blocked"/);
  assert.match(rw004Markup, /Perímetro/);
  assert.match(rw004Markup, /Pie \(pies\)/);
  assert.match(rw004Markup, /Área/);

  const vb002Markup = renderToStaticMarkup(createElement(vb002.Renderer, {
    frame: 174,
    frameDomain: 'sprite-84',
    scenario: 'source-static-frame',
    lang: 'en',
    seed: 0,
    uiLanguage: 'es',
  }));
  assert.match(vb002Markup, /data-complexity-lane="interactive-understood"/);
  assert.match(vb002Markup, /data-legacy-click-record="blocked"/);
  assert.match(vb002Markup, /Medir/);
  assert.match(vb002Markup, /Unidad de medición/);
  assert.match(vb002Markup, /Tiempo/);
  assert.match(vb002Markup, /Anchura/);
  assert.match(vb002Markup, /Longitud/);
  assert.match(vb002Markup, /Peso/);
  assert.match(vb002Markup, /Capacidad/);
  assert.match(vb002Markup, /Medición/);

  const vbMarkup = renderToStaticMarkup(createElement(vb003.Renderer, {
    frame: 51,
    frameDomain: 'sprite-120',
    scenario: 'source-static-frame',
    lang: 'en',
    seed: 0,
    uiLanguage: 'es',
  }));
  assert.match(vbMarkup, /data-complexity-lane="interactive-understood"/);
  assert.match(vbMarkup, /Unidad de medición/);
  assert.match(vbMarkup, /Cantidad/);
  assert.match(vbMarkup, /Longitud/);

  const vb004Markup = renderToStaticMarkup(createElement(vb004.Renderer, {
    frame: 4,
    frameDomain: 'sprite-45',
    scenario: 'source-static-frame',
    lang: 'en',
    seed: 0,
    uiLanguage: 'es',
  }));
  assert.match(vb004Markup, /data-complexity-lane="interactive-understood"/);
  assert.match(vb004Markup, /data-legacy-click-record="blocked"/);
  assert.match(vb004Markup, /Longitud/);
  assert.match(vb004Markup, /Medir/);
  assert.match(vb004Markup, /Distancia/);

  const vb005Markup = renderToStaticMarkup(createElement(vb005.Renderer, {
    frame: 4,
    frameDomain: 'sprite-44',
    scenario: 'source-static-frame',
    lang: 'en',
    seed: 0,
    uiLanguage: 'es',
  }));
  assert.match(vb005Markup, /data-complexity-lane="interactive-understood"/);
  assert.match(vb005Markup, /data-legacy-click-record="blocked"/);
  assert.match(vb005Markup, /Anchura/);
  assert.match(vb005Markup, /Medir/);
  assert.match(vb005Markup, /Distancia/);
  assert.match(vb005Markup, /Lado/);
  assert.match(vb005Markup, /Forma/);

  const vb008Markup = renderToStaticMarkup(createElement(vb008.Renderer, {
    frame: 383,
    frameDomain: 'sprite-62',
    scenario: 'source-static-frame',
    lang: 'en',
    seed: 0,
    uiLanguage: 'es',
  }));
  assert.match(vb008Markup, /data-complexity-lane="interactive-understood"/);
  assert.match(vb008Markup, /data-legacy-click-record="blocked"/);
  assert.match(vb008Markup, /Perímetro/);
  assert.match(vb008Markup, /Distancia/);
  assert.match(vb008Markup, /Alrededor/);
  assert.match(vb008Markup, /Forma/);
  assert.match(vb008Markup, /Rectángulo/);
  assert.match(vb008Markup, /Unidad de medición/);
  assert.match(vb008Markup, /Medir/);
  assert.match(vb008Markup, /Lado/);

  const vb010Markup = renderToStaticMarkup(createElement(vb010.Renderer, {
    frame: 63,
    frameDomain: 'sprite-36',
    scenario: 'source-static-frame',
    lang: 'en',
    seed: 0,
    uiLanguage: 'es',
  }));
  assert.match(vb010Markup, /data-complexity-lane="interactive-understood"/);
  assert.match(vb010Markup, /data-legacy-click-record="blocked"/);
  assert.match(vb010Markup, /Unidad cuadrada/);
  assert.match(vb010Markup, /Cuadrado/);
  assert.match(vb010Markup, /Medir/);
  assert.match(vb010Markup, /Unidad/);
  assert.match(vb010Markup, /Área/);

  const vb011Markup = renderToStaticMarkup(createElement(vb011.Renderer, {
    frame: 4,
    frameDomain: 'sprite-31',
    scenario: 'source-static-frame',
    lang: 'en',
    seed: 0,
    uiLanguage: 'es',
  }));
  assert.match(vb011Markup, /data-complexity-lane="interactive-understood"/);
  assert.match(vb011Markup, /data-legacy-click-record="blocked"/);
  assert.match(vb011Markup, /Fórmula/);
  assert.match(vb011Markup, /Ecuaciòn/);

  const ts002Markup = renderToStaticMarkup(createElement(ts002.Renderer, {
    frame: 142,
    frameDomain: 'sprite-29',
    scenario: 'source-static-frame',
    lang: 'en',
    seed: 0,
    uiLanguage: 'es',
  }));
  assert.match(ts002Markup, /data-complexity-lane="interactive-understood"/);
  assert.match(ts002Markup, /data-legacy-click-record="blocked"/);
  assert.match(ts002Markup, /Replantear/);
  assert.match(ts002Markup, /Pregunta/);
  assert.match(ts002Markup, /Problema/);

  const ts005Markup = renderToStaticMarkup(createElement(ts005.Renderer, {
    frame: 144,
    frameDomain: 'sprite-32',
    scenario: 'source-static-frame',
    lang: 'en',
    seed: 0,
    uiLanguage: 'es',
  }));
  assert.match(ts005Markup, /data-complexity-lane="interactive-understood"/);
  assert.match(ts005Markup, /data-legacy-click-record="blocked"/);
  assert.match(ts005Markup, /Estrategia/);
  assert.match(ts005Markup, /Ecuaciòn/);
  assert.match(ts005Markup, /Patrón/);
  assert.match(ts005Markup, /Simple \/ Más Simple \/ El Más Simple/);
  assert.match(ts005Markup, /Cuadro/);

  const fqMarkup = renderToStaticMarkup(createElement(fq001.Renderer, {
    frame: 1,
    frameDomain: 'sprite-50',
    scenario: 'source-static-frame',
    lang: 'en',
    seed: 0,
  }));
  assert.match(fqMarkup, /data-complexity-lane="low"/);
  assert.match(fqMarkup, /data-reachable-source-interaction="none"/);
  assert.match(
    fqMarkup,
    /data-source-exported-scrollbar-reachability="not-proven-by-root-placement-graph"/,
  );
});

test('VB003 exposes exactly the three source release-handler terms', () => {
  assert.deepEqual(COURSE_G04_L10_VB_003_GLOSSARY_TERMS.map((term) => ({
    key: term.sourceKeyAttribute,
    characterId: term.sourceCharacterId,
    firstFrame: term.firstFrame,
  })), [
    {key: 'Unit of measurement', characterId: 10, firstFrame: 3},
    {key: 'Quantity', characterId: 11, firstFrame: 3},
    {key: 'Length', characterId: 15, firstFrame: 51},
  ]);
});

test('VB002 exposes exactly its eight source release-handler terms', () => {
  assert.deepEqual(COURSE_G04_L10_VB_002_GLOSSARY_TERMS.map((term) => ({
    key: term.sourceKeyAttribute,
    characterId: term.sourceCharacterId,
    firstFrame: term.firstFrame,
  })), [
    {key: 'Measure', characterId: 10, firstFrame: 4},
    {key: 'Unit of measurement', characterId: 17, firstFrame: 69},
    {key: 'Time', characterId: 18, firstFrame: 69},
    {key: 'Width', characterId: 19, firstFrame: 69},
    {key: 'Length', characterId: 20, firstFrame: 69},
    {key: 'Weight', characterId: 21, firstFrame: 69},
    {key: 'Capacity', characterId: 22, firstFrame: 69},
    {key: 'Measurement', characterId: 31, firstFrame: 174},
  ]);
});

test('VB008 exposes exactly its eight source release-handler terms', () => {
  assert.deepEqual(COURSE_G04_L10_VB_008_GLOSSARY_TERMS.map((term) => ({
    key: term.sourceKeyAttribute,
    characterId: term.sourceCharacterId,
    firstFrame: term.firstFrame,
  })), [
    {key: 'Perimeter', characterId: 10, firstFrame: 4},
    {key: 'Distance', characterId: 11, firstFrame: 4},
    {key: 'Around', characterId: 12, firstFrame: 4},
    {key: 'Shape', characterId: 13, firstFrame: 4},
    {key: 'Rectangle', characterId: 50, firstFrame: 265},
    {key: 'Unit of measurement', characterId: 53, firstFrame: 329},
    {key: 'Measure', characterId: 59, firstFrame: 383},
    {key: 'Side', characterId: 60, firstFrame: 383},
  ]);
});

test('RW004 exposes exactly the three source release-handler terms', () => {
  assert.deepEqual(COURSE_G04_L10_RW_004_GLOSSARY_TERMS.map((term) => ({
    key: term.sourceKeyAttribute,
    characterId: term.sourceCharacterId,
    firstFrame: term.firstFrame,
  })), [
    {key: 'Perimeter', characterId: 16, firstFrame: 136},
    {key: 'Foot/Feet', characterId: 67, firstFrame: 751},
    {key: 'Area', characterId: 72, firstFrame: 818},
  ]);
});

test('VB011 exposes exactly the two frame-4 source release-handler terms', () => {
  assert.deepEqual(COURSE_G04_L10_VB_011_GLOSSARY_TERMS.map((term) => ({
    key: term.sourceKeyAttribute,
    characterId: term.sourceCharacterId,
    firstFrame: term.firstFrame,
  })), [
    {key: 'Formula', characterId: 10, firstFrame: 4},
    {key: 'Equation', characterId: 11, firstFrame: 4},
  ]);
});

test('VB004 exposes exactly the three frame-4 source release-handler terms', () => {
  assert.deepEqual(COURSE_G04_L10_VB_004_GLOSSARY_TERMS.map((term) => ({
    key: term.sourceKeyAttribute,
    characterId: term.sourceCharacterId,
    firstFrame: term.firstFrame,
  })), [
    {key: 'Length', characterId: 10, firstFrame: 4},
    {key: 'Measure', characterId: 11, firstFrame: 4},
    {key: 'Distance', characterId: 12, firstFrame: 4},
  ]);
});

test('VB010 exposes exactly its five source release-handler terms', () => {
  assert.deepEqual(COURSE_G04_L10_VB_010_GLOSSARY_TERMS.map((term) => ({
    key: term.sourceKeyAttribute,
    characterId: term.sourceCharacterId,
    firstFrame: term.firstFrame,
  })), [
    {key: 'Square unit', characterId: 10, firstFrame: 4},
    {key: 'Square', characterId: 11, firstFrame: 4},
    {key: 'Measure', characterId: 12, firstFrame: 4},
    {key: 'Unit', characterId: 13, firstFrame: 4},
    {key: 'Area', characterId: 33, firstFrame: 63},
  ]);
});

test('VB005 exposes exactly its five frame-4 source release-handler terms', () => {
  assert.deepEqual(COURSE_G04_L10_VB_005_GLOSSARY_TERMS.map((term) => ({
    key: term.sourceKeyAttribute,
    characterId: term.sourceCharacterId,
    firstFrame: term.firstFrame,
  })), [
    {key: 'Width', characterId: 10, firstFrame: 4},
    {key: 'Measure', characterId: 11, firstFrame: 4},
    {key: 'Distance', characterId: 12, firstFrame: 4},
    {key: 'Side', characterId: 13, firstFrame: 4},
    {key: 'Shape', characterId: 14, firstFrame: 4},
  ]);
});

test('TS002 exposes exactly the three source release-handler terms at frames 93 and 142', () => {
  assert.deepEqual(COURSE_G04_L10_TS_002_GLOSSARY_TERMS.map((term) => ({
    key: term.sourceKeyAttribute,
    characterId: term.sourceCharacterId,
    firstFrame: term.firstFrame,
  })), [
    {key: 'Restate', characterId: 16, firstFrame: 93},
    {key: 'question', characterId: 17, firstFrame: 93},
    {key: 'problem', characterId: 23, firstFrame: 142},
  ]);
});

test('TS005 exposes exactly the five source release-handler terms at frames 106 and 144', () => {
  assert.deepEqual(COURSE_G04_L10_TS_005_GLOSSARY_TERMS.map((term) => ({
    key: term.sourceKeyAttribute,
    characterId: term.sourceCharacterId,
    firstFrame: term.firstFrame,
  })), [
    {key: 'strategy', characterId: 22, firstFrame: 106},
    {key: 'equation', characterId: 26, firstFrame: 144},
    {key: 'Pattern', characterId: 27, firstFrame: 144},
    {
      key: 'Simple / Simpler / Simplest',
      characterId: 28,
      firstFrame: 144,
    },
    {key: 'Table', characterId: 29, firstFrame: 144},
  ]);
});

test('the maintained glossary factory rejects duplicate legacy handler bindings', () => {
  assert.throws(
    () => createPrivateSourceStaticGlossaryCandidate(
      COURSE_G04_L10_VB_011_CONFIG,
      {
        calibrationId: 'g4-l10-candidate-to-product-v7',
        companionSurfaceId: 'duplicate-handler-fixture',
        glossaryTerms: [
          COURSE_G04_L10_VB_011_GLOSSARY_TERMS[0],
          {
            ...COURSE_G04_L10_VB_011_GLOSSARY_TERMS[1],
            sourceCharacterId:
              COURSE_G04_L10_VB_011_GLOSSARY_TERMS[0].sourceCharacterId,
          },
        ],
      },
    ),
    /invalid or repeated source button character/,
  );
});

test('IR001 selects one hash-bound embedded stream for each seed remainder', async () => {
  assert.equal(COURSE_G04_L10_IR_001_PRIVATE_AUDIO_CUES.length, 2);
  for (const [seed, expectedId] of [
    [0, 'random-sound-0'],
    [1, 'random-sound-1'],
    [2, 'random-sound-0'],
    [3, 'random-sound-1'],
  ] as const) {
    assert.deepEqual(
      COURSE_G04_L10_IR_001_PRIVATE_AUDIO_CUES.filter((cue) =>
        audioCueMatchesContext(cue, {
          frameDomain: 'sprite-31',
          lang: 'en',
          scenario: 'source-static-frame',
          seed,
        })
      ).map((cue) => cue.id),
      [expectedId],
    );
  }

  for (const cue of COURSE_G04_L10_IR_001_PRIVATE_AUDIO_CUES) {
    assert.ok(cue.sha256);
    const relativePath = cue.source.split('?')[0]!.replace(/^\//, 'public/');
    const bytes = await readFile(`${repositoryRoot}${relativePath}`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), cue.sha256);
    assert.equal(cue.spokenLanguage, 'undetermined');
  }
});

test('TS005 binds its frame-1 engineering cue to exact staged bytes', async () => {
  assert.equal(COURSE_G04_L10_TS_005_PRIVATE_AUDIO_CUES.length, 1);
  const cue = COURSE_G04_L10_TS_005_PRIVATE_AUDIO_CUES[0]!;
  assert.equal(cue.frame, 1);
  assert.equal(cue.endFrame, 235);
  assert.equal(cue.frameDomain, 'sprite-32');
  assert.equal(cue.spokenLanguage, 'undetermined');
  assert.deepEqual(
    COURSE_G04_L10_TS_005_PRIVATE_AUDIO_CUES.filter((candidate) =>
      audioCueMatchesContext(candidate, {
        frameDomain: 'sprite-32',
        lang: 'en',
        scenario: 'source-static-frame',
        seed: 0,
      })
    ).map((candidate) => candidate.id),
    ['embedded-stream-0001'],
  );
  const relativePath = cue.source.split('?')[0]!.replace(/^\//, 'public/');
  const bytes = await readFile(`${repositoryRoot}${relativePath}`);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), cue.sha256);
});

test('VB002 binds its frame-4 engineering cue to exact staged bytes', async () => {
  assert.equal(COURSE_G04_L10_VB_002_PRIVATE_AUDIO_CUES.length, 1);
  const cue = COURSE_G04_L10_VB_002_PRIVATE_AUDIO_CUES[0]!;
  assert.equal(cue.frame, 4);
  assert.equal(cue.endFrame, 281);
  assert.equal(cue.frameDomain, 'sprite-84');
  assert.equal(cue.spokenLanguage, 'undetermined');
  assert.deepEqual(
    COURSE_G04_L10_VB_002_PRIVATE_AUDIO_CUES.filter((candidate) =>
      audioCueMatchesContext(candidate, {
        frameDomain: 'sprite-84',
        lang: 'en',
        scenario: 'source-static-frame',
        seed: 0,
      })
    ).map((candidate) => candidate.id),
    ['embedded-stream-0001'],
  );
  const relativePath = cue.source.split('?')[0]!.replace(/^\//, 'public/');
  const bytes = await readFile(`${repositoryRoot}${relativePath}`);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), cue.sha256);
});
