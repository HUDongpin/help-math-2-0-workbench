/** Public response identity only. No provider credential or routing data lives here. */
export const NOVA_TUTOR_MODEL = 'openai/gpt-5.6-luna' as const;
export const NOVA_TUTOR_DISPLAY_NAME = 'GPT-5.6 Luna' as const;
export const NOVA_TUTOR_GATEWAY = 'openrouter' as const;

export type NovaTutorModel = typeof NOVA_TUTOR_MODEL;
