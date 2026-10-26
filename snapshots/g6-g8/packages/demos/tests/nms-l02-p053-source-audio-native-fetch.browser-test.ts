import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {build} from 'esbuild';
import {chromium} from 'playwright';
import {P053_SOURCE_AUDIO_BYTES,P053_SOURCE_AUDIO_SHA256,P053_SOURCE_AUDIO_URL}
 from '../src/nms-l02-p053-source-audio-loader';

const AUDIO='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/p053-source-stream-product-v1/sprite-187-source-stream-v1.mp3';
const ORIGIN='http://127.0.0.1:3332';

test('default transport invokes native Window.fetch with exact source audio response',async()=>{
 const chrome=process.env.CHROME_PATH??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
 assert.ok(existsSync(chrome),`Chrome is required for the native fetch regression: ${chrome}`);
 const bytes=readFileSync(AUDIO);
 assert.equal(bytes.length,P053_SOURCE_AUDIO_BYTES);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),P053_SOURCE_AUDIO_SHA256);
 const bundle=await build({stdin:{contents:`import {loadP053SourceAudio} from './packages/demos/src/nms-l02-p053-source-audio-loader';
 window.__loadP053SourceAudio=()=>loadP053SourceAudio(new AbortController().signal);`,
  resolveDir:path.resolve('.'),sourcefile:'p053-native-fetch-harness.ts',loader:'ts'},
  bundle:true,platform:'browser',format:'iife',write:false,logLevel:'silent'});
 const browser=await chromium.launch({headless:true,executablePath:chrome});
 try{
  const page=await browser.newPage();
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  const requests:string[]=[];
  await page.route(`${ORIGIN}/p053-native-fetch-test`,route=>route.fulfill({
   status:200,contentType:'text/html',body:'<!doctype html><title>P053 audio fetch</title>',
  }));
  await page.route(`${ORIGIN}${P053_SOURCE_AUDIO_URL}`,route=>{
   requests.push(`${route.request().method()} ${route.request().url()}`);
   return route.fulfill({status:200,body:bytes,headers:{
    'content-type':'audio/mpeg','content-length':String(bytes.length),
   }});
  });
  await page.goto(`${ORIGIN}/p053-native-fetch-test`);
  await page.addScriptTag({content:bundle.outputFiles[0]!.text});
  const blob=await page.evaluate('window.__loadP053SourceAudio().then(blob=>({size:blob.size,type:blob.type}))');
  assert.deepEqual(blob,{size:P053_SOURCE_AUDIO_BYTES,type:'audio/mpeg'});
  assert.deepEqual(requests,[`GET ${ORIGIN}${P053_SOURCE_AUDIO_URL}`]);
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
