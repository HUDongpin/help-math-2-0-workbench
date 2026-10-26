/** Read-only evidence predicates for HFR page leases. A persistent lesson VM
 * is valid after Replay; only the old page lease and its resources must retire.
 * No surface-run rule or source state is changed by these predicates. */
const text = value => typeof value === 'string' && value.length > 0;
const token = value => text(value) || Number.isSafeInteger(value) && value > 0;
const replay = value => Number.isSafeInteger(value) && value >= 0;
const owner = identity => identity?.ownerKind === 'source-vm' && text(identity.animationId) &&
  /^[a-f0-9]{64}$/.test(identity.sourceSha256 ?? '') && text(identity.playerId) && token(identity.leaseToken) && replay(identity.replay);
const bound = (identity, expected) => owner(identity) && owner(expected) &&
  identity.animationId === expected.animationId && identity.sourceSha256 === expected.sourceSha256 &&
  identity.playerId === expected.playerId && identity.leaseToken === expected.leaseToken && identity.replay === expected.replay;

export function sourceVmOwnerChanged(before, after) {
  return Boolean(owner(before) && owner(after) && before.animationId === after.animationId &&
    before.sourceSha256 === after.sourceSha256 && before.playerId !== after.playerId && before.leaseToken !== after.leaseToken);
}

export function sourceVmRetired(retired, before) {
  const expected = before?.identity, observation = retired?.observation, live = observation?.lifecycle;
  if (!bound(retired, expected) || !bound(observation?.identity, expected) || !bound(live?.identity, expected)) return false;
  if (retired.connected !== false || observation.status !== 'retired' || live.kind !== 'hfr-player-lifecycle-v1' ||
      !Number.isFinite(live.observedAtMs) || !Number.isFinite(before.atMs) || live.observedAtMs < before.atMs ||
      live.pageLeaseCurrent !== false || live.pageSessionCurrent !== false ||
      typeof live.playerDestroyed !== 'boolean' || typeof live.ownsActiveLoad !== 'boolean' ||
      !(live.playerDestroyed || !live.ownsActiveLoad) || live.animationFramePending !== false ||
      live.unattributedAnimationFrames !== 0 || live.unattributedHtmlMedia !== 0 || live.htmlMediaObservationOverflow !== 0) return false;
  if (!live.audioContext || !text(live.audioContext.contextId) || live.audioContext.state !== 'closed' ||
      live.audioContext.trackedStreams !== 0 || live.audioContext.trackedEvents !== 0) return false;
  if (!Array.isArray(live.htmlMedia) || new Set(live.htmlMedia.map(row => row?.mediaId)).size !== live.htmlMedia.length) return false;
  // If the collector also has operation-level counts, a contradictory count is
  // still a failure. hasRuntime is intentionally irrelevant to a page lease.
  if (retired.activeAudio !== undefined && retired.activeAudio !== 0 ||
      retired.activeTimers !== undefined && retired.activeTimers !== 0) return false;
  return live.htmlMedia.every(row => text(row?.mediaId) && text(row.src) && typeof row.currentSrc === 'string' &&
    typeof row.paused === 'boolean' && typeof row.ended === 'boolean' && (row.paused || row.ended) && row.pendingPlays === 0);
}

export function sourceVmReplayCause({before, after, event, retired, initialState}) {
  if (!sourceVmOwnerChanged(before?.identity, after?.identity) || !sourceVmRetired(retired, before)) return false;
  if (!Number.isFinite(before.atMs) || !Number.isFinite(after.atMs) || before.atMs >= after.atMs ||
      !event || event.trusted !== true || event.forced !== false || event.synthetic !== false ||
      event.playerId !== before.identity.playerId || (event.action ?? event.control) !== 'replay' ||
      !(event.type === 'click' || event.type === 'keydown' && ['Enter', ' ', 'Space'].includes(event.key)) ||
      !Number.isFinite(event.atMs) || event.atMs < before.atMs || event.atMs > after.atMs ||
      retired.observation.lifecycle.observedAtMs < event.atMs) return false;
  if (!initialState || typeof initialState !== 'object' || Array.isArray(initialState) || !Object.keys(initialState).length) return false;
  return Object.entries(initialState).every(([key, value]) => {
    if (!text(key) || key.split('.').some(part => ['__proto__','prototype','constructor'].includes(part))) return false;
    let actual = after;
    for (const part of key.split('.')) {
      if (!actual || !Object.hasOwn(actual, part)) return false;
      actual = actual[part];
    }
    return value !== undefined && JSON.stringify(actual) === JSON.stringify(value);
  });
}

/** Read the retained old ElementHandle after Replay/navigation. The producer
 * supplies every resource value; DOM detachment supplies only connected=false. */
export function readRetainedSourceSurface(surface) {
  const observation = typeof surface.__g678TechnicalRead === 'function' ? surface.__g678TechnicalRead() : null;
  return {...observation?.identity, connected: surface.isConnected, observation};
}
