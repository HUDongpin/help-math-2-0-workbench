#!/usr/bin/env node

import {createHash, randomBytes} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  link,
  lstat,
  open,
  readFile,
  realpath,
  rename,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  G5_L4_M1_STATIC_RECONCILIATION_RECEIPT_NAME,
  G5_L4_RELEASE_ID,
  readG5L4M1StaticReconciliationReceipt,
  validateG5L4M1StaticReconciliationReceipt,
} from "./reconcile-lesson-m1-static-specification.mjs";
import {
  G5_L4_WORK_STUDY_READINESS_IDS,
  buildG5L4WorkStudyStrictReadiness,
  validateG5L4WorkStudyStrictReadiness,
} from "./build-g5-l4-work-study-strict-readiness.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");

export const LESSON_STATIC_STRICT_READINESS_GENERATOR =
  "scripts/build-lesson-static-strict-readiness.mjs";
export const G5_L4_STATIC_STRICT_READINESS_STATE =
  "m1-static-reconciled-runtime-human-blocked";
export const G5_L4_STATIC_STRICT_READINESS_OUTPUT_NAME =
  "strict-readiness.json";

const GENERATOR_VERSION = 2;
const EXPECTED_MEMBER_COUNT = 55;
const EXPECTED_PAGE_COUNT = 54;
const EXPECTED_SHELL_COUNT = 1;
const G5_L4_RELEASE_FINGERPRINT_SHA256 =
  "df2f04bb91ffecffcde4447807dce7eeff25b689269d5de1f44741f25b5ba2cc";
const RELEASE_RELATIVE = "catalog/lesson-releases.json";
const SOURCE_SCOPE_RELATIVE = "reports/g5-l4-source-scope-freeze.json";
const AUDIO_OWNERSHIP_RELATIVE =
  "reports/g5-l4-audio-ownership-readiness.json";
const CALIBRATION_RELATIVE =
  "catalog/lesson-release-calibration-sets.json";
const SOURCE_ARCHIVE_PREFIX =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/";
const SOURCE_SCOPE_BINDING_RELATIVE =
  "audit/machine/g5-l4-source-scope-binding.json";
const MANIFEST_RELATIVE = "migration.json";
const MACHINE_AUDIT_RELATIVE = "audit/machine/report.json";
const AUDIO_EVIDENCE_RELATIVE = "audit/audio-runtime-evidence.json";
const COVERAGE_RELATIVE = "evidence/full-frame-coverage.json";
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const SAFE_ID = /^[a-z0-9][a-z0-9-]{2,127}$/;
const CAPTURE_IDENTITY_FIELDS = Object.freeze([
  "frameDomain",
  "requirementId",
  "trace",
  "entryStateSha256",
  "frame",
  "scenario",
  "lang",
  "seed",
]);
const STATIC_OUTPUT_PATHS = Object.freeze({
  migrationManifest: MANIFEST_RELATIVE,
  migrationBrief: "MIGRATION_BRIEF.md",
  scriptInventory: "audit/script-inventory.json",
  dependencyInventory: "audit/dependency-inventory.json",
});
const ACCEPTANCE_FALSE_KEYS = Object.freeze([
  "audioAccepted",
  "authoritativeOriginalRuntime",
  "currentJavaScriptCandidate",
  "fidelityAccepted",
  "humanVisualAccepted",
  "implementationAuthorized",
  "ownerAccepted",
  "published",
  "strictComplete",
]);
const IMPLEMENTATION_FALSE_KEYS = Object.freeze([
  "behaviorImplementationComplete",
  "currentJavaScriptCandidate",
  "deterministicImplementationCaptureAccepted",
  "fullFrameComparisonAccepted",
  "implementationAuthorized",
  "implementationStarted",
  "rendererSelected",
  "routeDeclared",
]);
export const G5_L4_SOURCE_STATIC_CANDIDATE_PROFILES = Object.freeze({
  "course-g05-l04-rw-002": Object.freeze({
    frameDomainId: "sprite-341",
    nestedFrameCount: 419,
    sourceInstanceId: "Animation",
    unresolvedTimelineCandidateIds: Object.freeze([
      "sprite-43",
      "sprite-208",
    ]),
  }),
  "course-g05-l04-vb-002": Object.freeze({
    frameDomainId: "sprite-49",
    nestedFrameCount: 186,
  }),
  "course-g05-l04-vb-005": Object.freeze({
    frameDomainId: "sprite-46",
    nestedFrameCount: 264,
  }),
  "course-g05-l04-vb-006": Object.freeze({
    frameDomainId: "sprite-42",
    nestedFrameCount: 166,
  }),
  "course-g05-l04-in-009": Object.freeze({
    frameDomainId: "sprite-29",
    nestedFrameCount: 504,
  }),
  "course-g05-l04-in-015": Object.freeze({
    frameDomainId: "sprite-101",
    nestedFrameCount: 601,
  }),
  "course-g05-l04-ts-006": Object.freeze({
    frameDomainId: "sprite-12",
    nestedFrameCount: 245,
  }),
  "course-g05-l04-ts-003": Object.freeze({
    frameDomainId: "sprite-25",
    nestedFrameCount: 227,
  }),
  "course-g05-l04-ts-002": Object.freeze({
    frameDomainId: "sprite-28",
    nestedFrameCount: 324,
  }),
  "course-g05-l04-ts-005": Object.freeze({
    frameDomainId: "sprite-30",
    nestedFrameCount: 234,
  }),
  "course-g05-l04-ts-004": Object.freeze({
    frameDomainId: "sprite-36",
    nestedFrameCount: 290,
  }),
  "course-g05-l04-vb-008": Object.freeze({
    frameDomainId: "sprite-50",
    nestedFrameCount: 197,
  }),
  "course-g05-l04-vb-009": Object.freeze({
    frameDomainId: "sprite-51",
    nestedFrameCount: 189,
  }),
  "course-g05-l04-in-020": Object.freeze({
    frameDomainId: "sprite-37",
    nestedFrameCount: 282,
  }),
  "course-g05-l04-in-012": Object.freeze({
    frameDomainId: "sprite-48",
    nestedFrameCount: 298,
  }),
  "course-g05-l04-rw-003": Object.freeze({
    frameDomainId: "sprite-535",
    nestedFrameCount: 1141,
    sourceInstanceId: "Animation",
    unresolvedTimelineCandidateIds: Object.freeze([
      "sprite-264",
      "sprite-379",
    ]),
  }),
  "course-g05-l04-rw-004": Object.freeze({
    frameDomainId: "sprite-227",
    nestedFrameCount: 506,
    sourceInstanceId: "Animation",
    unresolvedTimelineCandidateIds: Object.freeze([
      "sprite-37",
      "sprite-145",
    ]),
  }),
  "course-g05-l04-in-002": Object.freeze({
    frameDomainId: "sprite-52",
    nestedFrameCount: 765,
  }),
  "course-g05-l04-in-007": Object.freeze({
    frameDomainId: "sprite-76",
    nestedFrameCount: 654,
  }),
  "course-g05-l04-vb-007": Object.freeze({
    frameDomainId: "sprite-230",
    nestedFrameCount: 136,
    renderedFrameCount: 52,
    blockedLocalFrameRanges: Object.freeze([{
      firstFrame: 53,
      lastFrame: 136,
      reason:
        "Frames 53..136 begin a stop-controlled quiz state and place answer plus right/wrong feedback clips whose progression depends on unresolved ActionScript and host state.",
    }]),
    unresolvedTimelineCandidateIds: Object.freeze([
      "sprite-51",
      "sprite-54",
      "sprite-72",
      "sprite-77",
      "sprite-86",
      "sprite-98",
      "sprite-132",
      "sprite-144",
      "sprite-172",
      "sprite-186",
      "sprite-192",
      "sprite-216",
      "sprite-225",
    ]),
  }),
  "course-g05-l04-vb-010": Object.freeze({
    frameDomainId: "sprite-228",
    nestedFrameCount: 88,
    renderedFrameCount: 35,
    blockedLocalFrameRanges: Object.freeze([{
      firstFrame: 36,
      lastFrame: 88,
      reason:
        "Frames 36..88 begin a stop-controlled quiz state and place answer plus right/wrong feedback clips whose progression depends on unresolved ActionScript and host state.",
    }]),
    unresolvedTimelineCandidateIds: Object.freeze([
      "sprite-38",
      "sprite-56",
      "sprite-60",
      "sprite-88",
      "sprite-99",
      "sprite-111",
      "sprite-137",
      "sprite-143",
      "sprite-151",
      "sprite-154",
      "sprite-175",
      "sprite-187",
      "sprite-196",
      "sprite-218",
    ]),
  }),
  "course-g05-l04-vb-011": Object.freeze({
    frameDomainId: "sprite-225",
    nestedFrameCount: 81,
    renderedFrameCount: 32,
    blockedLocalFrameRanges: Object.freeze([{
      firstFrame: 33,
      lastFrame: 81,
      reason:
        "Frames 33..81 begin a stop-controlled quiz state and place answer plus right/wrong feedback clips whose progression depends on unresolved ActionScript and host state.",
    }]),
    unresolvedTimelineCandidateIds: Object.freeze([
      "sprite-60",
      "sprite-65",
      "sprite-70",
      "sprite-79",
      "sprite-91",
      "sprite-102",
      "sprite-134",
      "sprite-159",
      "sprite-165",
      "sprite-173",
      "sprite-176",
      "sprite-188",
      "sprite-197",
      "sprite-219",
    ]),
  }),
  "course-g05-l04-in-003": Object.freeze({
    frameDomainId: "sprite-217",
    nestedFrameCount: 182,
    renderedFrameCount: 73,
    blockedLocalFrameRanges: Object.freeze([{
      firstFrame: 74,
      lastFrame: 182,
      reason:
        "Frames 74..182 begin a stop-controlled quiz state and place answer plus right/wrong feedback clips whose progression depends on unresolved ActionScript and host state.",
    }]),
    unresolvedTimelineCandidateIds: Object.freeze([
      "sprite-40",
      "sprite-43",
      "sprite-61",
      "sprite-66",
      "sprite-75",
      "sprite-87",
      "sprite-121",
      "sprite-133",
      "sprite-161",
      "sprite-175",
      "sprite-181",
      "sprite-205",
      "sprite-214",
    ]),
  }),
  "course-g05-l04-in-004": Object.freeze({
    frameDomainId: "sprite-436",
    nestedFrameCount: 320,
    renderedFrameCount: 307,
    blockedLocalFrameRanges: Object.freeze([{
      firstFrame: 308,
      lastFrame: 320,
      reason:
        "Frames 308..320 place source right/wrong feedback clips whose visibility and progression depend on unresolved host and ActionScript state.",
    }]),
    unresolvedTimelineCandidateIds: Object.freeze([
      "sprite-92",
      "sprite-94",
      "sprite-95",
      "sprite-121",
      "sprite-168",
      "sprite-192",
      "sprite-212",
      "sprite-279",
      "sprite-304",
      "sprite-320",
      "sprite-322",
      "sprite-351",
      "sprite-358",
      "sprite-368",
      "sprite-392",
      "sprite-409",
      "sprite-433",
    ]),
  }),
  "course-g05-l04-in-005": Object.freeze({
    frameDomainId: "sprite-222",
    nestedFrameCount: 226,
    renderedFrameCount: 92,
    blockedLocalFrameRanges: Object.freeze([{
      firstFrame: 93,
      lastFrame: 226,
      reason:
        "Frames 93..226 begin a stop-controlled quiz state and place answer plus right/wrong feedback clips whose progression depends on unresolved ActionScript and host state.",
    }]),
    unresolvedTimelineCandidateIds: Object.freeze([
      "sprite-22",
      "sprite-45",
      "sprite-48",
      "sprite-66",
      "sprite-71",
      "sprite-80",
      "sprite-92",
      "sprite-126",
      "sprite-138",
      "sprite-166",
      "sprite-180",
      "sprite-186",
      "sprite-210",
      "sprite-219",
    ]),
  }),
  "course-g05-l04-in-010": Object.freeze({
    frameDomainId: "sprite-58",
    nestedFrameCount: 180,
    renderedFrameCount: 129,
    blockedLocalFrameRanges: Object.freeze([{
      firstFrame: 130,
      lastFrame: 180,
      reason:
        "Frames 130..180 begin a stop- and release-handler-controlled quiz state whose answer and feedback progression depends on unresolved ActionScript and host state.",
    }]),
    unresolvedTimelineCandidateIds: Object.freeze([
      "sprite-28",
      "sprite-29",
      "sprite-30",
      "sprite-31",
      "sprite-46",
      "sprite-55",
      "sprite-57",
    ]),
  }),
  "course-g05-l04-in-013": Object.freeze({
    frameDomainId: "sprite-170",
    nestedFrameCount: 178,
    renderedFrameCount: 82,
    blockedLocalFrameRanges: Object.freeze([{
      firstFrame: 83,
      lastFrame: 178,
      reason:
        "Frames 83..178 begin a stop- and release-handler-controlled quiz state whose answer and feedback progression depends on unresolved ActionScript and host state.",
    }]),
    unresolvedTimelineCandidateIds: Object.freeze([
      "sprite-13",
      "sprite-14",
      "sprite-15",
      "sprite-26",
      "sprite-29",
      "sprite-41",
      "sprite-42",
      "sprite-76",
      "sprite-88",
      "sprite-116",
      "sprite-130",
      "sprite-136",
      "sprite-160",
      "sprite-169",
    ]),
  }),
  "course-g05-l04-in-014": Object.freeze({
    frameDomainId: "sprite-170",
    nestedFrameCount: 197,
    renderedFrameCount: 83,
    blockedLocalFrameRanges: Object.freeze([{
      firstFrame: 84,
      lastFrame: 197,
      reason:
        "Frames 84..197 begin a stop- and release-handler-controlled quiz state whose answer and feedback progression depends on unresolved ActionScript and host state.",
    }]),
    unresolvedTimelineCandidateIds: Object.freeze([
      "sprite-13",
      "sprite-14",
      "sprite-15",
      "sprite-49",
      "sprite-61",
      "sprite-89",
      "sprite-103",
      "sprite-109",
      "sprite-133",
      "sprite-142",
      "sprite-152",
      "sprite-156",
      "sprite-168",
      "sprite-169",
    ]),
  }),
  "course-g05-l04-in-016": Object.freeze({
    frameDomainId: "sprite-264",
    nestedFrameCount: 299,
    renderedFrameCount: 190,
    blockedLocalFrameRanges: Object.freeze([{
      firstFrame: 191,
      lastFrame: 299,
      reason:
        "Frames 191..299 begin a stop-controlled quiz state and place answer plus right/wrong feedback clips whose progression depends on unresolved ActionScript and host state.",
    }]),
    unresolvedTimelineCandidateIds: Object.freeze([
      "sprite-37",
      "sprite-77",
      "sprite-80",
      "sprite-98",
      "sprite-103",
      "sprite-112",
      "sprite-124",
      "sprite-158",
      "sprite-170",
      "sprite-198",
      "sprite-212",
      "sprite-218",
      "sprite-242",
      "sprite-251",
    ]),
  }),
  "course-g05-l04-in-017": Object.freeze({
    frameDomainId: "sprite-494",
    nestedFrameCount: 541,
    renderedFrameCount: 373,
    blockedLocalFrameRanges: Object.freeze([{
      firstFrame: 374,
      lastFrame: 541,
      reason:
        "Frames 374..541 begin quiz answer, feedback, and continuation states whose causal transitions depend on unresolved ActionScript and host state.",
    }]),
    unresolvedTimelineCandidateIds: Object.freeze([
      "sprite-84",
      "sprite-151",
      "sprite-153",
      "sprite-154",
      "sprite-180",
      "sprite-227",
      "sprite-251",
      "sprite-271",
      "sprite-338",
      "sprite-358",
      "sprite-374",
      "sprite-376",
      "sprite-405",
      "sprite-412",
      "sprite-422",
      "sprite-446",
      "sprite-463",
      "sprite-487",
    ]),
  }),
  "course-g05-l04-in-018": Object.freeze({
    frameDomainId: "sprite-220",
    nestedFrameCount: 275,
    renderedFrameCount: 217,
    blockedLocalFrameRanges: Object.freeze([{
      firstFrame: 218,
      lastFrame: 275,
      reason:
        "Frames 218..275 begin quiz, NewProblem, Q2/Q3, answer, and feedback states whose causal transitions depend on unresolved ActionScript and host state.",
    }]),
    unresolvedTimelineCandidateIds: Object.freeze([
      "sprite-47",
      "sprite-84",
      "sprite-96",
      "sprite-124",
      "sprite-138",
      "sprite-144",
      "sprite-168",
      "sprite-177",
      "sprite-189",
      "sprite-201",
      "sprite-210",
      "sprite-219",
    ]),
  }),
  "course-g05-l04-ts-007": Object.freeze({
    frameDomainId: "sprite-462",
    nestedFrameCount: 684,
    renderedFrameCount: 263,
    blockedLocalFrameRanges: Object.freeze([{
      firstFrame: 264,
      lastFrame: 684,
      reason:
        "Frames 264..684 begin the first stop- and release-handler-controlled interaction and include later staged interactions whose progression depends on unresolved ActionScript and host state.",
    }]),
    unresolvedTimelineCandidateIds: Object.freeze([
      "sprite-62",
      "sprite-64",
      "sprite-107",
      "sprite-158",
      "sprite-195",
      "sprite-251",
      "sprite-269",
      "sprite-274",
      "sprite-283",
      "sprite-294",
      "sprite-306",
      "sprite-340",
      "sprite-352",
      "sprite-365",
      "sprite-397",
      "sprite-403",
      "sprite-427",
      "sprite-436",
      "sprite-460",
    ]),
  }),
  "course-g05-l04-ts-008": Object.freeze({
    frameDomainId: "sprite-435",
    nestedFrameCount: 695,
    renderedFrameCount: 272,
    blockedLocalFrameRanges: Object.freeze([{
      firstFrame: 273,
      lastFrame: 695,
      reason:
        "Frames 273..695 begin the first stop- and release-handler-controlled interaction and include later staged interactions whose progression depends on unresolved ActionScript and host state.",
    }]),
    unresolvedTimelineCandidateIds: Object.freeze([
      "sprite-73",
      "sprite-75",
      "sprite-119",
      "sprite-163",
      "sprite-202",
      "sprite-224",
      "sprite-242",
      "sprite-247",
      "sprite-256",
      "sprite-267",
      "sprite-279",
      "sprite-313",
      "sprite-325",
      "sprite-338",
      "sprite-370",
      "sprite-376",
      "sprite-400",
      "sprite-409",
      "sprite-433",
    ]),
  }),
  "course-g05-l04-ir-001-a662633d": Object.freeze({
    frameDomainId: "sprite-53",
    nestedFrameCount: 136,
    sourceInstanceId: "animation",
    audioRequired: false,
    unresolvedTimelineCandidateIds: Object.freeze([
      "sprite-30",
      "sprite-31",
    ]),
  }),
  "course-g05-l04-vb-003": Object.freeze({
    frameDomainId: "sprite-95",
    nestedFrameCount: 175,
    sourceInstanceId: "animation",
    renderedFrameCount: 125,
    blockedLocalFrameRanges: Object.freeze([{
      firstFrame: 126,
      lastFrame: 175,
      reason:
        "Frames 126..175 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
    }]),
    unresolvedTimelineCandidateIds: Object.freeze([
      "sprite-66",
      "sprite-67",
      "sprite-68",
      "sprite-69",
      "sprite-70",
      "sprite-71",
      "sprite-72",
      "sprite-73",
      "sprite-74",
      "sprite-75",
      "sprite-76",
      "sprite-88",
      "sprite-90",
      "sprite-94",
    ]),
  }),
  "course-g05-l04-vb-004": Object.freeze({
    frameDomainId: "sprite-71",
    nestedFrameCount: 257,
    sourceInstanceId: "animation",
    renderedFrameCount: 208,
    blockedLocalFrameRanges: Object.freeze([{
      firstFrame: 209,
      lastFrame: 257,
      reason:
        "Frames 209..257 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
    }]),
    unresolvedTimelineCandidateIds: Object.freeze([
      "sprite-43",
      "sprite-44",
      "sprite-45",
      "sprite-46",
      "sprite-47",
      "sprite-48",
      "sprite-49",
      "sprite-50",
      "sprite-51",
      "sprite-52",
      "sprite-64",
      "sprite-68",
      "sprite-70",
    ]),
  }),
  "course-g05-l04-in-006": Object.freeze({
    frameDomainId: "sprite-103",
    nestedFrameCount: 464,
    sourceInstanceId: "animation",
    renderedFrameCount: 413,
    blockedLocalFrameRanges: Object.freeze([{
      firstFrame: 414,
      lastFrame: 464,
      reason:
        "Frames 414..464 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
    }]),
    unresolvedTimelineCandidateIds: Object.freeze([
      "sprite-68",
      "sprite-70",
      "sprite-72",
      "sprite-74",
      "sprite-76",
      "sprite-78",
      "sprite-80",
      "sprite-82",
      "sprite-94",
      "sprite-98",
      "sprite-100",
      "sprite-102",
    ]),
  }),
  "course-g05-l04-in-008": Object.freeze({
    frameDomainId: "sprite-123",
    nestedFrameCount: 195,
    sourceInstanceId: "animation",
    renderedFrameCount: 121,
    blockedLocalFrameRanges: Object.freeze([{
      firstFrame: 122,
      lastFrame: 195,
      reason:
        "Frames 122..195 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
    }]),
    unresolvedTimelineCandidateIds: Object.freeze([
      "sprite-57",
      "sprite-89",
      "sprite-91",
      "sprite-93",
      "sprite-95",
      "sprite-97",
      "sprite-99",
      "sprite-101",
      "sprite-103",
      "sprite-112",
      "sprite-116",
      "sprite-118",
      "sprite-120",
      "sprite-122",
    ]),
  }),
  "course-g05-l04-in-011": Object.freeze({
    frameDomainId: "sprite-231",
    nestedFrameCount: 428,
    sourceInstanceId: "animation",
    renderedFrameCount: 341,
    blockedLocalFrameRanges: Object.freeze([{
      firstFrame: 342,
      lastFrame: 428,
      reason:
        "Frames 342..428 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
    }]),
    unresolvedTimelineCandidateIds: Object.freeze([
      "sprite-195",
      "sprite-197",
      "sprite-199",
      "sprite-201",
      "sprite-203",
      "sprite-205",
      "sprite-207",
      "sprite-209",
      "sprite-211",
      "sprite-213",
      "sprite-222",
      "sprite-226",
      "sprite-228",
      "sprite-230",
    ]),
  }),
  "course-g05-l04-in-019": Object.freeze({
    frameDomainId: "sprite-265",
    nestedFrameCount: 274,
    sourceInstanceId: "animation",
    renderedFrameCount: 220,
    blockedLocalFrameRanges: Object.freeze([{
      firstFrame: 221,
      lastFrame: 274,
      reason:
        "Frames 221..274 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
    }]),
    unresolvedTimelineCandidateIds: Object.freeze([
      "sprite-73",
      "sprite-74",
      "sprite-76",
      "sprite-78",
      "sprite-79",
      "sprite-80",
      "sprite-82",
      "sprite-83",
      "sprite-85",
      "sprite-86",
      "sprite-88",
      "sprite-89",
      "sprite-90",
      "sprite-130",
      "sprite-139",
      "sprite-151",
      "sprite-154",
      "sprite-157",
      "sprite-165",
      "sprite-172",
      "sprite-174",
      "sprite-178",
      "sprite-204",
      "sprite-237",
      "sprite-251",
      "sprite-264",
    ]),
  }),
  "course-g05-l04-in-021": Object.freeze({
    frameDomainId: "sprite-97",
    nestedFrameCount: 288,
    sourceInstanceId: "animation",
    renderedFrameCount: 286,
    blockedLocalFrameRanges: Object.freeze([{
      firstFrame: 287,
      lastFrame: 288,
      reason:
        "Frames 287..288 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
    }]),
    unresolvedTimelineCandidateIds: Object.freeze([
      "sprite-46",
      "sprite-50",
      "sprite-54",
      "sprite-58",
      "sprite-62",
      "sprite-66",
      "sprite-70",
      "sprite-72",
      "sprite-73",
      "sprite-74",
      "sprite-75",
      "sprite-76",
      "sprite-77",
      "sprite-78",
      "sprite-90",
      "sprite-92",
      "sprite-96",
    ]),
  }),
  "course-g05-l04-in-022": Object.freeze({
    frameDomainId: "sprite-355",
    nestedFrameCount: 475,
    sourceInstanceId: "animation",
    renderedFrameCount: 411,
    blockedLocalFrameRanges: Object.freeze([{
      firstFrame: 412,
      lastFrame: 475,
      reason:
        "Frames 412..475 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
    }]),
    unresolvedTimelineCandidateIds: Object.freeze([
      "sprite-71",
      "sprite-72",
      "sprite-73",
      "sprite-74",
      "sprite-75",
      "sprite-77",
      "sprite-79",
      "sprite-81",
      "sprite-83",
      "sprite-85",
      "sprite-94",
      "sprite-161",
      "sprite-163",
      "sprite-164",
      "sprite-190",
      "sprite-237",
      "sprite-261",
      "sprite-281",
      "sprite-348",
      "sprite-350",
      "sprite-354",
    ]),
  }),
  "course-g05-l04-ti-002": Object.freeze({
    frameDomainId: "sprite-413",
    nestedFrameCount: 275,
    sourceInstanceId: "animation",
    renderedFrameCount: 256,
    blockedLocalFrameRanges: Object.freeze([{
      firstFrame: 257,
      lastFrame: 275,
      reason:
        "Frames 257..275 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
    }]),
    unresolvedTimelineCandidateIds: Object.freeze([
      "sprite-70",
      "sprite-78",
      "sprite-82",
      "sprite-86",
      "sprite-90",
      "sprite-93",
      "sprite-95",
      "sprite-97",
      "sprite-99",
      "sprite-101",
      "sprite-145",
      "sprite-146",
      "sprite-147",
      "sprite-148",
      "sprite-150",
      "sprite-151",
      "sprite-152",
      "sprite-153",
      "sprite-155",
      "sprite-156",
      "sprite-157",
      "sprite-158",
      "sprite-188",
      "sprite-203",
      "sprite-206",
      "sprite-275",
      "sprite-277",
      "sprite-278",
      "sprite-304",
      "sprite-351",
      "sprite-375",
      "sprite-395",
      "sprite-399",
      "sprite-401",
      "sprite-403",
      "sprite-412",
    ]),
  }),
  "course-g05-l04-ti-003": Object.freeze({
    frameDomainId: "sprite-270",
    nestedFrameCount: 164,
    sourceInstanceId: "animation",
    renderedFrameCount: 162,
    blockedLocalFrameRanges: Object.freeze([{
      firstFrame: 163,
      lastFrame: 164,
      reason:
        "Frames 163..164 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
    }]),
    unresolvedTimelineCandidateIds: Object.freeze([
      "sprite-89",
      "sprite-90",
      "sprite-91",
      "sprite-92",
      "sprite-93",
      "sprite-94",
      "sprite-95",
      "sprite-96",
      "sprite-97",
      "sprite-98",
      "sprite-100",
      "sprite-111",
      "sprite-113",
      "sprite-115",
      "sprite-117",
      "sprite-137",
      "sprite-141",
      "sprite-173",
      "sprite-198",
      "sprite-204",
      "sprite-228",
      "sprite-238",
      "sprite-247",
      "sprite-269",
    ]),
  }),
  "course-g05-l04-ti-004": Object.freeze({
    frameDomainId: "sprite-299",
    nestedFrameCount: 472,
    sourceInstanceId: "animation",
    renderedFrameCount: 197,
    blockedLocalFrameRanges: Object.freeze([{
      firstFrame: 198,
      lastFrame: 472,
      reason:
        "Frames 198..472 begin a stop- and answer-handler-controlled quiz; attempt/scoring branches, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
    }]),
    unresolvedTimelineCandidateIds: Object.freeze([
      "sprite-99",
      "sprite-114",
      "sprite-116",
      "sprite-118",
      "sprite-120",
      "sprite-159",
      "sprite-163",
      "sprite-195",
      "sprite-220",
      "sprite-226",
      "sprite-250",
      "sprite-260",
      "sprite-269",
      "sprite-291",
    ]),
  }),
  "course-g05-l04-ti-005": Object.freeze({
    frameDomainId: "sprite-272",
    nestedFrameCount: 363,
    sourceInstanceId: "animation",
    renderedFrameCount: 137,
    blockedLocalFrameRanges: Object.freeze([{
      firstFrame: 138,
      lastFrame: 363,
      reason:
        "Frames 138..363 begin a stop- and answer-handler-controlled quiz; attempt/scoring branches, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
    }]),
    unresolvedTimelineCandidateIds: Object.freeze([
      "sprite-107",
      "sprite-109",
      "sprite-111",
      "sprite-113",
      "sprite-137",
      "sprite-141",
      "sprite-173",
      "sprite-198",
      "sprite-204",
      "sprite-228",
      "sprite-238",
      "sprite-246",
      "sprite-268",
    ]),
  }),
  "course-g05-l04-ti-006": Object.freeze({
    frameDomainId: "sprite-191",
    nestedFrameCount: 237,
    sourceInstanceId: "animation",
    renderedFrameCount: 187,
    blockedLocalFrameRanges: Object.freeze([{
      firstFrame: 188,
      lastFrame: 237,
      reason:
        "Frames 188..237 begin a stop- and answer-handler-controlled quiz; attempt/scoring branches, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
    }]),
    unresolvedTimelineCandidateIds: Object.freeze([
      "sprite-134",
      "sprite-136",
      "sprite-138",
      "sprite-140",
      "sprite-144",
      "sprite-146",
      "sprite-157",
      "sprite-159",
      "sprite-161",
      "sprite-163",
      "sprite-185",
    ]),
  }),
  "course-g05-l04-ti-007": Object.freeze({
    frameDomainId: "sprite-177",
    nestedFrameCount: 167,
    sourceInstanceId: "animation",
    renderedFrameCount: 111,
    blockedLocalFrameRanges: Object.freeze([{
      firstFrame: 112,
      lastFrame: 167,
      reason:
        "Frames 112..167 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
    }]),
    unresolvedTimelineCandidateIds: Object.freeze([
      "sprite-104",
      "sprite-105",
      "sprite-106",
      "sprite-108",
      "sprite-109",
      "sprite-111",
      "sprite-112",
      "sprite-113",
      "sprite-114",
      "sprite-115",
      "sprite-116",
      "sprite-117",
      "sprite-119",
      "sprite-131",
      "sprite-133",
      "sprite-135",
      "sprite-137",
      "sprite-171",
      "sprite-175",
    ]),
  }),
  "course-g05-l04-ti-008": Object.freeze({
    frameDomainId: "sprite-160",
    nestedFrameCount: 146,
    sourceInstanceId: "animation",
    renderedFrameCount: 94,
    blockedLocalFrameRanges: Object.freeze([{
      firstFrame: 95,
      lastFrame: 146,
      reason:
        "Frames 95..146 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
    }]),
    unresolvedTimelineCandidateIds: Object.freeze([
      "sprite-88",
      "sprite-89",
      "sprite-91",
      "sprite-92",
      "sprite-94",
      "sprite-96",
      "sprite-99",
      "sprite-100",
      "sprite-102",
      "sprite-103",
      "sprite-105",
      "sprite-107",
      "sprite-109",
      "sprite-121",
      "sprite-123",
      "sprite-125",
      "sprite-127",
      "sprite-155",
      "sprite-159",
    ]),
  }),
  "course-g05-l04-ti-009": Object.freeze({
    frameDomainId: "sprite-171",
    nestedFrameCount: 114,
    sourceInstanceId: "animation",
    renderedFrameCount: 96,
    blockedLocalFrameRanges: Object.freeze([{
      firstFrame: 97,
      lastFrame: 114,
      reason:
        "Frames 97..114 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
    }]),
    unresolvedTimelineCandidateIds: Object.freeze([
      "sprite-91",
      "sprite-92",
      "sprite-94",
      "sprite-95",
      "sprite-97",
      "sprite-99",
      "sprite-102",
      "sprite-103",
      "sprite-104",
      "sprite-105",
      "sprite-106",
      "sprite-107",
      "sprite-108",
      "sprite-109",
      "sprite-111",
      "sprite-123",
      "sprite-125",
      "sprite-127",
      "sprite-129",
      "sprite-166",
      "sprite-170",
    ]),
  }),
  "course-g05-l04-gs-002": Object.freeze({
    frameDomainId: "sprite-436",
    nestedFrameCount: 460,
    sourceInstanceId: "animation",
    renderedFrameCount: 451,
    blockedLocalFrameRanges: Object.freeze([{
      firstFrame: 452,
      lastFrame: 460,
      reason:
        "Frames 452..460 begin a stop- and release-handler-controlled randomized game; question selection, scoring/timer state, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
    }]),
    unresolvedTimelineCandidateIds: Object.freeze([
      "sprite-53",
      "sprite-101",
      "sprite-104",
      "sprite-114",
      "sprite-117",
      "sprite-120",
      "sprite-122",
      "sprite-124",
      "sprite-126",
      "sprite-129",
      "sprite-133",
      "sprite-135",
      "sprite-138",
      "sprite-139",
      "sprite-140",
      "sprite-142",
      "sprite-145",
      "sprite-147",
      "sprite-149",
      "sprite-172",
      "sprite-238",
      "sprite-243",
      "sprite-245",
      "sprite-254",
      "sprite-256",
      "sprite-262",
      "sprite-266",
      "sprite-269",
      "sprite-272",
      "sprite-277",
      "sprite-279",
      "sprite-283",
      "sprite-285",
      "sprite-288",
      "sprite-290",
      "sprite-294",
      "sprite-296",
      "sprite-300",
      "sprite-305",
      "sprite-309",
      "sprite-310",
      "sprite-312",
      "sprite-314",
      "sprite-316",
      "sprite-318",
      "sprite-322",
      "sprite-325",
      "sprite-328",
      "sprite-331",
      "sprite-335",
      "sprite-336",
      "sprite-339",
      "sprite-341",
      "sprite-343",
      "sprite-344",
      "sprite-354",
      "sprite-356",
      "sprite-359",
      "sprite-362",
      "sprite-365",
      "sprite-367",
      "sprite-369",
      "sprite-370",
      "sprite-371",
      "sprite-372",
      "sprite-377",
      "sprite-381",
      "sprite-385",
      "sprite-388",
      "sprite-391",
      "sprite-392",
      "sprite-395",
      "sprite-396",
      "sprite-399",
      "sprite-403",
      "sprite-411",
      "sprite-415",
      "sprite-419",
      "sprite-422",
      "sprite-425",
      "sprite-426",
      "sprite-429",
      "sprite-431",
      "sprite-433",
      "sprite-435",
    ]),
  }),
  "course-g05-l04-fq-001": Object.freeze({
    candidateKind: "dual-sprite-composite-prefix",
    frameDomainId: "sprite-145",
    nestedFrameCount: 52,
    renderedFrameCount: 52,
    companionFrameDomainId: "sprite-100",
    companionFrameCount: 1,
    canonicalFrameDomainDisposition: "unresolved",
    manifestBound: false,
    nestedCoverageDeclared: false,
  }),
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sourceStaticCandidateFrameBoundary(profile) {
  const renderedFrameCount =
    profile.renderedFrameCount ?? profile.nestedFrameCount;
  invariant(
    Number.isSafeInteger(renderedFrameCount) &&
      renderedFrameCount > 0 &&
      renderedFrameCount <= profile.nestedFrameCount,
    `${profile.frameDomainId}: rendered source-static frame count is invalid`,
  );
  if (renderedFrameCount === profile.nestedFrameCount) {
    invariant(
      profile.blockedLocalFrameRanges === undefined,
      `${profile.frameDomainId}: full source-static profile cannot declare blocked frames`,
    );
    return {renderedFrameCount};
  }
  const blockedLocalFrameRanges = profile.blockedLocalFrameRanges;
  invariant(
    Array.isArray(blockedLocalFrameRanges) &&
      blockedLocalFrameRanges.length === 1 &&
      blockedLocalFrameRanges[0]?.firstFrame === renderedFrameCount + 1 &&
      blockedLocalFrameRanges[0]?.lastFrame === profile.nestedFrameCount,
    `${profile.frameDomainId}: partial source-static profile must block one exact tail range`,
  );
  return {
    renderedFrameCount,
    sourceStaticRenderableFrames: {
      firstFrame: 1,
      lastFrame: renderedFrameCount,
      frameCount: renderedFrameCount,
    },
    blockedLocalFrameRanges,
  };
}

function sourceStaticCandidateDisposition(profile) {
  const boundary = sourceStaticCandidateFrameBoundary(profile);
  return {
    candidateKind:
      profile.candidateKind ??
      (boundary.renderedFrameCount === profile.nestedFrameCount
        ? "single-sprite-full"
        : "single-sprite-safe-prefix"),
    sourceStaticFrameDomainId: profile.frameDomainId,
    canonicalFrameCount: profile.nestedFrameCount,
    openFrameCount: boundary.renderedFrameCount,
    blockedTailFrameCount:
      profile.nestedFrameCount - boundary.renderedFrameCount,
    companionFrameDomainId: profile.companionFrameDomainId ?? null,
    companionFrameCount: profile.companionFrameCount ?? 0,
    canonicalFrameDomainDisposition:
      profile.canonicalFrameDomainDisposition ??
      "declared-conservative-nested-domain",
    nestedCoverageDeclared: profile.nestedCoverageDeclared !== false,
    manifestBound: profile.manifestBound !== false,
  };
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, stable(value[key])]),
  );
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function allFalse(object, keys, label) {
  for (const key of keys) {
    invariant(object?.[key] === false, `${label}.${key} must remain false`);
  }
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function resolveProjectPath(projectRoot, relativePath, label = relativePath) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath) &&
      !relativePath.includes("\\"),
    `${label}: path must be project-relative and portable`,
  );
  const absolutePath = path.resolve(projectRoot, relativePath);
  invariant(
    isWithin(projectRoot, absolutePath) &&
      portable(path.relative(projectRoot, absolutePath)) === relativePath,
    `${label}: path escapes the project root or is not normalized`,
  );
  return absolutePath;
}

function statIdentity(information) {
  return {
    dev: String(information.dev),
    ino: String(information.ino),
    mode: String(information.mode),
    size: String(information.size),
    mtimeNs: String(information.mtimeNs),
    ctimeNs: String(information.ctimeNs),
    nlink: String(information.nlink),
  };
}

function sameStatIdentity(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function lstatOrNull(candidate) {
  try {
    return await lstat(candidate, {bigint: true});
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function assertOrdinaryAncestorTree(
  projectRoot,
  absolutePath,
  label,
) {
  const relativeParent = path.relative(projectRoot, path.dirname(absolutePath));
  invariant(
    relativeParent !== ".." &&
      !relativeParent.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relativeParent),
    `${label}: parent escapes project root`,
  );
  const parts = relativeParent.split(path.sep).filter(Boolean);
  const ancestors = [
    projectRoot,
    ...parts.map((_, index) =>
      path.join(projectRoot, ...parts.slice(0, index + 1))),
  ];
  for (const ancestor of ancestors) {
    const information = await lstat(ancestor, {bigint: true}).catch(
      (error) => {
        throw new Error(
          `${label}: ancestor is unavailable (${error.message})`,
        );
      },
    );
    invariant(
      information.isDirectory() && !information.isSymbolicLink(),
      `${label}: ancestor must be a real directory`,
    );
  }
  const [realRoot, realParent] = await Promise.all([
    realpath(projectRoot),
    realpath(path.dirname(absolutePath)),
  ]);
  invariant(
    isWithin(realRoot, realParent),
    `${label}: real parent escapes project root`,
  );
}

async function readStableFile(
  projectRoot,
  relativePath,
  {
    json = false,
    label = relativePath,
    allowMissing = false,
    retainContents = true,
  } = {},
) {
  const absolutePath = resolveProjectPath(projectRoot, relativePath, label);
  await assertOrdinaryAncestorTree(projectRoot, absolutePath, label);
  const before = await lstatOrNull(absolutePath);
  if (!before) {
    invariant(allowMissing, `${label}: file is missing`);
    return {
      path: relativePath,
      absolutePath,
      exists: false,
      bytes: 0,
      sha256: "",
      contents: null,
      document: null,
      stat: null,
    };
  }
  invariant(
    before.isFile() &&
      !before.isSymbolicLink() &&
      before.nlink === 1n,
    `${label}: expected one ordinary single-link file`,
  );
  const [realRoot, realFile] = await Promise.all([
    realpath(projectRoot),
    realpath(absolutePath),
  ]);
  invariant(isWithin(realRoot, realFile), `${label}: real path escapes project root`);
  const handle = await open(
    absolutePath,
    fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW || 0),
  );
  let descriptorBefore;
  let descriptorAfter;
  let contents;
  try {
    descriptorBefore = await handle.stat({bigint: true});
    invariant(
      descriptorBefore.isFile() &&
        descriptorBefore.nlink === 1n &&
        sameStatIdentity(
          statIdentity(before),
          statIdentity(descriptorBefore),
        ),
      `${label}: changed before stable read`,
    );
    contents = await handle.readFile();
    descriptorAfter = await handle.stat({bigint: true});
    invariant(
      sameStatIdentity(
        statIdentity(descriptorBefore),
        statIdentity(descriptorAfter),
      ),
      `${label}: changed during stable read`,
    );
  } finally {
    await handle.close();
  }
  const after = await lstat(absolutePath, {bigint: true});
  invariant(
    sameStatIdentity(statIdentity(descriptorAfter), statIdentity(after)) &&
      (await realpath(absolutePath)) === realFile &&
      contents.length === Number(after.size),
    `${label}: changed after stable read`,
  );
  let document = null;
  if (json) {
    try {
      document = JSON.parse(contents.toString("utf8"));
    } catch (error) {
      throw new Error(`${label}: invalid JSON (${error.message})`);
    }
  }
  return {
    path: relativePath,
    absolutePath,
    exists: true,
    bytes: contents.length,
    sha256: sha256(contents),
    contents: retainContents ? contents : null,
    document,
    stat: statIdentity(after),
  };
}

function descriptor(record) {
  return {
    path: record.path,
    bytes: record.bytes,
    sha256: record.sha256,
  };
}

function evidenceEntry(id, record) {
  return {id, ...descriptor(record)};
}

function assertUniqueEvidence(entries, id) {
  invariant(
    new Set(entries.map((entry) => entry.id)).size === entries.length,
    `${id}: evidence IDs must be unique`,
  );
  invariant(
    new Set(entries.map((entry) => entry.path)).size === entries.length,
    `${id}: evidence paths must be unique`,
  );
}

function selectRelease(document, expectedFingerprint) {
  invariant(
    document?.schemaVersion === 1 && Array.isArray(document.releases),
    "lesson-release catalog schema drifted",
  );
  const matches = document.releases.filter(
    ({releaseId}) => releaseId === G5_L4_RELEASE_ID,
  );
  invariant(matches.length === 1, `expected exactly one ${G5_L4_RELEASE_ID}`);
  const release = matches[0];
  invariant(
    release.publicationMode === "atomic" &&
      release.expectedCounts?.activeXmlReferencedPages ===
        EXPECTED_PAGE_COUNT &&
      release.expectedCounts?.courseShells === EXPECTED_SHELL_COUNT &&
      release.expectedCounts?.members === EXPECTED_MEMBER_COUNT &&
      Array.isArray(release.members) &&
      release.members.length === EXPECTED_MEMBER_COUNT,
    "G5 L4 release cardinality or atomic-publication boundary drifted",
  );
  invariant(
    release.members.every(
      (member, index) =>
        member.ordinal === index + 1 &&
        SAFE_ID.test(member.animationId || "") &&
        member.assetId === `swf-${member.source?.sha256}`,
    ) &&
      new Set(release.members.map(({animationId}) => animationId)).size ===
        EXPECTED_MEMBER_COUNT &&
      new Set(release.members.map(({assetId}) => assetId)).size ===
        EXPECTED_MEMBER_COUNT,
    "G5 L4 ordered member identity drifted",
  );
  const fingerprint = sha256(Buffer.from(stableJson(release)));
  invariant(fingerprint === expectedFingerprint, "G5 L4 release fingerprint drifted");
  return {release, fingerprint};
}

function validateSourceScope(sourceScope, release) {
  invariant(
    sourceScope?.schemaVersion === 1 &&
      sourceScope.reportType === "g5-l4-source-scope-freeze" &&
      sourceScope.releaseId === G5_L4_RELEASE_ID &&
      sourceScope.summary?.pageCount === EXPECTED_PAGE_COUNT &&
      sourceScope.summary?.shellCount === EXPECTED_SHELL_COUNT &&
      sourceScope.summary?.memberCount === EXPECTED_MEMBER_COUNT &&
      sourceScope.summary?.pairedFlaSwfCount === 44 &&
      sourceScope.summary?.swfOnlyCount === 11 &&
      sourceScope.summary?.strictCompleteCount === 0 &&
      sourceScope.summary?.publishedCount === 0 &&
      Array.isArray(sourceScope.members) &&
      sourceScope.members.length === EXPECTED_MEMBER_COUNT,
    "G5 L4 source scope drifted or crossed a release boundary",
  );
  allFalse(
    sourceScope.acceptanceEffects,
    Object.keys(sourceScope.acceptanceEffects || {}).filter(
      (key) => key !== "draftWorkspaceShapeOnly",
    ),
    "G5 L4 source scope",
  );
  for (let index = 0; index < release.members.length; index += 1) {
    const member = release.members[index];
    const scoped = sourceScope.members[index];
    invariant(
      scoped?.ordinal === member.ordinal &&
        scoped.animationId === member.animationId &&
        scoped.assetId === member.assetId &&
        scoped.source?.swf?.path === member.source.path &&
        scoped.source?.swf?.sha256 === member.source.sha256 &&
        scoped.strictComplete === false,
      `${member.animationId}: source-scope membership drifted`,
    );
  }
}

function validateAudioOwnership(audioOwnership, release) {
  invariant(
    audioOwnership?.schemaVersion === 1 &&
      audioOwnership.reportType ===
        "lesson-audio-ownership-machine-readiness" &&
      audioOwnership.releaseId === G5_L4_RELEASE_ID &&
      audioOwnership.summary?.memberCount === EXPECTED_MEMBER_COUNT &&
      audioOwnership.summary?.dedicatedMachineAudioAuditPresentCount ===
        EXPECTED_MEMBER_COUNT &&
      audioOwnership.summary?.authorizedOriginalRuntimeListeningSessionCount ===
        0 &&
      audioOwnership.summary?.audioAcceptedFileCount === 0 &&
      audioOwnership.summary?.audioAcceptedMemberCount === 0 &&
      audioOwnership.summary?.strictCompleteMemberCount === 0 &&
      audioOwnership.summary?.publishedMemberCount === 0 &&
      Array.isArray(audioOwnership.memberPlans) &&
      audioOwnership.memberPlans.length === EXPECTED_MEMBER_COUNT,
    "G5 L4 audio ownership drifted or crossed listening acceptance",
  );
  for (let index = 0; index < release.members.length; index += 1) {
    const member = release.members[index];
    const plan = audioOwnership.memberPlans[index];
    invariant(
      plan?.ordinal === member.ordinal &&
        plan.animationId === member.animationId &&
        plan.assetId === member.assetId &&
        plan.source?.sha256 === member.source.sha256 &&
        plan.acceptance?.audioAccepted === false &&
        plan.acceptance.humanReviewAccepted === false &&
        plan.acceptance.ownerAccepted === false &&
        plan.acceptance.strictComplete === false &&
        plan.acceptance.published === false,
      `${member.animationId}: audio-ownership membership drifted`,
    );
  }
}

function validateCalibration(calibration, release) {
  invariant(
    calibration?.schemaVersion === 1 &&
      Array.isArray(calibration.calibrationSets),
    "calibration catalog schema drifted",
  );
  const matches = calibration.calibrationSets.filter(
    ({releaseId}) => releaseId === G5_L4_RELEASE_ID,
  );
  invariant(matches.length === 1, "G5 L4 calibration set is missing or duplicated");
  const selected = matches[0];
  invariant(
    Array.isArray(selected.members) &&
      selected.members.length === 8 &&
      new Set(selected.members.map(({animationId}) => animationId)).size === 8,
    "G5 L4 eight-member risk calibration set drifted",
  );
  invariant(
    JSON.stringify(selected.humanWorkStudy?.memberAnimationIds) ===
      JSON.stringify(G5_L4_WORK_STUDY_READINESS_IDS) &&
      Array.isArray(selected.humanWorkStudy.requiredPhases) &&
      selected.humanWorkStudy.requiredPhases.length === 4 &&
      new Set(selected.humanWorkStudy.requiredPhases).size === 4 &&
      typeof selected.humanWorkStudy.measurementRule === "string" &&
      selected.humanWorkStudy.measurementRule.includes("Do not infer"),
    "G5 L4 four-member human work-study selection drifted",
  );
  const releaseIds = new Set(release.members.map(({animationId}) => animationId));
  invariant(
    selected.members.every(
      ({animationId, intendedAxes}) =>
        releaseIds.has(animationId) &&
        Array.isArray(intendedAxes) &&
        intendedAxes.length > 0,
    ) &&
      G5_L4_WORK_STUDY_READINESS_IDS.every((id) => releaseIds.has(id)),
    "G5 L4 calibration members are outside the exact release",
  );
  return {
    selected,
    riskMembers: new Map(
      selected.members.map((member) => [member.animationId, member]),
    ),
  };
}

function sourceStaticCandidateProfile(animationId) {
  return G5_L4_SOURCE_STATIC_CANDIDATE_PROFILES[animationId] ?? null;
}

function validateSourceStaticCandidateManifest(manifest, member, profile) {
  const animationId = member.animationId;
  const implementation = manifest.implementation;
  if (profile.manifestBound === false) {
    invariant(
      profile.candidateKind === "dual-sprite-composite-prefix" &&
        implementation?.rendering === "undecided" &&
        implementation.route === "" &&
        implementation.routeFile === "" &&
        implementation.component === "" &&
        implementation.registryModule === "" &&
        implementation.timelineModule === "" &&
        implementation.testFile === "" &&
        implementation.standalonePackage === "" &&
        implementation.defaultFrameDomainId === "root" &&
        stableJson(implementation.frameDomains) === stableJson([{
          id: "root",
          kind: "root",
          sourceTimelineId: "root",
          parentFrameDomainId: null,
          frameCount: manifest.runtime.frameCount,
          scenarioIds: ["default"],
        }]) &&
        implementation.candidateState === undefined &&
        implementation.capturePlanning === undefined &&
        implementation.candidateMaturity?.status ===
          "current-javascript-engineering-candidate-only" &&
        implementation.candidateMaturity.candidateKind ===
          "dual-sprite-composite-prefix" &&
        implementation.candidateMaturity.bindingAuthority ===
          "independent-fq001-composite-evidence-only" &&
        implementation.candidateMaturity.route ===
          `/animations/${animationId}` &&
        implementation.candidateMaturity.publicComposite?.frameDomain ===
          profile.frameDomainId &&
        implementation.candidateMaturity.publicComposite.openFrameCount ===
          profile.renderedFrameCount &&
        implementation.candidateMaturity.publicComposite
          .fixedCompanionFrameDomain === profile.companionFrameDomainId &&
        implementation.candidateMaturity.canonicalFrameDomainsChanged ===
          false &&
        implementation.candidateMaturity
          .canonicalFrameDomainDisposition === "unresolved" &&
        implementation.candidateMaturity.canonicalNestedCoverageDeclared ===
          false &&
        implementation.candidateMaturity.rootEnabled === false &&
        implementation.candidateMaturity.companionStandaloneEnabled ===
          false &&
        implementation.candidateMaturity.spanishEnabled === false &&
        implementation.candidateMaturity.audioEnabled === false &&
        implementation.candidateMaturity.sourceControlsEnabled === false &&
        implementation.candidateMaturity.replayParityEstablished === false &&
        implementation.candidateMaturity.originalRuntimeBaselineUsed ===
          false &&
        implementation.candidateMaturity.rmseComputed === false &&
        implementation.candidateMaturity.humanVisualReviewPerformed ===
          false &&
        implementation.candidateMaturity.ownerReviewPerformed === false &&
        implementation.candidateMaturity.implementationAuthorized === false &&
        implementation.candidateMaturity.strictAcceptanceEffect === "none",
      `${animationId}: unresolved canonical manifest was altered to impersonate the dual-sprite composite candidate`,
    );
    return;
  }
  const rootDomain = {
    id: "root",
    kind: "root",
    sourceTimelineId: "root",
    sourceInstanceId: "root",
    parentFrameDomainId: null,
    frameCount: manifest.runtime.frameCount,
    scenarioIds: ["root-unavailable"],
    role: "root-host-entry-unavailable",
  };
  const nestedDomain = {
    id: profile.frameDomainId,
    kind: "nested",
    sourceTimelineId: profile.frameDomainId,
    sourceInstanceId: profile.sourceInstanceId ?? "animation",
    parentFrameDomainId: "root",
    parentEntryFrame: 6,
    localEntryFrame: 1,
    frameCount: profile.nestedFrameCount,
    scenarioIds: ["source-static-frame"],
    role: "main-teaching-animation-source-static-candidate",
  };
  invariant(
    implementation?.rendering ===
      "source-static Canvas engineering candidate; root host entry, Spanish visuals, audio, source controls, Replay, natural runtime reachability, original-runtime parity, and strict fidelity fail closed" &&
      implementation.route === `/animations/${animationId}` &&
      implementation.routeFile ===
        "apps/web/app/[locale]/animations/[animationId]/page.tsx" &&
      implementation.component ===
        `packages/demos/src/modules/${animationId}.tsx` &&
      implementation.registryModule === `./modules/${animationId}` &&
      implementation.timelineModule ===
        `packages/demos/src/timelines/${animationId}.ts` &&
      implementation.testFile ===
        "packages/demos/tests/course-g05-l04-source-static.test.ts" &&
      implementation.standalonePackage === "" &&
      implementation.defaultFrameDomainId === profile.frameDomainId &&
      stableJson(implementation.frameDomains) ===
        stableJson([rootDomain, nestedDomain]),
    `${animationId}: source-static candidate renderer or frame-domain binding drifted`,
  );
  invariant(
    stableJson(implementation.captureContract) === stableJson({
      frameParameter: "frame",
      frameDomainParameter: "frameDomain",
      requirementIdParameter: "requirementId",
      traceParameter: "trace",
      entryStateSha256Parameter: "entryStateSha256",
      scenarioParameter: "scenario",
      languageParameter: "lang",
      seedParameter: "seed",
      frameAttribute: "data-flash-frame",
      animationIdAttribute: "data-animation-id",
      frameDomainAttribute: "data-flash-frame-domain",
      requirementIdAttribute: "data-flash-requirement-id",
      traceAttribute: "data-flash-trace-id",
      entryStateSha256Attribute: "data-flash-entry-state-sha256",
    }),
    `${animationId}: source-static candidate capture contract drifted`,
  );
  invariant(
    stableJson(implementation.capturePlanning) === stableJson({
      state: "pending-authoritative-natural-trace",
      releaseId: G5_L4_RELEASE_ID,
      releaseSequence: member.ordinal,
      rootRequirementRangeIsValid: true,
      rootNaturalTraceExecuted: false,
      authoritativeScenarioInventoryEstablished: false,
      nestedFrameDomainDispositionEstablished: true,
      nestedFrameDomainDeclaredInCurrentManifest: true,
      conservativeNestedDomainRequirementsEstablished: true,
      conservativeNestedFrameDomainIds: [profile.frameDomainId],
      staticCompositeTimelineIds: [],
      sourceStaticCompositeCandidateTimelineIds: [],
      unresolvedTimelineCandidateIds:
        profile.unresolvedTimelineCandidateIds ?? [],
      authoritativeRuntimeFrameDomainDispositionEstablished: false,
      structuralFrameDomainPlanningClosed: false,
      runtimeReachabilityEstablished: false,
      strictAcceptanceEffect: "none",
    }),
    `${animationId}: source-static candidate planning boundary drifted`,
  );
  invariant(
    stableJson(implementation.candidateState) === stableJson({
      status: "current-javascript-engineering-candidate-only",
      report: "evidence/source-static-current-js-candidate.json",
      assetManifest:
        `public/flash-assets/courses/${animationId}/manifest.json`,
      runtimeScript:
        `public/flash-assets/courses/${animationId}/canvas-renderer.js`,
      sourceStaticFrameDomain: profile.frameDomainId,
      sourceStaticFrames: {
        firstFrame: 1,
        lastFrame: profile.nestedFrameCount,
      },
      ...sourceStaticCandidateFrameBoundary(profile),
      rootEnabled: false,
      spanishEnabled: false,
      audioEnabled: false,
      sourceControlsEnabled: false,
      replayParityEstablished: false,
      originalRuntimeBaselineUsed: false,
      rmseComputed: false,
      humanVisualReviewPerformed: false,
      ownerReviewPerformed: false,
      strictAcceptanceEffect: "none",
    }),
    `${animationId}: source-static candidate acceptance boundary drifted`,
  );
  invariant(
    stableJson(
      manifest.scenarios?.map(({id, kind, reachable}) => ({
        id,
        kind,
        reachable,
      })),
    ) === stableJson([
      {id: "root-unavailable", kind: "linear", reachable: true},
      {id: "source-static-frame", kind: "linear", reachable: true},
    ]) &&
      manifest.baseline?.authority === "undecided" &&
      manifest.baseline.renderer === "unresolved" &&
      manifest.baseline.route === "" &&
      manifest.baseline.routeFile === "" &&
      manifest.localization?.bilingualRequired === true &&
      stableJson(manifest.localization.languages) === stableJson(["en", "es"]) &&
      manifest.audio?.required === (profile.audioRequired ?? true),
    `${animationId}: source-static candidate unresolved fidelity boundary drifted`,
  );
  const evidence = manifest.evidence;
  invariant(
    evidence?.sourceStaticCandidateSpec ===
      "audit/source-static-current-js-candidate-spec.json" &&
      SHA256_PATTERN.test(evidence.sourceStaticCandidateSpecSha256 || "") &&
      evidence.currentJavascriptCandidateReport ===
        "evidence/source-static-current-js-candidate.json" &&
      SHA256_PATTERN.test(
        evidence.currentJavascriptCandidateReportSha256 || "",
      ) &&
      evidence.currentJavascriptAssetManifest ===
        `public/flash-assets/courses/${animationId}/manifest.json` &&
      SHA256_PATTERN.test(
        evidence.currentJavascriptAssetManifestSha256 || "",
      ) &&
      evidence.currentJavascriptRuntimeScript ===
        `public/flash-assets/courses/${animationId}/canvas-renderer.js` &&
      SHA256_PATTERN.test(
        evidence.currentJavascriptRuntimeScriptSha256 || "",
      ) &&
      evidence.currentJavascriptCandidateAuthority ===
        "non-authoritative-current-javascript-source-static-output" &&
      evidence.currentJavascriptCandidateStrictAcceptanceEffect === "none",
    `${animationId}: source-static candidate evidence binding drifted`,
  );
}

function validateFq001CompositeCandidateArtifacts(
  records,
  member,
  profile,
  manifest,
) {
  const spec = records.spec.document;
  const report = records.report.document;
  const disposition = records.disposition.document;
  const expectedId = "course-g05-l04-fq-001";
  invariant(
    member.animationId === expectedId &&
      profile.candidateKind === "dual-sprite-composite-prefix" &&
      profile.manifestBound === false &&
      profile.nestedCoverageDeclared === false,
    `${member.animationId}: invalid FQ001 composite profile`,
  );
  invariant(
    spec?.schemaVersion === 1 &&
      spec.animationId === expectedId &&
      spec.classification ===
        "source-static-dual-sprite-composite-current-javascript-engineering-candidate-only" &&
      spec.source?.swfSha256 === member.source.sha256 &&
      spec.source?.flaSha256 === manifest.source.flaSha256 &&
      spec.timeline?.public?.frameDomain === profile.frameDomainId &&
      spec.timeline.public.frameCount === profile.nestedFrameCount &&
      spec.timeline.public.firstFrame === 1 &&
      spec.timeline.public.lastFrame === profile.renderedFrameCount &&
      spec.timeline.fixedCompanion?.frameDomain ===
        profile.companionFrameDomainId &&
      spec.timeline.fixedCompanion.frameCount === profile.companionFrameCount &&
      spec.timeline.fixedCompanion.fixedFrame === 1 &&
      spec.timeline.fixedCompanion.standaloneRequestsEnabled === false &&
      spec.runtimeContract?.kind ===
        "source-static-dual-sprite-composite-prefix" &&
      spec.runtimeContract.rootRequestsEnabled === false &&
      spec.runtimeContract.companionStandaloneRequestsEnabled === false &&
      spec.runtimeContract.legacyActionScriptExecuted === false &&
      spec.runtimeContract.audioEnabled === false &&
      spec.runtimeContract.sourceControlsEnabled === false &&
      spec.runtimeContract.sourceReplayEstablished === false &&
      spec.strictAcceptanceEffect === "none",
    `${expectedId}: dual-sprite composite specification drifted`,
  );
  allFalse(
    spec.acceptanceEffects,
    Object.keys(spec.acceptanceEffects || {}),
    `${expectedId}: dual-sprite composite specification acceptance`,
  );
  invariant(
    report?.schemaVersion === 1 &&
      report.artifactType ===
        "g5-l4-fq001-dual-sprite-composite-current-javascript-candidate" &&
      report.animationId === expectedId &&
      report.status === "current-javascript-engineering-candidate-only" &&
      stableJson(report.specification) === stableJson(descriptor(records.spec)) &&
      report.renderer?.kind ===
        "safe-hash-bound-ffdec-dual-sprite-source-static-composite" &&
      report.renderer.primaryFrameDomain === profile.frameDomainId &&
      report.renderer.primaryFirstFrame === 1 &&
      report.renderer.primaryLastFrame === profile.renderedFrameCount &&
      report.renderer.fixedCompanionFrameDomain ===
        profile.companionFrameDomainId &&
      report.renderer.fixedCompanionFrame === 1 &&
      report.renderer.rootEnabled === false &&
      report.renderer.companionStandaloneEnabled === false &&
      stableJson(report.renderer.supportedLanguages) === stableJson(["en"]) &&
      report.renderer.audioEnabled === false &&
      report.renderer.sourceControlsEnabled === false &&
      report.renderer.runtimeScript?.script === records.runtimeScript.path &&
      report.renderer.runtimeScript.bytes === records.runtimeScript.bytes &&
      report.renderer.runtimeScript.sha256 === records.runtimeScript.sha256 &&
      report.renderer.runtimeManifest?.path === records.runtimeManifest.path &&
      report.renderer.runtimeManifest.sha256 === records.runtimeManifest.sha256 &&
      report.browserQa?.renderedFrameCount === profile.renderedFrameCount &&
      report.browserQa.rejectionCount === 14 &&
      report.browserQa.expectedRejectionCount === 14 &&
      report.browserQa.consoleErrorCount === 0 &&
      report.browserQa.pageErrorCount === 0 &&
      report.browserQa.unexpectedNetworkRequestCount === 0 &&
      report.evidenceBoundary?.canonicalFrameDomainDispositionChanged ===
        false &&
      report.evidenceBoundary.canonicalFrameDomainDispositionAccepted ===
        false &&
      report.evidenceBoundary.originalRuntimeBaselineUsed === false &&
      report.evidenceBoundary.authoritativeNaturalRuntimeEstablished ===
        false &&
      report.strictAcceptanceEffect === "none",
    `${expectedId}: dual-sprite composite candidate evidence drifted`,
  );
  allFalse(
    report.acceptanceEffects,
    Object.keys(report.acceptanceEffects || {}),
    `${expectedId}: dual-sprite composite candidate acceptance`,
  );
  const relevantTimelines = new Map(
    (disposition?.timelines || []).map((timeline) => [
      timeline.timelineId,
      timeline,
    ]),
  );
  invariant(
    disposition?.animationId === expectedId &&
      disposition.status ===
        "structurally-enumerated-dispositions-unresolved" &&
      disposition.summary?.dispositionCounts?.unresolved === 2 &&
      relevantTimelines.get(profile.frameDomainId)?.frameCount ===
        profile.nestedFrameCount &&
      relevantTimelines.get(profile.frameDomainId)?.disposition ===
        "unresolved" &&
      relevantTimelines.get(profile.companionFrameDomainId)?.frameCount ===
        profile.companionFrameCount &&
      relevantTimelines.get(profile.companionFrameDomainId)?.disposition ===
        "unresolved",
    `${expectedId}: canonical frame-domain disposition was promoted or drifted`,
  );
  invariant(
    records.registry.contents.includes(
      `'${expectedId}': () => import('./modules/${expectedId}')`,
    ) &&
      records.module.contents.includes(
        `../timelines/${expectedId}`,
      ) &&
      records.timeline.contents.includes(profile.frameDomainId) &&
      records.timeline.contents.includes(profile.companionFrameDomainId),
    `${expectedId}: registry, module, or timeline binding drifted`,
  );
}

export function validateG5L4StaticStrictReadinessManifest(
  manifest,
  member,
) {
  const profile = sourceStaticCandidateProfile(member.animationId);
  invariant(
    manifest?.schemaVersion === 2 &&
      manifest.id === member.animationId &&
      manifest.animationId === member.animationId &&
      manifest.assetId === member.assetId &&
      manifest.status === "preserved" &&
      manifest.source?.swfSha256 === member.source.sha256 &&
      manifest.source?.swf === `${SOURCE_ARCHIVE_PREFIX}${member.source.path}`,
    `${member.animationId}: manifest identity or source boundary drifted`,
  );
  if (profile) {
    validateSourceStaticCandidateManifest(manifest, member, profile);
  } else {
    invariant(
      manifest.implementation?.rendering === "undecided" &&
        manifest.implementation?.route === "",
      `${member.animationId}: manifest implementation boundary drifted`,
    );
  }
  return profile;
}

function validateMachineAudit(machineAudit, member, manifest) {
  invariant(
    machineAudit?.schemaVersion === 1 &&
      machineAudit.animationId === member.animationId &&
      machineAudit.auditStatus === "partial" &&
      machineAudit.source?.expectedSha256 === member.source.sha256 &&
      machineAudit.source?.hashMatches === true &&
      machineAudit.migrationStatusUnchanged === true &&
      machineAudit.findings?.runtimeCrossCheck?.allMatch === true &&
      machineAudit.findings?.ffdecHeader?.widthPx ===
        manifest.runtime.stage.width &&
      machineAudit.findings.ffdecHeader.heightPx ===
        manifest.runtime.stage.height &&
      machineAudit.findings.ffdecHeader.frameRate === manifest.runtime.fps &&
      machineAudit.findings.ffdecHeader.frameCount ===
        manifest.runtime.frameCount &&
      Number.isSafeInteger(machineAudit.findings.exportedScriptFileCount) &&
      Array.isArray(machineAudit.findings.externalCallCandidates),
    `${member.animationId}: machine audit drifted or crossed static evidence`,
  );
}

function validateSourceScopeBinding(binding, member, sourceScopeRecord) {
  invariant(
    binding?.schemaVersion === 1 &&
      binding.artifactType === "g5-l4-source-scope-binding" &&
      binding.releaseId === G5_L4_RELEASE_ID &&
      binding.scope?.path === sourceScopeRecord.path &&
      binding.scope.bytes === sourceScopeRecord.bytes &&
      binding.scope.sha256 === sourceScopeRecord.sha256 &&
      binding.member?.ordinal === member.ordinal &&
      binding.member.animationId === member.animationId &&
      binding.member.assetId === member.assetId &&
      binding.member.source?.swf?.path === member.source.path &&
      binding.member.source?.swf?.sha256 === member.source.sha256,
    `${member.animationId}: source-scope binding drifted`,
  );
  invariant(
    binding.acceptanceEffects?.draftWorkspaceShapeOnly === true,
    `${member.animationId}: source-scope draft boundary drifted`,
  );
  allFalse(binding.acceptanceEffects, [
    "authoritativeOriginalRuntime",
    "currentJavaScriptCandidate",
    "fullFrameComparison",
    "audioAccepted",
    "humanVisualAccepted",
    "ownerAccepted",
    "strictComplete",
    "published",
  ], `${member.animationId}: source-scope acceptance`);
}

function validateAudioEvidence(audio, member, audioPlan, manifestRecord) {
  invariant(
    audio?.schemaVersion === 2 &&
      audio.animationId === member.animationId &&
      audio.source?.expectedSha256 === member.source.sha256 &&
      audio.source?.hashMatches === true &&
      audio.acceptance?.structurallyAudited === true &&
      audio.acceptance.authoritativeListeningComplete === false &&
      audio.acceptance.hostStateTraversalComplete === false &&
      audio.acceptance.synchronizationComplete === false &&
      audio.acceptance.strictAudioAcceptance === "pending" &&
      audio.acceptance.releaseBoundary
        ?.authoritativeOriginalRuntimeListeningComplete === false &&
      audio.acceptance.releaseBoundary
        .authoritativeOriginalRuntimeTraversalComplete === false &&
      audio.acceptance.releaseBoundary.spokenLanguageContentVerified ===
        false &&
      audio.acceptance.releaseBoundary.humanAudioReviewComplete === false &&
      audio.acceptance.releaseBoundary.ownerAcceptanceComplete === false &&
      audio.acceptance.releaseBoundary.strictMigrationComplete === false &&
      audio.acceptance.releaseBoundary.publicationAuthorized === false,
    `${member.animationId}: audio evidence drifted or crossed listening acceptance`,
  );
  const bound = audioPlan.workspace?.dedicatedMachineAudioAudit;
  invariant(
    bound?.path ===
      `migrations/${member.animationId}/${AUDIO_EVIDENCE_RELATIVE}` &&
      Number.isSafeInteger(bound.bytes) &&
      bound.bytes > 0 &&
      SHA256_PATTERN.test(bound.sha256 || ""),
    `${member.animationId}: audio ownership does not bind its audit`,
  );
  invariant(
    audioPlan.workspace?.manifest?.path === manifestRecord.path &&
      audioPlan.workspace.manifest.bytes === manifestRecord.bytes &&
      audioPlan.workspace.manifest.sha256 === manifestRecord.sha256,
    `${member.animationId}: audio ownership is stale relative to manifest`,
  );
}

function expectedSourceStaticCoverageRequirement({
  member,
  profile,
  frameDomainId,
  language,
  rootFrameCount,
}) {
  const root = frameDomainId === "root";
  const scenario = root ? "root-unavailable" : "source-static-frame";
  const entryState = root
    ? {
        authoritativeTraceExecuted: false,
        frameDomainId: "root",
        kind: "lesson-shell-natural-entry",
        language,
        releaseId: G5_L4_RELEASE_ID,
        rootEntryFrame: 1,
        scenario,
        seed: "0",
        sourceScenarioCandidateId: "root-natural-entry-and-playback",
        targetAnimationId: member.animationId,
        targetSequence: member.ordinal,
      }
    : {
        authoritativeTraceExecuted: false,
        frameDomainId: profile.frameDomainId,
        kind: "lesson-shell-natural-entry-to-nested-domain",
        language,
        localEntryFrameCandidate: 1,
        parentEntryFrameCandidate: 6,
        parentFrameDomainId: "root",
        releaseId: G5_L4_RELEASE_ID,
        rootEntryFrame: 6,
        runtimeReachabilityEstablished: false,
        scenario,
        seed: "0",
        sourceInstanceId: profile.sourceInstanceId ?? "animation",
        sourceScenarioCandidateId: "root-natural-entry-and-playback",
        sourceTimelineId: profile.frameDomainId,
        targetAnimationId: member.animationId,
        targetSequence: member.ordinal,
      };
  const frameCount = root ? rootFrameCount : profile.nestedFrameCount;
  return {
    requirementId:
      `req:${frameDomainId}:lesson-shell-natural-entry:${language}`,
    scenario,
    frameDomainId,
    traceId:
      `trace:${frameDomainId}:lesson-shell-natural-entry:${language}:seed-0`,
    language,
    seed: "0",
    requiredRange: {firstFrame: 1, lastFrame: frameCount},
    entryState,
    entryStateSha256: sha256(JSON.stringify(stable(entryState))),
    baselineAuthorityRequirement: "original-runtime-natural-trace",
    baselineAuthority: "unresolved",
    status: "pending",
    capturedFrameCount: 0,
    missingFrames: Array.from({length: frameCount}, (_, index) => index + 1),
    baselineCaptureManifest: "",
    baselineCaptureManifestSha256: "",
    captureManifest: "",
    captureManifestSha256: "",
    metricsFile: "",
    metricsSha256: "",
    planningAuthority: root
      ? "source-bound-candidate-only-not-executed-original-runtime-evidence"
      : "conservative-source-bound-domain-candidate-not-executed-original-runtime-evidence",
  };
}

function expectedSourceStaticCoverage(
  member,
  profile,
  rootFrameCount,
) {
  return {
    schemaVersion: 2,
    animationId: member.animationId,
    planningState:
      "valid-root-and-conservative-nested-requirements-pending-authoritative-runtime",
    requirements: [
      ...["en", "es"].map((language) =>
        expectedSourceStaticCoverageRequirement({
          member,
          profile,
          frameDomainId: "root",
          language,
          rootFrameCount,
        })),
      ...["en", "es"].map((language) =>
        expectedSourceStaticCoverageRequirement({
          member,
          profile,
          frameDomainId: profile.frameDomainId,
          language,
          rootFrameCount,
        })),
    ],
    limitations: [
      "All four requirements are pending natural-trace obligations, not proof that the trace, scenario inventory, baseline, audio, review, or acceptance exists.",
      `The ${profile.frameDomainId} EN/ES requirements conservatively preserve the ${profile.nestedFrameCount}-frame source-static drawing obligation identified by hash-bound SWF structure and current-JavaScript candidate evidence; runtime reachability and entry state remain unresolved until an authorized natural trace executes.`,
      ...(profile.renderedFrameCount &&
      profile.renderedFrameCount < profile.nestedFrameCount
        ? [
          `The current-JavaScript candidate renders only frames 1..${profile.renderedFrameCount}; source frames ${profile.renderedFrameCount + 1}..${profile.nestedFrameCount} fail closed because their causal behavior remains unresolved.`,
        ]
        : []),
      `The ${(profile.unresolvedTimelineCandidateIds ?? []).length} additional structurally reachable timeline(s) remain unresolved, not composite or independent dispositions; stronger source proof or authoritative execution is still required.`,
      "The root-unavailable and source-static-frame scenario IDs bind the current-JavaScript diagnostic interface only. They do not establish original-runtime scenario names or reachability.",
      "No requirement in this planning document changes migration status, strict acceptance, human review, Owner acceptance, or publication.",
    ],
  };
}

export function validateG5L4StaticStrictReadinessCoverage(
  coverage,
  member,
  rootFrameCount,
  profile = sourceStaticCandidateProfile(member.animationId),
) {
  if (profile && profile.nestedCoverageDeclared !== false) {
    invariant(
      stableJson(coverage) ===
        stableJson(expectedSourceStaticCoverage(member, profile, rootFrameCount)),
      `${member.animationId}: four-requirement source-static coverage drifted or was promoted`,
    );
    return true;
  }
  invariant(
    coverage?.schemaVersion === 2 &&
      coverage.animationId === member.animationId &&
      Array.isArray(coverage.requirements) &&
      coverage.requirements.length === 2 &&
      JSON.stringify(
        coverage.requirements.map(({language}) => language).sort(),
      ) === JSON.stringify(["en", "es"]),
    `${member.animationId}: provisional coverage identity drifted`,
  );
  for (const requirement of coverage.requirements) {
    if (profile?.manifestBound === false) {
      invariant(
        requirement.requirementId ===
          `req-default-root-${requirement.language}` &&
          requirement.scenario === "default" &&
          requirement.traceId ===
            `default-root-${requirement.language}` &&
          requirement.seed === "0" &&
          stableJson(requirement.entryState) === stableJson({
            kind: "initial-load",
            language: requirement.language,
          }) &&
          requirement.entryStateSha256 ===
            sha256(JSON.stringify(requirement.entryState)) &&
          requirement.baselineAuthorityRequirement ===
            "original-runtime-frame-accurate",
        `${member.animationId}/${requirement.requirementId}: independent candidate root coverage identity drifted`,
      );
    }
    invariant(
      requirement.frameDomainId === "root" &&
        requirement.requiredRange?.firstFrame === 1 &&
        requirement.requiredRange?.lastFrame === rootFrameCount &&
        requirement.baselineAuthority === "unresolved" &&
        requirement.status === "pending" &&
        requirement.capturedFrameCount === 0 &&
        Array.isArray(requirement.missingFrames) &&
        requirement.missingFrames.length === rootFrameCount &&
        requirement.missingFrames.every(
          (frame, index) => frame === index + 1,
        ),
      `${member.animationId}/${requirement.requirementId}: coverage was promoted or narrowed`,
    );
    for (const key of [
      "baselineCaptureManifest",
      "baselineCaptureManifestSha256",
      "captureManifest",
      "captureManifestSha256",
      "metricsFile",
      "metricsSha256",
    ]) {
      invariant(
        requirement[key] === "",
        `${member.animationId}/${requirement.requirementId}: ${key} must remain empty`,
      );
    }
  }
  return true;
}

function outputAfterDescriptor(output) {
  if (!output || typeof output !== "object") return null;
  const record = output.current ?? output.after ?? output;
  return {
    path: record.path ?? output.path,
    bytes: record.bytes,
    sha256: record.sha256,
  };
}

async function validateStaticReceiptAndOutputs(
  projectRoot,
  receipt,
  member,
  sourceStaticCandidate,
) {
  validateG5L4M1StaticReconciliationReceipt(receipt, member);
  invariant(
    receipt.reconciliation?.applied === true &&
      receipt.reconciliation.machineOnlyStatic === true &&
      receipt.reconciliation.canonicalOutputCount === 4 &&
      receipt.reconciliation.audioRequirementRaised === false,
    `${member.animationId}: M1 static reconciliation is not acceptance-neutral and applied`,
  );
  invariant(
    receipt.summary?.manifestStaticFactsReconciled === true &&
      receipt.summary.migrationBriefStaticReconciled === true &&
      receipt.summary.complexityResolved === false &&
      receipt.summary.rendererSelected === false &&
      receipt.summary.runtimeReachabilityResolved === false,
    `${member.animationId}: M1 static receipt promoted runtime or renderer decisions`,
  );
  invariant(
    receipt.execution?.guiApplicationsLaunched === 0 &&
      receipt.execution.runtimeSessionsExecuted === 0 &&
      receipt.execution.legacyEndpointsExecuted === 0,
    `${member.animationId}: M1 static receipt contains runtime execution`,
  );
  allFalse(
    receipt.acceptanceEffects,
    ACCEPTANCE_FALSE_KEYS,
    `${member.animationId}: M1 static receipt acceptance`,
  );
  const outputRecords = {};
  for (const [key, workspaceRelative] of Object.entries(STATIC_OUTPUT_PATHS)) {
    const expectedPath = `migrations/${member.animationId}/${workspaceRelative}`;
    const expected = outputAfterDescriptor(receipt.outputs?.[key]);
    invariant(
      expected?.path === expectedPath &&
        Number.isSafeInteger(expected.bytes) &&
        expected.bytes > 0 &&
        SHA256_PATTERN.test(expected.sha256 || ""),
      `${member.animationId}: static receipt output binding drifted for ${key}`,
    );
    const record = await readStableFile(projectRoot, expectedPath, {
      json: expectedPath.endsWith(".json"),
      retainContents: false,
      label: `${member.animationId}: reconciled ${key}`,
    });
    const matchesReceipt =
      record.bytes === expected.bytes && record.sha256 === expected.sha256;
    if (
      sourceStaticCandidate &&
      key === "migrationManifest"
    ) {
      invariant(
        !matchesReceipt,
        `${member.animationId}: engineering-candidate manifest must postdate, not impersonate, its historical M1 receipt output`,
      );
      record.historicalReceiptOutput = expected;
      record.currentMatchesHistoricalReceipt = false;
    } else {
      invariant(
        matchesReceipt,
        `${member.animationId}: reconciled ${key} changed after receipt`,
      );
      record.currentMatchesHistoricalReceipt = true;
    }
    outputRecords[key] = record;
  }
  return outputRecords;
}

function observedStaticFacts(machineAudit, manifest) {
  const tagCounts = machineAudit.findings.swfmill?.tagCounts || {};
  const nested =
    machineAudit.findings.frameDomainCandidates?.summary
      ?.nestedDefinitionCount ??
    machineAudit.findings.swfmill?.spriteDefinitions?.length ??
    0;
  return [
    `FFDec and swfmill statically agree on an ${manifest.runtime.stage.width}x${manifest.runtime.stage.height} stage, ${manifest.runtime.fps} FPS, and ${manifest.runtime.frameCount} one-indexed root frame(s).`,
    `The machine bundle contains ${machineAudit.findings.exportedScriptFileCount} extracted ActionScript file(s), ${tagCounts.DefineButton2 || 0} DefineButton2 definition(s), and ${(tagCounts.BranchAlways || 0) + (tagCounts.BranchIfTrue || 0)} structural branch opcode candidate(s).`,
    `Static extraction records ${nested} nested definition candidate(s); definition presence does not establish root reachability, placement entry state, or runtime behavior.`,
    `Static extraction records ${tagCounts.Random || 0} random opcode(s), ${machineAudit.findings.externalCallCandidates.length} external API candidate class(es), ${tagCounts.DefineSound || 0} DefineSound tag(s), and ${tagCounts.SoundStreamBlock || 0} SoundStreamBlock tag(s).`,
  ];
}

function requiredScenarioInventory(member, manifest, machineAudit) {
  const nested =
    machineAudit.findings.frameDomainCandidates?.summary
      ?.nestedDefinitionCount ??
    machineAudit.findings.swfmill?.spriteDefinitions?.length ??
    0;
  return [
    `EN natural host-entry traversal for root frame domain 1..${manifest.runtime.frameCount} in an authorized original runtime`,
    `ES natural host-entry traversal for root frame domain 1..${manifest.runtime.frameCount} in a separate authorized original-runtime session`,
    `complete runtime disposition of ${nested} structural nested definition candidate(s), including exact placement and entry-state identity for every reachable domain`,
    "exact ordered interaction, branch, random, feedback, scoring, navigation, terminal, and complete Replay-reset traces for every reachable state",
    "source-evidenced event schedules and deterministic seeds only where the original runtime or source proves them",
    "original audio cue reachability, spoken language/content, timing, synchronization, controls, reset semantics, and named-human listening evidence",
    "native-stage authoritative baseline PNG coverage bound to frameDomain, requirementId, trace, entryStateSha256, frame, scenario, lang, and seed",
    "identity-matched JavaScript implementation captures, complete per-frame diffs, normalized RMSE, and wrong-content inspection",
    "desktop, mobile, keyboard, reduced-motion, localization, text-overflow, console, asset, and network product validation",
    `${member.releaseRole === "course-shell" ? "complete shell routing, child loading, section return, quit, language, and Replay behavior" : "complete lesson-page host entry, interaction, terminal, return, language, and Replay behavior"}`,
    "independent engineering review, independent human visual review, Owner fidelity acceptance, strict validation, and atomic publication as separate immutable gates",
  ];
}

function missingRuntimeHumanEvidence({sourceStaticCandidate = false} = {}) {
  const missing = [
    "approved runtime host, containment controls, immutable per-session authorization, and exact named-session operator attestation",
    "authorized original-runtime natural host entry and execution receipts",
    "complete root-reachable frame-domain disposition with placement and entry-state evidence",
    "natural traces for every reachable branch, interaction, random, scoring, navigation, terminal, and Replay state",
    "authoritative English and Spanish baseline manifests and native-stage PNGs",
    "original-runtime audio listening, language/content, synchronization, controls, and reset acceptance",
    sourceStaticCandidate
      ? "implementation authorization plus behavior-complete root, Spanish, audio, source-control, and Replay support for the current source-static JavaScript engineering candidate"
      : "authorized renderer decision and current JavaScript implementation",
    "identity-matched implementation captures, complete full-frame metrics, diff inspection, and RMSE acceptance",
    "product, accessibility, and localization validation",
    "independent engineering review, independent human visual review, and Owner fidelity acceptance",
    "strict validator admission, completion-ledger admission, release-custodian promotion, and atomic publication authorization",
  ];
  return missing;
}

function reviewRecord(role) {
  return {
    role,
    decision: "pending",
    reviewer: null,
    reviewedAt: null,
    signatureEnvelope: null,
  };
}

function riskCalibrationDisposition(animationId, calibration) {
  const member = calibration.riskMembers.get(animationId);
  return member
    ? {
        selected: true,
        status: "selected-for-eight-member-static-risk-calibration",
        intendedAxes: [...member.intendedAxes],
      }
    : {
        selected: false,
        status: "not-selected-for-eight-member-static-risk-calibration",
        intendedAxes: [],
      };
}

export function nonWorkStudyDisposition(calibration) {
  return {
    selected: false,
    status: "not-selected-for-four-member-human-work-study",
    selectedTargetIds: [...G5_L4_WORK_STUDY_READINESS_IDS],
    selectedTargetCount: G5_L4_WORK_STUDY_READINESS_IDS.length,
    selectedTargetOrdinal: null,
    measurementRule: calibration.selected.humanWorkStudy.measurementRule,
    phases: [],
    completedPhaseCount: 0,
    actualTotalMinutes: null,
    measuredBy: null,
    boundary:
      "This release member is not one of the four approved named-human work-study targets; automation may not infer participation, time, identity, or completion.",
  };
}

function expectedRisk(machineAudit) {
  const findings = machineAudit.findings ?? machineAudit;
  const tagCounts = findings.swfmill?.tagCounts || {};
  const randomOpcodeCount =
    findings.randomOpcodeCount ?? tagCounts.Random ?? 0;
  const externalApiCandidateCount =
    findings.externalApiCandidateCount ??
    findings.externalCallCandidates?.length ??
    0;
  return randomOpcodeCount > 0 ||
    externalApiCandidateCount > 0 ||
    findings.exportedScriptFileCount >= 100
    ? "critical"
    : "high";
}

export function validateG5L4NonWorkStudyStaticStrictReadiness(
  document,
  member,
) {
  const id = document?.animationId || "unknown";
  const sourceStaticCandidate = sourceStaticCandidateProfile(id);
  const candidateHasNestedCoverage = Boolean(
    sourceStaticCandidate &&
      sourceStaticCandidate.nestedCoverageDeclared !== false,
  );
  invariant(
    !G5_L4_WORK_STUDY_READINESS_IDS.includes(id),
    `${id}: four work-study readiness artifacts remain owned by their existing generator`,
  );
  invariant(document?.schemaVersion === 3, `${id}: schemaVersion must be 3`);
  invariant(
    document.evidenceKind === "course-shell-strict-readiness" &&
      document.releaseId === G5_L4_RELEASE_ID &&
      document.animationId === member.animationId &&
      document.assetId === member.assetId &&
      document.state === G5_L4_STATIC_STRICT_READINESS_STATE &&
      document.migrationStatusChanged === false,
    `${id}: identity or migration boundary drifted`,
  );
  invariant(
    document.generatedBy?.script === LESSON_STATIC_STRICT_READINESS_GENERATOR &&
      document.generatedBy.version === GENERATOR_VERSION &&
      document.generatedBy.deterministic === true &&
      SHA256_PATTERN.test(document.generatedBy.sha256 || ""),
    `${id}: generator identity drifted`,
  );
  invariant(
    document.releaseMembership?.ordinal === member.ordinal &&
      document.releaseMembership.assetId === member.assetId &&
      document.releaseMembership.releaseRole === member.releaseRole &&
      document.releaseMembership.batchId === member.batchId &&
      document.releaseMembership.shardId === member.shardId &&
      SHA256_PATTERN.test(
        document.releaseMembership.releaseFingerprintSha256 || "",
      ),
    `${id}: release membership drifted`,
  );
  invariant(
    document.riskCalibration?.selected ===
      document.riskCalibration.status.startsWith("selected-") &&
      Array.isArray(document.riskCalibration.intendedAxes),
    `${id}: risk-calibration disposition is inconsistent`,
  );
  invariant(
    document.workStudySelection?.selected === false &&
      document.workStudySelection.status ===
        "not-selected-for-four-member-human-work-study" &&
      JSON.stringify(document.workStudySelection.selectedTargetIds) ===
        JSON.stringify(G5_L4_WORK_STUDY_READINESS_IDS) &&
      document.workStudySelection.selectedTargetCount === 4 &&
      document.workStudySelection.selectedTargetOrdinal === null &&
      document.workStudySelection.completedPhaseCount === 0 &&
      document.workStudySelection.actualTotalMinutes === null &&
      document.workStudySelection.measuredBy === null &&
      Array.isArray(document.workStudySelection.phases) &&
      document.workStudySelection.phases.length === 0,
    `${id}: non-work-study member was selected or given fabricated labor`,
  );
  invariant(
    document.m1Authorization?.status ===
      "owner-directed-machine-only-m1-effective" &&
      document.m1Authorization.machineOnlyStaticWorkAuthorized === true,
    `${id}: M1 machine-only authorization is missing`,
  );
  allFalse(document.m1Authorization, [
    "runtimeAuthorized",
    "guiAuthorized",
    "implementationAuthorized",
    "reviewAccepted",
    "strictCompletionEstablished",
    "publicationAuthorized",
  ], `${id}: M1 authorization`);
  invariant(
    document.m1StaticReconciliation?.status ===
      "applied-hash-bound-machine-only-static" &&
      document.m1StaticReconciliation.canonicalOutputCount === 4 &&
      document.m1StaticReconciliation.complexityResolved === false &&
      document.m1StaticReconciliation.rendererSelected === false &&
      document.m1StaticReconciliation.runtimeReachabilityResolved === false,
    `${id}: static reconciliation state drifted`,
  );
  if (sourceStaticCandidate) {
    invariant(
      document.m1StaticReconciliation
        .currentMigrationManifestMatchesReceipt === false &&
        document.m1StaticReconciliation
          .historicalMigrationManifestPostimage?.recordedInsideReceipt ===
          true &&
        Number.isSafeInteger(
          document.m1StaticReconciliation
            .historicalMigrationManifestPostimage.bytes,
        ) &&
        document.m1StaticReconciliation
          .historicalMigrationManifestPostimage.bytes > 0 &&
        SHA256_PATTERN.test(
          document.m1StaticReconciliation
            .historicalMigrationManifestPostimage
            .sha256 || "",
        ),
      `${id}: historical M1 migration-manifest antecedent was not preserved`,
    );
  } else {
    invariant(
      document.m1StaticReconciliation.currentMigrationManifestMatchesReceipt ===
          undefined &&
        document.m1StaticReconciliation
          .historicalMigrationManifestPostimage ===
          undefined,
      `${id}: non-candidate M1 reconciliation semantics drifted`,
    );
  }
  invariant(
    document.source?.sourceHashesVerified === true &&
      document.source.authoringAuditEstablished === false &&
      document.source.authoringAccepted === false &&
      document.sourceScope?.memberCount === EXPECTED_MEMBER_COUNT &&
      document.sourceScope.strictCompleteCount === 0 &&
      document.sourceScope.publishedCount === 0,
    `${id}: source boundary drifted`,
  );
  invariant(
    document.machineAudit?.auditStatus === "partial" &&
      document.machineAudit.staticFactsReconciled === true &&
      document.machineAudit.runtimeBehaviorObserved === false &&
      document.machineAudit.rootReachableDomainInventoryComplete === false &&
      Array.isArray(
        document.machineAudit.observedBehaviorFromExtractedScripts,
      ) &&
      document.machineAudit.observedBehaviorFromExtractedScripts.length >= 4,
    `${id}: machine static facts are incomplete or promoted`,
  );
  invariant(
    document.audioReadiness?.structurallyAudited === true &&
      document.audioReadiness.authoritativeListeningComplete === false &&
      document.audioReadiness.hostStateTraversalComplete === false &&
      document.audioReadiness.synchronizationComplete === false &&
      document.audioReadiness.spokenLanguageContentVerified === false &&
      document.audioReadiness.humanAudioReviewComplete === false &&
      document.audioReadiness.audioAccepted === false,
    `${id}: audio readiness crossed listening acceptance`,
  );
  invariant(
    document.coverageReadiness?.requirementCount ===
      (candidateHasNestedCoverage ? 4 : 2) &&
      document.coverageReadiness.pendingRequirementCount ===
        (candidateHasNestedCoverage ? 4 : 2) &&
      (!candidateHasNestedCoverage ||
        document.coverageReadiness.pendingFrameCount ===
          2 *
            (document.source.rootFrameCount +
              sourceStaticCandidate.nestedFrameCount)) &&
      document.coverageReadiness.authoritativeBaselineCount === 0 &&
      document.coverageReadiness.capturedFrameCount === 0 &&
      document.coverageReadiness.implementationCaptureCount === 0 &&
      document.coverageReadiness.fullFrameComparisonCount === 0 &&
      document.coverageReadiness.rmseAccepted === false,
    `${id}: coverage readiness was promoted`,
  );
  invariant(
    document.branchCaptureReadiness?.status ===
      G5_L4_STATIC_STRICT_READINESS_STATE &&
      document.branchCaptureReadiness.authoritativeScheduleEstablished ===
        false &&
      document.branchCaptureReadiness.runtimeSessionsExecuted === 0 &&
      document.branchCaptureReadiness.requiredScenarioInventory?.length >=
        10 &&
      document.branchCaptureReadiness.missing?.length >= 10 &&
      JSON.stringify(
        document.branchCaptureReadiness.captureIdentity?.requiredFields,
      ) === JSON.stringify(CAPTURE_IDENTITY_FIELDS),
    `${id}: branch-capture boundary drifted`,
  );
  if (sourceStaticCandidate) {
    invariant(
      stableJson(document.engineeringCandidate) ===
        stableJson(sourceStaticCandidateDisposition(sourceStaticCandidate)),
      `${id}: source-static candidate frame boundary drifted`,
    );
    invariant(
      stableJson(document.implementationReadiness) === stableJson({
        implementationAuthorized: false,
        implementationStarted: true,
        rendererSelected: true,
        routeDeclared: true,
        currentJavaScriptCandidate: true,
        behaviorImplementationComplete: false,
        deterministicImplementationCaptureAccepted: false,
        fullFrameComparisonAccepted: false,
      }),
      `${id}: source-static candidate implementation readiness drifted`,
    );
  } else {
    allFalse(
      document.implementationReadiness,
      IMPLEMENTATION_FALSE_KEYS,
      `${id}: implementation readiness`,
    );
  }
  invariant(
    document.acceptance?.acceptanceNeutral === true,
    `${id}: readiness must remain acceptance-neutral`,
  );
  allFalse(document.acceptance, [
    "authoringAccepted",
    "audioAccepted",
    "authoritativeOriginalRuntimeAccepted",
    "fidelityAccepted",
    "fullFrameComparisonAccepted",
    "humanVisualAccepted",
    "independentEngineeringAccepted",
    "ownerAccepted",
    "published",
    "rmseAccepted",
    "runtimeReachabilityEstablished",
    "strictMigrationComplete",
  ], `${id}: acceptance`);
  for (const key of [
    "strictAcceptanceReady",
    "completionClaimAllowed",
    "localAuthoritativeBaselineCompletable",
    "localExhaustiveBranchCaptureCompletable",
  ]) {
    invariant(document.conclusion?.[key] === false, `${id}: ${key} must remain false`);
  }
  invariant(
    document.conclusion?.risk === expectedRisk(document.machineAudit),
    `${id}: risk classification drifted`,
  );
  for (const reviewKey of [
    "independentEngineeringReview",
    "humanVisualReview",
    "ownerReview",
  ]) {
    const review = document.review?.[reviewKey];
    invariant(
      review?.decision === "pending" &&
        review.reviewer === null &&
        review.reviewedAt === null &&
        review.signatureEnvelope === null,
      `${id}: ${reviewKey} contains fabricated review evidence`,
    );
  }
  invariant(
    Array.isArray(document.evidence) &&
      document.evidence.length >= 14 &&
      document.evidence.every(
        (entry) =>
          typeof entry.id === "string" &&
          typeof entry.path === "string" &&
          Number.isSafeInteger(entry.bytes) &&
          entry.bytes > 0 &&
          SHA256_PATTERN.test(entry.sha256 || ""),
      ),
    `${id}: evidence index is incomplete`,
  );
  assertUniqueEvidence(document.evidence, id);
  invariant(
    document.strictAcceptanceEffect ===
      (sourceStaticCandidate
        ? "none; post-M1 source-static current-JavaScript engineering candidate only; authorization, behavior, capture, comparison, human, strict, and publication gates remain blocked"
        : "none; M1 static reconciliation only; runtime, implementation, human, strict, and publication gates remain blocked"),
    `${id}: strict acceptance effect drifted`,
  );
  return true;
}

export function validateG5L4ReleaseStaticStrictReadiness(
  document,
  member,
) {
  invariant(
    document?.animationId === member?.animationId,
    "strict-readiness member identity is required",
  );
  if (G5_L4_WORK_STUDY_READINESS_IDS.includes(member.animationId)) {
    validateG5L4WorkStudyStrictReadiness(document);
    return true;
  }
  return validateG5L4NonWorkStudyStaticStrictReadiness(document, member);
}

export function g5L4StaticStrictReadinessPath(animationId) {
  invariant(SAFE_ID.test(animationId || ""), "invalid animation ID");
  return `migrations/${animationId}/audit/${G5_L4_STATIC_STRICT_READINESS_OUTPUT_NAME}`;
}

function buildNonWorkStudyDocument({
  member,
  releaseFingerprint,
  calibration,
  sourceStaticCandidate,
  manifest,
  machineAudit,
  records,
  staticReceipt,
}) {
  invariant(
    !G5_L4_WORK_STUDY_READINESS_IDS.includes(member.animationId),
    `${member.animationId}: existing work-study readiness must be retained`,
  );
  const requiredScenarios = requiredScenarioInventory(
    member,
    manifest,
    machineAudit,
  );
  const missing = missingRuntimeHumanEvidence({
    sourceStaticCandidate: Boolean(sourceStaticCandidate),
  });
  const nested =
    machineAudit.findings.frameDomainCandidates?.summary
      ?.nestedDefinitionCount ??
    machineAudit.findings.swfmill?.spriteDefinitions?.length ??
    0;
  const evidence = [
    evidenceEntry("lesson-release-catalog", records.release),
    evidenceEntry("source-scope-freeze", records.sourceScope),
    evidenceEntry("audio-ownership-readiness", records.audioOwnership),
    evidenceEntry("calibration-and-work-study-selection", records.calibration),
    evidenceEntry("migration-manifest", records.manifest),
    evidenceEntry("machine-audit", records.machineAudit),
    evidenceEntry("source-scope-binding", records.sourceScopeBinding),
    evidenceEntry("audio-runtime-evidence", records.audioEvidence),
    evidenceEntry("coverage-v2", records.coverage),
    evidenceEntry("m1-static-reconciliation-receipt", records.staticReceipt),
    evidenceEntry("preserved-source-swf", records.physicalSource),
    evidenceEntry("reconciled-migration-brief", records.staticOutputs.migrationBrief),
    evidenceEntry("reconciled-script-inventory", records.staticOutputs.scriptInventory),
    evidenceEntry("reconciled-dependency-inventory", records.staticOutputs.dependencyInventory),
    ...(records.externalCandidateRecords
      ? [
          evidenceEntry(
            "dual-sprite-composite-candidate-spec",
            records.externalCandidateRecords.spec,
          ),
          evidenceEntry(
            "dual-sprite-composite-candidate-report",
            records.externalCandidateRecords.report,
          ),
          evidenceEntry(
            "canonical-frame-domain-disposition",
            records.externalCandidateRecords.disposition,
          ),
          evidenceEntry(
            "dual-sprite-composite-runtime-script",
            records.externalCandidateRecords.runtimeScript,
          ),
          evidenceEntry(
            "dual-sprite-composite-runtime-manifest",
            records.externalCandidateRecords.runtimeManifest,
          ),
          evidenceEntry(
            "generated-animation-registry",
            records.externalCandidateRecords.registry,
          ),
          evidenceEntry(
            "dual-sprite-composite-module",
            records.externalCandidateRecords.module,
          ),
          evidenceEntry(
            "dual-sprite-composite-timeline",
            records.externalCandidateRecords.timeline,
          ),
        ]
      : []),
  ];
  assertUniqueEvidence(evidence, member.animationId);
  const coverageFrames = records.coverage.document.requirements.reduce(
    (sum, requirement) => sum + requirement.missingFrames.length,
    0,
  );
  const document = {
    schemaVersion: 3,
    evidenceKind: "course-shell-strict-readiness",
    generatedBy: {
      script: LESSON_STATIC_STRICT_READINESS_GENERATOR,
      version: GENERATOR_VERSION,
      sha256: records.generator.sha256,
      deterministic: true,
    },
    releaseId: G5_L4_RELEASE_ID,
    animationId: member.animationId,
    assetId: member.assetId,
    state: G5_L4_STATIC_STRICT_READINESS_STATE,
    assessedOn: "2026-07-29",
    migrationStatusChanged: false,
    releaseMembership: {
      ordinal: member.ordinal,
      assetId: member.assetId,
      releaseRole: member.releaseRole,
      batchId: member.batchId,
      shardId: member.shardId,
      releaseFingerprintSha256: releaseFingerprint,
    },
    riskCalibration: riskCalibrationDisposition(
      member.animationId,
      calibration,
    ),
    workStudySelection: nonWorkStudyDisposition(calibration),
    m1Authorization: {
      status: "owner-directed-machine-only-m1-effective",
      receipt: {
        path: staticReceipt.ownerDirective.path,
        bytes: staticReceipt.ownerDirective.bytes,
        sha256: staticReceipt.ownerDirective.sha256,
      },
      receiptFingerprintSha256:
        staticReceipt.ownerDirective.receiptFingerprintSha256,
      machineOnlyStaticWorkAuthorized: true,
      runtimeAuthorized: false,
      guiAuthorized: false,
      implementationAuthorized: false,
      reviewAccepted: false,
      strictCompletionEstablished: false,
      publicationAuthorized: false,
    },
    m1StaticReconciliation: {
      status: "applied-hash-bound-machine-only-static",
      receipt: descriptor(records.staticReceipt),
      receiptFingerprintSha256: staticReceipt.receiptFingerprintSha256,
      canonicalOutputCount: staticReceipt.reconciliation.canonicalOutputCount,
      scriptCount: staticReceipt.summary.scriptCount,
      dependencyApiCandidateCount:
        staticReceipt.summary.dependencyApiCandidateCount,
      dependencyOccurrenceCount:
        staticReceipt.summary.dependencyOccurrenceCount,
      complexityResolved: false,
      rendererSelected: false,
      runtimeReachabilityResolved: false,
      ...(sourceStaticCandidate
        ? {
            historicalMigrationManifestPostimage: {
              recordedInsideReceipt: true,
              bytes:
                records.staticOutputs.migrationManifest
                  .historicalReceiptOutput.bytes,
              sha256:
                records.staticOutputs.migrationManifest
                  .historicalReceiptOutput.sha256,
            },
            currentMigrationManifestMatchesReceipt: false,
          }
        : {}),
    },
    conclusion: {
      strictAcceptanceReady: false,
      completionClaimAllowed: false,
      localAuthoritativeBaselineCompletable: false,
      localExhaustiveBranchCaptureCompletable: false,
      risk: expectedRisk(machineAudit),
      reason: sourceStaticCandidate
        ? sourceStaticCandidate.manifestBound === false
          ? "This exact release member now has a bounded post-M1 dual-sprite composite current-JavaScript engineering candidate with 52 open source-static frames. The canonical migration manifest and frame-domain disposition deliberately remain unresolved and root-only; the composite evidence does not impersonate a single-sprite antecedent or authorize nested coverage. Root host entry, Spanish visuals, audio, source controls, Replay behavior, natural original-runtime reachability, implementation authorization, deterministic implementation capture acceptance, full-frame comparison, independent review, Owner fidelity acceptance, strict completion, and publication authority remain unestablished."
          : "This exact release member now has a bounded post-M1 source-static Canvas current-JavaScript engineering candidate and four conservative root/nested EN/ES coverage obligations. The immutable M1 receipt remains a historical antecedent, not a description of the current manifest. Root host entry, Spanish visuals, audio, source controls, Replay behavior, natural original-runtime reachability, implementation authorization, deterministic implementation capture, full-frame comparison, independent review, Owner fidelity acceptance, strict completion, and publication authority remain unestablished."
        : "This exact release member has hash-bound source, partial static extraction, structural audio evidence, provisional bilingual coverage, and an applied acceptance-neutral M1 static reconciliation. It was not selected for the four-member named-human work study. These facts establish no original-runtime reachability, host entry, natural trace, audio listening, renderer implementation, full-frame comparison, independent review, Owner fidelity acceptance, strict completion, or publication authority.",
    },
    source: {
      sourceModel: manifest.source.flaSha256
        ? "paired-fla-and-shipped-swf"
        : "shipped-swf-only",
      swf: manifest.source.swf,
      swfSha256: manifest.source.swfSha256,
      fla: manifest.source.fla || null,
      flaSha256: manifest.source.flaSha256 || null,
      sourceHashesVerified: true,
      stage: manifest.runtime.stage,
      fps: manifest.runtime.fps,
      rootFrameCount: manifest.runtime.frameCount,
      authoringAuditEstablished: false,
      authoringAccepted: false,
    },
    sourceScope: {
      freeze: descriptor(records.sourceScope),
      binding: descriptor(records.sourceScopeBinding),
      memberCount: EXPECTED_MEMBER_COUNT,
      memberOrdinal: member.ordinal,
      releaseRole: member.releaseRole,
      shardId: member.shardId,
      strictCompleteCount: 0,
      publishedCount: 0,
    },
    machineAudit: {
      auditStatus: "partial",
      staticFactsReconciled: true,
      runtimeBehaviorObserved: false,
      sourceHashVerified: true,
      rootFrameCount: manifest.runtime.frameCount,
      nestedDefinitionCount: nested,
      rootReachableDomainInventoryComplete: false,
      exportedScriptFileCount:
        machineAudit.findings.exportedScriptFileCount,
      randomOpcodeCount:
        machineAudit.findings.swfmill?.tagCounts?.Random ?? 0,
      externalApiCandidateCount:
        machineAudit.findings.externalCallCandidates.length,
      observedBehaviorFromExtractedScripts:
        observedStaticFacts(machineAudit, manifest),
    },
    audioReadiness: {
      evidence: descriptor(records.audioEvidence),
      structurallyAudited: true,
      authoritativeListeningComplete: false,
      hostStateTraversalComplete: false,
      synchronizationComplete: false,
      spokenLanguageContentVerified: false,
      humanAudioReviewComplete: false,
      audioAccepted: false,
    },
    coverageReadiness: {
      evidence: descriptor(records.coverage),
      requirementCount: records.coverage.document.requirements.length,
      pendingRequirementCount: records.coverage.document.requirements.length,
      pendingFrameCount: coverageFrames,
      authoritativeBaselineCount: 0,
      capturedFrameCount: 0,
      implementationCaptureCount: 0,
      fullFrameComparisonCount: 0,
      rmseAccepted: false,
    },
    branchCaptureReadiness: {
      status: G5_L4_STATIC_STRICT_READINESS_STATE,
      authoritativeScheduleEstablished: false,
      runtimeSessionsExecuted: 0,
      requiredScenarioInventory: requiredScenarios,
      missing,
      captureIdentity: {
        requiredFields: [...CAPTURE_IDENTITY_FIELDS],
        sourceSwfSha256: member.source.sha256,
        sourceFlaSha256: manifest.source.flaSha256 || null,
        orderedEventAndStateHashChainRequired: true,
        nativeStagePngRequired: true,
      },
      directSeekAuthority:
        "not-permitted-for-primary evidence; supplemental diagnosis only after a source-evidenced natural trace",
    },
    implementationReadiness: {
      implementationAuthorized: false,
      implementationStarted: Boolean(sourceStaticCandidate),
      rendererSelected: Boolean(sourceStaticCandidate),
      routeDeclared: Boolean(sourceStaticCandidate),
      currentJavaScriptCandidate: Boolean(sourceStaticCandidate),
      behaviorImplementationComplete: false,
      deterministicImplementationCaptureAccepted: false,
      fullFrameComparisonAccepted: false,
    },
    ...(sourceStaticCandidate
      ? {
          engineeringCandidate:
            sourceStaticCandidateDisposition(sourceStaticCandidate),
        }
      : {}),
    acceptance: {
      acceptanceNeutral: true,
      authoringAccepted: false,
      authoritativeOriginalRuntimeAccepted: false,
      runtimeReachabilityEstablished: false,
      audioAccepted: false,
      fidelityAccepted: false,
      rmseAccepted: false,
      fullFrameComparisonAccepted: false,
      independentEngineeringAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      published: false,
    },
    review: {
      independentEngineeringReview:
        reviewRecord("independent-engineering-reviewer"),
      humanVisualReview:
        reviewRecord("independent-human-visual-reviewer"),
      ownerReview:
        reviewRecord("owner-or-authorized-representative"),
    },
    strictGateBlockers: missing,
    evidence,
    limitations: [
      "This generator retains the four existing work-study readiness artifacts byte-for-byte and manages only the other 51 release members.",
      "No Adobe Animate, browser, Ruffle, Projector, original Flash runtime, legacy endpoint, or external network service is launched or executed.",
      "Static reconciliation does not prove natural runtime reachability, audio behavior, renderer fidelity, review, strict completion, or publication.",
      "This member was not selected for the four-member named-human work study; no labor, identity, timestamp, or completion is inferred.",
      ...(sourceStaticCandidate
        ? [
            "The current source-static Canvas renderer, route, and JavaScript candidate postdate the immutable M1 receipt and establish no implementation authorization, original-runtime parity, behavior completion, capture acceptance, comparison acceptance, human acceptance, strict completion, or publication.",
          ]
        : []),
    ],
    strictAcceptanceEffect:
      sourceStaticCandidate
        ? "none; post-M1 source-static current-JavaScript engineering candidate only; authorization, behavior, capture, comparison, human, strict, and publication gates remain blocked"
        : "none; M1 static reconciliation only; runtime, implementation, human, strict, and publication gates remain blocked",
  };
  validateG5L4NonWorkStudyStaticStrictReadiness(document, member);
  return document;
}

async function loadGlobals(
  projectRoot,
  {
    expectedReleaseFingerprint,
    legacyReadinessChecker,
  },
) {
  const [
    generator,
    release,
    sourceScope,
    audioOwnership,
    calibrationRecord,
    retainedWorkStudy,
  ] = await Promise.all([
    readStableFile(projectRoot, LESSON_STATIC_STRICT_READINESS_GENERATOR, {
      label: "lesson static strict-readiness generator",
      retainContents: false,
    }),
    readStableFile(projectRoot, RELEASE_RELATIVE, {
      json: true,
      label: "lesson-release catalog",
    }),
    readStableFile(projectRoot, SOURCE_SCOPE_RELATIVE, {
      json: true,
      label: "G5 L4 source scope",
    }),
    readStableFile(projectRoot, AUDIO_OWNERSHIP_RELATIVE, {
      json: true,
      label: "G5 L4 audio ownership",
    }),
    readStableFile(projectRoot, CALIBRATION_RELATIVE, {
      json: true,
      label: "lesson calibration catalog",
    }),
    legacyReadinessChecker({
      projectRoot,
      ids: [...G5_L4_WORK_STUDY_READINESS_IDS],
      check: true,
    }),
  ]);
  const selected = selectRelease(
    release.document,
    expectedReleaseFingerprint,
  );
  validateSourceScope(sourceScope.document, selected.release);
  validateAudioOwnership(audioOwnership.document, selected.release);
  const calibration = validateCalibration(
    calibrationRecord.document,
    selected.release,
  );
  invariant(
    Array.isArray(retainedWorkStudy) &&
      retainedWorkStudy.length === G5_L4_WORK_STUDY_READINESS_IDS.length &&
      retainedWorkStudy.every(
        (entry, index) =>
          entry.id === G5_L4_WORK_STUDY_READINESS_IDS[index] &&
          entry.action === "verified",
      ),
    "existing four-member work-study readiness set is not current",
  );
  return {
    generator,
    release,
    releaseDocument: selected.release,
    releaseFingerprint: selected.fingerprint,
    sourceScope,
    audioOwnership,
    calibrationRecord,
    calibration,
    retainedWorkStudy: new Map(
      retainedWorkStudy.map((entry) => [entry.id, entry]),
    ),
  };
}

async function buildOneMember({
  projectRoot,
  member,
  globals,
  staticReceiptReader,
}) {
  const workspacePrefix = `migrations/${member.animationId}`;
  const [
    manifestRecord,
    machineAuditRecord,
    sourceScopeBindingRecord,
    audioEvidenceRecord,
    coverageRecord,
    physicalSourceRecord,
  ] = await Promise.all([
    readStableFile(projectRoot, `${workspacePrefix}/${MANIFEST_RELATIVE}`, {
      json: true,
      label: `${member.animationId}: manifest`,
    }),
    readStableFile(projectRoot, `${workspacePrefix}/${MACHINE_AUDIT_RELATIVE}`, {
      json: true,
      label: `${member.animationId}: machine audit`,
    }),
    readStableFile(
      projectRoot,
      `${workspacePrefix}/${SOURCE_SCOPE_BINDING_RELATIVE}`,
      {
        json: true,
        label: `${member.animationId}: source-scope binding`,
      },
    ),
    readStableFile(projectRoot, `${workspacePrefix}/${AUDIO_EVIDENCE_RELATIVE}`, {
      json: true,
      label: `${member.animationId}: audio evidence`,
    }),
    readStableFile(projectRoot, `${workspacePrefix}/${COVERAGE_RELATIVE}`, {
      json: true,
      label: `${member.animationId}: coverage-v2`,
    }),
    readStableFile(
      projectRoot,
      `${SOURCE_ARCHIVE_PREFIX}${member.source.path}`,
      {
        label: `${member.animationId}: preserved SWF`,
        retainContents: false,
      },
    ),
  ]);
  const manifest = manifestRecord.document;
  const machineAudit = machineAuditRecord.document;
  const sourceStaticCandidate =
    validateG5L4StaticStrictReadinessManifest(manifest, member);
  let externalCandidateRecords = null;
  if (sourceStaticCandidate?.manifestBound === false) {
    const base = `migrations/${member.animationId}`;
    const [
      spec,
      report,
      disposition,
      runtimeScript,
      runtimeManifest,
      registry,
      module,
      timeline,
    ] = await Promise.all([
      readStableFile(
        projectRoot,
        `${base}/audit/dual-sprite-composite-current-js-candidate-spec.json`,
        {json: true, label: `${member.animationId}: composite candidate spec`},
      ),
      readStableFile(
        projectRoot,
        `${base}/evidence/dual-sprite-composite-current-js-candidate.json`,
        {json: true, label: `${member.animationId}: composite candidate report`},
      ),
      readStableFile(
        projectRoot,
        `${base}/audit/frame-domain-disposition.json`,
        {json: true, label: `${member.animationId}: frame-domain disposition`},
      ),
      readStableFile(
        projectRoot,
        `public/flash-assets/courses/${member.animationId}/canvas-renderer.js`,
        {
          label: `${member.animationId}: composite runtime script`,
          retainContents: false,
        },
      ),
      readStableFile(
        projectRoot,
        `public/flash-assets/courses/${member.animationId}/manifest.json`,
        {
          json: true,
          label: `${member.animationId}: composite runtime manifest`,
        },
      ),
      readStableFile(projectRoot, "packages/demos/src/registry.generated.ts", {
        label: `${member.animationId}: generated registry`,
      }),
      readStableFile(
        projectRoot,
        `packages/demos/src/modules/${member.animationId}.tsx`,
        {label: `${member.animationId}: composite module`},
      ),
      readStableFile(
        projectRoot,
        `packages/demos/src/timelines/${member.animationId}.ts`,
        {label: `${member.animationId}: composite timeline`},
      ),
    ]);
    externalCandidateRecords = {
      spec,
      report,
      disposition,
      runtimeScript,
      runtimeManifest,
      registry,
      module,
      timeline,
    };
    validateFq001CompositeCandidateArtifacts(
      externalCandidateRecords,
      member,
      sourceStaticCandidate,
      manifest,
    );
  }
  validateMachineAudit(machineAudit, member, manifest);
  validateSourceScopeBinding(
    sourceScopeBindingRecord.document,
    member,
    globals.sourceScope,
  );
  const audioPlan =
    globals.audioOwnership.document.memberPlans[member.ordinal - 1];
  validateAudioEvidence(
    audioEvidenceRecord.document,
    member,
    audioPlan,
    manifestRecord,
  );
  invariant(
    audioPlan.workspace.dedicatedMachineAudioAudit.bytes ===
      audioEvidenceRecord.bytes &&
      audioPlan.workspace.dedicatedMachineAudioAudit.sha256 ===
        audioEvidenceRecord.sha256,
    `${member.animationId}: dedicated audio audit bytes drifted`,
  );
  validateG5L4StaticStrictReadinessCoverage(
    coverageRecord.document,
    member,
    manifest.runtime.frameCount,
    sourceStaticCandidate,
  );
  invariant(
    physicalSourceRecord.sha256 === member.source.sha256,
    `${member.animationId}: preserved SWF hash differs from release`,
  );

  let staticReceiptResult;
  try {
    staticReceiptResult = await staticReceiptReader({
      root: projectRoot,
      animationId: member.animationId,
      member,
    });
  } catch (error) {
    if (error?.code === "ENOENT" || /missing|ENOENT/i.test(error.message)) {
      throw new Error(
        `${member.animationId}: required M1 static reconciliation receipt is missing (${G5_L4_M1_STATIC_RECONCILIATION_RECEIPT_NAME})`,
        {cause: error},
      );
    }
    throw error;
  }
  const staticReceipt =
    staticReceiptResult.receipt ??
    staticReceiptResult.document ??
    staticReceiptResult;
  const staticReceiptPath =
    staticReceiptResult.binding?.path ??
    `migrations/${member.animationId}/audit/machine/${G5_L4_M1_STATIC_RECONCILIATION_RECEIPT_NAME}`;
  const staticReceiptRecord = await readStableFile(
    projectRoot,
    staticReceiptPath,
    {
      json: true,
      label: `${member.animationId}: M1 static reconciliation receipt`,
    },
  );
  invariant(
    staticReceiptRecord.contents.toString("utf8") ===
      stableJson(staticReceipt) &&
      stableJson(staticReceiptRecord.document) === stableJson(staticReceipt),
    `${member.animationId}: static receipt is non-canonical or reader bytes differ`,
  );
  const staticOutputs = await validateStaticReceiptAndOutputs(
    projectRoot,
    staticReceipt,
    member,
    sourceStaticCandidate,
  );
  const output = g5L4StaticStrictReadinessPath(member.animationId);
  const outputSnapshot = await readStableFile(projectRoot, output, {
    json: true,
    label: `${member.animationId}: strict-readiness output`,
    allowMissing: true,
  });
  const inputRecords = [
    globals.generator,
    globals.release,
    globals.sourceScope,
    globals.audioOwnership,
    globals.calibrationRecord,
    manifestRecord,
    machineAuditRecord,
    sourceScopeBindingRecord,
    audioEvidenceRecord,
    coverageRecord,
    staticReceiptRecord,
    physicalSourceRecord,
    ...Object.values(staticOutputs),
    ...Object.values(externalCandidateRecords || {}),
  ];

  if (G5_L4_WORK_STUDY_READINESS_IDS.includes(member.animationId)) {
    const retained = globals.retainedWorkStudy.get(member.animationId);
    invariant(
      outputSnapshot.exists &&
        retained?.document &&
        outputSnapshot.contents.toString("utf8") ===
          `${JSON.stringify(retained.document, null, 2)}\n`,
      `${member.animationId}: retained work-study readiness bytes drifted`,
    );
    validateG5L4WorkStudyStrictReadiness(outputSnapshot.document);
    return {
      id: member.animationId,
      member,
      output,
      outputSnapshot,
      inputRecords,
      managed: false,
      disposition: "retained-existing-work-study-readiness",
      document: outputSnapshot.document,
    };
  }

  const records = {
    generator: globals.generator,
    release: globals.release,
    sourceScope: globals.sourceScope,
    audioOwnership: globals.audioOwnership,
    calibration: globals.calibrationRecord,
    manifest: manifestRecord,
    machineAudit: machineAuditRecord,
    sourceScopeBinding: sourceScopeBindingRecord,
    audioEvidence: audioEvidenceRecord,
    coverage: coverageRecord,
    staticReceipt: staticReceiptRecord,
    staticOutputs,
    physicalSource: physicalSourceRecord,
    externalCandidateRecords,
  };
  const document = buildNonWorkStudyDocument({
    member,
    releaseFingerprint: globals.releaseFingerprint,
    calibration: globals.calibration,
    sourceStaticCandidate,
    manifest,
    machineAudit,
    records,
    staticReceipt,
  });
  if (outputSnapshot.exists) {
    invariant(
      outputSnapshot.document.generatedBy?.script ===
        LESSON_STATIC_STRICT_READINESS_GENERATOR,
      `${member.animationId}: refusing to overwrite strict-readiness owned by another generator`,
    );
  }
  return {
    id: member.animationId,
    member,
    output,
    outputPath: outputSnapshot.absolutePath,
    outputSnapshot,
    inputRecords,
    managed: true,
    disposition: "managed-non-work-study-readiness",
    document,
    rendered: stableJson(document),
  };
}

function outputSnapshotMatches(left, right) {
  return left.exists === right.exists &&
    (!left.exists ||
      (left.bytes === right.bytes &&
        left.sha256 === right.sha256 &&
        sameStatIdentity(left.stat, right.stat)));
}

async function assertInputSetUnchanged(inputRecords) {
  for (const record of inputRecords) {
    const current = await lstat(record.absolutePath, {bigint: true}).catch(
      (error) => {
        throw new Error(
          `${record.path}: input disappeared after preflight (${error.message})`,
        );
      },
    );
    invariant(
      current.isFile() &&
        !current.isSymbolicLink() &&
        current.nlink === 1n &&
        sameStatIdentity(record.stat, statIdentity(current)),
      `${record.path}: input changed after preflight`,
    );
  }
}

async function writeExclusive(candidate, contents, mode = 0o600) {
  const handle = await open(
    candidate,
    fsConstants.O_CREAT | fsConstants.O_EXCL | fsConstants.O_WRONLY,
    mode,
  );
  try {
    await handle.writeFile(contents);
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function unlinkOwned(candidate, expectedSha256) {
  const information = await lstatOrNull(candidate);
  if (!information) return;
  invariant(
    information.isFile() &&
      !information.isSymbolicLink() &&
      information.nlink === 1n,
    `${candidate}: transaction file is no longer ordinary`,
  );
  const bytes = await readFile(candidate);
  invariant(
    sha256(bytes) === expectedSha256,
    `${candidate}: refusing to remove changed transaction bytes`,
  );
  await unlink(candidate);
}

async function prepareTransaction(item, batchId) {
  const nonce = randomBytes(12).toString("hex");
  const parent = path.dirname(item.outputPath);
  const prefix =
    `.${G5_L4_STATIC_STRICT_READINESS_OUTPUT_NAME}.${batchId}.${nonce}`;
  const stagePath = path.join(parent, `${prefix}.stage`);
  const backupPath = path.join(parent, `${prefix}.backup`);
  const renderedBytes = Buffer.from(item.rendered, "utf8");
  const renderedSha256 = sha256(renderedBytes);
  await writeExclusive(stagePath, renderedBytes);
  if (item.outputSnapshot.exists) {
    await writeExclusive(
      backupPath,
      item.outputSnapshot.contents,
      Number.parseInt(item.outputSnapshot.stat.mode, 10) & 0o777,
    );
  }
  return {
    ...item,
    stagePath,
    backupPath,
    renderedBytes,
    renderedSha256,
    committed: false,
  };
}

async function cleanupTransaction(transaction) {
  await unlinkOwned(
    transaction.stagePath,
    transaction.renderedSha256,
  ).catch((error) => {
    if (error?.code !== "ENOENT") throw error;
  });
  if (transaction.outputSnapshot.exists) {
    await unlinkOwned(
      transaction.backupPath,
      transaction.outputSnapshot.sha256,
    ).catch((error) => {
      if (error?.code !== "ENOENT") throw error;
    });
  }
}

async function rollbackTransactions(transactions, originalError) {
  const rollbackErrors = [];
  for (const transaction of [...transactions].reverse()) {
    try {
      if (transaction.committed) {
        const current = await readFile(transaction.outputPath);
        invariant(
          sha256(current) === transaction.renderedSha256,
          `${transaction.id}: committed output changed before rollback`,
        );
        if (transaction.outputSnapshot.exists) {
          await rename(transaction.backupPath, transaction.outputPath);
        } else {
          await unlink(transaction.outputPath);
        }
      }
      await cleanupTransaction(transaction);
    } catch (error) {
      rollbackErrors.push(error);
    }
  }
  if (rollbackErrors.length) {
    throw new AggregateError(
      [originalError, ...rollbackErrors],
      `G5 L4 strict-readiness transaction failed with ${rollbackErrors.length} rollback error(s)`,
    );
  }
  throw originalError;
}

export async function commitStaticStrictReadinessBatch(
  projectRoot,
  prepared,
  transactionHooks = {},
) {
  const batchId =
    `${process.pid}-${Date.now()}-${randomBytes(8).toString("hex")}`;
  const transactions = [];
  try {
    for (const item of prepared) {
      const current = await readStableFile(projectRoot, item.output, {
        json: true,
        label: `${item.id}: strict-readiness output`,
        allowMissing: true,
      });
      invariant(
        outputSnapshotMatches(item.outputSnapshot, current),
        `${item.id}: strict-readiness changed after preflight`,
      );
      transactions.push(await prepareTransaction(item, batchId));
    }
    const allInputs = [
      ...new Map(
        prepared
          .flatMap(({inputRecords}) => inputRecords)
          .map((record) => [record.absolutePath, record]),
      ).values(),
    ];
    await assertInputSetUnchanged(allInputs);
    for (const [index, transaction] of transactions.entries()) {
      const current = await readStableFile(projectRoot, transaction.output, {
        json: true,
        label: `${transaction.id}: strict-readiness output`,
        allowMissing: true,
      });
      invariant(
        outputSnapshotMatches(transaction.outputSnapshot, current),
        `${transaction.id}: strict-readiness changed before commit`,
      );
      await assertInputSetUnchanged(allInputs);
      await transactionHooks.beforeCommit?.({
        index,
        id: transaction.id,
        outputPath: transaction.outputPath,
      });
      await assertInputSetUnchanged(allInputs);
      if (transaction.outputSnapshot.exists) {
        await rename(transaction.stagePath, transaction.outputPath);
      } else {
        await link(transaction.stagePath, transaction.outputPath);
        await unlink(transaction.stagePath);
      }
      transaction.committed = true;
      const committed = await readFile(transaction.outputPath);
      invariant(
        sha256(committed) === transaction.renderedSha256,
        `${transaction.id}: committed strict-readiness bytes changed`,
      );
      await transactionHooks.afterCommit?.({
        index,
        id: transaction.id,
        outputPath: transaction.outputPath,
      });
    }
  } catch (error) {
    await rollbackTransactions(transactions, error);
  }
  for (const transaction of transactions) await cleanupTransaction(transaction);
}

export async function readG5L4ReleaseStaticStrictReadiness({
  root = defaultProjectRoot,
  animationId,
  member,
} = {}) {
  invariant(
    member?.animationId === animationId,
    "strict-readiness member identity is required",
  );
  const record = await readStableFile(
    path.resolve(root),
    g5L4StaticStrictReadinessPath(animationId),
    {
      json: true,
      label: `${animationId}: strict-readiness`,
    },
  );
  validateG5L4ReleaseStaticStrictReadiness(record.document, member);
  if (!G5_L4_WORK_STUDY_READINESS_IDS.includes(animationId)) {
    invariant(
      record.contents.toString("utf8") === stableJson(record.document),
      `${animationId}: strict-readiness is not canonical JSON`,
    );
  }
  return {document: record.document, binding: descriptor(record)};
}

export async function buildLessonStaticStrictReadiness(options = {}) {
  const projectRoot = path.resolve(options.projectRoot || defaultProjectRoot);
  const releaseId = options.releaseId;
  invariant(
    releaseId === G5_L4_RELEASE_ID,
    `unsupported static strict-readiness release: ${releaseId}`,
  );
  const mode = options.mode || "dry-run";
  invariant(
    ["dry-run", "check", "apply"].includes(mode),
    "mode must be dry-run, check, or apply",
  );
  const expectedReleaseFingerprint =
    options.expectedReleaseFingerprint ??
    G5_L4_RELEASE_FINGERPRINT_SHA256;
  invariant(
    SHA256_PATTERN.test(expectedReleaseFingerprint),
    "expected release fingerprint is invalid",
  );
  const staticReceiptReader =
    options.staticReceiptReader ??
    readG5L4M1StaticReconciliationReceipt;
  const legacyReadinessChecker =
    options.legacyReadinessChecker ??
    buildG5L4WorkStudyStrictReadiness;
  const globals = await loadGlobals(projectRoot, {
    expectedReleaseFingerprint,
    legacyReadinessChecker,
  });
  const items = [];
  for (const member of globals.releaseDocument.members) {
    items.push(
      await buildOneMember({
        projectRoot,
        member,
        globals,
        staticReceiptReader,
      }),
    );
  }
  const managed = items.filter(({managed}) => managed);
  const retained = items.filter(({managed}) => !managed);
  invariant(
    items.length === EXPECTED_MEMBER_COUNT &&
      managed.length ===
        EXPECTED_MEMBER_COUNT - G5_L4_WORK_STUDY_READINESS_IDS.length &&
      retained.length === G5_L4_WORK_STUDY_READINESS_IDS.length &&
      new Set(items.map(({id}) => id)).size === EXPECTED_MEMBER_COUNT,
    "G5 L4 strict-readiness preflight did not partition exact 55 members into 51 managed and 4 retained",
  );
  if (mode === "check") {
    for (const item of managed) {
      invariant(
        item.outputSnapshot.exists,
        `${item.id}: strict-readiness output is missing`,
      );
      invariant(
        item.outputSnapshot.contents.toString("utf8") === item.rendered,
        `${item.id}: strict-readiness output is stale`,
      );
    }
  } else if (mode === "apply") {
    await commitStaticStrictReadinessBatch(
      projectRoot,
      managed,
      options.transactionHooks || {},
    );
  }
  const engineeringCandidates = Object.values(
    G5_L4_SOURCE_STATIC_CANDIDATE_PROFILES,
  ).map(sourceStaticCandidateDisposition);
  return {
    action:
      mode === "apply"
        ? "written-51-retained-4"
        : mode === "check"
          ? "verified-55"
          : "planned-51-retained-4",
    releaseId: G5_L4_RELEASE_ID,
    releaseFingerprintSha256: globals.releaseFingerprint,
    state: G5_L4_STATIC_STRICT_READINESS_STATE,
    memberCount: items.length,
    managedOutputCount: managed.length,
    retainedWorkStudyOutputCount: retained.length,
    outputs: items.map(({id, output, managed: isManaged, document}) => ({
      animationId: id,
      path: output,
      disposition: isManaged
        ? "managed-non-work-study-readiness"
        : "retained-existing-work-study-readiness",
      state: document.state ?? G5_L4_STATIC_STRICT_READINESS_STATE,
      workStudySelected: isManaged
        ? document.workStudySelection.selected
        : true,
      workStudySelectionStatus:
        document.workStudySelection.status,
      riskCalibrationSelected:
        document.riskCalibration?.selected ?? true,
      sourceStaticCandidate:
        Boolean(sourceStaticCandidateProfile(id)),
      coverageRequirementCount:
        document.coverageReadiness?.requirementCount ?? null,
      implementationReadiness:
        document.implementationReadiness ?? null,
      strictAcceptanceReady: false,
      published: false,
      sha256: isManaged
        ? sha256(Buffer.from(stableJson(document)))
        : null,
    })),
    engineeringCandidateSummary: {
      candidateCount: engineeringCandidates.length,
      manifestBoundSingleSpriteCandidateCount:
        engineeringCandidates.filter(({manifestBound}) => manifestBound).length,
      independentDualSpriteCompositeCandidateCount:
        engineeringCandidates.filter(({manifestBound}) => !manifestBound).length,
      fullSingleSpriteCandidateCount:
        engineeringCandidates.filter(
          ({candidateKind}) => candidateKind === "single-sprite-full",
        ).length,
      safePrefixSingleSpriteCandidateCount:
        engineeringCandidates.filter(
          ({candidateKind}) => candidateKind === "single-sprite-safe-prefix",
        ).length,
      openFrameCount: engineeringCandidates.reduce(
        (sum, {openFrameCount}) => sum + openFrameCount,
        0,
      ),
      blockedTailFrameCount: engineeringCandidates.reduce(
        (sum, {blockedTailFrameCount}) => sum + blockedTailFrameCount,
        0,
      ),
      manifestBoundCanonicalFrameCount: engineeringCandidates
        .filter(({manifestBound}) => manifestBound)
        .reduce(
          (sum, {canonicalFrameCount}) => sum + canonicalFrameCount,
          0,
        ),
      canonicalNestedCoverageCandidateCount:
        engineeringCandidates.filter(({nestedCoverageDeclared}) =>
          nestedCoverageDeclared).length,
    },
    implementationAuthorized: false,
    originalRuntimeLaunched: false,
    audioAccepted: false,
    strictCompleteCount: 0,
    publishedCount: 0,
  };
}

export function parseArguments(argv) {
  const options = {
    help: false,
    releaseId: null,
    mode: "dry-run",
    explicitMode: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--release-id") {
      invariant(options.releaseId === null, "--release-id may be supplied once");
      const value = argv[index + 1];
      invariant(value && !value.startsWith("--"), "--release-id requires a value");
      options.releaseId = value;
      index += 1;
    } else if (["--dry-run", "--check", "--apply"].includes(argument)) {
      invariant(
        options.explicitMode === null,
        "choose at most one of --dry-run, --check, or --apply",
      );
      options.explicitMode = argument.slice(2);
      options.mode = options.explicitMode;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown option: ${argument}`);
    }
  }
  invariant(
    !options.help ||
      (options.releaseId === null && options.explicitMode === null),
    "--help cannot be combined with other options",
  );
  if (!options.help) {
    invariant(options.releaseId, "--release-id is required");
    invariant(
      options.releaseId === G5_L4_RELEASE_ID,
      `unsupported static strict-readiness release: ${options.releaseId}`,
    );
  }
  delete options.explicitMode;
  return options;
}

function usage() {
  return `Usage:
  node scripts/build-lesson-static-strict-readiness.mjs --release-id ${G5_L4_RELEASE_ID} --dry-run
  node scripts/build-lesson-static-strict-readiness.mjs --release-id ${G5_L4_RELEASE_ID} --check
  node scripts/build-lesson-static-strict-readiness.mjs --release-id ${G5_L4_RELEASE_ID} --apply

The command preflights all 55 exact release members and their applied,
acceptance-neutral M1 reconciliation receipts. It retains the four existing
work-study strict-readiness files byte-for-byte and manages only the other 51.
It launches no GUI, browser, Ruffle, Animate, original runtime, or legacy
endpoint and grants no implementation, review, strict, or publication
authority.`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
  } else {
    const result = await buildLessonStaticStrictReadiness(options);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }
}
