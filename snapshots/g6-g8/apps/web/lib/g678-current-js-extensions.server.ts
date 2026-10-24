import 'server-only';
import {g678RegisteredDescriptorsWithNmsL3P002} from './g678-nms-l03-p002.server';
import {algL1P006Descriptor} from './g678-alg-l01-p006.server';
import {algL2P005Descriptor} from './g678-alg-l02-p005.server';
import {algL6P002Descriptor} from './g678-alg-l06-p002.server';
import {algL6P001Descriptor} from './g678-alg-l06-p001.server';
import {algL12P006CurrentJsDescriptor} from './g678-alg-l12-p006-current-js.server';
import {nmsL2P005Descriptor} from './g678-nms-l02-p005.server';
import {algL4P004Descriptor} from './g678-alg-l04-p004.server';
import {nmsL8P004Descriptor} from './g678-nms-l08-p004.server';
import {algL10PairDescriptor} from './g678-alg-l10-pair.server';
import {nmsL1StoryDescriptor} from './g678-nms-l01-story.server';
import {nmsL1P002Descriptor} from './g678-nms-l01-p002.server';
import {nmsL1P005Descriptor} from './g678-nms-l01-p005.server';
import {nmsL1P007Descriptor} from './g678-nms-l01-p007.server';
import {nmsL1P008Descriptor} from './g678-nms-l01-p008.server';
import {nmsL1P009Descriptor} from './g678-nms-l01-p009.server';
import {nmsL1P010Descriptor} from './g678-nms-l01-p010.server';
import {nmsL1P011Descriptor} from './g678-nms-l01-p011.server';
import {nmsL1P013Descriptor} from './g678-nms-l01-p013.server';
import {nmsL1P015Descriptor} from './g678-nms-l01-p015.server';
import {nmsL1P016Descriptor} from './g678-nms-l01-p016.server';
import {nmsL1P017Descriptor} from './g678-nms-l01-p017-v3.server';
import {nmsL1P018Descriptor} from './g678-nms-l01-p018.server';
import {nmsL1P019Descriptor} from './g678-nms-l01-p019.server';
import {nmsL1P020Descriptor} from './g678-nms-l01-p020.server';
import {nmsL1P021Descriptor} from './g678-nms-l01-p021.server';
import {nmsL1P022Descriptor} from './g678-nms-l01-p022.server';
import {nmsL1P023Descriptor} from './g678-nms-l01-p023.server';
import {nmsL1P024Descriptor} from './g678-nms-l01-p024.server';
import {nmsL1P025Descriptor} from './g678-nms-l01-p025.server';
import {nmsL1P026Descriptor} from './g678-nms-l01-p026.server';
import {nmsL1P027Descriptor} from './g678-nms-l01-p027.server';
import {nmsL1P028Descriptor} from './g678-nms-l01-p028.server';
import {nmsL1P029Descriptor} from './g678-nms-l01-p029.server';
import {nmsL1P030Descriptor} from './g678-nms-l01-p030.server';
import {nmsL1P031Descriptor} from './g678-nms-l01-p031.server';
import {nmsL1P032Descriptor} from './g678-nms-l01-p032.server';
import {nmsL1P033Descriptor} from './g678-nms-l01-p033.server';
import {nmsL1P034Descriptor} from './g678-nms-l01-p034.server';
import {nmsL1P035Descriptor} from './g678-nms-l01-p035.server';
import {nmsL1P036Descriptor} from './g678-nms-l01-p036.server';
import {nmsL1P037Descriptor} from './g678-nms-l01-p037.server';
import {nmsL1P045Descriptor} from './g678-nms-l01-p045.server';
import {nmsL1P047Descriptor} from './g678-nms-l01-p047.server';
import {geoL06P001Descriptor} from './g678-geo-l06-p001.server';
import {geoL07P001Descriptor} from './g678-geo-l07-p001.server';
/** Independently validate each bounded lesson extension before raising its count. */
export function g678RegisteredDescriptorsWithExtensions() {
  let descriptors = g678RegisteredDescriptorsWithNmsL3P002();
  for (const readDescriptor of [algL1P006Descriptor, algL2P005Descriptor, algL6P002Descriptor, algL6P001Descriptor, algL12P006CurrentJsDescriptor, nmsL2P005Descriptor, algL4P004Descriptor, nmsL8P004Descriptor, algL10PairDescriptor, nmsL1P002Descriptor, nmsL1StoryDescriptor, nmsL1P005Descriptor, nmsL1P007Descriptor, nmsL1P008Descriptor, nmsL1P009Descriptor, nmsL1P010Descriptor, nmsL1P011Descriptor, nmsL1P013Descriptor, nmsL1P015Descriptor, nmsL1P016Descriptor, nmsL1P017Descriptor, nmsL1P018Descriptor, nmsL1P019Descriptor, nmsL1P020Descriptor, nmsL1P021Descriptor, nmsL1P022Descriptor, nmsL1P023Descriptor, nmsL1P024Descriptor, nmsL1P025Descriptor, nmsL1P026Descriptor, nmsL1P027Descriptor, nmsL1P028Descriptor, nmsL1P029Descriptor, nmsL1P030Descriptor, nmsL1P031Descriptor, nmsL1P032Descriptor, nmsL1P033Descriptor, nmsL1P034Descriptor, nmsL1P035Descriptor, nmsL1P036Descriptor, nmsL1P037Descriptor, nmsL1P045Descriptor, nmsL1P047Descriptor, geoL06P001Descriptor, geoL07P001Descriptor]) {
    try {
      const extended = readDescriptor();
      descriptors = descriptors.map(descriptor => descriptor.course.moduleCode === extended.course.moduleCode && descriptor.course.lesson === extended.course.lesson ? extended : descriptor);
    } catch {
      // Preserve the preceding trusted descriptor when this extension is unavailable.
    }
  }
  return descriptors;
}
