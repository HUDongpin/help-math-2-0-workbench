#!/usr/bin/env python3
"""Freeze source-derived FFDec SVG shapes and decorative text for P002 audit."""

import argparse
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
SOURCE = Path('/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/GEO001/L6/RW/L6RW02.swf')
XML = ROOT / 'migrations/shared-geo001-l06-p002/audit/movie.xml'
FFDEC = Path('/Volumes/American Dream/hudongpin/geo-l06-p002-vectors-audit-HMb8qM')
OUTPUT = ROOT / 'migrations/shared-geo001-l06-p002/audit/vector-assets-v1'
SOURCE_SHA = '3f340d0201e0f4eed1c8e73d364641d5de4b625e64c33680059842b523002c44'
XML_SHA = '241debfeeb1def99d6eebc5f7b8b3cc2d0a8966ca50fa6dc627b7c0bdd491a73'
DECORATIVE_TEXT_IDS = {8, 11, 24, 25, 28, 30, 33}
SVG_NS = '{http://www.w3.org/2000/svg}'
XLINK_HREF = '{http://www.w3.org/1999/xlink}href'


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def physical(path: Path, expected: str | None = None) -> bytes:
    if path.is_symlink() or not path.is_file() or path.resolve() != path:
        raise ValueError(f'not a physical file: {path}')
    data = path.read_bytes()
    if expected is not None and sha(data) != expected:
        raise ValueError(f'source hash drift: {path}')
    return data


def svg_geometry(data: bytes, bounds: ET.Element) -> dict:
    root = ET.fromstring(data)
    if root.tag != SVG_NS + 'svg':
        raise ValueError('not an SVG export')
    for element in root.iter():
        if element.tag in {SVG_NS + 'script', SVG_NS + 'foreignObject'}:
            raise ValueError('active SVG content is not accepted')
        for attr in ('href', XLINK_HREF):
            href = element.get(attr)
            if href is not None and not (href.startswith('#') or href.startswith('data:image/')):
                raise ValueError('external SVG reference is not accepted')
    rectangle = bounds.find('Rectangle')
    if rectangle is None:
        raise ValueError('missing source symbol bounds')
    left, right, top, bottom = [int(rectangle.get(key)) for key in ('left', 'right', 'top', 'bottom')]
    width, height = (right - left) / 20, (bottom - top) / 20
    export_width = float(root.get('width').removesuffix('px'))
    export_height = float(root.get('height').removesuffix('px'))
    if abs(width - export_width) > 1 or abs(height - export_height) > 1:
        raise ValueError(f'SVG/source bounds disagree: {width}x{height} vs {export_width}x{export_height}')
    return {'x': left / 20, 'y': top / 20, 'width': export_width, 'height': export_height}


def build() -> tuple[dict[str, bytes], bytes]:
    physical(SOURCE, SOURCE_SHA)
    xml_bytes = physical(XML, XML_SHA)
    tree = ET.fromstring(xml_bytes)
    shapes = [item for item in tree.iter() if item.tag in ('DefineShape', 'DefineShape2', 'DefineShape3', 'DefineShape4')]
    texts = [item for item in tree.iter() if item.tag in ('DefineText', 'DefineText2')]
    if len(shapes) != 200 or len(texts) != 16:
        raise ValueError('source symbol census drift')
    items: dict[str, bytes] = {}
    records = []
    for kind, symbols in [('shape', shapes), ('decorative-text', texts)]:
        for symbol in symbols:
            character_id = int(symbol.get('objectID'))
            if kind == 'decorative-text' and character_id not in DECORATIVE_TEXT_IDS:
                continue
            relative = f'{"shapes" if kind == "shape" else "texts"}/{character_id}.svg'
            origin = FFDEC / (f'shapes/{character_id}.svg' if kind == 'shape' else f'{character_id}.svg')
            data = physical(origin)
            geometry = svg_geometry(data, symbol.find('bounds'))
            items[relative] = data
            records.append({'kind': kind, 'characterId': character_id, 'path': relative,
                            'bytes': len(data), 'sha256': sha(data), 'geometry': geometry})
    if len(items) != 207 or len({entry['characterId'] for entry in records}) != 207:
        raise ValueError('asset membership drift')
    records.sort(key=lambda item: (item['kind'], item['characterId']))
    manifest = {'schemaVersion': 1, 'kind': 'g678-source-vector-audit-assets-v1',
                'animationId': 'shared-geo001-l06-p002', 'sourceSwfSha256': SOURCE_SHA,
                'swfmillXmlSha256': XML_SHA, 'ffdecVersion': '26.2.1',
                'ffdecAuditSource': str(FFDEC), 'records': records,
                'teachingTextPolicy': 'Source teaching text 209,215,219,221,222,226,227,228,229 is deliberately excluded; use native semantic text.',
                'claimBoundary': 'Unregistered source-derived visual audit assets only; no host, fidelity, license-distribution, audio or review acceptance.'}
    return items, (json.dumps(manifest, indent=2, ensure_ascii=False) + '\n').encode()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--write', action='store_true')
    mode.add_argument('--check', action='store_true')
    parser.add_argument('--output', type=Path, default=OUTPUT)
    args = parser.parse_args()
    items, manifest = build()
    target = args.output.resolve()
    if args.write:
        target.mkdir()
        for relative, data in items.items():
            path = target / relative
            path.parent.mkdir(exist_ok=True)
            with path.open('xb') as file:
                file.write(data)
        with (target / 'manifest.json').open('xb') as file:
            file.write(manifest)
    else:
        expected = set(items) | {'manifest.json'}
        actual = {str(path.relative_to(target)) for path in target.rglob('*') if path.is_file()}
        if actual != expected or physical(target / 'manifest.json') != manifest:
            raise ValueError('vector asset manifest or membership drift')
        for relative, data in items.items():
            if physical(target / relative) != data:
                raise ValueError(f'vector asset drift: {relative}')
    print(f'PASS GEO001 L6 P002 vector audit: {len(items)} assets, manifest SHA-256 {sha(manifest)}')


if __name__ == '__main__':
    main()
