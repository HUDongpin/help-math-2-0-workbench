import {test} from 'node:test';import assert from 'node:assert/strict';
import {parseP052CaptureQuery} from '../../../apps/web/lib/nms-l02-p052-capture-query';
import {P052_CAPTURE_IDENTITIES} from '../src/generated/nms-l02-p052-capture-identities-v1';
const trace='candidate-glossary-column-es-seed-0';
const query={capture:'1',frameDomain:'sprite-350',scenario:'glossary-column',frame:'115',lang:'es',seed:'0',rootFrame:'6',requirementId:`req-${trace}`,trace,entryStateSha256:P052_CAPTURE_IDENTITIES[trace]};
test('empty query retains playback; complete candidate query binds exact identity',()=>{
 assert.equal(parseP052CaptureQuery({},'es'),null);
 const result=parseP052CaptureQuery(query,'es')!;assert.equal(result.frame,115);assert.equal(result.traceId,trace);
});
test('missing, duplicate, unknown, malformed and crossed capture inputs never become playback',()=>{
 for(const key of Object.keys(query)){const missing={...query};delete missing[key as keyof typeof missing];assert.throws(()=>parseP052CaptureQuery(missing,'es'));}
 for(const delta of [{frame:['115','116']},{extra:'1'},{capture:'0'},{frame:'115.0'},{frame:' 115'},
  {frame:'0115'},{seed:'-1'},{frameDomain:'root'},{lang:'en'},{entryStateSha256:'a'.repeat(64)}]){
  assert.throws(()=>parseP052CaptureQuery({...query,...delta},'es'));
 }
});
test('host language link retains live playback without weakening capture identity',()=>{
 for(const locale of ['en','es'])assert.equal(parseP052CaptureQuery({mode:'focus'},locale),null);
 for(const input of [{mode:['focus','focus']},{mode:'classroom'},{mode:''},{mode:'focus',capture:'1'},
  {mode:'focus',extra:'1'},{...query,mode:'focus'}])assert.throws(()=>parseP052CaptureQuery(input,'es'));
});
