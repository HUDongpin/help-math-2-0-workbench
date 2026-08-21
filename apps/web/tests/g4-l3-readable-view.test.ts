import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  G4_L3_PAGE_36_NUMBER_LINE_AMOUNTS,
  G4_L3_PAGE_36_READABLE_TRANSCRIPT,
  G4_L3_PAGE_36_READABLE_VIEW_SPEC,
  G4_L3_PAGE_36_SIGNED_AMOUNTS,
} from '../lib/g4-l3-readable-view';
import {G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR} from '../lib/g4-l3-whole-lesson-player-descriptor';

test('Page 36 Readable View is bound to the approved fixed source identity', () => {
  const spec = G4_L3_PAGE_36_READABLE_VIEW_SPEC;

  assert.equal(spec.animationId, 'course-g04-l03-ts-008');
  assert.equal(
    spec.sourceSwfSha256,
    '9c7288f67f764e02f4320655b64dbb57d3d690a75951b549ee5113f385e6b885',
  );
  assert.equal(spec.frameDomain, 'sprite-350');
  assert.equal(spec.sourceFrame, 789);
  assert.equal(
    spec.sourceFrameSha256,
    '13c47aeb4d92ff8ae0c934f4da979662e4b0a5fedad05e24f148b83a561ffda9',
  );
  assert.equal(
    spec.currentJavascriptRendererSha256,
    '30d1272b3ce20cbf8ecbe76219351b78336bf24a71e921ae63bf48174fb267e6',
  );
  assert.equal(spec.nativePadding, 4);
  assert.equal(spec.desktopScale, 2.5);
  assert.equal(spec.defaultExpanded, true);
  assert.equal(spec.originalLayoutPreserved, true);
  assert.equal(spec.strictAcceptanceEffect, 'none');

  assert.deepEqual(spec.crops.map((crop) => crop.nativeRect), [
    {x: 292, y: 147, width: 236, height: 149},
    {x: 292, y: 296, width: 236, height: 191},
  ]);
  assert.deepEqual(spec.crops.map((crop) => crop.paddedRect), [
    {x: 288, y: 143, width: 244, height: 157},
    {x: 288, y: 292, width: 244, height: 199},
  ]);
  assert.deepEqual(spec.crops[0]!.sourceCharacterIds, [99, 100, 101, 133]);
  assert.deepEqual(spec.crops[1]!.sourceCharacterIds, [
    144,
    145,
    146,
    147,
    148,
    149,
    150,
    151,
    152,
  ]);
  assert.deepEqual(spec.crops.map((crop) => crop.asset), [
    '/flash-assets/courses/course-g04-l03-ts-008/readable-view/frame-789-step-3.png',
    '/flash-assets/courses/course-g04-l03-ts-008/readable-view/frame-789-step-4.png',
  ]);
  assert.deepEqual(spec.crops.map((crop) => crop.assetSha256), [
    'cb43e972f1043af58a03f01f280eec09b8f39e816e2f23d1e6bf6ad7bb996731',
    '02af808cbd1c1a8bbb20dda3084a68240c0e4310f08b6f3120963d76c1e7e756',
  ]);
  assert.deepEqual(spec.crops.map((crop) => crop.transcriptSha256), [
    '74944b2787363422dfb1381cc84c3351bf81b25804e86ea869861842749002bd',
    '8c476e7328340df57c59936050b0905b786249e4f31d1fa4267153d6355ff796',
  ]);
});

test('Page 36 transcript preserves source English and normalizes source minus shapes', () => {
  assert.deepEqual(G4_L3_PAGE_36_READABLE_VIEW_SPEC.crops[0]!.transcript, [
    'Use strategy: Draw a picture. Make a number line.',
    'Place each person’s name on the number line based on the amount of money they have or owe:',
    'Toni has the most money with $7.',
    'The correct answer choice is D.',
  ]);
  assert.ok(G4_L3_PAGE_36_READABLE_TRANSCRIPT.includes(
    'Use strategy: Use Logical Reasoning',
  ));
  assert.ok(G4_L3_PAGE_36_READABLE_TRANSCRIPT.includes(
    'Susan owes $10 = −10',
  ));
  assert.ok(G4_L3_PAGE_36_READABLE_TRANSCRIPT.includes(
    'Ricky owes $2 = −2',
  ));
});

test('Page 36 native learner model preserves all four signed amounts and their number-line order', () => {
  assert.deepEqual(G4_L3_PAGE_36_SIGNED_AMOUNTS, [
    {
      name: 'Toni',
      statement: 'Toni has $7',
      signedValue: 7,
      signedLabel: '+7',
    },
    {
      name: 'Elvin',
      statement: 'Elvin has $3',
      signedValue: 3,
      signedLabel: '+3',
    },
    {
      name: 'Susan',
      statement: 'Susan owes $10',
      signedValue: -10,
      signedLabel: '−10',
    },
    {
      name: 'Ricky',
      statement: 'Ricky owes $2',
      signedValue: -2,
      signedLabel: '−2',
    },
  ]);
  assert.deepEqual(
    G4_L3_PAGE_36_NUMBER_LINE_AMOUNTS.map((amount) => amount.name),
    ['Susan', 'Ricky', 'Elvin', 'Toni'],
  );
  assert.deepEqual(
    G4_L3_PAGE_36_NUMBER_LINE_AMOUNTS.map((amount) => amount.signedValue),
    [-10, -2, 3, 7],
  );
});

test('Readable View is Page 36-only, native, responsive, keyboard closable, and follows the stage', async () => {
  const [componentSource, playerSource, shellSource, globalCss] =
    await Promise.all([
      readFile(
        new URL('../components/g4-l3-readable-view.tsx', import.meta.url),
        'utf8',
      ),
      readFile(
        new URL('../components/g4-l3-whole-lesson-player.tsx', import.meta.url),
        'utf8',
      ),
      readFile(
        new URL(
          '../components/legacy-responsive-lesson-shell.tsx',
          import.meta.url,
        ),
        'utf8',
      ),
      readFile(new URL('../app/globals.css', import.meta.url), 'utf8'),
    ]);

  // Which page offers reading support is a descriptor fact, so the guarantee is
  // asserted against the data rather than against the expression the player
  // happens to use: exactly one page declares it, and it is the page the
  // source-bound crop specification belongs to.
  const declaring = G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.pages
    .filter((page) => page.readableView);
  assert.equal(declaring.length, 1, 'exactly one page may declare reading support');
  assert.equal(
    declaring[0]!.animationId,
    G4_L3_PAGE_36_READABLE_VIEW_SPEC.animationId,
  );
  assert.equal(declaring[0]!.readableView?.kind, 'source-bound-readable-view');
  assert.equal(
    declaring[0]!.readableView?.specId,
    G4_L3_PAGE_36_READABLE_VIEW_SPEC.animationId,
  );
  // The player must render from that declaration, never from a hard-coded id.
  assert.match(playerSource, /readableViewDeclaration\?\.specId ===/);
  assert.doesNotMatch(
    playerSource,
    /currentPage\.animationId === G4_L3_PAGE_36_READABLE_VIEW_SPEC\.animationId/,
  );
  assert.match(playerSource, /learningSupport=\{learningSupport\}/);
  assert.match(shellSource, /learningSupport\?: ReactNode/);
  assert.match(
    shellSource,
    /\{learningSupport[\s\S]*?lesson-shell2__learning-support[\s\S]*?\{learningSupport\}[\s\S]*?lesson-shell2__modern-toolbar/,
  );
  assert.match(componentSource, /lang="en"/);
  assert.match(componentSource, /data-readable-transcript/);
  assert.match(componentSource, /data-source-animation-id=\{spec\.animationId\}/);
  assert.match(componentSource, /event\.key !== 'Escape'/);
  assert.match(componentSource, /toggleRef\.current\?\.focus\(\)/);
  assert.match(componentSource, /aria-expanded=\{expanded\}/);
  assert.match(componentSource, /Hide reading support/);
  assert.match(componentSource, /G4_L3_PAGE_36_NUMBER_LINE_AMOUNTS\.map/);
  assert.match(componentSource, /G4_L3_PAGE_36_SIGNED_AMOUNTS\.map/);
  assert.equal(componentSource.match(/<article/g)?.length, 2);
  assert.match(componentSource, /Positions on the number line/);
  assert.match(componentSource, /aria-label="Signed amounts"/);
  assert.doesNotMatch(componentSource, /<img\b|frame-789-step-[34]\.png/);
  assert.doesNotMatch(componentSource, /Original Layout only/);
  assert.doesNotMatch(componentSource, /not Flash-fidelity evidence/);
  assert.doesNotMatch(componentSource, /bound to current-JavaScript frame/);
  assert.match(
    componentSource,
    /La lección fuente está en inglés/,
  );
  assert.doesNotMatch(componentSource, /role="dialog"|aria-modal/);
  assert.match(
    globalCss,
    /\.g4-l3-readable-view__source-copy \{[\s\S]*?font-size: clamp\(1\.08rem, 2\.2vw, 1\.2rem\);/,
  );
  assert.match(
    globalCss,
    /\.g4-l3-readable-view__number-line \{[\s\S]*?position: relative;/,
  );
  assert.match(
    globalCss,
    /grid-template-columns: repeat\(auto-fit, minmax\(min\(100%, 11\.5rem\), 1fr\)\);/,
  );
  assert.match(
    globalCss,
    /@container page36-reading-support \(max-width: 32rem\)/,
  );
});
