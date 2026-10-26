import 'server-only';

import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
type Pin = Readonly<{path: string; bytes: number; sha256: string}>;

/** Read only a byte-pinned ordinary file in this workspace or the real AWS source tree. */
export function readNmsL09P003Binding(workspaceRoot: string, pin: Pin): Buffer {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV ||
      process.env.HELP_MATH_G678_SOURCE_ROOT !== SOURCE_ROOT ||
      realpathSync(SOURCE_ROOT) !== SOURCE_ROOT ||
      !/^[a-f0-9]{64}$/u.test(pin.sha256) ||
      !Number.isSafeInteger(pin.bytes) || pin.bytes <= 0) {
    throw new Error('NMS_L09_P003_BINDING_SCOPE');
  }
  const root = path.resolve(workspaceRoot);
  if (realpathSync(root) !== root) throw new Error('NMS_L09_P003_WORKSPACE_ROOT');
  const target = path.resolve(root, pin.path);
  const inWorkspace = target.startsWith(`${root}${path.sep}`) && !path.isAbsolute(pin.path);
  const inSource = target.startsWith(`${SOURCE_ROOT}${path.sep}`) && path.isAbsolute(pin.path);
  if ((!inWorkspace && !inSource) || realpathSync(target) !== target) {
    throw new Error('NMS_L09_P003_BINDING_PATH');
  }
  const before = lstatSync(target, {bigint: true});
  if (!before.isFile() || before.isSymbolicLink() || before.nlink !== 1n) {
    throw new Error('NMS_L09_P003_BINDING_FILE');
  }
  const bytes = readFileSync(target);
  const after = lstatSync(target, {bigint: true});
  if (!['dev', 'ino', 'size', 'mode', 'mtimeNs', 'nlink'].every(key =>
      before[key as keyof typeof before] === after[key as keyof typeof after]) ||
      bytes.length !== pin.bytes ||
      createHash('sha256').update(bytes).digest('hex') !== pin.sha256) {
    throw new Error('NMS_L09_P003_BINDING_IDENTITY:' + pin.path);
  }
  return bytes;
}
