import 'server-only';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {P001_SOURCE_ROOT,p001LocalDevelopment} from './alg-l07-p001-preview-policy-v1';
import {P001_RESOURCE_PINS,type P001Resource} from './alg-l07-p001-local-request-v1';

export function readP001Resource(token:P001Resource):Buffer{
 if(!p001LocalDevelopment()||!Object.hasOwn(P001_RESOURCE_PINS,token))
  throw Error('ALG_L07_P001_RESOURCE_SCOPE');
 readPin(P001_SOURCE_ROOT,{path:'G6-G8-shared/ALG001/L7/IR/L7IR01.swf',bytes:72497,
  sha256:'cef7d8d01efa3a8cc1f2a6d6e6334213c23892e0375bdac72624fd6979c16821'});
 readPin(P001_SOURCE_ROOT,{path:'G6-G8-shared/ALG001/L7/index.xml',bytes:13727,
  sha256:'5eac052615476e688afc1e69391c17bb0c20db8200e7be3f7ea1f9bb778d85f6'});
 return readPin(getWorkspaceRoot(),P001_RESOURCE_PINS[token]);
}
