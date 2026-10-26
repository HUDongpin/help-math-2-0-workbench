import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const pairs=[
 {old:'packages/demos/tests/nms-l02-p044-audio-pcm-v1.test.ts',next:'packages/demos/tests/nms-l02-p044-audio-pcm-v2.test.ts',freeze:'catalog/product-bridge-calibrations/g678-nms-l02-p044-native-partition-practice-current-js-v1-compile-v5.json',before:'let last=P044_WRONG_WINDOWS[0].start',after:'let last:number=P044_WRONG_WINDOWS[0].start'},
 {old:'packages/demos/tests/nms-l02-p046-module-v1.test.ts',next:'packages/demos/tests/nms-l02-p046-module-v2.test.ts',freeze:'catalog/product-bridge-calibrations/g678-nms-l02-p046-native-equivalent-fraction-current-js-v1-compile-v4.json',before:'getSnapshot(state)',after:"getSnapshot(state,{frame:706,frameDomain:'sprite-205',scenario:'source-inspection',lang:'en',seed:0})"}
];
const config=ts.readConfigFile(path.join(root,'packages/demos/tsconfig.current-tests-v1.json'),ts.sys.readFile);assert.equal(config.error,undefined);
const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,path.join(root,'packages/demos'));
assert.equal(parsed.errors.length,0);assert.equal(parsed.options.strict,true);
const base=ts.readConfigFile(path.join(root,'packages/demos/tsconfig.json'),ts.sys.readFile);
const baseParsed=ts.parseJsonConfigFileContent(base.config,ts.sys,path.join(root,'packages/demos'));
const historical=new Set(pairs.map(p=>path.join(root,p.old)));
assert.deepEqual([...parsed.fileNames].sort(),baseParsed.fileNames.filter(p=>!historical.has(p)).sort(),'No other file may be excluded');
assert.deepEqual(parsed.options,baseParsed.options,'Compiler strictness and options must be identical');
for(const p of pairs){
 const old=read(p.old),next=read(p.next),freeze=JSON.parse(read(p.freeze));
 const pin=[...freeze.inputs,...freeze.outputs].find(x=>x.path===p.old);assert.ok(pin,p.old);
 assert.equal(crypto.createHash('sha256').update(old).digest('hex'),pin.sha256);
 assert.ok(old.includes(p.before));assert.equal(next.split('\n').slice(1).join('\n'),old.replace(p.before,p.after),'No assertions removed or changed');
 assert.ok(!parsed.fileNames.includes(path.join(root,p.old)));assert.ok(parsed.fileNames.includes(path.join(root,p.next)));
}
console.log(JSON.stringify({passed:true,frozenHistoricalFiles:2,exactAssertionPreservingSuccessors:2,strict:true,scope:'Only historical static-type inputs superseded; both v1 and v2 remain in runtime test glob'}));
