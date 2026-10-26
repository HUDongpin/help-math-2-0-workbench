import assert from 'node:assert/strict';

const mismatchTag='ab5c13a7fe36e5d6ff9b02740577b4df1df92b0308f571e0d17e40de9c22185b';
export function p052FrameSample(frame){
 assert.ok(Number.isInteger(frame)&&frame>=1,'Positive one-indexed source frame required');
 const n=(frame-1)*22050/12,lower=Math.floor(n);
 return n-lower===0.5?(lower%2===0?lower:lower+1):Math.round(n);
}

/** Engineering candidate: preserve decoded PCM; never fill the frame102 count anomaly. */
export function buildP052AudioPlan(stream,packets,decodedSamples){
 assert.equal(stream.domain,packets.domain);assert.equal(stream.head.compression,2);
 assert.equal(stream.head.sampleRateHz,22050);assert.equal(stream.head.channels,1);
 assert.equal(stream.head.latencySeek,1673);assert.equal(packets.decodedSamples,decodedSamples);
 assert.equal(packets.blocks.length,stream.blocks.length);assert.ok(stream.blocks.length>=3);
 const anchors=[];let declared=0,actual=0,encoded=0,mismatches=0;
 for(let i=0;i<stream.blocks.length;i++){
  const b=stream.blocks[i],p=packets.blocks[i];
  assert.equal(p.frame,b.frame);assert.equal(p.declaredSamples,b.sampleCount);
  assert.equal(p.sourceTagSha256,b.tagSha256);assert.equal(p.decodedStart,actual);
  assert.equal(p.encodedStart,encoded);assert.equal(p.encodedEnd-p.encodedStart,b.payloadBytes);
  assert.ok(Number.isInteger(p.decodedSamples)&&p.decodedSamples>=0);
  const difference=b.sampleCount-p.decodedSamples;
  if(difference!==0){
   mismatches++;assert.equal(stream.domain,'sprite-350');assert.equal(b.frame,102);
   assert.equal(b.tagSha256,mismatchTag);assert.equal(b.sampleCount,1728);
   assert.equal(p.decodedSamples,1152);assert.equal(p.packetCount,2);assert.equal(difference,576);
  }
  if(b.sampleCount)anchors.push({frame:b.frame,declaredSourceStart:declared+b.seekSamples,actualPacketSourceStart:actual+b.seekSamples});
  declared+=b.sampleCount;actual+=p.decodedSamples;encoded+=b.payloadBytes;
 }
 assert.equal(mismatches,stream.domain==='sprite-350'?1:0);
 assert.equal(actual,decodedSamples);assert.equal(encoded,stream.encoded.bytes);assert.equal(declared,stream.sourceSampleCount);
 const [first,second]=anchors;
 assert.equal(first.actualPacketSourceStart,1673);assert.equal(second.actualPacketSourceStart,3510);assert.equal(second.frame,first.frame+2);
 for(let i=2;i<anchors.length;i++)assert.equal(anchors[i].declaredSourceStart-anchors[i-1].declaredSourceStart,1837*(anchors[i].frame-anchors[i-1].frame));
 const segments=[{sourceStart:1673,sourceEnd:3510,outputStart:p052FrameSample(first.frame)},
  {sourceStart:3510,sourceEnd:decodedSamples,outputStart:p052FrameSample(second.frame)}].map(s=>({...s,outputEnd:s.outputStart+s.sourceEnd-s.sourceStart}));
 assert.ok(segments[0].outputEnd<=segments[1].outputStart);
 const comparisons=anchors.map((a,i)=>{const continuousSourceStart=i===0?1673:3510+p052FrameSample(a.frame)-p052FrameSample(second.frame);return {...a,continuousSourceStart,continuousMinusActual:continuousSourceStart-a.actualPacketSourceStart,declaredMinusActual:a.declaredSourceStart-a.actualPacketSourceStart};});
 return {domain:stream.domain,status:'UNREGISTERED_ENGINEERING_CANDIDATE',decodedSamples,latencySamples:1673,segments,
  totalSamples:segments.at(-1).outputEnd,preservedSamples:decodedSamples-1673,
  authoredInitialGapSamples:segments[1].outputStart-segments[0].outputEnd,
  frame102ReplacementSamples:0,sourceSampleCountMismatch:declared-actual,comparisons,
  maxContinuousVsActualSamples:Math.max(...comparisons.map(a=>Math.abs(a.continuousMinusActual))),
  policy:'Preserve all post-latency decoded samples exactly once at22050Hz; retain authored initial stream gap; no frame102 silence insertion, deletion, stretch or repair. Source/continuous anchor divergence is explicit and not original-runtime acceptance.'};
}

export function prepareP052CandidatePcm(plan,input){
 assert.ok(input instanceof Float32Array);assert.equal(input.length,plan.decodedSamples);
 assert.ok(Number.isSafeInteger(plan.totalSamples)&&plan.totalSamples>0&&plan.totalSamples<=input.length+40000);
 for(const value of input)assert.ok(Number.isFinite(value));
 const out=new Float32Array(plan.totalSamples);let cursor=plan.latencySamples,lastEnd=0;
 assert.equal(cursor,1673);
 for(const s of plan.segments){
  for(const v of Object.values(s))assert.ok(Number.isSafeInteger(v));
  assert.equal(s.sourceStart,cursor);assert.ok(s.sourceEnd>s.sourceStart&&s.sourceEnd<=input.length);
  assert.ok(s.outputStart>=lastEnd&&s.outputEnd<=out.length);
  assert.equal(s.outputEnd-s.outputStart,s.sourceEnd-s.sourceStart);
  out.set(input.subarray(s.sourceStart,s.sourceEnd),s.outputStart);cursor=s.sourceEnd;lastEnd=s.outputEnd;
 }
 assert.equal(cursor,input.length);assert.equal(lastEnd,out.length);
 return out;
}
