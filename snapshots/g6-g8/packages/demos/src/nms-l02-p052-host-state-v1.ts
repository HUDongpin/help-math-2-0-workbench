import type {P052Controller} from './nms-l02-p052-controller-v1';
/** Host playhead progress is not lesson completion. Only the player's explicit
 * onComplete callback may report completed teaching/audio progression. */
export function p052HostPlaybackState(s:ReturnType<P052Controller['snapshot']>){
 const available=!s.closed&&!s.error;
 return {audioAvailable:available,frame:s.state.frame,frameCount:156,frameDomain:'sprite-350',fps:12,
  narration:!available?'unavailable' as const:s.narrationPlaying?'playing' as const:'idle' as const,
  playbackProgress:available&&!s.loading?(s.state.frame-1)/155:null,
  seekAvailable:false,stepFrames:1,transportMode:'none' as const};
}
