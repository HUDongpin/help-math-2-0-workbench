'use client';
import {SourceLoopingQuizPlayer,type SourceLoopingQuizPlayerProps} from './source-looping-quiz-player-v1';
import {ALG_L08_P020_SOURCE as SOURCE} from './alg-l08-p020-source-v1';
import {l8p020View} from './alg-l08-p020-frame-v1';
import {AlgL08P020Presentation} from './alg-l08-p020-presentation-v1';
export function AlgL08P020Player(props:Omit<SourceLoopingQuizPlayerProps,'source'|'terms'|'render'>){return <SourceLoopingQuizPlayer {...props} source={SOURCE} terms={SOURCE.terms} render={(state,context,actions)=><AlgL08P020Presentation view={l8p020View(state,context)} {...actions}/>}/>;}
