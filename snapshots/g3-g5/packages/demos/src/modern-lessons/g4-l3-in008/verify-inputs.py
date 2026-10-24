from pathlib import Path,PurePosixPath
import json,hashlib
DIRECTORY=Path(__file__).resolve().parent
ROOT=next(p for p in DIRECTORY.parents if (p/'scripts/inputs/typography-v1/g4-l3-in008/input-manifest.json').is_file())
INPUTS=ROOT/'scripts/inputs/typography-v1/g4-l3-in008'
raw=(INPUTS/'input-manifest.json').read_bytes()
assert hashlib.sha256(raw).hexdigest()=='0d5564e460412390eda1666100b48575577dae1a3a8b69c685d9d46a7b79fd02','IN008 input manifest drift'
manifest=json.loads(raw)
assert manifest['sourceSwfSha256']=='5462ead920862a48ddbacf7be068f9cadf9e509e7032a2dbbb2659a28e08757f'
assert manifest['existingRepositoryInputs']==[]
expected={'input-manifest.json'}
for row in manifest['files']:
 relative=PurePosixPath(row['path']);prefix=PurePosixPath('scripts/inputs/typography-v1/g4-l3-in008')
 assert not relative.is_absolute() and '..' not in relative.parts and relative.is_relative_to(prefix),'Invalid input path'
 member=relative.relative_to(prefix).as_posix();assert member not in expected,'Duplicate input path';expected.add(member)
 p=ROOT/relative;b=p.read_bytes()
 assert len(b)==row['bytes']and hashlib.sha256(b).hexdigest()==row['sha256'],'IN008 input drift: '+member
actual=set()
for p in INPUTS.rglob('*'):
 assert not p.is_symlink(),'IN008 input symlink forbidden'
 if p.is_file():actual.add(p.relative_to(INPUTS).as_posix())
 else:assert p.is_dir(),'IN008 special input forbidden'
assert actual==expected,'IN008 exact input membership mismatch'
