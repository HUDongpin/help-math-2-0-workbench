#!/usr/bin/env python3
"""Freeze FFDec SVG source assets for GEO001 L7 P003 without product admission."""

import argparse
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / 'migrations/shared-geo001-l07-p003'
AUDIT = WORK / 'audit'
SOURCE = Path('/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/GEO001/L7/RW/L7RW03.swf')
XML = AUDIT / 'movie.xml'
EXPORT = AUDIT / 'ffdec-26.2.1'
OUTPUT = AUDIT / 'source-visual-assets-v1.json'
SOURCE_SHA = 'd0e3c429a5cf15de8f89c0e627a51d990b2bfed8d532af3a84f559531b9a4deb'
XML_SHA = 'c6131380de0e00d4054cfbc89b6b98c50d0f76e0328239e201ce5a523592b35e'
FOLDERS = {
    'shape': 'source-shapes-svg-v1',
    'text': 'source-text-svg-v1',
    'button': 'source-button-svg-v1',
}
BUTTON_STATES = ('1_up.svg', '2_over.svg', '3_down.svg', '4_hittest.svg')


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def physical_file(path: Path) -> bytes:
    if path.is_symlink() or not path.is_file() or path.resolve() != path:
        raise ValueError(f'not a physical file: {path}')
    return path.read_bytes()


def source_ids(xml: bytes) -> dict[str, list[int]]:
    source = ET.fromstring(xml)
    groups = {
        'shape': {'DefineShape', 'DefineShape2', 'DefineShape3', 'DefineShape4'},
        'text': {'DefineText', 'DefineText2'},
        'button': {'DefineButton', 'DefineButton2'},
    }
    return {kind: sorted(int(tag.attrib['objectID']) for tag in source.iter()
                         if tag.tag in tags) for kind, tags in groups.items()}


def expected_files(kind: str, ids: list[int]) -> list[Path]:
    if kind == 'button':
        return [Path(f'DefineButton2_{character_id}') / state
                for character_id in ids for state in BUTTON_STATES]
    return [Path(f'{character_id}.svg') for character_id in ids]


def render() -> bytes:
    if sha(physical_file(SOURCE)) != SOURCE_SHA:
        raise ValueError('source SWF hash drift')
    xml = physical_file(XML)
    if sha(xml) != XML_SHA:
        raise ValueError('swfmill XML hash drift')
    ids = source_ids(xml)
    if {kind: len(values) for kind, values in ids.items()} != {'shape': 87, 'text': 41, 'button': 7}:
        raise ValueError('source visual character census drift')

    assets = []
    for kind, folder in FOLDERS.items():
        directory = EXPORT / folder
        if directory.is_symlink() or not directory.is_dir():
            raise ValueError(f'not a physical export directory: {directory}')
        expected = expected_files(kind, ids[kind])
        actual = sorted(path.relative_to(directory) for path in directory.rglob('*.svg'))
        if actual != sorted(expected):
            raise ValueError(f'{kind} SVG set does not match source character IDs')
        for relative in expected:
            path = directory / relative
            if any(parent.is_symlink() for parent in path.parents):
                raise ValueError(f'symlinked export parent: {path}')
            data = physical_file(path)
            if ET.fromstring(data).tag != '{http://www.w3.org/2000/svg}svg':
                raise ValueError(f'invalid SVG root: {path}')
            character_id = int(relative.parent.name.split('_')[-1]) if kind == 'button' else int(relative.stem)
            assets.append({
                'kind': kind,
                'characterId': character_id,
                'buttonState': relative.stem.split('_', 1)[1] if kind == 'button' else None,
                'path': str(path.relative_to(WORK)),
                'bytes': len(data),
                'sha256': sha(data),
                'embeddedImageDataUri': b'data:image/' in data,
            })

    result = {
        'schemaVersion': 1,
        'kind': 'g678-geo-l07-p003-source-visual-assets-v1',
        'animationId': 'shared-geo001-l07-p003',
        'sourceSwfSha256': SOURCE_SHA,
        'swfmillXmlSha256': XML_SHA,
        'exporter': {'name': 'FFDec', 'version': '26.2.1', 'format': 'SVG',
                     'categories': ['shape', 'text', 'button']},
        'counts': {'shapeCharacters': len(ids['shape']), 'textCharacters': len(ids['text']),
                   'buttonCharacters': len(ids['button']), 'svgFiles': len(assets),
                   'totalSvgBytes': sum(asset['bytes'] for asset in assets)},
        'assets': assets,
        'claimBoundary': 'Source-locked FFDec SVG exports only; symbols are not composed into a visual renderer, text semantics and button reachability are unresolved, and no original-runtime or fidelity acceptance is implied.',
    }
    return (json.dumps(result, indent=2, ensure_ascii=False) + '\n').encode()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--write', action='store_true')
    mode.add_argument('--check', action='store_true')
    parser.add_argument('--output', type=Path, default=OUTPUT)
    args = parser.parse_args()
    content = render()
    if args.write:
        with args.output.open('xb') as target:
            target.write(content)
    elif physical_file(args.output) != content:
        raise ValueError('source visual assets manifest drift')
    print(f'PASS GEO001 L7 P003 visual assets: {len(content)} bytes, SHA-256 {sha(content)}')


if __name__ == '__main__':
    main()
