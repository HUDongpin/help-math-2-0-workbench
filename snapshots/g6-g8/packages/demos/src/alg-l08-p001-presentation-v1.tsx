'use client';
import type {AnimationRendererProps} from './contract';
import {ALG_L08_P001_SOURCE,algL08P001Frame} from './alg-l08-p001-state-v1';
import {SourceTitlePresentationV1} from './source-title-presentation-v1';
export function AlgL08P001Renderer(props:AnimationRendererProps){
  return <SourceTitlePresentationV1 source={ALG_L08_P001_SOURCE} state={algL08P001Frame(props.frame,{...props,frame:props.frame})}/>;
}
