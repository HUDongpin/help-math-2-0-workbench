import {readFile} from "node:fs/promises";
import path from "node:path";

import {
  ACCEPTANCE_EFFECTS_FALSE,
  PROJECT_ROOT,
  fileIdentity,
  invariant,
  portable,
  stableJson,
  writeExclusive,
} from "./core.mjs";

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function allFalse(object) {
  return Object.values(object || {}).every((value) => value === false);
}

function sum(items, selector) {
  return items.reduce((total, item) => total + selector(item), 0);
}

function increment(target, key, count = 1) {
  target[key] = (target[key] || 0) + count;
}

async function loadEvidence(outputRoot, corpusValidation) {
  const backendSummaryPaths = {
    ffdec: path.join(outputRoot, "ffdec/summary.json"),
    next2d: path.join(outputRoot, "next2d/summary.json"),
    openfl: path.join(outputRoot, "openfl/summary.json"),
  };
  const summaries = {};
  const summaryIdentities = {};
  for (const [backend, filePath] of Object.entries(backendSummaryPaths)) {
    summaries[backend] = await readJson(filePath);
    summaryIdentities[backend] = {
      path: portable(path.relative(PROJECT_ROOT, filePath)),
      ...await fileIdentity(filePath),
    };
    invariant(allFalse(summaries[backend].acceptanceEffects),
      `${backend}: backend summary attempted an acceptance promotion`);
    invariant(summaries[backend].shellCount === 0,
      `${backend}: backend summary contains a legacy shell`);
  }
  const manifests = {ffdec: [], next2d: [], openfl: []};
  for (const member of corpusValidation.members) {
    const paths = {
      ffdec: path.join(outputRoot, "ffdec", member.animationId, "manifest.json"),
      next2d: path.join(outputRoot, "next2d/manifests", `${member.animationId}.json`),
      openfl: path.join(outputRoot, "openfl/manifests", `${member.animationId}.json`),
    };
    for (const [backend, filePath] of Object.entries(paths)) {
      const manifest = await readJson(filePath);
      invariant(manifest.member.animationId === member.animationId,
        `${backend}: manifest/member order drifted`);
      invariant(manifest.member.source.sha256 === member.source.sha256,
        `${backend}: manifest source identity drifted`);
      invariant(allFalse(manifest.acceptanceEffects),
        `${backend}: manifest attempted an acceptance promotion`);
      manifests[backend].push(manifest);
    }
  }
  return {summaries, summaryIdentities, manifests};
}

function deriveAvm1(ffdecManifests) {
  const locationClassificationCounts = {};
  const loweringCounts = {};
  const uniqueSources = new Map();
  const buttonPayloads = [];
  let sourceBytes = 0;
  let pcodeBytes = 0;
  let opcodeOccurrences = 0;
  let boundedBasicOpcodeOccurrences = 0;
  let specializedOpcodeOccurrences = 0;
  let sharedComponentOpcodeOccurrences = 0;
  let soundStreamHeads = 0;
  let soundStreamBlocks = 0;
  let embeddedSoundTags = 0;
  for (const manifest of ffdecManifests) {
    const scripts = manifest.actionScript;
    sourceBytes += scripts.sourceBytes;
    pcodeBytes += scripts.pcodeBytes;
    opcodeOccurrences += scripts.opcodeOccurrenceCount;
    boundedBasicOpcodeOccurrences += scripts.boundedBasicOpcodeOccurrenceCount;
    specializedOpcodeOccurrences += scripts.specializedOpcodeOccurrenceCount;
    for (const [key, count] of Object.entries(scripts.locationClassificationCounts)) {
      increment(locationClassificationCounts, key, count);
    }
    for (const [key, count] of Object.entries(scripts.loweringCounts)) {
      increment(loweringCounts, key, count);
    }
    for (const record of scripts.sourceRecords) {
      if (!uniqueSources.has(record.sha256)) {
        uniqueSources.set(record.sha256, {sha256: record.sha256, bytes: record.bytes});
      }
      if (record.classification.category === "button-modern-host-binding") {
        buttonPayloads.push({
          animationId: manifest.member.animationId,
          path: record.path,
          keyAttribute: record.classification.payload.keyAttribute,
        });
      }
    }
    sharedComponentOpcodeOccurrences += scripts.pcodeRecords
      .filter((record) => record.sourceClassificationCategory === "shared-flash-v2-component")
      .reduce((total, record) => total + record.opcodeOccurrenceCount, 0);
    soundStreamHeads += manifest.observedStructure.counts.soundStreamHeads;
    soundStreamBlocks += manifest.observedStructure.counts.soundStreamBlocks;
    embeddedSoundTags += manifest.observedStructure.counts.embeddedSoundTags;
  }
  const uniqueSourceBytes = [...uniqueSources.values()]
    .reduce((total, item) => total + item.bytes, 0);
  const locationCount = Object.values(locationClassificationCounts)
    .reduce((total, count) => total + count, 0);
  const pageSpecificDynamicLocations =
    locationClassificationCounts["page-specific-dynamic-sound-selection"] || 0;
  return {
    evidenceKind: "static-occurrence-and-location-classification-not-runtime-reachability",
    locationCount,
    sourceBytes,
    pcodeBytes,
    opcodeOccurrences,
    boundedBasicOpcodeOccurrences,
    specializedOpcodeOccurrences,
    sharedComponentOpcodeOccurrences,
    sharedComponentOpcodeShare: Number(
      (sharedComponentOpcodeOccurrences / opcodeOccurrences).toFixed(6),
    ),
    uniqueSourceContentCount: uniqueSources.size,
    uniqueSourceBytes,
    duplicateSourceBytes: sourceBytes - uniqueSourceBytes,
    locationClassificationCounts,
    loweringCounts,
    pageSpecificDynamicLocations,
    pageSpecificDynamicShareOfLocations: Number(
      (pageSpecificDynamicLocations / locationCount).toFixed(6),
    ),
    buttonPayloads,
    sharedComponents: [
      {
        name: "FScrollBarSymbol",
        sourceBytes: 13570,
        sourceSha256: "5ac9d9e477e7b50808c1805c33473f0e50b0121d0789cd7d208a085007047b8d",
      },
      {
        name: "FUIComponentSymbol",
        sourceBytes: 10244,
        sourceSha256: "326219b08e2695ccdd29734ea68a6277cda0549e1e98479be25597ffd9496972",
      },
    ],
    audioFrameDomainTail: {
      pagesWithEmbeddedStreamAudio: ffdecManifests.filter((manifest) =>
        manifest.observedStructure.counts.soundStreamHeads > 0).length,
      soundStreamHeads,
      soundStreamBlocks,
      embeddedSoundTags,
      rootFrameClockIsInsufficient: true,
    },
    extrapolationToAll1751PagesPermitted: false,
  };
}

function deriveBackendMatrix(evidence) {
  const {summaries} = evidence;
  return [
    {
      backend: "FFDec Canvas + P-code",
      role: "recommended-primary-visual-code-generator-and-avm1-front-end",
      activePagesParsed: summaries.ffdec.memberCount,
      renderableVisualArtifacts: summaries.ffdec.visualDrawingCodeGeneratedCount,
      structurallyUnblockedVisualIr: summaries.ffdec.visualDrawingCodeGeneratedCount,
      behaviorCompiled: summaries.ffdec.behaviorCompiledCount,
      streamAudioCompiledOrRetained: summaries.ffdec.streamAudioPlaybackCompiledCount,
      deterministicNormalizedOrExecutableOutput: summaries.ffdec.visualDrawingCodeGeneratedCount,
      blockingFinding: "Canvas code omits AVM1 execution, modern host binding, and nested stream-audio playback.",
    },
    {
      backend: "Next2D legacy SWF worker",
      role: "recommended-secondary-structure-parser-only",
      activePagesParsed: summaries.next2d.structureIrSuccessCount,
      renderableVisualArtifacts: summaries.next2d.renderableVisualArtifactCount,
      structurallyUnblockedVisualIr: summaries.next2d.structureIrSuccessCount,
      behaviorCompiled: summaries.next2d.behaviorRetainedCount,
      streamAudioCompiledOrRetained: summaries.next2d.streamAudioRetainedCount,
      deterministicNormalizedOrExecutableOutput: summaries.next2d.deterministicEventIrCount,
      blockingFinding: "Worker discards AVM1/button actions/background/audio; maintained TypeScript branch has no working SWF importer; consumer is incomplete.",
    },
    {
      backend: "OpenFL SWF Animate IR",
      role: "recommended-secondary-normalized-visual-timeline-ir",
      activePagesParsed: summaries.openfl.normalizedIrCount,
      renderableVisualArtifacts: summaries.openfl.renderableVisualArtifactCount,
      structurallyUnblockedVisualIr: summaries.openfl.structurallyUnblockedCount,
      behaviorCompiled: summaries.openfl.behaviorCompiledCount,
      streamAudioCompiledOrRetained: summaries.openfl.streamAudioRetainedCount,
      deterministicNormalizedOrExecutableOutput: summaries.openfl.normalizedIrCount,
      blockingFinding: "Morph symbols are omitted on 2/5 pages; AVM1 and audio are absent; no final renderer is generated.",
    },
  ];
}

function markdownTable(rows) {
  const headers = [
    "Backend",
    "定位",
    "解析",
    "可执行视觉产物",
    "结构无阻断",
    "行为",
    "流式音频",
  ];
  const body = rows.map((row) => [
    row.backend,
    row.role,
    `${row.activePagesParsed}/5`,
    `${row.renderableVisualArtifacts}/5`,
    `${row.structurallyUnblockedVisualIr}/5`,
    `${row.behaviorCompiled}/5`,
    `${row.streamAudioCompiledOrRetained}/5`,
  ]);
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...body.map((cells) => `| ${cells.join(" | ")} |`),
  ].join("\n");
}

function renderMarkdown(report) {
  const avm = report.avm1PilotLongTail;
  const categories = avm.locationClassificationCounts;
  return `# HELP Math Flash compiler pilot v1

## 直接结论

正式五页 pilot 的主 backend 应选 **FFDec Canvas + P-code**。它是三个候选中唯一在 5/5 页上直接生成并通过 headless Chromium 执行的 Canvas 绘图代码；Next2D 应保留为第二结构解析器，OpenFL 应保留为可确定化的第二视觉/时间轴 IR。三者都没有自动完成 AVM1 行为或流式音频，所以生产路线应是 FFDec 主生成，加共享 AVM1 lowering、嵌套帧域音频层和现代 My Lesson host adapter。

本 pilot 严格包含 5 个 active lesson pages，0 个 legacy course shell。HELP Math 2.0 现有课程 UI 保留不变；1,751 是 active page occurrence 分母，不把旧 shell 加入转换范围。

## Backend 实测

${markdownTable(report.backendMatrix)}

- FFDec：5/5 生成 Canvas drawing/timeline HTML，并完成 root 与最长 nested timeline 的确定帧 headless capture；但脚本只导出为 source/P-code，未执行。
- Next2D：5/5 产生稳定 event IR，但没有可用的完整 consumer；AVM1、按钮动作、背景与 996 个 stream blocks 未进入 IR。
- OpenFL：5/5 产生可确定化 Animate IR；3/5 结构无 dangling reference，另 2/5 因 Morph Shape 缺失而 fail closed；5/5 AVM1 与音频缺失。

## AVM1 还剩多少需要 Codex

这个五页静态分母共有 **${avm.locationCount} 个脚本位置**。互斥分类为：

- ${categories.empty} 个空脚本；
- ${categories["pure-stop"]} 个纯 \`stop();\`；
- ${categories["legacy-preloader-boilerplate"]} 个同构 legacy preloader 调用，可由一个共享 policy 处理，而且不重建旧 shell；
- ${categories["button-modern-host-binding"]} 个同构 button binding，可由一个现代 My Lesson host adapter 加 9 个文字 payload 处理；
- ${categories["shared-flash-v2-component"]} 个组件副本，实际只有两个 unique hash-bound 文件：\`FScrollBarSymbol\` 与 \`FUIComponentSymbol\`，实现一次即可复用；
- **${categories["page-specific-dynamic-sound-selection"]} 个真正 page-specific dynamic locations**，都是 G5 L4 同一对 random/eval 音频选择逻辑。

因此，就这五页而言，Codex 不再需要逐页手写 50 段 AVM1：需要完成的实现单元约为 **1 个 preloader policy + 1 个 button host adapter + 1 个共享 Flash-v2 component adapter package（含两个冻结组件）+ 1 个 G5 L4 seeded-RNG/explicit-clip-map adapter**。真正 page-specific AVM1 是 **2/50 locations**。这个比例只适用于 pilot，不能直接外推到全部 1,751 页；下一步应先对全部 active SWF 做同一静态分类扫描，得到真正课程级分母。

P-code 总量为 ${avm.opcodeOccurrences.toLocaleString("en-US")} occurrences，其中 ${avm.sharedComponentOpcodeOccurrences.toLocaleString("en-US")}（${(avm.sharedComponentOpcodeShare * 100).toFixed(2)}%）来自两份共享组件在两页中的重复嵌入。ActionScript source 共 ${avm.sourceBytes.toLocaleString("en-US")} bytes，去重后只有 ${avm.uniqueSourceBytes.toLocaleString("en-US")} bytes / ${avm.uniqueSourceContentCount} 种内容。

## 音频是独立长尾

四页含嵌套时间轴流式音频：共 ${avm.audioFrameDomainTail.soundStreamHeads} 个 SoundStreamHead、${avm.audioFrameDomainTail.soundStreamBlocks} 个 SoundStreamBlock。它们属于 193、203、135/135 和 339 帧的 nested domains，不能用每页共同的 root 10 frames 当音频时钟。三候选 backend 都没有交付完整的 nested-frame audio playback，因此音频层仍需专门实现和验收。

## 推荐 factory

1. Catalog gate：只允许 \`referenced=true\`、\`shell=false\` 的 active lesson page，并核 SWF/FLA/外部音频 SHA-256。
2. FFDec：生成 Canvas visual code、ActionScript source 与 P-code；未知脚本和未知共享组件 hash fail closed。
3. Next2D + OpenFL：独立交叉核 root/nested frame domains、placements、symbols；OpenFL dangling Morph references 阻断。
4. AVM1 lowering：只编译冻结的六类位置合同，不执行任意反编译 ActionScript；任意其他 \`eval\` 拒绝。
5. Host bridge：把九个词汇按钮变成 HELP Math 2.0 My Lesson 的结构化事件，不重建 legacy course shell。
6. Audio：提取并绑定 nested stream frame clock；外部 MP3 仍按 catalog identity 处理。
7. QA：全帧视觉 diff、交互 trace、音频、EN/ES、人类和 Owner gates逐层验收。

## 证据边界

本报告证明的是 compiler/parser 的机器输出和 fail-closed 缺口，不证明 Flash fidelity、原始运行时、音频同步、人类视觉、Owner 接受、strict completion、发布或上线。所有 acceptance effects 仍为 false；本 pilot 没有注册新的 current-JavaScript 页面，也没有修改现代课程 UI 或 \`source-assets\`。
`;
}

export async function buildComparisonReport({
  outputRoot,
  reportRoot,
  corpusValidation,
}) {
  const evidence = await loadEvidence(outputRoot, corpusValidation);
  const avm1PilotLongTail = deriveAvm1(evidence.manifests.ffdec);
  invariant(avm1PilotLongTail.locationCount === 50,
    "pilot AVM1 location denominator drifted");
  invariant(avm1PilotLongTail.pageSpecificDynamicLocations === 2,
    "pilot page-specific AVM1 tail drifted");
  invariant(avm1PilotLongTail.opcodeOccurrences === 5779 &&
    avm1PilotLongTail.boundedBasicOpcodeOccurrences === 5324 &&
    avm1PilotLongTail.specializedOpcodeOccurrences === 455,
  "pilot AVM1 opcode denominator drifted");
  invariant(avm1PilotLongTail.sharedComponentOpcodeOccurrences === 5512,
    "pilot shared-component opcode denominator drifted");
  const report = {
    schemaVersion: 1,
    reportId: "help-math-active-page-flash-compiler-pilot-v1",
    scope: {
      activeLessonPageMembers: 5,
      activeCoursePageOccurrenceDenominator: 1751,
      legacyCourseShellMembers: 0,
      modernCourseUiChanged: false,
      sourceAssetsChanged: false,
    },
    evidenceRunRoot: portable(path.relative(PROJECT_ROOT, outputRoot)),
    corpus: {
      pilotId: corpusValidation.pilotId,
      corpusPath: corpusValidation.corpusPath,
      corpusIdentity: corpusValidation.corpusIdentity,
      catalogPath: corpusValidation.catalogPath,
      catalogIdentity: corpusValidation.catalogIdentity,
      members: corpusValidation.members.map((member) => ({
        role: member.role,
        animationId: member.animationId,
        source: member.source,
        pairedFla: member.pairedFla,
      })),
    },
    backendDecision: {
      recommendedPrimary: "ffdec-canvas-and-pcode",
      recommendedSecondaryStructureParser: "next2d-pinned-legacy-worker",
      recommendedSecondaryNormalizedVisualTimelineIr: "openfl-swf-animate-ir",
      soleBackendAccepted: false,
      productionShape: "FFDec visual generation + shared bounded AVM1 lowerer + nested-frame audio compiler + modern My Lesson host bridge; Next2D/OpenFL as independent checks",
    },
    backendMatrix: deriveBackendMatrix(evidence),
    avm1PilotLongTail,
    remainingCodexImplementationUnits: [
      {id: "legacy-preloader-policy", scope: "shared-once", scriptLocationsCovered: 5},
      {id: "modern-my-lesson-button-host-adapter", scope: "shared-once-plus-nine-data-payloads", scriptLocationsCovered: 9},
      {id: "flash-v2-component-adapter-package", scope: "shared-once-two-hash-bound-components", scriptLocationsCovered: 4},
      {id: "g5-l4-seeded-rng-explicit-clip-map", scope: "page-specific-one-script-pair", scriptLocationsCovered: 2},
      {id: "nested-stream-audio-compiler", scope: "non-avm1-cross-cutting-four-pages-five-streams", scriptLocationsCovered: 0},
    ],
    courseWideAvm1TailStatus: "not-yet-measured-run-the-same-static-classifier-over-all-active-swf-before-extrapolation",
    backendSummaryIdentities: evidence.summaryIdentities,
    preexistingWorkbenchBaseline: {
      doctor: "PASS",
      verifySources: "PASS",
      verifyWorkbench: "FAIL-preexisting-stale-catalog-completion-ledger",
      fullNpmTest: "FAIL-preexisting-mixed-worktree-stale-artifacts-and-missing-external-paths",
      attributionToPilot: false,
    },
    evidenceBoundary: {
      compilerAndParserMachineEvidenceOnly: true,
      runtimeReachabilityClaim: false,
      originalRuntimeClaim: false,
      visualFidelityClaim: false,
      audioSynchronizationClaim: false,
      humanOrOwnerAcceptanceClaim: false,
      currentJavaScriptRegistrationClaim: false,
      releaseOrPublicationClaim: false,
    },
    acceptanceEffects: {...ACCEPTANCE_EFFECTS_FALSE},
  };
  const markdown = renderMarkdown(report);
  await writeExclusive(path.join(reportRoot, "summary.json"), stableJson(report));
  await writeExclusive(path.join(reportRoot, "SUMMARY.zh-CN.md"), markdown);
  return {report, markdown};
}

