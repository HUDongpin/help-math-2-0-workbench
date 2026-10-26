import 'server-only';
import path from 'node:path';
import {readJsonPin,readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {P003_OPTIONAL_SPANISH_BYTES,P003_OPTIONAL_SPANISH_SHA256} from './alg-l06-p003-optional-spanish-access-v1';
const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const ROLE_AUDIT={"path":"migrations/shared-alg001-l06-p003/audit/sa-host-disposition-v2.json","bytes":12742,"sha256":"7a7a4d1e26806569a788d6981593e027b583c84e55cd3d05ff42deae5351f463"};
type Pin={path:string;bytes:number;sha256:string};
/** Explicit optional source-host audio only; this does not attest spoken language. */
export function readP003OptionalSpanish():Buffer {
 if(process.env.NODE_ENV!=='development'||process.env.VERCEL||process.env.VERCEL_ENV||
  process.env.HELP_MATH_G678_SOURCE_ROOT!==SOURCE_ROOT||
  !['1','true'].includes(process.env.HELP_MATH_G678_LOCAL_PREVIEW??'')||
  process.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND!=='127.0.0.1')throw Error('P003_OPTIONAL_SA_LOCAL_ONLY');
 const audit=readJsonPin(getWorkspaceRoot(),ROLE_AUDIT) as {kind:string;animationId:string;inputs:Record<string,Pin>};
 if(audit.kind!=='alg-l06-p003-separate-sa-host-disposition-v2'||audit.animationId!=='shared-alg001-l06-p003')throw Error('P003_OPTIONAL_SA_ROLE');
 for(const key of ['lessonXml','pageSwf','hostCas'] as const){
  const pin=audit.inputs[key];readPin(path.dirname(pin.path),{...pin,path:path.basename(pin.path)});
 }
 const source=audit.inputs.separateSa;
 if(source.path!==`${SOURCE_ROOT}/G6-G8-shared/ALG001/L6/SA/L6RW03.mp3`||
  source.bytes!==P003_OPTIONAL_SPANISH_BYTES||source.sha256!==P003_OPTIONAL_SPANISH_SHA256)
  throw Error('P003_OPTIONAL_SA_SOURCE');
 return readPin(SOURCE_ROOT,{...source,path:'G6-G8-shared/ALG001/L6/SA/L6RW03.mp3'});
}
