import assert from 'node:assert/strict';
import {test} from 'node:test';
import {admissionSourcePins} from './g678-admission-proof.mjs';

const source={path:'G6-G8-shared/ALG001/L7/IR/L7IR01.swf',bytes:72497,
 sha256:'cef7d8d01efa3a8cc1f2a6d6e6334213c23892e0375bdac72624fd6979c16821'};
const sourceXml={path:'G6-G8-shared/ALG001/L7/index.xml',bytes:13727,
 sha256:'5eac052615476e688afc1e69391c17bb0c20db8200e7be3f7ea1f9bb778d85f6'};
const extracted={path:'migrations/shared-alg001-l07-p001/source-v1/source-stream-142.mp3',
 bytes:57070,sha256:'6ac6c824b8877f0365fb3ee878b2ba08e5015c44aa5e33fa3e9acc19dbe2e856'};
const packet=()=>({source,sourceXml,selectedPages:[{animationId:'shared-alg001-l07-p001'}],
 sourceAudio:{kind:'embedded-source-stream-v1',sourceCharacterId:142,extracted},
 integrity:{files:[extracted]}});
test('embedded source stream retains SWF/XML physical custody and exact derived MP3',()=>{
 assert.deepEqual(admissionSourcePins(packet()),[source,sourceXml]);
});
test('missing, different, traversing or ambiguous derived stream fails closed',()=>{
 const missing=packet();missing.integrity.files=[];
 assert.throws(()=>admissionSourcePins(missing),/derived-input closure/);
 const different=packet();different.sourceAudio.extracted={...extracted,sha256:'a'.repeat(64)};
 assert.throws(()=>admissionSourcePins(different),/derived-input closure/);
 const traversal=packet();traversal.sourceAudio.extracted={...extracted,
  path:'migrations/shared-alg001-l07-p001/source-v1/../source-stream-142.mp3'};
 assert.throws(()=>admissionSourcePins(traversal),/bounded extracted stream/);
 const ambiguous=packet();ambiguous.optionalSpanishAudio={source};
 assert.throws(()=>admissionSourcePins(ambiguous),/unambiguous source audio/);
});
test('wrong source character is rejected by the P001 semantic reader',async()=>{
 const {assertP001SourceAudio}=await import('./alg-l07-p001-admission-semantics-v1.mjs');
 const wrong=packet();wrong.sourceAudio.sourceCharacterId=141;
 assert.throws(()=>assertP001SourceAudio(wrong.sourceAudio,extracted));
});
