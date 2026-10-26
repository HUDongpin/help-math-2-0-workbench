import {P029_FEEDBACK,P029_SOURCE,type P029State}
 from './quiz-reducer-v1';

/** One primary authored text placement per feedback sprite. Duplicate glyph
 * layers are intentionally not announced twice. Spans are local sprite frames. */
export const P029_FEEDBACK_TEXT={
  52:{textId:32,text:'Incorrect!',sha256:'0ba6233cde3c08d3952795942758862cc9ce4a322bb27b8659bf27961addc1bf',first:3,last:27},
  98:{textId:73,text:"That's incorrect!",sha256:'bcdb0e8b7179fa114914e21ee9c044ef4e896e61de61ed18dc1376c701c3bab8',first:4,last:26},
  67:{textId:58,text:'Try Again!',sha256:'a9f7ac658f82d57944a426de5b4d8b28cde453d2859ad6df334f0b60aa056b4c',first:6,last:24},
  151:{textId:144,text:'YOU GOT IT!',sha256:'6c1d7253efc00b37fb220871d54de6b843cdd0241ab65f8de25f4387aad99f10',first:13,last:26},
  167:{textId:162,text:'Correct!',sha256:'e2581a9d7d0cfa15120953a55e59d0d1cb77c89a287d32f9e1fa51fafa5a9975',first:12,last:25},
  179:{textId:173,text:'Great Job!',sha256:'2a88179ced3e8c15b26d0a31695412cf05eabe4434bf424657297e09a71c7169',first:3,last:24},
  126:{textId:122,text:'Good Job!',sha256:'72dcac9e5e9a26c01c429b524afc868888bd968fe22377c6945d2667081f3476',first:14,last:27},
} as const;

export const P029_WRONG_POPUP_SPANS={
  52:{popupSpriteId:51,editTextId:50,first:14,last:20},
  98:{popupSpriteId:89,editTextId:88,first:16,last:22},
  67:{popupSpriteId:63,editTextId:62,first:15,last:21},
} as const;

export type P029WrongReadV6={text:string;basis:string;parityAccepted:false}|null;
export type P029WrongResolverV6=(state:P029State)=>P029WrongReadV6;
export interface P029FeedbackReadingV1 {
  readonly spriteId:number;readonly localFrame:number;
  readonly kind:'right'|'wrong';readonly label:Readonly<{textId:number;text:string;sha256:string}>|null;
  readonly popup:Readonly<{popupSpriteId:number;editTextId:number;
    text:string;basis:string;parityAccepted:false}>|null;
  readonly state:'playing'|'held';
}

export function p029FeedbackReadingV1(state:P029State,
  resolveWrong:P029WrongResolverV6):P029FeedbackReadingV1|null{
  const feedback=state.feedback;
  if(!feedback||!['feedback-playing','feedback-held'].includes(state.phase))return null;
  if(P029_SOURCE.swfSha256!=='cbfd012d0aff11544a252c9e2852dff30d408c634aa2a805eb0837933c3370d4')
    throw Error('P029_WRONG_SOURCE');
  const selected=(P029_FEEDBACK[feedback.kind] as Record<number,
    {characterId:number;domain:string;end:number}>)[feedback.branchIndex];
  if(!selected||selected.characterId!==feedback.spec.characterId||
    selected.domain!==feedback.spec.domain||
    feedback.frame<1||feedback.frame>selected.end)
    throw Error('P029_FEEDBACK_SPEC_MISMATCH');
  const spriteId=selected.characterId;
  const text=(P029_FEEDBACK_TEXT as Record<number,
    {textId:number;text:string;sha256:string;first:number;last:number}>)[spriteId];
  if(!text)throw Error('P029_FEEDBACK_TEXT_UNBOUND');
  const label=feedback.frame>=text.first&&feedback.frame<=text.last?
    {textId:text.textId,text:text.text,sha256:text.sha256}:null;
  let popup:P029FeedbackReadingV1['popup']=null;
  if(feedback.kind==='wrong'){
    const span=(P029_WRONG_POPUP_SPANS as Record<number,
      {popupSpriteId:number;editTextId:number;first:number;last:number}>)[spriteId];
    if(!span)throw Error('P029_WRONG_POPUP_UNBOUND');
    if(feedback.frame>=span.first&&feedback.frame<=span.last){
      const read=resolveWrong(state);
      const expected=state.quizTryCount===1?P029_SOURCE.firstWrongText:
        P029_SOURCE.laterWrongText;
      if(!read||read.text!==expected||read.text!==state.wrongfeedWritten||
        read.parityAccepted!==false||!read.basis)
        throw Error('P029_WRONG_POPUP_SOURCE_READ_UNRESOLVED');
      popup={popupSpriteId:span.popupSpriteId,editTextId:span.editTextId,
        text:read.text,basis:read.basis,parityAccepted:false};
    }
  }
  return {spriteId,localFrame:feedback.frame,kind:feedback.kind,label,popup,
    state:state.phase==='feedback-held'?'held':'playing'};
}

export function p029FocusTarget(state:P029State):'answer'|'close'|null{
  if(state.phase==='question'&&state.mainFrame===145)return 'answer';
  if(state.phase==='feedback-held'&&state.feedback?.kind==='wrong')return 'close';
  return null;
}
