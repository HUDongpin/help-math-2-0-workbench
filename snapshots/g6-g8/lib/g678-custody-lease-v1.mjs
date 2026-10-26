/** Executor-neutral single-writer custody for the G678 Life execution root.
 *
 * One lease file is the lock: work/hfr-typescript/custody/LEASE.json. The
 * caller proves that it holds the lease with a random token. The lease
 * records only the token's SHA-256. The caller supplies the token through
 * HELP_MATH_G678_CUSTODY_TOKEN, or through a private file outside the root
 * that HELP_MATH_G678_CUSTODY_TOKEN_FILE names. Each lease epoch also writes an
 * immutable history record. An epoch is closed, by release or by an Owner
 * break, before the next epoch can open, so the history is a hash-linked chain.
 *
 * A custody check passes only while all of these hold:
 *   - the lease equals its epoch's history record;
 *   - that epoch is open and is the newest one;
 *   - the predecessor's closing record still has its bound bytes;
 *   - the caller's token matches;
 *   - the requested page is in the lease's scope;
 *   - every input the lease binds (always this module itself) still has its
 *     bound bytes.
 *
 * Nothing here reads a chat or thread identity, a Goal API state, a session
 * window or the clock. The holder label is provenance only. A lease never
 * expires by time. Its holder releases it, or the Owner breaks it. */
import assert from 'node:assert/strict';
import {createHash, randomBytes, timingSafeEqual} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const CUSTODY_KIND = 'g678-custody-lease-v1';
export const CLOSED_KIND = 'g678-custody-lease-closed-v1';
export const PROVENANCE_KIND = 'g678-custody-provenance-v1';
export const CUSTODY_DIR = 'work/hfr-typescript/custody';
export const LEASE_PATH = CUSTODY_DIR + '/LEASE.json';
export const HISTORY_DIR = CUSTODY_DIR + '/history';
export const MODULE_PATH = 'lib/g678-custody-lease-v1.mjs';
export const TOKEN_ENV = 'HELP_MATH_G678_CUSTODY_TOKEN';
export const TOKEN_FILE_ENV = 'HELP_MATH_G678_CUSTODY_TOKEN_FILE';
// Installed at <root>/lib/, so the default root is this module's parent directory.
export const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAX_BYTES = 64 * 1024 * 1024;
const LEASE_KEYS = ['kind', 'executionRoot', 'epoch', 'holder', 'pages', 'tokenSha256', 'inputs', 'predecessor', 'note'];
const CLOSED_KEYS = ['kind', 'epoch', 'lease', 'how', 'reason', 'inputsIntact'];
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const within = (file, root) => file === root || file.startsWith(root + path.sep);
const label = (value, max = 200) => typeof value === 'string' && value.trim() === value && value.length > 0 && value.length <= max && !/[\u0000-\u001f]/.test(value);
const pageId = value => typeof value === 'string' && /^[a-z0-9][a-z0-9-]{0,127}$/.test(value);
const isPin = p => p && typeof p === 'object' && Object.keys(p).sort().join() === 'bytes,path,sha256' &&
  Number.isSafeInteger(p.bytes) && p.bytes >= 0 && /^[0-9a-f]{64}$/.test(p.sha256) && typeof p.path === 'string';
const epochPath = epoch => `${HISTORY_DIR}/epoch-${String(epoch).padStart(6, '0')}.json`;
const closedPath = epoch => `${HISTORY_DIR}/epoch-${String(epoch).padStart(6, '0')}-closed.json`;

function relative(p) {
  assert(typeof p === 'string' && p && !path.isAbsolute(p) && !p.includes('\\') &&
    p.split('/').every(x => x && x !== '.' && x !== '..'), 'bounded relative custody path: ' + p);
  return p;
}
function checkedRoot(root) {
  assert(typeof root === 'string' && path.isAbsolute(root) && path.normalize(root) === root && !root.endsWith(path.sep),
    'absolute canonical custody root');
  assert.equal(fs.realpathSync(root), root, 'custody root must not resolve through a symlink');
  return root;
}
// Every existing component below the root, and the leaf, must be a real entry.
function noLinks(root, rel) {
  const file = path.join(root, relative(rel));
  for (let p = file; p !== root; p = path.dirname(p)) {
    const s = fs.lstatSync(p, {throwIfNoEntry: false});
    if (s) assert(!s.isSymbolicLink(), 'no symlink in a custody path: ' + p);
  }
  return file;
}
const exists = (root, rel) => fs.lstatSync(noLinks(root, rel), {throwIfNoEntry: false}) !== undefined;
function readStable(root, rel) {
  const file = noLinks(root, rel), before = fs.lstatSync(file, {bigint: true});
  assert(before.isFile() && before.nlink === 1n && before.size <= BigInt(MAX_BYTES), 'ordinary bounded custody file: ' + rel);
  const bytes = fs.readFileSync(file), after = fs.lstatSync(file, {bigint: true});
  for (const k of ['dev', 'ino', 'size', 'mtimeNs', 'ctimeNs', 'nlink']) assert.equal(before[k], after[k], 'stable custody read: ' + rel);
  return bytes;
}
export function pinOf(root, rel) {
  const bytes = readStable(checkedRoot(root), rel);
  return {path: rel, bytes: bytes.length, sha256: sha256(bytes)};
}
function readPinned(root, p, what = 'custody input') {
  assert(isPin(p), 'valid custody pin');
  const bytes = readStable(root, p.path);
  assert(bytes.length === p.bytes && sha256(bytes) === p.sha256, `${what} drifted: ${p.path}`);
  return bytes;
}
function writeNew(root, rel, bytes) {
  const file = noLinks(root, rel);
  fs.writeFileSync(file, bytes, {flag: fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, mode: 0o644});
  return {path: rel, bytes: bytes.length, sha256: sha256(bytes)};
}
function ensureDirectory(root, rel) {
  const dir = noLinks(root, rel);
  fs.mkdirSync(dir, {recursive: true});
  noLinks(root, rel);
  assert(fs.lstatSync(dir).isDirectory(), 'custody directory: ' + rel);
}
function uniquePins(pins) {
  const map = new Map();
  for (const p of pins) {
    if (map.has(p.path)) assert.deepEqual(map.get(p.path), p, 'conflicting custody pins: ' + p.path);
    map.set(p.path, p);
  }
  return [...map.values()].sort((a, b) => a.path.localeCompare(b.path));
}

// History is append-only: epoch-N.json opens epoch N, epoch-N-closed.json closes it.
function historyState(root) {
  const rel = HISTORY_DIR, dir = noLinks(root, rel);
  const names = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
  const opened = new Set(), closed = new Set();
  for (const name of names) {
    let m;
    if ((m = /^epoch-(\d{6})\.json$/.exec(name))) opened.add(Number(m[1]));
    else if ((m = /^epoch-(\d{6})-closed\.json$/.exec(name))) closed.add(Number(m[1]));
    else assert.fail('unexpected custody history entry: ' + name);
  }
  const epochs = [...opened].sort((a, b) => a - b);
  epochs.forEach((epoch, i) => assert.equal(epoch, i + 1, 'custody epochs are contiguous from 1'));
  for (const epoch of closed) assert(opened.has(epoch), 'closing record without its lease: epoch ' + epoch);
  const head = epochs.at(-1) ?? 0;
  for (const epoch of epochs.slice(0, -1)) assert(closed.has(epoch), 'every earlier custody epoch is closed: ' + epoch);
  return {head, headClosed: head === 0 || closed.has(head)};
}
function parseLease(bytes, root) {
  let lease;
  try {lease = JSON.parse(bytes.toString('utf8'));} catch {assert.fail('custody lease is not JSON');}
  assert(lease && typeof lease === 'object' && !Array.isArray(lease), 'custody lease object');
  assert.deepEqual(Object.keys(lease).sort(), [...LEASE_KEYS].sort(), 'custody lease fields');
  assert.equal(lease.kind, CUSTODY_KIND);
  assert.equal(lease.executionRoot, root, 'custody lease belongs to this execution root');
  assert(Number.isSafeInteger(lease.epoch) && lease.epoch > 0, 'positive custody epoch');
  assert(label(lease.holder), 'holder label');
  assert(Array.isArray(lease.pages) && lease.pages.length > 0 && lease.pages.every(pageId) &&
    new Set(lease.pages).size === lease.pages.length && lease.pages.join() === [...lease.pages].sort().join(), 'sorted distinct page scope');
  assert(/^[0-9a-f]{64}$/.test(lease.tokenSha256), 'token digest');
  assert(Array.isArray(lease.inputs) && lease.inputs.every(isPin), 'bound inputs are pins');
  lease.inputs.forEach(p => relative(p.path));
  assert.deepEqual(uniquePins(lease.inputs), lease.inputs, 'bound inputs are sorted and distinct');
  assert(lease.note === null || label(lease.note, 2000), 'note');
  if (lease.epoch === 1) assert.equal(lease.predecessor, null, 'epoch 1 has no predecessor');
  else {
    assert(isPin(lease.predecessor), 'predecessor closing record pin');
    assert.equal(lease.predecessor.path, closedPath(lease.epoch - 1), 'predecessor is the previous epoch closing record');
  }
  return lease;
}
function parseClosed(bytes, epoch) {
  const closed = JSON.parse(bytes.toString('utf8'));
  assert.deepEqual(Object.keys(closed).sort(), [...CLOSED_KEYS].sort(), 'closing record fields');
  assert.equal(closed.kind, CLOSED_KIND);
  assert.equal(closed.epoch, epoch);
  assert(isPin(closed.lease) && closed.lease.path === epochPath(epoch), 'closing record binds its lease record');
  assert(['released', 'broken'].includes(closed.how));
  assert(closed.reason === null || label(closed.reason, 2000));
  assert(typeof closed.inputsIntact === 'boolean' || closed.inputsIntact === null);
  return closed;
}
const provenance = (record, lease) => ({kind: PROVENANCE_KIND, record, epoch: lease.epoch, holder: lease.holder});
// The whole history, once per acquire or status: every epoch record pins its predecessor's closing
// record, and every closing record pins its epoch record. (A custody check verifies the newest link.)
function verifyChain(root, head, {lastOpen = false} = {}) {
  for (let epoch = 1; epoch <= head; epoch++) {
    const lease = parseLease(readStable(root, epochPath(epoch)), root);
    assert.equal(lease.epoch, epoch, 'custody epoch record numbering');
    if (epoch > 1) parseClosed(readPinned(root, lease.predecessor, 'custody history'), epoch - 1);
    if (epoch < head || !lastOpen) readPinned(root, parseClosed(readStable(root, closedPath(epoch)), epoch).lease, 'custody history');
  }
}

// The token comes from the environment only when the caller does not pass one.
export function custodyToken({root = DEFAULT_ROOT, env = process.env} = {}) {
  const direct = env[TOKEN_ENV], file = env[TOKEN_FILE_ENV];
  assert(!(direct && file), `set only one of ${TOKEN_ENV} and ${TOKEN_FILE_ENV}`);
  if (direct) return direct;
  if (!file) return null;
  assert(path.isAbsolute(file) && path.normalize(file) === file, 'absolute custody token file');
  assert(!within(file, root), 'the custody token file must be outside the execution root');
  const s = fs.lstatSync(file);
  assert(s.isFile() && !s.isSymbolicLink() && (s.mode & 0o077) === 0, 'the custody token file must be a private (0600) regular file');
  return fs.readFileSync(file, 'utf8').trim();
}

// State, record and chain checks shared by verify, release and break.
function inspectLease(root) {
  checkedRoot(root);
  assert(exists(root, LEASE_PATH), 'no custody lease is held; acquire custody before executing');
  const bytes = readStable(root, LEASE_PATH), lease = parseLease(bytes, root), {head, headClosed} = historyState(root);
  assert(lease.epoch <= head, 'custody lease has no history record');
  assert.equal(lease.epoch, head, 'stale custody lease: a newer custody epoch exists');
  assert(!headClosed, `stale custody lease: epoch ${head} is closed`);
  const record = pinOf(root, epochPath(lease.epoch));
  assert.equal(record.sha256, sha256(bytes), 'custody lease does not equal its epoch record');
  if (lease.predecessor) {
    // Hash-linked chain: this lease pins the previous closing record, which pins the previous lease record.
    const closed = parseClosed(readPinned(root, lease.predecessor, 'custody predecessor'), lease.epoch - 1);
    readPinned(root, closed.lease, 'custody predecessor lease record');
  }
  return {lease, bytes, record};
}
function assertHolder(lease, token) {
  assert(typeof token === 'string' && /^[0-9a-f]{64}$/.test(token), `custody token required (${TOKEN_ENV} or ${TOKEN_FILE_ENV})`);
  assert(timingSafeEqual(Buffer.from(sha256(token), 'hex'), Buffer.from(lease.tokenSha256, 'hex')),
    'caller does not hold custody: token mismatch (another writer, or a stale lease)');
}
function inputsIntact(root, lease) {
  try {for (const p of lease.inputs) readPinned(root, p); return true;} catch {return false;}
}

/** Open a new custody epoch. Refuses while any lease is held (a second writer),
 * and refuses after a crash that left an epoch open until the Owner breaks it. */
export function acquireCustody({root = DEFAULT_ROOT, holder, pages, inputs = [], note = null, bindModule = true} = {}) {
  checkedRoot(root);
  assert(label(holder), 'holder label (provenance only)');
  assert(Array.isArray(pages) && pages.length > 0 && pages.every(pageId) && new Set(pages).size === pages.length, 'one or more distinct page ids');
  assert(note === null || label(note, 2000), 'note');
  assert(Array.isArray(inputs));
  ensureDirectory(root, CUSTODY_DIR);
  ensureDirectory(root, HISTORY_DIR);
  if (exists(root, LEASE_PATH)) {
    let current = 'unreadable';
    try {const l = JSON.parse(readStable(root, LEASE_PATH)); current = `epoch ${l.epoch}, holder ${JSON.stringify(l.holder)}`;} catch {}
    assert.fail(`custody is already held (${current}); a second writer cannot acquire it`);
  }
  const {head, headClosed} = historyState(root);
  assert(headClosed, `custody epoch ${head} was opened but never closed; the Owner must break it first`);
  verifyChain(root, head);
  const epoch = head + 1, predecessor = head === 0 ? null : pinOf(root, closedPath(head));
  const bound = uniquePins([...(bindModule ? [pinOf(root, MODULE_PATH)] : []), ...inputs.map(p => pinOf(root, relative(p)))]);
  const token = randomBytes(32).toString('hex');
  const lease = {kind: CUSTODY_KIND, executionRoot: root, epoch, holder, pages: [...pages].sort(), tokenSha256: sha256(token), inputs: bound, predecessor, note};
  const bytes = json(lease);
  // Two writers racing for the same epoch collide on this exclusive create.
  const record = writeNew(root, epochPath(epoch), bytes);
  writeNew(root, LEASE_PATH, bytes);
  return {token, epoch, record, lease: {...record, path: LEASE_PATH}, provenance: provenance(record, lease)};
}

/** The single custody check used by executable tools before reads that
 * decide a write and before every write. Returns provenance for records. */
export function assertCustody({root = DEFAULT_ROOT, page, token} = {}) {
  checkedRoot(root);
  const {lease, record} = inspectLease(root);
  assertHolder(lease, token === undefined ? custodyToken({root}) : token);
  if (page !== undefined) {
    assert(pageId(page), 'page id');
    assert(lease.pages.includes(page), `custody lease does not cover page ${page}`);
  }
  for (const p of lease.inputs) readPinned(root, p);
  return {epoch: lease.epoch, holder: lease.holder, pages: lease.pages, lease: {...record, path: LEASE_PATH}, record,
    inputs: lease.inputs, predecessor: lease.predecessor, provenance: provenance(record, lease)};
}

/** The holder closes its own epoch. Drifted inputs do not block a release; the
 * closing record states whether they were intact. */
export function releaseCustody({root = DEFAULT_ROOT, token, note = null} = {}) {
  checkedRoot(root);
  assert(note === null || label(note, 2000), 'note');
  const {lease, record} = inspectLease(root);
  assertHolder(lease, token === undefined ? custodyToken({root}) : token);
  const closed = writeNew(root, closedPath(lease.epoch), json({kind: CLOSED_KIND, epoch: lease.epoch, lease: record, how: 'released', reason: note, inputsIntact: inputsIntact(root, lease)}));
  assert.equal(sha256(readStable(root, LEASE_PATH)), record.sha256, 'custody lease changed during release');
  fs.unlinkSync(noLinks(root, LEASE_PATH));
  return {epoch: lease.epoch, closed};
}

/** Owner action without the token: close the newest epoch, compare-and-break
 * on its record digest. Also repairs an epoch left open without LEASE.json,
 * and removes a LEASE.json left behind after its epoch was already closed. */
export function breakCustody({root = DEFAULT_ROOT, epoch, leaseSha256, reason} = {}) {
  checkedRoot(root);
  assert(Number.isSafeInteger(epoch) && epoch > 0, 'epoch to break');
  assert(typeof leaseSha256 === 'string' && /^[0-9a-f]{64}$/.test(leaseSha256), 'lease digest to break');
  assert(label(reason, 2000), 'Owner reason required');
  const {head, headClosed} = historyState(root);
  assert.equal(epoch, head, 'only the newest custody epoch can be broken');
  const record = pinOf(root, epochPath(epoch));
  assert.equal(record.sha256, leaseSha256, 'custody record changed since it was inspected; inspect status again');
  const held = exists(root, LEASE_PATH);
  if (held) assert.equal(sha256(readStable(root, LEASE_PATH)), leaseSha256, 'LEASE.json is not the epoch being broken; inspect it by hand');
  if (headClosed) {
    // A release that stopped between its closing record and the unlink.
    assert(held, `custody epoch ${epoch} is already closed`);
    parseClosed(readStable(root, closedPath(epoch)), epoch);
    fs.unlinkSync(noLinks(root, LEASE_PATH));
    return {epoch, closed: pinOf(root, closedPath(epoch)), leaseWasPresent: true, cleanupOnly: true};
  }
  const lease = parseLease(readStable(root, epochPath(epoch)), root);
  const closed = writeNew(root, closedPath(epoch), json({kind: CLOSED_KIND, epoch, lease: record, how: 'broken', reason, inputsIntact: inputsIntact(root, lease)}));
  if (held) fs.unlinkSync(noLinks(root, LEASE_PATH));
  return {epoch, closed, leaseWasPresent: held, cleanupOnly: false};
}

/** Read-only summary for the Owner; needs no token and reveals none. A broken
 * state is reported, with the digests a break needs, instead of thrown. */
export function custodyStatus({root = DEFAULT_ROOT} = {}) {
  checkedRoot(root);
  const out = {kind: 'g678-custody-status-v1', executionRoot: root, held: exists(root, LEASE_PATH)};
  try {
    const {head, headClosed} = historyState(root);
    Object.assign(out, {head, headClosed});
    verifyChain(root, head, {lastOpen: !headClosed});
    out.historyVerified = true;
    if (out.held) {
      const {lease, record} = inspectLease(root);
      Object.assign(out, {epoch: lease.epoch, holder: lease.holder, pages: lease.pages, record, inputs: lease.inputs.length,
        inputsIntact: inputsIntact(root, lease), predecessor: lease.predecessor, note: lease.note});
    } else if (head > 0 && !headClosed) out.openWithoutLease = pinOf(root, epochPath(head));
  } catch (error) {
    out.problem = String(error?.message ?? error).split('\n')[0];
    for (const [key, rel] of [['leaseFile', LEASE_PATH], ['newestRecord', out.head ? epochPath(out.head) : null]]) {
      if (rel) try {out[key] = pinOf(root, rel);} catch {}
    }
  }
  return out;
}

// CLI. Exit 0 with JSON on stdout, or exit 1 with {"ok":false,"refusal":...}.
function parseArgs(argv) {
  const options = {page: [], input: []};
  for (let i = 0; i < argv.length; i++) {
    const m = /^--([a-z0-9-]+)$/.exec(argv[i]);
    assert(m, 'unexpected argument: ' + argv[i]);
    const key = m[1];
    if (key === 'print-token') {options.printToken = true; continue;}
    assert(i + 1 < argv.length, 'missing value for --' + key);
    const value = argv[++i];
    if (key === 'page' || key === 'input') options[key].push(value);
    else {assert(!(key in options), 'repeated --' + key); options[key] = value;}
  }
  return options;
}
function writeTokenFile(file, root, token) {
  assert(path.isAbsolute(file) && path.normalize(file) === file && !within(file, root), '--token-file must be an absolute path outside the execution root');
  fs.writeFileSync(file, token + '\n', {flag: fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, mode: 0o600});
}
export function runCli(argv, {env = process.env, stdout = process.stdout} = {}) {
  const [command, ...rest] = argv;
  try {
    const o = parseArgs(rest), root = o.root ?? DEFAULT_ROOT;
    let result;
    if (command === 'acquire') {
      assert(o['token-file'] || o.printToken, 'acquire needs --token-file <private path> (or --print-token)');
      const a = acquireCustody({root, holder: o.holder, pages: o.page, inputs: o.input, note: o.note ?? null});
      if (o['token-file']) writeTokenFile(o['token-file'], root, a.token);
      result = {ok: true, epoch: a.epoch, record: a.record, provenance: a.provenance, tokenFile: o['token-file'] ?? null, ...(o.printToken ? {token: a.token} : {})};
    } else if (command === 'verify') {
      const c = assertCustody({root, page: o.page.length ? (assert.equal(o.page.length, 1), o.page[0]) : undefined, token: custodyToken({root, env})});
      result = {ok: true, epoch: c.epoch, holder: c.holder, pages: c.pages, record: c.record, inputs: c.inputs.length, provenance: c.provenance};
    } else if (command === 'release') {
      result = {ok: true, ...releaseCustody({root, token: custodyToken({root, env}), note: o.note ?? null})};
    } else if (command === 'break') {
      result = {ok: true, ...breakCustody({root, epoch: Number(o.epoch), leaseSha256: o['lease-sha256'], reason: o.reason})};
    } else if (command === 'status') {
      result = {ok: true, ...custodyStatus({root})};
    } else assert.fail('usage: g678-custody-lease-v1.mjs acquire|verify|release|break|status [--root <dir>] ...');
    stdout.write(JSON.stringify(result) + '\n');
    return 0;
  } catch (error) {
    stdout.write(JSON.stringify({ok: false, command: command ?? null, refusal: String(error?.message ?? error).split('\n')[0]}) + '\n');
    return 1;
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = runCli(process.argv.slice(2));
