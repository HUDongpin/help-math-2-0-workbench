'use client';
import React from 'react';
import type {AnimationRendererProps} from '../contract';
import {Ti003NativeIntro,TI003_PERSISTENT_TITLE} from './g4-l9-ti003-intro';
import {Ti003Terminal} from './g4-l9-ti003-terminal';
/** Complete source-frame native visual wrapper. Host clocks/audio remain owned
 * externally; source text is never overlaid on the unsuppressed Canvas page. */
export function Ti003NativePage(r:AnimationRendererProps){
 if(r.lang!=='en'||r.scenario!=='source-static-frame'||r.entryStateSha256||(r.rootFrame??6)!==6||(r.frameDomain??'sprite-502')!=='sprite-502'||!Number.isInteger(r.frame)||r.frame<1||r.frame>658)return null;
 return r.frame===658?<Ti003Terminal {...r} rootTitle={TI003_PERSISTENT_TITLE}/>:<Ti003NativeIntro {...r}/>;
}
