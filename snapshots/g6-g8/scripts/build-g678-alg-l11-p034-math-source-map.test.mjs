import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {describeMath,solutionSet} from './build-g678-alg-l11-p034-math-source-map.mjs';
const config=JSON.parse(await readFile(new URL('../config/g678-alg-l11-p034-math-transcription-v1.json',import.meta.url),'utf8'));
const relation=(a,op,b)=>op==='<'?a<b:op==='≤'?a<=b:op==='>'?a>b:a>=b;
const expressionTrue=(m,x)=>m.kind==='compound'?(m.inclusive?m.lower<=x&&x<=m.upper:m.lower<x&&x<m.upper)
  :m.kind==='absolute'?relation(Math.abs(x),m.operator,m.right)
    :relation(m.coefficients.reduce((sum,n)=>sum+n*x,m.constant),m.operator,m.right);
const intervalTrue=(s,x)=>(s.lower===null||(s.lowerInclusive?x>=s.lower:x>s.lower))&&(s.upper===null||(s.upperInclusive?x<=s.upper:x<s.upper));
test('all24 literal alternatives preserve exact signed source expressions and usable MathML',()=>{
  assert.equal(config.cards.length,24);
  for(const row of config.cards){const out=describeMath(row.math);assert.equal(out.expression,row.expected);
    assert.ok(out.spoken.includes('x'));assert.ok(!/undefined|NaN/.test(out.xml+out.spoken));assert.match(out.xml,/<mi>x<\/mi>/);}
});
test('all24 source expressions agree with derived solution sets at every integer and half-integer −100..100',()=>{
  for(const row of config.cards){const set=solutionSet(row.math);
    for(let n=-200;n<=200;n++)assert.equal(expressionTrue(row.math,n/2),intervalTrue(set,n/2),`${row.level}:${row.name}:${n/2}`);}
});
test('all12 source pairs have equivalent solution sets without placing those solutions in literal alternatives',()=>{
  for(const level of[1,2])for(let pair=1;pair<=6;pair++){
    const cards=config.cards.filter(c=>c.level===level&&c.name.startsWith(`Mc${pair}_`));assert.equal(cards.length,2);
    assert.deepEqual(solutionSet(cards[0].math),solutionSet(cards[1].math));
  }
  assert.equal(describeMath(config.cards.find(c=>c.level===2&&c.name==='Mc1_1').math).expression,'−6x + 3x + 9 ≤ −27');
  assert.deepEqual(solutionSet(config.cards.find(c=>c.level===2&&c.name==='Mc1_1').math),{lower:12,upper:null,lowerInclusive:true,upperInclusive:false});
});
