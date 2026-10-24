/** Main sprite243 authored demonstration. Source tag/image decisions are in
 * audit/intro-teaching-beats-v1.json. Native emphasis replaces cursor travel/blink.
 */
export function p044IntroFrame(frame:number){
  if(!Number.isSafeInteger(frame)||frame<1||frame>361)throw Error('P044_INTRO_FRAME');
  const parts=frame<72?1:frame<81?2:frame<86?3:frame<91?5:frame<323?4:1;
  const selected:readonly number[]=Object.freeze(frame>=132&&frame<323?[2]:[]);
  return Object.freeze({frame,visible:frame>=5,parts,selected,
    target:frame<8?null:Object.freeze({numerator:1,denominator:frame<323?4:5}),
    emphasis:frame>=349?'fraction':frame>=321&&frame<=325?'new-whole':frame>=272&&frame<313?'check-answer':frame>=263&&frame<=271?'numerator':frame>=123&&frame<133?'select-part':frame>=87&&frame<97?'decrease':frame>=73&&frame<87?'increase':null,
    sourceClick:frame===292||frame===323,
    tailHold:frame===361,
  });
}
