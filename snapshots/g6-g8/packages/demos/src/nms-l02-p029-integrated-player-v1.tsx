'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {NmsL2P029Player,type P029PlayerProps} from './nms-l02-p029-player-v1';
import {getNmsL2P029FrameState} from './nms-l02-p029-timeline-v1';
import {createP029TermHost,p029SourceTerm} from './nms-l02-p029-term-host-v1';
import {NmsL2P029TermDialog} from './nms-l02-p029-term-dialog-v1';

/** Minimal page-authored support host inside the modern lesson runtime adapter.
 * The outer My Lesson controls still own navigation, volume and explicit Resume. */
export function NmsL2P029IntegratedPlayer(props:Omit<P029PlayerProps,'onLessonHostRequest'>) {
  const latest=useRef(props);latest.current=props;
  const host=useMemo(createP029TermHost,[props.seed]);
  const frame=useRef(1),replay=useRef(0);
  const [selection,setSelection]=useState<{id:string;trigger:HTMLElement|null}|null>(null);
  useEffect(()=>{setSelection(null);frame.current=1;replay.current=0;},[host]);
  const currentState=()=>getNmsL2P029FrameState(frame.current,{seed:latest.current.seed,lang:latest.current.uiLanguage,replay:replay.current});
  const close=()=>{host.dispatch({type:'close-keyterm'},currentState());setSelection(null);};
  const term=selection?p029SourceTerm(selection.id):undefined;
  return <>
    <NmsL2P029Player {...props}
      onLessonHostRequest={(request,context)=>{
        const decision=host.dispatch(request,currentState());
        if(decision.status==='allowed'&&request.type==='open-keyterm')setSelection({id:request.entryId,trigger:context?.trigger??null});
        return decision;
      }}
      onState={state=>{frame.current=state.frame;replay.current=state.replay;latest.current.onState?.(state);}}
      onReplay={()=>{close();latest.current.onReplay?.();}}/>
    {term&&selection&&<NmsL2P029TermDialog term={term} language={props.uiLanguage} trigger={selection.trigger} onClose={close}/>}
  </>;
}
