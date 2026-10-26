#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildNmsL1P017SourcePage} from './lib/g678-nms-l01-p017-generator-v1.mjs';
export const ID='shared-nms002-l01-p017',CALIBRATION='g678-nms-l01-p017-current-js-v1';
export const SPEC={"path": "/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p017-source-spec-v1.json", "bytes": 34931, "sha256": "5e64682aa88e3551f61d53317fc170fa37de890cfdde786a2d90e96a7be7d55a"};
export const SOURCE={"path": "G6-G8-shared/NMS002/L1/IN/L1IN07.swf", "bytes": 229880, "sha256": "33b044501fcdd85755abd7a4d14e2ca93e1b9482f28c35a94bef97f9cc890e1f"};
export function build(options={}){return buildNmsL1P017SourcePage({ID,CALIBRATION,SPEC,SOURCE,builderPath:'scripts/build-g678-nms-l01-p017.mjs',modulePath:'packages/demos/src/modules/g678-nms-l01-p017.tsx',timelinePath:'packages/demos/src/timelines/shared-nms002-l01-p017.ts',title:'Absolute Value'},options);}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&['--check','--prepare'].includes(process.argv[2]));console.log(JSON.stringify(await build({check:process.argv.includes('--check'),prepareOnly:process.argv.includes('--prepare')}),null,2));}
