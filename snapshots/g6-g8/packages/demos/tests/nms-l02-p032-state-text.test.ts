import test from'node:test';import assert from'node:assert/strict';
import{getNmsL2P032FrameState as at,p032CanOpenTerm,p032PresentationTeaching,p032SourceFrameAtMilliseconds,p032FrameAtMilliseconds}from'../src/nms-l02-p032-timeline-v1';
import{p032TextSnapshot}from'../src/nms-l02-p032-text-v1';
const c={seed:0,lang:'en' as const};
test('hundredths source beats preserve independent model, decimal and fraction reveal',()=>{
 assert.equal(at(116,c).teaching?.primaryShaded,0);assert.equal(at(117,c).teaching?.primaryShaded,1);
 assert.equal(at(178,c).teaching?.primaryDecimalAlpha,0);assert.equal(at(182,c).teaching?.primaryDecimalAlpha,1);
 assert.equal(at(195,c).teaching?.primaryFractionAlpha,0);assert.equal(at(199,c).teaching?.primaryFractionAlpha,1);
 assert.deepEqual([226,228,230,232,234,236].map(f=>at(f,c).teaching?.primaryShaded),[2,3,4,5,5,5]);
 assert.equal(at(262,c).teaching?.primaryDecimalAlpha,0);assert.equal(at(268,c).teaching?.primaryDecimalAlpha,1);
});
test('source comparison buildup retains primary5 and measured38-to40 jump without false target equality',()=>{
 assert.equal(at(368,c).teaching?.comparison,false);
 for(const[f,count]of[[369,6],[376,7],[407,38],[408,40],[423,55],[451,55]]){
  const s=at(f,c);assert.equal(s.teaching?.primaryShaded,5);assert.equal(s.teaching?.secondaryShaded,count);
  const snap=p032TextSnapshot(s);assert.equal(snap.status,'ready');
  const hint=snap.blocks.find(b=>b.id==='target-qualification');assert.equal(hint?.visible,count!==55);
 }
});
test('all source frames have stable text and current instance identity in both host languages',()=>{
 for(const lang of['en','es']as const)for(const[domain,count]of[['root',10],['sprite-176',451]]as const)for(let f=1;f<=count;f++){
  const s=at(f,{...c,lang,frameDomain:domain});assert.equal(p032TextSnapshot(s).status,'ready');assert(Object.isFrozen(s));assert.deepEqual(at(f,{...c,lang,frameDomain:domain}),s);
 }
});
test('source glyph spelling is reconstructed as Hundredths; all three exact glossary actions available only in main domain',()=>{
 for(const key of['decimal','ones-group','place-value-chart']){assert.equal(p032CanOpenTerm(at(1,c),key),true);assert.equal(p032CanOpenTerm(at(6,{...c,frameDomain:'root'}),key),false);}
 assert.equal(p032CanOpenTerm(at(451,c),'hundredths'),false);
});
test('reduced motion retains both emphasis intervals while source alternating frames remain queryable',()=>{
 for(const[a,b,key]of[[289,299,'primaryBlink'],[429,445,'secondaryBlink']]as const){for(let f=a;f<=b;f++){assert.equal(p032PresentationTeaching(at(f,c),true)?.[key],true);assert.equal(p032PresentationTeaching(at(f,c),false)?.[key],f%2===1);}}
});
test('full451-frame source loop and modern terminal hold remain distinct; invalid identities fail',()=>{
 const end=451/12*1000;assert.equal(p032FrameAtMilliseconds(end),451);assert.equal(p032SourceFrameAtMilliseconds(end),1);
 for(const f of[0,452,NaN,1.5])assert.throws(()=>at(f,c));assert.throws(()=>at(1,{...c,frameDomain:'sprite-67'}));assert.throws(()=>at(1,{...c,scenario:'wrong'}));assert.throws(()=>at(6,{...c,frameDomain:'root',scenario:'term-decimal'}));
 assert.equal(at(5,{...c,frameDomain:'root'}).teaching,null);assert.equal(at(6,{...c,frameDomain:'root'}).mainFrame,1);
});
