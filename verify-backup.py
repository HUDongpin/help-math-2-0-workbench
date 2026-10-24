#!/usr/bin/env python3
"""Verify every captured payload file against its SHA-256 backup inventory."""
import hashlib
import json
import pathlib
import sys

root = pathlib.Path(__file__).resolve().parent
paths = set()
failures = []
total = 0
count = 0
for inventory in sorted((root / 'metadata').glob('*-files.json')):
    data = json.loads(inventory.read_text())
    for row in data['files']:
        relative = pathlib.PurePosixPath(row['path'])
        if relative.is_absolute() or '..' in relative.parts or row['path'] in paths:
            failures.append(row['path'] + ': unsafe or duplicate inventory path')
            continue
        paths.add(row['path'])
        path = root / relative
        if not path.is_file() or path.is_symlink():
            failures.append(row['path'] + ': missing or not a regular file')
            continue
        sha = hashlib.sha256()
        with path.open('rb') as stream:
            for chunk in iter(lambda: stream.read(1024 * 1024), b''):
                sha.update(chunk)
        if path.stat().st_size != row['bytes'] or sha.hexdigest() != row['sha256']:
            failures.append(row['path'] + ': size or SHA-256 mismatch')
        count += 1
        total += row['bytes']
    print(f"{data['lane']}: checked {data['fileCount']} inventory entries")
for path in (root / 'snapshots').rglob('*'):
    if path.is_file() and path.relative_to(root).as_posix() not in paths:
        failures.append(path.relative_to(root).as_posix() + ': not in inventory')
if not paths:
    failures.append('No captured files were listed')
if failures:
    for failure in failures:
        print(failure, file=sys.stderr)
    raise SystemExit(1)
print(f"PASS: {count:,} files, {total:,} bytes; every payload SHA-256 matches.")
