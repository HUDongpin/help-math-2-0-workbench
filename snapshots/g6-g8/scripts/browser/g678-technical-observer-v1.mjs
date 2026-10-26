/** Passive observations. Actual owner/commit snapshots come from the inspected
 * runtime adapter. Parent or canvas frame attributes are never paint evidence. */
export function installG678TechnicalObserver(options) {
  const existing = window.__g678TechnicalObserver;
  if (existing) {
    const bound = existing.boundPage;
    if (bound?.animationId === options.animationId && bound?.sourceSha256 === options.sourceSha256) return;
    throw Error('technical observer already installed');
  }
  const id = options.animationId;
  const documentId = [...crypto.getRandomValues(new Uint32Array(4))].map(n => n.toString(16).padStart(8, '0')).join('');
  const records = {documentId, samples: [], events: [], errors: [], statuses: [], unsupported: [], decodes: [], hashes: [], starts: [], stops: [], ended: [], contextOps: [], timers: []};
  // The combined init script may explicitly share the probe's private native
  // WeakSet. Do not trust a window API, a marker property or an object's .has.
  const nativeWeakSetHas = WeakSet.prototype.has, suppliedMeasurementContexts = options.measurementContexts;
  let measurementContexts = null, measurementContextExclusion = 'disabled';
  if (suppliedMeasurementContexts !== undefined) {
    try {
      Reflect.apply(nativeWeakSetHas, suppliedMeasurementContexts, [{}]);
      measurementContexts = suppliedMeasurementContexts; measurementContextExclusion = 'qualified-private-store';
    } catch {measurementContextExclusion = 'unsupported-store';}
  }
  const isMeasurementContext = context => measurementContexts !== null && Reflect.apply(nativeWeakSetHas, measurementContexts, [context]) === true;
  const contexts = new WeakMap(), buffers = new WeakMap(), nodes = new WeakMap();
  const contextList = [], gainList = [], timers = new Map(), rafs = new Map(), runs = new Map();
  let serial = 0, sequence = 0, eventSequence = 0, callbackOwner = null;
  const now = () => ({atMs: performance.now(), unixMs: Date.now()});
  const adapter = () => options.runtimeObserverKey ? window[options.runtimeObserverKey] : options.runtimeObserver;
  const unsupported = reason => {if (!records.unsupported.includes(reason)) records.unsupported.push(reason);};
  const validOwnerShape = owner => owner && typeof owner.animationId === 'string' && owner.animationId.length > 0 &&
    /^[a-f0-9]{64}$/.test(owner.sourceSha256 ?? '') &&
    typeof owner.playerId === 'string' && owner.playerId.length > 0 && Number.isSafeInteger(owner.replay) && owner.replay >= 0 &&
    (owner.ownerKind === 'source-vm' ? typeof owner.leaseToken === 'string' && owner.leaseToken.length > 0 || Number.isSafeInteger(owner.leaseToken) && owner.leaseToken > 0 :
      owner.ownerKind === 'surface-run' && typeof owner.runToken === 'string' && owner.runToken.length > 0 &&
      owner.runEpoch === owner.replay && typeof owner.surfaceId === 'string' && owner.surfaceId.length > 0);
  const validOwner = owner => validOwnerShape(owner) && owner.animationId === id && owner.sourceSha256 === options.sourceSha256;
  // Course entry/navigation can perform real work for another page. Retain that
  // actual identity; it is neither this page's work nor unknown ownership. A
  // different source for the target animation remains an identity failure.
  const validOperationOwner = owner => validOwnerShape(owner) && (owner.animationId !== id || validOwner(owner));
  const copyOwner = owner => validOwner(owner) ? structuredClone(owner) : null;
  const copyOperationOwner = owner => validOperationOwner(owner) ? structuredClone(owner) : null;
  function readRuntime() {
    const provider = adapter();
    if (!/^[a-f0-9]{64}$/.test(options.sourceSha256 ?? '') || typeof provider?.read !== 'function') {
      unsupported('actual-runtime-identity-and-commit-adapter-required'); return null;
    }
    try {return provider.read();} catch (error) {records.errors.push(`Runtime observation: ${error}`); return null;}
  }
  const currentOwner = () => copyOwner(readRuntime()?.identity);
  function operationOwner(kind, resource) {
    const provider = adapter();
    if (typeof provider?.ownerForOperation !== 'function') {unsupported('operation-owner-adapter-required'); return null;}
    try {
      const owner = provider.ownerForOperation(kind, resource);
      // Explicit null means the qualified adapter identified unrelated work.
      if (owner === null) return copyOperationOwner(callbackOwner);
      if (!validOperationOwner(owner)) {unsupported(`unqualified-operation-owner:${kind}`); return null;}
      return copyOperationOwner(owner);
    } catch (error) {records.errors.push(`Operation owner ${kind}: ${error}`); return null;}
  }
  function invokeOwned(owner, callback, receiver, args) {
    const previous = callbackOwner; callbackOwner = owner;
    try {return Reflect.apply(callback, receiver, args);} finally {callbackOwner = previous;}
  }
  const nativeDigest = crypto.subtle.digest;
  crypto.subtle.digest = function(...args) {
    const row = {...now(), operationId: `${documentId}:native-hash:${++serial}`, kind: 'hash', owner: operationOwner('hash', args[1]), state: 'pending'};
    records.hashes.push(row); let value;
    try {value = Reflect.apply(nativeDigest, this, args);} catch (error) {Object.assign(row, {state: 'rejected', error: String(error)}); throw error;}
    value.then(() => Object.assign(row, {state: 'fulfilled', settled: now()}), error => Object.assign(row, {state: 'rejected', settled: now(), error: String(error)}));
    return value;
  };
  const identity = (map, value, prefix) => {
    if (!value) return null;
    if (!map.has(value)) map.set(value, `${documentId}:${prefix}:${++serial}`);
    return map.get(value);
  };
  const contextId = value => {if (!contexts.has(value)) contextList.push(value); return identity(contexts, value, 'audio-context');};
  const bufferId = value => identity(buffers, value, 'audio-buffer');
  const nodeId = value => identity(nodes, value, 'audio-source');
  const observedConfiguration = () => ({locale: document.documentElement.lang.toLowerCase().split('-')[0],
    width: innerWidth, height: innerHeight, rootFontPx: Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
    dpr: devicePixelRatio, touch: navigator.maxTouchPoints > 0, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches});
  function ownedMedia(playerId = currentOwner()?.playerId) {
    const provider = adapter(), reasons = [];
    // Membership is read now: the probe adds a context after its constructor
    // returns. Keep every raw operation; exclude only proven measurement IDs
    // from the derived product counts and current owned-context set.
    const excludedContexts = new Set(contextList.filter(isMeasurementContext).map(contextId));
    const productContext = row => !excludedContexts.has(row.contextId);
    if (typeof playerId !== 'string' || !playerId) reasons.push('actual-owner-required');
    if (provider?.capabilities?.timerOwnership !== 'qualified') reasons.push('timer-ownership-unqualified');
    if (provider?.capabilities?.asyncOwnership !== 'qualified') reasons.push('async-ownership-unqualified');
    if (records.unsupported.includes('owned-string-timer-unobservable')) reasons.push('owned-string-timer-unobservable');
    if (records.unsupported.some(x => x.startsWith('unqualified-operation-owner:') || x === 'operation-owner-adapter-required')) reasons.push('unattributed-operations');
    if (options.audioRequired !== false && !window.AudioBufferSourceNode?.prototype?.start) reasons.push('native-audio-observation-unavailable');
    if ([records.starts, records.decodes, records.hashes, records.contextOps, records.timers].some(rows =>
      rows.some(row => productContext(row) && row.owner?.playerId === playerId && !validOwner(row.owner)))) reasons.push('owner-outside-observed-page');
    const own = row => validOwner(row.owner) && row.owner.playerId === playerId;
    const sourceNodes = records.starts.filter(row => productContext(row) && row.started && own(row));
    const relevantContexts = new Set([...sourceNodes, ...records.decodes.filter(row => productContext(row) && own(row)), ...records.contextOps.filter(row => productContext(row) && own(row))].map(row => row.contextId));
    // Buffer identity is evidence even when its decoder was measurement-owned.
    // A product-context start using that buffer must still be attributable.
    const exactBuffers = new Set(records.decodes.filter(row => (options.audioSourceHashes ?? []).includes(row.sha256)).map(row => row.bufferId));
    if (records.starts.some(row => productContext(row) && row.started && !row.owner && exactBuffers.has(row.bufferId))) reasons.push('source-audio-owner-unattributed');
    if (records.contextOps.some(row => row.state === 'pending' && !row.owner && relevantContexts.has(row.contextId))) reasons.push('owned-context-operation-unattributed');
    const currentContexts = contextList.filter(c => relevantContexts.has(contextId(c)))
      .map(c => ({contextId: contextId(c), state: c.state, currentTime: c.currentTime}));
    const active = sourceNodes.filter(row => {
      const context = currentContexts.find(c => c.contextId === row.contextId);
      const stop = records.stops.findLast(s => s.nodeId === row.nodeId && s.stopped);
      return context?.state !== 'closed' && !records.ended.some(e => e.nodeId === row.nodeId) &&
        !(stop && Number.isFinite(context?.currentTime) && stop.effectiveWhen <= context.currentTime);
    });
    const pending = [...records.decodes, ...records.hashes, ...records.contextOps.filter(row => row.method === 'resume')].filter(row => productContext(row) && own(row) && row.state === 'pending');
    const pendingScheduled = active.filter(row => currentContexts.some(c => c.contextId === row.contextId && row.effectiveWhen > c.currentTime));
    // Native suspended/closed contexts cannot render output. This narrow fact
    // does not qualify timer/async ownership or turn unknown owners into zero.
    const nativeContextsSilent = currentContexts.length > 0 && currentContexts.length === relevantContexts.size &&
      reasons.every(reason => ['timer-ownership-unqualified', 'async-ownership-unqualified'].includes(reason)) &&
      currentContexts.every(c => ['suspended', 'closed'].includes(c.state) && Number.isFinite(c.currentTime));
    for (const reason of reasons) unsupported(reason);
    return {status: reasons.length ? 'unsupported' : 'ready', unsupported: reasons, playerId: playerId ?? null,
      contexts: currentContexts, sourceNodeIds: sourceNodes.map(row => row.nodeId),
      ...(measurementContextExclusion === 'qualified-private-store' ? {excludedMeasurementContextIds: [...excludedContexts]} : {}),
      activeSourceNodes: reasons.length ? null : active.length,
      pendingMediaStarts: reasons.length ? null : pendingScheduled.length + pending.length,
      pendingOperations: pending.map(row => ({operationId: row.operationId, kind: row.kind ?? row.method, owner: row.owner})),
      runningOwnedOutputs: nativeContextsSilent ? 0 : reasons.length ? null : active.filter(row => currentContexts.some(c => c.contextId === row.contextId && c.state === 'running' && row.effectiveWhen <= c.currentTime)).length,
      gain: gainList.filter(row => relevantContexts.has(row.contextId)).map(row => ({contextId: row.contextId, value: row.node.gain.value})),
      activeTimers: reasons.length ? null : [...timers.values()].filter(own).length,
      activeAnimationFrames: reasons.length ? null : [...rafs.values()].filter(own).length};
  }
  function sample() {
    const observed = readRuntime(), {identity: owner, source, render} = observed ?? {};
    const ready = observed?.status === 'ready' && validOwner(owner) &&
      source?.clockOwnerId === owner.playerId && source.observedFrom === (owner.ownerKind === 'source-vm' ? 'source-runtime' : 'renderer-state') &&
      source.tickKind === (owner.ownerKind === 'source-vm' ? 'source-tick' : 'observed-committed-paint') &&
      Number.isSafeInteger(source.tick) && source.tick >= 0 && Number.isFinite(source.frame) && source.frame > 0 && typeof source.frameDomain === 'string' &&
      Array.isArray(source.errors) && Array.isArray(source.missing) &&
      render?.status === 'ready' && render.animationId === id && render.rendererFamily === options.rendererFamily &&
      typeof render.surfaceId === 'string' && render.surfaceId.length > 0 && (owner.ownerKind !== 'surface-run' || owner.surfaceId === render.surfaceId) &&
      typeof render.commitId === 'string' && render.commitId.length > 0 && Number.isSafeInteger(render.commitSequence) && render.commitSequence > 0 &&
      Number.isFinite(render.committedAtMs) && render.committedAtMs <= performance.now() &&
      render.sourceTick === source.tick && render.sourceFrame === source.frame && render.sourceFrameDomain === source.frameDomain;
    if (!ready) {
      const reason = observed?.status === 'loading' ? 'loading' : 'actual-committed-render-and-owner-required';
      if (reason !== 'loading') unsupported(reason);
      records.statuses.push({...now(), status: reason === 'loading' ? 'loading' : 'unsupported', reason}); return null;
    }
    const prior = runs.get(owner.playerId), token = owner.ownerKind === 'source-vm' ? owner.leaseToken : owner.runToken;
    if (prior && (prior.token !== token || prior.replay !== owner.replay || render.commitSequence < prior.commitSequence ||
        render.commitSequence === prior.commitSequence && (render.commitId !== prior.commitId || JSON.stringify([source.frame,source.frameDomain,source.tick]) !== prior.source))) {
      unsupported('owner-reuse-or-source-change-without-commit'); return null;
    }
    runs.set(owner.playerId, {token, replay: owner.replay, commitId: render.commitId, commitSequence: render.commitSequence, source: JSON.stringify([source.frame,source.frameDomain,source.tick])});
    // Optional detailed state is read from the existing producer at explicit
    // action/capture points; do not duplicate object inventories in every poll.
    const {sourceObservation,...automaticSource}=source;
    if(sourceObservation){const bound=sourceObservation.identity?.playerId===owner.playerId&&sourceObservation.identity?.leaseToken===owner.leaseToken&&
      sourceObservation.identity?.animationId===owner.animationId&&sourceObservation.identity?.sourceSha256===owner.sourceSha256&&
      sourceObservation.identity?.replay===owner.replay&&sourceObservation.identity?.ownerKind===owner.ownerKind&&sourceObservation.sourceTick===source.tick;
      automaticSource.sourceObservationSummary={status:bound?sourceObservation.status:'source-observation-binding-mismatch',
        sourceTick:bound?sourceObservation.sourceTick:null,objectCount:bound?sourceObservation.objects?.length??null:null,
        pointerCount:bound?sourceObservation.pointerEvents?.length??null:null,inventoryComplete:bound&&sourceObservation.inventoryComplete===true,detailsRetainedHere:false};}
    const state = {sequence: ++sequence, ...now(), viewport: observedConfiguration(), identity: structuredClone(owner),
      observer: {sourceActionsCalled: false, sourceStateWritten: false, syntheticInput: false, adapterId: adapter().id ?? null},
      source: structuredClone(automaticSource),
      render: structuredClone(render), host: structuredClone(observed.host ?? {}),
      ...(observed.dom ? {dom: structuredClone(observed.dom)} : {}), media: ownedMedia(owner.playerId)};
    records.samples.push(state); return state;
  }
  for (const type of ['pointerdown', 'pointerup', 'pointermove', 'pointercancel', 'keydown', 'keyup', 'click', 'input', 'change']) {
    document.addEventListener(type, event => {
      const node = event.target instanceof Element ? event.target : null;
      const control = node?.closest('button,input,[role="button"]');
      if (!document.querySelector(`[data-lesson-player][data-current-animation-id="${id}"]`)) return;
      const owner = currentOwner(), name = control?.getAttribute('data-responsive-focus-key') ?? control?.getAttribute('data-playback-action') ?? null;
      const row = {sequence: ++eventSequence, ...now(), type, trusted: event.isTrusted,
        // DOM isTrusted cannot reveal an automation force click. The runner must retain its dispatcher trace.
        forced: null, synthetic: !event.isTrusted, playerId: owner?.playerId ?? null,
        pointerType: event.pointerType ?? null, key: event.key ?? null, targetTag: node?.tagName ?? null, targetId: node?.id ?? null,
        ...(options.sourceStateProfile==='controls-v1'?{nativeEventTimeStamp:event.timeStamp,pointerId:event.pointerId??null,clientX:event.clientX??null,clientY:event.clientY??null}:{}),
        characterId: control?.getAttribute('data-source-character-id') ?? null, control: name,
        ...(['next', 'previous'].includes(name) ? {action: name} : {})};
      records.events.push(row);
      const activation = type === 'click' || type === 'keydown' && ['Enter', ' ', 'Space'].includes(event.key);
      if (name === 'timeline' && (['input', 'change'].includes(type) || type === 'keydown' && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(event.key)) || ['rewind', 'forward'].includes(name) && activation) {
        records.events.push({...row, sequence: ++eventSequence, type: 'seek', originatingEventSequence: row.sequence});
      }
    }, true);
  }
  const observeSource = () => {try {sample();} catch (error) {records.errors.push(String(error));}};
  new MutationObserver(observeSource).observe(document, {subtree: true, childList: true, attributes: true});
  const installTimer = (name, kind, collection, repeating) => {
    const native = window[name]; if (typeof native !== 'function') {unsupported(`${name}-unavailable`); return;}
    window[name] = function(callback, ...args) {
      const owner = operationOwner(kind, callback);
      if (owner && typeof callback !== 'function') unsupported('owned-string-timer-unobservable');
      if (typeof callback !== 'function' || !owner) return Reflect.apply(native, this, [callback, ...args]);
      const row = {...now(), kind, owner, state: 'pending', fires: 0}; let handle;
      const wrapped = function(...values) {
        row.fires++; row.lastFiredAtMs = performance.now();
        if (!repeating) {collection.delete(handle); row.state = 'fired';}
        return invokeOwned(owner, callback, this, values);
      };
      handle = Reflect.apply(native, this, [wrapped, ...args]); collection.set(handle, row); records.timers.push(row); return handle;
    };
  };
  installTimer('setTimeout', 'timeout', timers, false);
  installTimer('setInterval', 'interval', timers, true);
  installTimer('requestAnimationFrame', 'animation-frame', rafs, false);
  for (const [name, collection] of [['clearTimeout', timers], ['clearInterval', timers], ['cancelAnimationFrame', rafs]]) {
    const native = window[name]; if (typeof native !== 'function') continue;
    window[name] = function(handle) {const row = collection.get(handle); if (row) {row.state = 'cancelled'; row.cancelledAtMs = performance.now(); collection.delete(handle);} return Reflect.apply(native, this, [handle]);};
  }
  const Native = window.AudioContext ?? window.webkitAudioContext, Source = window.AudioBufferSourceNode;
  if (!Native?.prototype?.decodeAudioData || !Source?.prototype?.start) {
    if (options.audioRequired !== false) unsupported('native-audio-observation-unavailable');
  } else {
    const decode = Native.prototype.decodeAudioData, createGain = Native.prototype.createGain;
    const start = Source.prototype.start, stop = Source.prototype.stop;
    Native.prototype.createGain = function(...args) {const node = Reflect.apply(createGain, this, args); gainList.push({node, contextId: contextId(this)}); return node;};
    Native.prototype.decodeAudioData = function(...args) {
      const owner = operationOwner('decode', this);
      const row = {...now(), operationId: `${documentId}:decode:${++serial}`, kind: 'decode', owner, contextId: contextId(this), bytes: args[0]?.byteLength ?? null, sha256: null, state: 'pending'};
      const hash = {...now(), operationId: `${documentId}:hash:${++serial}`, kind: 'hash', owner, contextId: row.contextId, state: 'pending'};
      records.decodes.push(row); records.hashes.push(hash);
      try {Promise.resolve(Reflect.apply(nativeDigest, crypto.subtle, ['SHA-256', args[0].slice(0)])).then(value => {
        row.sha256 = [...new Uint8Array(value)].map(n => n.toString(16).padStart(2, '0')).join(''); hash.state = 'fulfilled'; hash.settled = now();
      }, error => {hash.state = 'rejected'; hash.error = String(error); hash.settled = now(); records.errors.push(`Source hash: ${error}`);});}
      catch (error) {hash.state = 'rejected'; hash.error = String(error); records.errors.push(`Source hash: ${error}`);}
      const resolved = buffer => {if (row.state === 'pending') Object.assign(row, {state: 'fulfilled', settled: now(), bufferId: bufferId(buffer), sampleRate: buffer.sampleRate, samples: buffer.length, channels: buffer.numberOfChannels});};
      const rejected = error => {if (row.state === 'pending') {Object.assign(row, {state: 'rejected', settled: now(), error: String(error)}); records.errors.push(`Native decode: ${error}`);}};
      const forwarded = [...args];
      if (typeof args[1] === 'function') forwarded[1] = function(buffer) {resolved(buffer); return invokeOwned(owner, args[1], this, [buffer]);};
      if (typeof args[2] === 'function') forwarded[2] = function(error) {rejected(error); return invokeOwned(owner, args[2], this, [error]);};
      let promise; try {promise = Reflect.apply(decode, this, forwarded);} catch (error) {rejected(error); throw error;}
      promise?.then(resolved, rejected); return promise;
    };
    Source.prototype.start = function(...args) {
      const owner = operationOwner('audio-start', this), time = this.context.currentTime;
      const row = {...now(), nodeId: nodeId(this), contextId: contextId(this.context), bufferId: bufferId(this.buffer), owner,
        playerId: owner?.playerId ?? null, replay: owner?.replay ?? null, when: args[0] ?? 0, effectiveWhen: Math.max(time, args[0] ?? 0),
        offset: args[1] ?? 0, durationArgument: args.length > 2 ? args[2] : null, contextTime: time, started: false};
      let result; try {result = Reflect.apply(start, this, args); row.started = true;}
      catch (error) {row.error = String(error); records.starts.push(row); throw error;}
      records.starts.push(row); this.addEventListener('ended', () => records.ended.push({...now(), nodeId: row.nodeId, contextId: row.contextId}), {once: true}); return result;
    };
    Source.prototype.stop = function(...args) {
      const row = {...now(), nodeId: nodeId(this), contextId: contextId(this.context), when: args[0] ?? 0,
        contextTime: this.context.currentTime, effectiveWhen: Math.max(this.context.currentTime, args[0] ?? 0), stopped: false};
      let result; try {result = Reflect.apply(stop, this, args); row.stopped = true;}
      catch (error) {row.error = String(error); records.stops.push(row); throw error;}
      records.stops.push(row); return result;
    };
    for (const method of ['resume', 'suspend', 'close']) {
      const native = Native.prototype[method]; if (typeof native !== 'function') continue;
      Native.prototype[method] = function(...args) {
        const row = {...now(), operationId: `${documentId}:${method}:${++serial}`, owner: operationOwner(method, this), contextId: contextId(this), method, before: this.state, state: 'pending', fulfilled: false};
        records.contextOps.push(row); let value;
        try {value = Reflect.apply(native, this, args);} catch (error) {Object.assign(row, {state: 'rejected', error: String(error), settled: now()}); throw error;}
        if (!value?.then) {row.state = 'unsupported'; unsupported(`nonpromise-context-operation:${method}`);}
        else value.then(() => Object.assign(row, {state: 'fulfilled', fulfilled: true, after: this.state, settled: now()}), error => Object.assign(row, {state: 'rejected', error: String(error), settled: now()}));
        return value;
      };
    }
  }
  Object.defineProperty(window, '__g678TechnicalObserver', {value: Object.freeze({records, sample, ownedMedia, configuration: observedConfiguration, measurementContextExclusion,
    boundPage: Object.freeze({animationId: id, sourceSha256: options.sourceSha256}),
    sourceStateProfile:options.sourceStateProfile==='controls-v1'?'controls-v1':null,
    capabilities: () => ({status: records.unsupported.length ? 'unsupported' : 'qualified-adapter-required', unsupported: [...records.unsupported]})}), configurable: false, writable: false});
}
