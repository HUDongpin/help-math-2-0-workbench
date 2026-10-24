'use client';
import {L8P034Player,type L8P034PlayerProps} from './alg-l08-p034-controls-v1';
import {ALG_L08_P034_SOURCE as SOURCE} from './alg-l08-p034-source-v1';
import {l8p034View} from './alg-l08-p034-frame-v1';
import {AlgL08P034Presentation} from './alg-l08-p034-presentation-v1';
export function AlgL08P034Player(props:Omit<L8P034PlayerProps,'source'|'terms'|'render'>){return <L8P034Player {...props} source={SOURCE} terms={SOURCE.terms} render={(state,context,actions)=><AlgL08P034Presentation view={l8p034View(state,context)} {...actions}/>}/>;}
