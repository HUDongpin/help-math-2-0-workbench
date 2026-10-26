#!/usr/bin/env python3
"""Freeze GEO001 L7 P003 source text exports and depth-residency evidence."""

import argparse
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / 'migrations/shared-geo001-l07-p003'
SOURCE = Path('/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/GEO001/L7/RW/L7RW03.swf')
XML = WORK / 'audit/movie.xml'
DISPLAY = WORK / 'audit/display-list-events-v2.json'
TEXTS = WORK / 'audit/ffdec-26.2.1/texts'
OUTPUT = WORK / 'audit/source-text-residency-v1.json'
SOURCE_SHA = 'd0e3c429a5cf15de8f89c0e627a51d990b2bfed8d532af3a84f559531b9a4deb'
XML_SHA = 'c6131380de0e00d4054cfbc89b6b98c50d0f76e0328239e201ce5a523592b35e'
DISPLAY_SHA = 'b77c5d9248479e72fa794ba02b8e8db12a181e93371fb309a57cd7c3f8c9b1a9'
SEPARATOR = '\n--- RECORDSEPARATOR ---\n'


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def pinned(path: Path, expected: str) -> bytes:
    if path.is_symlink() or not path.is_file() or path.resolve() != path:
        raise ValueError(f'not a physical file: {path}')
    data = path.read_bytes()
    if sha(data) != expected:
        raise ValueError(f'input hash drift: {path}')
    return data


def ranges(frames: list[int]) -> list[list[int]]:
    result: list[list[int]] = []
    for frame in frames:
        if result and frame == result[-1][1] + 1:
            result[-1][1] = frame
        else:
            result.append([frame, frame])
    return result


def render() -> bytes:
    pinned(SOURCE, SOURCE_SHA)
    xml = pinned(XML, XML_SHA)
    ir = json.loads(pinned(DISPLAY, DISPLAY_SHA))
    definitions = ET.fromstring(xml).findall('.//DefineText')
    text_ids = sorted(int(item.attrib['objectID']) for item in definitions)
    if len(text_ids) != 41 or len(set(text_ids)) != 41:
        raise ValueError('source DefineText census drift')
    if TEXTS.is_symlink() or not TEXTS.is_dir():
        raise ValueError('FFDec text directory is not a physical directory')
    files = sorted(TEXTS.glob('*.txt'), key=lambda path: int(path.stem))
    if [int(path.stem) for path in files] != text_ids:
        raise ValueError('FFDec text export does not match source IDs')
    if any(path.is_symlink() or not path.is_file() for path in files):
        raise ValueError('FFDec text export is not a physical file')
    if ir['sourceSwfSha256'] != SOURCE_SHA or ir['mainFrameCount'] != 1274:
        raise ValueError('display IR identity drift')

    resident: dict[int, list[int]] = {character_id: [] for character_id in text_ids}
    display: dict[int, int] = {}
    events = ir['displayEvents']
    index = 0
    for frame in range(1, 1275):
        while index < len(events) and events[index]['frame'] == frame:
            event = events[index]
            depth = int(event['attributes']['depth'])
            if event['op'] == 'remove':
                if depth not in display:
                    raise ValueError('source display removal drift')
                del display[depth]
            else:
                character = event['attributes'].get('objectID')
                if character is None and depth not in display:
                    raise ValueError('source display update drift')
                if character is not None:
                    display[depth] = int(character)
            index += 1
        for character_id in set(display.values()) & resident.keys():
            resident[character_id].append(frame)
    if index != len(events) or any(not frames for frames in resident.values()):
        raise ValueError('text residency incomplete')

    records = []
    for path in files:
        character_id = int(path.stem)
        raw = path.read_bytes()
        segments = raw.decode('utf-8').split(SEPARATOR)
        if not segments or any(not segment for segment in segments):
            raise ValueError(f'empty source text segment: {path.name}')
        records.append({'characterId': character_id, 'ffdecExport': f'audit/ffdec-26.2.1/texts/{path.name}',
                        'ffdecExportSha256': sha(raw), 'segments': segments,
                        'depthResidentFrameRanges': ranges(resident[character_id])})
    result = {'schemaVersion': 1, 'kind': 'g678-geo-l07-p003-source-text-residency-v1',
              'animationId': 'shared-geo001-l07-p003', 'sourceSwfSha256': SOURCE_SHA,
              'swfmillXmlSha256': XML_SHA, 'displayIrSha256': DISPLAY_SHA,
              'mainFrameDomain': 'sprite-140', 'mainFrameCount': 1274,
              'textCharacterCount': 41, 'texts': records,
              'claimBoundary': 'Exact FFDec text fragments and source depth residency only; visibility, reading order, semantic role, button reachability, translation, original-runtime fidelity, and product typography remain unverified.'}
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
        raise ValueError('text audit drift')
    print(f'PASS GEO001 L7 P003 text audit: {len(content)} bytes, SHA-256 {sha(content)}')


if __name__ == '__main__':
    main()
