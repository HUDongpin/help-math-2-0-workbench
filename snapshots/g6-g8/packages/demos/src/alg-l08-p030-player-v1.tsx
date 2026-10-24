'use client';
import {L8P030Player,type L8P030PlayerProps} from './alg-l08-p030-controls-v1';
import {ALG_L08_P030_SOURCE as SOURCE} from './alg-l08-p030-source-v1';
import {l8p030View} from './alg-l08-p030-frame-v1';
import {AlgL08P030Presentation} from './alg-l08-p030-presentation-v1';
export function AlgL08P030Player(props:Omit<L8P030PlayerProps,'source'|'terms'|'render'>){return <L8P030Player {...props} source={SOURCE} terms={SOURCE.terms} render={(state,context,actions)=><AlgL08P030Presentation view={l8p030View(state,context)} {...actions}/>}/>;}
