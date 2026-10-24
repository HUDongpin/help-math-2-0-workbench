'use client';
import {L8P036Player,type L8P036PlayerProps} from './alg-l08-p036-controls-v1';
import {ALG_L08_P036_SOURCE as SOURCE} from './alg-l08-p036-source-v1';
import {l8p036View} from './alg-l08-p036-frame-v1';
import {AlgL08P036Presentation} from './alg-l08-p036-presentation-v1';
export function AlgL08P036Player(props:Omit<L8P036PlayerProps,'source'|'terms'|'render'>){return <L8P036Player {...props} source={SOURCE} terms={SOURCE.terms} render={(state,context,actions)=><AlgL08P036Presentation view={l8p036View(state,context)} {...actions}/>}/>;}
