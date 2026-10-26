#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import sharp from 'sharp';
import {file,inventory,enforceLimit,GATES} from './g678-nms-l01-p044-extract-visual-slice.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const RUN='work/g678-shared-page-factory/g678-nms-l01-p044-visual-projection-v1';
const RAW='work/g678-shared-page-factory/g678-nms-l01-p044-visual-slice-v2';
const PYTHON='/opt/homebrew/Cellar/python@3.14/3.14.7/Frameworks/Python.framework/Versions/3.14/bin/python3.14';
const PARSER='scripts/g678-nms-l01-p044-project-visual-slice.py';
export async function project(){const p=await promisify(execFile)(PYTHON,[PARSER],{cwd:ROOT,maxBuffer:4*1024*1024});assert.equal(p.stderr,'');return JSON.parse(p.stdout);}
export async function build(){const inputs=await Promise.all([`${RAW}/run.json`,PARSER,'scripts/g678-nms-l01-p044-build-visual-slice.mjs','scripts/g678-nms-l01-p044-extract-visual-slice.mjs',PYTHON].map(file));
  const value=await project(),{svgPointProjections,...ir}=value, out=path.join(ROOT,RUN);await mkdir(out);const save=(p,b)=>writeFile(path.join(out,p),b,{flag:'wx',mode:0o444});
  await save('source-projection.json',`${JSON.stringify(ir)}\n`);
  for(const[frame,svg]of Object.entries(svgPointProjections)){await save(`source-root-main-${frame}.svg`,svg);await save(`source-root-main-${frame}.png`,await sharp(Buffer.from(svg)).png().toBuffer());}
  const outputs=await inventory(out),size=enforceLimit(outputs);assert.deepEqual(await Promise.all(inputs.map(i=>file(i.path))),inputs);
  const receipt={schemaVersion:1,artifactType:'p044-selected-source-root-projection-not-renderer',inputs,inputsUnchanged:true,outputs,size,
    rawExtraction:`${RAW}/run.json`,sourceSvgPointFrames:Object.keys(svgPointProjections).map(Number),sharpVersions:sharp.versions,
    geometry:{rootMainTranslation:ir.rootMainNativeTranslation,mainExportInternalOrigin:ir.mainExportInternalOrigin,canvasStageRenderOffset:ir.canvasStageRenderOffset},
    scope:ir.scope,normalization:ir.normalization,emptySpriteDefinition:ir.emptySpriteDefinition,gates:GATES,
    acceptance:'Raw selected source composition, no AS execution, no child lifecycle, no maintained Renderer or MyLesson. Not a full759frame implementation.'};
  await save('run.json',`${JSON.stringify(receipt,null,2)}\n`);return {receipt:await file(`${RUN}/run.json`),size};}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert.equal(process.argv.length,2);console.log(JSON.stringify(await build(),null,2));}
