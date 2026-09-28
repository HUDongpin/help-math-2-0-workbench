import {existsSync, statSync} from 'node:fs';
import path from 'node:path';

export const CATALOG_INPUT_PATHS = Object.freeze([
  'catalog/animations.json',
  'catalog/missing-references.json',
  'catalog/completion-ledger.json',
  'catalog/lesson-releases.json',
  'catalog/lesson-release-ledger.json',
]);

export function catalogInputIdentity(root: string): string {
  return [root, ...CATALOG_INPUT_PATHS.map((relativePath) => {
    const file = path.join(root, relativePath);
    if (!existsSync(file)) return `${relativePath}:missing`;
    const metadata = statSync(file, {bigint: true});
    return `${relativePath}:${metadata.dev}:${metadata.ino}:${metadata.size}:${metadata.mtimeNs}:${metadata.ctimeNs}`;
  })].join('|');
}
