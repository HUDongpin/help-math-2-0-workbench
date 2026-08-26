import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  buildLessonProductContract,
  parseArguments,
  parseLessonProductXml,
  parseShellLessonDetails,
  renderLessonProductContractMarkdown,
  selectUniqueReleaseById,
  validateLessonReleaseLedgerSummary,
  validateLessonProductContract,
} from "./build-g4-l3-lesson-product-contract.mjs";

test("release selection permits unrelated lessons and rejects zero or duplicate target rows", () => {
  const target = {releaseId: "lesson-g04-l03-negative-numbers"};
  const unrelated = {releaseId: "lesson-g05-l04-number-lines"};
  assert.equal(
    selectUniqueReleaseById({releases: [target, unrelated]}, target.releaseId, "Manifest"),
    target,
  );
  assert.throws(
    () => selectUniqueReleaseById({releases: [unrelated]}, target.releaseId, "Manifest"),
    /must contain exactly one lesson-g04-l03-negative-numbers row/,
  );
  assert.throws(
    () => selectUniqueReleaseById({releases: [target, unrelated, {...target}]}, target.releaseId, "Manifest"),
    /must contain exactly one lesson-g04-l03-negative-numbers row/,
  );
});

test("release ledger summary supports multiple lessons and rejects stale singleton totals", () => {
  const document = {
    summary: {
      releaseCount: 2,
      publishedReleaseCount: 0,
      unpublishedReleaseCount: 2,
      memberCount: 95,
      strictCompleteMemberCount: 0,
    },
    releases: [
      {
        releaseId: "lesson-g04-l03-negative-numbers",
        expectedMemberCount: 40,
        strictCompleteCount: 0,
        published: false,
        status: "unpublished",
      },
      {
        releaseId: "lesson-g05-l04-number-lines",
        expectedMemberCount: 55,
        strictCompleteCount: 0,
        published: false,
        status: "unpublished",
      },
    ],
  };
  assert.deepEqual(validateLessonReleaseLedgerSummary(document), document.summary);
  const selectedG4Release = selectUniqueReleaseById(
    document,
    "lesson-g04-l03-negative-numbers",
    "Lesson release ledger",
  );
  assert.deepEqual(
    {
      expectedMemberCount: selectedG4Release.expectedMemberCount,
      strictCompleteCount: selectedG4Release.strictCompleteCount,
      published: selectedG4Release.published,
      status: selectedG4Release.status,
    },
    {expectedMemberCount: 40, strictCompleteCount: 0, published: false, status: "unpublished"},
  );

  const staleSingletonSummary = structuredClone(document);
  staleSingletonSummary.summary.releaseCount = 1;
  staleSingletonSummary.summary.memberCount = 40;
  assert.throws(
    () => validateLessonReleaseLedgerSummary(staleSingletonSummary),
    /global summary differs from its release rows/,
  );
});

test("lesson parser keeps active order, commented placements, exact bilingual labels, and raw Navigation", () => {
  const parsed = parseLessonProductXml(`
    <Lesson>
      <CourseName>Counting on Numbers</CourseName>
      <NewTitle1>Negative Numbers</NewTitle1>
      <CourseIMGName>HELP_COURSES/ELMGR4/ELMGR4.jpg</CourseIMGName>
      <LessonName>Negative Numbers</LessonName>
      <LessonNumber>3</LessonNumber>
      <PageRoot>HELP_COURSES/ELMGR4/L3</PageRoot>
      <Keyterms><English>A.xml</English><Spanish>B.xml</Spanish><DigDir>DIG</DigDir></Keyterms>
      <Section SName="IN" SNumber="4" SubTitle="YES">
        <Title><English>Learn It</English><Spanish>Apréndelo</Spanish></Title>
        <!--<Page Title="Introduction" Navigation="ON">IN/L3IN01.swf</Page>-->
        <Page Title="Temperature" RandomAudio="" BGText="" Navigation="OFF">IN/L3IN02.swf</Page>
        <SubPageTitle EngSubTitleName="1. Temperature" SpanSubTitleName="Temperatura" SubTitleButtonName="L3IN02">IN/L3IN02.swf</SubPageTitle>
      </Section>
    </Lesson>
  `);
  assert.equal(parsed.activePages.length, 1);
  assert.equal(parsed.commentedPages.length, 1);
  assert.equal(parsed.sections[0].titleSpanish, "Apréndelo");
  assert.equal(parsed.sections[0].subPageTitles[0].titleSpanishRaw, "Temperatura");
  assert.equal(parsed.activePages[0].navigationRaw, "OFF");
  assert.equal(parsed.activePages[0].archiveRelativePath, "HELP_COURSES/ELMGR4/L3/IN/L3IN02.swf");
  assert.equal(parsed.commentedPages[0].archiveRelativePath, "HELP_COURSES/ELMGR4/L3/IN/L3IN01.swf");
});

test("shell LessonDetails parser retains the shipped section and page order", () => {
  const parsed = parseShellLessonDetails(
    'LessonDetails = "[CourseDetails]~CourseName,A~LessonName,B~TotalSection,8' +
    '[Details_Split][Section1Details]~IR~L3RW01.swf' +
    '[Details_Split][Section2Details]~RW~L3RW02.swf' +
    '[Details_Split][Section3Details]~VB~L3VB01.swf~L3VB02.swf' +
    '[Details_Split][Section4Details]~IN~L3IN01.swf' +
    '[Details_Split][Section5Details]~TI~L3TI01.swf' +
    '[Details_Split][Section6Details]~GS~L3GS01.swf' +
    '[Details_Split][Section7Details]~TS~L3TS01.swf' +
    '[Details_Split][Section8Details]~FQ~L3FQ01.swf";'
  );
  assert.equal(parsed.sections.length, 8);
  assert.equal(parsed.pages.length, 9);
  assert.equal(parsed.pages[0].archiveRelativePath, "HELP_COURSES/ELMGR4/L3/IR/L3RW01.swf");
  assert.equal(parsed.pages.at(-1).archiveRelativePath, "HELP_COURSES/ELMGR4/L3/FQ/L3FQ01.swf");
});

test("checked-in contract matches all bound inputs and separates open scaffolding from closed acceptance", async () => {
  const [built, checkedIn] = await Promise.all([
    buildLessonProductContract(),
    readFile(new URL("../reports/g4-l3-lesson-product-navigation-contract.json", import.meta.url), "utf8").then(JSON.parse),
  ]);
  validateLessonProductContract(checkedIn);
  assert.deepEqual(checkedIn, built);
  assert.deepEqual(checkedIn.sections.map((section) => section.code), ["IR", "RW", "VB", "IN", "TI", "GS", "TS", "FQ"]);
  assert.deepEqual(checkedIn.sections.map((section) => section.activePageCount), [1, 3, 8, 11, 5, 1, 7, 3]);
  assert.equal(checkedIn.pages[0].animationId, "course-g04-l03-ir-001-341242cc");
  assert.equal(checkedIn.pages.at(-1).animationId, "course-g04-l03-fq-003");
  assert.deepEqual(
    checkedIn.shell.staticSequence.extraComparedWithActiveXml,
    [
      "HELP_COURSES/ELMGR4/L3/VB/L3VB01.swf",
      "HELP_COURSES/ELMGR4/L3/IN/L3IN01.swf",
      "HELP_COURSES/ELMGR4/L3/TI/L3TI01.swf",
      "HELP_COURSES/ELMGR4/L3/GS/L3GS01.swf",
      "HELP_COURSES/ELMGR4/L3/TS/L3TS01.swf",
    ],
  );
  assert.deepEqual(checkedIn.shell.staticSequence.commentedXmlPathsExcludedByStaticShell, ["HELP_COURSES/ELMGR4/L3/RW/L3RW01.swf"]);
  assert.equal(checkedIn.lesson.keyterms.courseXmlReferences.en.exists, false);
  assert.equal(checkedIn.lesson.keyterms.courseXmlReferences.es.exists, false);
  assert.equal(checkedIn.lesson.keyterms.shippedShellStaticReferences.en.exists, true);
  assert.equal(checkedIn.lesson.keyterms.shippedShellStaticReferences.es.exists, true);
  assert.equal(checkedIn.routes.staticCodeInspection.browserVerified, false);
  assert.equal(checkedIn.routes.staticCodeInspection.courseRouteConsumesThisLessonContract, true);
  assert.equal(checkedIn.routes.staticCodeInspection.lessonPreviousNextControlsStaticallyEstablished, true);
  assert.equal(checkedIn.routes.staticCodeInspection.courseRouteUsesOnlySectionLocalPageOrdinalForSort, false);
  assert.equal(checkedIn.routes.staticCodeInspection.courseRouteUsesAtomicLessonPublication, true);
  assert.equal(checkedIn.routes.staticCodeInspection.animationRouteUsesPublicationPolicyInProduction, true);
  assert.equal(checkedIn.routes.staticCodeInspection.catalogRecomputesAtomicReleaseFromBoundArtifacts, true);
  assert.equal(checkedIn.summary.currentPrototypeModules, checkedIn.routes.currentState.prototypeAnimationIds.length);
  assert.equal(checkedIn.summary.currentPrototypeModules, 40);
  assert.equal(checkedIn.summary.currentPrototypePageModules, 39);
  assert.equal(checkedIn.summary.currentPrototypeShellModules, 1);
  assert.ok(checkedIn.routes.currentState.prototypeAnimationIds.every((animationId) => animationId === checkedIn.shell.animationId || checkedIn.pages.some((page) => page.animationId === animationId)));
  assert.equal(checkedIn.development.mode, "parallel-shards");
  assert.equal(checkedIn.development.scaffoldGatesOpen, true);
  assert.equal(checkedIn.development.implementationAuthorized, false);
  assert.deepEqual(checkedIn.development.shards.map((shard) => [shard.batchId, shard.memberCount, shard.scaffoldGateOpen]), [
    ["batch-001", 25, true],
    ["batch-002", 15, true],
  ]);
  assert.equal(checkedIn.publication.mode, "atomic");
  assert.equal(checkedIn.publication.requiredMembers, 40);
  assert.equal(checkedIn.publication.strictCompleteMembers, 0);
  assert.equal(checkedIn.publication.published, false);
  assert.equal(checkedIn.routes.currentState.productionAdmittedLessonPages, 0);
  assert.equal(checkedIn.routes.currentState.productionAdmittedCourseShells, 0);
  assert.equal(checkedIn.summary.browserVerifiedRoutes, 82);
  assert.equal(checkedIn.routes.browserProductQa.status, "pass-current-javascript-product-layer");
  assert.equal(checkedIn.routes.browserProductQa.routeVisits, 121);
  assert.equal(checkedIn.routes.browserProductQa.limitations.runnableCourseShellModules, 1);
  assert.equal(checkedIn.routes.browserProductQa.limitations.spanishGraphicRoutes, 1);
  assert.equal(checkedIn.routes.browserProductQa.limitations.spanishFailClosedSemanticRoutes, 38);
  assert.equal(checkedIn.routes.browserProductQa.authorityEffect, false);
  assert.equal(checkedIn.missingEvidenceBeforeCompleteLessonClaim.length, 12);
  assert.equal(checkedIn.missingEvidenceBeforeCompleteLessonClaim.find(({id}) => id === "browser-product-qa").status, "partial");
  assert.ok(checkedIn.pages.every((page) => Object.values(page.acceptance).every((value) => value === false)));
  assert.ok(checkedIn.pages.every((page) => page.engineeringEvidence.currentJavascriptProductQaComplete === true && page.engineeringEvidence.authorityEffect === false));
  assert.ok(checkedIn.pages.every((page) => page.routes.browserVerifiedCurrentJavascript === true));
  assert.ok(checkedIn.pages.every((page) => page.replay.mouseVerifiedCurrentJavascript && page.replay.enterVerifiedCurrentJavascript && page.replay.spaceVerifiedCurrentJavascript && !page.replay.completeStateResetVerified));
  assert.ok(Object.values(checkedIn.shell.acceptance).every((value) => value === false));
  assert.equal(checkedIn.shell.currentPrototypeRegistryEntry?.key, "shell-course-g04-l03-index-local");
  assert.equal(checkedIn.shell.currentModuleFile?.exists, true);
  assert.equal(checkedIn.shell.engineeringEvidence.currentJavascriptStructuralProjectionExists, true);
  assert.equal(checkedIn.shell.engineeringEvidence.sourceVisualParityEstablished, false);
  assert.equal(checkedIn.shell.engineeringEvidence.authorityEffect, false);
  const markdown = renderLessonProductContractMarkdown(checkedIn);
  assert.match(markdown, /39 active pages/);
  assert.match(markdown, /44 paths/);
  assert.match(markdown, /Acceptance-neutral deterministic contract/);
  assert.match(markdown, /Browser-verified routes in this report: \*\*82\*\*/);
  assert.match(markdown, /Replay mouse, Enter, and Space activation counters passed on all 39/);
  assert.match(markdown, /2\/2 shard gates open/);
  assert.match(markdown, /0\/40 strict/);
});

test("CLI supports deterministic check mode and rejects unsafe/incomplete options", () => {
  assert.equal(parseArguments(["--check"]).check, true);
  assert.throws(() => parseArguments(["--json-output"]), /requires a path/);
  assert.throws(() => parseArguments(["--wat"]), /Unknown option/);
});
