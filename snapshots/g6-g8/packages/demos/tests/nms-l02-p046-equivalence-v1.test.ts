import test from 'node:test';
import assert from 'node:assert/strict';
import {p046Equivalent} from '../src/nms-l02-p046-equivalence-v1';
test('all source questions accept equal fractions at multiple scales',()=>{
 for(const [n,d]of [[2,4],[4,12],[6,10]])for(const k of [1,2,3,10,100])assert(p046Equivalent(n,d,String(n*k),String(d*k)));
 assert(p046Equivalent(2,4,'1','2'));assert(p046Equivalent(4,12,'1','3'));assert(p046Equivalent(6,10,'3','5'));
 assert(p046Equivalent(2,4,' .1 ','0.2'));assert(p046Equivalent(2,4,'1e2','2e2'));assert(p046Equivalent(2,4,'-1','-2'));
 assert(!p046Equivalent(2,4,'-1','2'));assert(!p046Equivalent(4,12,'1','4'));
});
test('invalid fractions and source numeric-prefix coercion cannot pass',()=>{
 for(const [n,d]of [['0','0'],['1','0'],['0','2'],['Infinity','Infinity'],['NaN','2'],['',''],['1x','2x'],['0x1','2'],['1/2','1'],['1e-99999','2e-99999']])assert(!p046Equivalent(2,4,n,d),`${n}/${d}`);
 assert.throws(()=>p046Equivalent(1,0,'1','2'),/TARGET/);
});
test('decimal exactness avoids large integer rounding and floating ratio collisions',()=>{
 assert(p046Equivalent(2,4,'9007199254740993','18014398509481986'));
 assert(!p046Equivalent(2,4,'9007199254740992','18014398509481986'));
 assert(p046Equivalent(2,4,'1e308','2e308')===false);
});
