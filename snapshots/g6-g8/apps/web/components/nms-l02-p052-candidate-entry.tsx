'use client';
import dynamic from 'next/dynamic';
import type {P052CaptureIdentityRequest} from '../../../packages/demos/src/nms-l02-p052-capture-renderer-v1';
/** Keep engineering page implementation out of the production client import graph. */
const Candidate=process.env.NODE_ENV==='production'?()=>null
 :dynamic(()=>import('./nms-l02-p052-candidate-player').then(m=>m.P052CandidatePlayer),{ssr:false});
export function P052CandidateEntry({language,capture}:{language:'en'|'es';capture?:P052CaptureIdentityRequest|null}){return <Candidate language={language} capture={capture}/>;}
