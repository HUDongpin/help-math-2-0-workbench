/** One semantic destination per authored target, not a frame-by-frame scroll. */
export function getFocusPlan(nativeState,replay=0){
 if(!nativeState.axisLabels.length)return null;
 const target=nativeState.signedFlash?.value??nativeState.arrow?.to??12;
 // Source digit/minus pair transfers to the current jump only at these authored states.
 const labelTransfers=[286,296,306,316,389,435,489];
 const includeMovingLabel=Boolean(nativeState.arrow&&nativeState.frame>=labelTransfers[nativeState.arrow.jumpCount-1]);
 return {target,key:`replay:${replay}:target:${target}:current-label:${includeMovingLabel}`,includeMovingLabel};
}
/** Rectangles are full numeric ink bounds relative to the local viewport client area. */
export function nearestScroll({current,maxScroll,viewportWidth,margin,rects}){
 if(!rects.length||!Number.isFinite(viewportWidth)||viewportWidth<=margin*2)return{left:current,status:'not-measurable'};
 const left=Math.min(...rects.map(r=>r.left)),right=Math.max(...rects.map(r=>r.right));
 if(right-left>viewportWidth-margin*2)return{left:current,status:'ink-span-too-wide'};
 let delta=0;
 if(left<margin)delta=left-margin;
 else if(right>viewportWidth-margin)delta=right-(viewportWidth-margin);
 const next=Math.max(0,Math.min(maxScroll,current+delta));
 const satisfied=left-(next-current)>=margin-0.01&&right-(next-current)<=viewportWidth-margin+0.01;
 return{left:next,status:satisfied?(next===current?'already-visible':'scroll-nearest'):'extent-limited'};
}
/** Stable phase renders and manual scroll events are deliberately not triggers. */
export function shouldApplyFocus(previousKey,nextKey,reason='semantic'){
 if(nextKey===null)return false;
 if(reason==='resize'||reason==='fonts')return true;
 return previousKey!==nextKey;
}
