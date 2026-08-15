export interface G4L3ReadableViewCropSpec {
  readonly asset: string;
  readonly assetSha256: string;
  readonly label: 'Step 3' | 'Step 4';
  readonly nativeRect: Readonly<{
    height: number;
    width: number;
    x: number;
    y: number;
  }>;
  readonly paddedRect: Readonly<{
    height: number;
    width: number;
    x: number;
    y: number;
  }>;
  readonly sourceCharacterIds: readonly number[];
  readonly transcript: readonly string[];
  readonly transcriptSha256: string;
}

export interface G4L3ReadableViewSpec {
  readonly animationId: 'course-g04-l03-ts-008';
  readonly defaultExpanded: true;
  readonly desktopScale: 2.5;
  readonly currentJavascriptRendererSha256: string;
  readonly frameDomain: 'sprite-350';
  readonly nativePadding: 4;
  readonly originalLayoutPreserved: true;
  readonly sourceFrame: 789;
  readonly sourceFrameSha256: string;
  readonly sourceSwfSha256: string;
  readonly strictAcceptanceEffect: 'none';
  readonly crops: readonly G4L3ReadableViewCropSpec[];
}

export interface G4L3Page36SignedAmount {
  readonly name: 'Elvin' | 'Ricky' | 'Susan' | 'Toni';
  readonly signedLabel: '+3' | '+7' | '−10' | '−2';
  readonly signedValue: -10 | -2 | 3 | 7;
  readonly statement:
    | 'Elvin has $3'
    | 'Ricky owes $2'
    | 'Susan owes $10'
    | 'Toni has $7';
}

const STEP_3_TRANSCRIPT = Object.freeze([
  'Use strategy: Draw a picture. Make a number line.',
  'Place each person’s name on the number line based on the amount of money they have or owe:',
  'Toni has the most money with $7.',
  'The correct answer choice is D.',
] as const);

const STEP_4_TRANSCRIPT = Object.freeze([
  'Use strategy: Use Logical Reasoning',
  'Having money means you have a positive amount.',
  'Owing money means you have a negative amount.',
  'Toni has $7 = + 7',
  'Elvin has $3 = + 3',
  'Susan owes $10 = −10',
  'Ricky owes $2 = −2',
  'Toni has the most money with $7.',
  'The correct answer choice is D.',
] as const);

/**
 * Source-authored values from the Step 3 number-line labels and the matching
 * Step 4 equations. The source crop remains immutable evidence; this small
 * semantic model lets the student surface present the same relationships as
 * readable HTML instead of asking learners to decipher a 244 px raster.
 */
export const G4_L3_PAGE_36_SIGNED_AMOUNTS = Object.freeze([
  Object.freeze({
    name: 'Toni',
    statement: 'Toni has $7',
    signedValue: 7,
    signedLabel: '+7',
  }),
  Object.freeze({
    name: 'Elvin',
    statement: 'Elvin has $3',
    signedValue: 3,
    signedLabel: '+3',
  }),
  Object.freeze({
    name: 'Susan',
    statement: 'Susan owes $10',
    signedValue: -10,
    signedLabel: '−10',
  }),
  Object.freeze({
    name: 'Ricky',
    statement: 'Ricky owes $2',
    signedValue: -2,
    signedLabel: '−2',
  }),
] as const satisfies readonly G4L3Page36SignedAmount[]);

export const G4_L3_PAGE_36_NUMBER_LINE_AMOUNTS = Object.freeze([
  G4_L3_PAGE_36_SIGNED_AMOUNTS[2],
  G4_L3_PAGE_36_SIGNED_AMOUNTS[3],
  G4_L3_PAGE_36_SIGNED_AMOUNTS[1],
  G4_L3_PAGE_36_SIGNED_AMOUNTS[0],
]);

/**
 * Private, G4 L3-only specification for the Page 36 readability aid.
 *
 * The crop rectangles use native 800 × 600 coordinates. Character 150 is the
 * source-authored minus-sign shape inside the approved 144–152 binding range,
 * so the range is intentionally kept intact even though it is not DefineText.
 */
export const G4_L3_PAGE_36_READABLE_VIEW_SPEC: G4L3ReadableViewSpec =
  Object.freeze({
    animationId: 'course-g04-l03-ts-008',
    defaultExpanded: true,
    desktopScale: 2.5,
    currentJavascriptRendererSha256:
      '30d1272b3ce20cbf8ecbe76219351b78336bf24a71e921ae63bf48174fb267e6',
    frameDomain: 'sprite-350',
    nativePadding: 4,
    originalLayoutPreserved: true,
    sourceFrame: 789,
    sourceFrameSha256:
      '13c47aeb4d92ff8ae0c934f4da979662e4b0a5fedad05e24f148b83a561ffda9',
    sourceSwfSha256:
      '9c7288f67f764e02f4320655b64dbb57d3d690a75951b549ee5113f385e6b885',
    strictAcceptanceEffect: 'none',
    crops: Object.freeze([
      Object.freeze({
        asset:
          '/flash-assets/courses/course-g04-l03-ts-008/readable-view/frame-789-step-3.png',
        assetSha256:
          'cb43e972f1043af58a03f01f280eec09b8f39e816e2f23d1e6bf6ad7bb996731',
        label: 'Step 3',
        nativeRect: Object.freeze({x: 292, y: 147, width: 236, height: 149}),
        paddedRect: Object.freeze({x: 288, y: 143, width: 244, height: 157}),
        sourceCharacterIds: Object.freeze([99, 100, 101, 133]),
        transcript: STEP_3_TRANSCRIPT,
        transcriptSha256:
          '74944b2787363422dfb1381cc84c3351bf81b25804e86ea869861842749002bd',
      }),
      Object.freeze({
        asset:
          '/flash-assets/courses/course-g04-l03-ts-008/readable-view/frame-789-step-4.png',
        assetSha256:
          '02af808cbd1c1a8bbb20dda3084a68240c0e4310f08b6f3120963d76c1e7e756',
        label: 'Step 4',
        nativeRect: Object.freeze({x: 292, y: 296, width: 236, height: 191}),
        paddedRect: Object.freeze({x: 288, y: 292, width: 244, height: 199}),
        sourceCharacterIds: Object.freeze([
          144,
          145,
          146,
          147,
          148,
          149,
          150,
          151,
          152,
        ]),
        transcript: STEP_4_TRANSCRIPT,
        transcriptSha256:
          '8c476e7328340df57c59936050b0905b786249e4f31d1fa4267153d6355ff796',
      }),
    ]),
  });

export const G4_L3_PAGE_36_READABLE_TRANSCRIPT = Object.freeze(
  G4_L3_PAGE_36_READABLE_VIEW_SPEC.crops.flatMap((crop) => crop.transcript),
);
