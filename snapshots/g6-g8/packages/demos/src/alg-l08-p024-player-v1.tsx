'use client';
import {SourceLoopingQuizPlayer,type SourceLoopingQuizPlayerProps} from './source-looping-quiz-player-v2';
import {ALG_L08_P024_SOURCE as SOURCE} from './alg-l08-p024-source-v1';
import {l8p024View} from './alg-l08-p024-frame-v1';
import {AlgL08P024Presentation} from './alg-l08-p024-presentation-v1';
export function AlgL08P024Player(props:Omit<SourceLoopingQuizPlayerProps,'source'|'terms'|'render'>){return <SourceLoopingQuizPlayer {...props} source={SOURCE} terms={SOURCE.terms} render={(state,context,actions)=><AlgL08P024Presentation view={l8p024View(state,context)} {...actions}/>}/>;}
