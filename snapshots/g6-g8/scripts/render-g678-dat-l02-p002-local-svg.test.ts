import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {test} from 'node:test';
import {renderDatL02P002LocalSvg} from './render-g678-dat-l02-p002-local-svg';

test('three source-frame projections stay deterministic and explicitly diagnostic', () => {
  const expected = new Map([
    [1, '7be0f7eedf9cfc1c30ff120ffbc41e5dfb2f2739d824e8ea310e3ecec62652d8'],
    [126, '3259b83a996bd21132d77907d29a3cd6428b36422fd4536d2a6b7e33ec802ff2'],
    [276, '5c9fd57be9e88c932675dc55f23cb9d3fe26b3b0fd14a146ec9be68db0969715'],
  ]);
  for (const [frame, digest] of expected) {
    const svg = renderDatL02P002LocalSvg(frame);
    assert.equal(createHash('sha256').update(svg).digest('hex'), digest);
    assert.match(svg, new RegExp(`data-diagnostic-only="true" data-source-frame="${frame}"`));
    assert.match(svg, /clipPathUnits="userSpaceOnUse"/);
    assert.match(svg, /data:image\/svg\+xml;base64,/);
    assert.doesNotMatch(svg, /<animate\b/);
  }
  assert.throws(() => renderDatL02P002LocalSvg(277), /DAT_L02_P002_INVALID_FRAME_IDENTITY/);
});
