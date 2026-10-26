import assert from 'node:assert/strict';
import {test} from 'node:test';
import {GEO_L06_P002_SHEET_URL, GEO_L06_P002_STREAM_URL,
  isGeoL06P002SheetRequest, isGeoL06P002StreamRequest} from
  '../lib/g678-geo-l06-p002-asset-access';

const env = {NODE_ENV: 'development', HELP_MATH_G678_LOCAL_PREVIEW: 'true',
  HELP_MATH_G678_LOCAL_PREVIEW_BIND: '127.0.0.1'};
const url = new URL(GEO_L06_P002_SHEET_URL, 'http://127.0.0.1:3000');
const headers = new Headers({host: '127.0.0.1:3000',
  referer: 'http://127.0.0.1:3000/en/migration-status/g678-calibration/shared-geo001-l06-p002',
  'sec-fetch-site': 'same-origin', 'sec-fetch-mode': 'cors',
  'sec-fetch-dest': 'empty'});

test('exact local same-origin P002 sheet fetch is allowed', () => {
  assert.equal(isGeoL06P002SheetRequest({method: 'GET', url, headers}, env), true);
  assert.equal(isGeoL06P002StreamRequest({method: 'GET',
    url: new URL(GEO_L06_P002_STREAM_URL, url), headers}, env), true);
});

test('the exact unregistered My Lesson host probe may load the same pinned assets', () => {
  const hostHeaders = new Headers(headers);
  hostHeaders.set('referer', 'http://127.0.0.1:3000/es/migration-status/g678-calibration/shared-geo001-l06-p002/host');
  assert.equal(isGeoL06P002SheetRequest({method: 'GET', url, headers: hostHeaders}, env), true);
  assert.equal(isGeoL06P002StreamRequest({method: 'GET',
    url: new URL(GEO_L06_P002_STREAM_URL, url), headers: hostHeaders}, env), true);
  hostHeaders.set('referer', 'http://127.0.0.1:3000/es/migration-status/g678-calibration/shared-geo001-l06-p002/host/extra');
  assert.equal(isGeoL06P002SheetRequest({method: 'GET', url, headers: hostHeaders}, env), false);
});

test('sheet is closed in production, on remote hosts, and outside exact preview path', () => {
  const request = {method: 'GET', url, headers};
  assert.equal(isGeoL06P002SheetRequest(request, {...env, NODE_ENV: 'production'}), false);
  assert.equal(isGeoL06P002SheetRequest({...request,
    url: new URL(GEO_L06_P002_SHEET_URL, 'https://helpmath.ai')}, env), false);
  assert.equal(isGeoL06P002SheetRequest({...request,
    url: new URL('/flash-assets/g678-local/shared-geo001-l06-p002/symbol-sheet.svg?sha256=bad', url)}, env), false);
  const unrelated = new Headers(headers);
  unrelated.set('referer', 'http://127.0.0.1:3000/en/migration-status/g678-calibration/shared-geo001-l06-p001');
  assert.equal(isGeoL06P002SheetRequest({...request, headers: unrelated}, env), false);
  const crossOrigin = new Headers(headers);
  crossOrigin.set('origin', 'http://attacker.example');
  assert.equal(isGeoL06P002SheetRequest({...request, headers: crossOrigin}, env), false);
  const ranged = new Headers(headers);
  ranged.set('range', 'bytes=0-100');
  assert.equal(isGeoL06P002SheetRequest({...request, headers: ranged}, env), false);
  assert.equal(isGeoL06P002StreamRequest({...request,
    url: new URL(GEO_L06_P002_STREAM_URL, 'https://helpmath.ai')}, env), false);
  assert.equal(isGeoL06P002StreamRequest({...request,
    url: new URL('/flash-assets/g678-local/shared-geo001-l06-p002/source-stream.mp3?sha256=bad', url)}, env), false);
  assert.equal(isGeoL06P002StreamRequest({...request,
    url: new URL(GEO_L06_P002_STREAM_URL, url), headers: ranged}, env), false);
});
