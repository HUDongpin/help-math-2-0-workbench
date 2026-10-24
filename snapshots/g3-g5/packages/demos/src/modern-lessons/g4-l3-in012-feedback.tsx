'use client';
import React, {useId, useRef, useEffect} from 'react';
import type {TextPresentationSnapshot} from '../lesson-text-contract';
import type {Ref} from 'react';
import source from './generated/g4-l3-in012-native-inputs.json';
import {In012ShapePaints, type In012PaintShape} from './g4-l3-in012-paints';
import type {CourseG04L03In012OwingDragState as State} from '../timelines/course-g04-l03-in-012-owing-drag-interaction';
const expected = {
  221: '7c4f434d9d707f796d6114d0d2275481f80471685da4c91808c8f043b5c7bf37',
  224: '4e758c20e6a7db463bf1fe6f0ca49312cb06d67866b7564b863e48389615ad95',
};
const backgrounds = new Map([221,224].map(id => {
  const shape = source.paints.staticShapes.find(s => s.characterId === id)!;
  if (shape.sourceTagSha256 !== expected[id as 221 | 224]) throw new Error('IN012 feedback art source mismatch');
  return [id,shape];
}));

/** Source popup art with reflowable native text; never selects an unproven reward. */
export function In012Feedback({state, paused, closeRef, onClose, snapshot, onPress, onRelease}: {
  onPress?: (token:string)=>boolean; onRelease?: (token:string)=>boolean;
  state: State; paused: boolean; snapshot?: TextPresentationSnapshot; closeRef?: Ref<HTMLButtonElement>; onClose: () => void;
}) {
  const prefix = `in012feedback-${useId().replace(/[^a-zA-Z0-9_-]/g,'')}`;
  const wrong = state.outcome === 'wrong';
  const final = state.outcome === 'final-correct-feedback';
  const sequence=useRef(0), press=useRef<{token:string;release:typeof onRelease;key:string}|null>(null);
  const release=()=>{const active=press.current;if(active){press.current=null;active.release?.(active.token);}};
  const begin=(key:string)=>{if(paused||!wrong||press.current)return false;const token=`${prefix}-${++sequence.current}`;if(!onPress?.(token))return false;press.current={token,release:onRelease,key};return true;};
  useEffect(()=>{if(paused||!wrong)release();return()=>release();},[paused,wrong]);
  useEffect(()=>{const blur=()=>release();window.addEventListener('blur',blur);return()=>{window.removeEventListener('blur',blur);release();};},[]);
  if (!wrong && !final) return <div className="in012-status" role="status" aria-live="polite" data-in012-ui-text={state.outcome==='correct-feedback'?'correct-acknowledgement':undefined}>{state.feedback}</div>;
  const shape = backgrounds.get(wrong ? 221 : 224)!;
  const b = shape.boundsTwips;
  return <div role={wrong ? 'alert' : 'status'} data-in012-feedback-art={shape.characterId}
    style={{position:'relative',padding:'1.25rem',color:wrong?'#16364a':'#fff',isolation:'isolate'}}>
    <svg aria-hidden="true" focusable="false" viewBox={`${b.left} ${b.top} ${b.right-b.left} ${b.bottom-b.top}`} preserveAspectRatio="none"
      style={{position:'absolute',inset:0,width:'100%',height:'100%',zIndex:-1}}>
      <In012ShapePaints shape={shape as unknown as In012PaintShape} idPrefix={prefix}/>
    </svg>
    <p data-lesson-text-block={wrong?'wrong-feedback':'final-feedback'}>{snapshot?.blocks.find(b=>b.id===(wrong?'wrong-feedback':'final-feedback'))?.text ?? state.feedback}</p>
    {wrong && <button ref={closeRef} data-lesson-text-block="wrong-close" className="in012-close" type="button" disabled={paused} style={{marginTop:'.75rem'}} onPointerDown={e=>{if(e.button!==0)return;if(begin(`pointer-${e.pointerId}`))e.currentTarget.setPointerCapture(e.pointerId);}}
      onPointerUp={e=>{if(press.current?.key===`pointer-${e.pointerId}`)release();}} onPointerCancel={e=>{if(press.current?.key===`pointer-${e.pointerId}`)release();}} onLostPointerCapture={e=>{if(press.current?.key===`pointer-${e.pointerId}`)release();}} onBlur={()=>{if(press.current?.key.startsWith('key-'))release();}}
      onKeyDown={e=>{if((e.key==='Enter'||e.key===' ')&&!e.repeat)begin(`key-${e.key}`);}}
      onKeyUp={e=>{if(press.current?.key===`key-${e.key}`)release();}}
      onClick={()=>{release();onClose();}}>Close</button>}
  </div>;
}
