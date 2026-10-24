'use client';
import {SourceLoopingQuizPlayer,type SourceLoopingQuizPlayerProps} from './source-looping-quiz-player-v2';
import {ALG_L08_P026_SOURCE as SOURCE} from './alg-l08-p026-source-v1';
import {l8p026View} from './alg-l08-p026-frame-v1';
import {AlgL08P026Presentation} from './alg-l08-p026-presentation-v1';
export function AlgL08P026Player(props:Omit<SourceLoopingQuizPlayerProps,'source'|'terms'|'render'>){return <SourceLoopingQuizPlayer {...props} source={SOURCE} terms={SOURCE.terms} render={(state,context,actions)=><AlgL08P026Presentation view={l8p026View(state,context)} {...actions}/>}/>;}
