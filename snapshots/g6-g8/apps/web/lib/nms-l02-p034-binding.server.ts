import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync,readFileSync,realpathSync} from 'node:fs';
import path from 'node:path';
const CASES = [
  '/Volumes/WestWorld/HELP MATH Related Files/Private Recovery Containers/2026-08-25-BOULDER-LEARNING-AWS-S3-EMERGENCY-V1/objects/sha256/14/14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b',
  '/Volumes/WestWorld/HELP MATH Related Files/Private Recovery Containers/2026-08-25-BOULDER-LEARNING-AWS-S3-EMERGENCY-V1/objects/sha256/3b/3b437b42e75536fa8b4f110325e366c27fbe10a871439d4797650cda4238b407',
];
/** Ordinary bounded source inputs plus exactly the two recovered term indexes. */
export function readP034Binding(root:string,pin:Readonly<{path:string;bytes:number;sha256:string}>) {
  const file=path.resolve(root,pin.path);
  const anchors=[root,'/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222','/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware'];
  if(process.env.NODE_ENV==='production'||process.env.VERCEL_ENV||(!CASES.includes(file)&&!anchors.some(anchor=>file.startsWith(anchor+path.sep)))||realpathSync(file)!==file)throw Error('P034_INPUT_SCOPE');
  const before=lstatSync(file,{bigint:true}),bytes=readFileSync(file),after=lstatSync(file,{bigint:true});
  if(!before.isFile()||before.nlink!==1n||!['dev','ino','size','mode','mtimeNs','nlink'].every(key=>before[key as keyof typeof before]===after[key as keyof typeof after])||bytes.length!==pin.bytes||createHash('sha256').update(bytes).digest('hex')!==pin.sha256)throw Error('P034_INPUT_IDENTITY:'+pin.path);
  return bytes;
}
