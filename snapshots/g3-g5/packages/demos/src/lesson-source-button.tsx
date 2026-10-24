'use client';
import React,{useEffect,useId,useRef,type ComponentPropsWithRef}from'react';
import type{AnimationRendererProps}from'./contract';
/** Native pointer and keyboard down/up lifecycles for a source button child.
 * Click still performs the page action; it never synthesizes a five-frame press. */
export function LessonSourceButton({runtime,activityId,...props}:ComponentPropsWithRef<'button'>&{
  runtime:Pick<AnimationRendererProps,'frame'|'replay'|'onLessonButtonActivityRequest'>;activityId:string;
}){
 const key=useId(),counter=useRef(0),pointer=useRef<number|null>(null),press=useRef<string|null>(null),latest=useRef({runtime,activityId});latest.current={runtime,activityId};
 const start=()=>{
  if(props.disabled||press.current)return;
  const token=`${key}:${runtime.replay??0}:${++counter.current}`;
  if(runtime.onLessonButtonActivityRequest?.({id:activityId,parentFrame:runtime.frame,phase:'press',token}))press.current=token;
 };
 const release=()=>{
  const token=press.current;if(!token)return;press.current=null;
  const value=latest.current;value.runtime.onLessonButtonActivityRequest?.({id:value.activityId,parentFrame:value.runtime.frame,phase:'release',token});
 };
 useEffect(()=>{const up=()=>{pointer.current=null;release();};window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);window.addEventListener('blur',up);return()=>{window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);window.removeEventListener('blur',up);release();};},[]);
 return<button {...props}
  onPointerDown={event=>{props.onPointerDown?.(event);if(event.defaultPrevented||event.button!==0)return;pointer.current=event.pointerId;start();}}
  onPointerUp={event=>{release();props.onPointerUp?.(event);}}
  onPointerCancel={event=>{pointer.current=null;release();props.onPointerCancel?.(event);}}
  onPointerLeave={event=>{release();props.onPointerLeave?.(event);}}
  onPointerEnter={event=>{props.onPointerEnter?.(event);if(pointer.current===event.pointerId&&(event.buttons&1))start();}}
  onLostPointerCapture={event=>{release();props.onLostPointerCapture?.(event);}}
  onKeyDown={event=>{props.onKeyDown?.(event);if(!event.defaultPrevented&&!event.repeat&&(event.key==='Enter'||event.key===' '))start();}}
  onKeyUp={event=>{if(event.key==='Enter'||event.key===' ')release();props.onKeyUp?.(event);}}
  onBlur={event=>{if(pointer.current===null)release();props.onBlur?.(event);}}/>;
}
