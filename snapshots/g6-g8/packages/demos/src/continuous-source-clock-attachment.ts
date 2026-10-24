import type {FrozenGlossaryControl} from './frozen-calibration-glossary-candidate';
import {frozenContinuousSourceMember} from './frozen-continuous-source-scope';
import type {AnimationModule} from './contract';
import type {ContinuousSourceClockPlan} from './continuous-source-stream-clock-candidate';
import type {SourceStaticCanvasCandidateConfig} from './source-static-canvas-candidate';
import {prepareFrozenGlossaryCanvas} from './frozen-glossary-canvas-preparation';

export interface ContinuousSourceClockAttachment {
  readonly kind:'continuous-source-clock-candidate-v1';
  readonly plan:ContinuousSourceClockPlan;
  readonly sourceUrl:string;
  readonly width:number;
  readonly height:number;
  renderFrame(canvas:HTMLCanvasElement,frame:number):boolean;
}
export type ContinuousSourceClockModule=AnimationModule&{readonly privateSourceClock:ContinuousSourceClockAttachment;readonly privateGlossaryControls?:readonly FrozenGlossaryControl[]};
export async function prepareContinuousSourceClockAttachment(config:SourceStaticCanvasCandidateConfig,plan:ContinuousSourceClockPlan):Promise<ContinuousSourceClockAttachment>{
  const member=frozenContinuousSourceMember(config.animationId);
  if(!member||member.sourceSwfSha256!==plan.sourceSwfSha256||member.frameDomain!==plan.frameDomain||member.lastFrame!==plan.lastFrame||member.channels!==plan.decoder.channels||member.audioFirstFrame!==(plan.audioFirstFrame??1)||config.sourceSwfSha256!==plan.sourceSwfSha256||config.mainFrameDomain!==plan.frameDomain||config.fps!==plan.fps||config.mainFrameCount!==plan.lastFrame)throw Error('continuous-source-module-binding-mismatch');
  await prepareFrozenGlossaryCanvas(config);
  const asset=window.HELP_MATH_CANVAS_ASSETS?.[config.animationId];
  if(!asset)throw Error('continuous-source-canvas-unavailable');
  return Object.freeze({kind:'continuous-source-clock-candidate-v1',plan,
    sourceUrl:`/flash-assets/g678-local/${config.animationId}/source-stream.mp3?sha256=${plan.decoder.sourceSha256}`,
    width:config.stage.width,height:config.stage.height,
    renderFrame(canvas:HTMLCanvasElement,frame:number){
      if(!Number.isSafeInteger(frame)||frame<plan.firstFrame||frame>plan.lastFrame||canvas.width!==config.stage.width||canvas.height!==config.stage.height||window.HELP_MATH_CANVAS_ASSETS?.[config.animationId]!==asset)return false;
      const state=asset.render(canvas,{frame,scenario:'source-static-frame',lang:'en',seed:0}) as {localFrame?:number;frameDomain?:string};
      return state.localFrame===frame&&state.frameDomain===plan.frameDomain&&canvas.getAttribute('data-flash-frame')===String(frame);
    }});
}
