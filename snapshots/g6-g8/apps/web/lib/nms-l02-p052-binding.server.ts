import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync,readFileSync,realpathSync} from 'node:fs';
import path from 'node:path';
/** Bounded ordinary source inputs; no recovered glossary-index exceptions. */
export function readP052Binding(root:string,pin:Readonly<{path:string;bytes:number;sha256:string}>) {
  if(!Number.isSafeInteger(pin.bytes)||pin.bytes<0||!/^([a-f0-9]{64})$/.test(pin.sha256))throw Error('P052_INPUT_PIN');
  const workspace=path.resolve(root);
  if(realpathSync(workspace)!==workspace||!lstatSync(workspace).isDirectory())throw Error('P052_INPUT_ROOT');
  const file=path.resolve(workspace,pin.path);
  const anchors=[workspace,'/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222','/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware'];
  const glossaryFiles=['L1KTE01.xml','L1KTS01.xml'].map(name=>'/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI/'+name);
  if(process.env.NODE_ENV==='production'||process.env.VERCEL_ENV||(!anchors.some(anchor=>file.startsWith(anchor+path.sep))&&!glossaryFiles.includes(file))||realpathSync(file)!==file)throw Error('P052_INPUT_SCOPE');
  const before=lstatSync(file,{bigint:true});
  if(!before.isFile()||before.nlink!==1n||before.size!==BigInt(pin.bytes))throw Error('P052_INPUT_IDENTITY:'+pin.path);
  const bytes=readFileSync(file),after=lstatSync(file,{bigint:true});
  if(!before.isFile()||before.nlink!==1n||!['dev','ino','size','mode','mtimeNs','nlink'].every(key=>before[key as keyof typeof before]===after[key as keyof typeof after])||bytes.length!==pin.bytes||createHash('sha256').update(bytes).digest('hex')!==pin.sha256)throw Error('P052_INPUT_IDENTITY:'+pin.path);
  return bytes;
}
