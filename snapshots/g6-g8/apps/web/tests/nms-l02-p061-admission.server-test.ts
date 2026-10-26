import assert from 'node:assert/strict';
import test from 'node:test';
import {nmsL02P061AdmissionDescriptor} from '../lib/nms-l02-p061-admission.server';

const sourceRoot='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const pin={path:'invalid',bytes:1,sha256:'0'.repeat(64)};

test('P061 absent activation fails closed before reading a proof',()=>{
 assert.throws(()=>nmsL02P061AdmissionDescriptor(null),/NMS_L02_P061_ADMISSION_LOCAL_ONLY/u);
});

test('P061 rejects production and malformed activation before reading proof',()=>{
 const env=process.env as Record<string,string|undefined>;
 const oldSource=process.env.HELP_MATH_G678_SOURCE_ROOT;
 const oldNode=env.NODE_ENV;
 try{
  process.env.HELP_MATH_G678_SOURCE_ROOT=sourceRoot;
  env.NODE_ENV='production';
  assert.throws(()=>nmsL02P061AdmissionDescriptor({schemaVersion:1,stage:'candidate',
   predecessor:pin,host:pin,page:pin}),/NMS_L02_P061_ADMISSION_LOCAL_ONLY/u);
  env.NODE_ENV='test';
  assert.throws(()=>nmsL02P061AdmissionDescriptor({schemaVersion:1,stage:'candidate',
   predecessor:pin,host:pin,page:pin}),/NMS_L02_P061_ADMISSION_BINDING/u);
 }finally{
  if(oldSource===undefined)delete process.env.HELP_MATH_G678_SOURCE_ROOT;
  else process.env.HELP_MATH_G678_SOURCE_ROOT=oldSource;
  if(oldNode===undefined)delete env.NODE_ENV;
  else env.NODE_ENV=oldNode;
 }
});
