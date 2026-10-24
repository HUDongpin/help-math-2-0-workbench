'use client';
import {L8P039Player,type L8P039PlayerProps} from './alg-l08-p039-controls-v1';
import {ALG_L08_P039_SOURCE as SOURCE} from './alg-l08-p039-source-v1';
import {l8p039View} from './alg-l08-p039-frame-v1';
import {AlgL08P039Presentation} from './alg-l08-p039-presentation-v1';
export function AlgL08P039Player(props:Omit<L8P039PlayerProps,'source'|'terms'|'render'>){return <L8P039Player {...props} source={SOURCE} terms={SOURCE.terms} render={(state,context,actions)=><AlgL08P039Presentation view={l8p039View(state,context)} {...actions}/>}/>;}
