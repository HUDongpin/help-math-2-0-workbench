import 'server-only';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {P001_SOURCE_ROOT,p001LocalDevelopment} from './alg-l08-p001-preview-policy-v1';
import {P001_RESOURCE_PINS,type P001Resource} from './alg-l08-p001-local-request-v1';

export function readP001Resource(token:P001Resource):Buffer{
 if(!p001LocalDevelopment()||!Object.hasOwn(P001_RESOURCE_PINS,token))
  throw Error('ALG_L08_P001_RESOURCE_SCOPE');
 readPin(P001_SOURCE_ROOT,{path:'G6-G8-shared/ALG001/L8/IR/L8IR01.swf',bytes:72545,
  sha256:'f0b332dc6586753bf485740cf4e9fa00833a5a2c929d546b1190fecd391eaaf7'});
 readPin(P001_SOURCE_ROOT,{path:'G6-G8-shared/ALG001/L8/index.xml',bytes:10734,
  sha256:'185aaeaf3b56a812d66fe72671941350c8ceb5db48dc2824e74980a70ebe80c7'});
 return readPin(getWorkspaceRoot(),P001_RESOURCE_PINS[token]);
}
