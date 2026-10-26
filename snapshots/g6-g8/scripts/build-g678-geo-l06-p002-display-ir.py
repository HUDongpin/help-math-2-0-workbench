#!/usr/bin/env python3
"""Rebuild a compact source event IR for GEO001 L6 page 2's main timeline."""

import argparse
import base64
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
SOURCE = Path('/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/GEO001/L6/RW/L6RW02.swf')
XML = ROOT / 'migrations/shared-geo001-l06-p002/audit/movie.xml'
OUTPUT = ROOT / 'migrations/shared-geo001-l06-p002/audit/display-list-events-v1.json'
SOURCE_SHA = '3f340d0201e0f4eed1c8e73d364641d5de4b625e64c33680059842b523002c44'
XML_SHA = '241debfeeb1def99d6eebc5f7b8b3cc2d0a8966ca50fa6dc627b7c0bdd491a73'
STREAM_SHA = '2109aaa85e801d9a5bddbf2c0f30184e078a9eab75785580f477d51147fe325e'


def pinned(path: Path, expected: str) -> None:
    if path.is_symlink() or not path.is_file() or path.resolve() != path:
        raise ValueError(f'not a physical source file: {path}')
    if hashlib.sha256(path.read_bytes()).hexdigest() != expected:
        raise ValueError(f'source hash drift: {path}')


def render() -> bytes:
    pinned(SOURCE, SOURCE_SHA)
    pinned(XML, XML_SHA)
    root = ET.parse(XML).getroot()
    assert root.get('version') == '6'
    header = root.find('Header')
    assert header is not None and header.get('framerate') == '12' and header.get('frames') == '10'
    root_tags = header.find('tags')
    assert root_tags is not None
    root_frame = 1
    root_entries = []
    for tag in root_tags:
        if tag.tag == 'ShowFrame':
            root_frame += 1
        elif tag.tag == 'PlaceObject2' and tag.get('objectID') == '230':
            root_entries.append({'frame': root_frame, **tag.attrib})
    assert root_frame == 11 and root_entries == [{'frame': 6, 'replace': '0', 'depth': '4',
        'objectID': '230', 'morph': '5', 'name': 'animation'}]
    sprites = root.findall('.//DefineSprite[@objectID="230"]')
    assert len(sprites) == 1 and sprites[0].get('frames') == '1216'
    tags = sprites[0].find('tags')
    assert tags is not None
    frame = 1
    events = []
    sound_blocks = []
    observed = {'PlaceObject2': 0, 'RemoveObject2': 0, 'ShowFrame': 0,
                'SoundStreamHead': 0, 'SoundStreamBlock': 0, 'End': 0}
    for tag in tags:
        if tag.tag not in observed:
            raise ValueError(f'unsupported main-domain tag: {tag.tag}')
        observed[tag.tag] += 1
        if tag.tag == 'ShowFrame':
            frame += 1
        elif tag.tag == 'PlaceObject2':
            children = [child.tag for child in tag]
            if any(child not in ('transform', 'colorTransform') for child in children):
                raise ValueError(f'unsupported placement children: {children}')
            transform = tag.find('transform/Transform')
            color = tag.find('colorTransform/ColorTransform2')
            events.append({'frame': frame, 'op': 'place', 'attributes': tag.attrib,
                           'transform': transform.attrib if transform is not None else None,
                           'colorTransform': color.attrib if color is not None else None})
        elif tag.tag == 'RemoveObject2':
            events.append({'frame': frame, 'op': 'remove', 'attributes': tag.attrib})
        elif tag.tag == 'SoundStreamBlock':
            raw = base64.b64decode(tag.findtext('data') or '', validate=True)
            if len(raw) < 4:
                raise ValueError('short sound stream block')
            sound_blocks.append({'frame': frame,
                'sampleCount': int.from_bytes(raw[:2], 'little'),
                'seekSamples': int.from_bytes(raw[2:4], 'little', signed=True),
                'payloadSha256': hashlib.sha256(raw[4:]).hexdigest()})
    if observed != {'PlaceObject2': 1478, 'RemoveObject2': 285, 'ShowFrame': 1216,
                    'SoundStreamHead': 1, 'SoundStreamBlock': 1200, 'End': 1} or frame != 1217:
        raise ValueError('main-domain tag census drift')
    if [(event['frame'], event['attributes'].get('objectID')) for event in events
        if event['op'] == 'place' and event['attributes'].get('objectID') in ('211', '212', '213', '214')] != \
            [(987, str(button)) for button in (211, 212, 213, 214)]:
        raise ValueError('source glossary placement drift')
    if [block['frame'] for block in sound_blocks if block['frame'] in (418, 419, 420, 421, 422, 464, 465, 466, 467, 468)]:
        raise ValueError('source audio gap drift')
    value = {'schemaVersion': 1, 'kind': 'g678-source-display-event-ir-v1',
        'animationId': 'shared-geo001-l06-p002', 'sourceSwfSha256': SOURCE_SHA,
        'swfmillXmlSha256': XML_SHA, 'rootEntry': root_entries[0],
        'stage': {'width': 800, 'height': 600}, 'fps': 12,
        'rootFrameCount': 10, 'mainFrameDomain': 'sprite-230', 'mainFrameCount': 1216,
        'embeddedMp3Sha256': STREAM_SHA, 'tagCensus': observed,
        'displayEvents': events, 'soundBlocks': sound_blocks,
        'claimBoundary': 'Static source events only; no renderer, host trace, synchronization or acceptance.'}
    return (json.dumps(value, indent=2, ensure_ascii=False) + '\n').encode()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--write', action='store_true')
    mode.add_argument('--check', action='store_true')
    parser.add_argument('--output', type=Path, default=OUTPUT)
    args = parser.parse_args()
    data = render()
    if args.write:
        with args.output.open('xb') as target:
            target.write(data)
    elif args.output.read_bytes() != data:
        raise ValueError('display event IR drift')
    print(f'PASS GEO001 L6 P002 display IR: {len(data)} bytes, {hashlib.sha256(data).hexdigest()}')


if __name__ == '__main__':
    main()
