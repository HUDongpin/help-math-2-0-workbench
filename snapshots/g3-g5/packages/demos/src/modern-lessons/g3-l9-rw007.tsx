'use client';
import React,{useEffect,useState,type ReactNode} from 'react';
import type {AnimationRendererProps,RuntimeContext} from '../contract';
import type {LessonTextPresentationCapability,TextPresentationSnapshot} from '../lesson-text-contract';
import {LessonCanvasPlane,type LessonCanvasPlaneAdapter} from '../lesson-canvas-plane';
import {isCompleteTraceCaptureIdentity,type SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {getCourseG03L09Rw007FrameState} from '../modules/course-g03-l09-rw-007';
import {RW007} from './g3-l9-rw007-config';
import {getRw007Snapshot,RW007_BINDING,rw007TermRequest} from './g3-l9-rw007-state';
import {loadRw007Scene} from './g3-l9-rw007-loader';
import {RW007_SOURCE_MAIN_AUDIO} from './generated/g3-l9-rw007-source-main-audio-v1';
const STAGE=Object.freeze({width:800,height:600});
const CSS=`.rw007-native{font-family:var(--lesson-text-font-body,system-ui,sans-serif);color:#14213d;display:grid;gap:1rem;min-inline-size:0;max-inline-size:65rem;margin-inline:auto}
.rw007-native figure{margin:0;min-inline-size:0;inline-size:100%;max-inline-size:800px;justify-self:center}.rw007-native__question{padding:1rem;border:1px solid #cbd7e5;border-radius:.75rem;background:#fff;min-inline-size:0}
.rw007-native h2{margin:0 0 .5rem;font-family:var(--lesson-text-font-heading,system-ui,sans-serif);font-size:1.375rem;line-height:1.4}
.rw007-native p{margin:0;font-size:1.25rem;line-height:1.65;overflow-wrap:anywhere}
.rw007-native button{appearance:none;border:0;border-radius:.25rem;padding:.125rem .2rem;min-inline-size:44px;min-block-size:44px;max-inline-size:100%;font:inherit;line-height:inherit;overflow-wrap:anywhere;color:#174fa5;background:transparent;cursor:pointer;text-align:start;text-decoration:underline;text-underline-offset:.15em}
.rw007-native button:focus-visible{outline:3px solid #155ac1;outline-offset:2px}`;

/** Normal document flow keeps native text outside a fixed-size clipping plane.
 * The original empty yellow backdrop is intentionally retained for review. */
export function Rw007NativeSurface({snapshot,figure,onLessonHostRequest}:{readonly snapshot:TextPresentationSnapshot;
  readonly figure:ReactNode;readonly onLessonHostRequest?:AnimationRendererProps['onLessonHostRequest']}) {
  if(snapshot.status!=='ready')return null;
  const visible=snapshot.blocks.filter(b=>b.visible);
  const heading=visible.find(b=>b.id==='heading'),words=visible.filter(b=>b.id!=='heading');
  return <div className="lesson-text-presentation rw007-native" data-native-rw007-question="true" data-native-frame={snapshot.identity.frame}>
    <style>{CSS}</style><figure>{figure}</figure>
    {heading?<section className="rw007-native__question" aria-labelledby="rw007-question-heading">
      <h2 id="rw007-question-heading" data-lesson-text-block="heading">{heading.text}</h2>
      {words.length?<p>{words.map((block,index)=>{
        const segment=RW007.segments.find(s=>s.id===block.id)!;
        const request=rw007TermRequest(block.id,snapshot);
        return <React.Fragment key={block.id}>{index>0?' ':null}<span data-lesson-text-block={block.id}>
          {request && 'term' in segment && onLessonHostRequest?<><button type="button" data-source-button-id={segment.term.sourceButtonId}
            data-keyterm-entry-id={request.entryId} onClick={event=>onLessonHostRequest(request,{trigger:event.currentTarget})}>
              {segment.term.label}</button>{segment.term.suffix}</>:block.text}
        </span></React.Fragment>;
      })}</p>:null}
    </section>:null}
  </div>;
}

function Renderer(props:AnimationRendererProps) {
  const context:RuntimeContext={...props,frameDomain:props.frameDomain??RW007.domain,rootFrame:props.rootFrame??6};
  const state=(props.state===undefined?getCourseG03L09Rw007FrameState(props.frame,context):props.state) as SourceStaticCanvasFrameState;
  const snapshot=getRw007Snapshot(state,context);
  const [adapter,setAdapter]=useState<LessonCanvasPlaneAdapter|null>(null),[failed,setFailed]=useState(false);
  useEffect(()=>{
    if(snapshot.status!=='ready')return;
    let cancelled=false;
    void loadRw007Scene().then(value=>{if(!cancelled)setAdapter(value);}).catch(()=>{if(!cancelled)setFailed(true);});
    return()=>{cancelled=true;};
  },[snapshot.status]);
  return <section lang="en" data-modern-lesson="g3-l9-rw007" data-presentation-status={snapshot.status==='ready'?'candidate':'blocked'}
    data-source-swf-sha256={RW007.sourceSwfSha256} data-flash-frame={snapshot.identity.frame} data-flash-frame-domain={snapshot.identity.frameDomain}
    data-flash-root-frame={snapshot.identity.rootFrame} data-flash-seed={snapshot.identity.seed} data-replay={snapshot.identity.replay}
    data-language-policy={props.uiLanguage==='es'?'source-fallback':'source'} data-spanish-translation="false" data-original-runtime-accepted="false"
    data-owner-accepted="false" data-strict-migration-complete="false">
    {snapshot.status!=='ready'?null:failed?<p role="status">The lesson figure could not load.</p>:adapter?
      <LessonCanvasPlane adapter={adapter} nativeStage={STAGE} request={context} snapshot={snapshot} renderKey={JSON.stringify(snapshot.identity)}
        figureLabel="Animated source scene" sourceBitmapBound={true}>
        {(committed,figure)=><Rw007NativeSurface snapshot={committed} figure={figure}
          onLessonHostRequest={isCompleteTraceCaptureIdentity(context)?undefined:props.onLessonHostRequest}/>}
      </LessonCanvasPlane>:<p role="status">Loading lesson figure…</p>}
  </section>;
}

export const G3_L9_RW007_TEXT_PRESENTATION=Object.freeze({schemaVersion:1,binding:RW007_BINDING,Renderer,getSnapshot:getRw007Snapshot,
  keyTerms:RW007.keyTerms,reducedMotionFrameByDomain:Object.freeze({'sprite-77':384}),playbackEndFrameByDomain:Object.freeze({'sprite-77':384}),
  prepare:async()=>{await loadRw007Scene();},
  sourceTimelineAudioCues:Object.freeze([RW007_SOURCE_MAIN_AUDIO]),
  // Source frame384/59.592ms tail and stream seek semantics remain unaccepted.
  // Requires the exact generated PCM map binding before product calibration.
} satisfies LessonTextPresentationCapability<SourceStaticCanvasFrameState>);
