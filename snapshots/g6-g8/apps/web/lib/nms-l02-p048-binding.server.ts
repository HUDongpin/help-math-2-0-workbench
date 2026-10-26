import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync,readFileSync,realpathSync} from 'node:fs';
import path from 'node:path';
/** Bounded ordinary source inputs; no recovered glossary-index exceptions. */
export function readP048Binding(root:string,pin:Readonly<{path:string;bytes:number;sha256:string}>) {
  if(!Number.isSafeInteger(pin.bytes)||pin.bytes<0||!/^([a-f0-9]{64})$/.test(pin.sha256))throw Error('P048_INPUT_PIN');
  const file=path.resolve(root,pin.path);
  const anchors=[root,'/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222','/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware'];
  if(process.env.NODE_ENV==='production'||process.env.VERCEL_ENV||!anchors.some(anchor=>file.startsWith(anchor+path.sep))||realpathSync(file)!==file)throw Error('P048_INPUT_SCOPE');
  const before=lstatSync(file,{bigint:true});
  if(!before.isFile()||before.nlink!==1n||before.size!==BigInt(pin.bytes))throw Error('P048_INPUT_IDENTITY:'+pin.path);
  const bytes=readFileSync(file),after=lstatSync(file,{bigint:true});
  if(!before.isFile()||before.nlink!==1n||!['dev','ino','size','mode','mtimeNs','nlink'].every(key=>before[key as keyof typeof before]===after[key as keyof typeof after])||bytes.length!==pin.bytes||createHash('sha256').update(bytes).digest('hex')!==pin.sha256)throw Error('P048_INPUT_IDENTITY:'+pin.path);
  return bytes;
}
