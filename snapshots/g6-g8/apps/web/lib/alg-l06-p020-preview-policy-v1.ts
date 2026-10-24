/** Exact P020-only local browser boundary. This module is edge-importable. */
import type {G678PreviewEnvironment} from './g678-preview-policy';

export const P020_ID='shared-alg001-l06-p020';
export const P020_LOCAL_ORIGIN='http://127.0.0.1:3331';
export const P020_SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const P020_ASSET_ROOT=`/flash-assets/g678-local/${P020_ID}`;
const DOCUMENTS=new Set(['en','es'].flatMap(locale=>
 ['candidate-v1','continuous-v1'].map(version=>
  `/${locale}/migration-status/g678-calibration/${P020_ID}/${version}`)));

export function p020LocalDevelopment(env:G678PreviewEnvironment=process.env):boolean{
 return env.NODE_ENV==='development'&&!env.VERCEL&&!env.VERCEL_ENV&&
  env.HELP_MATH_G678_SOURCE_ROOT===P020_SOURCE_ROOT&&
  ['1','true'].includes(env.HELP_MATH_G678_LOCAL_PREVIEW??'')&&
  env.HELP_MATH_G678_LOCAL_PREVIEW_BIND==='127.0.0.1';
}

export function p020CandidateReferer(value:string|null):boolean{
 if(!value)return false;
 try{
  const referer=new URL(value);
  return referer.origin===P020_LOCAL_ORIGIN&&!referer.username&&!referer.password&&
   !referer.hash&&['','?mode=focus'].includes(referer.search)&&
   DOCUMENTS.has(referer.pathname);
 }catch{return false;}
}
