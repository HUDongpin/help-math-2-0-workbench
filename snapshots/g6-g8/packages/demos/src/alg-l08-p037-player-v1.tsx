'use client';
import {L8P037Player,type L8P037PlayerProps} from './alg-l08-p037-controls-v1';
import {ALG_L08_P037_SOURCE as SOURCE} from './alg-l08-p037-source-v1';
import {l8p037View} from './alg-l08-p037-frame-v1';
import {AlgL08P037Presentation} from './alg-l08-p037-presentation-v1';
export function AlgL08P037Player(props:Omit<L8P037PlayerProps,'source'|'terms'|'render'>){return <L8P037Player {...props} source={SOURCE} terms={SOURCE.terms} render={(state,context,actions)=><AlgL08P037Presentation view={l8p037View(state,context)} {...actions}/>}/>;}
