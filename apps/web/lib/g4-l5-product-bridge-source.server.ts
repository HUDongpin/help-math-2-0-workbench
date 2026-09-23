import {readFileSync} from 'node:fs';
import path from 'node:path';

import {
  buildGrade4CourseCatalogCoverage,
  type Grade4CourseCatalogCoverage,
} from './g4-course-catalog-coverage';
import {G4_L5_PRODUCT_FACTORY_SELECTED_ANIMATION_IDS} from './g4-l5-product-bridge-descriptor';

function workspaceRoot(): string {
  const candidates = [process.cwd(), path.resolve(process.cwd(), '../..')];
  const root = candidates.find((candidate) => {
    try {
      const catalog = JSON.parse(
        readFileSync(path.join(candidate, 'catalog/lessons.json'), 'utf8'),
      ) as {schemaVersion?: unknown};
      return catalog.schemaVersion === 1;
    } catch {
      return false;
    }
  });
  if (!root) throw new Error('Unable to resolve HELP Math workspace root');
  return root;
}

function readJson(root: string, relativePath: string): unknown {
  return JSON.parse(
    readFileSync(path.join(root, relativePath), 'utf8'),
  ) as unknown;
}

export function loadG4L5ProductBridgeSourceCoverage():
Grade4CourseCatalogCoverage {
  const root = workspaceRoot();
  return buildGrade4CourseCatalogCoverage(Object.freeze({
    lessonsDocument: readJson(root, 'catalog/lessons.json'),
    animationsDocument: readJson(root, 'catalog/animations.json'),
    missingReferencesDocument: readJson(root, 'catalog/missing-references.json'),
    registeredAnimationKeys:
      G4_L5_PRODUCT_FACTORY_SELECTED_ANIMATION_IDS,
  }));
}
