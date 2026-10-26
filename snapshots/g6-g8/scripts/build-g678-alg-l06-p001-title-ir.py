#!/usr/bin/env python3
"""Extract the root-reachable ALG001 L6 P001 title timeline from exact SWF XML."""

import argparse
import base64
from collections import Counter
import gzip
import hashlib
import json
import os
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
SOURCE_RELATIVE = Path('G6-G8-shared/ALG001/L6/IR/L6IR01.swf')
SOURCE_SHA = '9daa5ffe3a1ea275d9467eadafc7addbbb26d14ad1c289e84b3f66f6b0ab9d35'
XML_PATH = ROOT / 'migrations/shared-alg001-l06-p001/audit/machine/swfmill.xml.gz'
XML_GZIP_SHA = '7fd368ea653462fae4cf73c1828a4f402f9342f16ce8ce00df7c04d17bb2302c'
XML_SHA = '52eb09f452be9f0c8f16578754dc15b78903270b5725daeed04f0199e43f7e0a'
OUTPUT = ROOT / 'migrations/shared-alg001-l06-p001/audit/title-timeline-v1.json'


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def pinned_file(path: Path, expected: str) -> bytes:
    require(path.is_file() and not path.is_symlink() and path.resolve() == path,
            f'not a real source file: {path}')
    data = path.read_bytes()
    require(digest(data) == expected, f'SHA-256 drift: {path}')
    return data


def direct_definition(tags: ET.Element, kind: str, object_id: int) -> ET.Element:
    matches = [tag for tag in tags if tag.tag == kind and tag.get('objectID') == str(object_id)]
    require(len(matches) == 1, f'expected exactly one {kind} {object_id}')
    return matches[0]


def matrix(tag: ET.Element) -> dict:
    transform = tag.find('transform/Transform')
    color = tag.find('colorTransform/ColorTransform2')
    require(transform is not None, 'title placement has no transform')
    return {
        'scaleX': float(transform.get('scaleX', '1')),
        'scaleY': float(transform.get('scaleY', '1')),
        'transXTwips': int(transform.get('transX', '0')),
        'transYTwips': int(transform.get('transY', '0')),
        'alpha256': int(color.get('factorAlpha', '256')) if color is not None else 256,
    }


def render() -> bytes:
    source_root_value = os.environ.get('HELP_MATH_G678_SOURCE_ROOT')
    require(bool(source_root_value), 'HELP_MATH_G678_SOURCE_ROOT is required')
    source_root = Path(source_root_value)
    require(source_root.is_dir() and not source_root.is_symlink() and
            source_root.resolve() == source_root,
            'Source must be a real directory, not symlink')
    pinned_file(source_root / SOURCE_RELATIVE, SOURCE_SHA)
    xml = gzip.decompress(pinned_file(XML_PATH, XML_GZIP_SHA))
    require(digest(xml) == XML_SHA, 'uncompressed swfmill XML drift')
    swf = ET.fromstring(xml)
    header = swf.find('Header')
    require(swf.get('version') == '6' and header is not None and
            header.get('framerate') == '12' and header.get('frames') == '10',
            'SWF root header drift')
    bounds = header.find('size/Rectangle')
    require(bounds is not None and bounds.attrib == {
        'left': '0', 'right': '16000', 'top': '0', 'bottom': '12000'}, 'stage drift')
    tags = header.find('tags')
    require(tags is not None, 'SWF root has no tags')

    root_frame = 1
    root_placements = []
    for tag in tags:
        if tag.tag == 'ShowFrame':
            root_frame += 1
        elif tag.tag == 'PlaceObject2':
            root_placements.append({'frame': root_frame, 'attributes': tag.attrib,
                                    'matrix': matrix(tag)})
    require(root_frame == 11 and len(root_placements) == 1 and
            root_placements[0]['frame'] == 6 and
            root_placements[0]['attributes'] == {
                'replace': '0', 'depth': '1', 'objectID': '142',
                'morph': '5', 'name': 'animation'},
            'root-reachable title placement drift')
    require(root_placements[0]['matrix']['transXTwips'] == 8248 and
            root_placements[0]['matrix']['transYTwips'] == 5666,
            'root title origin drift')

    font = direct_definition(tags, 'DefineFont2', 118)
    require(font.get('name') == 'Bauhaus Md BT', 'title font drift')
    glyphs = [chr(int(glyph.get('map'))) for glyph in font.find('glyphs')]
    texts = []
    for character_id, depth in ((140, 1), (141, 2)):
        text = direct_definition(tags, 'DefineText', character_id)
        letters = ''.join(glyphs[int(entry.get('glyph'))]
                          for entry in text.findall('.//TextEntry'))
        require(letters == 'Understanding Functions: Introduction',
                f'title text drift: {character_id}')
        setup = text.find('.//TextRecord6[@objectID="118"]')
        require(setup is not None and setup.get('fontHeight') == '800',
                f'title font binding drift: {character_id}')
        colors = [record.find('color/Color').attrib
                  for record in text.findall('.//TextRecord6')
                  if record.find('color/Color') is not None]
        texts.append({'characterId': character_id, 'depth': depth,
                      'text': letters, 'fontCharacterId': 118,
                      'fontHeightTwips': 800,
                      'boundsTwips': text.find('bounds/Rectangle').attrib,
                      'sourceColors': colors})

    sprite = direct_definition(tags, 'DefineSprite', 142)
    require(sprite.get('frames') == '134', 'title sprite frame count drift')
    sprite_tags = sprite.find('tags')
    require(sprite_tags is not None, 'title sprite has no tags')
    census = Counter(tag.tag for tag in sprite_tags)
    require(census == {'SoundStreamHead': 1, 'PlaceObject2': 266,
                       'SoundStreamBlock': 134, 'ShowFrame': 134, 'End': 1},
            'title sprite tag census drift')
    active = {}
    current_audio = None
    frames = []
    frame = 1
    for tag in sprite_tags:
        if tag.tag == 'PlaceObject2':
            depth = int(tag.get('depth'))
            require(depth in (1, 2), 'unexpected title display depth')
            character_id = tag.get('objectID')
            if character_id is not None:
                require(character_id == str(139 + depth) and depth not in active,
                        'unexpected title character placement')
            else:
                require(depth in active and tag.get('replace') == '1',
                        'unexpected title character update')
            active[depth] = {'depth': depth, 'characterId': 139 + depth, **matrix(tag)}
        elif tag.tag == 'SoundStreamBlock':
            require(current_audio is None, 'multiple stream blocks in one title frame')
            raw = base64.b64decode(tag.findtext('data') or '', validate=True)
            require(len(raw) >= 4, 'short title stream block')
            current_audio = {
                'sampleCount': int.from_bytes(raw[:2], 'little'),
                'seekSamples': int.from_bytes(raw[2:4], 'little', signed=True),
                'payloadSha256': digest(raw[4:]),
            }
        elif tag.tag == 'ShowFrame':
            require(set(active) == {1, 2} and current_audio is not None,
                    f'incomplete title frame {frame}')
            frames.append({'frame': frame, 'layers': [active[1].copy(), active[2].copy()],
                           'soundBlock': current_audio})
            current_audio = None
            frame += 1
    require(frame == 135 and len(frames) == 134 and
            sum(row['soundBlock']['sampleCount'] for row in frames) == 245952,
            'title frames or audio samples drift')
    value = {
        'schemaVersion': 1,
        'kind': 'g678-source-title-timeline-ir-v1',
        'animationId': 'shared-alg001-l06-p001',
        'sourceSwfSha256': SOURCE_SHA,
        'swfmillXmlSha256': XML_GZIP_SHA,
        'stage': {'width': 800, 'height': 600},
        'fps': 12,
        'rootFrameCount': 10,
        'rootTitlePlacement': root_placements[0],
        'titleFrameDomain': 'sprite-142',
        'titleFrameCount': 134,
        'textObjects': texts,
        'tagCensus': dict(census),
        'frames': frames,
        'claimBoundary': 'Static root placement and title timeline only; host entry, rendered pixels, audible timing, localization and acceptance remain unverified.',
    }
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
        with args.output.open('xb') as output:
            output.write(data)
    elif args.output.read_bytes() != data:
        raise ValueError('P001 title timeline IR drift')
    print(f'PASS ALG001 L6 P001 title IR: {len(data)} bytes, {digest(data)}')


if __name__ == '__main__':
    main()
