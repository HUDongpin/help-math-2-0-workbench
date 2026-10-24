import 'server-only';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P008CandidateDescriptor} from './alg-l06-p008-candidate-v1.server';
import {P008_RESOURCE_PINS,type P008Resource} from './alg-l06-p008-local-request-v1';

const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const RESOURCE_PATHS={
  canvas:'output/alg-l06-p008-optimized-canvas-v1/successor-v2/canvas-renderer.js',
  main:'migrations/shared-alg001-l06-p008/audit/audio-v1/continuous-source-v1.mp3',
  spanish:'migrations/shared-alg001-l06-p008/audit/audio-v1/separate-sa-source-v1.mp3',
} as const;

/** Revalidate the source-bound candidate and exact requested bytes for every
 * local response. This does not register the P008 page or accept its media. */
export function readP008Resource(resource:P008Resource):Buffer{
  if(process.env.NODE_ENV!=='development'||process.env.VERCEL||process.env.VERCEL_ENV||
    process.env.HELP_MATH_G678_SOURCE_ROOT!==SOURCE_ROOT||
    !['1','true'].includes(process.env.HELP_MATH_G678_LOCAL_PREVIEW??'')||
    process.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND!=='127.0.0.1')
    throw Error('P008_RESOURCE_LOCAL_ONLY');
  algL6P008CandidateDescriptor();
  const pin=P008_RESOURCE_PINS[resource];
  if(!pin)throw Error('P008_RESOURCE_UNKNOWN');
  return readPin(getWorkspaceRoot(),{path:RESOURCE_PATHS[resource],bytes:pin.bytes,sha256:pin.sha256});
}
