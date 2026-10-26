/** Exact P033-P037 October8 maintenance delta; historical native claims remain historical. */
import assert from 'node:assert/strict';
import {readPin,readJsonPin,uniquePins} from './g678-admission-proof.mjs';
export const L8_WAVE_MAINTAINED_REVISION={"path":"output/g678-wave-maintained-revision-20261008-v1/reviewed-implementation-revision-v2.json","bytes":82232,"sha256":"e6be0609da1de5032aac9f334b3d9585a7c494d54846ba18fb10d6c59f6e75f3"};
const IDS=['033','034','035','036','037'].map(n=>'shared-alg001-l08-p'+n);
export function validateReviewedWaveNativeFiles(root,id,historicalFiles,historicalEvidence){
 const revision=readJsonPin(root,L8_WAVE_MAINTAINED_REVISION);
 assert.equal(revision.kind,'g678-l08-p033-p037-reviewed-maintenance-v1');
 assert.deepEqual(revision.animationIds,IDS);assert.equal(revision.canonicalWrites,false);assert.equal(revision.registrationDelta,0);
 assert.equal(revision.sourceModelsChanged,false);assert.equal(revision.nativeDecoderBindingsChanged,false);assert.equal(revision.sharedClocksChanged,false);
 const page=revision.pages.find(p=>p.animationId===id);assert(page&&IDS.includes(id),'exact reviewed member');
 assert.deepEqual(page.historicalNativeFiles,historicalFiles,'original NATIVE_FILES retain historical identity');
 assert.deepEqual(page.historicalEvidence,historicalEvidence,'old source/model/native review bindings remain exact');
 const targets=readJsonPin(root,page.historicalTargets);
 assert.equal(targets.canonicalWrites,false);
 if(page.originalHistoricalTargets){
  assert.equal(id,'shared-alg001-l08-p035','only the known historical vector comment successor');
  const native=readJsonPin(root,page.originalHistoricalTargets),comment=readJsonPin(root,page.existingCommentSuccessor);
  const differences=targets.files.filter((t,i)=>JSON.stringify(t)!==JSON.stringify(native.files[i]));
  assert.equal(targets.files.length,native.files.length);assert.equal(differences.length,1);
  const row=differences[0];assert.equal(row.target,'packages/demos/src/alg-l08-p035-vector-v1.ts');
  assert.deepEqual(row.draft,comment.newDraft);assert.deepEqual(row.nativeFrozenDraft,comment.oldFrozen);assert.deepEqual(row.commentOnlySuccessor,page.existingCommentSuccessor);
  assert.equal(readPin(root,comment.newDraft).toString().replace(comment.commentAfter,comment.commentBefore),readPin(root,comment.oldFrozen).toString());readPin(root,comment.diff);
 }
 const original=new Map(targets.files.map(row=>[row.target,row.draft]));
 assert.equal(new Set(page.changes.map(c=>c.target)).size,page.changes.length);
 for(const c of page.changes){
  assert(historicalFiles.some(p=>p.path===c.target),'only existing page-owned native target');
  assert.equal(c.animationId,id);assert.equal(c.after.path,c.target);
  assert.deepEqual(c.before,historicalFiles.find(p=>p.path===c.target));
  assert.deepEqual({...c.snapshot,path:c.target},c.before);
  assert.deepEqual({...c.draft,path:c.target},c.after);
  readPin(root,c.snapshot);readPin(root,c.draft);readPin(root,c.patch);
  assert.notEqual(c.before.sha256,c.after.sha256);
  assert(c.target===`packages/demos/src/alg-l08-p${id.slice(-3)}-session-v1.ts`||
   ['034','036','037'].includes(id.slice(-3))&&c.target===`packages/demos/src/alg-l08-p${id.slice(-3)}-presentation-v1.tsx`,'bounded reviewed behavior or accessible description delta');
 }
 const currentFiles=historicalFiles.map(old=>{
  const snapshot=original.get(old.path);assert(snapshot,'original native draft retained');
  assert.deepEqual({...snapshot,path:old.path},old);readPin(root,snapshot);
  const changed=page.changes.find(c=>c.target===old.path),current=changed?.after??old;
  readPin(root,current);return current;
 });
 for(const p of revision.evidence)readPin(root,p);
 for(const p of revision.externalEvidence)readPin(p.root,p.pin);
 const review=readJsonPin(root,revision.independentImplementationReview);
 assert(review.pass_===true&&review.preparedOnly===true&&review.canonicalWrites===false);
 assert.deepEqual(review.subjects,revision.implementationSubjects);
 assert.deepEqual(review.changedTargets,revision.pages.flatMap(p=>p.changes.map(c=>c.after)).sort((a,b)=>a.path.localeCompare(b.path)));
 assert.equal(review.reviews.length,2);for(const [i,p]of review.reviews.entries()){const reviewed=readJsonPin(root,p);assert(reviewed.pass_===true&&reviewed.preparedOnly===true&&(reviewed.canonicalWrites??reviewed.boundaries?.canonicalWrites)===false);assert.deepEqual(reviewed.subjectManifest,review.subjects[i]);}
 return {currentFiles,binding:{revision:L8_WAVE_MAINTAINED_REVISION,animationId:id,changes:page.changes.map(({target,before,after})=>({target,before,after})),historicalNativeReview:historicalEvidence.nativeReview,currentSourceProofRequired:true,downstreamAcceptance:false},
  externalEvidence:revision.externalEvidence,evidence:uniquePins([L8_WAVE_MAINTAINED_REVISION,page.historicalTargets,revision.independentImplementationReview,...revision.evidence,...page.changes.flatMap(c=>[c.snapshot,c.draft,c.patch])])};
}
