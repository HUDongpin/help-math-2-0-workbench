import type {AudioCue, RuntimeContext} from '../contract';
import type {LessonTextBinding, LessonTextInstance, TextPresentationSnapshot} from '../lesson-text-contract';
import {buildLessonTextSnapshot} from '../lesson-text-snapshot';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';

export interface LunchMenuConfig {
  readonly animationId: string; readonly placementId: string; readonly sourceSwfSha256: string;
  readonly frameDomain: string; readonly rootFrame: number; readonly frameCount: number; readonly fps: number;
  readonly title: Readonly<{id: string; text: string}>; readonly menuTitle: Readonly<{id: string; text: string}>;
  readonly menu: readonly Readonly<{id: string; foodId: string; priceId: string; food: string; price: string; foodCharacterId: number; priceCharacterId: number}>[];
  readonly highlights: readonly Readonly<{foodCharacterId: number; priceCharacterId: number; firstFrame: number; lastFrameExclusive: number; intervals: readonly (readonly [number,number])[]}>[];
  readonly menuVisibleFrom: number; readonly menuFocusFrom: number; readonly finalMenuOnlyFrom: number;
  readonly exclusions: readonly (LessonTextInstance & Readonly<{firstFrame: number; lastFrameExclusive: number}>)[];
  readonly adapter: Readonly<{url: string; sha256: string; variantId: string}>;
  readonly sourceAudio: readonly (AudioCue & Readonly<{sha256: string}>)[];
  readonly binding: LessonTextBinding; readonly sourceRisksGloballyResolved: false;
}
export type LunchMenuFrameReader = (frame: number, context: RuntimeContext) => SourceStaticCanvasFrameState;

export function getLunchMenuSnapshot(config: LunchMenuConfig, readFrame: LunchMenuFrameReader,
  state: SourceStaticCanvasFrameState, context: RuntimeContext): TextPresentationSnapshot {
  const expected=readFrame(context.frame,context);
  const valid=Boolean(state && state.status==='ready' && expected.status==='ready' &&
    state.animationId===config.animationId && state.sourceSwfSha256===config.sourceSwfSha256 &&
    state.frame===expected.frame && state.frameDomain===config.frameDomain &&
    (context.frameDomain??config.frameDomain)===config.frameDomain &&
    state.rootFrame===config.rootFrame && (context.rootFrame??config.rootFrame)===config.rootFrame &&
    state.scenario==='source-static-frame' && context.scenario===state.scenario &&
    state.language==='en' && context.lang==='en' && state.seed===expected.seed);
  const frame=expected.frame,menuVisible=frame>=config.menuVisibleFrom;
  const content:Record<string,{text:string;visible:boolean}>={
    [config.title.id]:{text:config.title.text,visible:true},
    [config.menuTitle.id]:{text:config.menuTitle.text,visible:menuVisible},
  };
  for(const row of config.menu){content[row.foodId]={text:row.food,visible:menuVisible};content[row.priceId]={text:row.price,visible:menuVisible};}
  const snapshot=buildLessonTextSnapshot(config.binding,{...context,frame,frameDomain:config.frameDomain,rootFrame:config.rootFrame,seed:expected.seed},content);
  if(!valid||snapshot.status!=='ready')return Object.freeze({...snapshot,status:'blocked',blocks:Object.freeze([]),suppressedInstances:Object.freeze([]),
    blockers:Object.freeze(snapshot.blockers.length?snapshot.blockers:[state?.blocker??expected.blocker??'source-frame-identity-mismatch'])});
  return Object.freeze({...snapshot,suppressedInstances:Object.freeze(config.exclusions.filter(e=>frame>=e.firstFrame&&frame<e.lastFrameExclusive).map(({id,path})=>({id,path})))});
}
