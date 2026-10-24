'use client';
import {SourceLoopingQuizPlayer,type SourceLoopingQuizPlayerProps} from './source-looping-quiz-player-v2';
import {ALG_L08_P023_SOURCE as SOURCE} from './alg-l08-p023-source-v1';
import {l8p023View} from './alg-l08-p023-frame-v1';
import {AlgL08P023Presentation} from './alg-l08-p023-presentation-v1';
export function AlgL08P023Player(props:Omit<SourceLoopingQuizPlayerProps,'source'|'terms'|'render'>){return <SourceLoopingQuizPlayer {...props} source={SOURCE} terms={SOURCE.terms} render={(state,context,actions)=><AlgL08P023Presentation view={l8p023View(state,context)} {...actions}/>}/>;}
