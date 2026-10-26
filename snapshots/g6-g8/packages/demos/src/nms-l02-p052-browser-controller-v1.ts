import {P052Controller} from './nms-l02-p052-controller-v1';
import {P052AudioSession} from './nms-l02-p052-audio-session-v1';
import {createP052AudioLoader} from './nms-l02-p052-audio-loader-v1';
/** Construct once per mounted page. start/dispatch must originate in the
 * host's activation handler; construction does not fetch or allocate audio.
 * Host owns RAF tick and must close on navigation/unmount. */
export function createP052BrowserController(changed:()=>void,seed=0){
 const load=createP052AudioLoader();
 const narration=new P052AudioSession({load}),click=new P052AudioSession({load});
 return new P052Controller({narration,click,now:()=>narration.currentTime(),changed},seed);
}
