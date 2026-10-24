import 'server-only';
import {readPin,readRegistryTransaction} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {readBoundG678LocalRuntimeAsset} from './g678-local-runtime-asset.server';
import {L10_LESSON_CANVAS_RESOURCES,l10LessonCanvasLocalDevelopment,type L10LessonCanvasId} from './alg-l10-lesson-canvas-request-v1';
const SOURCE_ROOT="/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware";
const SOURCE_PINS={"shared-alg001-l10-p005":{"path":"G6-G8-shared/ALG001/L10/RW/L10RW05.swf","bytes":430730,"sha256":"fb1e8707652f7eec02443c63a4ce4e068642cbc91e222d2b19a02acdcbde23e7"},"shared-alg001-l10-p006":{"path":"G6-G8-shared/ALG001/L10/RW/L10RW06.swf","bytes":409478,"sha256":"3843394c1ebfd124c72fb191e71a5568fe6673db2d8250f32ac0b1f74667c0fa"},"shared-alg001-l10-p007":{"path":"G6-G8-shared/ALG001/L10/VB/L10VB02.swf","bytes":99726,"sha256":"64acc290ff3b6b496b65ae54e6889bc180c1235e33e91ca9bfe07d8b8d1536cc"},"shared-alg001-l10-p008":{"path":"G6-G8-shared/ALG001/L10/VB/L10VB03.swf","bytes":121173,"sha256":"4667eb527f9f4c19613996ecc39a85ecbe2ff4c2f9bb22b4939a7aaf979ca27e"},"shared-alg001-l10-p017":{"path":"G6-G8-shared/ALG001/L10/IN/L10IN02.swf","bytes":126317,"sha256":"b816f92923f63c918c15e4d42a21c09349cd0e16487a6656b308106fac32cb04"},"shared-alg001-l10-p043":{"path":"G6-G8-shared/ALG001/L10/TS/L10TS02.swf","bytes":157407,"sha256":"40473649d1184510149ca27707bc67cd20890add7412789b0729c7d24c801646"},"shared-alg001-l10-p044":{"path":"G6-G8-shared/ALG001/L10/TS/L10TS03.swf","bytes":95991,"sha256":"01e4af3fd2e0a6657746af8cbb45b5ed0862717316a9c69d10923fa63804d93a"},"shared-alg001-l10-p045":{"path":"G6-G8-shared/ALG001/L10/TS/L10TS04.swf","bytes":150829,"sha256":"0c66042beb9e0eb23574f08957129a2efcbcfbba5daaf30e039660c3a8eb142b"},"shared-alg001-l10-p046":{"path":"G6-G8-shared/ALG001/L10/TS/L10TS05.swf","bytes":112710,"sha256":"f61c4be52569ab61ab8b7764f0b9ca1e44067e3a39840023a8f44abb97e9c841"},"shared-alg001-l10-p047":{"path":"G6-G8-shared/ALG001/L10/TS/L10TS06.swf","bytes":104240,"sha256":"cc0031d91e016821b819bfc2a99e8127a4326f090200233d8dcf7fb567a2c7af"},"shared-alg001-l10-p051":{"path":"G6-G8-shared/ALG001/L10/FQ/L10FQ01.swf","bytes":14613,"sha256":"b2fc65a0db946e1c261dd4a5622e05e1b9fd5466f0fc1a32144b92537350b3d5"}} as const;
/** Each read binds the exact existing registry entry and physical runtime bytes. */
export async function readL10LessonCanvasResource(id:L10LessonCanvasId):Promise<Buffer>{
 if(!l10LessonCanvasLocalDevelopment()||!Object.hasOwn(L10_LESSON_CANVAS_RESOURCES,id))throw Error('L10_CANVAS_SCOPE');
 const root=getWorkspaceRoot(),pin=L10_LESSON_CANVAS_RESOURCES[id],tx=readRegistryTransaction(root);
 const matches=tx.registry.calibrations.flatMap((c:{deploymentScope:string;entries:Array<{key:string;maturity:string;artifacts:{runtime?:{path:string;bytes:number;sha256:string}}}>})=>c.entries.filter(e=>e.key===id).map(e=>({c,e})));
 if(matches.length!==1)throw Error('L10_CANVAS_REGISTRATION');
 const {c,e}=matches[0],runtime=e.artifacts.runtime;
 if(c.deploymentScope!=='local-only'||e.maturity!=='private-current-js'||runtime?.path!==pin.path||runtime.bytes!==pin.bytes||runtime.sha256!==pin.sha256)throw Error('L10_CANVAS_PIN');
 readPin(SOURCE_ROOT,{path:'G6-G8-shared/ALG001/L10/index.xml',bytes:12047,sha256:'da83556a26ef2f33b37dcdc7972c5646e89723ac0819666baf6ed58ba9b955dc'});
 readPin(SOURCE_ROOT,SOURCE_PINS[id]);
 const physical=readPin(root,{path:pin.path,bytes:pin.bytes,sha256:pin.sha256});
 const bound=await readBoundG678LocalRuntimeAsset({workspaceRoot:root,binding:{animationId:id,path:pin.path,bytes:pin.bytes,sha256:pin.sha256,url:pin.originalPath}});
 if(!bound||bound.sha256!==pin.sha256||!bound.bytes.equals(physical))throw Error('L10_CANVAS_PHYSICAL_BINDING');
 return bound.bytes;
}
