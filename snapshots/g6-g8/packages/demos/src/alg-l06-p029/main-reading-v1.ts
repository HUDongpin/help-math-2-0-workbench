import type {P029State}
 from './quiz-reducer-v1';

/** Source text not already represented by the question, glossary and editable
 * answer companion. Pair text is a durable reading history, not a claim that
 * its one-frame glyph remains visible on the Canvas. */
export const P029_MAIN_READING_SOURCE={
  swfSha256:'cbfd012d0aff11544a252c9e2852dff30d408c634aa2a805eb0837933c3370d4',
  mainSpriteId:185,
  answerLabel:{textId:19,readableLabel:'Answer:',
    sourceTextSha256:'a69bd5150dbb402d0990312198cb5c46b71e7818b960bfe878f34c574ec8335a'},
  readOnlyAnswer:{editTextId:181,sourceInstanceId:'depth-77/generation-2',
    firstFrame:146,lastFrame:234,value:'3',
    frame146ActionSha256:'e3e559c42284e1775b6f519cda6f2d9b644460b020a97fac9b8672307ec06b01'},
  orderedPairs:[
    {textId:182,readableText:'(1, 1)',sourceTextSha256:'626314d09a7b3e13d8f498c90f58ce4d7ee4984605db41e7540665b87fee090b',firstFrame:170,sourceVisibleFrames:[170,172,174]},
    {textId:183,readableText:'(1, 2)',sourceTextSha256:'000b02633d1cb01eb300cadfbcbdbed6c2de13dc51a18367c9497ce413f5b77f',firstFrame:176,sourceVisibleFrames:[176,178,180]},
    {textId:184,readableText:'(1, 3)',sourceTextSha256:'f6cffbe79518e4321a59336e46cf5fe30ff94b1852e1b4d18c217a4e5321ac0d',firstFrame:182,sourceVisibleFrames:[182,184,186]},
  ],
  emphasisDuplicates:[
    {textId:20,text:'ordered pairs',sourceTextSha256:'f729b259b9627b8e65456c8db7292d547f8ce028b503e9ea9b83b866632e3d83',sourceVisibleFrames:[12,14,16]},
    {textId:21,text:'relation',sourceTextSha256:'fc8fbb48a3a16bfdd85345d0b6aa543ebd805c370e5b763ed75207185093fca3',sourceVisibleFrames:[35,37,39]},
  ],
} as const;

export interface P029MainReadingV1 {
  readonly answer:Readonly<{label:'Answer:';value:'3';textId:19;editTextId:181}>|null;
  readonly seenOrderedPairs:readonly Readonly<{textId:182|183|184;
    text:string;firstFrame:number}>[];
  readonly sourceEmphasis:'ordered pairs'|'relation'|null;
}

export function p029MainReadingV1(state:P029State):P029MainReadingV1{
  const frame=state.mainFrame;
  if(!Number.isSafeInteger(frame)||frame<1||frame>234)
    throw Error('P029_MAIN_READING_FRAME_INVALID');
  const sourceEmphasis=P029_MAIN_READING_SOURCE.emphasisDuplicates.find(row=>
    (row.sourceVisibleFrames as readonly number[]).includes(frame))?.text??null;
  if(state.phase!=='postquiz'||frame<146)
    return {answer:null,seenOrderedPairs:[],sourceEmphasis};
  if(state.entryText!==P029_MAIN_READING_SOURCE.readOnlyAnswer.value)
    throw Error('P029_POSTQUIZ_SOURCE_ANSWER_MISMATCH');
  return {answer:{label:'Answer:',value:'3',textId:19,editTextId:181},
    seenOrderedPairs:P029_MAIN_READING_SOURCE.orderedPairs.filter(row=>
      frame>=row.firstFrame).map(row=>({textId:row.textId,text:row.readableText,
        firstFrame:row.firstFrame})),sourceEmphasis};
}
