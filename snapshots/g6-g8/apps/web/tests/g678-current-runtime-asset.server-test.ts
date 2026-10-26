import assert from 'node:assert/strict';
import test from 'node:test';
import {resolveG678CurrentCanvasRuntime} from '../lib/g678-local-runtime-asset.server';

const root = '/Volumes/Life /HELP MATH 2.0-g678-implementation';
const local = {NODE_ENV: 'development', HELP_MATH_G678_LOCAL_PREVIEW: 'true', HELP_MATH_G678_LOCAL_PREVIEW_BIND: '127.0.0.1'};
process.env.HELP_MATH_G678_SOURCE_ROOT = '/Volumes/Life /HELP MATH Related Files/AWS Grade-Classified Courseware';

test('current selected P002 Canvas serves exact registered bytes despite explicitly unrenewed historical compiler pins', async () => {
  const result = await resolveG678CurrentCanvasRuntime('shared-alg001-l06-p002', local, root);
  assert.equal(result?.bytes.length, 17059732);
  assert.equal(result?.sha256, '06dd3caf27c8a140e58cd95188efe223a99530dc0a12176897c2dfbb4d0ae255');
});
test('current asset read remains closed in production, without loopback opt-in, and for a path instead of a placement', async () => {
  for (const env of [{...local,NODE_ENV:'production'}, {...local,HELP_MATH_G678_LOCAL_PREVIEW:'false'}, {...local,HELP_MATH_G678_LOCAL_PREVIEW_BIND:'0.0.0.0'}]) {
    assert.equal(await resolveG678CurrentCanvasRuntime('shared-alg001-l06-p002', env, root), undefined);
  }
  assert.equal(await resolveG678CurrentCanvasRuntime('../../source', local, root), undefined);
});
test('a drifted DOM page or an HFR page cannot be served as registered Canvas JavaScript', async () => {
  assert.equal(await resolveG678CurrentCanvasRuntime('shared-alg001-l06-p001', local, root), undefined);
  assert.equal(await resolveG678CurrentCanvasRuntime('shared-alg001-l06-p029', local, root), undefined);
});
