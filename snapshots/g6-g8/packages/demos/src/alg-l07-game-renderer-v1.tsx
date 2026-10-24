'use client';
import type {ReactNode} from 'react';
import type {AnimationRendererProps} from './contract';
import {algL07P051Frame,algL07P052Frame} from './alg-l07-game-frame-v1';
import {AlgL07P051Presentation} from './alg-l07-p051-presentation-v1';
import {AlgL07P052Presentation} from './alg-l07-p052-presentation-v1';
const imageUrl=(id:77|222)=>`/flash-assets/g678-local/shared-alg001-l07-p052/bitmap-${id}.png?sha256=${id===77?'6b8431cf8625817c59bb9e1f1c70f3697a3f8bc652af6919234e118acaf19f27':'f3001608e04db6ba03b04c8da9b463e16ddc26d8e62396f56bdaeca4e9fa01a4'}`;
function Projection({view,children}:{view:ReturnType<typeof algL07P051Frame>|ReturnType<typeof algL07P052Frame>;children:ReactNode}){return <section data-animation-id={view.animationId} data-flash-frame={view.frame} data-flash-frame-domain={view.frameDomain} data-flash-root-frame={view.rootFrame} data-flash-trace-id={view.traceId??''} data-flash-requirement-id={view.requirementId??''} data-flash-entry-state-sha256={view.entryStateSha256??''} data-source-structural-only={view.structuralOnly} data-lesson-presentation="modern-text-v1">{view.ready?children:<div aria-hidden="true"/>}</section>;}
/** Deterministic inspection projection; the My Lesson adapter owns live input/audio. */
export function AlgL07P051Renderer(props:AnimationRendererProps){const v=algL07P051Frame(props.frame,{...props,frame:props.frame});return <Projection view={v}><AlgL07P051Presentation state={v.state}/></Projection>;}
export function AlgL07P052Renderer(props:AnimationRendererProps){const v=algL07P052Frame(props.frame,{...props,frame:props.frame});return <Projection view={v}><AlgL07P052Presentation state={v.state} imageUrl={imageUrl}/></Projection>;}
