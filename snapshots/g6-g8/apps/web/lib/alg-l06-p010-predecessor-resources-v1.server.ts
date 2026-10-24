import 'server-only';
import {createHash} from 'node:crypto';
import {readP008Resource} from './alg-l06-p008-resources-v1.server';
import {readP004Resource} from './alg-l06-p004-resources-v1.server';
import {readP003CanonicalCanvas,readP003CanonicalMain,readP003CanonicalSpanish}
  from './alg-l06-p003-canonical-resources-v1.server';
import {P010_PREDECESSOR_RESOURCES,type P010PredecessorResource}
  from './alg-l06-p010-predecessor-request-v1';

/** Delegate to each predecessor's unchanged canonical reader, then verify
 * the exact returned resource again under the P010 bridge pin. */
export function readP010PredecessorResource(kind:P010PredecessorResource):Buffer{
  const pin=P010_PREDECESSOR_RESOURCES[kind];
  if(!pin)throw Error('P010_PREDECESSOR_UNKNOWN_RESOURCE');
  const bytes=kind==='p008Canvas'?readP008Resource('canvas'):
    kind==='p008Main'?readP008Resource('main'):
    kind==='p008Spanish'?readP008Resource('spanish'):
    kind==='p004Canvas'?readP004Resource('canvas'):
    kind==='p004Main'?readP004Resource('main'):
    kind==='p004Spanish'?readP004Resource('spanish'):
    kind==='p003Canvas'?readP003CanonicalCanvas():
    kind==='p003Main'?readP003CanonicalMain():readP003CanonicalSpanish();
  if(bytes.length!==pin.bytes||createHash('sha256').update(bytes).digest('hex')!==pin.sha256)
    throw Error('P010_PREDECESSOR_RESOURCE_IDENTITY');
  return bytes;
}
