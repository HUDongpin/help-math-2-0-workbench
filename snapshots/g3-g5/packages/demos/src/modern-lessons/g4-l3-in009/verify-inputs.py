from pathlib import Path,PurePosixPath
import hashlib,json
B=Path(__file__).resolve().parent
ROOT=next(p for p in B.parents if (p/'scripts/inputs/typography-v1/g4-l3-in009/input-manifest.json').is_file())
INPUTS=ROOT/'scripts/inputs/typography-v1/g4-l3-in009';raw=(INPUTS/'input-manifest.json').read_bytes()
assert hashlib.sha256(raw).hexdigest()=='4a8d92eac916fbde59ac8421250f6cfca9417f8214a5f32907e7a831b8f00a3e'
MANIFEST=json.loads(raw);expected={'input-manifest.json'}
for r in MANIFEST['files']:
 q=PurePosixPath(r['path']);prefix=PurePosixPath('scripts/inputs/typography-v1/g4-l3-in009');assert not q.is_absolute() and '..' not in q.parts and q.is_relative_to(prefix)
 rel=q.relative_to(prefix).as_posix();assert rel not in expected;expected.add(rel);p=ROOT/q;assert not p.is_symlink();b=p.read_bytes();assert len(b)==r['bytes'] and hashlib.sha256(b).hexdigest()==r['sha256'],rel
actual=set()
for p in INPUTS.rglob('*'):
 assert not p.is_symlink()
 if p.is_file():actual.add(p.relative_to(INPUTS).as_posix())
 else:assert p.is_dir()
assert actual==expected
