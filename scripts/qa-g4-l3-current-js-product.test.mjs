import assert from "node:assert/strict";
import {mkdir, mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import test from "node:test";

import {
  AUTHORITY_CLAIMS,
  QA_PROFILES,
  assertV33GenerationTargetsAbsent,
  buildAnimationUrl,
  buildCourseUrl,
  buildEvidenceDigests,
  buildShellUrl,
  parseArguments,
  replayCounterTransition,
  renderMarkdown,
  validateLocalBaseUrl,
  validateReportStructure,
  validateWholeLessonPlayerObservation,
} from "./qa-g4-l3-current-js-product.mjs";

function passingCourseMapFixture(locale, route, screenshot = null) {
  return {
    locale,
    route,
    status: "pass",
    screenshot,
    player: {
      observationKind: "live-whole-lesson-player",
      lessonPlayer: "g4-l3-whole-lesson-mvp",
      presentation: "wide-functional-audit-candidate",
      nativeCompositeStage: "800x600",
      pagePickerOptions: Array.from({length: 39}, () => ({})),
    },
    map: {
      observationKind: "real-course-map-buttons",
      rowSelector: ".lesson-shell2__map-content button[data-animation-id]",
      pageRows: Array.from({length: 39}, (_, index) => ({
        animationId:
          `course-g04-l03-fixture-${String(index + 1).padStart(2, "0")}`,
        ordinal: index + 1,
        sectionCode: ["IR", "RW", "VB", "IN", "TI", "GS", "TS", "FQ"][
          Math.min(7, Math.floor(index / 5))
        ],
        spanishTitleStatus: "fixture-status",
      })),
      sectionCodes: ["IR", "RW", "VB", "IN", "TI", "GS", "TS", "FQ"],
    },
    interactions: {
      observationKind: "in-course-player-interactions-no-extra-route-visits",
      pickerPage1To2: {passed: true},
      previousToPage1: {passed: true},
      sectionFirstPage: {passed: true},
      mapJump: {passed: true},
      terminalCompletionIdempotent: {passed: true},
      exactlyOnePrimaryRuntimeThroughout: {
        observations: Array.from({length: 6}, () => ({})),
        passed: true,
      },
    },
  };
}

test("route builders preserve locale and acceptance-neutral audit context", () => {
  assert.equal(buildCourseUrl("en"), "/courses/4/3");
  assert.equal(buildCourseUrl("es"), "/es/courses/4/3");
  assert.equal(
    buildAnimationUrl("course-g04-l03-vb-005", {locale: "en", fixedFrame: true}),
    "/animations/course-g04-l03-vb-005?auditContext=g4-l3-lesson&lang=en&seed=0&frame=1",
  );
  assert.equal(
    buildAnimationUrl("course-g04-l03-vb-005", {locale: "es"}),
    "/es/animations/course-g04-l03-vb-005?auditContext=g4-l3-lesson&lang=es&seed=0",
  );
  assert.equal(buildShellUrl("es"), "/es/animations/shell-course-g04-l03-index-local?auditContext=g4-l3-lesson&lang=es&seed=0&frame=50&scenario=lesson-map-audit");
  assert.throws(() => buildAnimationUrl("course-g05-l13-rw-002"), /Unsafe G4 L3/);
});

test("base URL validation is loopback-only and credential-free", () => {
  assert.equal(validateLocalBaseUrl("http://127.0.0.1:3213"), "http://127.0.0.1:3213");
  assert.equal(validateLocalBaseUrl("http://localhost:3213"), "http://localhost:3213");
  assert.throws(() => validateLocalBaseUrl("https://example.com"), /local HTTP/);
  assert.throws(() => validateLocalBaseUrl("http://user:pass@127.0.0.1:3213"), /credentials/);
  assert.throws(() => validateLocalBaseUrl("http://127.0.0.1:3213/path"), /must not include/);
});

test("CLI parses check mode and rejects missing or unknown values", () => {
  const parsed = parseArguments(["--check", "--base-url", "http://localhost:3213"]);
  assert.equal(parsed.check, true);
  assert.equal(parsed.baseUrl, "http://localhost:3213");
  assert.equal(parseArguments([]).baseUrl, "http://localhost:3213");
  const controlled = parseArguments(["--controlled-ceo-preview", "--base-url", "http://127.0.0.1:3216"]);
  assert.equal(controlled.controlledCeoPreview, true);
  assert.equal(controlled.baseUrl, "http://127.0.0.1:3216");
  assert.match(controlled.jsonOutput, /reports\/g4-l3-controlled-ceo-preview-qa\.json$/);
  assert.match(controlled.markdownOutput, /reports\/g4-l3-controlled-ceo-preview-qa\.md$/);
  assert.match(controlled.screenshotRoot, /output\/playwright\/g4-l3-controlled-ceo-preview-qa$/);
  assert.equal(controlled.artifactVersion, "v3");
  assert.equal(controlled.writeProductAlias, true);
  const controlledV31 = parseArguments([
    "--controlled-ceo-preview",
    "--artifact-version",
    "v3-1",
  ]);
  assert.equal(controlledV31.artifactVersion, "v3-1");
  assert.equal(controlledV31.baseUrl, "http://127.0.0.1:3217");
  assert.equal(controlledV31.writeProductAlias, false);
  assert.match(controlledV31.jsonOutput, /reports\/g4-l3-controlled-ceo-preview-v3-1-qa\.json$/);
  assert.match(controlledV31.markdownOutput, /reports\/g4-l3-controlled-ceo-preview-v3-1-qa\.md$/);
  assert.match(controlledV31.screenshotRoot, /output\/playwright\/g4-l3-controlled-ceo-preview-v3-1-qa$/);
  const productV32 = parseArguments(["--artifact-version", "v3-2"]);
  assert.equal(productV32.artifactVersion, "v3-2");
  assert.equal(productV32.baseUrl, "http://127.0.0.1:3218");
  assert.equal(productV32.writeProductAlias, false);
  assert.match(productV32.jsonOutput, /reports\/g4-l3-current-javascript-product-qa-v3-2\.json$/);
  assert.match(productV32.markdownOutput, /reports\/g4-l3-current-javascript-product-qa-v3-2\.md$/);
  assert.match(productV32.screenshotRoot, /output\/playwright\/g4-l3-current-javascript-product-qa-v3-2$/);
  const controlledV32 = parseArguments([
    "--controlled-ceo-preview",
    "--artifact-version",
    "v3-2",
  ]);
  assert.equal(controlledV32.artifactVersion, "v3-2");
  assert.equal(controlledV32.baseUrl, "http://127.0.0.1:3218");
  assert.equal(controlledV32.writeProductAlias, false);
  assert.match(controlledV32.jsonOutput, /reports\/g4-l3-controlled-ceo-preview-v3-2-qa\.json$/);
  assert.match(controlledV32.markdownOutput, /reports\/g4-l3-controlled-ceo-preview-v3-2-qa\.md$/);
  assert.match(controlledV32.screenshotRoot, /output\/playwright\/g4-l3-controlled-ceo-preview-v3-2-qa$/);
  const productV33 = parseArguments(["--artifact-version", "v3-3"]);
  assert.equal(productV33.artifactVersion, "v3-3");
  assert.equal(productV33.baseUrl, "http://127.0.0.1:3219");
  assert.equal(productV33.writeProductAlias, false);
  assert.match(productV33.jsonOutput, /reports\/g4-l3-current-javascript-product-qa-v3-3\.json$/);
  assert.match(productV33.markdownOutput, /reports\/g4-l3-current-javascript-product-qa-v3-3\.md$/);
  assert.match(productV33.screenshotRoot, /output\/playwright\/g4-l3-current-javascript-product-qa-v3-3$/);
  const controlledV33 = parseArguments([
    "--controlled-ceo-preview",
    "--artifact-version",
    "v3-3",
  ]);
  assert.equal(controlledV33.artifactVersion, "v3-3");
  assert.equal(controlledV33.baseUrl, "http://127.0.0.1:3219");
  assert.equal(controlledV33.writeProductAlias, false);
  assert.match(controlledV33.jsonOutput, /reports\/g4-l3-controlled-ceo-preview-v3-3-qa\.json$/);
  assert.match(controlledV33.markdownOutput, /reports\/g4-l3-controlled-ceo-preview-v3-3-qa\.md$/);
  assert.match(controlledV33.screenshotRoot, /output\/playwright\/g4-l3-controlled-ceo-preview-v3-3-qa$/);
  const productV33R2 = parseArguments(["--artifact-version", "v3-3-r2"]);
  assert.equal(productV33R2.artifactVersion, "v3-3-r2");
  assert.equal(productV33R2.baseUrl, "http://127.0.0.1:3219");
  assert.equal(productV33R2.writeProductAlias, false);
  assert.match(productV33R2.jsonOutput, /reports\/g4-l3-current-javascript-product-qa-v3-3-r2\.json$/);
  assert.match(productV33R2.markdownOutput, /reports\/g4-l3-current-javascript-product-qa-v3-3-r2\.md$/);
  assert.match(productV33R2.screenshotRoot, /output\/playwright\/g4-l3-current-javascript-product-qa-v3-3-r2$/);
  const controlledV33R2 = parseArguments([
    "--controlled-ceo-preview",
    "--artifact-version",
    "v3-3-r2",
  ]);
  assert.equal(controlledV33R2.artifactVersion, "v3-3-r2");
  assert.equal(controlledV33R2.baseUrl, "http://127.0.0.1:3219");
  assert.equal(controlledV33R2.writeProductAlias, false);
  assert.match(controlledV33R2.jsonOutput, /reports\/g4-l3-controlled-ceo-preview-v3-3-r2-qa\.json$/);
  assert.match(controlledV33R2.markdownOutput, /reports\/g4-l3-controlled-ceo-preview-v3-3-r2-qa\.md$/);
  assert.match(controlledV33R2.screenshotRoot, /output\/playwright\/g4-l3-controlled-ceo-preview-v3-3-r2-qa$/);
  assert.equal(
    parseArguments(["--controlled-ceo-preview", "--no-product-alias"])
      .writeProductAlias,
    false,
  );
  assert.throws(
    () => parseArguments(["--artifact-version", "v4"]),
    /Unsupported --artifact-version/,
  );
  assert.throws(() => parseArguments(["--json-output"]), /requires a value/);
  assert.throws(() => parseArguments(["--wat"]), /Unknown option/);
});

test("v3.3 is check-only and v3.3-r2 generation fails closed instead of overwriting any final target", async (t) => {
  const temporaryRoot = await mkdtemp(
    path.join(tmpdir(), "g4-l3-v33-product-qa-"),
  );
  t.after(() => rm(temporaryRoot, {recursive: true, force: true}));

  for (const existingTarget of ["jsonOutput", "markdownOutput", "screenshotRoot"]) {
    const caseRoot = path.join(temporaryRoot, existingTarget);
    await mkdir(caseRoot, {recursive: true});
    const options = {
      artifactVersion: "v3-3-r2",
      check: false,
      jsonOutput: path.join(caseRoot, "qa.json"),
      markdownOutput: path.join(caseRoot, "qa.md"),
      screenshotRoot: path.join(caseRoot, "screenshots"),
    };
    await assert.doesNotReject(
      assertV33GenerationTargetsAbsent(options),
    );
    if (existingTarget === "screenshotRoot") {
      await mkdir(options.screenshotRoot);
    } else {
      await writeFile(options[existingTarget], "existing\n");
    }
    await assert.rejects(
      assertV33GenerationTargetsAbsent(options),
      /immutable; refusing to overwrite existing artifact target/,
    );
    await assert.doesNotReject(
      assertV33GenerationTargetsAbsent({...options, check: true}),
    );
    await assert.doesNotReject(
      assertV33GenerationTargetsAbsent({
        ...options,
        artifactVersion: "v3-2",
      }),
    );
  }
  const frozenV33 = {
    artifactVersion: "v3-3",
    check: false,
    jsonOutput: path.join(temporaryRoot, "frozen-v33.json"),
    markdownOutput: path.join(temporaryRoot, "frozen-v33.md"),
    screenshotRoot: path.join(temporaryRoot, "frozen-v33-screenshots"),
  };
  await assert.rejects(
    assertV33GenerationTargetsAbsent(frozenV33),
    /v3\.3 QA generation is frozen/,
  );
  await assert.doesNotReject(
    assertV33GenerationTargetsAbsent({...frozenV33, check: true}),
  );
});

test("Replay counter transition requires one exact monotonic increment", () => {
  assert.deepEqual(replayCounterTransition(0, 1, 1), {
    previousReplay: 0,
    observedReplay: 1,
    expectedReplay: 1,
    countersAreIntegers: true,
    advanced: true,
    exactlyOnce: true,
  });
  assert.equal(replayCounterTransition(0, 2, 1).advanced, true);
  assert.equal(replayCounterTransition(0, 2, 1).exactlyOnce, false);
  assert.equal(replayCounterTransition(1, 1, 2).advanced, false);
  assert.equal(replayCounterTransition(1, 1, 2).exactlyOnce, false);
  assert.equal(replayCounterTransition(1, Number.NaN, 2).countersAreIntegers, false);
});

test("profiles cover desktop English and mobile Spanish reduced motion", () => {
  assert.deepEqual(QA_PROFILES.desktopEnglish.viewport, {width: 1280, height: 900});
  assert.deepEqual(QA_PROFILES.mobileSpanishReduced.viewport, {width: 390, height: 844});
  assert.equal(QA_PROFILES.mobileSpanishReduced.reducedMotion, "reduce");
});

test("authority claims are fail-closed", () => {
  assert(Object.keys(AUTHORITY_CLAIMS).length >= 12);
  assert(Object.values(AUTHORITY_CLAIMS).every((value) => value === false));
});

test("whole-lesson observation requires the canonical picker, sections, initial page, and one runtime", () => {
  const contract = {
    pages: Array.from({length: 39}, (_, index) => ({
      animationId: `course-g04-l03-fixture-${String(index + 1).padStart(2, "0")}`,
      globalPageOrdinal: index + 1,
      sectionCode: ["IR", "RW", "VB", "IN", "TI", "GS", "TS", "FQ"][
        Math.min(7, Math.floor(index / 5))
      ],
      labels: {
        pageSpanish: {
          status: index % 2 === 0
            ? "missing-page-level-spanish-title"
            : "exact-subpage-anchor-label",
        },
      },
    })),
    sections: ["IR", "RW", "VB", "IN", "TI", "GS", "TS", "FQ"].map((code) => ({code})),
  };
  const observation = {
    observationKind: "live-whole-lesson-player",
    lessonPlayer: "g4-l3-whole-lesson-mvp",
    candidateMode: "true",
    progressKind: "learner-session",
    progressStorage: "local-device-only",
    hydrated: "true",
    language: "en",
    currentAnimationId: contract.pages[0].animationId,
    currentPage: 1,
    currentReplayCount: 0,
    pagePickerValue: contract.pages[0].animationId,
    pagePickerOptions: contract.pages.map(({animationId}, index) => ({
      animationId,
      label: `${index + 1}. fixture`,
    })),
    sectionCodes: contract.sections.map(({code}) => code),
    mapRows: contract.pages.map((page) => ({
      animationId: page.animationId,
      ordinal: page.globalPageOrdinal,
      sectionCode: page.sectionCode,
      spanishTitleStatus: page.labels.pageSpanish.status,
    })),
    presentation: "wide-functional-audit-candidate",
    shellLayout: "help-math-course-shell-800x600-v1",
    shellVisualAuthority: "ffdec-static-structural-candidate",
    nativeCompositeStage: "800x600",
    authoredStage: "800x600",
    viewportFitWidth: 800,
    runtime: {
      shellCount: 1,
      stageCount: 1,
      animationId: contract.pages[0].animationId,
      module: contract.pages[0].animationId,
      language: "en",
      outputMode: "graphic",
      forbiddenLegacyEmbedCount: 0,
      runtimeDomainErrorCount: 0,
    },
  };

  assert.deepEqual(validateWholeLessonPlayerObservation(observation, contract, "en"), []);

  const drifted = structuredClone(observation);
  [drifted.pagePickerOptions[0], drifted.pagePickerOptions[1]] = [
    drifted.pagePickerOptions[1],
    drifted.pagePickerOptions[0],
  ];
  drifted.sectionCodes.pop();
  drifted.currentAnimationId = contract.pages[1].animationId;
  drifted.progressStorage = "memory-only";
  drifted.runtime.stageCount = 2;
  const failures = validateWholeLessonPlayerObservation(drifted, contract, "en");
  assert(failures.some((failure) => failure.includes("canonical 39-page contract")));
  assert(failures.some((failure) => failure.includes("7 sections")));
  assert(failures.some((failure) => failure.includes("initial animation")));
  assert(failures.some((failure) => failure.includes("progress storage")));
  assert(failures.some((failure) => failure.includes("2 runtime stages")));
});

test("course-map QA accepts the intentional wide-screen default-open state", async () => {
  const source = await readFile(
    new URL("./qa-g4-l3-current-js-product.mjs", import.meta.url),
    "utf8",
  );
  assert.match(source, /getAttribute\("aria-expanded"\) !== "true"/);
  assert.match(
    source,
    /data-course-map-trigger="modern-accessible-control"/,
  );
  assert.match(
    source,
    /data-course-map-trigger="legacy-source-hit-area"/,
  );
  assert.match(source, /useModernMapTrigger = await modernMapTrigger\.isVisible\(\)/);
  assert.doesNotMatch(source, /locator\("\.lesson-shell2__legacy-tool--map"\)/);
  assert.match(source, /lesson-shell2__side-panel--map/);
});

test("passing schema requires all 39 pages, 82 routes, 121 visits, and zero product failures", () => {
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-current-javascript-lesson-product-qa",
    summary: {
      status: "pass-current-javascript-product-layer",
      activePages: 39,
      releaseMembers: 40,
      strictCompleteMembers: 0,
      published: false,
      uniqueRoutesVerified: 82,
      routeVisits: 121,
      runnableShellModules: 1,
      desktopFixedFrameRoutes: 39,
      mobileSpanishReducedMotionRoutes: 39,
      mobileSpanishGraphicRoutes: 1,
      mobileSpanishFailClosedSemanticRoutes: 38,
      replayMouseEnterSpaceRoutes: 39,
      failureCount: 0,
      axeSeriousOrCriticalViolations: 0,
      horizontalOverflowFailures: 0,
      runtimeRenderFailures: 0,
      navigationFailures: 0,
      replayFailures: 0,
      consoleErrors: 0,
      pageErrors: 0,
      failedRequests: 0,
      badHttpResponses: 0,
    },
    routeChecks: {
      courseMaps: [
        passingCourseMapFixture("en", "/courses/4/3"),
        passingCourseMapFixture("es", "/es/courses/4/3"),
      ],
      shellAuditRoutes: [{}, {}],
      animations: Array.from({length: 39}, () => ({})),
    },
    authorityClaims: AUTHORITY_CLAIMS,
    acceptance: {acceptanceNeutral: true, humanVisualAccepted: false, ownerAccepted: false, strictMigrationComplete: false, lessonComplete: false},
  };
  assert.deepEqual(validateReportStructure(report), []);
  assert(
    validateReportStructure({
      reportType: "unknown-successor-report",
      environment: {baseUrl: "http://127.0.0.1:3218"},
    }).some((error) => error.includes("reportType is unsupported")),
  );

  const v31Report = structuredClone(report);
  v31Report.reportType = "g4-l3-current-javascript-lesson-product-qa-v3-1";
  v31Report.environment = {baseUrl: "http://127.0.0.1:3217"};
  v31Report.sourceBindings = {
    productQaGenerator: {
      path: "scripts/qa-g4-l3-current-js-product.mjs",
      bytes: 1,
      sha256: "a".repeat(64),
    },
  };
  v31Report.artifactIdentity = {
    variant: "v3-1",
    version: "v3.1",
    reportType: "g4-l3-current-javascript-lesson-product-qa-v3-1",
    title: "G4 L3 current-JavaScript lesson product QA v3.1",
    generatorSourceBinding: v31Report.sourceBindings.productQaGenerator,
  };
  assert.deepEqual(
    validateReportStructure(v31Report, {expectedArtifactVersion: "v3-1"}),
    [],
  );
  v31Report.environment.baseUrl = "http://127.0.0.1:3216";
  assert(
    validateReportStructure(v31Report).some((error) =>
      error.includes("environment.baseUrl")),
  );
  v31Report.environment.baseUrl = "http://127.0.0.1:3217";
  v31Report.artifactIdentity.title = "stale title";
  assert(
    validateReportStructure(v31Report).some((error) =>
      error.includes("report type, title, version")),
  );

  const v32Report = structuredClone(report);
  v32Report.reportType = "g4-l3-current-javascript-lesson-product-qa-v3-2";
  v32Report.environment = {baseUrl: "http://127.0.0.1:3218"};
  v32Report.sourceBindings = {
    productQaGenerator: {
      path: "scripts/qa-g4-l3-current-js-product.mjs",
      bytes: 1,
      sha256: "b".repeat(64),
    },
  };
  v32Report.artifactIdentity = {
    variant: "v3-2",
    version: "v3.2",
    reportType: "g4-l3-current-javascript-lesson-product-qa-v3-2",
    title: "G4 L3 current-JavaScript lesson product QA v3.2",
    generatorSourceBinding: v32Report.sourceBindings.productQaGenerator,
  };
  assert.deepEqual(
    validateReportStructure(v32Report, {expectedArtifactVersion: "v3-2"}),
    [],
  );
  v32Report.environment.baseUrl = "http://127.0.0.1:3217";
  assert(
    validateReportStructure(v32Report).some((error) =>
      error.includes("environment.baseUrl")),
  );
  v32Report.environment.baseUrl = "http://127.0.0.1:3218";
  v32Report.artifactIdentity.generatorSourceBinding = {
    ...v32Report.artifactIdentity.generatorSourceBinding,
    sha256: "c".repeat(64),
  };
  assert(
    validateReportStructure(v32Report).some((error) =>
      error.includes("report type, title, version")),
  );

  const v33Report = structuredClone(report);
  v33Report.reportType = "g4-l3-current-javascript-lesson-product-qa-v3-3";
  v33Report.environment = {baseUrl: "http://127.0.0.1:3219"};
  v33Report.sourceBindings = {
    productQaGenerator: {
      path: "scripts/qa-g4-l3-current-js-product.mjs",
      bytes: 1,
      sha256: "d".repeat(64),
    },
  };
  v33Report.artifactIdentity = {
    variant: "v3-3",
    version: "v3.3",
    reportType: "g4-l3-current-javascript-lesson-product-qa-v3-3",
    title: "G4 L3 current-JavaScript lesson product QA v3.3",
    generatorSourceBinding: v33Report.sourceBindings.productQaGenerator,
  };
  assert.deepEqual(
    validateReportStructure(v33Report, {expectedArtifactVersion: "v3-3"}),
    [],
  );
  assert(
    validateReportStructure(v32Report, {
      expectedArtifactVersion: "v3-3",
    }).some((error) => error.includes("report artifact version must be v3-3")),
  );
  const wrongV33Port = structuredClone(v33Report);
  wrongV33Port.environment.baseUrl = "http://127.0.0.1:3218";
  assert(
    validateReportStructure(wrongV33Port).some((error) =>
      error.includes("environment.baseUrl")),
  );
  const wrongV33Title = structuredClone(v33Report);
  wrongV33Title.artifactIdentity.title = "stale v3.2 title";
  assert(
    validateReportStructure(wrongV33Title).some((error) =>
      error.includes("report type, title, version")),
  );
  const wrongV33Hash = structuredClone(v33Report);
  wrongV33Hash.artifactIdentity.generatorSourceBinding = {
    ...wrongV33Hash.artifactIdentity.generatorSourceBinding,
    sha256: "e".repeat(64),
  };
  assert(
    validateReportStructure(wrongV33Hash).some((error) =>
      error.includes("report type, title, version")),
  );

  const v33R2Report = structuredClone(v33Report);
  v33R2Report.reportType = "g4-l3-current-javascript-lesson-product-qa-v3-3-r2";
  v33R2Report.artifactIdentity = {
    variant: "v3-3-r2",
    version: "v3.3-r2",
    reportType: "g4-l3-current-javascript-lesson-product-qa-v3-3-r2",
    title: "G4 L3 current-JavaScript lesson product QA v3.3-r2",
    generatorSourceBinding: v33R2Report.sourceBindings.productQaGenerator,
  };
  assert.deepEqual(
    validateReportStructure(v33R2Report, {
      expectedArtifactVersion: "v3-3-r2",
    }),
    [],
  );
  assert(
    validateReportStructure(v33Report, {
      expectedArtifactVersion: "v3-3-r2",
    }).some((error) => error.includes("report artifact version must be v3-3-r2")),
  );

  report.summary.replayFailures = 1;
  assert(validateReportStructure(report).some((error) => error.includes("replayFailures")));
});

test("passing schema rejects picker-derived map placeholders and missing player interactions", () => {
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-current-javascript-lesson-product-qa",
    summary: {
      status: "pass-current-javascript-product-layer",
      activePages: 39,
      releaseMembers: 40,
      strictCompleteMembers: 0,
      published: false,
      uniqueRoutesVerified: 82,
      routeVisits: 121,
      runnableShellModules: 1,
      desktopFixedFrameRoutes: 39,
      mobileSpanishReducedMotionRoutes: 39,
      mobileSpanishGraphicRoutes: 1,
      mobileSpanishFailClosedSemanticRoutes: 38,
      replayMouseEnterSpaceRoutes: 39,
      failureCount: 0,
      axeSeriousOrCriticalViolations: 0,
      horizontalOverflowFailures: 0,
      runtimeRenderFailures: 0,
      navigationFailures: 0,
      replayFailures: 0,
      consoleErrors: 0,
      pageErrors: 0,
      failedRequests: 0,
      badHttpResponses: 0,
    },
    routeChecks: {
      courseMaps: [
        passingCourseMapFixture("en", "/courses/4/3"),
        passingCourseMapFixture("es", "/es/courses/4/3"),
      ],
      shellAuditRoutes: [{}, {}],
      animations: Array.from({length: 39}, () => ({})),
    },
    authorityClaims: AUTHORITY_CLAIMS,
    acceptance: {
      acceptanceNeutral: true,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      lessonComplete: false,
    },
  };

  report.routeChecks.courseMaps[0].map = {
    pageRows: Array.from({length: 39}, () => ({})),
    sectionCodes: ["IR", "RW", "VB", "IN", "TI", "GS", "TS", "FQ"],
  };
  assert(
    validateReportStructure(report).some((error) =>
      error.includes("real 39-row Course Maps")),
  );

  report.routeChecks.courseMaps[0] =
    passingCourseMapFixture("en", "/courses/4/3");
  delete report.routeChecks.courseMaps[0].interactions.previousToPage1;
  assert(
    validateReportStructure(report).some((error) =>
      error.includes("required in-course interactions")),
  );
});

test("controlled preview schema requires all 121 visible boundaries and private headers at strict 0/40 unpublished", () => {
  const screenshot = (index) => ({
    path: `output/playwright/g4-l3-controlled-ceo-preview-qa/capture-${index}.png`,
    bytes: index,
    sha256: String(index).padStart(64, "0"),
  });
  const routeChecks = {
    courseMaps: [
      passingCourseMapFixture("en", "/courses/4/3", screenshot(1)),
      passingCourseMapFixture("es", "/es/courses/4/3", screenshot(2)),
    ],
    shellAuditRoutes: [
      {locale: "en", route: "/animations/shell-course-g04-l03-index-local", status: "pass", screenshot: screenshot(3)},
      {locale: "es", route: "/es/animations/shell-course-g04-l03-index-local", status: "pass", screenshot: screenshot(4)},
    ],
    animations: Array.from({length: 39}, (_, index) => ({
      animationId: `course-g04-l03-fixture-${String(index + 1).padStart(2, "0")}`,
      desktopEnglish: {
        route: `/animations/course-g04-l03-fixture-${String(index + 1).padStart(2, "0")}?frame=1`,
        status: "pass",
        screenshot: index === 0 ? screenshot(5) : null,
      },
      mobileSpanishReduced: {
        route: `/es/animations/course-g04-l03-fixture-${String(index + 1).padStart(2, "0")}`,
        status: "pass",
        screenshot: index === 38 ? screenshot(6) : null,
      },
      replay: {
        route: `/animations/course-g04-l03-fixture-${String(index + 1).padStart(2, "0")}`,
        status: "pass",
      },
    })),
  };
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-controlled-ceo-preview-qa",
    summary: {
      status: "pass-machine-verified-controlled-ceo-preview",
      activePages: 39,
      releaseMembers: 40,
      strictCompleteMembers: 0,
      published: false,
      uniqueRoutesVerified: 82,
      routeVisits: 121,
      runnableShellModules: 1,
      desktopFixedFrameRoutes: 39,
      mobileSpanishReducedMotionRoutes: 39,
      mobileSpanishGraphicRoutes: 1,
      mobileSpanishFailClosedSemanticRoutes: 38,
      replayMouseEnterSpaceRoutes: 39,
      controlledPreviewBoundaryPasses: 121,
      privateNoStoreHeaderPasses: 121,
      noindexHeaderPasses: 121,
      controlledPreviewIdentityHeaderPasses: 121,
      failureCount: 0,
      axeSeriousOrCriticalViolations: 0,
      horizontalOverflowFailures: 0,
      runtimeRenderFailures: 0,
      navigationFailures: 0,
      replayFailures: 0,
      consoleErrors: 0,
      pageErrors: 0,
      failedRequests: 0,
      badHttpResponses: 0,
    },
    routeChecks,
    evidenceDigests: buildEvidenceDigests(routeChecks),
    authorityClaims: AUTHORITY_CLAIMS,
    acceptance: {
      acceptanceNeutral: true,
      controlledCeoPreview: true,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      lessonComplete: false,
    },
  };
  assert.deepEqual(validateReportStructure(report), []);
  const v32Report = structuredClone(report);
  v32Report.reportType = "g4-l3-controlled-ceo-preview-v3-2-qa";
  v32Report.environment = {baseUrl: "http://127.0.0.1:3218"};
  v32Report.sourceBindings = {
    productQaGenerator: {
      path: "scripts/qa-g4-l3-current-js-product.mjs",
      bytes: 1,
      sha256: "d".repeat(64),
    },
  };
  v32Report.artifactIdentity = {
    variant: "v3-2",
    version: "v3.2",
    reportType: "g4-l3-controlled-ceo-preview-v3-2-qa",
    title: "G4 L3 Controlled CEO Preview v3.2 QA",
    generatorSourceBinding: v32Report.sourceBindings.productQaGenerator,
  };
  assert.deepEqual(
    validateReportStructure(v32Report, {expectedArtifactVersion: "v3-2"}),
    [],
  );
  const v33Report = structuredClone(report);
  v33Report.reportType = "g4-l3-controlled-ceo-preview-v3-3-qa";
  v33Report.environment = {baseUrl: "http://127.0.0.1:3219"};
  v33Report.sourceBindings = {
    productQaGenerator: {
      path: "scripts/qa-g4-l3-current-js-product.mjs",
      bytes: 1,
      sha256: "e".repeat(64),
    },
  };
  v33Report.artifactIdentity = {
    variant: "v3-3",
    version: "v3.3",
    reportType: "g4-l3-controlled-ceo-preview-v3-3-qa",
    title: "G4 L3 Controlled CEO Preview v3.3 QA",
    generatorSourceBinding: v33Report.sourceBindings.productQaGenerator,
  };
  assert.deepEqual(
    validateReportStructure(v33Report, {expectedArtifactVersion: "v3-3"}),
    [],
  );
  const v33R2Report = structuredClone(v33Report);
  v33R2Report.reportType = "g4-l3-controlled-ceo-preview-v3-3-r2-qa";
  v33R2Report.artifactIdentity = {
    variant: "v3-3-r2",
    version: "v3.3-r2",
    reportType: "g4-l3-controlled-ceo-preview-v3-3-r2-qa",
    title: "G4 L3 Controlled CEO Preview v3.3-r2 QA",
    generatorSourceBinding: v33R2Report.sourceBindings.productQaGenerator,
  };
  assert.deepEqual(
    validateReportStructure(v33R2Report, {
      expectedArtifactVersion: "v3-3-r2",
    }),
    [],
  );
  report.summary.noindexHeaderPasses = 120;
  assert(validateReportStructure(report).some((error) => error.includes("noindexHeaderPasses")));
});

test("markdown repeats the authority boundary", () => {
  const report = {
    reportType: "g4-l3-current-javascript-lesson-product-qa",
    summary: {
      status: "pass-current-javascript-product-layer",
      uniqueRoutesVerified: 82,
      routeVisits: 121,
      currentJavascriptAnimationModules: 39,
      runnableShellModules: 1,
      desktopFixedFrameRoutes: 39,
      mobileSpanishReducedMotionRoutes: 39,
      mobileSpanishGraphicRoutes: 1,
      mobileSpanishFailClosedSemanticRoutes: 38,
      replayMouseEnterSpaceRoutes: 39,
      axeSeriousOrCriticalViolations: 0,
      axeAudits: 43,
      consoleErrors: 0,
      pageErrors: 0,
      failedRequests: 0,
      badHttpResponses: 0,
      horizontalOverflowFailures: 0,
      strictCompleteMembers: 0,
      releaseMembers: 40,
      published: false,
    },
    routeChecks: {
      animations: [{animationId: "course-g04-l03-vb-005", desktopEnglish: {status: "pass"}, mobileSpanishReduced: {status: "pass"}, replay: {status: "pass"}}],
      courseMaps: [{route: "/courses/4/3", status: "pass", map: {pageRows: Array(39)}, layout: {horizontalOverflowPx: 0}}],
      shellAuditRoutes: [{route: "/animations/shell-course-g04-l03-index-local", status: "pass", runnableCurrentJavascriptModule: true, sections: [{pageCount: 39}]}],
    },
    acceptance: {statement: "Original-runtime and human acceptance remain false."},
  };
  const markdown = renderMarkdown(report);
  assert.match(markdown, /Acceptance-neutral browser evidence/);
  assert.match(markdown, /Original-runtime and human acceptance remain false/);

  const v31Markdown = renderMarkdown({
    ...structuredClone(report),
    reportType: "g4-l3-controlled-ceo-preview-v3-1-qa",
    artifactIdentity: {title: "G4 L3 Controlled CEO Preview v3.1 QA"},
  });
  assert.match(v31Markdown, /^# G4 L3 Controlled CEO Preview v3\.1 QA/m);

  const v32Markdown = renderMarkdown({
    ...structuredClone(report),
    reportType: "g4-l3-controlled-ceo-preview-v3-2-qa",
    artifactIdentity: {title: "G4 L3 Controlled CEO Preview v3.2 QA"},
  });
  assert.match(v32Markdown, /^# G4 L3 Controlled CEO Preview v3\.2 QA/m);

  const v33Markdown = renderMarkdown({
    ...structuredClone(report),
    reportType: "g4-l3-controlled-ceo-preview-v3-3-qa",
    artifactIdentity: {title: "G4 L3 Controlled CEO Preview v3.3 QA"},
  });
  assert.match(v33Markdown, /^# G4 L3 Controlled CEO Preview v3\.3 QA/m);
});
