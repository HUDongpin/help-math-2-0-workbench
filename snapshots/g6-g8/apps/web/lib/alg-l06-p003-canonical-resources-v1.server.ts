import 'server-only';
import {lstatSync,realpathSync} from 'node:fs';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {ARTIFACTS,MAIN as SOURCE_MAIN,MEMBER_ROOT,OPTIONAL_SPANISH,RUN,MEMBER,SOURCE_ROOT,
  readP003CanonicalSource} from '../../../lib/alg-l06-p003-admission-semantics-v1.mjs';
import {getWorkspaceRoot} from './catalog';

type Resource='canvas'|'main'|'spanish';
const MAIN={...SOURCE_MAIN,path:`${MEMBER_ROOT}/continuous-source.mp3`};

function readCanonicalResource(resource:Resource):Buffer{
  if(process.env.NODE_ENV!=='development'||Boolean(process.env.VERCEL)||
    Boolean(process.env.VERCEL_ENV)||
    process.env.HELP_MATH_G678_SOURCE_ROOT!==SOURCE_ROOT||
    !['1','true'].includes(process.env.HELP_MATH_G678_LOCAL_PREVIEW??'')||
    process.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND!=='127.0.0.1')
    throw Error('P003_CANONICAL_RESOURCE_LOCAL_ONLY');
  const sourceRoot=lstatSync(SOURCE_ROOT);
  if(!sourceRoot.isDirectory()||sourceRoot.isSymbolicLink()||
    realpathSync(SOURCE_ROOT)!==SOURCE_ROOT)
    throw Error('P003_CANONICAL_RESOURCE_SOURCE_ROOT');
  const root=getWorkspaceRoot(),workspace=lstatSync(root);
  if(!workspace.isDirectory()||workspace.isSymbolicLink()||realpathSync(root)!==root)
    throw Error('P003_CANONICAL_RESOURCE_WORKSPACE_ROOT');
  // This checks the source SWF/XML, exact run/member manifests, canonical
  // module and every member resource before any one resource can be served.
  const canonical=readP003CanonicalSource(root);
  if(canonical.run.member.path!==MEMBER.path||
    canonical.member.artifacts.runtime.path!==ARTIFACTS.runtime.path||
    canonical.run.kind!=='alg-l06-p003-continuous-canonical-run-v1'||
    canonical.member.kind!=='alg-l06-p003-continuous-canonical-member-v1'||
    canonical.run.status!=='prepared-not-admitted'||
    canonical.member.status!=='prepared-not-admitted'||
    RUN.path!==`work/g678-shared-page-factory/g678-alg-l06-p003-continuous-20260928-v1/run-manifest.json`)
    throw Error('P003_CANONICAL_RESOURCE_MEMBER');
  const pin=resource==='canvas'?ARTIFACTS.runtime:
    resource==='main'?MAIN:OPTIONAL_SPANISH.asset;
  return readPin(root,pin);
}

export const readP003CanonicalCanvas=()=>readCanonicalResource('canvas');
export const readP003CanonicalMain=()=>readCanonicalResource('main');
export const readP003CanonicalSpanish=()=>readCanonicalResource('spanish');
