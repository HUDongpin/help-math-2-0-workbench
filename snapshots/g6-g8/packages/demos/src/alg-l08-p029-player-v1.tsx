'use client';
import {SourceLoopingQuizPlayer,type SourceLoopingQuizPlayerProps} from './source-looping-quiz-player-v2';
import {ALG_L08_P029_SOURCE as SOURCE} from './alg-l08-p029-source-v1';
import {l8p029View} from './alg-l08-p029-frame-v1';
import {AlgL08P029Presentation} from './alg-l08-p029-presentation-v1';
export function AlgL08P029Player(props:Omit<SourceLoopingQuizPlayerProps,'source'|'terms'|'render'>){return <SourceLoopingQuizPlayer {...props} source={SOURCE} terms={SOURCE.terms} render={(state,context,actions)=><AlgL08P029Presentation view={l8p029View(state,context)} {...actions}/>}/>;}
