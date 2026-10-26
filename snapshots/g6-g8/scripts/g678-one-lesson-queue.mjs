import {spawn, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'http://127.0.0.1:3331';
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'catalog/g678-page-only-release-manifest.v1.json'), 'utf8'));
const lessons = manifest.releases.map((release) => {
  const id = release.members[0]?.animationId ?? '';
  const match = /^shared-([a-z0-9]+)-l(\d+)-p/u.exec(id);
  return match ? `${match[1]}/${Number(match[2])}` : '';
}).filter(Boolean);

function serverUp() {
  return new Promise((resolve) => {
    const request = http.get(`${origin}/en/migration-status/g678-course/dat001/8`, {timeout: 90000}, (response) => {
      response.resume();
      resolve(response.statusCode === 200);
    });
    request.on('error', () => resolve(false));
    request.on('timeout', () => {
      request.destroy();
      resolve(false);
    });
  });
}

function startServer() {
  const child = spawn('npm', ['--prefix', path.join(root, 'apps/web'), 'run', 'dev', '--', '--hostname', '127.0.0.1', '--port', '3331', '--webpack', '--disable-source-maps'], {
    cwd: root,
    detached: true,
    stdio: 'ignore',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      HELP_MATH_G678_LOCAL_PREVIEW: '1',
      HELP_MATH_G678_LOCAL_PREVIEW_BIND: '127.0.0.1',
      HELP_MATH_G678_SOURCE_ROOT: '/Volumes/Life /HELP MATH Related Files/AWS Grade-Classified Courseware',
      CLERK_LOCAL_AUTH_ENABLED: 'false',
      MODERN_WIDE_SHELL_ENABLED: 'true',
      NEXT_TELEMETRY_DISABLED: '1',
      // One lesson keeps every visited page on one lazy-compilation request.
      // Sixty-five pages still fit under 256KB. The 16KB default rejects page 18.
      NODE_OPTIONS: '--max-old-space-size=12288 --max-http-header-size=262144',
    },
  });
  child.unref();
}

async function ensureServer() {
  if (await serverUp()) return true;
  startServer();
  for (let attempt = 0; attempt < 12; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    if (await serverUp()) return true;
  }
  return false;
}

const fromFlag = process.argv.indexOf('--from');
const fromLesson = fromFlag >= 0 ? process.argv[fromFlag + 1] : '';
const only = fromFlag >= 0 ? undefined : process.argv[2];
let queue = lessons;
if (fromLesson) {
  const start = lessons.indexOf(fromLesson);
  if (start < 0) {
    console.error(`unknown lesson ${fromLesson}`);
    process.exit(1);
  }
  queue = lessons.slice(start);
} else if (only) {
  queue = lessons.filter((lesson) => only.split(',').includes(lesson));
}
if (queue.length === 0) {
  console.error('no lessons');
  process.exit(1);
}

for (const lesson of queue) {
  if (!await ensureServer()) {
    console.error(`preview stayed down before ${lesson}`);
    process.exit(1);
  }
  console.log(`lesson ${lesson}`);
  const result = spawnSync(process.execPath, [path.join(root, 'scripts/g678-course-playback-walk.mjs'), lesson], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status === 2) {
    console.error('stopped because another walk is running');
    process.exit(2);
  }
  console.log(`finished ${lesson} exit ${result.status}`);
}
