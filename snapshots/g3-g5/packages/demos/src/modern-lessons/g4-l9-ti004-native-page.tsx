'use client';
import React from 'react';
import type {AnimationRendererProps} from '../contract';
import {Ti004NativeIntro,TI004_PERSISTENT_TITLE} from './g4-l9-ti004-intro';
import {Ti004Terminal} from './g4-l9-ti004-terminal';
/** Exact frame family: native masked intro then the owned matching exercise. */
export function Ti004NativePage(r:AnimationRendererProps){
 if(r.lang!=='en'||r.scenario!=='source-static-frame'||r.entryStateSha256||(r.rootFrame??6)!==6||(r.frameDomain??'sprite-134')!=='sprite-134'||!Number.isInteger(r.frame)||r.frame<1||r.frame>119)return null;
 return r.frame>=118?<Ti004Terminal {...r} rootTitle={TI004_PERSISTENT_TITLE}/>:<Ti004NativeIntro {...r}/>;
}
