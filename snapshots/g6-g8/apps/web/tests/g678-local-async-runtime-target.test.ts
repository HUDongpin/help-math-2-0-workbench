import test from 'node:test';
import assert from 'node:assert/strict';
import nextConfig from '../next.config';
const keys=['NODE_ENV','VERCEL_ENV','HELP_MATH_G678_LOCAL_PREVIEW','HELP_MATH_G678_LOCAL_PREVIEW_BIND'] as const;
function env(values:Record<string,string|undefined>,run:()=>void){const previous=Object.fromEntries(keys.map(k=>[k,process.env[k]]));try{
  for(const k of keys){if(values[k]===undefined)Reflect.deleteProperty(process.env,k);else Reflect.set(process.env,k,values[k]);}run();
}finally{for(const k of keys){if(previous[k]===undefined)Reflect.deleteProperty(process.env,k);else Reflect.set(process.env,k,previous[k]);}}}
const local={NODE_ENV:'development',HELP_MATH_G678_LOCAL_PREVIEW:'true',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1'};
class ReplacementPlugin{}
function config(){return{target:['web','es6'],output:{environment:{arrowFunction:false,asyncFunction:false,const:true}},resolve:{alias:{}},plugins:[]};}
function apply(c:ReturnType<typeof config>,dev:boolean,isServer?:boolean){return nextConfig.webpack!(c,{dev,isServer,webpack:{NormalModuleReplacementPlugin:ReplacementPlugin}} as never);}
test('opted-in loopback client changes only asyncFunction and preserves the other runtime targets/capabilities',()=>env(local,()=>{
  const c=config();apply(c,true,false);assert.deepEqual(c.output.environment,{arrowFunction:false,asyncFunction:true,const:true});assert.deepEqual(c.target,['web','es6']);assert.deepEqual(c.plugins,[]);
}));
test('server, Edge/server context, missing client identity, nonlocal, provider and production contexts receive no async override',()=>{
  for(const[values,dev,isServer]of[[local,true,true],[local,true,undefined],[local,false,false],
    [{...local,HELP_MATH_G678_LOCAL_PREVIEW:undefined},true,false],[{...local,HELP_MATH_G678_LOCAL_PREVIEW_BIND:'0.0.0.0'},true,false],
    [{...local,VERCEL_ENV:'preview'},true,false],[{...local,NODE_ENV:'production'},true,false]] as const){env(values,()=>{const c=config();apply(c,dev,isServer);assert.equal(c.output.environment.asyncFunction,false);});}
});
test('production still replaces both private registry entrypoints with the existing closed stub',()=>env({...local,NODE_ENV:'production'},()=>{
  const c=config();apply(c,false,false);assert.equal(c.output.environment.asyncFunction,false);assert.equal(c.plugins.length,1);
  const aliases=c.resolve.alias as Record<string,string>;for(const key of['@helpmath/demos/local-only-animation-registry','@helpmath/demos/local-only-animation-registry-metadata'])
    assert.ok(aliases[key].endsWith('/lib/g678-local-only-registry.production-stub.ts'));
}));
