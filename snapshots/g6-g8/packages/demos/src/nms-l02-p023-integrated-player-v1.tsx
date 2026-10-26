'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {NmsL2P023Player,type P023PlayerProps} from './nms-l02-p023-player-v1';
import {getNmsL2P023FrameState} from './nms-l02-p023-timeline-v1';
import {createP023TermHost,P023_TERM_ENTRIES,p023SourceTerm} from './nms-l02-p023-term-host-v1';
import {NmsL2P023TermDialog} from './nms-l02-p023-term-dialog-v1';

/** Minimal page-authored support host inside the modern lesson runtime adapter.
 * The outer My Lesson controls still own navigation, volume and explicit Resume. */
export function NmsL2P023IntegratedPlayer(props:Omit<P023PlayerProps,'termEntries'|'onLessonHostRequest'>) {
  const latest=useRef(props);latest.current=props;
  const host=useMemo(createP023TermHost,[props.seed]);
  const frame=useRef(1),replay=useRef(0),selected=useRef<string|null>(null);
  const [selection,setSelection]=useState<{id:string;trigger:HTMLElement|null}|null>(null);
  useEffect(()=>{selected.current=null;setSelection(null);frame.current=1;replay.current=0;},[host]);
  const currentState=()=>getNmsL2P023FrameState(frame.current,{seed:latest.current.seed,lang:latest.current.uiLanguage,replay:replay.current});
  const close=()=>{host.dispatch({type:'close-keyterm'},currentState());selected.current=null;setSelection(null);};
  const term=selection?p023SourceTerm(selection.id):undefined;
  return <>
    <NmsL2P023Player {...props} canResume={()=>selected.current===null} termEntries={P023_TERM_ENTRIES}
      onLessonHostRequest={(request,context)=>{
        const decision=host.dispatch(request,currentState());
        if(decision.status==='allowed'&&request.type==='open-keyterm'){selected.current=request.entryId;setSelection({id:request.entryId,trigger:context?.trigger??null});}
        return decision;
      }}
      onState={state=>{frame.current=state.frame;replay.current=state.replay;latest.current.onState?.(state);}}
      onReplay={()=>{close();latest.current.onReplay?.();}}/>
    {term&&selection&&<NmsL2P023TermDialog term={term} language={props.uiLanguage} trigger={selection.trigger} onClose={close}/>}
  </>;
}
