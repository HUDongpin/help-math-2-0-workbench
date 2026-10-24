from pathlib import Path
import json,hashlib
DIRECTORY=Path(__file__).resolve().parent
ROOT=next(p for p in DIRECTORY.parents if (p/'scripts/inputs/typography-v1/g4-l3-in007/input-manifest.json').is_file())
INPUTS=ROOT/'scripts/inputs/typography-v1/g4-l3-in007'
raw=(INPUTS/'input-manifest.json').read_bytes()
assert hashlib.sha256(raw).hexdigest()=='a6df2282ebce1324ef547fbaf7aa909609c4df2357c47b7ea41ab7ccbbcc5d09','Input manifest drift'
manifest=json.loads(raw)
for row in manifest['files']+manifest['existingRepositoryInputs']:
 b=(ROOT/row['path']).read_bytes()
 assert len(b)==row['bytes'] and hashlib.sha256(b).hexdigest()==row['sha256'],'Source input drift: '+row['path']
