import {isG678LocalPreviewRequestHeaders,type G678PreviewEnvironment} from './g678-preview-policy';
import {CONTINUOUS_AUDIO_PHASE} from './continuous-source-audio-access';
export function isP052PreviewRequest(headers:Pick<Headers,'get'>,locale:string,env:G678PreviewEnvironment=process.env){
 if(locale!=='en'&&locale!=='es')return false;
 if(!isG678LocalPreviewRequestHeaders(headers,env)||env.HELP_MATH_G678_P052_AUDIO_CANDIDATE!=='1'
  ||env.HELP_MATH_G678_CALIBRATION_PHASE!==CONTINUOUS_AUDIO_PHASE)return false;
 // Next's default-locale rewrite uses localhost internally while retaining
 // the original 127.0.0.1 authority. Accept only that exact same-port pair.
 const host=headers.get('host'),forwarded=headers.get('x-forwarded-host');
 try{
  const actual=new URL('http://'+host);
  if(actual.host!==host||actual.username||actual.password)return false;
  if(forwarded===null||forwarded===host)return true;
  const original=new URL('http://'+forwarded);
  return original.host===forwarded&&!original.username&&!original.password
   &&actual.hostname==='localhost'&&original.hostname==='127.0.0.1'
   &&actual.port!==''&&actual.port===original.port;
 }catch{return false;}
}
