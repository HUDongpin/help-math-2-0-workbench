import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {g678LocalPreviewLaunch,parseG678LocalPreviewArguments} from './run-g678-local-preview.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
assert.notEqual(process.env.NODE_ENV,'production');assert.equal(process.env.VERCEL_ENV,undefined);
for(const name of ['HELP_MATH_G678_SOURCE_ROOT','PRIVATE_RECOVERY_CONTAINERS'])assert(path.isAbsolute(process.env[name]??''));
const options=parseG678LocalPreviewArguments(process.argv.slice(2));
const launch=g678LocalPreviewLaunch({port:options.port,root:ROOT});
const env={...launch.env,HELP_MATH_G678_CALIBRATION_PHASE:'frozen16-prepared-glossary-provisional-browser-qa'};
for(const args of [['scripts/activate-g678-frozen16-prepared-glossary-registration.mjs','--check'],['packages/demos/scripts/generate-registry.mjs','--check']]){
  const child=spawn(process.execPath,args,{cwd:ROOT,env,stdio:'inherit'});
  const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',resolve);});assert.equal(code,0);
}
const child=spawn(launch.command,launch.args,{cwd:launch.cwd,env,stdio:'inherit'});
for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>child.kill(signal));
process.exitCode=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',code=>resolve(code??0));});
