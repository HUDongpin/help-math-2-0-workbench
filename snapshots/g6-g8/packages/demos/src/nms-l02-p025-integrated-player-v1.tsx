'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {NmsL2P025Player,type P025PlayerProps} from './nms-l02-p025-player-v1';
import {getNmsL2P025FrameState} from './nms-l02-p025-timeline-v1';
import {createP025TermHost,P025_TERM_ENTRIES,p025SourceTerm} from './nms-l02-p025-term-host-v1';
import {NmsL2P025TermDialog} from './nms-l02-p025-term-dialog-v1';

/** Minimal page-authored support host inside the modern lesson runtime adapter.
 * The outer My Lesson controls still own navigation, volume and explicit Resume. */
export function NmsL2P025IntegratedPlayer(props:Omit<P025PlayerProps,'termEntries'|'onLessonHostRequest'>) {
  const latest=useRef(props);latest.current=props;
  const host=useMemo(createP025TermHost,[props.seed]);
  const frame=useRef(1),replay=useRef(0),selected=useRef<string|null>(null);
  const [selection,setSelection]=useState<{id:string;trigger:HTMLElement|null}|null>(null);
  useEffect(()=>{selected.current=null;setSelection(null);frame.current=1;replay.current=0;},[host]);
  const currentState=()=>getNmsL2P025FrameState(frame.current,{seed:latest.current.seed,lang:latest.current.uiLanguage,replay:replay.current});
  const close=()=>{host.dispatch({type:'close-keyterm'},currentState());selected.current=null;setSelection(null);};
  const term=selection?p025SourceTerm(selection.id):undefined;
  return <>
    <NmsL2P025Player {...props} canResume={()=>selected.current===null} termEntries={P025_TERM_ENTRIES}
      onLessonHostRequest={(request,context)=>{
        const decision=host.dispatch(request,currentState());
        if(decision.status==='allowed'&&request.type==='open-keyterm'){selected.current=request.entryId;setSelection({id:request.entryId,trigger:context?.trigger??null});}
        return decision;
      }}
      onState={state=>{frame.current=state.frame;replay.current=state.replay;latest.current.onState?.(state);}}
      onReplay={()=>{close();latest.current.onReplay?.();}}/>
    {term&&selection&&<NmsL2P025TermDialog term={term} language={props.uiLanguage} trigger={selection.trigger} onClose={close}/>}
  </>;
}
