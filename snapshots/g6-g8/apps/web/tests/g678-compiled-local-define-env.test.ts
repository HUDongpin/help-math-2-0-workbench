import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const {getDefineEnv} = require('next/dist/build/define-env');
const {defaultConfig} = require('next/dist/server/config-shared');
const environment = {
  NODE_ENV: 'production', HELP_MATH_G678_COMPILED_LOCAL_QA: '1',
  HELP_MATH_G678_LOCAL_PREVIEW: '1', HELP_MATH_G678_LOCAL_PREVIEW_BIND: '127.0.0.1',
};
const origin = 'http://127.0.0.1:3331';
const id = 'shared-nms002-l07-p005';
const doc = new URL(`${origin}/en/migration-status/g678-hfr/${id}/registered`);
const data = new URL(`${origin}/flash-assets/g678-local/${id}/hfr/${id}.data.json`);
const headers = () => new Headers({host: '127.0.0.1:3331', referer: doc.href,
  'sec-fetch-site': 'same-origin', 'sec-fetch-mode': 'cors', 'sec-fetch-dest': 'empty'});

/** Evaluate only the two policy modules after the installed Next Define mapping.
 * This is not an application build; it verifies default compiled bytes cannot
 * be reopened by changing the serving process environment after compilation. */
function compiledPolicies(flag: '0' | '1', runtime: Record<string, string | undefined>) {
  const defines = getDefineEnv({
    isTurbopack: false, dev: false, isClient: false, isEdgeServer: false, isNodeServer: true,
    projectPath: process.cwd(), distDir: '.next-g678-test', hasRewrites: false,
    config: {...defaultConfig, env: {HELP_MATH_G678_COMPILED_LOCAL_QA: flag}},
  });
  assert.equal(defines['process.env.NODE_ENV'], '"production"');
  assert.equal(defines['process.env.HELP_MATH_G678_COMPILED_LOCAL_QA'], JSON.stringify(flag));
  assert.equal(defines['process.env.VERCEL'], undefined);
  assert.equal(defines['process.env.VERCEL_ENV'], undefined);
  const processValue = {env: runtime};
  function evaluate(name: string, policy?: Record<string, (...args: any[]) => any>) {
    const source = readFileSync(new URL(`../lib/${name}.ts`, import.meta.url), 'utf8');
    const output = ts.transpileModule(source, {
      fileName: `${name}.ts`,
      compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
      transformers: {before: [context => sourceFile => {
        const visit: ts.Visitor = node => {
          if (ts.isPropertyAccessExpression(node)) {
            const key = node.getText(sourceFile);
            if (key === 'process.env.NODE_ENV' || key === 'process.env.HELP_MATH_G678_COMPILED_LOCAL_QA') {
              return ts.factory.createStringLiteral(JSON.parse(defines[key]));
            }
          }
          return ts.visitEachChild(node, visit, context);
        };
        return ts.visitNode(sourceFile, visit) as ts.SourceFile;
      }]},
    }).outputText;
    const result: Record<string, (...args: any[]) => any> = {};
    vm.runInNewContext(output, {exports: result, process: processValue, URL, Headers, Response,
      require: (specifier: string) => {
        assert.equal(specifier, './g678-preview-policy');
        assert.ok(policy); return policy;
      },
    }, {filename: `${name}.compiled-test.js`});
    return result;
  }
  const policy = evaluate('g678-preview-policy');
  return {policy, access: evaluate('hfr-local-access', policy), processValue};
}

test('default compiled 0 cannot be reopened by runtime flag 1 or raw process.env forwarding', () => {
  for (const runtimeNodeEnv of ['production', 'development']) {
    const {policy, access, processValue} = compiledPolicies('0', {...environment, NODE_ENV: runtimeNodeEnv});
    for (const input of [undefined, processValue.env]) {
      assert.equal(policy.isG678CompiledLocalQaEnabled!(input), false);
      assert.equal(policy.isG678LocalPreviewEnabled!(input), false);
      assert.equal(policy.isG678LocalPreviewRequestUrl!(doc, input), false);
      assert.equal(access.hfrDocumentRequest!(doc, headers(), 'GET', input), null);
      assert.equal(access.hfrAssetRequest!(data, headers(), 'GET', input), null);
    }
  }
});

test('compiled local 1 admits the exact local request and still reads live cloud markers', () => {
  const compiled = compiledPolicies('1', {...environment});
  assert.equal(compiled.policy.isG678CompiledLocalQaEnabled!(), true);
  assert.ok(compiled.access.hfrDocumentRequest!(doc, headers(), 'GET'));
  assert.ok(compiled.access.hfrAssetRequest!(data, headers(), 'GET'));
  for (const key of ['VERCEL', 'VERCEL_ENV']) {
    const {policy, access} = compiledPolicies('1', {...environment, [key]: 'preview'});
    assert.equal(policy.isG678CompiledLocalQaEnabled!(), false);
    assert.equal(policy.isG678LocalPreviewEnabled!(), false);
    assert.equal(access.hfrDocumentRequest!(doc, headers(), 'GET'), null);
    assert.equal(access.hfrAssetRequest!(data, headers(), 'GET'), null);
  }
});

test('compiled registered QA never admits unregistered candidate documents through a runtime development flag',()=>{
  const candidate=new URL(doc.href.replace('/registered','/candidate'));
  for(const runtimeNodeEnv of ['production','development']) {
    const {access,processValue}=compiledPolicies('1',{...environment,NODE_ENV:runtimeNodeEnv});
    for(const input of [undefined,processValue.env]) {
      assert.ok(access.hfrDocumentRequest!(doc,headers(),'GET',input));
      assert.equal(access.hfrDocumentRequest!(candidate,headers(),'GET',input),null);
    }
  }
});
