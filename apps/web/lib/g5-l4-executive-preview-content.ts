export type G5L4ExecutivePreviewSceneKind =
  | 'introduction'
  | 'your-world'
  | 'number-line'
  | 'zero'
  | 'opposites'
  | 'positive-integers'
  | 'negative-integers'
  | 'decimal-representation'
  | 'fractions'
  | 'integer-representation'
  | 'integers'
  | 'number-line-practice'
  | 'negative-situations'
  | 'try-it'
  | 'game'
  | 'four-step-plan'
  | 'practice-question'
  | 'final-quiz';

export type G5L4ExecutivePreviewRendererModel =
  'single-sprite' | 'dual-sprite-composite' | 'question-atlas';

export type G5L4ExecutivePreviewFrameDomain =
  `sprite-${number}` | `sprite-${number}-question-atlas`;

export type G5L4ExecutivePreviewScenario =
  | 'source-static-frame'
  | 'source-static-composite-prefix'
  | 'source-static-question-atlas-inspection';

export type G5L4ExecutivePreviewScene = Readonly<{
  animationId: string;
  releaseOrdinal: number;
  pageNumber: number;
  sectionCode: 'IR' | 'RW' | 'VB' | 'IN' | 'TI' | 'GS' | 'TS' | 'FQ';
  sectionEnglish: string;
  sectionSpanish: string;
  title: string;
  titleSpanish: string;
  sourceSwfSha256: string;
  runtimeBytes: number;
  runtimeSha256: string;
  frameDomain: G5L4ExecutivePreviewFrameDomain;
  /** Frames intentionally exposed by the bounded modern preview. */
  frameCount: number;
  /** Frames in the selected source timeline before unresolved states are closed. */
  sourceFrameCount: number;
  blockedFrameCount: number;
  rendererModel: G5L4ExecutivePreviewRendererModel;
  scenario: G5L4ExecutivePreviewScenario;
  companionFrameDomain: `sprite-${number}` | null;
  companionFrame: number | null;
  /** Exact source frames mapped into a derived inspection domain, if any. */
  sourceFrameRange: readonly [number, number] | null;
  kind: G5L4ExecutivePreviewSceneKind;
  sourceText: readonly string[];
}>;

type SceneDefinition = Readonly<{
  animationId: string;
  releaseOrdinal: number;
  pageNumber: number;
  sectionCode: G5L4ExecutivePreviewScene['sectionCode'];
  title: string;
  titleSpanish?: string;
  sourceSwfSha256: string;
  runtimeBytes: number;
  runtimeSha256: string;
  frameDomain: G5L4ExecutivePreviewFrameDomain;
  frameCount: number;
  sourceFrameCount?: number;
  rendererModel?: G5L4ExecutivePreviewRendererModel;
  scenario?: G5L4ExecutivePreviewScene['scenario'];
  companionFrameDomain?: `sprite-${number}`;
  companionFrame?: number;
  sourceFrameRange?: readonly [number, number];
  kind: G5L4ExecutivePreviewSceneKind;
  sourceText?: readonly string[];
}>;

const SECTION_COPY = Object.freeze({
  IR: Object.freeze({english: 'Introduction', spanish: 'Introduction'}),
  RW: Object.freeze({english: 'Your World', spanish: 'Tu mundo'}),
  VB: Object.freeze({
    english: 'Important Words',
    spanish: 'Palabras importantes'
  }),
  IN: Object.freeze({english: 'Learn It', spanish: 'Apréndelo'}),
  TI: Object.freeze({english: 'Try It', spanish: 'Inténtalo!'}),
  GS: Object.freeze({english: 'Play It', spanish: 'Juégalo'}),
  TS: Object.freeze({
    english: 'Practice Test',
    spanish: 'Plan de los cuatro pasos'
  }),
  FQ: Object.freeze({english: 'Final Quiz', spanish: 'Examen Final'})
});

const SCENE_DEFINITIONS = Object.freeze([
  {
    animationId: 'course-g05-l04-ir-001-a662633d',
    releaseOrdinal: 1,
    pageNumber: 1,
    sectionCode: 'IR',
    title: 'Introduction',
    sourceSwfSha256:
      '14b8f7639027b324e9411c5d1e753432ed81c1fb3c23e211291c4b53f36c52dd',
    runtimeBytes: 954_270,
    runtimeSha256:
      '90831653cd5023dc9353f64ae6859df42c8e91bda1cea069e9a9a4dd5c5f06b0',
    frameDomain: 'sprite-53',
    frameCount: 136,
    kind: 'introduction',
    sourceText: [
      'Number Lines: Introduction',
      'Muted source-static drawing; random audio selection is not executed.'
    ]
  },
  {
    animationId: 'course-g05-l04-rw-002',
    releaseOrdinal: 2,
    pageNumber: 2,
    sectionCode: 'RW',
    title: 'Page 1',
    sourceSwfSha256:
      'eaea3b8e3efe6ec9e095bb09980476577686d09c94b29439dfb07015c7abb81c',
    runtimeBytes: 9_902_018,
    runtimeSha256:
      '5bd9d7d4c99901ea866a90a9ab98c609f1856d3136fd63778a9270bcc888d24f',
    frameDomain: 'sprite-341',
    frameCount: 419,
    kind: 'your-world'
  },
  {
    animationId: 'course-g05-l04-rw-003',
    releaseOrdinal: 3,
    pageNumber: 3,
    sectionCode: 'RW',
    title: 'Page 2',
    sourceSwfSha256:
      'b301a8789c03e68a7b00d4a288f874a8febfb309668c34b298a13546b8d44154',
    runtimeBytes: 19_559_380,
    runtimeSha256:
      '1639cf7eeeeda00cbbce347488cec545fddc46e81cffa0b671d625dc781432a3',
    frameDomain: 'sprite-535',
    frameCount: 1_141,
    kind: 'your-world'
  },
  {
    animationId: 'course-g05-l04-rw-004',
    releaseOrdinal: 4,
    pageNumber: 4,
    sectionCode: 'RW',
    title: 'Page 3',
    sourceSwfSha256:
      '76f8be5ed2e8bf8116720cf3e934a59d7368747471a356183cfd1d09f4cd0283',
    runtimeBytes: 8_569_074,
    runtimeSha256:
      '0c15179758a7341599ba528a0240dce9fac26955bda8b824143804dc3e1b43bc',
    frameDomain: 'sprite-227',
    frameCount: 506,
    kind: 'your-world'
  },
  {
    animationId: 'course-g05-l04-vb-002',
    releaseOrdinal: 5,
    pageNumber: 2,
    sectionCode: 'VB',
    title: 'Numbers on a Number Line',
    titleSpanish: 'Números en la recta numérica',
    sourceSwfSha256:
      '44d49533e15392fc67188c27ababb2e83cae8e181881ed94bf0341fa85509824',
    runtimeBytes: 1_059_963,
    runtimeSha256:
      '0c7ec104381d5b5a27e99015a1bd2f2ff7053be27bb5977af4e8fa75168e4d50',
    frameDomain: 'sprite-49',
    frameCount: 186,
    kind: 'number-line',
    sourceText: [
      'Number Lines: Important Words',
      'A number line is a line for ordering numbers by their value.',
      'increase',
      'decrease',
      'positive numbers',
      'negative numbers'
    ]
  },
  {
    animationId: 'course-g05-l04-vb-003',
    releaseOrdinal: 6,
    pageNumber: 3,
    sectionCode: 'VB',
    title: 'Number Line Practice',
    titleSpanish: 'Práctica de números en la recta numérica',
    sourceSwfSha256:
      '9ab43dd0bb28cf5567a5804d1fd5d65ccc69027bac8243c14d677e6a5484d3d8',
    runtimeBytes: 972_971,
    runtimeSha256:
      '9957cc8bc7adcf4d452d94f771cd407ab82a355be1ad69880a4a3bbbdb7ccc85',
    frameDomain: 'sprite-95',
    frameCount: 125,
    sourceFrameCount: 175,
    kind: 'number-line-practice'
  },
  {
    animationId: 'course-g05-l04-vb-004',
    releaseOrdinal: 7,
    pageNumber: 4,
    sectionCode: 'VB',
    title: 'Integers',
    titleSpanish: 'Enteros',
    sourceSwfSha256:
      '499418b013e3eb443cec84e1ea27c2e43fa3f19f57280354b42b44ea678f2b4b',
    runtimeBytes: 1_609_469,
    runtimeSha256:
      '251297925bc18f50b1049de234b97dfa78de8f7a0d2bd201fb365d38698296c7',
    frameDomain: 'sprite-71',
    frameCount: 208,
    sourceFrameCount: 257,
    kind: 'integers'
  },
  {
    animationId: 'course-g05-l04-vb-005',
    releaseOrdinal: 8,
    pageNumber: 5,
    sectionCode: 'VB',
    title: 'Zero',
    titleSpanish: 'Cero',
    sourceSwfSha256:
      'ecee1b1aea0aa8f2cef7b71b802629ffb6790699b13d3d9294503118f48e5541',
    runtimeBytes: 1_499_147,
    runtimeSha256:
      '4b05d689c9ddb43f8029600647b32a3372eda6ec20b02cf008f28f533a78095e',
    frameDomain: 'sprite-46',
    frameCount: 264,
    kind: 'zero'
  },
  {
    animationId: 'course-g05-l04-vb-006',
    releaseOrdinal: 9,
    pageNumber: 6,
    sectionCode: 'VB',
    title: 'Opposites',
    titleSpanish: 'Opuestos',
    sourceSwfSha256:
      '4da6a1a556e786e560aa489e566667ef0ff14de9a829428c844661d419271f5a',
    runtimeBytes: 1_005_097,
    runtimeSha256:
      '0b64b9a1d28af78ec44dc5cac48b76e263556187fec31c46f721bf4e41b2b2fa',
    frameDomain: 'sprite-42',
    frameCount: 166,
    kind: 'opposites'
  },
  {
    animationId: 'course-g05-l04-vb-007',
    releaseOrdinal: 10,
    pageNumber: 7,
    sectionCode: 'VB',
    title: 'Opposites',
    titleSpanish: 'Opuestos',
    sourceSwfSha256:
      'd9961e8ede43f668b656897af89e0e122c94bb0892a81a255cdea1b22835a869',
    runtimeBytes: 3_188_145,
    runtimeSha256:
      'aa16e19e27ac9df676715c92bfeef2400a4f9821a6d2475d134f05569e7ca896',
    frameDomain: 'sprite-230',
    frameCount: 52,
    sourceFrameCount: 136,
    kind: 'opposites'
  },
  {
    animationId: 'course-g05-l04-vb-008',
    releaseOrdinal: 11,
    pageNumber: 8,
    sectionCode: 'VB',
    title: 'Positive Integers',
    titleSpanish: 'Enteros positivos',
    sourceSwfSha256:
      'f5d08de21136d4ec00147f0fa1060b00a4abe84d13c99c4dae98721411dfe217',
    runtimeBytes: 1_015_614,
    runtimeSha256:
      'ca3341ef5d32d587841c4b753f92471796bcdf1b90390861c7e5de6558bef6fc',
    frameDomain: 'sprite-50',
    frameCount: 197,
    kind: 'positive-integers'
  },
  {
    animationId: 'course-g05-l04-vb-009',
    releaseOrdinal: 12,
    pageNumber: 9,
    sectionCode: 'VB',
    title: 'Negative Integers',
    titleSpanish: 'Enteros negativos',
    sourceSwfSha256:
      '83439d13b2c967eb035c08459ae712ccb950d5f41450fa823271dc5ded178b9f',
    runtimeBytes: 975_049,
    runtimeSha256:
      '3d63ad097db4e2d1082a17b427296406f01c62b770376d75bbfe264647848bee',
    frameDomain: 'sprite-51',
    frameCount: 189,
    kind: 'negative-integers'
  },
  {
    animationId: 'course-g05-l04-vb-010',
    releaseOrdinal: 13,
    pageNumber: 10,
    sectionCode: 'VB',
    title: 'Integers Practice',
    titleSpanish: 'Práctica de enteros',
    sourceSwfSha256:
      'f6791a43f2abf60b9b76a6eb50e3b32886389a4474372198ead760398bc8d224',
    runtimeBytes: 1_575_809,
    runtimeSha256:
      'f4ee5f0dc04ad767abe51f255114b969b87b89c0a546a0fe3f2bcf57e3682bd7',
    frameDomain: 'sprite-228',
    frameCount: 35,
    sourceFrameCount: 88,
    kind: 'integers'
  },
  {
    animationId: 'course-g05-l04-vb-011',
    releaseOrdinal: 14,
    pageNumber: 11,
    sectionCode: 'VB',
    title: 'Integers Practice',
    titleSpanish: 'Práctica de enteros',
    sourceSwfSha256:
      '2a388d578bb23fa2d4054ace2c3640956dd1f2ea0afd8e4e68a21b1537944cf8',
    runtimeBytes: 879_299,
    runtimeSha256:
      '1de92806431f00e750310d6b6da78eda7114e9ee8358c021afe1827665a3c568',
    frameDomain: 'sprite-225',
    frameCount: 32,
    sourceFrameCount: 81,
    kind: 'integers'
  },
  {
    animationId: 'course-g05-l04-in-002',
    releaseOrdinal: 15,
    pageNumber: 2,
    sectionCode: 'IN',
    title: 'Introduction to Number Lines',
    titleSpanish: 'Introducción a las rectas numéricas',
    sourceSwfSha256:
      'fbdbdb943d534423c662f41bcec16cc3d68cb59ba4703782429a59ef69086a4f',
    runtimeBytes: 3_358_832,
    runtimeSha256:
      'e3054dcaca2f83a16d24992490e3873c379c0e0627ebb089aea089cd27f335b5',
    frameDomain: 'sprite-52',
    frameCount: 765,
    kind: 'number-line'
  },
  {
    animationId: 'course-g05-l04-in-003',
    releaseOrdinal: 16,
    pageNumber: 3,
    sectionCode: 'IN',
    title: 'Introduction to Number Lines',
    titleSpanish: 'Introducción a las rectas numéricas',
    sourceSwfSha256:
      '1de1f053323dfa1bb9ad1e7344d324faa27f7eaed07a782b906ade0684b29d95',
    runtimeBytes: 3_015_850,
    runtimeSha256:
      '4717ec6471a4a2f19eaba6ba55a55db3a4bbab4c40981e54f4555292e44f6c93',
    frameDomain: 'sprite-217',
    frameCount: 73,
    sourceFrameCount: 182,
    kind: 'number-line'
  },
  {
    animationId: 'course-g05-l04-in-004',
    releaseOrdinal: 17,
    pageNumber: 4,
    sectionCode: 'IN',
    title: 'Represent Decimals on a Number Line',
    titleSpanish: 'Representación de decimales en una recta numérica',
    sourceSwfSha256:
      'afc644e764ab13e421b1c8f67c736fb4ae484056782bb56e472ac25ff6f23965',
    runtimeBytes: 12_975_404,
    runtimeSha256:
      'b278a5a691133f90e2ed28d0a33a85b95b251ad99999e9f3148c8e5957ba5526',
    frameDomain: 'sprite-436',
    frameCount: 307,
    sourceFrameCount: 320,
    kind: 'decimal-representation'
  },
  {
    animationId: 'course-g05-l04-in-005',
    releaseOrdinal: 18,
    pageNumber: 5,
    sectionCode: 'IN',
    title: 'Represent Decimals on a Number Line',
    titleSpanish: 'Representación de decimales en una recta numérica',
    sourceSwfSha256:
      '263d612f324947d701dbfd399721695498f7604df2201d73e26caf8a82c45a58',
    runtimeBytes: 3_110_250,
    runtimeSha256:
      'a58891f4224f476432216ecdbd05fe8317eb6b2751b3603c3064370e4225b7da',
    frameDomain: 'sprite-222',
    frameCount: 92,
    sourceFrameCount: 226,
    kind: 'decimal-representation'
  },
  {
    animationId: 'course-g05-l04-in-006',
    releaseOrdinal: 19,
    pageNumber: 6,
    sectionCode: 'IN',
    title: 'Represent Decimals on Number Lines',
    titleSpanish: 'Representación de decimales en una recta numérica',
    sourceSwfSha256:
      '2b318a5873caacefb0a1f1fdd62457b8e77e67f8f99028eaaeae5ad9ad59bdd0',
    runtimeBytes: 1_404_871,
    runtimeSha256:
      '3c0a82678520f8bc8d12488a1f83f0cc3315a4717857825a2146272a49483b8f',
    frameDomain: 'sprite-103',
    frameCount: 413,
    sourceFrameCount: 464,
    kind: 'decimal-representation'
  },
  {
    animationId: 'course-g05-l04-in-007',
    releaseOrdinal: 20,
    pageNumber: 7,
    sectionCode: 'IN',
    title: 'Represent Fractions and Mixed Numbers on a Number Line',
    titleSpanish:
      'Representación de fracciones y números mixtos en una recta numérica',
    sourceSwfSha256:
      '6aea8f9b942cd6e805b31b5e1837f4815fa543612e7cec0acdad687fe555c89b',
    runtimeBytes: 2_495_420,
    runtimeSha256:
      'c21d71816db07a291baf9b00190545e39da2c917d47af29f08e461bc03d10358',
    frameDomain: 'sprite-76',
    frameCount: 654,
    kind: 'fractions'
  },
  {
    animationId: 'course-g05-l04-in-008',
    releaseOrdinal: 21,
    pageNumber: 8,
    sectionCode: 'IN',
    title: 'Represent Fractions and Mixed Numbers on a Number Line',
    titleSpanish:
      'Representación de fracciones y números mixtos en una recta numérica',
    sourceSwfSha256:
      '7dbd66d557ba8fa79fb111e97faf333c5e7e6f8b5d55ef9b11b731215854d125',
    runtimeBytes: 833_307,
    runtimeSha256:
      '09725c3fc1c3610b3a3ac092c4d2d6731a3e645152ffb511721730abcb98d484',
    frameDomain: 'sprite-123',
    frameCount: 121,
    sourceFrameCount: 195,
    kind: 'fractions'
  },
  {
    animationId: 'course-g05-l04-in-009',
    releaseOrdinal: 22,
    pageNumber: 9,
    sectionCode: 'IN',
    title: 'Represent Fractions and Mixed Numbers on Number Lines',
    titleSpanish:
      'Representación de fracciones y números mixtos en una recta numérica',
    sourceSwfSha256:
      '5445a53852cec9ee7723e6058d3d7338a4c8a3fcf62b3575f5957de2b8c8e533',
    runtimeBytes: 1_587_346,
    runtimeSha256:
      '0f858fe82f59aef13cdb9cb5657f74934a13a286c5d711ef3e0ec293acfbb5d8',
    frameDomain: 'sprite-29',
    frameCount: 504,
    kind: 'fractions'
  },
  {
    animationId: 'course-g05-l04-in-010',
    releaseOrdinal: 23,
    pageNumber: 10,
    sectionCode: 'IN',
    title: 'Represent Fractions and Mixed Numbers on Number Lines',
    titleSpanish:
      'Representación de fracciones y números mixtos en una recta numérica',
    sourceSwfSha256:
      '53056f0fa5ab16aa1b18539b49b4c34d3dfe7d5f58ad0ce5f0e82ff7ef6807ba',
    runtimeBytes: 542_904,
    runtimeSha256:
      '0832445a5a39159f6af818908e90fbc5a39142d7833d6bfc51a47d8c88bfbdfa',
    frameDomain: 'sprite-58',
    frameCount: 129,
    sourceFrameCount: 180,
    kind: 'fractions'
  },
  {
    animationId: 'course-g05-l04-in-011',
    releaseOrdinal: 24,
    pageNumber: 11,
    sectionCode: 'IN',
    title: 'Represent Fractions and Mixed Numbers on Number Lines Practice',
    titleSpanish:
      'Representación de fracciones y números mixtos en una recta numérica',
    sourceSwfSha256:
      '3c254d6f089cab112ab7187a3b56daedfd39b7e64d3b103344606923d1d355ea',
    runtimeBytes: 2_679_380,
    runtimeSha256:
      'a72d0fd6a6fa1609f58eb6e326b734e010cf9d2274051f9f88d1b4fd25649497',
    frameDomain: 'sprite-231',
    frameCount: 341,
    sourceFrameCount: 428,
    kind: 'fractions'
  },
  {
    animationId: 'course-g05-l04-in-012',
    releaseOrdinal: 25,
    pageNumber: 12,
    sectionCode: 'IN',
    title: 'Represent Positive and Negative Integers on a Number Line',
    titleSpanish:
      'Representación de enteros negativos y positivos en una recta numérica',
    sourceSwfSha256:
      '7a1fca07e71006642867e73fc6817257d97fef1fc6e337a3363a01627e79d3bb',
    runtimeBytes: 1_464_942,
    runtimeSha256:
      '8861a29538e3cea708e87dbc9df98b02f23be6183503aa4a2cead8d3bfbda4fa',
    frameDomain: 'sprite-48',
    frameCount: 298,
    kind: 'integer-representation'
  },
  {
    animationId: 'course-g05-l04-in-013',
    releaseOrdinal: 26,
    pageNumber: 13,
    sectionCode: 'IN',
    title: 'Represent Positive and Negative Integers on a Number Line',
    titleSpanish:
      'Representación de enteros negativos y positivos en una recta numérica',
    sourceSwfSha256:
      '6756fad74a999e190a335500e32c9bca5f2dc35baab4401897f8197bbc9df482',
    runtimeBytes: 2_764_782,
    runtimeSha256:
      '3453e5275d38001acb8d20cb8a1e4da1b68a3dd345aed03033f904709e8cbb03',
    frameDomain: 'sprite-170',
    frameCount: 82,
    sourceFrameCount: 178,
    kind: 'integer-representation'
  },
  {
    animationId: 'course-g05-l04-in-014',
    releaseOrdinal: 27,
    pageNumber: 14,
    sectionCode: 'IN',
    title: 'Represent Positive and Negative Integers on a Number Line',
    titleSpanish:
      'Representación de enteros negativos y positivos en una recta numérica',
    sourceSwfSha256:
      '0d4d9d3492d6188d6feb669c789c109b11ca1c01d55af9276e79197c18530e89',
    runtimeBytes: 2_787_247,
    runtimeSha256:
      'de19e523f2d368b7eefa4a31330baf990998830cea1176305e081acb118c76c8',
    frameDomain: 'sprite-170',
    frameCount: 83,
    sourceFrameCount: 197,
    kind: 'integer-representation'
  },
  {
    animationId: 'course-g05-l04-in-015',
    releaseOrdinal: 28,
    pageNumber: 15,
    sectionCode: 'IN',
    title: 'Numbers on the Number Line',
    titleSpanish: 'Números en la recta numérica',
    sourceSwfSha256:
      '4c95da237ff9e40f388bb0efcb25f86312340511457eb6206e7b5df814eaca14',
    runtimeBytes: 2_278_489,
    runtimeSha256:
      '0cc1c8fd50905997c110f601e6ba657433a1161f518c06fb386db9daadb844e0',
    frameDomain: 'sprite-101',
    frameCount: 601,
    kind: 'integers'
  },
  {
    animationId: 'course-g05-l04-in-016',
    releaseOrdinal: 29,
    pageNumber: 16,
    sectionCode: 'IN',
    title: 'Represent Positive and Negative Integers on a Number Line Practice',
    titleSpanish:
      'Práctica de representación de enteros negativos y positivos en una recta numérica',
    sourceSwfSha256:
      'c3af6dd2af7373359aa0969b3875ebf88796ae5d243fd3bc29f504322195754f',
    runtimeBytes: 3_368_702,
    runtimeSha256:
      '2ad1c14ea8556f3da8074923d2448cdd7dd32ae6cf4ec43753c6147229322531',
    frameDomain: 'sprite-264',
    frameCount: 190,
    sourceFrameCount: 299,
    kind: 'number-line-practice'
  },
  {
    animationId: 'course-g05-l04-in-017',
    releaseOrdinal: 30,
    pageNumber: 17,
    sectionCode: 'IN',
    title: 'Placing Numbers on a Number Line Practice',
    titleSpanish: 'Práctica de ubicación de números en una recta numérica',
    sourceSwfSha256:
      '9e773e9378d863805e3740db4e094f94e85d005f257ef1c3f58fe58c7617aa2b',
    runtimeBytes: 13_244_089,
    runtimeSha256:
      'ff7979e70f93dc69c11088309201ef0ec685d95865a583db0bd9c9f356795fff',
    frameDomain: 'sprite-494',
    frameCount: 373,
    sourceFrameCount: 541,
    kind: 'number-line-practice'
  },
  {
    animationId: 'course-g05-l04-in-018',
    releaseOrdinal: 31,
    pageNumber: 18,
    sectionCode: 'IN',
    title: 'Placing Numbers on a Number Line Practice',
    titleSpanish: 'Práctica de ubicación de números en una recta numérica',
    sourceSwfSha256:
      '902f48bf94bcd04fdcd2b2516c90103f7ed8c50a5371b306c086fed8a81a5257',
    runtimeBytes: 3_118_715,
    runtimeSha256:
      '85ec6c2f4e864dbb37982532ea3882e3b01c8f69b6221996d3bd2a8a08160f7e',
    frameDomain: 'sprite-220',
    frameCount: 217,
    sourceFrameCount: 275,
    kind: 'number-line-practice'
  },
  {
    animationId: 'course-g05-l04-in-019',
    releaseOrdinal: 32,
    pageNumber: 19,
    sectionCode: 'IN',
    title: 'Placing Numbers on a Number Line Practice',
    titleSpanish: 'Práctica de ubicación de números en una recta numérica',
    sourceSwfSha256:
      '5126885a718fd05ec98cadb0fc56d280ab510e578f34d8784de345fdc7875449',
    runtimeBytes: 1_471_802,
    runtimeSha256:
      'c15e0a967664522fd17755dc8a296befec6cc7b2bba5f6cefec671fda93a9ffa',
    frameDomain: 'sprite-265',
    frameCount: 220,
    sourceFrameCount: 274,
    kind: 'number-line-practice'
  },
  {
    animationId: 'course-g05-l04-in-020',
    releaseOrdinal: 33,
    pageNumber: 20,
    sectionCode: 'IN',
    title: 'Situations with Negative Integers',
    titleSpanish: 'Casos con enteros negativos',
    sourceSwfSha256:
      '6415d18872667a0acec32e361afe5d8091ba5a0d680a84cb8ed44b4b1238d1d9',
    runtimeBytes: 1_664_690,
    runtimeSha256:
      'a648ca2be956f1cbe1bd88849f02454cf2003afa65301a72b7faa807203bfb08',
    frameDomain: 'sprite-37',
    frameCount: 282,
    kind: 'negative-situations'
  },
  {
    animationId: 'course-g05-l04-in-021',
    releaseOrdinal: 34,
    pageNumber: 21,
    sectionCode: 'IN',
    title: 'Situations with Negative Integers',
    titleSpanish: 'Casos con enteros negativos',
    sourceSwfSha256:
      '878c68db012550dc40b8ff01ccb9785d09f8adb7d2bb318eb5e945e3e6c629cd',
    runtimeBytes: 1_181_209,
    runtimeSha256:
      'f6e7f9b8f5fac4e5a530c14f95e3887a91629b6397fba21b3bda9c02e8af6213',
    frameDomain: 'sprite-97',
    frameCount: 286,
    sourceFrameCount: 288,
    kind: 'negative-situations'
  },
  {
    animationId: 'course-g05-l04-in-022',
    releaseOrdinal: 35,
    pageNumber: 22,
    sectionCode: 'IN',
    title: 'Placing Numbers on a Number Line Practice',
    titleSpanish: 'Práctica de ubicación de números en una recta numérica',
    sourceSwfSha256:
      'af167f9d49133ec51d8d364df0fb09eb6f53d6018423aee4954ecd53ef9a314f',
    runtimeBytes: 7_702_490,
    runtimeSha256:
      'a5517b8ee9e5a27b8ae2cdf1731824078a18e4a656361d189c48a399089405f0',
    frameDomain: 'sprite-355',
    frameCount: 411,
    sourceFrameCount: 475,
    kind: 'number-line-practice'
  },
  {
    animationId: 'course-g05-l04-ti-002',
    releaseOrdinal: 36,
    pageNumber: 2,
    sectionCode: 'TI',
    title: 'Question 1',
    sourceSwfSha256:
      '9922c110563282176b765f3d0befbc81000d85505475c18d5cd8b3fb415e8158',
    runtimeBytes: 6_684_657,
    runtimeSha256:
      'bcdb04ed1df92261499cc3e0e80c4e924cd141729ae50543018b6586d45f86c5',
    frameDomain: 'sprite-413',
    frameCount: 256,
    sourceFrameCount: 275,
    kind: 'try-it'
  },
  {
    animationId: 'course-g05-l04-ti-003',
    releaseOrdinal: 37,
    pageNumber: 3,
    sectionCode: 'TI',
    title: 'Question 2',
    sourceSwfSha256:
      '5e8dc4213ec766215a7dcb92d5681ed70c694e1e9f21d00a6f73ca75777b9fef',
    runtimeBytes: 1_418_039,
    runtimeSha256:
      '589433ea1087962ae26d02877e406dc327cd81c281525e720f60d4345ffc67ca',
    frameDomain: 'sprite-270',
    frameCount: 162,
    sourceFrameCount: 164,
    kind: 'try-it'
  },
  {
    animationId: 'course-g05-l04-ti-004',
    releaseOrdinal: 38,
    pageNumber: 4,
    sectionCode: 'TI',
    title: 'Question 3',
    sourceSwfSha256:
      '7b169519348c889f15b5e8a23408a9423aaef7aa7aea366488cde12bc6bd10b9',
    runtimeBytes: 2_495_560,
    runtimeSha256:
      '95ab482dce807d640b721bffc6435152288510720def3155e7e76bf8e1510ffc',
    frameDomain: 'sprite-299',
    frameCount: 197,
    sourceFrameCount: 472,
    kind: 'try-it'
  },
  {
    animationId: 'course-g05-l04-ti-005',
    releaseOrdinal: 39,
    pageNumber: 5,
    sectionCode: 'TI',
    title: 'Question 4',
    sourceSwfSha256:
      '3885922f634898e27deee2e04f79dca5129be35a96e1675e3882760f1d285d23',
    runtimeBytes: 1_853_788,
    runtimeSha256:
      '8e92319b1049bfb69953ccbc962b474b387551996fff85cef017955eab919213',
    frameDomain: 'sprite-272',
    frameCount: 137,
    sourceFrameCount: 363,
    kind: 'try-it'
  },
  {
    animationId: 'course-g05-l04-ti-006',
    releaseOrdinal: 40,
    pageNumber: 6,
    sectionCode: 'TI',
    title: 'Question 5',
    sourceSwfSha256:
      '9c83e06d0943009ffa3e3eda2b00cdc390a84dd948b3e7cfef0019a5d7ee10c9',
    runtimeBytes: 1_088_485,
    runtimeSha256:
      '9f0b990f287c0bf66722c5ebe5f959deee522f1226b374866a162224efe4d0a5',
    frameDomain: 'sprite-191',
    frameCount: 187,
    sourceFrameCount: 237,
    kind: 'try-it'
  },
  {
    animationId: 'course-g05-l04-ti-007',
    releaseOrdinal: 41,
    pageNumber: 7,
    sectionCode: 'TI',
    title: 'Question 6',
    sourceSwfSha256:
      '6d562128c1e87327776816035bffb6aeaaf0c0825c3ea415ff329effd10e82d9',
    runtimeBytes: 1_004_906,
    runtimeSha256:
      'd12ddeb50b3f48021edca8092c455e117eea95b3c38fc06e2055b0e96f30e661',
    frameDomain: 'sprite-177',
    frameCount: 111,
    sourceFrameCount: 167,
    kind: 'try-it'
  },
  {
    animationId: 'course-g05-l04-ti-008',
    releaseOrdinal: 42,
    pageNumber: 8,
    sectionCode: 'TI',
    title: 'Question 7',
    sourceSwfSha256:
      'e197fc8947f129ebe4f615cdeb5a17c48baa7343d89e5b581585ef530b1ae538',
    runtimeBytes: 767_359,
    runtimeSha256:
      'c9b150f664eaf93da7803091f23d98406d1823086411ee17304cf75283b37010',
    frameDomain: 'sprite-160',
    frameCount: 94,
    sourceFrameCount: 146,
    kind: 'try-it'
  },
  {
    animationId: 'course-g05-l04-ti-009',
    releaseOrdinal: 43,
    pageNumber: 9,
    sectionCode: 'TI',
    title: 'Question 8',
    sourceSwfSha256:
      '58068d194e4ae7b61ae85505e36fb0fab6d4286b4ce8b893a4260d0f6df0e900',
    runtimeBytes: 644_390,
    runtimeSha256:
      'd686b05e0997cd50172bd95ca9a6fba426b7cfd6d48658a42fc9b8e5b3480686',
    frameDomain: 'sprite-171',
    frameCount: 96,
    sourceFrameCount: 114,
    kind: 'try-it'
  },
  {
    animationId: 'course-g05-l04-gs-002',
    releaseOrdinal: 44,
    pageNumber: 2,
    sectionCode: 'GS',
    title: 'Game 1',
    sourceSwfSha256:
      'f2b6fc8157b04757e551d1d4fda5987af1e4dc6ecb1a101708fc822e1c7f1d43',
    runtimeBytes: 9_683_082,
    runtimeSha256:
      'bfc2b31d45fd89773677744ff9a9bd0a0213caa5d78cb1a7d4eef6f80f4c3c07',
    frameDomain: 'sprite-436',
    frameCount: 451,
    sourceFrameCount: 460,
    kind: 'game'
  },
  {
    animationId: 'course-g05-l04-ts-002',
    releaseOrdinal: 45,
    pageNumber: 2,
    sectionCode: 'TS',
    title: '4 - Step Plan',
    titleSpanish: 'Plan de 4 Pasos',
    sourceSwfSha256:
      'd5937429370f18bd1ee65cc09febcc2b0e431303310b8905a3248b9146de0e2e',
    runtimeBytes: 563_581,
    runtimeSha256:
      '568e79042ebc4423f041868e76d6507a15dd9a2e1d05258b76ea59f86ec8a580',
    frameDomain: 'sprite-28',
    frameCount: 324,
    kind: 'four-step-plan'
  },
  {
    animationId: 'course-g05-l04-ts-003',
    releaseOrdinal: 46,
    pageNumber: 3,
    sectionCode: 'TS',
    title: '4 - Step Plan',
    titleSpanish: 'Plan de 4 Pasos',
    sourceSwfSha256:
      '459a17c28b3f2ad99e4cfec68bbe91a6b876cf5b94983f76316b16ef301300a3',
    runtimeBytes: 483_379,
    runtimeSha256:
      '300fd5adb8b179a3cdd9aab70ea1b1fd863321402044ad82f2888107023fa08f',
    frameDomain: 'sprite-25',
    frameCount: 227,
    kind: 'four-step-plan'
  },
  {
    animationId: 'course-g05-l04-ts-004',
    releaseOrdinal: 47,
    pageNumber: 4,
    sectionCode: 'TS',
    title: '4 - Step Plan',
    titleSpanish: 'Plan de 4 Pasos',
    sourceSwfSha256:
      'dcc40f586647f8f8ff05f533fc82e707af43ecb16e8c2bd5274a5165ea9666df',
    runtimeBytes: 899_011,
    runtimeSha256:
      '798dac2092935f6a59885df7070f423d4246987f920e57887ddc61b422424446',
    frameDomain: 'sprite-36',
    frameCount: 290,
    kind: 'four-step-plan'
  },
  {
    animationId: 'course-g05-l04-ts-005',
    releaseOrdinal: 48,
    pageNumber: 5,
    sectionCode: 'TS',
    title: '4 - Step Plan',
    titleSpanish: 'Plan de 4 Pasos',
    sourceSwfSha256:
      'ae36d9fcf75b33826f00030fb89adebac8be73dcfc3c35156bf838651534cbda',
    runtimeBytes: 564_290,
    runtimeSha256:
      '8ad1d646f9ae5f2bc87a15695b19a3b8829ac07e259352622c2093705c4fbb63',
    frameDomain: 'sprite-30',
    frameCount: 234,
    kind: 'four-step-plan'
  },
  {
    animationId: 'course-g05-l04-ts-006',
    releaseOrdinal: 49,
    pageNumber: 6,
    sectionCode: 'TS',
    title: '4 - Step Plan',
    titleSpanish: 'Plan de 4 Pasos',
    sourceSwfSha256:
      'efa39aa768ba3b5712286641153b80dc2210ee7bc6cad1fe3a16932434b581d1',
    runtimeBytes: 265_813,
    runtimeSha256:
      'c05ebcfe5a7530662265994a5311a21a65c80404136b24988a687f12e0c0551c',
    frameDomain: 'sprite-12',
    frameCount: 245,
    kind: 'four-step-plan'
  },
  {
    animationId: 'course-g05-l04-ts-007',
    releaseOrdinal: 50,
    pageNumber: 7,
    sectionCode: 'TS',
    title: 'Question 1',
    titleSpanish: 'Pregunta 1',
    sourceSwfSha256:
      '9930c5a1ea224e73cbd4c8a0f17b281a94c4214dfefc368b75881bc629d9114d',
    runtimeBytes: 8_776_360,
    runtimeSha256:
      '9c43f6375d1566e519209de9bd6dfe1e298b3b984daad707749b8296acefbc91',
    frameDomain: 'sprite-462',
    frameCount: 263,
    sourceFrameCount: 684,
    kind: 'practice-question'
  },
  {
    animationId: 'course-g05-l04-ts-008',
    releaseOrdinal: 51,
    pageNumber: 8,
    sectionCode: 'TS',
    title: 'Question 2',
    titleSpanish: 'Pregunta 2',
    sourceSwfSha256:
      '6fa625a826863ce02d91e061fcbcca062798e3cb0ce2cb07c7cd63012a779c64',
    runtimeBytes: 9_876_569,
    runtimeSha256:
      '123c51a7ef0177203a3951baefc67dd6b8b7855c3aea3bd635217bba8e1fb384',
    frameDomain: 'sprite-435',
    frameCount: 272,
    sourceFrameCount: 695,
    kind: 'practice-question'
  },
  {
    animationId: 'course-g05-l04-fq-001',
    releaseOrdinal: 52,
    pageNumber: 1,
    sectionCode: 'FQ',
    title: 'Introduction',
    sourceSwfSha256:
      'b56e10b76b01b6626aba5d69b176d21262dfbe4db74a94b4afe2323aeb5b3e36',
    runtimeBytes: 557_122,
    runtimeSha256:
      '539e66402e9d90d871a21a8e05dfe72fccaac631f484d2fc387d37df2da54d13',
    frameDomain: 'sprite-145',
    frameCount: 52,
    rendererModel: 'dual-sprite-composite',
    scenario: 'source-static-composite-prefix',
    companionFrameDomain: 'sprite-100',
    companionFrame: 1,
    kind: 'final-quiz'
  },
  {
    animationId: 'course-g05-l04-fq-002',
    releaseOrdinal: 53,
    pageNumber: 2,
    sectionCode: 'FQ',
    title: 'Page 1',
    sourceSwfSha256:
      'f54e7c22806c9d093253333129a9204279d112185eaca1ce6fefaa3ef22961a7',
    runtimeBytes: 1_063_696,
    runtimeSha256:
      '73f1525997c667b351031d6f3e8ec09130970aee57dbe9211735844634b9e809',
    frameDomain: 'sprite-694-question-atlas',
    frameCount: 18,
    sourceFrameCount: 56,
    rendererModel: 'question-atlas',
    scenario: 'source-static-question-atlas-inspection',
    sourceFrameRange: [2, 19],
    kind: 'final-quiz',
    sourceText: [
      'Final Quiz: Page 1',
      'Eighteen source question drawings are inspectable; random selection, answers, scoring, review, and Replay are disabled.'
    ]
  },
  {
    animationId: 'course-g05-l04-fq-003',
    releaseOrdinal: 54,
    pageNumber: 3,
    sectionCode: 'FQ',
    title: 'Page 2',
    sourceSwfSha256:
      '7fd9965eb409dffb0756e4e60f6a06a5c2685015eebe25cef9e6d110a252cdab',
    runtimeBytes: 1_063_718,
    runtimeSha256:
      '6ec31edd28e18b384cc6bd207da94d6480857d5e6e01dc5637c6cb2726a67de8',
    frameDomain: 'sprite-694-question-atlas',
    frameCount: 18,
    sourceFrameCount: 56,
    rendererModel: 'question-atlas',
    scenario: 'source-static-question-atlas-inspection',
    sourceFrameRange: [2, 19],
    kind: 'final-quiz',
    sourceText: [
      'Final Quiz: Page 2',
      'Eighteen source question drawings are inspectable; random selection, answers, scoring, review, and Replay are disabled.'
    ]
  }
] satisfies readonly SceneDefinition[]);

function buildScene(definition: SceneDefinition): G5L4ExecutivePreviewScene {
  const sourceFrameCount = definition.sourceFrameCount ?? definition.frameCount;
  const section = SECTION_COPY[definition.sectionCode];

  return Object.freeze({
    ...definition,
    sectionEnglish: section.english,
    sectionSpanish: section.spanish,
    titleSpanish: definition.titleSpanish ?? definition.title,
    sourceFrameCount,
    blockedFrameCount: sourceFrameCount - definition.frameCount,
    rendererModel: definition.rendererModel ?? 'single-sprite',
    scenario: definition.scenario ?? 'source-static-frame',
    companionFrameDomain: definition.companionFrameDomain ?? null,
    companionFrame: definition.companionFrame ?? null,
    sourceFrameRange: definition.sourceFrameRange ?? null,
    sourceText: Object.freeze([
      ...(definition.sourceText ?? [definition.title])
    ])
  });
}

/**
 * Fifty-four bounded current-JavaScript page candidates for the controlled
 * executive preview: 51 manifest-bound single-sprite source-static modules,
 * the independently evidenced FQ001 dual-sprite composite, and two
 * product-only FQ question-atlas inspection modules.
 *
 * Hash-bound local outputs and their explicitly exposed frame prefixes are
 * current-JavaScript engineering evidence only. The two atlases are not
 * canonical governance promotions. None of these artifacts establish the
 * original root shell/timelines, interaction causality, source Replay,
 * localization, audio, RMSE, human/Owner acceptance, strict completion, or
 * publication.
 */
export const G5_L4_EXECUTIVE_PREVIEW_SCENES = Object.freeze(
  SCENE_DEFINITIONS.map(buildScene)
);

export const G5_L4_EXECUTIVE_PREVIEW_BOUNDARY = Object.freeze({
  releaseId: 'lesson-g05-l04-number-lines',
  title: 'Number Lines',
  stage: Object.freeze({width: 800, height: 600}),
  fps: 12,
  releaseMemberCount: 55,
  currentJavascriptSourceStaticCandidateCount:
    G5_L4_EXECUTIVE_PREVIEW_SCENES.length,
  representedSceneCount: G5_L4_EXECUTIVE_PREVIEW_SCENES.length,
  singleSpriteCandidateCount: G5_L4_EXECUTIVE_PREVIEW_SCENES.filter(
    (scene) => scene.rendererModel === 'single-sprite'
  ).length,
  fullSingleSpriteCandidateCount: G5_L4_EXECUTIVE_PREVIEW_SCENES.filter(
    (scene) =>
      scene.rendererModel === 'single-sprite' && scene.blockedFrameCount === 0
  ).length,
  prefixSingleSpriteCandidateCount: G5_L4_EXECUTIVE_PREVIEW_SCENES.filter(
    (scene) =>
      scene.rendererModel === 'single-sprite' && scene.blockedFrameCount > 0
  ).length,
  dualSpriteCompositeCandidateCount: G5_L4_EXECUTIVE_PREVIEW_SCENES.filter(
    (scene) => scene.rendererModel === 'dual-sprite-composite'
  ).length,
  questionAtlasCandidateCount: G5_L4_EXECUTIVE_PREVIEW_SCENES.filter(
    (scene) => scene.rendererModel === 'question-atlas'
  ).length,
  activePageCount: 54,
  shellCurrentJavascriptCandidateCount: 1,
  lessonMvpCurrentJavascriptCandidateCount:
    G5_L4_EXECUTIVE_PREVIEW_SCENES.length + 1,
  lessonMvpCurrentJavascriptCandidateComplete:
    G5_L4_EXECUTIVE_PREVIEW_SCENES.length === 54,
  representedFrameCount: G5_L4_EXECUTIVE_PREVIEW_SCENES.reduce(
    (total, scene) => total + scene.frameCount,
    0
  ),
  representedSourceFrameCount: G5_L4_EXECUTIVE_PREVIEW_SCENES.reduce(
    (total, scene) => total + scene.sourceFrameCount,
    0
  ),
  blockedFrameCount: G5_L4_EXECUTIVE_PREVIEW_SCENES.reduce(
    (total, scene) => total + scene.blockedFrameCount,
    0
  ),
  strictCompleteCount: 0,
  published: false,
  rootTimelineAccepted: false,
  spanishVisualAccepted: false,
  audioAccepted: false,
  behaviorAccepted: false,
  sourceControlsAccepted: false,
  replayParityAccepted: false,
  normalizedRmseComplete: false,
  originalRuntimeAccepted: false,
  naturalEntryAccepted: false,
  originalRuntimeNaturalEntryAccepted: false,
  humanVisualReviewAccepted: false,
  ownerFidelityAccepted: false,
  strictMigrationComplete: false,
  previewAuthorized: true
});
