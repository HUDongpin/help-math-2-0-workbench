import assert from 'node:assert/strict';
/** Replace FFDec's UP-only body with the source Button state records. Matrices remain source twips. */
export function restoreSourceButtonStates(runtime,buttonId,states){
 assert(Number.isSafeInteger(buttonId)&&buttonId>0);assert.deepEqual(Object.keys(states),['up','over','down']);
 const name='button'+buttonId,pattern=new RegExp('^function '+name+'\\([^\\n]*\\)\\{[\\s\\S]*?^\\}','mu'),match=runtime.match(pattern);assert(match,'source button definition missing');
 const functions=new Set([...runtime.matchAll(/^function ((?:shape|sprite|text|button|font)\d+)\(/gmu)].map(m=>m[1]));
 const cases=Object.entries(states).map(([state,rows],index)=>{
  assert(rows.length>0);const depths=new Set();let prior=0;
  const draw=[...rows].sort((a,b)=>a.depth-b.depth).map(row=>{
   assert(functions.has(row.function)&&row.function!==name&&Number.isSafeInteger(row.depth)&&row.depth>prior&&!depths.has(row.depth));prior=row.depth;depths.add(row.depth);
   assert(Array.isArray(row.matrix)&&row.matrix.length===6&&row.matrix.every(Number.isFinite));
   const c=row.color??{},allowed=['shiftRed','shiftGreen','shiftBlue','shiftAlpha','factorRed','factorGreen','factorBlue','factorAlpha'];assert(Object.keys(c).every(k=>allowed.includes(k)));
   const color=allowed.map((key,i)=>Number(c[key]??(i<4?0:256)));assert(color.every(Number.isFinite));
   return 'place('+JSON.stringify(row.function)+',canvas,ctx,'+JSON.stringify(row.matrix)+',ctrans.merge(new cxform('+color.join(',')+')),1,0,0,time);';
  }).join('\n');return 'case '+index+':\n'+draw+'\nbreak;';
 }).join('\n');
 const replacement='function '+name+'(ctx,ctrans,frame,ratio,time){\nvar frame_cnt=4;frame=frame%frame_cnt;\nswitch(frame){\n'+cases+'\n}\n}';
 runtime=runtime.replace(pattern,replacement);
 const mapPattern=/SAFE_OBJECTS = Object\.freeze\(\{[\s\S]*?\n\}\);/u,map=runtime.match(mapPattern);assert(map,'reviewed static drawing registry missing');
 const existing=new Set([...map[0].matchAll(/"([A-Za-z_$][A-Za-z0-9_$]*)":/gu)].map(m=>m[1]));
 const additions=[...new Set(Object.values(states).flatMap(rows=>rows.map(r=>r.function)))].filter(name=>!existing.has(name)).sort();
 const entries=additions.map(name=>JSON.stringify(name)+': '+name+',').join('\n');
 if(entries)runtime=runtime.replace(mapPattern,map[0].replace('SAFE_OBJECTS = Object.freeze({','SAFE_OBJECTS = Object.freeze({\n'+entries));
 return runtime;
}
