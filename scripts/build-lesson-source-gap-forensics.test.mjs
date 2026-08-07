import assert from "node:assert/strict";
import test from "node:test";

import {
  buildReport,
  extractActionScriptString,
  parseArguments,
  parseCourseXml,
  parseSectionDetails,
  writeOrCheck,
} from "./build-lesson-source-gap-forensics.mjs";

const releaseId = "lesson-g05-l04-number-lines";
const outputPrefix = "reports/g5-l4-source-gap-forensics";
const g5L5ReleaseId = "lesson-g05-l05-add-subtract-negative-numbers";
const g5L5OutputPrefix = "reports/g5-l5-source-gap-forensics";

test("course XML parser keeps active pages separate from commented legacy pages", () => {
  const parsed = parseCourseXml(`
    <Lesson>
      <Keyterms><English>A.xml</English><Spanish>B.xml</Spanish></Keyterms>
      <Section><Page Title="Active">IR/L4RW01.swf</Page></Section>
      <!--<Page Title="Legacy">RW/L4RW01.swf</Page>-->
    </Lesson>
  `);
  assert.deepEqual(parsed.activePages, [{path: "IR/L4RW01.swf", title: "Active"}]);
  assert.deepEqual(parsed.commentedPages, [{path: "RW/L4RW01.swf", title: "Legacy"}]);
  assert.deepEqual(parsed.keytermXml, [
    {language: "english", path: "A.xml"},
    {language: "spanish", path: "B.xml"},
  ]);
});

test("ActionScript section parser preserves path-qualified section identity", () => {
  const source = 'LessonDetails = "[CourseDetails]~x[Details_Split][Section1Details]~IR~L4RW01.swf[Details_Split][Section2Details]~RW~L4RW02.swf~L4RW03.swf";';
  const serialized = extractActionScriptString(source, "LessonDetails");
  assert.deepEqual(parseSectionDetails(serialized), [
    {sectionNumber: 1, section: "IR", paths: ["IR/L4RW01.swf"]},
    {sectionNumber: 2, section: "RW", paths: ["RW/L4RW02.swf", "RW/L4RW03.swf"]},
  ]);
});

test("G5 L4 report binds the frozen release and records the exact static differences", async () => {
  const report = await buildReport({releaseId});
  assert.equal(report.courseXml.activePageCount, 54);
  assert.equal(report.frozenRelease.expectedMembers, 55);
  assert.equal(report.frozenRelease.membershipChangedByThisReport, false);
  assert.equal(report.mainScript.lessonDetails.pageCount, 59);
  assert.deepEqual(report.reconciliation.lessonDetailsVsActiveXml.extras, [
    "VB/L4VB01.swf",
    "IN/L4IN01.swf",
    "TI/L4TI01.swf",
    "GS/L4GS01.swf",
    "TS/L4TS01.swf",
  ]);
  assert.deepEqual(report.reconciliation.lessonDetailsVsActiveXml.missing, []);
  assert.deepEqual(report.reconciliation.commentedLegacyPages.absentFromLessonDetails, ["RW/L4RW01.swf"]);
  assert.deepEqual(report.reconciliation.basenameCollisions, [
    {basename: "L4RW01.swf", paths: ["IR/L4RW01.swf", "RW/L4RW01.swf"]},
  ]);
});

test("missing keyterm declarations remain content-neutral and fail-closed", async () => {
  const report = await buildReport({releaseId});
  assert.equal(report.keytermGap.declarations.length, 2);
  for (const declaration of report.keytermGap.declarations) {
    assert.equal(declaration.physicalPresence, false);
    assert.deepEqual(declaration.exactCatalogMatches, []);
    assert.deepEqual(declaration.basenameCatalogMatches, []);
  }
  assert.deepEqual(report.acceptanceEffects, {
    sourceGapClosed: false,
    releaseScopeChanged: false,
    implementationAuthorized: false,
    authoritativeOriginalRuntime: false,
    strictComplete: false,
    published: false,
  });
});

test("G5 L5 report binds all 56 active pages plus Shell and preserves exact source gaps", async () => {
  const report = await buildReport({releaseId: g5L5ReleaseId});
  assert.equal(report.courseXml.activePageCount, 56);
  assert.equal(report.frozenRelease.expectedMembers, 57);
  assert.equal(report.frozenRelease.activeXmlMembers, 56);
  assert.equal(report.frozenRelease.shellMembers, 1);
  assert.equal(report.frozenRelease.membershipChangedByThisReport, false);
  assert.equal(report.mainScript.lessonDetails.pageCount, 62);
  assert.deepEqual(report.reconciliation.lessonDetailsVsActiveXml.extras, [
    "VB/L5VB01.swf",
    "IN/L5IN01.swf",
    "TI/L5TI01.swf",
    "GS/L5GS01.swf",
    "TS/L5TS01.swf",
    "TS/L5TS09.swf",
  ]);
  assert.deepEqual(report.reconciliation.lessonDetailsVsActiveXml.missing, []);
  assert.deepEqual(report.reconciliation.commentedLegacyPages.absentFromLessonDetails, ["RW/L5RW01.swf"]);
  assert.deepEqual(report.reconciliation.basenameCollisions, [
    {basename: "L5RW01.swf", paths: ["IR/L5RW01.swf", "RW/L5RW01.swf"]},
  ]);
  assert.deepEqual(report.keytermGap.declarations.map(({language, path, physicalPresence}) => ({
    language,
    path,
    physicalPresence,
  })), [
    {language: "english", path: "HELP_KEYTERMS/KT/ELEMENTARY/XML/L5KTE01.xml", physicalPresence: false},
    {language: "spanish", path: "HELP_KEYTERMS/KT/ELEMENTARY/XML/L5KTS01.xml", physicalPresence: false},
  ]);
  assert.equal(report.blockers.some((blocker) => blocker.includes("L5KTE01.xml") && blocker.includes("L5KTS01.xml")), true);
  assert.deepEqual(report.acceptanceEffects, {
    sourceGapClosed: false,
    releaseScopeChanged: false,
    implementationAuthorized: false,
    authoritativeOriginalRuntime: false,
    strictComplete: false,
    published: false,
  });
});

test("checked report is deterministic and output cannot escape reports", async () => {
  const report = await buildReport({releaseId});
  assert.equal(await writeOrCheck({report, outputPrefix, check: true}), "checked");
  const g5L5Report = await buildReport({releaseId: g5L5ReleaseId});
  assert.equal(await writeOrCheck({report: g5L5Report, outputPrefix: g5L5OutputPrefix, check: true}), "checked");
  assert.throws(
    () => parseArguments(["--release-id", releaseId, "--output-prefix", "../escape"]),
    /must stay below reports/,
  );
});
