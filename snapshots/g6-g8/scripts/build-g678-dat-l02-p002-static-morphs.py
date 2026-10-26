#!/usr/bin/env python3
"""Freeze P002 FFDec morph SVGs at ratios actually used by the SWF."""

import argparse
import hashlib
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / 'migrations/shared-dat001-l02-p002/audit'
IR = WORK / 'display-ir-v1.json'
IR_SHA = '0863407592134422329e1a9e7d22c135b58fbfbbb6f90777234d952171b05bad'
SOURCE = Path('/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/DAT001/L2/RW/L2RW02.swf')
SOURCE_SHA = 'b4a8311aff5e33cc623d6035b4a00647bac6ab9dbe0fd61394e6a6207e652a16'
EXPORT = WORK / 'ffdec-26.2.1-source-assets-v1/morphshapes'
EXPORT_SHA = {
    103: '8c0f1ca94fe2e19ca47bbea71bc543b0cbdcb0bf95d19cad3961590bf56b9c80',
    107: 'b652a6db9d5ed450b6ba8e6d50307be887db55cb8a8022c58b7f19b6559a1e13',
    109: 'c8537f30e1f35c69e04c0dc31d58df23d7ebf99bf7ae275d36db358a848c7831',
    111: '3af0b327c81e7d41b8996e325db9cbfb541a904f6bf3cbb2fee80ae57d855492',
}
OUTPUT = WORK / 'source-morph-frames-v1'
MANIFEST = WORK / 'source-morph-frames-v1.json'
SVG = '{http://www.w3.org/2000/svg}'
NUMBER = re.compile(r'[-+]?(?:\d*\.\d+|\d+)')
ET.register_namespace('', 'http://www.w3.org/2000/svg')
ET.register_namespace('ffdec', 'https://www.free-decompiler.com/flash')
ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def pinned(path: Path, expected: str) -> bytes:
    if path.is_symlink() or not path.is_file() or path.resolve() != path:
        raise ValueError(f'nonphysical input: {path}')
    data = path.read_bytes()
    if sha(data) != expected:
        raise ValueError(f'input drift: {path}')
    return data


def number(value: float) -> str:
    return f'{value:.6f}'.rstrip('0').rstrip('.') or '0'


def interpolate(first: str, last: str, fraction: float, attribute: str) -> str:
    if fraction == 0:
        return first
    if fraction == 1:
        return last
    if attribute in ('fill', 'stroke'):
        if not re.fullmatch(r'#[0-9a-fA-F]{6}', first) or not re.fullmatch(r'#[0-9a-fA-F]{6}', last):
            raise ValueError('unsupported morph color')
        colors = [round(int(first[i:i + 2], 16) * (1 - fraction) +
                        int(last[i:i + 2], 16) * fraction) for i in (1, 3, 5)]
        return '#' + ''.join(f'{component:02x}' for component in colors)
    if attribute in ('fill-opacity', 'stroke-width'):
        return number(float(first) * (1 - fraction) + float(last) * fraction)
    if attribute == 'd':
        before, after = list(NUMBER.finditer(first)), list(NUMBER.finditer(last))
        if len(before) != len(after) or NUMBER.sub('#', first) != NUMBER.sub('#', last):
            raise ValueError('morph path topology differs')
        result = []
        end = 0
        for left, right in zip(before, after):
            result.append(first[end:left.start()])
            result.append(number(float(left.group()) * (1 - fraction) +
                                 float(right.group()) * fraction))
            end = left.end()
        result.append(first[end:])
        return ''.join(result)
    raise ValueError(f'unsupported morph animation: {attribute}')


def static_svg(source: bytes, ratio: int) -> bytes:
    if not isinstance(ratio, int) or not 0 <= ratio <= 65535:
        raise ValueError('invalid SWF morph ratio')
    root = ET.fromstring(source)
    if root.tag != f'{SVG}svg':
        raise ValueError('morph export is not SVG')
    count = 0
    for parent in root.iter():
        for child in list(parent):
            if child.tag != f'{SVG}animate':
                continue
            attribute = child.attrib.get('attributeName')
            values = child.attrib.get('values', '').split(';')
            if len(values) != 2 or child.attrib.get('repeatCount') != 'indefinite':
                raise ValueError('unexpected FFDec morph animation')
            parent.set(attribute, interpolate(values[0], values[1], ratio / 65535, attribute))
            parent.remove(child)
            count += 1
    if count != 7 or any(element.tag == f'{SVG}animate' for element in root.iter()):
        raise ValueError('incomplete static morph conversion')
    return ET.tostring(root, encoding='utf-8', xml_declaration=True)


def source_ratio_frames(ir: dict) -> dict[int, dict[int, list[int]]]:
    if ir['sourceSwfSha256'] != SOURCE_SHA or ir['animationId'] != 'shared-dat001-l02-p002':
        raise ValueError('display IR source mismatch')
    events = ir['domains']['sprite-113']['displayEvents']
    active: dict[int, tuple[int, int]] = {}
    frames = {character_id: {} for character_id in EXPORT_SHA}
    position = 0
    for frame in range(1, 277):
        while position < len(events) and events[position]['frame'] == frame:
            event = events[position]
            depth = int(event['attributes']['depth'])
            if event['op'] == 'remove':
                active.pop(depth, None)
            else:
                prior = active.get(depth)
                attributes = event['attributes']
                if 'objectID' not in attributes and prior is None:
                    raise ValueError('morph source updates an empty depth')
                character = int(attributes['objectID']) if 'objectID' in attributes else prior[0]
                ratio = int(attributes['morph']) if 'morph' in attributes else (
                    prior[1] if prior and attributes['replace'] == '1' else 0)
                active[depth] = (character, ratio)
            position += 1
        for character, ratio in active.values():
            if character in frames:
                frames[character].setdefault(ratio, []).append(frame)
    if (position != len(events) or
        {key: len(value) for key, value in frames.items()} !=
            {103: 8, 107: 18, 109: 24, 111: 16}):
        raise ValueError('source morph ratio schedule drift')
    return frames


def render() -> tuple[dict[str, bytes], bytes]:
    pinned(SOURCE, SOURCE_SHA)
    ir = json.loads(pinned(IR, IR_SHA))
    ratio_frames = source_ratio_frames(ir)
    files = {}
    rows = []
    for character_id, expected in EXPORT_SHA.items():
        svg = pinned(EXPORT / f'{character_id}.svg', expected)
        for ratio, frames in sorted(ratio_frames[character_id].items()):
            name = f'{character_id}-{ratio:05d}.svg'
            data = static_svg(svg, ratio)
            files[name] = data
            rows.append({'characterId': character_id, 'ratio': ratio,
                         'sourceFrames': frames, 'file': name, 'bytes': len(data),
                         'sha256': sha(data), 'sourceSvgSha256': expected})
    packet = {
        'schemaVersion': 1, 'kind': 'g678-dat-l02-p002-static-morph-frames-v1',
        'animationId': 'shared-dat001-l02-p002', 'sourceSwfSha256': SOURCE_SHA,
        'sourceDisplayIrSha256': IR_SHA, 'exporter': 'FFDec 26.2.1 morphshape:svg',
        'ratioDenominator': 65535, 'assets': rows,
        'claimBoundary': ('Static interpolation of FFDec SVG endpoints at source-scheduled SWF ratios. '
                          'This removes autonomous SVG loops but is not original-runtime morph geometry, '
                          'visual fidelity, or browser acceptance evidence.'),
    }
    return files, (json.dumps(packet, indent=2) + '\n').encode()


def write_new(files: dict[str, bytes], manifest: bytes) -> None:
    if OUTPUT.exists() or OUTPUT.is_symlink() or MANIFEST.exists() or MANIFEST.is_symlink():
        raise FileExistsError('static morph output already exists')
    OUTPUT.mkdir()
    for name, data in files.items():
        with (OUTPUT / name).open('xb') as target:
            target.write(data)
    with MANIFEST.open('xb') as target:
        target.write(manifest)


def check_existing(files: dict[str, bytes], manifest: bytes) -> None:
    if OUTPUT.is_symlink() or not OUTPUT.is_dir() or MANIFEST.is_symlink() or MANIFEST.read_bytes() != manifest:
        raise ValueError('static morph manifest drift')
    if {path.name for path in OUTPUT.iterdir()} != set(files):
        raise ValueError('static morph file set drift')
    for name, data in files.items():
        path = OUTPUT / name
        if path.is_symlink() or path.read_bytes() != data:
            raise ValueError(f'static morph output drift: {name}')


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--write', action='store_true')
    mode.add_argument('--check', action='store_true')
    args = parser.parse_args()
    files, manifest = render()
    if args.write:
        write_new(files, manifest)
    else:
        check_existing(files, manifest)
    print(f'PASS DAT001 L2 P002 static morphs: {len(files)} states, manifest SHA-256 {sha(manifest)}')


if __name__ == '__main__':
    main()
