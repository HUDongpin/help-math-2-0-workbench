// P064 audio is a source-bound local preview only. Production must not bundle
// the source reader or expose audio, even through an unpublished route.
export function p064QuestionAudioResponse(): Response {
  return new Response(null, {status: 404});
}

export function p064OptionAudioResponse(): Response {
  return new Response(null, {status: 404});
}
