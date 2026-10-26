import assert from 'node:assert/strict';
import test from 'node:test';
import {nmsL02P062AdmissionDescriptor} from '../lib/nms-l02-p062-admission.server';

const sourceRoot='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const pin={path:'invalid',bytes:1,sha256:'0'.repeat(64)};

test('P062 absent activation fails closed before reading a proof',()=>{
 assert.throws(()=>nmsL02P062AdmissionDescriptor(null),/NMS_L02_P062_ADMISSION_LOCAL_ONLY/u);
});

test('P062 rejects production and malformed activation before reading proof',()=>{
 const env=process.env as Record<string,string|undefined>;
 const oldSource=process.env.HELP_MATH_G678_SOURCE_ROOT;
 const oldNode=env.NODE_ENV;
 try{
  process.env.HELP_MATH_G678_SOURCE_ROOT=sourceRoot;
  env.NODE_ENV='production';
  assert.throws(()=>nmsL02P062AdmissionDescriptor({schemaVersion:1,stage:'candidate',
   predecessor:pin,host:pin,page:pin}),/NMS_L02_P062_ADMISSION_LOCAL_ONLY/u);
  env.NODE_ENV='test';
  assert.throws(()=>nmsL02P062AdmissionDescriptor({schemaVersion:1,stage:'candidate',
   predecessor:pin,host:pin,page:pin}),/NMS_L02_P062_ADMISSION_BINDING/u);
 }finally{
  if(oldSource===undefined)delete process.env.HELP_MATH_G678_SOURCE_ROOT;
  else process.env.HELP_MATH_G678_SOURCE_ROOT=oldSource;
  if(oldNode===undefined)delete env.NODE_ENV;
  else env.NODE_ENV=oldNode;
 }
});
