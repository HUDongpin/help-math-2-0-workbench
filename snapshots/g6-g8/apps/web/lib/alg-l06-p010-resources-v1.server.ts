import 'server-only';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {algL6P010FormalDescriptor} from './alg-l06-p010-formal-admission-v1.server';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P010CandidateDescriptor} from './alg-l06-p010-candidate-v1.server';
import {P010_RESOURCE_PINS,type P010Resource} from './alg-l06-p010-local-request-v1';

const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const RESOURCE_PATHS={
  canvas:'output/alg-l06-p010-canvas-v1/canvas-renderer.js',
  main:'migrations/shared-alg001-l06-p010/audit/audio-v1/continuous-source-v1.mp3',
  spanish:'migrations/shared-alg001-l06-p010/audit/audio-v1/separate-sa-source-v1.mp3',
} as const;

/** Revalidate the source-bound candidate and exact requested bytes for every
 * local candidate response. This reader does not grant formal admission. */
export function readP010Resource(resource:P010Resource):Buffer{
  if(process.env.NODE_ENV!=='development'||process.env.VERCEL||process.env.VERCEL_ENV||
    process.env.HELP_MATH_G678_SOURCE_ROOT!==SOURCE_ROOT||
    !['1','true'].includes(process.env.HELP_MATH_G678_LOCAL_PREVIEW??'')||
    process.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND!=='127.0.0.1')
    throw Error('P010_RESOURCE_LOCAL_ONLY');
  if(localOnlyAnimationModuleRegistration('shared-alg001-l06-p010'))algL6P010FormalDescriptor();
  else algL6P010CandidateDescriptor();
  const pin=P010_RESOURCE_PINS[resource];
  if(!pin)throw Error('P010_RESOURCE_UNKNOWN');
  return readPin(getWorkspaceRoot(),{path:RESOURCE_PATHS[resource],bytes:pin.bytes,sha256:pin.sha256});
}
