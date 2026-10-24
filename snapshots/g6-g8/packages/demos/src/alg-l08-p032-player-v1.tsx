'use client';
import {L8P032Player,type L8P032PlayerProps} from './alg-l08-p032-controls-v1';
import {ALG_L08_P032_SOURCE as SOURCE} from './alg-l08-p032-source-v1';
import {l8p032View} from './alg-l08-p032-frame-v1';
import {AlgL08P032Presentation} from './alg-l08-p032-presentation-v1';
export function AlgL08P032Player(props:Omit<L8P032PlayerProps,'source'|'terms'|'render'>){return <L8P032Player {...props} source={SOURCE} terms={SOURCE.terms} render={(state,context,actions)=><AlgL08P032Presentation view={l8p032View(state,context)} {...actions}/>}/>;}
