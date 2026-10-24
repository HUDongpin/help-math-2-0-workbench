import type{LessonTextPresentationCapability}from'../lesson-text-contract';
import type{SourceStaticCanvasFrameState}from'../source-static-canvas-candidate';
import{G4_L3_MAIN_TIMELINE_AUDIO_CANDIDATES}from'../g4-l3-main-timeline-audio.generated';
import{Ti002Renderer}from'./g4-l3-ti002';
import{TI002_BINDING,getTi002TextSnapshot}from'./g4-l3-ti002-text';
import{TI002_KEY_TERMS}from'./g4-l3-ti002-keyterms';
import{TI002_FEEDBACK_ACTIVITIES,TI002_CIRCLE_ACTIVITY}from'./g4-l3-ti002-feedback-host';
const main=G4_L3_MAIN_TIMELINE_AUDIO_CANDIDATES['course-g04-l03-ti-002'].audioCues[0];
if(main.sha256!=='e58ca176550d903d693a8b96a1acad21dd7a2d617eeec5559c2d8dcc416c1307'||main.frame!==24||main.endFrame!==255)throw Error('TI002 source main audio drift');
/** Prepared candidate capability, not acceptance. Host snapshots at238+ require
 * live interaction state; source-only calls intentionally block that snapshot. */
export const TI002_PRESENTATION:LessonTextPresentationCapability<SourceStaticCanvasFrameState>={
 schemaVersion:1,binding:TI002_BINDING,Renderer:Ti002Renderer,getSnapshot:getTi002TextSnapshot,
 sourceTimelineAudioCues:[{...main,sha256:main.sha256!}],activityTimelines:[...TI002_FEEDBACK_ACTIVITIES,TI002_CIRCLE_ACTIVITY],
 frameControl:{frameDomain:'sprite-272',completionFrame:254,transitions:[{fromFrame:238,toFrame:239,stopFrame:254}]},
 playbackMode:'once',playbackEndFrameByDomain:{'sprite-272':238},reducedMotionFrameByDomain:{'sprite-272':238},keyTerms:TI002_KEY_TERMS,
};
