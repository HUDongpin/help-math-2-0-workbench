import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {p028PacketSource,readCanonicalSource,validateCandidateBinding,
 validateFormalReaderSourceShape,validateSourceEvidence}
 from './alg-l06-p028-admission-semantics-v1.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const clone=value=>structuredClone(value);
function fixture(){
 const source=readCanonicalSource(root);
 const {binding,bindingPin,...e}=source;
 return {source,e,binding};
}

test('P028 root packet and physical source evidence match exact ownership',()=>{
 const {source,e,binding}=fixture();
 assert.equal(validateSourceEvidence(e),true);
 assert.equal(validateCandidateBinding(binding,source),true);
 assert.equal(source.browserDecode.results[0].samples,243648);
 assert.equal(source.browserDecode.results[1].samples,129024);
});

test('source identity, button order and audio ownership drift fail closed',()=>{
 const {e}=fixture();
 const swapped=clone(e);swapped.sourcePlan.glossary.reverse();
 assert.throws(()=>validateSourceEvidence(swapped),/three source glossary buttons/);
 const moved=clone(e);moved.sourcePlan.identity.globalActiveOrdinal=29;
 assert.throws(()=>validateSourceEvidence(moved),/source-ordered P028 identity/);
 const spliced=clone(e);spliced.audioPlan.optionalSpanishAudio.joinedWithMain=true;
 assert.throws(()=>validateSourceEvidence(spliced),/independent optional Spanish audio/);
 const fakePcm=clone(e);fakePcm.browserDecode.results[0].pcmSha256='0'.repeat(64);
 assert.throws(()=>validateSourceEvidence(fakePcm),/actual Chrome PCM decode/);
});

test('packet duplicate, changed host and artifact ambiguity fail closed',()=>{
 const {source,binding}=fixture();
 const duplicate=clone(binding);duplicate.files.push(duplicate.files[0]);
 assert.throws(()=>validateCandidateBinding(duplicate,source),
  /unique sorted packet input pins/);
 const host=clone(binding);host.predecessorHost.sha256='0'.repeat(64);
 assert.throws(()=>validateCandidateBinding(host,source),
  /root-owned exact candidate identity/);
 const runtime=clone(binding);runtime.artifacts.runtime.sha256='0'.repeat(64);
 assert.throws(()=>validateCandidateBinding(runtime,source),
  /factory runtime is reviewed Canvas bytes/);
});

test('draft packet matches maintained formal reader source shape',()=>{
 const {source}=fixture(),packet=p028PacketSource(source);
 assert.equal(validateFormalReaderSourceShape(packet,source),true);
 assert.deepEqual(Object.keys(packet.glossaryActions),
  ['Relation','Set','Ordered pair']);
 assert.equal(packet.optionalSpanishAudio.mainStreamSpliced,false);
 const oldShape=clone(packet);delete oldShape.optionalSpanishAudio.mainStreamSpliced;
 oldShape.optionalSpanishAudio.joinedWithMain=false;
 assert.throws(()=>validateFormalReaderSourceShape(oldShape,source),
  /formal reader source field optionalSpanishAudio/);
 const ambiguous=clone(packet);ambiguous.glossaryActions={keys:[]};
 assert.throws(()=>validateFormalReaderSourceShape(ambiguous,source),
  /formal reader source field glossaryActions/);
});
