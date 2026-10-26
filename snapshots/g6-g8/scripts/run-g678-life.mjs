/** Maintained Life execution entry. Usage: node scripts/run-g678-life.mjs
 * [--test] <script-inside-the-Life-worktree> [...script arguments]. */
import assert from 'node:assert/strict';
import {lstatSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {G678_LIFE_EXECUTION_ROOT as ROOT, G678_LIFE_SOURCE_ROOT as SOURCE,
  resolveG678PhysicalPath} from '../lib/g678-life-root-binding-v1.mjs';

assert.equal(realpathSync(process.cwd()), ROOT, 'Run the Life entry from the exact authorized execution root');
const argv = process.argv.slice(2), nodeArgs = argv[0] === '--test' ? [argv.shift()] : [];
const entry = argv.shift();
assert(entry && !entry.startsWith('-'), 'An explicit Life script entry is required');
assert(nodeArgs.length === 0 || argv.length === 0, 'The test mode accepts exactly one reviewed Life test entry');
const script = path.resolve(ROOT, entry);
assert(script.startsWith(ROOT + path.sep) && realpathSync(script) === script,
  'The script must be a physical file inside the Life execution tree');
const stat = lstatSync(script);
assert(stat.isFile() && stat.nlink === 1 && /\.(?:mjs|cjs|js|ts)$/u.test(script),
  'An ordinary single-link Node script is required');
process.env.HELP_MATH_G678_SOURCE_ROOT = SOURCE;
assert.equal(resolveG678PhysicalPath(SOURCE, ROOT), SOURCE);
// Inherited preload/module-search flags can retain a previous disk's tooling.
const env = {...process.env};
delete env.NODE_OPTIONS;
delete env.NODE_PATH;
const child = spawnSync(process.execPath, [...nodeArgs, script, ...argv],
  {cwd: ROOT, env, stdio: 'inherit'});
if (child.error) throw child.error;
if (child.signal) {
  process.stderr.write('Life child terminated by ' + child.signal + '\n');
  process.exitCode = 1;
} else process.exitCode = child.status ?? 1;
