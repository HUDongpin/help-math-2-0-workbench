import {P036_SOURCE_IMAGES} from './nms-l02-p036-teaching-v1';
let prepared:Promise<void>|null=null;
/** Exact private image bytes are decoded before a composed player can start. */
export function prepareP036Images():Promise<void>{
 if(typeof document==='undefined')return Promise.resolve();
 return prepared??=Promise.all(P036_SOURCE_IMAGES.map(async source=>{
  const bytes=Uint8Array.from(atob(source.uri.split(',')[1]),c=>c.charCodeAt(0));
  const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
  if(bytes.length!==source.bytes||hash!==source.sha256)throw Error('P036_IMAGE_IDENTITY');
  const image=new Image();image.src=source.uri;await image.decode();
  if(image.naturalWidth!==source.width||image.naturalHeight!==source.height)throw Error('P036_IMAGE_DIMENSIONS');
 })).then(()=>{}).catch(error=>{prepared=null;throw error;});
}
