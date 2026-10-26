/** Small pure addition for the existing retained-PCM exporter. Do not put an
 * HTMLMediaElement ID into sourceNodeIds: those are WebAudio source nodes. */
import assert from 'node:assert/strict';
const text = value => typeof value === 'string' && value.length > 0;
const uniqueIds = value => Array.isArray(value) && value.length > 0 && new Set(value).size === value.length && value.every(text);
const token = value => text(value) || Number.isSafeInteger(value) && value > 0;

export function actualAudioOwnerFields(owner, row) {
  assert(text(owner?.playerId) && Number.isSafeInteger(owner.replay) && owner.replay >= 0, 'EXACT_PLAYER_REPLAY_REQUIRED');
  assert.equal(owner.mediaInstanceId, row.mediaInstanceId, 'MEDIA_INSTANCE_OWNER_MISMATCH');
  const base = {playerId: owner.playerId, replay: owner.replay};
  if (owner.ownerKind === 'source-vm') {
    assert(token(owner.leaseToken), 'SOURCE_VM_LEASE_TOKEN_REQUIRED');
    assert(['web-audio-buffer', 'html-media'].includes(owner.transport), 'SOURCE_VM_AUDIO_TRANSPORT_REQUIRED');
    const fields = {...base, ownerKind: owner.ownerKind, leaseToken: owner.leaseToken, transport: owner.transport};
    if (row.kind !== 'audible') return fields;
    if (owner.transport === 'html-media') {
      assert(uniqueIds(owner.mediaElementIds) && owner.mediaElementIds.length === 1 && owner.sourceNodeIds === undefined &&
        /^[a-f0-9]{64}$/.test(owner.sourceResourceSha256 ?? '') && owner.sourceResourceSha256 === row.sourceSha256,
      'ACTUAL_HTML_ELEMENT_AND_SOURCE_REQUIRED');
      return {...fields, mediaElementIds: [...owner.mediaElementIds], sourceResourceSha256: owner.sourceResourceSha256};
    }
    assert(uniqueIds(owner.sourceNodeIds) && owner.mediaElementIds === undefined, 'ACTUAL_SOURCE_NODE_IDS_REQUIRED');
    return {...fields, sourceNodeIds: [...owner.sourceNodeIds]};
  }
  // Preserve existing surface-run / legacy exporter admission exactly. Old
  // bindings need no new ownerKind field and still require actual node IDs.
  if (row.kind === 'audible') assert(Array.isArray(owner.sourceNodeIds) && owner.sourceNodeIds.length > 0 && owner.sourceNodeIds.every(text), 'ACTUAL_SOURCE_NODE_IDS_REQUIRED');
  return {...base, ...(owner.sourceNodeIds ? {sourceNodeIds: [...owner.sourceNodeIds]} : {})};
}
