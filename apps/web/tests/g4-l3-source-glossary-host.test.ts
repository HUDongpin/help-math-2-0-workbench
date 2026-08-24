import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

test('G4 L3 source glossary requests use the typed memory-only Key Terms host', async () => {
  const [player, runtime, browser, adapter, shell] = await Promise.all([
    readFile(
      new URL('../components/g4-l3-whole-lesson-player.tsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../components/animation-runtime.tsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../components/legacy-key-terms-browser.tsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL(
        '../../../packages/demos/src/modules/course-g04-l03-source-glossary-candidate.tsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL('../components/legacy-responsive-lesson-shell.tsx', import.meta.url),
      'utf8',
    ),
  ]);

  assert.match(player, /createMemoryOnlyLessonHost/);
  assert.match(player, /enabledCapabilities: \['keyterm'\]/);
  assert.match(player, /mode: 'audit'/);
  assert.match(player, /releasePublished: false/);
  assert.match(player, /request\.type !== 'open-keyterm'/);
  assert.match(player, /lessonHost\.dispatch\(\{type: 'close-keyterm'\}\)/);
  assert.match(player, /activeTool === 'key-terms' && tool !== 'key-terms'/);
  assert.match(player, /onLessonHostRequest=\{handleLessonHostRequest\}/);
  assert.match(player, /selectionRequest=\{keyTermSelectionRequest\}/);
  assert.match(player, /SOURCE_STOP_KEYTERM_PLAYBACK/);
  assert.match(player, /setSourceStopHold\(\{/);
  assert.match(player, /setPaused\(true\);[\s\S]*?setSeekRequest\(null\);/);
  assert.match(player, /data-source-stop-resume-control="true"/);
  assert.match(player, /onPausedChange=\{handlePausedChange\}/);
  assert.match(runtime, /moduleDeclaresLessonHostRequest/);
  assert.match(runtime, /onLessonHostRequest=\{rendererLessonHostRequest\}/);
  assert.match(runtime, /pauseTimelineNow\(\);[\s\S]*?stopTimelineAudioNow\(\);/);
  assert.doesNotMatch(runtime, /onLessonHostRequest=\{onLessonHostRequest\}/);
  assert.match(adapter, /capabilities: Object\.freeze\(\["keyterm"\] as const\)/);
  assert.match(adapter, /legacyOperations: "blocked" as const/);
  assert.match(adapter, /className="course-g04-l03-source-glossary-stage-surface"/);
  assert.match(adapter, /data-source-glossary-placement="visible-stage-content-bottom"/);
  assert.match(
    adapter,
    /data-source-glossary-visual-plane="source-static-canvas"[\s\S]*?ref=\{visualHostRef\}[\s\S]*?style=\{\{position: "relative"\}\}[\s\S]*?<SourceStaticRenderer[\s\S]*?<SourceGlossaryInteraction/,
  );
  assert.match(
    adapter,
    /document\.getElementById\(targetId\)[\s\S]*?pageInteractionStageHost === "true"[\s\S]*?createPortal\(children, stageTarget\)/,
  );
  assert.match(
    adapter,
    /\.course-g04-l03-source-glossary-stage-surface \{[\s\S]*?align-content: end;[\s\S]*?aspect-ratio: 4 \/ 3;[\s\S]*?bottom: var\(--lesson-authored-content-bottom-inset, 0%\);[\s\S]*?position: absolute;/,
  );
  assert.match(
    adapter,
    /\.course-g04-l03-source-glossary-stage-surface > div\[role="group"\] \{[\s\S]*?grid-auto-flow: column;[\s\S]*?pointer-events: auto;/,
  );
  assert.match(adapter, /current-js-visible-stage-bottom-keyterm-controls/);
  assert.match(adapter, /source-audit-bounds-retained-not-rendered/);
  assert.match(
    shell,
    /'--lesson-authored-content-bottom-inset': `\$\{[\s\S]*?visualSkin\.chromeFooterHeight \/ visualSkin\.authoredStage\.height[\s\S]*?\}%`/,
  );
  assert.match(
    shell,
    /className="lesson-shell2__page-interaction-stage"[\s\S]*?data-page-interaction-stage-host="true"[\s\S]*?id=\{pageInteractionStageTargetId\}/,
  );
  assert.match(
    shell,
    /const focusWasInsideTool =[\s\S]*?toolPanelRef\.current\?\.contains\(currentFocus\)[\s\S]*?spineCalculatorPanelRef\.current\?\.contains\(currentFocus\)[\s\S]*?const focusWasRestoredOutsideTool =[\s\S]*?!focusWasInsideTool[\s\S]*?if \(focusWasRestoredOutsideTool\) return;/,
  );
  assert.match(runtime, /pageInteractionStageTargetId=\{pageInteractionStageTargetId\}/);
  assert.match(player, /G4_L3_PAGE_INTERACTION_STAGE_TARGET_ID/);
  assert.doesNotMatch(
    adapter,
    /PageInteractionCompanionPortal|pageInteractionCompanionTargetId/,
  );
  assert.doesNotMatch(adapter, /Explore this page’s source terms/);
  assert.doesNotMatch(adapter, /without executing legacy ActionScript/);
  assert.match(browser, /data-host-selection-resolution=\{selectionResolution\}/);
  assert.match(browser, /blocked-entry-not-found/);
  assert.doesNotMatch(`${player}\n${runtime}`, /_global|DoHyperLinks\(\)/);
});

test('all VB005, VB006, and RW003 candidate entry IDs resolve in both same-origin G4 indexes', async () => {
  const [englishText, spanishText] = await Promise.all([
    readFile(
      new URL('../public/generated/g4-grade-wide-keyterms-en.json', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../public/generated/g4-grade-wide-keyterms-es.json', import.meta.url),
      'utf8',
    ),
  ]);
  const english = JSON.parse(englishText) as {
    entries: {id: string; titles: {en: string}}[];
  };
  const spanish = JSON.parse(spanishText) as {
    entries: {id: string; titles: {en: string}}[];
  };
  const englishById = new Map(english.entries.map((entry) => [entry.id, entry]));
  const spanishById = new Map(spanish.entries.map((entry) => [entry.id, entry]));

  assert.deepEqual(
    [
      'en-0344-ac5e44095a38',
      'en-0411-1954bd66c84d',
      'en-0499-e54dca5d8b22',
      'en-0737-920ae135dd07',
      'en-0760-6575e63919df',
      'en-0496-498b59d01013',
      'en-0408-196ea5a45df3',
    ].map((id) => englishById.get(id)?.titles.en),
    [
      'Less than',
      'Negative number',
      'Positive number',
      'Value',
      'Zero',
      'Positive',
      'Negative',
    ],
  );
  assert.deepEqual(
    [
      'es-0057-e01a19219cce',
      'es-0401-7b42de19e998',
      'es-0456-9da6d6ebd619',
      'es-0458-9770130a5961',
      'es-0714-a437c574a1bc',
      'es-0516-f7f20d429054',
      'es-0439-b0dd8041f713',
    ].map((id) => spanishById.get(id)?.titles.en),
    [
      'Zero',
      'Less than',
      'Negative number',
      'Positive number',
      'Value',
      'Positive',
      'Negative',
    ],
  );
});
