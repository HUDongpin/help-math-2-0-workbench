"use client";
import React from 'react';
import type {AnimationRendererProps} from './contract';
import {prepareP044CanvasMount} from './g678-nms-l01-p044-canvas-preparation';
import {NmsL01P044ProductCandidate} from './g678-nms-l01-p044-product-candidate';
import {createP044CandidateModule} from './g678-nms-l01-p044-candidate-module';
// Actual standard import admission waits here. Do not replace this with an
// unawaited preload or advertise a ready module while decode is still pending.
const mount=await prepareP044CanvasMount();
const alreadyPrepared=()=>{};
function PreparedP044Renderer(props:AnimationRendererProps){
  return <NmsL01P044ProductCandidate {...props} mountVisual={mount} onVisualReady={alreadyPrepared}/>;
}
export const P044_MODULE_PREPARATION=Object.freeze({sourceImagesDecoded:11,loaderAwaitedDecode:true,unregistered:true,
  sourceSha256:'8ad8df775eff49a3763f67e95fba4ed211e34912bd63f6602078119240fe6c76'});
export default createP044CandidateModule(PreparedP044Renderer);
