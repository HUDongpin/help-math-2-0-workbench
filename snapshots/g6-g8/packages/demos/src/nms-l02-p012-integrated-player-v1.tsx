'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {NmsL2P012Player,type P012PlayerProps} from './nms-l02-p012-player-v1';
import {getNmsL2P012FrameState} from './nms-l02-p012-timeline-v1';
import {createP012TermHost,P012_TERM_ENTRIES,p012SourceTerm} from './nms-l02-p012-term-host-v1';
import {NmsL2P012TermDialog} from './nms-l02-p012-term-dialog-v1';

/** Minimal page-authored support host inside the modern lesson runtime adapter.
 * The outer My Lesson controls still own navigation, volume and explicit Resume. */
export function NmsL2P012IntegratedPlayer(props:Omit<P012PlayerProps,'termEntries'|'onLessonHostRequest'>) {
  const latest=useRef(props);latest.current=props;
  const host=useMemo(createP012TermHost,[props.seed]);
  const frame=useRef(1),replay=useRef(0);
  const [selection,setSelection]=useState<{id:string;trigger:HTMLElement|null}|null>(null);
  useEffect(()=>{setSelection(null);frame.current=1;replay.current=0;},[host]);
  const currentState=()=>getNmsL2P012FrameState(frame.current,{seed:latest.current.seed,lang:latest.current.uiLanguage,replay:replay.current});
  const close=()=>{host.dispatch({type:'close-keyterm'},currentState());setSelection(null);};
  const term=selection?p012SourceTerm(selection.id):undefined;
  return <>
    <NmsL2P012Player {...props} termEntries={P012_TERM_ENTRIES}
      onLessonHostRequest={(request,context)=>{
        const decision=host.dispatch(request,currentState());
        if(decision.status==='allowed'&&request.type==='open-keyterm')setSelection({id:request.entryId,trigger:context?.trigger??null});
        return decision;
      }}
      onState={state=>{frame.current=state.frame;replay.current=state.replay;latest.current.onState?.(state);}}
      onReplay={()=>{close();latest.current.onReplay?.();}}/>
    {term&&selection&&<NmsL2P012TermDialog term={term} language={props.uiLanguage} trigger={selection.trigger} onClose={close}/>}
  </>;
}
