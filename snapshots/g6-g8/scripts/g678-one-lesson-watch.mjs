import {execFileSync, spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'output/g678-course-playback-20261021');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'catalog/g678-page-only-release-manifest.v1.json'), 'utf8'));
const lessons = manifest.releases.map((release) => {
  const id = release.members[0]?.animationId ?? '';
  const match = /^shared-([a-z0-9]+)-l(\d+)-p/u.exec(id);
  return match ? `${match[1]}/${Number(match[2])}` : '';
}).filter(Boolean);

function nextLesson() {
  const finished = new Set();
  if (!fs.existsSync(outDir)) return lessons[0] ?? '';
  for (const name of fs.readdirSync(outDir)) {
    if (!name.startsWith('summary-') || !name.endsWith('.json') || name.includes('strand')) continue;
    const data = JSON.parse(fs.readFileSync(path.join(outDir, name), 'utf8'));
    const locales = new Set((data.summaries ?? []).map((summary) => summary.locale));
    if (locales.has('en') && locales.has('es')) {
      const summary = data.summaries[0];
      finished.add(`${summary.module}/${Number(summary.lesson)}`);
    }
  }
  return lessons.find((lesson) => !finished.has(lesson)) ?? '';
}

function running() {
  try {
    const output = execFileSync('pgrep', ['-fl', 'g678-one-lesson-queue'], {encoding: 'utf8'});
    return output.includes('g678-one-lesson-queue.mjs');
  } catch {
    return false;
  }
}

function note(line) {
  fs.mkdirSync(outDir, {recursive: true});
  fs.appendFileSync(path.join(outDir, 'overnight-status.txt'), `${new Date().toISOString()} ${line}\n`);
  console.log(line);
}

while (true) {
  if (!running()) {
    const lesson = nextLesson();
    if (!lesson) {
      note('all 44 lessons have English and Spanish walk summaries');
      process.exit(0);
    }
    note(`queue was down; resuming from ${lesson}`);
    const child = spawn(process.execPath, [path.join(root, 'scripts/g678-one-lesson-queue.mjs'), '--from', lesson], {
      cwd: root,
      detached: true,
      stdio: 'ignore',
    });
    child.unref();
  } else {
    note(`queue alive; next unfinished ${nextLesson() || 'none'}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 60000));
}
