import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildGlossaryPairInputs,PAIR_OUTPUT,physicalPairInput} from './build-g678-alg-l12-glossary-pair-inputs.mjs';
import {validatePairAudioIndex} from './build-g678-alg-l12-glossary-pair-audio.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const parse=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const source=buildGlossaryPairInputs(),audio=parse(`${PAIR_OUTPUT}/audio/raw-index.json`);
validatePairAudioIndex(audio);
const sa={p013:{sha256:'6a9c37d04b72b96753afba7e1f4f2583dafe9a35727faf9f350f034e1e093f76',bytes:248640},
 p015:{sha256:'38d5bc99348053895392ab922dfa10517e993c68479f964c9a938244245e9a30',bytes:109200}};
const pages=source.pages.map(page=>{
 const short=page.animationId.split('-').at(-1),base=`${PAIR_OUTPUT}/native-candidates/${short}`;
 const meta=parse(`${base}/runtime-meta.json`);
 assert.equal(meta.animationId,page.animationId);assert.equal(meta.sourceSwfSha256,page.source.sha256);
 assert.equal(meta.renderScale,2);assert.deepEqual(meta.requiredCanvas,{width:1600,height:1200});
 const graphics=physicalPairInput(path.join(ROOT,base,'canvas-renderer.js'),{sha256:meta.runtimeSha256,bytes:meta.runtimeBytes}).pin;
 const main=physicalPairInput(path.join(ROOT,PAIR_OUTPUT,'audio',`${short}-main-${page.frameDomain}.mp3`),audio.pages[page.animationId].mp3).pin;
 const spanish=physicalPairInput(page.source.path.replace('/VB/','/SA/').replace(/\.swf$/,'.mp3'),sa[short]).pin;
 return {animationId:page.animationId,source:page.source,frameDomain:page.frameDomain,frameCount:page.frameCount,
  resources:{'typography.js':{...graphics,contentType:'text/javascript; charset=utf-8'},
   'main.mp3':{...main,contentType:'audio/mpeg'},'spanish-audio.mp3':{...spanish,contentType:'audio/mpeg'}}};
});
const receipt={schemaVersion:1,kind:'alg-l12-glossary-pair-host-resources-v1',registered:false,pages};
const client=pages.map(p=>({animationId:p.animationId,sourceSha256:p.source.sha256,runtimeSha256:p.resources['typography.js'].sha256}));
for(const [relative,value]of [[`${PAIR_OUTPUT}/host-resources-v1.json`,receipt],['packages/demos/src/generated/alg-l12-glossary-pair-native-assets.json',client]]){
 const file=path.join(ROOT,relative),bytes=JSON.stringify(value,null,2)+'\n';
 if(process.argv[2]==='--write'&&!fs.existsSync(file))fs.writeFileSync(file,bytes,{flag:'wx'});
 else assert.equal(fs.readFileSync(file,'utf8'),bytes,'current host asset bytes');
}
console.log('Two source-bound local resource sets prepared; no registration.');
