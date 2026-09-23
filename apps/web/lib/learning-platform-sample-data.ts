/**
 * Design-prototype data transcribed from:
 * design/claude-ui-reconstructions/2026-08-08/pages/helpmath-2-soft.html
 *
 * This module is intentionally explicit about its evidence boundary. Curriculum
 * labels and page titles mirror the prototype, while learner records, mastery
 * values, attention signals, preference states, stickers, and Nova replies are
 * sample/invented interface data. Nothing here is a production roster, an
 * operational policy, or an acceptance/release record.
 */

export type LearningLocalePair = readonly [english: string, spanish: string];

export type LearningSectionCode =
  | "IR"
  | "RW"
  | "VB"
  | "IN"
  | "TI"
  | "GS"
  | "TS"
  | "FQ";

export type LearningPlatformTint =
  | "sky"
  | "mint"
  | "grape"
  | "sun"
  | "peach"
  | "blue"
  | "nova"
  | "gold";

export interface LearningSectionSample {
  readonly code: LearningSectionCode;
  readonly en: string;
  readonly es: string;
  readonly kid: LearningLocalePair;
  readonly pages: number;
  readonly emoji: string;
  readonly tint: LearningPlatformTint;
}

export interface LessonCatalogSampleItem {
  readonly grade: number;
  readonly lesson: number;
  readonly title: string;
  readonly pages: number;
}

export interface LearningWordSample {
  readonly en: string;
  readonly es: string | null;
  readonly emoji: string;
}

export interface LearnerPowerSampleItem {
  readonly en: string;
  readonly es: string;
  readonly probability: number;
  readonly tint: "mint" | "sun" | "peach";
}

export interface TeacherRosterSampleItem {
  readonly name: string;
  readonly englishLearner: boolean;
  readonly values: readonly [number, number, number, number, number];
}

export interface TeacherAttentionSampleItem {
  readonly name: string;
  readonly tone: "peach" | "sun";
  readonly why: LearningLocalePair;
  readonly action: LearningLocalePair;
}

export interface LearningHelperSampleItem {
  readonly emoji: string;
  readonly title: LearningLocalePair;
  readonly detail: LearningLocalePair;
  readonly enabled: boolean;
}

export interface NovaControlSampleItem {
  readonly emoji?: string;
  readonly title: LearningLocalePair;
  readonly detail: LearningLocalePair;
  readonly enabled: boolean;
}

export const LEARNING_SECTIONS = [
  {
    code: "IR",
    en: "Introduction",
    es: "Introduction",
    kid: ["Start here", "Empieza aquí"],
    pages: 1,
    emoji: "👋",
    tint: "sky",
  },
  {
    code: "RW",
    en: "Your World",
    es: "Tu mundo",
    kid: ["Your world", "Tu mundo"],
    pages: 3,
    emoji: "🌍",
    tint: "mint",
  },
  {
    code: "VB",
    en: "Important Words",
    es: "Palabras importantes",
    kid: ["Words", "Palabras"],
    pages: 8,
    emoji: "💬",
    tint: "grape",
  },
  {
    code: "IN",
    en: "Learn It",
    es: "Apréndelo",
    kid: ["Learn it", "Apréndelo"],
    pages: 11,
    emoji: "💡",
    tint: "sun",
  },
  {
    code: "TI",
    en: "Try It",
    es: "Inténtalo!",
    kid: ["Try it", "Inténtalo"],
    pages: 5,
    emoji: "✏️",
    tint: "peach",
  },
  {
    code: "GS",
    en: "Play It",
    es: "Juégalo",
    kid: ["Play it", "Juégalo"],
    pages: 1,
    emoji: "🎲",
    tint: "blue",
  },
  {
    code: "TS",
    en: "Practice Test",
    es: "Plan de los cuatro pasos",
    kid: ["Practice", "Práctica"],
    pages: 7,
    emoji: "📋",
    tint: "nova",
  },
  {
    code: "FQ",
    en: "Final Quiz",
    es: "Examen Final",
    kid: ["Final quiz", "Examen final"],
    pages: 3,
    emoji: "🏆",
    tint: "gold",
  },
] as const satisfies readonly LearningSectionSample[];

export const LESSON_CATALOG_SAMPLE = [
  { grade: 3, lesson: 1, title: "Place Value", pages: 74 },
  { grade: 3, lesson: 2, title: "Addition and Subtraction", pages: 70 },
  { grade: 3, lesson: 3, title: "Multiplication", pages: 63 },
  { grade: 3, lesson: 4, title: "Division", pages: 67 },
  { grade: 3, lesson: 5, title: "Fractions", pages: 62 },
  { grade: 3, lesson: 6, title: "Decimals & Money", pages: 56 },
  { grade: 3, lesson: 8, title: "Measurement", pages: 61 },
  { grade: 3, lesson: 9, title: "Measurement", pages: 93 },
  { grade: 4, lesson: 1, title: "Place Value", pages: 80 },
  { grade: 4, lesson: 2, title: "Fractions & Decimals", pages: 67 },
  { grade: 4, lesson: 3, title: "Negative Numbers", pages: 39 },
  { grade: 4, lesson: 4, title: "Addition & Subtraction", pages: 54 },
  { grade: 4, lesson: 5, title: "Multiplication", pages: 53 },
  { grade: 4, lesson: 6, title: "Division", pages: 49 },
  { grade: 4, lesson: 7, title: "Factoring", pages: 48 },
  { grade: 4, lesson: 8, title: "Mathematical Expressions", pages: 46 },
  { grade: 4, lesson: 9, title: "Equations", pages: 43 },
  { grade: 4, lesson: 10, title: "Perimeter & Area", pages: 46 },
  { grade: 4, lesson: 11, title: "Coordinate Grid", pages: 43 },
  { grade: 4, lesson: 12, title: "Geometry", pages: 77 },
  {
    grade: 5,
    lesson: 1,
    title: "Working with Decimals and Percents",
    pages: 82,
  },
  { grade: 5, lesson: 2, title: "Percents", pages: 64 },
  {
    grade: 5,
    lesson: 3,
    title: "Exponents & Prime Factorizations",
    pages: 65,
  },
  { grade: 5, lesson: 4, title: "Number Lines", pages: 54 },
  {
    grade: 5,
    lesson: 5,
    title: "Add & Subtract Negative Numbers",
    pages: 56,
  },
  { grade: 5, lesson: 6, title: "Division Skills", pages: 40 },
  {
    grade: 5,
    lesson: 7,
    title: "Add, Subtract, Multiply & Divide Decimals",
    pages: 55,
  },
  {
    grade: 5,
    lesson: 8,
    title: "Add & Subtract Fractions",
    pages: 71,
  },
  { grade: 5, lesson: 13, title: "Geometry", pages: 73 },
] as const satisfies readonly LessonCatalogSampleItem[];

export const WORDS_G4_L3 = [
  { en: "Number Line", es: "Recta numérica", emoji: "📈" },
  {
    en: "Number Line Practice",
    es: "Práctica de la recta numérica",
    emoji: "📈",
  },
  { en: "Positive Numbers", es: "Números positivos", emoji: "➕" },
  { en: "Negative Numbers", es: "Números negativos", emoji: "➖" },
  { en: "Zero", es: "Cero", emoji: "0️⃣" },
  {
    en: "Positive Numbers Practice",
    es: "Práctica de números positivos",
    emoji: "➕",
  },
  {
    en: "Negative Numbers Practice",
    es: "Práctica de números negativos",
    emoji: "➖",
  },
  { en: "Pattern", es: "Patrón", emoji: "🔷" },
] as const satisfies readonly LearningWordSample[];

export const WORDS_G5_L4 = [
  {
    en: "Numbers on a Number Line",
    es: "Números en la recta numérica",
    emoji: "📈",
  },
  { en: "Integers", es: "Enteros", emoji: "🔢" },
  { en: "Zero", es: "Cero", emoji: "0️⃣" },
  { en: "Opposites", es: "Opuestos", emoji: "↔️" },
  { en: "Positive Integers", es: "Enteros positivos", emoji: "➕" },
  { en: "Negative Integers", es: "Enteros negativos", emoji: "➖" },
  { en: "Integers Practice", es: "Práctica de enteros", emoji: "🔢" },
] as const satisfies readonly LearningWordSample[];

export const WORDS_CONTEXT_SAMPLE = [
  { en: "Negative number", es: "Número negativo", emoji: "➖" },
  { en: "Less than", es: "Menor que", emoji: "⬅️" },
  { en: "Value", es: "Valor", emoji: "🏷️" },
  { en: "Positive", es: "Positivo", emoji: "➕" },
] as const satisfies readonly LearningWordSample[];

export const WORDS_WITH_SOURCE_GAPS = [
  { en: "Coordinate Grid", es: null, emoji: "📍" },
  { en: "Ordered Pair", es: null, emoji: "📍" },
] as const satisfies readonly LearningWordSample[];

export const LEARNER_POWER_SAMPLE = [
  {
    en: "Reading a number line",
    es: "Leer una recta numérica",
    probability: 0.88,
    tint: "mint",
  },
  {
    en: "Negative numbers",
    es: "Números negativos",
    probability: 0.61,
    tint: "sun",
  },
  {
    en: "Zero as a boundary",
    es: "El cero como frontera",
    probability: 0.74,
    tint: "sun",
  },
  {
    en: "Patterns",
    es: "Patrones",
    probability: 0.42,
    tint: "peach",
  },
] as const satisfies readonly LearnerPowerSampleItem[];

export const LEARNER_SUMMARY_SAMPLE = {
  name: "Maria",
  streakDays: 4,
  stickers: 5,
  currentPage: 21,
  totalPages: 39,
  currentStep: 4,
  totalSteps: 8,
} as const;

export const TEACHER_ROSTER_SAMPLE = [
  {
    name: "Ana R.",
    englishLearner: true,
    values: [0.94, 0.71, 0.83, 0.55, 0.62],
  },
  {
    name: "Brian O.",
    englishLearner: false,
    values: [0.88, 0.62, 0.79, 0.44, 0.51],
  },
  {
    name: "Carmen L.",
    englishLearner: true,
    values: [0.97, 0.91, 0.95, 0.81, 0.77],
  },
  {
    name: "Diego M.",
    englishLearner: true,
    values: [0.52, 0.28, 0.44, 0.19, 0.23],
  },
  {
    name: "Emily T.",
    englishLearner: false,
    values: [0.91, 0.84, 0.88, 0.72, 0.69],
  },
  {
    name: "Farah K.",
    englishLearner: true,
    values: [0.66, 0.39, 0.58, 0.31, 0.34],
  },
  {
    name: "Grace W.",
    englishLearner: false,
    values: [0.79, 0.55, 0.71, 0.48, 0.44],
  },
  {
    name: "Hugo S.",
    englishLearner: true,
    values: [0.41, 0.22, 0.36, 0.17, 0.15],
  },
] as const satisfies readonly TeacherRosterSampleItem[];

export const TEACHER_ATTENTION_SAMPLE = [
  {
    name: "Hugo S.",
    tone: "peach",
    why: [
      "Answered 5 negative-number items by counting up. Same error each time — not a guess.",
      "Respondió 5 preguntas de números negativos contando hacia arriba. El mismo error cada vez — no es adivinanza.",
    ],
    action: [
      "Sit with the thermometer model",
      "Siéntate con él y el termómetro",
    ],
  },
  {
    name: "Diego M.",
    tone: "peach",
    why: [
      "Asked Nova “what is below” four times in Spanish. The word, not the maths.",
      "Le preguntó a Nova “qué es below” cuatro veces en español. Es la palabra, no la matemática.",
    ],
    action: ["Pre-teach below / bajo", "Enseña antes below / bajo"],
  },
  {
    name: "Farah K.",
    tone: "sun",
    why: [
      "Stopped mid-step twice this week, both times on a text-heavy page.",
      "Se detuvo a mitad de paso dos veces esta semana, las dos en una página con mucho texto.",
    ],
    action: ["Turn on Read it", "Activa Read it"],
  },
  {
    name: "Grace W.",
    tone: "sun",
    why: [
      "Patterns has not moved in six attempts.",
      "Patterns no se ha movido en seis intentos.",
    ],
    action: ["Reteach with Play It", "Vuelve a enseñar con Play It"],
  },
] as const satisfies readonly TeacherAttentionSampleItem[];

export const LEARNING_HELPER_SAMPLE = [
  {
    emoji: "🇪🇸",
    title: ["Spanish next to English", "Español junto al inglés"],
    detail: [
      "Show both words for every key term",
      "Muestra las dos palabras de cada término",
    ],
    enabled: true,
  },
  {
    emoji: "🔊",
    title: ["Read it to me", "Léemelo"],
    detail: [
      "Nova reads the page out loud",
      "Nova lee la página en voz alta",
    ],
    enabled: true,
  },
  {
    emoji: "🐢",
    title: ["Go slower", "Más despacio"],
    detail: [
      "A longer pause between sentences",
      "Una pausa más larga entre oraciones",
    ],
    enabled: true,
  },
  {
    emoji: "🔤",
    title: ["Keep my words up", "Deja mis palabras"],
    detail: [
      "The word bank stays open on questions",
      "El banco de palabras queda abierto en las preguntas",
    ],
    enabled: true,
  },
  {
    emoji: "🖼️",
    title: ["Keep the picture up", "Deja el dibujo"],
    detail: [
      "The model stays while the question is asked",
      "El modelo se queda mientras se hace la pregunta",
    ],
    enabled: false,
  },
  {
    emoji: "🎧",
    title: [
      "Spanish sound in English lessons",
      "Audio en español en lecciones en inglés",
    ],
    detail: [
      "35 Spanish tracks ship with this lesson but only show in the Spanish locale today. Nobody has listened and signed off, so it is labelled unverified.",
      "Esta lección trae 35 pistas en español, pero hoy solo aparecen en el idioma español. Nadie las ha escuchado y aprobado, así que se marcan como no verificadas.",
    ],
    enabled: false,
  },
] as const satisfies readonly LearningHelperSampleItem[];

export const NOVA_CONTROL_SAMPLE = [
  {
    title: [
      "Nova available in this class",
      "Nova disponible en esta clase",
    ],
    detail: [
      "Off in whole-class mode by default",
      "Apagada por defecto en modo de clase completa",
    ],
    enabled: true,
  },
  {
    title: ["Voice input", "Entrada por voz"],
    detail: [
      "Microphone — needs signed district consent",
      "Micrófono — requiere consentimiento firmado del distrito",
    ],
    enabled: false,
  },
  {
    title: ["Photo of paper", "Foto del papel"],
    detail: [
      "Camera — needs signed district consent",
      "Cámara — requiere consentimiento firmado del distrito",
    ],
    enabled: false,
  },
  {
    title: ["Spanish replies", "Respuestas en español"],
    detail: [
      "Marked as Nova talking, never lesson content",
      "Marcadas como habla de Nova, nunca contenido de la lección",
    ],
    enabled: true,
  },
] as const satisfies readonly NovaControlSampleItem[];

export const G4_L3_PAGE_TITLES = [
  "Introduction",
  "Page 1",
  "Page 2",
  "Page 3",
  "Number Line",
  "Number Line Practice",
  "Positive Numbers",
  "Negative Numbers",
  "Zero",
  "Positive Numbers Practice",
  "Negative Numbers Practice",
  "Pattern",
  "Numbers on the Number Line",
  "Numbers on the Number Line",
  "Numbers on the Number Line",
  "Numbers on the Number Line",
  "Numbers on the Number Line",
  "Patterns",
  "Patterns",
  "Situations with Negative Numbers: Temperature",
  "Situations with Negative Numbers: Temperature",
  "Situations with Negative Numbers: Owing",
  "Situations with Negative Numbers: Owing",
  "Question 1",
  "Question 2",
  "Question 3",
  "Question 4",
  "Question 5",
  "Game 1",
  "4 - Step Plan",
  "4 - Step Plan",
  "4 - Step Plan",
  "4 - Step Plan",
  "4 - Step Plan",
  "Question 1",
  "Question 2",
  "Introduction",
  "Page 1",
  "Page 2",
] as const;

export const LEARNING_PLATFORM_SAMPLE_BOUNDARY = {
  schemaVersion: 1,
  sourceArtifact:
    "design/claude-ui-reconstructions/2026-08-08/pages/helpmath-2-soft.html",
  classification: "design-prototype-sample-and-evidence-data",
  isProductionData: false,
  dataClassifications: {
    sections: "prototype-transcription",
    lessonCatalog: "prototype-transcription-not-a-release-registry",
    vocabulary: "prototype-transcription",
    pageTitles: "prototype-transcription",
    learnerPowers: "invented-sample",
    learnerSummary: "invented-sample",
    teacherRoster: "invented-sample",
    teacherAttention: "invented-sample",
    helperStates: "prototype-sample-not-a-saved-learner-preference",
    novaControls: "prototype-sample-not-an-operational-policy",
  },
  inventedPrototypeData: [
    "learner names",
    "English-learner flags",
    "mastery probabilities and roster values",
    "teacher attention narratives and suggested actions",
    "stickers",
    "Nova replies",
  ],
  prototypeUi: {
    openLessonKeys: ["4-3", "5-4"],
    assessmentSectionCodes: ["TI", "TS", "FQ"],
    lessonEmojiByTitle: {
      "Place Value": "🔢",
      "Addition and Subtraction": "➕",
      Multiplication: "✖️",
      Division: "➗",
      Fractions: "🍕",
      "Decimals & Money": "💵",
      Measurement: "📏",
      "Fractions & Decimals": "🍕",
      "Negative Numbers": "🌡️",
      "Addition & Subtraction": "➕",
      Factoring: "🧩",
      "Mathematical Expressions": "🧾",
      Equations: "⚖️",
      "Perimeter & Area": "🟦",
      "Coordinate Grid": "📍",
      Geometry: "📐",
      "Working with Decimals and Percents": "💯",
      Percents: "💯",
      "Exponents & Prime Factorizations": "⚡",
      "Number Lines": "📈",
      "Add & Subtract Negative Numbers": "🌡️",
      "Division Skills": "➗",
      "Add, Subtract, Multiply & Divide Decimals": "🔟",
      "Add & Subtract Fractions": "🍰",
    },
  },
  lessonEvidenceBoundary: {
    grade4Lesson3: {
      lessonKey: "4-3",
      title: "Negative Numbers",
      role: "current-javascript-showcase-and-evidence",
      accessBoundary: "explicit-current-js-showcase-only",
      pageTitleCount: 39,
      strictCompletionClaim: false,
      publicationClaim: false,
    },
    grade5Lesson4: {
      lessonKey: "5-4",
      title: "Number Lines",
      role: "prototype-and-audit-evidence-only",
      accessBoundary: "not-public-runnable",
      publicRunnable: false,
      strictCompletionClaim: false,
      publicationClaim: false,
    },
  },
  acceptanceClaims: {
    flashFidelity: false,
    audio: false,
    originalRuntime: false,
    humanVisualReview: false,
    ownerAcceptance: false,
    strictCompletion: false,
    release: false,
    publication: false,
  },
  notice:
    "Design prototype only. Sample data and current-JavaScript evidence do not imply fidelity, audio, original-runtime, owner, strict-completion, release, or publication acceptance.",
} as const;
