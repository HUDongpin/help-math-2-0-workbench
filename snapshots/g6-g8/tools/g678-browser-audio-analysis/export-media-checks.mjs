import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {assessCapture} from './assess.mjs';
import {actualAudioOwnerFields} from './audio-owner-binding.mjs';

// Converts actual measurements into the existing technical-assessor's records.
// Reassesses the retained PCM rather than trusting a prior passed flag.
const [manifestPath, windowsPath, bindingPath, out] = process.argv.slice(2);
if (!manifestPath || !windowsPath || !bindingPath || !out) throw Error('Usage: node export-media-checks.mjs MANIFEST WINDOWS_JSON RUNNER_BINDING_JSON NEW_DIRECTORY');
const binding = JSON.parse(await readFile(bindingPath)), windows = JSON.parse(await readFile(windowsPath));
if (binding.kind !== 'browser-audio-runner-binding-v1' || binding.runID !== windows.runID || !Number.isFinite(binding.unixMinusRunnerMs) ||
  !Array.isArray(binding.windows)) throw Error('EXACT_RUNNER_TIME_AXIS_BINDING_REQUIRED');
const result = await assessCapture({manifestPath, windowsPath});
if (result.purpose !== 'page-audit') throw Error('QUALIFICATION_IS_NOT_PAGE_EVIDENCE');
await mkdir(out);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const put = async (name, object) => {
  const bytes=Buffer.from(JSON.stringify(object,null,2)+'\n'), file=path.join(out,name);
  await writeFile(file,bytes,{flag:'wx'});return{path:path.resolve(file),bytes:bytes.length,sha256:sha(bytes)};
};
const capture = result.inputPins.find(p => p.path.endsWith('/native-audio.pcm'));
if (!capture) throw Error('NATIVE_CAPTURE_PIN_REQUIRED');
const mediaChecks=[], silenceChecks=[], missing=[];
for(const row of result.windows) {
  const matches=binding.windows.filter(w=>w.id===row.id);
  if(matches.length!==1) throw Error('EXACT_WINDOW_OWNER_BINDING_REQUIRED:'+row.id);
  const owner=matches[0];
  const ownerFields=actualAudioOwnerFields(owner,row);
  const declared=windows.windows.find(w=>w.id===row.id);
  if(row.status!=='PASS') {missing.push({id:row.id,findings:row.findings});continue;}
  const source=row.kind==='audible'?result.inputPins.find(p=>p.sha256===row.sourceSha256):binding.pageSource;
  if(!source) throw Error('SOURCE_PIN_REQUIRED');
  const sourceBytes=await readFile(source.path), metadata=await lstat(source.path);
  if(!metadata.isFile()||metadata.isSymbolicLink()||sourceBytes.length!==source.bytes||sha(sourceBytes)!==source.sha256) throw Error('SOURCE_PIN_DRIFT');
  const startMs=row.startUnixMs-binding.unixMinusRunnerMs,endMs=row.endUnixMs-binding.unixMinusRunnerMs;
  if(row.kind==='audible') {
    const match={method:'normalized-cross-correlation',sourceSha256:source.sha256,captureSha256:capture.sha256,
      score:Math.min(1,row.sourceMatch.correlation),comparedSamples:row.sourceMatch.frames,lagMs:row.sourceMatch.alignmentMs,
      ...(row.sourceMatch.sourceWindow?{sourceWindow:row.sourceMatch.sourceWindow}:{})};
    const numerical={capture,source,startMs,endMs,sampleRate:48000,sampleCount:row.metrics.frames,channels:2,rms:row.metrics.rms,match};
    const report=await put('media-'+mediaChecks.length+'.json',numerical);
    mediaChecks.push({cueId:row.cueId,...ownerFields,...numerical,
      analysis:{tool:fileURLToPath(new URL('./assess.mjs',import.meta.url)),report}});
  } else if(row.kind==='silent' && Number.isFinite(row.sourcePlaybackStartSeconds) && Number.isFinite(row.sourcePlaybackEndSeconds)) {
    const numerical={capture,source,startMs,endMs,sourcePlaybackStartSeconds:row.sourcePlaybackStartSeconds,
      sourcePlaybackEndSeconds:row.sourcePlaybackEndSeconds,sampleRate:48000,sampleCount:row.metrics.frames,channels:2,rms:row.metrics.rms};
    const report=await put('silence-'+silenceChecks.length+'.json',numerical);
    silenceChecks.push({windowId:declared.sourceWindowId??row.id,...ownerFields,...numerical,
      analysis:{tool:fileURLToPath(new URL('./assess.mjs',import.meta.url)),report}});
  }
}
const report=await put('media-checks.json',{kind:'browser-audio-technical-record-export-v1',runID:result.runID,
  assessment:await put('reassessment.json',result),mediaChecks,silenceChecks,missing,
  humanListeningAcceptance:false,originalRuntimeAcceptance:false});
console.log(JSON.stringify({report,mediaChecks:mediaChecks.length,silenceChecks:silenceChecks.length,missing:missing.length}));
if(missing.length) process.exitCode=1;
