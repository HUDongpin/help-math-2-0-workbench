import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import test from 'node:test';
import {pathToFileURL} from 'node:url';

const root=path.resolve(import.meta.dirname,'../../..');
const sourceRoot='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const server=pathToFileURL(path.join(root,
  'apps/web/lib/alg-l06-p003-canonical-resources-v1.server.ts')).href;
const expected={
  canvas:{bytes:9063233,sha256:'87694adc7d08f6f95069deede781410ab912a24a44a6cfce0fc05a43118f205c'},
  main:{bytes:263640,sha256:'91ddead67e2e39640b4fe76493f9764959daba8dab40e0ac2036670103285111'},
  spanish:{bytes:135408,sha256:'d280e8f5e653c165755baf2f8960cfd667f03205d2f9aaafe1820a15d327f89a'},
};
function call(cwd=root,overrides:Record<string,string|undefined>={}){
  const code=`import {readP003CanonicalCanvas,readP003CanonicalMain,readP003CanonicalSpanish} from '${server}';
    import {createHash} from 'node:crypto';
    const pin=bytes=>({bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
    console.log(JSON.stringify({canvas:pin(readP003CanonicalCanvas()),
      main:pin(readP003CanonicalMain()),spanish:pin(readP003CanonicalSpanish())}));`;
  const env:NodeJS.ProcessEnv={...process.env,NODE_ENV:'development',VERCEL:'',VERCEL_ENV:'',
    HELP_MATH_G678_LOCAL_PREVIEW:'1',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',
    HELP_MATH_G678_SOURCE_ROOT:sourceRoot};
  for(const [key,value] of Object.entries(overrides)){
    if(value===undefined)delete env[key];
    else env[key]=value;
  }
  return spawnSync(process.execPath,['--conditions=react-server','--import','tsx',
    '--input-type=module','-e',code],{cwd,encoding:'utf8',maxBuffer:1024*1024,env});
}

test('canonical run/member backs all three exact resource bytes from either workspace cwd',()=>{
  for(const cwd of [root,path.join(root,'apps/web')]){
    const result=call(cwd);
    assert.equal(result.status,0,result.stderr||result.stdout);
    assert.deepEqual(JSON.parse(result.stdout.trim()),expected);
  }
});

test('resource reader fails closed outside exact local source environment',()=>{
  for(const overrides of [
    {NODE_ENV:'production'},
    {VERCEL:'1'},
    {VERCEL_ENV:'preview'},
    {HELP_MATH_G678_LOCAL_PREVIEW:'0'},
    {HELP_MATH_G678_LOCAL_PREVIEW_BIND:'localhost'},
    {HELP_MATH_G678_SOURCE_ROOT:undefined},
  ]){
    const result=call(root,overrides);
    assert.notEqual(result.status,0);
    assert.match(result.stderr,/P003_CANONICAL_RESOURCE_LOCAL_ONLY/u);
  }
});
