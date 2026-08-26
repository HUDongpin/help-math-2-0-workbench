#!/usr/bin/env node

import {createHash} from "node:crypto";
import {readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const SCHEMA_VERSION = 1;
const SOURCE_ARCHIVE_PREFIX = "source-assets/flash/HELP MATH_ORIGINAL FILES/";

const MACHINE_AUDIT_PATH = path.join(projectRoot, "reports", "g4-l3-machine-source-audits.json");
const PREFLIGHT_PATH = path.join(projectRoot, "reports", "g4-l3-automation-preflight.json");
const ANIMATE_PREPARE_PATH = path.join(projectRoot, "reports", "g4-l3-animate-prepare-readiness.json");
const BATCHES_PATH = path.join(projectRoot, "catalog", "batches.json");
const LESSON_RELEASES_PATH = path.join(projectRoot, "catalog", "lesson-releases.json");
const LESSONS_PATH = path.join(projectRoot, "catalog", "lessons.json");
const AUDIO_GROUPS_PATH = path.join(projectRoot, "catalog", "audio-groups.json");
const DEFAULT_JSON_OUTPUT = path.join(projectRoot, "reports", "g4-l3-implementation-work-cards.json");
const DEFAULT_MARKDOWN_OUTPUT = path.join(projectRoot, "reports", "g4-l3-implementation-work-cards.md");

const INTERACTION_SIGNAL_IDS = new Set([
  "mouse-events",
  "clip-events",
  "keyboard-events",
  "input-fields",
  "score-or-answer-state",
  "replay-or-reset",
]);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function relative(filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join("/");
}

function decodeXml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&apos;", "'");
}

function parseAttributes(source) {
  const attributes = {};
  const expression = /([\w:-]+)\s*=\s*"([^"]*)"/g;
  for (const match of source.matchAll(expression)) attributes[match[1]] = decodeXml(match[2]);
  return attributes;
}

function tagText(source, tagName) {
  const match = source.match(new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match ? decodeXml(match[1].trim()) : null;
}

function normalizeArchivePath(value) {
  return value.replaceAll("\\", "/").replace(/^\/+|\/+$/g, "").replace(/\/{2,}/g, "/");
}

/**
 * Parse only the bounded G4 L3 lesson facts used by this report. The source is
 * valid XML, but comments deliberately retain historical Page elements; they
 * must be removed before active-page enumeration.
 */
export function parseLessonXml(xml) {
  const comments = [...xml.matchAll(/<!--[\s\S]*?-->/g)].map((match) => match[0]);
  const activeXml = xml.replace(/<!--[\s\S]*?-->/g, "");
  const pageRoot = normalizeArchivePath(tagText(activeXml, "PageRoot") || "");
  const sections = [];
  const pages = [];
  const sectionExpression = /<Section\b([^>]*)>([\s\S]*?)<\/Section>/gi;
  let globalPageOrdinal = 0;
  for (const sectionMatch of activeXml.matchAll(sectionExpression)) {
    const attributes = parseAttributes(sectionMatch[1]);
    const body = sectionMatch[2];
    const titleBlock = body.match(/<Title>([\s\S]*?)<\/Title>/i)?.[1] || "";
    const section = {
      code: attributes.SName || null,
      number: attributes.SNumber ? Number(attributes.SNumber) : null,
      titleEnglish: tagText(titleBlock, "English"),
      titleSpanish: tagText(titleBlock, "Spanish"),
      pageCount: 0,
    };
    const pageExpression = /<Page\b([^>]*)>([\s\S]*?)<\/Page>/gi;
    let sectionPageOrdinal = 0;
    for (const pageMatch of body.matchAll(pageExpression)) {
      sectionPageOrdinal += 1;
      globalPageOrdinal += 1;
      const pageAttributes = parseAttributes(pageMatch[1]);
      const sectionRelativePath = normalizeArchivePath(decodeXml(pageMatch[2].trim()));
      pages.push({
        globalPageOrdinal,
        sectionPageOrdinal,
        sectionCode: section.code,
        sectionNumber: section.number,
        sectionTitleEnglish: section.titleEnglish,
        sectionTitleSpanish: section.titleSpanish,
        titleRaw: pageAttributes.Title ?? null,
        randomAudioRaw: pageAttributes.RandomAudio ?? null,
        backgroundTextRaw: pageAttributes.BGText ?? null,
        navigationRaw: pageAttributes.Navigation ?? null,
        sectionRelativePath,
        archiveRelativePath: normalizeArchivePath(`${pageRoot}/${sectionRelativePath}`),
      });
    }
    section.pageCount = sectionPageOrdinal;
    sections.push(section);
  }
  return {
    courseName: tagText(activeXml, "CourseName"),
    titleRaw: tagText(activeXml, "NewTitle1"),
    lessonName: tagText(activeXml, "LessonName"),
    lessonNumber: Number(tagText(activeXml, "LessonNumber")),
    pageRoot,
    commentedBlockCount: comments.length,
    commentedPageReferenceCount: comments.reduce(
      (sum, comment) => sum + [...comment.matchAll(/<Page\b/gi)].length,
      0,
    ),
    sections,
    pages,
  };
}

function signalOccurrences(item) {
  return Object.fromEntries(
    [...item.scripts.signals]
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((signal) => [signal.id, signal.occurrences]),
  );
}

function structuralMetrics(item) {
  const tags = item.swf.tagCounts;
  return {
    spriteDefinitionCount: tags.DefineSprite || 0,
    staticallyRootReachableDefinitionCount: item.swf.frameDomains.staticallyRootReachableDefinitionCount,
    placeObject2Count: tags.PlaceObject2 || 0,
    vectorShapeDefinitionCount:
      (tags.DefineShape || 0) + (tags.DefineShape2 || 0) + (tags.DefineShape3 || 0),
    textDefinitionCount: (tags.DefineText || 0) + (tags.DefineText2 || 0) + (tags.DefineEditText || 0),
    rasterDefinitionCount:
      (tags.DefineBits || 0) +
      (tags.DefineBitsJPEG3 || 0) +
      (tags.DefineBitsLossless || 0) +
      (tags.DefineBitsLossless2 || 0),
    morphShapeDefinitionCount: tags.DefineMorphShape || 0,
    buttonDefinitionCount: tags.DefineButton2 || 0,
    longestStaticallyRootReachableDomain: item.swf.frameDomains.longestStaticallyRootReachableDomain,
  };
}

function itemSignals(item) {
  const occurrences = signalOccurrences(item);
  const interactionOccurrenceCount = Object.entries(occurrences)
    .filter(([id]) => INTERACTION_SIGNAL_IDS.has(id))
    .reduce((sum, [, count]) => sum + count, 0);
  const interactionCandidate = Boolean(
    interactionOccurrenceCount ||
    item.scripts.buttonHandlerFileCount ||
    item.scripts.clipHandlerFileCount ||
    item.swf.tagCounts.DefineButton2 ||
    item.swf.tagCounts.DefineEditText
  );
  const randomOccurrenceCount = item.scripts.random?.occurrences || 0;
  const externalOccurrenceCount = item.externalDependencies.actionScriptApiCandidates.reduce(
    (sum, candidate) => sum + candidate.occurrences,
    0,
  );
  const embeddedAudioTags = item.swf.audio.tagCounts;
  const embeddedAudioTagCount = Object.values(embeddedAudioTags).reduce((sum, count) => sum + count, 0);
  return {
    actionScript: {
      version: item.scripts.actionScriptVersion,
      exportedScriptFileCount: item.scripts.exportedScriptFileCount,
      frameScriptFileCount: item.scripts.frameScriptFileCount,
      buttonHandlerFileCount: item.scripts.buttonHandlerFileCount,
      clipHandlerFileCount: item.scripts.clipHandlerFileCount,
      signalOccurrences: occurrences,
      staticScriptEvidenceSha256: item.scripts.scriptEvidenceFingerprintSha256,
    },
    interaction: {
      status: interactionCandidate ? "static-candidate" : "not-detected-by-static-audit",
      candidate: interactionCandidate,
      occurrenceCount: interactionOccurrenceCount,
      caveat: "Static handler and token matches do not prove a reachable runtime interaction or its semantics.",
    },
    random: {
      status: randomOccurrenceCount ? "static-candidate" : "not-detected-by-static-audit",
      candidate: randomOccurrenceCount > 0,
      occurrenceCount: randomOccurrenceCount,
      files: [...(item.scripts.random?.files || [])].sort((left, right) => left.path.localeCompare(right.path)),
      caveat: "Static random() calls do not enumerate reachable outcomes, call order, or seed semantics.",
    },
    external: {
      status: externalOccurrenceCount || item.externalDependencies.swfImportTags.length
        ? "review-required-static-candidate"
        : "none-detected-by-static-audit",
      candidate: externalOccurrenceCount > 0 || item.externalDependencies.swfImportTags.length > 0,
      occurrenceCount: externalOccurrenceCount,
      actionScriptApiCandidates: item.externalDependencies.actionScriptApiCandidates,
      swfImportTags: item.externalDependencies.swfImportTags,
      legacyCallsExecutedDuringAudit: item.externalDependencies.legacyEndpointInvocationsDuringAudit,
      caveat: "No legacy endpoint was executed. Every candidate needs an explicit disabled or reviewed modern disposition.",
    },
    embeddedAudio: {
      status: embeddedAudioTagCount ? "static-tags-detected" : "none-detected-by-static-audit",
      tagCount: embeddedAudioTagCount,
      tagCounts: embeddedAudioTags,
      languageAssignment: "unresolved",
      cueMapping: "unresolved",
    },
  };
}

/**
 * This recommendation is deliberately bounded to static source signals. It is
 * an implementation starting point, not a renderer acceptance decision.
 */
export function recommendRenderer({sourceKind, releaseRole, signals, metrics}) {
  const stateful = Boolean(
    releaseRole === "course-shell" ||
    signals.interaction.candidate ||
    signals.random.candidate ||
    signals.external.candidate
  );
  const dense = Boolean(
    metrics.staticallyRootReachableDefinitionCount >= 40 ||
    metrics.placeObject2Count >= 1500 ||
    metrics.rasterDefinitionCount >= 10 ||
    metrics.morphShapeDefinitionCount >= 20
  );
  const svgCandidate = Boolean(
    !stateful &&
    !dense &&
    metrics.staticallyRootReachableDefinitionCount <= 3 &&
    metrics.rasterDefinitionCount === 0 &&
    metrics.morphShapeDefinitionCount <= 2
  );
  const primary = svgCandidate ? "react-svg" : "react-state-machine+canvas";
  const engineHint = svgCandidate
    ? "svg-dom"
    : dense
      ? "createjs-or-pixijs-unresolved"
      : "createjs-candidate";
  const confidence = sourceKind === "fla+swf" && svgCandidate ? "medium-low" : "low";
  return {
    status: "provisional-static-source-recommendation",
    primary,
    engineHint,
    confidence,
    evidence: [
      {fact: "sourceKind", value: sourceKind},
      {fact: "courseShell", value: releaseRole === "course-shell"},
      {fact: "staticInteractionCandidate", value: signals.interaction.candidate},
      {fact: "staticRandomCandidate", value: signals.random.candidate},
      {fact: "staticExternalCandidate", value: signals.external.candidate},
      {fact: "staticallyRootReachableDefinitionCount", value: metrics.staticallyRootReachableDefinitionCount},
      {fact: "placeObject2Count", value: metrics.placeObject2Count},
      {fact: "rasterDefinitionCount", value: metrics.rasterDefinitionCount},
      {fact: "morphShapeDefinitionCount", value: metrics.morphShapeDefinitionCount},
    ],
    unresolved: [
      "authoritative natural-playback display-list behavior",
      "mask, blend, filter, and authoring-library semantics requiring Animate/runtime confirmation",
      "editable-vector versus bitmap fidelity at required frames",
      ...(dense && !svgCandidate ? ["CreateJS versus PixiJS engine choice"] : []),
    ],
    decisionBoundary:
      "Re-evaluate after current FLA authoring audit when available and authoritative original-runtime traces; this recommendation does not prove fidelity or completion.",
    productionExclusions: ["ruffle-reference-only", "video-cannot-replace-interaction"],
  };
}

export function deriveScenarioFamilies({releaseRole, classification, signals}) {
  const families = [
    "root-natural-entry-and-playback",
    "english-language-path",
    "spanish-language-path",
    "terminal-state-and-complete-replay-reset",
  ];
  if (signals.interaction.candidate) families.push("all-reachable-pointer-button-and-clip-event-paths");
  if ((signals.actionScript.signalOccurrences["keyboard-events"] || 0) > 0) {
    families.push("keyboard-focus-enter-space-and-source-key-paths");
  }
  if ((signals.actionScript.signalOccurrences["input-fields"] || 0) > 0) {
    families.push("input-valid-invalid-empty-and-boundary-states");
  }
  if ((signals.actionScript.signalOccurrences["score-or-answer-state"] || 0) > 0) {
    families.push("correct-incorrect-score-and-completion-branches");
  }
  if (signals.random.candidate) families.push("every-source-proven-random-outcome-with-deterministic-seed-binding");
  if (signals.external.candidate) families.push("each-external-call-candidate-disabled-or-reviewed-modern-disposition");
  if (classification.xmlPage?.navigationRaw) families.push("xml-navigation-on-off-behavior");
  if (releaseRole === "course-shell") {
    families.push("all-39-page-navigation-targets-and-return-context");
    families.push("shell-language-course-progress-and-persistence-states");
  }
  return families;
}

function frameDomainWork(item) {
  const domains = item.swf.frameDomains.domains;
  const reachableCandidates = domains
    .filter((domain) => domain.staticallyRootReachable)
    .map((domain) => ({
      domainId: domain.domainId,
      kind: domain.kind,
      declaredFrameCount: domain.declaredFrameCount,
      parentDomainIds: domain.parentDomainIds,
      staticDomainFingerprintSha256: domain.domainFingerprintSha256,
      requiredDisposition: domain.kind === "root" ? "root-domain-requirement-unresolved" : "unresolved",
    }));
  const staticallyUnreachableDefinitionIds = domains
    .filter((domain) => !domain.staticallyRootReachable)
    .map((domain) => domain.domainId)
    .sort();
  return {
    status: "unresolved",
    staticMethod: item.swf.frameDomains.method,
    rootFrameCount: item.swf.frameDomains.rootFrameCount,
    staticallyRootReachableCandidates: reachableCandidates,
    staticallyUnreachableDefinitionIds,
    requiredTasks: [
      "enumerate every structurally root-reachable timeline in frame-domain-disposition.json",
      "use ActionScript, linkage, authoring, and natural runtime evidence to resolve dynamic reachability",
      "assign root, composited, independent, nonvisual, or unresolved disposition without treating static placement as runtime proof",
      "declare entry placement/state and separate one-indexed frame counts for every required nested domain",
    ],
    strictCoverageEstablished: false,
  };
}

function authoringWork(item, animateContext) {
  if (!item.source.fla) {
    return {
      status: "source-unavailable-swf-only",
      sourceFla: null,
      required: false,
      requiredTasks: [],
      unresolvedSourceLimitation:
        "No paired FLA is present; authoring-library, named-layer, source-font, and original authoring-timeline facts remain unavailable unless the owner supplies it.",
      confidenceEffect: "reduced",
    };
  }
  return {
    status: "pending-human-assisted-animate-audit",
    sourceFla: {
      path: item.source.fla.path,
      bytes: item.source.fla.bytes,
      sha256: item.source.fla.sha256,
      physicalHashVerified: item.source.fla.physicalHashVerified,
    },
    required: true,
    currentAutomatedBlankJsflProbeReady: animateContext.currentAutomatedBlankJsflProbeReady,
    nextSafeStep: {
      mode: "paired-fla-swf",
      prepareOnlyAvailable: true,
      prepareOnlyCommand: [
        "node",
        "scripts/run-assisted-animate-authoring-audit.mjs",
        "--dependency-fla",
        item.source.fla.path,
        "--evidence-id",
        item.animationId,
        "--source-sha256",
        item.source.fla.sha256,
        "--paired-swf",
        item.source.swf.path,
        "--paired-swf-sha256",
        item.source.swf.sha256,
        "--prepare-only",
      ],
      fullRunRequiresNamedHumanDialogOperator: true,
      fullRunAdditionalRequiredFlag: ["--dialog-operator", "<named-human>"],
      allowedHumanAction: "The named human may acknowledge only the legacy ActionScript conversion warning popup.",
      automatedDialogInteractionAllowed: false,
      shippedSwfExecutedOrEquivalentByThisMode: false,
      evidenceDestination: `work/animate/dependency-authoring-audits/${item.animationId}/`,
    },
    requiredTasks: [
      "run the paired-source command above with --prepare-only to bind independent read-only FLA and shipped-SWF copies without launching Animate",
      "for a later full run, open only the byte-identical read-only working copy in licensed Adobe Animate",
      "have the named --dialog-operator human acknowledge only the legacy conversion warning popup; do not automate the dialog",
      "run the current recursive authoring audit for timeline, library, scripts, fonts, symbols, masks, filters, and linkage",
      "close without saving, publishing, or exporting and re-hash the working copy",
      "finalize the hash-bound authoring audit without treating it as runtime, visual, audio, human, or owner acceptance",
    ],
    authoringAuditCompleted: false,
  };
}

function originalRuntimeWork(item, signals) {
  return {
    status: "unresolved",
    required: true,
    requiredTasks: [
      "capture native 800x600 playback in an authorized original Adobe runtime",
      "record exact player/runtime version, launch path, host context, and immutable source hashes",
      "execute source-evidenced natural traces for every reachable interaction, branch, nested domain, language, and Replay state",
      ...(signals.random.candidate
        ? ["observe and bind every source-proven random branch without forcing or inventing outcomes"]
        : []),
      ...(signals.external.candidate
        ? ["observe external-call intent without enabling unreviewed legacy endpoints"]
        : []),
      ...(item.releaseRole === "course-shell"
        ? ["prove all course-shell navigation targets and return behavior through natural execution"]
        : []),
      "retain one-indexed native-stage PNGs and ordered event/state hash chains for baseline promotion",
    ],
    authoritativeBaselineEstablished: false,
    naturalExecutionProofEstablished: false,
  };
}

function audioWork(item, signals, associatedFiles) {
  const hasAudioEvidence = signals.embeddedAudio.tagCount > 0 || associatedFiles.length > 0;
  return {
    status: hasAudioEvidence ? "inventory-only-cues-unresolved" : "no-audio-detected-cue-disposition-unresolved",
    embeddedAudio: signals.embeddedAudio,
    catalogAssociation: {
      exactFileCount: item.audio.exactFilePaths.length,
      sharedGroupIds: item.audio.sharedGroupIds,
      sharedGroupFileCount: item.audio.sharedGroupFileCount,
      associatedFileCount: item.audio.associatedFileCount,
      languages: item.audio.languages,
      allPhysicalHashesVerified: item.audio.allAssociatedPhysicalHashesVerified,
      files: associatedFiles,
    },
    requiredTasks: [
      "extract and hash every embedded stream/DefineSound asset without recompressing the source",
      "map every embedded and external file to language, frame domain, scenario, start frame, stop rule, and replay/reset behavior",
      "measure duration and verify synchronization in the authoritative runtime and JavaScript implementation",
      "have a named human listen to every required English and Spanish path and record the result",
      "record missing-original-audio exceptions explicitly; do not silently synthesize replacements",
    ],
    cueMappingEstablished: false,
    listeningAcceptanceEstablished: false,
    bilingualAudioAcceptanceEstablished: false,
  };
}

function resolveAssociatedAudioFiles(item, audioGroupMap, inventoryFileMap) {
  const bindings = [];
  for (const projectPath of item.audio.exactFilePaths) {
    const binding = inventoryFileMap.get(projectPath);
    if (!binding) throw new Error(`${item.animationId}: exact audio path missing from machine inventory: ${projectPath}`);
    bindings.push(binding);
  }
  for (const groupId of item.audio.sharedGroupIds) {
    const group = audioGroupMap.get(groupId);
    if (!group) throw new Error(`${item.animationId}: missing audio group ${groupId}`);
    for (const file of group.files) {
      const projectPath = `${SOURCE_ARCHIVE_PREFIX}${normalizeArchivePath(file.path)}`;
      const inventory = inventoryFileMap.get(projectPath);
      if (!inventory) throw new Error(`${item.animationId}: group audio missing from machine inventory: ${projectPath}`);
      if (inventory.sha256 !== file.sha256 || inventory.bytes !== file.bytes) {
        throw new Error(`${item.animationId}: group audio binding mismatch: ${projectPath}`);
      }
      bindings.push(inventory);
    }
  }
  const deduplicated = [...new Map(bindings.map((binding) => [binding.path, binding])).values()]
    .sort((left, right) => left.path.localeCompare(right.path));
  if (deduplicated.length !== item.audio.associatedFileCount) {
    throw new Error(`${item.animationId}: expected ${item.audio.associatedFileCount} audio files, resolved ${deduplicated.length}`);
  }
  return deduplicated;
}

function cardForItem({item, preflightItem, xmlPage, associatedFiles, animateContext}) {
  const signals = itemSignals(item);
  const metrics = structuralMetrics(item);
  const classification = {
    section: item.classification.section,
    page: item.classification.page,
    titleRaw: item.classification.titleRaw,
    titleDisplay: item.classification.titleDisplay,
    domain: item.classification.domain,
    xmlPage: xmlPage || null,
  };
  const renderer = recommendRenderer({
    sourceKind: item.source.sourceKind,
    releaseRole: item.releaseRole,
    signals,
    metrics,
  });
  const scenarioFamilies = deriveScenarioFamilies({
    releaseRole: item.releaseRole,
    classification,
    signals,
  });
  const workspace = {
    exists: preflightItem.existing.workspaceExists,
    path: preflightItem.existing.workspace,
    migrationStatus: preflightItem.existing.migrationStatus,
    rendererDeclared: preflightItem.existing.renderer.declared,
  };
  return {
    sequence: item.sequence,
    animationId: item.animationId,
    assetId: item.assetId,
    releaseRole: item.releaseRole,
    batch: item.batch,
    classification,
    source: item.source,
    runtime: {
      stage: item.swf.header.stage,
      fps: item.swf.header.fps,
      rootFrameCount: item.swf.header.rootFrameCount,
      rootDurationMs: Number((item.swf.header.rootFrameCount / item.swf.header.fps * 1000).toFixed(6)),
      actionScriptVersion: item.swf.actionScript.version,
      staticStructureSha256: item.swf.structureFingerprintSha256,
      machineAuditFingerprintSha256: item.auditFingerprintSha256,
    },
    signals: {
      ...signals,
      structural: metrics,
      externalAudioAssociationCount: item.audio.associatedFileCount,
    },
    recommendedRenderer: renderer,
    reuseCandidates: preflightItem.reuseCandidates,
    requiredWork: {
      frameDomains: frameDomainWork(item),
      scenarios: {
        status: "unresolved",
        requiredScenarioFamilies: scenarioFamilies,
        authoritativeScenarioIds: "unresolved",
        authoritativeScenarioCount: "unresolved",
        requiredTasks: [
          "derive named scenarios and event schedules from source plus natural original-runtime execution",
          "bind every scenario to frameDomain, requirementId, trace, entryStateSha256, language, and seed",
          "enumerate every reachable branch and terminal/replay state; do not infer completeness from static token counts",
        ],
        fullReachabilityEstablished: false,
      },
      audio: audioWork(item, signals, associatedFiles),
      authoring: authoringWork(item, animateContext),
      originalRuntime: originalRuntimeWork(item, signals),
      implementation: {
        status: workspace.exists
          ? "workspace-scaffolded-but-renderer-implementation-not-authorized"
          : "scaffold-ready-but-renderer-implementation-not-authorized",
        workspace,
        scaffoldGateEffect:
          "The open parallel-shard gate permits catalog-backed workspace creation only; it does not establish final specification, fidelity, acceptance, or implementation authorization.",
        requiredTasks: [
          ...(workspace.exists
            ? ["preserve and complete the existing catalog-backed migration workspace without promoting its scaffold status"]
            : ["scaffold the catalog-backed migration workspace through the approved batch command"]),
          "write immutable movie metadata and a pure getFrameState(frame, context) timeline/state machine",
          "implement the provisional renderer only after unresolved renderer evidence is reviewed",
          "add bilingual content, audioCues, deterministic data-flash identity, behavior tests, and complete Replay reset",
        ],
      },
      validation: {
        status: "unresolved",
        requiredTasks: [
          "capture every required frame in every reachable scenario and both languages",
          "bind baseline and implementation PNG hashes and compute full-frame RMSE plus diff images",
          "run native, desktop, tablet, narrow-screen, keyboard, reduced-motion, console, asset, and network QA",
          "obtain strict human visual review and separate owner acceptance after all machine gates pass",
        ],
      },
    },
    acceptance: {
      implementationComplete: false,
      authoritativeBaselineComplete: false,
      fullFrameRmseComplete: false,
      behaviorComplete: false,
      audioAccepted: false,
      humanVisualReviewAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
    },
  };
}

function countBy(items, select) {
  const counts = {};
  for (const item of items) {
    const key = select(item);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}

function validateInputScope({machineAudit, queue, release, preflight, animatePrepare, lessonEntry, lessonXml}) {
  if (machineAudit.reportType !== "g4-l3-machine-source-audits" || machineAudit.items.length !== 40) {
    throw new Error("Expected the 40-item G4 L3 machine source audit");
  }
  if (queue.queueId !== "release-g04-l03-negative-numbers" || queue.canonicalAssetCount !== 40) {
    throw new Error("Expected the G4 L3 complete-lesson release queue");
  }
  if (queue.batches.length !== 2 || queue.batches[0].canonicalAssetCount !== 25 || queue.batches[1].canonicalAssetCount !== 15) {
    throw new Error("G4 L3 must remain ordered as batch-001 (25) then batch-002 (15)");
  }
  if (
    release?.releaseId !== queue.releaseId ||
    release.queueId !== queue.queueId ||
    release.publicationMode !== "atomic" ||
    release.developmentMode !== "parallel-shards" ||
    release.expectedCounts?.members !== 40 ||
    release.expectedCounts?.shards !== 2 ||
    release.shards?.length !== 2 ||
    release.members?.length !== 40
  ) {
    throw new Error("Expected the exact two-shard atomic G4 L3 lesson release manifest");
  }
  const queuedIds = queue.batches.flatMap((batch) => batch.items.map((item) => item.canonicalAnimationId));
  if (JSON.stringify(release.members.map((member) => member.animationId)) !== JSON.stringify(queuedIds)) {
    throw new Error("G4 L3 lesson release member order drifted from the release queue");
  }
  if (
    preflight.summary?.batchGatesOpen !== 2 ||
    preflight.batches.some((batch) =>
      batch.gate.open !== true ||
      batch.gate.prerequisiteKind !== "none" ||
      batch.gate.requiredCount !== 0 ||
      batch.gate.admittedCount !== 0)
  ) {
    throw new Error("This factory requires both no-prerequisite G4 L3 parallel-shard scaffold gates to be open");
  }
  const pairedMode = animatePrepare.toolBindings?.existingAssistRunner?.compatibilityAudit?.pairedFlaSwfMode;
  if (
    animatePrepare.reportType !== "g4-l3-adobe-animate-prepare-only-readiness" ||
    animatePrepare.summary?.copiesReady !== 29 ||
    animatePrepare.summary?.currentAutomatedAnimateProbePassed !== false ||
    pairedMode?.compatibleWithPairedFlaAndSwfItems !== true ||
    pairedMode?.prepareOnlyAvailable !== true ||
    pairedMode?.fullRunRequiresNamedHumanDialogOperator !== true ||
    pairedMode?.automatedDialogInteractionAllowed !== false
  ) {
    throw new Error("G4 L3 paired-source Animate preparation is missing or not fail-closed");
  }
  if (lessonEntry.grade !== 4 || lessonEntry.lesson !== 3 || lessonEntry.pageReferenceCount !== 39) {
    throw new Error("Expected the 39-page G4 L3 lesson catalog entry");
  }
  if (lessonXml.lessonNumber !== 3 || lessonXml.pages.length !== 39) {
    throw new Error("Physical G4 L3 XML does not enumerate exactly 39 active pages");
  }
}

export function validateWorkCardReport(report) {
  if (report.schemaVersion !== SCHEMA_VERSION || report.reportType !== "g4-l3-implementation-work-cards") {
    throw new Error("Unexpected G4 L3 implementation work-card schema");
  }
  if (!report.acceptance.acceptanceNeutral || report.acceptance.strictAcceptanceEffect !== false) {
    throw new Error("Work-card report must remain acceptance-neutral");
  }
  if (report.cards.length !== 40 || report.summary.activePages !== 39 || report.summary.courseShells !== 1) {
    throw new Error("Work-card report must contain 39 active pages plus one shell");
  }
  if (new Set(report.cards.map((card) => card.animationId)).size !== 40) {
    throw new Error("Work-card animation IDs must be unique");
  }
  if (report.batchPlan.length !== 2 || report.batchPlan[0].cardCount !== 25 || report.batchPlan[1].cardCount !== 15) {
    throw new Error("Work-card batch plan must preserve 25 + 15 ordering");
  }
  if (
    report.batchPlan.some((batch) =>
      batch.gate.open !== true ||
      batch.gate.prerequisiteKind !== "none" ||
      batch.gate.requiredCount !== 0 ||
      batch.gate.admittedCount !== 0 ||
      batch.implementationAuthorizedNow !== false)
  ) {
    throw new Error("Parallel scaffold gates must be open without authorizing renderer implementation");
  }
  if (
    report.releaseFramework?.publicationMode !== "atomic" ||
    report.releaseFramework?.developmentMode !== "parallel-shards" ||
    report.releaseFramework?.shardCount !== 2 ||
    report.summary.batchGatesOpen !== 2 ||
    report.summary.implementationAuthorizedNow !== 0
  ) {
    throw new Error("Work-card report lost the parallel-shard/atomic-publication boundary");
  }
  const existingWorkspaceCount = report.cards.filter(
    (card) => card.requiredWork?.implementation?.workspace?.exists === true,
  ).length;
  if (report.summary.existingMigrationWorkspaces !== existingWorkspaceCount) {
    throw new Error("Work-card workspace summary drifted from the card-level scaffold state");
  }
  for (const [index, card] of report.cards.entries()) {
    if (card.sequence !== index + 1) throw new Error(`${card.animationId}: non-deterministic sequence`);
    if (card.runtime.fps !== 12 || card.runtime.stage.width !== 800 || card.runtime.stage.height !== 600) {
      throw new Error(`${card.animationId}: unexpected native runtime geometry`);
    }
    if (card.recommendedRenderer.status !== "provisional-static-source-recommendation") {
      throw new Error(`${card.animationId}: renderer recommendation is not provisional`);
    }
    if (!new Set(["low", "medium-low"]).has(card.recommendedRenderer.confidence)) {
      throw new Error(`${card.animationId}: renderer confidence exceeds current evidence`);
    }
    if (card.requiredWork.frameDomains.status !== "unresolved" || card.requiredWork.scenarios.status !== "unresolved") {
      throw new Error(`${card.animationId}: unresolved coverage work was promoted`);
    }
    if (card.requiredWork.originalRuntime.authoritativeBaselineEstablished || card.requiredWork.audio.listeningAcceptanceEstablished) {
      throw new Error(`${card.animationId}: original-runtime or audio acceptance was improperly established`);
    }
    if (
      typeof card.requiredWork.implementation.workspace?.exists !== "boolean" ||
      (card.requiredWork.implementation.workspace.exists &&
        !card.requiredWork.implementation.workspace.path?.startsWith("migrations/"))
    ) {
      throw new Error(`${card.animationId}: migration workspace scaffold state is incomplete`);
    }
    if (Object.values(card.acceptance).some(Boolean)) {
      throw new Error(`${card.animationId}: acceptance-neutral card contains a passing acceptance field`);
    }
  }
  return report;
}

export async function buildWorkCardReport() {
  const [machineBytes, preflightBytes, animatePrepareBytes, batchesBytes, lessonReleasesBytes, lessonsBytes, audioGroupsBytes] = await Promise.all([
    readFile(MACHINE_AUDIT_PATH),
    readFile(PREFLIGHT_PATH),
    readFile(ANIMATE_PREPARE_PATH),
    readFile(BATCHES_PATH),
    readFile(LESSON_RELEASES_PATH),
    readFile(LESSONS_PATH),
    readFile(AUDIO_GROUPS_PATH),
  ]);
  const machineAudit = JSON.parse(machineBytes);
  const preflight = JSON.parse(preflightBytes);
  const animatePrepare = JSON.parse(animatePrepareBytes);
  const batches = JSON.parse(batchesBytes);
  const lessonReleases = JSON.parse(lessonReleasesBytes);
  const lessons = JSON.parse(lessonsBytes);
  const audioGroups = JSON.parse(audioGroupsBytes);
  const queue = batches.queues.find((entry) => entry.queueId === "release-g04-l03-negative-numbers");
  const release = lessonReleases.releases.find((entry) => entry.releaseId === "lesson-g04-l03-negative-numbers");
  const lessonEntry = lessons.lessons.find((entry) => entry.grade === 4 && entry.lesson === 3);
  if (!queue || !release || !lessonEntry) throw new Error("G4 L3 queue, release, or lesson catalog entry is missing");

  const sourceXmlPath = path.join(projectRoot, SOURCE_ARCHIVE_PREFIX, lessonEntry.path);
  const sourceXmlBytes = await readFile(sourceXmlPath);
  if (sha256(sourceXmlBytes) !== lessonEntry.sha256) throw new Error("Physical G4 L3 XML hash does not match catalog/lessons.json");
  const lessonXml = parseLessonXml(sourceXmlBytes.toString("utf8"));
  validateInputScope({machineAudit, queue, release, preflight, animatePrepare, lessonEntry, lessonXml});

  const animateContext = {
    currentAutomatedBlankJsflProbeReady: false,
    pairedSourceMode:
      animatePrepare.toolBindings.existingAssistRunner.compatibilityAudit.pairedFlaSwfMode,
  };

  const auditById = new Map(machineAudit.items.map((item) => [item.animationId, item]));
  const preflightById = new Map(preflight.items.map((item) => [item.animationId, item]));
  const xmlPageByArchivePath = new Map(lessonXml.pages.map((page) => [page.archiveRelativePath, page]));
  const audioGroupMap = new Map(audioGroups.groups.map((group) => [group.groupId, group]));
  const inventoryFileMap = new Map(machineAudit.audioInventory.files.map((file) => [file.path, file]));
  const orderedQueueItems = queue.batches.flatMap((batch) => batch.items.map((item, batchIndex) => ({
    ...item,
    batchId: batch.batchId,
    batchOrdinal: batchIndex + 1,
  })));

  const cards = orderedQueueItems.map((queueItem, index) => {
    const item = auditById.get(queueItem.canonicalAnimationId);
    const preflightItem = preflightById.get(queueItem.canonicalAnimationId);
    if (!item || !preflightItem) throw new Error(`${queueItem.canonicalAnimationId}: missing audit/preflight item`);
    if (item.sequence !== index + 1 || item.batch.batchId !== queueItem.batchId || item.batch.batchOrdinal !== queueItem.batchOrdinal) {
      throw new Error(`${item.animationId}: batch or lesson sequence drift`);
    }
    if (item.assetId !== queueItem.assetId || item.releaseRole !== queueItem.releaseRole) {
      throw new Error(`${item.animationId}: queue source identity drift`);
    }
    let xmlPage = null;
    if (item.releaseRole === "active-xml-referenced-page") {
      const swfArchivePath = normalizeArchivePath(item.source.swf.path.replace(SOURCE_ARCHIVE_PREFIX, ""));
      xmlPage = xmlPageByArchivePath.get(swfArchivePath);
      if (!xmlPage) throw new Error(`${item.animationId}: source SWF is not an active G4 L3 XML page`);
      if (xmlPage.globalPageOrdinal !== index + 1) throw new Error(`${item.animationId}: XML and release ordering disagree`);
      if (xmlPage.sectionCode !== item.classification.section) throw new Error(`${item.animationId}: XML section disagreement`);
    }
    const associatedFiles = resolveAssociatedAudioFiles(item, audioGroupMap, inventoryFileMap);
    return cardForItem({item, preflightItem, xmlPage, associatedFiles, animateContext});
  });

  const batchPlan = queue.batches.map((batch) => {
    const gate = preflight.batches.find((candidate) => candidate.batchId === batch.batchId)?.gate;
    const shard = release.shards.find((candidate) => candidate.batchId === batch.batchId);
    if (!gate || !shard) throw new Error(`${batch.batchId}: missing preflight gate or release shard`);
    return {
      batchId: batch.batchId,
      releasePart: batch.releasePart,
      releasePartCount: batch.releasePartCount,
      releaseComplete: batch.releaseComplete,
      cardCount: batch.items.length,
      orderedAnimationIds: batch.items.map((item) => item.canonicalAnimationId),
      shardId: shard.shardId,
      shardOrdinal: shard.ordinal,
      parallelGroup: shard.parallelGroup,
      developmentPrerequisites: shard.developmentPrerequisites,
      gate,
      implementationAuthorizedNow: false,
      entryRule: gate.reason,
    };
  });
  const uniqueAudioFiles = new Set(cards.flatMap((card) => card.requiredWork.audio.catalogAssociation.files.map((file) => file.path)));

  const report = {
    schemaVersion: SCHEMA_VERSION,
    reportType: "g4-l3-implementation-work-cards",
    generator: {path: relative(scriptPath), version: SCHEMA_VERSION},
    acceptance: {
      acceptanceNeutral: true,
      sourceAssetChanges: 0,
      migrationWorkspaceChanges: 0,
      migrationStatusChanges: 0,
      completionLedgerChanges: 0,
      approvalOrReviewChanges: 0,
      strictAcceptanceEffect: false,
      statement:
        "These are deterministic pre-implementation work cards only. The two parallel-shard scaffold gates are open for workspace creation, but this report does not scaffold a migration, authorize renderer implementation, publish the atomic lesson, prove runtime reachability, select a final renderer, establish a baseline/RMSE/audio result, record human or owner approval, or complete a migration.",
    },
    sourceBindings: {
      machineAudit: {
        path: relative(MACHINE_AUDIT_PATH),
        bytes: machineBytes.length,
        sha256: sha256(machineBytes),
        auditSetSha256: machineAudit.summary.auditSetSha256,
      },
      preflight: {path: relative(PREFLIGHT_PATH), bytes: preflightBytes.length, sha256: sha256(preflightBytes)},
      animatePrepare: {
        path: relative(ANIMATE_PREPARE_PATH),
        bytes: animatePrepareBytes.length,
        sha256: sha256(animatePrepareBytes),
        copiesReady: animatePrepare.summary.copiesReady,
        currentAutomatedBlankJsflProbeReady: false,
        pairedSourcePrepareOnlyAvailable: animateContext.pairedSourceMode.prepareOnlyAvailable,
        fullRunRequiresNamedHumanDialogOperator:
          animateContext.pairedSourceMode.fullRunRequiresNamedHumanDialogOperator,
      },
      batches: {path: relative(BATCHES_PATH), bytes: batchesBytes.length, sha256: sha256(batchesBytes)},
      lessonReleases: {
        path: relative(LESSON_RELEASES_PATH),
        bytes: lessonReleasesBytes.length,
        sha256: sha256(lessonReleasesBytes),
      },
      lessons: {path: relative(LESSONS_PATH), bytes: lessonsBytes.length, sha256: sha256(lessonsBytes)},
      audioGroups: {path: relative(AUDIO_GROUPS_PATH), bytes: audioGroupsBytes.length, sha256: sha256(audioGroupsBytes)},
      sourceXml: {
        path: relative(sourceXmlPath),
        bytes: sourceXmlBytes.length,
        sha256: sha256(sourceXmlBytes),
        activePageCount: lessonXml.pages.length,
        commentedPageReferenceCount: lessonXml.commentedPageReferenceCount,
      },
    },
    releaseFramework: {
      publicationMode: release.publicationMode,
      developmentMode: release.developmentMode,
      shardCount: release.expectedCounts.shards,
      memberCount: release.expectedCounts.members,
      atomicPublicationAuthorizedByThisReport: false,
    },
    lesson: {
      queueId: queue.queueId,
      releaseId: queue.releaseId,
      grade: queue.grade,
      lesson: queue.lesson,
      titleRaw: lessonEntry.titleRaw,
      titleDisplay: queue.titleDisplay,
      domain: queue.domain,
      sourceXml: lessonXml,
    },
    summary: {
      cards: cards.length,
      activePages: cards.filter((card) => card.releaseRole === "active-xml-referenced-page").length,
      courseShells: cards.filter((card) => card.releaseRole === "course-shell").length,
      flaBacked: cards.filter((card) => card.source.fla).length,
      swfOnly: cards.filter((card) => !card.source.fla).length,
      rootFrameCountSum: cards.reduce((sum, card) => sum + card.runtime.rootFrameCount, 0),
      interactionStaticCandidates: cards.filter((card) => card.signals.interaction.candidate).length,
      randomStaticCandidates: cards.filter((card) => card.signals.random.candidate).length,
      externalStaticCandidates: cards.filter((card) => card.signals.external.candidate).length,
      embeddedAudioTagCandidates: cards.filter((card) => card.signals.embeddedAudio.tagCount > 0).length,
      catalogAssociatedAudioItems: cards.filter((card) => card.signals.externalAudioAssociationCount > 0).length,
      uniqueCatalogAssociatedAudioFiles: uniqueAudioFiles.size,
      existingMigrationWorkspaces: cards.filter((card) => card.requiredWork.implementation.workspace.exists).length,
      rendererRecommendations: countBy(cards, (card) => card.recommendedRenderer.primary),
      rendererConfidence: countBy(cards, (card) => card.recommendedRenderer.confidence),
      unresolvedFrameDomainCards: cards.filter((card) => card.requiredWork.frameDomains.status === "unresolved").length,
      unresolvedScenarioCards: cards.filter((card) => card.requiredWork.scenarios.status === "unresolved").length,
      unresolvedOriginalRuntimeCards: cards.filter((card) => card.requiredWork.originalRuntime.status === "unresolved").length,
      batchGatesOpen: batchPlan.filter((batch) => batch.gate.open).length,
      implementationAuthorizedNow: batchPlan.filter((batch) => batch.implementationAuthorizedNow).length,
    },
    batchPlan,
    cards,
  };
  return validateWorkCardReport(report);
}

function compactSignals(card) {
  const values = [];
  if (card.signals.interaction.candidate) values.push("interaction");
  if (card.signals.random.candidate) values.push("random");
  if (card.signals.external.candidate) values.push("external");
  if (card.signals.embeddedAudio.tagCount) values.push(`embedded-audio:${card.signals.embeddedAudio.tagCount}`);
  if (card.signals.externalAudioAssociationCount) values.push(`catalog-audio:${card.signals.externalAudioAssociationCount}`);
  return values.length ? values.join(", ") : "none detected statically";
}

export function renderWorkCardMarkdown(report) {
  const rendererSummary = Object.entries(report.summary.rendererRecommendations)
    .map(([renderer, count]) => `${renderer}: ${count}`)
    .join("; ");
  const rows = report.cards.map((card) => {
    const page = card.releaseRole === "course-shell"
      ? "shell"
      : `${card.classification.section}/${card.classification.page}`;
    const remaining = [
      `${card.requiredWork.frameDomains.staticallyRootReachableCandidates.length} static domain candidates`,
      `${card.requiredWork.scenarios.requiredScenarioFamilies.length} scenario families`,
      card.requiredWork.authoring.status,
      "original runtime",
      "audio/listening",
    ].join("; ");
    return `| ${card.sequence} | ${card.batch.batchId}/${card.batch.batchOrdinal} | \`${card.animationId}\` | ${page} | ${card.source.sourceKind} | ${card.runtime.stage.width}×${card.runtime.stage.height} / ${card.runtime.fps} / ${card.runtime.rootFrameCount} | ${compactSignals(card)} | ${card.recommendedRenderer.primary} (${card.recommendedRenderer.confidence}) | ${remaining} |`;
  });
  return [
    "# G4 L3 Deterministic Implementation Work Cards",
    "",
    "> Acceptance-neutral pre-implementation specification for the 39 active XML pages plus the course shell. Every renderer choice is provisional and every strict evidence gate remains unresolved.",
    "",
    "## Bound source evidence",
    "",
    `- Machine source audit: \`${report.sourceBindings.machineAudit.path}\` / \`${report.sourceBindings.machineAudit.sha256}\``,
    `- Catalog batches: \`${report.sourceBindings.batches.path}\` / \`${report.sourceBindings.batches.sha256}\``,
    `- Physical lesson XML: \`${report.sourceBindings.sourceXml.path}\` / \`${report.sourceBindings.sourceXml.sha256}\`; 39 active pages and ${report.sourceBindings.sourceXml.commentedPageReferenceCount} commented historical Page references.`,
    `- Audio groups: \`${report.sourceBindings.audioGroups.path}\` / \`${report.sourceBindings.audioGroups.sha256}\``,
    `- Animate prepare-only readiness: \`${report.sourceBindings.animatePrepare.path}\` / \`${report.sourceBindings.animatePrepare.sha256}\`; 29 read-only copies ready, current unattended blank JSFL probe **not ready**.`,
    "",
    "Static script, placement, and tag evidence identifies work candidates only. It does not prove runtime reachability, scenario completeness, visual behavior, audio timing, or a final renderer choice.",
    "",
    "## Parallel shard scaffold boundary",
    "",
    ...report.batchPlan.flatMap((batch) => [
      `- **${batch.batchId} / ${batch.shardId}**: ${batch.cardCount} cards, release part ${batch.releasePart}/${batch.releasePartCount}; scaffold gate **open**; development prerequisites: none.`,
      `  Entry rule: ${batch.entryRule}`,
    ]),
    "",
    `Both parallel-shard scaffold gates are open, but renderer implementation is authorized now for **${report.summary.implementationAuthorizedNow}** batches. Publication mode is **${report.releaseFramework.publicationMode}** and this report authorizes no publication.`,
    `Catalog-backed migration workspaces now exist for **${report.summary.existingMigrationWorkspaces}/40** cards; workspace presence remains distinct from implementation, fidelity, acceptance, and strict completion.`,
    "",
    "## Work-card summary",
    "",
    `- 40 cards: 39 pages + 1 shell; 29 FLA-backed + 11 SWF-only; ${report.summary.rootFrameCountSum} root frames at 12 FPS.`,
    `- Static candidates: interaction ${report.summary.interactionStaticCandidates}, random ${report.summary.randomStaticCandidates}, external ${report.summary.externalStaticCandidates}, embedded audio ${report.summary.embeddedAudioTagCandidates}.`,
    `- Catalog-associated audio: ${report.summary.uniqueCatalogAssociatedAudioFiles} unique hash-verified files; cue mapping and listening acceptance remain false.`,
    `- Provisional renderer mix: ${rendererSummary}. Confidence never exceeds medium-low.`,
    "- Every FLA+SWF card points to the paired-source `--paired-swf` / `--paired-swf-sha256` prepare-only mode. A full audit still requires a named human to acknowledge only the legacy conversion popup; dialog automation is forbidden.",
    `- Frame-domain, scenario, and original-runtime work remains unresolved on ${report.summary.unresolvedFrameDomainCards}/40, ${report.summary.unresolvedScenarioCards}/40, and ${report.summary.unresolvedOriginalRuntimeCards}/40 cards respectively.`,
    "",
    "## Ordered cards",
    "",
    "| # | Batch/order | Animation | XML location | Source | Stage / FPS / root frames | Static signals | Provisional renderer | Required unresolved work |",
    "|---:|---|---|---|---|---|---|---|---|",
    ...rows,
    "",
    "## Acceptance boundary",
    "",
    report.acceptance.statement,
    "",
  ].join("\n");
}

export function parseArguments(argv) {
  const options = {
    check: false,
    jsonOutput: DEFAULT_JSON_OUTPUT,
    markdownOutput: DEFAULT_MARKDOWN_OUTPUT,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--json-output") {
      const value = argv[++index];
      if (!value) throw new Error("--json-output requires a path");
      options.jsonOutput = path.resolve(value);
    } else if (argument === "--markdown-output") {
      const value = argv[++index];
      if (!value) throw new Error("--markdown-output requires a path");
      options.markdownOutput = path.resolve(value);
    } else if (argument === "--help") options.help = true;
    else throw new Error(`Unknown option ${argument}`);
  }
  return options;
}

function assertSafeOutput(filePath, extension) {
  if (path.extname(filePath) !== extension) throw new Error(`Output must end in ${extension}`);
  const reportsRoot = path.join(projectRoot, "reports");
  const relativePath = path.relative(reportsRoot, filePath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error("Output must remain inside reports/");
  }
}

async function main(argv) {
  const options = parseArguments(argv);
  if (options.help) {
    process.stdout.write("node scripts/build-g4-l3-implementation-work-cards.mjs [--check] [--json-output reports/file.json] [--markdown-output reports/file.md]\n");
    return;
  }
  assertSafeOutput(options.jsonOutput, ".json");
  assertSafeOutput(options.markdownOutput, ".md");
  const report = await buildWorkCardReport();
  const json = `${JSON.stringify(report, null, 2)}\n`;
  const markdown = renderWorkCardMarkdown(report);
  if (options.check) {
    const [existingJson, existingMarkdown] = await Promise.all([
      readFile(options.jsonOutput, "utf8"),
      readFile(options.markdownOutput, "utf8"),
    ]);
    if (existingJson !== json) throw new Error("G4 L3 implementation work-card JSON is missing or stale");
    if (existingMarkdown !== markdown) throw new Error("G4 L3 implementation work-card Markdown is missing or stale");
    process.stdout.write("PASS: 40 deterministic G4 L3 implementation work cards are current; 2/2 scaffold gates open, 0 implementation authorizations\n");
    return;
  }
  await Promise.all([
    writeFile(options.jsonOutput, json),
    writeFile(options.markdownOutput, markdown),
  ]);
  process.stdout.write("WROTE: 40 acceptance-neutral G4 L3 implementation work cards (batch-001: 25, batch-002: 15)\n");
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
