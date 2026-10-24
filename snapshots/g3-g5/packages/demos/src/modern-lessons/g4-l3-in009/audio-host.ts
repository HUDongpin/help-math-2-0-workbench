import type {LessonTextPresentationCapability} from '../../lesson-text-contract';
/** Modern once/terminal recovery policy; no authored Flash stop or listening acceptance is claimed. */
export const IN009_AUDIO_HOST={
  "playbackMode": "once",
  "playbackEndFrameByDomain": {
    "sprite-200": 637
  },
  "sourceTimelineAudioCues": [
    {
      "id": "in009-source-main",
      "sourceCueId": "embedded-stream-0001",
      "frame": 7,
      "endFrame": 638,
      "frameDomain": "sprite-200",
      "language": "en",
      "scenario": "default",
      "source": "/flash-assets/courses/course-g04-l03-in-009/audio/embedded-stream-0001.mp3",
      "durationMs": 48672,
      "sha256": "f8f48409ed9b3a3abf31ce5b50f4fae9911746e90401218deed93b68cdef09a5",
      "spokenLanguage": "undetermined"
    }
  ],
  "terminalTimelineAudio": {
    "frameDomain": "sprite-200",
    "holdFrame": 637,
    "endFrameExclusive": 638,
    "cueId": "in009-source-main",
    "sourceSha256": "f8f48409ed9b3a3abf31ce5b50f4fae9911746e90401218deed93b68cdef09a5",
    "pcmSha256": "f84da55420905a37cb6f98e47b83c6bfd58e7f1d60a52e95a456c31fee58ae6b"
  },
  "reducedMotionFrameByDomain": {
    "sprite-200": 637
  }
} as const satisfies Pick<LessonTextPresentationCapability<unknown>,'playbackMode'|'playbackEndFrameByDomain'|'reducedMotionFrameByDomain'|'sourceTimelineAudioCues'|'terminalTimelineAudio'>;
