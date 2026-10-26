import test from 'node:test';
import assert from 'node:assert/strict';
import { p043DefinitionParts } from '../src/nms-l02-p043-definition-v1';
test('source contextual links retain exact text and first-occurrence semantics', () => {
  const text = 'A number that names part of a whole, part of a group, or part of a number.';
  const parts = p043DefinitionParts(text, 2, 'en');
  assert.equal(parts.map(p => p.text).join(''), text);
  assert.deepEqual(parts.filter(p => p.term).map(p => [p.text, p.term]), [['part', 'part'], ['whole', 'whole'], ['group', 'group']]);
});
test('Spanish contextual words resolve to the same source glossary identities', () => {
  const text = 'Fracciones especiales con 10 o una potencia de 10 partes iguales en el todo.';
  const parts = p043DefinitionParts(text, 1, 'es');
  assert.equal(parts.map(p => p.text).join(''), text);
  assert.deepEqual(parts.filter(p => p.term).map(p => p.term), ['fraction', 'power', 'whole']);
  assert.deepEqual(p043DefinitionParts('«Por cada cien», o de un total de 100.', 3, 'es').map(p => p.term), [undefined]);
  assert.throws(() => p043DefinitionParts('missing source word', 4, 'en'), /WORD_BINDING/);
});
