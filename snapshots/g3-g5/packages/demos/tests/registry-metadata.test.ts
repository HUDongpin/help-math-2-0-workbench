import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

import {
  animationModuleRegistration,
  hasAnimationModule,
  privateRegisteredAnimationKeys,
  registeredAnimationKeys,
} from '../src/animation-registry-metadata';
import {
  animationModuleLoaders,
  animationModuleRegistrations,
} from '../src/registry.generated';

test('server registry metadata preserves every loader identity and registration scope', () => {
  assert.deepEqual(registeredAnimationKeys, Object.keys(animationModuleLoaders));
  for (const key of registeredAnimationKeys) {
    assert.equal(hasAnimationModule(key), true, key);
    assert.deepEqual(animationModuleRegistration(key), animationModuleRegistrations[key], key);
    assert.equal(Object.isFrozen(animationModuleRegistration(key)), true, key);
  }
  assert.deepEqual(privateRegisteredAnimationKeys, registeredAnimationKeys.filter(
    (key) => animationModuleRegistrations[key].scope === 'private-engineering',
  ));
  assert.equal(hasAnimationModule('not-a-module'), false);
  assert.equal(hasAnimationModule('toString'), false);
});

test('generated server metadata has no runtime imports or dynamic renderer imports', async () => {
  const source = await readFile(new URL('../src/registry-metadata.generated.ts', import.meta.url), 'utf8');
  const ast = ts.createSourceFile('registry-metadata.generated.ts', source, ts.ScriptTarget.Latest, true);
  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node)) {
      assert.equal(node.importClause?.isTypeOnly, true, 'server metadata imports must be type-only');
    }
    if (ts.isCallExpression(node)) {
      assert.notEqual(node.expression.kind, ts.SyntaxKind.ImportKeyword, 'server metadata must not load renderers');
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
});
