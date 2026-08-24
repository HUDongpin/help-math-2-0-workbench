#!/usr/bin/env node

import {
  createHmac,
  generateKeyPairSync,
  randomBytes,
  randomUUID,
  sign as signBytes,
} from 'node:crypto';
import {spawn} from 'node:child_process';
import {constants as fsConstants} from 'node:fs';
import {
  access,
  chmod,
  lstat,
  mkdtemp,
  mkdir,
  open,
  readFile,
  readdir,
  realpath,
  rm,
} from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const migrationsDirectory = path.join(repositoryRoot, 'supabase', 'migrations');
const seedPath = path.join(repositoryRoot, 'supabase', 'seed.sql');
const pgTapPath = path.join(
  repositoryRoot,
  'supabase',
  'tests',
  'database',
  'parent_portal_rls_test.sql',
);
const gatewayPath = path.join(
  repositoryRoot,
  'scripts',
  'family-local-supabase-gateway.mjs',
);
const configPath = path.join(repositoryRoot, 'supabase', 'config.toml');
const temporaryPrefix = 'hm-fp-';
const maximumCommandOutputBytes = 4 * 1024 * 1024;
const commandLineArguments = process.argv.slice(2);

class VerificationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'VerificationError';
  }
}

function parseMode(arguments_) {
  if (arguments_.includes('--help')) {
    process.stdout.write([
      'Usage: node scripts/verify-family-local-integration.mjs [option]',
      '',
      'Options:',
      '  --preflight         Validate source contracts and installed dependencies only.',
      '  --source-contract   Validate repository inputs without requiring local binaries.',
      '  --full              Run the isolated local integration verification (default).',
      '  --product-e2e       Run the full local stack plus the protected browser product flow.',
      '  --help              Show this help.',
      '',
    ].join('\n'));
    process.exit(0);
  }
  const selected = arguments_.filter((argument) => [
    '--preflight',
    '--source-contract',
    '--full',
    '--product-e2e',
  ].includes(argument));
  const unknown = arguments_.filter((argument) => !selected.includes(argument));
  if (unknown.length > 0 || selected.length > 1) {
    throw new VerificationError('Use exactly one supported mode option.');
  }
  return selected[0] ?? '--full';
}

function assert(condition, message) {
  if (!condition) throw new VerificationError(message);
}

function pass(message) {
  process.stdout.write(`PASS ${message}\n`);
}

function baseChildEnvironment() {
  const environment = {};
  for (const name of ['LANG', 'LC_ALL', 'PATH', 'TMPDIR', 'TZ']) {
    if (process.env[name]) environment[name] = process.env[name];
  }
  return environment;
}

function sanitizedErrorDetail(value) {
  return String(value)
    .replace(/[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g, '[REDACTED_JWT]')
    .replace(
      /["']?(authorization|api[-_]?key|access[-_]?token|refresh[-_]?token|jwt[-_ ]?secret|smtp[-_ ]?pass(?:word)?|password)["']?\s*[:=]\s*["']?[^"'\s,}]+["']?/gi,
      '$1=[REDACTED]',
    )
    .slice(0, 4_096);
}

async function regularFile(filePath, label) {
  const stats = await lstat(filePath).catch(() => null);
  assert(stats?.isFile() && !stats.isSymbolicLink(), `${label} must be a regular non-symlink file.`);
}

async function discoverMigrations() {
  const entries = await readdir(migrationsDirectory, {withFileTypes: true});
  const sqlEntries = entries.filter((entry) => entry.name.endsWith('.sql'));
  for (const entry of sqlEntries) {
    assert(
      entry.isFile() && !entry.isSymbolicLink(),
      `Migration entry must be a regular non-symlink file: ${entry.name}`,
    );
  }
  const migrationNames = sqlEntries
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right, 'en'));
  assert(migrationNames.length > 0, 'No Supabase SQL migrations were discovered.');
  const prefixes = new Set();
  for (const name of migrationNames) {
    assert(
      /^\d{12,14}_[a-z0-9_]+\.sql$/.test(name),
      `Migration name is not sortable and canonical: ${name}`,
    );
    const prefix = name.split('_', 1)[0];
    assert(!prefixes.has(prefix), `Duplicate migration ordering prefix: ${prefix}`);
    prefixes.add(prefix);
    await regularFile(path.join(migrationsDirectory, name), `Migration ${name}`);
  }
  return migrationNames.map((name) => path.join(migrationsDirectory, name));
}

async function verifySourceContract() {
  const migrations = await discoverMigrations();
  await Promise.all([
    regularFile(seedPath, 'Synthetic seed'),
    regularFile(pgTapPath, 'pgTAP suite'),
    regularFile(gatewayPath, 'Local gateway'),
    regularFile(configPath, 'Supabase CLI config'),
  ]);
  const migrationSql = (await Promise.all(
    migrations.map((migration) => readFile(migration, 'utf8')),
  )).join('\n');
  const requiredSymbols = [
    'family_invitation_issuer',
    'family_webhook_writer',
    'authorize_guardian_invitation_creation_v1',
    'create_guardian_invitation_v1',
    'resend_guardian_invitation_v1',
    'record_family_email_delivery_event_v1',
    'ingest_learning_events_v2',
    'learning_assignment_launch_v1',
    'record_assignment_learning_events_v2',
    'assignment_learning_object_bindings',
    'family_abuse_budget_windows',
    'family_invitation_probe_windows',
    'rebuild_family_projections_v1',
    'school-verified-production',
  ];
  for (const symbol of requiredSymbols) {
    assert(migrationSql.includes(symbol), `Required integration symbol is absent: ${symbol}`);
  }
  const seedSql = await readFile(seedPath, 'utf8');
  const restrictedArchiveMarkers = [
    '/Volumes/WestWorld/HELP MATH Related Files',
    'Extracted_NewHelpProgram',
    'Historical Office Documents',
    'private-archive/',
  ];
  assert(
    seedSql.includes('Fully fictional local seed')
      && seedSql.includes("'synthetic'")
      && !seedSql.includes("'production'")
      && restrictedArchiveMarkers.every((marker) => !seedSql.includes(marker)),
    'Seed must remain explicitly fictional, synthetic, and detached from restricted archives.',
  );
  const pgTapSql = await readFile(pgTapPath, 'utf8');
  assert(
    /select\s+extensions\.plan\s*\(/i.test(pgTapSql)
      && /select\s+\*?\s*from\s+extensions\.finish\s*\(\s*\)/i.test(pgTapSql),
    'pgTAP suite must declare a plan and call finish().',
  );
  const expectedPublicTableCount = new Set(
    [...migrationSql.matchAll(/create\s+table\s+public\.([a-z0-9_]+)/giu)]
      .map((match) => match[1]),
  ).size;
  assert(expectedPublicTableCount > 0, 'No canonical public tables were discovered.');
  pass(
    `source contract migration_count=${migrations.length} latest=${
      path.basename(migrations.at(-1))
    } public_tables=${expectedPublicTableCount}`,
  );
  return {expectedPublicTableCount, migrations};
}

function candidateExecutablePaths(name) {
  const paths = [];
  for (const directory of (process.env.PATH ?? '').split(path.delimiter)) {
    if (directory) paths.push(path.join(directory, name));
  }
  return paths;
}

async function executableAt(candidate) {
  try {
    await access(candidate, fsConstants.X_OK);
    const resolved = await realpath(candidate);
    const stats = await lstat(resolved);
    return stats.isFile() ? resolved : null;
  } catch {
    return null;
  }
}

async function resolveExecutable(name, options = {}) {
  const candidates = [];
  if (options.environmentVariable && process.env[options.environmentVariable]) {
    candidates.push(path.resolve(repositoryRoot, process.env[options.environmentVariable]));
  }
  candidates.push(...candidateExecutablePaths(name));
  for (const fallback of options.fallbacks ?? []) {
    candidates.push(path.resolve(repositoryRoot, fallback));
  }
  for (const candidate of candidates) {
    const resolved = await executableAt(candidate);
    if (resolved) return resolved;
  }
  throw new VerificationError(
    `Missing required executable ${name}${
      options.environmentVariable ? `; configure ${options.environmentVariable}` : ''
    }. This verifier never downloads or installs dependencies.`,
  );
}

function spawnCaptured(command, arguments_, options = {}) {
  const child = spawn(command, arguments_, {
    cwd: options.cwd ?? repositoryRoot,
    env: options.env ?? baseChildEnvironment(),
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  let outputBytes = 0;
  let outputLimitError = null;
  let inputError = null;
  const append = (target, chunk) => {
    outputBytes += chunk.length;
    if (outputBytes > maximumCommandOutputBytes && !outputLimitError) {
      outputLimitError = new VerificationError(
        `Command output exceeded the safe bound: ${path.basename(command)}`,
      );
      child.kill('SIGKILL');
    }
    return outputLimitError ? target : target + chunk.toString('utf8');
  };
  child.stdout.on('data', (chunk) => {
    stdout = append(stdout, chunk);
  });
  child.stderr.on('data', (chunk) => {
    stderr = append(stderr, chunk);
  });
  child.stdin.once('error', (error) => {
    inputError = error;
  });
  if (options.input === undefined) child.stdin.end();
  else child.stdin.end(options.input);
  const done = new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (outputLimitError) reject(outputLimitError);
      else if (code === 0 && !inputError) resolve({stdout, stderr});
      else reject(new VerificationError(
        `${path.basename(command)} failed code=${code ?? 'null'} signal=${signal ?? 'none'}: ${
          sanitizedErrorDetail(stderr || stdout || inputError?.message || 'no diagnostic output')
        }`,
      ));
    });
  });
  return {child, done};
}

async function runCommand(command, arguments_, options = {}) {
  return spawnCaptured(command, arguments_, options).done;
}

async function dependencyPreflight() {
  assert(
    Number.parseInt(process.versions.node.split('.', 1)[0], 10) >= 22,
    'Node.js 22 or newer is required.',
  );
  const binaries = {
    gotrue: await resolveExecutable('gotrue', {
      environmentVariable: 'FAMILY_LOCAL_GOTRUE_BIN',
      fallbacks: ['.cache/gotrue/auth'],
    }),
    initdb: await resolveExecutable('initdb'),
    mailpit: await resolveExecutable('mailpit'),
    pgConfig: await resolveExecutable('pg_config'),
    pgCtl: await resolveExecutable('pg_ctl'),
    pgDump: await resolveExecutable('pg_dump'),
    pgRestore: await resolveExecutable('pg_restore'),
    postgrest: await resolveExecutable('postgrest'),
    psql: await resolveExecutable('psql'),
  };
  const versions = {};
  const versionOptions = {cwd: os.tmpdir()};
  const reportedVersion = async (label, command, arguments_) => {
    const result = await runCommand(command, arguments_, versionOptions);
    const value = (result.stdout || result.stderr).trim();
    assert(
      value.length > 0 && value.length <= 1_024,
      `${label} did not return a bounded version string.`,
    );
    return value;
  };
  versions.initdb = await reportedVersion('initdb', binaries.initdb, ['--version']);
  versions.pgConfig = await reportedVersion(
    'pg_config', binaries.pgConfig, ['--version'],
  );
  versions.pgCtl = await reportedVersion('pg_ctl', binaries.pgCtl, ['--version']);
  versions.pgDump = await reportedVersion('pg_dump', binaries.pgDump, ['--version']);
  versions.pgRestore = await reportedVersion(
    'pg_restore', binaries.pgRestore, ['--version'],
  );
  versions.psql = await reportedVersion('psql', binaries.psql, ['--version']);
  versions.postgrest = await reportedVersion(
    'PostgREST', binaries.postgrest, ['--version'],
  );
  versions.mailpit = await reportedVersion(
    'Mailpit', binaries.mailpit, ['version', '--no-release-check'],
  );
  versions.gotrue = await reportedVersion('GoTrue', binaries.gotrue, ['version']);
  for (const name of [
    'initdb',
    'pgConfig',
    'pgCtl',
    'pgDump',
    'pgRestore',
    'psql',
  ]) {
    assert(
      /\b16(?:\.|\b)/.test(versions[name]),
      `PostgreSQL 16 ${name} is required for this evidence profile.`,
    );
  }
  const sharedDirectory = (
    await runCommand(binaries.pgConfig, ['--sharedir'], versionOptions)
  ).stdout.trim();
  await regularFile(
    path.join(sharedDirectory, 'extension', 'pgtap.control'),
    'Installed pgTAP extension control file',
  );
  pass(`dependency preflight postgres=${versions.initdb}`);
  pass(`dependency preflight postgrest=${versions.postgrest}`);
  pass(`dependency preflight gotrue=${versions.gotrue}`);
  pass(`dependency preflight mailpit=${versions.mailpit.split('\n', 1)[0]}`);
  return binaries;
}

async function reserveLoopbackPorts(count) {
  const servers = [];
  try {
    for (let index = 0; index < count; index += 1) {
      const server = net.createServer();
      await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
      });
      servers.push(server);
    }
    return servers.map((server) => {
      const address = server.address();
      assert(address && typeof address !== 'string', 'Could not reserve a loopback port.');
      return address.port;
    });
  } finally {
    await Promise.all(servers.map((server) => new Promise((resolve) => server.close(resolve))));
  }
}

async function waitForHttp(label, url, expectedStatuses = [200], attempts = 100) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, {redirect: 'error', signal: AbortSignal.timeout(1_000)});
      await response.body?.cancel();
      if (expectedStatuses.includes(response.status)) {
        pass(`${label} health HTTP ${response.status}`);
        return;
      }
    } catch {
      // The bounded readiness loop is the only retry path.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new VerificationError(`${label} did not become ready on its loopback URL.`);
}

async function assertSafeTemporaryRoot(candidate, operatingSystemTemp) {
  const currentRealPath = await realpath(candidate);
  const stats = await lstat(candidate);
  assert(
    currentRealPath === candidate
      && candidate.startsWith(`${operatingSystemTemp}${path.sep}`)
      && path.basename(candidate).startsWith(temporaryPrefix)
      && stats.isDirectory()
      && !stats.isSymbolicLink()
      && (stats.mode & 0o077) === 0,
    'Temporary integration root failed its deletion-safety check.',
  );
}

function encodeJwtPart(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function signJwt(signingJwk, claims) {
  const now = Math.floor(Date.now() / 1_000);
  const header = encodeJwtPart({alg: 'HS256', kid: signingJwk.kid, typ: 'JWT'});
  const payload = encodeJwtPart({
    aud: 'authenticated',
    exp: now + 300,
    iat: now,
    nbf: now - 1,
    ...claims,
  });
  const key = Buffer.from(signingJwk.k, 'base64url');
  const signature = createHmac('sha256', key)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}

function signEs256Jwt(privateKey, publicJwk, claims) {
  const now = Math.floor(Date.now() / 1_000);
  const header = encodeJwtPart({alg: 'ES256', kid: publicJwk.kid, typ: 'JWT'});
  const payload = encodeJwtPart({
    aud: 'authenticated',
    exp: now + 300,
    iat: now,
    nbf: now - 1,
    ...claims,
  });
  const signingInput = `${header}.${payload}`;
  const signature = signBytes(
    'sha256',
    Buffer.from(signingInput, 'utf8'),
    {dsaEncoding: 'ieee-p1363', key: privateKey},
  ).toString('base64url');
  return `${signingInput}.${signature}`;
}

async function assertLoopbackPortAvailable(port) {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  }).catch(() => {
    throw new VerificationError(
      `Loopback port ${port} is required by the fixed local-only Mailpit transport.`,
    );
  });
  await new Promise((resolve) => server.close(resolve));
}

async function runLocalIntegration(
  migrations,
  expectedPublicTableCount,
  binaries,
  options = {},
) {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), temporaryPrefix));
  await chmod(temporaryRoot, 0o700);
  const temporaryRealPath = await realpath(temporaryRoot);
  const operatingSystemTemp = await realpath(os.tmpdir());
  await assertSafeTemporaryRoot(temporaryRealPath, operatingSystemTemp);

  const daemons = [];
  let postgresStarted = false;
  let cleanupPromise = null;
  let signingJwk = null;
  let jwtSecret = null;
  let smtpPassword = null;
  let signupPassword = null;

  async function spawnDaemon(
    label,
    command,
    arguments_,
    environment,
    logName,
    daemonOptions = {},
  ) {
    const logHandle = await open(path.join(temporaryRoot, logName), 'a', 0o600);
    const child = spawn(command, arguments_, {
      cwd: daemonOptions.cwd ?? temporaryRoot,
      env: environment,
      stdio: ['ignore', logHandle.fd, logHandle.fd],
    });
    await logHandle.close();
    const state = {child, exited: false, label};
    child.once('exit', () => {
      state.exited = true;
    });
    child.once('error', () => {
      state.exited = true;
    });
    daemons.push(state);
    return state;
  }

  async function stopChild(state) {
    if (state.exited || state.child.exitCode !== null || state.child.signalCode !== null) return;
    state.child.kill('SIGTERM');
    const exited = await Promise.race([
      new Promise((resolve) => state.child.once('exit', () => resolve(true))),
      new Promise((resolve) => setTimeout(() => resolve(false), 3_000)),
    ]);
    if (
      !exited
      && !state.exited
      && state.child.exitCode === null
      && state.child.signalCode === null
      && state.child.kill('SIGKILL')
    ) {
      await Promise.race([
        new Promise((resolve) => state.child.once('exit', resolve)),
        new Promise((resolve) => setTimeout(resolve, 3_000)),
      ]);
    }
    if (
      !state.exited
      && state.child.exitCode === null
      && state.child.signalCode === null
    ) {
      throw new VerificationError(`${state.label} did not stop after SIGKILL.`);
    }
  }

  async function performCleanup() {
    const daemonStops = await Promise.allSettled([...daemons].reverse().map(stopChild));
    const daemonStopFailed = daemonStops.some((result) => result.status === 'rejected');
    let postgresStopError = null;
    if (postgresStarted) {
      await runCommand(binaries.pgCtl, [
        '-D',
        path.join(temporaryRoot, 'pg-data'),
        '-m',
        'fast',
        '-w',
        'stop',
      ]).then(
        () => {
          postgresStarted = false;
        },
        (error) => {
          postgresStopError = error;
        },
      );
    }
    signingJwk = null;
    jwtSecret = null;
    smtpPassword = null;
    signupPassword = null;
    if (postgresStopError || daemonStopFailed) {
      throw new VerificationError(
        `Local process cleanup failed; the mode-restricted isolated directory was retained: ${temporaryRealPath}`,
      );
    }
    await assertSafeTemporaryRoot(temporaryRealPath, operatingSystemTemp);
    await rm(temporaryRealPath, {force: true, recursive: true});
  }

  function cleanup() {
    cleanupPromise ??= performCleanup();
    return cleanupPromise;
  }

  const terminate = async (signal) => {
    try {
      await cleanup();
      process.stderr.write(`Stopped after ${signal}; owned local state was removed.\n`);
      process.exit(130);
    } catch (error) {
      process.stderr.write(
        `FAIL ${sanitizedErrorDetail(error instanceof Error ? error.message : error)}\n`,
      );
      process.exit(1);
    }
  };
  const signalHandlers = new Map();
  for (const signal of ['SIGINT', 'SIGTERM']) {
    const handler = () => void terminate(signal);
    signalHandlers.set(signal, handler);
    process.once(signal, handler);
  }

  try {
    const productE2E = options.productE2E === true;
    const reservedPorts = await reserveLoopbackPorts(productE2E ? 8 : 7);
    const [
      postgresPort,
      postgrestPort,
      postgrestAdminPort,
      gotruePort,
      reservedMailpitSmtpPort,
      mailpitHttpPort,
      gatewayPort,
      nextPort,
    ] = reservedPorts;
    const mailpitSmtpPort = productE2E ? 1_025 : reservedMailpitSmtpPort;
    if (productE2E) await assertLoopbackPortAvailable(mailpitSmtpPort);
    const postgresData = path.join(temporaryRoot, 'pg-data');
    const postgresSocket = path.join(temporaryRoot, 'pg-socket');
    assert(
      Buffer.byteLength(postgresSocket, 'utf8') <= 100,
      'Temporary PostgreSQL socket path exceeds the conservative macOS length bound.',
    );
    await mkdir(postgresSocket, {mode: 0o700});
    await runCommand(binaries.initdb, [
      '-D', postgresData,
      '-U', 'postgres',
      '-A', 'trust',
      '--no-locale',
      '--encoding=UTF8',
      '--no-sync',
    ]);
    await runCommand(binaries.pgCtl, [
      '-D', postgresData,
      '-l', path.join(temporaryRoot, 'postgres.log'),
      '-w',
      '-o', `-p ${postgresPort} -h 127.0.0.1 -k ${postgresSocket} -c max_connections=40 -c log_min_messages=warning`,
      'start',
    ]);
    postgresStarted = true;

    const postgresUrl = `postgresql://postgres@127.0.0.1:${postgresPort}/postgres?sslmode=disable`;
    const authenticatorUrl = `postgresql://authenticator@127.0.0.1:${postgresPort}/postgres?sslmode=disable`;
    const psql = async (arguments_, options = {}) => runCommand(
      binaries.psql,
      [postgresUrl, '-X', '-v', 'ON_ERROR_STOP=1', ...arguments_],
      options,
    );
    const spawnPsqlSession = (label, input) => {
      const session = spawnCaptured(binaries.psql, [
        postgresUrl, '-X', '-v', 'ON_ERROR_STOP=1', '-q',
      ], {
        env: {...baseChildEnvironment(), PGAPPNAME: label},
        input,
      });
      const state = {child: session.child, exited: false, label};
      session.child.once('exit', () => {
        state.exited = true;
      });
      session.child.once('error', () => {
        state.exited = true;
      });
      daemons.push(state);
      return session;
    };

    await psql(['-q'], {input: [
      'create role anon nologin noinherit;',
      'create role authenticated nologin noinherit;',
      'create role service_role nologin noinherit bypassrls;',
      'create role authenticator login noinherit;',
      'grant anon, authenticated, service_role to authenticator;',
      'create schema auth authorization postgres;',
      '',
    ].join('\n')});
    for (const migration of migrations) {
      await psql(['-q', '-f', migration]);
    }
    await psql(['-q', '-f', seedPath]);
    pass(`clean database applied migrations=${migrations.length} and fictional seed`);

    const rlsCatalog = await psql([
      '-A', '-t', '-F', '|', '-c',
      "select count(*), count(*) filter (where c.relrowsecurity) from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind in ('r','p')",
    ]);
    assert(
      rlsCatalog.stdout.trim() ===
        `${expectedPublicTableCount}|${expectedPublicTableCount}`,
      `Public-table RLS catalog mismatch: ${rlsCatalog.stdout.trim()}`,
    );
    pass(`public table RLS enabled count=${expectedPublicTableCount}`);

    const pgTap = await psql(['-A', '-t', '-q', '-f', pgTapPath]);
    const planMatch = pgTap.stdout.match(/^1\.\.(\d+)\s*$/m);
    const failures = pgTap.stdout.match(/^not ok\b.*$/gm) ?? [];
    const successes = pgTap.stdout.match(/^ok\s+\d+\b.*$/gm) ?? [];
    const directives = pgTap.stdout.match(/#\s*(?:SKIP|TODO)\b/gi) ?? [];
    if (failures.length > 0) {
      const tapLines = pgTap.stdout.split(/\r?\n/);
      for (const [index, line] of tapLines.entries()) {
        if (!line.startsWith('not ok')) continue;
        const diagnostic = [line];
        for (const candidate of tapLines.slice(index + 1, index + 9)) {
          if (/^(?:ok|not ok)\b/.test(candidate)) break;
          diagnostic.push(candidate);
        }
        process.stderr.write(`PGTAP ${sanitizedErrorDetail(diagnostic.join(' '))}\n`);
      }
    }
    assert(planMatch, 'pgTAP output did not contain a plan.');
    const planned = Number.parseInt(planMatch[1], 10);
    assert(
      failures.length === 0 && successes.length === planned && directives.length === 0,
      `pgTAP failed planned=${planned} ok=${successes.length} not_ok=${failures.length} directives=${directives.length}; ${failures.join(' | ')}`,
    );
    pass(`pgTAP planned=${planned} ok=${successes.length} not_ok=0 skip_todo=0`);

    // This fixture is deliberately created only inside the disposable local
    // database. It contains no real person or school data and never enters the
    // fictional seed. It proves the production-shaped custom-role gateway
    // path without delivering to an external email provider.
    await psql(['-q'], {input: `
      insert into public.tenants (
        id, slug, display_name, environment_id, data_mode,
        family_portal_enabled, status
      ) values (
        '30000000-0000-4000-8000-000000000001',
        'gateway-production-shape', 'Gateway Production Shape',
        'gateway.production', 'production', true, 'active'
      );
      insert into public.retention_policies (
        tenant_id, environment_id, data_mode, data_class, retention_days,
        legal_hold, enabled, approved_at, approved_by_user_id,
        updated_by_user_id
      )
      select
        '30000000-0000-4000-8000-000000000001',
        'gateway.production', 'production', data_class, 30, false, true,
        statement_timestamp(),
        '10000000-0000-4000-8000-000000000013',
        '10000000-0000-4000-8000-000000000013'
      from unnest(enum_range(null::public.retention_data_class)) as data_class;
      insert into public.family_invitation_issuer_configs (
        tenant_id, environment_id, data_mode, issuer, audience, active,
        not_before, expires_at
      ) values (
        '30000000-0000-4000-8000-000000000001',
        'gateway.production', 'production',
        'urn:help-math:synthetic:invitation-issuer', 'authenticated', true,
        statement_timestamp() - interval '1 day',
        statement_timestamp() + interval '1 day'
      );
      insert into public.schools (
        tenant_id, environment_id, data_mode, id, school_key,
        display_name, active
      ) values (
        '30000000-0000-4000-8000-000000000001',
        'gateway.production', 'production',
        '30000000-0000-4000-8000-000000000101',
        'gateway-production-school', 'Gateway Production School', true
      );
      insert into public.students (
        tenant_id, environment_id, data_mode, id, school_id,
        local_reference, display_name, grade_label, locale, active
      ) values (
        '30000000-0000-4000-8000-000000000001',
        'gateway.production', 'production',
        '30000000-0000-4000-8000-000000000020',
        '30000000-0000-4000-8000-000000000101',
        'GATEWAY-PROD-STUDENT', 'Gateway Production Student',
        'Grade 4', 'en', true
      );
      insert into public.classes (
        tenant_id, environment_id, data_mode, id, school_id,
        display_name, grade_label, academic_term, active
      ) values (
        '30000000-0000-4000-8000-000000000001',
        'gateway.production', 'production',
        '30000000-0000-4000-8000-000000000301',
        '30000000-0000-4000-8000-000000000101',
        'Gateway Production Grade 4', 'Grade 4', 'Gateway Term', true
      );
      insert into public.enrollments (
        tenant_id, environment_id, data_mode, id, student_id,
        class_id, status, starts_at
      ) values (
        '30000000-0000-4000-8000-000000000001',
        'gateway.production', 'production',
        '30000000-0000-4000-8000-000000000401',
        '30000000-0000-4000-8000-000000000020',
        '30000000-0000-4000-8000-000000000301', 'active', current_date
      );
      insert into public.role_bindings (
        id, tenant_id, environment_id, data_mode, app_user_id, role,
        school_id, active
      ) values (
        '30000000-0000-4000-8000-000000000204',
        '30000000-0000-4000-8000-000000000001',
        'gateway.production', 'production',
        '10000000-0000-4000-8000-000000000013', 'school_admin',
        '30000000-0000-4000-8000-000000000101', true
      );
    `});
    pass('installed fictional production-shaped gateway fixture with complete approved retention');

    jwtSecret = randomBytes(48).toString('base64url');
    signingJwk = {
      alg: 'HS256',
      k: Buffer.from(jwtSecret, 'utf8').toString('base64url'),
      kid: randomUUID(),
      kty: 'oct',
      use: 'sig',
    };
    let invitationIssuerPrivateKey = null;
    let invitationIssuerPublicJwk = null;
    if (productE2E) {
      const keyPair = generateKeyPairSync('ec', {namedCurve: 'P-256'});
      invitationIssuerPrivateKey = keyPair.privateKey;
      invitationIssuerPublicJwk = {
        ...keyPair.publicKey.export({format: 'jwk'}),
        alg: 'ES256',
        kid: randomUUID(),
        use: 'sig',
      };
    }
    smtpPassword = randomBytes(32).toString('base64url');
    signupPassword = `${randomBytes(24).toString('base64url')}!9aA`;
    const syntheticApiKey = randomBytes(32).toString('base64url');

    await spawnDaemon(
      'Mailpit',
      binaries.mailpit,
      [
        '--disable-version-check',
        '--database', path.join(temporaryRoot, 'mailpit.db'),
        '--listen', `127.0.0.1:${mailpitHttpPort}`,
        '--smtp', `127.0.0.1:${mailpitSmtpPort}`,
        '--smtp-auth-accept-any',
        '--smtp-auth-allow-insecure',
        '--smtp-allowed-recipients', productE2E
          ? '^(gateway-auth|portal\\.(admin|teacher|guardian))@helpmath\\.invalid$'
          : '^gateway-auth@helpmath\\.invalid$',
        '--block-remote-css-and-fonts',
        '--quiet',
        '--log-file', path.join(temporaryRoot, 'mailpit.log'),
      ],
      baseChildEnvironment(),
      'mailpit-process.log',
    );

    const gotrueValues = {
      API_EXTERNAL_URL: `http://127.0.0.1:${gatewayPort}/auth/v1`,
      API_HOST: '127.0.0.1',
      API_PORT: String(gotruePort),
      DB_DATABASE_URL: `${postgresUrl}&search_path=auth`,
      DB_DRIVER: 'postgres',
      DB_NAMESPACE: 'auth',
      DISABLE_SIGNUP: 'false',
      EXTERNAL_EMAIL_ENABLED: 'true',
      JWT_ADMIN_ROLES: 'service_role',
      JWT_AUD: 'authenticated',
      JWT_DEFAULT_GROUP_NAME: 'authenticated',
      JWT_EXP: '3600',
      JWT_ISSUER: `http://127.0.0.1:${gatewayPort}/auth/v1`,
      JWT_SECRET: jwtSecret,
      MAILER_AUTOCONFIRM: 'false',
      MAILER_URLPATHS_CONFIRMATION: '/auth/v1/verify',
      MAILER_URLPATHS_RECOVERY: '/auth/v1/verify',
      RATE_LIMIT_EMAIL_SENT: productE2E ? '1000' : '30',
      SITE_URL: productE2E
        ? `http://127.0.0.1:${nextPort}`
        : `http://127.0.0.1:${gatewayPort}`,
      SMTP_ADMIN_EMAIL: 'local-admin@helpmath.invalid',
      SMTP_HOST: '127.0.0.1',
      SMTP_MAX_FREQUENCY: productE2E ? '1s' : '1m',
      SMTP_PASS: smtpPassword,
      SMTP_PORT: String(mailpitSmtpPort),
      SMTP_SENDER_NAME: 'HELP Math Local Verification',
      SMTP_USER: 'local',
      URI_ALLOW_LIST: productE2E
        ? `http://127.0.0.1:${nextPort}/auth/callback*`
        : '',
    };
    const gotrueEnvironment = baseChildEnvironment();
    for (const [name, value] of Object.entries(gotrueValues)) {
      gotrueEnvironment[name] = value;
      gotrueEnvironment[`GOTRUE_${name}`] = value;
    }
    await runCommand(binaries.gotrue, ['migrate'], {
      cwd: temporaryRoot,
      env: gotrueEnvironment,
    });
    await spawnDaemon(
      'GoTrue', binaries.gotrue, ['serve'], gotrueEnvironment, 'gotrue.log',
    );

    await spawnDaemon(
      'PostgREST',
      binaries.postgrest,
      [],
      {
        ...baseChildEnvironment(),
        PGRST_ADMIN_SERVER_PORT: String(postgrestAdminPort),
        PGRST_DB_ANON_ROLE: 'anon',
        PGRST_DB_EXTRA_SEARCH_PATH: 'public,extensions',
        PGRST_DB_POOL: '12',
        PGRST_DB_SCHEMAS: 'public',
        PGRST_DB_URI: authenticatorUrl,
        PGRST_JWT_AUD: 'authenticated',
        PGRST_JWT_SECRET: JSON.stringify(productE2E
          ? {keys: [signingJwk, invitationIssuerPublicJwk]}
          : signingJwk),
        PGRST_LOG_LEVEL: 'warn',
        PGRST_SERVER_HOST: '127.0.0.1',
        PGRST_SERVER_PORT: String(postgrestPort),
      },
      'postgrest.log',
    );
    await spawnDaemon(
      'local gateway',
      process.execPath,
      [gatewayPath],
      {
        ...baseChildEnvironment(),
        FAMILY_LOCAL_AUTH_ORIGIN: `http://127.0.0.1:${gotruePort}`,
        FAMILY_LOCAL_GATEWAY_PORT: String(gatewayPort),
        FAMILY_LOCAL_REST_ORIGIN: `http://127.0.0.1:${postgrestPort}`,
      },
      'gateway.log',
    );

    await waitForHttp('Mailpit', `http://127.0.0.1:${mailpitHttpPort}/readyz`);
    await waitForHttp('GoTrue direct', `http://127.0.0.1:${gotruePort}/health`);
    await waitForHttp('PostgREST admin', `http://127.0.0.1:${postgrestAdminPort}/ready`);
    await waitForHttp('local gateway', `http://127.0.0.1:${gatewayPort}/health`, [204]);
    await waitForHttp('GoTrue through gateway', `http://127.0.0.1:${gatewayPort}/auth/v1/health`);

    const gatewayBase = `http://127.0.0.1:${gatewayPort}`;
    const results = [];
    const http = async (label, endpoint, options = {}) => {
      const response = await fetch(`${gatewayBase}${endpoint}`, {
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        headers: {
          Accept: 'application/json',
          apikey: syntheticApiKey,
          ...(options.body === undefined ? {} : {'Content-Type': 'application/json'}),
          ...(options.token ? {Authorization: `Bearer ${options.token}`} : {}),
          ...(options.headers ?? {}),
        },
        method: options.method ?? (options.body === undefined ? 'GET' : 'POST'),
        redirect: 'error',
        signal: AbortSignal.timeout(options.timeoutMs ?? 10_000),
      });
      const text = await response.text();
      let data = null;
      if (text) {
        try {
          data = JSON.parse(text);
          if (typeof data === 'string' && /^[\[{]/.test(data)) data = JSON.parse(data);
        } catch {
          data = null;
        }
      }
      const expected = options.expected ?? [200];
      assert(
        expected.includes(response.status),
        `${label} expected HTTP ${expected.join('/')} but received ${response.status} code=${
          data && typeof data === 'object' ? data.code ?? 'none' : 'none'
        }`,
      );
      results.push({
        code: data && typeof data === 'object' && !Array.isArray(data) ? data.code ?? null : null,
        label,
        status: response.status,
      });
      return {data, status: response.status};
    };
    const denied = [401, 403, 404];
    const adminToken = signJwt(signingJwk, {
      iss: 'urn:help-math:synthetic', role: 'authenticated', sub: 'school-admin',
    });
    const guardianToken = signJwt(signingJwk, {
      iss: 'urn:help-math:synthetic', role: 'authenticated', sub: 'guardian-a',
    });
    const teacherToken = signJwt(signingJwk, {
      iss: 'urn:help-math:synthetic', role: 'authenticated', sub: 'teacher-a',
    });
    const learnerToken = signJwt(signingJwk, {
      iss: 'urn:help-math:synthetic', role: 'authenticated', sub: 'learner-a',
    });
    const otherLearnerToken = signJwt(signingJwk, {
      iss: 'urn:help-math:synthetic', role: 'authenticated', sub: 'learner-b',
    });
    const invitationProbeToken = signJwt(signingJwk, {
      iss: 'urn:help-math:synthetic',
      role: 'authenticated',
      sub: 'gateway-invitation-probe-budget',
    });
    const serviceToken = signJwt(signingJwk, {
      iss: 'urn:help-math:synthetic:service', role: 'service_role', sub: 'service_role',
    });
    const writerToken = signJwt(signingJwk, {
      iss: 'urn:help-math:synthetic:webhook-writer',
      role: 'family_webhook_writer',
      sub: 'family_webhook_writer',
    });
    const wrongAudienceWriterToken = signJwt(signingJwk, {
      aud: 'wrong-audience',
      iss: 'urn:help-math:synthetic:webhook-writer',
      role: 'family_webhook_writer',
      sub: 'family_webhook_writer',
    });

    const productionAdminEmail = 'gateway.production.admin@helpmath.invalid';
    const productionAuthUser = await http(
      'production.auth.admin.create',
      '/auth/v1/admin/users',
      {
        body: {
          email: productionAdminEmail,
          email_confirm: true,
          password: signupPassword,
        },
        token: serviceToken,
      },
    );
    assert(
      typeof productionAuthUser.data?.id === 'string',
      'Production-shaped GoTrue administrator was not created.',
    );
    const productionAuthIssuer =
      `http://127.0.0.1:${gatewayPort}/auth/v1`;
    await psql(['-q'], {input: `
      insert into public.provider_identities (
        issuer, subject, app_user_id, active
      ) values (
        '${productionAuthIssuer}', '${productionAuthUser.data.id}',
        '10000000-0000-4000-8000-000000000013', true
      );
      insert into public.tenant_identity_issuers (
        tenant_id, environment_id, data_mode, issuer, active,
        requires_database_session
      ) values (
        '30000000-0000-4000-8000-000000000001',
        'gateway.production', 'production',
        '${productionAuthIssuer}', true, true
      );
    `});
    const signInProductionAdmin = async (label) => {
      const result = await http(
        label,
        '/auth/v1/token?grant_type=password',
        {
          body: {email: productionAdminEmail, password: signupPassword},
        },
      );
      assert(
        typeof result.data?.access_token === 'string'
          && typeof result.data?.refresh_token === 'string',
        'Production-shaped GoTrue sign-in returned no complete session.',
      );
      return result.data;
    };
    let productionAdminSession = await signInProductionAdmin(
      'production.auth.admin.signin.positive',
    );
    let productionAdminToken = productionAdminSession.access_token;
    const refreshedProductionSession = await http(
      'production.auth.admin.refresh.positive',
      '/auth/v1/token?grant_type=refresh_token',
      {body: {refresh_token: productionAdminSession.refresh_token}},
    );
    assert(
      typeof refreshedProductionSession.data?.access_token === 'string'
        && typeof refreshedProductionSession.data?.refresh_token === 'string',
      'Production-shaped GoTrue refresh returned no complete rotated session.',
    );
    productionAdminSession = refreshedProductionSession.data;
    productionAdminToken = productionAdminSession.access_token;
    await http(
      'production.auth.refreshed_session_context.positive',
      '/rest/v1/rpc/family_authorization_context_v1',
      {body: {}, token: productionAdminToken},
    );
    const productionSessionCount = await psql([
      '-A', '-t', '-c',
      `select count(*) from auth.sessions where user_id = '${productionAuthUser.data.id}'`,
    ]);
    assert(
      Number.parseInt(productionSessionCount.stdout.trim(), 10) >= 1,
      'Production-shaped GoTrue sign-in did not create an auth.sessions row.',
    );
    const productionOtherSessionToken = (await signInProductionAdmin(
      'production.auth.admin.second_session.positive',
    )).access_token;
    await http(
      'production.auth.logout_others.positive',
      '/auth/v1/logout?scope=others',
      {expected: [204], method: 'POST', token: productionAdminToken},
    );
    await http(
      'production.auth.current_after_logout_others.positive',
      '/rest/v1/rpc/family_authorization_context_v1',
      {body: {}, token: productionAdminToken},
    );
    const otherSessionDenied = await http(
      'production.auth.other_session_revoked.denied',
      '/rest/v1/rpc/family_authorization_context_v1',
      {body: {}, expected: [403], token: productionOtherSessionToken},
    );
    assert(
      otherSessionDenied.data?.code === '42501',
      'Logout-others did not revoke the second session at the DB boundary.',
    );
    await http(
      'production.auth.logout_local.positive',
      '/auth/v1/logout?scope=local',
      {expected: [204], method: 'POST', token: productionAdminToken},
    );
    const localSessionDenied = await http(
      'production.auth.local_session_revoked.denied',
      '/rest/v1/rpc/family_authorization_context_v1',
      {body: {}, expected: [403], token: productionAdminToken},
    );
    assert(
      localSessionDenied.data?.code === '42501',
      'Local logout did not revoke the current session at the DB boundary.',
    );
    productionAdminSession = await signInProductionAdmin(
      'production.auth.admin.after_scope_tests.positive',
    );
    productionAdminToken = productionAdminSession.access_token;
    pass('production identity refresh and local/others logout scopes are enforced through auth.sessions');

    await http('gotrue.signup.synthetic', '/auth/v1/signup', {
      body: {email: 'gateway-auth@helpmath.invalid', password: signupPassword},
    });
    let capturedMailCount = 0;
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const response = await fetch(`http://127.0.0.1:${mailpitHttpPort}/api/v1/messages`, {
        signal: AbortSignal.timeout(1_000),
      });
      if (response.ok) {
        const summary = await response.json();
        capturedMailCount = Number(
          summary.total ?? summary.messages_count ?? summary.messages?.length ?? 0,
        );
        if (capturedMailCount > 0) break;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert(capturedMailCount === 1, `Expected one loopback Mailpit message; found ${capturedMailCount}.`);
    pass('GoTrue synthetic signup reached loopback Mailpit count=1');

    for (let attempt = 1; attempt <= 21; attempt += 1) {
      const response = await fetch(
        `${gatewayBase}/rest/v1/rpc/accept_guardian_invitation_v1`,
        {
          body: JSON.stringify({
            p_idempotency_key: `gateway.probe.aggregate.${String(attempt).padStart(3, '0')}`,
            p_token_digest: 'a'.repeat(64),
            p_verified_email_digest: 'b'.repeat(64),
          }),
          headers: {
            Accept: 'application/json',
            apikey: syntheticApiKey,
            Authorization: `Bearer ${invitationProbeToken}`,
            'Content-Type': 'application/json',
          },
          method: 'POST',
          redirect: 'error',
          signal: AbortSignal.timeout(10_000),
        },
      );
      const data = await response.json();
      assert(
        response.status === 200 && Array.isArray(data) && data.length === 0,
        `Invitation probe ${attempt} did not preserve the zero-row HTTP shape.`,
      );
    }
    const invitationProbeCount = await psql([
      '-A', '-t', '-c',
      `select sum(request_count) from public.family_invitation_probe_windows where identity_digest = encode(extensions.digest(convert_to('urn:help-math:synthetic' || chr(31) || 'gateway-invitation-probe-budget', 'UTF8'), 'sha256'), 'hex')`,
    ]);
    assert(
      invitationProbeCount.stdout.trim() === '40',
      `Signed-identity probe budget did not stop atomically at 20+20: ${invitationProbeCount.stdout.trim()}`,
    );
    pass('unknown invitation probes are atomically limited per signed identity while preserving the zero-row HTTP shape');

    const guardianAuthorization = await http(
      'guardian.multi_tenant_authorization.positive',
      '/rest/v1/rpc/family_authorization_context_v1',
      {body: {}, token: guardianToken},
    );
    const guardianTenantRoles = guardianAuthorization.data?.tenants?.map((tenant) => ({
      id: tenant.id,
      roles: tenant.roles,
    }));
    assert(
      JSON.stringify(guardianTenantRoles) === JSON.stringify([
        {id: '10000000-0000-4000-8000-000000000001', roles: ['guardian']},
        {id: '20000000-0000-4000-8000-000000000001', roles: ['guardian']},
      ]),
      'Signed guardian authorization did not return the two exact role-scoped tenants.',
    );

    const cedarWorkspace = await http(
      'guardian.cedar_workspace.positive',
      '/rest/v1/rpc/family_workspace_for_tenant_v1',
      {
        body: {
          p_child_id: '10000000-0000-4000-8000-000000000020',
          p_tenant_id: '10000000-0000-4000-8000-000000000001',
        },
        token: guardianToken,
      },
    );
    assert(
      cedarWorkspace.data?.tenant?.id === '10000000-0000-4000-8000-000000000001'
      && cedarWorkspace.data?.selectedChildId === '10000000-0000-4000-8000-000000000020'
      && JSON.stringify(cedarWorkspace.data?.children?.map((child) => child.id)) ===
        JSON.stringify(['10000000-0000-4000-8000-000000000020'])
      && JSON.stringify(cedarWorkspace.data?.threads?.map((thread) => thread.childId)) ===
        JSON.stringify(['10000000-0000-4000-8000-000000000020']),
      'Explicit Cedar child locator returned cross-tenant family workspace data.',
    );

    const mapleWorkspace = await http(
      'guardian.maple_workspace.positive',
      '/rest/v1/rpc/family_workspace_for_tenant_v1',
      {
        body: {
          p_child_id: '20000000-0000-4000-8000-000000000020',
          p_tenant_id: '20000000-0000-4000-8000-000000000001',
        },
        token: guardianToken,
      },
    );
    assert(
      mapleWorkspace.data?.tenant?.id === '20000000-0000-4000-8000-000000000001'
      && mapleWorkspace.data?.selectedChildId === '20000000-0000-4000-8000-000000000020'
      && JSON.stringify(mapleWorkspace.data?.children?.map((child) => child.id)) ===
        JSON.stringify(['20000000-0000-4000-8000-000000000020'])
      && Array.isArray(mapleWorkspace.data?.threads)
      && mapleWorkspace.data.threads.length === 0,
      'Explicit Maple child locator returned cross-tenant family workspace data.',
    );
    const unlinkedWorkspace = await http(
      'guardian.unlinked_child_locator.denied',
      '/rest/v1/rpc/family_workspace_for_tenant_v1',
      {
        body: {
          p_child_id: '10000000-0000-4000-8000-000000000021',
          p_tenant_id: '10000000-0000-4000-8000-000000000001',
        },
        expected: [500],
        token: guardianToken,
      },
    );
    assert(
      unlinkedWorkspace.data?.code === 'P0002',
      'Unlinked child locator did not fail with the non-enumerating database code.',
    );
    const crossTenantWorkspace = await http(
      'guardian.cross_tenant_child_locator.denied',
      '/rest/v1/rpc/family_workspace_for_tenant_v1',
      {
        body: {
          p_child_id: '10000000-0000-4000-8000-000000000020',
          p_tenant_id: '20000000-0000-4000-8000-000000000001',
        },
        expected: [500],
        token: guardianToken,
      },
    );
    assert(
      crossTenantWorkspace.data?.code === 'P0002',
      'Cross-tenant child locator did not fail with the non-enumerating database code.',
    );
    const adminWorkspace = await http(
      'admin.cedar_access_workspace.positive',
      '/rest/v1/rpc/admin_family_access_workspace_for_tenant_v1',
      {
        body: {p_tenant_id: '10000000-0000-4000-8000-000000000001'},
        token: adminToken,
      },
    );
    assert(
      adminWorkspace.data?.tenant?.id === '10000000-0000-4000-8000-000000000001'
      && Array.isArray(adminWorkspace.data?.children)
      && adminWorkspace.data.children.length > 0,
      'Selected-tenant administrator workspace returned an invalid scope.',
    );
    const adminWrongTenant = await http(
      'admin.maple_access_workspace.denied',
      '/rest/v1/rpc/admin_family_access_workspace_for_tenant_v1',
      {
        body: {p_tenant_id: '20000000-0000-4000-8000-000000000001'},
        expected: [403, 500],
        token: adminToken,
      },
    );
    assert(
      adminWrongTenant.data?.code === '42501',
      'Administrator wrong-tenant access did not fail closed.',
    );
    const teacherInbox = await http(
      'teacher.cedar_family_inbox.positive',
      '/rest/v1/rpc/teacher_family_inbox_for_tenant_v1',
      {
        body: {p_tenant_id: '10000000-0000-4000-8000-000000000001'},
        token: teacherToken,
      },
    );
    assert(
      teacherInbox.data?.tenant?.id === '10000000-0000-4000-8000-000000000001'
      && Array.isArray(teacherInbox.data?.threads),
      'Selected-tenant teacher inbox returned an invalid scope.',
    );
    const teacherSchools = await http(
      'teacher.cedar_announcement_schools.positive',
      '/rest/v1/rpc/teacher_announcement_schools_for_tenant_v1',
      {
        body: {p_tenant_id: '10000000-0000-4000-8000-000000000001'},
        token: teacherToken,
      },
    );
    assert(
      teacherSchools.data?.tenant?.id === '10000000-0000-4000-8000-000000000001'
      && teacherSchools.data?.schools?.[0]?.id ===
        '10000000-0000-4000-8000-000000000101',
      'Selected-tenant teacher announcement schools returned an invalid scope.',
    );
    const teacherWrongTenant = await http(
      'teacher.maple_family_inbox.denied',
      '/rest/v1/rpc/teacher_family_inbox_for_tenant_v1',
      {
        body: {p_tenant_id: '20000000-0000-4000-8000-000000000001'},
        expected: [403, 500],
        token: teacherToken,
      },
    );
    assert(
      teacherWrongTenant.data?.code === '42501',
      'Teacher wrong-tenant inbox access did not fail closed.',
    );

    const preflight = await http(
      'authenticated.creation_preflight.positive',
      '/rest/v1/rpc/authorize_guardian_invitation_creation_v1',
      {
        body: {
          p_email_digest: '2'.repeat(64),
          p_idempotency_key: 'dynamic.gateway.create.001',
          p_student_id: '10000000-0000-4000-8000-000000000021',
        },
        token: adminToken,
      },
    );
    const attestation = preflight.data;
    for (const key of ['attestationId', 'expiresAt', 'invitationId', 'tenantId']) {
      assert(typeof attestation?.[key] === 'string', `Creation preflight omitted ${key}.`);
    }
    const createBody = {
      p_attestation_id: attestation.attestationId,
      p_email_ciphertext: 'v2.test_key.AAAAAAAAAAAAAAAA.emailCipher.AAAAAAAAAAAAAAAAAAAAAA',
      p_email_digest: '2'.repeat(64),
      p_encrypted_outbox_token: 'v2.test_key.AAAAAAAAAAAAAAAA.tokenCipher.AAAAAAAAAAAAAAAAAAAAAA',
      p_expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      p_idempotency_key: 'dynamic.gateway.create.001',
      p_invitation_id: attestation.invitationId,
      p_student_id: '10000000-0000-4000-8000-000000000021',
      p_token_digest: '2'.repeat(64),
    };
    const invitationIssuerToken = (overrides = {}) => signJwt(signingJwk, {
      family_purpose: 'family_invitation_issue_v1',
      iss: 'urn:help-math:synthetic:invitation-issuer',
      jti: randomUUID(),
      role: 'family_invitation_issuer',
      sub: 'family_invitation_issuer',
      ...overrides,
    });
    const issuerToken = invitationIssuerToken();
    const wrongPurposeIssuerToken = invitationIssuerToken({
      family_purpose: 'wrong-purpose',
    });
    const wrongIssuerIssuerToken = invitationIssuerToken({
      iss: 'urn:help-math:synthetic:wrong-invitation-issuer',
    });
    const wrongRoleIssuerToken = invitationIssuerToken({role: 'authenticated'});
    const wrongAudienceIssuerToken = invitationIssuerToken({aud: 'wrong-audience'});

    for (const [label, token] of [
      ['anon.create.denied', null],
      ['authenticated.create.denied', adminToken],
      ['service_role.create.denied', serviceToken],
    ]) {
      await http(label, '/rest/v1/rpc/create_guardian_invitation_v1', {
        body: createBody, expected: denied, token,
      });
    }
    await http('issuer.wrong_purpose.denied', '/rest/v1/rpc/create_guardian_invitation_v1', {
      body: createBody, expected: denied, token: wrongPurposeIssuerToken,
    });
    await http('issuer.wrong_issuer.denied', '/rest/v1/rpc/create_guardian_invitation_v1', {
      body: createBody, expected: denied, token: wrongIssuerIssuerToken,
    });
    await http('issuer.wrong_role.denied', '/rest/v1/rpc/create_guardian_invitation_v1', {
      body: createBody, expected: denied, token: wrongRoleIssuerToken,
    });
    await http('issuer.wrong_audience.denied', '/rest/v1/rpc/create_guardian_invitation_v1', {
      body: createBody, expected: [401], token: wrongAudienceIssuerToken,
    });
    const created = await http('issuer.create.positive', '/rest/v1/rpc/create_guardian_invitation_v1', {
      body: createBody, token: issuerToken,
    });
    assert(created.data?.invitation_id === attestation.invitationId, 'Issuer create receipt mismatched.');
    await http('issuer.table.denied', '/rest/v1/guardian_invitations?select=id', {
      expected: denied, token: issuerToken,
    });
    await http(
      'issuer.admin_preflight.denied',
      '/rest/v1/rpc/authorize_guardian_invitation_creation_v1',
      {
        body: {
          p_email_digest: '6'.repeat(64),
          p_idempotency_key: 'dynamic.gateway.forbidden.001',
          p_student_id: '10000000-0000-4000-8000-000000000020',
        },
        expected: denied,
        token: issuerToken,
      },
    );
    await http('issuer.webhook_rpc.denied', '/rest/v1/rpc/record_family_email_delivery_event_v1', {
      body: {
        p_event_type: 'delivered',
        p_occurred_at: new Date().toISOString(),
        p_provider_email_id: 'dynamic-unknown-provider-email',
        p_provider_event_id: 'dynamic-issuer-cross-call',
      },
      expected: denied,
      token: issuerToken,
    });

    const resendPreflight = await http(
      'authenticated.resend_preflight.positive',
      '/rest/v1/rpc/authorize_guardian_invitation_resend_v1',
      {
        body: {
          p_idempotency_key: 'dynamic.gateway.resend.001',
          p_invitation_id: attestation.invitationId,
        },
        token: adminToken,
      },
    );
    const resendBody = {
      p_attestation_id: resendPreflight.data.attestationId,
      p_encrypted_outbox_token: 'v2.test_key.AAAAAAAAAAAAAAAA.resendToken.AAAAAAAAAAAAAAAAAAAAAA',
      p_expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      p_idempotency_key: 'dynamic.gateway.resend.001',
      p_invitation_id: attestation.invitationId,
      p_token_digest: '3'.repeat(64),
    };
    for (const [label, token] of [
      ['anon.resend.denied', null],
      ['authenticated.resend.denied', adminToken],
      ['service_role.resend.denied', serviceToken],
    ]) {
      await http(label, '/rest/v1/rpc/resend_guardian_invitation_v1', {
        body: resendBody, expected: denied, token,
      });
    }
    await http('issuer.resend.positive', '/rest/v1/rpc/resend_guardian_invitation_v1', {
      body: resendBody,
      token: invitationIssuerToken(),
    });

    const revokedProductionPreflight = await http(
      'production.session_bound_preflight.positive',
      '/rest/v1/rpc/authorize_guardian_invitation_creation_v1',
      {
        body: {
          p_email_digest: '9'.repeat(64),
          p_idempotency_key: 'dynamic.gateway.production.revoked.001',
          p_student_id: '30000000-0000-4000-8000-000000000020',
        },
        token: productionAdminToken,
      },
    );
    const revokedProductionCreateBody = {
      p_attestation_id: revokedProductionPreflight.data.attestationId,
      p_email_ciphertext:
        'v2.test_key.AAAAAAAAAAAAAAAA.revokedEmail.AAAAAAAAAAAAAAAAAAAAAA',
      p_email_digest: '9'.repeat(64),
      p_encrypted_outbox_token:
        'v2.test_key.AAAAAAAAAAAAAAAA.revokedToken.AAAAAAAAAAAAAAAAAAAAAA',
      p_expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      p_idempotency_key: 'dynamic.gateway.production.revoked.001',
      p_invitation_id: revokedProductionPreflight.data.invitationId,
      p_student_id: '30000000-0000-4000-8000-000000000020',
      p_token_digest: '9'.repeat(64),
    };
    await http(
      'production.auth.global_logout.positive',
      '/auth/v1/logout?scope=global',
      {expected: [204], method: 'POST', token: productionAdminToken},
    );
    const revokedSessionPreflight = await http(
      'production.revoked_session_preflight.denied',
      '/rest/v1/rpc/authorize_guardian_invitation_creation_v1',
      {
        body: {
          p_email_digest: '8'.repeat(64),
          p_idempotency_key: 'dynamic.gateway.production.revoked.002',
          p_student_id: '30000000-0000-4000-8000-000000000020',
        },
        expected: [403],
        token: productionAdminToken,
      },
    );
    assert(
      revokedSessionPreflight.data?.code === '42501',
      'Revoked production session preflight did not fail at the DB identity boundary.',
    );
    const revokedAttestationConsume = await http(
      'production.revoked_session_attestation.denied',
      '/rest/v1/rpc/create_guardian_invitation_v1',
      {
        body: revokedProductionCreateBody,
        expected: [403],
        token: invitationIssuerToken(),
      },
    );
    assert(
      revokedAttestationConsume.data?.code === '42501',
      'Revoked production administrator session did not invalidate its attestation.',
    );
    const revokedProductionSessionCount = await psql([
      '-A', '-t', '-c',
      `select count(*) from auth.sessions where user_id = '${productionAuthUser.data.id}'`,
    ]);
    assert(
      revokedProductionSessionCount.stdout.trim() === '0',
      'Global logout left a production GoTrue session row active.',
    );
    productionAdminSession = await signInProductionAdmin(
      'production.auth.admin.reauthenticated.positive',
    );
    productionAdminToken = productionAdminSession.access_token;
    pass('global logout immediately denied the old session and its unconsumed invitation attestation');

    const productionPreflight = await http(
      'production.authenticated.creation_preflight.positive',
      '/rest/v1/rpc/authorize_guardian_invitation_creation_v1',
      {
        body: {
          p_email_digest: '7'.repeat(64),
          p_idempotency_key: 'dynamic.gateway.production.create.001',
          p_student_id: '30000000-0000-4000-8000-000000000020',
        },
        token: productionAdminToken,
      },
    );
    const productionCreateBody = {
      p_attestation_id: productionPreflight.data.attestationId,
      p_email_ciphertext:
        'v2.test_key.AAAAAAAAAAAAAAAA.productionEmail.AAAAAAAAAAAAAAAAAAAAAA',
      p_email_digest: '7'.repeat(64),
      p_encrypted_outbox_token:
        'v2.test_key.AAAAAAAAAAAAAAAA.productionToken.AAAAAAAAAAAAAAAAAAAAAA',
      p_expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      p_idempotency_key: 'dynamic.gateway.production.create.001',
      p_invitation_id: productionPreflight.data.invitationId,
      p_student_id: '30000000-0000-4000-8000-000000000020',
      p_token_digest: '7'.repeat(64),
    };
    for (const [label, token] of [
      ['production.authenticated.create.denied', productionAdminToken],
      ['production.service_role.create.denied', serviceToken],
    ]) {
      await http(label, '/rest/v1/rpc/create_guardian_invitation_v1', {
        body: productionCreateBody, expected: denied, token,
      });
    }
    const productionCreated = await http(
      'production.issuer.create.positive',
      '/rest/v1/rpc/create_guardian_invitation_v1',
      {body: productionCreateBody, token: invitationIssuerToken()},
    );
    assert(
      productionCreated.data?.invitation_id ===
        productionPreflight.data.invitationId,
      'Production issuer create receipt mismatched.',
    );
    const productionState = await psql([
      '-A', '-t', '-F', '|', '-c',
      `select data_mode, recipient_policy, status from public.guardian_invitations where id = '${productionPreflight.data.invitationId}'`,
    ]);
    assert(
      productionState.stdout.trim() ===
        'production|school-verified-production|pending',
      `Production invitation state mismatched: ${productionState.stdout.trim()}`,
    );
    pass('production issuer persisted exact data mode and school-verified recipient policy');

    await psql(['-q', '-c', `
      update public.retention_policies set enabled = false
      where tenant_id = '30000000-0000-4000-8000-000000000001'
        and data_class = 'guardian_link'
    `]);
    const retentionDenied = await http(
      'production.retention_preflight.denied',
      '/rest/v1/rpc/authorize_guardian_invitation_creation_v1',
      {
        body: {
          p_email_digest: '8'.repeat(64),
          p_idempotency_key: 'dynamic.gateway.production.denied.001',
          p_student_id: '30000000-0000-4000-8000-000000000020',
        },
        expected: [500],
        token: productionAdminToken,
      },
    );
    assert(
      retentionDenied.data?.code === 'P0002',
      'Production retention denial did not use the non-enumerating code.',
    );
    await psql(['-q', '-c', `
      update public.retention_policies set enabled = true
      where tenant_id = '30000000-0000-4000-8000-000000000001'
        and data_class = 'guardian_link'
    `]);
    const productionResendPreflight = await http(
      'production.authenticated.resend_preflight.positive',
      '/rest/v1/rpc/authorize_guardian_invitation_resend_v1',
      {
        body: {
          p_idempotency_key: 'dynamic.gateway.production.resend.001',
          p_invitation_id: productionPreflight.data.invitationId,
        },
        token: productionAdminToken,
      },
    );
    await http(
      'production.issuer.resend.positive',
      '/rest/v1/rpc/resend_guardian_invitation_v1',
      {
        body: {
          p_attestation_id: productionResendPreflight.data.attestationId,
          p_encrypted_outbox_token:
            'v2.test_key.AAAAAAAAAAAAAAAA.productionToken2.AAAAAAAAAAAAAAAAAAAAAA',
          p_expires_at: new Date(Date.now() + 6 * 86_400_000).toISOString(),
          p_idempotency_key: 'dynamic.gateway.production.resend.001',
          p_invitation_id: productionPreflight.data.invitationId,
          p_token_digest: '8'.repeat(64),
        },
        token: invitationIssuerToken(),
      },
    );
    const productionResendState = await psql([
      '-A', '-t', '-F', '|', '-c',
      `select send_count, recipient_policy, token_digest from public.guardian_invitations where id = '${productionPreflight.data.invitationId}'`,
    ]);
    assert(
      productionResendState.stdout.trim() ===
        `2|school-verified-production|${'8'.repeat(64)}`,
      `Production resend state mismatched: ${productionResendState.stdout.trim()}`,
    );
    pass('production resend preserved recipient policy and rotated the token once');

    const claim = await http(
      'service_role.claim_fixture.positive',
      '/rest/v1/rpc/claim_family_notification_outbox_v1',
      {body: {p_limit: 100}, token: serviceToken},
    );
    assert(Array.isArray(claim.data), 'Outbox claim response was not an array.');
    const invitationClaim = claim.data.find(
      (row) => row.payload?.invitationId === attestation.invitationId,
    );
    assert(invitationClaim?.id && invitationClaim?.claim_token, 'Invitation outbox was not claimed.');
    await http(
      'service_role.complete_fixture.positive',
      '/rest/v1/rpc/complete_family_notification_outbox_v1',
      {
        body: {
          p_claim_token: invitationClaim.claim_token,
          p_error_code: null,
          p_id: invitationClaim.id,
          p_provider_email_id: 'dynamic-provider-email-001',
          p_succeeded: true,
        },
        token: serviceToken,
      },
    );

    const deliveryBody = {
      p_event_type: 'delivered',
      p_occurred_at: new Date().toISOString(),
      p_provider_email_id: 'dynamic-provider-email-001',
      p_provider_event_id: 'dynamic-provider-event-001',
    };
    for (const [label, token, expected] of [
      ['anon.webhook.denied', null, denied],
      ['authenticated.webhook.denied', adminToken, denied],
      ['service_role.webhook.denied', serviceToken, denied],
      ['writer.wrong_audience.denied', wrongAudienceWriterToken, [401]],
    ]) {
      await http(label, '/rest/v1/rpc/record_family_email_delivery_event_v1', {
        body: deliveryBody, expected, token,
      });
    }
    await http('writer.delivery_event.positive', '/rest/v1/rpc/record_family_email_delivery_event_v1', {
      body: deliveryBody,
      expected: [204],
      headers: {Prefer: 'return=minimal'},
      token: writerToken,
    });
    await http('writer.table.denied', '/rest/v1/notification_outbox?select=id', {
      expected: denied, token: writerToken,
    });
    await http('writer.invitation_rpc.denied', '/rest/v1/rpc/create_guardian_invitation_v1', {
      body: createBody, expected: denied, token: writerToken,
    });
    await http('writer.rebuild_rpc.denied', '/rest/v1/rpc/rebuild_family_projections_v1', {
      body: {p_limit: 100}, expected: denied, token: writerToken,
    });

    for (const [label, token] of [
      ['anon.learning_launch.denied', null],
      ['admin.learning_launch.denied', adminToken],
      ['other_learner.learning_launch.denied', otherLearnerToken],
      ['service_role.learning_launch.denied', serviceToken],
    ]) {
      const deniedLaunch = await http(label, '/rest/v1/rpc/learning_assignment_launch_v1', {
        body: {p_assignment_id: '10000000-0000-4000-8000-000000000503'},
        expected: [...denied, 500],
        token,
      });
      assert(
        deniedLaunch.status !== 500 || deniedLaunch.data?.code === 'P0002',
        `${label} returned an unexpected server error instead of fail-closed not-found.`,
      );
    }
    const learningLaunch = await http(
      'learner.learning_launch.positive',
      '/rest/v1/rpc/learning_assignment_launch_v1',
      {
        body: {p_assignment_id: '10000000-0000-4000-8000-000000000503'},
        token: learnerToken,
      },
    );
    assert(
      learningLaunch.data?.tenantId === '10000000-0000-4000-8000-000000000001'
      && learningLaunch.data?.assignmentId === '10000000-0000-4000-8000-000000000503'
      && learningLaunch.data?.lessonReleaseId === 'lesson-g04-l03-negative-numbers'
      && learningLaunch.data?.objects?.length === 39
      && learningLaunch.data?.objects?.[0]?.pageOrdinal === 1
      && learningLaunch.data?.objects?.[0]?.placementId ===
        'course-g04-l03-ir-001-341242cc'
      && learningLaunch.data?.objects?.[38]?.pageOrdinal === 39
      && learningLaunch.data?.objects?.[38]?.placementId ===
        'course-g04-l03-fq-003',
      'Learner assignment launch envelope did not match the synthetic G4 L3 slice.',
    );
    await http(
      'learner.learning_binding_table.denied',
      '/rest/v1/assignment_learning_object_bindings?select=id',
      {expected: denied, token: learnerToken},
    );

    const baselineEvent = {
      activeDurationMs: 1_250,
      assignmentId: '10000000-0000-4000-8000-000000000503',
      attemptNumber: 1,
      clientMutationId: 'dynamic.concurrent.baseline.001',
      clientVersion: 'dynamic-gateway-v2',
      contentReleaseId: 'synthetic-g04-l03-browser-v2',
      eventId: '90000000-0000-4000-8000-00000000a000',
      eventType: 'page_reviewed',
      idempotencyKey: 'dynamic.concurrent.baseline.event.001',
      learningObjectVersionId: 'g04-l03-placement-001-v1',
      lessonReleaseId: 'lesson-g04-l03-negative-numbers',
      locale: 'en',
      occurredAt: new Date().toISOString(),
      outcome: 'completed',
      schemaVersion: 2,
      sessionId: '90000000-0000-4000-8000-00000000b000',
      skillId: null,
    };
    await http('learner.legacy_ingest.denied', '/rest/v1/rpc/ingest_learning_events_v2', {
      body: {p_events: [baselineEvent]}, expected: denied, token: learnerToken,
    });
    for (const [label, token] of [
      ['anon.assignment_event.denied', null],
      ['admin.assignment_event.denied', adminToken],
      ['other_learner.assignment_event.denied', otherLearnerToken],
      ['service_role.assignment_event.denied', serviceToken],
    ]) {
      const deniedEvent = await http(label, '/rest/v1/rpc/record_assignment_learning_events_v2', {
        body: {p_events: [baselineEvent]}, expected: [...denied, 500], token,
      });
      assert(
        deniedEvent.status !== 500 || deniedEvent.data?.code === 'P0002',
        `${label} returned an unexpected server error instead of fail-closed not-found.`,
      );
    }
    const baselineReceipt = await http('learner.concurrency_baseline_ingest.positive', '/rest/v1/rpc/record_assignment_learning_events_v2', {
      body: {p_events: [baselineEvent]},
      token: learnerToken,
    });
    assert(
      baselineReceipt.data?.tenantId === '10000000-0000-4000-8000-000000000001'
      && baselineReceipt.data?.inserted === 1
      && baselineReceipt.data?.ignored === 0,
      'Learner event receipt was not bound to the selected synthetic tenant.',
    );

    const catalogQuery = String.raw`
with roles(role_name) as (
  values ('family_invitation_issuer'::name), ('family_webhook_writer'::name)
), relation_counts as (
  select role_name,
    count(*) filter (
      where c.relkind in ('r','p','v','m','f')
        and has_table_privilege(
          role_name, c.oid,
          'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'
        )
    ) as table_privileges,
    count(*) filter (
      where c.relkind = 'S'
        and has_sequence_privilege(role_name, c.oid, 'USAGE,SELECT,UPDATE')
    ) as sequence_privileges
  from roles
  cross join pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
  group by role_name
), function_counts as (
  select role_name,
    count(*) filter (where has_function_privilege(role_name, p.oid, 'EXECUTE'))
      as function_count
  from roles
  cross join pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
  group by role_name
)
select relation_counts.role_name, table_privileges, sequence_privileges,
       function_count
from relation_counts join function_counts using (role_name)
order by relation_counts.role_name;
`;
    const catalog = await psql(['-A', '-t', '-F', '|', '-c', catalogQuery]);
    const catalogRows = catalog.stdout.trim().split('\n').map((line) => line.split('|'));
    assert(
      JSON.stringify(catalogRows) === JSON.stringify([
        ['family_invitation_issuer', '0', '0', '2'],
        ['family_webhook_writer', '0', '0', '1'],
      ]),
      `Dedicated-role catalog boundary changed: ${catalog.stdout.trim()}`,
    );
    pass('dedicated roles have zero table/sequence privileges and only 2/1 intended RPCs');
    const deliveryState = await psql([
      '-A', '-t', '-F', '|', '-c',
      "select count(*), min(nox.delivery_status) from public.email_delivery_events ede join public.notification_outbox nox on nox.provider_email_id = ede.provider_email_id where ede.provider_event_id = 'dynamic-provider-event-001'",
    ]);
    assert(deliveryState.stdout.trim() === '1|delivered', 'Writer transaction state did not persist exactly once.');
    pass('writer transaction persisted one delivery event and marked outbox delivered');

    const lockHolder = spawnCaptured(binaries.psql, [
      postgresUrl, '-X', '-v', 'ON_ERROR_STOP=1', '-q',
    ], {
      env: {...baseChildEnvironment(), PGAPPNAME: 'family-local-lock-holder'},
      input: [
        'begin;',
        "select 1 from public.students where id = '10000000-0000-4000-8000-000000000020' for no key update;",
        'select pg_sleep(10);',
        'commit;',
        '',
      ].join('\n'),
    });
    const lockHolderOutcome = lockHolder.done.then(
      (value) => ({value}),
      (error) => ({error}),
    );
    const lockHolderState = {
      child: lockHolder.child,
      exited: false,
      label: 'lock holder',
    };
    lockHolder.child.once('exit', () => {
      lockHolderState.exited = true;
    });
    lockHolder.child.once('error', () => {
      lockHolderState.exited = true;
    });
    daemons.push(lockHolderState);
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const state = await psql([
        '-A', '-t', '-c',
        "select count(*) from pg_stat_activity where application_name = 'family-local-lock-holder' and state = 'active' and wait_event = 'PgSleep'",
      ]);
      if (state.stdout.trim() === '1') break;
      if (attempt === 49) throw new VerificationError('Student lock holder did not reach its bounded wait state.');
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const concurrentEvent = {
      activeDurationMs: 1_750,
      assignmentId: '10000000-0000-4000-8000-000000000503',
      attemptNumber: 1,
      clientMutationId: 'dynamic.concurrent.review.001',
      clientVersion: 'dynamic-gateway-v2',
      contentReleaseId: 'synthetic-g04-l03-browser-v2',
      eventId: '90000000-0000-4000-8000-00000000a001',
      eventType: 'page_reviewed',
      idempotencyKey: 'dynamic.concurrent.review.event.001',
      learningObjectVersionId: 'g04-l03-placement-002-v1',
      lessonReleaseId: 'lesson-g04-l03-negative-numbers',
      locale: 'en',
      occurredAt: new Date().toISOString(),
      outcome: 'completed',
      schemaVersion: 2,
      sessionId: '90000000-0000-4000-8000-00000000b001',
      skillId: null,
    };
    const concurrentStartedAt = Date.now();
    const concurrentOutcome = Promise.all([
      http('concurrent.ingest.positive', '/rest/v1/rpc/record_assignment_learning_events_v2', {
        body: {p_events: [concurrentEvent]}, timeoutMs: 20_000, token: learnerToken,
      }),
      http('concurrent.rebuild.positive', '/rest/v1/rpc/rebuild_family_projections_v1', {
        body: {p_limit: 100}, timeoutMs: 20_000, token: serviceToken,
      }),
    ]).then(
      (value) => ({value}),
      (error) => ({error}),
    );
    let activeBackends = 0;
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const active = await psql([
        '-A', '-t', '-c',
        "select count(distinct pid) from pg_stat_activity where datname = current_database() and pid <> pg_backend_pid() and state = 'active' and (query like '%record_assignment_learning_events_v2%' or query like '%rebuild_family_projections_v1%')",
      ]);
      activeBackends = Number.parseInt(active.stdout.trim(), 10);
      if (activeBackends >= 2) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const concurrentResult = await concurrentOutcome;
    if (concurrentResult.error) throw concurrentResult.error;
    assert(
      activeBackends >= 2,
      `Expected two distinct PostgreSQL backends serving the PostgREST requests; observed ${activeBackends}.`,
    );
    const lockHolderResult = await lockHolderOutcome;
    if (lockHolderResult.error) throw lockHolderResult.error;
    pass(
      `concurrent HTTP ingest/rebuild postgres_backends=${activeBackends} elapsed_ms=${
        Date.now() - concurrentStartedAt
      }`,
    );

    const concurrencyState = await psql([
      '-A', '-t', '-F', '|', '-c',
      "select (select count(*) from public.learning_events_v2 where event_id = '90000000-0000-4000-8000-00000000a001'), reviewed_pages, stale, last_event_id from public.progress_projections_v1 where tenant_id = '10000000-0000-4000-8000-000000000001' and student_id = '10000000-0000-4000-8000-000000000020' and assignment_id = '10000000-0000-4000-8000-000000000503'",
    ]);
    assert(
      concurrencyState.stdout.trim() === '1|2|f|90000000-0000-4000-8000-00000000a001',
      `Concurrent projection state mismatched: ${concurrencyState.stdout.trim()}`,
    );
    pass('ingest/rebuild final event and deterministic projection watermark agree');

    const ingestLockHolder = spawnPsqlSession(
      'family-local-two-ingest-lock-holder',
      [
        'begin;',
        "select 1 from public.students where id = '10000000-0000-4000-8000-000000000020' for no key update;",
        'select pg_sleep(4);',
        'commit;',
        '',
      ].join('\n'),
    );
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const state = await psql([
        '-A', '-t', '-c',
        "select count(*) from pg_stat_activity where application_name = 'family-local-two-ingest-lock-holder' and state = 'active' and wait_event = 'PgSleep'",
      ]);
      if (state.stdout.trim() === '1') break;
      if (attempt === 49) throw new VerificationError('Two-ingest lock holder did not reach its bounded wait state.');
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const concurrentIngestEvents = [3, 4].map((pageOrdinal) => ({
      activeDurationMs: 900 + pageOrdinal,
      assignmentId: '10000000-0000-4000-8000-000000000503',
      attemptNumber: 1,
      clientMutationId: `dynamic.concurrent.ingest.${pageOrdinal}.001`,
      clientVersion: 'dynamic-gateway-v2',
      contentReleaseId: 'synthetic-g04-l03-browser-v2',
      eventId: `90000000-0000-4000-8000-00000000a00${pageOrdinal - 1}`,
      eventType: 'page_reviewed',
      idempotencyKey: `dynamic.concurrent.ingest.event.${pageOrdinal}.001`,
      learningObjectVersionId: `g04-l03-placement-00${pageOrdinal}-v1`,
      lessonReleaseId: 'lesson-g04-l03-negative-numbers',
      locale: 'en',
      occurredAt: new Date(Date.now() + pageOrdinal).toISOString(),
      outcome: 'completed',
      schemaVersion: 2,
      sessionId: `90000000-0000-4000-8000-00000000b00${pageOrdinal - 1}`,
      skillId: null,
    }));
    const twoIngestOutcome = Promise.all(concurrentIngestEvents.map((event, index) => (
      http(
        `concurrent.ingest_pair.${index + 1}.positive`,
        '/rest/v1/rpc/record_assignment_learning_events_v2',
        {body: {p_events: [event]}, timeoutMs: 15_000, token: learnerToken},
      )
    )));
    let twoIngestBackends = 0;
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const active = await psql([
        '-A', '-t', '-c',
        "select count(distinct pid) from pg_stat_activity where datname = current_database() and pid <> pg_backend_pid() and state = 'active' and query like '%record_assignment_learning_events_v2%'",
      ]);
      twoIngestBackends = Number.parseInt(active.stdout.trim(), 10);
      if (twoIngestBackends >= 2) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const [twoIngestReceipts] = await Promise.all([
      twoIngestOutcome,
      ingestLockHolder.done,
    ]);
    assert(
      twoIngestBackends >= 2
      && twoIngestReceipts.every((receipt) => receipt.data?.inserted === 1),
      `Expected two serialized learner ingests; backends=${twoIngestBackends}.`,
    );
    const twoIngestState = await psql([
      '-A', '-t', '-F', '|', '-c',
      "select (select count(*) from public.learning_events_v2 where event_id in ('90000000-0000-4000-8000-00000000a002','90000000-0000-4000-8000-00000000a003')), reviewed_pages, stale from public.progress_projections_v1 where tenant_id = '10000000-0000-4000-8000-000000000001' and student_id = '10000000-0000-4000-8000-000000000020' and assignment_id = '10000000-0000-4000-8000-000000000503'",
    ]);
    assert(
      twoIngestState.stdout.trim() === '2|4|f',
      `Two-ingest projection state mismatched: ${twoIngestState.stdout.trim()}`,
    );
    pass(`concurrent HTTP ingest/ingest postgres_backends=${twoIngestBackends}`);

    const preferenceTenantId = '10000000-0000-4000-8000-000000000001';
    const preferenceActorId = '10000000-0000-4000-8000-000000000010';
    const preferenceMutationId = 'dynamic.concurrent.preference.conflict.001';
    const preferenceLockHolder = spawnPsqlSession(
      'family-local-preference-lock-holder',
      [
        'begin;',
        `select pg_advisory_xact_lock(hashtextextended('family-notification-preference' || chr(31) || '${preferenceTenantId}' || chr(31) || '${preferenceActorId}', 91373011));`,
        'select pg_sleep(4);',
        'commit;',
        '',
      ].join('\n'),
    );
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const state = await psql([
        '-A', '-t', '-c',
        "select count(*) from pg_stat_activity where application_name = 'family-local-preference-lock-holder' and state = 'active' and wait_event = 'PgSleep'",
      ]);
      if (state.stdout.trim() === '1') break;
      if (attempt === 49) throw new VerificationError('Preference lock holder did not reach its bounded wait state.');
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const preferenceOutcomes = Promise.all([
      [true, false],
      [false, true],
    ].map(([messageEmailEnabled, weeklyDigestEnabled], index) => http(
      `concurrent.preference.${index + 1}`,
      '/rest/v1/rpc/update_family_notification_preferences_for_tenant_v1',
      {
        body: {
          p_client_mutation_id: preferenceMutationId,
          p_message_email_enabled: messageEmailEnabled,
          p_tenant_id: preferenceTenantId,
          p_weekly_digest_enabled: weeklyDigestEnabled,
        },
        expected: [200, 204, 400, 500],
        headers: {Prefer: 'return=minimal'},
        timeoutMs: 15_000,
        token: guardianToken,
      },
    )));
    const [preferenceResults] = await Promise.all([
      preferenceOutcomes,
      preferenceLockHolder.done,
    ]);
    const preferenceSuccesses = preferenceResults.filter(
      (result) => result.status >= 200 && result.status < 300,
    );
    const preferenceError = preferenceResults.find(
      (result) => result.status === 400 || result.status === 500,
    );
    assert(
      preferenceSuccesses.length === 1
      && preferenceError?.data?.code === '22023',
      `Concurrent preference conflict was not exact: ${JSON.stringify(preferenceResults)}.`,
    );
    const preferenceState = await psql([
      '-A', '-t', '-F', '|', '-c',
      `select count(*), bool_and(preference.message_email_enabled = mutation.message_email_enabled and preference.weekly_digest_enabled = mutation.weekly_digest_enabled) from public.family_notification_preference_mutations mutation join public.family_notification_preferences preference on preference.tenant_id = mutation.tenant_id and preference.app_user_id = mutation.app_user_id where mutation.tenant_id = '${preferenceTenantId}' and mutation.app_user_id = '${preferenceActorId}' and mutation.client_mutation_id = '${preferenceMutationId}'`,
    ]);
    assert(
      preferenceState.stdout.trim() === '1|t',
      `Concurrent preference receipt mismatched: ${preferenceState.stdout.trim()}`,
    );
    pass('concurrent preference idempotency commits one immutable intent and one 22023 conflict');

    const messageMutationId = 'dynamic.toggle.message.before.001';
    const messageAdvisoryHolder = spawnPsqlSession(
      'family-local-message-advisory-holder',
      [
        'begin;',
        `select pg_advisory_xact_lock(hashtextextended('family-message-idempotency' || chr(31) || '${preferenceActorId}' || chr(31) || '${messageMutationId}', 73295643));`,
        'select pg_sleep(4);',
        'commit;',
        '',
      ].join('\n'),
    );
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const state = await psql([
        '-A', '-t', '-c',
        "select count(*) from pg_stat_activity where application_name = 'family-local-message-advisory-holder' and state = 'active' and wait_event = 'PgSleep'",
      ]);
      if (state.stdout.trim() === '1') break;
      if (attempt === 49) throw new VerificationError('Message advisory holder did not reach its bounded wait state.');
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const messageBeforeToggle = http(
      'concurrent.message_before_toggle.positive',
      '/rest/v1/rpc/send_family_message_v1',
      {
        body: {
          p_body: 'Synthetic message linearized before the tenant switch.',
          p_child_id: null,
          p_client_mutation_id: messageMutationId,
          p_enrollment_id: null,
          p_staff_user_id: null,
          p_thread_id: '10000000-0000-4000-8000-000000000901',
          p_topic: null,
        },
        timeoutMs: 15_000,
        token: guardianToken,
      },
    );
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const state = await psql([
        '-A', '-t', '-c',
        "select count(*) from pg_stat_activity where state = 'active' and query like '%send_family_message_v1%' and wait_event_type = 'Lock'",
      ]);
      if (Number.parseInt(state.stdout.trim(), 10) >= 1) break;
      if (attempt === 49) throw new VerificationError('Message request did not reach the advisory wait state.');
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const toggleAfterMessage = psql([
      '-q', '-c',
      `update public.tenants set family_messaging_enabled = false where id = '${preferenceTenantId}'`,
    ]);
    await Promise.all([
      messageBeforeToggle,
      toggleAfterMessage,
      messageAdvisoryHolder.done,
    ]);
    const messageBeforeToggleState = await psql([
      '-A', '-t', '-F', '|', '-c',
      `select (select family_messaging_enabled from public.tenants where id = '${preferenceTenantId}'), (select count(*) from public.family_messages where sender_user_id = '${preferenceActorId}' and idempotency_key = '${messageMutationId}'), (select count(*) from public.notification_outbox outbox join public.family_messages message on message.tenant_id = outbox.tenant_id and outbox.idempotency_key like 'message:' || message.id::text || ':recipient:%' where message.sender_user_id = '${preferenceActorId}' and message.idempotency_key = '${messageMutationId}' and outbox.status <> 'cancelled')`,
    ]);
    assert(
      messageBeforeToggleState.stdout.trim() === 'f|1|0',
      `Message-before-toggle state mismatched: ${messageBeforeToggleState.stdout.trim()}`,
    );
    pass('message-before-toggle commits once, then the gate cancels pending egress without deadlock');

    await psql([
      '-q', '-c',
      `update public.tenants set family_messaging_enabled = true where id = '${preferenceTenantId}'`,
    ]);
    const toggleFirstSession = spawnPsqlSession(
      'family-local-toggle-first-holder',
      [
        'begin;',
        `update public.tenants set family_messaging_enabled = false where id = '${preferenceTenantId}';`,
        'select pg_sleep(4);',
        'commit;',
        '',
      ].join('\n'),
    );
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const state = await psql([
        '-A', '-t', '-c',
        "select count(*) from pg_stat_activity where application_name = 'family-local-toggle-first-holder' and state = 'active' and wait_event = 'PgSleep'",
      ]);
      if (state.stdout.trim() === '1') break;
      if (attempt === 49) throw new VerificationError('Toggle-first holder did not reach its bounded wait state.');
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const deniedAfterToggle = await http(
      'concurrent.toggle_before_message.denied',
      '/rest/v1/rpc/send_family_message_v1',
      {
        body: {
          p_body: 'Synthetic message must roll back after the tenant switch.',
          p_child_id: null,
          p_client_mutation_id: 'dynamic.toggle.message.after.001',
          p_enrollment_id: null,
          p_staff_user_id: null,
          p_thread_id: '10000000-0000-4000-8000-000000000901',
          p_topic: null,
        },
        expected: [403, 500],
        timeoutMs: 15_000,
        token: guardianToken,
      },
    );
    await toggleFirstSession.done;
    assert(
      deniedAfterToggle.data?.code === '42501',
      'Toggle-before-message did not fail with the exact messaging gate code.',
    );
    const deniedAfterToggleState = await psql([
      '-A', '-t', '-c',
      `select count(*) from public.family_messages where sender_user_id = '${preferenceActorId}' and idempotency_key = 'dynamic.toggle.message.after.001'`,
    ]);
    assert(
      deniedAfterToggleState.stdout.trim() === '0',
      'Toggle-before-message left a rolled-back message row.',
    );
    await psql([
      '-q', '-c',
      `update public.tenants set family_messaging_enabled = true where id = '${preferenceTenantId}'`,
    ]);
    pass('toggle-before-message denies the write after row-lock wait without deadlock');

    if (productE2E) {
      assert(
        invitationIssuerPrivateKey && invitationIssuerPublicJwk,
        'Product E2E invitation issuer key was not initialized.',
      );
      const productGuardianEmail = 'portal.guardian@helpmath.invalid';
      const productAdminEmail = 'portal.admin@helpmath.invalid';
      const productDistrictEmail = 'portal.district@helpmath.invalid';
      const productTeacherEmail = 'portal.teacher@helpmath.invalid';
      const productAdminPassword = `${randomBytes(18).toString('base64url')}!9Aa`;
      const productDistrictPassword = `${randomBytes(18).toString('base64url')}!9Aa`;
      const productTeacherPassword = `${randomBytes(18).toString('base64url')}!9Aa`;
      const productGuardianPassword = `${randomBytes(18).toString('base64url')}!9Aa`;
      const productProviderIssuer = `${gatewayBase}/auth/v1`;
      const createManagedUser = async (label, email, password) => {
        const response = await http(
          `product.auth.${label}.create`,
          '/auth/v1/admin/users',
          {
            body: {email, email_confirm: true, password},
            expected: [200, 201],
            token: serviceToken,
          },
        );
        const id = response.data?.id ?? response.data?.user?.id;
        assert(
          typeof id === 'string'
            && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(id),
          `Product ${label} identity did not return an opaque UUID.`,
        );
        return id;
      };
      const [productAdminSubject, productDistrictSubject, productTeacherSubject] = await Promise.all([
        createManagedUser('admin', productAdminEmail, productAdminPassword),
        createManagedUser('district', productDistrictEmail, productDistrictPassword),
        createManagedUser('teacher', productTeacherEmail, productTeacherPassword),
      ]);
      await psql(['-q'], {input: [
        'begin;',
        `insert into public.tenant_identity_issuers (tenant_id, environment_id, data_mode, issuer, active) values ('${preferenceTenantId}', 'local.synthetic', 'synthetic', '${productProviderIssuer}', true) on conflict (tenant_id, issuer) do update set active = true;`,
        `insert into public.provider_identities (issuer, subject, app_user_id, active, last_seen_at) values ('${productProviderIssuer}', '${productAdminSubject}', '10000000-0000-4000-8000-000000000013', true, clock_timestamp());`,
        `insert into public.provider_identities (issuer, subject, app_user_id, active, last_seen_at) values ('${productProviderIssuer}', '${productDistrictSubject}', '10000000-0000-4000-8000-000000000014', true, clock_timestamp());`,
        `insert into public.provider_identities (issuer, subject, app_user_id, active, last_seen_at) values ('${productProviderIssuer}', '${productTeacherSubject}', '10000000-0000-4000-8000-000000000012', true, clock_timestamp());`,
        'commit;',
        '',
      ].join('\n')});

      const invitationIssuerJwt = signEs256Jwt(
        invitationIssuerPrivateKey,
        invitationIssuerPublicJwk,
        {
          family_purpose: 'family_invitation_issue_v1',
          iss: 'urn:help-math:synthetic:invitation-issuer',
          jti: randomUUID(),
          role: 'family_invitation_issuer',
          sub: 'family_invitation_issuer',
        },
      );
      const outboxKey = randomBytes(32).toString('base64url');
      const emailDigestKey = randomBytes(32).toString('base64url');
      const cronSecret = randomBytes(32).toString('base64url');
      const nextBaseUrl = `http://127.0.0.1:${nextPort}`;
      const productEnvironment = {
        ...baseChildEnvironment(),
        CLERK_LOCAL_AUTH_ENABLED: 'false',
        CRON_SECRET: cronSecret,
        FAMILY_AUTH_PROVIDER: 'supabase',
        FAMILY_EMAIL_DIGEST_KEY: emailDigestKey,
        FAMILY_EMAIL_NOTIFICATIONS_ENABLED: 'true',
        FAMILY_EMAIL_TRANSPORT: 'mailpit-local',
        FAMILY_FROM_EMAIL: 'HELP Math Family Test <family@helpmath.invalid>',
        FAMILY_INVITATION_ISSUER_JWT: invitationIssuerJwt,
        FAMILY_INVITATION_ISSUER_JWT_AUDIENCE: 'authenticated',
        FAMILY_INVITATION_ISSUER_JWT_ISSUER:
          'urn:help-math:synthetic:invitation-issuer',
        FAMILY_INVITATION_RECIPIENT_POLICY: 'synthetic-invalid-only',
        FAMILY_LEARNING_EVENTS_V2_ENABLED: 'false',
        FAMILY_MESSAGING_ENABLED: 'true',
        FAMILY_OUTBOX_ENCRYPTION_ACTIVE_KEY_ID: 'local_product_e2e',
        FAMILY_OUTBOX_ENCRYPTION_KEYRING: JSON.stringify({
          local_product_e2e: outboxKey,
        }),
        FAMILY_OUTBOX_LEGACY_V1_READ_ENABLED: 'false',
        FAMILY_PORTAL_ENABLED: 'true',
        FAMILY_SUPABASE_AUTH_AUDIENCE: 'authenticated',
        FAMILY_SUPABASE_AUTH_CUTOVER_ENABLED: 'true',
        FAMILY_SUPABASE_AUTH_ISSUER: productProviderIssuer,
        FAMILY_SYNTHETIC_DEMO_ENABLED: 'false',
        NEXT_PUBLIC_CLERK_KEYLESS_DISABLED: 'true',
        NEXT_PUBLIC_SITE_URL: nextBaseUrl,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: syntheticApiKey,
        NEXT_PUBLIC_SUPABASE_URL: gatewayBase,
        NEXT_TELEMETRY_DISABLED: '1',
        SUPABASE_SERVICE_ROLE_KEY: serviceToken,
      };
      const nextProductState = await spawnDaemon(
        'Next Family product E2E',
        process.execPath,
        [
          path.join(repositoryRoot, 'node_modules', 'next', 'dist', 'bin', 'next'),
          'dev', '--hostname', '127.0.0.1', '--port', String(nextPort),
        ],
        productEnvironment,
        'next-product-e2e.log',
        {cwd: path.join(repositoryRoot, 'apps', 'web')},
      );
      await waitForHttp(
        'Next Family product E2E',
        `${nextBaseUrl}/`,
        [200],
        300,
      );
      const playwrightEnvironment = {
        ...productEnvironment,
        FAMILY_INTEGRATION_E2E_ENABLED: 'true',
        FAMILY_E2E_ADMIN_EMAIL: productAdminEmail,
        FAMILY_E2E_ADMIN_PASSWORD: productAdminPassword,
        FAMILY_E2E_CRON_SECRET: cronSecret,
        FAMILY_E2E_DISTRICT_EMAIL: productDistrictEmail,
        FAMILY_E2E_DISTRICT_PASSWORD: productDistrictPassword,
        FAMILY_E2E_GUARDIAN_EMAIL: productGuardianEmail,
        FAMILY_E2E_GUARDIAN_PASSWORD: productGuardianPassword,
        FAMILY_E2E_MAILPIT_URL: `http://127.0.0.1:${mailpitHttpPort}`,
        FAMILY_E2E_TEACHER_EMAIL: productTeacherEmail,
        FAMILY_E2E_TEACHER_PASSWORD: productTeacherPassword,
        PLAYWRIGHT_HOST: '127.0.0.1',
        PLAYWRIGHT_PORT: String(nextPort),
        PLAYWRIGHT_REUSE_EXISTING_SERVER: '1',
      };
      const playwrightResult = await runCommand(
        process.execPath,
        [
          path.join(repositoryRoot, 'node_modules', '@playwright', 'test', 'cli.js'),
          'test', 'family-portal-integration.spec.ts',
          '--workers=1', '--reporter=line',
          `--output=${path.join(temporaryRoot, 'playwright-results')}`,
        ],
        {
          cwd: path.join(repositoryRoot, 'apps', 'web'),
          env: playwrightEnvironment,
        },
      );
      assert(
        /1 passed/u.test(playwrightResult.stdout),
        'Protected Family product Playwright flow did not report one pass.',
      );
      const productGuardianDigest = createHmac(
        'sha256',
        Buffer.from(emailDigestKey, 'base64url'),
      ).update(productGuardianEmail, 'utf8').digest('hex');
      const productState = await psql([
        '-A', '-t', '-F', '|', '-c',
        `select invitation.status, link.status, (select count(*) from public.family_messages as message join public.family_threads as thread on thread.tenant_id = message.tenant_id and thread.id = message.thread_id where thread.guardian_user_id = invitation.accepted_by_user_id), (select count(*) from public.notification_outbox as outbox where outbox.tenant_id = invitation.tenant_id and outbox.recipient_user_id = invitation.accepted_by_user_id and outbox.kind = 'family_message' and outbox.status = 'sent') from public.guardian_invitations as invitation join public.guardian_links as link on link.tenant_id = invitation.tenant_id and link.student_id = invitation.student_id and link.guardian_user_id = invitation.accepted_by_user_id where invitation.recipient_email_digest = '${productGuardianDigest}' order by invitation.created_at desc limit 1`,
      ]);
      assert(
        productState.stdout.trim() === 'accepted|revoked|2|1',
        `Protected Family product state mismatched: ${productState.stdout.trim()}`,
      );
      const productGuardianIdentityState = await psql([
        '-A', '-t', '-F', '|', '-c',
        `select (select count(*) from auth.users where lower(email) = lower('${productGuardianEmail}')), (select count(*) from public.provider_identities as identity join auth.users as auth_user on auth_user.id = identity.subject::uuid where identity.issuer = '${productProviderIssuer}' and lower(auth_user.email) = lower('${productGuardianEmail}') and identity.active)`,
      ]);
      assert(
        productGuardianIdentityState.stdout.trim() === '1|1',
        `Duplicate-account recovery flow changed the authoritative identity cardinality: ${productGuardianIdentityState.stdout.trim()}`,
      );
      pass('protected browser product flow persisted invite, verified signup, enumeration-safe duplicate signup, password recovery, two-way messages, Mailpit notice, and immediate revoke denial');

      await http(
        'production.auth.pre_rollback_global_logout.positive',
        '/auth/v1/logout?scope=global',
        {expected: [204], method: 'POST', token: productionAdminToken},
      );
      const preRollbackSessionDenied = await http(
        'production.auth.pre_rollback_session.denied',
        '/rest/v1/rpc/family_authorization_context_v1',
        {body: {}, expected: [403], token: productionAdminToken},
      );
      assert(
        preRollbackSessionDenied.data?.code === '42501',
        'Pre-rollback provider revocation did not deny the old production-shaped session.',
      );

      await stopChild(nextProductState);
      let nextPortReleased = false;
      for (let attempt = 0; attempt < 50; attempt += 1) {
        try {
          await assertLoopbackPortAvailable(nextPort);
          nextPortReleased = true;
          break;
        } catch {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
      assert(nextPortReleased, 'Product Next process did not release its loopback port.');

      const rollbackEnvironment = {
        ...productEnvironment,
        FAMILY_AUTH_PROVIDER: 'disabled',
        FAMILY_EMAIL_NOTIFICATIONS_ENABLED: 'false',
        FAMILY_MESSAGING_ENABLED: 'false',
        FAMILY_PORTAL_ENABLED: 'false',
        FAMILY_SUPABASE_AUTH_CUTOVER_ENABLED: 'false',
      };
      await spawnDaemon(
        'Next Family rollback',
        process.execPath,
        [
          path.join(repositoryRoot, 'node_modules', 'next', 'dist', 'bin', 'next'),
          'dev', '--hostname', '127.0.0.1', '--port', String(nextPort),
        ],
        rollbackEnvironment,
        'next-rollback.log',
        {cwd: path.join(repositoryRoot, 'apps', 'web')},
      );
      await waitForHttp('Next Family rollback', `${nextBaseUrl}/`, [200], 300);
      for (const rollbackPath of [
        '/family',
        '/sign-in',
        '/auth/callback?code=rollback-probe',
        '/api/auth/session',
      ]) {
        const response = await fetch(`${nextBaseUrl}${rollbackPath}`, {
          redirect: 'manual',
          signal: AbortSignal.timeout(10_000),
        });
        assert(
          response.status === 404,
          `Rollback path ${rollbackPath} expected HTTP 404 but received ${response.status}.`,
        );
      }
      pass('fail-closed rollback revoked the provider session and made Family auth/product entry paths unreachable');
    }

    const backupDrillFixtureId = '10000000-0000-4000-8000-00000000f301';
    const mapleTenantId = '20000000-0000-4000-8000-000000000001';
    await psql(['-q'], {input: [
      'begin;',
      `insert into public.family_rights_requests (
        tenant_id, environment_id, data_mode, id, guardian_user_id, student_id,
        request_kind, details, client_mutation_id,
        retention_anchor_at, expires_at
      ) values (
        '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
        '${backupDrillFixtureId}',
        '10000000-0000-4000-8000-000000000010',
        '10000000-0000-4000-8000-000000000020', 'access', null,
        'verify.backup.retention.001', statement_timestamp() - interval '30 days',
        statement_timestamp() - interval '1 second'
      );`,
      'set local role service_role;',
      `select set_config(
        'request.jwt.claims', '{"role":"service_role"}', true
      );`,
      `select public.begin_family_tenant_teardown_v1(
        '${mapleTenantId}', 'verify.backup.teardown.001'
      );`,
      'select public.run_family_retention_v1(1000);',
      'commit;',
      '',
    ].join('\n')});
    const terminalStateQuery = `select
      tenant.status,
      tenant.family_portal_enabled,
      (select link.status from public.guardian_links as link
        where link.id = '20000000-0000-4000-8000-000000000801'),
      (select count(*) from public.role_bindings as binding
        where binding.tenant_id = tenant.id and binding.active),
      (select count(*) from public.family_threads as thread
        where thread.tenant_id = tenant.id and thread.status = 'open'),
      (select link.status from public.guardian_links as link
        where link.id = '10000000-0000-4000-8000-000000000803'),
      (select count(*) from public.family_rights_requests as request
        where request.id = '${backupDrillFixtureId}')
    from public.tenants as tenant
    where tenant.id = '${mapleTenantId}'`;
    const terminalState = await psql([
      '-A', '-t', '-F', '|', '-c', terminalStateQuery,
    ]);
    assert(
      terminalState.stdout.trim() === 'closed|f|expired|0|0|revoked|0',
      `Pre-backup terminal state mismatched: ${terminalState.stdout.trim()}`,
    );
    pass('retention and tenant teardown established terminal pre-backup state');

    const backupPath = path.join(temporaryRoot, 'family-no-resurrection.dump');
    const backupStartedAt = performance.now();
    await runCommand(binaries.pgDump, [
      '--format=custom',
      '--file', backupPath,
      postgresUrl,
    ], {env: baseChildEnvironment()});
    await regularFile(backupPath, 'Family no-resurrection backup');
    await chmod(backupPath, 0o600);
    const backupStats = await lstat(backupPath);
    assert(backupStats.size > 0, 'Family no-resurrection backup must not be empty.');
    const backupElapsedMs = Math.round(performance.now() - backupStartedAt);

    const restoreDurations = [];
    const restoreAndVerify = async (restoreDatabaseName) => {
      const restoreUrl = `postgresql://postgres@127.0.0.1:${postgresPort}/${restoreDatabaseName}?sslmode=disable`;
      await psql([
        '-q', '-c', `create database ${restoreDatabaseName} template template0`,
      ]);
      const restoreStartedAt = performance.now();
      await runCommand(binaries.pgRestore, [
        '--exit-on-error',
        '--no-owner',
        '--dbname', restoreUrl,
        backupPath,
      ], {env: baseChildEnvironment()});
      restoreDurations.push(Math.round(performance.now() - restoreStartedAt));
      const restoredState = await runCommand(binaries.psql, [
        restoreUrl, '-X', '-v', 'ON_ERROR_STOP=1',
        '-A', '-t', '-F', '|', '-c', terminalStateQuery,
      ], {env: baseChildEnvironment()});
      assert(
        restoredState.stdout.trim() === terminalState.stdout.trim(),
        `Restored terminal state mismatched: ${restoredState.stdout.trim()}`,
      );
      const restoredRlsCatalog = await runCommand(binaries.psql, [
        restoreUrl, '-X', '-v', 'ON_ERROR_STOP=1', '-A', '-t', '-F', '|', '-c',
        "select count(*), count(*) filter (where c.relrowsecurity) from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind in ('r','p')",
      ], {env: baseChildEnvironment()});
      assert(
        restoredRlsCatalog.stdout.trim() ===
          `${expectedPublicTableCount}|${expectedPublicTableCount}`,
        `Restored public-table RLS catalog mismatch: ${restoredRlsCatalog.stdout.trim()}`,
      );
    };
    await restoreAndVerify('family_no_resurrection_restore_1');
    await restoreAndVerify('family_no_resurrection_restore_2');
    pass(
      `two logical restores preserved RLS and did not resurrect revoked, expired, closed, or deleted family state backup_bytes=${backupStats.size} backup_ms=${backupElapsedMs} restore_ms=${restoreDurations.join(',')}`,
    );

    for (const result of results) {
      pass(`${result.label} HTTP ${result.status}${result.code ? ` code=${result.code}` : ''}`);
    }
    pass(`full local integration complete migration_count=${migrations.length}`);
  } finally {
    for (const [signal, handler] of signalHandlers) process.removeListener(signal, handler);
    await cleanup();
    pass('cleanup owned processes stopped, temporary root removed, ephemeral secrets discarded');
  }
}

async function main() {
  const mode = parseMode(commandLineArguments);
  const {expectedPublicTableCount, migrations} = await verifySourceContract();
  if (mode === '--source-contract') return;
  const binaries = await dependencyPreflight();
  if (mode === '--preflight') {
    const ports = await reserveLoopbackPorts(7);
    assert(new Set(ports).size === ports.length, 'Dynamic loopback port reservation was not unique.');
    pass('dry preflight reserved seven unique ephemeral loopback ports without starting services');
    return;
  }
  await runLocalIntegration(migrations, expectedPublicTableCount, binaries, {
    productE2E: mode === '--product-e2e',
  });
}

try {
  await main();
} catch (error) {
  process.stderr.write(`FAIL ${sanitizedErrorDetail(error instanceof Error ? error.message : error)}\n`);
  process.exitCode = 1;
}
