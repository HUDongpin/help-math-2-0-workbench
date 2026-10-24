import type {AnimationModule} from './contract';
import type {LessonTextPresentationCapability} from './lesson-text-contract';
import type {NarrationPcmAsset} from './generated/lesson-manual-narration-pcm';
export function validateTerminalTimelineAudio(module:AnimationModule,cap:LessonTextPresentationCapability<unknown>,assets:Readonly<Record<string,NarrationPcmAsset>>){
 if(cap.playbackMode!==undefined&&cap.playbackMode!=='once')throw Error('Unsupported modern playback mode');
 const policy=cap.terminalTimelineAudio;if(!policy)return;
 const count=policy.frameDomain==='root'?(module.runtime??module.movie).frameCount:module.runtime?.frameDomains?.find(d=>d.id===policy.frameDomain)?.frameCount;
 const cue=cap.sourceTimelineAudioCues?.find(c=>c.id===policy.cueId),pcm=assets[policy.sourceSha256],fps=(module.runtime??module.movie).fps;
 const initialStop=cap.playbackEndFrameByDomain?.[policy.frameDomain];
 const frameControl=cap.frameControl;
 // A source quiz can hold before its terminal audio tail. Only declared direct
 // edges from that exact hold to the same domain's final frame admit the tail.
 const reachesTerminal=initialStop===count||(
  typeof initialStop==='number'&&typeof count==='number'&&Number.isInteger(initialStop)&&initialStop>0&&initialStop<count&&
  frameControl?.frameDomain===policy.frameDomain&&frameControl.completionFrame===count&&
  frameControl.transitions.length>0&&frameControl.transitions.every(edge=>
   edge.fromFrame===initialStop&&Number.isInteger(edge.toFrame)&&edge.toFrame>initialStop&&
   edge.toFrame<=count&&edge.stopFrame===count));
 if(cap.binding.animationId!==module.key||cap.playbackMode!=='once'||!count||policy.holdFrame!==count||policy.endFrameExclusive!==count+1||!reachesTerminal||!cue||cue.frameDomain!==policy.frameDomain||cue.sha256!==policy.sourceSha256||cue.endFrame!==count+1||cue.frame>=count||!pcm||pcm.sha256!==policy.pcmSha256||!/^[a-f0-9]{64}$/.test(policy.sourceSha256)||!/^[a-f0-9]{64}$/.test(policy.pcmSha256)||!Number.isFinite(fps)||fps<=0)throw Error('Unbound terminal timeline audio policy');
 if(policy.allowClockDriftTail!==undefined&&policy.allowClockDriftTail!==true)throw Error('Invalid terminal clock-drift tail opt-in');
 const remaining=pcm.frames-(count-cue.frame)*pcm.sampleRate/fps;
 const oneFrame=Math.ceil(pcm.sampleRate/fps)+.5;
 const minimum=policy.allowClockDriftTail===true?-oneFrame:0;
 if(!(remaining>minimum&&remaining<=oneFrame))throw Error('Terminal audio outside the opted-in source-frame window');
}
