/** Pure source-vm audio-window derivation. This never captures, decodes, plays,
 * rewrites observations, or gives page credit. Existing surface-run derivation
 * stays in g678-actual-audio-collector-v1.mjs unchanged. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sourceVmReplayCause} from '../lib/g678-source-vm-lifecycle-v1.mjs';

const finite = Number.isFinite;
const text = value => typeof value === 'string' && value.length > 0;
const token = value => text(value) || Number.isSafeInteger(value) && value > 0;
const pin = value => value && text(value.path) && Number.isSafeInteger(value.bytes) && value.bytes > 0 && /^[a-f0-9]{64}$/.test(value.sha256 ?? '');
const sameBytes = (a, b) => pin(a) && pin(b) && a.bytes === b.bytes && a.sha256 === b.sha256;
const samePin = (a, b) => sameBytes(a, b) && a.path === b.path;
const validOwner = owner => owner?.ownerKind === 'source-vm' && text(owner.playerId) && token(owner.leaseToken) &&
  text(owner.animationId) && /^[a-f0-9]{64}$/.test(owner.sourceSha256 ?? '') && Number.isSafeInteger(owner.replay) && owner.replay >= 0;
const sameOwner = (a, b) => validOwner(a) && validOwner(b) && a.playerId === b.playerId && a.leaseToken === b.leaseToken &&
  a.replay === b.replay && a.animationId === b.animationId && a.sourceSha256 === b.sourceSha256;
const one = (rows, label) => {assert.equal(rows.length, 1, label); return rows[0];};
const timed = row => row && finite(row.atMs) && finite(row.unixMs);

function priorSourceBuffersRetired(records, owner, boundaryAtMs, endAtMs, sourceHashes) {
  const prior = (records.starts ?? []).filter(row => row.started && row.atMs <= endAtMs && !sameOwner(row.owner, owner) &&
    (row.owner?.animationId === owner.animationId || (records.decodes ?? []).some(decode => sourceHashes.includes(decode.sha256) && decode.bufferId === row.bufferId)));
  for (const old of prior) {
    assert(old.atMs <= boundaryAtMs, 'OLDER_SOURCE_BUFFER_STARTED_IN_CURRENT_FLOW');
    assert((records.ended ?? []).some(row => row.nodeId === old.nodeId && row.atMs <= boundaryAtMs) ||
      (records.stops ?? []).some(row => row.nodeId === old.nodeId && row.stopped && row.effectiveWhen <= row.contextTime && row.atMs <= boundaryAtMs) ||
      (records.contextOps ?? []).some(row => row.contextId === old.contextId && row.method === 'close' && row.state === 'fulfilled' && row.settled?.atMs <= boundaryAtMs),
    'OLDER_SOURCE_BUFFER_NOT_ACTUALLY_RETIRED');
  }
}

function priorHtmlElementsRetired(records, owner, boundaryAtMs, endAtMs, sourceUrls) {
  const observed = records.htmlMedia;
  const prior = (observed?.operations ?? []).filter(row => row.method === 'play' && row.atMs <= endAtMs && !sameOwner(row.owner, owner) &&
    (row.owner?.animationId === owner.animationId || sourceUrls.includes(row.before?.src) || sourceUrls.includes(row.before?.currentSrc)));
  for (const old of prior) {
    assert(validOwner(old.owner) && text(old.mediaElementId) && timed(old) && old.atMs <= boundaryAtMs &&
      ['fulfilled', 'rejected'].includes(old.state) && timed(old.settled) && old.settled.atMs <= boundaryAtMs && sameOwner(old.owner, old.settled.owner),
    'OLDER_HTML_PLAY_NOT_SETTLED_BEFORE_CURRENT_FLOW');
    const all = [...(observed.events ?? []), ...(observed.samples ?? []),
      ...(observed.operations ?? []).flatMap(row => row.settled ? [{...row.settled, mediaElementId: row.mediaElementId}] : [])]
      .filter(row => row.mediaElementId === old.mediaElementId && row.atMs <= endAtMs);
    assert(all.every(row => sameOwner(row.owner, old.owner) && timed(row)), 'OLDER_HTML_ELEMENT_OWNER_DRIFT');
    const before = all.filter(row => row.atMs <= boundaryAtMs), latestAt = Math.max(...before.map(row => row.atMs));
    assert(before.length && before.filter(row => row.atMs === latestAt).every(row => row.state?.paused === true || row.state?.ended === true) &&
      all.filter(row => row.atMs > boundaryAtMs).every(row => row.state?.paused === true || row.state?.ended === true),
    'OLDER_HTML_ELEMENT_NOT_ACTUALLY_RETIRED');
  }
}

function sourceVmClock(records) {
  const values = [...records.samples ?? [], ...records.events ?? [], ...records.starts ?? [], ...records.stops ?? [],
    ...records.htmlMedia?.events ?? [], ...records.htmlMedia?.samples ?? [],
    ...(records.htmlMedia?.operations ?? []).flatMap(row => [row, row.settled]),
    ...(records.contextOps ?? []).flatMap(row => [row, row.settled])].filter(timed);
  assert(values.length >= 2, 'ACTUAL_BROWSER_CLOCK_OBSERVATIONS_REQUIRED');
  const offsets = values.map(row => row.unixMs - row.atMs).sort((a, b) => a - b);
  assert(offsets.at(-1) - offsets[0] <= 5, 'BROWSER_CLOCK_MAPPING_DRIFT');
  return {unixMinusRunnerMs: offsets[Math.floor(offsets.length / 2)], minimumOffset: offsets[0], maximumOffset: offsets.at(-1), observations: values.length};
}

function causalInput({contract, records, flow, replayFlow, entry, entryPin, contractPin, recordsPin}, before, after, clock) {
  if (flow.startKind === 'normal-entry') {
    assert(entry && pin(entryPin) && pin(contractPin) && pin(recordsPin) && contract.terminal.startPolicy === 'normal-course-entry-or-play' &&
      flow.eventSequences.length === 0 && finite(entry.navigation?.responseEnd), 'SOURCE_AUTHORIZED_NORMAL_ENTRY_REQUIRED');
    return {sequence: null, id: `${records.documentId}:normal-course-entry`, kind: 'normal-course-entry', trusted: false, synthetic: false,
      atMs: entry.navigation.responseEnd, unixMs: clock.unixMinusRunnerMs + entry.navigation.responseEnd,
      entryPin, contractPin, recordsPin, initialSampleSequence: before.sequence};
  }
  assert(['play', 'replay'].includes(flow.startKind), 'SUPPORTED_NATURAL_START_REQUIRED');
  const matches = flow.eventSequences.map(sequence => (records.events ?? []).find(event => event.sequence === sequence))
    .filter(event => event?.trusted === true && event.forced === false && event.synthetic === false && timed(event) &&
      (event.type === 'click' || event.type === 'keydown' && ['Enter', ' ', 'Space'].includes(event.key)) &&
      (event.action ?? event.control) === flow.startKind);
  // Keep the existing first trusted activation rule: Enter may also emit its
  // native click. Every listed event still comes from the retained dispatcher.
  const causal = matches[0];
  assert(causal, 'ACTUAL_TRUSTED_PLAY_OR_REPLAY_CAUSE_REQUIRED');
  if (flow.startKind === 'replay') {
    const old = one((records.samples ?? []).filter(sample => sample.sequence === flow.replayFlowBefore), 'OLD_REPLAY_SAMPLE_REQUIRED');
    assert(replayFlow?.kind === 'replay' && replayFlow.before === old.sequence && replayFlow.after === before.sequence &&
      flow.replayFlowAfter === before.sequence && replayFlow.eventSequences.includes(causal.sequence) &&
      sourceVmReplayCause({before: old, after: before, event: causal, retired: replayFlow.retired, initialState: contract.terminal.initialState}),
    'ACTUAL_SOURCE_VM_REPLAY_AND_RETIRED_LEASE_REQUIRED');
  } else assert(causal.playerId === before.identity.playerId && causal.atMs >= before.atMs && causal.atMs <= after.atMs,
    'PLAY_CAUSE_MUST_BELONG_TO_CURRENT_SOURCE_VM');
  return causal;
}

/** Native reference identity is separate from output capture. The browser's
 * decodeAudioData PCM is a reference for HTMLMedia, never a claim to have read
 * that element's internal decoder PCM. */
function referenceFor({contract, cueId, decodeReceipt, decodeReceiptPin, nativeReference, captureManifest}, before) {
  const cue = one((contract.audio?.cues ?? []).filter(row => row.id === cueId), 'ONE_EXPLICIT_SOURCE_CUE_REQUIRED');
  assert(cue.locale === before.viewport?.locale, 'CUE_MUST_BIND_OBSERVED_ROUTE_LOCALE');
  assert(['web-audio-buffer', 'html-media'].includes(cue.transport), 'EXPLICIT_SOURCE_VM_TRANSPORT_REQUIRED');
  assert(pin(cue.source) && pin(cue.sourcePCM) && pin(decodeReceiptPin) && decodeReceipt?.kind === 'browser-audio-source-decode-v1' &&
    decodeReceipt.decodeMode === 'pinned-browser-pcm-resample' && samePin(cue.source, decodeReceipt.source) &&
    samePin(cue.sourcePCM, decodeReceipt.originalPCM), 'PINNED_BROWSER_NATIVE_PCM_REFERENCE_REQUIRED');
  const format = decodeReceipt.originalFormat;
  assert(Number.isSafeInteger(cue.sampleRate) && cue.sampleRate >= 8000 && [1, 2].includes(cue.channels) &&
    format?.sampleRate === cue.sampleRate && format.channels === cue.channels && Number.isSafeInteger(format.decodedSamples) && format.decodedSamples > 0 &&
    cue.sourcePCM.bytes === format.decodedSamples * cue.channels * 4, 'NATIVE_REFERENCE_FORMAT_MISMATCH');
  assert(Number.isSafeInteger(cue.sourceFirstDecodedSample) && Number.isSafeInteger(cue.sourceEndDecodedSample) &&
    cue.sourceFirstDecodedSample >= 0 && cue.sourceEndDecodedSample > cue.sourceFirstDecodedSample &&
    cue.sourceEndDecodedSample <= format.decodedSamples && finite(cue.startPlaybackSeconds) && cue.startPlaybackSeconds >= 0,
  'EXACT_SOURCE_PCM_SUBRANGE_REQUIRED');
  const measured = nativeReference?.measurement, binding = nativeReference?.binding;
  assert(pin(nativeReference?.measurementPin) && pin(nativeReference?.bindingPin) && samePin(decodeReceipt.measurementPin, nativeReference.bindingPin) &&
    samePin(binding?.originalMeasurement, nativeReference.measurementPin) && samePin(binding.sourcePayload, cue.source) &&
    samePin(binding.browserPcm, cue.sourcePCM) && measured?.kind === 'browser-native-source-pcm-measurement-v1' &&
    measured.repeatedDecodeIdentical === true && measured.playbackInvoked === false && measured.htmlMediaInternalPCMObserved === false &&
    samePin(measured.source, cue.source) && measured.runs?.length === 2 && measured.runs.every(run =>
      sameBytes(run.pcm, cue.sourcePCM) && run.sampleRate === cue.sampleRate && run.channels === cue.channels && run.length === format.decodedSamples &&
      run.contextStateBeforeDecode === 'suspended' && run.contextStateAfterDecode === 'suspended' && run.contextStateAfterClose === 'closed' &&
      run.nonfiniteSamples === 0 && run.playbackCalls?.bufferSources === 0 && run.playbackCalls.gainNodes === 0 && run.playbackCalls.resumes === 0),
  'ACTUAL_TWO_NATIVE_BROWSER_DECODES_AND_MEASUREMENT_BINDING_REQUIRED');
  assert(pin(measured.browser?.inspectionPin) && ['pid', 'bundleID', 'executableSHA256', 'launchUnixMs'].every(key =>
    measured.browser.target?.[key] !== undefined && measured.browser.target[key] === captureManifest.target?.[key]),
  'REFERENCE_AND_CAPTURE_MUST_USE_THE_SAME_INSPECTED_BROWSER');
  assert(['en', 'es'].includes(cue.actualAudioLanguage ?? cue.locale), 'SOURCE_DECLARED_AUDIO_LANGUAGE_REQUIRED');
  return cue;
}

function sourceDecodeForStart(records, start, cue, owner) {
  const decode = one((records.decodes ?? []).filter(row => row.bufferId === start.bufferId && row.contextId === start.contextId &&
    row.sha256 === cue.source.sha256 && row.bytes === cue.source.bytes && row.state === 'fulfilled' && Object.hasOwn(row, 'owner') &&
    (row.owner === null || sameOwner(row.owner, owner)) && timed(row) && timed(row.settled) && row.settled.atMs >= row.atMs && row.settled.atMs <= start.atMs),
  'ONE_FULFILLED_SAME_CONTEXT_BUFFER_SOURCE_DECODE_REQUIRED');
  return decode;
}

/** An observed stop may omit only digital silence from the pinned reference.
 * This enables full output comparison; it does not establish why the source
 * stopped or claim that its native buffer ended naturally. */
export function exactZeroNativeRemainder({cue, nativePcm, start, stops}) {
  assert(nativePcm?.bytes instanceof Uint8Array && samePin(nativePcm.pin, cue.sourcePCM) &&
    nativePcm.bytes.byteLength === cue.sourcePCM.bytes &&
    createHash('sha256').update(nativePcm.bytes).digest('hex') === cue.sourcePCM.sha256,
  'EXACT_ZERO_TAIL_REQUIRES_PINNED_NATIVE_PCM');
  assert(Number.isSafeInteger(cue.sampleRate) && cue.sampleRate >= 8000 && [1, 2].includes(cue.channels) &&
    cue.sourceFirstDecodedSample === 0 && Number.isSafeInteger(cue.sourceEndDecodedSample) &&
    cue.sourceEndDecodedSample > 0 && cue.sourcePCM.bytes === cue.sourceEndDecodedSample * cue.channels * 4 &&
    start.offset === 0 && finite(start.effectiveWhen) && timed(start) && stops.length > 0,
  'EXACT_ZERO_TAIL_REQUIRES_COMPLETE_NATIVE_SOURCE_RANGE');
  let first = cue.sourceEndDecodedSample;
  for (const stop of stops) {
    assert(stop.nodeId === start.nodeId && stop.contextId === start.contextId && stop.stopped === true && timed(stop) &&
      stop.atMs >= start.atMs && finite(stop.effectiveWhen) && finite(stop.contextTime) &&
      stop.effectiveWhen <= stop.contextTime && stop.effectiveWhen > start.effectiveWhen &&
      Math.abs((stop.unixMs - stop.atMs) - (start.unixMs - start.atMs)) <= 5,
    'EXACT_ZERO_TAIL_REQUIRES_ACTUAL_SAME_NODE_STOP');
    // Floor includes the partially played boundary sample; never round it away.
    first = Math.min(first, Math.floor((stop.effectiveWhen - start.effectiveWhen) * cue.sampleRate));
  }
  assert(first >= 0 && first < cue.sourceEndDecodedSample, 'EXACT_ZERO_TAIL_REQUIRES_OMITTED_SAMPLES');
  const view = new DataView(nativePcm.bytes.buffer, nativePcm.bytes.byteOffset, nativePcm.bytes.byteLength);
  for (let sample = first; sample < cue.sourceEndDecodedSample; sample++) for (let channel = 0; channel < cue.channels; channel++) {
    assert(view.getFloat32((sample * cue.channels + channel) * 4, true) === 0, 'SOURCE_BUFFER_WAS_STOPPED_BEFORE_NONZERO_REFERENCE_SAMPLE');
  }
  return {kind: 'observed-stop-exact-zero-reference-remainder-v1', sourcePCM: cue.sourcePCM,
    firstOmittedDecodedSample: first, endDecodedSample: cue.sourceEndDecodedSample,
    sampleRate: cue.sampleRate, channels: cue.channels, observedStops: stops,
    fullSourceRangeUnchanged: true, nativeSourceEndedNaturally: false,
    sourceStopCausality: 'not-established-by-audio-output-comparison',
    outputTailAssessmentRequired: true};
}

function webAudioStart(args, cue, before, after, causal) {
  const {records} = args, owner = before.identity;
  const decodes = (records.decodes ?? []).filter(row => row.sha256 === cue.source.sha256);
  const starts = (records.starts ?? []).filter(row => row.started === true && sameOwner(row.owner, owner) &&
    decodes.some(decode => decode.bufferId === row.bufferId) && row.atMs >= Math.min(before.atMs, causal.atMs) && row.atMs <= after.atMs);
  const start = one(starts, 'EXACTLY_ONE_ACTUAL_SOURCE_BUFFER_START_REQUIRED');
  const decode = sourceDecodeForStart(records, start, cue, owner);
  assert(timed(start) && text(start.nodeId) && text(start.contextId) && [start.offset, start.contextTime, start.effectiveWhen].every(finite),
    'ACTUAL_BUFFER_START_CLOCK_REQUIRED');
  assert(decode.sampleRate === cue.sampleRate && decode.channels === cue.channels && decode.samples === args.decodeReceipt.originalFormat.decodedSamples,
    'ACTUAL_BUFFER_NATIVE_FORMAT_MISMATCH');
  const duration = (cue.sourceEndDecodedSample - cue.sourceFirstDecodedSample) / cue.sampleRate;
  assert(Math.abs(start.offset - cue.sourceFirstDecodedSample / cue.sampleRate) <= 1 / cue.sampleRate &&
    (start.durationArgument === null || start.durationArgument === undefined || Math.abs(start.durationArgument - duration) <= 1 / cue.sampleRate),
  'ACTUAL_BUFFER_SOURCE_SUBRANGE_MISMATCH');
  assert(!(records.contextOps ?? []).some(row => row.contextId === start.contextId && row.method === 'suspend' && row.atMs > start.atMs && row.atMs < after.atMs),
    'NATURAL_SOURCE_BUFFER_WAS_SUSPENDED');
  assert(!(records.contextOps ?? []).some(row => row.contextId === start.contextId && row.state === 'pending' && row.atMs <= after.atMs),
    'SOURCE_BUFFER_CONTEXT_OPERATION_PENDING');
  const earlyStops = (records.stops ?? []).filter(row => row.nodeId === start.nodeId && row.stopped &&
    row.effectiveWhen < start.effectiveWhen + duration - 1 / cue.sampleRate);
  assert(earlyStops.every(row => row.atMs <= after.atMs), 'EARLY_SOURCE_STOP_MUST_BELONG_TO_OBSERVED_FLOW');
  const exactZeroRemainder = earlyStops.length ? exactZeroNativeRemainder({cue, nativePcm: args.nativePcm, start, stops: earlyStops}) : null;
  return {actualStartUnixMs: start.unixMs + (start.effectiveWhen - start.contextTime) * 1000,
    actualStart: {start, decode, decodeOwnership: decode.owner === null ? 'explicit-null-preload-linked-by-actual-context-buffer-use' : 'same-owned-source-decode',
      ...(exactZeroRemainder ? {exactZeroRemainder} : {})},
    transport: cue.transport, sourceNodeIds: [start.nodeId]};
}

function htmlMediaSource({records, mediaResource}, cue, after, clock) {
  const observed = records.htmlMedia;
  assert(observed?.kind === 'source-vm-html-media-observations-v1' && observed.documentId === records.documentId &&
    finite(observed.documentTimeOrigin) && Math.abs(observed.documentTimeOrigin - clock.unixMinusRunnerMs) <= 5 &&
    observed.unsupported?.length === 0 && observed.errors?.length === 0, 'QUALIFIED_HTML_MEDIA_OBSERVATIONS_REQUIRED');
  assert(text(cue.sourceUrl), 'EXACT_HTML_SOURCE_URL_REQUIRED');
  const sourceUrl = new URL(cue.sourceUrl);
  assert(sourceUrl.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(sourceUrl.hostname) &&
    !sourceUrl.username && !sourceUrl.password && !sourceUrl.search && !sourceUrl.hash, 'HTML_SOURCE_MUST_BE_EXACT_LOOPBACK_ASSET');
  assert(mediaResource?.kind === 'browser-media-response-body-v1' && mediaResource.documentId === records.documentId &&
    mediaResource.url === cue.sourceUrl && mediaResource.requestMethod === 'GET' && mediaResource.resourceType === 'media' &&
    mediaResource.redirected === false && mediaResource.documentTimeOrigin === observed.documentTimeOrigin &&
    finite(mediaResource.requestStartUnixMs) && mediaResource.requestStartUnixMs >= observed.documentTimeOrigin &&
    finite(mediaResource.responseEndUnixMs) && mediaResource.responseEndUnixMs >= mediaResource.requestStartUnixMs &&
    mediaResource.responseEndUnixMs <= after.unixMs && sameBytes(mediaResource.body, cue.source) &&
    (mediaResource.status === 200 && mediaResource.contentRange === null || mediaResource.status === 206 &&
      mediaResource.contentRange === `bytes 0-${cue.source.bytes - 1}/${cue.source.bytes}`), 'COMPLETE_ACTUAL_HTML_RESOURCE_RESPONSE_REQUIRED');
  return observed;
}

function htmlMediaStart(args, cue, before, after, causal, clock) {
  const {records, mediaResource, decodeReceipt} = args, owner = before.identity;
  const observed = htmlMediaSource(args, cue, after, clock);
  const plays = (observed.operations ?? []).filter(row => row.method === 'play' && sameOwner(row.owner, owner) &&
    row.atMs >= Math.min(before.atMs, causal.atMs) && row.atMs <= after.atMs).sort((a, b) => a.atMs - b.atMs);
  assert(plays.length > 0 && new Set(plays.map(row => row.mediaElementId)).size === 1, 'ONE_ACTUAL_HTML_ELEMENT_REQUIRED');
  const play = plays[0];
  assert(play.before?.currentTime === 0 && plays.every((row, index) => row.state === 'fulfilled' && timed(row) &&
    timed(row.settled) && sameOwner(row.settled.owner, owner) && text(row.mediaElementId) && row.before?.src === cue.sourceUrl &&
    row.settled.atMs >= row.atMs && row.settled.atMs <= after.atMs &&
    (index === 0 || row.before.paused === false && row.before.ended === false && row.before.seeking === false)),
  'COMPLETE_FRESH_HTML_PLAY_REQUIRED');
  const events = (observed.events ?? []).filter(row => row.mediaElementId === play.mediaElementId && row.atMs >= play.atMs && row.atMs <= after.atMs);
  assert(events.every(row => sameOwner(row.owner, owner) && timed(row)), 'HTML_EVENT_OWNER_OR_CLOCK_DRIFT');
  const playing = one(events.filter(row => row.type === 'playing'), 'ONE_ACTUAL_HTML_PLAYING_EVENT_REQUIRED');
  const ended = one(events.filter(row => row.type === 'ended'), 'ACTUAL_HTML_ENDED_REQUIRED_DO_NOT_TRIM_TO_SOURCE_TERMINAL');
  assert(playing.trusted === true && ended.trusted === true && playing.atMs >= play.atMs && ended.atMs > playing.atMs &&
    ended.state?.ended === true && ended.state.paused === true && ended.state.seeking === false && ended.state.muted === false &&
    finite(ended.state.volume) && ended.state.volume > 0 && ended.state.playbackRate === 1 && ended.state.defaultPlaybackRate === 1 && ended.state.currentSrc === cue.sourceUrl,
    'ACTUAL_HTML_LIFECYCLE_ORDER_REQUIRED');
  const duration = (cue.sourceEndDecodedSample - cue.sourceFirstDecodedSample) / cue.sampleRate;
  assert(cue.sourceFirstDecodedSample === 0 && cue.sourceEndDecodedSample === decodeReceipt.originalFormat.decodedSamples &&
    Math.abs(ended.state.currentTime - duration) * 1000 <= 50 && Math.abs(ended.state.duration - duration) * 1000 <= 50,
  'HTML_REFERENCE_DURATION_NEEDS_EXPLICIT_CALIBRATION');
  // Native forward EOF may dispatch timeupdate -> pause -> ended after it has
  // already set paused/ended. Only that exact full-source native EOF task is
  // terminal evidence; it is neither an interruption nor a moving-clock anchor.
  const nativeEof = row => ['pause', 'timeupdate', 'sample'].includes(row.type) && sameOwner(row.owner, owner) && timed(row) &&
    row.mediaElementId === ended.mediaElementId && finite(ended.eventTimeStamp) &&
    row.atMs >= ended.eventTimeStamp && row.atMs <= ended.atMs &&
    (row.type === 'sample' || row.trusted === true && row.eventTimeStamp === ended.eventTimeStamp) &&
    row.state?.currentSrc === cue.sourceUrl && row.state.paused === true && row.state.ended === true &&
    row.state.seeking === false && row.state.muted === false && finite(row.state.volume) && row.state.volume > 0 &&
    row.state.playbackRate === 1 && row.state.defaultPlaybackRate === 1 &&
    row.state.currentTime === ended.state.currentTime && row.state.duration === ended.state.duration;
  const terminalEofEvents = events.filter(nativeEof);
  assert(['pause', 'timeupdate'].every(type => terminalEofEvents.filter(row => row.type === type).length <= 1),
    'UNAMBIGUOUS_NATIVE_HTML_EOF_TASK_REQUIRED');
  assert(!events.some(row => ['pause', 'seeking', 'seeked', 'ratechange', 'volumechange', 'waiting', 'stalled', 'emptied', 'abort', 'error'].includes(row.type) &&
    row.atMs >= playing.atMs && row.atMs < ended.atMs && !nativeEof(row)), 'NATURAL_HTML_CUE_INTERRUPTED_OR_CHANGED');
  assert(!(observed.operations ?? []).some(row => row.mediaElementId === play.mediaElementId && row.method === 'pause' &&
    row.atMs >= playing.atMs && row.atMs < ended.atMs), 'NATURAL_HTML_CUE_WAS_PAUSED');
  const anchors = [...events, ...(observed.samples ?? []).filter(row => row.mediaElementId === play.mediaElementId && row.atMs >= playing.atMs && row.atMs < ended.atMs)]
    .filter(row => (row.type === 'playing' || row.type === 'timeupdate' || row.type === 'sample') && !nativeEof(row));
  assert(anchors.length >= 2 && anchors.every(row => timed(row) && sameOwner(row.owner, owner) &&
    (row.type === 'sample' || row.trusted === true) && row.state?.currentSrc === cue.sourceUrl &&
    row.state.paused === false && row.state.ended === false && row.state.seeking === false && row.state.muted === false &&
    finite(row.state.volume) && row.state.volume > 0 && row.state.playbackRate === 1 && row.state.defaultPlaybackRate === 1 &&
    Number.isSafeInteger(row.state.readyState) && row.state.readyState >= 2 && finite(row.state.currentTime) && finite(row.state.duration)),
  'ACTUAL_HTML_CLOCK_AND_OUTPUT_STATE_REQUIRED');
  anchors.sort((a, b) => a.atMs - b.atMs);
  assert(anchors.at(-1).atMs - anchors[0].atMs >= 200 && anchors.every((row, i) => i === 0 || row.state.currentTime >= anchors[i - 1].state.currentTime),
    'HTML_CLOCK_MUST_ADVANCE_WITHOUT_SEEK');
  assert(anchors.every(row => Math.abs(row.state.duration - duration) * 1000 <= 50), 'HTML_REFERENCE_DURATION_NEEDS_EXPLICIT_CALIBRATION');
  const offsets = anchors.map(row => row.unixMs - row.state.currentTime * 1000).sort((a, b) => a - b);
  assert(offsets.at(-1) - offsets[0] <= 50, 'HTML_MEDIA_TO_WALL_CLOCK_DRIFT');
  return {actualStartUnixMs: offsets[Math.floor(offsets.length / 2)], actualStart: {play, playOperations: plays, playing, ended, terminalEofEvents}, transport: cue.transport,
    mediaElementIds: [play.mediaElementId], sourceResourceSha256: mediaResource.body.sha256,
    clockEvidence: {method: 'observed-html-media-currentTime-wall-clock', observations: anchors.length,
      minimumOffsetUnixMs: offsets[0], maximumOffsetUnixMs: offsets.at(-1), alignmentUncertaintyLimitMs: 50,
      internalDecoderPCMObserved: false}};
}
export function deriveSourceVmAudioFlowWindows(args) {
  const {contract, records, flow, decodeReceiptPin, captureRunId, captureManifest, paddingMs = 250} = args;
  assert(flow?.kind === 'natural-playback' && text(records?.documentId), 'ACTUAL_NATURAL_SOURCE_FLOW_REQUIRED');
  assert(text(captureRunId) && captureManifest?.runID === captureRunId && captureManifest.status === 'RAW_CAPTURE_COMPLETE_UNASSESSED',
    'EXACT_COMPLETED_CAPTURE_RUN_REQUIRED');
  const before = one((records.samples ?? []).filter(row => row.sequence === flow.before), 'ACTUAL_INITIAL_SAMPLE_REQUIRED');
  const after = one((records.samples ?? []).filter(row => row.sequence === flow.after), 'ACTUAL_FINAL_SAMPLE_REQUIRED');
  assert(sameOwner(before.identity, after.identity) && before.identity.animationId === contract.animationId &&
    before.identity.sourceSha256 === contract.source.sha256 && timed(before) && timed(after) && after.atMs > before.atMs,
  'EXACT_CURRENT_SOURCE_VM_RANGE_REQUIRED');
  assert(finite(paddingMs) && paddingMs >= 0 && paddingMs <= 250, 'BOUNDED_EXISTING_ALIGNMENT_PADDING_REQUIRED');
  const clock = sourceVmClock(records), causal = causalInput(args, before, after, clock), cue = referenceFor(args, before);
  assert(!(records.events ?? []).some(row => row.type === 'seek' && row.atMs >= causal.atMs && row.atMs <= after.atMs), 'NATURAL_FLOW_CONTAINS_SEEK');
  const evidence = cue.transport === 'html-media' ? htmlMediaStart(args, cue, before, after, causal, clock) : webAudioStart(args, cue, before, after, causal);
  const start = evidence.actualStartUnixMs, duration = (cue.sourceEndDecodedSample - cue.sourceFirstDecodedSample) / cue.sampleRate;
  assert(start >= causal.unixMs - 5, 'MEDIA_START_PRECEDES_PUBLIC_CAUSE');
  const startAtMs = start - clock.unixMinusRunnerMs;
  priorSourceBuffersRetired(records, before.identity, startAtMs, after.atMs, contract.audio.cues.map(row => row.source.sha256));
  priorHtmlElementsRetired(records, before.identity, startAtMs, after.atMs, contract.audio.cues.flatMap(row => row.sourceUrl ? [row.sourceUrl] : []));
  // Only optional alignment padding moves to the tail. The full exact source
  // PCM range stays intact, and no window precedes this observed page lease.
  // The WebAudio clock already names source sample zero. Prepending the whole
  // alignment allowance consumes the matcher's positive-lag budget before any
  // actual output latency. One unchanged positive-lag allowance after the full
  // cue is sufficient; do not extend beyond the observed terminal hold.
  const lead = cue.transport === 'web-audio-buffer' ? 0 : Math.min(paddingMs, Math.max(0, start - Math.max(causal.unixMs, before.unixMs)));
  const tail = cue.transport === 'web-audio-buffer' ? paddingMs : paddingMs * 2 - lead;
  const eventId = causal.id ?? `${records.documentId}:event:${causal.sequence}`, owner = before.identity;
  const base = {mediaInstanceId: owner.playerId, triggerEventId: eventId};
  const window = {id: `${captureRunId}:cue:${cue.id}`, kind: 'audible', cueId: cue.id, sourceSha256: cue.source.sha256, ...base,
    startUnixMs: start - lead, endUnixMs: start + duration * 1000 + tail,
    reference: {decodeReceiptPath: decodeReceiptPin.path, decodeReceiptSHA256: decodeReceiptPin.sha256,
      startSeconds: cue.sourceFirstDecodedSample / cue.sampleRate, endSeconds: cue.sourceEndDecodedSample / cue.sampleRate,
      originalSampleRange: {pcmSha256: cue.sourcePCM.sha256, firstDecodedSample: cue.sourceFirstDecodedSample,
        endDecodedSample: cue.sourceEndDecodedSample, sampleRate: cue.sampleRate, channels: cue.channels}}};
  const windows = [window], bindings = [], playStartUnixMs = start - cue.startPlaybackSeconds * 1000;
  for (const silence of contract.audio.expectedSilentWindows ?? []) windows.push({id: `${captureRunId}:silence:${silence.id}`, kind: 'silent',
    cueId: silence.id, sourceWindowId: silence.id, sourceSha256: contract.source.sha256, ...base,
    startUnixMs: playStartUnixMs + silence.startPlaybackSeconds * 1000, endUnixMs: playStartUnixMs + silence.endPlaybackSeconds * 1000,
    sourcePlaybackStartSeconds: silence.startPlaybackSeconds, sourcePlaybackEndSeconds: silence.endPlaybackSeconds});
  for (const row of windows) {
    assert(finite(row.startUnixMs) && finite(row.endUnixMs) && row.endUnixMs > row.startUnixMs &&
      row.startUnixMs >= captureManifest.readyClock?.unixMs && row.endUnixMs <= captureManifest.clockAfter?.unixMs &&
      row.startUnixMs >= before.unixMs && row.endUnixMs <= after.unixMs, 'WINDOW_MUST_FIT_CAPTURE_AND_ACTUAL_OWNER_FLOW');
    bindings.push({id: row.id, playerId: owner.playerId, replay: owner.replay, ownerKind: 'source-vm', leaseToken: owner.leaseToken,
      mediaInstanceId: owner.playerId, transport: evidence.transport,
      ...(row.kind === 'audible' ? evidence.transport === 'html-media'
        ? {mediaElementIds: evidence.mediaElementIds, sourceResourceSha256: evidence.sourceResourceSha256}
        : {sourceNodeIds: evidence.sourceNodeIds} : {})});
  }
  return {windows, bindings, events: [{...causal, id: eventId, kind: causal.kind ?? causal.action ?? causal.type,
    mediaInstanceId: owner.playerId, observedEvent: causal, actualOwner: owner}], clock,
    language: cue.actualAudioLanguage ?? cue.locale, languageClaim: 'source-declared-track-not-listening-acceptance',
    actualStart: evidence.actualStart, ...(evidence.clockEvidence ? {mediaClock: evidence.clockEvidence} : {}), sourceCue: cue,
    playStartUnixMs, nativeReferenceClaim: 'browser-decodeAudioData-reference-not-html-media-internal-pcm'};
}

function contextFromSample(sample, contextId) {
  const value = one((sample.media?.contexts ?? []).filter(row => row.contextId === contextId), 'ACTUAL_OWNER_AUDIO_CONTEXT_SAMPLE_REQUIRED');
  assert(finite(value.currentTime) && ['running', 'suspended', 'closed'].includes(value.state), 'ACTUAL_CONTEXT_TIME_AND_STATE_REQUIRED');
  return value;
}

function htmlFromSample(observed, sample, mediaElementId, owner) {
  const rows = (observed.samples ?? []).filter(row => row.mediaElementId === mediaElementId && sameOwner(row.owner, owner) &&
    row.atMs <= sample.atMs && sample.atMs - row.atMs <= 50).sort((a, b) => b.atMs - a.atMs);
  assert(rows.length && timed(rows[0]) && finite(rows[0].state?.currentTime), 'ACTUAL_HTML_SAMPLE_AT_CONTROL_BOUNDARY_REQUIRED');
  return rows[0];
}

/** pause() changes native state synchronously; its trusted pause callback may
 * run after the immediate source sample. Join it to the settled operation and
 * the measured frozen interval, never move the public or source timestamps. */
function actualHtmlPause(observed, mediaElementId, owner, event, paused, held, cue) {
  const operation = one((observed.operations ?? []).filter(row => row.mediaElementId === mediaElementId && row.method === 'pause' &&
    row.state === 'fulfilled' && sameOwner(row.owner, owner) && sameOwner(row.settled?.owner, owner) && timed(row) && timed(row.settled) &&
    row.atMs >= event.atMs && row.settled.atMs >= row.atMs && row.settled.atMs <= paused.atMs &&
    row.before?.currentSrc === cue.sourceUrl && row.before.paused === false && row.before.ended === false &&
    finite(row.before.currentTime) && finite(row.before.duration) && row.before.currentTime < row.before.duration), 'ACTUAL_SETTLED_HTML_PAUSE_REQUIRED');
  const native = one((observed.events ?? []).filter(row => row.mediaElementId === mediaElementId && row.type === 'pause' &&
    row.atMs >= event.atMs && row.atMs <= held.atMs), 'ACTUAL_HTML_PAUSE_EVENT_REQUIRED');
  const a = htmlFromSample(observed, paused, mediaElementId, owner), b = htmlFromSample(observed, held, mediaElementId, owner);
  const states = [operation.settled.state, native.state, a.state, b.state];
  assert(sameOwner(native.owner, owner) && timed(native) && native.trusted === true && finite(native.eventTimeStamp) &&
    native.eventTimeStamp >= operation.atMs && native.eventTimeStamp <= operation.settled.atMs && native.atMs >= native.eventTimeStamp &&
    states.every(state => state?.currentSrc === cue.sourceUrl && state.paused === true && state.ended === false && state.seeking === false &&
      state.muted === false && finite(state.volume) && state.volume > 0 && state.playbackRate === 1 && state.defaultPlaybackRate === 1 &&
      finite(state.duration) && Math.abs(state.duration - cue.sourceEndDecodedSample / cue.sampleRate) * 1000 <= 50 &&
      finite(state.currentTime) && Math.abs(state.currentTime - a.state.currentTime) <= 1 / cue.sampleRate) &&
    !(observed.operations ?? []).some(row => row.mediaElementId === mediaElementId && row.method === 'play' && row.atMs >= event.atMs && row.atMs <= held.atMs) &&
    !(observed.events ?? []).some(row => row.mediaElementId === mediaElementId && row.atMs >= event.atMs && row.atMs <= held.atMs &&
      ['playing', 'ended', 'seeking', 'seeked', 'ratechange', 'volumechange', 'waiting', 'stalled', 'emptied', 'abort', 'error'].includes(row.type)),
  'ACTUAL_HTML_PAUSE_OPERATION_EVENT_AND_FROZEN_HOLD_REQUIRED');
  return {operation, nativeEvent: native, pausedSample: a, heldSample: b};
}

function sourceVmResumeInterval(args, cue, samples, events, clock) {
  const {records} = args, {before, paused, held, resumed} = samples, owner = before.identity, rate = cue.sampleRate;
  if (cue.transport === 'web-audio-buffer') {
    const sourceBuffers = new Set((records.decodes ?? []).filter(row => row.sha256 === cue.source.sha256).map(row => row.bufferId));
    const node = one((records.starts ?? []).filter(row => row.started && sameOwner(row.owner, owner) && sourceBuffers.has(row.bufferId) && row.atMs <= resumed.atMs),
      'SOURCE_VM_RESUME_MUST_KEEP_ONE_ACTUAL_SOURCE_NODE');
    assert(timed(node) && [node.offset, node.effectiveWhen, node.contextTime].every(finite) && node.atMs <= events.pause.atMs,
      'ACTUAL_SOURCE_NODE_BEFORE_PAUSE_REQUIRED');
    const decoded = sourceDecodeForStart(records, node, cue, owner);
    assert(decoded.sampleRate === rate && decoded.channels === cue.channels && decoded.samples === args.decodeReceipt.originalFormat.decodedSamples,
      'ACTUAL_BUFFER_NATIVE_FORMAT_MISMATCH');
    const pausedClock = contextFromSample(paused, node.contextId), heldClock = contextFromSample(held, node.contextId), resumedClock = contextFromSample(resumed, node.contextId);
    assert(pausedClock.state === 'suspended' && heldClock.state === 'suspended' && resumedClock.state === 'running' &&
      Math.abs(pausedClock.currentTime - heldClock.currentTime) <= 1 / rate && resumedClock.currentTime > heldClock.currentTime &&
      heldClock.currentTime >= node.effectiveWhen, 'SOURCE_VM_CONTEXT_MUST_REALLY_SUSPEND_FREEZE_AND_RESUME');
    const contextOps = (records.contextOps ?? []).filter(row => row.contextId === node.contextId && row.atMs <= resumed.atMs);
    assert(!contextOps.some(row => row.state === 'pending'), 'SOURCE_VM_CONTEXT_CONTROL_STILL_PENDING');
    for (const [method, event, sample, state] of [['suspend', events.pause, paused, 'suspended'], ['resume', events.play, resumed, 'running']]) {
      assert(contextOps.some(row => row.method === method && sameOwner(row.owner, owner) && row.state === 'fulfilled' &&
        row.after === state && timed(row) && timed(row.settled) && row.atMs >= event.atMs && row.settled.atMs <= sample.atMs),
      'ACTUAL_FULFILLED_SOURCE_VM_CONTEXT_CONTROL_REQUIRED:' + method);
    }
    assert(!(records.ended ?? []).some(row => row.nodeId === node.nodeId && row.atMs <= resumed.atMs) &&
      !(records.stops ?? []).some(row => row.nodeId === node.nodeId && row.stopped && row.atMs <= resumed.atMs) &&
      !contextOps.some(row => row.method === 'close'), 'SOURCE_VM_NODE_RESTART_OR_END_IS_NOT_CONTINUOUS_RESUME');
    const pausedPosition = node.offset + heldClock.currentTime - node.effectiveWhen;
    const resumedPosition = node.offset + resumedClock.currentTime - node.effectiveWhen;
    const first = Math.ceil((pausedPosition + .2) * rate), last = Math.min(first + Math.floor(.8 * rate), Math.floor((resumedPosition - .05) * rate), cue.sourceEndDecodedSample);
    assert(first >= cue.sourceFirstDecodedSample && last - first >= Math.ceil(.2 * rate), 'ACTUAL_RESUMED_SOURCE_PCM_SUBRANGE_REQUIRED');
    return {first, last, startUnixMs: resumed.unixMs - (resumedPosition - first / rate) * 1000,
      initialStartAtMs: node.atMs + (node.effectiveWhen - node.contextTime) * 1000,
      sourceNodeIds: [node.nodeId], mediaClock: {method: 'same-source-node-observed-audio-context-clock',
        contextId: node.contextId, pausedContextTime: pausedClock.currentTime, heldContextTime: heldClock.currentTime,
        resumedContextTime: resumedClock.currentTime, sourceOffsetSeconds: node.offset, effectiveWhen: node.effectiveWhen,
        sourceNodeWasReplaced: false, decodedObservation: decoded},
      verifyStopped(stopped, after, event) {
        const a = contextFromSample(stopped, node.contextId), b = contextFromSample(after, node.contextId);
        assert(a.state === 'suspended' && b.state === 'suspended' && Math.abs(a.currentTime - b.currentTime) <= 1 / rate,
          'SOURCE_VM_STOP_CONTEXT_MUST_BE_SUSPENDED_AND_FROZEN');
        const controls=(records.contextOps??[]).filter(row=>row.contextId===node.contextId&&row.atMs<=after.atMs);
        assert(!controls.some(row=>row.state==='pending'||row.method==='resume'&&(row.atMs>=event.atMs||row.settled?.atMs>event.atMs))&&
          controls.some(row=>row.method==='suspend'&&sameOwner(row.owner,owner)&&row.before==='running'&&
          row.state==='fulfilled'&&row.after==='suspended'&&timed(row)&&timed(row.settled)&&row.atMs>=event.atMs&&row.settled.atMs<=stopped.atMs),
        'ACTUAL_SETTLED_SOURCE_VM_STOP_REQUIRED');
        assert(!(records.ended??[]).some(row=>row.nodeId===node.nodeId&&row.atMs<=event.atMs)&&
          !(records.stops??[]).some(row=>row.nodeId===node.nodeId&&row.stopped&&row.atMs<event.atMs)&&
          a.currentTime>=resumedClock.currentTime&&node.offset+a.currentTime-node.effectiveWhen<cue.sourceEndDecodedSample/rate,
        'SOURCE_ALREADY_ENDED_BEFORE_STOP');
      }};
  }
  const observed = htmlMediaSource(args, cue, resumed, clock);
  const plays = (observed.operations ?? []).filter(row => row.method === 'play' && sameOwner(row.owner, owner) && row.atMs <= resumed.atMs);
  assert(plays.length >= 2 && new Set(plays.map(row => row.mediaElementId)).size === 1 &&
    plays.every(row => row.state === 'fulfilled' && timed(row) && timed(row.settled) && sameOwner(row.settled.owner, owner) && row.settled.atMs <= resumed.atMs),
  'ACTUAL_SAME_HTML_ELEMENT_RESUME_AND_SETTLED_PLAYS_REQUIRED');
  const mediaElementId = plays[0].mediaElementId;
  assert(plays.filter(row => row.atMs < events.pause.atMs).every(row => row.settled.atMs <= paused.atMs), 'HTML_OLD_PLAY_PENDING_DURING_PAUSE');
  const htmlEvents = (observed.events ?? []).filter(row => row.mediaElementId === mediaElementId && row.atMs <= resumed.atMs);
  assert(htmlEvents.every(row => sameOwner(row.owner, owner) && timed(row)), 'HTML_CONTROL_OWNER_OR_CLOCK_DRIFT');
  const pauseEvidence = actualHtmlPause(observed, mediaElementId, owner, events.pause, paused, held, cue), pauseEvent = pauseEvidence.nativeEvent;
  const playing = one(htmlEvents.filter(row => row.type === 'playing' && row.atMs >= events.play.atMs && row.atMs <= resumed.atMs), 'ACTUAL_HTML_RESUME_PLAYING_EVENT_REQUIRED');
  assert(pauseEvent.trusted === true && playing.trusted === true, 'ACTUAL_HTML_CONTROL_EVENTS_REQUIRED');
  const pausedRow = htmlFromSample(observed, paused, mediaElementId, owner), heldRow = htmlFromSample(observed, held, mediaElementId, owner), resumedRow = htmlFromSample(observed, resumed, mediaElementId, owner);
  const states = [pausedRow.state, heldRow.state, resumedRow.state], fullDuration = args.decodeReceipt.originalFormat.decodedSamples / rate;
  assert(states.every(state => state.currentSrc === cue.sourceUrl && state.ended === false && state.seeking === false && state.muted === false &&
    finite(state.volume) && state.volume > 0 && state.playbackRate === 1 && state.defaultPlaybackRate === 1 &&
    Number.isSafeInteger(state.readyState)&&state.readyState>=2&&finite(state.duration) && Math.abs(state.duration - fullDuration) * 1000 <= 50) &&
    pausedRow.state.paused === true && heldRow.state.paused === true && resumedRow.state.paused === false &&
    Math.abs(pausedRow.state.currentTime - heldRow.state.currentTime) <= 1 / rate && resumedRow.state.currentTime > heldRow.state.currentTime,
  'HTML_MEDIA_MUST_REALLY_PAUSE_FREEZE_AND_RESUME');
  assert(plays.some(row => row.atMs >= events.play.atMs && row.atMs <= playing.atMs && row.before?.src === cue.sourceUrl &&
    row.before.paused === true && Math.abs(row.before.currentTime - heldRow.state.currentTime) <= 1 / rate), 'ACTUAL_HTML_RESUME_FROM_HELD_POSITION_REQUIRED');
  assert(!htmlEvents.some(row => ['seeking', 'seeked', 'ratechange', 'volumechange', 'waiting', 'stalled', 'emptied', 'abort', 'error', 'ended'].includes(row.type) &&
    row.atMs >= events.pause.atMs && row.atMs <= resumed.atMs), 'HTML_RESUME_WAS_INTERRUPTED_OR_SEEKED');
  const anchors = [...htmlEvents, ...(observed.samples ?? [])].filter(row => row.mediaElementId === mediaElementId &&
    row.atMs >= playing.atMs && row.atMs <= resumed.atMs && ['playing', 'timeupdate', 'sample'].includes(row.type));
  assert(anchors.length >= 2 && anchors.every(row => sameOwner(row.owner, owner) && timed(row) &&
    (row.type === 'sample' || row.trusted === true) && row.state?.currentSrc === cue.sourceUrl && row.state.paused === false &&
    row.state.seeking === false && row.state.ended === false && row.state.muted === false && row.state.volume > 0 &&
    row.state.playbackRate === 1 && row.state.defaultPlaybackRate === 1 && finite(row.state.currentTime)), 'ACTUAL_RESUMED_HTML_CLOCK_REQUIRED');
  anchors.sort((a, b) => a.atMs - b.atMs);
  assert(anchors.at(-1).atMs - anchors[0].atMs >= 200 && anchors.every((row, i) => !i || row.state.currentTime >= anchors[i - 1].state.currentTime), 'RESUMED_HTML_CLOCK_MUST_ADVANCE');
  const offsets = anchors.map(row => row.unixMs - row.state.currentTime * 1000).sort((a, b) => a - b);
  assert(offsets.at(-1) - offsets[0] <= 50, 'RESUMED_HTML_MEDIA_CLOCK_DRIFT');
  const first = Math.ceil((playing.state.currentTime + .2) * rate), last = Math.min(first + Math.floor(.8 * rate), Math.floor((resumedRow.state.currentTime - .05) * rate), cue.sourceEndDecodedSample);
  assert(first >= cue.sourceFirstDecodedSample && last - first >= Math.ceil(.2 * rate), 'ACTUAL_RESUMED_HTML_PCM_SUBRANGE_REQUIRED');
  const firstPlaying = htmlEvents.find(row => row.type === 'playing' && row.atMs < events.pause.atMs && row.trusted === true);
  assert(firstPlaying && finite(firstPlaying.state?.currentTime), 'ACTUAL_INITIAL_HTML_PLAYBACK_REQUIRED');
  return {first, last, startUnixMs: offsets[Math.floor(offsets.length / 2)] + first / rate * 1000,
    initialStartAtMs: firstPlaying.atMs - firstPlaying.state.currentTime * 1000,
    mediaElementIds: [mediaElementId], sourceResourceSha256: args.mediaResource.body.sha256,
    mediaClock: {method: 'same-html-element-observed-currentTime', mediaElementId,
      pausedMediaTime: pausedRow.state.currentTime, heldMediaTime: heldRow.state.currentTime, resumedMediaTime: resumedRow.state.currentTime,
      minimumOffsetUnixMs: offsets[0], maximumOffsetUnixMs: offsets.at(-1), internalDecoderPCMObserved: false, pauseEvidence},
    verifyStopped(stopped, after, event) {
      actualHtmlPause(observed, mediaElementId, owner, event, stopped, after, cue);
      const a = htmlFromSample(observed, stopped, mediaElementId, owner), b = htmlFromSample(observed, after, mediaElementId, owner);
      assert(a.state.paused === true && b.state.paused === true && Math.abs(a.state.currentTime - b.state.currentTime) <= 1 / rate,
        'HTML_STOP_MUST_BE_PAUSED_AND_FROZEN');
      const controls=(observed.operations??[]).filter(row=>row.mediaElementId===mediaElementId&&row.atMs<=after.atMs);
      assert(controls.every(row=>row.state==='fulfilled'&&timed(row.settled)&&sameOwner(row.settled.owner,owner)&&row.settled.atMs<=after.atMs)&&
        !controls.some(row=>row.method==='play'&&(row.atMs>=event.atMs||row.settled.atMs>event.atMs))&&
        controls.some(row=>row.method==='pause'&&row.atMs>=event.atMs&&row.settled.atMs<=stopped.atMs&&
          row.before?.paused===false&&row.before.ended===false&&row.before.currentTime<row.before.duration), 'ACTUAL_SETTLED_HTML_STOP_REQUIRED');
      assert(!(observed.events??[]).some(row=>row.mediaElementId===mediaElementId&&row.type==='ended'&&row.atMs<=event.atMs)&&
        a.state.ended===false&&b.state.ended===false, 'HTML_ALREADY_ENDED_BEFORE_STOP');
    }};
}

/** Source-vm control windows use the existing node/context or HTML element.
 * They do not turn a resumed subrange into a complete natural-cue claim. */
export function deriveSourceVmLifecycleAudioWindows(args) {
  const {contract, records, pauseFlow, stopFlow, captureRunId, captureManifest, decodeReceiptPin} = args;
  assert(text(captureRunId) && captureManifest?.runID === captureRunId && captureManifest.status === 'RAW_CAPTURE_COMPLETE_UNASSESSED', 'EXACT_COMPLETED_CAPTURE_RUN_REQUIRED');
  const get = sequence => one((records.samples ?? []).filter(row => row.sequence === sequence), 'ACTUAL_CONTROL_SAMPLE_REQUIRED');
  const samples = Object.fromEntries(['before', 'paused', 'held', 'resumed'].map(key => [key, get(pauseFlow?.[key])]));
  const {before, paused, held, resumed} = samples, owner = before.identity;
  assert(validOwner(owner) && owner.animationId === contract.animationId && owner.sourceSha256 === contract.source.sha256 &&
    [paused, held, resumed].every(row => sameOwner(row.identity, owner) && timed(row)) && timed(before) &&
    before.atMs < paused.atMs && paused.atMs < held.atMs && held.atMs < resumed.atMs &&
    paused.host?.paused === true && held.host?.paused === true && resumed.host?.paused === false &&
    paused.source?.frame === held.source?.frame && paused.source?.tick === held.source?.tick && resumed.source?.tick > held.source?.tick,
  'ACTUAL_SOURCE_VM_PAUSE_HOLD_RESUME_REQUIRED');
  const clock = sourceVmClock(records), cue = referenceFor(args, before), events = [];
  function input(action, sequences, lower, upper) {
    const event = sequences.map(sequence => (records.events ?? []).find(row => row.sequence === sequence)).find(row =>
      row?.trusted === true && row.forced === false && row.synthetic === false && row.playerId === owner.playerId && timed(row) &&
      (row.type === 'click' || row.type === 'keydown' && ['Enter', ' ', 'Space'].includes(row.key)) &&
      (row.action ?? row.control) === action && row.atMs >= lower && row.atMs <= upper);
    assert(event, 'ACTUAL_SOURCE_VM_CONTROL_INPUT_REQUIRED:' + action);
    const id = `${records.documentId}:event:${event.sequence}`;
    events.push({...event, id, kind: action, mediaInstanceId: owner.playerId, observedEvent: event, actualOwner: owner});
    return {...event, id};
  }
  const pause = input('pause', pauseFlow.eventSequences, before.atMs, paused.atMs), play = input('play', pauseFlow.eventSequences, held.atMs, resumed.atMs);
  const interval = sourceVmResumeInterval(args, cue, samples, {pause, play}, clock);
  const final = stopFlow ? get(stopFlow.after) : resumed;
  priorSourceBuffersRetired(records, owner, interval.initialStartAtMs, final.atMs, contract.audio.cues.map(row => row.source.sha256));
  priorHtmlElementsRetired(records, owner, interval.initialStartAtMs, final.atMs, contract.audio.cues.flatMap(row => row.sourceUrl ? [row.sourceUrl] : []));
  const base = {mediaInstanceId: owner.playerId}, windows = [{id: `${captureRunId}:pause`, kind: 'pause', cueId: 'actual-pause',
    sourceSha256: contract.source.sha256, ...base, triggerEventId: pause.id, startUnixMs: paused.unixMs + 200, endUnixMs: held.unixMs}];
  assert(windows[0].endUnixMs - windows[0].startUnixMs >= 200, 'ACTUAL_PAUSE_OUTPUT_WINDOW_REQUIRED');
  const lead = Math.min(50, Math.max(0, interval.startUnixMs - play.unixMs));
  windows.push({id: `${captureRunId}:resume`, kind: 'audible', cueId: 'actual-resume-subrange', sourceSha256: cue.source.sha256,
    ...base, triggerEventId: play.id, startUnixMs: interval.startUnixMs - lead,
    endUnixMs: interval.startUnixMs + (interval.last - interval.first) / cue.sampleRate * 1000 + (250 - lead),
    reference: {decodeReceiptPath: decodeReceiptPin.path, decodeReceiptSHA256: decodeReceiptPin.sha256,
      startSeconds: interval.first / cue.sampleRate, endSeconds: interval.last / cue.sampleRate,
      originalSampleRange: {pcmSha256: cue.sourcePCM.sha256, firstDecodedSample: interval.first, endDecodedSample: interval.last,
        sampleRate: cue.sampleRate, channels: cue.channels}}});
  if (stopFlow) {
    const stopped = get(stopFlow.stopped), after = final;
    assert(sameOwner(stopped.identity, owner) && sameOwner(after.identity, owner) && timed(stopped) && timed(after) &&
      stopped.host?.paused === true && after.host?.paused === true && stopped.source?.frame === after.source?.frame && stopped.source?.tick === after.source?.tick,
    'ACTUAL_SOURCE_VM_STOP_HOLD_REQUIRED');
    const stop = input('pause', stopFlow.eventSequences, resumed.atMs, stopped.atMs); interval.verifyStopped(stopped, after, stop);
    windows.push({id: `${captureRunId}:stop`, kind: 'stop', cueId: 'actual-stop', sourceSha256: contract.source.sha256,
      ...base, triggerEventId: stop.id, startUnixMs: stopped.unixMs + 200, endUnixMs: after.unixMs});
  }
  const bindings = windows.map(row => {
    assert(finite(row.startUnixMs) && finite(row.endUnixMs) && row.endUnixMs - row.startUnixMs >= 200 &&
      row.startUnixMs >= captureManifest.readyClock?.unixMs && row.endUnixMs <= captureManifest.clockAfter?.unixMs, 'LIFECYCLE_WINDOW_MUST_FIT_ACTUAL_CAPTURE');
    return {id: row.id, playerId: owner.playerId, replay: owner.replay, ownerKind: 'source-vm', leaseToken: owner.leaseToken,
      mediaInstanceId: owner.playerId, transport: cue.transport,
      ...(interval.sourceNodeIds ? {sourceNodeIds: interval.sourceNodeIds} : {mediaElementIds: interval.mediaElementIds, sourceResourceSha256: interval.sourceResourceSha256})};
  });
  return {events, windows, bindings, clock, mediaClock: interval.mediaClock,
    claim: 'Actual pause/stop output and a clock-bound resumed PCM subrange; no new source node, complete cue or navigation-cleanup claim.'};
}
