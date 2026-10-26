import 'server-only';
import{createHash}from'node:crypto';import{lstatSync,readFileSync,realpathSync}from'node:fs';import path from'node:path';
/** No recovered glossary exceptions: P039 inputs are bounded to worktree, task evidence and technical source. */
export function readP039Binding(root:string,pin:Readonly<{path:string;bytes:number;sha256:string}>){
 const file=path.resolve(root,pin.path),anchors=[root,'/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222','/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware'];
 if(process.env.NODE_ENV==='production'||process.env.VERCEL_ENV||!anchors.some(anchor=>file.startsWith(anchor+path.sep))||realpathSync(file)!==file)throw Error('P039_INPUT_SCOPE');
 const before=lstatSync(file,{bigint:true}),bytes=readFileSync(file),after=lstatSync(file,{bigint:true});
 if(!before.isFile()||before.nlink!==1n||!['dev','ino','size','mode','mtimeNs','nlink'].every(key=>before[key as keyof typeof before]===after[key as keyof typeof after])||bytes.length!==pin.bytes||createHash('sha256').update(bytes).digest('hex')!==pin.sha256)throw Error('P039_INPUT_IDENTITY:'+pin.path);
 return bytes;
}
