/** Serialize into the existing owned browser document after the technical
 * observer. Observes native HTMLMediaElement operations/events only. It never
 * starts, pauses, seeks, connects, decodes, changes a device, or assigns owners. */
export function installSourceVmHtmlMediaObserver(options) {
  const existing = window.__g678SourceVmHtmlMediaObserver;
  if (existing) {
    const bound = existing.boundPage;
    if (bound?.animationId === options.animationId && bound?.sourceSha256 === options.sourceSha256) return;
    throw Error('HTML media observer already installed');
  }
  const technical = window.__g678TechnicalObserver, documentId = technical?.records?.documentId;
  if (typeof documentId !== 'string' || !documentId) throw Error('existing technical document identity required');
  const prototype = window.HTMLMediaElement?.prototype;
  if (!prototype || typeof prototype.play !== 'function' || typeof prototype.pause !== 'function') throw Error('native HTMLMediaElement API required');
  const records = {kind: 'source-vm-html-media-observations-v1', documentId, documentTimeOrigin: performance.timeOrigin,
    operations: [], events: [], samples: [], unsupported: [], errors: []};
  const ids = new WeakMap(), elements = new Set(); let serial = 0, sequence = 0;
  const now = () => ({atMs: performance.now(), unixMs: Date.now()});
  const unsupported = reason => {if (!records.unsupported.includes(reason)) records.unsupported.push(reason);};
  const add = (list, row) => {if (list.length >= 20000) {unsupported('html-media-observation-overflow'); return;} list.push(row);};
  const owner = media => {
    try {
      const adapter = options.runtimeObserverKey ? window[options.runtimeObserverKey] : options.runtimeObserver;
      if (typeof adapter?.ownerForOperation !== 'function') {unsupported('html-media-owner-adapter-required'); return null;}
      const value = adapter.ownerForOperation('html-media', media);
      if (value?.animationId !== options.animationId || value?.sourceSha256 !== options.sourceSha256) {
        if ((options.sourceUrls ?? []).includes(media.currentSrc || media.src)) unsupported('matching-html-source-owner-unattributed');
        return null;
      }
      if (value.ownerKind !== 'source-vm' || typeof value.playerId !== 'string' || !value.playerId ||
          !(typeof value.leaseToken === 'string' && value.leaseToken || Number.isSafeInteger(value.leaseToken) && value.leaseToken > 0) ||
          !Number.isSafeInteger(value.replay) || value.replay < 0) {unsupported('html-media-owner-unqualified'); return null;}
      return structuredClone(value);
    } catch (error) {records.errors.push(String(error)); return null;}
  };
  const state = media => ({src: media.src, currentSrc: media.currentSrc, currentTime: media.currentTime, duration: media.duration,
    paused: media.paused, ended: media.ended, seeking: media.seeking, readyState: media.readyState, networkState: media.networkState,
    muted: media.muted, volume: media.volume, playbackRate: media.playbackRate, defaultPlaybackRate: media.defaultPlaybackRate,
    error: media.error ? {code: media.error.code, message: media.error.message} : null});
  function track(media) {
    if (ids.has(media)) return ids.get(media);
    const identity = owner(media);
    if (!identity) return null;
    if (elements.size >= 32) {unsupported('html-media-element-cap-exceeded'); return null;}
    const mediaElementId = `${documentId}:html-media:${++serial}`;
    ids.set(media, mediaElementId); elements.add(media);
    for (const type of ['loadstart', 'loadedmetadata', 'playing', 'timeupdate', 'pause', 'ended', 'seeking', 'seeked',
      'ratechange', 'volumechange', 'waiting', 'stalled', 'emptied', 'abort', 'error']) {
      media.addEventListener(type, event => {
        try {add(records.events, {sequence: ++sequence, ...now(), type, trusted: event.isTrusted,
          eventTimeStamp: event.timeStamp, mediaElementId, owner: owner(media), state: state(media)});}
        catch (error) {records.errors.push(String(error));}
      });
    }
    return mediaElementId;
  }
  for (const method of ['play', 'pause']) {
    const native = prototype[method];
    prototype[method] = function(...args) {
      let row = null;
      try {
        const mediaElementId = track(this);
        if (mediaElementId) {
          row = {operationId: `${documentId}:html-${method}:${++serial}`, ...now(), method, mediaElementId,
            owner: owner(this), before: state(this), state: 'pending'};
          add(records.operations, row);
        }
      } catch (error) {records.errors.push(String(error));}
      let result;
      try {result = Reflect.apply(native, this, args);}
      catch (error) {if (row) Object.assign(row, {state: 'rejected', error: String(error), settled: now()}); throw error;}
      if (row) {
        const media = this;
        const settled = (status, error) => {
          try {Object.assign(row, {state: status, settled: {...now(), owner: owner(media), state: state(media)},
            ...(error ? {error: String(error)} : {})});}
          catch (failure) {records.errors.push(String(failure));}
        };
        if (method === 'play') {
          if (typeof result?.then !== 'function') {row.state = 'unsupported'; unsupported('html-play-nonpromise-result');}
          else result.then(() => settled('fulfilled'), error => settled('rejected', error));
        } else settled('fulfilled');
      }
      return result;
    };
  }
  function sample() {
    for (const media of elements) {
      try {add(records.samples, {sequence: ++sequence, ...now(), type: 'sample', mediaElementId: ids.get(media), owner: owner(media), state: state(media)});}
      catch (error) {records.errors.push(String(error));}
    }
    return records.samples.at(-1) ?? null;
  }
  Object.defineProperty(window, '__g678SourceVmHtmlMediaObserver', {value: Object.freeze({records, sample,
    boundPage: {animationId: options.animationId, sourceSha256: options.sourceSha256}}), configurable: false, writable: false});
}
