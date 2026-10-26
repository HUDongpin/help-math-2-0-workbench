#!/usr/bin/env python3
"""Bind P002's exact source SVG exports to SWF character coordinates."""

import argparse
import hashlib
import json
import math
from pathlib import Path
import re
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / 'migrations/shared-dat001-l02-p002/audit'
SOURCE = Path('/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/DAT001/L2/RW/L2RW02.swf')
SOURCE_SHA = 'b4a8311aff5e33cc623d6035b4a00647bac6ab9dbe0fd61394e6a6207e652a16'
XML = WORK / 'movie.xml'
XML_SHA = '1d0d14c87f96f7a501311833a90ee50257f392129bb068fb3c27fb6800cce02a'
DISPLAY = WORK / 'display-ir-v1.json'
DISPLAY_SHA = '0863407592134422329e1a9e7d22c135b58fbfbbb6f90777234d952171b05bad'
MORPHS = WORK / 'source-morph-frames-v1.json'
MORPHS_SHA = '90848d12892ab9ffaf4ea98a89c0ec3533464b0775bc2d9aec9ceff51e68b827'
EXPORT = WORK / 'ffdec-26.2.1-source-assets-v1'
EXPORT_SET_SHA = '0dfb3f8a15d1b9d1ca0be5643559d604bf7c113f57e7bb47d13e924c0e0dc6a0'
RGBA = WORK / 'ffdec-26.2.1-image-png-v1'
RGBA_SET_SHA = '9bbc5fedae90ac6e302d881ca2c5412dfe0bcddbc5d76f5bff9ff423306275e8'
OUTPUTS = (WORK / 'source-visual-layout-v1.json',
           ROOT / 'packages/demos/src/generated/dat001-l02-p002-visual-layout-v1.json')
SVG = '{http://www.w3.org/2000/svg}'
MATRIX = re.compile(r'^matrix\(1\.0, 0\.0, 0\.0, 1\.0, ([-\d.]+), ([-\d.]+)\)$')


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def pinned(path: Path, expected: str) -> bytes:
    if path.is_symlink() or not path.is_file() or path.resolve() != path:
        raise ValueError(f'nonphysical source file: {path}')
    data = path.read_bytes()
    if sha(data) != expected:
        raise ValueError(f'source hash drift: {path}')
    return data


def file_set(directory: Path, expected_count: int, expected_sha: str) -> dict[str, dict]:
    if directory.is_symlink() or not directory.is_dir() or directory.resolve() != directory:
        raise ValueError(f'nonphysical export directory: {directory}')
    files = {}
    lines = []
    for path in directory.rglob('*'):
        if path.is_symlink():
            raise ValueError(f'unexpected export path: {path}')
        if path.is_dir():
            continue
        if not path.is_file():
            raise ValueError(f'unexpected export path: {path}')
        relative = str(path.relative_to(directory))
        data = path.read_bytes()
        item = {'path': str(path.relative_to(ROOT)), 'sha256': sha(data),
                'bytes': len(data), 'data': data}
        files[relative] = item
        lines.append(f"{relative}\t{len(data)}\t{item['sha256']}")
    if len(files) != expected_count or sha(('\n'.join(sorted(lines)) + '\n').encode()) != expected_sha:
        raise ValueError(f'export file-set drift: {directory}')
    return files


def svg_geometry(data: bytes) -> tuple[float, float, float, float]:
    root = ET.fromstring(data)
    if root.tag != f'{SVG}svg':
        raise ValueError('non-SVG visual export')
    group = next((child for child in root if child.tag == f'{SVG}g'), None)
    match = MATRIX.fullmatch(group.attrib.get('transform', '')) if group is not None else None
    if match is None:
        raise ValueError('unsupported FFDec SVG origin')
    return (float(root.attrib['width'].removesuffix('px')),
            float(root.attrib['height'].removesuffix('px')),
            float(match[1]), float(match[2]))


def render() -> bytes:
    pinned(SOURCE, SOURCE_SHA)
    xml = ET.fromstring(pinned(XML, XML_SHA))
    display = json.loads(pinned(DISPLAY, DISPLAY_SHA))
    morphs = json.loads(pinned(MORPHS, MORPHS_SHA))
    exports = file_set(EXPORT, 115, EXPORT_SET_SHA)
    rgba = file_set(RGBA, 4, RGBA_SET_SHA)
    if (display['sourceSwfSha256'] != SOURCE_SHA or
        morphs['sourceSwfSha256'] != SOURCE_SHA or
        {item['characterId'] for item in morphs['assets']} != {103, 107, 109, 111}):
        raise ValueError('cross-artifact source drift')
    morph_by_id = {id: [] for id in (103, 107, 109, 111)}
    for item in morphs['assets']:
        morph_by_id[item['characterId']].append(item)
    symbols = []
    for tag in xml.iter():
        if tag.tag not in ('DefineShape', 'DefineShape2', 'DefineShape3', 'DefineText',
                           'DefineMorphShape'):
            continue
        character_id = int(tag.attrib['objectID'])
        kind = 'morph' if tag.tag == 'DefineMorphShape' else (
            'text' if tag.tag == 'DefineText' else 'shape')
        if kind == 'morph':
            states = []
            measured = None
            for item in sorted(morph_by_id[character_id], key=lambda value: value['ratio']):
                path = WORK / 'source-morph-frames-v1' / item['file']
                geometry = svg_geometry(pinned(path, item['sha256']))
                if measured is not None and measured != geometry:
                    raise ValueError(f'morph SVG bounds drift: {character_id}')
                measured = geometry
                states.append({'ratio': item['ratio'], 'path': str(path.relative_to(ROOT)),
                               'sha256': item['sha256']})
            if measured is None:
                raise ValueError(f'morph states missing: {character_id}')
            width, height, shift_x, shift_y = measured
            bounds = [-shift_x, -shift_y, width - shift_x, height - shift_y]
            symbols.append({'characterId': character_id, 'kind': kind, 'boundsPixels': bounds,
                            'boundsAuthority': 'FFDec morph SVG envelope only', 'states': states})
            continue
        folder = 'texts' if kind == 'text' else 'shapes'
        item = exports[f'{folder}/{character_id}.svg']
        bounds_tag = tag.find('bounds/Rectangle')
        if bounds_tag is None:
            raise ValueError(f'no SWF bounds: {character_id}')
        bounds = [int(bounds_tag.attrib[name]) / 20
                  for name in ('left', 'top', 'right', 'bottom')]
        width, height, shift_x, shift_y = svg_geometry(item['data'])
        expected = (bounds[2] - bounds[0], bounds[3] - bounds[1], -bounds[0], -bounds[1])
        if not all(math.isclose(actual, wanted, rel_tol=0, abs_tol=1e-9)
                   for actual, wanted in zip((width, height, shift_x, shift_y), expected)):
            raise ValueError(f'SWF/FFDec bounds mismatch: {character_id}')
        symbols.append({'characterId': character_id, 'kind': kind, 'boundsPixels': bounds,
                        'boundsAuthority': 'SWF DefineShape/DefineText twips',
                        'path': item['path'], 'sha256': item['sha256'],
                        'embeddedImageDataUri': b'data:image/' in item['data']})
    symbols.sort(key=lambda item: item['characterId'])
    if len(symbols) != 107 or len({item['characterId'] for item in symbols}) != 107:
        raise ValueError('visual symbol census drift')
    placed = {int(event['attributes']['objectID']) for domain in display['domains'].values()
              for event in domain['displayEvents'] if event['op'] == 'place'
              and 'objectID' in event['attributes']}
    if placed - {41, 49, 53, 113, 116} != {item['characterId'] for item in symbols}:
        raise ValueError('unbound placed visual character')
    bitmap_ids = sorted(int(tag.attrib['objectID']) for tag in xml.iter('DefineBitsJPEG3'))
    if bitmap_ids != [2, 5, 6, 7] or placed.intersection(bitmap_ids):
        raise ValueError('direct bitmap placement drift')
    bitmap_evidence = [{'characterId': id,
                        'path': rgba[f'{id}.png']['path'],
                        'sha256': rgba[f'{id}.png']['sha256'],
                        'bytes': rgba[f'{id}.png']['bytes']}
                       for id in bitmap_ids]
    result = {
        'schemaVersion': 1, 'kind': 'g678-dat-l02-p002-source-visual-layout-v1',
        'animationId': 'shared-dat001-l02-p002', 'sourceSwfSha256': SOURCE_SHA,
        'sourceXmlSha256': XML_SHA, 'displayIrSha256': DISPLAY_SHA,
        'morphManifestSha256': MORPHS_SHA, 'ffdecExportSetSha256': EXPORT_SET_SHA,
        'rgbaExportSetSha256': RGBA_SET_SHA,
        'stage': {'width': 800, 'height': 600, 'fps': 12},
        'counts': {'visualSymbols': 107, 'sourceMorphStates': len(morphs['assets']),
                   'bitmapDefinitionsNotDirectlyPlaced': 4},
        'symbols': symbols, 'bitmapEvidence': bitmap_evidence,
        'claimBoundary': ('Exact SWF bounds for shape/text and FFDec envelopes for morphs. '
                          'Source display geometry is not nested visual composition, bitmap/alpha '
                          'acceptance, original-runtime fidelity, responsive typography, or My Lesson admission.'),
    }
    return (json.dumps(result, indent=2) + '\n').encode()


def write_outputs(data: bytes, paths: tuple[Path, Path] = OUTPUTS) -> None:
    if any(path.exists() or path.is_symlink() for path in paths):
        raise FileExistsError('visual layout output already exists')
    for path in paths:
        with path.open('xb') as target:
            target.write(data)


def check_outputs(data: bytes, paths: tuple[Path, Path] = OUTPUTS) -> None:
    if any(path.is_symlink() or path.read_bytes() != data for path in paths):
        raise ValueError('visual layout output drift')


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--write', action='store_true')
    mode.add_argument('--check', action='store_true')
    args = parser.parse_args()
    data = render()
    if args.write:
        write_outputs(data)
    else:
        check_outputs(data)
    print(f'PASS DAT001 L2 P002 visual layout: {len(data)} bytes, SHA-256 {sha(data)}')


if __name__ == '__main__':
    main()
