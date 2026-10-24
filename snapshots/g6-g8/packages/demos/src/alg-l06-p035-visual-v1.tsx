/** P035 visual composition only. The page owner supplies time, phase and audio. */
import React,{forwardRef,useImperativeHandle,useLayoutEffect,useRef,useState} from 'react';
import {createPortal,flushSync} from 'react-dom';
import {p035NativeTextState} from './alg-l06-p035-native-text-v1';
import {P035NativeInteractionDraft,type P035InteractionOwner}
 from './alg-l06-p035-native-interaction-v1';
import type {P035Phase} from './alg-l06-p035-state-v1';

export type P035VisualOwner=P035InteractionOwner&{phase:P035Phase};
export type P035CanvasState={localFrame:number;frameDomain:'sprite-227';
 feedback:null|{spriteId:number;localFrame:number}};
export type P035CanvasAsset={ready:()=>Promise<void>;
 render:(canvas:HTMLCanvasElement,request:{frame:number;lang:'en';seed:0;
  feedback?:{spriteId:number;localFrame:number}})=>P035CanvasState};
export type P035VisualHandle={commitMain:(frame:number)=>boolean;
 commitFeedback:(spriteId:number,localFrame:number)=>boolean};
type Feedback={spriteId:number;frame:number}|null;
type Painted={owner:P035VisualOwner;frame:number;feedback:Feedback};
const feedbackLimits:Record<number,number>={80:29,95:28,126:28,154:28,195:28,207:25};
const wrongHold:Record<number,number>={80:20,95:21,126:22};
const wrongCloseFirstPositiveAlpha:Record<number,number>={80:14,95:15,126:16};

function sameFeedback(a:Feedback,b:Feedback){return a?.spriteId===b?.spriteId&&a?.frame===b?.frame;}
function sameFrame(a:{frame:number;feedback:Feedback},b:{frame:number;feedback:Feedback}){
 return a.frame===b.frame&&sameFeedback(a.feedback,b.feedback);
}
function sameOwner(a:P035VisualOwner,b:P035VisualOwner){
 return a.phase===b.phase&&a.mainFrame===b.mainFrame&&sameFeedback(a.feedback,b.feedback)&&
  Object.is(a.mainAudioToken,b.mainAudioToken)&&a.feedbackEpoch===b.feedbackEpoch&&
  a.spanishEpoch===b.spanishEpoch&&a.interactionEpoch===b.interactionEpoch&&
  a.wrongTryCount===b.wrongTryCount&&a.inputLocked===b.inputLocked&&
  a.glossaryOpen===b.glossaryOpen&&a.spanishSelected===b.spanishSelected&&
  a.canChoose===b.canChoose&&a.canOpenGlossary===b.canOpenGlossary&&
  a.canCloseFeedback===b.canCloseFeedback;
}
function copyOwner(owner:P035VisualOwner):P035VisualOwner{
 return {...owner,feedback:owner.feedback?{...owner.feedback}:null};
}
/** An authored control is never enabled by frame 145 alone. */
export function p035VisualGate(owner:P035VisualOwner):P035InteractionOwner{
 if(!Number.isSafeInteger(owner.mainFrame)||owner.mainFrame<1||owner.mainFrame>534)
  throw new RangeError('P035_MAIN_FRAME');
 if(!['prequiz','question','feedback-pending','feedback-playing',
  'feedback-held','postquiz'].includes(owner.phase)||
  (owner.phase==='prequiz'&&owner.mainFrame>=145)||
  (['question','feedback-pending'].includes(owner.phase)&&owner.mainFrame!==145)||
  (owner.phase==='postquiz'&&owner.mainFrame<145))
  throw new RangeError('P035_PHASE_FRAME');
 const feedback=owner.feedback;
 if(feedback){
  if(owner.mainFrame!==145||feedback.spriteId===179||
   !Object.prototype.hasOwnProperty.call(feedbackLimits,feedback.spriteId)||
   !Number.isSafeInteger(feedback.frame)||feedback.frame<1||
   feedback.frame>feedbackLimits[feedback.spriteId]||
   !['feedback-playing','feedback-held'].includes(owner.phase)||
   (owner.phase==='feedback-held'&&feedback.frame!==wrongHold[feedback.spriteId])||
   (Object.prototype.hasOwnProperty.call(wrongHold,feedback.spriteId)!==
    (owner.wrongTryCount===0||owner.wrongTryCount===1)))
   throw new RangeError('P035_FEEDBACK_SELECTION');
 }else if(['feedback-playing','feedback-held'].includes(owner.phase))
  throw new RangeError('P035_FEEDBACK_REQUIRED');
 else if(owner.wrongTryCount!==undefined)
  throw new RangeError('P035_WRONG_TRY_WITHOUT_FEEDBACK');
 return {...copyOwner(owner),
  canChoose:owner.canChoose&&owner.phase==='question'&&owner.mainFrame===145&&feedback===null,
  canOpenGlossary:owner.canOpenGlossary&&owner.phase!=='feedback-pending'&&feedback===null,
  canCloseFeedback:owner.canCloseFeedback&&feedback!==null&&
   Object.prototype.hasOwnProperty.call(wrongCloseFirstPositiveAlpha,feedback.spriteId)&&
   feedback.frame>=wrongCloseFirstPositiveAlpha[feedback.spriteId]&&
   feedback.frame<=wrongHold[feedback.spriteId]};
}

/** This call is synchronous after ready(); Canvas returns only after pixels are committed. */
export function p035PaintExact(asset:P035CanvasAsset,canvas:HTMLCanvasElement,
 frame:number,feedback:Feedback):P035CanvasState{
 if(!Number.isSafeInteger(frame)||frame<1||frame>534)throw new RangeError('P035_MAIN_FRAME');
 if(feedback&&(frame!==145||feedback.spriteId===179||
  !Object.prototype.hasOwnProperty.call(feedbackLimits,feedback.spriteId)||
  !Number.isSafeInteger(feedback.frame)||feedback.frame<1||
  feedback.frame>feedbackLimits[feedback.spriteId]))throw new RangeError('P035_FEEDBACK_SELECTION');
 if(canvas.width!==800||canvas.height!==600)throw new RangeError('P035_CANVAS_SIZE');
 const state=asset.render(canvas,{frame,lang:'en',seed:0,
  ...(feedback?{feedback:{spriteId:feedback.spriteId,localFrame:feedback.frame}}:{})});
 if(state.frameDomain!=='sprite-227'||state.localFrame!==frame||
  state.feedback?.spriteId!==feedback?.spriteId||
  state.feedback?.localFrame!==feedback?.frame||
  canvas.getAttribute('data-flash-frame')!==String(frame)||
  canvas.getAttribute('data-p035-feedback-sprite')!==String(feedback?.spriteId??'none')||
  canvas.getAttribute('data-p035-feedback-frame')!==String(feedback?.frame??'none'))
  throw Error('P035_CANVAS_COMMIT_MISMATCH');
 return state;
}

export const P035VisualCompositionDraft=forwardRef<P035VisualHandle,{
 owner:P035VisualOwner;readCurrentOwner:()=>P035VisualOwner|null;
 canvasAsset:P035CanvasAsset|null;language?:'en'|'es';nativeTextTarget?:HTMLElement|null;
 onChoose?:(choice:{buttonName:string;letter:string;value:string;
  sourceHandler:'right'|'wrong';sourceActionSha256:string},trigger:HTMLButtonElement)=>void;
 onOpenGlossary?:(key:string,trigger:HTMLButtonElement)=>void;
 onCloseFeedback?:(close:{feedbackSpriteId:number;sourceGotoAndPlayFrame:number},
  trigger:HTMLButtonElement)=>void;
 onPainted?:(state:P035CanvasState)=>void;
}>(function P035VisualCompositionDraft({owner,readCurrentOwner,canvasAsset,
 language='en',nativeTextTarget,onChoose,onOpenGlossary,onCloseFeedback,onPainted},ref){
 const canvasRef=useRef<HTMLCanvasElement>(null);
 const readyRef=useRef(false),assetRef=useRef(canvasAsset),ownerRef=useRef(owner);
 const committedRef=useRef<{frame:number;feedback:Feedback}|null>(null);
 const [painted,setPainted]=useState<Painted|null>(null);
 ownerRef.current=owner;
 assetRef.current=canvasAsset;
 const commit=(frame:number,feedback:Feedback):boolean=>{
  const asset=assetRef.current,canvas=canvasRef.current;
  if(!readyRef.current||!asset||!canvas)return false;
  try{
   const state=p035PaintExact(asset,canvas,frame,feedback);
   const request={frame,feedback};
   committedRef.current=request;
   // Retire old hit targets before the caller advances its reducer snapshot.
   flushSync(()=>setPainted(null));
   try{onPainted?.(state);}catch{/* Paint is committed; observers cannot reverse it. */}
   return true;
  }catch{return false;}
 };
 useImperativeHandle(ref,()=>({
  commitMain:(frame)=>commit(frame,null),
  commitFeedback:(spriteId,localFrame)=>commit(145,{spriteId,frame:localFrame})
 }));
 useLayoutEffect(()=>{
  readyRef.current=false;committedRef.current=null;
  setPainted(null);
  let live=true;
  if(canvasAsset)canvasAsset.ready().then(()=>{
   if(!live)return;
   readyRef.current=true;
   const current=ownerRef.current;
   try{
    const gated=p035VisualGate(current),canvas=canvasRef.current;
    if(!canvas)return;
    const state=p035PaintExact(canvasAsset,canvas,current.mainFrame,current.feedback);
    committedRef.current={frame:current.mainFrame,feedback:current.feedback};
    setPainted({owner:copyOwner({...current,...gated}),frame:current.mainFrame,
     feedback:current.feedback?{...current.feedback}:null});
    try{onPainted?.(state);}catch{/* Initial paint remains committed. */}
   }catch{setPainted(null);}
  }).catch(()=>{if(live)setPainted(null);});
  return ()=>{live=false;readyRef.current=false;committedRef.current=null;};
 },[canvasAsset]);
 useLayoutEffect(()=>{
  const committed=committedRef.current;
  if(!committed||!sameFrame(committed,{frame:owner.mainFrame,feedback:owner.feedback})){
   if(painted)setPainted(null);
   return;
  }
  try{
   const gated=p035VisualGate(owner);
   setPainted({owner:copyOwner({...owner,...gated}),frame:owner.mainFrame,
    feedback:owner.feedback?{...owner.feedback}:null});
  }catch{setPainted(null);}
 },[owner]);
 const currentGate=(()=>{try{return p035VisualGate(owner);}catch{return null;}})();
 const visible=painted&&committedRef.current&&currentGate&&
  sameFrame(painted,{frame:owner.mainFrame,feedback:owner.feedback})&&
  sameFrame(committedRef.current,painted)&&sameOwner(painted.owner,{
   ...owner,...currentGate});
 const native=visible?p035NativeTextState(painted.frame,painted.feedback?{
  feedbackSpriteId:painted.feedback.spriteId,feedbackFrame:painted.feedback.frame,
  ...([80,95,126].includes(painted.feedback.spriteId)&&
   painted.owner.wrongTryCount!==undefined?{wrongTryCount:painted.owner.wrongTryCount}:{})}:{}):null;
 const nativeContent=native&&visible&&<div lang="en" data-p035-native-frame={painted.frame}
  data-p035-feedback-sprite={painted.feedback?.spriteId??'none'}
  data-p035-canvas-source-glyphs="preserved">
  <section aria-label="Original lesson text (English)" data-p035-native-companion="source-only">
   {native.prose.map(row=><p key={row.instanceId} data-source-instance-id={row.instanceId}
    data-source-text-id={row.sourceTextId} data-source-mask-instances={row.clippingMaskInstanceIds.join(',')}>{row.visibleText}</p>)}
   {native.feedbackText.map(row=><p key={row.instanceId}
    data-source-instance-id={row.instanceId} data-source-text-id={row.sourceTextId}
    data-source-mask-instances={row.clippingMaskInstanceIds.join(',')}>{row.visibleText}</p>)}
   {native.diagramLabels.length>0&&<details><summary>Source diagram labels</summary>
    {native.diagramLabels.map(row=><span key={row.instanceId}
     data-source-instance-id={row.instanceId} data-source-text-id={row.sourceTextId}
     data-source-mask-instances={row.clippingMaskInstanceIds.join(',')}>{row.visibleText}</span>)}
   </details>}
  </section>
  <P035NativeInteractionDraft owner={painted.owner}
   readCurrentOwner={()=>{
    const current=readCurrentOwner();
    if(!current)return null;
    try{
     const gated=p035VisualGate(current),visual={...current,...gated};
     return sameOwner(visual,painted.owner)?gated:null;
    }catch{return null;}
   }} language={language}
   onChoose={onChoose} onOpenGlossary={onOpenGlossary}
   onCloseFeedback={onCloseFeedback}/>
 </div>;
 return <div data-p035-visual-composition="source-only-unregistered"
  data-p035-language-policy={language==='es'?'source-en-fallback':'source-en'}
  data-p035-native-published={visible?'after-canvas-commit':'no'}>
  <canvas ref={canvasRef} width={800} height={600} aria-label="Original lesson visual (English)"/>
  {nativeTextTarget&&nativeContent?createPortal(nativeContent,nativeTextTarget):nativeContent}
 </div>;
});
