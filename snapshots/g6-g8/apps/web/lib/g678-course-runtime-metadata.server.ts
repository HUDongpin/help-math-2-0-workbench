import 'server-only';
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {readRegistryTransaction, readJsonPin, pinFile, readPin} from '../../../lib/g678-admission-proof.mjs';
import {readG678CourseRuntimeBindings} from '../../../scripts/lib/g678-course-runtime-bindings-v1.mjs';
import {descriptorForSelections} from './g678-calibration-product-bridge.server';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from './whole-lesson-player-descriptor';
import {isG678CompiledLocalQaEnabled} from './g678-preview-policy';

/** Reuse the existing descriptor projection with exact source catalog bytes.
 * An old whole-host admission failure is retained; it is not a prerequisite
 * for observing the current ALG L6 candidate under its selected input freeze. */
export function currentAlgL6SourceDescriptor(root: string): PageOnlyLessonPlayerDescriptor {
  assert(process.env.NODE_ENV !== 'production' || isG678CompiledLocalQaEnabled(), 'current technical course is local only');
  const transaction = readRegistryTransaction(root);
  const calibration = transaction.registry.calibrations.find(item => item.calibrationId === 'g678-16-page-product-calibration-v1');
  assert(calibration?.deploymentScope === 'local-only', 'exact base source catalog packet');
  const freezePin = {path: calibration.freezeManifest, bytes: calibration.freezeManifestBytes, sha256: calibration.freezeManifestSha256};
  const packet = readJsonPin(root, freezePin);
  const catalog = readJsonPin(root, packet.inputs.sharedCatalog);
  const lessons = catalog.lessons.filter(item => item.moduleCode === 'ALG001' && item.lessonNumber === 6);
  assert.equal(lessons.length, 1, 'one ALG L6 source lesson');
  const manifestPin = pinFile(root, 'catalog/g678-page-only-release-manifest.v1.json');
  const manifest = readJsonPin(root, manifestPin);
  const release = manifest.releases.find(item => item.moduleCode === 'ALG001' && item.moduleLesson === 6);
  assert.equal(release?.members.length, 60);
  assert.deepEqual(lessons[0].pages.map(page => [page.animationId, page.sourceSha256]),
    release.members.map(page => [page.animationId, page.source.sha256]), 'exact source catalog placement order');
  const selections = packet.selectedPages.filter(item => item.moduleCode === 'ALG001' && item.lessonNumber === 6);
  const descriptor = descriptorForSelections({catalogLesson: lessons[0], freezeBinding: {...freezePin, value: packet},
    selections, mathCompanionPresentations: new Map(), sourceGlossaryByAnimationId: new Map()});
  readPin(root, freezePin); readPin(root, packet.inputs.sharedCatalog); readPin(root, manifestPin);
  return descriptor;
}

/** Attach each registered page's existing source metadata to the course host.
 * Reading this metadata does not renew historical admission or accept playback.
 */
export function applyG678CourseRuntimeMetadata(root: string, base: PageOnlyLessonPlayerDescriptor) {
  const bindings = readG678CourseRuntimeBindings(root, base.pages.map(page => page.animationId));
  const glossary = [...base.glossary];
  const failures: Array<{animationId: string; reason: string}> = [];
  const pages = base.pages.map(page => {
    const row = bindings.rows.find(item => item.animationId === page.animationId);
    let reason = row?.status === 'ready' ? undefined : 'current-source-or-module-binding-failed';
    if (!reason && row?.status === 'ready') {
      for (const entry of row.glossaryEntries) {
        const old = glossary.find(item => item.id === entry.id);
        if (old && !isDeepStrictEqual(old, entry)) {reason = 'conflicting-source-glossary'; break;}
      }
      if (!reason) {
        for (const entry of row.glossaryEntries) if (!glossary.some(item => item.id === entry.id)) glossary.push(entry);
        return Object.freeze({...page, ...row.overlay}) as WholeLessonPlayerPage;
      }
    }
    failures.push({animationId: page.animationId, reason: reason!});
    return Object.freeze({...page, rendererAvailability: Object.freeze({kind: 'unavailable' as const, reason: reason!})});
  });
  const selectedAnimationIds = pages.filter(page => page.rendererAvailability.kind === 'registered')
    .map(page => page.animationId);
  return {descriptor: Object.freeze({...base,
    course: Object.freeze({...base.course,
      href: `/migration-status/g678-course/${base.course.moduleCode!.toLowerCase()}/${base.course.lesson}`}),
    productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selectedAnimationIds), registeredAnimationCount: selectedAnimationIds.length}),
    pages: Object.freeze(pages), glossary: Object.freeze(glossary)}), failures};
}
