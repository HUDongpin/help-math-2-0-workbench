import 'server-only';
import {createHash} from 'node:crypto';
import {readP003CanonicalCanvas,readP003CanonicalMain,readP003CanonicalSpanish}
  from './alg-l06-p003-canonical-resources-v1.server';
import {P004_PREDECESSOR_RESOURCES,type P004PredecessorResource}
  from './alg-l06-p004-predecessor-request-v1';

/** Reuse the unchanged P003 canonical reader, including its source/run/member
 * checks. This bridge verifies the returned bytes before serving P004. */
export function readP004PredecessorResource(kind:P004PredecessorResource):Buffer{
  const resource=P004_PREDECESSOR_RESOURCES[kind];
  if(!resource)throw Error('P004_PREDECESSOR_UNKNOWN_RESOURCE');
  const bytes=kind==='canvas'?readP003CanonicalCanvas():
    kind==='main'?readP003CanonicalMain():readP003CanonicalSpanish();
  if(bytes.length!==resource.bytes||
    createHash('sha256').update(bytes).digest('hex')!==resource.sha256)
    throw Error('P004_PREDECESSOR_RESOURCE_IDENTITY');
  return bytes;
}
