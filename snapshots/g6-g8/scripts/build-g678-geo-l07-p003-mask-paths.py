#!/usr/bin/env python3
"""Extract geometry-only clip paths for P003's source mask symbols."""

import argparse
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / 'migrations/shared-geo001-l07-p003'
ASSETS = WORK / 'audit/source-visual-assets-v1.json'
OUTPUT = ROOT / 'packages/demos/src/generated/geo001-l07-p003-mask-paths-v1.json'
ASSETS_SHA = '36c9a39468f5aae0f6767c80999a5c420c085b268e3ee5f5f659e9d0c0af5ce1'
SVG = '{http://www.w3.org/2000/svg}'


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def render() -> bytes:
    if ASSETS.is_symlink() or sha(ASSETS.read_bytes()) != ASSETS_SHA:
        raise ValueError('source SVG manifest drift')
    manifest = json.loads(ASSETS.read_bytes())
    masks = []
    for character_id in (4, 41):
        asset = next((entry for entry in manifest['assets']
                      if entry['kind'] == 'shape' and entry['characterId'] == character_id), None)
        if asset is None:
            raise ValueError(f'mask symbol missing: {character_id}')
        source = WORK / asset['path']
        if source.is_symlink() or not source.is_file():
            raise ValueError(f'mask SVG is not a physical file: {source}')
        data = source.read_bytes()
        if sha(data) != asset['sha256']:
            raise ValueError(f'mask SVG hash drift: {character_id}')
        root = ET.fromstring(data)
        paths = [item for item in root.iter() if item.tag == f'{SVG}path']
        if len(paths) != 1 or paths[0].attrib.get('stroke') != 'none':
            raise ValueError(f'mask requires reviewed path extraction: {character_id}')
        masks.append({'characterId': character_id, 'sourceSvgSha256': asset['sha256'],
                      'd': paths[0].attrib['d'],
                      'clipRule': paths[0].attrib.get('fill-rule', 'nonzero'),
                      'sourceFillOpacityIgnoredForGeometricClip': True})
    packet = {'schemaVersion': 1, 'kind': 'g678-geo-l07-p003-mask-paths-v1',
              'animationId': 'shared-geo001-l07-p003', 'sourceVisualAssetsSha256': ASSETS_SHA,
              'masks': masks,
              'claimBoundary': 'Source-shape path geometry for SVG clipPath only; color and fill opacity do not establish original Flash mask coverage or pixel fidelity.'}
    return (json.dumps(packet, indent=2) + '\n').encode()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--write', action='store_true')
    mode.add_argument('--check', action='store_true')
    args = parser.parse_args()
    content = render()
    if args.write:
        with OUTPUT.open('xb') as target:
            target.write(content)
    elif OUTPUT.read_bytes() != content:
        raise ValueError('mask-path packet drift')
    print(f'PASS GEO001 L7 P003 mask paths: {sha(content)}')


if __name__ == '__main__':
    main()
