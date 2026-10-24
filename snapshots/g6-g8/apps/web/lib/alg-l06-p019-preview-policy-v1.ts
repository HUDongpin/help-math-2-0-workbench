/** P019-only local browser boundary. Keep this edge-importable. */
import type {G678PreviewEnvironment} from './g678-preview-policy';

export const P019_ID='shared-alg001-l06-p019';
export const P019_LOCAL_ORIGIN='http://127.0.0.1:3331';
export const P019_SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const P019_ASSET_ROOT=`/flash-assets/g678-local/${P019_ID}`;
const DOCUMENTS=new Set(['en','es'].flatMap(locale=>['candidate-v1','continuous-v1']
 .map(version=>`/${locale}/migration-status/g678-calibration/${P019_ID}/${version}`)));

export function p019LocalDevelopment(env:G678PreviewEnvironment=process.env):boolean{
 return env.NODE_ENV==='development'&&!env.VERCEL&&!env.VERCEL_ENV&&
  env.HELP_MATH_G678_SOURCE_ROOT===P019_SOURCE_ROOT&&
  ['1','true'].includes(env.HELP_MATH_G678_LOCAL_PREVIEW??'')&&
  env.HELP_MATH_G678_LOCAL_PREVIEW_BIND==='127.0.0.1';
}

export function p019CandidateReferer(value:string|null):boolean{
 if(!value)return false;
 try{
  const referer=new URL(value);
  return referer.origin===P019_LOCAL_ORIGIN&&!referer.username&&!referer.password&&
   !referer.hash&&['','?mode=focus'].includes(referer.search)&&
   DOCUMENTS.has(referer.pathname);
 }catch{return false;}
}
