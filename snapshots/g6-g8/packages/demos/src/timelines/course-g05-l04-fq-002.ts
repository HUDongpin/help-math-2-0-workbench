import type {G5L4Fq23QuestionAtlasConfig} from "../g5-l4-fq23-question-atlas-candidate";

export const COURSE_G05_L04_FQ_002_SOURCE = Object.freeze({
  swf:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/FQ/L4FQ02.swf",
  swfBytes: 46_677,
  swfSha256:
    "f54e7c22806c9d093253333129a9204279d112185eaca1ce6fefaa3ef22961a7",
  fla:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/FQ/L4FQ02.fla",
  flaBytes: 2_766_848,
  flaSha256:
    "0bade24709013be4473901f182e0f1c5c61d240b5ad4952bbefce2a02dcb2629",
});

export const COURSE_G05_L04_FQ_002_ACCEPTANCE_EFFECTS = Object.freeze({
  implementationAuthorized: false,
  authoritativeOriginalRuntime: false,
  naturalRuntimeReachabilityComplete: false,
  frameDomainDispositionComplete: false,
  randomSelectionParityComplete: false,
  answerBehaviorComplete: false,
  scoringComplete: false,
  reviewComplete: false,
  bilingualVisualParityComplete: false,
  audioAccepted: false,
  timingComplete: false,
  reportingComplete: false,
  replayParityComplete: false,
  fullFrameRmseComplete: false,
  productQaComplete: false,
  accessibilityQaComplete: false,
  engineeringReviewAccepted: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  published: false,
} as const);

export const COURSE_G05_L04_FQ_002_CONFIG = Object.freeze({
  animationId: "course-g05-l04-fq-002",
  title: "Number Lines Final Quiz 2 — source-static question atlas inspection",
  source: COURSE_G05_L04_FQ_002_SOURCE,
  asset: Object.freeze({
    source:
      "/flash-assets/courses/course-g05-l04-fq-002/canvas-renderer.js",
    sha256:
      "73f1525997c667b351031d6f3e8ec09130970aee57dbe9211735844634b9e809",
  }),
  sourceSelection: Object.freeze({
    kind: "random-without-replacement",
    sourceQuestionCount: 18,
    sourcePresentedQuestionCount: 10,
    sourceExpression: "random(_global.quizLabelArray.length)",
    executedByCandidate: false,
  }),
  currentJavascriptBehavior: Object.freeze({
    questionSequenceEnabled: true,
    answerSubmissionEnabled: true,
    scoringEnabled: true,
    textReviewEnabled: true,
    replayResetEnabled: true,
    executesLegacyActionScript: false,
    exactAvm1RandomOrderEstablished: false,
    sourceReviewVisualParityEstablished: false,
    reportingNetworkEnabled: false,
  }),
  acceptanceEffects: COURSE_G05_L04_FQ_002_ACCEPTANCE_EFFECTS,
} satisfies G5L4Fq23QuestionAtlasConfig);
