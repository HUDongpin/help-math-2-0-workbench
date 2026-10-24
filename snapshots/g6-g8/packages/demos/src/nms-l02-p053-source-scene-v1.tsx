import React, {useId} from 'react';
import {P053_DISPLAY_DATA as DATA, P053_DISPLAY_SCENE as SCENE}
  from './generated/nms-l02-p053-display-data-v1';
import {namespaceP053ShapeArt} from './generated/nms-l02-p053-shape-art-v1';
import {p053DomainSnapshot, p053NestedSnapshot, type P053Matrix, type P053Color,
  type P053NestedSnapshot, type P053NestedInstance} from './nms-l02-p053-display-state-v1';

type TextDefinition = typeof DATA.definitions.texts[number];
type ButtonFrame = 1 | 2 | 3;
export type P053SceneOptions = Readonly<{
  frame: number;
  mode?: 'playback' | 'structural';
  /** Explicit maintained control state. Missing entries use reviewed stop(1). */
  buttonFrames?: Readonly<Partial<Record<'mcRepeat' | 'mcL1' | 'mcL2' | 'mcStart' | 'mcSkip', ButtonFrame>>>;
  levelMessageVisible?: boolean;
  popupVisible?: boolean;
}>;
const textById = new Map<number, TextDefinition>(DATA.definitions.texts.map(text => [text.characterId, text]));
const buttonById = new Map(DATA.definitions.buttons.map(button => [Number(button.characterId), button]));
const pixelMatrix = ([a,b,c,d,x,y]: P053Matrix) => `matrix(${a} ${b} ${c} ${d} ${x/20} ${y/20})`;
const identityColor = (c:P053Color) => c.multiply.every(n=>n===256)&&c.add.every(n=>n===0);

/** Explicit local clocks follow the reviewed stop(1) scripts and single-frame
 * child domains. This is a deterministic modern projection, not a Flash trace. */
export function p053ReviewedScene(options:P053SceneOptions):P053NestedSnapshot {
  const mode=options.mode??'playback';
  const main=p053DomainSnapshot(SCENE,'sprite-187',options.frame,{mode});
  const clocks:Record<string,number>={};
  const walk=(domainId:string,frame:number,parentPath:string)=>{
    const snapshot=p053DomainSnapshot(SCENE,domainId,frame,{mode});
    for(const instance of snapshot.instances){
      if(!instance.childDomain)continue;
      const instancePath=parentPath?`${parentPath}>${instance.instanceId}`:instance.instanceId;
      const named=instance.name?.text as keyof NonNullable<P053SceneOptions['buttonFrames']> | undefined;
      let childFrame:number;
      if(instance.childDomain==='sprite-187')childFrame=main.frame;
      else if(DATA.reviewedFrameActions.oneFrameChildren.some(id=>id===instance.childDomain))childFrame=1;
      else if(Object.hasOwn(DATA.reviewedFrameActions.stoppedChildFrames,instance.childDomain)){
        childFrame=(named?options.buttonFrames?.[named]:undefined)??1;
        if(![1,2,3].includes(childFrame))throw Error('P053_BUTTON_FRAME');
      }else throw Error(`P053_CHILD_CLOCK_UNREVIEWED:${instance.childDomain}`);
      clocks[instancePath]=childFrame;walk(instance.childDomain,childFrame,instancePath);
    }
  };
  walk('root',6,'');
  return p053NestedSnapshot(SCENE,'root',6,clocks,{mode});
}

function SourceText({definition}:{definition:TextDefinition}){
  // Source field111 has no initial text or established dynamic value.
  if(definition.kind==='dynamic-field')return null;
  let x=0,y=0;
  return <g data-p053-text-id={definition.characterId}
    transform={pixelMatrix(definition.textMatrix as P053Matrix)}>
    {definition.runs.map((run,index)=>{
      if(run.xOffsetTwips!==null)x=run.xOffsetTwips;
      if(run.yOffsetTwips!==null)y=run.yOffsetTwips;
      const at=x/20,baseline=y/20,width=run.advanceTwips.reduce((sum,n)=>sum+n,0)/20;
      x+=width*20;
      const [r,g,b,a]=run.colorRgba;
      return <text key={index} x={at} y={baseline} fontSize={run.fontHeightTwips/20}
        fill={`rgb(${r} ${g} ${b})`} fillOpacity={a/255}
        fontFamily="Arial, sans-serif" textLength={width||undefined}
        lengthAdjust="spacingAndGlyphs" xmlSpace="preserve">{run.text}</text>;
    })}
  </g>;
}

/** Maintained source scene. Source shapes retain their coordinates; text is
 * native SVG text. It deliberately exposes no navigation or completion API. */
export function P053SourceScene(options:P053SceneOptions){
  const reactId=useId();const namespace=`p053-${reactId.replace(/[^A-Za-z0-9_-]/gu,'')}`;
  const art=namespaceP053ShapeArt(namespace),scene=p053ReviewedScene(options);
  let sequence=0;
  const color=(c:P053Color,child:React.ReactNode)=>{
    if(identityColor(c))return child;
    if(c.multiply.slice(0,3).every(n=>n===256)&&c.add.every(n=>n===0))
      return <g opacity={c.multiply[3]/256}>{child}</g>;
    const id=`${namespace}-color-${sequence++}`;
    return <><defs><filter id={id} colorInterpolationFilters="sRGB" x="-25%" y="-25%" width="150%" height="150%">
      <feComponentTransfer>{(['R','G','B','A'] as const).map((channel,i)=>{
        const props={key:channel,type:'linear' as const,slope:c.multiply[i]!/256,intercept:c.add[i]!/255};
        return channel==='R'?<feFuncR {...props}/>:channel==='G'?<feFuncG {...props}/>:channel==='B'?<feFuncB {...props}/>:<feFuncA {...props}/>;
      })}</feComponentTransfer></filter></defs><g filter={`url(#${id})`}>{child}</g></>;
  };
  const leaf=(characterId:number):React.ReactNode=>{
    const text=textById.get(characterId);if(text)return <SourceText definition={text}/>;
    const shape=art.symbolIds[characterId];if(shape)return <use href={`#${shape}`}/>;
    const button=buttonById.get(characterId);
    if(button)return <g data-p053-button-static-state="up">{button.statePlacements.filter(p=>p.states.up)
      .sort((a,b)=>a.depth-b.depth).map(p=><g key={p.instanceId} transform={pixelMatrix(p.matrix)}>
        {color(p.colorTransform,leaf(p.characterId))}</g>)}</g>;
    throw Error(`P053_UNSUPPORTED_LEAF:${characterId}`);
  };
  const domain=(snapshot:P053NestedSnapshot):React.ReactNode=>{
    const maskIds=new Map(snapshot.instances.filter(p=>p.clipDepth!==null)
      .map(p=>[p.instanceId,`${namespace}-mask-${sequence++}`]));
    const visible=(p:P053NestedInstance)=>{
      if(p.name?.text==='Mc_Msg'&&!options.levelMessageVisible)return false;
      if(p.name?.text==='Mc_Popup'&&!options.popupVisible)return false;
      return true;
    };
    return <g data-p053-domain={snapshot.domainId} data-p053-local-frame={snapshot.frame}>
      <defs>{snapshot.instances.filter(p=>p.clipDepth!==null).map(p=>{
        if(p.definitionKind!=='shape')throw Error('P053_UNREVIEWED_MASK_GEOMETRY');
        return <clipPath key={p.instanceId} id={maskIds.get(p.instanceId)} clipPathUnits="userSpaceOnUse">
          <g transform={pixelMatrix(p.matrix)}>{leaf(p.characterId)}</g>
        </clipPath>;
      })}</defs>
      {snapshot.instances.filter(p=>p.clipDepth===null&&visible(p)).map(p=>{
        let body:React.ReactNode=<g data-p053-instance={p.instanceId} data-p053-character={p.characterId}
          transform={pixelMatrix(p.matrix)}>{color(p.colorTransform,p.child?domain(p.child):leaf(p.characterId))}</g>;
        for(const mask of p.sourceMaskInstanceIds){
          const id=maskIds.get(mask);if(!id)throw Error(`P053_MISSING_LOCAL_MASK:${mask}`);
          body=<g clipPath={`url(#${id})`}>{body}</g>;
        }
        return <React.Fragment key={p.instanceId}>{body}</React.Fragment>;
      })}
    </g>;
  };
  return <svg viewBox="0 0 800 600" width="100%" role="img"
    aria-label="Fractions, decimals, and percents match game directions"
    data-p053-source-scene="native-text-and-source-vectors" data-p053-requested-frame={options.frame}
    data-p053-frame={Math.min(options.frame,options.mode==='structural'?694:693)}
    style={{display:'block',overflow:'hidden',background:'#fff'}}>
    <title>Fractions, decimals, and percents match game directions</title>
    <g dangerouslySetInnerHTML={{__html:art.defsSvg}}/>
    {domain(scene)}
  </svg>;
}
