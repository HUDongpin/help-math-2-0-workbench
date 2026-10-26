import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {test} from 'node:test';
import {splitAdmissionDescriptor} from '../lib/g678-split-admission.server';
import {getWorkspaceRoot} from '../lib/catalog';
const baseline=JSON.parse(readFileSync(path.join(getWorkspaceRoot(),'output/g678-admission-decoupling-20260927/legacy-baseline.json'),'utf8'));
for(const page of baseline.pages) test(`${page.id}: real formal descriptor equals pre-transition product`,()=>{
 assert.deepEqual(JSON.parse(JSON.stringify(splitAdmissionDescriptor(page.id))),page.descriptor);
});
test('production guard rejects admission before reading proof or source',()=>{
 const before=process.env.NODE_ENV;
 try {Object.assign(process.env,{NODE_ENV:'production'});assert.throws(()=>splitAdmissionDescriptor(baseline.pages[0].id),/LOCAL_ONLY/);}
 finally {if(before===undefined)delete (process.env as Record<string,string|undefined>).NODE_ENV;else Object.assign(process.env,{NODE_ENV:before});}
});
