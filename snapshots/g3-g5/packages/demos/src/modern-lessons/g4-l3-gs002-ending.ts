import source from './generated/g4-l3-gs002-ending.json';

type Placement={characterId:number;depth:number;bornAt:number;instanceId:string;matrix:number[];
  ratio?:number;clipDepth?:number;colorTransform?:unknown};
type Timeline={frameCount:number;mode:string;frames:Placement[][]};
export type Gs002EndingNode=Placement&{localFrame?:number;children?:Gs002EndingNode[]};

/** Pure view state; the existing interaction clock supplies elapsed time.
 * Parent stop does not stop nested clips. No new RAF, timeout or reducer. */
export function getGs002EndingState(elapsedMs:number,reducedMotion=false){
  if(!Number.isFinite(elapsedMs)||elapsedMs<0)throw new RangeError('Ending elapsedMs must be finite and nonnegative');
  const tick=reducedMotion?185:Math.floor(elapsedMs*source.fps/1000+1e-9);
  const timelines=source.timelines as unknown as Record<number,Timeline>;
  function project(id:number,age:number):{frame:number;nodes:Gs002EndingNode[]}{
    const t=timelines[id],frame=t.mode==='hold'?Math.min(age+1,t.frameCount):age%t.frameCount+1;
    return {frame,nodes:t.frames[frame-1].map(n=>{
      const child=timelines[n.characterId];
      if(!child)return {...n};
      // Children instantiated during a looping parent are relative to that cycle;
      // held parent children continue aging after the parent's stop frame.
      const localAge=(t.mode==='hold'||t.frameCount===1?age:frame-1)-(n.bornAt-1);
      const nested=project(n.characterId,localAge);
      return {...n,localFrame:nested.frame,children:nested.nodes};
    })};
  }
  const result=project(319,tick);
  return {frameDomain:source.frameDomain,frame:result.frame,terminal:result.frame===186,nodes:result.nodes,
    sourceSwfSha256:source.sourceSwfSha256,reducedMotion};
}
