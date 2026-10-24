import type {LessonTextPresentationCapability} from '../../lesson-text-contract';
import type {AnimationRendererProps} from '../../contract';
/** Merge into the reviewed native presentation only; no renderer/registry edit here. */
export const IN007_AUDIO_HOST = {
 sourceTimelineAudioCues:[{id:'in007-source-main',source:'/flash-assets/courses/course-g04-l03-in-007/audio/embedded-stream-0001.mp3',sha256:'35e62bb8ad052e76e20331722668f979a15588e6dbe39623a41291e0848fcaad',frame:1,endFrame:556,frameDomain:'sprite-98',language:'en',spokenLanguage:'undetermined'}],
 playbackEndFrameByDomain:{'sprite-98':555},
 reducedMotionFrameByDomain:{'sprite-98':555},
 keyTerms:{indexLanguage:'en',sourceAssetId:'ELKTEG4.xml',sourceSha256:'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',entryIds:['en-0459-b510b9647e1c','en-0677-bff39ce92c9e','en-0612-bf9e68924be1','en-0594-2fc559859c42']},
} as const satisfies Pick<LessonTextPresentationCapability<unknown>,'sourceTimelineAudioCues'|'playbackEndFrameByDomain'|'reducedMotionFrameByDomain'|'keyTerms'>;
export const IN007_KEYTERM_BUTTONS={10:{term:'Pattern',entryId:'en-0459-b510b9647e1c'},11:{term:'Symbol',entryId:'en-0677-bff39ce92c9e'},12:{term:'Set',entryId:'en-0612-bf9e68924be1'},15:{term:'Rule',entryId:'en-0594-2fc559859c42'}} as const;
/** sourceVisibleAndReady must come from the source teaching map/snapshot. */
export function requestIn007KeyTerm(runtime:AnimationRendererProps,button:number,trigger:HTMLElement,sourceVisibleAndReady:boolean){
 if(!sourceVisibleAndReady||runtime.entryStateSha256||runtime.frameDomain!=='sprite-98'||!runtime.onLessonHostRequest)return null;
 const term=IN007_KEYTERM_BUTTONS[button as keyof typeof IN007_KEYTERM_BUTTONS];if(!term)return null;
 return runtime.onLessonHostRequest({type:'open-keyterm',entryId:term.entryId,sourceAnimationId:'course-g04-l03-in-007',playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger,keyTermIndexLanguage:'en'});
}
