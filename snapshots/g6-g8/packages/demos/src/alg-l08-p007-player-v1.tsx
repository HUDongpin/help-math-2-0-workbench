'use client';
import {SourceLoopingQuizPlayer,type SourceLoopingQuizPlayerProps} from './source-looping-quiz-player-v1';
import {ALG_L08_P007_SOURCE as SOURCE} from './alg-l08-p007-source-v1';
import {l8p007View} from './alg-l08-p007-frame-v1';
import {AlgL08P007Presentation} from './alg-l08-p007-presentation-v1';
export function AlgL08P007Player(props:Omit<SourceLoopingQuizPlayerProps,'source'|'terms'|'render'>){return <SourceLoopingQuizPlayer {...props} source={SOURCE} terms={SOURCE.terms} render={(state,context,actions)=><AlgL08P007Presentation view={l8p007View(state,context)} {...actions}/>}/>;}
