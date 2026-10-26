/** Preparation callable for the already-owned browser. No launch, navigation,
 * HTTP server, audio playback, recording, or output-device change is provided. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec = promisify(execFile), sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sameBytes = (a, b) => a?.bytes === b?.bytes && a?.sha256 === b?.sha256;
const hashFile = file => {const bytes = fs.readFileSync(file); return {path: file, bytes: bytes.length, sha256: sha(bytes)};};
function exactFile(pin) {
  assert(pin && path.isAbsolute(pin.path) && fs.realpathSync(pin.path) === pin.path, 'EXACT_PHYSICAL_REFERENCE_INPUT_REQUIRED');
  const before = fs.lstatSync(pin.path, {bigint: true});
  assert(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n, 'ORDINARY_REFERENCE_INPUT_REQUIRED');
  const bytes = fs.readFileSync(pin.path), after = fs.lstatSync(pin.path, {bigint: true});
  assert(['dev', 'ino', 'size', 'mtimeNs', 'ctimeNs', 'nlink'].every(key => before[key] === after[key]) &&
    bytes.length === pin.bytes && sha(bytes) === pin.sha256, 'REFERENCE_INPUT_DRIFT');
  return bytes;
}

/** Pass this exact function to page.evaluate. Returned PCM comes only from
 * browser AudioBuffer channel data, with explicit little-endian serialization. */
export async function decodeNativeReferenceInDocument(request) {
  const documentId = window.__g678TechnicalObserver?.records?.documentId;
  if (!documentId || documentId !== request.documentId || location.href !== request.href ||
      location.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(location.hostname) || !isSecureContext)
    throw Error('EXACT_OWNED_LOOPBACK_MEASUREMENT_DOCUMENT_REQUIRED');
  const digest = async bytes => [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(value => value.toString(16).padStart(2, '0')).join('');
  const source = Uint8Array.from(atob(request.sourceBase64), value => value.charCodeAt(0));
  if (source.byteLength !== request.source.bytes || await digest(source) !== request.source.sha256) throw Error('SOURCE_BYTES_BEFORE_NATIVE_DECODE_MISMATCH');
  const Native = window.AudioContext ?? window.webkitAudioContext;
  if (typeof Native !== 'function') throw Error('NATIVE_AUDIO_CONTEXT_UNAVAILABLE');
  const time = () => ({atMs: performance.now(), unixMs: Date.now()});
  const output = {kind: 'browser-native-source-pcm-raw-v1', document: {documentId, href: location.href,
    userAgent: navigator.userAgent, platform: navigator.platform, ...time()}, source: request.source,
    decoderAPI: 'AudioContext.decodeAudioData', requestedSampleRate: request.sampleRate, playbackInvoked: false,
    htmlMediaInternalPCMObserved: false, runs: [], failures: []};
  for (let repeat = 1; repeat <= 2; repeat++) {
    const context = new Native({sampleRate: request.sampleRate}), calls = {bufferSources: 0, gainNodes: 0, resumes: 0};
    const row = {repeat, started: time(), playbackCalls: calls}; output.runs.push(row);
    try {
      for (const [method, counter] of [['createBufferSource', 'bufferSources'], ['createGain', 'gainNodes'], ['resume', 'resumes']]) {
        const native = context[method];
        if (typeof native !== 'function') throw Error('NATIVE_CONTEXT_OPERATION_UNOBSERVABLE:' + method);
        context[method] = function(...args) {calls[counter]++; return Reflect.apply(native, this, args);};
      }
      await context.suspend(); row.contextStateBeforeDecode = context.state;
      if (context.state !== 'suspended') throw Error('REFERENCE_CONTEXT_NOT_SUSPENDED');
      const buffer = await context.decodeAudioData(source.buffer.slice(0));
      row.contextStateAfterDecode = context.state;
      if (context.state !== 'suspended') throw Error('REFERENCE_CONTEXT_RAN_DURING_DECODE');
      if (buffer.sampleRate !== request.sampleRate || ![1, 2].includes(buffer.numberOfChannels) ||
          !Number.isSafeInteger(buffer.length) || buffer.length <= 0 || buffer.length * buffer.numberOfChannels * 4 > 128 * 1024 * 1024)
        throw Error('REFERENCE_NATIVE_FORMAT_OUTSIDE_BOUND');
      const pcm = new ArrayBuffer(buffer.length * buffer.numberOfChannels * 4), view = new DataView(pcm);
      const channels = Array.from({length: buffer.numberOfChannels}, (_, i) => buffer.getChannelData(i));
      let nonfiniteSamples = 0, nonzeroSamples = 0, peak = 0;
      for (let frame = 0; frame < buffer.length; frame++) for (let channel = 0; channel < channels.length; channel++) {
        const value = channels[channel][frame];
        if (!Number.isFinite(value)) nonfiniteSamples++;
        if (value !== 0) nonzeroSamples++;
        peak = Math.max(peak, Math.abs(value)); view.setFloat32((frame * channels.length + channel) * 4, value, true);
      }
      const bytes = new Uint8Array(pcm), pieces = [];
      for (let offset = 0; offset < bytes.length; offset += 32768) pieces.push(String.fromCharCode(...bytes.subarray(offset, offset + 32768)));
      Object.assign(row, {decoderAPI: 'AudioContext.decodeAudioData', inputBytes: source.byteLength, inputSha256: request.source.sha256,
        sampleRate: buffer.sampleRate, channels: buffer.numberOfChannels, length: buffer.length, durationSeconds: buffer.duration,
        pcmFormat: 'f32le-interleaved', pcmBytes: bytes.length, pcmSha256: await digest(pcm), pcmBase64: btoa(pieces.join('')),
        nonfiniteSamples, nonzeroSamples, peak});
      if (nonfiniteSamples !== 0 || calls.bufferSources !== 0 || calls.gainNodes !== 0 || calls.resumes !== 0) throw Error('REFERENCE_DECODE_ONLY_BOUNDARY_FAILED');
    } catch (error) {row.error = String(error); output.failures.push(row.error);}
    finally {
      try {await context.close();} catch (error) {row.closeError = String(error); output.failures.push(row.closeError);}
      row.contextStateAfterClose = context.state; row.finished = time();
      if (context.state !== 'closed') output.failures.push('REFERENCE_CONTEXT_NOT_CLOSED');
    }
  }
  output.repeatedDecodeIdentical = output.runs.length === 2 && output.runs.every(row => !row.error && !row.closeError &&
    row.pcmSha256 === output.runs[0].pcmSha256 && row.length === output.runs[0].length && row.sampleRate === output.runs[0].sampleRate && row.channels === output.runs[0].channels);
  return output;
}

export function validateNativePcmRaw(raw, source) {
  assert(raw?.kind === 'browser-native-source-pcm-raw-v1' && raw.decoderAPI === 'AudioContext.decodeAudioData' &&
    sameBytes(raw.source, source) && raw.playbackInvoked === false && raw.htmlMediaInternalPCMObserved === false &&
    raw.repeatedDecodeIdentical === true && raw.failures?.length === 0 && raw.runs?.length === 2, 'ACTUAL_NATIVE_DECODE_RESULT_REQUIRED');
  return raw.runs.map(row => {
    const bytes = Buffer.from(row.pcmBase64, 'base64');
    assert(row.decoderAPI === 'AudioContext.decodeAudioData' && row.inputBytes === source.bytes && row.inputSha256 === source.sha256 &&
      row.contextStateBeforeDecode === 'suspended' && row.contextStateAfterDecode === 'suspended' && row.contextStateAfterClose === 'closed' &&
      row.playbackCalls?.bufferSources === 0 && row.playbackCalls.gainNodes === 0 && row.playbackCalls.resumes === 0 &&
      row.nonfiniteSamples === 0 && Number.isSafeInteger(row.sampleRate) && row.sampleRate >= 8000 && [1, 2].includes(row.channels) &&
      Number.isSafeInteger(row.length) && row.length > 0 && row.pcmFormat === 'f32le-interleaved' && row.pcmBytes === bytes.length &&
      bytes.length === row.length * row.channels * 4 && sha(bytes) === row.pcmSha256 &&
      Math.abs(row.durationSeconds - row.length / row.sampleRate) <= 1 / row.sampleRate, 'NATIVE_PCM_BYTES_OR_FORMAT_MISMATCH');
    for (let offset = 0; offset < bytes.length; offset += 4) assert(Number.isFinite(bytes.readFloatLE(offset)), 'NONFINITE_EXPORTED_NATIVE_PCM');
    return bytes;
  });
}

/** Main writer calls this before freezing the P005 audio contract, in the same
 * inspected browser subsequently used for the six configurations. The existing
 * decode-reference script only resamples this measured PCM; it never decodes MP3. */
export async function prepareBrowserNativePcmReferences({page, sources, browserInspection, browserInspectionPin,
  outputDirectory, resampleTool, decoder}) {
  assert(path.isAbsolute(outputDirectory) && !fs.existsSync(outputDirectory), 'NEW_REFERENCE_DIRECTORY_REQUIRED');
  const retainedInspection = JSON.parse(exactFile(browserInspectionPin)); exactFile(resampleTool); exactFile(decoder);
  assert.deepEqual(retainedInspection.identity, browserInspection?.identity, 'BROWSER_INSPECTION_PIN_MISMATCH');
  assert(browserInspection?.identity?.pid > 0 && browserInspection.identity.executableSHA256 && browserInspection.identity.launchUnixMs > 0,
    'ACTUAL_BROWSER_INSPECTION_REQUIRED');
  const browser = page.context().browser();
  assert(browser && typeof browser.newBrowserCDPSession === 'function', 'ACTUAL_OWNED_BROWSER_HANDLE_REQUIRED');
  const cdp = await browser.newBrowserCDPSession(); let browserProtocolIdentity;
  try {
    const processes = await cdp.send('SystemInfo.getProcessInfo'), version = await cdp.send('Browser.getVersion');
    const main = processes.processInfo.filter(row => row.type === 'browser');
    assert.equal(main.length, 1, 'ONE_BROWSER_PROCESS_FROM_ACTUAL_PAGE_HANDLE_REQUIRED');
    assert.equal(main[0].id, browserInspection.identity.pid, 'REFERENCE_PAGE_BROWSER_PID_MISMATCH');
    browserProtocolIdentity = {process: main[0], version};
  } finally {await cdp.detach();}
  fs.mkdirSync(outputDirectory, {recursive: true});
  const put = (file, value) => {fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', {flag: 'wx'}); return hashFile(file);};
  const document = await page.evaluate(() => ({documentId: window.__g678TechnicalObserver?.records?.documentId, href: location.href}));
  const references = [];
  for (const selected of sources) {
    assert(/^[a-z0-9][a-z0-9-]{0,63}$/.test(selected.id), 'SAFE_REFERENCE_ID_REQUIRED');
    const bytes = exactFile(selected.source), directory = path.join(outputDirectory, selected.id); fs.mkdirSync(directory);
    const raw = await page.evaluate(decodeNativeReferenceInDocument, {sourceBase64: bytes.toString('base64'), source: selected.source,
      sampleRate: selected.sampleRate, documentId: document.documentId, href: document.href});
    assert.equal(raw.document?.userAgent, browserProtocolIdentity.version.userAgent, 'MEASUREMENT_DOCUMENT_BROWSER_MISMATCH');
    let pcm;
    try {pcm = validateNativePcmRaw(raw, selected.source);}
    catch (error) {put(path.join(directory, 'measurement-failure.json'), {...raw, error: String(error)}); throw error;}
    assert(pcm[0].equals(pcm[1]), 'INDEPENDENT_NATIVE_DECODES_DIFFER');
    const runs = raw.runs.map((row, index) => {
      const {pcmBase64, ...facts} = row, file = path.join(directory, `native-${index + 1}.f32le`);
      fs.writeFileSync(file, pcm[index], {flag: 'wx'}); return {...facts, pcm: hashFile(file)};
    });
    const measurement = put(path.join(directory, 'measurement.json'), {kind: 'browser-native-source-pcm-measurement-v1', source: selected.source,
      document: raw.document, browser: {inspectionPin: browserInspectionPin, target: browserInspection.identity},
      browserProtocolIdentity,
      decoderAPI: raw.decoderAPI, repeatedDecodeIdentical: true, playbackInvoked: false, htmlMediaInternalPCMObserved: false, runs});
    const sourcePCM = runs[0].pcm, format = runs[0];
    const measurementBinding = put(path.join(directory, 'measurement-binding.json'), {kind: 'existing-browser-pcm-measurement-binding-v1',
      originalMeasurement: measurement, sourcePayload: selected.source, browserPcm: sourcePCM,
      plan: {decoder: {sourceSha256: selected.source.sha256, sourceBytes: selected.source.bytes, sampleRate: format.sampleRate,
        channels: format.channels, decodedSamples: format.length, pcmSha256: sourcePCM.sha256}},
      measurementPerformed: false, sourcePlaybackPerformed: false, outputCapturePerformed: false});
    const referenceDirectory = path.join(directory, 'reference');
    const result = await exec(process.execPath, [resampleTool.path, '--browser-measurement', measurementBinding.path, measurementBinding.sha256, referenceDirectory],
      {timeout: 150000, maxBuffer: 1024 * 1024});
    put(path.join(directory, 'resample-command.json'), {tool: resampleTool, arguments: ['--browser-measurement', measurementBinding.path, measurementBinding.sha256, referenceDirectory],
      stdout: result.stdout, stderr: result.stderr, outputAudioRecorded: false});
    const decodeReceipt = hashFile(path.join(referenceDirectory, 'decode-receipt.json')), decoded = JSON.parse(fs.readFileSync(decodeReceipt.path, 'utf8'));
    assert(decoded.decodeMode === 'pinned-browser-pcm-resample' && sameBytes(decoded.originalPCM, sourcePCM) && sameBytes(decoded.source, selected.source) &&
      sameBytes(decoded.decoder, decoder), 'EXISTING_RESAMPLER_MUST_USE_EXACT_NATIVE_PCM');
    exactFile(selected.source); exactFile(browserInspectionPin); exactFile(resampleTool); exactFile(decoder);
    references.push({id: selected.id, source: selected.source, sourcePCM, measurement, measurementBinding, decodeReceipt,
      referencePCM: decoded.pcm, decoder, format: {sampleRate: format.sampleRate, channels: format.channels, decodedSamples: format.length},
      durationSeconds: format.length / format.sampleRate});
  }
  put(path.join(outputDirectory, 'references.json'), {kind: 'source-vm-native-pcm-reference-preparation-v1', references,
    outputAudioRecorded: false, htmlMediaInternalPCMObserved: false, pageCredit: 0});
  return references;
}
