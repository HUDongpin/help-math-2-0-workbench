import type {LessonHostRequest} from "./lesson-host-contract";

export const G678_ALG_L11_BEHAVIOR10_TRANCHE_B_SPEC = Object.freeze({
  audit: Object.freeze({
    path: "catalog/g678-alg-l11-behavior10-tranche-b-audit-v1.json",
    bytes: 139507,
    sha256:
      "2b45cee5d1503d9e98521b5ca0518500a29f8bc43a0b1c84145016dccc5289b8",
  }),
  divergenceDecision: Object.freeze({
    path:
      "catalog/g678-alg-l11-behavior10-tranche-b-source-divergence-v1.json",
    bytes: 23448,
    sha256:
      "e4214120ddff6b052487dd339efb4421bdba88cd0532cf448c8200cf1969a89e",
    exactPlacementIds: Object.freeze([
      "shared-alg001-l11-p040",
      "shared-alg001-l11-p041",
      "shared-alg001-l11-p042",
    ]),
  }),
  currentJavaScriptImplementedPlacementCount: 10,
  candidateModuleMaturity: "private-current-js",
  domRendererImplemented: true,
  registrationCandidatePlacementCount: 0,
  currentJavaScriptRegisteredPlacementCount: 0,
  productCalibrationPassed: false,
  browserProductCalibrationPassed: false,
  wholeLessonEngineeringPreviewReady: false,
  scaleOutAuthorized: false,
  releaseAuthorized: false,
  published: false,
  acceptanceEffects: Object.freeze({
    currentJavaScriptRegistered: false,
    behaviorAccepted: false,
    authoritativeOriginalRuntime: false,
    visualFidelityAccepted: false,
    audioAccepted: false,
    humanVisualAccepted: false,
    ownerAccepted: false,
    strictComplete: false,
    released: false,
    published: false,
  }),
} as const);

export type AlgL11Behavior10Family =
  | "l11-tutorial-multi-question-choice"
  | "l11-guided-tutorial-choice";

export interface AlgL11Behavior10Option {
  readonly id: "A" | "B" | "C" | "D";
  readonly sourceInstanceName: string;
  readonly sourceCharacterId: number;
  readonly correct: boolean;
}

export interface AlgL11Behavior10GuidedHit {
  readonly frame: number;
  readonly objectId: number;
  readonly depth: number;
  readonly scriptSha256: string;
}

export interface AlgL11Behavior10SvgEvidence {
  readonly path: string;
  readonly bytes: number;
  readonly sha256: string;
}

export interface AlgL11Behavior10SpecialGeometry {
  readonly kind: "number-line-graph" | "absolute-value-inequality";
  readonly expression?: "|x| < 5";
  readonly inequality?: "x > 2";
  readonly operator?: "<";
  readonly absoluteValueBars?: 2;
  readonly boundary?: 2;
  readonly boundaryClosed?: false;
  readonly rayDirection?: "right";
  readonly exactGeometryBoundByFrameSvg?: true;
  readonly exactGlyphGeometryBoundByFrameAndHelpSvg?: true;
}

export interface AlgL11Behavior10P029Feedback {
  readonly incrementLocation:
    "wrong-answer-button-before-feedback-playback";
  readonly firstWrong: Readonly<{
    quizTryCountDuringPopup: 1;
    visibleText: string;
  }>;
  readonly secondWrong: Readonly<{
    quizTryCountDuringPopup: 2;
    visibleText: string;
    autoResumeAfterFeedback: true;
    resetQuizTryCountTo: 0;
  }>;
}

export interface AlgL11Behavior10PageConfig {
  readonly animationId: string;
  readonly familyId: AlgL11Behavior10Family;
  readonly source: Readonly<{path: string; sha256: string}>;
  readonly audioCandidate: Readonly<{
    path: string;
    bytes: number;
    sha256: string;
    required: null;
    triggerEstablished: false;
    replayEstablished: false;
    accepted: false;
  }>;
  readonly mainObjectId: number;
  readonly frameDomain: string;
  readonly frameCount: number;
  readonly quizFrame: number;
  readonly resumeFrame: number;
  readonly terminalFrame: number;
  readonly guidedHits: readonly AlgL11Behavior10GuidedHit[];
  readonly feedbackEndpointCounts: Readonly<{right: 4; wrong: 4}>;
  readonly options: readonly AlgL11Behavior10Option[];
  readonly correct: Readonly<{
    sourceRightButtonId: number;
    sourceInstanceName: string;
    visibleLabel: "A" | "B" | "C" | "D";
    semanticAnswer: string;
  }>;
  readonly answerEvidence: Readonly<{
    frameSvg: AlgL11Behavior10SvgEvidence;
    hitRegionProjectionSha256: string;
    visibleLabelTextProjectionSha256: string;
    specialGeometryConclusion: AlgL11Behavior10SpecialGeometry | null;
  }>;
  readonly help: Readonly<{
    instanceName: "Mc_Popup";
    characterId: number;
    frameSvg: AlgL11Behavior10SvgEvidence;
    openButtonId: number;
    closeButtonId: number;
    staleAngleOverlay: Readonly<{
      instanceName: "Mc_PopUp";
      characterId: number;
      frameSvg: AlgL11Behavior10SvgEvidence;
      suppressedByMaintainedCandidate: true;
    }> | null;
  }>;
  readonly p029Feedback: AlgL11Behavior10P029Feedback | null;
}

const GUIDED_SCRIPT_SHA256 =
  "28b8a5b74897aa91010640e06ee0a0e619c7f89dd836d079523466f90cc8579c";

function option(id: "A" | "B" | "C" | "D",
  sourceInstanceName: string, sourceCharacterId: number, correct = false,
): AlgL11Behavior10Option {
  return Object.freeze({id, sourceInstanceName, sourceCharacterId, correct});
}

function svg(path: string, bytes: number,
  sha256: string): AlgL11Behavior10SvgEvidence {
  return Object.freeze({path, bytes, sha256});
}

function audio(path: string, bytes: number, sha256: string) {
  return Object.freeze({path, bytes, sha256, required: null,
    triggerEstablished: false as const, replayEstablished: false as const,
    accepted: false as const});
}

function hit(frame: number, objectId: number,
  depth: number): AlgL11Behavior10GuidedHit {
  return Object.freeze({frame, objectId, depth,
    scriptSha256: GUIDED_SCRIPT_SHA256});
}

export const G678_ALG_L11_BEHAVIOR10_TRANCHE_B_PAGES = Object.freeze([
  Object.freeze({
    animationId: "shared-alg001-l11-p026",
    familyId: "l11-tutorial-multi-question-choice",
    source: Object.freeze({path: "G6-G8-shared/ALG001/L11/TI/L11TI02.swf",
      sha256:
        "32b9dc25fbedfaa35bacfdf1a69836cbe63526a6de601c4b65cce3fa87dcc033"}),
    audioCandidate: audio("G6-G8-shared/ALG001/L11/SA/L11TI02.mp3", 364224,
      "6a144e7e4aa3dcc4a1c58f0047073fff6d56a4a7a17d1396a93b69847377e1b0"),
    mainObjectId: 228, frameDomain: "sprite-228", frameCount: 294,
    quizFrame: 180, resumeFrame: 181, terminalFrame: 294,
    guidedHits: Object.freeze([]),
    feedbackEndpointCounts: Object.freeze({right: 4, wrong: 4}),
    options: Object.freeze([option("A", "AnsBtn1", 75),
      option("B", "AnsBtn3", 75), option("C", "AnsBtn2", 76),
      option("D", "AnsBtn4", 77, true)]),
    correct: Object.freeze({sourceRightButtonId: 77,
      sourceInstanceName: "AnsBtn4", visibleLabel: "D",
      semanticAnswer: "y ≥ 18"}),
    answerEvidence: Object.freeze({frameSvg: svg(
      "shared-alg001-l11-p026/main-frame-svg/DefineSprite_228/180.svg", 148051,
      "88c81f68e87e1ca46cc21bec48694122a6814baec0e2a86eed96dc96b90b4b04"),
    hitRegionProjectionSha256:
      "eb54f130b3f11fd28e5a1a7385d7f8d1e0a8c3e1b7856e6f11a15bc378be457f",
    visibleLabelTextProjectionSha256:
      "2dd107809258368a83072235d93247e114c1ae546ac89f14f63798f356227700",
    specialGeometryConclusion: null}),
    help: Object.freeze({instanceName: "Mc_Popup", characterId: 45,
      frameSvg: svg("shared-alg001-l11-p026/help-popup-svg/" +
        "DefineSprite_45_show mc1_new_001/1.svg", 67013,
      "f5c736113ea8da59c13e69bcb22c65daf1b3e943e16b697fbf1fa9c83f82219e"),
      openButtonId: 46, closeButtonId: 87, staleAngleOverlay: null}),
    p029Feedback: null,
  }),
  Object.freeze({
    animationId: "shared-alg001-l11-p027",
    familyId: "l11-tutorial-multi-question-choice",
    source: Object.freeze({path: "G6-G8-shared/ALG001/L11/TI/L11TI03.swf",
      sha256:
        "fca648195f2eb81ed8bce7ec86baa03c764e60e2c12bb76e3d3d79c85bc2ba74"}),
    audioCandidate: audio("G6-G8-shared/ALG001/L11/SA/L11TI03.mp3", 95424,
      "581dee46121b47525ec3b4aee1277dab68e07dbd0b8540515f78fb3e9a5d2692"),
    mainObjectId: 230, frameDomain: "sprite-230", frameCount: 265,
    quizFrame: 133, resumeFrame: 134, terminalFrame: 265,
    guidedHits: Object.freeze([]),
    feedbackEndpointCounts: Object.freeze({right: 4, wrong: 4}),
    options: Object.freeze([option("A", "AnsBtn1", 71),
      option("B", "AnsBtn2", 73), option("C", "AnsBtn3", 72, true),
      option("D", "AnsBtn4", 73)]),
    correct: Object.freeze({sourceRightButtonId: 72,
      sourceInstanceName: "AnsBtn3", visibleLabel: "C",
      semanticAnswer: "0 < n < 5"}),
    answerEvidence: Object.freeze({frameSvg: svg(
      "shared-alg001-l11-p027/main-frame-svg/DefineSprite_230/133.svg", 145641,
      "098d6a1ec051296d95a64d2871d3ce0a359b7617592f02b8b04feb6351bea708"),
    hitRegionProjectionSha256:
      "ed14c2f77eb7b1c35fae5fdf35c29c0aeca4c5e3813616305210111ae8c4dc2f",
    visibleLabelTextProjectionSha256:
      "0cc053b8a503ee74901049f31326761492360fe530fe00b76db2b78e5fd1f6e3",
    specialGeometryConclusion: null}),
    help: Object.freeze({instanceName: "Mc_Popup", characterId: 44,
      frameSvg: svg("shared-alg001-l11-p027/help-popup-svg/" +
        "DefineSprite_44_show mc1_new_001/1.svg", 67084,
      "6ab26d62d41b8ff1547b009f2fbe5ccf8eae90cb0712b8d8ae71775d3db0807c"),
      openButtonId: 45, closeButtonId: 83, staleAngleOverlay: null}),
    p029Feedback: null,
  }),
  Object.freeze({
    animationId: "shared-alg001-l11-p028",
    familyId: "l11-tutorial-multi-question-choice",
    source: Object.freeze({path: "G6-G8-shared/ALG001/L11/TI/L11TI04.swf",
      sha256:
        "3548b5531d147762bd7577116fd9258eb4cff0703bf9721e608047ec2ee6492a"}),
    audioCandidate: audio("G6-G8-shared/ALG001/L11/SA/L11TI04.mp3", 62160,
      "f181abe7e96c2ee5e37b106925ea2c95c9a25d22477e38f94b5cb8841fd44717"),
    mainObjectId: 259, frameDomain: "sprite-259", frameCount: 397,
    quizFrame: 127, resumeFrame: 128, terminalFrame: 397,
    guidedHits: Object.freeze([]),
    feedbackEndpointCounts: Object.freeze({right: 4, wrong: 4}),
    options: Object.freeze([option("A", "AnsBtn1", 95),
      option("B", "AnsBtn2", 95), option("C", "AnsBtn3", 96, true),
      option("D", "AnsBtn4", 95)]),
    correct: Object.freeze({sourceRightButtonId: 96,
      sourceInstanceName: "AnsBtn3", visibleLabel: "C",
      semanticAnswer:
        "number-line graph of x > 2: open boundary at 2 and ray to the right"}),
    answerEvidence: Object.freeze({frameSvg: svg(
      "shared-alg001-l11-p028/main-frame-svg/DefineSprite_259/127.svg", 165380,
      "01d618d791158215ea7c9a83198166a96f10e4133a8a75d3e2b69d0dca8f383a"),
    hitRegionProjectionSha256:
      "3fceeb666c2d0b281a3bb4a22b57ebaa0ffacc8613c570f178d7ba6a3fb925ea",
    visibleLabelTextProjectionSha256:
      "3e4db0df3eecf251137c8d0e582886865eb76a3183197864437185d60b7c3272",
    specialGeometryConclusion: Object.freeze({kind: "number-line-graph",
      inequality: "x > 2", boundary: 2, boundaryClosed: false,
      rayDirection: "right", exactGeometryBoundByFrameSvg: true})}),
    help: Object.freeze({instanceName: "Mc_Popup", characterId: 36,
      frameSvg: svg("shared-alg001-l11-p028/help-popup-svg/" +
        "DefineSprite_36_show mc1_new_001/1.svg", 37074,
      "66f32a7ffd9037fcdd3c1e3d8a35c65d1b81d50891455842618cc0362349d7c1"),
      openButtonId: 37, closeButtonId: 106, staleAngleOverlay: null}),
    p029Feedback: null,
  }),
  Object.freeze({
    animationId: "shared-alg001-l11-p029",
    familyId: "l11-tutorial-multi-question-choice",
    source: Object.freeze({path: "G6-G8-shared/ALG001/L11/TI/L11TI05.swf",
      sha256:
        "863cc41d0308cacbb4b0657f8034a7ec3a1f148abf5651d619ddfc1fcfc41bf8"}),
    audioCandidate: audio("G6-G8-shared/ALG001/L11/SA/L11TI05.mp3", 104832,
      "9e463eda9c13d3c647c58371733e82981e00c05260bbf08a3f542cab84f59498"),
    mainObjectId: 242, frameDomain: "sprite-242", frameCount: 190,
    quizFrame: 61, resumeFrame: 62, terminalFrame: 190,
    guidedHits: Object.freeze([]),
    feedbackEndpointCounts: Object.freeze({right: 4, wrong: 4}),
    options: Object.freeze([option("A", "AnsBtn1", 83),
      option("B", "AnsBtn2", 85, true), option("C", "AnsBtn3", 84),
      option("D", "AnsBtn4", 84)]),
    correct: Object.freeze({sourceRightButtonId: 85,
      sourceInstanceName: "AnsBtn2", visibleLabel: "B",
      semanticAnswer: "−5 < x < 8"}),
    answerEvidence: Object.freeze({frameSvg: svg(
      "shared-alg001-l11-p029/main-frame-svg/DefineSprite_242/61.svg", 151508,
      "191c711aa1f9616fc891ea9980bf6510e7b1c26b859aaa1c907fb4fe29d9a7ae"),
    hitRegionProjectionSha256:
      "7afb4d1a18e94d43029518a39161e728a8cc548a0c59c120e4f2a0742d30a851",
    visibleLabelTextProjectionSha256:
      "af520ec877e61982a630e173bb941227247f8e839cdeba07844b5dcf17c36aa3",
    specialGeometryConclusion: null}),
    help: Object.freeze({instanceName: "Mc_Popup", characterId: 56,
      frameSvg: svg("shared-alg001-l11-p029/help-popup-svg/" +
        "DefineSprite_56_show mc1_new_001/1.svg", 64992,
      "f32c784ff696b61a7ba63ffbca1a543c238e9035f49bc0cf34d81af13aea3cb6"),
      openButtonId: 57, closeButtonId: 95, staleAngleOverlay: null}),
    p029Feedback: Object.freeze({
      incrementLocation: "wrong-answer-button-before-feedback-playback",
      firstWrong: Object.freeze({quizTryCountDuringPopup: 1,
        visibleText: "Find the inequality that has x greater than 5 and " +
          "less than 8. Try again."}),
      secondWrong: Object.freeze({quizTryCountDuringPopup: 2,
        visibleText: "Find the inequality that has x greater than 5 and " +
          "less than 8.", autoResumeAfterFeedback: true,
        resetQuizTryCountTo: 0}),
    }),
  }),
  Object.freeze({
    animationId: "shared-alg001-l11-p030",
    familyId: "l11-tutorial-multi-question-choice",
    source: Object.freeze({path: "G6-G8-shared/ALG001/L11/TI/L11TI06.swf",
      sha256:
        "619232660ad85c779fc4e50d0d8245275ed3a791d09f5cb560b479c5fbfc8a37"}),
    audioCandidate: audio("G6-G8-shared/ALG001/L11/SA/L11TI06.mp3", 86688,
      "d4b491ad87000f25a63c7764780c7fca3b96cfed4cf3853dac390d9766f39c63"),
    mainObjectId: 236, frameDomain: "sprite-236", frameCount: 195,
    quizFrame: 63, resumeFrame: 64, terminalFrame: 195,
    guidedHits: Object.freeze([]),
    feedbackEndpointCounts: Object.freeze({right: 4, wrong: 4}),
    options: Object.freeze([option("A", "AnsBtn1", 85),
      option("B", "AnsBtn2", 87), option("C", "AnsBtn3", 86, true),
      option("D", "AnsBtn4", 85)]),
    correct: Object.freeze({sourceRightButtonId: 86,
      sourceInstanceName: "AnsBtn3", visibleLabel: "C",
      semanticAnswer: "|x| < 5"}),
    answerEvidence: Object.freeze({frameSvg: svg(
      "shared-alg001-l11-p030/main-frame-svg/DefineSprite_236/63.svg", 144677,
      "b0da2f230a6377c131f156824749ae60d87a3b9b9e7ee9f09062c23aae25cb0c"),
    hitRegionProjectionSha256:
      "059cb28c0222361549bc07a05d6d1b1b41c2b0ee56aecb18b997b19c75388cc1",
    visibleLabelTextProjectionSha256:
      "cfee192312da75410b7c29b066f47e12e75ed8bcd79665ead120f67e7ba208ba",
    specialGeometryConclusion: Object.freeze({kind: "absolute-value-inequality",
      expression: "|x| < 5", operator: "<", absoluteValueBars: 2,
      exactGlyphGeometryBoundByFrameAndHelpSvg: true})}),
    help: Object.freeze({instanceName: "Mc_Popup", characterId: 55,
      frameSvg: svg("shared-alg001-l11-p030/help-popup-svg/" +
        "DefineSprite_55_show mc1_new_001/1.svg", 55449,
      "96cab695f0877f1a937d90948700aba1a8082c11eb9ce623ea02f1ebd697fb3d"),
      openButtonId: 56, closeButtonId: 97, staleAngleOverlay: null}),
    p029Feedback: null,
  }),
  Object.freeze({
    animationId: "shared-alg001-l11-p031",
    familyId: "l11-tutorial-multi-question-choice",
    source: Object.freeze({path: "G6-G8-shared/ALG001/L11/TI/L11TI07.swf",
      sha256:
        "2dc3eca3d8241ebde8dd4a7233d816a7e8b32ddb07d098ab25874f9b82b712d8"}),
    audioCandidate: audio("G6-G8-shared/ALG001/L11/SA/L11TI07.mp3", 407232,
      "c594b66fc3ca6bb316c79e129abe4576df57e04c65567c2de96a2b91c67bf2b0"),
    mainObjectId: 230, frameDomain: "sprite-230", frameCount: 478,
    quizFrame: 131, resumeFrame: 132, terminalFrame: 478,
    guidedHits: Object.freeze([]),
    feedbackEndpointCounts: Object.freeze({right: 4, wrong: 4}),
    options: Object.freeze([option("A", "AnsBtn1", 71),
      option("B", "AnsBtn2", 73), option("C", "AnsBtn3", 72, true),
      option("D", "AnsBtn4", 73)]),
    correct: Object.freeze({sourceRightButtonId: 72,
      sourceInstanceName: "AnsBtn3", visibleLabel: "C",
      semanticAnswer: "x > 5"}),
    answerEvidence: Object.freeze({frameSvg: svg(
      "shared-alg001-l11-p031/main-frame-svg/DefineSprite_230/131.svg", 171247,
      "828a5596c5c0b97c4da9e36b2d07f8acfe2264cf4b938f8580398884f9a85c86"),
    hitRegionProjectionSha256:
      "5a97dee1c772f0c974c8c9da1aaefd0b9218d93ec352f45d86581d12be1cd35f",
    visibleLabelTextProjectionSha256:
      "845c8ec3bff705d267427629ddda43b54beba60a3af4ec42faea892e9c64726c",
    specialGeometryConclusion: null}),
    help: Object.freeze({instanceName: "Mc_Popup", characterId: 45,
      frameSvg: svg("shared-alg001-l11-p031/help-popup-svg/" +
        "DefineSprite_45_show mc1_new_001/1.svg", 99230,
      "54202ca0c3a920c2181de2fad08ac1d204f7b13bfb365fd5b3e92df5f5b13c93"),
      openButtonId: 46, closeButtonId: 83, staleAngleOverlay: null}),
    p029Feedback: null,
  }),
  Object.freeze({
    animationId: "shared-alg001-l11-p032",
    familyId: "l11-tutorial-multi-question-choice",
    source: Object.freeze({path: "G6-G8-shared/ALG001/L11/TI/L11TI08.swf",
      sha256:
        "79f9cd6033c59329e4fd91f1fa9d54ce6bb4bc63e8d3250f1822b0f79452b0fb"}),
    audioCandidate: audio("G6-G8-shared/ALG001/L11/SA/L11TI08.mp3", 173712,
      "a2480efd25b912c4a444d2ea2f8c0f89ccb59db951a67599c2ecbc46b8e34160"),
    mainObjectId: 220, frameDomain: "sprite-220", frameCount: 239,
    quizFrame: 128, resumeFrame: 129, terminalFrame: 239,
    guidedHits: Object.freeze([]),
    feedbackEndpointCounts: Object.freeze({right: 4, wrong: 4}),
    options: Object.freeze([option("A", "AnsBtn1", 70),
      option("B", "AnsBtn2", 70), option("C", "AnsBtn4", 70),
      option("D", "AnsBtn3", 71, true)]),
    correct: Object.freeze({sourceRightButtonId: 71,
      sourceInstanceName: "AnsBtn3", visibleLabel: "D",
      semanticAnswer: "miles ≥ 500"}),
    answerEvidence: Object.freeze({frameSvg: svg(
      "shared-alg001-l11-p032/main-frame-svg/DefineSprite_220/128.svg", 146161,
      "9b0d0765897170b6471af72601617744b8ed8d23d6f3e107f2050b9236d34666"),
    hitRegionProjectionSha256:
      "ee4c49553a4f8329dcf6654f2323f7465397700955f2c2cb874f1f4692e27d34",
    visibleLabelTextProjectionSha256:
      "23e38b40271294577e3344ba0a7bc324df0432ca534171c05e7b680cd07a39c6",
    specialGeometryConclusion: null}),
    help: Object.freeze({instanceName: "Mc_Popup", characterId: 44,
      frameSvg: svg("shared-alg001-l11-p032/help-popup-svg/" +
        "DefineSprite_44_show mc1_new_001/1.svg", 67084,
      "62ed128edd4ca1b40f3da0c856f46bec0c1c55aa533507dd1726ff9421b0e2c0"),
      openButtonId: 45, closeButtonId: 81, staleAngleOverlay: null}),
    p029Feedback: null,
  }),
  Object.freeze({
    animationId: "shared-alg001-l11-p040",
    familyId: "l11-guided-tutorial-choice",
    source: Object.freeze({path: "G6-G8-shared/ALG001/L11/TS/L11TS07.swf",
      sha256:
        "d6f115a52d6778b04891bb4b9f991a60718f17553a947536eb813ed10d0375b5"}),
    audioCandidate: audio("G6-G8-shared/ALG001/L11/SA/L11TS07.mp3", 109200,
      "8f6e651d213407a9a18301d920110d2419e1a217f5398984c61b7b289e5b6625"),
    mainObjectId: 351, frameDomain: "sprite-351", frameCount: 829,
    quizFrame: 812, resumeFrame: 813, terminalFrame: 829,
    guidedHits: Object.freeze([hit(338, 71, 234), hit(338, 73, 236),
      hit(497, 73, 285), hit(629, 71, 235), hit(753, 71, 234)]),
    feedbackEndpointCounts: Object.freeze({right: 4, wrong: 4}),
    options: Object.freeze([option("A", "AnsBtn3", 301),
      option("B", "AnsBtn4", 301), option("C", "AnsBtn1", 300, true),
      option("D", "AnsBtn2", 301)]),
    correct: Object.freeze({sourceRightButtonId: 300,
      sourceInstanceName: "AnsBtn1", visibleLabel: "C",
      semanticAnswer: "graph beginning at 4 and continuing toward greater values"}),
    answerEvidence: Object.freeze({frameSvg: svg(
      "shared-alg001-l11-p040/main-frame-svg/DefineSprite_351/812.svg", 371650,
      "6732e429b7253e9592be5afa3278799b6d0d5a39edc440ab92f412a7b1efb79b"),
    hitRegionProjectionSha256:
      "2ef32e62c0bbfd6a12a473abdca40e174c8a657e25ec9ab1a0a2e110cb33acb9",
    visibleLabelTextProjectionSha256:
      "e8fdf2e81766080fec68ad7ef298c46e64a8ac796fb5674d26d6da29472060e8",
    specialGeometryConclusion: null}),
    help: Object.freeze({instanceName: "Mc_Popup", characterId: 335,
      frameSvg: svg("shared-alg001-l11-p040/help-popup-svg/" +
        "DefineSprite_335/1.svg", 79698,
      "19fecfb08ff8a8b52deeadf280b4e183599a2d080d3d4cf5fbdc9de1c578b377"),
      openButtonId: 13, closeButtonId: 303,
      staleAngleOverlay: Object.freeze({instanceName: "Mc_PopUp",
        characterId: 350, frameSvg: svg(
          "shared-alg001-l11-p040/stale-angle-overlay-svg/" +
            "DefineSprite_350/1.svg", 4939,
          "e154a8d2d388fcc5d2a2e349424af50945dac76e603739c36d163fc324d3e5c0"),
        suppressedByMaintainedCandidate: true})}),
    p029Feedback: null,
  }),
  Object.freeze({
    animationId: "shared-alg001-l11-p041",
    familyId: "l11-guided-tutorial-choice",
    source: Object.freeze({path: "G6-G8-shared/ALG001/L11/TS/L11TS08.swf",
      sha256:
        "3bfac12aec4982064c1041ce296c185299f7fc0247b46144f1144a10ab812e6c"}),
    audioCandidate: audio("G6-G8-shared/ALG001/L11/SA/L11TS08.mp3", 45696,
      "ddb9432fbaf519d892b5aa38736b9c4a5ba5e56a2f89a7952e52455a6e95e9d1"),
    mainObjectId: 338, frameDomain: "sprite-338", frameCount: 901,
    quizFrame: 884, resumeFrame: 885, terminalFrame: 901,
    guidedHits: Object.freeze([hit(415, 46, 66), hit(415, 48, 68),
      hit(573, 48, 117), hit(705, 46, 67), hit(829, 46, 66)]),
    feedbackEndpointCounts: Object.freeze({right: 4, wrong: 4}),
    options: Object.freeze([option("A", "AnsBtn3", 299),
      option("B", "AnsBtn4", 299), option("C", "AnsBtn1", 298, true),
      option("D", "AnsBtn2", 299)]),
    correct: Object.freeze({sourceRightButtonId: 298,
      sourceInstanceName: "AnsBtn1", visibleLabel: "C",
      semanticAnswer: "x < 15"}),
    answerEvidence: Object.freeze({frameSvg: svg(
      "shared-alg001-l11-p041/main-frame-svg/DefineSprite_338/884.svg", 322508,
      "7653901a7d6b99394428d932f2e7530f112f3982c37042fb5d2581a234da1551"),
    hitRegionProjectionSha256:
      "087db9b52dbf01d4779c7af4b216624ad08aa43018be548299ff10855a1a8d98",
    visibleLabelTextProjectionSha256:
      "92712d8753232f9e7e16ffa88ab2f0e525be51f40f31c9d0566264981ec46ec8",
    specialGeometryConclusion: null}),
    help: Object.freeze({instanceName: "Mc_Popup", characterId: 322,
      frameSvg: svg("shared-alg001-l11-p041/help-popup-svg/" +
        "DefineSprite_322/1.svg", 113410,
      "60f23be2dc8af25f2c7bbe1114f8eefccea24554209ef22e4f4bb7a144327a2c"),
      openButtonId: 13, closeButtonId: 301,
      staleAngleOverlay: Object.freeze({instanceName: "Mc_PopUp",
        characterId: 337, frameSvg: svg(
          "shared-alg001-l11-p041/stale-angle-overlay-svg/" +
            "DefineSprite_337/1.svg", 4939,
          "db4bcfbdd951290a0693b390f0b5267def4cc1940be56214121a90b42b0ab8f4"),
        suppressedByMaintainedCandidate: true})}),
    p029Feedback: null,
  }),
  Object.freeze({
    animationId: "shared-alg001-l11-p042",
    familyId: "l11-guided-tutorial-choice",
    source: Object.freeze({path: "G6-G8-shared/ALG001/L11/TS/L11TS09.swf",
      sha256:
        "58b8366ea544632a77d1903b7f5a654ddf91311ef9a8dfcca9a7ca8528f6669e"}),
    audioCandidate: audio("G6-G8-shared/ALG001/L11/SA/L11TS09.mp3", 215040,
      "d5b51e71afef5e28101cb6b9c23f42fcc268c4b6bbb4bb1544ab82bf840f960f"),
    mainObjectId: 303, frameDomain: "sprite-303", frameCount: 999,
    quizFrame: 982, resumeFrame: 983, terminalFrame: 999,
    guidedHits: Object.freeze([hit(499, 47, 71), hit(499, 49, 73),
      hit(660, 49, 122), hit(793, 47, 72), hit(917, 47, 71)]),
    feedbackEndpointCounts: Object.freeze({right: 4, wrong: 4}),
    options: Object.freeze([option("A", "AnsBtn3", 272),
      option("B", "AnsBtn4", 272), option("C", "AnsBtn1", 271, true),
      option("D", "AnsBtn2", 272)]),
    correct: Object.freeze({sourceRightButtonId: 271,
      sourceInstanceName: "AnsBtn1", visibleLabel: "C",
      semanticAnswer: "500 < v < 550"}),
    answerEvidence: Object.freeze({frameSvg: svg(
      "shared-alg001-l11-p042/main-frame-svg/DefineSprite_303/982.svg", 304919,
      "5ddd5e56e359c270c091cffb42a20394eeb221b9dd9423d01d3dc82af4d14ffd"),
    hitRegionProjectionSha256:
      "19841b82bf0415acc2d04ba069c9e227194b736fa757ea04b71dc288ca4b9032",
    visibleLabelTextProjectionSha256:
      "0509f27e6054716be415cfb354a756ab857b854dfb0b441a54b5a178093351d2",
    specialGeometryConclusion: null}),
    help: Object.freeze({instanceName: "Mc_Popup", characterId: 287,
      frameSvg: svg("shared-alg001-l11-p042/help-popup-svg/" +
        "DefineSprite_287/1.svg", 52701,
      "ccd776ec6f583425899512debde0f6168b0786bb4be5c99ff6d8974c81cd8781"),
      openButtonId: 13, closeButtonId: 274,
      staleAngleOverlay: Object.freeze({instanceName: "Mc_PopUp",
        characterId: 302, frameSvg: svg(
          "shared-alg001-l11-p042/stale-angle-overlay-svg/" +
            "DefineSprite_302/1.svg", 4939,
          "fe3332ad4e06f14265cd752d45ff90e3ad2422e70b83e59caac1ca06b21ed26e"),
        suppressedByMaintainedCandidate: true})}),
    p029Feedback: null,
  }),
] satisfies readonly AlgL11Behavior10PageConfig[]);

const EXPECTED_IDS = Object.freeze([
  "shared-alg001-l11-p026", "shared-alg001-l11-p027",
  "shared-alg001-l11-p028", "shared-alg001-l11-p029",
  "shared-alg001-l11-p030", "shared-alg001-l11-p031",
  "shared-alg001-l11-p032", "shared-alg001-l11-p040",
  "shared-alg001-l11-p041", "shared-alg001-l11-p042",
]);

export function assertAlgL11Behavior10PageConfigs(
  pages: readonly AlgL11Behavior10PageConfig[],
) {
  const ids = pages.map((page) => page.animationId);
  if (JSON.stringify(ids) !== JSON.stringify(EXPECTED_IDS) ||
    pages.filter((page) => page.familyId ===
      "l11-tutorial-multi-question-choice").length !== 7 ||
    pages.filter((page) => page.familyId ===
      "l11-guided-tutorial-choice").length !== 3 ||
    pages.some((page) => page.frameDomain !== `sprite-${page.mainObjectId}` ||
      page.quizFrame + 1 !== page.resumeFrame ||
      page.terminalFrame !== page.frameCount || page.options.length !== 4 ||
      new Set(page.options.map((entry) => entry.id)).size !== 4 ||
      page.options.filter((entry) => entry.correct).length !== 1 ||
      page.options.find((entry) => entry.correct)?.id !==
        page.correct.visibleLabel ||
      page.options.find((entry) => entry.correct)?.sourceInstanceName !==
        page.correct.sourceInstanceName ||
      page.audioCandidate.accepted !== false ||
      page.audioCandidate.triggerEstablished !== false ||
      page.audioCandidate.replayEstablished !== false)) {
    throw new Error("ALG L11 behavior10 exact page config drifted");
  }
  const guided = pages.filter((page) => page.familyId ===
    "l11-guided-tutorial-choice");
  if (guided.some((page) => page.correct.visibleLabel !== "C" ||
    page.correct.sourceInstanceName !== "AnsBtn1" ||
    page.guidedHits.length !== 5 || !page.help.staleAngleOverlay ||
    page.help.staleAngleOverlay.suppressedByMaintainedCandidate !== true) ||
    pages.slice(0, 7).some((page) => page.guidedHits.length !== 0 ||
      page.help.staleAngleOverlay !== null)) {
    throw new Error("ALG L11 behavior10 family/divergence config drifted");
  }
  return true;
}

assertAlgL11Behavior10PageConfigs(G678_ALG_L11_BEHAVIOR10_TRANCHE_B_PAGES);

export type AlgL11Behavior10Phase =
  | "timeline"
  | "guided-stop"
  | "choosing"
  | "help-open"
  | "right-feedback"
  | "wrong-feedback-1"
  | "wrong-feedback-2"
  | "resumed"
  | "terminal";

export interface AlgL11Behavior10State {
  readonly phase: AlgL11Behavior10Phase;
  readonly activeStopFrame: number | null;
  readonly resolvedStopFrame: number | null;
  readonly quizTryCount: number;
  readonly selectedChoice: "A" | "B" | "C" | "D" | null;
  readonly feedbackBranch: number | null;
  readonly blockedReason: "practice-feedback-host-blocked" |
    "practice-feedback-reset-blocked" | null;
  readonly replay: number;
}

export type AlgL11Behavior10Event =
  | Readonly<{type: "observe-frame"; frame: number}>
  | Readonly<{type: "continue-guided"; input: "mouse" | "keyboard"}>
  | Readonly<{type: "open-help"; input: "mouse" | "keyboard"}>
  | Readonly<{type: "close-help"; input: "mouse" | "keyboard"}>
  | Readonly<{type: "choose"; choiceId: "A" | "B" | "C" | "D";
      input: "mouse" | "keyboard"; hostAllowed: boolean;
      feedbackBranch: number}>
  | Readonly<{type: "dismiss-feedback"; input: "mouse" | "keyboard";
      hostResetAllowed: boolean}>
  | Readonly<{type: "replay"; input: "mouse" | "keyboard"}>;

function phaseForFrame(config: AlgL11Behavior10PageConfig,
  frame: number): AlgL11Behavior10Phase {
  if (frame >= config.terminalFrame) return "terminal";
  if (frame === config.quizFrame) return "choosing";
  if (config.guidedHits.some((entry) => entry.frame === frame)) {
    return "guided-stop";
  }
  return frame > config.quizFrame ? "resumed" : "timeline";
}

export function createAlgL11Behavior10State(
  config: AlgL11Behavior10PageConfig,
  frame = 1,
  replay = 0,
): AlgL11Behavior10State {
  return Object.freeze({phase: phaseForFrame(config, frame),
    activeStopFrame: phaseForFrame(config, frame) === "guided-stop" ||
      phaseForFrame(config, frame) === "choosing" ? frame : null,
    resolvedStopFrame: null, quizTryCount: 0, selectedChoice: null,
    feedbackBranch: null, blockedReason: null, replay});
}

export function reduceAlgL11Behavior10(
  config: AlgL11Behavior10PageConfig,
  state: AlgL11Behavior10State,
  event: AlgL11Behavior10Event,
): AlgL11Behavior10State {
  if (event.type === "replay") {
    return createAlgL11Behavior10State(config, 1, state.replay + 1);
  }
  if (event.type === "observe-frame") {
    if (["help-open", "right-feedback", "wrong-feedback-1",
      "wrong-feedback-2"].includes(state.phase) &&
      event.frame === state.activeStopFrame) return state;
    return createAlgL11Behavior10State(config, event.frame, state.replay);
  }
  if (event.type === "continue-guided") {
    return state.phase === "guided-stop"
      ? Object.freeze({...state, phase: "resumed" as const,
        resolvedStopFrame: state.activeStopFrame, activeStopFrame: null})
      : state;
  }
  if (event.type === "open-help") {
    return state.phase === "choosing"
      ? Object.freeze({...state, phase: "help-open" as const}) : state;
  }
  if (event.type === "close-help") {
    return state.phase === "help-open"
      ? Object.freeze({...state, phase: "choosing" as const}) : state;
  }
  if (event.type === "choose") {
    if (state.phase !== "choosing") return state;
    if (!event.hostAllowed) return Object.freeze({...state,
      blockedReason: "practice-feedback-host-blocked" as const});
    const selected = config.options.find((choice) =>
      choice.id === event.choiceId);
    if (!selected) return state;
    if (selected.correct) return Object.freeze({...state,
      phase: "right-feedback" as const, selectedChoice: event.choiceId,
      feedbackBranch: event.feedbackBranch, blockedReason: null});
    const p029Count = config.p029Feedback ? state.quizTryCount + 1 :
      state.quizTryCount;
    const secondWrong = config.p029Feedback ? p029Count >= 2 :
      state.quizTryCount >= 1;
    return Object.freeze({...state,
      phase: secondWrong ? "wrong-feedback-2" as const :
        "wrong-feedback-1" as const,
      quizTryCount: p029Count, selectedChoice: event.choiceId,
      feedbackBranch: event.feedbackBranch, blockedReason: null});
  }
  if (!["right-feedback", "wrong-feedback-1", "wrong-feedback-2"]
    .includes(state.phase)) return state;
  if (!event.hostResetAllowed) return Object.freeze({...state,
    blockedReason: "practice-feedback-reset-blocked" as const});
  if (state.phase === "wrong-feedback-1") {
    return Object.freeze({...state, phase: "choosing" as const,
      quizTryCount: config.p029Feedback ? state.quizTryCount : 1,
      selectedChoice: null, feedbackBranch: null, blockedReason: null});
  }
  return Object.freeze({...state, phase: "resumed" as const,
    resolvedStopFrame: state.activeStopFrame,
    activeStopFrame: null, quizTryCount: 0, selectedChoice: null,
    feedbackBranch: null, blockedReason: null});
}

export function buildAlgL11Behavior10FeedbackRequest(
  config: AlgL11Behavior10PageConfig,
  choiceId: "A" | "B" | "C" | "D",
  seed: number,
): Readonly<{request: Extract<LessonHostRequest,
  {type: "record-practice-feedback"}>; branchIndex: number}> {
  const selected = config.options.find((entry) => entry.id === choiceId);
  if (!selected) throw new Error("ALG L11 behavior10 choice is invalid");
  const branchCount = selected.correct
    ? config.feedbackEndpointCounts.right
    : config.feedbackEndpointCounts.wrong;
  const branchIndex = ((Math.trunc(seed) % branchCount) + branchCount) %
    branchCount;
  return Object.freeze({request: Object.freeze({
    type: "record-practice-feedback" as const,
    interactionId: config.animationId,
    outcome: selected.correct ? "correct" as const : "incorrect" as const,
    branchIndex, branchCount,
  }), branchIndex});
}

export function feedbackTextForAlgL11Behavior10(
  config: AlgL11Behavior10PageConfig,
  state: AlgL11Behavior10State,
) {
  if (state.phase === "right-feedback") return "Correct source-labeled option.";
  if (config.p029Feedback && state.phase === "wrong-feedback-1") {
    return config.p029Feedback.firstWrong.visibleText;
  }
  if (config.p029Feedback && state.phase === "wrong-feedback-2") {
    return config.p029Feedback.secondWrong.visibleText;
  }
  if (state.phase === "wrong-feedback-1") {
    return "Incorrect source-labeled option. Try again.";
  }
  if (state.phase === "wrong-feedback-2") {
    return "Incorrect source-labeled option. Continue.";
  }
  return null;
}
