import 'server-only';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {P004_SOURCE_ROOT,p004LocalDevelopment} from './alg-l10-p004-preview-policy-v1';
import {P004_RESOURCE_PINS,type P004ResourceId} from './alg-l10-p004-resource-pins-v1';
export function readP004Resource(token:P004ResourceId):Buffer{
 if(!p004LocalDevelopment()||!Object.hasOwn(P004_RESOURCE_PINS,token))throw Error('ALG_L10_P004_RESOURCE_SCOPE');
 readPin(P004_SOURCE_ROOT,{path:'G6-G8-shared/ALG001/L10/RW/L10RW04.swf',bytes:259356,sha256:'5ac9be9459e12bdc6552d53a66b67ceb645633d2fe57522639a043d28180f5b2'});
 readPin(P004_SOURCE_ROOT,{path:'G6-G8-shared/ALG001/L10/index.xml',bytes:12047,sha256:'da83556a26ef2f33b37dcdc7972c5646e89723ac0819666baf6ed58ba9b955dc'});
 return readPin(getWorkspaceRoot(),P004_RESOURCE_PINS[token]);
}
