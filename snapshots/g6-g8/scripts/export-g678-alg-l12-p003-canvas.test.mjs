import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {Script} from 'node:vm';

const root = new URL('../', import.meta.url);
const script = new URL('./export-g678-alg-l12-p003-canvas.mjs', import.meta.url);
const output = new URL('migrations/shared-alg001-l12-p003/audit/ffdec-26.2.1-canvas-v1/',root);
const sourceRoot = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const run = (args, source = sourceRoot) => spawnSync(process.execPath,[fileURLToPath(script),...args],{
  cwd:root,env:{...process.env,HELP_MATH_G678_SOURCE_ROOT:source},encoding:'utf8',timeout:30000,
});
test('P003 extraction hashes all ten outputs and rejects alternate source roots',()=>{
  const result = run(['--check']);
  assert.equal(result.status,0,result.stderr);
  assert.equal(JSON.parse(result.stdout).files,10);
  assert.notEqual(run(['--check'],'/not-source').status,0);
});
test('P003 refuses to overwrite existing extraction evidence',()=>{
  const receipt = new URL('extraction-receipt.json',output);
  const before = readFileSync(receipt);
  const result = run(['--export']);
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/EEXIST/);
  assert(readFileSync(receipt).equals(before));
});
test('P003 exported definitions preserve root and three sprite domains, not a runnable admission',()=>{
  for (const [file,name,count] of [['frames/frames.html','main',10],['sprites/DefineSprite_22/frames.html','sprite22',1],['sprites/DefineSprite_164/frames.html','sprite164',1008],['sprites/DefineSprite_166/frames.html','sprite166',1]]) {
    const html = readFileSync(new URL(file,output),'utf8').replace(/\r\n?/g,'\n');
    const definitions = html.slice(html.indexOf('var scalingGrids = {};'),html.indexOf('\nvar frame = -1;'));
    new Script(definitions);
    assert.match(definitions,new RegExp(`function ${name}\\(ctx,ctrans,frame,ratio,time\\)\\{[\\s\\S]*?var frame_cnt = ${count};`));
    if(name==='main') for(const placed of ['text2','sprite164','sprite166','shape167']) assert(definitions.includes(`place("${placed}"`));
    if(name==='sprite164') {
      assert(definitions.includes('place("sprite22"'));
      for(const id of [150,151,156,157,161,162]) assert(definitions.includes(`function button${id}(`));
    }
  }
});
