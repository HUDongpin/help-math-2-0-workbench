#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildNmsL1P023SourcePage} from './lib/g678-nms-l01-p023-generator-v1.mjs';
export const ID='shared-nms002-l01-p023',CALIBRATION='g678-nms-l01-p023-current-js-v1';
export const SPEC={"path": "/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p023-source-spec-v1.json", "bytes": 53030, "sha256": "09509ab102e34889fb8133b09a61de7dde0a7f1c062e4b2fa0199590866d435b"};
export const SOURCE={"path": "G6-G8-shared/NMS002/L1/IN/L1IN13.swf", "bytes": 349123, "sha256": "786e3a3e22f8d757a4943586435428bbfa5533cad2787bbd75337941da172421"};
export function build(options={}){return buildNmsL1P023SourcePage({ID,CALIBRATION,SPEC,SOURCE,builderPath:'scripts/build-g678-nms-l01-p023.mjs',modulePath:'packages/demos/src/modules/g678-nms-l01-p023.tsx',timelinePath:'packages/demos/src/timelines/shared-nms002-l01-p023.ts',title:'Multiplying Integers'},options);}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&['--check','--prepare'].includes(process.argv[2]));console.log(JSON.stringify(await build({check:process.argv.includes('--check'),prepareOnly:process.argv.includes('--prepare')}),null,2));}
