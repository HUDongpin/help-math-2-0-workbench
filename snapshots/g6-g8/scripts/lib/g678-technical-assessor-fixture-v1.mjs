/** Synthetic unit-test data only. Never use this fixture as page evidence. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {PNG} from 'pngjs';
import {DEFAULT_CELLS, REQUIRED_SUPPLEMENT_IDS} from './g678-technical-assessor-v1.mjs';

/** Synthetic unit data for the actual source-vm observation schema. */
export function sourceVmRetirementFixture(sample, observedAtMs) {
  const identity=structuredClone(sample.identity);
  return {...identity,connected:false,hasRuntime:true,activeAudio:0,activeTimers:0,
    observation:{status:'retired',identity,lifecycle:{kind:'hfr-player-lifecycle-v1',identity,observedAtMs,
      pageLeaseCurrent:false,pageSessionCurrent:false,ownsActiveLoad:false,playerDestroyed:true,currentPlayerRunning:false,
      animationFramePending:false,unattributedAnimationFrames:0,
      audioContext:{contextId:`unit-context:${identity.playerId}`,state:'closed',trackedStreams:0,trackedEvents:0},
      htmlMedia:[],unattributedHtmlMedia:0,htmlMediaObservationOverflow:0}}};
}

export function fixture(root) {
  const documentGeometry = ({width, height}) => ({viewportWidth: width, viewportHeight: height,
    rootRect: {left: 0, top: 0, right: width, bottom: height, width, height},
    rootClientHeight: height, rootScrollHeight: height, overflowY: 'visible', scrollbarGutter: 'auto'});
  const put = (file, value) => {
    const bytes = Buffer.isBuffer(value) ? value : Buffer.from(typeof value === 'string' ? value : JSON.stringify(value));
    fs.mkdirSync(path.dirname(path.join(root, file)), {recursive: true}); fs.writeFileSync(path.join(root, file), bytes);
    return {path: file, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex')};
  };
  const source = put('synthetic.swf', 'UNIT TEST ONLY source bytes'), input = put('runtime.ts', 'UNIT TEST ONLY runtime bytes');
  const image = new PNG({width: 20, height: 20}); image.data.fill(255);
  for (let y = 5; y < 15; y++) for (let x = 5; x < 15; x++) {const i = (y * 20 + x) * 4; image.data[i] = image.data[i + 1] = image.data[i + 2] = 0;}
  const imagePin = put('stage.png', PNG.sync.write(image));
  const id = 'shared-nms002-l01-p001';
  const initialState = {'source.frameDomain': 'sprite-42', 'source.frame': 1, 'source.count': 0};
  const terminalState = {'source.frameDomain': 'sprite-42', 'source.frame': 12, 'source.count': 1};
  const contract = {animationId: id, source, inputPins: [source, input], rendererFamily: 'hfr', behaviorFamily: 'unit-test-activity', unresolved: [],
    terminal: {status: 'known', sourcePin: source, unknowns: [], kind: 'activity', frameDomain: 'sprite-42', frame: 12, minimumDurationMs: 900, initialState, expectedState: terminalState},
    interactions: {status: 'known', sourcePin: source, unknowns: [], cases: [{id: 'correct', stateId: 'correct-feedback', inputTypes: ['pointerdown', 'pointerup'], beforeState: {'source.count': 0}, expectedState: {'source.count': 1}, sourcePin: source}]},
    audio: {status: 'known', sourcePin: source, unknowns: [], cues: ['en', 'es'].map(locale => ({id: `${locale}-intro`, locale, source: put(`${locale}.pcm`, `UNIT TEST ONLY ${locale} audio bytes`), minimumDurationMs: 500, minimumRms: 0.0001, matchThreshold: 0.9}))},
    layout: {requiredStateIds: ['initial', 'correct-feedback', 'terminal'], targetIds: ['stage'], fontTargetIds: ['stage']},
    contentAssertions: ['initial', 'terminal'].map(stateId => ({id: `${stateId}-source-words`, stateId, selector: '[data-source-title]', text: 'Fixture source words', sourcePin: source}))};
  const raw = {kind: 'g678-full-technical-raw-v1', animationId: id, source, startedAt: '2026-10-23T08:00:00.000Z', finishedAt: '2026-10-23T08:01:00.000Z', preflightPins: contract.inputPins, postflightPins: contract.inputPins, cells: []};
  for (const [index, {cellId, ...config}] of DEFAULT_CELLS.entries()) {
    const player = replay => `${cellId}-player-${replay}`;
    const samples = Array.from({length: 6}, (_, i) => {
      const replay = i < 3 ? 0 : 1, part = i % 3, atMs = (replay ? 1200 : 0) + part * 500;
      return {sequence: i + 1, atMs, viewport: config, identity: {animationId: id, sourceSha256: source.sha256, ownerKind: 'source-vm', playerId: player(replay), leaseToken: `lease-${replay}`, replay},
        observer: {sourceActionsCalled: false, sourceStateWritten: false, syntheticInput: false},
        source: {observedFrom: 'source-runtime', tickKind: 'source-tick', clockOwnerId: player(replay), frameDomain: 'sprite-42', frame: [1, 6, 12][part], tick: part * 5, count: part === 0 ? 0 : 1, errors: [], missing: []},
        render: {status: 'ready', animationId: id, rendererFamily: 'hfr', surfaceId: 'source-stage'}};
    });
    const event = (sequence, atMs, type, replay) => ({sequence, atMs, type, playerId: player(replay), trusted: true, forced: false, synthetic: false,
      ...(type.startsWith('pointer') ? {pointerType: config.touch ? 'touch' : 'mouse'} : {})});
    const events = [event(1, 100, 'click', 0), event(2, 200, 'pointerdown', 0), event(3, 400, 'pointerup', 0), event(4, 1100, 'click', 0), event(5, 1300, 'click', 1), event(6, 1400, 'pointerdown', 1), event(7, 1600, 'pointerup', 1)];
    events[0].action = 'play'; events[3].action = 'replay'; events[4].action = 'play';
    const logs = {errors: [], consoleErrors: [], networkErrors: [], cleanupErrors: []};
    const cell = {cellId, config, startedAt: `2026-10-23T08:00:${String(index * 3).padStart(2, '0')}.000Z`, finishedAt: `2026-10-23T08:00:${String(index * 3 + 3).padStart(2, '0')}.000Z`,
      languages: {visual: config.locale, audio: config.locale}, ...logs, logPin: put(`${cellId}/logs.json`, logs), documents: [{documentId: `${cellId}-document`, samples, events, errors: []}],
      flows: [
        {kind: 'natural-playback', startKind: 'play', before: 1, after: 3, eventSequences: [1]},
        {kind: 'interaction', caseId: 'correct', before: 1, after: 2, eventSequences: [2, 3]},
        {kind: 'replay', before: 3, after: 4, eventSequences: [4], retired: sourceVmRetirementFixture(samples[2], 1200)},
        {kind: 'natural-playback', startKind: 'play', before: 4, after: 6, eventSequences: [5]},
        {kind: 'interaction', caseId: 'correct', before: 4, after: 5, eventSequences: [6, 7]},
      ], mediaChecks: [], layoutChecks: [], screenshots: []};
    for (const replay of [0, 1]) {
      const cue = contract.audio.cues.find(c => c.locale === config.locale), capture = put(`${cellId}/capture-${replay}.alac`, 'UNIT TEST ONLY compressed capture bytes');
      const measurement = {cueId: cue.id, playerId: player(replay), replay, source: cue.source, capture, startMs: replay ? 1400 : 200, endMs: replay ? 2200 : 1000,
        sampleRate: 48000, sampleCount: 38400, channels: 2, rms: 0.2, match: {method: 'normalized-cross-correlation', sourceSha256: cue.source.sha256, captureSha256: capture.sha256, score: 0.98, comparedSamples: 38400, lagMs: 0}};
      const {cueId, playerId, replay: run, ...report} = measurement;
      measurement.analysis = {tool: 'unit-test-fixture-only', report: put(`${cellId}/audio-analysis-${replay}.json`, report)};
      cell.mediaChecks.push(measurement);
    }
    for (const [stateId, sequence] of [['initial', 1], ['correct-feedback', 2], ['terminal', 3]]) {
      cell.layoutChecks.push({stateId, sampleSequence: sequence, rootScrollWidth: config.width, rootClientWidth: config.width, documentGeometry: documentGeometry(config),
        targets: [{id: 'stage', rect: {left: 20, top: 100, right: 300, bottom: 400, width: 280, height: 300}, clippedPixels: 0, obscuredPixels: 0, hitTargetId: 'stage'}]});
      cell.screenshots.push({stateId, sampleSequence: sequence, surfaceId: 'source-stage', scope: 'stage', pin: imagePin});
    }
    cell.contentChecks = contract.contentAssertions.map(a => ({assertionId: a.id, stateId: a.stateId, selector: a.selector,
      sampleSequence: a.stateId === 'initial' ? 1 : 3, method: 'innerText', text: a.text,
      rect: {width: 200, height: 30}, computed: {display: 'block', visibility: 'visible', opacity: 1}}));
    raw.cells.push(cell);
  }
  const result = {root, contract, raw, put};
  result.saveContract = () => {
    result.contractPin = put('contract.json', contract); raw.contractPin = result.contractPin; raw.supplements = [];
    for (const locale of ['en', 'es']) for (const stateId of contract.layout.requiredStateIds) for (const id of REQUIRED_SUPPLEMENT_IDS) {
      const cell = raw.cells.find(c => c.config.locale === locale && c.cellId.endsWith('-desktop'));
      const layout = cell.layoutChecks.find(l => l.stateId === stateId), original = cell.documents[0].samples.find(s => s.sequence === layout.sampleSequence);
      const before = structuredClone(original), after = structuredClone(original);
      before.sequence = 1; after.sequence = 2; after.atMs = before.atMs + 500;
      before.media = {runningOwnedOutputs: 0, sourceNodeIds: []}; after.media = structuredClone(before.media);
      if (id.startsWith('viewport-')) after.viewport.width = Number(id.slice(9));
      if (id.startsWith('dpr-')) after.viewport.dpr = Number(id.slice(4));
      if (id === 'text-200-percent') after.viewport.rootFontPx = 32;
      if (id === 'rotation') [after.viewport.width, after.viewport.height] = [before.viewport.height, before.viewport.width];
      if (id === 'sidebar') {before.dom = {...before.dom, sidebarExpanded: false}; after.dom = {...after.dom, sidebarExpanded: true};}
      if (id === 'reduced-motion') after.viewport.reducedMotion = true;
      const targets = contract.layout.targetIdsByState?.[stateId] ?? contract.layout.targetIds;
      const observedLayout = {sample: after, rootScrollWidth: after.viewport.width, rootClientWidth: after.viewport.width, documentGeometry: documentGeometry(after.viewport),
        targets: targets.map(id => ({id, rect: {left: 20, top: 100, right: 300, bottom: 400, width: 280, height: 300}, clippedPixels: 0, obscuredPixels: 0, hitTargetId: id}))};
      raw.supplements.push({kind: 'g678-supplement-observation-v1', id, locale, stateId, animationId: contract.animationId, contractPin: result.contractPin,
        inputPins: contract.inputPins, before, after, ...Object.fromEntries(['errors', 'consoleErrors', 'networkErrors', 'cleanupErrors'].map(k => [k, []])),
        logPin: cell.logPin, layoutChecks: [observedLayout], screenshots: [{pin: imagePin, scope: 'stage', surfaceId: after.render.surfaceId, sampleSequence: after.sequence}],
        fontObservations: (contract.layout.fontTargetIds ?? []).map(targetId => ({targetId, glyphCount: 12, familyNames: ['Test font'], visibleText: 'Test source words'})),
        pendingFontRequests: ['/test-font.woff2'], loadedFontRequests: ['/test-font.woff2'], failedFontRequests: ['/test-font.woff2'],
        contentChecks: (contract.contentAssertions ?? []).filter(c => c.stateId === stateId).map(c => ({assertionId: c.id, stateId, selector: c.selector, sampleSequence: after.sequence, text: c.text, method: 'innerText', rect: {width: 200, height: 30}, computed: {display: 'block', visibility: 'visible', opacity: 1}})),
      });
    }
  };
  result.saveContract(); return result;
}
