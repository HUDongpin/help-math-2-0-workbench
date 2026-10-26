import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {G678_INSTRUCTIONAL_BEHAVIOR_DELTA_FRAGMENT, G678_INSTRUCTIONAL_PREDECESSOR_FRAGMENT}
  from '../lib/g678-instructional-behavior-delta-authority.server';
import {G678_MATH_COMPANION_AUTHORITY, G678_MATH_COMPANION_SUFFIXES,
  validateG678MathCompanionAuthority} from '../lib/g678-math-companion-authority.server';
const read = (file: {path: string; bytes: number; sha256: string}) => ({...file,
  value: JSON.parse(readFileSync(new URL(`../../../${file.path}`, import.meta.url), 'utf8'))});
const fixture = () => ({authority: read(G678_MATH_COMPANION_AUTHORITY),
  dual: read(G678_INSTRUCTIONAL_BEHAVIOR_DELTA_FRAGMENT), original: read(G678_INSTRUCTIONAL_PREDECESSOR_FRAGMENT)});

test('exact companion authority proposes only two slots and retains21 original source runs', () => {
  const f = fixture(), result = validateG678MathCompanionAuthority(f.authority, f.dual, f.original);
  assert.equal(result.sourceRuns.size, 23); assert.equal(result.proposedPresentations.size, 2);
  assert.equal([...result.sourceRuns.values()].filter(run => run.sha256 === f.authority.value.companionCompilerRun.sha256).length, 2);
  assert.equal([...result.sourceRuns.values()].filter(run => run.sha256 === f.original.value.compilerRun.sha256).length, 21);
  for (const [id, suffix] of Object.entries(G678_MATH_COMPANION_SUFFIXES))
    assert.deepEqual(result.proposedPresentations.get(id), {pageInteractionCompanionTargetIdSuffix: suffix});
});

test('borrowed wrappers, capabilities, wrong slots, crossed lineage and acceptance claims cannot change the exact authority', () => {
  for (const mutate of [(f: ReturnType<typeof fixture>) => {
    const current = f.authority.value.entries.find((e: any) => e.key.endsWith('p034'));
    const old = f.dual.value.entries.find((e: any) => e.key.endsWith('p034'));
    current.module = old.module; current.moduleFile = old.moduleFile; current.timeline = old.timeline;
  }, (f: ReturnType<typeof fixture>) => {f.authority.value.entries[0].module = 'another';},
  (f: ReturnType<typeof fixture>) => {f.authority.value.proposedCompanionDescriptors[1].activated = true;},
  (f: ReturnType<typeof fixture>) => {f.authority.value.companionCompilerRun = f.authority.value.compilerRun;},
  (f: ReturnType<typeof fixture>) => {f.authority.value.entries.find((e: any) => e.key.endsWith('p044')).runtimeContract.lessonHostCapabilities.push('audio');},
  (f: ReturnType<typeof fixture>) => {f.authority.value.productCalibrationPassed = true;}]) {
    const f = fixture(); mutate(f);
    assert.throws(() => validateG678MathCompanionAuthority(f.authority, f.dual, f.original), /MATH_COMPANION_AUTHORITY_INVALID/u);
    const bytes = Buffer.from(JSON.stringify(f.authority.value, null, 2) + '\n');
    f.authority.bytes = bytes.length; f.authority.sha256 = createHash('sha256').update(bytes).digest('hex');
    assert.throws(() => validateG678MathCompanionAuthority(f.authority, f.dual, f.original), /authority file binding/u);
  }
});

test('both exact predecessor witnesses are mandatory and a same-bytes alias is rejected', () => {
  const f = fixture();
  assert.throws(() => validateG678MathCompanionAuthority(f.authority, undefined, f.original), /dual predecessor/u);
  assert.throws(() => validateG678MathCompanionAuthority(f.authority, f.dual, undefined), /BEHAVIOR_DELTA_INVALID/u);
  assert.throws(() => validateG678MathCompanionAuthority({...f.authority, path: 'catalog/copied.json'}, f.dual, f.original), /authority file binding/u);
  assert.throws(() => validateG678MathCompanionAuthority(f.authority, {...f.dual, value: {}}, f.original), /BEHAVIOR_DELTA_INVALID/u);
});

test('all binding field insertion orders are accepted for authority and dual without relaxing their exact fields', () => {
  const permutations = (keys: string[]): string[][] => keys.length === 0 ? [[]]
    : keys.flatMap((key, index) => permutations(keys.filter((_, i) => i !== index)).map(rest => [key, ...rest]));
  const f = fixture(), orders = permutations(['path', 'bytes', 'sha256', 'value']);
  assert.equal(orders.length, 24);
  const reordered = (binding: typeof f.authority, order: string[]) =>
    Object.fromEntries(order.map(key => [key, binding[key as keyof typeof binding]])) as typeof f.authority;
  for (const authorityOrder of orders) for (const dualOrder of orders) {
    const result = validateG678MathCompanionAuthority(reordered(f.authority, authorityOrder), reordered(f.dual, dualOrder), f.original);
    assert.equal(result.sourceRuns.size, 23); assert.equal(result.proposedPresentations.size, 2);
  }
});

test('order-independent binding comparison still rejects aliases, altered hashes or sizes and extra enumerable fields', () => {
  for (const field of ['authority', 'dual'] as const) for (const change of [
    {path: 'catalog/product-bridge-calibrations/copied-authority.json'}, {bytes: 1}, {sha256: '0'.repeat(64)},
    {unreviewed: true}, {unreviewed: undefined},
  ]) {
    const f = fixture();
    f[field] = {bytes: f[field].bytes, path: f[field].path, sha256: f[field].sha256, value: f[field].value, ...change};
    assert.throws(() => validateG678MathCompanionAuthority(f.authority, f.dual, f.original),
      /MATH_COMPANION_AUTHORITY_INVALID/u);
  }
});
