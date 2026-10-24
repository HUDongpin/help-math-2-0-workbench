import 'server-only';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P004CandidateDescriptor} from './alg-l06-p004-candidate-v1.server';
import {P004_RESOURCE_PINS,type P004Resource} from './alg-l06-p004-local-request-v1';

const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const RESOURCE_PATHS={
 canvas:{root:'workspace',path:'output/alg-l06-p004-canvas-candidate-v1/canvas-renderer.js'},
 main:{root:'workspace',path:'migrations/shared-alg001-l06-p004/audit/continuous-source-v1.mp3'},
 spanish:{root:'source',path:'G6-G8-shared/ALG001/L6/SA/L6RW04.mp3'},
} as const;

/** Each request rechecks the registered P003 predecessor, unregistered P004
 * projection, real SWF, dictionaries, audit and complete selected bytes. */
export function readP004Resource(resource:P004Resource):Buffer{
 if(process.env.NODE_ENV!=='development'||process.env.VERCEL||process.env.VERCEL_ENV)
  throw Error('P004_RESOURCE_LOCAL_ONLY');
 algL6P004CandidateDescriptor();
 const where=RESOURCE_PATHS[resource],pin=P004_RESOURCE_PINS[resource];
 return readPin(where.root==='source'?SOURCE_ROOT:getWorkspaceRoot(),
  {path:where.path,bytes:pin.bytes,sha256:pin.sha256});
}
