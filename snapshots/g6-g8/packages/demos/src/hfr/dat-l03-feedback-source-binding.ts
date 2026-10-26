/** Exact DAT L3 dependency slice, freshly matched to SWF/data/AOT on2026-10-24.
 * indexMI.swf SHA256275499325edb24daed95952b207d2dd4ed83056ebac54cd0bc911673058086c9:
 * showWrongFeed selects1..3; showRightFeed selects1..4, starts frame2 and sets_x=5.
 * WrongFeed and quizTryCount remain authored page actions. Mc_Wrong_Feed4 is
 * absent in all four sources and must remain an unresolved source diagnostic. */
export interface DatL3Placement {
  readonly name: string; readonly characterId: number; readonly depth: number;
  readonly matrix: readonly number[];
}
export interface DatL3FeedbackBranch extends DatL3Placement {
  readonly kind: 'wrong' | 'right'; readonly frameCount: number; readonly holdFrame?: number;
}
export interface DatL3FeedbackBinding {
  readonly animationId: string; readonly sourceSha256: string; readonly sourceBytes: number;
  readonly dataSha256: string;
  readonly main: DatL3Placement & Readonly<{frameCount: number; questionFrame: number}>;
  readonly answers: readonly (DatL3Placement & Readonly<{script: string}>)[];
  readonly nmh: DatL3Placement; readonly helpPopup: DatL3Placement;
  readonly feedback: readonly DatL3FeedbackBranch[];
}
export const DAT_L03_FEEDBACK_BINDINGS: readonly DatL3FeedbackBinding[] = Object.freeze([
  {
    animationId: "shared-dat001-l03-p029",
    sourceSha256: "a1e9082da52d06fbcc52c387aa384ab8b3c7c999f875481cf615ba38477a49fa",
    sourceBytes: 624587,
    dataSha256: "eebbec45f3d20b76f590d91736e9e6c0d7be68350658f0441b1fb2bd2d84141f",
    main: {"name":"animation","characterId":221,"depth":2,"matrix":[1,0,0,1,8248,5666],"frameCount":389,"questionFrame":185},
    answers: [
      {"name":"AnsBtn2","characterId":44,"depth":55,"matrix":[2.64275,0,0,1.09291,-6316,-992],"script":"button44_release"},
      {"name":"AnsBtn1","characterId":45,"depth":57,"matrix":[2.64275,0,0,1.09291,-6321,-2069],"script":"button45_release"},
      {"name":"AnsBtn3","characterId":45,"depth":59,"matrix":[2.64275,0,0,1.09291,-6322,101],"script":"button45_release"},
      {"name":"AnsBtn4","characterId":45,"depth":61,"matrix":[2.65881,0,-0.03752,1.12624,-6337,1202],"script":"button45_release"},
    ],
    nmh: {"name":"NMHBtn","characterId":46,"depth":63,"matrix":[1,0,0,1,5389,-3128]},
    helpPopup: {"name":"Mc_Popup","characterId":214,"depth":129,"matrix":[1,0,0,1,8016,-3428]},
    feedback: [
      {"name":"Mc_Wrong_Feed2","characterId":72,"depth":69,"matrix":[1,0,0,1,-261,-251],"kind":"wrong","frameCount":29,"holdFrame":20},
      {"name":"Mc_Wrong_Feed3","characterId":87,"depth":75,"matrix":[1,0,0,1,-261,-65],"kind":"wrong","frameCount":28,"holdFrame":21},
      {"name":"Mc_Wrong_Feed1","characterId":118,"depth":86,"matrix":[1,0,0,1,-249,-443],"kind":"wrong","frameCount":28,"holdFrame":22},
      {"name":"Mc_Right_Feed1","characterId":146,"depth":96,"matrix":[1,0,0,1,-570,-346],"kind":"right","frameCount":28},
      {"name":"Mc_Right_Feed4","characterId":171,"depth":100,"matrix":[1,0,0,1,-260,-2646],"kind":"right","frameCount":27},
      {"name":"Mc_Right_Feed3","characterId":187,"depth":109,"matrix":[1,0,0,1,-251,-886],"kind":"right","frameCount":28},
      {"name":"Mc_Right_Feed2","characterId":199,"depth":119,"matrix":[1,0,0,1,-250,-348],"kind":"right","frameCount":25},
    ],
  },
  {
    animationId: "shared-dat001-l03-p034",
    sourceSha256: "1b83c56d93c9e5b24347aa5ac086843abf53084af2e5a0e813d14f9b58311a49",
    sourceBytes: 606248,
    dataSha256: "6ef960be80cb428124a5b0aa544df37933e9461cb899b5af2f8c573e391d8d16",
    main: {"name":"animation","characterId":210,"depth":2,"matrix":[1,0,0,1,8248,5666],"frameCount":340,"questionFrame":209},
    answers: [
      {"name":"AnsBtn3","characterId":45,"depth":57,"matrix":[2.64275,0,0,1.09291,-6361,391],"script":"button45_release"},
      {"name":"AnsBtn1","characterId":46,"depth":59,"matrix":[2.64275,0,0,1.09291,-6321,-1779],"script":"button46_release"},
      {"name":"AnsBtn2","characterId":46,"depth":61,"matrix":[2.64275,0,0,1.09291,-6326,-678],"script":"button46_release"},
      {"name":"AnsBtn4","characterId":46,"depth":63,"matrix":[2.65881,0,-0.03752,1.12624,-6337,1492],"script":"button46_release"},
    ],
    nmh: {"name":"NMHBtn","characterId":47,"depth":65,"matrix":[1,0,0,1,5389,-2838]},
    helpPopup: {"name":"Mc_Popup","characterId":207,"depth":131,"matrix":[1,0,0,1,8016,-2788]},
    feedback: [
      {"name":"Mc_Wrong_Feed2","characterId":73,"depth":71,"matrix":[1,0,0,1,-201,-251],"kind":"wrong","frameCount":29,"holdFrame":20},
      {"name":"Mc_Wrong_Feed3","characterId":88,"depth":77,"matrix":[1,0,0,1,-201,-65],"kind":"wrong","frameCount":28,"holdFrame":21},
      {"name":"Mc_Wrong_Feed1","characterId":119,"depth":88,"matrix":[1,0,0,1,-189,-443],"kind":"wrong","frameCount":28,"holdFrame":22},
      {"name":"Mc_Right_Feed4","characterId":147,"depth":98,"matrix":[1,0,0,1,-530,-346],"kind":"right","frameCount":28},
      {"name":"Mc_Right_Feed1","characterId":172,"depth":102,"matrix":[1,0,0,1,-220,-2646],"kind":"right","frameCount":27},
      {"name":"Mc_Right_Feed2","characterId":188,"depth":111,"matrix":[1,0,0,1,-211,-886],"kind":"right","frameCount":28},
      {"name":"Mc_Right_Feed3","characterId":200,"depth":121,"matrix":[1,0,0,1,-210,-348],"kind":"right","frameCount":25},
    ],
  },
  {
    animationId: "shared-dat001-l03-p037",
    sourceSha256: "668e9f7acd7677bcde4928d65e4e96a417e4f40f1ccb86e39f38f3172ee873c6",
    sourceBytes: 448915,
    dataSha256: "a8af9cc59fd4994eee5cc8d419102303253da2c033142c56e3d1e8362f6267a8",
    main: {"name":"animation","characterId":227,"depth":2,"matrix":[1,0,0,1,8248,5666],"frameCount":311,"questionFrame":203},
    answers: [
      {"name":"AnsBtn2","characterId":60,"depth":71,"matrix":[2.64275,0,0,1.09291,1937,-1446],"script":"button60_release"},
      {"name":"AnsBtn1","characterId":61,"depth":73,"matrix":[2.64275,0,0,1.09291,1977,-2516],"script":"button61_release"},
      {"name":"AnsBtn3","characterId":61,"depth":75,"matrix":[2.64275,0,0,1.09291,1972,-315],"script":"button61_release"},
      {"name":"AnsBtn4","characterId":61,"depth":77,"matrix":[2.65881,0,-0.03752,1.12624,1961,755],"script":"button61_release"},
    ],
    nmh: {"name":"NMHBtn","characterId":62,"depth":79,"matrix":[1,0,0,1,5389,-3628]},
    helpPopup: {"name":"Mc_Popup","characterId":226,"depth":157,"matrix":[1,0,0,1,8716,-3203]},
    feedback: [
      {"name":"Mc_Wrong_Feed1","characterId":89,"depth":85,"matrix":[1,0,0,1,-241,-1534],"kind":"wrong","frameCount":31,"holdFrame":22},
      {"name":"Mc_Wrong_Feed2","characterId":103,"depth":97,"matrix":[1.0441,0,0,1.0441,-246,-718],"kind":"wrong","frameCount":29,"holdFrame":23},
      {"name":"Mc_Wrong_Feed3","characterId":116,"depth":110,"matrix":[1,0,0,1,-241,-466],"kind":"wrong","frameCount":28,"holdFrame":20},
      {"name":"Mc_Right_Feed3","characterId":142,"depth":120,"matrix":[1,0,0,1,-251,114],"kind":"right","frameCount":31},
      {"name":"Mc_Right_Feed2","characterId":174,"depth":131,"matrix":[1,0,0,1,-241,-1677],"kind":"right","frameCount":25},
      {"name":"Mc_Right_Feed4","characterId":207,"depth":143,"matrix":[1,0,0,1,-241,314],"kind":"right","frameCount":27},
      {"name":"Mc_Right_Feed1","characterId":215,"depth":152,"matrix":[1,0,0,1,-249,-526],"kind":"right","frameCount":27},
    ],
  },
  {
    animationId: "shared-dat001-l03-p044",
    sourceSha256: "f9fa378dae32f2e88abab12d898cf5b1dabbb83f0653b95436103dd65a4ee6ff",
    sourceBytes: 622798,
    dataSha256: "99db24008b0f634a8326dbb103be4563bad83ae1640d630775584736cc0e6c4c",
    main: {"name":"animation","characterId":214,"depth":2,"matrix":[1,0,0,1,8248,5666],"frameCount":374,"questionFrame":136},
    answers: [
      {"name":"AnsBtn2","characterId":37,"depth":35,"matrix":[3.73354,0,0,1.09291,1212,-1042],"script":"button37_release"},
      {"name":"AnsBtn1","characterId":38,"depth":37,"matrix":[3.03975,0,0,1.09291,1239,-2111],"script":"button38_release"},
      {"name":"AnsBtn3","characterId":38,"depth":39,"matrix":[3.2523,0,0,1.09291,1245,46],"script":"button38_release"},
    ],
    nmh: {"name":"NMHBtn","characterId":8,"depth":41,"matrix":[1,0,0,1,5389,-3028]},
    helpPopup: {"name":"Mc_Popup","characterId":206,"depth":107,"matrix":[1,0,0,1,8016,-2788]},
    feedback: [
      {"name":"Mc_Wrong_Feed2","characterId":63,"depth":47,"matrix":[1,0,0,1,-261,-251],"kind":"wrong","frameCount":29,"holdFrame":20},
      {"name":"Mc_Wrong_Feed3","characterId":78,"depth":53,"matrix":[1,0,0,1,-261,-65],"kind":"wrong","frameCount":28,"holdFrame":21},
      {"name":"Mc_Wrong_Feed1","characterId":109,"depth":64,"matrix":[1,0,0,1,-249,-443],"kind":"wrong","frameCount":28,"holdFrame":22},
      {"name":"Mc_Right_Feed3","characterId":137,"depth":74,"matrix":[1,0,0,1,-590,-356],"kind":"right","frameCount":28},
      {"name":"Mc_Right_Feed1","characterId":162,"depth":78,"matrix":[1,0,0,1,-280,-2656],"kind":"right","frameCount":27},
      {"name":"Mc_Right_Feed2","characterId":178,"depth":87,"matrix":[1,0,0,1,-271,-896],"kind":"right","frameCount":28},
      {"name":"Mc_Right_Feed4","characterId":190,"depth":97,"matrix":[1,0,0,1,-270,-358],"kind":"right","frameCount":25},
    ],
  },
]);

export function isDatL3FeedbackSource(animationId: string, sourceSha256: string): boolean {
  return DAT_L03_FEEDBACK_BINDINGS.some(row => row.animationId === animationId && row.sourceSha256 === sourceSha256);
}
export function datL3FeedbackBinding(animationId: string, sourceSha256: string, dataSha256: string): DatL3FeedbackBinding | null {
  return DAT_L03_FEEDBACK_BINDINGS.find(row => row.animationId === animationId && row.sourceSha256 === sourceSha256 && row.dataSha256 === dataSha256) ?? null;
}

/** Observation of the completed authored exit. Never increments a counter,
 * advances a frame, chooses a feedback branch, or treats elapsed time as exit. */
export function datL3FeedbackReturned(value: Readonly<{
  kind: 'wrong' | 'right'; countBefore: number; countAfter: unknown;
  questionFrame: number; mainFrame: number; mainPlaying: boolean; quizSection: unknown;
  feedbackFrame: number; feedbackPlaying: boolean; pendingSourceActions: number;
}>): boolean {
  if (!['wrong', 'right'].includes(value.kind) || value.pendingSourceActions !== 0 || value.feedbackFrame !== 1 || value.feedbackPlaying ||
      ![0, 1].includes(value.countBefore) || !Number.isSafeInteger(value.mainFrame)) return false;
  const continued = value.quizSection === false &&
    (value.mainFrame === value.questionFrame && value.mainPlaying || value.mainFrame > value.questionFrame);
  if (value.kind === 'right') return continued && value.countAfter === value.countBefore;
  return value.countBefore === 0
    ? value.countAfter === 1 && value.quizSection === true && value.mainFrame === value.questionFrame && !value.mainPlaying
    : value.countAfter === 0 && continued;
}
