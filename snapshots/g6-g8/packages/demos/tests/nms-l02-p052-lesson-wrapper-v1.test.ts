import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const componentRoot=new URL('../../../apps/web/components/',import.meta.url);
const oldSource=readFileSync(new URL('g678-nms-l02-p051-lesson.tsx',componentRoot),'utf8');
const source=readFileSync(new URL('g678-nms-l02-p052-lesson.tsx',componentRoot),'utf8');
function declarations(text:string){
 const ast=ts.createSourceFile('lesson.tsx',text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const result=new Map<string,string>();
 for(const statement of ast.statements)if(ts.isVariableStatement(statement)){
  for(const d of statement.declarationList.declarations)result.set(d.name.getText(ast),d.initializer!.getText(ast));
 }
 return result;
}
test('P052 successor preserves every predecessor adapter declaration without editing the frozen wrapper',()=>{
 const before=declarations(oldSource),after=declarations(source);
 for(const [name,value] of before)if(name!=='adapters')assert.equal(after.get(name),value,name);
 assert.equal(after.size,before.size+1);
 const newRow="Object.freeze({animationId:'shared-nms002-l02-p052',audioEnabled:true,Component:P052PercentPractice}),";
 assert.equal(after.get('adapters')!.replace(newRow,'').replace(/\s/g,''),before.get('adapters')!.replace(/\s/g,''));
 assert.equal((after.get('adapters')!.match(/shared-nms002-l02-p052/g)||[]).length,1);
});
test('P052 host selects only the production-excluded registered adapter and retains host typography',()=>{
 const adapter=declarations(source).get('P052PercentPractice')!;
 assert.match(adapter,/process\.env\.NODE_ENV === 'production' \? \(\) => null/);
 assert.match(adapter,/import\('\.\/nms-l02-p052-source-runtime-v1'\)/);
 assert.match(adapter,/ssr:false/);
 assert.match(source,/data-p051-lesson-host data-p052-lesson-host/);
 assert.match(source,/nms-l02-p051-host-typography-v1\.css/);
 assert.match(source,/nms-l02-p052-page-view-v1\.css/);
 assert.match(source,/<G678MultiPageLessonPlayer \{\.\.\.props\} privateRuntimeAdapters=\{adapters\}/);
 assert.ok(!source.includes('P052CandidatePlayer'));
});
