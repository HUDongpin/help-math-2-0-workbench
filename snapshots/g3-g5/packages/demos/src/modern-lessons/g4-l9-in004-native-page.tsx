'use client';
import React from 'react';
import type {AnimationRendererProps} from '../contract';
import {In004NativeIntro,IN004_PERSISTENT_TITLE} from './g4-l9-in004-intro';
import {In004Terminal} from './g4-l9-in004-terminal';
/** Complete source-frame native visual wrapper. Host clocks/audio remain owned
 * externally; source text is never overlaid on the unsuppressed Canvas page. */
export function In004NativePage(r:AnimationRendererProps){
 if(r.lang!=='en'||r.scenario!=='source-static-frame'||r.entryStateSha256||(r.rootFrame??6)!==6||(r.frameDomain??'sprite-405')!=='sprite-405'||!Number.isInteger(r.frame)||r.frame<1||r.frame>695)return null;
 return r.frame===695?<In004Terminal {...r} rootTitle={IN004_PERSISTENT_TITLE}/>:<In004NativeIntro {...r}/>;
}
