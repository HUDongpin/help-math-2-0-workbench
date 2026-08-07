import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdir, mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import test from "node:test";

import {
  READABILITY_PROFILES,
  assertV33ReadabilityTargetsAbsent,
  chooseRepresentativeFrame,
  normalizeReadabilityEnhancement,
  parseReadabilityArguments,
  renderReadabilityMarkdown,
  validateReadabilityBaseUrl,
  validateReadabilityReportStructure,
  validateReadabilityScreenshotRoot,
} from "./qa-g4-l3-current-js-readability-v3.mjs";

function digest(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

function binding(filePath) {
  return {path: filePath, bytes: 1, sha256: digest(filePath)};
}

function enhancementFixture() {
  return {
    pageOrdinal: 36,
    animationId: "course-g04-l03-ts-008",
    source: {
      path:
        "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TS/L3TS08.swf",
      bytes: 123,
      sha256:
        "9c7288f67f764e02f4320655b64dbb57d3d690a75951b549ee5113f385e6b885",
    },
    frameDomain: "sprite-350",
    frame: 789,
    nativePaddingPixels: 4,
    desktopScale: 2.5,
    crops: [
      {
        id: "step-3",
        sourceRect: {x: 292, y: 147, width: 236, height: 149},
        paddedCropRect: {x: 288, y: 143, width: 244, height: 157},
        asset: binding(
          "public/flash-assets/courses/course-g04-l03-ts-008/readable-view/step-3.png",
        ),
        sourceCharacterIds: [99, 100, 101, 133],
        transcriptSha256: digest("step-3 transcript"),
      },
      {
        id: "step-4",
        sourceRect: {x: 292, y: 296, width: 236, height: 191},
        paddedCropRect: {x: 288, y: 292, width: 244, height: 199},
        asset: binding(
          "public/flash-assets/courses/course-g04-l03-ts-008/readable-view/step-4.png",
        ),
        sourceCharacterIds: [144, 145, 146, 147, 148, 149, 150, 151, 152],
        transcriptSha256: digest("step-4 transcript"),
      },
    ],
    defaultExpanded: true,
    originalLayoutPreserved: true,
    strictAcceptanceEffect: "none",
  };
}

function passingReportFixture() {
  const pageScreenshots = [];
  const readableScreenshots = [];
  const pages = Array.from({length: 39}, (_, index) => {
    const ordinal = index + 1;
    const animationId = ordinal === 36
      ? "course-g04-l03-ts-008"
      : `course-g04-l03-fixture-${String(ordinal).padStart(2, "0")}`;
    const representative = ordinal === 36
      ? {
          frameDomain: "sprite-350",
          frame: 789,
          declaredFrameCount: 789,
          selection:
            "v3-readable-view-source-frame-required-by-hash-bound-specification",
        }
      : {
          frameDomain: `sprite-${ordinal}`,
          frame: ordinal,
          declaredFrameCount: ordinal,
          selection: "declared-current-js-domain-terminal",
        };
    const observations = READABILITY_PROFILES.map(({id}) => {
      const screenshot = binding(
        `output/playwright/readability/${id}/${ordinal}.png`,
      );
      pageScreenshots.push(screenshot);
      const readableScreenshot = ordinal === 36
        ? binding(
            `output/playwright/readability/${id}/page-36-readable-view.png`,
          )
        : null;
      if (readableScreenshot) readableScreenshots.push(readableScreenshot);
      return {
        profileId: id,
        globalPageOrdinal: ordinal,
        animationId,
        sectionCode: "TS",
        inspectedFrame: representative.frame,
        frameDomain: representative.frameDomain,
        representativeSelection: representative.selection,
        direct: {
          identity: {
            animationId,
            module: animationId,
            frameDomain: representative.frameDomain,
            frame: representative.frame,
            language: "en",
          },
          screenshot,
        },
        wholeLesson: {
          layout: {
            horizontalOverflowPx: 0,
            runtimeStageCount: 1,
            primaryRuntimeCount: 1,
            criticalControlHorizontalClipCount: 0,
            unexpectedReadableViewCount: ordinal === 36 ? 1 : 0,
          },
          readableView: ordinal === 36
            ? {
                passed: true,
                interactions: {
                  inputMethods: ["click", "Enter", "Space", "Escape"],
                  focusRestoredAfterEscape: true,
                  passed: true,
                },
              }
            : null,
          readableScreenshot,
        },
        severity: "none",
        issues: [],
      };
    });
    return {
      globalPageOrdinal: ordinal,
      animationId,
      sectionCode: "TS",
      representative,
      candidateReport: binding(`reports/candidate-${ordinal}.json`),
      severity: "none",
      disposition: ordinal === 36
        ? "known-source-authored-small-text-resolved-by-v3-readable-view"
        : "no-automated-p0-or-p1-detected",
      observations,
      issues: [],
    };
  });
  const contactSheets = READABILITY_PROFILES.map(({id}) =>
    binding(`output/playwright/readability/contact-sheet-${id}.png`));
  return {
    schemaVersion: 1,
    reportType: "g4-l3-current-js-readability-v3",
    readabilityEnhancements: normalizeReadabilityEnhancement(
      enhancementFixture(),
    ),
    summary: {
      status: "pass-current-js-p0-p1-readability-screening",
      pagesInspected: 39,
      profileCount: 4,
      observations: 156,
      screenshotCount: 164,
      contactSheetCount: 4,
      p0Count: 0,
      p1Count: 0,
      unresolvedP0P1Count: 0,
      page36ReadableViewProfilePasses: 4,
      strictCompleteMembers: 0,
      releaseMembers: 40,
      published: false,
      strictAcceptanceEffect: "none",
    },
    pages,
    contactSheets,
    screenshots: [
      ...pageScreenshots,
      ...readableScreenshots,
      ...contactSheets,
    ],
    screeningLimitations: ["Automated current-JS screening only."],
    authorityClaims: {
      currentJavascriptReadabilityScreening: true,
      flashFidelity: false,
      originalRuntimeComparison: false,
      humanVisualReview: false,
      ownerAcceptance: false,
      strictMigrationCompletion: false,
      publicRelease: false,
    },
    acceptance: {
      acceptanceNeutral: true,
      strictAcceptanceEffect: "none",
      strictCompleteMembers: 0,
      releaseMembers: 40,
      published: false,
      statement: "Acceptance-neutral.",
    },
  };
}

test("readability profiles cover desktop, tablet, mobile, and 200% reflow", () => {
  assert.deepEqual(
    READABILITY_PROFILES.map(({id}) => id),
    [
      "desktop-1440x900",
      "tablet-1024x768",
      "mobile-390x844",
      "reflow-200-percent-720x450",
    ],
  );
  assert.deepEqual(READABILITY_PROFILES[2].viewport, {
    width: 390,
    height: 844,
  });
  assert.match(READABILITY_PROFILES[3].equivalence, /200%/);
});

test("readability closes an open map through the visible panel control", async () => {
  const source = await readFile(
    new URL("./qa-g4-l3-current-js-readability-v3.mjs", import.meta.url),
    "utf8",
  );
  assert.match(source, /data-course-map-close-control="true"/);
  assert.doesNotMatch(source, /locator\("\.lesson-shell2__legacy-tool--map"\)/);
});

test("readability CLI is loopback-only and supports generation/check outputs", () => {
  assert.equal(
    validateReadabilityBaseUrl("http://127.0.0.1:3216"),
    "http://127.0.0.1:3216",
  );
  assert.equal(
    validateReadabilityBaseUrl("http://localhost:3216"),
    "http://localhost:3216",
  );
  assert.throws(
    () => validateReadabilityBaseUrl("https://example.com"),
    /local HTTP/,
  );
  const parsed = parseReadabilityArguments([
    "--check",
    "--base-url",
    "http://localhost:3216",
    "--json-output",
    "reports/fixture.json",
  ]);
  assert.equal(parsed.check, true);
  assert.equal(parsed.baseUrl, "http://localhost:3216");
  assert.match(parsed.jsonOutput, /reports\/fixture\.json$/);
  assert.equal(parsed.artifactVersion, "v3");
  const v31 = parseReadabilityArguments(["--artifact-version", "v3-1"]);
  assert.equal(v31.artifactVersion, "v3-1");
  assert.equal(v31.baseUrl, "http://127.0.0.1:3217");
  assert.match(v31.jsonOutput, /reports\/g4-l3-current-js-readability-v3-1\.json$/);
  assert.match(v31.markdownOutput, /reports\/g4-l3-current-js-readability-v3-1\.md$/);
  assert.match(v31.screenshotRoot, /output\/playwright\/g4-l3-current-js-readability-v3-1$/);
  const v32 = parseReadabilityArguments(["--artifact-version", "v3-2"]);
  assert.equal(v32.artifactVersion, "v3-2");
  assert.equal(v32.baseUrl, "http://127.0.0.1:3218");
  assert.match(v32.jsonOutput, /reports\/g4-l3-current-js-readability-v3-2\.json$/);
  assert.match(v32.markdownOutput, /reports\/g4-l3-current-js-readability-v3-2\.md$/);
  assert.match(v32.screenshotRoot, /output\/playwright\/g4-l3-current-js-readability-v3-2$/);
  const v33 = parseReadabilityArguments(["--artifact-version", "v3-3"]);
  assert.equal(v33.artifactVersion, "v3-3");
  assert.equal(v33.baseUrl, "http://127.0.0.1:3219");
  assert.match(v33.jsonOutput, /reports\/g4-l3-current-js-readability-v3-3\.json$/);
  assert.match(v33.markdownOutput, /reports\/g4-l3-current-js-readability-v3-3\.md$/);
  assert.match(v33.screenshotRoot, /output\/playwright\/g4-l3-current-js-readability-v3-3$/);
  const v33R2 = parseReadabilityArguments(["--artifact-version", "v3-3-r2"]);
  assert.equal(v33R2.artifactVersion, "v3-3-r2");
  assert.equal(v33R2.baseUrl, "http://127.0.0.1:3219");
  assert.match(v33R2.jsonOutput, /reports\/g4-l3-current-js-readability-v3-3-r2\.json$/);
  assert.match(v33R2.markdownOutput, /reports\/g4-l3-current-js-readability-v3-3-r2\.md$/);
  assert.match(v33R2.screenshotRoot, /output\/playwright\/g4-l3-current-js-readability-v3-3-r2$/);
  assert.throws(
    () => parseReadabilityArguments(["--artifact-version", "v4"]),
    /Unsupported --artifact-version/,
  );
  assert.throws(
    () => parseReadabilityArguments(["--screenshot-root"]),
    /requires a value/,
  );
  assert.throws(() => parseReadabilityArguments(["--wat"]), /Unknown option/);
  assert.match(
    validateReadabilityScreenshotRoot(
      "output/playwright/g4-l3-current-js-readability-v3-fixture",
    ),
    /output\/playwright\/g4-l3-current-js-readability-v3-fixture$/,
  );
  assert.throws(
    () => validateReadabilityScreenshotRoot("output/playwright"),
    /dedicated project-contained/,
  );
  assert.throws(
    () => validateReadabilityScreenshotRoot("/tmp/readability"),
    /dedicated project-contained/,
  );
});

test("v3.3 readability is check-only and v3.3-r2 cannot overwrite JSON, Markdown, or PNG root", async (t) => {
  const temporaryRoot = await mkdtemp(
    path.join(tmpdir(), "g4-l3-v33-readability-"),
  );
  t.after(() => rm(temporaryRoot, {recursive: true, force: true}));

  for (const existingTarget of ["jsonOutput", "markdownOutput", "screenshotRoot"]) {
    const caseRoot = path.join(temporaryRoot, existingTarget);
    await mkdir(caseRoot, {recursive: true});
    const options = {
      artifactVersion: "v3-3-r2",
      check: false,
      jsonOutput: path.join(caseRoot, "readability.json"),
      markdownOutput: path.join(caseRoot, "readability.md"),
      screenshotRoot: path.join(caseRoot, "screenshots"),
    };
    await assert.doesNotReject(
      assertV33ReadabilityTargetsAbsent(options),
    );
    if (existingTarget === "screenshotRoot") {
      await mkdir(options.screenshotRoot);
    } else {
      await writeFile(options[existingTarget], "existing\n");
    }
    await assert.rejects(
      assertV33ReadabilityTargetsAbsent(options),
      /immutable; refusing to overwrite existing artifact target/,
    );
    await assert.doesNotReject(
      assertV33ReadabilityTargetsAbsent({...options, check: true}),
    );
    await assert.doesNotReject(
      assertV33ReadabilityTargetsAbsent({
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
    assertV33ReadabilityTargetsAbsent(frozenV33),
    /v3\.3 readability generation is frozen/,
  );
  await assert.doesNotReject(
    assertV33ReadabilityTargetsAbsent({...frozenV33, check: true}),
  );
});

test("representative selection uses first stop, terminal, and Page 36 frame 789", () => {
  assert.deepEqual(
    chooseRepresentativeFrame({
      animationId: "course-g04-l03-vb-003",
      candidate: {
        timeline: {
          main: {frameDomain: "sprite-106", frameCount: 160},
        },
        autoplayEvidence: {firstExactStopFrame: 116},
      },
    }),
    {
      frameDomain: "sprite-106",
      frameCount: 160,
      frame: 116,
      declaredFrameCount: 160,
      selection: "first-exact-source-stop",
    },
  );
  assert.equal(
    chooseRepresentativeFrame({
      animationId: "course-g04-l03-rw-003",
      candidate: {
        timeline: {
          local: {timelineId: "sprite-49", frameCount: 278},
        },
      },
    }).frame,
    278,
  );
  assert.deepEqual(
    chooseRepresentativeFrame({
      animationId: "course-g04-l03-ts-008",
      candidate: {},
    }),
    {
      frameDomain: "sprite-350",
      frame: 789,
      declaredFrameCount: 789,
      selection:
        "v3-readable-view-source-frame-required-by-hash-bound-specification",
    },
  );
});

test("readable enhancement normalization freezes source, crops, text IDs, and boundary", () => {
  const fixture = enhancementFixture();
  assert.deepEqual(normalizeReadabilityEnhancement(fixture), fixture);
  const splitManifest = {
    source: {
      animationId: fixture.animationId,
      swf: {
        path: fixture.source.path,
        sha256: fixture.source.sha256,
      },
      frameDomain: fixture.frameDomain,
      frame: fixture.frame,
    },
    presentation: {
      nativePaddingPixels: fixture.nativePaddingPixels,
      desktopScale: fixture.desktopScale,
      defaultExpanded: fixture.defaultExpanded,
      originalStageRemainsVisible: fixture.originalLayoutPreserved,
      strictAcceptanceEffect: fixture.strictAcceptanceEffect,
    },
    files: {
      crops: fixture.crops.map(({id, sourceRect, paddedCropRect, asset}) => ({
        id,
        sourceRect,
        paddedCropRect,
        ...asset,
      })),
    },
    transcriptBinding: fixture.crops.map(({
      id,
      sourceCharacterIds,
      transcriptSha256,
    }) => ({id, sourceCharacterIds, transcriptSha256})),
  };
  assert.deepEqual(
    normalizeReadabilityEnhancement(
      splitManifest,
      {sourceBytes: fixture.source.bytes},
    ),
    fixture,
  );
  const drifted = structuredClone(fixture);
  drifted.crops[0].sourceCharacterIds = [99];
  assert.throws(
    () => normalizeReadabilityEnhancement(drifted),
    /Step 3 readable crop binding drifted/,
  );
  const promoted = structuredClone(fixture);
  promoted.strictAcceptanceEffect = "strict-complete";
  assert.throws(
    () => normalizeReadabilityEnhancement(promoted),
    /strict-acceptance boundary drifted/,
  );
});

test("passing report requires 39 × 4 observations and all 164 PNG bindings", () => {
  const report = passingReportFixture();
  assert.deepEqual(validateReadabilityReportStructure(report), []);
  assert(
    validateReadabilityReportStructure({
      reportType: "unknown-readability-successor",
      environment: {baseUrl: "http://127.0.0.1:3218"},
    }).some((error) => error.includes("reportType is unsupported")),
  );

  const v31Report = structuredClone(report);
  v31Report.reportType = "g4-l3-current-js-readability-v3-1";
  v31Report.environment = {baseUrl: "http://127.0.0.1:3217"};
  v31Report.sourceBindings = {
    generator: binding("scripts/qa-g4-l3-current-js-readability-v3.mjs"),
    currentJavascriptProgress: binding("reports/progress.json"),
    navigationContract: binding("reports/navigation.json"),
    readableAssetsManifest: binding("reports/readable-assets.json"),
    readableViewComponent: binding(
      "apps/web/components/g4-l3-readable-view.tsx",
    ),
    readableViewSpec: binding("apps/web/lib/g4-l3-readable-view.ts"),
    wholeLessonPlayer: binding(
      "apps/web/components/g4-l3-whole-lesson-player.tsx",
    ),
    globalStyles: binding("apps/web/app/globals.css"),
    ts08GeneratedRenderer: binding(
      "public/flash-assets/courses/course-g04-l03-ts-008/canvas-renderer.js",
    ),
  };
  v31Report.artifactIdentity = {
    variant: "v3-1",
    version: "v3.1",
    reportType: "g4-l3-current-js-readability-v3-1",
    title: "G4 L3 current-JS readability v3.1",
    generatorSourceBinding: v31Report.sourceBindings.generator,
  };
  assert.deepEqual(
    validateReadabilityReportStructure(v31Report, {
      expectedArtifactVersion: "v3-1",
    }),
    [],
  );
  const missingImplementationBinding = structuredClone(v31Report);
  delete missingImplementationBinding.sourceBindings.readableViewComponent;
  assert(
    validateReadabilityReportStructure(missingImplementationBinding).some(
      (error) => error.includes("exact readability implementation"),
    ),
  );
  v31Report.environment.baseUrl = "http://127.0.0.1:3216";
  assert(
    validateReadabilityReportStructure(v31Report).some((error) =>
      error.includes("environment.baseUrl")),
  );
  v31Report.environment.baseUrl = "http://127.0.0.1:3217";
  v31Report.artifactIdentity.version = "v3";
  assert(
    validateReadabilityReportStructure(v31Report).some((error) =>
      error.includes("report type, title, version")),
  );

  const v32Report = structuredClone(report);
  v32Report.reportType = "g4-l3-current-js-readability-v3-2";
  v32Report.environment = {baseUrl: "http://127.0.0.1:3218"};
  v32Report.sourceBindings = structuredClone(v31Report.sourceBindings);
  v32Report.artifactIdentity = {
    variant: "v3-2",
    version: "v3.2",
    reportType: "g4-l3-current-js-readability-v3-2",
    title: "G4 L3 current-JS readability v3.2",
    generatorSourceBinding: v32Report.sourceBindings.generator,
  };
  assert.deepEqual(
    validateReadabilityReportStructure(v32Report, {
      expectedArtifactVersion: "v3-2",
    }),
    [],
  );
  v32Report.environment.baseUrl = "http://127.0.0.1:3217";
  assert(
    validateReadabilityReportStructure(v32Report).some((error) =>
      error.includes("environment.baseUrl")),
  );
  v32Report.environment.baseUrl = "http://127.0.0.1:3218";
  delete v32Report.sourceBindings.globalStyles;
  assert(
    validateReadabilityReportStructure(v32Report).some((error) =>
      error.includes("exact readability implementation")),
  );

  const v33Report = structuredClone(report);
  v33Report.reportType = "g4-l3-current-js-readability-v3-3";
  v33Report.environment = {baseUrl: "http://127.0.0.1:3219"};
  v33Report.sourceBindings = structuredClone(v31Report.sourceBindings);
  v33Report.artifactIdentity = {
    variant: "v3-3",
    version: "v3.3",
    reportType: "g4-l3-current-js-readability-v3-3",
    title: "G4 L3 current-JS readability v3.3",
    generatorSourceBinding: v33Report.sourceBindings.generator,
  };
  assert.deepEqual(
    validateReadabilityReportStructure(v33Report, {
      expectedArtifactVersion: "v3-3",
    }),
    [],
  );
  assert(
    validateReadabilityReportStructure(v32Report, {
      expectedArtifactVersion: "v3-3",
    }).some((error) => error.includes("report artifact version must be v3-3")),
  );
  const wrongV33Port = structuredClone(v33Report);
  wrongV33Port.environment.baseUrl = "http://127.0.0.1:3218";
  assert(
    validateReadabilityReportStructure(wrongV33Port).some((error) =>
      error.includes("environment.baseUrl")),
  );
  const wrongV33Title = structuredClone(v33Report);
  wrongV33Title.artifactIdentity.title = "G4 L3 current-JS readability v3.2";
  assert(
    validateReadabilityReportStructure(wrongV33Title).some((error) =>
      error.includes("report type, title, version")),
  );
  const wrongV33Hash = structuredClone(v33Report);
  wrongV33Hash.artifactIdentity.generatorSourceBinding = {
    ...wrongV33Hash.artifactIdentity.generatorSourceBinding,
    sha256: "f".repeat(64),
  };
  assert(
    validateReadabilityReportStructure(wrongV33Hash).some((error) =>
      error.includes("report type, title, version")),
  );

  const v33R2Report = structuredClone(v33Report);
  v33R2Report.reportType = "g4-l3-current-js-readability-v3-3-r2";
  v33R2Report.artifactIdentity = {
    variant: "v3-3-r2",
    version: "v3.3-r2",
    reportType: "g4-l3-current-js-readability-v3-3-r2",
    title: "G4 L3 current-JS readability v3.3-r2",
    generatorSourceBinding: v33R2Report.sourceBindings.generator,
  };
  assert.deepEqual(
    validateReadabilityReportStructure(v33R2Report, {
      expectedArtifactVersion: "v3-3-r2",
    }),
    [],
  );
  assert(
    validateReadabilityReportStructure(v33Report, {
      expectedArtifactVersion: "v3-3-r2",
    }).some((error) => error.includes("report artifact version must be v3-3-r2")),
  );

  const missingProfile = structuredClone(report);
  missingProfile.pages[0].observations.pop();
  assert(
    validateReadabilityReportStructure(missingProfile).some((error) =>
      error.includes("four bound observations")),
  );

  const overflow = structuredClone(report);
  overflow.pages[0].observations[0].wholeLesson.layout
    .horizontalOverflowPx = 2;
  assert(
    validateReadabilityReportStructure(overflow).some((error) =>
      error.includes("invalid frame identity, runtime, or layout")),
  );

  const leaked = structuredClone(report);
  leaked.pages[0].observations[0].wholeLesson.layout
    .unexpectedReadableViewCount = 1;
  assert(
    validateReadabilityReportStructure(leaked).some((error) =>
      error.includes("leaked onto Page 1")),
  );

  const missingKeyboard = structuredClone(report);
  missingKeyboard.pages[35].observations[0].wholeLesson.readableView
    .interactions.inputMethods = ["click"];
  assert(
    validateReadabilityReportStructure(missingKeyboard).some((error) =>
      error.includes("click/keyboard/Escape interactions")),
  );
});

test("markdown states current-JS coverage and all acceptance boundaries", () => {
  const markdown = renderReadabilityMarkdown(passingReportFixture());
  assert.match(markdown, /39\/39 pages × 4\/4 viewports = 156 observations/);
  assert.match(markdown, /strict 0\/40, unpublished/);
  assert.match(markdown, /not original Flash evidence/);
  assert.match(markdown, /sprite-350:789/);

  const v31Report = passingReportFixture();
  v31Report.reportType = "g4-l3-current-js-readability-v3-1";
  v31Report.artifactIdentity = {
    title: "G4 L3 current-JS readability v3.1",
  };
  assert.match(
    renderReadabilityMarkdown(v31Report),
    /^# G4 L3 current-JS readability v3\.1/m,
  );

  const v32Report = passingReportFixture();
  v32Report.reportType = "g4-l3-current-js-readability-v3-2";
  v32Report.artifactIdentity = {
    title: "G4 L3 current-JS readability v3.2",
  };
  assert.match(
    renderReadabilityMarkdown(v32Report),
    /^# G4 L3 current-JS readability v3\.2/m,
  );

  const v33Report = passingReportFixture();
  v33Report.reportType = "g4-l3-current-js-readability-v3-3";
  v33Report.artifactIdentity = {
    title: "G4 L3 current-JS readability v3.3",
  };
  assert.match(
    renderReadabilityMarkdown(v33Report),
    /^# G4 L3 current-JS readability v3\.3/m,
  );

  const v33R2Report = passingReportFixture();
  v33R2Report.reportType = "g4-l3-current-js-readability-v3-3-r2";
  v33R2Report.artifactIdentity = {
    title: "G4 L3 current-JS readability v3.3-r2",
  };
  assert.match(
    renderReadabilityMarkdown(v33R2Report),
    /^# G4 L3 current-JS readability v3\.3-r2/m,
  );
});

test("script source preserves dedicated output and does not mutate generated renderer", async () => {
  const source = await readFile(
    new URL("./qa-g4-l3-current-js-readability-v3.mjs", import.meta.url),
    "utf8",
  );
  assert.match(source, /g4-l3-current-js-readability-v3\.json/);
  assert.match(source, /expectedTs08RendererSha256/);
  assert.doesNotMatch(source, /writeFile\([^)]*canvas-renderer/);
  assert.match(
    source,
    /\.lesson-shell2__page-picker,\.lesson-shell2__section-tabs,\.lesson-shell2__learning-actions button/,
  );
  assert.doesNotMatch(source, /\.lesson-shell2__section-tabs button/);
});
