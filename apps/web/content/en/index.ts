import type { SiteContent } from "../types";

export const enContent = {
  locale: "en",
  shared: {
    siteName: "HELP Math",
    siteTagline: "Math language made visible",
    skipToContent: "Skip to main content",
    statusLabel: "Learning platform preview",
    statusMessage:
      "Grade 4 Lesson 3 is a fully navigable 39-page current-JavaScript showcase with local progress, Nova Tutor, and pseudonymous learning-record sync. This is runnable platform access, not strict Flash fidelity, Owner acceptance, or publication of the wider curriculum.",
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
        { label: "Study with Nova", href: "/courses/4/3?mode=study" },
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
        "Grade 4 Lesson 3 is a fully navigable 39-page current-JavaScript showcase. Strict Flash fidelity, Owner acceptance, and wider-curriculum publication remain separate gates.",
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
          "The website is now a runnable learning platform beginning with a fully navigable 39-page current-JavaScript showcase. Strict Flash fidelity, Owner acceptance, and publication of the wider curriculum remain separate gates.",
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
        title: "Start with Negative Numbers",
        intro:
          "Grade 4 Lesson 3 is now a fully navigable 39-page current-JavaScript showcase with local progress, Nova Tutor, and pseudonymous LRS sync.",
        items: [],
        note:
          "This runnable showcase does not claim strict Flash fidelity, owner acceptance, or publication of the wider curriculum.",
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
          title: "A learning platform beginning with one fully navigable showcase",
          paragraphs: [
            "This release makes Grade 4 Lesson 3, Negative Numbers, available as a fully navigable 39-page current-JavaScript showcase with Nova Tutor and local progress.",
            "It does not restore the former account system or provide classes, assignments, purchases, teacher dashboards, or formal grades. Strict Flash fidelity, owner acceptance, and wider-curriculum publication remain separate gates.",
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
          "The platform now provides a runnable 39-page current-JavaScript showcase, not a complete released curriculum or an automated teaching system. Strict Flash fidelity, Owner acceptance, and wider-curriculum publication remain separate gates. Educators remain essential for choosing appropriate tasks, listening to student reasoning, and connecting activities to classroom goals.",
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
        title: "One runnable lesson, without enrollment",
        paragraphs: [
          "The learning platform currently offers Grade 4 Lesson 3, Negative Numbers, as a fully navigable 39-page current-JavaScript showcase. It includes local browser progress, Nova Tutor, and pseudonymous learning-event sync, but no placement testing, teacher dashboard, class assignment, enrollment, or formal grade record.",
          "The interface is available in English and Spanish, but source media and interactions vary by page and do not form a complete or validated Spanish experience.",
          "The showcase is runnable product access, not a strict migration or fidelity claim. Wider curriculum publication still depends on source audit, rights review, instructional review, accessibility work, original-behavior validation, human review, and owner acceptance.",
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
          "The learning platform offers Grade 4 Lesson 3 as a fully navigable 39-page current-JavaScript showcase with local progress, Nova Tutor, and learning-record sync. Former student and educator accounts are not connected, and this site cannot recover old passwords or historical learning records.",
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
              "Available with English and Spanish interface options, one fully navigable 39-page current-JavaScript showcase, local progress, Nova Tutor, program information, and support. Source media and interactions vary by page.",
            detail: "Available",
          },
          {
            id: "demos",
            title: "Grade 4 Lesson 3: Negative Numbers",
            description:
              "All 39 registered pages and the course shell are navigable as a current-JavaScript showcase. This is not strict Flash fidelity, Owner acceptance, or publication of the wider curriculum.",
            detail: "Available",
          },
          {
            id: "accounts",
            title: "Student and educator accounts",
            description:
              "Login, classes, assignments, purchases, and progress reporting are not active on the modern site.",
            detail: "Not available",
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
          id: "flash",
          question: "Do I need Flash or a special browser plug-in?",
          answer:
            "No. The public lesson and learning activities run with modern JavaScript. Original Flash files are preserved privately as restoration evidence and are not required for learners.",
        },
        {
          id: "full-course",
          question: "Is the full HELP Math course available?",
          answer:
            "Not yet. The current release includes one fully navigable 39-page current-JavaScript showcase—Grade 4 Lesson 3, Negative Numbers—not the full HELP Math curriculum. This does not establish strict Flash fidelity or Owner acceptance; additional lessons require their own source, rights, instructional, accessibility, fidelity, and acceptance reviews.",
        },
        {
          id: "student-help",
          question: "I am a student. How should I ask for help?",
          answer:
            "Use Nova Tutor inside the Negative Numbers lesson for concept explanations and hints. For account, school, or technical support, ask a teacher, parent, guardian, or another trusted adult to contact the project. Never send a password, birthday, student ID, grades, or class records.",
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
          "Contact intake is paused. This link opens the current availability status; HELP Math does not currently collect or send a support request through this site.",
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
          "This site is a public modernization preview. It has no student or educator sign-in form and is not connected to the historical account database.",
        primaryAction: { label: "Contact account support", href: "/contact?topic=account-access" },
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
              "Read the public project information without signing in. Ask a parent, guardian, teacher, or another trusted adult to contact us about an old account or other project support.",
            action: { label: "Explore the project", href: "/about" },
          },
          {
            id: "educator",
            title: "I am an educator or school representative",
            description:
              "Contact the project using your work email and organization name. Describe the kind of access or historical account information you need without sharing student data.",
            action: { label: "Request support", href: "/contact?topic=account-access" },
          },
          {
            id: "family",
            title: "I am a parent or guardian",
            description:
              "Tell us the school or organization connected with the former program and how we can help. Leave out passwords and student records.",
            action: { label: "Contact the project", href: "/contact?topic=family-support" },
          },
        ],
      },
      safetyNote:
        "If another website asks for your old HELP Math password, stop and confirm the web address with a trusted adult or your school. The official modern public site does not ask visitors to sign in.",
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
        title: "Negative Numbers is ready to explore",
        summary:
          "Grade 4 Lesson 3 is a fully navigable 39-page current-JavaScript showcase with local progress, Nova Tutor, and pseudonymous learning-record sync. Running it does not establish strict Flash fidelity, Owner acceptance, or publication of the wider curriculum.",
        primaryAction: { label: "Start the lesson", href: "/courses/4/3?mode=focus" },
        secondaryAction: { label: "How restoration works", href: "/about#preservation" },
      },
      previewNotice: {
        title: "Runnable showcase; strict evidence gates remain open",
        body:
          "All 39 lesson pages and the functional course shell are navigable. This does not establish original-runtime or audio fidelity, completed human visual review, Owner acceptance, rights clearance, strict migration completion, or publication of the wider curriculum.",
      },
      listLabel: "Current availability",
      items: [
        {
          id: "g4-l3-negative-numbers",
          title: "Grade 4 Lesson 3: Negative Numbers",
          summary: "Move through eight lesson sections, replay visual explanations, ask Nova for age-appropriate help, and continue from locally saved progress.",
          conceptLabel: "Lesson",
          concept: "Negative numbers and the number line",
          statusLabel: "Runnable showcase",
          statusDetail: "39 of 39 registered pages are navigable in the current-JavaScript course shell; strict evidence and wider-publication gates remain open.",
          action: { label: "Open the lesson", href: "/courses/4/3?mode=focus" },
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
          "Read the draft explanation of how HELP Math handles local lesson state, pseudonymous learning events, Nova Tutor requests, paused contact status, and limited technical data.",
      },
      hero: {
        eyebrow: "Draft privacy notice",
        title: "A learning preview designed to know less about you",
        summary:
          "You can use the Grade 4 Lesson 3 showcase without an account, name, email address, school, class, payment, or teacher profile. This notice explains what stays in your browser, what is sent to the learning record store, and what Nova Tutor needs when you ask for help.",
      },
      effectiveDateLabel: "Last updated",
      effectiveDate: "August 14, 2026",
      reviewNotice:
        "DRAFT — Owner and legal review required before publication. This notice describes the current technical design; it is not a legal determination or a guarantee of FERPA, COPPA, or other regulatory compliance.",
      sections: [
        {
          id: "scope",
          title: "1. Scope",
          paragraphs: [
            "This notice applies to helpmath.ai, including its informational pages, the runnable Grade 4 Lesson 3 learning showcase, Nova Tutor, learning-event reporting, and the current contact-status page.",
            "The current learning experience has no student or teacher accounts and does not ask for a learner's name, email address, school, class, payment, or teacher profile. It does not authenticate a learner or connect lesson activity to a school record.",
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
            "The current Grade 4 Lesson 3 player does not emit practice-result events. If a compatible closed-result integration is enabled later, its contract permits only allowlisted fields such as outcome, attempt number, and lesson page; this notice must be reviewed before launch.",
            "The platform does not currently turn these events into a teacher dashboard, grade, placement result, or automated educational decision.",
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
            "The learning showcase does not ask for your name or email address. The contact page is currently a status page: it does not accept, collect, verify, or send a name, email address, organization, role, topic, or message. Do not enter information there. A future adult contact flow may process those fields only after documented owner authorization, legal review, production-credential authorization, and an updated privacy review.",
            "Vercel and related network services may process limited technical information needed to deliver and protect the site, such as request time, page, browser or device information, approximate network location, and IP address. Cloudflare Turnstile and Resend are not used by the currently paused contact flow. If a future adult contact flow is explicitly authorized and configured, Turnstile may process anti-abuse signals and Resend may deliver the message; neither provider is required for ordinary use of the learning showcase.",
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
            "The current learning-platform candidate uses Vercel for website hosting, Learning Locker for the xAPI LRS, and OpenRouter plus an eligible routed model provider for Nova Tutor. The paused contact flow currently uses neither Cloudflare Turnstile nor Resend. A future adult contact flow may use them only after documented owner authorization, legal review, and production-credential authorization. Each enabled provider may process data under its own terms and configured retention periods.",
            "The current technical design does not include selling personal information. The owner and legal reviewer must confirm that statement against actual operations before publication. Information may be disclosed when needed to operate or protect the service, provide support, comply with law, or complete an organizational transition with appropriate safeguards.",
          ],
        },
        {
          id: "retention-security",
          title: "8. Retention and security",
          paragraphs: [
            "Local lesson state remains until you clear it or the browser removes it. The lesson-event session UUID and sequence counter remain only for the current browser-tab session. Queued events are eligible for retry for seven days and are removed on the next app load after that window; if the app is never opened again, expired serialized records may remain in localStorage until site data is cleared.",
            "The pseudonymous-Actor seed cookie has a maximum age of 180 days. Clearing that cookie resets the identifier used for future events. Successfully delivered events follow the LRS operator's configured retention. The paused contact page creates no contact message to retain. If an adult contact flow is authorized later, its reviewed notice must state the applicable message and provider retention periods; hosting logs and other enabled-provider records follow their applicable periods.",
            "We use safeguards including same-origin APIs, restricted server credentials, a one-way pseudonymous Actor identifier, and closed learning-event fields. No browser storage, form, or internet transmission can be guaranteed completely secure.",
          ],
        },
        {
          id: "choices",
          title: "9. Your choices",
          paragraphs: [
            "You can read public pages without starting the lesson, using Nova, enabling speech recognition, attaching a course frame, or entering anything on the paused contact page. Browser site-data controls can clear localStorage progress and queued events, sessionStorage identifiers, and the hm_lrs_anon_v1 cookie. Clearing the cookie resets the pseudonymous identifier used for future events, but clearing browser data does not delete events already delivered to the LRS.",
            "The site currently provides no channel for an access, correction, or deletion request about a pseudonymous learning record. If an authorized adult contact channel is enabled later, the reviewed notice must explain how to make a request and how identity, law, and system limits will be verified.",
          ],
        },
        {
          id: "international-changes",
          title: "10. International visitors and changes",
          paragraphs: [
            "Our providers may process information in the United States and other locations. Privacy rights and transfer requirements vary by location.",
            "We will update the date and this notice before introducing materially different practices, including accounts, named learner profiles, school rosters, payments, teacher dashboards, or new vendors and data flows.",
          ],
        },
      ],
      contact: {
        title: "Privacy request channel unavailable",
        body:
          "The contact page currently shows availability status only and does not collect or send a privacy request. Do not enter a student's name, school record, Nova conversation, or other information there.",
        action: { label: "Check contact availability", href: "/contact?topic=privacy" },
      },
    },
    terms: {
      metadata: {
        title: "Draft Terms of Use",
        description:
          "Read the unapproved draft terms proposed for HELP Math, its current-JavaScript Grade 4 Lesson 3 showcase, Nova Tutor, and related content.",
      },
      hero: {
        eyebrow: "Draft terms of use",
        title: "Use the learning showcase thoughtfully",
        summary:
          "This draft describes proposed terms for the website and runnable Grade 4 Lesson 3 showcase. Until owner and legal approval is documented and a final version is published, it does not form a contract, bind a visitor, or grant a license.",
      },
      effectiveDateLabel: "Last updated",
      effectiveDate: "August 14, 2026",
      reviewNotice:
        "DRAFT — Owner and legal review required before publication. The governing entity, jurisdiction, contact address, vendor terms, child-user terms, and any showcase-specific license must be confirmed. Until those approvals are documented, this draft is review information only: it does not form a contract, bind a visitor, or grant a license. These terms do not guarantee FERPA, COPPA, or other regulatory compliance.",
      sections: [
        {
          id: "acceptance",
          title: "1. Draft status and eligibility",
          paragraphs: [
            "This document is provided for owner and legal review. Before those approvals are documented and a final version is published, visiting the candidate does not constitute acceptance of this draft, and this draft grants no permission or license.",
            "Contact intake is currently unavailable. If an adult contact flow is authorized later, it must remain adult-directed and students should ask a teacher, parent, guardian, or another trusted adult for help.",
          ],
        },
        {
          id: "service",
          title: "2. What this site provides",
          paragraphs: [
            "The site provides project information and one runnable current-JavaScript showcase: Grade 4 Lesson 3, Negative Numbers, with 39 registered lesson pages and a functional course shell.",
            "Showcase availability is not proof of strict migration completion, original Flash runtime or visual fidelity, audio fidelity, human or Owner acceptance, rights clearance, or publication of the restored historical curriculum. Those remain separate evidence and release gates.",
            "The site does not currently provide enrollment, named student or educator accounts, schools, classes, assignments, teacher dashboards, official grades, payments, or guaranteed access to the historical program.",
          ],
        },
        {
          id: "progress-and-events",
          title: "3. Progress and learning events",
          paragraphs: [
            "The progress display is stored in the current browser and is not a verified transcript, grade, school record, or cross-device account history. Clearing browser storage may reset it.",
            "The site sends pseudonymous xAPI events for lesson lifecycle, page views, page completion, and support-tool use to a Learning Locker LRS. The current player does not emit practice-result events. Learning events do not include names, email addresses, Nova conversations, free-text answers, raw voice, photos, or course-frame images. See the Privacy Notice for details and choices.",
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
            "The Grade 4 Lesson 3 showcase is a current-JavaScript learning experience, not a complete released curriculum, validated diagnostic instrument, individualized intervention, or substitute for an educator's judgment.",
            "Descriptions of historical research, awards, standards alignment, scope, or features are identified as archival context unless the site expressly states that a current claim has been verified.",
          ],
        },
        {
          id: "availability",
          title: "8. Availability and changes",
          paragraphs: [
            "The project may add, revise, pause, or remove content, the showcase, Nova Tutor, or learning-event services as sources, rights, accuracy, security, accessibility, and provider availability are reviewed. We do not promise that a historical resource, account, or feature will become available.",
          ],
        },
        {
          id: "links",
          title: "9. Third-party services and links",
          paragraphs: [
            "The learning-platform candidate relies on Vercel, Learning Locker, OpenRouter, and an eligible routed model provider. If the separate adult contact flow is configured, it may also use Cloudflare and Resend. The applicable terms and privacy practices of any enabled provider govern its services; a link does not mean HELP Math endorses all third-party content.",
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
            "This draft may change during owner and legal review. A final version, if approved, must show its effective date. Materially different services—including accounts, school rosters, subscriptions, payments, teacher dashboards, or named student-data processing—require revised, approved terms and privacy information before launch.",
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
