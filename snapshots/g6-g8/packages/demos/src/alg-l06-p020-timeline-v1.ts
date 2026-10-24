/** Maintained source contract from the frozen P020 action and geometry audits. */
export const P020_TIMELINE={
 animationId:'shared-alg001-l06-p020',
 sourceSwfSha256:'6d0df40af188c98b77a7419b89223c922200723ce106240a6d08e49891a5d25f',
 stage:{width:800,height:600},fps:12,rootFrameCount:10,rootEntryFrame:6,
 mainFrameCount:172,frameDomain:'sprite-162',quizHoldFrame:58,
 glossary:{
  "Input": {
    "characterId": 7,
    "sourceFirstFrame": 2,
    "firstFullHitFrame": 7,
    "lastFrame": 172,
    "instanceId": "sprite-162/depth-3/generation-1",
    "labelTextId": 5,
    "actionSha256": "2f92a394bed054aeca4ae6ed57b238a04f5b3aa261270c980d5f00a82c8f19a5"
  },
  "Function": {
    "characterId": 8,
    "sourceFirstFrame": 2,
    "firstFullHitFrame": 7,
    "lastFrame": 172,
    "instanceId": "sprite-162/depth-5/generation-1",
    "labelTextId": 5,
    "actionSha256": "549555e0e21a60e887e614e7ff3b03592d8a7f577c5ec25e6601f039050f49c8"
  },
  "Output": {
    "characterId": 9,
    "sourceFirstFrame": 2,
    "firstFullHitFrame": 7,
    "lastFrame": 172,
    "instanceId": "sprite-162/depth-7/generation-1",
    "labelTextId": 5,
    "actionSha256": "1262eac21bf8a718d551c8d7b046220855f8f878214783cfdfb7d0c37f5ff5c7"
  }
},
 answers:{
  "A": {
    "sourceInstance": "AnsBtn1",
    "instanceId": "sprite-162/depth-159/generation-1",
    "characterId": 159,
    "actionSha256": "80eb81588b6bbc4e67c246434eab01f94dd136a47d07f5b70ebe7a70e8b91cfb"
  },
  "B": {
    "sourceInstance": "AnsBtn2",
    "instanceId": "sprite-162/depth-157/generation-1",
    "characterId": 158,
    "actionSha256": "fdf07cf022902ebfa5c8d2c82cdea664948b0af7c6c1070a56290cdfbd0c43a9"
  },
  "C": {
    "sourceInstance": "AnsBtn3",
    "instanceId": "sprite-162/depth-163/generation-1",
    "characterId": 159,
    "actionSha256": "80eb81588b6bbc4e67c246434eab01f94dd136a47d07f5b70ebe7a70e8b91cfb"
  },
  "D": {
    "sourceInstance": "AnsBtn4",
    "instanceId": "sprite-162/depth-161/generation-1",
    "characterId": 159,
    "actionSha256": "80eb81588b6bbc4e67c246434eab01f94dd136a47d07f5b70ebe7a70e8b91cfb"
  }
},
 acknowledgmentActions:{"60": "fed685fffc56d4931c99d76a3109c31642f01f20bc8c82f25e4715795f25de7a", "89": "414ad894ddeecb31ba5429e443b7fe08f5d36d9f99a043ce13b0a25909d46190", "74": "0c7aac5f201c4ca36e322030ba7b145736213820952a26e44a463e70538b4d3e"},
 oldHostPolicy:'conditional-indexMI-feedback-selector',originalRuntimeAccepted:false,
} as const;
export type P020GlossaryKey=keyof typeof P020_TIMELINE.glossary;
export function p020FrameState(frame:number){
 if(!Number.isSafeInteger(frame)||frame<1||frame>172)throw Error('P020_INVALID_MAIN_FRAME');
 return {animationId:P020_TIMELINE.animationId,frameDomain:'sprite-162',rootFrame:6,frame,
 availableGlossaryKeys:(['Input','Function','Output'] as const).filter(key=>
 frame>=P020_TIMELINE.glossary[key].firstFullHitFrame),quizHold:frame===58,
 originalRuntimeAccepted:false as const};
}
