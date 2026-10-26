import assert from'node:assert/strict';import test from'node:test';import{mkdtempSync,realpathSync,writeFileSync,symlinkSync,linkSync,rmSync}from'node:fs';import{tmpdir}from'node:os';import{join}from'node:path';import{createHash}from'node:crypto';
import{readP040Binding}from'../lib/nms-l02-p040-binding.server';
test('ordinary exact file accepted; drift, symlinks, hardlinks, escapes and provider modes rejected',()=>{
 const env=process.env as Record<string,string|undefined>;
 const root=realpathSync(mkdtempSync(join(tmpdir(),'p040-binding-'))),file=join(root,'source.bin'),raw=Buffer.from('bounded-p040-source'),pin={path:'source.bin',bytes:raw.length,sha256:createHash('sha256').update(raw).digest('hex')},oldNode=env.NODE_ENV,oldVercel=env.VERCEL_ENV;
 try{
  delete env.VERCEL_ENV;env.NODE_ENV='development';writeFileSync(file,raw);assert.deepEqual(readP040Binding(root,pin),raw);
  assert.throws(()=>readP040Binding(root,{...pin,sha256:'0'.repeat(64)}),/P040_INPUT_IDENTITY/);
  assert.throws(()=>readP040Binding(root,{...pin,path:'../outside.bin'}),/P040_INPUT_SCOPE/);
  symlinkSync(file,join(root,'alias'));assert.throws(()=>readP040Binding(root,{...pin,path:'alias'}),/P040_INPUT_SCOPE/);
  linkSync(file,join(root,'hard'));assert.throws(()=>readP040Binding(root,pin),/P040_INPUT_IDENTITY/);rmSync(join(root,'hard'));
  env.NODE_ENV='production';assert.throws(()=>readP040Binding(root,pin),/P040_INPUT_SCOPE/);
  env.NODE_ENV='development';env.VERCEL_ENV='preview';assert.throws(()=>readP040Binding(root,pin),/P040_INPUT_SCOPE/);
 }finally{if(oldNode===undefined)delete env.NODE_ENV;else env.NODE_ENV=oldNode;if(oldVercel===undefined)delete env.VERCEL_ENV;else env.VERCEL_ENV=oldVercel;rmSync(root,{recursive:true,force:true});}
});
