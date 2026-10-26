#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildP026} from './lib/g678-nms-l01-p026-generator-v1.mjs';
export const ID='shared-nms002-l01-p026',CALIBRATION='g678-nms-l01-p026-current-js-v1';
export const SPEC={"path": "/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p026-source-spec-v2.json", "bytes": 224912, "sha256": "cee02f001dc6297a294f37c0e30147b89b56ecc4fb2698efefffe5ce9aaedbff"};
export const SOURCE={"path": "G6-G8-shared/NMS002/L1/IN/L1IN16.swf", "bytes": 156200, "sha256": "ab06e54ffd16fa706e1d03ecccec20fb8d3f892f3d970b8175c4f883394a89c3"};
export function build(options={}){return buildP026({ID,CALIBRATION,SPEC,SOURCE},options);}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&['--check','--prepare'].includes(process.argv[2]));console.log(JSON.stringify(await build({check:process.argv.includes('--check'),prepare:process.argv.includes('--prepare')}),null,2));}
