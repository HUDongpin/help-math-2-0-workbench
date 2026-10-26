import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, readdir, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Script} from 'node:vm';
import {parse} from 'acorn';

const SCRIPT=fileURLToPath(import.meta.url),ROOT=path.resolve(path.dirname(SCRIPT),'..');
export const P010_ID='shared-alg001-l12-p010';
export const P010_WORK=`migrations/${P010_ID}`;
export const P010_CANVAS_EXPORT=`${P010_WORK}/audit/ffdec-26.2.1-canvas-v1`;
export const P010_SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const P010_SOURCE=`${P010_SOURCE_ROOT}/G6-G8-shared/ALG001/L12/VB/L12VB05.swf`;
export const P010_CANVAS_INPUT_PINS=Object.freeze({
  source:{path:P010_SOURCE,bytes:183770,sha256:'a846950547f7c3ab7b0445dfc2118d534565ffd352b6e9687ba8211e5d4a3fcd'},
  index:{path:P010_SOURCE_ROOT+'/G6-G8-shared/ALG001/L12/index.xml',bytes:11927,sha256:'0755afb5645d3179fb1105641b0d1f1b06d8c803c02484bfbdc703ba5bb6f325'},
  xml:{path:P010_WORK+'/audit/movie.xml',bytes:1633927,sha256:'94c06c842ebd821d5d239666e3e00e4d639f47d4861149438a0a6a1cc02912da'},
  sourceToolchain:{path:P010_WORK+'/audit/source-toolchain.json',bytes:14091,sha256:'c601fb6740c7eab88cec6a107113ec95eff5cc87d311d5a9bbb9e6942ee19832'},
  sourceAuditReceipt:{path:P010_WORK+'/audit/extraction-receipt.json',bytes:6981,sha256:'d42a9b58831223bf9be5825586c31d74232dda6965e7458eca7dd3c73fa91385'},
});
const JAVA='/Users/peter/Library/Application Support/HELP Math Flash Workbench/temurin-jre-21.0.11+10/Contents/Home/bin/java';
const JAR='/Users/peter/Applications/FFDec.app/Contents/Resources/ffdec.jar';
const PREFIX=['-Djava.net.preferIPv4Stack=true','-Djna.nosys=true','-Djava.util.Arrays.useLegacyMergeSort=true','-Xmx512m','-Djava.awt.headless=true','-jar',JAR];
const EXPECTED=['export.log','frames/canvas.js','frames/frames.html','help-export.txt','sprites/DefineSprite_96/canvas.js','sprites/DefineSprite_96/frames.html'].sort();
const hash=b=>createHash('sha256').update(b).digest('hex'),json=v=>JSON.stringify(v,null,2)+'\n';
const relative=p=>p.startsWith(ROOT+path.sep)?path.relative(ROOT,p).split(path.sep).join('/'):p;
export async function physicalP010File(file,expected){
  const absolute=path.resolve(file);let current=path.parse(absolute).root;
  for(const part of absolute.split(path.sep).filter(Boolean)){current=path.join(current,part);assert(!(await lstat(current)).isSymbolicLink(),`physical path required: ${current}`);}
  assert.equal(await realpath(absolute),absolute);
  const before=await lstat(absolute,{bigint:true});assert(before.isFile()&&before.nlink===1n,`ordinary single-link input required: ${absolute}`);
  const b=await readFile(absolute),after=await lstat(absolute,{bigint:true});for(const k of ['dev','ino','size','mode','mtimeNs','ctimeNs','nlink'])assert.equal(after[k],before[k],`input changed: ${absolute}`);
  if(expected){assert.equal(b.length,expected.bytes,`size drift: ${absolute}`);assert.equal(hash(b),expected.sha256,`hash drift: ${absolute}`);}return b;
}
async function pin(file){const b=await physicalP010File(file);return {path:relative(file),bytes:b.length,sha256:hash(b)};}
async function pinned(p){return physicalP010File(p.path.startsWith('/')?p.path:path.join(ROOT,p.path),p);}

// Independent XML projection of source definitions, references and clipDepth
// lifetimes. The public-tool XML has already been pinned; no AVM1 is executed.
const XML_PARSER=`import json,sys,xml.etree.ElementTree as E
swf=E.fromstring(sys.stdin.buffer.read()); tags=swf.find('tags'); definitions={}
for e in tags:
    if not e.get('type','').startswith('Define'): continue
    cid=next((e.get(k) for k in ['spriteId','shapeId','characterId','characterID','buttonId','fontID','textId'] if e.get(k) is not None),None)
    if cid is None: raise ValueError('unidentified definition '+e.get('type'))
    cid=int(cid)
    if cid in definitions: raise ValueError('duplicate character ID')
    definitions[cid]=e
def timeline(owner,items,declared):
    frame=1; refs=[]; masks=[]; active={}; maskFrameCounts=[]; placements=[]
    for e in items:
        kind=e.get('type',''); depth=int(e.get('depth','0'))
        if kind.startswith('RemoveObject'): active.pop(depth,None)
        if kind.startswith('PlaceObject'):
            if e.get('placeFlagMove')=='false': active.pop(depth,None)
            if e.get('placeFlagHasClipDepth')=='true': active[depth]=int(e.get('clipDepth'))
        if kind.startswith('PlaceObject') and e.get('characterId') is not None:
            cid=int(e.get('characterId')); refs.append(cid)
            if owner=='root':
                m=e.find('matrix')
                placements.append({'frame':frame,'characterId':cid,'depth':depth,'name':e.get('name'),'matrix':{'hasScale':m.get('hasScale'),'scaleX':m.get('scaleX'),'scaleY':m.get('scaleY'),'hasRotate':m.get('hasRotate'),'rotateSkew0':m.get('rotateSkew0'),'rotateSkew1':m.get('rotateSkew1'),'translateX':int(m.get('translateX')),'translateY':int(m.get('translateY'))}})
        if e.get('placeFlagHasClipDepth')=='true': masks.append({'frame':frame,'characterId':int(e.get('characterId')),'depth':depth,'clipDepth':int(e.get('clipDepth'))})
        if kind=='ShowFrameTag': maskFrameCounts.append(len(active)); frame+=1
    if frame-1!=declared: raise ValueError('ShowFrame count disagrees with '+owner)
    return {'frameCount':declared,'references':sorted(set(refs)),'masks':masks,'maskFrameCounts':maskFrameCounts,'rootPlacements':placements}
timelines={'root':timeline('root',tags,int(swf.get('frameCount')))}
for cid,e in definitions.items():
    if e.get('type')=='DefineSpriteTag': timelines['sprite-'+str(cid)]=timeline('sprite-'+str(cid),e.find('subTags'),int(e.get('frameCount')))
direct={cid:[] for cid in definitions}; buttonHits=[]
for cid,e in definitions.items():
    if e.get('type')=='DefineSpriteTag': direct[cid]=timelines['sprite-'+str(cid)]['references']
    elif e.get('type')=='DefineButton2Tag':
        records=list(e.find('characters')); direct[cid]=sorted(set(int(x.get('characterId')) for x in records))
        buttonHits.append({'characterId':cid,'references':direct[cid],'recordCount':len(records),'hitOnly':all(x.get('buttonStateHitTest')=='true' and all(x.get(k)=='false' for k in ['buttonStateUp','buttonStateOver','buttonStateDown']) for x in records)})
    elif e.get('type')=='DefineTextTag': direct[cid]=sorted(set(int(x.get('fontId')) for x in e.iter() if x.get('fontId') is not None))
pending=list(timelines['root']['references']); reachable=set()
while pending:
    cid=pending.pop()
    if cid in reachable: continue
    if cid not in definitions: raise ValueError('missing referenced character '+str(cid))
    reachable.add(cid); pending.extend(direct[cid])
rect=swf.find('displayRect')
print(json.dumps({'generator':swf.get('_generator'),'xmlVersion':[swf.get('_xmlExportMajor'),swf.get('_xmlExportMinor')],'frameRate':float(swf.get('frameRate')),'stageTwips':[int(rect.get('Xmin')),int(rect.get('Xmax')),int(rect.get('Ymin')),int(rect.get('Ymax'))],'timelines':timelines,'reachableDefinitions':[{'characterId':cid,'type':definitions[cid].get('type'),'references':direct[cid]} for cid in sorted(reachable)],'unreachableCharacterIds':sorted(set(definitions)-reachable),'buttonStates':buttonHits},separators=(',',':')))
`;
export function inspectP010Xml(b){
  const result=spawnSync('python3',['-c',XML_PARSER],{input:b,encoding:'utf8',timeout:30000,maxBuffer:1024*1024});
  assert(!result.error&&result.status===0,`XML dependency extraction failed: ${result.error?.message??result.stderr}`);
  const xml=JSON.parse(result.stdout);assert.equal(xml.generator,'JPEXS Free Flash Decompiler v.26.2.1');assert.deepEqual(xml.xmlVersion,['2','2']);
  assert.equal(xml.frameRate,12);assert.deepEqual(xml.stageTwips,[0,16000,0,12000]);assert.deepEqual(Object.keys(xml.timelines),['root','sprite-96']);
  assert.equal(xml.timelines.root.frameCount,10);assert.equal(xml.timelines['sprite-96'].frameCount,465);assert.deepEqual(xml.timelines.root.references,[96,97]);assert.deepEqual(xml.timelines.root.masks,[]);
  assert.deepEqual(xml.timelines['sprite-96'].masks,[{frame:10,characterId:18,depth:1,clipDepth:10},{frame:69,characterId:18,depth:11,clipDepth:20},{frame:113,characterId:30,depth:21,clipDepth:28},{frame:173,characterId:30,depth:29,clipDepth:36}]);
  assert.deepEqual(xml.unreachableCharacterIds,[]);assert.equal(xml.reachableDefinitions.length,97);
  assert(xml.buttonStates.length===9&&xml.buttonStates.every(b=>b.hitOnly&&b.recordCount===1&&b.references.join(',')==='21'));
  assert.deepEqual(xml.timelines.root.rootPlacements.map(p=>[p.frame,p.characterId,p.depth,p.matrix.translateX,p.matrix.translateY]),[[6,96,1,8248,5666],[6,97,108,0,0]]);
  assert.equal(xml.timelines.root.rootPlacements[0].name,'animation');
  return xml;
}
export function p010CanvasDeclarations(text){const html=text.replace(/\r\n?/g,'\n'),start=html.indexOf('var scalingGrids = {};'),end=html.indexOf('\nvar frame = -1;');assert(start>=0&&end>start,'generated Canvas declaration boundary missing');assert.equal(html.split('var scalingGrids = {};').length,2);assert.equal(html.split('\nvar frame = -1;').length,2);return html.slice(start,end);}
export function inspectP010Canvas(text,xml){
  const declarations=p010CanvasDeclarations(text);new Script(declarations);
  const tree=parse(declarations,{ecmaVersion:2020}),nodes=tree.body.filter(n=>n.type==='FunctionDeclaration'),names=nodes.map(n=>n.id.name),defined=new Set(names);assert.equal(defined.size,names.length,'duplicate Canvas declaration');
  const placed=[...declarations.matchAll(/place\("([A-Za-z0-9_]+)"/g)].map(m=>m[1]),missing=[...new Set(placed)].filter(n=>!defined.has(n));assert.deepEqual(missing,[],'generated place() has missing nested dependency');
  for(const [name,frames]of [['main',10],['sprite96',465]])assert.match(declarations,new RegExp(`function ${name}\\(ctx,ctrans,frame,ratio,time\\)\\{[\\s\\S]*?var frame_cnt = ${frames};`));
  assert.deepEqual(names.filter(n=>/^sprite\d+$/.test(n)),['sprite96']);
  for(const d of xml.reachableDefinitions){const prefix=d.type.startsWith('DefineShape')?'shape':d.type.startsWith('DefineText')?'text':d.type.startsWith('DefineFont')?'font':d.type.startsWith('DefineButton')?'button':'sprite';assert(defined.has(prefix+d.characterId),`source dependency missing: ${prefix+d.characterId}`);}
  assert.equal(names.filter(n=>/^text\d+$/.test(n)).length,28);assert.equal(names.filter(n=>/^shape\d+$/.test(n)).length,58);assert(!/function (?:image|morph)\d+\(/.test(declarations),'unexpected bitmap or morph domain');
  const node=nodes.find(n=>n.id.name==='sprite96'),sprite=declarations.slice(node.start,node.end),cases=[...sprite.matchAll(/\t\tcase (\d+):([\s\S]*?)(?=\t\tcase \d+:|\t\})/g)];assert.equal(cases.length,465,'sprite96 must retain every source frame case');
  const maskFrameCounts=cases.map(([ ,number,body],index)=>{assert.equal(Number(number),index,'source frame case order changed');const pushed=[...body.matchAll(/clips\.push\(\{ctx:ctx,canvas:canvas\}\);/g)].length;
    for(const marker of ['var o = clips.pop();','ctx.globalCompositeOperation = "destination-in";','ctx.drawImage(o.clipCanvas,0,0);'])assert.equal(body.split(marker).length-1,pushed,`incomplete mask block at frame ${index+1}`);
    assert.equal(pushed,xml.timelines['sprite-96'].maskFrameCounts[index],`mask count differs from source at frame ${index+1}`);return pushed;});
  return {syntaxValid:true,exportedFrameDomains:{root:10,'sprite-96':465},sourceReachableCharacterCount:97,declaredSourceCharacterFunctions:names.filter(n=>/^(?:shape|font|text|button|sprite)\d+$/.test(n)).length,sourceTextFunctionCount:28,sourceShapeFunctionCount:58,placedCharacterFunctions:[...new Set(placed)].sort(),missingPlacedCharacterFunctions:missing,sourceMaskPlacements:xml.timelines['sprite-96'].masks,generatedMaskMechanism:'clipCanvas plus destination-in raster mask compositing',generatedMaskBlockCount:maskFrameCounts.reduce((sum,n)=>sum+n,0),maskFramesChecked:465,maskFrameCounts,bitmapCount:0,morphCount:0,nestedSpriteCount:0,buttonGraphicsState:'nine source buttons are hit-test-only; release handlers are not Canvas runtime authority',acceptanceEffect:'none'};
}

async function inventory(directory,base=directory){assert.equal(await realpath(directory),directory);const records=[];for(const name of(await readdir(directory)).sort()){if(directory===base&&name==='extraction-receipt.json')continue;const file=path.join(directory,name),s=await lstat(file);assert(!s.isSymbolicLink());if(s.isDirectory())records.push(...await inventory(file,base));else{assert(s.isFile());const b=await physicalP010File(file);records.push({path:path.relative(base,file).split(path.sep).join('/'),bytes:b.length,sha256:hash(b)});}}return records.sort((a,b)=>a.path<b.path?-1:1);}
async function preflight(){
  assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT,P010_SOURCE_ROOT,'exact physical G6-G8 source-root opt-in required');assert((await lstat(P010_SOURCE_ROOT)).isDirectory());assert.equal(await realpath(P010_SOURCE_ROOT),P010_SOURCE_ROOT);
  const inputs=new Map();for(const [key,p]of Object.entries(P010_CANVAS_INPUT_PINS))inputs.set(key,await pinned(p));
  await physicalP010File(path.join(ROOT,P010_WORK,'audit/source-input.swf'),P010_CANVAS_INPUT_PINS.source);
  const index=inputs.get('index').toString().replace(/<!--[\s\S]*?-->/g,''),pages=[...index.matchAll(/<Page\b[^>]*>([^<]+)<\/Page>/g)].map(m=>m[1]);assert.equal(pages.length,52);assert.equal(pages[9],'VB/L12VB05.swf');
  const migration=JSON.parse(await physicalP010File(path.join(ROOT,P010_WORK,'migration.json')));assert.equal(migration.animationId,P010_ID);assert.equal(migration.source.swf,P010_SOURCE);assert.equal(migration.source.swfSha256,P010_CANVAS_INPUT_PINS.source.sha256);
  const xml=inspectP010Xml(inputs.get('xml')),sourceToolchain=JSON.parse(inputs.get('sourceToolchain'));
  assert.deepEqual(sourceToolchain.source,P010_CANVAS_INPUT_PINS.source);assert.deepEqual(sourceToolchain.invocation,{command:JAVA,prefix:PREFIX});assert.equal(sourceToolchain.java.path,JAVA);assert.equal(sourceToolchain.ffdecJar.path,JAR);
  for(const p of[sourceToolchain.java,sourceToolchain.ffdecJar,...sourceToolchain.classPath])await physicalP010File(p.path,p);
  return {inputs,xml,sourceToolchain};
}
function run(args,timeout=60000){const r=spawnSync(JAVA,[...PREFIX,...args],{encoding:'utf8',maxBuffer:4*1024*1024,timeout});assert(!r.error,r.error?.message);return r;}
export async function checkP010CanvasExport(){
  const {xml,sourceToolchain}=await preflight(),out=path.join(ROOT,P010_CANVAS_EXPORT),receipt=JSON.parse(await physicalP010File(path.join(out,'extraction-receipt.json')));
  assert.equal(receipt.animationId,P010_ID);assert.deepEqual(receipt.inputs,P010_CANVAS_INPUT_PINS);assert.deepEqual(receipt.sourceXmlProjection,xml);assert.deepEqual(receipt.generator,await pin(SCRIPT));
  assert.deepEqual(receipt.tool,{version:'26.2.1',java:sourceToolchain.java,ffdecJar:sourceToolchain.ffdecJar,classPath:sourceToolchain.classPath});
  const args=['-config','packJavaScripts=false','-onerror','abort','-selectid','96','-format','frame:canvas,sprite:canvas','-export','frame,sprite',out,P010_SOURCE];assert.deepEqual(receipt.command,[JAVA,...PREFIX,...args]);
  const all=await inventory(out);assert.deepEqual(all.map(p=>p.path),EXPECTED);assert.deepEqual(receipt.files,all);assert.equal(receipt.outputChecksumSetSha256,hash(json(all)));assert.equal(receipt.totalBytes,all.reduce((n,p)=>n+p.bytes,0));assert.equal(receipt.under100MiB,receipt.totalBytes<100*1024*1024);
  const root=await physicalP010File(path.join(out,'frames/frames.html')),closure=inspectP010Canvas(root.toString(),xml);assert.deepEqual(receipt.canvasDependencyClosure,closure);
  assert.deepEqual(await physicalP010File(path.join(out,'frames/canvas.js')),await physicalP010File(path.join(out,'sprites/DefineSprite_96/canvas.js')));
  assert.equal(receipt.acceptanceEffect,'none');assert(Object.values(receipt.acceptanceEffects).every(v=>v===false));return receipt;
}
async function main(){
  assert(process.argv.length===3&&['--export','--check'].includes(process.argv[2]),'Usage: export-g678-alg-l12-p010-canvas.mjs --export|--check');
  if(process.argv[2]==='--check'){const receipt=await checkP010CanvasExport();console.log(json({status:'P010_CANVAS_EXPORT_VERIFIED',files:receipt.files.length,totalBytes:receipt.totalBytes,closure:receipt.canvasDependencyClosure,acceptanceEffect:'none'}));return;}
  const {xml,sourceToolchain}=await preflight(),out=path.join(ROOT,P010_CANVAS_EXPORT),generator=await pin(SCRIPT);
  const help=run(['-help','-export']);assert.equal(help.status,0);assert.equal(help.stderr,'');assert(help.stdout.includes('JPEXS Free Flash Decompiler v.26.2.1'));for(const key of['-selectid','frame:canvas','sprite:canvas'])assert(help.stdout.includes(key));
  await mkdir(out);await writeFile(path.join(out,'help-export.txt'),help.stdout,{flag:'wx'});
  const args=['-config','packJavaScripts=false','-onerror','abort','-selectid','96','-format','frame:canvas,sprite:canvas','-export','frame,sprite',out,P010_SOURCE],result=run(args,60000);
  await writeFile(path.join(out,'export.log'),result.stdout+result.stderr,{flag:'wx'});assert.equal(result.status,0,'FFDec failed; original partial output is retained');assert.equal(result.stderr,'');
  await preflight();assert.deepEqual(await pin(SCRIPT),generator,'exporter changed during extraction');
  const all=await inventory(out);assert.deepEqual(all.map(p=>p.path),EXPECTED,'unexpected raw output membership');const closure=inspectP010Canvas((await physicalP010File(path.join(out,'frames/frames.html'))).toString(),xml);
  assert.deepEqual(await physicalP010File(path.join(out,'frames/canvas.js')),await physicalP010File(path.join(out,'sprites/DefineSprite_96/canvas.js')));
  const totalBytes=all.reduce((n,p)=>n+p.bytes,0),receipt={schemaVersion:1,animationId:P010_ID,evidenceKind:'Fresh bounded public FFDec Canvas extraction; no original-runtime authority',inputs:P010_CANVAS_INPUT_PINS,sourceXmlProjection:xml,generator,tool:{version:'26.2.1',java:sourceToolchain.java,ffdecJar:sourceToolchain.ffdecJar,classPath:sourceToolchain.classPath},command:[JAVA,...PREFIX,...args],selectedDomains:{root:10,'sprite-96':465},canvasDependencyClosure:closure,files:all,outputChecksumSetSha256:hash(json(all)),totalBytes,under100MiB:totalBytes<100*1024*1024,rawOutputsUnchanged:true,retainedFailurePinsCopied:false,acceptanceEffects:{registered:false,browserValidated:false,originalRuntimeVerified:false,flashFidelityAccepted:false,audioAccepted:false,humanAccepted:false,ownerAccepted:false,strictComplete:false,releaseAccepted:false,published:false},acceptanceEffect:'none'};
  await writeFile(path.join(out,'extraction-receipt.json'),json(receipt),{flag:'wx'});await checkP010CanvasExport();console.log(json({status:'P010_CANVAS_EXPORT_CREATED_AND_VERIFIED',files:all.length,totalBytes,closure,acceptanceEffect:'none'}));
}
if(process.argv[1]&&path.resolve(process.argv[1])===SCRIPT)main().catch(e=>{console.error(e);process.exitCode=1;});
