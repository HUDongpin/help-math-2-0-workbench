import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=s=>createHash('sha256').update(s).digest('hex');
/** Correct two teaching labels using source font glyphs, preserving the entire numeric suffix. */
export function projectP034TeachingLabels(runtime,guard){
 assert.equal(guard.source.sha256,'ceeb9f0693e7ddcf85642ee66f8b6e8ef7a5be8ab3d4d6d9e9b9cb4eedb87f63');
 assert.equal(guard.fontCharacterId,3);assert.equal(guard.fontHeightTwips,400);assert.equal(guard.baselineTwips,380);
 assert.equal(guard.rawSourceModified,false);assert.equal(guard.additionalAnswersCreated,0);
 assert.deepEqual(guard.corrections.map(r=>[r.sourceCharacterId,r.firstFrame,r.lastFrame,r.sourcePrefix,r.productPrefix,r.sourceEqualsXTwips]),[
  [228,351,625,'Amount of raisins Katrina ate each day ','Amount of raisins Katrina ate in total ',6729],
  [229,490,625,'Number of raisins Katrina had on Sunday ','Number of raisins Katrina has left in total ',7093],
 ]);
 const advances={A:240,m:311,o:218,u:205,n:205,t:126,' ':109,f:125,r:130,a:225,i:82,s:173,K:228,e:217,c:154,h:208,d:225,y:205,N:252,b:225,S:210,l:82};
 for(const [c,v]of Object.entries(advances))assert.equal(guard.sourceAdvancesTwips[c],v);
 let result=runtime;
 for(const row of guard.corrections){
  assert.equal(sha(row.sourceFunction),row.sourceFunctionSha256);assert.equal(result.split(row.sourceFunction).length,2);
  assert.equal(sha(row.sourceEquationSuffix),row.sourceEquationSuffixSha256);assert(row.sourceFunction.endsWith(row.sourceEquationSuffix));
  const start=row.sourceFunction.indexOf('\tctx.save();');assert(start>0);
  let x=0,prefix='';for(const c of row.productPrefix){assert(Number.isInteger(advances[c]));prefix+='\tctx.save();\n\tctx.transform(0.390625,0.0,0.0,0.390625,'+x.toFixed(1)+',380.0);\n\tfont3(ctx,'+JSON.stringify(c)+',textColor);\n\tctx.restore();\n';x+=advances[c];}
  assert(x<=row.sourceEqualsXTwips);assert.equal(x,row.productPrefixAdvanceTwips);
  const corrected=row.sourceFunction.slice(0,start)+prefix+row.sourceEquationSuffix;
  assert.equal(corrected,row.productFunction);assert.equal(sha(corrected),row.productFunctionSha256);assert(!corrected.includes('fillText'));
  result=result.replace(row.sourceFunction,corrected);
 }
 return result;
}
