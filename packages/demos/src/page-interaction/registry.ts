import type {PageInteractionSpec} from './contract';
import {CITED_PAGE_INTERACTIONS} from './specs';

const byAnimationId = new Map(CITED_PAGE_INTERACTIONS.map((spec) => [spec.animationId, spec]));

export function pageInteractionFor(animationId: string): PageInteractionSpec | undefined {
  return byAnimationId.get(animationId);
}

export function hasPageInteraction(animationId: string): boolean {
  return byAnimationId.has(animationId);
}

export function listedPageInteractionIds(): readonly string[] {
  return CITED_PAGE_INTERACTIONS.map((spec) => spec.animationId);
}

export function stageTargetId(domIdPrefix: string, spec: PageInteractionSpec): string {
  return `${domIdPrefix}-${spec.stageTargetIdSuffix}`;
}
