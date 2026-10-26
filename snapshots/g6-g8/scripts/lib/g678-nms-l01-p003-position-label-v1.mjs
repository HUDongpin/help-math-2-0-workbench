import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
export function correctNmsL1P003PositionLabel(runtime,plan){
  assert.equal(plan.animationId,'shared-nms002-l01-p003');
  assert.equal(plan.sourceSwfSha256,'6486970403a56712ad47bd50f504b8a6209226517016b6fedc70bf1de481643c');
  assert.deepEqual([plan.correction.sourceCharacterId,plan.correction.sourceLabel,plan.correction.modernLabel,plan.correction.firstFrame,plan.correction.lastPlacedFrame],[58,'+5','+15',533,783]);
  assert.equal(plan.positionDerivation.sourceEquationResult,15);
  assert(Math.abs(plan.positionDerivation.inferredApproximatePosition-15)<.1);
  for(const record of Object.values(plan.sourceFunctions)){
    assert.equal(Buffer.byteLength(record.code),record.bytes);assert.equal(sha(record.code),record.sha256);
    assert.equal(runtime.split(record.code).length,2,'unique unchanged source text function');
  }
  const wrong=plan.sourceFunctions['58'].code,template=plan.sourceFunctions['51'].code;
  assert.deepEqual([...wrong.matchAll(/font14\(ctx,"([^" ]+)",textColor\);/gu)].map(m=>m[1]),['+','5']);
  assert.deepEqual([...template.matchAll(/font14\(ctx,"([^" ]+)",textColor\);/gu)].map(m=>m[1]),['+','1','0']);
  const corrected=template.replace('function text51(','function text58(').replace('font14(ctx,"0",textColor);','font14(ctx,"5",textColor);');
  const oldPlacement='place("text58",canvas,ctx,[0.04949951171875,0.0,0.0,0.04949951171875,125.35,-79.95]',
    newPlacement='place("text58",canvas,ctx,[0.04949951171875,0.0,0.0,0.04949951171875,122.35,-79.95]';
  assert.equal(runtime.split(oldPlacement).length,252,'every source placement of the erroneous position label');
  return runtime.replace(wrong,corrected).split(oldPlacement).join(newPlacement);
}
