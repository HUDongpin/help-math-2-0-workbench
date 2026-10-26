#!/usr/bin/env node
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile, writeFile, mkdir, lstat, readdir, realpath, statfs} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const RUN = 'work/g678-shared-page-factory/g678-alg-l11-b-instructional-visuals-v3';
export const AUDIT = 'catalog/g678-alg-l11-behavior10-tranche-b-audit-v1.json';
const AUDIT_HASH = '2b45cee5d1503d9e98521b5ca0518500a29f8bc43a0b1c84145016dccc5289b8';
const AUDIT_ROOT = 'work/g678-shared-page-factory/g678-alg-l11-behavior10-tranche-b-audit-v1';
const NORMALIZER = 'scripts/lib/g678-alg-l11-b-source-vectors.py';
const TOOLCHAIN_HASH = '07484eaf52751128f91b429b7ce1b7bb46259365c545d17c360b5d0c74c3b41f';
const IDS = ['026','027','028','029','030','031','032','040','041','042'];
export const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
function assert(value, message) { if (!value) throw Error(message); }
async function descriptor(file) {
  const info = await lstat(file);
  assert(info.isFile() && !info.isSymbolicLink() && info.nlink === 1, `Not a single regular file: ${file}`);
  const bytes = await readFile(file);
  return {path: path.relative(ROOT, file), bytes: bytes.length, sha256: hash(bytes)};
}
async function inventory(dir, relative = '') {
  const result = [];
  for (const name of (await readdir(path.join(dir, relative))).sort()) {
    const rel = path.join(relative, name), file = path.join(dir, rel), st = await lstat(file);
    assert(!st.isSymbolicLink(), `Symlink in run: ${rel}`);
    if (st.isDirectory()) result.push(...await inventory(dir, rel));
    else { assert(st.isFile(), `Special file in run: ${rel}`); result.push({...await descriptor(file), path: rel}); }
  }
  return result;
}
async function run(command, args, logBase) {
  const started = Date.now();
  const result = spawnSync(command, args, {cwd: ROOT, env: {PATH: process.env.PATH, HOME: process.env.HOME,
    LANG: 'en_US.UTF-8', TMPDIR: process.env.TMPDIR}, encoding: 'utf8', maxBuffer: 16*1024*1024, timeout: 660000});
  const stdout = result.stdout ?? '', stderr = result.stderr ?? '';
  await writeFile(`${logBase}.stdout.txt`, stdout, {flag: 'wx'});
  await writeFile(`${logBase}.stderr.txt`, stderr, {flag: 'wx'});
  const receipt = {command, args, status: result.status, signal: result.signal,
    elapsedMs: Date.now()-started, stdout: await descriptor(`${logBase}.stdout.txt`),
    stderr: await descriptor(`${logBase}.stderr.txt`)};
  await writeFile(`${logBase}.command.json`, JSON.stringify(receipt,null,2)+'\n', {flag:'wx'});
  assert(result.status === 0 && !result.error, `Command failed; retained ${logBase}: ${result.error?.message ?? stderr.slice(-500)}`);
  return receipt;
}
export async function build({page, check = false, runVersion = 3}) {
  assert(IDS.includes(page), 'Explicit exact B page required');
  assert(runVersion === 3 || runVersion === 4, 'Unknown source-vector run version');
  const runRoot = RUN.replace(/v3$/,`v${runVersion}`);
  const auditBytes = await readFile(path.join(ROOT,AUDIT));
  assert(hash(auditBytes) === AUDIT_HASH, 'B audit changed');
  assert(hash(await readFile(path.join(ROOT,'catalog/toolchain.json'))) === TOOLCHAIN_HASH, 'Toolchain changed');
  const audit = JSON.parse(auditBytes);
  const member = audit.members.find(m => m.animationId.endsWith(`p${page}`));
  const pageRoot = path.join(ROOT,runRoot,member.animationId);
  if (check) {
    const receipt = JSON.parse(await readFile(path.join(pageRoot,'page-receipt.json'),'utf8'));
    for (const binding of receipt.files) {
      const file = await descriptor(path.join(pageRoot,binding.path));
      assert(file.sha256 === binding.sha256 && file.bytes === binding.bytes, `Run file changed: ${binding.path}`);
    }
    const actual = await inventory(pageRoot);
    assert(actual.length === receipt.files.length + 1, 'Unexpected run entries');
    console.log(JSON.stringify({page:member.animationId,check:true,coverage:receipt.coverage}));
    return;
  }
  const sourceRoot = process.env.HELP_MATH_G678_SOURCE_ROOT;
  assert(sourceRoot && path.isAbsolute(sourceRoot), 'HELP_MATH_G678_SOURCE_ROOT required');
  const source = path.join(sourceRoot, member.source.path);
  const sourceStat = await lstat(source), sourceBytes = await readFile(source);
  assert(sourceStat.isFile() && !sourceStat.isSymbolicLink() && (sourceStat.mode & 0o222) === 0,
    'Source must be read-only regular file');
  assert(hash(sourceBytes) === member.source.sha256 && sourceBytes.length === member.source.bytes, 'Source bytes changed');
  const capacity = await statfs(ROOT);
  assert(capacity.bavail * capacity.bsize > 2*1024**3, 'Less than 2 GiB free for bounded extraction');
  const launcher = await realpath('/opt/homebrew/bin/ffdec');
  const jar = path.join(path.dirname(launcher),'ffdec.jar');
  const tool = {launcher:await descriptor(launcher),jar:await descriptor(jar)};
  assert(tool.launcher.sha256 === '1a242c6333aa8dba0f18f635f9ea2585a988f4131aa5164b70eb00ad9e662bab' &&
    tool.jar.sha256 === '090ab695053ad94cba6408574c7d7eea20ec60b6ae789ee6056a23f45106762f', 'Pinned FFDec executable changed');
  await mkdir(path.join(ROOT,runRoot),{recursive:true});
  await mkdir(pageRoot); // Each attempt is retained, never overwritten.
  const commands = [];
  commands.push(await run('/opt/homebrew/bin/ffdec',['-help','-export'],path.join(pageRoot,'ffdec-help')));
  const prefix=['-onerror','abort','-timeout','120','-exportTimeout','600'];
  commands.push(await run('/opt/homebrew/bin/ffdec',[...prefix,'-format','sprite:svg','-select',
    `${member.sourceStateMachine.mainObjectId}:1-${member.sourceStateMachine.frameCount}`,'-selectid',
    String(member.sourceStateMachine.mainObjectId),'-export','sprite',path.join(pageRoot,'main'),source],path.join(pageRoot,'ffdec-main')));
  commands.push(await run('/opt/homebrew/bin/ffdec',[...prefix,'-format','frame:svg','-select','0:6',
    '-export','frame',path.join(pageRoot,'root'),source],path.join(pageRoot,'ffdec-root')));
  commands.push(await run('python3',[NORMALIZER,'--audit',AUDIT,'--page',member.animationId,
    '--raw-root',pageRoot,'--source-audit-root',AUDIT_ROOT,'--output',path.join(pageRoot,'vector-bundle.json')],path.join(pageRoot,'compile')));
  assert(hash(await readFile(source)) === member.source.sha256, 'Source changed during extraction');
  const bundle = JSON.parse(await readFile(path.join(pageRoot,'vector-bundle.json'),'utf8'));
  const receipt={schemaVersion:1,runId:`g678-alg-l11-b-instructional-visuals-v${runVersion}`,animationId:member.animationId,
    scope:'new-unregistered-local-source-vector-candidate',source:member.source,
    sourceAudit:await descriptor(path.join(ROOT,AUDIT)), toolchain:await descriptor(path.join(ROOT,'catalog/toolchain.json')),
    tool, generator:await descriptor(fileURLToPath(import.meta.url)),normalizer:await descriptor(path.join(ROOT,NORMALIZER)),
    commands,files:await inventory(pageRoot),coverage:bundle.coverage,pendingChildDomains:bundle.childDomainsPending,
    acceptanceEffects:{currentJavaScriptRegistered:false,productCalibrationPassed:false,authoritativeOriginalRuntime:false,
      visualFidelityAccepted:false,audioAccepted:false,humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,released:false,published:false}};
  await writeFile(path.join(pageRoot,'page-receipt.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({page:member.animationId,coverage:receipt.coverage,vectorBundle:await descriptor(path.join(pageRoot,'vector-bundle.json'))}));
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args=process.argv.slice(2);const page=args[args.indexOf('--page')+1];
  build({page,check:args.includes('--check')}).catch(e=>{console.error(e.message);process.exitCode=1;});
}
