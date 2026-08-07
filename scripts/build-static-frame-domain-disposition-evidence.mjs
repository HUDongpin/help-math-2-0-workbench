#!/usr/bin/env node

import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {readFile, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {gunzipSync} from "node:zlib";

import {
  TECHNICAL_MANIFEST_PROJECTION,
  technicalManifestSha256,
} from "./evidence-projections.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const defaultMigrationsRoot = path.join(projectRoot, "migrations");
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
export const STATIC_DISPOSITION_EVIDENCE_RELATIVE_PATH = "audit/static-frame-domain-disposition-evidence.json";
export const G4_L3_SINGLE_FRAME_CANDIDATE_REPORT_RELATIVE_PATH = "reports/g4-l3-single-frame-disposition-candidates.json";
export const G4_L3_REVIEWED_SINGLE_FRAME_SELECTION_RELATIVE_PATH = "reports/g4-l3-reviewed-single-frame-disposition-selection.json";
export const G4_L3_MULTI_FRAME_CANDIDATE_REPORT_RELATIVE_PATH = "reports/g4-l3-multi-frame-disposition-candidates.json";
export const G4_L3_REVIEWED_MULTI_FRAME_SELECTION_RELATIVE_PATH = "reports/g4-l3-reviewed-multi-frame-disposition-selection.json";
export const MULTI_FRAME_PARENT_CLOCK_PROOF_TYPE =
  "multi-frame-scriptless-parent-clock-composite-child";
export const NESTED_DECLARED_PARENT_BINDING_MODE =
  "nested-declared-parent-local-clock-only";
export const INDIRECT_DECLARED_PARENT_DISQUALIFIER =
  "declared-parent-does-not-have-one-direct-root-placement";

const g4L3SingleFrameCandidateReport = JSON.parse(readFileSync(
  path.join(projectRoot, G4_L3_SINGLE_FRAME_CANDIDATE_REPORT_RELATIVE_PATH),
  "utf8",
));
const g4L3ReviewedSingleFrameSelection = JSON.parse(readFileSync(
  path.join(projectRoot, G4_L3_REVIEWED_SINGLE_FRAME_SELECTION_RELATIVE_PATH),
  "utf8",
));
const g4L3MultiFrameCandidateReport = JSON.parse(readFileSync(
  path.join(projectRoot, G4_L3_MULTI_FRAME_CANDIDATE_REPORT_RELATIVE_PATH),
  "utf8",
));

export const G4_L3_REVIEWED_SINGLE_FRAME_SCRIPTLESS_CLAIM_SPECS = Object.freeze(Object.fromEntries(
  g4L3SingleFrameCandidateReport.members
    .filter((member) => member.eligibleCandidates.length > 0)
    .map((member) => [member.animationId, Object.freeze({
      proofType: "single-frame-scriptless-structural-child",
      expectedTimelineCount: member.eligibleCandidates.length,
      timelineIds: Object.freeze(member.eligibleCandidates.map(({timelineId}) => timelineId)),
    })]),
));

export const G4_L3_REVIEWED_MULTI_FRAME_SCRIPTLESS_CLAIM_SPECS = Object.freeze(Object.fromEntries(
  g4L3MultiFrameCandidateReport.members
    .filter((member) => member.candidateSpecs.length > 0)
    .map((member) => [member.animationId, Object.freeze(member.candidateSpecs)]),
));

const EXPECTED_AUDIO_CHILD_TAG_CENSUS = Object.freeze({
  DoAction: 2,
  End: 1,
  PlaceObject2: 1,
  ShowFrame: 135,
  SoundStreamBlock: 135,
  SoundStreamHead: 1,
});

function pinnedTimelineIds(numbers) {
  return Object.freeze(numbers.trim().split(/\s+/).map((number) => `sprite-${number}`));
}

export const STATIC_COMPOSITE_CLAIM_SPECS = Object.freeze({
  "course-g03-l06-ti-001": Object.freeze([
    Object.freeze({
      timelineId: "sprite-7",
      sourceObjectId: "7",
      frameCount: 135,
      disposition: "composite-child-with-parent",
      parentTimelineId: "sprite-21",
      parentSourceObjectId: "21",
      parentFrameDomainId: "sprite-21",
      parentInstanceName: "Mc_Sound_0",
      parentPlacementFrame: 1,
      parentDepth: "16",
      parentRemovalFrame: 137,
      rootInstanceName: "animation",
      rootPlacementFrame: 6,
      rootDepth: "1",
      selectorOutcome: 0,
      role: "audio-only-offstage-visual-marker",
      expectedTagCensus: EXPECTED_AUDIO_CHILD_TAG_CENSUS,
    }),
    Object.freeze({
      timelineId: "sprite-8",
      sourceObjectId: "8",
      frameCount: 135,
      disposition: "composite-child-with-parent",
      parentTimelineId: "sprite-21",
      parentSourceObjectId: "21",
      parentFrameDomainId: "sprite-21",
      parentInstanceName: "Mc_Sound_1",
      parentPlacementFrame: 1,
      parentDepth: "18",
      parentRemovalFrame: 137,
      rootInstanceName: "animation",
      rootPlacementFrame: 6,
      rootDepth: "1",
      selectorOutcome: 1,
      role: "audio-only-offstage-visual-marker",
      expectedTagCensus: EXPECTED_AUDIO_CHILD_TAG_CENSUS,
    }),
  ]),
  "course-g04-l01-ir-001": Object.freeze([
    Object.freeze({
      timelineId: "sprite-7",
      sourceObjectId: "7",
      frameCount: 135,
      disposition: "composite-child-with-parent",
      parentTimelineId: "sprite-58",
      parentSourceObjectId: "58",
      parentFrameDomainId: "sprite-58",
      parentInstanceName: "Mc_Sound_0",
      parentPlacementFrame: 1,
      parentDepth: "234",
      parentRemovalFrame: 137,
      rootInstanceName: "animation",
      rootPlacementFrame: 6,
      rootDepth: "1",
      selectorOutcome: 0,
      role: "audio-only-offstage-visual-marker",
      expectedTagCensus: EXPECTED_AUDIO_CHILD_TAG_CENSUS,
    }),
    Object.freeze({
      timelineId: "sprite-8",
      sourceObjectId: "8",
      frameCount: 135,
      disposition: "composite-child-with-parent",
      parentTimelineId: "sprite-58",
      parentSourceObjectId: "58",
      parentFrameDomainId: "sprite-58",
      parentInstanceName: "Mc_Sound_1",
      parentPlacementFrame: 1,
      parentDepth: "236",
      parentRemovalFrame: 137,
      rootInstanceName: "animation",
      rootPlacementFrame: 6,
      rootDepth: "1",
      selectorOutcome: 1,
      role: "audio-only-offstage-visual-marker",
      expectedTagCensus: EXPECTED_AUDIO_CHILD_TAG_CENSUS,
    }),
  ]),
});

const RE001_SINGLE_FRAME_TIMELINE_IDS = Object.freeze([
  "sprite-21", "sprite-23", "sprite-38", "sprite-40", "sprite-91", "sprite-92", "sprite-94", "sprite-96",
  "sprite-131", "sprite-132", "sprite-133", "sprite-134", "sprite-148", "sprite-150", "sprite-151", "sprite-155",
  "sprite-174", "sprite-176", "sprite-179", "sprite-181", "sprite-199", "sprite-201", "sprite-203", "sprite-206",
  "sprite-226", "sprite-228", "sprite-230", "sprite-232", "sprite-248", "sprite-250", "sprite-252", "sprite-254",
  "sprite-267", "sprite-269", "sprite-271", "sprite-273", "sprite-286", "sprite-288", "sprite-290", "sprite-292",
  "sprite-300", "sprite-302", "sprite-304", "sprite-306", "sprite-318", "sprite-320", "sprite-321", "sprite-322",
  "sprite-336", "sprite-338", "sprite-340", "sprite-342", "sprite-360", "sprite-362", "sprite-364", "sprite-366",
  "sprite-378", "sprite-380", "sprite-382", "sprite-384", "sprite-395", "sprite-397", "sprite-399", "sprite-401",
  "sprite-411", "sprite-413", "sprite-415", "sprite-417", "sprite-449", "sprite-451", "sprite-452", "sprite-454",
  "sprite-469", "sprite-471", "sprite-473", "sprite-475", "sprite-490", "sprite-492", "sprite-494", "sprite-496",
  "sprite-526", "sprite-528", "sprite-530", "sprite-532", "sprite-544", "sprite-546", "sprite-548", "sprite-549",
  "sprite-560", "sprite-561", "sprite-562", "sprite-573", "sprite-582", "sprite-583", "sprite-584", "sprite-595",
  "sprite-604", "sprite-605", "sprite-606", "sprite-617",
]);

const TS008_SINGLE_FRAME_TIMELINE_IDS = pinnedTimelineIds(`
  58 60 167 300 307 352
`);

const FQ002_REVIEW_SINGLE_FRAME_TIMELINE_IDS = pinnedTimelineIds(`
  12 14 16 18 50 52 54 56 83 85 87 89 109 111 113 115 138 140 142 144
  161 163 165 167 183 185 187 189 202 222 225 228 231 262 265 268 271 277 280 283
  286 292 295 298 301 316 318 320 323 328 331 333 336 342 345 348 351 357 360 363
  366 372 374 376 379 386 389 392 395 402 405 408 411 416 419 422 425 432 435 438
  441 447 450 453 456 462 465 468 471 477 479 482 484 489 491 493 495 501 504 507
  510 515 518 521 523 530 533 535 537 544 547 549 552 558 561 564 567 573 576 579
  582 588 591 594 596 600 602 603 604 608 610 612 614 618 620 622 623 627 629 631
  633 638 640 642 644 650 652 654 656 662 663 664 666 672 678 679 688 689 699 700
  701 702 712 713 714 715 725 726 727 728 740 741 742 743 755 756 757 758 775 777
  779 781 796 798 800 802 815 816 817 818 831 832 833 834 842 843 844 845 859 860
  861 862 875 876 877 878 896 897 898 899 913 914 915 916 930 931 932 933 944 946
  947 957 963 965 974 977 983 985 993 995 1001 1002 1003 1004 1018 1019 1020 1021
  1039 1041 1043 1045 1058 1060 1062 1064 1072 1073 1074 1075
`);

const GS002_SINGLE_FRAME_TIMELINE_IDS = pinnedTimelineIds(`
  21 24 122 665 677 684 690 699 707 714 725 731
`);

const SHELL_G04_L01_SINGLE_FRAME_TIMELINE_IDS = pinnedTimelineIds(`
  86 107 109 113 115 117 138 170 174 178 182 184 188 190 197 235 241 265 566 567
  584 595 600 601 608 610 687 689 692 694 698 797 816 830 841 851 864 872 881 889
  896 903 910 917 924 931 938 945 952 959 966 973 980 987 994 1001 1008 1017 1025
  1032 1039 1046 1053 1060 1067 1074 1081 1088 1095 1102 1109 1116 1123 1130 1137
  1144 1154 1162 1169 1176
`);

const SHELL_G04_L03_SINGLE_FRAME_TIMELINE_IDS = pinnedTimelineIds(`
  86 107 109 113 115 117 138 170 174 178 182 184 188 190 197 235 241 265 566 567
  584 596 601 602 609 611 689 691 694 696 700 799 818 832 843 853 866 874 883 891
  898 905 912 919 926 933 940 949 957 964 971 978 988 996 1003 1010
`);

/**
 * These sets are intentionally explicit rather than discovered at write time.
 * The builder independently derives the complete eligible set from the bound
 * scenario inventory, swfmill structure, FFDec scripts, and current manifest,
 * then requires byte-for-byte ID/count equality with this reviewed contract.
 */
export const STATIC_SINGLE_FRAME_SCRIPTLESS_CLAIM_SPECS = Object.freeze({
  "course-g04-l03-ts-006": Object.freeze({
    proofType: "single-frame-scriptless-structural-child",
    expectedTimelineCount: 1,
    timelineIds: Object.freeze(["sprite-3"]),
  }),
  "formula-elementary-conversion-01-01": Object.freeze({
    proofType: "single-frame-scriptless-structural-child",
    expectedTimelineCount: 2,
    timelineIds: Object.freeze(["sprite-131", "sprite-134"]),
  }),
  "formula-elementary-conversion-01-02": Object.freeze({
    proofType: "single-frame-scriptless-structural-child",
    expectedTimelineCount: 2,
    timelineIds: Object.freeze(["sprite-131", "sprite-134"]),
  }),
  "formula-elementary-conversion-01-03": Object.freeze({
    proofType: "single-frame-scriptless-structural-child",
    expectedTimelineCount: 2,
    timelineIds: Object.freeze(["sprite-131", "sprite-134"]),
  }),
  "formula-elementary-conversion-01-04": Object.freeze({
    proofType: "single-frame-scriptless-structural-child",
    expectedTimelineCount: 2,
    timelineIds: Object.freeze(["sprite-131", "sprite-134"]),
  }),
  "course-g03-l01-ts-008": Object.freeze({
    proofType: "single-frame-scriptless-structural-child",
    expectedTimelineCount: 6,
    timelineIds: TS008_SINGLE_FRAME_TIMELINE_IDS,
  }),
  "course-g03-l01-vb-004": Object.freeze({
    proofType: "single-frame-scriptless-structural-child",
    expectedTimelineCount: 3,
    timelineIds: Object.freeze(["sprite-5", "sprite-219", "sprite-226"]),
  }),
  "course-g03-l08-re-001": Object.freeze({
    proofType: "single-frame-scriptless-structural-child",
    expectedTimelineCount: 100,
    timelineIds: RE001_SINGLE_FRAME_TIMELINE_IDS,
  }),
  "course-g03-l06-fq-002-review": Object.freeze({
    proofType: "single-frame-scriptless-structural-child",
    expectedTimelineCount: 250,
    timelineIds: FQ002_REVIEW_SINGLE_FRAME_TIMELINE_IDS,
  }),
  "course-g04-l01-ir-001": Object.freeze({
    proofType: "single-frame-scriptless-structural-child",
    expectedTimelineCount: 2,
    timelineIds: Object.freeze(["sprite-48", "sprite-52"]),
  }),
  "course-g04-l03-in-009": Object.freeze({
    proofType: "single-frame-scriptless-structural-child",
    expectedTimelineCount: 1,
    timelineIds: Object.freeze(["sprite-5"]),
  }),
  "course-g04-l09-gs-002": Object.freeze({
    proofType: "single-frame-scriptless-structural-child",
    expectedTimelineCount: 12,
    timelineIds: GS002_SINGLE_FRAME_TIMELINE_IDS,
  }),
  "shell-course-g04-l01-index-local": Object.freeze({
    proofType: "single-frame-scriptless-structural-child",
    expectedTimelineCount: 80,
    timelineIds: SHELL_G04_L01_SINGLE_FRAME_TIMELINE_IDS,
  }),
  "shell-course-g04-l03-index-local": Object.freeze({
    proofType: "single-frame-scriptless-structural-child",
    expectedTimelineCount: 56,
    timelineIds: SHELL_G04_L03_SINGLE_FRAME_TIMELINE_IDS,
  }),
  ...G4_L3_REVIEWED_SINGLE_FRAME_SCRIPTLESS_CLAIM_SPECS,
});

function inclusiveIntegerRange(start, end) {
  return Object.freeze(Array.from({length: end - start + 1}, (_, index) => start + index));
}

const RW002_MULTI_FRAME_SCRIPTLESS_TIMELINES = Object.freeze([
  Object.freeze({
    timelineId: "sprite-22",
    sourceObjectId: "22",
    frameCount: 17,
    expectedTagCensus: Object.freeze({End: 1, PlaceObject2: 10, RemoveObject2: 1, ShowFrame: 17}),
    placements: Object.freeze([
      Object.freeze({frame: 79, depth: "88", removalFrame: 123, updateFrames: inclusiveIntegerRange(80, 122)}),
    ]),
  }),
  Object.freeze({
    timelineId: "sprite-93",
    sourceObjectId: "93",
    frameCount: 23,
    expectedTagCensus: Object.freeze({End: 1, PlaceObject2: 11, ShowFrame: 23}),
    placements: Object.freeze([
      Object.freeze({frame: 245, depth: "510", removalFrame: 284, updateFrames: inclusiveIntegerRange(246, 270)}),
    ]),
  }),
  Object.freeze({
    timelineId: "sprite-251",
    sourceObjectId: "251",
    frameCount: 3,
    expectedTagCensus: Object.freeze({End: 1, PlaceObject2: 3, ShowFrame: 3}),
    placements: Object.freeze([
      Object.freeze({frame: 908, depth: "717", removalFrame: 931, updateFrames: Object.freeze([])}),
      Object.freeze({frame: 997, depth: "717", removalFrame: 1036, updateFrames: Object.freeze([])}),
      Object.freeze({frame: 1122, depth: "717", removalFrame: 1180, updateFrames: Object.freeze([])}),
      Object.freeze({frame: 1298, depth: "717", removalFrame: 1444, updateFrames: Object.freeze([])}),
      Object.freeze({frame: 1560, depth: "717", removalFrame: 1597, updateFrames: Object.freeze([])}),
    ]),
  }),
  Object.freeze({
    timelineId: "sprite-264",
    sourceObjectId: "264",
    frameCount: 3,
    expectedTagCensus: Object.freeze({End: 1, PlaceObject2: 3, ShowFrame: 3}),
    placements: Object.freeze([
      Object.freeze({frame: 937, depth: "717", removalFrame: 985, updateFrames: Object.freeze([])}),
      Object.freeze({frame: 1046, depth: "717", removalFrame: 1117, updateFrames: Object.freeze([])}),
      Object.freeze({frame: 1189, depth: "717", removalFrame: 1279, updateFrames: Object.freeze([])}),
      Object.freeze({frame: 1455, depth: "717", removalFrame: 1545, updateFrames: Object.freeze([])}),
      Object.freeze({frame: 1604, depth: "717", removalFrame: 1679, updateFrames: Object.freeze([])}),
    ]),
  }),
]);

export const STATIC_MULTI_FRAME_SCRIPTLESS_COMPOSITE_CLAIM_SPECS = Object.freeze({
  "course-g04-l03-in-009": Object.freeze({
    proofType: "multi-frame-scriptless-parent-clock-composite-child",
    expectedTimelineCount: 3,
    parentTimelineId: "sprite-200",
    parentSourceObjectId: "200",
    parentFrameDomainId: "sprite-200",
    parentFrameCount: 637,
    rootPlacementFrame: 6,
    rootDepth: "4",
    rootInstanceName: "animation",
    timelines: Object.freeze([
      Object.freeze({
        timelineId: "sprite-123",
        sourceObjectId: "123",
        frameCount: 22,
        expectedTagCensus: Object.freeze({End: 1, PlaceObject2: 48, ShowFrame: 22}),
        placements: Object.freeze([
          Object.freeze({
            frame: 277,
            depth: "3",
            termination: Object.freeze({kind: "removal", frame: 505}),
            updateFrames: inclusiveIntegerRange(278, 284),
          }),
          Object.freeze({
            frame: 635,
            depth: "3",
            termination: Object.freeze({kind: "parent-timeline-terminal", frame: 637}),
            updateFrames: Object.freeze([]),
            allowZeroWrap: true,
          }),
        ]),
      }),
      Object.freeze({
        timelineId: "sprite-146",
        sourceObjectId: "146",
        frameCount: 24,
        expectedTagCensus: Object.freeze({End: 1, PlaceObject2: 20, ShowFrame: 24}),
        placements: Object.freeze([
          Object.freeze({
            frame: 277,
            depth: "45",
            termination: Object.freeze({kind: "removal", frame: 505}),
            updateFrames: inclusiveIntegerRange(278, 284),
          }),
          Object.freeze({
            frame: 635,
            depth: "45",
            termination: Object.freeze({kind: "parent-timeline-terminal", frame: 637}),
            updateFrames: Object.freeze([]),
            allowZeroWrap: true,
          }),
        ]),
      }),
      Object.freeze({
        timelineId: "sprite-150",
        sourceObjectId: "150",
        frameCount: 288,
        expectedTagCensus: Object.freeze({End: 1, PlaceObject2: 358, RemoveObject2: 6, ShowFrame: 288}),
        placements: Object.freeze([
          Object.freeze({
            frame: 277,
            depth: "76",
            termination: Object.freeze({kind: "removal", frame: 505}),
            updateFrames: inclusiveIntegerRange(278, 284),
            allowZeroWrap: true,
          }),
          Object.freeze({
            frame: 505,
            depth: "149",
            termination: Object.freeze({kind: "removal", frame: 635}),
            updateFrames: Object.freeze([]),
            allowZeroWrap: true,
          }),
          Object.freeze({
            frame: 635,
            depth: "76",
            termination: Object.freeze({kind: "parent-timeline-terminal", frame: 637}),
            updateFrames: Object.freeze([]),
            allowZeroWrap: true,
          }),
        ]),
      }),
    ]),
  }),
  "formula-elementary-conversion-01-04": Object.freeze({
    proofType: "multi-frame-scriptless-parent-clock-composite-child",
    expectedTimelineCount: 1,
    parentTimelineId: "root",
    parentSourceObjectId: null,
    parentFrameDomainId: "root",
    parentFrameCount: 67,
    expectedGlobalDoInitActionSpriteObjectIds: Object.freeze([
      "21", "22", "23", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37",
      "92", "93", "95", "96", "97", "98", "99",
    ]),
    timelines: Object.freeze([
      Object.freeze({
        timelineId: "sprite-156",
        sourceObjectId: "156",
        frameCount: 3,
        expectedTagCensus: Object.freeze({End: 1, PlaceObject2: 3, ShowFrame: 3}),
        placements: Object.freeze([
          Object.freeze({
            frame: 8,
            depth: "11",
            removalFrame: 43,
            updateFrames: inclusiveIntegerRange(9, 42),
          }),
        ]),
      }),
    ]),
  }),
  "course-g05-l13-rw-002": Object.freeze({
    proofType: "multi-frame-scriptless-parent-clock-composite-child",
    expectedTimelineCount: 4,
    parentTimelineId: "sprite-334",
    parentSourceObjectId: "334",
    parentFrameDomainId: "sprite-334",
    parentFrameCount: 1873,
    rootPlacementFrame: 6,
    rootDepth: "3",
    rootInstanceName: "animation",
    timelines: RW002_MULTI_FRAME_SCRIPTLESS_TIMELINES,
  }),
  ...G4_L3_REVIEWED_MULTI_FRAME_SCRIPTLESS_CLAIM_SPECS,
});

export const STATIC_DISPOSITION_ANIMATION_IDS = Object.freeze([
  ...new Set([
    ...Object.keys(STATIC_COMPOSITE_CLAIM_SPECS),
    ...Object.keys(STATIC_SINGLE_FRAME_SCRIPTLESS_CLAIM_SPECS),
    ...Object.keys(STATIC_MULTI_FRAME_SCRIPTLESS_COMPOSITE_CLAIM_SPECS),
  ]),
].sort());

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalG4L3ReviewedPairBytes(candidateReport) {
  const pairs = candidateReport.members
    .flatMap((member) => member.eligibleCandidates.map((candidate) => `${member.animationId}\t${candidate.timelineId}`))
    .sort(compareText);
  return Buffer.from(`${pairs.join("\n")}\n`, "utf8");
}

async function loadG4L3ReviewedSingleFrameSelection(animationId) {
  if (!G4_L3_REVIEWED_SINGLE_FRAME_SCRIPTLESS_CLAIM_SPECS[animationId]) return null;
  const selectionPath = path.join(projectRoot, G4_L3_REVIEWED_SINGLE_FRAME_SELECTION_RELATIVE_PATH);
  const candidatePath = path.join(projectRoot, G4_L3_SINGLE_FRAME_CANDIDATE_REPORT_RELATIVE_PATH);
  const [selectionBytes, candidateBytes, candidateGeneratorBytes, proofEngineBytes] = await Promise.all([
    readFile(selectionPath),
    readFile(candidatePath),
    readFile(path.join(projectRoot, "scripts/build-g4-l3-single-frame-disposition-candidates.mjs")),
    readFile(scriptPath),
  ]);
  const selection = JSON.parse(selectionBytes.toString("utf8"));
  const candidateReport = JSON.parse(candidateBytes.toString("utf8"));
  const label = `${animationId}: G4 L3 reviewed single-frame selection`;
  assert(selection.schemaVersion === 1 && selection.decisionType === "g4-l3-reviewed-single-frame-static-disposition-selection", `${label} schema/type is invalid`);
  assert(selection.review?.reviewerKind === "codex-engineering-source-proof-review", `${label} reviewer kind is invalid`);
  assert(selection.review?.humanReviewer === false && selection.review?.humanSignature === null && selection.review?.ownerAcceptance === false, `${label} may not fabricate human or owner review`);
  assert(selection.review?.decision === "accept-exact-eligible-set-for-static-independent-local-playhead-disposition-only", `${label} decision is invalid`);
  assert(selection.candidateReport?.path === G4_L3_SINGLE_FRAME_CANDIDATE_REPORT_RELATIVE_PATH, `${label} candidate path is invalid`);
  assert(selection.candidateReport?.sha256 === sha256(candidateBytes), `${label} candidate report hash is stale`);
  assert(selection.candidateReport?.schemaVersion === candidateReport.schemaVersion && selection.candidateReport?.reportType === candidateReport.reportType, `${label} candidate schema/type binding is stale`);
  assert(selection.candidateReport?.generatorSha256 === candidateReport.generatedBy?.sha256, `${label} candidate generator binding is stale`);
  assert(candidateReport.generatedBy?.sha256 === sha256(candidateGeneratorBytes), `${label} physical candidate generator hash is stale`);
  assert(candidateReport.generatedBy?.proofEngine?.path === "scripts/build-static-frame-domain-disposition-evidence.mjs", `${label} proof engine path is invalid`);
  assert(candidateReport.generatedBy?.proofEngine?.sha256 === sha256(proofEngineBytes), `${label} proof engine hash is stale`);
  assert(candidateReport.schemaVersion === 1 && candidateReport.reportType === "g4-l3-single-frame-disposition-candidates", `${label} candidate report schema/type is invalid`);
  assert(candidateReport.scope?.memberCount === 37 && candidateReport.members?.length === 37, `${label} candidate report scope is incomplete`);
  assert(candidateReport.acceptance?.acceptanceNeutral === true && candidateReport.acceptance?.frameDomainDispositionEstablished === false && candidateReport.acceptance?.strictMigrationComplete === false, `${label} candidate report was promoted`);
  const pairBytes = canonicalG4L3ReviewedPairBytes(candidateReport);
  const acceptedCandidates = candidateReport.members.flatMap((member) => member.eligibleCandidates);
  assert(selection.acceptedSet?.selector === "every members[].eligibleCandidates[] entry in the exact candidate-report bytes", `${label} selector is invalid`);
  assert(selection.acceptedSet?.candidateCount === acceptedCandidates.length, `${label} candidate count is stale`);
  assert(selection.acceptedSet?.memberCount === candidateReport.members.filter((member) => member.eligibleCandidates.length > 0).length, `${label} selected member count is stale`);
  assert(selection.acceptedSet?.canonicalPairBytes === pairBytes.length && selection.acceptedSet?.canonicalPairSetSha256 === sha256(pairBytes), `${label} canonical selected set is stale`);
  assert(selection.excludedSet?.candidateCount === candidateReport.members.reduce((sum, member) => sum + member.disqualifiedOneFrameTimelines.length, 0), `${label} excluded count is stale`);
  for (const key of ["authoritativeRuntimeAccepted", "audioAccepted", "visualOrBehaviorParityAccepted", "humanVisualAccepted", "ownerAccepted", "strictMigrationComplete"]) {
    assert(selection.acceptance?.[key] === false, `${label} promoted ${key}`);
  }
  assert(selection.acceptance?.acceptanceNeutral === true, `${label} must remain acceptance-neutral`);
  assert(String(selection.strictAcceptanceEffect || "").startsWith("none;"), `${label} strict acceptance effect is invalid`);
  const member = candidateReport.members.find((item) => item.animationId === animationId);
  assert(member && member.eligibleCandidates.length > 0, `${label} selected member is missing`);
  const spec = G4_L3_REVIEWED_SINGLE_FRAME_SCRIPTLESS_CLAIM_SPECS[animationId];
  assertExactTimelineSet(
    member.eligibleCandidates.map(({timelineId}) => timelineId),
    spec.timelineIds,
    `${label} member timeline set`,
  );
  assert(member.eligibleCandidateCount === spec.expectedTimelineCount, `${label} member candidate count is stale`);
  return {
    selection: {
      path: G4_L3_REVIEWED_SINGLE_FRAME_SELECTION_RELATIVE_PATH,
      sha256: sha256(selectionBytes),
      schemaVersion: selection.schemaVersion,
      decision: selection.review.decision,
      humanReviewer: false,
      ownerAcceptance: false,
    },
    candidateReport: {
      path: G4_L3_SINGLE_FRAME_CANDIDATE_REPORT_RELATIVE_PATH,
      sha256: sha256(candidateBytes),
      schemaVersion: candidateReport.schemaVersion,
      reportType: candidateReport.reportType,
      acceptedPairSetSha256: sha256(pairBytes),
    },
    memberSelection: {
      animationId,
      expectedTimelineCount: spec.expectedTimelineCount,
      expectedTimelineIds: [...spec.timelineIds],
    },
  };
}

function canonicalG4L3ReviewedMultiFramePairBytes(candidateReport, field) {
  const pairs = candidateReport.members
    .flatMap((member) => member[field].map((timelineId) => `${member.animationId}\t${timelineId}`))
    .sort(compareText);
  return Buffer.from(`${pairs.join("\n")}\n`, "utf8");
}

async function loadG4L3ReviewedMultiFrameSelection(animationId) {
  if (!G4_L3_REVIEWED_MULTI_FRAME_SCRIPTLESS_CLAIM_SPECS[animationId]) return null;
  const selectionPath = path.join(projectRoot, G4_L3_REVIEWED_MULTI_FRAME_SELECTION_RELATIVE_PATH);
  const candidatePath = path.join(projectRoot, G4_L3_MULTI_FRAME_CANDIDATE_REPORT_RELATIVE_PATH);
  const [selectionBytes, candidateBytes, candidateGeneratorBytes, proofEngineBytes] = await Promise.all([
    readFile(selectionPath),
    readFile(candidatePath),
    readFile(path.join(projectRoot, "scripts/build-g4-l3-multi-frame-disposition-candidates.mjs")),
    readFile(scriptPath),
  ]);
  const selection = JSON.parse(selectionBytes.toString("utf8"));
  const candidateReport = JSON.parse(candidateBytes.toString("utf8"));
  const label = `${animationId}: G4 L3 reviewed multi-frame selection`;
  assert(selection.schemaVersion === 1 && selection.decisionType === "g4-l3-reviewed-multi-frame-static-disposition-selection", `${label} schema/type is invalid`);
  assert(selection.review?.reviewerKind === "codex-engineering-source-proof-review", `${label} reviewer kind is invalid`);
  assert(selection.review?.humanReviewer === false && selection.review?.humanSignature === null && selection.review?.ownerAcceptance === false, `${label} may not fabricate human or owner review`);
  assert(selection.review?.decision === "accept-exact-eligible-set-and-preserve-exact-excluded-set", `${label} decision is invalid`);
  assert(selection.candidateReport?.path === G4_L3_MULTI_FRAME_CANDIDATE_REPORT_RELATIVE_PATH, `${label} candidate path is invalid`);
  assert(selection.candidateReport?.sha256 === sha256(candidateBytes), `${label} candidate report hash is stale`);
  assert(selection.candidateReport?.schemaVersion === candidateReport.schemaVersion && selection.candidateReport?.reportType === candidateReport.reportType, `${label} candidate schema/type binding is stale`);
  assert(selection.candidateReport?.generatorSha256 === candidateReport.generatedBy?.sha256, `${label} candidate generator binding is stale`);
  assert(candidateReport.generatedBy?.sha256 === sha256(candidateGeneratorBytes), `${label} physical candidate generator hash is stale`);
  assert(candidateReport.generatedBy?.proofEngine?.path === "scripts/build-static-frame-domain-disposition-evidence.mjs", `${label} proof engine path is invalid`);
  assert(candidateReport.generatedBy?.proofEngine?.sha256 === sha256(proofEngineBytes), `${label} proof engine hash is stale`);
  assert(candidateReport.schemaVersion === 1 && candidateReport.reportType === "g4-l3-multi-frame-disposition-candidates", `${label} candidate report schema/type is invalid`);
  assert(candidateReport.scope?.memberCount === 37 && candidateReport.members?.length === 37, `${label} candidate report scope is incomplete`);
  assert(candidateReport.acceptance?.acceptanceNeutral === true && candidateReport.acceptance?.frameDomainDispositionEstablished === false && candidateReport.acceptance?.strictMigrationComplete === false, `${label} candidate report was promoted`);
  const acceptedPairBytes = canonicalG4L3ReviewedMultiFramePairBytes(candidateReport, "eligibleTimelineIds");
  const excludedPairBytes = canonicalG4L3ReviewedMultiFramePairBytes(candidateReport, "excludedTimelineIds");
  assert(selection.acceptedSet?.selector === "every members[].eligibleTimelineIds[] entry in the exact candidate-report bytes", `${label} accepted selector is invalid`);
  assert(selection.acceptedSet?.candidateCount === candidateReport.summary.eligibleCandidateCount, `${label} accepted count is stale`);
  assert(selection.acceptedSet?.memberCount === candidateReport.summary.memberWithEligibleCandidatesCount, `${label} accepted member count is stale`);
  assert(selection.acceptedSet?.canonicalPairBytes === acceptedPairBytes.length && selection.acceptedSet?.canonicalPairSetSha256 === sha256(acceptedPairBytes), `${label} accepted pair set is stale`);
  assert(selection.excludedSet?.selector === "every members[].excludedTimelineIds[] entry in the exact candidate-report bytes", `${label} excluded selector is invalid`);
  assert(selection.excludedSet?.candidateCount === candidateReport.summary.excludedCandidateCount, `${label} excluded count is stale`);
  assert(selection.excludedSet?.canonicalPairBytes === excludedPairBytes.length && selection.excludedSet?.canonicalPairSetSha256 === sha256(excludedPairBytes), `${label} excluded pair set is stale`);
  assert(candidateReport.summary.undeclaredReachableMultiFrameCount === candidateReport.summary.eligibleCandidateCount + candidateReport.summary.excludedCandidateCount, `${label} candidate partition is incomplete`);
  for (const key of ["authoritativeRuntimeAccepted", "audioAccepted", "visualOrBehaviorParityAccepted", "humanVisualAccepted", "ownerAccepted", "strictMigrationComplete"]) {
    assert(selection.acceptance?.[key] === false, `${label} promoted ${key}`);
  }
  assert(selection.acceptance?.acceptanceNeutral === true, `${label} must remain acceptance-neutral`);
  assert(String(selection.strictAcceptanceEffect || "").startsWith("none;"), `${label} strict acceptance effect is invalid`);
  const member = candidateReport.members.find((item) => item.animationId === animationId);
  assert(member && member.candidateSpecs.length > 0, `${label} selected member is missing`);
  const specs = G4_L3_REVIEWED_MULTI_FRAME_SCRIPTLESS_CLAIM_SPECS[animationId];
  assert(JSON.stringify(member.candidateSpecs) === JSON.stringify(specs), `${label} member candidate specs are stale`);
  return {
    evidence: {
      selection: {
        path: G4_L3_REVIEWED_MULTI_FRAME_SELECTION_RELATIVE_PATH,
        sha256: sha256(selectionBytes),
        schemaVersion: selection.schemaVersion,
        decision: selection.review.decision,
        humanReviewer: false,
        ownerAcceptance: false,
      },
      candidateReport: {
        path: G4_L3_MULTI_FRAME_CANDIDATE_REPORT_RELATIVE_PATH,
        sha256: sha256(candidateBytes),
        schemaVersion: candidateReport.schemaVersion,
        reportType: candidateReport.reportType,
        acceptedPairSetSha256: sha256(acceptedPairBytes),
        excludedPairSetSha256: sha256(excludedPairBytes),
      },
      memberSelection: {
        animationId,
        expectedTimelineCount: member.eligibleCandidateCount,
        expectedTimelineIds: [...member.eligibleTimelineIds],
        excludedTimelineIds: [...member.excludedTimelineIds],
      },
    },
    excludedTimelineIds: [...member.excludedTimelineIds],
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertSha256(value, label) {
  assert(SHA256_PATTERN.test(value || ""), `${label} must be a lowercase SHA-256 digest`);
}

async function exists(candidate) {
  try {
    await stat(candidate);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

function requiredInventoryEvidence(inventory, artifactId) {
  const matches = (inventory.evidenceIndex || []).filter((item) => item.artifactId === artifactId);
  assert(matches.length === 1, `${inventory.animationId}: scenario inventory must bind exactly one ${artifactId} artifact`);
  const [artifact] = matches;
  assert(artifact.path, `${inventory.animationId}: ${artifactId}.path is missing`);
  assertSha256(artifact.sha256, `${inventory.animationId}: ${artifactId}.sha256`);
  return artifact;
}

function parseAttributes(source) {
  const attributes = {};
  for (const match of source.matchAll(/([A-Za-z_][\w:.-]*)="([^"]*)"/g)) attributes[match[1]] = match[2];
  return attributes;
}

function numberAttribute(attributes, name, fallback = 0) {
  if (!(name in attributes)) return fallback;
  const value = Number(attributes[name]);
  assert(Number.isFinite(value), `swfmill ${name} must be numeric`);
  return value;
}

function matrixFromTransform(attributes = {}) {
  return {
    a: numberAttribute(attributes, "scaleX", 1),
    b: numberAttribute(attributes, "skewY", 0),
    c: numberAttribute(attributes, "skewX", 0),
    d: numberAttribute(attributes, "scaleY", 1),
    tx: numberAttribute(attributes, "transX", 0),
    ty: numberAttribute(attributes, "transY", 0),
  };
}

function multiplyMatrices(outer, inner) {
  return {
    a: outer.a * inner.a + outer.c * inner.b,
    b: outer.b * inner.a + outer.d * inner.b,
    c: outer.a * inner.c + outer.c * inner.d,
    d: outer.b * inner.c + outer.d * inner.d,
    tx: outer.a * inner.tx + outer.c * inner.ty + outer.tx,
    ty: outer.b * inner.tx + outer.d * inner.ty + outer.ty,
  };
}

function transformBounds(bounds, matrix) {
  const points = [
    [bounds.left, bounds.top],
    [bounds.right, bounds.top],
    [bounds.right, bounds.bottom],
    [bounds.left, bounds.bottom],
  ].map(([x, y]) => ({
    x: matrix.a * x + matrix.c * y + matrix.tx,
    y: matrix.b * x + matrix.d * y + matrix.ty,
  }));
  return {
    left: Math.min(...points.map(({x}) => x)),
    right: Math.max(...points.map(({x}) => x)),
    top: Math.min(...points.map(({y}) => y)),
    bottom: Math.max(...points.map(({y}) => y)),
  };
}

function boundsFromAttributes(attributes) {
  return {
    left: numberAttribute(attributes, "left"),
    right: numberAttribute(attributes, "right"),
    top: numberAttribute(attributes, "top"),
    bottom: numberAttribute(attributes, "bottom"),
  };
}

function intersects(left, right) {
  return !(
    left.right <= right.left
    || left.left >= right.right
    || left.bottom <= right.top
    || left.top >= right.bottom
  );
}

function directTimelineFor(stack) {
  const parent = stack.at(-1);
  const owner = stack.at(-2);
  return parent?.name === "tags" && (owner?.name === "Header" || owner?.name === "DefineSprite")
    ? owner.timeline
    : null;
}

function nearestPlacement(stack) {
  for (let index = stack.length - 1; index >= 0; index -= 1) {
    if (stack[index].placement) return stack[index].placement;
  }
  return null;
}

/**
 * Parse only structural swfmill facts needed by the disposition proof. The
 * tokenizer ignores element text (including large base64 sound blocks) and
 * never treats nested action opcodes as root/sprite timeline tags.
 */
export function parseSwfmillDispositionStructure(xml) {
  const stack = [];
  const timelines = new Map();
  const shapes = new Map();
  const initActions = [];
  let stageBounds = null;
  const tokenPattern = /<\/?([A-Za-z_][\w:.-]*)([^>]*)>/g;
  for (const match of xml.matchAll(tokenPattern)) {
    const raw = match[0];
    if (raw.startsWith("<?") || raw.startsWith("<!")) continue;
    const name = match[1];
    const closing = raw.startsWith("</");
    if (closing) {
      const node = stack.pop();
      assert(node?.name === name, `swfmill XML nesting mismatch: expected ${node?.name || "none"}, received ${name}`);
      continue;
    }

    const attributes = parseAttributes(match[2]);
    const selfClosing = /\/\s*>$/.test(raw);
    const parent = stack.at(-1);
    const grandparent = stack.at(-2);
    const timeline = directTimelineFor(stack);
    const node = {name, attributes};

    if (name === "Header") {
      const root = {
        timelineId: "root",
        objectId: null,
        declaredFrames: Number.parseInt(attributes.frames, 10),
        currentFrame: 1,
        observedShowFrames: 0,
        tagCounts: {},
        placements: [],
        removals: [],
        soundHeads: [],
        events: [],
      };
      assert(Number.isInteger(root.declaredFrames) && root.declaredFrames > 0, "swfmill root frame count is invalid");
      timelines.set("root", root);
      node.timeline = root;
    } else if (name === "DefineSprite") {
      const objectId = attributes.objectID;
      assert(objectId, "swfmill DefineSprite objectID is missing");
      const sprite = {
        timelineId: `sprite-${objectId}`,
        objectId,
        declaredFrames: Number.parseInt(attributes.frames, 10),
        currentFrame: 1,
        observedShowFrames: 0,
        tagCounts: {},
        placements: [],
        removals: [],
        soundHeads: [],
        events: [],
      };
      assert(Number.isInteger(sprite.declaredFrames) && sprite.declaredFrames > 0, `${sprite.timelineId}: invalid frame count`);
      assert(!timelines.has(sprite.timelineId), `${sprite.timelineId}: duplicate DefineSprite`);
      timelines.set(sprite.timelineId, sprite);
      node.timeline = sprite;
    } else if (name === "DefineShape" || name === "DefineShape2" || name === "DefineShape3" || name === "DefineShape4") {
      const objectId = attributes.objectID;
      assert(objectId, `swfmill ${name} objectID is missing`);
      const shape = {objectId, definitionTag: name, bounds: null};
      shapes.set(objectId, shape);
      node.shape = shape;
    }

    if (name === "Rectangle" && parent?.name === "size" && grandparent?.name === "Header") {
      stageBounds = boundsFromAttributes(attributes);
    } else if (name === "Rectangle" && parent?.name === "bounds" && grandparent?.shape) {
      grandparent.shape.bounds = boundsFromAttributes(attributes);
    }

    if (timeline) {
      timeline.tagCounts[name] = (timeline.tagCounts[name] || 0) + 1;
      if (name === "ShowFrame") {
        timeline.observedShowFrames += 1;
        timeline.currentFrame += 1;
      } else if (name === "PlaceObject" || name === "PlaceObject2" || name === "PlaceObject3") {
        const placement = {
          tag: name,
          frame: timeline.currentFrame,
          depth: String(attributes.depth ?? ""),
          objectId: attributes.objectID ?? null,
          name: attributes.name || "",
          replace: attributes.replace || "",
          hasClipActions: false,
          matrix: matrixFromTransform(),
          eventIndex: timeline.events.length,
        };
        timeline.placements.push(placement);
        timeline.events.push({kind: "placement", placement});
        node.placement = placement;
      } else if (name === "RemoveObject" || name === "RemoveObject2") {
        const removal = {
          tag: name,
          frame: timeline.currentFrame,
          depth: String(attributes.depth ?? ""),
          objectId: attributes.objectID ?? null,
          eventIndex: timeline.events.length,
        };
        timeline.removals.push(removal);
        timeline.events.push({kind: "removal", removal});
      } else if (name === "SoundStreamHead" || name === "SoundStreamHead2") {
        timeline.soundHeads.push({tag: name, frame: timeline.currentFrame, attributes});
      }
    }

    if (name === "DoInitAction") {
      initActions.push({
        spriteObjectId: attributes.sprite ?? attributes.objectID ?? null,
        parentTimelineId: timeline?.timelineId ?? null,
      });
    }

    if (name === "Transform") {
      const placement = nearestPlacement(stack);
      if (placement) placement.matrix = matrixFromTransform(attributes);
    }
    if (name === "clipActions" || name === "ClipActions") {
      const placement = nearestPlacement(stack);
      if (placement) placement.hasClipActions = true;
    }

    if (!selfClosing) stack.push(node);
  }
  assert(stack.length === 0, "swfmill XML ended with unclosed elements");
  assert(stageBounds, "swfmill stage Rectangle is missing");
  return {stageBounds, timelines, shapes, initActions};
}

export function parseFfdecDispositionScripts(text) {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");
  const headings = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^===== (.+) =====$/);
    if (match) headings.push({index, script: match[1]});
  }
  const blocks = headings.map((heading, position) => {
    const end = headings[position + 1]?.index ?? lines.length;
    const bodyLines = lines.slice(heading.index + 1, end);
    while (bodyLines[0] === "") bodyLines.shift();
    while (bodyLines.at(-1) === "") bodyLines.pop();
    const body = bodyLines.join("\n");
    const sprite = heading.script.match(/^DefineSprite_(\d+)(?:_[^/]*)?\/frame_(\d+)\/([^/]+\.as)$/);
    const firstBodyLine = lines.findIndex((line, index) => index > heading.index && index < end && line !== "");
    return {
      script: heading.script,
      scope: sprite
        ? {kind: "sprite", objectId: sprite[1], frame: Number(sprite[2]), actionFile: sprite[3]}
        : {kind: "other"},
      body,
      bodySha256: sha256(body),
      headingLine: heading.index + 1,
      lineStart: firstBodyLine >= 0 ? firstBodyLine + 1 : heading.index + 2,
      lineEnd: Math.max(firstBodyLine >= 0 ? firstBodyLine + 1 : heading.index + 2, end),
    };
  });
  const referencesFor = (token) => {
    const references = [];
    for (const block of blocks) {
      const blockLines = block.body.split("\n");
      for (let index = 0; index < blockLines.length; index += 1) {
        let cursor = 0;
        while ((cursor = blockLines[index].indexOf(token, cursor)) >= 0) {
          references.push({
            script: block.script,
            line: block.lineStart + index,
            sourceLine: blockLines[index].trim(),
          });
          cursor += token.length;
        }
      }
    }
    return references;
  };
  return {blocks, referencesFor};
}

function normalizedTagCensus(tagCounts) {
  return Object.fromEntries(Object.entries(tagCounts).sort(([left], [right]) => compareText(left, right)));
}

function normalizedScriptRecord(block) {
  return {
    script: block.script,
    frame: block.scope.frame,
    bodySha256: block.bodySha256,
    lineStart: block.lineStart,
    lineEnd: block.lineEnd,
  };
}

function compareTimelineIds(left, right) {
  const leftNumber = Number.parseInt(String(left).replace(/^sprite-/, ""), 10);
  const rightNumber = Number.parseInt(String(right).replace(/^sprite-/, ""), 10);
  if (Number.isInteger(leftNumber) && Number.isInteger(rightNumber) && leftNumber !== rightNumber) {
    return leftNumber - rightNumber;
  }
  return compareText(String(left), String(right));
}

function sortedTimelineIds(values) {
  return [...values].sort(compareTimelineIds);
}

function assertExactTimelineSet(actual, expected, label) {
  const actualSorted = sortedTimelineIds(actual);
  const expectedSorted = sortedTimelineIds(expected);
  assert(new Set(actualSorted).size === actualSorted.length, `${label}: actual timeline IDs are duplicated`);
  assert(new Set(expectedSorted).size === expectedSorted.length, `${label}: pinned timeline IDs are duplicated`);
  assert(
    JSON.stringify(actualSorted) === JSON.stringify(expectedSorted),
    `${label}: exact timeline set mismatch (expected ${expectedSorted.join(",")}; observed ${actualSorted.join(",")})`,
  );
  return actualSorted;
}

function resolvedPlacementIndex(structure) {
  const incomingByObjectId = new Map();
  const outgoingByTimelineId = new Map();
  for (const timeline of structure.timelines.values()) {
    const displayList = new Map();
    const outgoing = [];
    for (const event of timeline.events || []) {
      if (event.kind === "removal") {
        displayList.delete(event.removal.depth);
        continue;
      }
      const {placement} = event;
      const effectiveObjectId = placement.objectId || displayList.get(placement.depth) || null;
      if (placement.objectId) displayList.set(placement.depth, placement.objectId);
      const resolved = {parentTimelineId: timeline.timelineId, placement, effectiveObjectId};
      outgoing.push(resolved);
      if (effectiveObjectId) {
        if (!incomingByObjectId.has(effectiveObjectId)) incomingByObjectId.set(effectiveObjectId, []);
        incomingByObjectId.get(effectiveObjectId).push(resolved);
      }
    }
    outgoingByTimelineId.set(timeline.timelineId, outgoing);
  }
  return {incomingByObjectId, outgoingByTimelineId};
}

function serializedResolvedPlacement(structure, resolved) {
  const {parentTimelineId, placement, effectiveObjectId} = resolved;
  assert(effectiveObjectId, `${parentTimelineId}: placement at frame ${placement.frame}/depth ${placement.depth} has unresolved object identity`);
  const placedTimelineId = structure.timelines.has(`sprite-${effectiveObjectId}`) ? `sprite-${effectiveObjectId}` : null;
  return {
    parentTimelineId,
    placedTimelineId,
    sourceObjectId: String(effectiveObjectId),
    declaredSourceObjectId: placement.objectId === null ? null : String(placement.objectId),
    inheritedObjectIdentity: placement.objectId === null,
    frame: placement.frame,
    depth: placement.depth,
    instanceName: placement.name,
    tag: placement.tag,
    replace: placement.replace,
    hasClipActions: placement.hasClipActions,
  };
}

export function inspectSingleFrameScriptlessTimeline({
  animationId,
  timelineId,
  structure,
  placementIndex,
  scripts,
  inventory,
  manifest,
}) {
  const label = `${animationId}/${timelineId}`;
  const inventoryMatches = (inventory.timelineInventory || []).filter((item) => item.timelineId === timelineId);
  assert(inventoryMatches.length === 1, `${label}: scenario inventory must contain the timeline exactly once`);
  const [inventoryTimeline] = inventoryMatches;
  const sourceObjectId = String(inventoryTimeline.objectId ?? "");
  assert(/^\d+$/.test(sourceObjectId), `${label}: scenario inventory object ID is invalid`);
  const timeline = structure.timelines.get(timelineId);
  assert(timeline && String(timeline.objectId) === sourceObjectId, `${label}: swfmill timeline/object identity is missing or mismatched`);
  const incomingResolved = placementIndex.incomingByObjectId.get(sourceObjectId) || [];
  const outgoingResolved = placementIndex.outgoingByTimelineId.get(timelineId) || [];
  const allResolved = [...incomingResolved, ...outgoingResolved];
  const unresolvedOutgoingCount = outgoingResolved.filter(({effectiveObjectId}) => !effectiveObjectId).length;
  const clipActionCount = allResolved.filter(({placement}) => placement.hasClipActions).length;
  const directDoActionTagCount = timeline.tagCounts.DoAction || 0;
  const directDoInitActionTagCount = timeline.tagCounts.DoInitAction || 0;
  const attributedDoInitActions = (structure.initActions || []).filter(({spriteObjectId}) => String(spriteObjectId) === sourceObjectId);
  const ffdecFrameScripts = scripts.blocks
    .filter((block) => block.scope.kind === "sprite" && block.scope.objectId === sourceObjectId)
    .sort((left, right) => left.scope.frame - right.scope.frame || compareText(left.script, right.script));
  const declaredFrameDomains = (manifest.implementation?.frameDomains || []).filter((domain) => domain.sourceTimelineId === timelineId);
  const disqualifiers = [];
  if (inventoryTimeline.structuralReachability !== "reachable-from-root-placement-graph") disqualifiers.push("not-root-reachable-in-scenario-inventory");
  if (inventoryTimeline.frameCount !== 1 || timeline.declaredFrames !== 1) disqualifiers.push("frame-count-is-not-exactly-one");
  if (timeline.observedShowFrames !== 1) disqualifiers.push("show-frame-count-is-not-exactly-one");
  if (directDoActionTagCount !== 0) disqualifiers.push("swfmill-do-action-present");
  if (directDoInitActionTagCount !== 0 || attributedDoInitActions.length !== 0) disqualifiers.push("swfmill-do-init-action-present");
  if (ffdecFrameScripts.length !== 0) disqualifiers.push("ffdec-frame-script-present");
  if (declaredFrameDomains.length !== 0) disqualifiers.push("already-declared-frame-domain");
  if (incomingResolved.length === 0) disqualifiers.push("no-exported-incoming-placement");
  if (unresolvedOutgoingCount !== 0) disqualifiers.push("unresolved-exported-outgoing-placement-object");
  if (clipActionCount !== 0) disqualifiers.push("exported-placement-clip-actions-present");
  return {
    timelineId,
    sourceObjectId,
    inventoryTimeline,
    timeline,
    incomingResolved,
    outgoingResolved,
    directDoActionTagCount,
    directDoInitActionTagCount,
    attributedDoInitActions,
    ffdecFrameScripts,
    declaredFrameDomains,
    unresolvedOutgoingCount,
    clipActionCount,
    disqualifiers,
    eligible: disqualifiers.length === 0,
  };
}

function singleFrameObligation(status) {
  return {required: true, satisfiedByDisposition: false, status};
}

export function deriveSingleFrameScriptlessEligibility({animationId, structure, scripts, inventory, manifest}) {
  const placementIndex = resolvedPlacementIndex(structure);
  const inspections = new Map();
  for (const item of inventory.timelineInventory || []) {
    if (item.timelineId === "root" || item.frameCount !== 1) continue;
    if (item.structuralReachability !== "reachable-from-root-placement-graph") continue;
    inspections.set(item.timelineId, inspectSingleFrameScriptlessTimeline({
      animationId,
      timelineId: item.timelineId,
      structure,
      placementIndex,
      scripts,
      inventory,
      manifest,
    }));
  }
  const eligibleTimelineIds = [...inspections.values()].filter(({eligible}) => eligible).map(({timelineId}) => timelineId);
  return {inspections, eligibleTimelineIds: sortedTimelineIds(eligibleTimelineIds)};
}

function deriveSingleFrameScriptlessClaims({animationId, spec, structure, scripts, inventory, manifest}) {
  assert(spec.proofType === "single-frame-scriptless-structural-child", `${animationId}: unsupported single-frame proof type`);
  assert(Number.isInteger(spec.expectedTimelineCount) && spec.expectedTimelineCount > 0, `${animationId}: invalid pinned single-frame timeline count`);
  assert(Array.isArray(spec.timelineIds) && spec.timelineIds.length === spec.expectedTimelineCount, `${animationId}: pinned single-frame timeline count differs from its ID set`);
  const {inspections, eligibleTimelineIds} = deriveSingleFrameScriptlessEligibility({animationId, structure, scripts, inventory, manifest});
  const exactTimelineIds = assertExactTimelineSet(eligibleTimelineIds, spec.timelineIds, `${animationId}: single-frame scriptless eligibility`);
  assert(exactTimelineIds.length === spec.expectedTimelineCount, `${animationId}: verified single-frame count differs from ${spec.expectedTimelineCount}`);
  const claims = exactTimelineIds.map((timelineId) => {
    const inspection = inspections.get(timelineId);
    assert(inspection?.eligible, `${animationId}/${timelineId}: pinned single-frame claim is not eligible (${inspection?.disqualifiers.join(",") || "missing inspection"})`);
    const incomingPlacements = inspection.incomingResolved.map((item) => serializedResolvedPlacement(structure, item));
    const outgoingPlacements = inspection.outgoingResolved.map((item) => serializedResolvedPlacement(structure, item));
    const exportedPlacementCount = incomingPlacements.length + outgoingPlacements.length;
    return {
      timelineId,
      sourceObjectId: inspection.sourceObjectId,
      frameCount: 1,
      disposition: "composite-child-with-parent",
      role: "single-frame-scriptless-structural-child",
      claimScope: "independent-local-playhead-only",
      structuralReachability: "reachable-from-root-placement-graph",
      tagCensus: {
        observed: normalizedTagCensus(inspection.timeline.tagCounts),
        declaredFrameCount: inspection.timeline.declaredFrames,
        observedShowFrameCount: inspection.timeline.observedShowFrames,
        doActionTagCount: inspection.directDoActionTagCount,
        doInitActionTagCount: inspection.directDoInitActionTagCount,
      },
      scriptAudit: {
        ffdecFrameScriptCount: inspection.ffdecFrameScripts.length,
        ffdecFrameScripts: inspection.ffdecFrameScripts.map(normalizedScriptRecord),
        attributedDoInitActionCount: inspection.attributedDoInitActions.length,
        attributedDoInitActions: inspection.attributedDoInitActions,
        scriptless: true,
      },
      placementAudit: {
        incomingPlacementCount: incomingPlacements.length,
        outgoingPlacementCount: outgoingPlacements.length,
        exportedPlacementCount,
        unresolvedOutgoingObjectCount: inspection.unresolvedOutgoingCount,
        clipActionCount: inspection.clipActionCount,
        allExportedPlacementsHaveNoClipActions: true,
        incomingPlacements,
        outgoingPlacements,
      },
      declaredFrameDomainAudit: {
        sourceTimelineDomainCount: inspection.declaredFrameDomains.length,
        frameDomainIds: inspection.declaredFrameDomains.map(({id}) => id),
        notDeclared: true,
      },
      preservedObligations: {
        button: singleFrameObligation("pending-source-button-definition-and-runtime-event-validation"),
        interaction: singleFrameObligation("pending-natural-runtime-interaction-branch-validation"),
        behavior: singleFrameObligation("pending-natural-runtime-behavior-and-terminal-validation"),
        fullFrame: singleFrameObligation("structural-content-remains-in-containing-domain-full-frame-capture-and-rmse-scope"),
        audio: singleFrameObligation("pending-source-audio-and-runtime-synchronization-validation"),
      },
    };
  });
  return {
    contract: {
      proofType: spec.proofType,
      expectedTimelineCount: spec.expectedTimelineCount,
      expectedTimelineIds: exactTimelineIds,
      verifiedTimelineCount: claims.length,
      verifiedTimelineIds: claims.map(({timelineId}) => timelineId),
      exactMatch: true,
    },
    claims,
  };
}

function serializedDisplayEventPlacement(structure, placement, {
  effectiveObjectId,
  previousObjectId = null,
  operation,
} = {}) {
  assert(effectiveObjectId, `placement at frame ${placement.frame}/depth ${placement.depth} has no effective object identity`);
  return {
    kind: operation,
    frame: placement.frame,
    depth: placement.depth,
    tag: placement.tag,
    declaredSourceObjectId: placement.objectId === null ? null : String(placement.objectId),
    effectiveSourceObjectId: String(effectiveObjectId),
    previousSourceObjectId: previousObjectId === null ? null : String(previousObjectId),
    placedTimelineId: structure.timelines.has(`sprite-${effectiveObjectId}`) ? `sprite-${effectiveObjectId}` : null,
    instanceName: placement.name,
    replace: placement.replace,
    hasClipActions: placement.hasClipActions,
    matrix: placement.matrix,
  };
}

function resolvedTimelineDisplayGraph(structure, timeline, label) {
  const displayList = new Map();
  const events = [];
  let unresolvedObjectCount = 0;
  let clipActionCount = 0;
  for (const event of timeline.events || []) {
    if (event.kind === "removal") {
      const previousObjectId = displayList.get(event.removal.depth) || null;
      if (!previousObjectId) unresolvedObjectCount += 1;
      events.push({
        kind: "remove",
        frame: event.removal.frame,
        depth: event.removal.depth,
        tag: event.removal.tag,
        removedSourceObjectId: previousObjectId,
      });
      displayList.delete(event.removal.depth);
      continue;
    }
    const {placement} = event;
    const previousObjectId = displayList.get(placement.depth) || null;
    const effectiveObjectId = placement.objectId || previousObjectId;
    if (!effectiveObjectId) unresolvedObjectCount += 1;
    if (placement.hasClipActions) clipActionCount += 1;
    const operation = placement.objectId
      ? (previousObjectId ? "replace" : "place")
      : "update";
    if (effectiveObjectId) {
      events.push(serializedDisplayEventPlacement(structure, placement, {
        effectiveObjectId,
        previousObjectId,
        operation,
      }));
    }
    if (placement.objectId) displayList.set(placement.depth, placement.objectId);
  }
  assert(unresolvedObjectCount === 0, `${label}: internal display graph contains unresolved object identity`);
  return {
    eventCount: events.length,
    placementEventCount: events.filter(({kind}) => kind !== "remove").length,
    removalEventCount: events.filter(({kind}) => kind === "remove").length,
    unresolvedObjectCount,
    clipActionCount,
    allEventsHaveNoClipActions: clipActionCount === 0,
    events,
  };
}

function displayListLifetimes(structure) {
  const incomingByObjectId = new Map();
  for (const parent of structure.timelines.values()) {
    const activeByDepth = new Map();
    const lastBoundaryByDepth = new Map();
    const retain = (active) => {
      if (!incomingByObjectId.has(active.sourceObjectId)) incomingByObjectId.set(active.sourceObjectId, []);
      incomingByObjectId.get(active.sourceObjectId).push(active);
    };
    const close = (depth, termination) => {
      const active = activeByDepth.get(depth);
      if (!active) {
        lastBoundaryByDepth.set(depth, termination);
        return;
      }
      active.endFrame = termination.kind === "parent-timeline-terminal"
        ? termination.frame
        : termination.frame - 1;
      active.termination = termination;
      retain(active);
      activeByDepth.delete(depth);
      lastBoundaryByDepth.set(depth, termination);
    };
    for (const event of parent.events || []) {
      if (event.kind === "removal") {
        close(event.removal.depth, {
          kind: "removal",
          frame: event.removal.frame,
          depth: event.removal.depth,
          tag: event.removal.tag,
        });
        continue;
      }
      const {placement} = event;
      const active = activeByDepth.get(placement.depth) || null;
      if (placement.objectId) {
        const depthWasEmptyBeforePlacement = active === null;
        if (active) {
          close(placement.depth, {
            kind: "replacement",
            frame: placement.frame,
            depth: placement.depth,
            tag: placement.tag,
            replacementSourceObjectId: String(placement.objectId),
          });
        }
        activeByDepth.set(placement.depth, {
          parentTimelineId: parent.timelineId,
          parentFrameCount: parent.declaredFrames,
          sourceObjectId: String(placement.objectId),
          startFrame: placement.frame,
          depth: placement.depth,
          depthWasEmptyBeforePlacement,
          predecessorBoundary: lastBoundaryByDepth.get(placement.depth) || null,
          placement,
          updates: [],
        });
      } else if (active) {
        active.updates.push(placement);
      }
    }
    for (const [depth] of activeByDepth) {
      close(depth, {
        kind: "parent-timeline-terminal",
        frame: parent.declaredFrames,
        depth,
        tag: "End",
      });
    }
  }
  for (const lifetimes of incomingByObjectId.values()) {
    lifetimes.sort((left, right) => (
      compareTimelineIds(left.parentTimelineId, right.parentTimelineId)
      || left.startFrame - right.startFrame
      || Number(left.depth) - Number(right.depth)
    ));
  }
  return incomingByObjectId;
}

function playheadSegments(startFrame, endFrame, frameCount) {
  const segments = [];
  let parentStartFrame = startFrame;
  while (parentStartFrame <= endFrame) {
    const localStartFrame = ((parentStartFrame - startFrame) % frameCount) + 1;
    const available = frameCount - localStartFrame + 1;
    const parentEndFrame = Math.min(endFrame, parentStartFrame + available - 1);
    segments.push({
      kind: segments.length === 0 ? "entry" : "scriptless-wrap",
      parentStartFrame,
      parentEndFrame,
      localStartFrame,
      localEndFrame: localStartFrame + (parentEndFrame - parentStartFrame),
    });
    parentStartFrame = parentEndFrame + 1;
  }
  return segments;
}

function scriptLineReferences(scripts, pattern) {
  const references = [];
  for (const block of scripts.blocks) {
    const lines = block.body.split("\n");
    for (let index = 0; index < lines.length; index += 1) {
      pattern.lastIndex = 0;
      if (!pattern.test(lines[index])) continue;
      references.push({
        script: block.script,
        line: block.lineStart + index,
        sourceLine: lines[index].trim(),
      });
    }
  }
  return references;
}

function playheadControlAudit(scripts, targetInstanceNames) {
  const dynamicAddressingPattern = /\b(?:eval|getInstanceAtDepth|attachMovie|duplicateMovieClip|createEmptyMovieClip|removeMovieClip|setProperty|getProperty|targetPath)\s*\(|(?:this|_root|_parent|_global|_level\d+)\s*\[/g;
  const dynamicAddressingReferences = scriptLineReferences(scripts, dynamicAddressingPattern);
  const controls = [];
  const callPattern = /(?:(?<receiver>[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*\.)?(?<method>gotoAndPlay|gotoAndStop|nextFrame|prevFrame|play|stop)\s*\(/g;
  for (const block of scripts.blocks) {
    const lines = block.body.split("\n");
    for (let index = 0; index < lines.length; index += 1) {
      for (const match of lines[index].matchAll(callPattern)) {
        const receiver = match.groups.receiver || null;
        const receiverParts = receiver?.split(".") || [];
        controls.push({
          script: block.script,
          line: block.lineStart + index,
          sourceLine: lines[index].trim(),
          receiver,
          method: match.groups.method,
          targetCandidate: receiverParts.some((part) => targetInstanceNames.includes(part)),
        });
      }
    }
  }
  const targetControls = controls.filter(({targetCandidate}) => targetCandidate);
  return {
    targetInstanceNames,
    dynamicAddressingReferenceCount: dynamicAddressingReferences.length,
    dynamicAddressingReferences,
    playheadControlReferenceCount: controls.length,
    playheadControlReferences: controls,
    externalTargetControlCount: targetControls.length,
    externalTargetControls: targetControls,
  };
}

export function deriveMultiFrameScriptlessCandidateAudit({animationId, structure, scripts, inventory, manifest}) {
  const declaredDomains = manifest.implementation?.frameDomains || [];
  const inventoryByTimeline = new Map((inventory.timelineInventory || []).map((item) => [item.timelineId, item]));
  const lifetimesByObjectId = displayListLifetimes(structure);
  const root = structure.timelines.get("root");
  assert(root, `${animationId}: root timeline is missing`);
  const globalDoInitActionSpriteObjectIds = structure.initActions.map(({spriteObjectId}) => String(spriteObjectId));
  const globalInitSetIsExact = globalDoInitActionSpriteObjectIds.every((value) => /^\d+$/.test(value))
    && new Set(globalDoInitActionSpriteObjectIds).size === globalDoInitActionSpriteObjectIds.length;
  const globalControlAudit = playheadControlAudit(scripts, []);
  const undeclaredTimelineIds = undeclaredReachableMultiFrameTimelineIds(inventory, manifest);
  const inspections = [];

  for (const timelineId of undeclaredTimelineIds) {
    const inventoryTimeline = inventoryByTimeline.get(timelineId);
    const sourceObjectId = String(inventoryTimeline?.objectId ?? "");
    const timeline = structure.timelines.get(timelineId);
    const lifetimes = lifetimesByObjectId.get(sourceObjectId) || [];
    const disqualifiers = [];
    if (!timeline || timelineId !== `sprite-${sourceObjectId}`) disqualifiers.push("timeline-object-identity-mismatch");
    if (!inventoryTimeline || inventoryTimeline.structuralReachability !== "reachable-from-root-placement-graph") disqualifiers.push("not-root-reachable");
    if (!timeline || inventoryTimeline?.frameCount !== timeline.declaredFrames || timeline.declaredFrames <= 1) disqualifiers.push("frame-count-mismatch-or-not-multi-frame");
    if (timeline && timeline.observedShowFrames !== timeline.declaredFrames) disqualifiers.push("observed-show-frame-count-mismatch");
    if ((timeline?.tagCounts.DoAction || 0) !== 0) disqualifiers.push("swfmill-do-action-present");
    if ((timeline?.tagCounts.DoInitAction || 0) !== 0) disqualifiers.push("swfmill-do-init-action-present");
    if ((timeline?.tagCounts.End || 0) !== 1) disqualifiers.push("end-tag-count-is-not-one");
    const attributedDoInitActions = structure.initActions.filter(({spriteObjectId}) => String(spriteObjectId) === sourceObjectId);
    if (attributedDoInitActions.length) disqualifiers.push("attributed-do-init-action-present");
    const ffdecFrameScripts = scripts.blocks.filter((block) => block.scope.kind === "sprite" && block.scope.objectId === sourceObjectId);
    if (ffdecFrameScripts.length) disqualifiers.push("ffdec-frame-script-present");
    if (declaredDomains.some((domain) => domain.sourceTimelineId === timelineId)) disqualifiers.push("already-declared-frame-domain");
    if (!lifetimes.length) disqualifiers.push("no-resolved-incoming-lifetime");
    const parentTimelineIds = [...new Set(lifetimes.map(({parentTimelineId}) => parentTimelineId))].sort(compareTimelineIds);
    if (parentTimelineIds.length !== 1) disqualifiers.push("incoming-lifetimes-have-multiple-or-missing-parents");
    const parentTimelineId = parentTimelineIds.length === 1 ? parentTimelineIds[0] : null;
    const parent = parentTimelineId ? structure.timelines.get(parentTimelineId) : null;
    const parentDomains = parentTimelineId ? declaredDomains.filter((domain) => domain.sourceTimelineId === parentTimelineId) : [];
    if (!parent || parentDomains.length !== 1 || parentDomains[0].id !== parentTimelineId || parentDomains[0].frameCount !== parent?.declaredFrames) {
      disqualifiers.push("parent-is-not-an-exact-declared-frame-domain");
    }
    const namedIncomingInstances = [...new Set(lifetimes.map(({placement}) => placement.name).filter(Boolean))].sort(compareText);
    if (namedIncomingInstances.length) disqualifiers.push("named-incoming-instance-requires-target-control-proof");
    if (!globalInitSetIsExact) disqualifiers.push("global-do-init-action-set-is-not-unique-and-numeric");
    if (globalControlAudit.dynamicAddressingReferenceCount) disqualifiers.push("dynamic-movieclip-addressing-present");

    let rootPlacement = null;
    if (parentTimelineId && parentTimelineId !== "root") {
      const parentObjectId = String(parent?.objectId ?? "");
      const rootPlacements = root.placements.filter(({objectId}) => String(objectId ?? "") === parentObjectId);
      if (rootPlacements.length !== 1) {
        disqualifiers.push(INDIRECT_DECLARED_PARENT_DISQUALIFIER);
      } else {
        [rootPlacement] = rootPlacements;
        if (rootPlacement.hasClipActions) disqualifiers.push("root-to-parent-placement-has-clip-actions");
        if (root.placements.some((item) => item !== rootPlacement && item.depth === rootPlacement.depth && item.eventIndex > rootPlacement.eventIndex)) {
          disqualifiers.push("root-to-parent-depth-has-later-placement-update");
        }
        if (root.removals.some((item) => item.depth === rootPlacement.depth && item.eventIndex > rootPlacement.eventIndex)) {
          disqualifiers.push("root-to-parent-depth-has-removal");
        }
      }
    }

    let internalDisplayGraph = null;
    if (timeline) {
      try {
        internalDisplayGraph = resolvedTimelineDisplayGraph(structure, timeline, `${animationId}/${timelineId}`);
        if (internalDisplayGraph.eventCount === 0) disqualifiers.push("empty-internal-display-graph");
        if (internalDisplayGraph.clipActionCount !== 0) disqualifiers.push("internal-display-clip-actions-present");
      } catch (error) {
        disqualifiers.push(`internal-display-graph-unresolved:${error.message}`);
      }
    }

    const serializedPlacements = [];
    for (const lifetime of lifetimes) {
      const lifetimeProblems = [];
      if (lifetime.parentTimelineId !== parentTimelineId) lifetimeProblems.push("parent-mismatch");
      if (lifetime.parentFrameCount !== parent?.declaredFrames) lifetimeProblems.push("parent-frame-count-mismatch");
      if (lifetime.depthWasEmptyBeforePlacement !== true) lifetimeProblems.push("placement-replaces-live-depth");
      if (String(lifetime.placement.objectId ?? "") !== sourceObjectId) lifetimeProblems.push("placement-lacks-explicit-source-object");
      if (lifetime.placement.replace !== "0") lifetimeProblems.push("placement-is-not-fresh");
      if (lifetime.placement.hasClipActions) lifetimeProblems.push("placement-has-clip-actions");
      if (![
        "removal",
        "parent-timeline-terminal",
      ].includes(lifetime.termination?.kind)) lifetimeProblems.push("unsupported-termination-kind");
      if (lifetime.termination?.kind === "removal" && (lifetime.termination.tag !== "RemoveObject2" || lifetime.endFrame !== lifetime.termination.frame - 1)) {
        lifetimeProblems.push("inexact-removal-boundary");
      }
      if (lifetime.termination?.kind === "parent-timeline-terminal" && (
        lifetime.termination.tag !== "End"
        || lifetime.termination.frame !== parent?.declaredFrames
        || lifetime.endFrame !== parent?.declaredFrames
      )) lifetimeProblems.push("inexact-parent-terminal-boundary");
      if (lifetime.updates.some((update) => update.objectId !== null || update.hasClipActions)) lifetimeProblems.push("resetting-or-clip-action-update");
      const durationFrames = lifetime.endFrame - lifetime.startFrame + 1;
      if (durationFrames <= 0) lifetimeProblems.push("empty-visible-lifetime");
      if (lifetimeProblems.length) {
        disqualifiers.push(`lifetime-${lifetime.startFrame}-${lifetime.depth}:${lifetimeProblems.join("+")}`);
        continue;
      }
      const wrapCount = playheadSegments(lifetime.startFrame, lifetime.endFrame, timeline.declaredFrames).length - 1;
      serializedPlacements.push({
        frame: lifetime.startFrame,
        depth: lifetime.depth,
        termination: {kind: lifetime.termination.kind, frame: lifetime.termination.frame},
        updateFrames: lifetime.updates.map(({frame}) => frame),
        ...(wrapCount === 0 ? {allowZeroWrap: true} : {}),
      });
    }
    if (serializedPlacements.length !== lifetimes.length) disqualifiers.push("not-all-lifetimes-serializable");
    const eligible = disqualifiers.length === 0;
    inspections.push({
      timelineId,
      sourceObjectId,
      frameCount: timeline?.declaredFrames || inventoryTimeline?.frameCount || null,
      parentTimelineId,
      parentSourceObjectId: parentTimelineId === "root" ? null : String(parent?.objectId ?? ""),
      parentFrameDomainId: parentDomains[0]?.id || null,
      parentFrameCount: parent?.declaredFrames || null,
      rootPlacement: rootPlacement ? {
        frame: rootPlacement.frame,
        depth: rootPlacement.depth,
        instanceName: rootPlacement.name,
      } : null,
      expectedTagCensus: timeline ? normalizedTagCensus(timeline.tagCounts) : null,
      placements: serializedPlacements,
      namedIncomingInstances,
      ffdecFrameScriptCount: ffdecFrameScripts.length,
      attributedDoInitActionCount: attributedDoInitActions.length,
      internalDisplayEventCount: internalDisplayGraph?.eventCount || 0,
      eligible,
      disqualifiers: [...new Set(disqualifiers)],
    });
  }

  const eligibleInspections = inspections.filter(({eligible}) => eligible);
  const byParent = new Map();
  for (const inspection of eligibleInspections) {
    if (!byParent.has(inspection.parentTimelineId)) byParent.set(inspection.parentTimelineId, []);
    byParent.get(inspection.parentTimelineId).push(inspection);
  }
  const candidateSpecs = [...byParent.entries()].sort(([left], [right]) => compareTimelineIds(left, right)).map(([parentTimelineId, items]) => {
    items.sort((left, right) => compareTimelineIds(left.timelineId, right.timelineId));
    const first = items[0];
    return {
      proofType: MULTI_FRAME_PARENT_CLOCK_PROOF_TYPE,
      expectedTimelineCount: items.length,
      parentTimelineId,
      parentSourceObjectId: first.parentSourceObjectId,
      parentFrameDomainId: first.parentFrameDomainId,
      parentFrameCount: first.parentFrameCount,
      ...(parentTimelineId === "root" ? {} : {
        rootPlacementFrame: first.rootPlacement.frame,
        rootDepth: first.rootPlacement.depth,
        rootInstanceName: first.rootPlacement.instanceName,
      }),
      expectedGlobalDoInitActionSpriteObjectIds: [...globalDoInitActionSpriteObjectIds],
      timelines: items.map((item) => ({
        timelineId: item.timelineId,
        sourceObjectId: item.sourceObjectId,
        frameCount: item.frameCount,
        expectedTagCensus: item.expectedTagCensus,
        placements: item.placements,
      })),
    };
  });
  return {
    undeclaredTimelineIds,
    eligibleTimelineIds: sortedTimelineIds(eligibleInspections.map(({timelineId}) => timelineId)),
    excludedTimelineIds: sortedTimelineIds(inspections.filter(({eligible}) => !eligible).map(({timelineId}) => timelineId)),
    inspections,
    candidateSpecs,
    globalAudit: {
      globalDoInitActionSpriteObjectIds,
      globalInitSetIsExact,
      dynamicAddressingReferenceCount: globalControlAudit.dynamicAddressingReferenceCount,
      dynamicAddressingReferences: globalControlAudit.dynamicAddressingReferences,
    },
  };
}

/**
 * Converts only an explicitly selected subset of the generic audit's
 * indirect-parent rejections into a separate binding mode under the existing
 * proof role. The generic direct-root audit deliberately remains fail-closed:
 * these timelines never appear in its candidateSpecs because their declared
 * parent does not have one immutable direct-root placement.
 *
 * This narrower contract proves only that the child playhead is a pure
 * function of the exact declared parent's local clock. It does not establish
 * how or when that parent is entered from the root timeline.
 */
export function deriveNestedDeclaredParentScriptlessCandidateSpecs({
  animationId,
  candidateAudit,
  manifest,
  structure,
  selectedTimelineIds,
}) {
  assert(Array.isArray(selectedTimelineIds) && selectedTimelineIds.length > 0,
    `${animationId}: nested declared-parent selection must be a nonempty array`);
  const selected = assertExactTimelineSet(
    selectedTimelineIds,
    [...new Set(selectedTimelineIds)],
    `${animationId}: nested declared-parent selected timeline set`,
  );
  const inspectionByTimeline = new Map(
    (candidateAudit?.inspections || []).map((inspection) => [inspection.timelineId, inspection]),
  );
  assert(inspectionByTimeline.size === (candidateAudit?.inspections || []).length,
    `${animationId}: generic multi-frame inspection IDs are duplicated`);
  const declaredDomains = manifest.implementation?.frameDomains || [];
  const selectedInspections = selected.map((timelineId) => {
    const inspection = inspectionByTimeline.get(timelineId);
    assert(inspection, `${animationId}/${timelineId}: selected generic inspection is missing`);
    assert(
      inspection.eligible === false
      && JSON.stringify(inspection.disqualifiers)
        === JSON.stringify([INDIRECT_DECLARED_PARENT_DISQUALIFIER]),
      `${animationId}/${timelineId}: nested proof requires exactly the indirect declared-parent disqualifier`,
    );
    assert(
      inspection.parentTimelineId
      && inspection.parentTimelineId !== "root"
      && inspection.parentTimelineId === inspection.parentFrameDomainId
      && inspection.parentSourceObjectId
      && inspection.parentTimelineId === `sprite-${inspection.parentSourceObjectId}`
      && Number.isInteger(inspection.parentFrameCount)
      && inspection.parentFrameCount > 0,
      `${animationId}/${timelineId}: nested proof parent identity is incomplete`,
    );
    assert(
      inspection.rootPlacement === null
      && inspection.namedIncomingInstances.length === 0
      && inspection.ffdecFrameScriptCount === 0
      && inspection.attributedDoInitActionCount === 0
      && inspection.internalDisplayEventCount > 0
      && Array.isArray(inspection.placements)
      && inspection.placements.length > 0,
      `${animationId}/${timelineId}: nested proof static inspection is incomplete`,
    );
    const parentDomains = declaredDomains.filter(
      ({sourceTimelineId}) => sourceTimelineId === inspection.parentTimelineId,
    );
    assert(parentDomains.length === 1,
      `${animationId}/${timelineId}: nested proof parent declaration is not unique`);
    const [parentDomain] = parentDomains;
    assert(
      parentDomain.id === inspection.parentFrameDomainId
      && parentDomain.kind === "nested"
      && parentDomain.frameCount === inspection.parentFrameCount
      && typeof parentDomain.parentFrameDomainId === "string"
      && parentDomain.parentFrameDomainId.length > 0
      && Array.isArray(parentDomain.sourceParentTimelineIds)
      && parentDomain.sourceParentTimelineIds.length > 0
      && new Set(parentDomain.sourceParentTimelineIds).size
        === parentDomain.sourceParentTimelineIds.length
      && parentDomain.sourceParentTimelineIds.every((value) => (
        value === "root" || /^sprite-\d+$/.test(value)
      ))
      && typeof parentDomain.captureParentResolution === "string"
      && parentDomain.captureParentResolution.includes("parentEntryState remains unresolved")
      && parentDomain.sourceProof?.authoritativeRuntimeEntryEstablished === false
      && parentDomain.sourceProof?.strictAcceptanceEffect === "none",
      `${animationId}/${timelineId}: nested proof parent declaration boundary drifted`,
    );
    return {inspection, parentDomain};
  });

  const byParent = new Map();
  for (const item of selectedInspections) {
    const key = item.inspection.parentTimelineId;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(item);
  }
  return [...byParent.entries()]
    .sort(([left], [right]) => compareTimelineIds(left, right))
    .map(([parentTimelineId, items]) => {
      items.sort((left, right) => compareTimelineIds(
        left.inspection.timelineId,
        right.inspection.timelineId,
      ));
      const [{inspection: first, parentDomain}] = items;
      assert(items.every(({inspection, parentDomain: domain}) => (
        inspection.parentSourceObjectId === first.parentSourceObjectId
        && inspection.parentFrameDomainId === first.parentFrameDomainId
        && inspection.parentFrameCount === first.parentFrameCount
        && JSON.stringify(domain.sourceParentTimelineIds)
          === JSON.stringify(parentDomain.sourceParentTimelineIds)
        && domain.parentFrameDomainId === parentDomain.parentFrameDomainId
        && domain.captureParentResolution === parentDomain.captureParentResolution
      )), `${animationId}/${parentTimelineId}: nested proof parent contract differs across children`);
      const parentRootPath = exactFreshNamedRootPath(
        structure,
        parentTimelineId,
        `${animationId}/${parentTimelineId}: nested declared-parent root path`,
      );
      assert(
        JSON.stringify(parentDomain.sourceParentTimelineIds)
          === JSON.stringify([parentRootPath.at(-1).parentTimelineId]),
        `${animationId}/${parentTimelineId}: declared source-parent set differs from the exact root path`,
      );
      return {
        proofType: MULTI_FRAME_PARENT_CLOCK_PROOF_TYPE,
        parentBindingMode: NESTED_DECLARED_PARENT_BINDING_MODE,
        parentEntryStateEstablished: false,
        parentRootPath,
        expectedTimelineCount: items.length,
        parentTimelineId,
        parentSourceObjectId: first.parentSourceObjectId,
        parentFrameDomainId: first.parentFrameDomainId,
        parentFrameCount: first.parentFrameCount,
        expectedGlobalDoInitActionSpriteObjectIds: [
          ...(candidateAudit.globalAudit?.globalDoInitActionSpriteObjectIds || []),
        ],
        timelines: items.map(({inspection}) => ({
          timelineId: inspection.timelineId,
          sourceObjectId: inspection.sourceObjectId,
          frameCount: inspection.frameCount,
          expectedTagCensus: inspection.expectedTagCensus,
          placements: inspection.placements,
        })),
      };
    });
}

function exactFreshNamedRootPath(structure, targetTimelineId, label) {
  assert(structure?.timelines instanceof Map, `${label}: parsed structure is missing`);
  assert(targetTimelineId !== "root", `${label}: target must be a nested timeline`);
  const reversePath = [];
  const visited = new Set();
  let childTimelineId = targetTimelineId;
  while (childTimelineId !== "root") {
    assert(!visited.has(childTimelineId), `${label}: placement graph contains a cycle`);
    visited.add(childTimelineId);
    const child = structure.timelines.get(childTimelineId);
    assert(child?.objectId, `${label}: ${childTimelineId} is missing its source object identity`);
    const incoming = [];
    for (const parent of structure.timelines.values()) {
      for (const placement of parent.placements || []) {
        if (String(placement.objectId ?? "") === String(child.objectId)) {
          incoming.push({parent, placement});
        }
      }
    }
    assert(
      incoming.length === 1,
      `${label}: ${childTimelineId} must have exactly one explicit incoming placement, found ${incoming.length}`,
    );
    const [{parent, placement}] = incoming;
    assert(
      placement.tag === "PlaceObject2"
      && placement.replace === "0"
      && placement.name.length > 0
      && placement.hasClipActions === false,
      `${label}: ${parent.timelineId} -> ${childTimelineId} must be one fresh named PlaceObject2 without clipActions`,
    );
    reversePath.push({
      parentTimelineId: parent.timelineId,
      childTimelineId,
      sourceObjectId: String(child.objectId),
      frame: placement.frame,
      depth: placement.depth,
      instanceName: placement.name,
      tag: placement.tag,
      replace: placement.replace,
      hasClipActions: false,
    });
    childTimelineId = parent.timelineId;
  }
  const rootPath = reversePath.reverse();
  assert(rootPath.length >= 2, `${label}: indirect proof requires at least two root-path edges`);
  return rootPath;
}

function multiFrameObligation(status) {
  return {required: true, satisfiedByDisposition: false, status};
}

function pinnedPlacementTermination(animationId, timelineSpec, expected, placementIndex, parentFrameCount) {
  const label = `${animationId}/${timelineSpec.timelineId}: placement ${placementIndex + 1}`;
  const hasStructuredTermination = expected.termination !== undefined;
  const hasLegacyRemovalFrame = expected.removalFrame !== undefined;
  assert(hasStructuredTermination !== hasLegacyRemovalFrame, `${label} must pin exactly one termination contract`);
  assert(
    expected.allowZeroWrap === undefined || expected.allowZeroWrap === true,
    `${label} allowZeroWrap must be omitted or explicitly true`,
  );
  if (hasLegacyRemovalFrame) {
    assert(Number.isInteger(expected.removalFrame), `${label} removal frame must be an integer`);
    return {kind: "removal", frame: expected.removalFrame};
  }
  assert(
    expected.termination
    && typeof expected.termination === "object"
    && !Array.isArray(expected.termination),
    `${label} termination contract must be an object`,
  );
  assert(
    JSON.stringify(Object.keys(expected.termination).sort()) === JSON.stringify(["frame", "kind"]),
    `${label} termination contract must pin only kind and frame`,
  );
  assert(
    ["removal", "parent-timeline-terminal"].includes(expected.termination.kind),
    `${label} uses an unsupported termination kind`,
  );
  assert(Number.isInteger(expected.termination.frame), `${label} termination frame must be an integer`);
  if (expected.termination.kind === "parent-timeline-terminal") {
    assert(
      expected.termination.frame === parentFrameCount,
      `${label} parent-terminal contract must equal the exact parent terminal frame`,
    );
  }
  return expected.termination;
}

function validateMultiFrameSpec(animationId, spec) {
  assert(spec.proofType === MULTI_FRAME_PARENT_CLOCK_PROOF_TYPE,
    `${animationId}: unsupported multi-frame proof type`);
  assert(Number.isInteger(spec.expectedTimelineCount) && spec.expectedTimelineCount > 0, `${animationId}: invalid pinned multi-frame timeline count`);
  assert(Array.isArray(spec.timelines) && spec.timelines.length === spec.expectedTimelineCount, `${animationId}: pinned multi-frame timeline count differs from its ID set`);
  const parentIsRoot = spec.parentTimelineId === "root";
  const nestedDeclaredParent =
    spec.parentBindingMode === NESTED_DECLARED_PARENT_BINDING_MODE;
  assert(!nestedDeclaredParent || !parentIsRoot,
    `${animationId}: nested declared-parent proof cannot use root as its parent`);
  if (parentIsRoot) {
    assert(spec.parentSourceObjectId === null, `${animationId}: root parent must use a null source object ID`);
  } else {
    assert(spec.parentTimelineId === `sprite-${spec.parentSourceObjectId}`, `${animationId}: pinned multi-frame parent timeline/object identity differs`);
  }
  assert(spec.parentFrameDomainId === spec.parentTimelineId, `${animationId}: pinned multi-frame parent must use its declared source timeline as frame domain`);
  if (nestedDeclaredParent) {
    assert(
      spec.parentEntryStateEstablished === false,
      `${animationId}: nested declared-parent proof must preserve unresolved parent entry state`,
    );
    assert(
      Array.isArray(spec.parentRootPath)
      && spec.parentRootPath.length >= 2
      && spec.parentRootPath[0].parentTimelineId === "root"
      && spec.parentRootPath.at(-1).childTimelineId === spec.parentTimelineId,
      `${animationId}: nested declared-parent proof must pin a complete indirect root path`,
    );
    for (const [index, edge] of spec.parentRootPath.entries()) {
      assert(
        edge
        && JSON.stringify(Object.keys(edge).sort()) === JSON.stringify([
          "childTimelineId",
          "depth",
          "frame",
          "hasClipActions",
          "instanceName",
          "parentTimelineId",
          "replace",
          "sourceObjectId",
          "tag",
        ])
        && edge.childTimelineId === `sprite-${edge.sourceObjectId}`
        && Number.isInteger(edge.frame)
        && edge.frame > 0
        && /^\d+$/.test(edge.depth)
        && edge.instanceName.length > 0
        && edge.tag === "PlaceObject2"
        && edge.replace === "0"
        && edge.hasClipActions === false
        && (index === 0
          || edge.parentTimelineId === spec.parentRootPath[index - 1].childTimelineId),
        `${animationId}: nested declared-parent root path edge ${index + 1} is invalid`,
      );
    }
    for (const key of ["rootPlacementFrame", "rootDepth", "rootInstanceName"]) {
      assert(spec[key] === undefined,
        `${animationId}: nested declared-parent proof cannot pin ${key}`);
    }
  } else {
    assert(
      spec.parentBindingMode === undefined
      && spec.parentEntryStateEstablished === undefined
      && spec.parentRootPath === undefined,
      `${animationId}: direct-root parent-clock proof cannot carry nested parent binding fields`,
    );
  }
  const expectedGlobalDoInitActionSpriteObjectIds = spec.expectedGlobalDoInitActionSpriteObjectIds || [];
  assert(Array.isArray(expectedGlobalDoInitActionSpriteObjectIds), `${animationId}: expected global DoInitAction sprite IDs must be an array`);
  assert(
    expectedGlobalDoInitActionSpriteObjectIds.every((value) => /^\d+$/.test(value)),
    `${animationId}: expected global DoInitAction sprite IDs must be numeric strings`,
  );
  assert(
    new Set(expectedGlobalDoInitActionSpriteObjectIds).size === expectedGlobalDoInitActionSpriteObjectIds.length,
    `${animationId}: expected global DoInitAction sprite IDs are duplicated`,
  );
}

function undeclaredReachableMultiFrameTimelineIds(inventory, manifest) {
  const declaredDomains = manifest.implementation?.frameDomains || [];
  return sortedTimelineIds((inventory.timelineInventory || [])
    .filter((item) => (
      item.timelineId !== "root"
      && item.frameCount > 1
      && item.structuralReachability === "reachable-from-root-placement-graph"
      && !declaredDomains.some((domain) => domain.sourceTimelineId === item.timelineId)
    ))
    .map(({timelineId}) => timelineId));
}

function deriveMultiFrameScriptlessClaims({animationId, spec, structure, scripts, inventory, manifest}) {
  validateMultiFrameSpec(animationId, spec);
  const parentIsRoot = spec.parentTimelineId === "root";
  const nestedDeclaredParent =
    spec.parentBindingMode === NESTED_DECLARED_PARENT_BINDING_MODE;
  const targetIds = assertExactTimelineSet(
    spec.timelines.map(({timelineId}) => timelineId),
    spec.timelines.map(({sourceObjectId}) => `sprite-${sourceObjectId}`),
    `${animationId}: pinned multi-frame timeline/object identities`,
  );
  const declaredDomains = manifest.implementation?.frameDomains || [];

  const parentInventory = (inventory.timelineInventory || []).find(({timelineId}) => timelineId === spec.parentTimelineId);
  assert(parentInventory, `${animationId}: multi-frame parent is missing from the scenario inventory`);
  if (parentIsRoot) {
    assert(parentInventory.objectId === null, `${animationId}: root parent scenario object ID must be null`);
  } else {
    assert(String(parentInventory.objectId) === spec.parentSourceObjectId, `${animationId}: multi-frame parent scenario object ID drifted`);
  }
  assert(parentInventory.frameCount === spec.parentFrameCount, `${animationId}: multi-frame parent scenario frame count drifted`);
  const parent = requireTimeline(structure, spec.parentTimelineId, spec.parentSourceObjectId, spec.parentFrameCount, `${animationId}: multi-frame parent`);
  const parentDomains = declaredDomains.filter(({sourceTimelineId}) => sourceTimelineId === spec.parentTimelineId);
  assert(parentDomains.length === 1, `${animationId}: multi-frame parent must have exactly one declared frame domain`);
  const [parentDomain] = parentDomains;
  assert(parentDomain.id === spec.parentFrameDomainId && parentDomain.frameCount === spec.parentFrameCount, `${animationId}: multi-frame parent declared domain identity/frame count drifted`);
  if (nestedDeclaredParent) {
    const observedParentRootPath = exactFreshNamedRootPath(
      structure,
      spec.parentTimelineId,
      `${animationId}/${spec.parentTimelineId}: nested declared-parent root path`,
    );
    assert(
      parentDomain.kind === "nested"
      && JSON.stringify(parentDomain.sourceParentTimelineIds)
        === JSON.stringify([observedParentRootPath.at(-1).parentTimelineId])
      && typeof parentDomain.captureParentResolution === "string"
      && parentDomain.captureParentResolution.includes("parentEntryState remains unresolved")
      && parentDomain.sourceProof?.authoritativeRuntimeEntryEstablished
        === false
      && parentDomain.sourceProof?.strictAcceptanceEffect
        === "none"
      && JSON.stringify(observedParentRootPath) === JSON.stringify(spec.parentRootPath),
      `${animationId}: nested declared-parent manifest boundary drifted`,
    );
  }
  const root = structure.timelines.get("root");
  assert(root, `${animationId}: root timeline is missing`);
  const rootPlacement = parentIsRoot || nestedDeclaredParent
    ? null
    : exactPlacement(root, (item) => (
      item.objectId === spec.parentSourceObjectId
      && item.frame === spec.rootPlacementFrame
      && item.depth === spec.rootDepth
      && item.name === spec.rootInstanceName
    ), `${animationId}: root-to-multi-frame-parent`);
  if (rootPlacement) {
    assert(!rootPlacement.hasClipActions, `${animationId}: root-to-multi-frame-parent placement has clipActions`);
    noDepthUpdates(root, rootPlacement, null, `${animationId}: root-to-multi-frame-parent`);
  }

  const globalDoInitActionCount = structure.initActions.length;
  const globalDoInitActionSpriteObjectIds = structure.initActions.map(({spriteObjectId}) => String(spriteObjectId));
  assert(
    globalDoInitActionSpriteObjectIds.every((value) => /^\d+$/.test(value)),
    `${animationId}: global DoInitAction contains a missing or nonnumeric sprite object ID`,
  );
  const exactGlobalDoInitActionSpriteObjectIds = assertExactTimelineSet(
    globalDoInitActionSpriteObjectIds,
    spec.expectedGlobalDoInitActionSpriteObjectIds || [],
    `${animationId}: global DoInitAction sprite object ID set`,
  );
  const lifetimesByObjectId = displayListLifetimes(structure);
  const allTargetLifetimes = spec.timelines.flatMap(({sourceObjectId}) => lifetimesByObjectId.get(sourceObjectId) || []);
  const targetInstanceNames = [...new Set(allTargetLifetimes.map(({placement}) => placement.name).filter(Boolean))].sort(compareText);
  assert(targetInstanceNames.length === 0, `${animationId}: multi-frame candidates have named incoming instances and require a separate ActionScript target proof`);
  const externalControlAudit = playheadControlAudit(scripts, targetInstanceNames);
  assert(externalControlAudit.dynamicAddressingReferenceCount === 0, `${animationId}: dynamic MovieClip addressing prevents an external-playhead-control absence proof`);
  assert(externalControlAudit.externalTargetControlCount === 0, `${animationId}: external target playhead control exists`);

  const claims = spec.timelines.map((timelineSpec) => {
    const label = `${animationId}/${timelineSpec.timelineId}`;
    assert(timelineSpec.frameCount > 1, `${label}: multi-frame proof requires more than one local frame`);
    const inventoryMatches = (inventory.timelineInventory || []).filter(({timelineId}) => timelineId === timelineSpec.timelineId);
    assert(inventoryMatches.length === 1, `${label}: scenario inventory must contain the timeline exactly once`);
    const [inventoryTimeline] = inventoryMatches;
    assert(String(inventoryTimeline.objectId) === timelineSpec.sourceObjectId, `${label}: scenario inventory object ID mismatch`);
    assert(inventoryTimeline.frameCount === timelineSpec.frameCount, `${label}: scenario inventory frame count mismatch`);
    assert(inventoryTimeline.structuralReachability === "reachable-from-root-placement-graph", `${label}: source timeline is not root-reachable`);
    assert(!declaredDomains.some(({sourceTimelineId}) => sourceTimelineId === timelineSpec.timelineId), `${label}: child is already a declared frame domain`);
    const timeline = requireTimeline(structure, timelineSpec.timelineId, timelineSpec.sourceObjectId, timelineSpec.frameCount, label);
    const observedTagCensus = normalizedTagCensus(timeline.tagCounts);
    const expectedTagCensus = normalizedTagCensus(timelineSpec.expectedTagCensus);
    assert(JSON.stringify(observedTagCensus) === JSON.stringify(expectedTagCensus), `${label}: exact tag census drifted`);
    assert((timeline.tagCounts.DoAction || 0) === 0, `${label}: DoAction prevents a scriptless playhead proof`);
    assert((timeline.tagCounts.DoInitAction || 0) === 0, `${label}: DoInitAction prevents a scriptless playhead proof`);
    const attributedDoInitActions = structure.initActions.filter(({spriteObjectId}) => String(spriteObjectId) === timelineSpec.sourceObjectId);
    assert(attributedDoInitActions.length === 0, `${label}: attributed DoInitAction prevents a scriptless playhead proof`);
    const ffdecFrameScripts = scripts.blocks.filter((block) => block.scope.kind === "sprite" && block.scope.objectId === timelineSpec.sourceObjectId);
    assert(ffdecFrameScripts.length === 0, `${label}: FFDec frame script prevents a scriptless playhead proof`);

    const internalDisplayGraph = resolvedTimelineDisplayGraph(structure, timeline, label);
    assert(internalDisplayGraph.eventCount > 0, `${label}: visible composite proof requires a nonempty internal display graph`);
    assert(internalDisplayGraph.clipActionCount === 0, `${label}: internal display graph has clipActions`);
    const lifetimes = lifetimesByObjectId.get(timelineSpec.sourceObjectId) || [];
    assert(lifetimes.length === timelineSpec.placements.length, `${label}: incoming placement/re-placement count drifted`);
    const serializedLifetimes = lifetimes.map((lifetime, index) => {
      const expected = timelineSpec.placements[index];
      const expectedTermination = pinnedPlacementTermination(
        animationId,
        timelineSpec,
        expected,
        index,
        spec.parentFrameCount,
      );
      assert(lifetime.parentTimelineId === spec.parentTimelineId, `${label}: placement ${index + 1} has an unsupported parent timeline`);
      assert(lifetime.parentFrameCount === spec.parentFrameCount, `${label}: placement ${index + 1} parent frame count drifted`);
      assert(lifetime.startFrame === expected.frame && lifetime.depth === expected.depth, `${label}: placement ${index + 1} frame/depth drifted`);
      assert(lifetime.depthWasEmptyBeforePlacement, `${label}: placement ${index + 1} replaces a live depth; reset cannot be proved`);
      assert(lifetime.placement.objectId === timelineSpec.sourceObjectId, `${label}: placement ${index + 1} lacks an explicit source object ID`);
      assert(lifetime.placement.replace === "0", `${label}: placement ${index + 1} is not a fresh PlaceObject2 placement`);
      assert(!lifetime.placement.hasClipActions, `${label}: placement ${index + 1} has clipActions`);
      assert(
        lifetime.termination.kind === expectedTermination.kind
        && lifetime.termination.frame === expectedTermination.frame
        && lifetime.termination.depth === expected.depth,
        `${label}: placement ${index + 1} termination kind/frame/depth drifted`,
      );
      if (expectedTermination.kind === "parent-timeline-terminal") {
        assert(
          lifetime.termination.tag === "End"
          && lifetime.termination.frame === spec.parentFrameCount
          && lifetime.endFrame === spec.parentFrameCount,
          `${label}: placement ${index + 1} parent-terminal boundary is not the exact parent end`,
        );
      } else {
        assert(
          lifetime.termination.tag === "RemoveObject2"
          && lifetime.endFrame === expectedTermination.frame - 1,
          `${label}: placement ${index + 1} removal boundary is not exact`,
        );
      }
      const observedUpdateFrames = lifetime.updates.map(({frame}) => frame);
      assert(JSON.stringify(observedUpdateFrames) === JSON.stringify(expected.updateFrames), `${label}: placement ${index + 1} parent update graph drifted`);
      assert(lifetime.updates.every((update) => update.objectId === null && !update.hasClipActions), `${label}: placement ${index + 1} has a resetting or clipAction update`);
      const durationFrames = lifetime.endFrame - lifetime.startFrame + 1;
      assert(durationFrames > 0, `${label}: placement ${index + 1} has an empty visible lifetime`);
      const segments = playheadSegments(lifetime.startFrame, lifetime.endFrame, timelineSpec.frameCount);
      assert(segments[0].parentStartFrame === lifetime.startFrame && segments.at(-1).parentEndFrame === lifetime.endFrame, `${label}: placement ${index + 1} playhead segments do not exhaust the lifetime`);
      const wrapCount = segments.length - 1;
      if (wrapCount === 0) {
        assert(expected.allowZeroWrap === true, `${label}: placement ${index + 1} zero-wrap lifetime lacks an explicit pinned allowance`);
      } else {
        assert(expected.allowZeroWrap === undefined, `${label}: placement ${index + 1} zero-wrap allowance is overbroad`);
      }
      const updates = lifetime.updates.map((update) => ({
        frame: update.frame,
        depth: update.depth,
        tag: update.tag,
        replace: update.replace,
        declaredSourceObjectId: null,
        preservesInstanceIdentity: true,
        localFrame: ((update.frame - lifetime.startFrame) % timelineSpec.frameCount) + 1,
        hasClipActions: false,
        matrix: update.matrix,
      }));
      return {
        placementOrdinal: index + 1,
        parentTimelineId: lifetime.parentTimelineId,
        parentFrameDomainId: spec.parentFrameDomainId,
        sourceObjectId: timelineSpec.sourceObjectId,
        depth: lifetime.depth,
        startFrame: lifetime.startFrame,
        endFrame: lifetime.endFrame,
        durationFrames,
        depthWasEmptyBeforePlacement: true,
        predecessorBoundary: lifetime.predecessorBoundary,
        placement: {
          frame: lifetime.placement.frame,
          depth: lifetime.placement.depth,
          tag: lifetime.placement.tag,
          declaredSourceObjectId: timelineSpec.sourceObjectId,
          instanceName: lifetime.placement.name,
          replace: lifetime.placement.replace,
          hasClipActions: false,
          matrix: lifetime.placement.matrix,
        },
        updates,
        termination: lifetime.termination,
        ...(expectedTermination.kind === "parent-timeline-terminal" ? {
          terminalAtParentEndPermittedByPinnedSpec: true,
        } : {}),
        localPlayhead: {
          indexing: "one-indexed",
          entryLocalFrame: 1,
          parentFrameToLocalFrameFormula: "((parentFrame - startFrame) % frameCount) + 1",
          frameCount: timelineSpec.frameCount,
          terminalLocalFrame: ((lifetime.endFrame - lifetime.startFrame) % timelineSpec.frameCount) + 1,
          completeVisibleCycleCount: Math.floor(durationFrames / timelineSpec.frameCount),
          wrapCount,
          ...(wrapCount === 0 ? {zeroWrapPermittedByPinnedSpec: true} : {}),
          implicitResetCount: 0,
          explicitFreshPlacementResetCount: 1,
          segments,
        },
      };
    });
    const updateCount = serializedLifetimes.reduce((sum, lifetime) => sum + lifetime.updates.length, 0);
    const explicitRemovalCount = serializedLifetimes.filter(({termination}) => termination.kind === "removal").length;
    const parentTerminalTerminationCount = serializedLifetimes.filter(({termination}) => termination.kind === "parent-timeline-terminal").length;
    const replacementTerminationCount = serializedLifetimes.filter(({termination}) => termination.kind === "replacement").length;
    const zeroWrapLifetimeCount = serializedLifetimes.filter(({localPlayhead}) => localPlayhead.wrapCount === 0).length;
    assert(
      explicitRemovalCount + parentTerminalTerminationCount + replacementTerminationCount === serializedLifetimes.length,
      `${label}: termination census does not exhaust every lifetime`,
    );
    return {
      timelineId: timelineSpec.timelineId,
      sourceObjectId: timelineSpec.sourceObjectId,
      frameCount: timelineSpec.frameCount,
      disposition: "composite-child-with-parent",
      role: spec.proofType,
      claimScope: "local-playhead-fully-derived-from-declared-parent-clock",
      structuralReachability: "reachable-from-root-placement-graph",
      sourceBinding: {
        path: manifest.source.swf,
        sha256: manifest.source.swfSha256,
      },
      parentBinding: {
        parentTimelineId: spec.parentTimelineId,
        parentSourceObjectId: spec.parentSourceObjectId,
        parentFrameDomainId: spec.parentFrameDomainId,
        parentFrameCount: spec.parentFrameCount,
        ...(nestedDeclaredParent ? {
          parentBindingMode: NESTED_DECLARED_PARENT_BINDING_MODE,
          parentEntryStateEstablished: false,
          parentRootPath: spec.parentRootPath.map((edge) => ({...edge})),
        } : {}),
        rootPlacement: rootPlacement ? {
          frame: rootPlacement.frame,
          depth: rootPlacement.depth,
          tag: rootPlacement.tag,
          declaredSourceObjectId: rootPlacement.objectId,
          instanceName: rootPlacement.name,
          replace: rootPlacement.replace,
          hasClipActions: false,
          matrix: rootPlacement.matrix,
        } : null,
      },
      tagCensus: {
        observed: observedTagCensus,
        expected: expectedTagCensus,
        declaredFrameCount: timeline.declaredFrames,
        observedShowFrameCount: timeline.observedShowFrames,
        doActionTagCount: timeline.tagCounts.DoAction || 0,
        doInitActionTagCount: timeline.tagCounts.DoInitAction || 0,
        endTagCount: timeline.tagCounts.End || 0,
        exactMatch: true,
      },
      scriptAudit: {
        ffdecFrameScriptCount: 0,
        ffdecFrameScripts: [],
        attributedDoInitActionCount: 0,
        attributedDoInitActions: [],
        globalDoInitActionCount,
        ...(spec.expectedGlobalDoInitActionSpriteObjectIds ? {
          globalDoInitActionSpriteObjectIds: exactGlobalDoInitActionSpriteObjectIds,
          expectedGlobalDoInitActionSpriteObjectIds: exactGlobalDoInitActionSpriteObjectIds,
          globalDoInitActionSetExactMatch: true,
        } : {}),
        namedIncomingInstanceCount: 0,
        namedIncomingInstances: [],
        dynamicAddressingReferenceCount: externalControlAudit.dynamicAddressingReferenceCount,
        dynamicAddressingReferences: externalControlAudit.dynamicAddressingReferences,
        externalTargetControlCount: externalControlAudit.externalTargetControlCount,
        externalTargetControls: externalControlAudit.externalTargetControls,
        nonTargetPlayheadControlReferenceCount: externalControlAudit.playheadControlReferenceCount,
        nonTargetPlayheadControlReferences: externalControlAudit.playheadControlReferences,
        scriptlessLocalTimeline: true,
      },
      placementLifecycleAudit: {
        incomingPlacementCount: serializedLifetimes.length,
        parentUpdateCount: updateCount,
        explicitRemovalCount,
        ...(parentTerminalTerminationCount > 0 ? {parentTerminalTerminationCount} : {}),
        replacementTerminationCount,
        ...(zeroWrapLifetimeCount > 0 ? {zeroWrapLifetimeCount} : {}),
        clipActionCount: 0,
        allInstancesFreshAtEmptyDepth: true,
        allLifetimesMapped: true,
        lifetimes: serializedLifetimes,
      },
      internalDisplayGraph,
      declaredFrameDomainAudit: {
        sourceTimelineDomainCount: 0,
        frameDomainIds: [],
        notDeclared: true,
        representedByParentFrameDomainId: spec.parentFrameDomainId,
      },
      sourcePlayheadRule: {
        indexing: "one-indexed",
        defaultAdvance: "one-local-frame-per-parent-frame-while-instance-remains-placed",
        terminalBehavior: "scriptless-DefineSprite-wraps-from-terminal-frame-to-local-frame-1",
        placementBehavior: "fresh-explicit-object-placement-at-empty-depth-starts-a-new-instance-at-local-frame-1",
        updateBehavior: "PlaceObject2-without-objectID-preserves-instance-identity-and-local-playhead",
        removalBehavior: "RemoveObject2-ends-the-visible-instance-before-that-parent-frame",
        sourceGraphProvesAllWrapsAndResets: true,
        inferredLoopOrResetCount: 0,
      },
      preservedObligations: {
        visual: multiFrameObligation("all-child-visual-states-remain-in-parent-domain-capture-and-human-review-scope"),
        button: multiFrameObligation("pending-source-button-definition-and-runtime-event-validation"),
        interaction: multiFrameObligation("pending-natural-runtime-interaction-and-parent-control-validation"),
        behavior: multiFrameObligation("pending-authoritative-parent-runtime-behavior-terminal-and-replay-validation"),
        fullFrame: multiFrameObligation("all-parent-frames-containing-child-state-remain-required-in-full-frame-capture"),
        rmse: multiFrameObligation("every-containing-parent-frame-remains-subject-to-rmse-and-formula-label-inspection"),
        audio: multiFrameObligation("pending-source-audio-and-runtime-synchronization-validation"),
      },
    };
  });
  return {
    contract: {
      proofType: spec.proofType,
      expectedTimelineCount: spec.expectedTimelineCount,
      expectedTimelineIds: targetIds,
      verifiedTimelineCount: claims.length,
      verifiedTimelineIds: claims.map(({timelineId}) => timelineId),
      exactMatch: true,
    },
    claims,
  };
}

function exactPlacement(timeline, predicate, label) {
  const matches = timeline.placements.filter(predicate);
  assert(matches.length === 1, `${label}: expected exactly one placement, found ${matches.length}`);
  return matches[0];
}

function noDepthUpdates(timeline, initial, removal, label) {
  const laterPlacements = timeline.placements.filter((item) => item.depth === initial.depth && item !== initial);
  assert(laterPlacements.length === 0, `${label}: placement depth ${initial.depth} has ${laterPlacements.length} update(s)`);
  const removals = timeline.removals.filter((item) => item.depth === initial.depth);
  if (removal === null) assert(removals.length === 0, `${label}: unexpected removal at depth ${initial.depth}`);
  else {
    assert(removals.length === 1, `${label}: expected one removal at depth ${initial.depth}, found ${removals.length}`);
    assert(removals[0].frame === removal, `${label}: removal frame ${removals[0].frame} does not match ${removal}`);
  }
}

function requireTimeline(structure, timelineId, objectId, frameCount, label) {
  const timeline = structure.timelines.get(timelineId);
  assert(timeline, `${label}: timeline ${timelineId} is missing from swfmill`);
  assert(String(timeline.objectId) === String(objectId), `${label}: timeline ${timelineId} object ID differs from ${objectId}`);
  assert(timeline.declaredFrames === frameCount, `${label}: timeline ${timelineId} frame count ${timeline.declaredFrames} differs from ${frameCount}`);
  assert(timeline.observedShowFrames === frameCount, `${label}: timeline ${timelineId} has ${timeline.observedShowFrames} ShowFrame tags, expected ${frameCount}`);
  return timeline;
}

function validateClaimSpec(spec, animationId) {
  assert(spec.disposition === "composite-child-with-parent", `${animationId}/${spec.timelineId}: unsupported static disposition ${spec.disposition || "missing"}`);
  assert(spec.role === "audio-only-offstage-visual-marker", `${animationId}/${spec.timelineId}: unsupported composite role ${spec.role || "missing"}`);
  assert(spec.parentTimelineId !== spec.timelineId, `${animationId}/${spec.timelineId}: parent timeline cannot equal child timeline`);
  assert(spec.parentFrameDomainId === spec.parentTimelineId, `${animationId}/${spec.timelineId}: parent frame domain must name the proven parent timeline`);
}

function deriveClaim({animationId, spec, structure, scripts, inventory, manifest}) {
  validateClaimSpec(spec, animationId);
  const label = `${animationId}/${spec.timelineId}`;
  const inventoryTimeline = (inventory.timelineInventory || []).find((item) => item.timelineId === spec.timelineId);
  assert(inventoryTimeline, `${label}: scenario inventory timeline is missing`);
  assert(String(inventoryTimeline.objectId) === spec.sourceObjectId, `${label}: scenario inventory object ID mismatch`);
  assert(inventoryTimeline.frameCount === spec.frameCount, `${label}: scenario inventory frame count mismatch`);
  assert(inventoryTimeline.structuralReachability === "reachable-from-root-placement-graph", `${label}: timeline is not structurally root-reachable`);
  const parentInventory = (inventory.timelineInventory || []).find((item) => item.timelineId === spec.parentTimelineId);
  assert(parentInventory && String(parentInventory.objectId) === spec.parentSourceObjectId, `${label}: parent timeline identity is wrong or missing`);
  const parentDomain = (manifest.implementation?.frameDomains || []).find((domain) => domain.id === spec.parentFrameDomainId);
  assert(parentDomain?.sourceTimelineId === spec.parentTimelineId, `${label}: parent frame domain does not declare ${spec.parentTimelineId}`);
  assert(!(manifest.implementation?.frameDomains || []).some((domain) => domain.sourceTimelineId === spec.timelineId), `${label}: child is already a declared frame domain`);

  const child = requireTimeline(structure, spec.timelineId, spec.sourceObjectId, spec.frameCount, label);
  const parent = requireTimeline(structure, spec.parentTimelineId, spec.parentSourceObjectId, parentInventory.frameCount, label);
  const root = structure.timelines.get("root");
  assert(root, `${label}: root timeline is missing`);
  const observedTagCensus = normalizedTagCensus(child.tagCounts);
  const expectedTagCensus = normalizedTagCensus(spec.expectedTagCensus);
  assert(JSON.stringify(observedTagCensus) === JSON.stringify(expectedTagCensus), `${label}: unsupported tag census ${JSON.stringify(observedTagCensus)}`);
  const soundHeadCount = (child.tagCounts.SoundStreamHead || 0) + (child.tagCounts.SoundStreamHead2 || 0);
  const soundBlockCount = child.tagCounts.SoundStreamBlock || 0;
  assert(soundHeadCount === 1, `${label}: expected exactly one SoundStreamHead, found ${soundHeadCount}`);
  assert(soundBlockCount === spec.frameCount && soundBlockCount > 0, `${label}: SoundStreamBlock count ${soundBlockCount} must equal ${spec.frameCount}`);
  const [soundHead] = child.soundHeads;
  assert(soundHead?.attributes.compression === "2", `${label}: only MP3 SoundStream compression=2 is supported`);

  const rootPlacement = exactPlacement(root, (item) => (
    item.objectId === spec.parentSourceObjectId
    && item.name === spec.rootInstanceName
    && item.frame === spec.rootPlacementFrame
    && item.depth === spec.rootDepth
  ), `${label}: root-to-parent`);
  assert(!rootPlacement.hasClipActions, `${label}: root-to-parent placement has clip actions`);
  noDepthUpdates(root, rootPlacement, null, `${label}: root-to-parent`);

  const parentPlacement = exactPlacement(parent, (item) => (
    item.objectId === spec.sourceObjectId
    && item.name === spec.parentInstanceName
    && item.frame === spec.parentPlacementFrame
    && item.depth === spec.parentDepth
  ), `${label}: parent-to-child`);
  assert(!parentPlacement.hasClipActions, `${label}: parent-to-child placement has clip actions`);
  noDepthUpdates(parent, parentPlacement, spec.parentRemovalFrame, `${label}: parent-to-child`);

  assert(child.placements.length === 1, `${label}: expected one child visual placement, found ${child.placements.length}`);
  const [visualPlacement] = child.placements;
  assert(visualPlacement.frame === 1 && visualPlacement.objectId, `${label}: child visual placement must be a frame-1 definition placement`);
  assert(!visualPlacement.hasClipActions, `${label}: child visual placement has clip actions`);
  noDepthUpdates(child, visualPlacement, null, `${label}: child visual placement`);
  const shape = structure.shapes.get(visualPlacement.objectId);
  assert(shape?.bounds, `${label}: child visual placement is not a bounded DefineShape`);

  const compositeMatrix = multiplyMatrices(
    rootPlacement.matrix,
    multiplyMatrices(parentPlacement.matrix, visualPlacement.matrix),
  );
  const stageBoundsTwips = transformBounds(shape.bounds, compositeMatrix);
  const stageIntersection = intersects(stageBoundsTwips, structure.stageBounds);
  assert(!stageIntersection, `${label}: composed visual bounds intersect the native stage`);

  const childScripts = scripts.blocks
    .filter((block) => block.scope.kind === "sprite" && block.scope.objectId === spec.sourceObjectId)
    .sort((left, right) => left.scope.frame - right.scope.frame);
  assert(childScripts.length === 2, `${label}: expected exactly two child scripts, found ${childScripts.length}`);
  assert(childScripts[0].scope.frame === 1 && childScripts[0].body.trim() === "stop();", `${label}: child frame 1 must contain only stop()`);
  assert(childScripts[1].scope.frame === spec.frameCount && childScripts[1].body.trim() === "stop();", `${label}: child terminal frame must contain only stop()`);

  const selectorPrefixReferences = scripts.referencesFor("Mc_Sound_");
  const selectorVariableReferences = scripts.referencesFor("tempRandomSoundMc");
  assert(selectorPrefixReferences.length === 1, `${label}: Mc_Sound_ selector prefix has ${selectorPrefixReferences.length} script references, expected 1`);
  assert(selectorVariableReferences.length === 2, `${label}: tempRandomSoundMc has ${selectorVariableReferences.length} script references, expected 2`);
  const parentFrame1 = scripts.blocks.find((block) => block.scope.kind === "sprite" && block.scope.objectId === spec.parentSourceObjectId && block.scope.frame === 1);
  const parentFrame5 = scripts.blocks.find((block) => block.scope.kind === "sprite" && block.scope.objectId === spec.parentSourceObjectId && block.scope.frame === 5);
  assert(parentFrame1 && /tempNum\s*=\s*random\(2\)\s*;/.test(parentFrame1.body), `${label}: parent frame 1 random(2) selection is missing`);
  assert(/_global\.tempRandomSoundMc\s*=\s*["']Mc_Sound_["']\s*\+\s*tempNum\s*;/.test(parentFrame1.body), `${label}: parent frame 1 selector assignment is unsupported`);
  assert(parentFrame5 && /eval\(_global\.tempRandomSoundMc\)\.gotoAndPlay\(2\)\s*;/.test(parentFrame5.body), `${label}: parent frame 5 selected-sound trigger is missing`);
  assert(selectorPrefixReferences[0].script === parentFrame1.script, `${label}: selector prefix is referenced outside parent frame 1`);
  assert(selectorVariableReferences.every(({script}) => script === parentFrame1.script || script === parentFrame5.script), `${label}: selector variable is referenced outside the supported parent scripts`);
  const directInstanceReferences = scripts.referencesFor(spec.parentInstanceName);
  assert(directInstanceReferences.length === 0, `${label}: candidate instance has unsupported direct ActionScript references`);

  return {
    timelineId: spec.timelineId,
    sourceObjectId: spec.sourceObjectId,
    frameCount: spec.frameCount,
    disposition: spec.disposition,
    parentTimelineId: spec.parentTimelineId,
    parentSourceObjectId: spec.parentSourceObjectId,
    parentFrameDomainId: spec.parentFrameDomainId,
    role: spec.role,
    tagCensus: {
      observed: observedTagCensus,
      allowedTags: Object.keys(expectedTagCensus),
      declaredFrameCount: child.declaredFrames,
      observedShowFrameCount: child.observedShowFrames,
      exactMatch: true,
    },
    audioStructure: {
      required: true,
      acceptanceSatisfied: false,
      headTag: soundHead.tag,
      headCount: soundHeadCount,
      blockCount: soundBlockCount,
      compressionCode: Number(soundHead.attributes.compression),
      playbackRateCode: Number(soundHead.attributes.playbackRate),
      playbackStereo: soundHead.attributes.playbackStereo === "1",
      sourceFrameDomain: spec.timelineId,
    },
    placementChain: [
      {
        parentTimelineId: "root",
        childTimelineId: spec.parentTimelineId,
        sourceObjectId: spec.parentSourceObjectId,
        frame: rootPlacement.frame,
        depth: rootPlacement.depth,
        instanceName: rootPlacement.name,
        tag: rootPlacement.tag,
        matrix: rootPlacement.matrix,
      },
      {
        parentTimelineId: spec.parentTimelineId,
        childTimelineId: spec.timelineId,
        sourceObjectId: spec.sourceObjectId,
        frame: parentPlacement.frame,
        depth: parentPlacement.depth,
        instanceName: parentPlacement.name,
        tag: parentPlacement.tag,
        matrix: parentPlacement.matrix,
      },
      {
        parentTimelineId: spec.timelineId,
        childTimelineId: null,
        sourceObjectId: visualPlacement.objectId,
        frame: visualPlacement.frame,
        depth: visualPlacement.depth,
        instanceName: visualPlacement.name,
        tag: visualPlacement.tag,
        definitionTag: shape.definitionTag,
        matrix: visualPlacement.matrix,
      },
    ],
    lifetime: {
      parentPlacementFrame: parentPlacement.frame,
      parentRemovalFrame: spec.parentRemovalFrame,
      parentPlacementUpdateCount: 0,
      childPlacementUpdateCount: 0,
      clipActionCount: 0,
    },
    visualBounds: {
      sourceShapeObjectId: shape.objectId,
      sourceShapeBoundsTwips: shape.bounds,
      compositeMatrix,
      stageBoundsTwips,
      nativeStageBoundsTwips: structure.stageBounds,
      nativeStageIntersection: false,
      proof: "The only placed visual definition has a constant matrix chain and its transformed bounds do not intersect the native stage before the parent removes the child.",
    },
    scriptReferenceAudit: {
      candidateTimelineScripts: childScripts.map(normalizedScriptRecord),
      selectorPrefix: {value: "Mc_Sound_", occurrenceCount: 1, references: selectorPrefixReferences},
      selectorVariable: {value: "tempRandomSoundMc", occurrenceCount: 2, references: selectorVariableReferences},
      directInstanceName: {value: spec.parentInstanceName, occurrenceCount: 0, references: []},
      parentSelection: normalizedScriptRecord(parentFrame1),
      parentTrigger: normalizedScriptRecord(parentFrame5),
      selectorOutcome: spec.selectorOutcome,
      unsupportedReferenceCount: 0,
    },
    preservedObligations: {
      audio: {
        required: true,
        satisfiedByDisposition: false,
        status: "pending-authoritative-listening-and-runtime-synchronization",
      },
      behavior: {
        required: true,
        satisfiedByDisposition: false,
        status: "pending-natural-runtime-random-branch-traces",
      },
      fullFrame: {
        required: true,
        satisfiedByDisposition: false,
        status: "represented-through-parent-domain-but-not-yet-captured-or-compared",
      },
    },
  };
}

export function buildStaticCompositeEvidenceDocument({
  animationId,
  manifest,
  inventory,
  inventorySha256,
  sourceSwfBytes,
  swfmillGzip,
  scriptsGzip,
  claimSpecs = STATIC_COMPOSITE_CLAIM_SPECS[animationId],
  singleFrameClaimSpec = STATIC_SINGLE_FRAME_SCRIPTLESS_CLAIM_SPECS[animationId],
  multiFrameClaimSpec = STATIC_MULTI_FRAME_SCRIPTLESS_COMPOSITE_CLAIM_SPECS[animationId],
  multiFrameExclusionIds = [],
  reviewedSingleFrameSelection = null,
  reviewedMultiFrameSelection = null,
}) {
  const audioClaimSpecs = claimSpecs || [];
  const multiFrameClaimSpecs = multiFrameClaimSpec
    ? (Array.isArray(multiFrameClaimSpec) ? multiFrameClaimSpec : [multiFrameClaimSpec])
    : [];
  assert(Array.isArray(audioClaimSpecs), `${animationId}: audio static composite claim specifications must be an array`);
  assert(Array.isArray(multiFrameExclusionIds), `${animationId}: multi-frame exclusions must be an array`);
  assert(audioClaimSpecs.length > 0 || singleFrameClaimSpec || multiFrameClaimSpecs.length > 0, `${animationId}: no reviewed static composite claim specification exists`);
  const requiresG4L3ReviewedSelection = Boolean(
    G4_L3_REVIEWED_SINGLE_FRAME_SCRIPTLESS_CLAIM_SPECS[animationId] && singleFrameClaimSpec,
  );
  assert(Boolean(reviewedSingleFrameSelection) === requiresG4L3ReviewedSelection, `${animationId}: reviewed G4 L3 single-frame selection binding is missing or unexpected`);
  assert(manifest.animationId === animationId, `${animationId}: migration manifest identity mismatch`);
  assert(inventory.animationId === animationId, `${animationId}: scenario inventory identity mismatch`);
  assertSha256(inventorySha256, `${animationId}: scenario inventory SHA-256`);
  const sourceEvidence = requiredInventoryEvidence(inventory, "source-swf");
  const swfmillEvidence = requiredInventoryEvidence(inventory, "swfmill-xml");
  const scriptsEvidence = requiredInventoryEvidence(inventory, "ffdec-scripts");
  const manifestEvidence = requiredInventoryEvidence(inventory, "migration-technical-contract");
  const manifestProjectionSha256 = technicalManifestSha256(manifest);
  assert(manifestEvidence.path === "migration.json", `${animationId}: migration technical contract path is unsupported`);
  assert(manifestEvidence.projection === TECHNICAL_MANIFEST_PROJECTION.id, `${animationId}: migration technical projection identifier is stale`);
  assert(manifestEvidence.hashMode === "canonical-json-v1", `${animationId}: migration technical hash mode is stale`);
  assert(JSON.stringify(manifestEvidence.excludedPaths) === JSON.stringify(TECHNICAL_MANIFEST_PROJECTION.excludedPaths), `${animationId}: migration technical excluded paths are stale`);
  assert(manifestEvidence.sha256 === manifestProjectionSha256, `${animationId}: scenario inventory migration technical projection is stale`);
  assert(manifest.source?.swf === sourceEvidence.path && manifest.source?.swfSha256 === sourceEvidence.sha256, `${animationId}: source descriptor differs between manifest and scenario inventory`);
  assert(sha256(sourceSwfBytes) === sourceEvidence.sha256, `${animationId}: source SWF SHA-256 is stale`);
  assert(sha256(swfmillGzip) === swfmillEvidence.sha256, `${animationId}: swfmill compressed SHA-256 is stale`);
  assert(sha256(scriptsGzip) === scriptsEvidence.sha256, `${animationId}: FFDec scripts compressed SHA-256 is stale`);
  const swfmillXml = gunzipSync(swfmillGzip).toString("utf8");
  const scriptText = gunzipSync(scriptsGzip).toString("utf8");
  assertSha256(swfmillEvidence.uncompressedSha256, `${animationId}: swfmill uncompressed SHA-256`);
  assertSha256(scriptsEvidence.uncompressedSha256, `${animationId}: FFDec scripts uncompressed SHA-256`);
  assert(sha256(swfmillXml) === swfmillEvidence.uncompressedSha256, `${animationId}: swfmill uncompressed SHA-256 is stale`);
  assert(sha256(scriptText) === scriptsEvidence.uncompressedSha256, `${animationId}: FFDec scripts uncompressed SHA-256 is stale`);
  const structure = parseSwfmillDispositionStructure(swfmillXml);
  const scripts = parseFfdecDispositionScripts(scriptText);
  const audioClaims = audioClaimSpecs
    .map((spec) => deriveClaim({animationId, spec, structure, scripts, inventory, manifest}))
    .sort((left, right) => Number(left.sourceObjectId) - Number(right.sourceObjectId) || compareText(left.timelineId, right.timelineId));
  const singleFrame = singleFrameClaimSpec
    ? deriveSingleFrameScriptlessClaims({animationId, spec: singleFrameClaimSpec, structure, scripts, inventory, manifest})
    : null;
  if (multiFrameClaimSpecs.length || multiFrameExclusionIds.length) {
    const selectedTimelineIds = multiFrameClaimSpecs.flatMap((spec) => spec.timelines.map(({timelineId}) => timelineId));
    assert(new Set(selectedTimelineIds).size === selectedTimelineIds.length, `${animationId}: duplicate multi-frame selected timeline ID`);
    assert(new Set(multiFrameExclusionIds).size === multiFrameExclusionIds.length, `${animationId}: duplicate multi-frame exclusion ID`);
    assert(!selectedTimelineIds.some((timelineId) => multiFrameExclusionIds.includes(timelineId)), `${animationId}: selected and excluded multi-frame sets overlap`);
    assertExactTimelineSet(
      [...selectedTimelineIds, ...multiFrameExclusionIds],
      undeclaredReachableMultiFrameTimelineIds(inventory, manifest),
      `${animationId}: exhaustive undeclared reachable multi-frame partition`,
    );
  }
  const multiFrames = multiFrameClaimSpecs.map((spec) => (
    deriveMultiFrameScriptlessClaims({animationId, spec, structure, scripts, inventory, manifest})
  ));
  const multiFrameClaims = multiFrames.flatMap(({claims: items}) => items);
  const hasNestedDeclaredParentClaims = multiFrameClaimSpecs.some(
    ({parentBindingMode}) => (
      parentBindingMode === NESTED_DECLARED_PARENT_BINDING_MODE
    ),
  );
  const claims = [...audioClaims, ...(singleFrame?.claims || []), ...multiFrameClaims]
    .sort((left, right) => Number(left.sourceObjectId) - Number(right.sourceObjectId) || compareText(left.timelineId, right.timelineId));
  assert(new Set(claims.map(({timelineId}) => timelineId)).size === claims.length, `${animationId}: duplicate static composite timeline claim`);
  const claimSetContracts = [];
  if (audioClaims.length) {
    const timelineIds = sortedTimelineIds(audioClaims.map(({timelineId}) => timelineId));
    claimSetContracts.push({
      proofType: "audio-only-offstage-visual-marker",
      expectedTimelineCount: audioClaimSpecs.length,
      expectedTimelineIds: timelineIds,
      verifiedTimelineCount: audioClaims.length,
      verifiedTimelineIds: timelineIds,
      exactMatch: true,
    });
  }
  if (singleFrame) claimSetContracts.push(singleFrame.contract);
  for (const multiFrame of multiFrames) claimSetContracts.push(multiFrame.contract);
  const hasParentTerminalOrZeroWrapLifetime = multiFrameClaims.some(({placementLifecycleAudit}) => (
    (placementLifecycleAudit?.parentTerminalTerminationCount || 0) > 0
    || (placementLifecycleAudit?.zeroWrapLifetimeCount || 0) > 0
  ));
  return {
    schemaVersion: 2,
    evidenceType: "static-frame-domain-disposition-evidence",
    animationId,
    status: "verified-static-composite-claims",
    migrationStatusChanged: false,
    authorityStatement: [
      "This evidence is rebuilt from hash-bound preserved SWF, swfmill structure, FFDec ActionScript, scenario inventory, and migration technical-contract inputs.",
      "A composite-child-with-parent claim is emitted only when the reviewed timeline/parent identities, exact tag census, MP3 SoundStream blocks, constant placement matrices, fully off-stage visual bounds, removal lifecycle, and unique ActionScript references all match.",
      "A single-frame-scriptless-structural-child claim is emitted only when the pinned exact ID/count set equals every eligible root-reachable one-frame source timeline, swfmill has exactly one ShowFrame and no DoAction/DoInitAction for it, FFDec exports no frame script, every incoming/outgoing placement has no clipActions, and the manifest declares no independent domain for it.",
      ...(reviewedSingleFrameSelection ? [
        "For this G4 L3 member, the exact eligible ID/count set is additionally bound to the reviewed candidate-report digest and canonical lesson-wide pair-set digest; the review is explicitly engineering-only and supplies no human or owner acceptance.",
      ] : []),
      ...(reviewedMultiFrameSelection ? [
        "For this G4 L3 member, the accepted and excluded multi-frame sets are additionally bound to a reviewed lesson-wide partition; the engineering-only decision supplies no human or owner acceptance.",
      ] : []),
      ...(multiFrames.length ? [
        hasParentTerminalOrZeroWrapLifetime
          ? "A multi-frame-scriptless-parent-clock-composite-child claim is emitted only when the exact source hash, exhaustive undeclared multi-frame set, declared parent domain, every fresh placement/update/termination lifetime, every one-indexed local-frame segment, every source-proven wrap, every explicitly permitted zero-wrap window, internal display graph, and absence of child scripts, DoInitAction, clipActions, dynamic addressing, and external target controls all match."
          : "A multi-frame-scriptless-parent-clock-composite-child claim is emitted only when the exact source hash, exhaustive undeclared multi-frame set, declared parent domain, every fresh placement/update/removal lifetime, every one-indexed local-frame segment and source-proven wrap, internal display graph, and absence of child scripts, DoInitAction, clipActions, dynamic addressing, and external target controls all match.",
      ] : []),
      ...(hasNestedDeclaredParentClaims ? [
        "The nested-declared-parent-local-clock-only binding mode additionally binds the exact complete indirect parent root path while leaving that parent's natural runtime entry state unresolved; it never converts an indirect source path into a direct-root or natural-runtime claim.",
      ] : []),
      multiFrames.length
        ? "These classifications remove only an independent local-playhead/frame-domain obligation. They do not satisfy visual, button, interaction, behavior, audio, full-frame/RMSE, human-review, or owner-acceptance obligations."
        : "Both classifications remove only an independent local-playhead/frame-domain obligation. They do not satisfy button, interaction, behavior, audio, full-frame/RMSE, human-review, or owner-acceptance obligations.",
    ],
    generatedFrom: {
      sourceSwf: {path: sourceEvidence.path, sha256: sourceEvidence.sha256},
      migrationManifest: {
        path: "migration.json",
        projection: TECHNICAL_MANIFEST_PROJECTION.id,
        hashMode: "canonical-json-v1",
        sha256: manifestProjectionSha256,
        excludedPaths: [...TECHNICAL_MANIFEST_PROJECTION.excludedPaths],
      },
      scenarioInventory: {path: "audit/scenario-inventory.json", sha256: inventorySha256, schemaVersion: inventory.schemaVersion},
      swfmillStructure: {
        path: swfmillEvidence.path,
        sha256: swfmillEvidence.sha256,
        uncompressedSha256: swfmillEvidence.uncompressedSha256,
      },
      ffdecScripts: {
        path: scriptsEvidence.path,
        sha256: scriptsEvidence.sha256,
        uncompressedSha256: scriptsEvidence.uncompressedSha256,
      },
      ...(reviewedSingleFrameSelection ? {reviewedSingleFrameSelection} : {}),
      ...(reviewedMultiFrameSelection ? {reviewedMultiFrameSelection} : {}),
    },
    nativeStage: {
      twipsPerPixel: 20,
      boundsTwips: structure.stageBounds,
      widthPixels: (structure.stageBounds.right - structure.stageBounds.left) / 20,
      heightPixels: (structure.stageBounds.bottom - structure.stageBounds.top) / 20,
    },
    claimSetContracts,
    claims,
    acceptanceEffects: {
      buttonAccepted: false,
      interactionAccepted: false,
      audioAccepted: false,
      behaviorAccepted: false,
      fullFrameAccepted: false,
      rmseAccepted: false,
      humanReviewAccepted: false,
      ownerReviewAccepted: false,
    },
    strictAcceptanceEffect: "none; static composite classification removes only an independent local playhead and preserves all button, interaction, behavior, audio, full-frame/RMSE, human-review, and owner-acceptance obligations",
  };
}

function resolveArtifactPath(workspace, declaredPath) {
  if (path.isAbsolute(declaredPath)) return declaredPath;
  if (declaredPath.startsWith("source-assets/") || declaredPath.startsWith("migrations/")) return path.join(projectRoot, declaredPath);
  return path.join(workspace, declaredPath);
}

async function buildOne(animationId, {migrationsRoot = defaultMigrationsRoot} = {}) {
  const workspace = path.join(path.resolve(migrationsRoot), animationId);
  const manifestPath = path.join(workspace, "migration.json");
  const inventoryPath = path.join(workspace, "audit", "scenario-inventory.json");
  const [manifestBytes, inventoryBytes] = await Promise.all([readFile(manifestPath), readFile(inventoryPath)]);
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  const inventory = JSON.parse(inventoryBytes.toString("utf8"));
  const sourceEvidence = requiredInventoryEvidence(inventory, "source-swf");
  const swfmillEvidence = requiredInventoryEvidence(inventory, "swfmill-xml");
  const scriptsEvidence = requiredInventoryEvidence(inventory, "ffdec-scripts");
  const [sourceSwfBytes, swfmillGzip, scriptsGzip] = await Promise.all([
    readFile(resolveArtifactPath(workspace, sourceEvidence.path)),
    readFile(resolveArtifactPath(workspace, swfmillEvidence.path)),
    readFile(resolveArtifactPath(workspace, scriptsEvidence.path)),
  ]);
  const [reviewedSingleFrameSelection, reviewedMultiFrameSelectionRecord] = await Promise.all([
    loadG4L3ReviewedSingleFrameSelection(animationId),
    loadG4L3ReviewedMultiFrameSelection(animationId),
  ]);
  const document = buildStaticCompositeEvidenceDocument({
    animationId,
    manifest,
    inventory,
    inventorySha256: sha256(inventoryBytes),
    sourceSwfBytes,
    swfmillGzip,
    scriptsGzip,
    reviewedSingleFrameSelection,
    reviewedMultiFrameSelection: reviewedMultiFrameSelectionRecord?.evidence || null,
    multiFrameExclusionIds: reviewedMultiFrameSelectionRecord?.excludedTimelineIds || [],
  });
  const rendered = `${JSON.stringify(document, null, 2)}\n`;
  const outputPath = path.join(workspace, STATIC_DISPOSITION_EVIDENCE_RELATIVE_PATH);
  return {animationId, workspace, outputPath, document, rendered, sha256: sha256(rendered)};
}

export async function verifyStaticFrameDomainDispositionEvidence(animationId, options = {}) {
  const built = await buildOne(animationId, options);
  assert(await exists(built.outputPath), `${animationId}: ${STATIC_DISPOSITION_EVIDENCE_RELATIVE_PATH} is missing`);
  const existing = await readFile(built.outputPath, "utf8");
  assert(existing === built.rendered, `${animationId}: ${STATIC_DISPOSITION_EVIDENCE_RELATIVE_PATH} is stale or unsupported`);
  return {...built, action: "verified"};
}

export async function buildStaticFrameDomainDispositionEvidence(options = {}) {
  const ids = options.ids?.length ? options.ids : STATIC_DISPOSITION_ANIMATION_IDS;
  const unknown = ids.filter((id) => !STATIC_DISPOSITION_ANIMATION_IDS.includes(id));
  if (unknown.length) throw new Error(`No reviewed static composite claim specification for: ${unknown.join(", ")}`);
  const results = [];
  for (const animationId of ids) {
    const built = await buildOne(animationId, options);
    if (options.check) {
      assert(await exists(built.outputPath), `${animationId}: ${STATIC_DISPOSITION_EVIDENCE_RELATIVE_PATH} is missing`);
      const existing = await readFile(built.outputPath, "utf8");
      assert(existing === built.rendered, `${animationId}: ${STATIC_DISPOSITION_EVIDENCE_RELATIVE_PATH} is stale or unsupported`);
      results.push({...built, action: "verified"});
    } else {
      await writeFile(built.outputPath, built.rendered, "utf8");
      results.push({...built, action: "written"});
    }
  }
  return results;
}

export function parseArguments(argv) {
  const options = {check: false, help: false, ids: [], migrationsRoot: defaultMigrationsRoot};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else if (argument === "--id" || argument === "--migrations") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`${argument} requires a value`);
      if (argument === "--id") options.ids.push(value);
      else options.migrationsRoot = path.resolve(value);
      index += 1;
    } else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

function usage() {
  return `Usage: node scripts/build-static-frame-domain-disposition-evidence.mjs [options]\n\nOptions:\n  --id <animation-id>       Build one reviewed static composite evidence file; repeatable\n  --migrations <directory>  Migration root (default: migrations)\n  --check                   Verify the checked-in evidence without writing\n  --help                    Show this help\n\nThe command writes only ${STATIC_DISPOSITION_EVIDENCE_RELATIVE_PATH}. It never\nchanges migration manifests, review/status fields, renderers, or preserved sources.`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) process.stdout.write(`${usage()}\n`);
  else {
    const results = await buildStaticFrameDomainDispositionEvidence(options);
    for (const result of results) {
      process.stdout.write(`${result.action}: ${result.animationId} -> ${portable(path.relative(projectRoot, result.outputPath))} (${result.document.claims.length} verified composite children)\n`);
    }
  }
}
