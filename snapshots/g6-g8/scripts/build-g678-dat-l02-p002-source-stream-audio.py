#!/usr/bin/env python3
"""Reconstruct one continuous source MP3 from DAT001 L2 P002 SWF stream blocks."""

import argparse
import base64
import hashlib
import json
from pathlib import Path
import subprocess
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parent.parent
SOURCE = Path('/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/DAT001/L2/RW/L2RW02.swf')
SOURCE_SHA = 'b4a8311aff5e33cc623d6035b4a00647bac6ab9dbe0fd61394e6a6207e652a16'
AUDIT = ROOT / 'migrations/shared-dat001-l02-p002/audit'
XML = AUDIT / 'movie.xml'
XML_SHA = '1d0d14c87f96f7a501311833a90ee50257f392129bb068fb3c27fb6800cce02a'
IR = AUDIT / 'display-ir-v1.json'
IR_SHA = '0863407592134422329e1a9e7d22c135b58fbfbbb6f90777234d952171b05bad'
MP3 = AUDIT / 'source-stream-audio-v1.mp3'
MANIFEST = AUDIT / 'source-stream-audio-v1.json'
MP3_FRAME_BYTES = 78
MP3_FRAME_SAMPLES = 576
MP3_HEADER = bytes.fromhex('fff330c0')


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def pinned(path: Path, expected: str) -> bytes:
    if path.is_symlink() or not path.is_file() or path.resolve() != path:
        raise ValueError(f'nonphysical source input: {path}')
    data = path.read_bytes()
    if sha(data) != expected:
        raise ValueError(f'source input drift: {path}')
    return data


def render() -> tuple[bytes, bytes]:
    pinned(SOURCE, SOURCE_SHA)
    xml = pinned(XML, XML_SHA)
    regenerated = subprocess.run(
        ['swfmill', '-n', 'swf2xml', str(SOURCE)], check=True, capture_output=True,
    ).stdout
    if regenerated != xml:
        raise ValueError('SWF/XML extraction drift')
    ir = json.loads(pinned(IR, IR_SHA))
    source_blocks = ir['domains']['sprite-113']['soundBlocks']
    if len(source_blocks) != 276:
        raise ValueError('display IR sound-block schedule drift')
    root = ET.fromstring(xml)
    sprite = root.find('.//DefineSprite[@objectID="113"]')
    if sprite is None or sprite.attrib.get('frames') != '276':
        raise ValueError('source audio sprite drift')
    tags = sprite.find('tags')
    if tags is None:
        raise ValueError('source audio tags missing')
    heads = [tag for tag in tags if tag.tag == 'SoundStreamHead']
    if len(heads) != 1 or heads[0].attrib != {
        'playbackRate': '2', 'playbackSize': '1', 'playbackStereo': '0',
        'compression': '2', 'soundRate': '2', 'soundSize': '1',
        'soundStereo': '0', 'sampleSize': '1837',
    }:
        raise ValueError('source stream header drift')
    latency = int.from_bytes(base64.b64decode(
        heads[0].findtext('latencySeek/data') or '', validate=True),
        'little', signed=True)
    if latency != 1680:
        raise ValueError('source stream latency drift')
    payloads = []
    blocks = []
    frame = 1
    byte_offset = 0
    sample_offset = 0
    for tag in tags:
        if tag.tag == 'ShowFrame':
            frame += 1
        if tag.tag != 'SoundStreamBlock':
            continue
        raw = base64.b64decode(tag.findtext('data') or '', validate=True)
        if len(raw) < 4:
            raise ValueError(f'short source sound block: frame {frame}')
        sample_count = int.from_bytes(raw[:2], 'little')
        seek_samples = int.from_bytes(raw[2:4], 'little', signed=True)
        payload = raw[4:]
        expected = source_blocks[len(blocks)]
        if (expected['frame'] != frame or expected['sampleCount'] != sample_count or
            expected['seekSamples'] != seek_samples or
            expected['payloadSha256'] != sha(payload)):
            raise ValueError(f'source audio/IR block drift: frame {frame}')
        if (len(payload) % MP3_FRAME_BYTES or
            len(payload) * MP3_FRAME_SAMPLES != sample_count * MP3_FRAME_BYTES or
            any(payload[index:index + 4] != MP3_HEADER
                for index in range(0, len(payload), MP3_FRAME_BYTES))):
            raise ValueError(f'source MP3 frame boundary drift: frame {frame}')
        blocks.append({
            'parentFrame': frame,
            'sampleCount': sample_count,
            'seekSamples': seek_samples,
            'payloadBytes': len(payload),
            'payloadSha256': sha(payload),
            'mp3ByteOffset': byte_offset,
            'declaredSampleOffset': sample_offset,
        })
        payloads.append(payload)
        byte_offset += len(payload)
        sample_offset += sample_count
    mp3 = b''.join(payloads)
    if (frame != 277 or len(blocks) != 276 or len(mp3) != 68562 or
        byte_offset != len(mp3) or sample_offset != 506304 or
        len(mp3) // MP3_FRAME_BYTES != 879):
        raise ValueError('source stream aggregate drift')
    packet = {
        'schemaVersion': 1,
        'kind': 'g678-dat-l02-p002-source-stream-audio-v1',
        'animationId': 'shared-dat001-l02-p002',
        'sourceSwfSha256': SOURCE_SHA,
        'sourceXmlSha256': XML_SHA,
        'displayIrSha256': IR_SHA,
        'frameDomain': 'sprite-113',
        'sourceFps': 12,
        'streamHeader': {'compression': 'mp3', 'soundRateCode': 2,
                         'sampleRateHz': 22050, 'channels': 1,
                         'latencySeekSamples': latency},
        'mp3': {'path': 'audit/source-stream-audio-v1.mp3', 'bytes': len(mp3),
                'sha256': sha(mp3), 'frameBytes': MP3_FRAME_BYTES,
                'frameSamples': MP3_FRAME_SAMPLES, 'frameCount': 879},
        'blockCount': len(blocks),
        'declaredSampleCount': sample_offset,
        'durationMsFromDeclaredSamples': sample_offset / 22050 * 1000,
        'parentDurationMs': 276 / 12 * 1000,
        'blocks': blocks,
        'claimBoundary': ('One continuous encoded source stream reconstructed from all 276 '
                          'SWF blocks. Block sample/seek metadata and MP3 boundaries are '
                          'structural evidence only, not original-host timing, audio '
                          'synchronization, listening acceptance, language adaptation, or '
                          'Current-JS registration.'),
    }
    return mp3, (json.dumps(packet, indent=2) + '\n').encode()


def write_outputs(mp3: bytes, manifest: bytes,
                  paths: tuple[Path, Path] = (MP3, MANIFEST)) -> None:
    if any(path.exists() or path.is_symlink() for path in paths):
        raise FileExistsError('source stream output already exists')
    for path, data in zip(paths, (mp3, manifest), strict=True):
        with path.open('xb') as target:
            target.write(data)


def check_outputs(mp3: bytes, manifest: bytes,
                  paths: tuple[Path, Path] = (MP3, MANIFEST)) -> None:
    if any(path.is_symlink() or path.read_bytes() != data
           for path, data in zip(paths, (mp3, manifest), strict=True)):
        raise ValueError('source stream output drift')


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--write', action='store_true')
    mode.add_argument('--check', action='store_true')
    args = parser.parse_args()
    mp3, manifest = render()
    if args.write:
        write_outputs(mp3, manifest)
    else:
        check_outputs(mp3, manifest)
    print(f'PASS DAT001 L2 P002 source stream: {len(mp3)} MP3 bytes '
          f'SHA-256 {sha(mp3)}; manifest SHA-256 {sha(manifest)}')


if __name__ == '__main__':
    main()
