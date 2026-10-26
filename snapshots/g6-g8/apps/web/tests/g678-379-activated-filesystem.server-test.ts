import test from 'node:test';
import assert from 'node:assert/strict';
process.env.HELP_MATH_G678_CALIBRATION_PHASE='nms-l01-p044-prepared-provisional-browser-qa';
const bridge=await import('../lib/g678-calibration-product-bridge.server');
test('actual379 filesystem snapshot uses activated metadata and physical closure for44 lessons and2282 placements',()=>{
  const result=bridge.g678PartialCalibrationSnapshot();assert.equal(result.status,'ready');if(result.status!=='ready')return;
  assert.equal(result.registeredPlacementCount,379);assert.equal(result.runtimeAssets.length,354);assert.equal(result.maintainedDomRenderers.length,25);
  assert.equal(result.descriptors.length,44);assert.equal(result.descriptors.reduce((n,d)=>n+d.pages.length,0),2282);
  const nms=result.descriptors.find(d=>d.pages.some(p=>p.animationId==='shared-nms002-l01-p044'))!;
  assert.equal(nms.pages.length,47);assert.equal(nms.productBridge.registeredAnimationCount,12);assert.equal(nms.glossary.length,22);
  assert.equal(nms.pages.find(p=>p.animationId==='shared-nms002-l01-p044')!.runtimeEvidenceBoundary?.naturalTraceValidation,'not-established');
  assert.equal(result.scaleOutAuthorized,false);assert.ok(result.descriptors.every(d=>Object.values(d.productBridge.acceptanceEffects).every(v=>v===false)));
});
