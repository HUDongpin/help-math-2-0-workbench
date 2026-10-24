"use client";
import React, {useCallback, useEffect, useRef, useState} from 'react';
import type {AnimationRendererProps} from './contract';
import {createP044State, P044_CONFIG, queryP044, reduceP044, type P044Event, type P044State} from './g678-nms-l01-p044-controller';
import {createP044NestedClock, createP044ObservedProductEntry, tickP044NestedClock, resolveP044ProductTransition, p044ProductResolution} from './g678-nms-l01-p044-product-clock';
import {p044FeedbackRequest, p044FeedbackResetRequest, p044HostMatches, type P044FeedbackRequest} from './g678-nms-l01-p044-product-host';
import {NmsL01P044CandidateView, type P044MountVisual} from './g678-nms-l01-p044-candidate-view-v2';
import {createP044LiveFrameCallback} from './g678-nms-l01-p044-live-frame-callback';
import {resolveP044CandidateFrame} from './g678-nms-l01-p044-candidate-module';

export const mountP044SourceVisual: P044MountVisual = async canvas => {
  const {createP044SourceCanvasAdapter}=await import('./generated/g678-nms-l01-p044-source-canvas-v1');
  const adapter = createP044SourceCanvasAdapter(canvas);
  await adapter.ready();
  return {render(query) {adapter.render({rootFrame: 6, mainFrame: query.mainFrame,
    instances: query.sourceContexts.map(context => ({path: context.instancePath.map(({parentDomain,depth,sourceObjectId,placementFrame}) =>
      ({parentDomain,depth,sourceObjectId,placementFrame})), frame: context.frame, visible: context.visible}))});}};
};

/** Exact-page integration under an injected modern host. No registered module
 * or global runtime change is made by this candidate. */
type P044ProductProps = AnimationRendererProps & {
  readonly onVisualReady: (ready: boolean) => void;
  readonly mountVisual?: P044MountVisual;
};
export function NmsL01P044ProductCandidate(props: P044ProductProps) {
  if(resolveP044CandidateFrame(props.frame,props).status!=='ready') return <p role="alert" data-p044-invalid-source-context="true">
    This source candidate accepts only the declared English root6/main293 timeline.</p>;
  return <P044ProductController {...props}/>;
}
function P044ProductController(props: P044ProductProps) {
  const [state, setState] = useState(() => createP044ObservedProductEntry({frame:props.frame,seed: props.seed, epoch:props.replay??0, paused: Boolean(props.paused), mode: props.reducedMotion ? 'reduced-motion' : 'natural'}));
  const current = useRef(state), latest = useRef(props);latest.current = props;
  const nested = useRef(createP044NestedClock()), feedback = useRef<P044FeedbackRequest | null>(null);
  const [message, setMessage] = useState<string | null>(null), gate = useRef<string | null>(null);
  const ready = useRef(false), glossarySawHostPause = useRef(false), mounted = useRef(true);
  const [visualLoaded,setVisualLoaded]=useState(false);
  const publish = useCallback((next: P044State) => {current.current = next;setState(next);}, []);
  const block = useCallback((reason: string) => {gate.current = reason;setMessage(reason);}, []);
  const visualReady = useCallback((value: boolean) => {
    ready.current = value;setVisualLoaded(value);latest.current.onVisualReady(value);
  }, []);
  const commit = useCallback((event: P044Event, trigger?: HTMLButtonElement): boolean => {
    if (!mounted.current || gate.current) return false;
    const before = current.current, transition = resolveP044ProductTransition(before,event,Boolean(latest.current.onInteractiveStopResolved));
    if (!transition.accepted) return false;
    const request = latest.current.onLessonHostRequest;
    if (transition.intents.some(intent => intent.kind === 'practice-feedback')) {
      const record = p044FeedbackRequest(before,transition);
      if (!record || !request || !p044HostMatches(request(record,{trigger}),record)) {
        block('The lesson host did not acknowledge the exact practice feedback. The source interaction did not advance. Replay to retry.');return false;
      }
      feedback.current = record;
    }
    if (before.phase === 'feedback' && transition.state.phase !== 'feedback') {
      const reset = p044FeedbackResetRequest(before,transition,feedback.current);
      if (!reset || !request || !p044HostMatches(request(reset),null)) {
        block('The lesson host could not close the active feedback. The source remains held. Replay to retry.');return false;
      }
      feedback.current = null;
    }
    publish(transition.state);
    for (const intent of transition.intents) if (intent.kind === 'glossary-open') {
      glossarySawHostPause.current = false;
      const decision = request?.({type:'open-glossary',entryId:intent.term},{trigger});
      const allowed = decision?.status === 'allowed' && decision.capability === 'glossary' && decision.auditOnly === true &&
        decision.state.currentAnimationId === P044_CONFIG.animationId && decision.state.storage === 'memory-only' &&
        decision.state.storesPersonalData === false && decision.state.glossaryEntryId === intent.term;
      publish(reduceP044(current.current,{type:'glossary-result',epoch:current.current.epoch,requestToken:intent.requestToken,allowed}).state);
      if (!allowed) setMessage('The exact glossary request was not acknowledged. The page has not opened a legacy link.');
    }
    const resolution = p044ProductResolution(transition);
    if (resolution) latest.current.onInteractiveStopResolved!(resolution);
    return true;
  }, [block,publish]);
  const flush = useCallback((now: number) => {
    if (!ready.current || gate.current) return;
    const tick = tickP044NestedClock(nested.current,current.current,now);
    if (!tick.event || commit(tick.event)) nested.current = tick.clock;
  }, [commit]);
  const dispatch = useCallback((event: P044Event, trigger?: HTMLButtonElement) => {
    if (!ready.current) return;
    // Accrue the actual final RAF-to-control interval before a glossary hold.
    flush(performance.now());
    commit(event,trigger);
    flush(performance.now());
  }, [commit,flush]);

  const identity = `${props.seed}:${props.replay ?? 0}:${props.uiLanguage ?? 'en'}:${Boolean(props.reducedMotion)}`;
  const identityRef = useRef(identity);
  useEffect(() => {
    if (identityRef.current === identity) return;
    identityRef.current = identity;
    if (feedback.current) {
      const request = latest.current.onLessonHostRequest;
      const decision = request?.({type:'reset-practice-feedback',interactionId:feedback.current.interactionId});
      if (!p044HostMatches(decision,null)) {block('Replay could not reset this page’s active feedback. The candidate remains held.');return;}
    }
    feedback.current = null;gate.current = null;setMessage(null);nested.current = createP044NestedClock();glossarySawHostPause.current = false;
    publish(createP044State({seed:latest.current.seed,epoch:current.current.epoch+1,paused:Boolean(latest.current.paused),mode:latest.current.reducedMotion?'reduced-motion':'natural'}));
  }, [identity,block,publish]);
  useEffect(() => {
    if (gate.current) return;
    const nextPaused = Boolean(props.paused);
    if (current.current.paused !== nextPaused) {
      flush(performance.now());
      publish(reduceP044(current.current,{type:'pause',epoch:current.current.epoch,paused:nextPaused}).state);
      flush(performance.now());
    }
    if (current.current.glossary?.status === 'open') {
      if (nextPaused) glossarySawHostPause.current = true;
      else if (glossarySawHostPause.current) {
        const before=current.current;
        publish(reduceP044(before,{type:'close-glossary',epoch:before.epoch,requestToken:before.glossary!.requestToken}).state);
        glossarySawHostPause.current = false;
      }
    }
  }, [props.paused,flush,publish]);
  useEffect(() => {
    if (!ready.current || gate.current || props.frame === current.current.mainFrame) return;
    const before = current.current;
    const event: P044Event = {type:'main-frame',epoch:before.epoch,clockToken:before.clockToken,frame:props.frame};
    if (!commit(event) && props.frame > before.mainFrame && !before.paused && !before.glossary)
      block('The lesson playhead crossed an unresolved source state. The candidate failed closed.');
  }, [props.frame,props.paused,state.epoch,visualLoaded,commit,block]);
  useEffect(() => {
    mounted.current = true;let handle=0,alive=true;
    const advance=createP044LiveFrameCallback(flush,()=>performance.now());
    const tick=(batchTimestamp:number)=>{if(!alive)return;advance(batchTimestamp);handle=requestAnimationFrame(tick);};
    handle=requestAnimationFrame(tick);
    return()=>{alive=false;mounted.current=false;cancelAnimationFrame(handle);};
  }, [flush]);
  useEffect(()=>()=>{
    const active=feedback.current;
    if(active) latest.current.onLessonHostRequest?.({type:'reset-practice-feedback',interactionId:active.interactionId});
    feedback.current=null;
  },[]);
  const replay=()=>{
    const active=feedback.current;
    if(active){
      const decision=latest.current.onLessonHostRequest?.({type:'reset-practice-feedback',interactionId:active.interactionId});
      if(!p044HostMatches(decision,null)){block('Replay could not reset this page’s active feedback. The candidate remains held.');return;}
      feedback.current=null;
    }
    latest.current.onReplay?.();
  };
  return <NmsL01P044CandidateView query={queryP044(state)} uiLanguage={props.uiLanguage === 'es' ? 'es' : 'en'}
    mountVisual={props.mountVisual ?? mountP044SourceVisual} onEvent={dispatch} onReplay={props.onReplay?replay:undefined}
    onVisualReady={visualReady} message={message} interactionBlocked={Boolean(gate.current)} companionTargetId={props.pageInteractionCompanionTargetId}/>;
}
