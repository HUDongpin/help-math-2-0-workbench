import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

// Receipt reader only: never starts work, changes registration, or awards acceptance.
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const time = value => typeof value === 'string' && /(?:Z|[+-]\d\d:\d\d)$/.test(value) && Number.isFinite(Date.parse(value)) ? Date.parse(value) : null;
const finishTime = d => time(d.closedAt ?? d.finishedAt ?? d.completedAt);
const registryIds = d => d.calibrations.flatMap(c => c.entries.map(e => e.key));
const samePin = (actual, expected) => expected && actual.bytes === expected.bytes && actual.sha256 === expected.sha256;

export function intervalMetrics(intervals, start, finish) {
  const valid = intervals.filter(i => i.start !== null && i.finish !== null && i.finish >= i.start);
  const total = valid.reduce((sum, i) => sum + i.finish - i.start, 0);
  const clipped = valid.map(i => [Math.max(i.start, start), Math.min(i.finish, finish)]).filter(([a,b]) => b >= a).sort((a,b) => a[0]-b[0]);
  let covered = 0, left = null, right = null;
  for (const [a,b] of clipped) {
    if (left === null) { left=a; right=b; }
    else if (a <= right) right = Math.max(right,b);
    else { covered += right-left; left=a; right=b; }
  }
  if (left !== null) covered += right-left;
  const clippedTotal = clipped.reduce((sum,[a,b]) => sum+b-a,0);
  return {summedSeconds:total/1000, coveredSeconds:covered/1000,
    overlapSeconds:(clippedTotal-covered)/1000, unclassifiedSeconds:(finish-start-covered)/1000};
}

export function summarizeDelivery({root, start, baseline, terminal, registry, catalog, unit, cases=[], stages=[]}) {
  root = path.resolve(root);
  const inputs = [], issues = [], gaps = [];
  const read = (name, expected) => {
    const absolute = path.resolve(root,name), bytes = fs.readFileSync(absolute);
    const pin = {path:path.relative(root,absolute),bytes:bytes.length,sha256:sha256(bytes)};
    inputs.push(pin);
    if (expected && !samePin(pin,expected)) throw Error(`Receipt pin mismatch: ${name}`);
    return {data:JSON.parse(bytes), pin};
  };
  const required = (pin,label) => {
    if (!pin?.path || !Number.isInteger(pin.bytes) || !/^[a-f0-9]{64}$/.test(pin.sha256 ?? '')) throw Error(`Missing pinned ${label}`);
    return read(pin.path,pin).data;
  };
  const first=read(start), before=read(baseline), end=read(terminal), after=read(registry), cat=read(catalog);
  const ids = new Set(cat.data.lessons.flatMap(l=>l.pages.map(p=>p.animationId)));
  const beforeKeys=registryIds(before.data), afterKeys=registryIds(after.data);
  if (new Set(beforeKeys).size!==beforeKeys.length || new Set(afterKeys).size!==afterKeys.length) issues.push('Duplicate registry entries');
  const oldIds = new Set(beforeKeys.filter(id=>ids.has(id))), newIds = new Set(afterKeys.filter(id=>ids.has(id)));
  const added = [...newIds].filter(id=>!oldIds.has(id)).sort(), removed=[...oldIds].filter(id=>!newIds.has(id)).sort();
  const terminalData=end.data, pageIds = terminalData.animationId ? [terminalData.animationId] : terminalData.animationIds;
  const declaredCount = terminalData.formalProgress?.registered ?? terminalData.formalRegistered ?? terminalData.registered;
  if (!samePin(after.pin,terminalData.registry)) issues.push('Registry snapshot does not match terminal historical pin; current membership is not historical closure evidence');
  if (declaredCount!==newIds.size) issues.push('Terminal registered count differs from catalog/registry intersection');
  if (removed.length) issues.push('Baseline catalog members disappeared');
  if (!Array.isArray(pageIds) || !pageIds.length || pageIds.some(id=>!newIds.has(id))) issues.push('Terminal page identity is missing or unregistered');
  const startAt = time(first.data.startedAt ?? (first.data.event==='start' ? first.data.at : null));
  const finishAt = finishTime(terminalData);
  const actualWorkStart = first.data.event==='start' && typeof unit==='string' && first.data.unit===unit && Array.isArray(first.data.registryIds);
  if (unit && first.data.unit!==unit) issues.push('Explicit work-unit identity does not match start receipt');
  if (actualWorkStart && JSON.stringify([...new Set(first.data.registryIds.filter(id=>ids.has(id)))].sort())!==JSON.stringify([...oldIds].sort())) issues.push('Work-start registry membership differs from baseline snapshot');
  if (startAt===null || finishAt===null || finishAt<startAt) gaps.push('No valid explicit start/terminal interval');
  if (!actualWorkStart) gaps.push('Full delivery start requires an explicit matching --unit and recorded work-start receipt; selected start is observational');

  let closureSupported = false, readbackAt = null, expectedPostflightPaths=[], postflightCasePins=[];
  try {
    if (terminalData.registeredRoutePostflightPending!==false) throw Error('Registered postflight is missing or still pending');
    const success=required(terminalData.success,'registration success');
    const readback=required(terminalData.readback,'registration readback');
    if (!samePin(after.pin,success.registry) || !samePin(after.pin,readback.registry)) throw Error('Registration success/readback snapshot mismatch');
    const baselinePin=success.snapshots?.find(s=>s.target==='packages/demos/private-current-js-registry.json')?.pin;
    if (!samePin(before.pin,baselinePin)) throw Error('Baseline snapshot does not match registration transaction');
    if (!Array.isArray(success.pages) || !pageIds?.every(id=>success.pages.includes(id))) throw Error('Registration success does not name terminal pages');
    if ((readback.formalRegistered ?? readback.registered)!==newIds.size) throw Error('Readback registered count mismatch');
    readbackAt=time(readback.at);
    const post=terminalData.registeredPostflight;
    const stable=required(post?.stable,'registered stable run'), suite=required(post?.suite,'registered suite'), command=required(post?.command,'registered command');
    if (stable.exitCode!==0 || stable.status!=='stable-command-passed' || stable.drift!==null || stable.registrySha256!==after.pin.sha256) throw Error('Registered stable run failed, drifted, or belongs to another registry');
    if (command.exitCode!==0 || suite.passed!==true || !Number.isInteger(suite.expected) || suite.expected<1 || suite.results?.length!==suite.expected || suite.results.some(r=>r.exitCode!==0)) throw Error('Registered browser suite or command failed/incomplete');
    expectedPostflightPaths=suite.results.map(r=>path.relative(root,path.resolve(root,r.script.replace(/\.js$/,'.json'))));
    if (!pageIds.every(id=>stable.animationIds?.includes(id))) throw Error('Registered stable run does not cover terminal pages');
    if (readbackAt===null || time(stable.startedAt)===null || finishTime(stable)===null || finishAt===null || readbackAt>time(stable.startedAt) || finishTime(stable)>finishAt) throw Error('Registration/postflight/closure chronology is unknown or inconsistent');
    for (const key of ['independentReview','machineVisual','evidenceManifest']) if (post[key]) required(post[key],`postflight ${key}`);
    const manifest=required(post.evidenceManifest,'registered case evidence manifest');
    if (manifest.rawCases!==post.cases || !Array.isArray(manifest.inputPins)) throw Error('Registered raw-case evidence manifest is incomplete');
    postflightCasePins=expectedPostflightPaths.map(name=>{
      const found=manifest.inputPins.filter(pin=>path.relative(root,path.resolve(root,pin.path))===name);
      if(found.length!==1) throw Error(`Expected one registered raw-case pin: ${name}`);
      return found[0];
    });
    closureSupported=true;
  } catch (error) { issues.push(error.message); }

  const attempts=[], duplicateInputs=[], hashes=new Map(), attemptIdentities=new Map();
  for (const name of cases) {
    const {data:d,pin}=read(name);
    if (!d.caseId || !d.animationId || typeof d.passed!=='boolean') { issues.push(`Not a terminal case receipt: ${name}`); continue; }
    if (hashes.has(pin.sha256)) {duplicateInputs.push({path:pin.path,duplicateOf:hashes.get(pin.sha256)});continue;}
    hashes.set(pin.sha256,pin.path);
    const boundPin=postflightCasePins.find(p=>path.relative(root,path.resolve(root,p.path))===pin.path);
    if (expectedPostflightPaths.includes(pin.path) && !samePin(pin,boundPin)) issues.push(`Registered raw-case pin mismatch: ${name}`);
    const a=time(d.startedAt), b=finishTime(d);
    if (a!==null) {
      const identity=JSON.stringify([d.animationId,d.caseId,d.mode,a]);
      if (attemptIdentities.has(identity)) {issues.push(`Conflicting receipts for same attempt: ${name}`);continue;}
      attemptIdentities.set(identity,pin.path);
    }
    attempts.push({path:pin.path,animationId:d.animationId,caseId:d.caseId,mode:d.mode??null,binding:boundPin&&samePin(pin,boundPin)?'terminal-pinned-manifest':'observed-only',
      passed:d.passed,startedAt:d.startedAt??null,finishedAt:d.finishedAt??null,
      seconds:a!==null&&b!==null&&b>=a?(b-a)/1000:null,error:d.passed?null:d.error??'Failure without recorded message'});
  }
  const postflightCases=attempts.filter(a=>pageIds?.includes(a.animationId)&&a.mode==='registered');
  if (postflightCases.length!==terminalData.registeredPostflight?.cases || postflightCases.some(a=>!a.passed) || JSON.stringify(postflightCases.map(a=>a.path).sort())!==JSON.stringify(expectedPostflightPaths.sort())) {
    closureSupported=false;issues.push('Supplied registered page cases are missing, failed, or do not match closure case count');
  }
  const candidateCases=attempts.filter(a=>!postflightCases.includes(a));
  if (Number.isInteger(terminalData.candidateAttempts) && candidateCases.length!==terminalData.candidateAttempts) gaps.push('Supplied candidate/compatibility attempts do not cover the declared total');
  const groups=new Map();
  for(const item of candidateCases) {const key=JSON.stringify([item.animationId,item.mode,item.caseId]);groups.set(key,[...(groups.get(key)??[]),item]);}
  const firstPassKnown=!issues.length && Number.isInteger(terminalData.selectedCandidateAndCompatibilityCases) && terminalData.selectedCandidateAndCompatibilityCases>0 && groups.size===terminalData.selectedCandidateAndCompatibilityCases && candidateCases.length===terminalData.candidateAttempts && candidateCases.every(a=>a.seconds!==null);
  const firstPassPassed=firstPassKnown?[...groups.values()].filter(items=>items.toSorted((a,b)=>time(a.startedAt)-time(b.startedAt))[0].passed).length:null;
  const stageRows = stages.map(({label,path:name})=>{
    const {data:d,pin}=read(name), a=time(d.startedAt), b=finishTime(d);
    return {label,path:pin.path,start:a,finish:b,seconds:a!==null&&b!==null&&b>=a?(b-a)/1000:null,
      outcome:typeof d.passed==='boolean'?(d.passed?'passed':'failed'):d.exitCode===0?'passed':Number.isInteger(d.exitCode)?'failed':'unknown'};
  });
  if (stageRows.some(s=>s.seconds===null)) gaps.push('Some supplied stages have no complete actual interval');
  const validWindow=startAt!==null&&finishAt!==null&&finishAt>=startAt;
  if (validWindow && stageRows.some(s=>s.start!==null && s.finish!==null && (s.start<startAt || s.finish>finishAt))) gaps.push('Some stage intervals extend outside the selected window; coverage is clipped');
  if (issues.length) closureSupported=false;
  const closedPages=closureSupported?pageIds:[];
  return {
    kind:'hfr-delivery-metrics-v1',generatedAt:new Date().toISOString(),
    scope:'Historical receipt consistency and observed durations only; no new registration, source/runtime acceptance, or speedup claim',
    inputs:[...new Map(inputs.map(pin=>[pin.path,pin])).values()],issues,gaps,
    registry:{baselineCount:oldIds.size,terminalCount:newIds.size,total:ids.size,added,removed,historicalSnapshotMatches:samePin(after.pin,terminalData.registry)},
    closure:{supported:closureSupported,pageIds:closedPages,newlyClosedPageIds:closedPages.filter(id=>added.includes(id)),registeredOnlyPageIds:added.filter(id=>!closedPages.includes(id))},
    time:{start:first.pin.path,terminal:end.pin.path,windowKind:actualWorkStart?'explicit-work-unit':'partial-observed-stage',
      observedWindowSeconds:validWindow?(finishAt-startAt)/1000:null,
      endToEndSeconds:validWindow&&actualWorkStart&&closureSupported?(finishAt-startAt)/1000:null,
      stages:stageRows.map(({start,finish,...row})=>row),
      accounting:validWindow?intervalMetrics(stageRows,startAt,finishAt):null,
      note:'Stage durations may overlap; unclassified time includes unrecorded work/waits and is not asserted to be idle time'},
    attempts:{unique:attempts.length,passed:attempts.filter(a=>a.passed).length,failed:attempts.filter(a=>!a.passed).length,
      candidateAndCompatibility:candidateCases.length,registeredPostflight:postflightCases.length,unknownDuration:attempts.filter(a=>a.seconds===null).length,duplicateInputs,items:attempts},
    firstPass:{rate:firstPassKnown?firstPassPassed/groups.size:null,passed:firstPassPassed,total:firstPassKnown?groups.size:null,
      scope:'Observed supplied candidate/compatibility case receipts; no independent behavior acceptance',
      unknownReason:firstPassKnown?null:'Complete expected case set, attempt count, and timed first terminal are not all established'},
  };
}

export function parseArgs(argv) {
  const options={root:process.cwd(),cases:[],stages:[]};
  for(let i=0;i<argv.length;i+=2) {
    const key=argv[i],value=argv[i+1];
    if(!value || value.startsWith('--')) throw Error(`Missing value for ${key}`);
    if(key==='--case') options.cases.push(value);
    else if(key==='--stage') {const at=value.indexOf('=');if(at<1)throw Error('--stage needs label=receipt.json');options.stages.push({label:value.slice(0,at),path:value.slice(at+1)});}
    else if(['root','start','baseline','terminal','registry','catalog','unit','out'].includes(key.slice(2))&&key.startsWith('--')) options[key.slice(2)]=value;
    else throw Error(`Unknown option: ${key}`);
  }
  for(const key of ['start','baseline','terminal','registry','catalog']) if(!options[key]) throw Error(`Missing --${key}`);
  return options;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    const options=parseArgs(process.argv.slice(2)), report=summarizeDelivery(options), text=JSON.stringify(report,null,2)+'\n';
    if(options.out) {const out=path.resolve(options.root,options.out);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,text,{flag:'wx'});}
    else process.stdout.write(text);
    if(report.issues.length) process.exitCode=2;
  } catch(error) {console.error(error.message);process.exitCode=1;}
}
