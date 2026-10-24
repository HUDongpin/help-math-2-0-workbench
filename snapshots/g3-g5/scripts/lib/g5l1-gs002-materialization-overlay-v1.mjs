import assert from 'node:assert/strict';
import {readFile, lstat} from 'node:fs/promises';
import path from 'node:path';
import {brotliDecompressSync} from 'node:zlib';
import {generateG5L1Gs002EndStage, G5L1_GS002_ASSET_PATH, G5L1_GS002_BASE_BYTES, G5L1_GS002_BASE_SHA256,
  G5L1_GS002_EFFECTIVE_BYTES, G5L1_GS002_EFFECTIVE_SHA256, G5L1_GS002_SWF_SHA256, G5L1_GS002_IR_SHA256, digest} from './g5l1-gs002-sprite457-end-stage-v1.mjs';

export const G5L1_GS002_TRANSFORM_ROOT = 'catalog/runtime-transforms/g5l1-gs002-sprite457-split-v1';
export const G5L1_GS002_MANIFEST_PATH = G5L1_GS002_TRANSFORM_ROOT + '/manifest.json';
export const G5L1_GS002_GENERATOR_PATH = 'scripts/lib/g5l1-gs002-sprite457-end-stage-v1.mjs';
export const G5L1_GS002_IR_PATH = G5L1_GS002_TRANSFORM_ROOT + '/ir.json';
export const G5L1_GS002_RETAINED_BASE_PATH = G5L1_GS002_TRANSFORM_ROOT + '/base/canvas-renderer.js.br';
export const G5L1_GS002_PUBLIC_PATH = 'apps/web/public/current-js-preview-assets/' + G5L1_GS002_ASSET_PATH;
export const G5L1_GS002_CANDIDATE_PATH = 'apps/web/candidate-assets/flash-assets/2026-08-22-page-only-candidates-v1/' + G5L1_GS002_ASSET_PATH;
export const G5L1_GS002_ACCEPTANCE_KEYS = Object.freeze(['authoritativeOriginalRuntime', 'behaviorParityAccepted', 'visualFidelityAccepted', 'audioAccepted', 'humanVisualAccepted', 'ownerAccepted', 'strictComplete', 'releaseEligible', 'published']);
const MODES = ['parity', 'replay-pixels', 'playback', 'heap'];
const REPORT_NAMES = ['run.json', 'comparison.json', 'original-report.json', 'variant-report.json'];
export const G5L1_GS002_PROOF_PINS = Object.freeze([
  {
    "path": "catalog/runtime-transforms/g5l1-gs002-sprite457-split-v1/proofs/source-static-verification.json",
    "bytes": 337814,
    "sha256": "0a3ec29d5b28ba759f6da4f6c1e5233a0298bf513eeb8f6d8240db6e7e195f83"
  },
  {
    "path": "catalog/runtime-transforms/g5l1-gs002-sprite457-split-v1/proofs/prototype-source-manifest.json",
    "bytes": 9482,
    "sha256": "a41073f2b02c734c6ab1497fc28d86982b2baebc3f4f94db6cef81f5787b3ff8"
  },
  {
    "path": "catalog/runtime-transforms/g5l1-gs002-sprite457-split-v1/proofs/independent-output-review.json",
    "bytes": 25203,
    "sha256": "52c6714266e803d16b3d49805eaeae23ebd3c900d84b57e1227829f1d9be42f8"
  },
  {
    "path": "catalog/runtime-transforms/g5l1-gs002-sprite457-split-v1/proofs/independent-var-control-ast-binding.json",
    "bytes": 3514,
    "sha256": "3fc037d062b2d429072c368eb2287b6f3619042d40d86a73f363f2f19908c4af"
  },
  {
    "path": "catalog/runtime-transforms/g5l1-gs002-sprite457-split-v1/proofs/browser-root-freeze.json",
    "bytes": 5096,
    "sha256": "8dc473c636c441cd9625608eaaf902d7fa83f162d16b1e6b3be184871b1fd5f0"
  },
  {
    "path": "catalog/runtime-transforms/g5l1-gs002-sprite457-split-v1/proofs/prototype-preservation-manifest.json",
    "bytes": 760851,
    "sha256": "e683bbce2b6f527ae40bec8d78227995e1ea0e557c2dbd8bdfbc1d6aa530db73"
  },
  {
    "path": "catalog/runtime-transforms/g5l1-gs002-sprite457-split-v1/proofs/prototype-copy-receipt.json",
    "bytes": 4626,
    "sha256": "1f4c04be39aa121d62abd8818803cae25a173741852ec5e186ba260fe4a38838"
  },
  {
    "path": "catalog/runtime-transforms/g5l1-gs002-sprite457-split-v1/proofs/browser-root-review.json",
    "bytes": 7726,
    "sha256": "b80319f50fed263fc7169b2ea2d2b5515a51b326668f2b246ec13b01b4429769"
  },
  {
    "path": "catalog/runtime-transforms/g5l1-gs002-sprite457-split-v1/proofs/portable-emitter-reproduction.json",
    "bytes": 8630,
    "sha256": "2686de4c2f6a688cbe900a8c8c6bd0d064f8a9a0dca619579d347767dab9ff78"
  },
  {
    "path": "catalog/runtime-transforms/g5l1-gs002-sprite457-split-v1/proofs/portable-emitter-independent-review.json",
    "bytes": 41400,
    "sha256": "c808c5efaffeb6c47f015c4c5fc198782b064b141619a1a1f18fabe6cce8294e"
  },
  {
    "path": "catalog/runtime-transforms/g5l1-gs002-sprite457-split-v1/proofs/independent-browser-linkage-review.json",
    "bytes": 8029,
    "sha256": "8f93629d3be22ba875db2c81c81d1da1cde319d8e918a4f03a4184528f087bc5"
  },
  {
    "path": "catalog/runtime-transforms/g5l1-gs002-sprite457-split-v1/proofs/browser/bundle-manifest.json",
    "bytes": 3130,
    "sha256": "7557b60b5f07db655e53faf96900e02b09891d3b04b1a8f0610945ff9242afca"
  },
  {
    "path": "catalog/runtime-transforms/g5l1-gs002-sprite457-split-v1/proofs/browser/closure.json",
    "bytes": 8561,
    "sha256": "dcc1b8f4c25cdbe658dee08264392ffd9c0ca98c2653ffe2435b1787442e2f26"
  },
  {
    "path": "catalog/runtime-transforms/g5l1-gs002-sprite457-split-v1/proofs/browser/parity/run.json",
    "bytes": 8258,
    "sha256": "79d05a07472f5877bdadbae685873cd70eab0e5e8a7a178b2c822db8bc549893"
  },
  {
    "path": "catalog/runtime-transforms/g5l1-gs002-sprite457-split-v1/proofs/browser/parity/comparison.json",
    "bytes": 754239,
    "sha256": "0f490e0624b020fc4527e3ff9723c7771f36035c215e73d62e2a70140d9c32be"
  },
  {
    "path": "catalog/runtime-transforms/g5l1-gs002-sprite457-split-v1/proofs/browser/parity/original-report.json",
    "bytes": 2409162,
    "sha256": "b110f3cc7ee1451d0bec288ab6305cbeeeba7a0e3deadebd75c9e76bdc97c3d1"
  },
  {
    "path": "catalog/runtime-transforms/g5l1-gs002-sprite457-split-v1/proofs/browser/parity/variant-report.json",
    "bytes": 2409157,
    "sha256": "5a4d92b25210a4c24cba648044fb3dd60b69703d1feb47190eea0fe5d06f8069"
  },
  {
    "path": "catalog/runtime-transforms/g5l1-gs002-sprite457-split-v1/proofs/browser/replay-pixels/run.json",
    "bytes": 8293,
    "sha256": "6841f61fb362e5d8e41639ae0700a9f1918836675da8eec58ce2265e6ddc8047"
  },
  {
    "path": "catalog/runtime-transforms/g5l1-gs002-sprite457-split-v1/proofs/browser/replay-pixels/comparison.json",
    "bytes": 9242,
    "sha256": "5b9518011fa8fea2b731b02c7d66e79a8a8f84fc2b8b559d991e533287a6de61"
  },
  {
    "path": "catalog/runtime-transforms/g5l1-gs002-sprite457-split-v1/proofs/browser/replay-pixels/original-report.json",
    "bytes": 1717998,
    "sha256": "a12343e22c3b98839f7f370f1485aaf9c9d3aa0d409d46e7d7ae67b27d52fd7d"
  },
  {
    "path": "catalog/runtime-transforms/g5l1-gs002-sprite457-split-v1/proofs/browser/replay-pixels/variant-report.json",
    "bytes": 1717993,
    "sha256": "4cc54e7a1d8c44f4be1a2e41d063d4881b9cd556b088ced98acbfec7be330430"
  },
  {
    "path": "catalog/runtime-transforms/g5l1-gs002-sprite457-split-v1/proofs/browser/playback/run.json",
    "bytes": 8267,
    "sha256": "b31a473f179744d4644dfe484bfb2aa654ec985bd57e8cc97c5c8bc9b3c5dbaa"
  },
  {
    "path": "catalog/runtime-transforms/g5l1-gs002-sprite457-split-v1/proofs/browser/playback/comparison.json",
    "bytes": 4616842,
    "sha256": "0be56e1c40ede7700ca3be51c0aeadd1990a92e1023e3e7f0fb79bf16ed6fd0c"
  },
  {
    "path": "catalog/runtime-transforms/g5l1-gs002-sprite457-split-v1/proofs/browser/playback/original-report.json",
    "bytes": 2318264,
    "sha256": "d5fdb8deaca925ec4f64f66ad016d37e8fea0726ea9ec84ef51d318d372fa676"
  },
  {
    "path": "catalog/runtime-transforms/g5l1-gs002-sprite457-split-v1/proofs/browser/playback/variant-report.json",
    "bytes": 2317287,
    "sha256": "defe2459d8f6544c67ac8712b5d8570b86793bd5b79180a918df3a5bbb22b38e"
  },
  {
    "path": "catalog/runtime-transforms/g5l1-gs002-sprite457-split-v1/proofs/browser/heap/run.json",
    "bytes": 8221,
    "sha256": "f23bfec3706e9cecfb52e794a1b18de852463feb53f15805b21d71a0362265ea"
  },
  {
    "path": "catalog/runtime-transforms/g5l1-gs002-sprite457-split-v1/proofs/browser/heap/comparison.json",
    "bytes": 19784,
    "sha256": "a6a76a907ebc35f353f4e9698b7809a2daeaac66df161bee2ddd95bc33e7faa9"
  },
  {
    "path": "catalog/runtime-transforms/g5l1-gs002-sprite457-split-v1/proofs/browser/heap/original-report.json",
    "bytes": 49648,
    "sha256": "6829a889195a610abc193874caabb524f6f2ae55105e6ef8aeeb7b1be7cbff32"
  },
  {
    "path": "catalog/runtime-transforms/g5l1-gs002-sprite457-split-v1/proofs/browser/heap/variant-report.json",
    "bytes": 49202,
    "sha256": "8d7cacb3ef968697e1d62c2d86ef7efbe0b371f68b69511924c13351136e06bc"
  }
].map(Object.freeze));
export const G5L1_GS002_PROOF_NAMES = Object.freeze(G5L1_GS002_PROOF_PINS.map(row => row.path.slice((G5L1_GS002_TRANSFORM_ROOT + '/proofs/').length)));
const COMPRESSED_BYTES = 816883;
const COMPRESSED_SHA = '60649d95abcc46e1b1bdee5f027a74932f9e24cf28c2675373e1d0bd78c38d40';
const COMMON = Object.freeze({assetPath: G5L1_GS002_ASSET_PATH, relativePath: 'course-g05-l01-gs-002/canvas-renderer.js', storageRoot: 'candidate',
  releaseId: 'lesson-g05-l01-working-with-decimals-and-percents-page-only', source: G5L1_GS002_CANDIDATE_PATH, destination: G5L1_GS002_PUBLIC_PATH});
const BASE = Object.freeze({...COMMON, bytes: G5L1_GS002_BASE_BYTES, sha256: G5L1_GS002_BASE_SHA256, compressedBytes: COMPRESSED_BYTES, compressedSha256: COMPRESSED_SHA});
const EFFECTIVE = Object.freeze({...COMMON, bytes: G5L1_GS002_EFFECTIVE_BYTES, sha256: G5L1_GS002_EFFECTIVE_SHA256});

export function g5l1Gs002Keys(record, names, label) {
  assert(record && typeof record === 'object' && !Array.isArray(record), label);
  assert.equal(Object.getPrototypeOf(record), Object.prototype, label + ' must be JSON');
  const actual = Reflect.ownKeys(record); assert(actual.every(key => typeof key === 'string'));
  assert.deepEqual(actual.sort(), [...names].sort(), label + ' has missing or unknown fields');
  assert(Object.values(Object.getOwnPropertyDescriptors(record)).every(d => Object.hasOwn(d, 'value')), label + ' accessor rejected');
}
export function g5l1Gs002Reference(record, expectedPath, label) {
  g5l1Gs002Keys(record, ['path', 'bytes', 'sha256'], label); assert.equal(record.path, expectedPath);
  assert(Number.isSafeInteger(record.bytes) && record.bytes > 0 && record.bytes < 32 * 1024 * 1024);
  assert(typeof record.sha256 === 'string' && /^[a-f0-9]{64}$/.test(record.sha256));
}
export async function g5l1Gs002SafePath(root, relative, {allowMissing = false} = {}) {
  assert(typeof relative === 'string' && !path.isAbsolute(relative) && relative.split('/').every(part => /^[A-Za-z0-9._-]+$/.test(part) && part !== '.' && part !== '..'), 'Unsafe maintained path');
  const target = path.resolve(root, relative); let current = path.parse(target).root;
  for (const part of target.slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    let status; try { status = await lstat(current); } catch (error) { if (allowMissing && error.code === 'ENOENT') return target; throw error; }
    assert(!status.isSymbolicLink(), 'Maintained path has a symlink: ' + current);
    if (current !== target) assert(status.isDirectory(), 'Maintained ancestor is not a directory');
    else assert(status.isFile(), 'Maintained path must be a regular file');
  }
  return target;
}
export async function g5l1Gs002ReadReference(root, reference) {
  const target = await g5l1Gs002SafePath(root, reference.path), bytes = await readFile(target);
  assert.equal(bytes.length, reference.bytes, 'Referenced size mismatch: ' + reference.path);
  assert.equal(digest(bytes), reference.sha256, 'Referenced hash mismatch: ' + reference.path);
  return bytes;
}

export function validateG5L1Gs002OverlayManifest(manifest) {
  g5l1Gs002Keys(manifest, ['schemaVersion','kind','transformId','generator','ir','retainedBase','target','proofs','acceptanceEffects'], 'G5 overlay');
  assert.equal(manifest.schemaVersion,1);assert.equal(manifest.kind,'single-current-js-runtime-end-stage-overlay');assert.equal(manifest.transformId,'g5l1-gs002-sprite457-split-v1');
  g5l1Gs002Reference(manifest.generator,G5L1_GS002_GENERATOR_PATH,'Generator');assert.equal(manifest.generator.bytes,9717);assert.equal(manifest.generator.sha256,'1397ace090abfa5076c24482c7b5167d43461f3ef98c1654e7f23e21727bdbfa');
  g5l1Gs002Reference(manifest.ir,G5L1_GS002_IR_PATH,'IR');assert.equal(manifest.ir.bytes,253137);assert.equal(manifest.ir.sha256,G5L1_GS002_IR_SHA256);
  g5l1Gs002Reference(manifest.retainedBase,G5L1_GS002_RETAINED_BASE_PATH,'Retained base');assert.equal(manifest.retainedBase.bytes,COMPRESSED_BYTES);assert.equal(manifest.retainedBase.sha256,COMPRESSED_SHA);
  g5l1Gs002Keys(manifest.target,['animationId','assetPath','sourceSwfSha256','base','effective','outputs'],'Target');
  assert.equal(manifest.target.animationId,'course-g05-l01-gs-002');assert.equal(manifest.target.assetPath,G5L1_GS002_ASSET_PATH);assert.equal(manifest.target.sourceSwfSha256,G5L1_GS002_SWF_SHA256);
  assert.deepEqual(manifest.target.base,{bytes:G5L1_GS002_BASE_BYTES,sha256:G5L1_GS002_BASE_SHA256,compressedBytes:COMPRESSED_BYTES,compressedSha256:COMPRESSED_SHA});
  assert.deepEqual(manifest.target.effective,{bytes:G5L1_GS002_EFFECTIVE_BYTES,sha256:G5L1_GS002_EFFECTIVE_SHA256});assert.deepEqual(manifest.target.outputs,[G5L1_GS002_PUBLIC_PATH,G5L1_GS002_CANDIDATE_PATH]);
  g5l1Gs002Keys(manifest.acceptanceEffects,G5L1_GS002_ACCEPTANCE_KEYS,'Acceptance');assert(Object.values(manifest.acceptanceEffects).every(value=>value===false));
  assert.deepEqual(manifest.proofs,G5L1_GS002_PROOF_PINS,'Exact completed G5 proof inventory required');
  manifest.proofs.forEach((row,index)=>g5l1Gs002Reference(row,G5L1_GS002_PROOF_PINS[index].path,'Proof '+index));
  return manifest.target;
}

// Read only the maintained, copied proof members. Historical source paths and PNG
// paths inside their contents are provenance, never filesystem traversal inputs.
export function verifyG5L1Gs002ProofContents(proofs) {
  assert(proofs instanceof Map);assert.equal(proofs.size,G5L1_GS002_PROOF_NAMES.length);
  const get=name=>JSON.parse(proofs.get(name));
  for(const [index,name]of G5L1_GS002_PROOF_NAMES.entries()){const bytes=proofs.get(name),pin=G5L1_GS002_PROOF_PINS[index];assert(Buffer.isBuffer(bytes));assert.equal(bytes.length,pin.bytes);assert.equal(digest(bytes),pin.sha256);}
  const bundle=get('browser/bundle-manifest.json');
  g5l1Gs002Keys(bundle,['schemaVersion','kind','reportFileCount','closure','files','totalReportBytes','sourceSha256','variantSha256','externalPngBytesIncluded','sourceProofsIncluded'],'Browser bundle');
  assert.equal(bundle.schemaVersion,1);assert.equal(bundle.kind,'g5l1-gs002-isolated-browser-proof-bundle-manifest-v1');assert.equal(bundle.reportFileCount,16);
  assert.equal(bundle.sourceSha256,G5L1_GS002_BASE_SHA256);assert.equal(bundle.variantSha256,G5L1_GS002_EFFECTIVE_SHA256);assert.equal(bundle.externalPngBytesIncluded,false);assert.equal(bundle.sourceProofsIncluded,false);
  assert.deepEqual(bundle.files.map(row=>row.path),MODES.flatMap(mode=>REPORT_NAMES.map(name=>mode+'/'+name)));
  for(const reference of [...bundle.files,bundle.closure]){g5l1Gs002Reference(reference,reference.path,'Bundle member');const bytes=proofs.get('browser/'+reference.path);assert(Buffer.isBuffer(bytes));assert.equal(bytes.length,reference.bytes);assert.equal(digest(bytes),reference.sha256);}
  assert.equal(bundle.totalReportBytes,bundle.files.reduce((sum,row)=>sum+row.bytes,0));
  const closure=get('browser/closure.json');assert.equal(closure.kind,'g5l1-gs002-isolated-browser-proof-closure-v1');assert.equal(closure.state,'verified-report-closure-original-heap-failure-preserved');
  assert.deepEqual(closure.source.original,{bytes:G5L1_GS002_BASE_BYTES,sha256:G5L1_GS002_BASE_SHA256});assert.deepEqual(closure.source.variant,{bytes:G5L1_GS002_EFFECTIVE_BYTES,sha256:G5L1_GS002_EFFECTIVE_SHA256});assert.equal(closure.source.sourceSwfSha256,G5L1_GS002_SWF_SHA256);assert.equal(closure.source.frames,785);
  assert.equal(closure.claimBoundary.originalHeapFailureCleared,false);assert.equal(closure.claimBoundary.v14MyLessonCredit,false);assert.equal(closure.claimBoundary.variantIsolatedHeapPassed,true);assert.equal(closure.claimBoundary.originalIsolatedHeapPassed,false);
  const rootReview=get('browser-root-review.json');assert.equal(rootReview.status,'bounded-prototype-proof-passed-with-original-heap-failure-preserved');assert(Object.values(rootReview.boundaries).every(value=>value===false));
  const preservation=get('prototype-preservation-manifest.json');assert.equal(preservation.files.length,3270);assert.equal(preservation.bytes,728796923);assert.equal(preservation.productApplied,false);assert.equal(preservation.actualMyLessonHeapCredit,false);
  const statuses=['passed-current-js-pixel-and-state-equivalence','passed-current-js-replay-pixel-and-state-equivalence','completed-whole-playback-and-replay-diagnostic','completed-isolated-diagnostic-comparison'];
  for(const [index,mode]of MODES.entries()){
    const run=get('browser/'+mode+'/run.json'),comparisonBytes=proofs.get('browser/'+mode+'/comparison.json'),comparison=JSON.parse(comparisonBytes);
    assert.equal(run.kind,'g5l1-gs002-paired-browser-orchestration-v1');assert.equal(run.state,'completed');assert.equal(run.mode,mode);assert.equal(run.closedInputsVerified,true);assert.deepEqual(run.notRunSides,[]);assert.deepEqual(run.children.map(child=>child.side),['original','variant']);
    assert.equal(run.comparison.sha256,digest(comparisonBytes));assert.equal(comparison.kind,'g5l1-gs002-isolated-paired-browser-comparison-v1');assert.equal(comparison.state,statuses[index]);assert.equal(comparison.mode,mode);assert.deepEqual(comparison.violations,[]);assert(Object.values(comparison.boundaries).every(value=>value===false));
    assert.equal(comparison.originalAsset.sha256,G5L1_GS002_BASE_SHA256);assert.equal(comparison.variantAsset.sha256,G5L1_GS002_EFFECTIVE_SHA256);
    for(const [sideIndex,side]of ['original','variant'].entries()){
      const bytes=proofs.get('browser/'+mode+'/'+side+'-report.json'),worker=JSON.parse(bytes),child=run.children[sideIndex];
      assert.equal(comparison[side+'Report'].sha256,digest(bytes));assert.equal(child.workerPid,worker.workerPid);assert.equal(child.exitCode,0);assert.equal(child.lifetime.observedClose,true);assert.equal(child.lifetime.timedOut,false);
      assert.equal(worker.mode,mode);assert.equal(worker.side,side);assert.equal(worker.state,'completed');assert.equal(worker.manifestSha256,'a41073f2b02c734c6ab1497fc28d86982b2baebc3f4f94db6cef81f5787b3ff8');assert.equal(worker.asset.sha256,side==='original'?G5L1_GS002_BASE_SHA256:G5L1_GS002_EFFECTIVE_SHA256);
      for(const key of ['contextClosed','browserClosed','serverClosed','closedInputsVerified','measurementCompleted','imageReadinessObjectGroupReleased'])assert.equal(worker[key],true,mode+'/'+side+'/'+key);
      for(const key of ['pageErrors','consoleErrors','failedRequests','unexpectedRequests','serverErrors'])assert.deepEqual(worker[key],[]);
      assert.equal(worker.imageReadiness.length,5);assert(worker.imageReadiness.every(image=>image.decodeAwaited&&image.complete&&image.naturalWidth>0&&image.naturalHeight>0));
      if(mode==='playback'){
        assert.equal(worker.results.passes.length,2);
        for(const pass of worker.results.passes){assert.equal(pass.playback.status,'completed');assert.equal(pass.playback.rows.length,785);assert.deepEqual(pass.playback.rows.map(row=>row.frame),Array.from({length:785},(_,n)=>n+1));assert.equal(pass.playback.terminal.state.localFrame,785);assert.equal(pass.playback.terminal.playing,false);for(const row of pass.playback.rows){assert.equal(row.snapshot.state.localFrame,row.frame);assert.equal(row.snapshot.state.exportFrame,row.frame-1);assert.equal(row.snapshot.state.frameDomain,'sprite-457');}}
      }
      if(mode==='replay-pixels')assert.deepEqual(worker.results.checkpoints.map(row=>[row.name,row.frame]),[['entry-001',1],['sequence-1-terminal-785',785],['replay-1-mouse-001',1],['sequence-2-terminal-785',785],['replay-2-keyboard-001',1]]);
      if(mode==='heap'){assert.equal(run.quietWindowDeclared,true);assert.equal(worker.results.cycles.length,12);assert.equal(worker.results.samples.length,4);assert.deepEqual(worker.results.samples.map(row=>row.epoch),[0,1,2,3]);assert.equal(worker.results.assessment.status,side==='original'?'failed':'passed');}
    }
    assert.notEqual(run.children[0].workerPid,run.children[1].workerPid);
  }
  const parity=get('browser/parity/comparison.json');assert.equal(parity.comparedFramesPerTraversal,785);assert.equal(parity.traversalCount,2);assert.equal(parity.rows.length,1570);assert.equal(parity.rgbaByteEquality,true);
  const replay=get('browser/replay-pixels/comparison.json');assert.equal(replay.rows.length,5);assert(replay.rows.every(row=>row.equal&&row.differingPixels===0));
  const heap=get('browser/heap/comparison.json');assert.equal(heap.originalAssessment.status,'failed');assert.equal(heap.variantAssessment.status,'passed');assert.equal(heap.isolatedOriginalBudgetPassed,false);assert.equal(heap.isolatedVariantBudgetPassed,true);
  const staticProof=get('source-static-verification.json');assert.equal(staticProof.inputSha256,G5L1_GS002_BASE_SHA256);assert.equal(staticProof.outputSha256,G5L1_GS002_EFFECTIVE_SHA256);assert.equal(staticProof.caseCount,785);assert.equal(staticProof.uniqueHelperCount,174);assert.equal(staticProof.outsideOriginalRootBytesPreserved,5026071);
  const independent=get('independent-output-review.json');assert.equal(independent.state,'passed-independent-static-ir-dispatch-and-rejection-review');assert.equal(independent.source.sha256,G5L1_GS002_BASE_SHA256);assert.equal(independent.variant.sha256,G5L1_GS002_EFFECTIVE_SHA256);assert.equal(independent.ir.sha256,G5L1_GS002_IR_SHA256);assert.equal(independent.conclusions.completeExteriorBytesPreserved,5026071);assert.equal(independent.conclusions.otherOriginalFunctionsPreserved,463);
  const portable=get('portable-emitter-reproduction.json');assert.equal(portable.status,'EXACT_WORK_ONLY_REPRODUCTION_PASSED');assert.equal(portable.source.sha256,G5L1_GS002_BASE_SHA256);assert.equal(portable.ir.sha256,G5L1_GS002_IR_SHA256);assert.equal(portable.output.sha256,G5L1_GS002_EFFECTIVE_SHA256);assert.equal(portable.exactFrozenPrototypeOutput,true);
}

export async function loadG5L1Gs002Overlay(root) {
  const manifestBytes=await readFile(await g5l1Gs002SafePath(root,G5L1_GS002_MANIFEST_PATH)),manifest=JSON.parse(manifestBytes);validateG5L1Gs002OverlayManifest(manifest);
  const generator=await g5l1Gs002ReadReference(root,manifest.generator),irBytes=await g5l1Gs002ReadReference(root,manifest.ir),retainedBase=await g5l1Gs002ReadReference(root,manifest.retainedBase);
  const proofs=new Map();for(const [index,reference]of manifest.proofs.entries())proofs.set(G5L1_GS002_PROOF_NAMES[index],await g5l1Gs002ReadReference(root,reference));verifyG5L1Gs002ProofContents(proofs);
  return{manifest,manifestBytes,generator,ir:JSON.parse(irBytes),retainedBase};
}

export function planG5L1Gs002AfterIn023Gs002(twoMemberPlans,finalExpected,manifest) {
  validateG5L1Gs002OverlayManifest(manifest);assert.equal(twoMemberPlans.length,2660);assert.equal(finalExpected.length,2660);let matches=0;
  const plans=twoMemberPlans.map((plan,index)=>{
    const final=finalExpected[index],selected=plan.base.assetPath===G5L1_GS002_ASSET_PATH||final.assetPath===G5L1_GS002_ASSET_PATH;
    if(!selected){const{compressedBytes,compressedSha256,...intermediate}=plan.effective;assert.deepEqual(final,intermediate,'Non-G5 intermediate/final field mismatch at '+index);return plan;}
    matches++;assert.equal(plan.transformed,false);assert(!plan.gs002Transformed&&!plan.g5l1Gs002Transformed&&!plan.preservedExisting);assert.deepEqual(plan.base,BASE);assert.deepEqual(plan.effective,BASE);assert.deepEqual(plan.targets,[G5L1_GS002_PUBLIC_PATH]);assert.deepEqual(final,EFFECTIVE);
    return{base:plan.base,effective:final,targets:[G5L1_GS002_PUBLIC_PATH,G5L1_GS002_CANDIDATE_PATH],g5l1Gs002Transformed:true,transformed:false};
  });
  assert.equal(matches,1);assert.equal(plans.filter(plan=>plan.transformed).length,1);assert.equal(plans.filter(plan=>plan.gs002Transformed).length,1);assert.equal(plans.filter(plan=>plan.g5l1Gs002Transformed).length,1);return plans;
}
function validatePlan(plan){g5l1Gs002Keys(plan,['base','effective','targets','g5l1Gs002Transformed','transformed'],'G5 plan');assert.deepEqual(plan.base,BASE);assert.deepEqual(plan.effective,EFFECTIVE);assert.deepEqual(plan.targets,[G5L1_GS002_PUBLIC_PATH,G5L1_GS002_CANDIDATE_PATH]);assert.equal(plan.g5l1Gs002Transformed,true);assert.equal(plan.transformed,false);}
export async function prepareG5L1Gs002MaterializedBytes(root,pack,plan,overlay){
  validatePlan(plan);validateG5L1Gs002OverlayManifest(overlay.manifest);
  const encoded=await readFile(path.join(pack,'blobs',G5L1_GS002_BASE_SHA256+'.br'));assert.equal(encoded.length,COMPRESSED_BYTES);assert.equal(digest(encoded),COMPRESSED_SHA);assert(encoded.equals(overlay.retainedBase));
  const output=generateG5L1Gs002EndStage(brotliDecompressSync(encoded),overlay.ir);assert.equal(output.length,plan.effective.bytes);assert.equal(digest(output),plan.effective.sha256);return output;
}
export async function verifyG5L1Gs002EffectiveOutputs(root,plan){validatePlan(plan);for(const relative of plan.targets){const bytes=await readFile(await g5l1Gs002SafePath(root,relative));assert.equal(bytes.length,G5L1_GS002_EFFECTIVE_BYTES);assert.equal(digest(bytes),G5L1_GS002_EFFECTIVE_SHA256);}}
