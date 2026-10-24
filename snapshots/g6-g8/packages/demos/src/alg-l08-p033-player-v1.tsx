'use client';
import {L8P033Player,type L8P033PlayerProps} from './alg-l08-p033-controls-v1';
import {ALG_L08_P033_SOURCE as SOURCE} from './alg-l08-p033-source-v1';
import {l8p033View} from './alg-l08-p033-frame-v1';
import {AlgL08P033Presentation} from './alg-l08-p033-presentation-v1';
export function AlgL08P033Player(props:Omit<L8P033PlayerProps,'source'|'terms'|'render'>){return <L8P033Player {...props} source={SOURCE} terms={SOURCE.terms} render={(state,context,actions)=><AlgL08P033Presentation view={l8p033View(state,context)} {...actions}/>}/>;}
