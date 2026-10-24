import test from 'node:test';
import assert from 'node:assert/strict';
import {admissionArtifactPins,admissionSourcePins} from '../../lib/g678-admission-proof.mjs';
const pin=path=>({path,bytes:123,sha256:'a'.repeat(64)});
const native=()=>({artifacts:{kind:'maintained-dom-module-v1',module:pin('module.tsx'),timeline:pin('timeline.ts'),memberManifest:pin('member.json'),sourceRun:pin('run.json')}});
const audio=()=>({source:pin('page.swf'),sourceXml:pin('index.xml'),sourceAudio:{kind:'question-option-source-audio-v1',sources:Array.from({length:240},(_,i)=>pin(`FQ/${i}.mp3`))}});
test('legacy Canvas and single-SA closures are unchanged',()=>{
 const artifacts={module:pin('module.ts'),timeline:pin('timeline.ts'),runtime:pin('runtime.js')};
 assert.deepEqual(admissionArtifactPins({artifacts}),Object.values(artifacts));
 const packet={source:pin('page.swf'),sourceXml:pin('index.xml'),optionalSpanishAudio:{source:pin('SA.mp3')}};
 assert.deepEqual(admissionSourcePins(packet),[packet.source,packet.sourceXml,packet.optionalSpanishAudio.source]);
});
test('native renderer tag resolves exactly four actual file pins',()=>{
 const n=native();assert.equal(admissionArtifactPins(n).length,4);
 for(const mutate of [n=>n.artifacts.kind='unknown',n=>delete n.artifacts.memberManifest,n=>n.artifacts.runtime=pin('fake.js'),n=>n.artifacts.module.sha256='invalid',n=>n.artifacts.sourceRun=n.artifacts.memberManifest]){const n=native();mutate(n);assert.throws(()=>admissionArtifactPins(n));}
});
test('question/option source audio retains every distinct original pin',()=>{
 const packet=audio();assert.equal(admissionSourcePins(packet).length,242);
 for(const mutate of [p=>p.optionalSpanishAudio={source:pin('SA.mp3')},p=>p.sourceAudio.kind='single-sa',p=>p.sourceAudio.sources=[],p=>p.sourceAudio.sources.push(p.sourceAudio.sources[0]),p=>p.sourceAudio.sources[0].bytes=0,p=>p.sourceAudio.guessed=true]){const p=audio();mutate(p);assert.throws(()=>admissionSourcePins(p));}
});
