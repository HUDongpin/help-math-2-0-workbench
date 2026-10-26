import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parse} from 'acorn';
import {file} from './g678-nms-l01-p044-extract-visual-slice.mjs';
const RAW='work/g678-shared-page-factory/g678-nms-l01-p044-visual-slice-v2';
const PROJECTION='work/g678-shared-page-factory/g678-nms-l01-p044-visual-projection-v1/source-projection.json';
const STRUCTURE='work/g678-shared-page-factory/g678-nms-l01-p044-structural-crosscheck-v4/crosscheck.json';
export function numeric(node){if(node.type==='Literal'&&typeof node.value==='number')return node.value;
  if(node.type==='Identifier'&&node.name==='time')return 0;
  if(node.type==='UnaryExpression'&&node.operator==='-')return -numeric(node.argument);
  if(node.type==='BinaryExpression'){const a=numeric(node.left),b=numeric(node.right);if(node.operator==='+')return a+b;if(node.operator==='-')return a-b;if(node.operator==='*')return a*b;if(node.operator==='/')return a/b;if(node.operator==='%')return a%b;}
  throw Error(`Unapproved drawing scalar:${node.type}`);}
const fixed=n=>Math.round(Number(n)*65536)/65536;
function matrix(m){return [m?.hasScale==='true'?fixed(m.scaleX):1,m?.hasRotate==='true'?fixed(m.rotateSkew0):0,
  m?.hasRotate==='true'?fixed(m.rotateSkew1):0,m?.hasScale==='true'?fixed(m.scaleY):1,Number(m?.translateX??0),Number(m?.translateY??0)];}
export function sourceStates(events,count,domain){const live=new Map(),frames=[];let next=0;
  for(let f=1;f<=count;f++){while(next<events.length&&events[next].frame===f){const e=events[next++],a=e.attributes,depth=Number(a.depth);
      if(e.type==='RemoveObject2Tag'){live.delete(depth);continue;}
      let value=live.get(depth);if(a.placeFlagHasCharacter==='true')value={...(a.placeFlagMove==='true'?value:{matrix:[1,0,0,1,0,0]}),depth,sourceObjectId:Number(a.characterId),placementFrame:f,parentDomain:domain};
      assert.ok(value,`No preceding source placement:${domain}/${f}/${depth}`);value={...value};if(e.matrix)value.matrix=matrix(e.matrix);if(a.placeFlagHasName==='true')value.name=a.name;
      live.set(depth,value);
    }frames.push([...live.values()].sort((a,b)=>a.depth-b.depth).map(v=>({...v})));}
  assert.equal(next,events.length);return frames;}
function calls(node,rows=[]){if(!node||typeof node!=='object')return rows;if(node.type==='CallExpression'&&node.callee.type==='Identifier'&&node.callee.name==='place')rows.push(node);
  for(const[k,v]of Object.entries(node)){if(['start','end'].includes(k))continue;if(Array.isArray(v))for(const n of v)calls(n,rows);else if(v&&typeof v==='object')calls(v,rows);}return rows;}
export async function mapSource(){assert.equal((await file(`${RAW}/run.json`)).sha256,'2bbc355ac09eeafd9c427b5ec2d81cd689705c67185dc7e967f66197153934c9');
  const run=JSON.parse(await readFile(`${RAW}/run.json`,'utf8'));for(const input of run.outputs){const actual=await file(input.path);assert.equal(actual.bytes,input.bytes);assert.equal(actual.sha256,input.sha256);}
  const projectionRun='work/g678-shared-page-factory/g678-nms-l01-p044-visual-projection-v1/run.json';assert.equal((await file(projectionRun)).sha256,'96b8a469d661b1b5e558dd54ea7bab9239defaa725e18e77493bc620b800efb0');
  for(const input of JSON.parse(await readFile(projectionRun,'utf8')).outputs){const actual=await file(input.path);assert.equal(actual.bytes,input.bytes);assert.equal(actual.sha256,input.sha256);}
  assert.equal((await file(STRUCTURE)).sha256,'eb32fbbdfca8d3c7fa5b7e23f582696e19f90ed4bc6188450c10c30684262820');
  const [html,helper,ir,structure]=await Promise.all([readFile(`${RAW}/canvas/DefineSprite_293/frames.html`,'utf8'),readFile(`${RAW}/canvas/DefineSprite_293/canvas.js`,'utf8'),readFile(PROJECTION,'utf8').then(JSON.parse),readFile(STRUCTURE,'utf8').then(JSON.parse)]);
  const start=html.indexOf('var scalingGrids = {};'),end=html.indexOf('\nvar frame = -1;',start);assert.ok(start>0&&end>start);const definitions=html.slice(start,end).replace(/\r\n/g,'\n');
  const ast=parse(definitions,{ecmaVersion:2020}),functions=ast.body.filter(n=>n.type==='FunctionDeclaration'),sourceFunctions=functions.filter(n=>/^sprite\d+$/.test(n.id.name));
  assert.equal(sourceFunctions.length,16);assert.equal(functions.filter(n=>/^morphshape/.test(n.id.name)).length,49);assert.equal(functions.filter(n=>/^font/.test(n.id.name)).length,8);
  const placements=[],byIdentity=new Map(),domains={},edits=[],mapping=[];
  for(const fn of sourceFunctions){const id=Number(fn.id.name.slice(6)),domain=`sprite-${id}`,count=structure.domains[domain].frames,states=sourceStates(ir.events[String(id)],count,domain);
    const sw=fn.body.body.filter(n=>n.type==='SwitchStatement');assert.equal(sw.length,1);assert.equal(sw[0].cases.length,count);
    const frameList=[];
    for(const [index,branch]of sw[0].cases.entries()){assert.equal(branch.test.value,index);const draw=calls(branch),source=states[index];assert.equal(draw.length,source.length,`Place count mismatch:${domain}/${index+1}`);
      const frameCalls=[];
      for(let i=0;i<draw.length;i++){const call=draw[i],entry=source[i],name=call.arguments[0].value;assert.match(name,/^(?:shape|morphshape|sprite|text|button|image)\d+$/);assert.equal(Number(name.match(/\d+$/)[0]),entry.sourceObjectId,`Object/depth mismatch:${domain}/${index+1}/${entry.depth}`);
        const drawingMatrix=call.arguments[3].elements.map(numeric),scale=id===293?.05:1,expected=entry.matrix.map(n=>n*scale);
        for(let j=0;j<6;j++)assert.ok(Math.abs(drawingMatrix[j]-expected[j])<1e-6,`Source matrix mismatch:${domain}/${index+1}/${entry.depth}/${j}: ${drawingMatrix[j]} vs ${expected[j]}`);
        const identity={parentDomain:domain,depth:entry.depth,sourceObjectId:entry.sourceObjectId,placementFrame:entry.placementFrame},key=JSON.stringify(identity);
        let placementIndex=byIdentity.get(key);if(placementIndex===undefined){placementIndex=placements.length;byIdentity.set(key,placementIndex);placements.push({...identity,name:entry.name??null,drawingFunction:name,frameCount:structure.domains[`sprite-${entry.sourceObjectId}`]?.frames??1});}
        const defaultFrame=numeric(call.arguments[6]);assert.ok(Number.isSafeInteger(defaultFrame)&&defaultFrame>=0);frameCalls.push([placementIndex,defaultFrame]);
        edits.push({start:call.callee.start,end:call.callee.end,text:'placeSource'},{start:call.end-1,end:call.end-1,text:`,${placementIndex}`});
        mapping.push({domain,frame:index+1,depth:entry.depth,sourceObjectId:entry.sourceObjectId,placementFrame:entry.placementFrame,defaultFrame,sourceMatrix:entry.matrix,drawingMatrix});
      }frameList.push(frameCalls);
    }domains[domain]={frameCount:count,frames:frameList};
  }
  const chunks=[];let cursor=0;for(const e of edits.sort((a,b)=>a.start-b.start)){assert.ok(e.start>=cursor);chunks.push(definitions.slice(cursor,e.start),e.text);cursor=e.end;}chunks.push(definitions.slice(cursor));const annotated=chunks.join('');
  const placedNames=[...new Set(calls(ast).map(n=>n.arguments[0].value))].sort();const definedNames=new Set(functions.map(f=>f.id.name));assert.ok(placedNames.every(n=>definedNames.has(n)));
  return {definitions,annotated,helper,placements,domains,mapping,placedNames,functions:functions.map(f=>f.id.name),root:{parentDomain:'root',depth:3,sourceObjectId:293,placementFrame:6},
    scope:'Only compiler display-list correspondence; source AS visibility/child stop effects are external controller requests.'};
}
