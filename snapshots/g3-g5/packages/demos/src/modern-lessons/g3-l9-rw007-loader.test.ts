import {test} from 'node:test';import assert from 'node:assert/strict';
import {loadRw007Scene} from './g3-l9-rw007-loader';
import {RW007} from './g3-l9-rw007-config';
import {RW007_SCENE} from './generated/g3-l9-rw007-scene-v1';

test('loader rejects mismatched provenance, cleans both DOM callbacks on failure, retries, then cleans success callbacks and shares the one promise',async()=>{
  const savedDocument=Object.getOwnPropertyDescriptor(globalThis,'document');
  const savedRegistry=Object.getOwnPropertyDescriptor(globalThis,'HELP_MATH_HD_CANVAS_ASSETS');
  const scripts:any[]=[];let current:any=null,readyCalls=0;
  const documentMock={baseURI:'http://localhost/',querySelector:()=>current,createElement:()=>{
    let src='';const script:any={dataset:{},onload:null,onerror:null,remove(){if(current===script)current=null;}};
    Object.defineProperty(script,'src',{get:()=>src,set:(value:string)=>{src=new URL(value,documentMock.baseURI).href;}});return script;
  },head:{appendChild:(script:any)=>{scripts.push(script);current=script;}}};
  Object.defineProperty(globalThis,'document',{configurable:true,value:documentMock});
  Object.defineProperty(globalThis,'HELP_MATH_HD_CANVAS_ASSETS',{configurable:true,value:{}});
  try {
    current={src:'http://localhost/wrong.js',integrity:'wrong',crossOrigin:'anonymous',dataset:{}};
    await assert.rejects(loadRw007Scene(),/integrity binding changed/);assert.equal(scripts.length,0);current=null;
    const failed=loadRw007Scene(),first=scripts[0];assert.equal(typeof first.onload,'function');assert.equal(typeof first.onerror,'function');
    first.onerror();await assert.rejects(failed,/could not load/);assert.equal(first.onload,null);assert.equal(first.onerror,null);assert.equal(current,null);
    const promise=loadRw007Scene(),second=scripts[1];assert.equal(loadRw007Scene(),promise);
    assert.ok(second.integrity.startsWith('sha256-'));assert.ok(second.src.includes(RW007_SCENE.sha256));assert.equal(second.crossOrigin,'anonymous');
    const adapter={metadata:{animationId:RW007.animationId,sourceSwfSha256:RW007.sourceSwfSha256,
      resolution:{schemaVersion:1,mode:'adaptive-integer',nativeWidth:800,nativeHeight:600,supportedScales:[1,2]}},ready:async()=>{readyCalls++;},render(){},renderWithText(){}};
    (globalThis as any).HELP_MATH_HD_CANVAS_ASSETS[RW007_SCENE.variantId]=adapter;
    second.onload();assert.equal(second.onload,null);assert.equal(second.onerror,null);assert.equal(await promise,adapter);assert.equal(readyCalls,1);
    assert.equal(await loadRw007Scene(),adapter);assert.equal(scripts.length,2);
  }finally {
    if(savedDocument)Object.defineProperty(globalThis,'document',savedDocument);else delete (globalThis as any).document;
    if(savedRegistry)Object.defineProperty(globalThis,'HELP_MATH_HD_CANVAS_ASSETS',savedRegistry);else delete (globalThis as any).HELP_MATH_HD_CANVAS_ASSETS;
  }
});
