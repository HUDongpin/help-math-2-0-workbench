'use client';
import React,{useLayoutEffect,useRef} from 'react';
import source from './generated/g4-l3-ti002-native-inputs.json';
import{Ti002NumberLine,type Ti002NumberLineId}from'./g4-l3-ti002-number-line';
import{Ti002DecreasePicture}from'./g4-l3-ti002-decrease-picture';
export type Ti002PictureButton = 143|144|145|171|179;
const text=(id:number)=>source.texts.find(t=>t.characterId===id)!.text;
/** Controlled modern modal: source selects the picture; native dialog supplies
 * focus containment/Escape. This does not emulate source Close receiver/depth calls. */
export function Ti002PictureDialog({buttonId,circleFrame,onClose,returnFocusTo}:{buttonId:Ti002PictureButton|null;circleFrame:number;onClose:()=>void;returnFocusTo:HTMLElement|null}){
 const ref=useRef<HTMLDialogElement>(null),returnTarget=useRef<HTMLElement|null>(null);
 const selection=buttonId===null?undefined:source.pictureEntrypoints.find(p=>p.sourceButtonId===buttonId);
 if(buttonId!==null&&!selection)throw new Error('Unknown TI002 picture source button');
 useLayoutEffect(()=>{
  const dialog=ref.current!;
  if(selection)returnTarget.current=returnFocusTo;
  if(selection&&!dialog.open)dialog.showModal();
  if(!selection&&dialog.open){dialog.close();const target=returnTarget.current;returnTarget.current=null;if(target?.isConnected)target.focus({preventScroll:true});}
 },[buttonId,returnFocusTo]);
 useLayoutEffect(()=>()=>{ref.current?.close();},[]);
 return <dialog ref={ref} aria-label={text(63)} data-ti002-picture-dialog={selection?.targetName??'closed'} onCancel={event=>{event.preventDefault();onClose();}} style={{boxSizing:'border-box',width:'min(56rem,calc(100vw - 2rem))',maxWidth:'calc(100vw - 2rem)',maxHeight:'calc(100dvh - 2rem)',overflow:'auto',border:'2px solid #526f86',borderRadius:'1rem',padding:'1rem',color:'#16364a'}}>
  {selection&&<>
   <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1rem',flexWrap:'wrap',marginBottom:'1rem'}}>
    <h2 data-lesson-text-block="text-63" style={{fontSize:'1.5rem',margin:0}}>{text(63)}</h2>
    <button data-lesson-text-block="picture-close" autoFocus type="button" onClick={onClose} style={{font:'inherit',fontSize:'1.125rem',minHeight:44,minWidth:44,padding:'.5rem 1rem'}}>{text(148)}</button>
   </div>
   {selection.timelineId==='sprite-175'?<Ti002DecreasePicture frame={circleFrame}/>:<Ti002NumberLine scope="popup" diagram={selection.timelineId as Ti002NumberLineId}/>}
  </>}
 </dialog>;
}
