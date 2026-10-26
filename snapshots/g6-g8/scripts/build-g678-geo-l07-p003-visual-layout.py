#!/usr/bin/env python3
"""Bind P003's source SVGs to SWF character origins for frame composition."""

import argparse
import hashlib
import json
import math
from pathlib import Path
import re
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / 'migrations/shared-geo001-l07-p003'
AUDIT = WORK / 'audit'
SOURCE = Path('/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/GEO001/L7/RW/L7RW03.swf')
XML = AUDIT / 'movie.xml'
ASSETS = AUDIT / 'source-visual-assets-v1.json'
DISPLAY = AUDIT / 'display-list-events-v2.json'
OUTPUT = AUDIT / 'source-visual-layout-v1.json'
SOURCE_SHA = 'd0e3c429a5cf15de8f89c0e627a51d990b2bfed8d532af3a84f559531b9a4deb'
XML_SHA = 'c6131380de0e00d4054cfbc89b6b98c50d0f76e0328239e201ce5a523592b35e'
ASSETS_SHA = '36c9a39468f5aae0f6767c80999a5c420c085b268e3ee5f5f659e9d0c0af5ce1'
DISPLAY_SHA = 'b77c5d9248479e72fa794ba02b8e8db12a181e93371fb309a57cd7c3f8c9b1a9'
SVG_NS = '{http://www.w3.org/2000/svg}'
MATRIX = re.compile(r'^matrix\(1\.0, 0\.0, 0\.0, 1\.0, ([-\d.]+), ([-\d.]+)\)$')


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def pinned(path: Path, expected: str) -> bytes:
    if path.is_symlink() or not path.is_file() or path.resolve() != path:
        raise ValueError(f'not a physical source file: {path}')
    data = path.read_bytes()
    if sha(data) != expected:
        raise ValueError(f'input hash drift: {path}')
    return data


def svg_geometry(path: Path, expected_sha: str) -> tuple[float, float, float, float]:
    root = ET.fromstring(pinned(path, expected_sha))
    if root.tag != f'{SVG_NS}svg':
        raise ValueError(f'non-SVG export: {path}')
    group = next((child for child in root if child.tag == f'{SVG_NS}g'), None)
    match = MATRIX.fullmatch(group.attrib.get('transform', '')) if group is not None else None
    if match is None:
        raise ValueError(f'unsupported SVG origin transform: {path}')
    return (float(root.attrib['width'].removesuffix('px')),
            float(root.attrib['height'].removesuffix('px')),
            float(match[1]), float(match[2]))


def render() -> bytes:
    pinned(SOURCE, SOURCE_SHA)
    xml = ET.fromstring(pinned(XML, XML_SHA))
    assets = json.loads(pinned(ASSETS, ASSETS_SHA))
    display = json.loads(pinned(DISPLAY, DISPLAY_SHA))
    if assets['sourceSwfSha256'] != SOURCE_SHA or display['sourceSwfSha256'] != SOURCE_SHA:
        raise ValueError('cross-artifact source identity drift')
    if display['mainFrameCount'] != 1274 or display['rootEntry']['objectID'] != '140':
        raise ValueError('display domain drift')
    asset_by_key = {(asset['kind'], asset['characterId'], asset['buttonState']): asset
                    for asset in assets['assets']}
    if len(asset_by_key) != 156:
        raise ValueError('duplicate or missing visual export')
    tags = {'DefineShape': 'shape', 'DefineShape2': 'shape',
            'DefineShape3': 'shape', 'DefineShape4': 'shape',
            'DefineText': 'text', 'DefineText2': 'text',
            'DefineButton2': 'button'}
    symbols = []
    for item in xml.iter():
        kind = tags.get(item.tag)
        if kind is None:
            continue
        character_id = int(item.attrib['objectID'])
        if kind == 'button':
            states = {}
            geometry = None
            for state in ('up', 'over', 'down', 'hittest'):
                asset = asset_by_key[kind, character_id, state]
                path = WORK / asset['path']
                measured = svg_geometry(path, asset['sha256'])
                if geometry is not None and measured != geometry:
                    raise ValueError(f'button visual-state bounds drift: {character_id}')
                geometry = measured
                states[state] = {'path': asset['path'], 'sha256': asset['sha256']}
            assert geometry is not None
            width, height, shift_x, shift_y = geometry
            bounds = [-shift_x, -shift_y, width - shift_x, height - shift_y]
            symbols.append({'characterId': character_id, 'kind': kind,
                            'boundsPixels': bounds, 'boundsAuthority': 'FFDec SVG export only',
                            'states': states})
            continue
        bounds_tag = item.find('bounds/Rectangle')
        if bounds_tag is None:
            raise ValueError(f'no source bounds for character {character_id}')
        bounds = [int(bounds_tag.attrib[name]) / 20 for name in ('left', 'top', 'right', 'bottom')]
        asset = asset_by_key[kind, character_id, None]
        width, height, shift_x, shift_y = svg_geometry(WORK / asset['path'], asset['sha256'])
        expected_geometry = (bounds[2] - bounds[0], bounds[3] - bounds[1],
                             -bounds[0], -bounds[1])
        if not all(math.isclose(actual, expected, rel_tol=0, abs_tol=1e-9)
                   for actual, expected in zip((width, height, shift_x, shift_y), expected_geometry)):
            raise ValueError(f'SWF/FFDec geometry mismatch: {character_id}')
        symbols.append({'characterId': character_id, 'kind': kind,
                        'boundsPixels': bounds, 'boundsAuthority': 'SWF DefineShape/DefineText bounds',
                        'path': asset['path'], 'sha256': asset['sha256']})
    symbols.sort(key=lambda symbol: symbol['characterId'])
    if len(symbols) != 135 or len({symbol['characterId'] for symbol in symbols}) != 135:
        raise ValueError('visual symbol census drift')
    placed = sorted({int(event['attributes']['objectID']) for event in display['displayEvents']
                     if event['op'] == 'place' and 'objectID' in event['attributes']})
    if len(placed) != 132 or set(placed) - {symbol['characterId'] for symbol in symbols}:
        raise ValueError('source placement references an unbound visual symbol')

    result = {'schemaVersion': 1, 'kind': 'g678-geo-l07-p003-source-visual-layout-v1',
              'animationId': 'shared-geo001-l07-p003', 'sourceSwfSha256': SOURCE_SHA,
              'swfmillXmlSha256': XML_SHA, 'visualAssetsSha256': ASSETS_SHA,
              'displayIrSha256': DISPLAY_SHA, 'coordinateUnit': 'pixels; SWF twips / 20',
              'stage': {'width': 800, 'height': 600, 'fps': 12},
              'mainSprite': {'characterId': 140, 'rootEntryFrame': 6,
                             'translateX': 412.4, 'translateY': 303.3,
                             'frameCount': 1274},
              'counts': {'boundSymbols': len(symbols), 'placedSymbols': len(placed),
                         'unplacedSymbols': len(symbols) - len(placed)},
              'symbols': symbols,
              'claimBoundary': 'Direct-frame SVG placement geometry only. A mask at depth 1 through depth 3, alpha transforms, button reachability, nested playback, host navigation, audio synchronization, and original-runtime visual fidelity still require implementation or evidence.'}
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
    elif args.output.read_bytes() != content:
        raise ValueError('source visual layout drift')
    print(f'PASS GEO001 L7 P003 visual layout: {len(content)} bytes, SHA-256 {sha(content)}')


if __name__ == '__main__':
    main()
