import 'server-only';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin, verifyHostVersion, readRegistryTransaction, readPageProof, pinFile, withAdmissionReadStage} from '../../../lib/g678-admission-proof.mjs';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {extendP012Admission} from './g678-alg-l12-p012-admission.server';
import {extendGlossaryPairAdmission} from './g678-glossary-pair-admission.server';
import {extendGlossaryFamilyAdmission} from './g678-glossary-family-admission.server';
import {getWorkspaceRoot} from './catalog';
import {isG678LocalPreviewEnabled} from './g678-preview-policy';
import {algL12P003Descriptor} from './g678-alg-l12-p003.server';
import {extendAlgL12P006CurrentJsDescriptor, type ReviewedAlgL12P006CurrentJsPacket} from './g678-alg-l12-p006-current-js.server';
import {extendAlgL12P009CurrentJsDescriptor, type ReviewedAlgL12P009CurrentJsPacket} from './g678-alg-l12-p009-current-js-v2.server';
import {extendAlgL12P010CurrentJsDescriptor, type ReviewedAlgL12P010CurrentJsPacket} from './g678-alg-l12-p010-current-js-v1.server';
import {g678RegisteredDescriptorsWithExtensions} from './g678-current-js-extensions.server';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

const adapters = [
  {id:'shared-alg001-l12-p006', extend:(base:PageOnlyLessonPlayerDescriptor, packet:unknown) =>
    extendAlgL12P006CurrentJsDescriptor(base,packet as ReviewedAlgL12P006CurrentJsPacket,localOnlyAnimationModuleRegistration('shared-alg001-l12-p006'))},
  {id:'shared-alg001-l12-p009', extend:(base:PageOnlyLessonPlayerDescriptor, packet:unknown) =>
    extendAlgL12P009CurrentJsDescriptor(base,packet as ReviewedAlgL12P009CurrentJsPacket,localOnlyAnimationModuleRegistration('shared-alg001-l12-p009'))},
  {id:'shared-alg001-l12-p010', extend:(base:PageOnlyLessonPlayerDescriptor, packet:unknown) =>
    extendAlgL12P010CurrentJsDescriptor(base,packet as ReviewedAlgL12P010CurrentJsPacket,localOnlyAnimationModuleRegistration('shared-alg001-l12-p010'))},
  {id:'shared-alg001-l12-p012', extend:(base:PageOnlyLessonPlayerDescriptor, packet:unknown) =>
    extendP012Admission(base,packet,localOnlyAnimationModuleRegistration('shared-alg001-l12-p012'))},
  {id:'shared-alg001-l12-p013', extend:(base:PageOnlyLessonPlayerDescriptor, packet:unknown) =>
    extendGlossaryPairAdmission(base,packet,localOnlyAnimationModuleRegistration('shared-alg001-l12-p013'))},
  {id:'shared-alg001-l12-p015', extend:(base:PageOnlyLessonPlayerDescriptor, packet:unknown) =>
    extendGlossaryFamilyAdmission(base,packet,localOnlyAnimationModuleRegistration('shared-alg001-l12-p015'),'shared-alg001-l12-p015')},
] as const;

/** Existing semantic extenders remain unchanged; only proof collection is shared.
 * No staged-descriptor fallback, skipped input check, or production admission. */
export function splitAdmissionDescriptor(animationId:string):PageOnlyLessonPlayerDescriptor {
  if(!isG678LocalPreviewEnabled())
    throw Error('G678_ADMISSION_LOCAL_ONLY');
  const root=getWorkspaceRoot();
  return withAdmissionReadStage(root,[G678_ADMISSION_INDEX,
    pinFile(root,'apps/web/lib/g678-admission-activation.ts')],()=>{
  const index=readJsonPin(root,G678_ADMISSION_INDEX);
  const host=verifyHostVersion(root,index.host), transaction=readRegistryTransaction(root);
  let base=algL12P003Descriptor();
  for(const adapter of adapters) {
    const page=index.pages.find((page:{animationId:string})=>page.animationId===adapter.id);
    if(!page) throw Error(`Missing admission: ${adapter.id}`);
    base=adapter.extend(base,readPageProof(root,page.proof,host,transaction));
    if(adapter.id===animationId) return base;
  }
  throw Error(`Unknown admission: ${animationId}`);
  });
}

export function g678RegisteredDescriptorsWithSplitAdmission() {
  const preceding=g678RegisteredDescriptorsWithExtensions();
  if(!isG678LocalPreviewEnabled()) return preceding;
  // Preserve the maximal valid prefix, but validate/extend each adapter once.
  const root=getWorkspaceRoot();
  return withAdmissionReadStage(root,[G678_ADMISSION_INDEX,
    pinFile(root,'apps/web/lib/g678-admission-activation.ts')],()=>{
    let extended:PageOnlyLessonPlayerDescriptor|undefined;
    try {
      const index=readJsonPin(root,G678_ADMISSION_INDEX);
      const host=verifyHostVersion(root,index.host), transaction=readRegistryTransaction(root);
      let base=algL12P003Descriptor();
      for(const adapter of adapters) {
        try {
          const page=index.pages.find((page:{animationId:string})=>page.animationId===adapter.id);
          if(!page) throw Error(`Missing admission: ${adapter.id}`);
          // Clone the accepted prefix so a failing extender cannot mutate it.
          const next=adapter.extend(structuredClone(base),readPageProof(root,page.proof,host,transaction));
          base=next;extended=next;
        } catch {break;}
      }
    } catch {return preceding;}
    return extended ? preceding.map(descriptor=>descriptor.course.moduleCode==='ALG001' &&
      descriptor.course.lesson===12 ? extended! : descriptor) : preceding;
  });
}
