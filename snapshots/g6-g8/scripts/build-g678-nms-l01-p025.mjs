#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildNmsL1P025SourcePage} from './lib/g678-nms-l01-p025-generator-v1.mjs';
export const ID='shared-nms002-l01-p025',CALIBRATION='g678-nms-l01-p025-current-js-v1';
export const SPEC={"path": "/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p025-source-spec-v1.json", "bytes": 35499, "sha256": "8a4dc38e9cb0c480b18c06470589e8d405dea4c8dc9de16da325dd5194c829f7"};
export const SOURCE={"path": "G6-G8-shared/NMS002/L1/IN/L1IN15.swf", "bytes": 121386, "sha256": "2df9773f0ac3a30efe982b3e9ff1377672790ec8890a1d6bf548177b0f037fdc"};
export function build(options={}){return buildNmsL1P025SourcePage({ID,CALIBRATION,SPEC,SOURCE,builderPath:'scripts/build-g678-nms-l01-p025.mjs',modulePath:'packages/demos/src/modules/g678-nms-l01-p025.tsx',timelinePath:'packages/demos/src/timelines/shared-nms002-l01-p025.ts',title:'Dividing Integers'},options);}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&['--check','--prepare'].includes(process.argv[2]));console.log(JSON.stringify(await build({check:process.argv.includes('--check'),prepareOnly:process.argv.includes('--prepare')}),null,2));}
