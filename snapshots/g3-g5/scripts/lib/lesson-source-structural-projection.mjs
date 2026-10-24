import assert from 'node:assert/strict';

// Structural membership only: child timelines are sampled at frame 1 and
// button states remain alternatives. No AVM1, masks or runtime visibility.
export function createStructuralProjector(asset) {
  const timelines = new Map(asset.timelines.map(t => [t.timelineId, t]));
  const buttons = new Map((asset.buttonDefinitions ?? []).map(b => [b.characterId, b]));
  const shapes = new Set(asset.shapeDefinitions.map(s => s.characterId));
  function snapshot(timelineId, frame) {
    const timeline = timelines.get(timelineId);
    assert(timeline, `Missing timeline ${timelineId}`);
    assert(Number.isSafeInteger(frame) && frame > 0, 'Invalid frame');
    const depths = new Map();
    for (const event of timeline.events) {
      if (event.frame > frame) continue;
      if (event.kind === 'remove') depths.delete(event.depth);
      else if (event.kind === 'place') {
        const prior = event.move ? depths.get(event.depth) : undefined;
        assert(event.characterId != null || prior?.characterId != null, 'Move without placed character');
        const merged = {...prior};
        for (const [key, value] of Object.entries(event)) if (value != null) merged[key] = value;
        depths.set(event.depth, merged);
      }
    }
    return [...depths.values()].sort((a, b) => a.depth - b.depth);
  }
  function project(timelineId, frame) {
    const found = [];
    function visit(characterId, chain, ancestors) {
      if (shapes.has(characterId)) found.push({characterId, chain});
      const child = `sprite-${characterId}`;
      if (timelines.has(child)) walk(child, 1, chain, ancestors);
      const button = buttons.get(characterId);
      if (button) {
        const key = `button-${characterId}`;
        assert(!ancestors.includes(key), `Recursive source graph ${key}`);
        for (const state of button.statePlacements) visit(state.characterId,
          [...chain, {container: key, instanceId: state.instanceId, states: state.states, matrix: state.matrix ?? null}],
          [...ancestors, key]);
      }
    }
    function walk(id, atFrame, chain, ancestors) {
      assert(!ancestors.includes(id), `Recursive source graph ${id}`);
      for (const item of snapshot(id, atFrame)) visit(item.characterId,
        [...chain, {container: id, frame: atFrame, instanceId: item.instanceId,
          name: item.name?.text ?? null, depth: item.depth, matrix: item.matrix ?? null}], [...ancestors, id]);
    }
    walk(timelineId, frame, [], []);
    return found;
  }
  return {snapshot, project};
}
