/** Source main205 places sprite8 at these frames for one frame each. */
export const P046_INTRO_CLICK_FRAMES=Object.freeze([196,198,200,202,204,235]as const);
/** A delayed render must not burst obsolete sounds into a later teaching step. */
export function p046IntroClickBetween(previous:number,current:number):number|null{
 if(!Number.isSafeInteger(previous)||!Number.isSafeInteger(current)||previous<0||current<1||current<previous)throw Error('P046_CLICK_FRAME');
 return P046_INTRO_CLICK_FRAMES.find(frame=>frame>previous&&frame<=current&&current-frame<1)??null;
}
