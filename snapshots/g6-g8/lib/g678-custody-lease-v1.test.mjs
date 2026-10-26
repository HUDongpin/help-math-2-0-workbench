import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import * as custody from './g678-custody-lease-v1.mjs';

const MODULE = fileURLToPath(new URL('./g678-custody-lease-v1.mjs', import.meta.url));
const PAGE = 'shared-nms002-l11-p024', OTHER = 'shared-nms002-l11-p025';
const INPUTS = ['work/hfr-typescript/review/DRAFT.json', 'work/hfr-typescript/review/REVIEW.json'];
const OTHER_TOKEN = 'a'.repeat(64);

// Every temp folder is built from the canonical temp path, so no expectation depends on how this
// machine spells os.tmpdir() (macOS's default /var/folders/... resolves through /var -> /private/var).
const TMP = fs.realpathSync(os.tmpdir());
function tempDir(t, prefix) {
  const dir = fs.mkdtempSync(path.join(TMP, prefix));
  assert.equal(fs.realpathSync(dir), dir, 'canonical temp folder');
  t.after(() => fs.rmSync(dir, {recursive: true, force: true}));
  return dir;
}
// Each test gets its own physical root holding a copy of this module at lib/.
function scratch(t) {
  const root = tempDir(t, 'g678-custody-');
  fs.mkdirSync(root + '/lib');
  fs.copyFileSync(MODULE, root + '/' + custody.MODULE_PATH);
  fs.mkdirSync(root + '/work/hfr-typescript/review', {recursive: true});
  fs.writeFileSync(root + '/' + INPUTS[0], '{"draft":1}\n');
  fs.writeFileSync(root + '/' + INPUTS[1], '{"status":"PASS"}\n');
  return root;
}
const acquire = (root, holder = 'codex:fixture', extra = {}) => custody.acquireCustody({root, holder, pages: [PAGE], inputs: INPUTS, ...extra});
const leaseFile = root => root + '/' + custody.LEASE_PATH;
const history = (root, name) => root + '/' + custody.HISTORY_DIR + '/' + name;

test('acquire opens epoch 1 and the holder passes the custody check', t => {
  const root = scratch(t), a = acquire(root);
  assert.equal(a.epoch, 1);
  assert.match(a.token, /^[0-9a-f]{64}$/);
  const c = custody.assertCustody({root, page: PAGE, token: a.token});
  assert.equal(c.epoch, 1);
  assert.equal(c.holder, 'codex:fixture');
  assert.deepEqual(c.provenance, a.provenance);
  assert.deepEqual(c.provenance.record, a.record);
  assert.equal(c.predecessor, null);
  assert.deepEqual(c.inputs.map(p => p.path), [custody.MODULE_PATH, ...INPUTS].sort());
  const text = fs.readFileSync(leaseFile(root), 'utf8');
  assert(!text.includes(a.token), 'the token itself is never written');
  assert.equal(text, fs.readFileSync(history(root, 'epoch-000001.json'), 'utf8'));
});

test('two writers: a second acquire is refused while a lease is held', t => {
  const root = scratch(t), a = acquire(root, 'codex:first');
  assert.throws(() => acquire(root, 'claude:second'), /custody is already held \(epoch 1, holder "codex:first"\); a second writer cannot acquire it/);
  assert.equal(custody.assertCustody({root, token: a.token}).holder, 'codex:first');
});

test('two writers: of eight concurrent acquirers in separate processes exactly one wins, every round', async t => {
  const root = scratch(t);
  const run = holder => new Promise(resolve => {
    const child = spawn(process.execPath, [MODULE, 'acquire', '--root', root, '--holder', holder, '--page', PAGE, '--print-token'], {stdio: ['ignore', 'pipe', 'pipe']});
    let out = '';
    child.stdout.on('data', d => {out += d;});
    child.on('close', code => resolve({code, result: JSON.parse(out.trim())}));
  });
  for (let round = 1; round <= 5; round++) {
    const results = await Promise.all(Array.from({length: 8}, (_, i) => run(`writer-${round}-${i}`)));
    const winners = results.filter(r => r.code === 0);
    assert.equal(winners.length, 1, `round ${round}: exactly one writer acquires custody`);
    for (const r of results.filter(r => r.code !== 0)) {
      assert.equal(r.result.ok, false);
      assert.match(r.result.refusal, /already held|EEXIST|opened but never closed/);
    }
    assert.equal(winners[0].result.epoch, round);
    custody.releaseCustody({root, token: winners[0].result.token});
  }
  const names = fs.readdirSync(root + '/' + custody.HISTORY_DIR).sort();
  assert.equal(names.length, 10, 'five epochs, each opened once and closed once');
});

test('two writers: a caller without the token, or with another token, is refused', t => {
  const root = scratch(t), a = acquire(root);
  assert.throws(() => custody.assertCustody({root, token: null}), /custody token required/);
  assert.throws(() => custody.assertCustody({root, token: OTHER_TOKEN}), /caller does not hold custody: token mismatch/);
  assert.throws(() => custody.assertCustody({root, token: a.token.toUpperCase()}), /custody token required/);
  assert.equal(custody.custodyToken({root, env: {[custody.TOKEN_ENV]: a.token}}), a.token);
  assert.equal(custody.assertCustody({root, token: custody.custodyToken({root, env: {[custody.TOKEN_ENV]: a.token}})}).epoch, 1);
});

test('stale lease: a released epoch refuses its old token, and so does the next holder\'s epoch', t => {
  const root = scratch(t), a = acquire(root, 'codex:old');
  const released = custody.releaseCustody({root, token: a.token, note: 'session rotation'});
  assert.equal(released.epoch, 1);
  assert.throws(() => custody.assertCustody({root, token: a.token}), /no custody lease is held/);
  const b = acquire(root, 'claude:new');
  assert.equal(b.epoch, 2);
  assert.deepEqual(custody.assertCustody({root, token: b.token}).predecessor, released.closed);
  assert.throws(() => custody.assertCustody({root, token: a.token}), /token mismatch/);
  const closed = JSON.parse(fs.readFileSync(history(root, 'epoch-000001-closed.json')));
  assert.equal(closed.how, 'released');
  assert.equal(closed.inputsIntact, true);
});

test('stale lease: an Owner break evicts the holder, and the chain continues', t => {
  const root = scratch(t), a = acquire(root, 'codex:stuck'), status = custody.custodyStatus({root});
  assert.equal(status.held, true);
  assert.equal(status.epoch, 1);
  assert.throws(() => custody.breakCustody({root, epoch: 1, leaseSha256: 'b'.repeat(64), reason: 'holder unreachable'}), /changed since it was inspected/);
  assert.throws(() => custody.breakCustody({root, epoch: 1, leaseSha256: status.record.sha256, reason: ''}), /Owner reason required/);
  const broken = custody.breakCustody({root, epoch: 1, leaseSha256: status.record.sha256, reason: 'holder unreachable'});
  assert.equal(broken.leaseWasPresent, true);
  assert.throws(() => custody.assertCustody({root, token: a.token}), /no custody lease is held/);
  const b = acquire(root, 'claude:successor');
  assert.equal(b.epoch, 2);
  assert.throws(() => custody.assertCustody({root, token: a.token}), /token mismatch/);
  assert.equal(JSON.parse(fs.readFileSync(history(root, 'epoch-000001-closed.json'))).how, 'broken');
  assert.deepEqual(custody.assertCustody({root, token: b.token}).predecessor, broken.closed);
});

test('stale lease: restoring an older epoch\'s lease file is refused', t => {
  const root = scratch(t), a = acquire(root, 'codex:old');
  custody.releaseCustody({root, token: a.token});
  acquire(root, 'claude:new');
  fs.unlinkSync(leaseFile(root));
  fs.copyFileSync(history(root, 'epoch-000001.json'), leaseFile(root));
  assert.throws(() => custody.assertCustody({root, token: a.token}), /stale custody lease: a newer custody epoch exists/);
});

test('stale lease: a lease file left after its epoch closed is refused until break cleans it up', t => {
  const root = scratch(t), a = acquire(root);
  const bytes = fs.readFileSync(leaseFile(root));
  custody.releaseCustody({root, token: a.token});
  fs.writeFileSync(leaseFile(root), bytes); // as if release stopped before its unlink
  assert.throws(() => custody.assertCustody({root, token: a.token}), /stale custody lease: epoch 1 is closed/);
  assert.throws(() => acquire(root, 'claude:next'), /custody is already held/);
  const status = custody.custodyStatus({root});
  assert.match(status.problem, /epoch 1 is closed/);
  const cleaned = custody.breakCustody({root, epoch: 1, leaseSha256: status.leaseFile.sha256, reason: 'remove leftover lease file'});
  assert.equal(cleaned.cleanupOnly, true);
  assert.equal(acquire(root, 'claude:next').epoch, 2);
});

test('an epoch opened without its lease file blocks acquire until the Owner breaks it', t => {
  const root = scratch(t);
  acquire(root);
  fs.unlinkSync(leaseFile(root)); // as if acquire stopped after its history record
  assert.throws(() => acquire(root, 'claude:next'), /custody epoch 1 was opened but never closed; the Owner must break it first/);
  const status = custody.custodyStatus({root});
  assert.equal(status.held, false);
  assert.equal(status.openWithoutLease.path, custody.HISTORY_DIR + '/epoch-000001.json');
  const broken = custody.breakCustody({root, epoch: 1, leaseSha256: status.openWithoutLease.sha256, reason: 'interrupted acquire'});
  assert.equal(broken.leaseWasPresent, false);
  assert.equal(acquire(root, 'claude:next').epoch, 2);
});

test('drifted inputs: a changed bound input refuses custody, and its original bytes restore it', t => {
  const root = scratch(t), a = acquire(root), file = root + '/' + INPUTS[0], original = fs.readFileSync(file);
  fs.writeFileSync(file, '{"draft":2}\n');
  assert.throws(() => custody.assertCustody({root, token: a.token}), /custody input drifted: work\/hfr-typescript\/review\/DRAFT\.json/);
  fs.writeFileSync(file, original);
  assert.equal(custody.assertCustody({root, token: a.token}).epoch, 1);
  fs.rmSync(file);
  assert.throws(() => custody.assertCustody({root, token: a.token}), /ENOENT/);
});

test('drifted inputs: a changed custody module refuses custody', t => {
  const root = scratch(t), a = acquire(root);
  fs.appendFileSync(root + '/' + custody.MODULE_PATH, '\n// edited\n');
  assert.throws(() => custody.assertCustody({root, token: a.token}), /custody input drifted: lib\/g678-custody-lease-v1\.mjs/);
});

test('drifted inputs: an edited lease, epoch record or predecessor record is refused', t => {
  const root = scratch(t), a = acquire(root);
  custody.releaseCustody({root, token: a.token});
  const b = acquire(root, 'claude:second'), lease = JSON.parse(fs.readFileSync(leaseFile(root)));
  fs.writeFileSync(leaseFile(root), JSON.stringify({...lease, holder: 'someone-else'}, null, 2) + '\n');
  assert.throws(() => custody.assertCustody({root, token: b.token}), /custody lease does not equal its epoch record/);
  fs.copyFileSync(history(root, 'epoch-000002.json'), leaseFile(root) + '.tmp');
  fs.renameSync(leaseFile(root) + '.tmp', leaseFile(root));
  assert.equal(custody.assertCustody({root, token: b.token}).epoch, 2);
  const closed = history(root, 'epoch-000001-closed.json'), closedBytes = fs.readFileSync(closed);
  fs.writeFileSync(closed, closedBytes.toString().replace('"released"', '"broken"'));
  assert.throws(() => custody.assertCustody({root, token: b.token}), /custody predecessor drifted/);
  fs.writeFileSync(closed, closedBytes);
  const first = history(root, 'epoch-000001.json');
  fs.writeFileSync(first, fs.readFileSync(first, 'utf8').replace('"codex:fixture"', '"codex:rewritten"'));
  assert.throws(() => custody.assertCustody({root, token: b.token}), /custody predecessor lease record drifted/);
});

test('history chain: acquire and status verify every earlier epoch', t => {
  const root = scratch(t);
  for (const holder of ['codex:one', 'claude:two']) custody.releaseCustody({root, token: acquire(root, holder).token});
  assert.equal(custody.custodyStatus({root}).historyVerified, true);
  const first = history(root, 'epoch-000001.json'), bytes = fs.readFileSync(first);
  fs.writeFileSync(first, bytes.toString().replace('"codex:one"', '"codex:rewritten"'));
  assert.throws(() => acquire(root, 'claude:three'), /custody history drifted: work\/hfr-typescript\/custody\/history\/epoch-000001\.json/);
  assert.match(custody.custodyStatus({root}).problem, /custody history drifted/);
  fs.writeFileSync(first, bytes);
  assert.equal(acquire(root, 'claude:three').epoch, 3);
});

test('page scope: a lease for one page does not authorize another', t => {
  const root = scratch(t), a = acquire(root);
  assert.throws(() => custody.assertCustody({root, page: OTHER, token: a.token}), /custody lease does not cover page shared-nms002-l11-p025/);
  assert.throws(() => custody.assertCustody({root, page: 'Not A Page', token: a.token}), /page id/);
  custody.releaseCustody({root, token: a.token});
  const both = custody.acquireCustody({root, holder: 'codex:two-pages', pages: [OTHER, PAGE]});
  assert.deepEqual(custody.assertCustody({root, page: OTHER, token: both.token}).pages, [PAGE, OTHER]);
});

test('no identity: thread variables and holder labels never change a decision', t => {
  const root = scratch(t), saved = process.env.CODEX_THREAD_ID;
  t.after(() => {if (saved === undefined) delete process.env.CODEX_THREAD_ID; else process.env.CODEX_THREAD_ID = saved;});
  for (const holder of ['codex:01a14500-4774-7b73-8614-c9b0bd3ef6e4', 'claude:e1a0c09e-127c-4337-96a4-24eeec107cff', 'Owner shell']) {
    const a = acquire(root, holder), decisions = [];
    for (const thread of [undefined, holder, '01a1428a-ea26-70a3-b456-ba4f821e6287', 'someone-else']) {
      if (thread === undefined) delete process.env.CODEX_THREAD_ID; else process.env.CODEX_THREAD_ID = thread;
      const {provenance} = custody.assertCustody({root, page: PAGE, token: a.token});
      assert.throws(() => custody.assertCustody({root, page: PAGE, token: OTHER_TOKEN}), /token mismatch/);
      decisions.push(provenance);
    }
    assert(decisions.every(d => JSON.stringify(d) === JSON.stringify(decisions[0])), 'same decision for every thread value');
    assert.equal(decisions[0].holder, holder);
    custody.releaseCustody({root, token: a.token});
  }
});

test('no clock: custody never reads Date', t => {
  const root = scratch(t), RealDate = globalThis.Date;
  class NoClock {constructor() {throw Error('clock read');} static now() {throw Error('clock read');}}
  globalThis.Date = NoClock;
  try {
    const a = acquire(root);
    custody.assertCustody({root, page: PAGE, token: a.token});
    custody.custodyStatus({root});
    custody.releaseCustody({root, token: a.token});
    const b = acquire(root), s = custody.custodyStatus({root});
    custody.breakCustody({root, epoch: b.epoch, leaseSha256: s.record.sha256, reason: 'no clock needed'});
  } finally {globalThis.Date = RealDate;}
  const source = fs.readFileSync(MODULE, 'utf8');
  for (const pattern of [/\bDate\b/, /performance\.now/, /hrtime/, /CODEX_THREAD_ID/, /writerThreadId/, /CURRENT\.json/, /sessionStartedAt|handoffDeadline|stopNewLongWork/])
    assert(!pattern.test(source), 'custody module never refers to ' + pattern);
});

test('release and break are guarded', t => {
  const root = scratch(t), a = acquire(root);
  assert.throws(() => custody.releaseCustody({root, token: OTHER_TOKEN}), /token mismatch/);
  const record = custody.custodyStatus({root}).record;
  custody.releaseCustody({root, token: a.token});
  assert.throws(() => custody.releaseCustody({root, token: a.token}), /no custody lease is held/);
  acquire(root, 'claude:second');
  assert.throws(() => custody.breakCustody({root, epoch: 1, leaseSha256: record.sha256, reason: 'old epoch'}), /only the newest custody epoch can be broken/);
});

test('release records drifted inputs instead of blocking, and the chain continues', t => {
  const root = scratch(t), a = acquire(root);
  fs.writeFileSync(root + '/' + INPUTS[1], '{"status":"FAIL"}\n');
  assert.throws(() => custody.assertCustody({root, token: a.token}), /drifted/);
  const released = custody.releaseCustody({root, token: a.token, note: 'inputs changed'});
  const closed = JSON.parse(fs.readFileSync(root + '/' + released.closed.path));
  assert.equal(closed.inputsIntact, false);
  assert.equal(closed.reason, 'inputs changed');
  assert.equal(acquire(root, 'claude:next').epoch, 2);
});

test('symlinks are refused in custody paths', t => {
  const root = scratch(t), elsewhere = tempDir(t, 'g678-custody-elsewhere-');
  fs.symlinkSync(elsewhere, root + '/' + custody.CUSTODY_DIR);
  assert.throws(() => acquire(root), /no symlink in a custody path/);
  assert.deepEqual(fs.readdirSync(elsewhere), [], 'nothing written through the symlinked custody directory');
  fs.unlinkSync(root + '/' + custody.CUSTODY_DIR);
  const a = acquire(root), bytes = fs.readFileSync(leaseFile(root));
  fs.writeFileSync(elsewhere + '/LEASE.json', bytes);
  fs.unlinkSync(leaseFile(root));
  fs.symlinkSync(elsewhere + '/LEASE.json', leaseFile(root));
  assert.throws(() => custody.assertCustody({root, token: a.token}), /no symlink in a custody path/);
});

test('custody roots: a root reached through a symlink is refused and its canonical path accepted, on any temp layout', t => {
  const root = scratch(t), links = tempDir(t, 'g678-custody-links-'), linked = path.join(links, 'root');
  // An explicit symlink to the root (and a path below it): refused the same way on every machine.
  fs.symlinkSync(root, linked);
  assert.notEqual(fs.realpathSync(linked), linked);
  for (const via of [linked, path.join(linked, 'lib')]) {
    assert.throws(() => custody.acquireCustody({root: via, holder: 'x', pages: [PAGE]}), /custody root must not resolve through a symlink/);
    assert.throws(() => custody.custodyStatus({root: via}), /custody root must not resolve through a symlink/);
  }
  assert(!fs.existsSync(root + '/' + custody.CUSTODY_DIR), 'nothing written through the symlinked root');
  // Non-canonical spellings are refused before any filesystem access.
  for (const spelling of [root + '/', root + '/.', root + '/lib/..', 'relative/root'])
    assert.throws(() => custody.custodyStatus({root: spelling}), /absolute canonical custody root/);
  // The canonical, symlink-free path is accepted.
  const a = custody.acquireCustody({root, holder: 'x', pages: [PAGE]});
  assert.equal(custody.assertCustody({root, page: PAGE, token: a.token}).epoch, 1);
  // This machine's own spelling of the temp folder: accepted exactly when os.tmpdir() is already canonical.
  const spelled = path.join(os.tmpdir(), path.basename(root)), canonical = fs.realpathSync(os.tmpdir()) === os.tmpdir();
  if (canonical) assert.equal(custody.custodyStatus({root: spelled}).epoch, 1);
  else assert.throws(() => custody.custodyStatus({root: spelled}), /custody root must not resolve through a symlink/);
});

test('token files: a private file outside the root works; others are refused', t => {
  const root = scratch(t), a = acquire(root), dir = tempDir(t, 'g678-custody-token-');
  const file = dir + '/token';
  fs.writeFileSync(file, a.token + '\n', {mode: 0o600});
  const env = {[custody.TOKEN_FILE_ENV]: file};
  assert.equal(custody.assertCustody({root, token: custody.custodyToken({root, env})}).epoch, 1);
  fs.chmodSync(file, 0o644);
  assert.throws(() => custody.custodyToken({root, env}), /private \(0600\)/);
  fs.chmodSync(file, 0o600);
  const inside = root + '/work/token';
  fs.writeFileSync(inside, a.token, {mode: 0o600});
  assert.throws(() => custody.custodyToken({root, env: {[custody.TOKEN_FILE_ENV]: inside}}), /outside the execution root/);
  assert.throws(() => custody.custodyToken({root, env: {...env, [custody.TOKEN_ENV]: a.token}}), /set only one/);
  assert.equal(custody.custodyToken({root, env: {}}), null);
});

test('history integrity: unexpected entries and gaps are refused', t => {
  const root = scratch(t), a = acquire(root);
  fs.writeFileSync(history(root, 'notes.txt'), 'x');
  assert.throws(() => custody.assertCustody({root, token: a.token}), /unexpected custody history entry: notes\.txt/);
  fs.rmSync(history(root, 'notes.txt'));
  fs.writeFileSync(history(root, 'epoch-000003.json'), '{}');
  assert.throws(() => custody.assertCustody({root, token: a.token}), /contiguous/);
  fs.rmSync(history(root, 'epoch-000003.json'));
  fs.writeFileSync(history(root, 'epoch-000002-closed.json'), '{}');
  assert.throws(() => custody.assertCustody({root, token: a.token}), /closing record without its lease/);
});

test('executor rotation: a record pinned under one epoch stays verifiable after another holder takes over', t => {
  const root = scratch(t), a = acquire(root, 'codex:01a14500-4774-7b73-8614-c9b0bd3ef6e4');
  const baseline = {kind: 'fixture-baseline', custody: custody.assertCustody({root, page: PAGE, token: a.token}).provenance};
  custody.releaseCustody({root, token: a.token, note: 'rotation'});
  const b = acquire(root, 'claude:4e326b37');
  const now = custody.assertCustody({root, page: PAGE, token: b.token});
  assert.notEqual(now.holder, baseline.custody.holder);
  assert.deepEqual(custody.pinOf(root, baseline.custody.record.path), baseline.custody.record, 'the earlier epoch record never changes');
  assert.equal(now.predecessor.path, custody.HISTORY_DIR + '/epoch-000001-closed.json');
});

test('CLI: acquire, verify, status and release, with exit codes and no token in output', t => {
  const root = scratch(t), dir = tempDir(t, 'g678-custody-cli-');
  const file = dir + '/token', cli = (args, env = {}) => {
    const r = spawnSync(process.execPath, [MODULE, ...args, '--root', root], {encoding: 'utf8', env: {PATH: process.env.PATH, ...env}});
    return {code: r.status, out: JSON.parse(r.stdout.trim()), raw: r.stdout};
  };
  assert.equal(cli(['acquire', '--holder', 'cli', '--page', PAGE]).out.refusal, 'acquire needs --token-file <private path> (or --print-token)');
  const acquired = cli(['acquire', '--holder', 'cli', '--page', PAGE, '--input', INPUTS[0], '--token-file', file]);
  assert.equal(acquired.code, 0);
  const token = fs.readFileSync(file, 'utf8').trim();
  assert.equal(fs.statSync(file).mode & 0o777, 0o600);
  assert(!acquired.raw.includes(token), 'acquire never prints the token when it writes the token file');
  const env = {[custody.TOKEN_FILE_ENV]: file};
  const verified = cli(['verify', '--page', PAGE], env);
  assert.equal(verified.code, 0);
  assert.equal(verified.out.holder, 'cli');
  assert.deepEqual(cli(['verify', '--page', PAGE]), {code: 1, out: {ok: false, command: 'verify', refusal: `custody token required (${custody.TOKEN_ENV} or ${custody.TOKEN_FILE_ENV})`}, raw: cli(['verify', '--page', PAGE]).raw});
  assert.equal(cli(['verify', '--page', OTHER], env).code, 1);
  const status = cli(['status']);
  assert.equal(status.code, 0);
  assert.equal(status.out.held, true);
  assert(!status.raw.includes(token) && !status.raw.includes('tokenSha256'));
  assert.equal(cli(['release', '--note', 'done'], env).code, 0);
  assert.match(cli(['verify'], env).out.refusal, /no custody lease is held/);
  assert.equal(cli(['bogus']).code, 1);
});
