import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  buildWorkCardReport,
  deriveScenarioFamilies,
  parseArguments,
  parseLessonXml,
  recommendRenderer,
  renderWorkCardMarkdown,
  validateWorkCardReport,
} from "./build-g4-l3-implementation-work-cards.mjs";

function signals({interaction = false, random = false, external = false, occurrences = {}} = {}) {
  return {
    actionScript: {signalOccurrences: occurrences},
    interaction: {candidate: interaction},
    random: {candidate: random},
    external: {candidate: external},
  };
}

function metrics(overrides = {}) {
  return {
    staticallyRootReachableDefinitionCount: 2,
    placeObject2Count: 20,
    rasterDefinitionCount: 0,
    morphShapeDefinitionCount: 0,
    ...overrides,
  };
}

test("lesson XML parser excludes commented historical pages and keeps active XML attributes", () => {
  const parsed = parseLessonXml(`
    <Lesson>
      <CourseName>Counting on Numbers</CourseName>
      <NewTitle1>Negative Numbers</NewTitle1>
      <LessonName>Negative Numbers</LessonName>
      <LessonNumber>3</LessonNumber>
      <PageRoot>HELP_COURSES/ELMGR4/L3</PageRoot>
      <Section SName="IN" SNumber="4">
        <Title><English>Learn It</English><Spanish>Apréndelo</Spanish></Title>
        <!--<Page Title="Old">IN/L3IN01.swf</Page>-->
        <Page Title="Temperature" RandomAudio="" Navigation="ON">IN/L3IN09.swf</Page>
      </Section>
    </Lesson>
  `);
  assert.equal(parsed.pages.length, 1);
  assert.equal(parsed.commentedPageReferenceCount, 1);
  assert.deepEqual(parsed.pages[0], {
    globalPageOrdinal: 1,
    sectionPageOrdinal: 1,
    sectionCode: "IN",
    sectionNumber: 4,
    sectionTitleEnglish: "Learn It",
    sectionTitleSpanish: "Apréndelo",
    titleRaw: "Temperature",
    randomAudioRaw: "",
    backgroundTextRaw: null,
    navigationRaw: "ON",
    sectionRelativePath: "IN/L3IN09.swf",
    archiveRelativePath: "HELP_COURSES/ELMGR4/L3/IN/L3IN09.swf",
  });
});

test("renderer recommendation remains provisional and evidence-bounded", () => {
  const simple = recommendRenderer({
    sourceKind: "fla+swf",
    releaseRole: "active-xml-referenced-page",
    signals: signals(),
    metrics: metrics(),
  });
  assert.equal(simple.primary, "react-svg");
  assert.equal(simple.confidence, "medium-low");
  assert.match(simple.decisionBoundary, /does not prove fidelity or completion/);

  const dense = recommendRenderer({
    sourceKind: "swf-only",
    releaseRole: "course-shell",
    signals: signals({interaction: true, random: true, external: true}),
    metrics: metrics({staticallyRootReachableDefinitionCount: 89, placeObject2Count: 2662}),
  });
  assert.equal(dense.primary, "react-state-machine+canvas");
  assert.equal(dense.engineHint, "createjs-or-pixijs-unresolved");
  assert.equal(dense.confidence, "low");
  assert.ok(dense.unresolved.includes("CreateJS versus PixiJS engine choice"));
});

test("scenario families enumerate static risk classes without claiming authoritative scenarios", () => {
  const families = deriveScenarioFamilies({
    releaseRole: "course-shell",
    classification: {xmlPage: {navigationRaw: "ON"}},
    signals: signals({
      interaction: true,
      random: true,
      external: true,
      occurrences: {"keyboard-events": 4, "input-fields": 2, "score-or-answer-state": 3},
    }),
  });
  assert.ok(families.includes("every-source-proven-random-outcome-with-deterministic-seed-binding"));
  assert.ok(families.includes("correct-incorrect-score-and-completion-branches"));
  assert.ok(families.includes("all-39-page-navigation-targets-and-return-context"));
  assert.ok(families.includes("each-external-call-candidate-disabled-or-reviewed-modern-disposition"));
});

test("checked-in report matches inputs and separates open scaffold gates from implementation/acceptance", async () => {
  const [built, checkedIn] = await Promise.all([
    buildWorkCardReport(),
    readFile(new URL("../reports/g4-l3-implementation-work-cards.json", import.meta.url), "utf8").then(JSON.parse),
  ]);
  validateWorkCardReport(checkedIn);
  assert.deepEqual(checkedIn, built);
  assert.equal(checkedIn.summary.cards, 40);
  assert.equal(checkedIn.summary.activePages, 39);
  assert.equal(checkedIn.summary.courseShells, 1);
  assert.equal(checkedIn.summary.batchGatesOpen, 2);
  assert.equal(checkedIn.summary.implementationAuthorizedNow, 0);
  assert.equal(checkedIn.summary.existingMigrationWorkspaces, 40);
  assert.equal(checkedIn.releaseFramework.developmentMode, "parallel-shards");
  assert.equal(checkedIn.releaseFramework.publicationMode, "atomic");
  assert.equal(checkedIn.releaseFramework.atomicPublicationAuthorizedByThisReport, false);
  assert.ok(checkedIn.batchPlan.every((batch) => batch.gate.open));
  assert.ok(checkedIn.batchPlan.every((batch) => batch.gate.prerequisiteKind === "none"));
  assert.ok(checkedIn.cards.every((card) => card.requiredWork.implementation.workspace.exists));
  assert.ok(checkedIn.cards.every((card) =>
    card.requiredWork.implementation.status === "workspace-scaffolded-but-renderer-implementation-not-authorized"));
  assert.equal(checkedIn.summary.unresolvedFrameDomainCards, 40);
  assert.equal(checkedIn.summary.unresolvedScenarioCards, 40);
  assert.equal(checkedIn.summary.unresolvedOriginalRuntimeCards, 40);
  assert.equal(checkedIn.summary.uniqueCatalogAssociatedAudioFiles, 143);
  assert.equal(checkedIn.sourceBindings.animatePrepare.currentAutomatedBlankJsflProbeReady, false);
  assert.equal(checkedIn.sourceBindings.animatePrepare.pairedSourcePrepareOnlyAvailable, true);
  assert.equal(checkedIn.batchPlan[0].orderedAnimationIds.length, 25);
  assert.equal(checkedIn.batchPlan[1].orderedAnimationIds.length, 15);
  assert.ok(checkedIn.cards.every((card) => Object.values(card.acceptance).every((value) => value === false)));
  assert.ok(checkedIn.cards.every((card) => card.recommendedRenderer.confidence !== "high"));
  const flaCards = checkedIn.cards.filter((card) => card.source.fla);
  assert.equal(flaCards.length, 29);
  assert.ok(flaCards.every((card) => card.requiredWork.authoring.nextSafeStep.prepareOnlyCommand.includes("--paired-swf")));
  assert.ok(flaCards.every((card) => card.requiredWork.authoring.nextSafeStep.fullRunRequiresNamedHumanDialogOperator));
  assert.ok(flaCards.every((card) => !card.requiredWork.authoring.currentAutomatedBlankJsflProbeReady));
  const markdown = renderWorkCardMarkdown(checkedIn);
  assert.match(markdown, /Acceptance-neutral pre-implementation specification/);
  assert.match(markdown, /scaffold gate \*\*open\*\*/);
  assert.match(markdown, /renderer implementation is authorized now for \*\*0\*\*/);
  assert.match(markdown, /Publication mode is \*\*atomic\*\*/);
  assert.match(markdown, /workspaces now exist for \*\*40\/40\*\*/);
  assert.match(markdown, /unattended blank JSFL probe \*\*not ready\*\*/);
});

test("CLI supports deterministic check mode and rejects incomplete or unknown options", () => {
  assert.equal(parseArguments(["--check"]).check, true);
  assert.throws(() => parseArguments(["--json-output"]), /requires a path/);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});
