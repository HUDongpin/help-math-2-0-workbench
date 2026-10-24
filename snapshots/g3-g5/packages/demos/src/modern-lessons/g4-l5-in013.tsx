'use client';
import type {AnimationModule,RuntimeContext} from '../contract';
import {findG4L5ProductCandidate} from '../g4-l5-product-candidates.generated';
import {createG4L5ProductCandidateModule} from '../g4-l5-product-candidate';
import {createVocabularyChoicePresentation,type VocabularyChoiceFrameState} from './g4-l4-vocabulary-choice';
import {G4_L5_LATTICE_FOIL_CHOICE_CONFIGS,G4_L5_LATTICE_FOIL_CHOICE_HOST_AUDIO_CANDIDATES} from './generated/g4-l5-lattice-foil-choice-config';
const c=G4_L5_LATTICE_FOIL_CHOICE_CONFIGS[0],product=findG4L5ProductCandidate('course-g04-l05-in-013');
if(!product||product.source.swfSha256!==c.sourceSha256||product.source.productFrameDomain.id!==c.frameDomain||product.source.productFrameDomain.frameCount!==c.frameCount)throw new Error('IN013 source/runtime binding mismatch');
const original=createG4L5ProductCandidateModule(product);
const {textPresentation:legacyPresentation,...fallbackModule}=original;
if(legacyPresentation)throw new Error('IN013 factory unexpectedly gained a separate text presentation');
export function getCourseG04L05In013FrameState(frame:number,r:RuntimeContext):VocabularyChoiceFrameState{
 const frameDomain=r.frameDomain??c.frameDomain,rootFrame=r.rootFrame??c.rootFrame;
 const valid=Number.isInteger(frame)&&frame>=1&&frame<=c.frameCount&&frameDomain===c.frameDomain&&rootFrame===c.rootFrame&&r.scenario==='source-static-frame'&&r.lang==='en'&&!r.entryStateSha256;
 return Object.freeze({animationId:c.animationId,sourceSwfSha256:c.sourceSha256,frame,frameDomain,rootFrame,scenario:r.scenario,language:r.lang,seed:r.seed>>>0,status:valid?'ready':'blocked',blocker:valid?null:'unsupported-native-lattice-request'});
}
export const G4_L5_IN013_TEXT_PRESENTATION=createVocabularyChoicePresentation(c,getCourseG04L05In013FrameState,original.Renderer);
export const G4_L5_IN013_NATIVE_MODULE:AnimationModule<VocabularyChoiceFrameState>=Object.freeze({...fallbackModule,
 runtime:Object.freeze({...original.runtime!,frameDomains:Object.freeze(original.runtime!.frameDomains!.map(d=>d.id===c.frameDomain?Object.freeze({...d,rootFrame:c.rootFrame}):d))}),
 scenarios:Object.freeze([...(original.scenarios??[]),Object.freeze({id:'source-static-frame',label:'Source-timed lattice practice',description:'Native lattice state from the exact own SWF timeline; original-runtime fidelity remains separate.'})]),
 defaultScenarioByFrameDomain:Object.freeze({...original.defaultScenarioByFrameDomain,[c.frameDomain]:'source-static-frame'}),
 audioTracks:G4_L5_LATTICE_FOIL_CHOICE_HOST_AUDIO_CANDIDATES['course-g04-l05-in-013'].audioTracks,
 getFrameState:getCourseG04L05In013FrameState,
});
