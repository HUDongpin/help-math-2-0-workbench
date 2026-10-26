import 'server-only';
import {getWorkspaceRoot} from './catalog';
import {readPin,readJsonPin} from '../../../lib/g678-admission-proof.mjs';
import {nmsL02P064AdmissionDescriptor} from './nms-l02-p064-admission.server';
import {nmsL02P054ProductDescriptorV1} from './nms-l02-p054-product-descriptor-v1';
import {readP054RevealTile} from './nms-l02-p054-reveal.server';
import {readP054FeedbackAudio} from './nms-l02-p054-feedback-audio.server';

const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE={path:'G6-G8-shared/NMS002/L2/GS/L2GS03.swf',bytes:2077270,
 sha256:'06bde171fe294f555f983c15b50afbb53344851cdc2f76e31e5eb5a4719cabb8'};
const XML={path:'G6-G8-shared/NMS002/L2/index.xml',bytes:12845,
 sha256:'550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61'};
const INPUTS=[
  {
    "path": "catalog/product-bridge-calibrations/g678-nms-l02-p053-p054-game-contract-v1.json",
    "bytes": 12324,
    "sha256": "6d492f48cc2df39ca1636d5f9cde8f7529493eb3770c1d47c690a3c84b8aa205"
  },
  {
    "path": "migrations/shared-nms002-l02-p054/audit/interaction-contract-v1.json",
    "bytes": 10154,
    "sha256": "7472962f3e1ca32219dafd000a3f9bbcc6b90865cb0ca7d7f3b79d5265cc03b4"
  },
  {
    "path": "migrations/shared-nms002-l02-p054/audit/card-layout-v1.json",
    "bytes": 9042,
    "sha256": "d34c6f2b89a99f110138c07b9b108ab96afa56db294a085a68a670d2cb034863"
  },
  {
    "path": "migrations/shared-nms002-l02-p054/audit/card-display-list-v1.json",
    "bytes": 93561,
    "sha256": "c2e18b123f43e16890548f4be5d38613b022c55c6e2b090cf663dd6d07c62343"
  },
  {
    "path": "migrations/shared-nms002-l02-p054/audit/game-display-list-v1.json",
    "bytes": 32997,
    "sha256": "8887c62a93824e851b2b6bba3779742ba43143b5c8e38b47c49b81c04fa6c40c"
  },
  {
    "path": "migrations/shared-nms002-l02-p054/audit/art-export-v1.json",
    "bytes": 87084,
    "sha256": "b715b175badc1edfcdf5df81ef7c388ea7e0b2eaac99656c28c74d1762e91974"
  },
  {
    "path": "packages/demos/src/generated/nms-l02-p054-cards-v1.ts",
    "bytes": 8013,
    "sha256": "10e71a7e683983a4ef9f63b46bdae5792675d590cf1fa4482da4962bc8df894c"
  }
] as const;
const MOVIE_ROOT="/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/p054-source-audit-gkoof5";
const MOVIE={"path": "movie.xml", "bytes": 49837761, "sha256": "2fd8146fe801e80f13c497b4bcefcf4aa050fc6d75decb448424767c56034e46"};

function demand(ok:unknown,message:string):asserts ok{
 if(!ok)throw Error(`P054_PRODUCT_CANDIDATE: ${message}`);
}
/** Local source-locked candidate. Resource readers independently enforce their
 * exact request and byte boundaries; no admission or original host claim. */
export function nmsL02P054ProductCandidateDescriptor(level:1|2=1){
 demand(process.env.NODE_ENV!=='production'&&!process.env.VERCEL&&!process.env.VERCEL_ENV&&
  process.env.HELP_MATH_G678_SOURCE_ROOT===SOURCE_ROOT,'local source environment');
 demand(level===1||level===2,'source level');
 const root=getWorkspaceRoot();
 readPin(SOURCE_ROOT,SOURCE);readPin(SOURCE_ROOT,XML);readPin(MOVIE_ROOT,MOVIE);
 const all=INPUTS.map(pin=>pin.path.endsWith('.json')?readJsonPin(root,pin):(readPin(root,pin),null));
 const interaction=all[1],layout=all[2],cards=all[3],game=all[4],art=all[5];
 for(const item of [interaction,layout,cards,game,art])demand(
  item.schemaVersion===1&&item.animationId==='shared-nms002-l02-p054','artifact identity');
 demand(interaction.sources.swf.sha256===SOURCE.sha256&&interaction.gameSpriteId===731&&
  interaction.cardHandlerCount===24&&interaction.feedback.correct.sourceSpriteId===194&&
  interaction.feedback.correct.terminalFrame===27&&interaction.feedback.wrong.sourceSpriteId===208&&
  interaction.feedback.wrong.terminalFrame===31,'source feedback contract');
 demand(layout.source.swfSha256===SOURCE.sha256&&layout.cards.length===24&&
  cards.cardCount===24&&game.controllerSpriteId===731&&game.controllerFrameCount===5&&
  game.inputs.source.sha256===SOURCE.sha256&&art.source.sha256===SOURCE.sha256,'source display linkage');
 for(const n of [1,2] as const)for(let order=1;order<=12;order++)readP054RevealTile(n,order);
 readP054FeedbackAudio('correct');readP054FeedbackAudio('wrong');
 const predecessor=nmsL02P064AdmissionDescriptor();
 demand(predecessor.registered===true,'registered P064 predecessor');
 return nmsL02P054ProductDescriptorV1(predecessor.descriptor,level);
}
