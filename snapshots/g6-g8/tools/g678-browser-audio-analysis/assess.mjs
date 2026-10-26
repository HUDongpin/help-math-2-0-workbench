import {createHash} from 'node:crypto';
import {execFile, spawn} from 'node:child_process';
import {createReadStream} from 'node:fs';
import {lstat, open, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import {POLICY, matchSourceWaveform, measurePCM, pcmChannels, toneEnergyFraction} from './audio-analysis.mjs';

const invariant = (ok, message) => { if (!ok) throw Error(message); };
const hashBytes = bytes => createHash('sha256').update(bytes).digest('hex');
const exec = promisify(execFile);
async function ordinary(file, max = 16 * 1024 * 1024) {
  const stat = await lstat(file); invariant(stat.isFile() && !stat.isSymbolicLink() && stat.size <= max, 'REGULAR_BOUNDED_FILE_REQUIRED: ' + file);
  return stat;
}
async function fileHash(file, max = 1_600_000_000) {
  const stat = await ordinary(file, max), hash = createHash('sha256');
  for await (const bytes of createReadStream(file)) hash.update(bytes);
  return {path: file, bytes: stat.size, sha256: hash.digest('hex')};
}
async function jsonFile(file) { await ordinary(file); const bytes = await readFile(file); return {value: JSON.parse(bytes), pin: {path: file, bytes: bytes.length, sha256: hashBytes(bytes)}}; }
function asset(root, file, exact) { invariant(file === exact, 'UNEXPECTED_CAPTURE_ASSET_NAME'); return path.join(root, file); }
async function verifyALAC(file, expectedPCMBytes) {
  const ffprobe = '/opt/homebrew/bin/ffprobe', ffmpeg = '/opt/homebrew/bin/ffmpeg';
  const inspected = await exec(ffprobe, ['-v', 'error', '-protocol_whitelist', 'file', '-select_streams', 'a:0',
    '-show_entries', 'stream=codec_name,sample_rate,channels,bits_per_raw_sample', '-of', 'json', file], {timeout: 15000, maxBuffer: 1024 * 1024});
  const streams = JSON.parse(inspected.stdout).streams;
  invariant(Array.isArray(streams) && streams.length === 1 && streams[0].codec_name === 'alac' &&
    Number(streams[0].sample_rate) === 48000 && streams[0].channels === 2 && Number(streams[0].bits_per_raw_sample) === 24,
    'ALAC_CONTAINER_FORMAT_MISMATCH');
  const args = ['-nostdin', '-v', 'error', '-protocol_whitelist', 'file', '-i', file,
    '-map', '0:a:0', '-ac', '2', '-ar', '48000', '-c:a', 'pcm_f32le', '-f', 'f32le', 'pipe:1'];
  const decoded = await new Promise((resolve, reject) => {
    const child = spawn(ffmpeg, args, {stdio: ['ignore', 'pipe', 'pipe']});
    const digest = createHash('sha256'); let bytes = 0, stderr = '', sizeFailed = false;
    const timer = setTimeout(() => child.kill('SIGTERM'), 120000);
    child.stdout.on('data', data => { bytes += data.length; digest.update(data); if (bytes > expectedPCMBytes + 8192) { sizeFailed = true; child.kill('SIGTERM'); } });
    child.stderr.on('data', data => { if (stderr.length < 65536) stderr += data; else child.kill('SIGTERM'); });
    child.on('error', e => { clearTimeout(timer); reject(e); });
    child.on('exit', (code, signal) => { clearTimeout(timer); resolve({code, signal, bytes, sha256: digest.digest('hex'), stderr, sizeFailed}); });
  });
  invariant(decoded.code === 0 && !decoded.signal && !decoded.sizeFailed && decoded.bytes === expectedPCMBytes,
    'ALAC_DECODE_FAILED_OR_FRAME_COUNT_MISMATCH');
  return {stream: streams[0], decoded, comparison: 'native PCM frame count; ALAC is a 24-bit listening copy, not float-bit identity'};
}
export async function verifyNormalEntryAudioEvent(e,w) {
  invariant(e.kind==='normal-course-entry'&&e.trusted===false&&e.synthetic===false,'EXPLICIT_NORMAL_ENTRY_AUDIO_CAUSE');
  const entry=await jsonFile(e.entryPin.path),contract=await jsonFile(e.contractPin.path),records=await jsonFile(e.recordsPin.path);
  for(const [actual,declared] of [[entry.pin,e.entryPin],[contract.pin,e.contractPin],[records.pin,e.recordsPin]])invariant(actual.sha256===declared.sha256&&actual.bytes===declared.bytes,'NORMAL_ENTRY_PIN_DRIFT');
  const contracts=Array.isArray(contract.value.contracts)?contract.value.contracts:[contract.value];
  const matches=contracts.filter(c=>c.animationId===w.pageIdentity.animationId);invariant(matches.length===1,'NORMAL_ENTRY_EXACT_CONTRACT');const C=matches[0];
  invariant(C.source.sha256===w.pageIdentity.sourceSha256&&C.terminal.startPolicy==='normal-course-entry-or-play','NORMAL_ENTRY_SOURCE_POLICY');
  const samples=records.value.samples.filter(s=>s.sequence===e.initialSampleSequence);invariant(samples.length===1,'NORMAL_ENTRY_ACTUAL_INITIAL_SAMPLE');const initial=samples[0];
  invariant(initial.identity.animationId===C.animationId&&initial.identity.sourceSha256===C.source.sha256&&initial.identity.replay===0&&initial.identity.playerId===e.mediaInstanceId&&initial.host.paused===false,'NORMAL_ENTRY_CURRENT_SOURCE_OWNER');
  for(const [key,value] of Object.entries(C.terminal.initialState)){invariant(JSON.stringify(key.split('.').reduce((v,k)=>v?.[k],initial))===JSON.stringify(value),'NORMAL_ENTRY_ACTUAL_INITIAL_STATE');}
  const E=entry.value,N=E.navigation,url=new URL(E.committedUrl),id=/^shared-([a-z0-9]+)-l(\d{2})-p\d{3}$/.exec(C.animationId);
  invariant(url.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(url.hostname)&&!url.username&&!url.password&&!url.search&&!url.hash&&url.pathname===`/${initial.viewport.locale}/migration-status/g678-course/${id[1]}/${Number(id[2])}`,'NORMAL_ENTRY_EXACT_LOOPBACK_ROUTE');
  invariant(E.requestedUrl===E.committedUrl&&E.responseStatus===200&&N.name===E.committedUrl&&N.type==='navigate'&&N.startTime===0&&N.responseEnd>0&&N.responseEnd<=initial.atMs&&E.sourceActionsCalled===false&&E.sourceStateWritten===false,'NORMAL_ENTRY_REAL_NAVIGATION');
  invariant(initial.observer.sourceActionsCalled===false&&initial.observer.sourceStateWritten===false&&initial.observer.syntheticInput===false&&Math.abs(e.unixMs-(initial.unixMs-initial.atMs+N.responseEnd))<=5,'NORMAL_ENTRY_OBSERVER_AND_CLOCK_BINDING');
  return [entry.pin,contract.pin,records.pin];
}

/** Native sample intervals overlapping a silent tail, including both boundary
 * samples. This is separate from the window-relative waveform accumulator. */
export function createNativeTailCoverage(startUnixMs, endUnixMs, offsetUnixMs, originPTSSeconds) {
  invariant([startUnixMs,endUnixMs,offsetUnixMs,originPTSSeconds].every(Number.isFinite) && endUnixMs > startUnixMs,
    'NATIVE_TAIL_INTERVAL_REQUIRED');
  const firstFrame = Math.floor(((startUnixMs - offsetUnixMs) / 1000 - originPTSSeconds) * 48000);
  const endFrame = Math.ceil(((endUnixMs - offsetUnixMs) / 1000 - originPTSSeconds) * 48000);
  invariant(Number.isSafeInteger(firstFrame) && Number.isSafeInteger(endFrame) && endFrame > firstFrame,
    'NATIVE_TAIL_FRAME_RANGE_REQUIRED');
  return {startUnixMs,endUnixMs,originPTSSeconds,firstFrame,endFrame,covered:new Uint8Array(endFrame-firstFrame),
    overlapFrames:0,nonzeroSamples:0,touchedBuffers:0};
}
export function includeNativeTailBuffer(coverage, row, channels) {
  invariant(Number.isSafeInteger(row.frames) && row.frames > 0 && channels.left.length === row.frames && channels.right.length === row.frames,
    'NATIVE_TAIL_STEREO_BUFFER_REQUIRED');
  const position = (row.ptsSeconds-coverage.originPTSSeconds)*48000, first = Math.round(position);
  // Reuse the index's existing 1e-8-second representation tolerance. One real
  // missing or duplicated sample remains an integer gap/overlap, not tolerance.
  invariant(Number.isSafeInteger(first) && Math.abs(position-first) < 48000e-8 &&
    Math.abs((row.endPTSSeconds-coverage.originPTSSeconds)*48000-(first+row.frames)) < 48000e-8,
    'NATIVE_TAIL_BUFFER_SAMPLE_GRID_MISMATCH');
  const from = Math.max(0,coverage.firstFrame-first), to = Math.min(row.frames,coverage.endFrame-first);
  if(from>=to)return;
  coverage.touchedBuffers++;
  for(let i=from;i<to;i++) {
    const target=first+i-coverage.firstFrame;
    if(coverage.covered[target])coverage.overlapFrames++;
    else coverage.covered[target]=1;
    if(channels.left[i]!==0)coverage.nonzeroSamples++;
    if(channels.right[i]!==0)coverage.nonzeroSamples++;
  }
}
export function finishNativeTailCoverage(coverage) {
  const observedFrames=coverage.covered.reduce((sum,value)=>sum+value,0), requiredFrames=coverage.covered.length;
  return {kind:'exact-native-silent-tail-coverage-v1',startUnixMs:coverage.startUnixMs,endUnixMs:coverage.endUnixMs,
    originPTSSeconds:coverage.originPTSSeconds,firstFrame:coverage.firstFrame,endFrame:coverage.endFrame,
    sampleRate:48000,channels:2,requiredFrames,observedFrames,missingFrames:requiredFrames-observedFrames,
    overlapFrames:coverage.overlapFrames,nonzeroSamples:coverage.nonzeroSamples,touchedBuffers:coverage.touchedBuffers,
    boundaryRule:'all-native-sample-intervals-overlapping-declared-window',
    complete:observedFrames===requiredFrames&&coverage.overlapFrames===0&&coverage.nonzeroSamples===0};
}

async function validateWindowSet(w, m) {
  invariant(w.kind === 'browser-audio-windows-v1' && w.runID === m.runID, 'WINDOW_RUN_BINDING_MISMATCH');
  invariant(['page-audit', 'capture-qualification'].includes(w.purpose), 'EXPLICIT_WINDOW_PURPOSE_REQUIRED');
  for (const key of ['pid', 'bundleID', 'executableSHA256', 'launchUnixMs']) invariant(w.target?.[key] === m.target?.[key], 'TARGET_IDENTITY_MISMATCH: ' + key);
  invariant(w.target.windowID === m.window.windowID && m.window.pid === m.target.pid, 'TARGET_WINDOW_BINDING_MISMATCH');
  invariant(w.captureTool?.sha256 === m.captureTool?.executableSHA256, 'CAPTURE_BINARY_BINDING_REQUIRED');
  if(m.backend==='coreaudio-process-tap') {
    for(const key of ['pid','parentPID','launchUnixMs','executableSHA256','audioObjectID']) invariant(w.audioProcess?.[key]===m.audioProcess?.[key], 'AUDIO_PROCESS_BINDING_MISMATCH:'+key);
    invariant(m.audioProcess.parentPID===m.target.pid && m.audioProcess.pid!==m.target.pid, 'AUDIO_PROCESS_PARENT_BINDING_REQUIRED');
    invariant(m.processTap?.isPrivate===true && m.processTap.exclusive===false && m.processTap.muteBehavior==='unmuted' &&
      m.processTap.processRestoreEnabled===false && JSON.stringify(m.processTap.includedProcessObjects)===JSON.stringify([m.audioProcess.audioObjectID]),'EXACT_PRIVATE_PROCESS_TAP_REQUIRED');
    invariant(m.privateAudioCleanup?.tapAbsentOnReadback===true && m.privateAudioCleanup.aggregateAbsentOnReadback===true &&
      ['destroyIOStatus','destroyAggregateStatus','destroyTapStatus','stopStatus'].every(key=>m.privateAudioCleanup[key]===0),'PRIVATE_TAP_CLEANUP_REQUIRED');
    invariant(m.identityChecks.every(check=>['pid','parentPID','launchUnixMs','executable','audioObjectID'].every(key=>check.audioProcess?.[key]===m.audioProcess?.[key])), 'LIVE_AUDIO_PROCESS_IDENTITY_REQUIRED');
  }
  invariant(w.isolatedBrowser === true && w.singleTaskAudio === true, 'DEDICATED_BROWSER_AUDIO_SCOPE_REQUIRED');
  invariant(Array.isArray(w.events) && Array.isArray(w.windows) && w.windows.length > 0, 'AUDIO_WINDOWS_AND_EVENTS_REQUIRED');
  const eventMap = new Map(), navigationPins=[];
  for (const e of w.events) {
    invariant(typeof e.id === 'string' && !eventMap.has(e.id) && Number.isFinite(e.unixMs), 'INVALID_OR_DUPLICATE_AUDIO_EVENT');
    invariant(typeof e.mediaInstanceId === 'string' && e.mediaInstanceId.length > 0, 'CURRENT_MEDIA_EVENT_REQUIRED');
    if(e.kind==='normal-course-entry'){invariant(w.purpose==='page-audit','NORMAL_ENTRY_IS_NOT_TOOL_QUALIFICATION');navigationPins.push(...await verifyNormalEntryAudioEvent(e,w));}
    else invariant(e.trusted===true,'TRUSTED_CURRENT_MEDIA_EVENT_REQUIRED');
    eventMap.set(e.id, e);
  }
  const ids = new Set();
  for (const row of w.windows) {
    invariant(typeof row.id === 'string' && !ids.has(row.id), 'DUPLICATE_OR_MISSING_WINDOW_ID'); ids.add(row.id);
    invariant(['audible', 'silent', 'pause', 'stop'].includes(row.kind), 'UNKNOWN_AUDIO_WINDOW_KIND');
    invariant(Number.isFinite(row.startUnixMs) && Number.isFinite(row.endUnixMs) && row.endUnixMs - row.startUnixMs >= POLICY.minimumWindowMs + POLICY.edgeTrimMs * 2,
      'AUDIO_WINDOW_TOO_SHORT_OR_INVALID');
    invariant(row.startUnixMs >= m.readyClock.unixMs && row.endUnixMs <= m.clockAfter.unixMs, 'AUDIO_WINDOW_OUTSIDE_CAPTURE');
    const event = eventMap.get(row.triggerEventId);
    invariant(event && event.mediaInstanceId === row.mediaInstanceId && event.unixMs <= row.startUnixMs, 'WINDOW_EVENT_MEDIA_BINDING_MISMATCH');
    if (w.purpose === 'page-audit') {
      invariant(typeof row.cueId === 'string' && /^[a-f0-9]{64}$/.test(row.sourceSha256 ?? ''), 'PAGE_CUE_SOURCE_IDENTITY_REQUIRED');
      invariant(w.pageIdentity?.animationId && /^[a-f0-9]{64}$/.test(w.pageIdentity?.sourceSha256 ?? '') && typeof w.pageIdentity?.buildId === 'string', 'PAGE_BUILD_SOURCE_BINDING_REQUIRED');
    }
  }
  return navigationPins;
}

async function verifyNegativeProcess(negative, captureTool, expectedPID) {
  invariant(negative?.receiptPath && /^[a-f0-9]{64}$/.test(negative.sha256 ?? ''), 'WRONG_PROCESS_REJECTION_RECEIPT_REQUIRED');
  const loaded = await jsonFile(negative.receiptPath); invariant(loaded.pin.sha256 === negative.sha256, 'WRONG_PROCESS_RECEIPT_DRIFT');
  const r = loaded.value;
  invariant(r.kind === 'browser-audio-negative-process-v1' && r.executed === true && r.expectedPID !== r.attemptedPID &&
    r.expectedPID===expectedPID && Number.isSafeInteger(r.expectedPID) && Number.isSafeInteger(r.attemptedPID) && r.exitCode !== 0 && r.exitCode !== null,
    'WRONG_PROCESS_WAS_NOT_REJECTED');
  invariant(r.binarySHA256 === captureTool.sha256 && r.stdout === '' && r.outputCreated === false, 'WRONG_PROCESS_CAPTURE_BOUNDARY_FAILED');
  const error = JSON.parse(r.stderr);
  invariant(error.kind === 'browser-audio-command-failure-v1' &&
    /(?:AUDIO_)?PROCESS_(IDENTITY_UNAVAILABLE|BUNDLE_MISMATCH|PARENT_MISMATCH|LAUNCH_TIME_MISMATCH|EXECUTABLE_HASH_MISMATCH)|WINDOW_PID_MISMATCH/.test(error.error ?? ''),
    'EXPECTED_IDENTITY_REJECTION_REQUIRED');
  return loaded.pin;
}

export async function assessCapture({manifestPath, windowsPath}) {
  const manifest = await jsonFile(manifestPath), request = await jsonFile(windowsPath), m = manifest.value, w = request.value;
  const root = path.dirname(manifestPath);
  invariant(m.kind === 'browser-application-audio-capture-v1' && m.status === 'RAW_CAPTURE_COMPLETE_UNASSESSED' &&
    Array.isArray(m.failures) && m.failures.length === 0, 'CAPTURE_NOT_COMPLETE');
  invariant(m.audioScope === 'exact-application-not-single-tab' && m.screenPixelsRecorded === false, 'UNRECOGNIZED_CAPTURE_SCOPE');
  invariant(m.audio?.buffers > 0 && m.audio?.nativePCMBytes > 0 && m.audio?.alacBytes > 0 && !m.audio?.error, 'NO_VALID_OUTPUT_AUDIO_CAPTURE');
  invariant(Array.isArray(m.identityChecks) && m.identityChecks.length > 0 && m.identityChecks.every(r => r.pid === m.target.pid &&
    r.windowID === m.window.windowID && r.launchUnixMs === m.target.launchUnixMs), 'LIVE_IDENTITY_CHECKS_REQUIRED');
  for (const c of [m.clockBefore, m.readyClock, m.clockAfter]) invariant(c && Number.isFinite(c.unixMs) && Number.isFinite(c.hostSeconds) &&
    Number.isFinite(c.uncertaintyMs) && c.uncertaintyMs >= 0 && c.uncertaintyMs <= 5, 'INVALID_CAPTURE_CLOCK');
  const offsetBefore = m.clockBefore.unixMs - m.clockBefore.hostSeconds * 1000;
  const offsetAfter = m.clockAfter.unixMs - m.clockAfter.hostSeconds * 1000;
  invariant(Math.abs(offsetAfter - offsetBefore) <= POLICY.maxClockDriftMs, 'CAPTURE_WALL_CLOCK_DRIFT');
  const navigationPins=await validateWindowSet(w, m);
  const pcmPath = asset(root, m.audio.nativePCMFile, 'native-audio.pcm');
  const indexPath = asset(root, m.audio.indexFile, 'audio-buffers.jsonl');
  const alacPath = asset(root, m.audio.alacFile, 'application-audio.m4a');
  const pins = await Promise.all([fileHash(pcmPath), fileHash(indexPath, 32 * 1024 * 1024), fileHash(alacPath)]);
  invariant(pins[0].bytes === m.audio.nativePCMBytes && pins[0].sha256 === m.audio.nativePCMSHA256 &&
    pins[1].sha256 === m.audio.indexSHA256 && pins[2].sha256 === m.audio.alacSHA256 && pins[2].bytes === m.audio.alacBytes,
    'CAPTURE_ASSET_DRIFT');
  const alacVerification = await verifyALAC(alacPath, pins[0].bytes);
  const records = (await readFile(indexPath, 'utf8')).trim().split('\n').map(line => JSON.parse(line));
  invariant(records.length === m.audio.buffers, 'AUDIO_BUFFER_COUNT_MISMATCH');
  const accumulators = w.windows.map(row => {
    const start = row.startUnixMs + POLICY.edgeTrimMs, end = row.endUnixMs - POLICY.edgeTrimMs;
    const count = Math.floor((end - start) / 1000 * 48000);
    return {row, start, end, left: new Float32Array(count), right: new Float32Array(count), covered: new Uint8Array(count), overlaps: 0,
      nativeTail:row.kind==='silent'&&row.role==='observed-stop-zero-reference-tail'
        ?createNativeTailCoverage(start,end,offsetBefore,records[0].ptsSeconds):null};
  });
  let expectedOffset = 0, previousEnd = null;
  const input = await open(pcmPath, 'r');
  try {
    for (const [index, row] of records.entries()) {
      invariant(row.ordinal === index + 1 && row.byteOffset === expectedOffset && row.bytes === row.frames * 8 &&
        Number.isFinite(row.ptsSeconds) && Number.isFinite(row.endPTSSeconds) &&
        Math.abs(row.endPTSSeconds - row.ptsSeconds - row.frames / 48000) < 1e-8, 'INVALID_BUFFER_INDEX');
      invariant(previousEnd === null || row.ptsSeconds >= previousEnd - 1 / 48000, 'BUFFER_TIMELINE_REORDER');
      const bytes = Buffer.alloc(row.bytes), read = await input.read(bytes, 0, bytes.length, row.byteOffset);
      invariant(read.bytesRead === bytes.length && hashBytes(bytes) === row.sha256, 'BUFFER_BYTES_HASH_MISMATCH');
      const channels = pcmChannels(bytes, row);
      const sourceStartMs = offsetBefore + row.ptsSeconds * 1000;
      for (const a of accumulators) {
        if(a.nativeTail)includeNativeTailBuffer(a.nativeTail,row,channels);
        if (sourceStartMs > a.end || sourceStartMs + row.frames / 48 < a.start) continue;
        const first = Math.max(0, Math.ceil((a.start - sourceStartMs) * 48));
        const last = Math.min(row.frames, Math.ceil((a.end - sourceStartMs) * 48));
        for (let i = first; i < last; i++) {
          const target = Math.round((sourceStartMs - a.start) * 48) + i;
          if (target < 0 || target >= a.left.length) continue;
          if (a.covered[target]) { a.overlaps++; continue; }
          a.covered[target] = 1; a.left[target] = channels.left[i]; a.right[target] = channels.right[i];
        }
      }
      expectedOffset += row.bytes; previousEnd = row.endPTSSeconds;
    }
  } finally { await input.close(); }
  invariant(expectedOffset === pins[0].bytes, 'PCM_TRAILING_OR_MISSING_BYTES');
  const results = [], referencePins = [];
  for (const a of accumulators) {
    const coverage = a.covered.reduce((x, v) => x + v, 0) / a.covered.length;
    const metrics = measurePCM(a.left, a.right), findings = [];
    const nativeTailCoverage=a.nativeTail?finishNativeTailCoverage(a.nativeTail):null;
    if(nativeTailCoverage&&!nativeTailCoverage.complete)findings.push('NATIVE_SILENT_TAIL_INCOMPLETE_OVERLAPPING_OR_NONZERO');
    if (coverage < POLICY.minCoverage || a.overlaps > 2) findings.push('MISSING_OR_OVERLAPPING_PCM_COVERAGE');
    const mono = Float32Array.from(a.left, (v, i) => (v + a.right[i]) / 2);
    let sourceMatch = null;
    if (a.row.kind === 'audible') {
      if (metrics.rms < POLICY.audibleRMS || metrics.nonzeroSamples === 0) findings.push('REQUIRED_AUDIO_OUTPUT_SILENT');
      if (w.purpose === 'capture-qualification') {
        const frequency = a.row.toneHz;
        invariant(frequency === 440, 'QUALIFICATION_REQUIRES_KNOWN_440HZ_TONE');
        const fraction = toneEnergyFraction(mono, frequency);
        sourceMatch = {status: fraction >= .90 ? 'QUALIFICATION_TONE_MATCH' : 'QUALIFICATION_TONE_MISMATCH', frequency, energyFraction: fraction};
        if (fraction < .90) findings.push('QUALIFICATION_WRONG_AUDIO');
      } else if (a.row.reference) {
        const reference = a.row.reference;
        const loaded = await jsonFile(reference.decodeReceiptPath), decoded = loaded.value;
        invariant(loaded.pin.sha256 === reference.decodeReceiptSHA256 && decoded.kind === 'browser-audio-source-decode-v1', 'DECODE_RECEIPT_BINDING_MISMATCH');
        invariant(decoded.source.sha256 === a.row.sourceSha256, 'CUE_SOURCE_HASH_MISMATCH');
        const sourcePin = await fileHash(decoded.source.path), pcmPin = await fileHash(decoded.pcm.path);
        invariant(sourcePin.sha256 === decoded.source.sha256 && sourcePin.bytes === decoded.source.bytes &&
          pcmPin.sha256 === decoded.pcm.sha256 && pcmPin.bytes === decoded.pcm.bytes, 'SOURCE_OR_DECODED_PCM_DRIFT');
        invariant(decoded.format === 'f32le-mono-48000' && pcmPin.bytes % 4 === 0, 'REFERENCE_PCM_FORMAT_MISMATCH');
        if (decoded.decodeMode === 'pinned-browser-pcm-resample') {
          for (const pin of [decoded.originalPCM, decoded.measurementPin]) {
            invariant(pin && typeof pin.path === 'string', 'ORIGINAL_BROWSER_PCM_BINDING_REQUIRED');
            const current = await fileHash(pin.path);
            invariant(current.sha256 === pin.sha256 && current.bytes === pin.bytes, 'ORIGINAL_BROWSER_PCM_OR_MEASUREMENT_DRIFT');
            referencePins.push(current);
          }
          const range = reference.originalSampleRange;
          invariant(range && range.pcmSha256 === decoded.originalPCM.sha256 && range.sampleRate === decoded.originalFormat.sampleRate &&
            range.channels === decoded.originalFormat.channels && Number.isSafeInteger(range.firstDecodedSample) &&
            Number.isSafeInteger(range.endDecodedSample) && range.firstDecodedSample >= 0 && range.endDecodedSample > range.firstDecodedSample &&
            range.endDecodedSample <= decoded.originalFormat.decodedSamples &&
            Math.abs(reference.startSeconds - range.firstDecodedSample / range.sampleRate) < 1e-9 &&
            Math.abs(reference.endSeconds - range.endDecodedSample / range.sampleRate) < 1e-9, 'EXACT_ORIGINAL_PCM_SUBRANGE_REQUIRED');
        }
        invariant(Number.isFinite(reference.startSeconds) && reference.startSeconds >= 0 &&
          Number.isFinite(reference.endSeconds) && reference.endSeconds > reference.startSeconds, 'EXACT_SOURCE_SEGMENT_REQUIRED');
        const refStart = Math.round((reference.startSeconds + POLICY.edgeTrimMs / 1000) * 48000);
        const refEnd = Math.round((reference.endSeconds - POLICY.edgeTrimMs / 1000) * 48000);
        invariant(refStart >= 0 && refEnd * 4 <= pcmPin.bytes && mono.length >= refEnd - refStart &&
          mono.length - (refEnd - refStart) <= POLICY.maxAlignmentMs * 2 * 48,
          'SOURCE_AND_CAPTURE_WINDOW_DURATION_MISMATCH');
        const buffer = Buffer.alloc((refEnd - refStart) * 4), handle = await open(pcmPin.path, 'r');
        try { invariant((await handle.read(buffer, 0, buffer.length, refStart * 4)).bytesRead === buffer.length, 'REFERENCE_READ_INCOMPLETE'); }
        finally { await handle.close(); }
        const samples = Float32Array.from({length: buffer.length / 4}, (_, i) => buffer.readFloatLE(i * 4));
        invariant(samples.every(Number.isFinite), 'NONFINITE_REFERENCE_PCM');
        sourceMatch = matchSourceWaveform(samples, mono);
        if (reference.originalSampleRange) sourceMatch.sourceWindow = {...reference.originalSampleRange};
        if (!sourceMatch.passed) findings.push('SOURCE_WAVEFORM_MISMATCH');
        referencePins.push(loaded.pin, sourcePin, pcmPin);
      } else { findings.push('SOURCE_MATCH_NOT_CONFIGURED'); }
    } else if (metrics.rms > POLICY.silentRMS || metrics.peak > POLICY.silentPeak) { findings.push('UNEXPECTED_OUTPUT_DURING_' + a.row.kind.toUpperCase()); }
    results.push({id: a.row.id, kind: a.row.kind, role: a.row.role ?? null, cueId: a.row.cueId ?? null,
      mediaInstanceId: a.row.mediaInstanceId, triggerEventId: a.row.triggerEventId, sourceSha256: a.row.sourceSha256 ?? null,
      startUnixMs: a.start, endUnixMs: a.end, coverage, overlapFrames: a.overlaps, metrics, sourceMatch,
      ...(nativeTailCoverage?{nativeTailCoverage}:{}),
      sourcePlaybackStartSeconds: a.row.sourcePlaybackStartSeconds ?? null,
      sourcePlaybackEndSeconds: a.row.sourcePlaybackEndSeconds ?? null,
      status: findings.length === 0 ? 'PASS' : 'FAIL', findings});
  }
  let negativePin = null;
  if (w.purpose === 'capture-qualification') {
    const roles = ['normal', 'mute', 'pause', 'resume', 'stop'];
    invariant(roles.every(role => results.filter(row => row.role === role).length === 1), 'COMPLETE_QUALIFICATION_CONTROL_MATRIX_REQUIRED');
    invariant(results.find(r => r.role === 'normal').kind === 'audible' && results.find(r => r.role === 'resume').kind === 'audible' &&
      results.find(r => r.role === 'mute').kind === 'silent' && results.find(r => r.role === 'pause').kind === 'pause' &&
      results.find(r => r.role === 'stop').kind === 'stop', 'QUALIFICATION_ROLE_KIND_MISMATCH');
    negativePin = await verifyNegativeProcess(w.negativeProcessTest, w.captureTool,m.target.pid);
    if(m.backend==='coreaudio-process-tap') referencePins.push(await verifyNegativeProcess(w.negativeAudioProcessTest,w.captureTool,m.audioProcess.pid));
  }
  const passed = results.every(row => row.status === 'PASS') && results.some(row => row.kind === 'audible');
  return {kind: 'browser-audio-assessment-v1', purpose: w.purpose, runID: m.runID,
    status: passed ? (w.purpose === 'capture-qualification' ? 'CAPTURE_QUALIFICATION_PASS' : 'DECLARED_AUDIO_WINDOWS_PASS') : 'FAIL',
    passed, policy: POLICY, target: m.target, window: m.window, pageIdentity: w.pageIdentity ?? null,
    inputPins: [manifest.pin, request.pin, ...navigationPins, ...pins, ...referencePins, ...(negativePin ? [negativePin] : [])],
    alacVerification, windows: results, allPageCuesCovered: false, browserInteractionCoverageEstablished: false,
    humanListeningAcceptance: false, originalRuntimeAcceptance: false, ownerAcceptance: false,
    limitation: 'Application-scoped capture requires a dedicated single-task browser. Declared windows do not prove the cue inventory is complete.'};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [manifestPath, windowsPath, out] = process.argv.slice(2);
  if (!manifestPath || !windowsPath || !out) throw Error('Usage: node assess.mjs CAPTURE_MANIFEST WINDOWS_JSON NEW_RESULT_JSON');
  let result;
  try { result = await assessCapture({manifestPath, windowsPath}); }
  catch (error) { result = {kind: 'browser-audio-assessment-v1', status: 'FAIL', passed: false, error: String(error),
    humanListeningAcceptance: false, originalRuntimeAcceptance: false}; }
  await writeFile(out, JSON.stringify(result, null, 2) + '\n', {flag: 'wx'});
  console.log(JSON.stringify({status: result.status, result: path.resolve(out)}));
  if (!result.passed) process.exitCode = 1;
}
