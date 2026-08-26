# G4 L10 TS007/TS008 language and audio technical binding v1

Status: **SOURCE_STATIC_EN_ES_AUDIO_CANDIDATES_BOUND_MANIFEST_FOLLOWUP_UNAPPLIED_RUNTIME_LISTENING_PENDING**

Decision: **PRESERVE_EXACT_CANDIDATES_DO_NOT_PATCH_MANIFEST_DO_NOT_PLAY_DO_NOT_ACCEPT**

This acceptance-neutral successor binds two exact external SA-route MP3 candidates and 24 embedded language-undetermined SoundStreams across TS007 and TS008. The external files are structural Spanish-route candidates only; no spoken language, playback, runtime reachability, synchronization, or acceptance is established.

## Exact findings

- TS007: 1 external plus 12 embedded candidates; Question 1; RandomAudio is empty.
- TS008: 1 external plus 12 embedded candidates; Question 2; RandomAudio is empty.
- Both manifests currently declare only `und`, while their canonical inventories contain `es` plus `und`.
- The exact future patch candidate is `audio.languages: ["und","es"]` and exact-association `language: "es"`; it was not applied or adopted.
- These two L10 MP3s are present. The separate whole-Grade-4 blocker remains 16 MP3s: lesson 2 has 14, lesson 6 has 1, and lesson 8 has 1.

## Boundary

No workspace, manifest, source asset, helper, original runtime, renderer, test baseline, RMSE evidence, audio acceptance, human review, owner acceptance, promotion, release, or publication changed. The latest v2.14 security batch remains nonreusable and provides no production-helper or runtime-launch authority.

Report fingerprint: `d41cdebb5c88ce57b862bb173c91897244fffe0d615b190d605eb8e9d639f76b`.
