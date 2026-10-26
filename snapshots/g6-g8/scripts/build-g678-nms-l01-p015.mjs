#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildNmsL1P015SourcePage} from './lib/g678-nms-l01-p015-generator-v1.mjs';
export const ID='shared-nms002-l01-p015',CALIBRATION='g678-nms-l01-p015-current-js-v1';
export const SPEC={"path": "/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p015-source-spec-v1.json", "bytes": 44817, "sha256": "dbdc3faaa8d531752d3522a0dcd52375a6d9ac539678c431ee640015e84c31a4"};
export const SOURCE={"path": "G6-G8-shared/NMS002/L1/IN/L1IN05.swf", "bytes": 115470, "sha256": "7a6122f1ce5d894c27b3703aca7e9ff332eef43b4f53d0b19c6aabea0d62835f"};
export function build(options={}){return buildNmsL1P015SourcePage({ID,CALIBRATION,SPEC,SOURCE,builderPath:'scripts/build-g678-nms-l01-p015.mjs',modulePath:'packages/demos/src/modules/g678-nms-l01-p015.tsx',timelinePath:'packages/demos/src/timelines/shared-nms002-l01-p015.ts',title:'Opposite Integers'},options);}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&['--check','--prepare'].includes(process.argv[2]));console.log(JSON.stringify(await build({check:process.argv.includes('--check'),prepareOnly:process.argv.includes('--prepare')}),null,2));}
