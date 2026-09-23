#!/usr/bin/env node

import {createHash} from "node:crypto";
import {
  lstat,
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const CORPUS_PATH =
  "tools/g4-l5-ffdec-canvas-pcode-product-factory/corpus.json";
const CATALOG_PATH = "catalog/animations.json";
const REGISTRY_PATH = "packages/demos/prototype-registry.json";
const COMPLETION_LEDGER_PATH = "catalog/completion-ledger.json";
const RELEASES_PATH = "catalog/lesson-releases.json";
const EVIDENCE_ROOT =
  "work/g4-l5-ffdec-canvas-pcode-product-factory/calibration-v1";
const REPORT_JSON = "reports/g4-l5-factory-calibration-v1.json";
const REPORT_MARKDOWN = "reports/g4-l5-factory-calibration-v1.md";
const EXPECTED_FACTORY_ID =
  "g4-l5-ffdec-canvas-pcode-product-factory-v1";
const FALSE_ACCEPTANCE = Object.freeze({
  legacyFlashCourseShellConverted: false,
  modernMyLessonHostChanged: false,
  currentJavaScriptRegistered: false,
  avm1BehaviorCompiled: false,
  nestedAudioPlaybackCompiled: false,
  authoritativeOriginalRuntime: false,
  visualFidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  released: false,
  published: false,
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function resolveProject(relativePath, label) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath),
    `${label}: project-relative path required`,
  );
  const absolute = path.resolve(ROOT, relativePath);
  const relative = portable(path.relative(ROOT, absolute));
  invariant(
    relative === relativePath &&
      relative !== ".." &&
      !relative.startsWith("../"),
    `${label}: path escapes the project or is not normalized`,
  );
  return absolute;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function fileBinding(relativePath, label) {
  const absolute = resolveProject(relativePath, label);
  const info = await lstat(absolute);
  invariant(
    info.isFile() && !info.isSymbolicLink(),
    `${label}: ordinary file required`,
  );
  const bytes = await readFile(absolute);
  return Object.freeze({
    path: relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
  });
}

async function jsonBinding(relativePath, label) {
  const binding = await fileBinding(relativePath, label);
  return Object.freeze({
    ...binding,
    value: JSON.parse(await readFile(resolveProject(relativePath, label), "utf8")),
  });
}

async function walkFiles(relativeRoot) {
  const absoluteRoot = resolveProject(relativeRoot, "evidence root");
  const records = [];
  async function visit(absolute, relative) {
    const entries = await readdir(absolute, {withFileTypes: true});
    entries.sort((left, right) => left.name.localeCompare(right.name, "en"));
    for (const entry of entries) {
      const childAbsolute = path.join(absolute, entry.name);
      const childRelative = portable(path.join(relative, entry.name));
      if (entry.isDirectory()) {
        await visit(childAbsolute, childRelative);
      } else {
        invariant(entry.isFile(), `unsupported evidence entry: ${childRelative}`);
        const info = await lstat(childAbsolute);
        invariant(
          info.isFile() && !info.isSymbolicLink(),
          `evidence entry must be an ordinary file: ${childRelative}`,
        );
        records.push(Object.freeze({
          path: childRelative,
          bytes: info.size,
        }));
      }
    }
  }
  await visit(absoluteRoot, "");
  return Object.freeze(records);
}

function exactFalseAcceptance(value, label) {
  invariant(
    JSON.stringify(value) === JSON.stringify(FALSE_ACCEPTANCE),
    `${label}: acceptance effects changed`,
  );
}

function selectG4L5Pages(catalog) {
  invariant(
    catalog?.schemaVersion === 1 && Array.isArray(catalog.animations),
    "animation catalog is malformed",
  );
  const pages = catalog.animations
    .flatMap((entry) => {
      const references = Array.isArray(entry.references?.courseXml)
        ? entry.references.courseXml
        : [];
      const match = references.find(
        (reference) =>
          reference?.sourceXmlPath === "HELP_COURSES/ELMGR4/L5/index.xml",
      );
      return match ? [{entry, ordinal: match.occurrence}] : [];
    })
    .sort((left, right) => left.ordinal - right.ordinal);
  invariant(pages.length === 53, `expected 53 G4 L5 pages, found ${pages.length}`);
  invariant(
    pages.every(({entry, ordinal}, index) =>
      ordinal === index + 1 &&
      entry.flags?.shell === false &&
      entry.flags?.variant === false &&
      entry.flags?.referenced === true
    ),
    "G4 L5 page-only source order changed",
  );
  return pages;
}

function compilerVersion(stdout) {
  const match = stdout.match(/JPEXS Free Flash Decompiler v\.([0-9.]+)/);
  invariant(match, "FFDec version is absent from compiler stdout");
  return Object.freeze({
    name: "JPEXS Free Flash Decompiler",
    version: match[1],
    expectedVersion: "26.2.1",
    versionMatches: match[1] === "26.2.1",
  });
}

function riskBand(opcodes) {
  if (opcodes >= 2_000) return "behavior-heavy";
  if (opcodes >= 500) return "interactive";
  if (opcodes >= 100) return "moderate";
  return "low-script";
}

export async function buildReport() {
  const [
    corpus,
    catalog,
    registry,
    completionLedger,
    releases,
    run,
    evidenceFiles,
  ] =
    await Promise.all([
      jsonBinding(CORPUS_PATH, "factory corpus"),
      jsonBinding(CATALOG_PATH, "animation catalog"),
      jsonBinding(REGISTRY_PATH, "prototype registry"),
      jsonBinding(COMPLETION_LEDGER_PATH, "completion ledger"),
      jsonBinding(RELEASES_PATH, "lesson releases"),
      jsonBinding(`${EVIDENCE_ROOT}/run-manifest.json`, "factory run manifest"),
      walkFiles(EVIDENCE_ROOT),
    ]);

  invariant(
    corpus.value.factoryId === EXPECTED_FACTORY_ID &&
      corpus.value.release?.expectedActivePageCount === 53 &&
      corpus.value.release?.legacyFlashCourseShellExcluded === true &&
      corpus.value.release?.modernMyLessonHostRetained === true,
    "factory corpus identity changed",
  );
  invariant(
    corpus.value.productQualification?.structuralCompilerOutputAloneQualifies ===
      false &&
      corpus.value.productQualification?.scaleOutAuthorized === false,
    "factory corpus product boundary changed",
  );
  exactFalseAcceptance(corpus.value.acceptanceEffects, "factory corpus");
  const pages = selectG4L5Pages(catalog.value);
  invariant(
    pages.filter(({entry}) => entry.pairedFla).length === 47 &&
      pages.filter(({entry}) => !entry.pairedFla).length === 6 &&
      pages.filter(({entry}) => entry.audio?.exact?.length === 1).length === 48 &&
      pages.filter(({entry}) => entry.audio?.groupIds?.length === 1).length === 3,
    "G4 L5 source/audio census changed",
  );
  invariant(
    completionLedger.value?.schemaVersion === 1 &&
      completionLedger.value?.summary?.strictComplete === 0 &&
      Array.isArray(completionLedger.value.entries),
    "completion ledger identity changed",
  );
  const currentJsIds = new Set([
    ...(registry.value.entries?.map((entry) => entry.key) ?? []),
    ...completionLedger.value.entries.map((entry) => entry.animationId),
  ]);
  invariant(
    pages.filter(({entry}) => currentJsIds.has(entry.animationId)).length === 0,
    "G4 L5 no longer starts at 0 Current-JS pages",
  );
  invariant(
    !releases.value.releases?.some(
      (release) =>
        release?.scope?.grade === 4 && release?.scope?.lesson === 5,
    ),
    "G4 L5 now has a lesson release definition",
  );
  for (const {entry} of pages) {
    const workspace = resolveProject(
      `migrations/${entry.animationId}`,
      "migration workspace",
    );
    const information = await lstat(workspace).catch((error) =>
      error.code === "ENOENT" ? null : Promise.reject(error)
    );
    invariant(
      information === null,
      `${entry.animationId}: inherited migration workspace now exists`,
    );
  }

  const runValue = run.value;
  invariant(
    runValue.schemaVersion === 1 &&
      runValue.factoryId === EXPECTED_FACTORY_ID &&
      runValue.mode === "calibrate" &&
      runValue.inputLock?.corpus?.sha256 === corpus.sha256 &&
      runValue.inputLock?.catalog?.sha256 === catalog.sha256 &&
      runValue.compiler?.legacyFlashCourseShellConverted === false &&
      runValue.compiler?.modernMyLessonHostChanged === false,
    "factory run identity or input lock changed",
  );
  exactFalseAcceptance(runValue.acceptanceEffects, "factory run");
  const selections = corpus.value.calibrationSet;
  invariant(
    Array.isArray(selections) &&
      selections.length === 6 &&
      Array.isArray(runValue.members) &&
      runValue.members.length === 6,
    "factory calibration membership changed",
  );

  const members = [];
  let pinnedCompiler = null;
  for (const [index, runMember] of runValue.members.entries()) {
    const selection = selections[index];
    invariant(
      runMember.animationId === selection.animationId &&
        runMember.ordinal === selection.ordinal,
      `calibration member ${index + 1} changed`,
    );
    const manifestPath = `${EVIDENCE_ROOT}/${runMember.manifestPath}`;
    const manifest = await jsonBinding(
      manifestPath,
      `${runMember.animationId} manifest`,
    );
    invariant(
      manifest.bytes === runMember.manifest.bytes &&
        manifest.sha256 === runMember.manifest.sha256,
      `${runMember.animationId}: manifest binding changed`,
    );
    const detail = manifest.value;
    exactFalseAcceptance(detail.acceptanceEffects, runMember.animationId);
    invariant(
      detail.animationId === runMember.animationId &&
        detail.ordinal === runMember.ordinal &&
        detail.source?.unchanged === true &&
        detail.source.before?.sha256 === detail.source.after?.sha256 &&
        detail.compiler?.ffdecCanvasGenerated === true &&
        detail.compiler?.pcodeGenerated === true &&
        detail.compiler?.canvasSmoke?.headlessCallable === true &&
        detail.compiler.canvasSmoke.captures?.length === 3 &&
        detail.avm1?.execution === "not-executed" &&
        detail.audio?.accepted === false &&
        detail.audio?.playbackCompiled === false,
      `${runMember.animationId}: structural evidence contract changed`,
    );
    const ffdecStdout = await readFile(
      resolveProject(
        `${EVIDENCE_ROOT}/members/${runMember.animationId}/logs/ffdec-canvas.stdout.txt`,
        "FFDec stdout",
      ),
      "utf8",
    );
    const observedCompiler = compilerVersion(ffdecStdout);
    invariant(observedCompiler.versionMatches, "unexpected FFDec version");
    if (pinnedCompiler === null) pinnedCompiler = observedCompiler;
    invariant(
      observedCompiler.version === pinnedCompiler.version,
      "calibration members used different FFDec versions",
    );
    members.push(Object.freeze({
      ordinal: runMember.ordinal,
      animationId: runMember.animationId,
      calibrationAxes: Object.freeze([...selection.axes]),
      sourceModel: detail.pairedFla ? "paired-fla-swf" : "swf-only",
      source: Object.freeze({
        path: detail.source.path,
        bytes: detail.source.before.bytes,
        sha256: detail.source.before.sha256,
        readOnly: detail.source.before.writable === false,
        unchangedDuringCompilation: true,
      }),
      pairedFla: detail.pairedFla
        ? Object.freeze({
            path: detail.pairedFla.path,
            bytes: detail.pairedFla.bytes,
            sha256: detail.pairedFla.sha256,
            readOnly: detail.pairedFla.writable === false,
          })
        : null,
      exactExternalAudio: Object.freeze(
        detail.exactExternalAudio.map((audio) => Object.freeze({
          path: audio.path,
          bytes: audio.bytes,
          sha256: audio.sha256,
          catalogLanguage: audio.language,
          playbackCompiled: false,
          listeningAccepted: false,
        })),
      ),
      compiler: Object.freeze({
        canvasFileCount: detail.compiler.outputInventory.canvas.fileCount,
        canvasChecksumSetSha256:
          detail.compiler.outputInventory.canvas.checksumSetSha256,
        pcodeFileCount: detail.compiler.outputInventory.pcode.fileCount,
        pcodeChecksumSetSha256:
          detail.compiler.outputInventory.pcode.checksumSetSha256,
        rootSmokeCaptureCount: detail.compiler.canvasSmoke.captures.length,
      }),
      staticFacts: Object.freeze({
        nestedSpriteCount: detail.timeline.nestedSpriteCount,
        maxNestedFrameCount: detail.timeline.maxNestedFrameCount,
        pcodeBytes: detail.avm1.pcodeBytes,
        classifiedOpcodeOccurrences:
          detail.avm1.classifiedOpcodeOccurrences,
        riskBand: riskBand(detail.avm1.classifiedOpcodeOccurrences),
        externalOrNetworkOpcodeCandidates:
          detail.avm1.categoryOccurrences["external-or-network"],
        soundStreamHeadCount: detail.audio.soundStreamHead,
        soundStreamBlockCount: detail.audio.soundStreamBlock,
      }),
      evidence: Object.freeze({
        manifest: Object.freeze({
          path: manifestPath,
          bytes: manifest.bytes,
          sha256: manifest.sha256,
        }),
      }),
    }));
  }

  const riskCounts = Object.fromEntries(
    ["low-script", "moderate", "interactive", "behavior-heavy"].map(
      (band) => [band, members.filter((member) => member.staticFacts.riskBand === band).length],
    ),
  );

  return Object.freeze({
    schemaVersion: 1,
    reportType: "g4-l5-page-only-factory-calibration",
    reportId: "g4-l5-factory-calibration-v1",
    conclusion:
      "G4 L5 remains the cleanest fresh factory candidate, but only its structural compiler gate is open.",
    decision: Object.freeze({
      frontEndCompiler: "GO",
      productQualification: "NO-GO-PENDING-PRODUCT-VERTICAL-SLICE",
      fullLessonScaleOut: "NO-GO",
      reason:
        "All six frozen risk lanes compile and smoke-render, but 0/6 are maintained product modules in the official registry or modern My Lesson host, and the FFDec GPL-3.0 output boundary remains unresolved for product bundling.",
    }),
    scope: Object.freeze({
      grade: 4,
      lesson: 5,
      title: "Multiplication",
      denominator: "active-lesson-page-occurrences-only",
      activePageCount: 53,
      pairedFlaPageCount: 47,
      swfOnlyPageCount: 6,
      exactExternalAudioPageCount: 48,
      audioGroupPageCount: 3,
      currentJsPageCount: 0,
      migrationWorkspaceCount: 0,
      lessonReleaseDefinitionCount: 0,
      legacyFlashCourseShellExcluded: true,
      modernMyLessonHostRetained: true,
    }),
    calibration: Object.freeze({
      memberCount: members.length,
      compiler: pinnedCompiler,
      evidenceRoot: EVIDENCE_ROOT,
      evidenceRootTrackedByGit: false,
      evidenceFileCount: evidenceFiles.length,
      evidenceBytes: evidenceFiles.reduce((sum, file) => sum + file.bytes, 0),
      runManifest: Object.freeze({
        path: `${EVIDENCE_ROOT}/run-manifest.json`,
        bytes: run.bytes,
        sha256: run.sha256,
      }),
      riskCounts: Object.freeze(riskCounts),
      members: Object.freeze(members),
    }),
    productQualification: Object.freeze({
      completedCalibrationMembers: 0,
      requiredCalibrationMembers: 6,
      firstRecommendedSlice: "course-g04-l05-vb-008",
      firstRecommendedSliceReason:
        "Paired FLA/SWF, bounded 97-frame maximum nested domain, moderate 263 classified P-code occurrences, exact external audio, and vocabulary interaction make it the smallest representative product bridge before the 2,194-frame SWF-only Review stream.",
      requiredForEveryCalibrationMember: Object.freeze([
        ...corpus.value.productQualification.requiredForEveryCalibrationMember,
      ]),
      licensingBoundary:
        "FFDec-generated Canvas/P-code is private compiler evidence and must not enter a product bundle without project-specific licensing review.",
      currentJsRegistrationEffect: false,
      productRouteEffect: false,
      scaleOutAuthorized: false,
    }),
    inputBindings: Object.freeze({
      corpus: Object.freeze({
        path: corpus.path,
        bytes: corpus.bytes,
        sha256: corpus.sha256,
      }),
      catalog: Object.freeze({
        path: catalog.path,
        bytes: catalog.bytes,
        sha256: catalog.sha256,
      }),
      prototypeRegistry: Object.freeze({
        path: registry.path,
        bytes: registry.bytes,
        sha256: registry.sha256,
      }),
      completionLedger: Object.freeze({
        path: completionLedger.path,
        bytes: completionLedger.bytes,
        sha256: completionLedger.sha256,
      }),
      lessonReleases: Object.freeze({
        path: releases.path,
        bytes: releases.bytes,
        sha256: releases.sha256,
      }),
      generator: Object.freeze({
        path: portable(path.relative(ROOT, SCRIPT_PATH)),
      }),
    }),
    acceptanceEffects: FALSE_ACCEPTANCE,
  });
}

export function renderMarkdown(report) {
  const rows = report.calibration.members.map((member) =>
    `| ${member.ordinal} | \`${member.animationId}\` | ${member.sourceModel} | ${member.staticFacts.nestedSpriteCount} | ${member.staticFacts.maxNestedFrameCount} | ${member.staticFacts.classifiedOpcodeOccurrences.toLocaleString("en-US")} | ${member.staticFacts.riskBand} | ${member.compiler.canvasFileCount} / ${member.compiler.pcodeFileCount} |`
  ).join("\n");
  return `# G4 L5 factory calibration v1

## Decision

**G4 L5 — Multiplication remains the cleanest fresh factory candidate.**

- Front-end compiler: **GO**.
- Product qualification: **NO-GO, pending the complete product vertical slice**.
- Full 53-page scale-out: **NO-GO**.
- Current-JS remains **0/53**. The legacy Flash course shell is excluded.

All six frozen risk lanes passed source custody checks, FFDec Canvas export,
P-code export, and headless root-frame smoke rendering. That is a real
compiler result, not Current-JS product completion.

## Clean starting surface

- 53/53 active page SWFs in canonical custody.
- 47 paired FLA/SWF pages and six SWF-only pages.
- 48 pages with one exact matching-basename MP3; its catalog language remains
  \`und\`.
- Three Final Quiz pages use an audio group rather than an exact page-local
  cue.
- Zero inherited G4 L5 migration workspaces, Current-JS registrations, or
  lesson-release definitions.

## Frozen calibration result

| Source ordinal | Page | Source | Nested sprites | Max nested frames | Classified P-code ops | Static risk | Canvas / P-code files |
| ---: | --- | --- | ---: | ---: | ---: | --- | ---: |
${rows}

The ignored evidence root contains
**${report.calibration.evidenceFileCount.toLocaleString("en-US")} files /
${report.calibration.evidenceBytes.toLocaleString("en-US")} bytes**. Its
\`run-manifest.json\` SHA-256 is
\`${report.calibration.runManifest.sha256}\`. A subsequent factory check
rehashes the run and every compiler-output checksum set.

## Product gate

The first recommended product slice is
\`${report.productQualification.firstRecommendedSlice}\`:
${report.productQualification.firstRecommendedSliceReason}

Every one of the six pages must still traverse the compact IR/config,
generated candidate, maintained module or adapter, official Current-JS
registry, source-ordered calibration descriptor, private modern My Lesson
host, Replay/interaction/audio lifecycle, and desktop/mobile QA gates.

FFDec-generated Canvas/P-code remains private compiler evidence. It must not
enter a product bundle without project-specific licensing review.

No original-runtime, fidelity, audio, human, Owner, strict-completion, release,
or publication gate is opened by this report.
`;
}

async function assertOutputTarget(relativePath, extension) {
  invariant(
    relativePath.startsWith("reports/") && relativePath.endsWith(extension),
    `invalid report output: ${relativePath}`,
  );
  const absolute = resolveProject(relativePath, "report output");
  const info = await lstat(absolute).catch((error) =>
    error.code === "ENOENT" ? null : Promise.reject(error)
  );
  invariant(
    !info || (info.isFile() && !info.isSymbolicLink() && info.nlink === 1),
    `report output must be an ordinary single-link file: ${relativePath}`,
  );
  return absolute;
}

export async function writeOrCheck({check}) {
  const report = await buildReport();
  const json = stableJson(report);
  const markdown = renderMarkdown(report);
  const [jsonPath, markdownPath] = await Promise.all([
    assertOutputTarget(REPORT_JSON, ".json"),
    assertOutputTarget(REPORT_MARKDOWN, ".md"),
  ]);
  if (check) {
    const [currentJson, currentMarkdown] = await Promise.all([
      readFile(jsonPath, "utf8"),
      readFile(markdownPath, "utf8"),
    ]);
    invariant(currentJson === json, "G4 L5 factory JSON report is stale");
    invariant(
      currentMarkdown === markdown,
      "G4 L5 factory Markdown report is stale",
    );
    return Object.freeze({status: "checked", report});
  }
  await Promise.all([
    writeFile(jsonPath, json, {mode: 0o644}),
    writeFile(markdownPath, markdown, {mode: 0o644}),
  ]);
  return Object.freeze({status: "written", report});
}

function parseArguments(argv) {
  invariant(
    argv.length === 1 && (argv[0] === "--write" || argv[0] === "--check"),
    "Usage: node scripts/build-g4-l5-factory-calibration-report.mjs --write|--check",
  );
  return Object.freeze({check: argv[0] === "--check"});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  writeOrCheck(parseArguments(process.argv.slice(2)))
    .then(({status, report}) => {
      process.stdout.write(
        `${status.toUpperCase()}: G4 L5 compiler ${report.decision.frontEndCompiler}; product ${report.decision.productQualification}; scale-out ${report.decision.fullLessonScaleOut}\n`,
      );
    })
    .catch((error) => {
      process.stderr.write(`${error.stack || error.message}\n`);
      process.exitCode = 1;
    });
}
