import type {RuntimeContext} from './contract';
import type {
  LessonTextBinding,
  LessonTextInstance,
  LessonTextInstanceSegment,
  TextPresentationSnapshot,
} from './lesson-text-contract';

export interface LessonTextValue {
  readonly text: string;
  readonly visible: boolean;
}

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Lesson text: ${message}`);
}

export function lessonTextInstanceId(path: readonly LessonTextInstanceSegment[]) {
  invariant(path.length > 0, 'instance path is empty');
  return path.map((segment) => {
    invariant(/^(root|sprite-\d+)$/u.test(segment.timelineId), 'invalid timeline id');
    invariant(Number.isSafeInteger(segment.depth) && segment.depth >= 0, 'invalid depth');
    invariant(Number.isSafeInteger(segment.generation) && segment.generation >= 0, 'invalid generation');
    invariant(Number.isSafeInteger(segment.characterId) && segment.characterId > 0, 'invalid character id');
    return `${segment.timelineId}:${segment.depth}:${segment.generation}:${segment.characterId}`;
  }).join('/');
}

export function validateLessonTextBinding(binding: LessonTextBinding) {
  invariant(binding.schemaVersion === 1, 'unsupported binding schema');
  invariant(binding.version.trim() && binding.animationId.trim() && binding.placementId.trim(), 'missing binding identity');
  invariant(/^[a-f0-9]{64}$/u.test(binding.sourceSwfSha256), 'invalid source SHA-256');
  invariant(['explanation', 'exercise', 'complex-figure'].includes(binding.template), 'invalid template');
  const ids = new Set<string>();
  for (const block of binding.blocks) {
    invariant(block.id.trim() && !ids.has(block.id), 'duplicate or empty block id');
    ids.add(block.id);
    const shapes = block.sourceShapeIds ?? [];
    invariant((block.sourceTextIds.length > 0 || shapes.length > 0)
      && block.sourceTextIds.every((id) => id.trim())
      && shapes.every((id) => Number.isSafeInteger(id) && id > 0), `missing source binding for ${block.id}`);
    invariant(['title', 'heading', 'body', 'question', 'feedback', 'answer', 'label'].includes(block.role), `invalid role for ${block.id}`);
    invariant(block.language === 'en' || block.language === 'es', `invalid source language for ${block.id}`);
    invariant(Number.isSafeInteger(block.readingOrder) && block.readingOrder >= 0, `invalid reading order for ${block.id}`);
    invariant(block.valueSource === 'source-static' || block.valueSource === 'maintained-page-state', `invalid value source for ${block.id}`);
    if (block.anchor) {
      invariant(block.role === 'label', 'only graph labels may have anchors');
      invariant(Object.values(block.anchor).filter((value) => typeof value === 'number').every(Number.isFinite), 'non-finite anchor');
      invariant(block.anchor.stageWidth > 0 && block.anchor.stageHeight > 0, 'invalid anchor stage');
    }
    if (block.instance) {
      invariant(block.instance.id === lessonTextInstanceId(block.instance.path), 'instance id does not match its path');
    }
  }
  return binding;
}

/** Pure: the host's already-computed state supplies every text value and reveal. */
export function buildLessonTextSnapshot(
  binding: LessonTextBinding,
  context: RuntimeContext,
  values: Readonly<Record<string, LessonTextValue>>,
): TextPresentationSnapshot {
  validateLessonTextBinding(binding);
  const blockers: string[] = [];
  for (const block of binding.blocks) {
    const value = Object.hasOwn(values, block.id) ? values[block.id] : undefined;
    if (!value || typeof value.text !== 'string' || typeof value.visible !== 'boolean') {
      blockers.push(`missing-state-value:${block.id}`);
    } else if (value.visible && !value.text.trim()) {
      blockers.push(`empty-visible-text:${block.id}`);
    }
  }
  if (Object.keys(values).some((id) => !binding.blocks.some((block) => block.id === id))) {
    blockers.push('unknown-state-value');
  }
  if (!Number.isSafeInteger(context.frame) || context.frame < 1
    || !Number.isSafeInteger(context.rootFrame) || (context.rootFrame ?? 0) < 1
    || !context.frameDomain || !context.scenario
    || !Number.isSafeInteger(context.seed)
    || !Number.isSafeInteger(context.replay ?? 0) || (context.replay ?? 0) < 0) {
    blockers.push('incomplete-runtime-identity');
  }
  const ready = blockers.length === 0;
  const instances = new Map<string, LessonTextInstance>();
  if (ready) {
    for (const block of binding.blocks) {
      if (block.instance) instances.set(block.instance.id, block.instance);
    }
  }
  return Object.freeze({
    schemaVersion: 1,
    animationId: binding.animationId,
    bindingVersion: binding.version,
    sourceSwfSha256: binding.sourceSwfSha256,
    status: ready ? 'ready' : 'blocked',
    blockers: Object.freeze(blockers),
    identity: Object.freeze({
      frame: context.frame,
      frameDomain: context.frameDomain ?? '',
      rootFrame: context.rootFrame ?? 0,
      scenario: context.scenario,
      language: context.lang,
      seed: context.seed,
      replay: context.replay ?? 0,
    }),
    blocks: Object.freeze(ready ? [...binding.blocks]
      .sort((a, b) => a.readingOrder - b.readingOrder || a.id.localeCompare(b.id))
      .map((block) => Object.freeze({
        id: block.id,
        text: values[block.id]!.text,
        visible: values[block.id]!.visible,
        role: block.role,
        language: block.language,
        readingOrder: block.readingOrder,
        ...(block.anchor ? {anchor: block.anchor} : {}),
      })) : []),
    suppressedInstances: Object.freeze([...instances.values()]),
  });
}

/** An exact instance match; a reused character at another depth is untouched. */
export function shouldSuppressLessonTextInstance(
  snapshot: TextPresentationSnapshot,
  path: readonly LessonTextInstanceSegment[],
) {
  if (snapshot.status !== 'ready') return false;
  const id = lessonTextInstanceId(path);
  return snapshot.suppressedInstances.some((instance) => instance.id === id);
}
