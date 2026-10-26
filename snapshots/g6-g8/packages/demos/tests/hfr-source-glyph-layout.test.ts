import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {HFR_GLYPH_LAYOUT_REGISTERED_BEFORE_SHARED_RULE,hfrSourceGlyphLayout} from '../src/hfr/hfr-native-text';
import {p018NativeGlyphOffsets} from '../src/hfr/nms-l11-p018-native-layout';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const read=(file:string)=>fs.readFileSync(path.join(ROOT,file),'utf8');
const registry=JSON.parse(read('packages/demos/private-current-js-registry.json'));
const entries=new Map<string,any>(registry.calibrations.flatMap((c:any)=>c.entries.map((e:any)=>[e.key,e])));
const P023_DATA='work/g678-shared-page-factory/hfr-ts-nms-l11-p023-product-staged-p023-life-session15-v1/members/shared-nms002-l11-p023/shared-nms002-l11-p023.data.json';

function page(id:string){
  // P018 keeps the same embedded config in a page-owned module.
  const source=read(id==='shared-nms002-l11-p018'?'packages/demos/src/hfr/nms-l11-p018-native-config.ts':`packages/demos/src/modules/${id}.tsx`);
  const literal=/const config=JSON\.parse\(("(?:[^"\\]|\\.)*")\)/.exec(source);
  assert(literal,`${id} embeds its runtime config`);
  const config=JSON.parse(JSON.parse(literal[1]));
  const dataPath=entries.get(id)?.artifacts?.data?.path??(id==='shared-nms002-l11-p023'?P023_DATA:undefined);
  assert(dataPath,`${id} live data path`);
  const data=JSON.parse(read(dataPath));
  return {
    text:(characterId:number)=>config.sourceCatalog.textDefinitions.find((t:any)=>t.characterId===characterId),
    live:(characterId:number)=>data.dictionary[String(characterId)],
  };
}
// Independent statement of the rule the per-page branches implement: each
// glyph starts at the cumulative authored advance from the first glyph origin.
function cumulative(text:any){
  const offsets:number[]=[];let cursor=0,origin:number|null=null;
  for(const run of text.runs){if(run.xOffsetTwips!==null)cursor=run.xOffsetTwips;for(const g of run.glyphs){if(origin===null)origin=cursor;offsets.push(cursor-origin);cursor+=g.advanceTwips;}}
  return offsets;
}
const offsets=(result:ReturnType<typeof hfrSourceGlyphLayout>)=>{assert.equal(result.status,'source-glyph-offsets',JSON.stringify(result));return [...(result as any).offsets];};

// Exact charId/text contracts from the existing page-owned branches in hfr-native-text.ts.
const BRANCHES:readonly [string,Readonly<Record<number,string>>][]=[
  ['shared-nms002-l11-p011',{20:'= 0.3',...Object.fromEntries(Array.from({length:36},(_,i)=>[22+i,'= 0.'+'1'.repeat(i+1)]))}],
  ['shared-nms002-l11-p012',{15:'Word Form',18:'Decimal Form',21:'Fractional Form',24:'Decimal Form',26:'Fractional Form'}],
  ['shared-nms002-l11-p013',{50:'3.1,'}],
  ['shared-nms002-l11-p015',{16:'12',19:'3 x 2',20:'12 x 2',27:'12'}],
];

test('shared rule reproduces every existing per-page source-glyph branch on registered data',()=>{
  let compared=0;
  for(const [id,texts]of BRANCHES){
    const p=page(id);
    for(const [characterId,value]of Object.entries(texts)){
      const text=p.text(Number(characterId)),live=p.live(Number(characterId));
      if(!text||!live)continue; // P011 declares a range; only authored IDs exist.
      assert.deepEqual(offsets(hfrSourceGlyphLayout(text,live,value)),cumulative(text),`${id} character ${characterId}`);
      compared++;
    }
  }
  const p018=page('shared-nms002-l11-p018');
  for(const characterId of [5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,26,27,28,29,30,31,34,35,37,38,39,40,41,42,43,44,45,46]){
    const text=p018.text(characterId),live=p018.live(characterId);
    if(!text||!live)continue;
    const value=text.runs.map((r:any)=>r.text).join('');
    assert.deepEqual(offsets(hfrSourceGlyphLayout(text,live,value)),[...p018NativeGlyphOffsets(text,live,value)!],`P018 character ${characterId}`);
    compared++;
  }
  assert(compared>=40,`compared ${compared} registered branch texts`);
});

test('P023 table headers, decimals and fraction components receive authored glyph origins',()=>{
  const p=page('shared-nms002-l11-p023');
  const expected:Record<number,string>={11:'Terminating Decimals',12:'Equivalent Fraction',13:'0.25',14:'0.125',15:'0.55',22:'11',23:'20'};
  for(const [characterId,value]of Object.entries(expected)){
    const text=p.text(Number(characterId)),live=p.live(Number(characterId));
    const result=offsets(hfrSourceGlyphLayout(text,live,value));
    assert.equal(result.length,value.length);
    assert.deepEqual(result,live.runs[0].g.map((g:readonly number[])=>g[1]));
  }
  assert.deepEqual(offsets(hfrSourceGlyphLayout(p.text(11),p.live(11),'Terminating Decimals')).slice(0,4),[0,194,411,541]);
});

test('source/runtime divergence is a mismatch that the caller blocks, never a silent fallback',()=>{
  const p=page('shared-nms002-l11-p023'),text=p.text(13),live=p.live(13);
  const clone=(v:any)=>JSON.parse(JSON.stringify(v));
  const cases:[string,(t:any,l:any)=>void][]=[
    ['live glyph x drift',(_t,l)=>{l.runs[0].g[2][1]+=1;}],
    ['live glyph index',(_t,l)=>{l.runs[0].g[1][0]=99;}],
    ['live string',(_t,l)=>{l.runs[0].str='0.26';}],
    ['live font',(_t,l)=>{l.runs[0].f=5;}],
    ['live height',(_t,l)=>{l.runs[0].h=440;}],
    ['live baseline',(_t,l)=>{l.runs[0].y=381;}],
    ['live run count',(_t,l)=>{l.runs.push(clone(l.runs[0]));}],
    ['live kind',(_t,l)=>{l.kind='shape';}],
    ['source advance disagrees with live position',(t)=>{t.runs[0].glyphs[0].advanceTwips=0;}],
    ['fractional source advance',(t)=>{t.runs[0].glyphs[0].advanceTwips=218.5;}],
    ['source code differs from text',(t)=>{t.runs[0].glyphs[3].code=54;}],
  ];
  for(const [name,mutate]of cases){
    const t=clone(text),l=clone(live);mutate(t,l);
    assert.equal(hfrSourceGlyphLayout(t,l,'0.25').status,'mismatch',name);
  }
});

test('non-transcription labels keep their existing natural layout',()=>{
  const p=page('shared-nms002-l11-p023'),text=p.text(13),live=p.live(13);
  const clone=(v:any)=>JSON.parse(JSON.stringify(v));
  assert.deepEqual(hfrSourceGlyphLayout(text,live,'\n0.25'),{status:'natural',reason:'semantic-text'});
  assert.deepEqual(hfrSourceGlyphLayout({...clone(text),kind:'dynamic-field'},live,'0.25'),{status:'natural',reason:'not-static-text'});
  const unmapped=clone(text);unmapped.runs[0].glyphs[1].unicode=null;
  assert.deepEqual(hfrSourceGlyphLayout(unmapped,live,'0.25'),{status:'natural',reason:'unmapped-glyph'});
  const superscript=clone(text);superscript.runs.push({...clone(text.runs[0]),yOffsetTwips:200,text:'2',glyphs:[clone(text.runs[0].glyphs[2])]});
  assert.deepEqual(hfrSourceGlyphLayout(superscript,live,'0.252'),{status:'natural',reason:'mixed-baseline'});
  const sized=clone(text);sized.runs.push({...clone(text.runs[0]),fontHeightTwips:300,text:'2',glyphs:[clone(text.runs[0].glyphs[2])]});
  assert.deepEqual(hfrSourceGlyphLayout(sized,live,'0.252'),{status:'natural',reason:'mixed-font-height'});
});

test('authored zero-advance glyphs (stacked trailing spaces) are kept, not blocked',()=>{
  // Live record from the HFR corpus: NMS002 L05 P045 character 59, "Divide" and
  // 40 trailing spaces that Flash stacks at one authored position.
  const corpus=JSON.parse(read('work/hfr-typescript/hfr/out/corpus-v1/shared-nms002-l05/pages/shared-nms002-l05-p045/shared-nms002-l05-p045.data.json'));
  const live=corpus.dictionary['59'],run=live.runs[0],x=run.g.map((g:readonly number[])=>g[1]);
  const text={sourceTextId:'character-59',characterId:59,kind:'static-text',boundsTwips:{left:0,right:1,top:0,bottom:1},
    runs:[{fontId:run.f,fontHeightTwips:run.h,colorRgba:run.c,xOffsetTwips:null,yOffsetTwips:run.y,text:run.str,
      glyphs:run.g.map((g:readonly number[],i:number)=>({index:g[0],code:run.str.charCodeAt(i),unicode:run.str[i],
        advanceTwips:(x[i+1]??x[i]+250)-x[i],status:'embedded-unicode-code-table'}))}]} as any;
  assert(text.runs[0].glyphs.filter((g:any)=>g.advanceTwips===0).length>=30);
  assert.deepEqual(offsets(hfrSourceGlyphLayout(text,live,run.str)),x);
});

test('pages registered before the shared rule are exactly the installed registered HFR pages',()=>{
  const installed=fs.readdirSync(path.join(ROOT,'packages/demos/src/hfr-pages')).map(f=>f.replace(/\.tsx?$/,''));
  for(const id of HFR_GLYPH_LAYOUT_REGISTERED_BEFORE_SHARED_RULE){assert(entries.has(id),`${id} registered`);assert(installed.includes(id),`${id} installed`);}
  assert.equal(HFR_GLYPH_LAYOUT_REGISTERED_BEFORE_SHARED_RULE.size,33);
  assert(!HFR_GLYPH_LAYOUT_REGISTERED_BEFORE_SHARED_RULE.has('shared-nms002-l11-p023'));
});
