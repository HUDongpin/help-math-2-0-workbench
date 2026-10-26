import {P052_FEEDBACK_DOMAINS as domains} from './generated/nms-l02-p052-feedback-domains-v1';
/** Source child-frame transitions after Done.gotoAndPlay(2).
 * elapsedFrames is active child time, supplied by the controller; pause must not add frames.
 * Child return/stop never dispatches parent Close or cuts a source audio tail.
 */
export function p052FeedbackClock(kind:'wrong'|'right',elapsedFrames:number){
 if(kind!=='wrong'&&kind!=='right')throw Error('P052_FEEDBACK_KIND');
 if(!Number.isSafeInteger(elapsedFrames)||elapsedFrames<0)throw Error('P052_FEEDBACK_ELAPSED');
 if(kind==='wrong'){
  const stopped=elapsedFrames>=domains.wrong.stopFrame-domains.wrong.startFrame;
  return {frameDomain:domains.wrong.domain,frame:stopped?domains.wrong.stopFrame:domains.wrong.startFrame+elapsedFrames,
   stopped,closeParent:false as const};
 }
 const stopped=elapsedFrames>=domains.right.returnFrame-domains.right.startFrame;
 return {frameDomain:domains.right.domain,frame:stopped?domains.right.returnTarget:domains.right.startFrame+elapsedFrames,
  stopped,closeParent:false as const};
}
