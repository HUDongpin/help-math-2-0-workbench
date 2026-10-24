import 'server-only';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {P002_SOURCE_ROOT,p002LocalDevelopment} from './alg-l07-p002-preview-policy-v1';
import {P002_RESOURCE_PINS,type P002Resource} from './alg-l07-p002-local-request-v1';
/** Resource bytes remain tied to the page SWF and its source-ordered XML placement. */
export function readP002Resource(token:P002Resource):Buffer {
 if(!p002LocalDevelopment()||!Object.hasOwn(P002_RESOURCE_PINS,token))throw Error('ALG_L07_P002_RESOURCE_SCOPE');
 readPin(P002_SOURCE_ROOT,{path:'G6-G8-shared/ALG001/L7/RW/L7RW02.swf',bytes:1603537,sha256:'be4379b92c4a214b6a00d655cee930dbdba0a018c0b1dcb89be855e4a8c8f996'});
 readPin(P002_SOURCE_ROOT,{path:'G6-G8-shared/ALG001/L7/index.xml',bytes:13727,sha256:'5eac052615476e688afc1e69391c17bb0c20db8200e7be3f7ea1f9bb778d85f6'});
 return readPin(token==='optional-spanish-audio'?P002_SOURCE_ROOT:getWorkspaceRoot(),P002_RESOURCE_PINS[token]);
}
