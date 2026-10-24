'use client';
import {L8P035Player,type L8P035PlayerProps} from './alg-l08-p035-controls-v1';
import {ALG_L08_P035_SOURCE as SOURCE} from './alg-l08-p035-source-v1';
import {l8p035View} from './alg-l08-p035-frame-v1';
import {AlgL08P035Presentation} from './alg-l08-p035-presentation-v1';
export function AlgL08P035Player(props:Omit<L8P035PlayerProps,'source'|'terms'|'render'>){return <L8P035Player {...props} source={SOURCE} terms={SOURCE.terms} render={(state,context,actions)=><AlgL08P035Presentation view={l8p035View(state,context)} {...actions}/>}/>;}
