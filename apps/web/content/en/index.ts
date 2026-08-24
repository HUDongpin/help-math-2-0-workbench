import type { SiteContent } from "../types";

export const enContent = {
  locale: "en",
  shared: {
    siteName: "HELP Math",
    siteTagline: "Math language made visible",
    skipToContent: "Skip to main content",
    statusLabel: "Learning platform preview",
    statusMessage:
      "Eight current-JavaScript lessons are available with 426 source-ordered page placements: G3 L2 (70); G4 L3 (39), L5 (53), L10 (46), and L11 (43); and G5 L3 (65), L4 (54), and L5 (56). This is runnable learning access, not strict Flash fidelity, audio acceptance, Owner acceptance, or publication of the wider curriculum.",
    externalLinkLabel: "Opens in a new tab",
    requiredFieldLabel: "Required",
    navigation: {
      ariaLabel: "Main navigation",
      homeLabel: "HELP Math home",
      links: [
        { label: "About", href: "/about" },
        { label: "Approach", href: "/approach" },
        { label: "Curriculum", href: "/curriculum" },
        { label: "Research", href: "/research" },
        { label: "Resources", href: "/resources" },
        { label: "Demos", href: "/demos" },
      ],
      supportAction: { label: "Get support", href: "/support" },
      languageLabel: "Language",
      languageNames: { en: "English", es: "Español" },
      openMenuLabel: "Open navigation",
      closeMenuLabel: "Close navigation",
    },
    footer: {
      summary:
        "HELP Math is a learning platform with English and Spanish interface options that makes mathematical ideas visible and offers guided support through Nova Tutor.",
      exploreLabel: "Learning",
      helpLabel: "Help and policies",
      exploreLinks: [
        { label: "Learning home", href: "/" },
        { label: "Negative Numbers lesson", href: "/courses/4/3?mode=focus" },
        { label: "Learn with Nova", href: "/courses/4/3?mode=focus" },
        { label: "Curriculum and evidence", href: "/curriculum" },
      ],
      helpLinks: [
        { label: "Support", href: "/support" },
        { label: "Contact", href: "/contact" },
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
      ],
      languageNote:
        "The platform interface is available in English and Spanish. Source media and interactions vary by page and do not form a complete or validated Spanish experience.",
      legalNote:
        "Eight page-complete lessons—G3 L2; G4 L3, L5, L10, and L11; and G5 L3 through L5—are runnable in current JavaScript. Strict Flash fidelity, audio acceptance, Owner acceptance, and wider-curriculum publication remain separate gates.",
    },
  },
  pages: {
    home: {
      metadata: {
        title: "Math language made visible",
        description:
          "Meet the modern HELP Math project: bilingual math support, research context, restored interactive demonstrations, and help for returning educators and students.",
      },
      hero: {
        eyebrow: "Welcome back to HELP Math",
        title: "See the language inside every math idea.",
        summary:
          "HELP Math connects visual models, clear explanations, academic vocabulary, and guided practice so multilingual learners can make sense of both the mathematics and the words used to describe it.",
        primaryAction: { label: "Explore the demos", href: "/demos" },
        secondaryAction: { label: "Get project support", href: "/support" },
        supportingNote:
          "The website now offers eight runnable current-JavaScript lessons with 426 source-ordered page placements: G3 L2 (70); G4 L3 (39), L5 (53), L10 (46), and L11 (43); and G5 L3 (65), L4 (54), and L5 (56). Strict Flash fidelity, audio acceptance, Owner acceptance, and publication of the wider curriculum remain separate gates.",
      },
      status: {
        label: "Project status",
        title: "A careful rebuild—not a copy of an old website",
        body:
          "We are preserving HELP Math’s instructional ideas while replacing legacy delivery technology with accessible, maintainable web experiences. Accounts, assignments, and student progress records are not part of this launch.",
        action: { label: "Read the modernization status", href: "/about#today" },
      },
      audiences: {
        eyebrow: "Built around real learning needs",
        title: "A clearer path into mathematical meaning",
        intro:
          "Different learners need different entry points. HELP Math’s restored public experience focuses on explanation, language, and supportive representations.",
        cards: [
          {
            id: "multilingual-learners",
            title: "For multilingual learners",
            description:
              "Connect everyday language, academic vocabulary, symbols, and visual models without lowering the mathematical goal.",
          },
          {
            id: "students-needing-support",
            title: "For students who need another route",
            description:
              "Break complex ideas into visible, paced steps and offer multiple ways to notice relationships and patterns.",
          },
          {
            id: "educators",
            title: "For educators",
            description:
              "Review the instructional approach, explore restored examples, and help shape responsible next steps for the project.",
          },
        ],
      },
      approach: {
        eyebrow: "How HELP Math teaches",
        title: "Words, representations, and reasoning work together",
        intro:
          "The historic program paired mathematics instruction with language supports. The modernization keeps that core idea visible in every restored activity.",
        cards: [
          {
            id: "make-language-explicit",
            title: "Make language explicit",
            description:
              "Introduce key terms in context and connect them to symbols, actions, diagrams, and examples.",
          },
          {
            id: "show-relationships",
            title: "Show relationships",
            description:
              "Use animation and manipulable representations to reveal what changes, what stays the same, and why.",
          },
          {
            id: "pace-the-thinking",
            title: "Pace the thinking",
            description:
              "Segment explanations into purposeful steps so learners can attend to one relationship at a time.",
          },
        ],
        action: { label: "See the instructional approach", href: "/approach" },
      },
      demos: {
        eyebrow: "Learning experience available",
        title: "Choose a lesson to explore",
        intro:
          "Grade 4 Lesson 3, Negative Numbers, and Grade 5 Lesson 4, Number Lines, are now runnable current-JavaScript lessons with local progress and learning supports.",
        items: [],
        note:
          "These runnable lessons do not claim strict Flash fidelity, audio acceptance, Owner acceptance, or publication of the wider curriculum.",
      },
      closing: {
        title: "Returning to HELP Math? We want to point you in the right direction.",
        body:
          "Tell us whether you are looking for an old account, program materials, research information, or a future collaboration. Please do not include student records or passwords.",
        action: { label: "Contact the project", href: "/contact" },
      },
    },
    about: {
      metadata: {
        title: "About HELP Math",
        description:
          "Learn what HELP Math was designed to do, what is being preserved, and what the current modernization does and does not include.",
      },
      hero: {
        eyebrow: "About the project",
        title: "Preserving an instructional idea worth rebuilding",
        summary:
          "HELP Math—historically short for Help with English Language Proficiency—was designed to develop mathematical understanding alongside the academic language students need to participate in math learning.",
        primaryAction: { label: "Explore our approach", href: "/approach" },
        secondaryAction: { label: "View the research archive", href: "/research" },
      },
      story: [
        {
          id: "purpose",
          eyebrow: "The original purpose",
          title: "Mathematics and language belong in the same lesson",
          paragraphs: [
            "Historic HELP Math materials describe a web-based intervention for English learners and other students who benefit from additional mathematics support.",
            "Its distinctive instructional goal was not simply to translate directions. Lessons connected mathematical concepts with academic vocabulary, visual models, spoken and written explanations, guided practice, and bilingual support.",
          ],
        },
        {
          id: "preservation",
          eyebrow: "What we are preserving",
          title: "Instructional structure before technical nostalgia",
          paragraphs: [
            "The project archive includes lesson sources, interactive media, program descriptions, and research materials from different periods of HELP Math’s history.",
            "The restoration treats those files as evidence. It preserves meaningful explanations, pacing, language supports, and learner interactions while replacing obsolete browser technology.",
          ],
        },
        {
          id: "today",
          eyebrow: "Where we are today",
          title: "A learning platform with eight runnable current-JavaScript lessons",
          paragraphs: [
            "This release provides eight runnable current-JavaScript lessons with 426 source-ordered page placements in the modern My Lesson experience: G3 L2; G4 L3, L5, L10, and L11; and G5 L3 through L5.",
            "It does not restore the former account system or provide classes, assignments, purchases, teacher dashboards, or formal grades. Strict Flash fidelity, audio acceptance, Owner acceptance, and wider-curriculum publication remain separate gates.",
          ],
        },
      ],
      principles: {
        eyebrow: "Modernization principles",
        title: "What guides each decision",
        cards: [
          {
            id: "evidence",
            title: "Evidence before claims",
            description:
              "We separate dated historical records from claims that have been independently verified for present use.",
          },
          {
            id: "access",
            title: "Access by design",
            description:
              "Responsive layouts, keyboard use, readable contrast, text alternatives, and reduced motion are part of the build—not an afterthought.",
          },
          {
            id: "language",
            title: "Language with dignity",
            description:
              "Bilingual and academic-language supports should expand access to rigorous ideas, never signal lower expectations.",
          },
          {
            id: "privacy",
            title: "Student privacy first",
            description:
              "The public launch collects no student learning data and does not ask learners to create accounts.",
          },
        ],
      },
      today: {
        title: "Help us understand how HELP Math was used",
        body:
          "Former educators, partners, and researchers can share non-confidential context about the program’s history. Please do not send student names, records, credentials, or copyrighted materials you are not authorized to share.",
        action: { label: "Contact the restoration team", href: "/contact?topic=project-history" },
      },
    },
    approach: {
      metadata: {
        title: "Instructional Approach",
        description:
          "See how HELP Math combines academic language, visual representations, paced explanations, and bilingual supports around rigorous mathematical ideas.",
      },
      hero: {
        eyebrow: "Instructional approach",
        title: "Make the mathematics—and its language—easier to see",
        summary:
          "HELP Math’s archived design draws on sheltered instruction: make meaning explicit, connect language to representations, segment complex reasoning, and give learners supported opportunities to engage with the same mathematical goal.",
        primaryAction: { label: "Try a restored demo", href: "/demos" },
        secondaryAction: { label: "Review curriculum context", href: "/curriculum" },
      },
      foundations: {
        eyebrow: "Four foundations",
        title: "Support that stays connected to the idea",
        intro:
          "Each layer should help a learner reason—not decorate the screen or replace productive thinking.",
        cards: [
          {
            id: "academic-language",
            title: "Academic language in context",
            description:
              "Define and revisit terms where they do mathematical work, linking words such as equivalent, convert, and represent to visible relationships.",
          },
          {
            id: "multiple-representations",
            title: "Multiple representations",
            description:
              "Coordinate numbers, symbols, diagrams, manipulatives, and spoken or written explanations so learners can connect forms of meaning.",
          },
          {
            id: "segmentation",
            title: "Purposeful segmentation",
            description:
              "Break explanations into coherent beats, control the pace, and leave enough time to notice the relationship under discussion.",
          },
          {
            id: "bilingual-support",
            title: "Bilingual support",
            description:
              "Use Spanish support as a bridge to understanding while keeping important English academic terms visible and meaningful.",
          },
        ],
      },
      learningSequence: {
        eyebrow: "A learning sequence",
        title: "From orientation to independent reasoning",
        intro:
          "Exact lesson patterns vary, but the restored experience follows a transparent instructional arc.",
        steps: [
          {
            id: "orient",
            step: "01",
            title: "Orient",
            description:
              "Name the goal, activate useful prior knowledge, and introduce the language learners will need.",
          },
          {
            id: "model",
            step: "02",
            title: "Model",
            description:
              "Make a relationship visible through a worked example, coordinated representations, and a concise explanation.",
          },
          {
            id: "interact",
            step: "03",
            title: "Interact",
            description:
              "Let learners predict, replay, manipulate, or compare so attention stays on the mathematical structure.",
          },
          {
            id: "practice",
            step: "04",
            title: "Practice and explain",
            description:
              "Move toward independent work while inviting learners to use the target language to describe their reasoning.",
          },
        ],
      },
      supportLayers: {
        id: "support-layers",
        eyebrow: "Support design goals",
        title: "Layer support without hiding the mathematics",
        paragraphs: [
          "A modern activity may be designed to combine concise text, narration, visual emphasis, a glossary connection, Spanish language support, replay, and learner-controlled pacing. In the current showcase, availability varies page by page; Spanish source media and interactions are not complete or validated.",
          "Not every activity needs every support. The goal is to make each support purposeful, perceivable, and removable when a learner no longer needs it.",
        ],
        bullets: [
          "Keep labels close to the representations they describe.",
          "Use motion to explain change, not to compete for attention.",
          "Offer pause and replay without changing the instructional sequence.",
          "Treat complete Spanish and English learning experiences as a design goal, not as a claim about every current showcase page.",
        ],
      },
      teacherRole: {
        title: "Technology supports instruction; educators shape its use.",
        body:
          "The platform now provides eight runnable current-JavaScript lessons totaling 426 source-ordered page placements, not a complete released curriculum or an automated teaching system. Strict Flash fidelity, audio acceptance, Owner acceptance, and wider-curriculum publication remain separate gates. Educators remain essential for choosing appropriate tasks, listening to student reasoning, and connecting activities to classroom goals.",
        action: { label: "Ask an instructional question", href: "/contact?topic=instruction" },
      },
    },
    curriculum: {
      metadata: {
        title: "Curriculum",
        description:
          "Explore the historical HELP Math curriculum domains, lesson flow, and the limits of the material currently available on the modern site.",
      },
      hero: {
        eyebrow: "Curriculum context",
        title: "A broad archive, returning one carefully reviewed piece at a time",
        summary:
          "Historic materials describe HELP Math configurations for upper-elementary and middle-grade mathematics, with additional uses for remediation. The current website provides project context while JavaScript candidates remain in local audit—not the full historical curriculum.",
        primaryAction: { label: "View demonstration availability", href: "/demos" },
        secondaryAction: { label: "Request curriculum information", href: "/contact?topic=curriculum" },
      },
      archiveNotice: {
        title: "Why we do not publish a single lesson or hour count",
        body:
          "Archived documents describe different editions and proposed scopes, including grade 3–8 and grade 6–8 configurations. Those records are being reconciled before any current catalog, standards alignment, or availability claim is published.",
      },
      domains: {
        eyebrow: "Historical content domains",
        title: "Mathematical ideas represented in the archive",
        intro:
          "The archive includes work across four broad domains. Coverage and sequence vary by historical edition and remain under audit.",
        cards: [
          {
            id: "numbers",
            title: "Numbers and operations",
            description:
              "Place value, number relationships, fractions, decimals, proportional reasoning, and operations represented with language and visual models.",
          },
          {
            id: "geometry",
            title: "Geometry and measurement",
            description:
              "Properties, spatial relationships, units, measurement, and geometric reasoning made visible through diagrams and manipulation.",
          },
          {
            id: "algebra",
            title: "Patterns and algebraic thinking",
            description:
              "Patterns, variables, expressions, equations, and the language used to describe general relationships.",
          },
          {
            id: "data",
            title: "Data and probability",
            description:
              "Reading, representing, comparing, and reasoning from data using coordinated graphs, quantities, and explanations.",
          },
        ],
      },
      lessonFlow: {
        eyebrow: "Learning-object design",
        title: "How a restored lesson can unfold",
        steps: [
          {
            id: "goal-language",
            step: "1",
            title: "Set the goal and language",
            description:
              "Clarify the mathematical purpose, relevant prior knowledge, and words learners will encounter.",
          },
          {
            id: "concept-development",
            step: "2",
            title: "Develop the concept",
            description:
              "Use synchronized representations and paced examples to reveal a key relationship.",
          },
          {
            id: "guided-application",
            step: "3",
            title: "Apply with support",
            description:
              "Provide meaningful choices, feedback, replay, and language scaffolds during practice.",
          },
          {
            id: "reflect-check",
            step: "4",
            title: "Reflect and check",
            description:
              "Invite explanation and check understanding without treating one interaction as a full measure of mastery.",
          },
        ],
      },
      availability: {
        id: "availability",
        eyebrow: "What is available now",
        title: "Eight runnable lessons, without enrollment",
        paragraphs: [
          "The learning platform currently offers eight current-JavaScript lessons in the modern My Lesson experience: Grade 3 Lesson 2, Addition and Subtraction (70 page placements); Grade 4 Lesson 3, Negative Numbers (39); Grade 4 Lesson 5, Multiplication (53); Grade 4 Lesson 10, Perimeter & Area (46); Grade 4 Lesson 11, Coordinate Grid (43); Grade 5 Lesson 3, Exponents & Prime Factorizations (65); Grade 5 Lesson 4, Number Lines (54); and Grade 5 Lesson 5, Add & Subtract Negative Numbers (56). They include local browser progress and learning supports, but no placement testing, teacher dashboard, class assignment, enrollment, or formal grade record.",
          "The interface is available in English and Spanish, but source media and interactions vary by page and do not form a complete or validated Spanish experience.",
          "These lessons are runnable product access, not strict migration, Flash-fidelity, audio-acceptance, or Owner-acceptance claims. Wider curriculum publication still depends on source audit, rights review, instructional review, accessibility work, original-behavior validation, human review, and Owner acceptance.",
        ],
      },
      closing: {
        title: "Looking for a specific lesson or historical scope document?",
        body:
          "Send an adult contact request with the topic and intended use. We will confirm what can be shared and whether an accessible copy is available.",
        action: { label: "Request curriculum information", href: "/contact?topic=curriculum" },
      },
    },
    research: {
      metadata: {
        title: "Research and Evidence Archive",
        description:
          "Review dated HELP Math research context, archival records, and the evidence standards guiding the project’s current public claims.",
      },
      hero: {
        eyebrow: "Research and evidence",
        title: "Keep the history visible—and the claims precise",
        summary:
          "HELP Math’s archive includes research descriptions, grant materials, reviews, and awards from different periods. This page identifies them as historical evidence until each source and its present-day relevance can be independently checked.",
        primaryAction: { label: "Request a source", href: "/contact?topic=research" },
        secondaryAction: { label: "Read about the project", href: "/about" },
      },
      evidenceNotice: {
        title: "An archived statement is not a current effectiveness claim",
        body:
          "Dates, study populations, comparison conditions, outcome measures, product versions, and original reports matter. We do not reuse phrases such as “only,” “leading,” “highest rated,” or “research proven” without current, directly reviewable support.",
      },
      entriesLabel: "Evidence register",
      entries: [
        {
          id: "program-description-2014",
          title: "About HELP Math program description",
          dateLabel: "Archived document created in 2014",
          status: "archived",
          statusLabel: "Archived context",
          summary:
            "A program overview describing HELP Math’s intended learners, academic-language supports, lesson design, historical curriculum scale, and research narrative.",
          interpretation:
            "Useful for understanding design intent. Specific counts and outcome statements require confirmation against the edition and underlying primary sources.",
          sourceLabel: "Local archive: About HELP Math.pdf",
        },
        {
          id: "html5-proposal-2020",
          title: "HELP Math with HTML5 Phase I proposal",
          dateLabel: "Archived proposal created in 2020",
          status: "context",
          statusLabel: "Design context",
          summary:
            "A proposal connecting HELP Math modernization to multimedia learning, sheltered instruction, scaffolding, segmentation, vocabulary development, and virtual manipulation.",
          interpretation:
            "Documents a proposed modernization direction. A proposal is not evidence that every proposed feature was implemented or evaluated.",
          sourceLabel: "Local archive: BoulderLearning.PhaseI.HMwithHTML5.pdf",
        },
        {
          id: "scope-2020",
          title: "HELP Math 2.0 scope",
          dateLabel: "Archived scope created in 2020",
          status: "context",
          statusLabel: "Proposed scope",
          summary:
            "A planning document describing a larger learning-platform vision, diagnostic assessment, customizable support, content expansion, and technology updates.",
          interpretation:
            "Shows product ambition, not current website functionality. Proposed features are not described as available unless separately verified.",
          sourceLabel: "Local archive: HELP Math 2.0 Scope.pdf",
        },
        {
          id: "historical-review-records",
          title: "Historical external reviews and awards",
          dateLabel: "Dates and records under review",
          status: "verification",
          statusLabel: "Verification needed",
          summary:
            "Legacy pages refer to federal research review materials, education grants, media coverage, and industry awards.",
          interpretation:
            "These references will be dated and linked to primary records before they are presented as verified achievements on the modern site.",
          sourceLabel: "Legacy website and project archive",
        },
      ],
      reviewPolicy: {
        id: "review-policy",
        eyebrow: "Evidence policy",
        title: "What we record before publishing a claim",
        paragraphs: [
          "Every substantive effectiveness or recognition claim should point to a source that readers can inspect. When a source is unavailable or describes an earlier product version, the limitation travels with the claim.",
        ],
        bullets: [
          "Full citation and stable source location",
          "Publication or award date",
          "Product version and curriculum scope",
          "Study sample, design, measures, and comparison condition where relevant",
          "Finding stated in proportion to the evidence",
          "Known conflicts among archived sources",
        ],
      },
      request: {
        title: "Do you hold a primary report or citation from HELP Math’s history?",
        body:
          "Researchers and former partners may contact the project with bibliographic details or an authorized copy. Do not send student-level records or materials you do not have permission to share.",
        action: { label: "Contact the research archive", href: "/contact?topic=research" },
      },
    },
    resources: {
      metadata: {
        title: "Resources",
        description:
          "Find reviewed HELP Math program, research, and modernization resources, or request an accessible copy from the project team.",
      },
      hero: {
        eyebrow: "Resource library",
        title: "Project materials with their context attached",
        summary:
          "The archive contains useful program and planning documents, but not every file is cleared or accessible for public download. Each item states what it is and how it should—and should not—be interpreted.",
        primaryAction: { label: "Request a resource", href: "/contact?topic=resources" },
        secondaryAction: { label: "View research context", href: "/research" },
      },
      archiveNotice: {
        title: "Accessible publication is in progress",
        body:
          "Source PDFs are being checked for ownership, sensitive content, accurate metadata, readable text order, headings, and image descriptions. Until that review is complete, request access through the project team.",
      },
      filters: {
        ariaLabel: "Filter resources by category",
        all: "All resources",
        program: "Program",
        research: "Research",
        technical: "Modernization",
      },
      items: [
        {
          id: "about-help-math",
          title: "About HELP Math",
          format: "Archived PDF · Program",
          dateLabel: "Created in 2014",
          status: "request",
          statusLabel: "Available by request",
          description:
            "Historical overview of intended learners, instructional design, curriculum descriptions, and the program’s evidence narrative. Counts and claims refer to a past product state.",
          action: { label: "Request this document", href: "/contact?topic=resource-about-help-math" },
        },
        {
          id: "html5-phase-one",
          title: "HELP Math with HTML5: Phase I",
          format: "Archived PDF · Modernization",
          dateLabel: "Created in 2020",
          status: "review",
          statusLabel: "Accessibility review",
          description:
            "Historical proposal for a browser-technology update grounded in multimedia learning and sheltered-instruction concepts. Proposed work should not be read as completed functionality.",
          action: { label: "Ask about this proposal", href: "/contact?topic=resource-html5-proposal" },
        },
        {
          id: "help-math-two-scope",
          title: "HELP Math 2.0 Scope",
          format: "Archived PDF · Program",
          dateLabel: "Created in 2020",
          status: "request",
          statusLabel: "Available by request",
          description:
            "A planning document for expanded content, diagnostics, learner supports, and platform capabilities. It represents a proposed scope rather than this site’s current feature set.",
          action: { label: "Request this document", href: "/contact?topic=resource-help-math-2-scope" },
        },
        {
          id: "modernization-notes",
          title: "Modernization and recovery notes",
          format: "Web resource · Modernization",
          dateLabel: "Living project documentation",
          status: "available",
          statusLabel: "Available on request",
          description:
            "An overview of source preservation, learning-object recovery, validation, accessibility, and staged product planning.",
          action: { label: "Request the current notes", href: "/contact?topic=modernization-notes" },
        },
      ],
      accessibleCopies: {
        title: "Need a different format?",
        body:
          "Tell us which resource you need and the format that would make it usable. We will respond with what is currently available; we cannot guarantee immediate conversion of every archived file.",
        action: { label: "Request an accessible copy", href: "/contact?topic=accessible-resource" },
      },
    },
    support: {
      metadata: {
        title: "Support",
        description:
          "Get current HELP Math project status, answers for returning users, demo troubleshooting, and a safe route to contact the team.",
      },
      hero: {
        eyebrow: "HELP Math support",
        title: "Start with what is available today",
        summary:
          "The public learning platform offers eight current-JavaScript lessons with 426 source-ordered page placements—G3 L2 (70); G4 L3 (39), L5 (53), L10 (46), and L11 (43); and G5 L3 (65), L4 (54), and L5 (56)—together with local progress and learning supports. A separate, protected Family Portal candidate is available only when an authorized school enables it and sends a verified invitation. Former accounts remain disconnected, and this site cannot recover old passwords or historical learning records.",
        primaryAction: { label: "Contact support", href: "/contact?topic=support" },
        secondaryAction: { label: "Check login status", href: "/login" },
      },
      currentStatus: {
        eyebrow: "Current service status",
        title: "What you can use now",
        items: [
          {
            id: "website",
            title: "Learning platform",
            description:
              "Available with English and Spanish interface options, eight runnable current-JavaScript lessons totaling 426 source-ordered page placements, local progress, Nova Tutor, program information, and support. Source media and interactions vary by page.",
            detail: "Available",
          },
          {
            id: "g3-l2",
            title: "Grade 3 Lesson 2: Addition and Subtraction",
            description:
              "All 70 source-ordered page placements are navigable in the modern My Lesson experience. This is not strict Flash fidelity, audio acceptance, Owner acceptance, or publication of the wider curriculum.",
            detail: "Available",
          },
          {
            id: "demos",
            title: "Grade 4 Lesson 3: Negative Numbers",
            description:
              "All 39 registered pages are navigable in the modern My Lesson experience. This is not strict Flash fidelity, audio acceptance, Owner acceptance, or publication of the wider curriculum.",
            detail: "Available",
          },
          {
            id: "g5-l3",
            title: "Grade 5 Lesson 3: Exponents & Prime Factorizations",
            description:
              "All 65 source-ordered page placements are navigable in the modern My Lesson experience. This is not strict Flash fidelity, audio acceptance, Owner acceptance, or publication of the wider curriculum.",
            detail: "Available",
          },
          {
            id: "g5-l4",
            title: "Grade 5 Lesson 4: Number Lines",
            description:
              "All 54 registered pages are navigable in the modern My Lesson experience. This is not strict Flash fidelity, audio acceptance, Owner acceptance, or publication of the wider curriculum.",
            detail: "Available",
          },
          {
            id: "g5-l5",
            title: "Grade 5 Lesson 5: Add & Subtract Negative Numbers",
            description:
              "All 56 source-ordered page placements are navigable in the modern My Lesson experience. This is not strict Flash fidelity, audio acceptance, Owner acceptance, or publication of the wider curriculum.",
            detail: "Available",
          },
          {
            id: "accounts",
            title: "School-invited Family Portal candidate",
            description:
              "The protected candidate supports school-verified parent or guardian invitations, read-only family progress, assignments, and private teacher messages for explicitly enabled tenants. It is default-off, does not permit self-claiming a child, and is not connected to former HELP Math accounts.",
            detail: "Protected candidate · Default off",
          },
        ],
      },
      faqLabel: "Frequently asked questions",
      faqs: [
        {
          id: "old-login",
          question: "Can I use my old HELP Math username and password?",
          answer:
            "No. The modern public site is not connected to the former account system. Do not enter or email an old password. An adult may contact support with an organization name and non-sensitive account context.",
        },
        {
          id: "family-access",
          question: "How does a parent or guardian get Family Portal access?",
          answer:
            "There is no public sign-up or child-claim flow. When the protected candidate is enabled, a school or district administrator must first verify the relationship and send a one-time invitation to the adult's verified email address. Access can be revoked by the school or relinquished by the adult, and historical HELP Math credentials are never imported.",
        },
        {
          id: "flash",
          question: "Do I need Flash or a special browser plug-in?",
          answer:
            "No. The public lesson and learning activities run with modern JavaScript. Original Flash files are preserved privately as restoration evidence and are not required for learners.",
        },
        {
          id: "full-course",
          question: "Is the full HELP Math course available?",
          answer:
            "Not yet. The current release includes eight runnable current-JavaScript lessons—G3 L2 (70 page placements); G4 L3 (39), L5 (53), L10 (46), and L11 (43); and G5 L3 (65), L4 (54), and L5 (56)—not the full HELP Math curriculum. This does not establish strict Flash fidelity, audio acceptance, or Owner acceptance; additional lessons require their own source, rights, instructional, accessibility, fidelity, and acceptance reviews.",
        },
        {
          id: "student-help",
          question: "I am a student. How should I ask for help?",
          answer:
            "Use Nova Tutor inside an available lesson for concept explanations and hints. For account, school, or technical support, ask a teacher, parent, guardian, or another trusted adult to contact the project. Never send a password, birthday, student ID, grades, or class records.",
        },
        {
          id: "purchase",
          question: "Can my school purchase HELP Math on this site?",
          answer:
            "No. Online purchasing and public pricing are not part of this launch. An authorized school or organization representative may contact the project to discuss future access or collaboration.",
        },
        {
          id: "demo-problem",
          question: "What should I include in a demo problem report?",
          answer:
            "Share the demo name, page address, device and browser, what you expected, and what happened. A screenshot without personal information can help. Do not include student work or credentials.",
        },
      ],
      contact: {
        title: "Still need help?",
        body:
          "General public contact intake is paused. In an authorized Family Portal pilot, account, access, correction, deletion, or relationship disputes must use the school-controlled support route shown after sign-in; the portal is not the only channel for education-record rights. Do not send passwords or student records through the public contact page.",
        action: { label: "Check contact availability", href: "/contact?topic=support" },
      },
    },
    login: {
      metadata: {
        title: "Account Access Status",
        description:
          "Learn why former HELP Math accounts cannot be used on the modern website and find the correct support route.",
      },
      hero: {
        eyebrow: "Account access",
        title: "The former HELP Math login is not active here",
        summary:
          "Historical HELP Math accounts remain disconnected and cannot be recovered here. A separate protected sign-in candidate exists only for current school-authorized users and invited parents or guardians when their tenant and identity release gates are enabled.",
        primaryAction: { label: "Check protected sign-in", href: "/sign-in" },
        secondaryAction: { label: "Review demo availability", href: "/demos" },
      },
      alert: {
        title: "Protect your old credentials",
        body:
          "Do not send a username, password, student ID, grades, or class list. The project team cannot verify or reset a former password through this website.",
      },
      options: {
        eyebrow: "Choose your next step",
        title: "You can still explore or ask for help",
        cards: [
          {
            id: "student",
            title: "I am a student",
            description:
              "Read the public project information without signing in. A current school assignment may provide protected learner access, but never use a former password or another person's invitation.",
            action: { label: "Explore the project", href: "/about" },
          },
          {
            id: "educator",
            title: "I am an educator or school representative",
            description:
              "Use protected sign-in only when your current school role has been provisioned in the application. Former educator accounts, rosters, and passwords are not imported.",
            action: { label: "Check protected sign-in", href: "/sign-in" },
          },
          {
            id: "family",
            title: "I am a parent or guardian",
            description:
              "If your current school sent a verified Family invitation, use the protected sign-in route with that exact email. Without an invitation, contact the school through its established channel; HELP Math does not offer public child claiming.",
            action: { label: "Use an invitation", href: "/sign-in" },
          },
        ],
      },
      safetyNote:
        "Never enter an old HELP Math password. The protected candidate may ask an authorized user to sign in through the configured identity provider, but roles and child relationships come only from the application and school authorization—not editable profile metadata or historical credentials.",
    },
    contact: {
      metadata: {
        title: "Contact Availability",
        description:
          "Check the paused HELP Math contact status. The site does not currently collect or send support, resource, research, access, or collaboration requests.",
      },
      hero: {
        eyebrow: "Contact availability",
        title: "Contact intake is paused",
        summary:
          "This page currently provides status only. It does not collect, verify, or send names, email addresses, messages, or other form data. Do not enter personal information. A future adult contact flow may be enabled only after documented owner authorization, legal review, and production-credential authorization.",
      },
      responseNote: {
        title: "No messages are accepted right now",
        body:
          "HELP Math does not currently receive or review messages from this page. Contact intake must remain unavailable until its owner, legal, and production-credential gates are explicitly authorized and the privacy notice is reviewed for the enabled flow.",
      },
      form: {
        title: "Contact submission is paused",
        intro: "The current site does not collect or send a name, email address, school, or message. The fields below are retained for a possible future adult contact flow, but they are not an active intake service. Do not enter information.",
        fields: {
          role: "Your role",
          name: "Name",
          email: "Email address",
          organization: "School or organization",
          topic: "Topic",
          message: "How can we help?",
          privacyConsent:
            "Future use would require the approved privacy notice and must never include student records, passwords, or other sensitive personal information. Contact intake is currently unavailable.",
        },
        placeholders: {
          name: "Unavailable—do not enter a name",
          email: "Unavailable—do not enter an email",
          organization: "Unavailable—do not enter an organization",
          message:
            "Contact intake is paused. Do not enter or submit a message.",
        },
        roleOptions: [
          { value: "educator", label: "Educator" },
          { value: "school-representative", label: "School or organization representative" },
          { value: "parent-guardian", label: "Parent or guardian" },
          { value: "researcher", label: "Researcher" },
          { value: "former-partner", label: "Former partner or contributor" },
          { value: "other-adult", label: "Other adult" },
        ],
        topicOptions: [
          { value: "support", label: "Website or demo support" },
          { value: "account-access", label: "Historical account question" },
          { value: "curriculum", label: "Curriculum information" },
          { value: "resources", label: "Resource request" },
          { value: "research", label: "Research or evidence" },
          { value: "accessibility", label: "Accessibility feedback" },
          { value: "collaboration", label: "Future access or collaboration" },
          { value: "project-history", label: "Project history" },
        ],
        submitLabel: "Contact unavailable",
        submittingLabel: "Contact unavailable",
        successTitle: "Contact intake is not enabled",
        successMessage:
          "No current message intake is authorized. This page must not collect or send information until the owner, legal, and production-credential gates are approved.",
        errorTitle: "Contact intake is paused",
        errorMessage:
          "Nothing was collected or sent. Do not retry with personal information; check this status page later for an explicitly authorized contact option.",
        validation: {
          required: "Contact intake is unavailable; do not enter or submit information.",
          invalidEmail: "Contact intake is unavailable; do not enter an email address.",
          consentRequired: "Contact intake is unavailable; no consent or submission is being accepted.",
          messageTooLong: "Contact intake is unavailable; do not enter a message.",
        },
      },
      privacyWarning: {
        title: "Do not enter personal or student information",
        body:
          "This paused page does not accept any message. Do not enter a name, email address, grades, assessment answers, disability information, birth date, student ID, class list, username, password, or education record. A future protected-information request would require a separately approved secure process.",
      },
      studentNote:
        "Students: use Nova Tutor only for lesson help and ask a trusted adult to check this page later if project contact becomes explicitly available.",
    },
    demos: {
      metadata: {
        title: "Learning Experience",
        description:
          "Open the current HELP Math learning experience and review the evidence boundaries that remain separate from strict migration completion.",
      },
      hero: {
        eyebrow: "Learning experience",
        title: "Eight lessons are ready to explore",
        summary:
          "Eight lessons are runnable in current JavaScript: G3 L2 (70 page placements); G4 L3 (39), L5 (53), L10 (46), and L11 (43); and G5 L3 (65), L4 (54), and L5 (56). Running them does not establish strict Flash fidelity, audio acceptance, Owner acceptance, or publication of the wider curriculum.",
        primaryAction: { label: "Start the lesson", href: "/courses/4/3?mode=focus" },
        secondaryAction: { label: "How restoration works", href: "/about#preservation" },
      },
      previewNotice: {
        title: "Runnable lessons; strict evidence gates remain open",
        body:
          "All 426 source-ordered placements across G3 L2 (70); G4 L3 (39), L5 (53), L10 (46), and L11 (43); and G5 L3 (65), L4 (54), and L5 (56) are navigable in the modern My Lesson experience. This does not establish original-runtime, visual, or audio fidelity, completed human review, Owner acceptance, rights clearance, strict migration completion, or publication of the wider curriculum.",
      },
      listLabel: "Current availability",
      items: [
        {
          id: "g3-l2-addition-subtraction",
          title: "Grade 3 Lesson 2: Addition and Subtraction",
          summary: "Explore source-ordered visual explanations and practice for addition and subtraction, use the support tools, and continue from locally saved progress.",
          conceptLabel: "Lesson",
          concept: "Addition and subtraction",
          statusLabel: "Runnable current-JavaScript lesson",
          statusDetail: "70 of 70 source-ordered page placements are navigable in the modern My Lesson experience; strict evidence and wider-publication gates remain open.",
          action: { label: "Open the lesson", href: "/courses/3/2?mode=focus" },
        },
        {
          id: "g4-l3-negative-numbers",
          title: "Grade 4 Lesson 3: Negative Numbers",
          summary: "Move through eight lesson sections, replay visual explanations, ask Nova for age-appropriate help, and continue from locally saved progress.",
          conceptLabel: "Lesson",
          concept: "Negative numbers and the number line",
          statusLabel: "Runnable showcase",
          statusDetail: "39 of 39 registered pages are navigable in the modern My Lesson experience; strict evidence and wider-publication gates remain open.",
          action: { label: "Open the lesson", href: "/courses/4/3?mode=focus" },
        },
        {
          id: "g4-l5-multiplication",
          title: "Grade 4 Lesson 5: Multiplication",
          summary: "Explore multiplication across the source-ordered lesson, use the support tools, and continue from locally saved progress.",
          conceptLabel: "Lesson",
          concept: "Multiplication",
          statusLabel: "Runnable current-JavaScript lesson",
          statusDetail: "53 of 53 source-ordered page placements are navigable in the modern My Lesson experience; strict evidence and wider-publication gates remain open.",
          action: { label: "Open the lesson", href: "/courses/4/5?mode=focus" },
        },
        {
          id: "g4-l10-perimeter-area",
          title: "Grade 4 Lesson 10: Perimeter & Area",
          summary: "Explore perimeter and area across the source-ordered lesson, use the support tools, and continue from locally saved progress.",
          conceptLabel: "Lesson",
          concept: "Perimeter and area",
          statusLabel: "Runnable current-JavaScript lesson",
          statusDetail: "46 of 46 source-ordered page placements are navigable in the modern My Lesson experience; strict evidence and wider-publication gates remain open.",
          action: { label: "Open the lesson", href: "/courses/4/10?mode=focus" },
        },
        {
          id: "g4-l11-coordinate-grid",
          title: "Grade 4 Lesson 11: Coordinate Grid",
          summary: "Explore coordinate-grid concepts across the source-ordered lesson, use the support tools, and continue from locally saved progress.",
          conceptLabel: "Lesson",
          concept: "Coordinate grid",
          statusLabel: "Runnable current-JavaScript lesson",
          statusDetail: "43 of 43 source-ordered page placements are navigable in the modern My Lesson experience; strict evidence and wider-publication gates remain open.",
          action: { label: "Open the lesson", href: "/courses/4/11?mode=focus" },
        },
        {
          id: "g5-l3-exponents-prime-factorizations",
          title: "Grade 5 Lesson 3: Exponents & Prime Factorizations",
          summary: "Explore exponents and prime factorization across the source-ordered lesson, use the support tools, and continue from locally saved progress.",
          conceptLabel: "Lesson",
          concept: "Exponents and prime factorizations",
          statusLabel: "Runnable current-JavaScript lesson",
          statusDetail: "65 of 65 source-ordered placements, served by 64 registered animations, are navigable in the modern My Lesson experience; strict evidence and wider-publication gates remain open.",
          action: { label: "Open the lesson", href: "/courses/5/3?mode=focus" },
        },
        {
          id: "g5-l4-number-lines",
          title: "Grade 5 Lesson 4: Number Lines",
          summary: "Explore number lines across eight lesson sections, use the support tools, ask Nova for age-appropriate help, and continue from locally saved progress.",
          conceptLabel: "Lesson",
          concept: "Number lines",
          statusLabel: "Runnable current-JavaScript lesson",
          statusDetail: "54 of 54 registered pages are navigable in the modern My Lesson experience; strict evidence and wider-publication gates remain open.",
          action: { label: "Open the lesson", href: "/courses/5/4?mode=focus" },
        },
        {
          id: "g5-l5-add-subtract-negative-numbers",
          title: "Grade 5 Lesson 5: Add & Subtract Negative Numbers",
          summary: "Work with addition and subtraction of negative numbers across the source-ordered lesson, use the support tools, and continue from locally saved progress.",
          conceptLabel: "Lesson",
          concept: "Adding and subtracting negative numbers",
          statusLabel: "Runnable current-JavaScript lesson",
          statusDetail: "56 of 56 source-ordered page placements are navigable in the modern My Lesson experience; strict evidence and wider-publication gates remain open.",
          action: { label: "Open the lesson", href: "/courses/5/5?mode=focus" },
        },
      ],
      quality: {
        id: "quality",
        eyebrow: "Before a demo is published",
        title: "Source evidence, behavior checks, and visual review",
        paragraphs: [
          "A restoration is reviewed against the original authoring and runtime evidence available to the project. The team records the native stage, timeline, visible states, interactions, and known exceptions instead of treating approximate playback as proof of fidelity.",
        ],
        bullets: [
          "Deterministic key-frame capture and visual comparison",
          "Replay and keyboard behavior checks",
          "Responsive layout, text overflow, and reduced-motion review",
          "Console, asset, and network checks",
          "A written record of any unresolved difference",
        ],
      },
      accessibility: {
        title: "Need help using a demonstration?",
        body:
          "Tell us which demonstration, browser, device, and interaction caused difficulty. Do not include student work or personal records.",
        action: { label: "Send accessibility feedback", href: "/contact?topic=accessibility" },
      },
    },
    demoDetails: {
      "conversion-1-2": {
        metadata: {
          title: "Conversion 1.2 Demonstration",
          description:
            "Inspect the local-audit Conversion 1.2 HELP Math JavaScript restoration and its evidence limits.",
        },
        eyebrow: "Restored learning object",
        title: "Conversion 1.2",
        summary:
          "This browser-native reconstruction preserves a compact explanatory sequence from the HELP Math archive with frame-based timing, scalable vector graphics, and deterministic Replay behavior.",
        statusLabel: "Local audit candidate",
        statusDetail: "Validation incomplete · Local audit only · No student-data collection",
        instructionsTitle: "Before you begin",
        instructions: [
          "Watch how the labels and visual elements change together across the sequence.",
          "Use Replay to return to the first frame and run the same sequence again.",
          "Keyboard users can move focus to the Replay control and activate it with Enter or Space.",
        ],
        playerLabel: "Conversion 1.2 interactive demonstration",
        loadingLabel: "Loading the demonstration…",
        unavailableTitle: "The demonstration could not load",
        unavailableMessage:
          "Refresh the page once. If it still does not load, report the browser, device, and page address through support.",
        replayLabel: "Replay demonstration",
        restartLabel: "Restart from the beginning",
        pauseLabel: "Pause animation",
        playLabel: "Play animation",
        reducedMotionNote:
          "When reduced motion is enabled, the experience may limit automatic motion while keeping the instructional states available.",
        accessibilityTitle: "Access notes",
        accessibilityNotes: [
          "The activity scales within the page while preserving its original stage proportions.",
          "Visible controls support keyboard focus and activation.",
          "Important text remains part of the modern rendered experience rather than a plug-in surface.",
        ],
        disclaimerTitle: "Demonstration limits",
        disclaimer:
          "This is one restored learning object, not a complete lesson, course, assessment, or current claim of instructional effectiveness. It does not save responses, scores, or progress. Original Flash material remains private restoration evidence and is not served to visitors.",
        backAction: { label: "Back to all demonstrations", href: "/demos" },
        supportAction: { label: "Report a problem", href: "/contact?topic=support" },
      },
      "conversion-1-4": {
        metadata: {
          title: "Conversion 1.4 Demonstration",
          description:
            "Inspect the local-audit Conversion 1.4 HELP Math JavaScript restoration and its evidence limits.",
        },
        eyebrow: "Restored learning object",
        title: "Conversion 1.4",
        summary:
          "This second browser-native example demonstrates the project’s approach to translating instructional motion, labels, and timing into maintainable JavaScript.",
        statusLabel: "Local audit candidate",
        statusDetail: "Validation incomplete · Local audit only · No student-data collection",
        instructionsTitle: "Before you begin",
        instructions: [
          "Follow the sequence from its opening state to the final explanatory state.",
          "Use Replay to restart the activity after the sequence finishes.",
          "Keyboard users can move focus to the Replay control and activate it with Enter or Space.",
        ],
        playerLabel: "Conversion 1.4 interactive demonstration",
        loadingLabel: "Loading the demonstration…",
        unavailableTitle: "The demonstration could not load",
        unavailableMessage:
          "Refresh the page once. If it still does not load, report the browser, device, and page address through support.",
        replayLabel: "Replay demonstration",
        restartLabel: "Restart from the beginning",
        pauseLabel: "Pause animation",
        playLabel: "Play animation",
        reducedMotionNote:
          "When reduced motion is enabled, the experience may limit automatic motion while keeping the instructional states available.",
        accessibilityTitle: "Access notes",
        accessibilityNotes: [
          "The activity maintains its intended proportions at different page sizes.",
          "Visible controls support keyboard focus and activation.",
          "Text and controls are presented by the modern page rather than an obsolete plug-in.",
        ],
        disclaimerTitle: "Demonstration limits",
        disclaimer:
          "This is one restored learning object, not a complete lesson, course, assessment, or current claim of instructional effectiveness. It does not save responses, scores, or progress. Original Flash material remains private restoration evidence and is not served to visitors.",
        backAction: { label: "Back to all demonstrations", href: "/demos" },
        supportAction: { label: "Report a problem", href: "/contact?topic=support" },
      },
    },
    privacy: {
      metadata: {
        title: "Draft Privacy Notice",
        description:
          "Read the unapproved draft explanation of how HELP Math handles public local lesson state and, when explicitly enabled, the protected school-invited Family Portal candidate.",
      },
      hero: {
        eyebrow: "Draft privacy notice",
        title: "Public learning and protected family access have different data boundaries",
        summary:
          "Public lessons remain available without a named learner account. A separate Family Portal candidate processes school-authorized account, relationship, assignment, progress, and message data only for explicitly enabled tenants. This draft distinguishes those two modes and still requires Owner, privacy, and legal approval before any real-family launch.",
      },
      effectiveDateLabel: "Last updated",
      effectiveDate: "August 23, 2026",
      reviewNotice:
        "DRAFT — Owner and legal review required before publication. This notice describes the current technical design; it is not a legal determination or a guarantee of FERPA, COPPA, or other regulatory compliance.",
      sections: [
        {
          id: "scope",
          title: "1. Scope",
          paragraphs: [
            "This notice applies to helpmath.ai, including its informational pages, the eight runnable current-JavaScript lessons—G3 L2; G4 L3, L5, L10, and L11; and G5 L3 through L5—Nova Tutor, learning-event reporting, the current contact-status page, and the protected Family Portal candidate when its release gates are explicitly enabled.",
            "The ordinary public lesson experience does not require a named learner account and does not connect browser-local progress to a school record. The protected Family Portal is a separate school-invited surface: it may authenticate authorized adults and enrolled learners and process the minimum tenant, school, relationship, assignment, projection, notification, and message data needed for the enabled service.",
          ],
        },
        {
          id: "family-portal",
          title: "1A. Protected Family Portal candidate",
          paragraphs: [
            "There is no public guardian self-registration or child-claim flow. A school or district administrator must verify the adult relationship in its own controlled process and issue a one-time invitation to the adult's exact verified email address. HELP Math stores an application authorization relationship and applies tenant, role, current-enrollment, and active-link checks on every protected read and mutation.",
            "The family workspace can show only the selected authorized child's assignments, explanatory progress bands, recent activity, teacher-approved support guidance, school announcements, and the guardian's own private message threads. It does not expose raw learning events, raw model probabilities, answer keys, free-text student answers, Nova conversations, IEP or diagnosis labels, other guardians' private threads, or other students' records.",
            "The current implementation is a staged candidate protected by global and tenant feature flags. Synthetic testing uses fictional people and the reserved helpmath.invalid domain. Real family access remains prohibited until the applicable privacy, legal, district, security, accessibility, retention, Owner, deployment, and production-verification gates are independently approved.",
          ],
        },
        {
          id: "browser-storage",
          title: "2. What stays in your browser",
          paragraphs: [
            "The lesson saves the current page, visited- and completed-page lists, interface locale, replay counts, and the progress display derived from that state in localStorage on your device. This lets the same browser continue the lesson, but it is not an account or a cloud progress record and may disappear if browser storage is cleared.",
            "A random lesson-event session UUID and sequence counter are kept only in sessionStorage for the current browser-tab session. They are not a named learner account and are removed when that session storage is cleared.",
            "If learning-event delivery is temporarily unavailable, an offline outbox in localStorage can hold no more than 200 closed-format events. Seven days is the retry-validity window: on the next app load, older records are ignored and removed from localStorage. If the app is not opened again, their serialized bytes may remain physically stored past seven days until the browser or user clears site data. The outbox does not store Nova conversations, free-text answers, voice recordings, photos, or lesson-frame images.",
          ],
        },
        {
          id: "learning-events",
          title: "3. Pseudonymous learning events",
          paragraphs: [
            "The platform sends a limited xAPI record through a same-origin HELP Math API to a Learning Locker learning record store (LRS). The current player emits lesson lifecycle, page-view, page-completion, and support-tool-use events. They help us verify that the showcase works and understand learning-path activity without asking who the learner is.",
            "When learning events are delivered, the server stores a random seed in the hm_lrs_anon_v1 cookie. The cookie is HttpOnly and SameSite=Strict, adds Secure on production HTTPS, and has a maximum age of 180 days unless the browser or user removes it sooner. The server combines that seed with a server-held HMAC secret to produce a one-way pseudonymous Actor account identifier. Events do not include a name or email address. Clearing the cookie resets the seed and gives later events a new pseudonymous identifier, but it does not delete events already delivered to the LRS. A pseudonymous identifier is not the same as a named account and may still be treated as personal data in some places.",
          ],
          bullets: [
            "Learning events do not contain a Nova Tutor prompt or reply, a free-text answer, raw speech, a photo, or a captured course frame.",
            "The anonymous public event path remains separate from the account-authorized LearningEventV2 candidate. Old anonymous events and browser-local progress are never automatically attached to a later student account. When a school-authorized assignment integration is explicitly enabled, the server derives the tenant and learner, validates the published lesson object, and stores only closed allowlisted activity fields for explainable progress projections.",
            "The Family Portal does not display raw BKT probabilities or make an official grade, placement result, diagnosis, or automated educational decision. Skill bands require versioned, instructionally reviewed projection rules and show insufficient evidence when the evidence threshold is not met.",
          ],
        },
        {
          id: "nova",
          title: "4. Nova Tutor and voice input",
          paragraphs: [
            "When you ask Nova Tutor for help, the text you type—or text produced by the browser's speech-recognition feature—is sent through the same-origin HELP Math server to OpenRouter for the exact GPT-5.6 Luna model. If you actively choose to attach the current course frame, that lesson image is included so Nova can discuss what is on the screen.",
            "HELP Math requires a Zero Data Retention endpoint, denies provider data collection for each Nova request, and does not persist the conversation on the platform. The raw microphone audio is not sent to HELP Math, and device-camera access is disabled; the frame attachment comes only from the lesson already displayed in your browser.",
            "Your browser, operating system, or speech-recognition provider may process microphone audio under its own terms before returning a transcript. OpenRouter and the routed model provider may process request metadata or security signals under their applicable terms even when HELP Math requests Zero Data Retention. Avoid saying or typing personal or sensitive information.",
          ],
        },
        {
          id: "contact-and-technical",
          title: "5. Contact and technical information",
          paragraphs: [
            "The public contact page remains a status page and does not accept a support message. Inside an enabled Family Portal, a guardian and the child's current teacher or authorized staff member may exchange bounded, plain-text, asynchronous messages. Messages have no attachments or rich text, are private to the thread participants by default, cannot be edited by the sender, and must not be used for emergencies, passwords, complete records, health information, or other highly sensitive material.",
            "Vercel and related network services may process limited technical information needed to deliver and protect the site, such as request time, page, browser or device information, approximate network location, and IP address. When the protected portal is enabled, the configured identity provider and Supabase may process authentication and application data; Resend may deliver invitation, security, new-message, or opt-in weekly-summary email. Email bodies do not include a child's name, grade, skill result, due date, or message text.",
          ],
        },
        {
          id: "student-data",
          title: "6. Student and sensitive information",
          paragraphs: [
            "Do not put names, email addresses, school or class details, grades, disability information, birthdays, student IDs, account credentials, education records, or other sensitive information into Nova Tutor or the paused contact page.",
            "The site currently provides no contact-request channel. If contact is authorized later, students should ask a teacher, parent, guardian, or another trusted adult for help. Any legitimate school request requiring protected information would still need a separate, reviewed secure process.",
          ],
        },
        {
          id: "providers",
          title: "7. Service providers and disclosure",
          paragraphs: [
            "The current learning-platform candidate uses Vercel for website hosting, Learning Locker for the anonymous xAPI LRS, and OpenRouter plus an eligible routed model provider for Nova Tutor. The protected Family Portal candidate additionally uses Supabase for application data and its reviewed authentication path, and may use Resend for privacy-minimized transactional email only when the email release gate is explicitly enabled. Each enabled provider may process data under its own terms, contracts, regions, and configured retention periods; the final subprocessor list and data-processing terms require independent approval before real-family use.",
            "The current technical design does not include selling personal information. The owner and legal reviewer must confirm that statement against actual operations before publication. Information may be disclosed when needed to operate or protect the service, provide support, comply with law, or complete an organizational transition with appropriate safeguards.",
          ],
        },
        {
          id: "retention-security",
          title: "8. Retention and security",
          paragraphs: [
            "Local lesson state remains until you clear it or the browser removes it. The lesson-event session UUID and sequence counter remain only for the current browser-tab session. Queued events are eligible for retry for seven days and are removed on the next app load after that window; if the app is never opened again, expired serialized records may remain in localStorage until site data is cleared.",
            "The pseudonymous-Actor seed cookie has a maximum age of 180 days. Clearing that cookie resets the identifier used for future anonymous events. Successfully delivered anonymous events follow the LRS operator's configured retention. Family Portal invitations, relationships, projections, messages, notification records, identity mappings, and audit events follow the approved tenant retention policy and applicable legal hold or rights-request workflow. Synthetic family messages are scheduled for deletion after 30 days; real messaging remains disabled when an approved tenant retention policy is absent.",
            "Safeguards in the candidate include same-origin APIs, restricted server credentials, verified-email invitations, one-use token digests, encryption for delivery addresses and tokens, tenant-scoped opaque IDs, row-level security, service-layer authorization, idempotent mutations, immutable audit records, notification claim leases, safe logs, and immediate relationship revocation. No browser storage, database, form, or internet transmission can be guaranteed completely secure.",
          ],
        },
        {
          id: "choices",
          title: "9. Your choices",
          paragraphs: [
            "You can read public pages without starting the lesson, using Nova, enabling speech recognition, attaching a course frame, or entering anything on the paused contact page. Browser site-data controls can clear localStorage progress and queued events, sessionStorage identifiers, and the hm_lrs_anon_v1 cookie. Clearing the cookie resets the pseudonymous identifier used for future events, but clearing browser data does not delete events already delivered to the LRS.",
            "Inside an enabled Family Portal, a guardian can turn new-message email on or off, explicitly opt in to or leave the weekly summary, relinquish a child relationship, review authorized schools and children, and start an access, correction, deletion, or relationship-dispute request. Those requests enter a school or operations-controlled workflow and do not directly alter a child's school record. The portal is a convenience channel, not the only route for rights available under applicable law.",
          ],
        },
        {
          id: "international-changes",
          title: "10. International visitors and changes",
          paragraphs: [
            "Our providers may process information in the United States and other locations. Privacy rights and transfer requirements vary by location.",
            "This draft now describes the implemented Family Portal candidate, but that description is not permission to process real family or student data. We will revise and obtain the required approvals for the actual tenant, identity provider, subprocessor, retention, school-notice or consent model, and jurisdiction before any real-family pilot.",
          ],
        },
      ],
      contact: {
        title: "Use the authorized school privacy channel",
        body:
          "The public contact page does not collect or send a privacy request. In an authorized Family Portal pilot, use the school-controlled request route shown after sign-in or the school's existing FERPA/privacy channel. Do not place a student's full record, Nova conversation, password, or other highly sensitive information in a portal message.",
        action: { label: "Check contact availability", href: "/contact?topic=privacy" },
      },
    },
    terms: {
      metadata: {
        title: "Draft Terms of Use",
        description:
          "Read the unapproved draft terms proposed for HELP Math public learning experiences and the default-off, school-invited Family Portal candidate.",
      },
      hero: {
        eyebrow: "Draft terms of use",
        title: "Use the learning experiences thoughtfully",
        summary:
          "This draft describes proposed terms for the public website, its eight runnable current-JavaScript lessons, and the separate school-invited Family Portal candidate. Until Owner and legal approval is documented and a final version is published, it does not form a contract, bind a visitor, authorize real-family use, or grant a license.",
      },
      effectiveDateLabel: "Last updated",
      effectiveDate: "August 23, 2026",
      reviewNotice:
        "DRAFT — Owner and legal review required before publication. The governing entity, jurisdiction, contact address, vendor terms, child-user terms, and any showcase-specific license must be confirmed. Until those approvals are documented, this draft is review information only: it does not form a contract, bind a visitor, or grant a license. These terms do not guarantee FERPA, COPPA, or other regulatory compliance.",
      sections: [
        {
          id: "acceptance",
          title: "1. Draft status and eligibility",
          paragraphs: [
            "This document is provided for owner and legal review. Before those approvals are documented and a final version is published, visiting the candidate does not constitute acceptance of this draft, and this draft grants no permission or license.",
            "Public contact intake remains unavailable. Family Portal access, when explicitly enabled for an authorized pilot, is available only to an adult whose school has verified the relationship and issued an invitation to the adult's verified email. It is not a public registration or child-claim service.",
          ],
        },
        {
          id: "service",
          title: "2. What this site provides",
          paragraphs: [
            "The site provides eight runnable current-JavaScript lessons in the modern My Lesson experience, totaling 426 source-ordered page placements: G3 L2 (70); G4 L3 (39), L5 (53), L10 (46), and L11 (43); and G5 L3 (65), L4 (54), and L5 (56).",
            "Lesson availability is not proof of strict migration completion, original Flash runtime or visual fidelity, audio fidelity, human or Owner acceptance, rights clearance, or publication of the restored historical curriculum. Those remain separate evidence and release gates.",
            "The public lesson surface does not provide enrollment, official grades, payments, or guaranteed access to the historical program. The protected Family Portal candidate can present an authorized child's current assignments, explanatory progress projections, school announcements, and private teacher messages for an explicitly enabled tenant; it is not a transcript, report card, diagnostic service, or entitlement to any historical record.",
          ],
        },
        {
          id: "progress-and-events",
          title: "3. Progress and learning events",
          paragraphs: [
            "Ordinary public lesson progress remains stored in the current browser and is not a verified transcript, grade, school record, or cross-device account history. Clearing browser storage may reset it, and that old local state is never automatically attached to a later student account.",
            "The public site can send pseudonymous closed-format lesson events to a Learning Locker LRS. Separately, an explicitly enabled school assignment may send an authorized, server-attributed LearningEventV2 record for explainable progress projections. The Family Portal displays only bounded family DTOs and explanatory bands, never raw events, exact mastery probabilities, answer keys, free-text answers, Nova conversations, raw voice, photos, or course-frame images. See the Privacy Notice for details and choices.",
          ],
        },
        {
          id: "nova",
          title: "4. Nova Tutor",
          paragraphs: [
            "Nova Tutor uses OpenRouter to request the exact GPT-5.6 Luna model for math-learning responses. AI responses can be incomplete or wrong and are not an official grade, diagnosis, placement decision, or substitute for a teacher or trusted adult.",
            "Only submit information needed for the math question. Browser speech recognition can turn your voice into text, and you may actively attach the current lesson frame; the device camera is disabled. Do not submit names, contact details, school records, passwords, health information, or other sensitive material.",
          ],
        },
        {
          id: "acceptable-use",
          title: "5. Safe review boundaries",
          paragraphs: [
            "This draft grants no permission or license. Until a reviewed final version is approved and published, access to the protected candidate is limited to the review authorization under which access was provided; broader learning, classroom, copying, redistribution, or public use requires separately confirmed rights or written permission from an authorized rights holder.",
          ],
          bullets: [
            "Do not interfere with the site, bypass security or access controls, or overload its services.",
            "Do not try to claim a child, use another person's invitation, switch tenants or children without authorization, enumerate identifiers, or access another guardian's message thread.",
            "Do not use automated systems to scrape, copy, or redistribute the archive or demonstrations at scale without written permission.",
            "Do not upload malicious code, impersonate someone, probe provider credentials, or use Nova or any future contact flow for spam, abuse, or unlawful activity.",
            "Do not submit another person's records, passwords, identifying information, or other sensitive material.",
          ],
        },
        {
          id: "intellectual-property",
          title: "6. Intellectual property and archival material",
          paragraphs: [
            "The website, project name, restored demonstrations, text, artwork, source materials, and other content may be protected by copyright, trademark, contract, or other rights. Viewing the protected candidate does not transfer ownership or grant a right to republish, sell, modify, extract, teach from, or create a competing archive.",
            "Historical names and materials may reflect rights held by their respective owners. Classroom evaluation or any other use beyond the specifically authorized candidate review requires separately confirmed permission from an authorized rights holder.",
          ],
        },
        {
          id: "educational-use",
          title: "7. Educational context",
          paragraphs: [
            "Grade 4 Lesson 3 and Grade 5 Lesson 4 are current-JavaScript learning experiences, not a complete released curriculum, validated diagnostic instrument, individualized intervention, or substitute for an educator's judgment.",
            "Family Portal progress bands, assignment states, printable family summaries, and teacher messages are informational learning supports. They are not official grades, transcripts, emergency services, medical or safety channels, or a substitute for contacting the school through its required records and support procedures.",
            "Descriptions of historical research, awards, standards alignment, scope, or features are identified as archival context unless the site expressly states that a current claim has been verified.",
          ],
        },
        {
          id: "availability",
          title: "8. Availability and changes",
          paragraphs: [
            "The project may add, revise, pause, or remove content, a lesson, Nova Tutor, or learning-event services as sources, rights, accuracy, security, accessibility, and provider availability are reviewed. We do not promise that a historical resource, account, or feature will become available.",
          ],
        },
        {
          id: "links",
          title: "9. Third-party services and links",
          paragraphs: [
            "The platform candidate depends on Vercel, Learning Locker, OpenRouter, and an eligible routed model provider. The protected Family Portal candidate additionally depends on its configured authentication path, Supabase, and, when explicitly enabled, Resend transactional email. Applicable contracts, provider terms, and privacy practices govern their services; a link does not mean HELP Math endorses all third-party content.",
          ],
        },
        {
          id: "disclaimer",
          title: "10. Disclaimers and responsibility",
          paragraphs: [
            "The protected candidate is available for technical, owner, and legal review without an engineering promise that it will be uninterrupted, error-free, complete, or suitable for an instructional decision. This unapproved draft does not waive or limit any visitor's or operator's legal rights or responsibilities.",
            "During authorized review, use the candidate in a way that is lawful, age-appropriate, and consistent with your school or organization’s policies.",
          ],
        },
        {
          id: "changes",
          title: "11. Changes to these terms",
          paragraphs: [
            "This draft may change during Owner and legal review. A final version, if approved, must show its effective date and the responsible entity, jurisdiction, school terms, rights-request route, retention, and applicable subprocessors. The implemented Family Portal candidate does not authorize a real-family pilot until those terms and the independent district, privacy, security, accessibility, Owner, deployment, and production gates pass.",
          ],
        },
      ],
      contact: {
        title: "Permission contact is unavailable",
        body:
          "This draft grants no permission, and the site currently accepts no permission request. The link shows contact availability only; do not enter information there. Any future adult channel requires documented owner, legal, and production-credential authorization.",
        action: { label: "Check contact availability", href: "/contact?topic=permissions" },
      },
    },
  },
} satisfies SiteContent;
