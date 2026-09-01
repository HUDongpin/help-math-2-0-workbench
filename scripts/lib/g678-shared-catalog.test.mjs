import assert from "node:assert/strict";
import {mkdir, mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  MODULES,
  applyGradeMapping,
  buildSharedCatalog,
  countCommentedPageElements,
  findBareAmpersands,
  indexClassificationRows,
  indexDependencyRows,
  parseSharedLessonXml,
  pendingGradeMapping,
  sha256,
  stableJson,
  stripXmlComments,
  validateGradeMapping,
  validateSharedCatalog,
  validateSharedProfile,
} from "./g678-shared-catalog.mjs";

const FIXTURE_XML = `\ufeff<Lesson>
  <CourseName>Numbers &amp; Sense</CourseName>
  <!--<NewTitle1>Ignored title</NewTitle1>-->
  <LessonName>Integers & Operations</LessonName>
  <LessonNumber>1</LessonNumber>
  <PageRoot>HELP_COURSES/NMS002/L1</PageRoot>
  <Keyterms><English>HELP_KEYTERMS/KT/XML/L1KTE01.xml</English><Spanish>HELP_KEYTERMS/KT/XML/L1KTS01.xml</Spanish></Keyterms>
  <Section SName="IR" SNumber="1"><Title><English>Introduction</English><Spanish>Introducción</Spanish></Title>
    <!--<Page Title="inactive">IR/L1IR00.swf</Page>-->
    <Page Title="First &amp; Main" RandomAudio="No">IR/L1IR01.swf</Page>
    <Page Title="Second">IR/L1IR02.swf</Page>
    <SubPageTitle EngSubTitleName="1. First concept" SpanSubTitleName="Primer concepto">IR/L1IR01.swf</SubPageTitle>
  </Section>
  <Section SName="FQ" SNumber="8"><Title><English>Final Quiz</English><Spanish>Examen</Spanish></Title>
    <Page Title="Quiz">FQ/L1FQ01.swf</Page>
  </Section>
</Lesson>`;

test("parser strips comments, preserves BOM diagnostics and active XML order", () => {
  const parsed = parseSharedLessonXml({
    bytes: Buffer.from(FIXTURE_XML),
    xmlPath: "G6-G8-shared/NMS002/L1/index.xml",
  });
  assert.equal(parsed.sourceXml.hasUtf8Bom, true);
  assert.equal(parsed.activePageCount, 3);
  assert.equal(parsed.commentedPageCount, 1);
  assert.deepEqual(parsed.pages.map((page) => page.expectedPath), [
    "HELP_COURSES/NMS002/L1/IR/L1IR01.swf",
    "HELP_COURSES/NMS002/L1/IR/L1IR02.swf",
    "HELP_COURSES/NMS002/L1/FQ/L1FQ01.swf",
  ]);
  assert.equal(parsed.pages[0].titleEnglish, "First concept");
  assert.equal(parsed.pages[0].titleSpanish, "Primer concepto");
  assert.equal(parsed.pages[1].titleEnglish, "First concept");
  assert.equal(parsed.pages[1].spanishTitleDisposition, "source-subpage-title");
  assert.equal(parsed.pages[0].placementId, "shared-nms002-l01-p001");
  assert.equal(parsed.pages[2].assetId, null);
  assert.equal(parsed.mappingStatus, "source-mapping-pending");
  assert.equal(parsed.moduleLesson, 1);
  assert.equal(parsed.sourceXmlSha256, parsed.sourceXml.sha256);
  assert.equal(parsed.pagePlacementCount, 3);
  assert.ok(parsed.warnings.includes("bare-ampersands:1"));
});

test("lesson cards prefer LessonName over a stale NewTitle1 label", () => {
  const result = parseSharedLessonXml({
    bytes: Buffer.from("<Lesson><NewTitle1>Acute Angles Text</NewTitle1><LessonName>Data Collection and Organization</LessonName><Section SName=\"IR\"><Page>IR/L1IR01.swf</Page></Section></Lesson>"),
    xmlPath: "G6-G8-shared/DAT001/L1/index.xml",
  });
  assert.equal(result.title, "Data Collection and Organization");
  assert.ok(result.warnings.some((warning) => warning.startsWith("legacy-newtitle1-drift:")));
});

test("comment and bare ampersand helpers are deterministic", () => {
  const projection = stripXmlComments("a<!-- <Page>x</Page> -->b<!--open");
  assert.equal(projection.commentCount, 1);
  assert.equal(projection.unterminatedCommentCount, 1);
  assert.equal(projection.text, "ab");
  assert.equal(countCommentedPageElements("x<!-- <Page>old</Page> --> y<!-- <Page>tail</Page>"), 2);
  assert.equal(findBareAmpersands("a & b &amp; c &#x26; d").length, 1);
});

test("pending mapping template contains every shared lesson and refuses inferred grades", () => {
  const profile = {
    profileId: "g678-shared-source-profile-v1",
    modules: MODULES,
    gradeMapping: {minimumPrimaryScore: 5, minimumMargin: 2, requiredEvidenceLevels: ["A", "B"]},
  };
  const mapping = pendingGradeMapping(profile);
  assert.equal(mapping.records.length, 44);
  assert.equal(validateGradeMapping(mapping, profile).length, 0);
  assert.ok(mapping.records.every((record) => record.status === "pending" && record.primaryGrade === null));
  const inferred = structuredClone(mapping);
  inferred.records[0].primaryGrade = 6;
  assert.ok(validateGradeMapping(inferred, profile).some((message) => message.includes("non-approved record")));
});

test("approved mapping requires evidence, score margin and independent reviewers", () => {
  const profile = {
    profileId: "g678-shared-source-profile-v1",
    modules: MODULES,
    gradeMapping: {minimumPrimaryScore: 5, minimumMargin: 2, requiredEvidenceLevels: ["A", "B"]},
  };
  const mapping = pendingGradeMapping(profile);
  const record = mapping.records[0];
  record.status = "approved";
  record.primaryGrade = 6;
  record.scoresByGrade = {"6": 7, "7": 4, "8": 2};
  record.ccssStandardCodes = ["CCSS.MATH.CONTENT.6.NS.C.5"];
  record.evidence = [{level: "A", kind: "official-scope", source: "fixture", excerpt: "fixture", sha256: sha256("fixture")}];
  record.reviewers = [{role: "math", id: "reviewer-a"}, {role: "independent", id: "reviewer-b"}];
  assert.deepEqual(validateGradeMapping(mapping, profile), []);
});

test("source-backed build is deterministic and carries variant/dependency/audio metadata", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "g678-shared-fixture-"));
  try {
    await mkdir(path.join(root, "NMS002", "L1", "IR"), {recursive: true});
    await mkdir(path.join(root, "NMS002", "L1", "FQ"), {recursive: true});
    await mkdir(path.join(root, "NMS002", "L1", "SA"), {recursive: true});
    await writeFile(path.join(root, "NMS002", "L1", "index.xml"), FIXTURE_XML);
    const swf = Buffer.from("CWS synthetic swf");
    await writeFile(path.join(root, "NMS002", "L1", "IR", "L1IR01.swf"), swf);
    await writeFile(path.join(root, "NMS002", "L1", "IR", "L1IR02.swf"), Buffer.from("FWS second"));
    await writeFile(path.join(root, "NMS002", "L1", "FQ", "L1FQ01.swf"), Buffer.from("ZWS quiz"));
    await writeFile(path.join(root, "NMS002", "L1", "SA", "L1IR01.mp3"), Buffer.from("audio"));
    const profile = {
      profileId: "g678-shared-source-profile-v1",
      version: "G6-G8-shared-v1",
      modules: [{...MODULES[0], lessonNumbers: [1], activePageCounts: [3]}],
    };
    const classificationRows = [{
      gradeBucket: "G6-G8-shared",
      outputPath: "G6-G8-shared/NMS002/L1/IR/L1IR01.swf",
      sha256: sha256(swf),
      bytes: swf.length,
      sourceRootKind: "canonical",
      variants: [{archive: "HelpProgramStagingv4", sha256: "a".repeat(64), bytes: swf.length + 1}],
    }];
    const dependencyRows = [{
      sourcePath: "NewHelpProgram/HELP_COURSES/NMS002/L1/index.xml",
      reference: "HELP_KEYTERMS/KT/XML/L1KTE01.xml",
      status: "unresolved-static-reference",
      candidateCount: 0,
    }, {
      sourcePath: "HelpProgramStagingv4/HELP_COURSES/NMS002/L1/index.xml",
      reference: "HELP_KEYTERMS/KT/XML/L1KTE01.xml",
      status: "unresolved-static-reference",
      candidateCount: 0,
    }];
    const first = await buildSharedCatalog({sourceRoot: root, profile, classificationRows, dependencyRows});
    const second = await buildSharedCatalog({sourceRoot: root, profile, classificationRows, dependencyRows});
    assert.equal(stableJson(first), stableJson(second));
    assert.equal(first.lessons.length, 1);
    assert.equal(first.activePagePlacementCount, 3);
    assert.equal(first.uniqueActiveSwfSha256Count, 3);
    assert.equal(first.audit.variantPlacements, 1);
    assert.equal(first.audit.dependencyHolds, 1);
    assert.equal(first.audit.audioCandidatePages, 1);
    assert.equal(first.lessons[0].pages[0].assetId, `swf-${sha256(swf)}`);
    assert.equal(first.lessons[0].pages[0].variants.length, 1);
    assert.equal(first.lessons[0].pages[0].variantDecision, "hold-source-choice-review");
    assert.deepEqual(validateSharedCatalog(first, profile), []);
    const driftRows = [{...classificationRows[0], sha256: "b".repeat(64)}];
    const drift = await buildSharedCatalog({sourceRoot: root, profile, classificationRows: driftRows, dependencyRows: []});
    assert.equal(drift.audit.classificationHashDrift.length, 1);
    assert.equal(drift.lessons[0].pages[0].sourceStatus, "classification-hash-drift");
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("strict catalog validation binds every classification row and all source-audit counts", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "g678-strict-catalog-"));
  try {
    const lessonRoot = path.join(root, "NMS002", "L1");
    for (const directory of ["IR", "FQ", "SA"]) {
      await mkdir(path.join(lessonRoot, directory), {recursive: true});
    }
    await writeFile(path.join(lessonRoot, "index.xml"), FIXTURE_XML);
    const swfBytes = [
      ["IR/L1IR01.swf", "CWS first"],
      ["IR/L1IR02.swf", "FWS second"],
      ["FQ/L1FQ01.swf", "ZWS quiz"],
    ];
    for (const [relative, value] of swfBytes) {
      await writeFile(path.join(lessonRoot, relative), Buffer.from(value));
    }
    await writeFile(path.join(lessonRoot, "SA", "L1IR01.mp3"), Buffer.from("audio"));
    const profile = {
      profileId: "g678-shared-source-profile-v1",
      version: "G6-G8-shared-v1",
      modules: [{...MODULES[0], lessonNumbers: [1], activePageCounts: [3]}],
      expected: {
        canonicalLessonXmlCount: 1,
        activePagePlacementCount: 3,
        uniqueActiveSwfSha256Count: 3,
        commentedPageCount: 1,
        bomXmlCount: 1,
        bareAmpersandCount: 1,
        canonicalSwfCount: 3,
        canonicalMp3Count: 1,
        canonicalFlaCount: 0,
        samePathDifferentHashCount: 0,
        geoAlternateLessonCount: 0,
        geoAlternateActivePageCount: 0,
      },
    };
    const initial = await buildSharedCatalog({sourceRoot: root, profile});
    const rows = initial.lessons[0].pages.map((page) => ({
      gradeBucket: "G6-G8-shared",
      outputPath: page.viewPath,
      sha256: page.sourceSha256,
      bytes: page.sourceBytes,
      variants: [],
    }));
    const catalog = await buildSharedCatalog({
      sourceRoot: root,
      profile,
      classificationRows: rows,
    });
    assert.deepEqual(validateSharedCatalog(catalog, profile, {strictCounts: true}), []);

    const countDrift = structuredClone(catalog);
    countDrift.audit.canonicalFileCounts.mp3 = 0;
    assert.ok(validateSharedCatalog(countDrift, profile, {strictCounts: true})
      .some((error) => error.includes("canonicalMp3Count")));

    const missingRowCatalog = await buildSharedCatalog({
      sourceRoot: root,
      profile,
      classificationRows: rows.slice(0, 1),
    });
    assert.equal(missingRowCatalog.lessons[0].pages[1].sourceStatus, "classification-row-missing");
    assert.ok(validateSharedCatalog(missingRowCatalog, profile, {strictCounts: true})
      .some((error) => error.includes("classification manifest row is missing")));
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("audio candidate indexing distinguishes FQ/EA, FQ/SA, and lesson-SA paths", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "g678-audio-bindings-"));
  try {
    const lessonRoot = path.join(root, "NMS002", "L1");
    for (const directory of ["FQ", "FQ/EA", "FQ/SA", "SA", "IR"]) {
      await mkdir(path.join(lessonRoot, directory), {recursive: true});
    }
    const xml = `<Lesson><LessonName>Audio fixture</LessonName><Section SName="IR"><Page>IR/L1IR01.swf</Page></Section><Section SName="FQ"><Page>FQ/L1FQ01.swf</Page></Section></Lesson>`;
    await writeFile(path.join(lessonRoot, "index.xml"), xml);
    await writeFile(path.join(lessonRoot, "IR", "L1IR01.swf"), Buffer.from("FWS ir"));
    await writeFile(path.join(lessonRoot, "FQ", "L1FQ01.swf"), Buffer.from("FWS fq"));
    for (const directory of ["FQ/EA", "FQ/SA", "SA"]) {
      await writeFile(path.join(lessonRoot, directory, "L1FQ01.mp3"), Buffer.from(directory));
    }
    const profile = {
      profileId: "g678-shared-source-profile-v1",
      version: "G6-G8-shared-v1",
      modules: [{...MODULES[0], lessonNumbers: [1], activePageCounts: [2]}],
    };
    const catalog = await buildSharedCatalog({sourceRoot: root, profile});
    const candidates = catalog.lessons[0].pages[1].audioCueCandidates;
    assert.deepEqual(
      candidates.map((candidate) => candidate.bindingKind).sort(),
      ["FQ/EA-candidate", "FQ/SA-candidate", "lesson-SA-candidate"],
    );
    assert.equal(catalog.audit.audioCandidatePages, 1);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("grade mapping application creates one primary course key and preserves tags", () => {
  const catalog = {
    lessons: [{moduleCode: "NMS002", lessonNumber: 1, stableLessonKey: "shared-nms002-l01"}],
  };
  const mapping = {
    records: [{stableLessonKey: "shared-nms002-l01", mappingId: "m1", status: "approved", primaryGrade: 7, gradeTags: [8], ccssStandardCodes: ["CCSS.MATH.CONTENT.7.EE.A.1"]}],
  };
  const result = applyGradeMapping(catalog, mapping);
  assert.equal(result.lessons[0].courseKey, "g7-nms002-l01");
  assert.deepEqual(result.lessons[0].gradeTags, [8]);
  assert.equal(result.lessons[0].mappingStatus, "approved");
});

test("classification and dependency indexes normalize archive aliases", () => {
  const rows = [{outputPath: "G6-G8-shared/GEO001/L1/IR/L1IR01.swf", variants: []}];
  const index = indexClassificationRows(rows);
  assert.equal(index.has("help_courses/geo001/l1/ir/l1ir01.swf"), true);
  const dep = indexDependencyRows([{sourcePath: "NewHelpProgram/HELP_COURSES/GEO001/L1/index.xml", status: "unresolved-static-reference"}]);
  assert.equal(dep.has("help_courses/geo001/l1/index.xml"), true);
});

test("committed profile and pending mapping pass structural validators", async () => {
  const profile = JSON.parse(await readFile(new URL("../../catalog/g678-shared-source-profile.v1.json", import.meta.url), "utf8"));
  const mapping = JSON.parse(await readFile(new URL("../../catalog/g678-grade-mapping.v1.json", import.meta.url), "utf8"));
  assert.deepEqual(validateSharedProfile(profile), []);
  assert.deepEqual(validateGradeMapping(mapping, profile), []);
  assert.equal(profile.expected.activePagePlacementCount, 2282);
  assert.equal(mapping.records.length, 44);
});
