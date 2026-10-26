#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildP019} from './lib/g678-nms-l01-p019-generator-v2.mjs';
export const ID='shared-nms002-l01-p019',CALIBRATION='g678-nms-l01-p019-current-js-v2';
export const SPEC={"path": "/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p019-source-spec-v2.json", "bytes": 53894, "sha256": "7f31c447e0f29ca33627613cd94ac68c3ca8e0d4b926684a1804de907e210381"};
export const SOURCE={"path": "G6-G8-shared/NMS002/L1/IN/L1IN09.swf", "bytes": 185992, "sha256": "1e87c6449e84acba17d947b26d27d0172c0daf6542e24d4b1290b70e308fec98"};
export function build(options={}){return buildP019({ID,CALIBRATION,SPEC,SOURCE},options);}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&['--check','--prepare'].includes(process.argv[2]));console.log(JSON.stringify(await build({check:process.argv.includes('--check'),prepare:process.argv.includes('--prepare')}),null,2));}
