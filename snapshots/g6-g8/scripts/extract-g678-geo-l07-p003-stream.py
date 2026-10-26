#!/usr/bin/env python3
"""Rebuild the exact SWF sprite-140 MP3 payload; no audio acceptance is implied."""

import argparse
import base64
import hashlib
from pathlib import Path
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parent.parent
SOURCE = Path('/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/GEO001/L7/RW/L7RW03.swf')
XML = ROOT / 'migrations/shared-geo001-l07-p003/audit/movie.xml'
DEFAULT_OUTPUT = ROOT / 'migrations/shared-geo001-l07-p003/audit/sprite-140-source-stream-v1.mp3'
SOURCE_SHA256 = 'd0e3c429a5cf15de8f89c0e627a51d990b2bfed8d532af3a84f559531b9a4deb'
XML_SHA256 = 'c6131380de0e00d4054cfbc89b6b98c50d0f76e0328239e201ce5a523592b35e'
MP3_SHA256 = '17b1d24e26ca2b225a421bdcaa1250a22a1f311b34d35e6b7880c4946a546e90'
MP3_BYTES = 465270
BLOCK_COUNT = 1126
SAMPLE_COUNT = 2061504


def exact_file(path: Path, sha256: str) -> None:
    if path.is_symlink() or not path.is_file() or path.resolve() != path:
        raise ValueError(f'not a physical source file: {path}')
    if hashlib.sha256(path.read_bytes()).hexdigest() != sha256:
        raise ValueError(f'source hash drift: {path}')


def render() -> bytes:
    exact_file(SOURCE, SOURCE_SHA256)
    exact_file(XML, XML_SHA256)
    document = ET.parse(XML).getroot()
    sprites = document.findall('.//DefineSprite[@objectID="140"]')
    if len(sprites) != 1 or sprites[0].get('frames') != '1274':
        raise ValueError('sprite-140 frame domain drift')
    tags = sprites[0].find('tags')
    if tags is None:
        raise ValueError('sprite-140 tags missing')
    heads = tags.findall('SoundStreamHead')
    if len(heads) != 1 or any(heads[0].get(key) != value for key, value in
       {'compression': '2', 'soundRate': '2', 'soundStereo': '0'}.items()):
        raise ValueError('sprite-140 MP3 stream format drift')
    blocks = tags.findall('SoundStreamBlock')
    if len(blocks) != BLOCK_COUNT:
        raise ValueError('sprite-140 block count drift')
    samples = 0
    payload = []
    for block in blocks:
        raw = base64.b64decode(block.findtext('data') or '', validate=True)
        if len(raw) < 4:
            raise ValueError('short MP3 block')
        samples += int.from_bytes(raw[:2], 'little')
        payload.append(raw[4:])  # SWF per-block sample count and signed seek header.
    mp3 = b''.join(payload)
    if (samples != SAMPLE_COUNT or len(mp3) != MP3_BYTES or
            hashlib.sha256(mp3).hexdigest() != MP3_SHA256 or
            mp3[:1] != b'\xff' or mp3[1] & 0xe0 != 0xe0):
        raise ValueError('sprite-140 source stream identity drift')
    return mp3


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--write', action='store_true')
    mode.add_argument('--check', action='store_true')
    parser.add_argument('--output', type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    content = render()
    if args.write:
        with args.output.open('xb') as target:
            target.write(content)
    elif args.output.read_bytes() != content:
        raise ValueError('extracted source stream drift')
    print(f'PASS sprite-140 source stream: {len(content)} bytes, {BLOCK_COUNT} blocks, SHA-256 {MP3_SHA256}')


if __name__ == '__main__':
    main()
