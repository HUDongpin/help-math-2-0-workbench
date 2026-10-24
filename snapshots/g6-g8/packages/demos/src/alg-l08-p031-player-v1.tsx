'use client';
import {L8P031Player,type L8P031PlayerProps} from './alg-l08-p031-controls-v1';
import {ALG_L08_P031_SOURCE as SOURCE} from './alg-l08-p031-source-v1';
import {l8p031View} from './alg-l08-p031-frame-v1';
import {AlgL08P031Presentation} from './alg-l08-p031-presentation-v1';
export function AlgL08P031Player(props:Omit<L8P031PlayerProps,'source'|'terms'|'render'>){return <L8P031Player {...props} source={SOURCE} terms={SOURCE.terms} render={(state,context,actions)=><AlgL08P031Presentation view={l8p031View(state,context)} {...actions}/>}/>;}
