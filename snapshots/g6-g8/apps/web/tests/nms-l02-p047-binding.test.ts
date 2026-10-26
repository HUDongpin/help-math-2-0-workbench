import test from 'node:test';
import assert from 'node:assert/strict';
import {realpathSync,mkdtempSync,writeFileSync,symlinkSync,linkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {readP047Binding} from '../lib/nms-l02-p047-binding.server';
test('binding rejects byte drift, symlinks, hardlinks and production before serving source',()=>{
 const root=realpathSync(mkdtempSync(path.join(tmpdir(),'p047-binding-'))),old=process.env.NODE_ENV,vercel=process.env.VERCEL_ENV;
 try{Reflect.set(process.env,'NODE_ENV','development');delete process.env.VERCEL_ENV;
 const data=Buffer.from('bounded fixture'),file=path.join(root,'source');writeFileSync(file,data);
 const pin={path:'source',bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')};assert.deepEqual(readP047Binding(root,pin),data);
 assert.throws(()=>readP047Binding(root,{...pin,sha256:'0'.repeat(64)}),/IDENTITY/);
 assert.throws(()=>readP047Binding(root,{...pin,bytes:pin.bytes+1}),/IDENTITY/);
 assert.throws(()=>readP047Binding(root,{...pin,bytes:-1}),/PIN/);
 assert.throws(()=>readP047Binding(root,{...pin,sha256:'invalid'}),/PIN/);
 assert.throws(()=>readP047Binding(root,{...pin,path:'../outside'}),/SCOPE/);
 symlinkSync(file,path.join(root,'alias'));assert.throws(()=>readP047Binding(root,{...pin,path:'alias'}),/SCOPE/);
 linkSync(file,path.join(root,'hard'));assert.throws(()=>readP047Binding(root,pin),/IDENTITY/);rmSync(path.join(root,'hard'));
 writeFileSync(file,Buffer.from('drifted fixture'));assert.throws(()=>readP047Binding(root,pin),/IDENTITY/);
 Reflect.set(process.env,'NODE_ENV','production');assert.throws(()=>readP047Binding(root,pin),/SCOPE/);
 Reflect.set(process.env,'NODE_ENV','development');process.env.VERCEL_ENV='preview';assert.throws(()=>readP047Binding(root,pin),/SCOPE/);
 }finally{if(old===undefined)Reflect.deleteProperty(process.env,'NODE_ENV');else Reflect.set(process.env,'NODE_ENV',old);if(vercel===undefined)delete process.env.VERCEL_ENV;else process.env.VERCEL_ENV=vercel;rmSync(root,{recursive:true,force:true});}
});
