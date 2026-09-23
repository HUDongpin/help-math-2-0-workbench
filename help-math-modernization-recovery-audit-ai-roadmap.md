# HELP Math 1.5/2.0 Modernization: Recovery Audit & AI Roadmap

Draft v0.2 for Dr. Peter Hu

## Source Documents Reviewed

This version updates the roadmap using the three attached HELP Math documents:

- `About HELP Math.pdf`
- `BoulderLearning.PhaseI.HMwithHTML5.pdf`
- `HELP Math 2.0 Scope.pdf`

The source documents show that HELP Math is not merely a Flash-based lesson library. It is a research-grounded, multimedia mathematics intervention for English Learners and other struggling students, with embedded sheltered instruction, bilingual supports, diagnostic placement, teacher controls, learning objects, and a historical plan to modernize through HTML5, K-2 expansion, speech recognition, reading practice, and virtual tutor technology.

## 1. Executive Summary

HELP Math 1.5/2.0 modernization should be framed as a product recovery and learning-platform modernization initiative, not as a simple Flash conversion project. The old product's value lies in its instructional design: Sheltered English Instruction, synchronized audio/visual/text/interactivity, academic vocabulary support, Spanish translation/audio, virtual manipulatives, diagnostic placement, teacher-controlled learning paths, and a large learning object repository.

The attached materials establish several important facts that should shape the modernization plan:

- HELP Math was designed for English Learners, struggling math students, students with learning disabilities, and remediation within an RtI framework.
- The product combines math concept development with academic language and vocabulary development.
- HELP Math 1.5 should be treated as a storyboard source for HELP Math 2.0 animation and interaction redesign.
- Earlier redevelopment planning already identified HTML5 conversion, K-2 expansion, reading practice, speech recognition, virtual tutor technology, updated standards alignments, teacher/admin improvements, and additional language support as modernization directions.
- Prior Phase I planning proposed an 8-month HTML5 update and usability-testing process; the broader 2.0 scope estimated a six-month product review/design phase, one-year development cycle, and six-month QA/testing cycle.

This roadmap therefore recommends a staged approach:

1. Recovery Audit Sprint: verify assets, scope, pedagogy, and technical complexity.
2. HTML5/Next.js MVP: rebuild a representative lesson set and platform shell.
3. Data and Teacher Console Foundation: restore progress monitoring, reports, diagnostics, and feature controls.
4. AI v1: add constrained AI hinting and teacher insight summaries.
5. Phase 2/3: expand into speech recognition, reading practice, math discourse, adaptive sequencing, virtual tutor dialogs, and additional languages.

The immediate goal is not to promise a complete HELP Math 2.0 rebuild in 90 days. The 90-day plan should produce a pilot-ready modernization package and a defensible full-product roadmap.

## 2. Product Identity and Pedagogical Core

### 2.1 HELP Math's Original Value Proposition

HELP Math stands for Help with English Language Proficiency. Its core purpose is to help students develop math proficiency while also developing technical, academic English and prerequisite math knowledge. The attached program description positions HELP Math as a web-based mathematics intervention for English language learners and other struggling students, originally effective for grades 3-8, also used for high school remediation and foundations for Algebra and Geometry.

The roadmap should preserve the following core identity:

- Mathematics intervention for English Learners and struggling students.
- Sheltered English Instruction embedded into digital math curriculum.
- Bilingual and multimodal supports, especially English/Spanish.
- Academic vocabulary and math language development as a first-class learning goal.
- Clean, focused screens with few distractors.
- Self-paced, activity-based lesson structure.
- Teacher-controlled differentiation and custom curriculum pathways.
- Diagnostic assessment and automatic content prescription.

### 2.2 Lesson Structure to Preserve

The source documents describe a consistent lesson flow:

1. Real-World Scenario and Game
2. Vocabulary
3. Instruction
4. Try-It
5. Problem-Solving Skills
6. Final Quiz

The modernization should treat this as the default lesson model unless an audit shows that a specific lesson needs a different structure. This structure should become part of the new lesson schema, content editor, student runtime, teacher reports, and AI support model.

### 2.3 Instructional Supports to Preserve

HELP Math's differentiators include:

- Key Terms Dictionary with English, Spanish, and pictorial examples.
- Contextual vocabulary hyperlinks.
- Spanish translation via page-level support such as "En Esta Pagina".
- Spanish audio and full bilingual translation.
- Calculator tool, with teacher controls.
- Virtual manipulatives such as number lines, base-10 blocks, protractors, rulers, fraction strips/wheels, thermometers, money tools, matching activities, drag-and-drop interactions, and games.
- Hints and "Need More HELP" style feedback.
- Test-taking and problem-solving strategy instruction.
- Email or teacher-query tools in the older model.

The AI roadmap should enhance these supports rather than replace them.

### 2.4 Evidence Base to Preserve

The attached documents repeatedly position HELP Math as a research-based product, not an untested courseware library. The modernization package should preserve this evidence story:

- Prior HELP Math research and proposal materials describe significant learning gains for ELL/LEP students and struggling students.
- The product was associated with University of Colorado research, a U.S. Department of Education Ready to Teach grant, and What Works Clearinghouse review materials.
- HELP Math was described as award-winning, including CODiE recognition for special needs instructional solution and strong GPRA review scores.
- The Phase I HTML5 proposal connected HELP Math to multimedia learning, sheltered instruction, scaffolding, segmentation, pacing, vocabulary development, and virtual manipulation.

Modernization implication: the first public story should not be "Flash has been converted." It should be "a research-grounded ELL math intervention has been recovered, modernized, and prepared for AI-enhanced learning support."

### 2.5 Market and Partner Context

The attachments indicate a historical customer base in 28 states, a prior or potential commercialization path through existing users, a relationship context involving Boulder Learning, Istation, and Sunburst, and a long-term opportunity to re-enter the K-8 math and reading intervention market.

Planning implication:

- The first pilot should consider former HELP Math customers if access is possible.
- HELP Math 2.0 should be positioned for K-8 intervention, with a staged path from recovered grades 6-8/3-8 content toward K-2 expansion.
- Speech recognition and virtual tutor technology should be treated as Boulder Learning's strategic differentiator, but staged after the base platform is stable.

## 3. Scope Evidence and Version Reconciliation

The three PDFs describe HELP Math scale differently, likely because they refer to different product states or market scopes. This must be reconciled during audit rather than flattened into one number.

| Source | Scope Details |
|---|---|
| `About HELP Math.pdf` | 73 self-paced lessons, each approximately 2-3 hours; over 200 hours of standards-aligned math content; approximately 6,500 instructional SWF pages in a meta-tagged learning object repository. |
| `BoulderLearning.PhaseI.HMwithHTML5.pdf` | 44 lessons, over 100 hours of instruction, targeting grades 6-8; four modules: Numbers Make Sense, Geometry, Algebra, Data Analysis. |
| `HELP Math 2.0 Scope.pdf` | Over 300 hours of interactive, standards-aligned math content; digital media assets library; diagnostic assessments; customizable supports; computational engine with adaptive-prescriptive progress monitoring; proposed K-2 expansion of approximately 27 lessons. |

Audit implication: the first deliverable must identify the exact product corpus to recover. HELP Math 1.5, HELP Math 2.0 scope, grade 3-8 content, grade 6-8 modules, and proposed K-2 expansion may not refer to the same content set.

## 4. Project Objectives

### 4.1 Recovery Objectives

- Recover the full legacy corpus: Flash pages, FLA/SWF files, audio, video, text, images, manipulatives, assessments, teacher resources, standards alignments, and metadata.
- Map all lessons into a modern structure based on the original Real-World Scenario, Vocabulary, Instruction, Try-It, Problem-Solving Skills, and Final Quiz model.
- Preserve bilingual vocabulary, Spanish audio/translation, and academic-language supports as first-class product features.
- Identify which Flash pages are reusable as storyboards and which need complete redesign.
- Reconcile the corpus scale differences across the source documents.

### 4.2 Modernization Objectives

- Rebuild the student learning experience in Next.js, React, TypeScript, HTML5, SVG, and Canvas where appropriate.
- Restore teacher-facing capabilities: progress tracking, time-on-task, quiz scores, mastery levels, feature toggles, reports, custom curriculum creation, and pathway controls.
- Create a learning object repository that replaces the old SWF page repository with structured, searchable, standards-aligned lesson objects.
- Support modern browsers, tablets, Chromebooks, and mobile devices.
- Establish accessibility, privacy, data, and QA practices suitable for K-12 deployment.

### 4.3 AI and Speech Objectives

- Use AI to strengthen HELP Math's existing strengths: scaffolding, feedback, language support, diagnostic placement, teacher insight, and differentiated learning paths.
- Prioritize constrained AI features that are reviewable, explainable, and tied to lesson schema.
- Defer open-ended AI tutor chat until content safety, privacy, math correctness, and teacher oversight are mature.
- Treat speech recognition as a Phase 2 feature for reading practice, math discourse, oral vocabulary, and spoken dialogs with a virtual tutor, consistent with the HELP Math 2.0 scope.

## 5. Recovery Audit Checklist

### 5.1 Legacy Asset Inventory

Requested materials from HELP Math/Boulder Learning/Sunburst or current owners:

- All `.fla` source files.
- All `.swf` files.
- ActionScript code, embedded scripts, and source libraries.
- Audio files, including English narration and Spanish audio.
- Video files, images, illustrations, fonts, sprite sheets, and animation assets.
- XML, JSON, database tables, lesson manifests, or metadata exports.
- Lesson list, module list, grade-level mapping, and standards mapping.
- Key Terms Dictionary data, Spanish translations, pictorial examples, and glossary assets.
- Teacher resources, teacher guides, tutorials, implementation guides, webinars, PowerPoints, PDFs, and alignment tables.
- Diagnostic assessment item banks, pre/post tests, formative assessments, final quiz item pools, scoring rules, randomization logic, and mastery thresholds.
- Historical user flows, screenshots, demos, and any existing video demonstration.
- Any admin console, roster, progress-monitoring, and report-generation source materials.

### 5.2 Content and Pedagogy Audit

For each lesson:

- Module and lesson title.
- Grade band and target standards.
- Current lesson section structure.
- Learning objective and math concept.
- Academic vocabulary and technical math terms.
- Language support available: English, Spanish, audio, translation, pictorial examples.
- Manipulatives and interactive tools used.
- Try-It items and feedback types.
- Problem-solving strategy instruction.
- Final Quiz item count, randomization, scoring, and mastery rule.
- Diagnostic links: prerequisite skills, background knowledge, grade-level skill gaps.
- Whether the lesson supports UDL principles and sheltered instruction techniques.
- Migration decision: preserve, redesign, consolidate, or retire.

### 5.3 Flash and Technical Complexity Audit

Each Flash object should be classified:

| Level | Type | Features | Recommended Route |
|---|---|---|---|
| L1 | Static/simple visual page | Mostly text and vector graphics | React + SVG |
| L2 | Timeline animation | Tweens, synced narration, Replay | React/SVG timeline or CreateJS reference |
| L3 | Interactive lesson page | Student input, feedback states, simple manipulatives | React state machine + SVG/Canvas |
| L4 | Complex nested Flash | Many symbols, masks, scroll panes, AS2 component code | Adobe Animate/CreateJS extraction plus manual refactor |
| L5 | Game/simulation/manipulative | Drag-and-drop, physics-like interactions, many objects | PixiJS, Phaser, or custom Canvas runtime |

Technical audit fields:

- Flash version and ActionScript version.
- Whether source FLA exists.
- Whether Adobe Animate can open the source.
- External asset dependencies.
- Audio/video synchronization requirements.
- Student state and scoring logic.
- Whether Ruffle can play it reliably for reference.
- Whether original timing and frame count need to be preserved.
- Whether the object should be rebuilt from storyboard instead of converted.

## 6. Technical Route

### 6.1 Platform Architecture

Recommended stack:

- Next.js + TypeScript for application shell and routing.
- React Client Components for interactive lessons.
- SVG for clean, scalable vector visuals and simple instructional animations.
- Canvas/CreateJS/PixiJS for complex Flash-style animation and manipulatives.
- PostgreSQL for users, rosters, learning objects, progress, assessment events, and reports.
- Object storage for legacy assets, extracted media, screenshots, and generated artifacts.
- AI Gateway for all model calls, speech services, prompt templates, logging, redaction, and cost control.

### 6.2 HTML5 Conversion Strategy

The Phase I proposal was centered on updating HELP Math using HTML5 so it could run across browsers, PCs, Apple devices, and mobile technologies. That remains directionally correct, but the modern implementation should avoid one monolithic "HTML5 conversion" approach.

Recommended strategy:

- Use HELP Math 1.5 as storyboards, as stated in the 2.0 scope.
- Extract content and pedagogy from Flash before choosing rendering technology.
- Use React/SVG for pages where text, vocabulary, and simple animations matter most.
- Use Canvas/CreateJS only where Flash timeline fidelity or object count demands it.
- Use Ruffle only for historical playback, visual comparison, and QA reference.
- Use screenshot comparison to verify rebuilt pages against original SWF behavior.

### 6.3 Lesson Runtime

The new runtime should support:

- Lesson sections: Real-World Scenario, Vocabulary, Instruction, Try-It, Problem-Solving Skills, Final Quiz.
- Section and sub-section navigation, including teacher lock-down controls.
- Audio synchronized with text, symbols, pictures, and animation.
- Replay, pause, captions/transcripts, and reduced-motion modes.
- Key Terms overlay with bilingual and pictorial support.
- Calculator and manipulatives as controlled tools.
- Page-level translation and language support.
- Immediate feedback and hint states.
- Event logging for progress monitoring and AI support.

### 6.4 Learning Object Repository

Replace the old SWF repository with structured learning objects:

```txt
learning_object
  id
  legacy_swf_id
  lesson_id
  section_type
  grade_band
  standards
  math_objectives
  language_objectives
  vocabulary_terms
  media_assets
  animation_spec
  interaction_spec
  assessment_links
  translations
  accessibility_metadata
  analytics_events
```

This repository should allow teachers to build custom lessons, shorten lessons, assign prior-grade support, or create targeted pathways, matching the original HELP Math teacher workflow.

## 7. MVP Scope

The 90-day MVP should be a pilot-ready modernization package, not the full HELP Math 2.0 product.

### 7.1 MVP Content Selection

Select 10-20 representative lesson objects from the legacy corpus:

- At least 2 Real-World Scenario/Game examples.
- At least 2 Vocabulary examples with bilingual Key Terms.
- At least 3 Instruction pages with audio/visual/text synchronization.
- At least 3 Try-It interactions with feedback and hints.
- At least 1 Problem-Solving Skills sequence.
- At least 1 Final Quiz flow with scoring.
- At least 2 virtual manipulatives, such as number line, base-10 blocks, protractor, fraction strip, or thermometer.
- At least 1 diagnostic-to-assignment example.

### 7.2 Student MVP

- Student/demo login.
- Learning path page.
- Modern lesson player.
- Bilingual support controls.
- Audio, captions/transcripts, Replay, reduced motion.
- Key Terms and page translation support.
- Try-It interactions with immediate feedback.
- Basic final quiz scoring.
- Progress state saved per user.
- Compatibility with Chromebook, desktop browser, tablet, and mobile browser.

### 7.3 Teacher MVP

The teacher MVP should restore the historically important HELP Math controls:

- Class and student progress view.
- Time-on-task.
- Lesson completion.
- Quiz scores.
- Mastery thresholds.
- Feature toggles: Spanish audio, calculator, language support, navigation mode.
- Lock-down sequential pathway option.
- Student skill gaps and recommended assignments.
- Basic custom curriculum assignment.
- AI-generated class insight summary, marked as teacher-support rather than final judgment.

### 7.4 Content Tooling MVP

- Legacy asset inventory dashboard.
- Migration status by object: not started, extracted, rebuilt, QA, approved.
- Side-by-side original SWF/Ruffle reference and rebuilt HTML5 view.
- Lesson schema preview.
- QA checklist for math correctness, language support, accessibility, and browser compatibility.

## 8. AI, Machine Learning, Speech, and Virtual Tutor Roadmap

### 8.1 AI Priority Model

| Priority | Feature | Rationale | Stage |
|---|---|---|---|
| P0 | AI Hint Engine | Extends existing hints and Need More HELP feedback | MVP |
| P0 | Teacher Insight Summary | Restores and improves teacher reports with actionable summaries | MVP |
| P1 | Misconception Detection | Uses Try-It errors, diagnostic gaps, and quiz data | Phase 2 |
| P1 | Adaptive Assignment Recommendation | Modern version of diagnostic-to-custom-curriculum workflow | Phase 2 |
| P1 | Bilingual Scaffold Assistant | Supports English/Spanish and future additional languages | Phase 2 |
| P2 | Speech Recognition for Reading Practice | Directly aligns with HELP Math 2.0 scope and Boulder Learning strength | Phase 2 |
| P2 | Math Discourse and Spoken Explanation | Supports oral academic language and math reasoning | Phase 2/3 |
| P2 | Virtual Tutor Dialogs | Should be constrained by lesson schema and teacher oversight | Phase 3 |
| P3 | Automated Item Generation | Useful but high math-correctness risk | Phase 3 |

### 8.2 Speech Recognition Strategy

The 2.0 scope explicitly calls for Boulder Learning speech recognition technology, reading practice, math discourse R&D, and spoken dialogs with a virtual tutor. The modernization should treat speech as a strategic differentiator, but not as a first 90-day dependency.

Recommended sequence:

1. Text/audio transcript alignment for existing narration.
2. Student read-aloud practice for math vocabulary and sentence frames.
3. Speech-to-text capture for short math explanations.
4. Teacher-facing summary of oral math language attempts.
5. Virtual tutor dialogs using constrained prompts and lesson-state context.

Privacy boundary:

- Do not store raw student audio by default.
- If audio storage is required, require school authorization and retention limits.
- Redact PII from transcripts.
- Do not use student speech data to train external models unless expressly authorized.

### 8.3 Machine Learning Strategy

Start with interpretable models:

- Mastery score.
- Prerequisite skill graph.
- Hint-use patterns.
- Error taxonomy.
- Diagnostic gap mapping.
- Item difficulty and completion patterns.

Only after a pilot dataset exists should the team consider more advanced machine learning or deep learning models.

## 9. Student Data, Teacher Console, and Learning Analytics

The old product already had progress monitoring, quiz reports, mastery levels, diagnostic reports, and automatic curriculum assignment. The new product should not regress from those capabilities.

### 9.1 Event Data Model

Track:

- Page viewed.
- Audio played/replayed.
- Key Term opened.
- Spanish support used.
- Calculator/manipulative used.
- Hint requested.
- Try-It attempt.
- Error type.
- Feedback displayed.
- Quiz item answered.
- Mastery threshold met or missed.
- Diagnostic skill gap assigned.
- Teacher override or custom assignment.

### 9.2 Teacher Console

The teacher console should include:

- Student progress.
- Time spent.
- Lesson completion.
- Quiz scores.
- Skill gaps.
- Recommended lessons.
- Support usage patterns.
- Students stuck after repeated hints.
- Reports by class, student, standard, lesson, and vocabulary domain.

### 9.3 Diagnostic and Custom Curriculum

The attached materials describe a diagnostic pretest and automatic custom curriculum assignment. This should be a major modernization feature:

- Map diagnostic items to skills and prerequisite knowledge.
- Auto-score pretests and formative checks.
- Generate skill gap report.
- Recommend grade-level and background lessons.
- Allow teacher approval before assignment.
- Log recommendations and teacher changes for future model improvement.

## 10. Compliance and Trust Framework

This roadmap is not legal advice, but the product should be designed for K-12 trust from the start.

### 10.1 FERPA

Treat progress, quiz scores, diagnostic reports, learning paths, teacher comments, and AI summaries as education records or potentially sensitive student data. Required practices:

- School/district data ownership.
- Role-based access control.
- Audit logs.
- Data export and deletion workflow.
- Data Processing Agreement readiness.
- Vendor/provider inventory.

### 10.2 COPPA

If students under 13 use the product:

- Use school-authorized consent where applicable.
- Avoid unnecessary personal data collection.
- No behavioral advertising.
- Clear privacy notices.
- Special review for speech, audio, free text, and AI logs.

### 10.3 WCAG 2.2 AA and UDL

Modern HELP Math should explicitly combine accessibility compliance with the existing UDL direction described in the 2.0 scope:

- Keyboard navigation.
- Captions/transcripts for narration.
- Screen reader labels.
- High contrast.
- Reduced motion.
- Audio controls.
- Accessible math expressions.
- Avoid dependence on color alone.
- Make translation and vocabulary supports keyboard-accessible.

## 11. Risk Register

| Risk | Severity | Likelihood | Mitigation |
|---|---:|---:|---|
| Corpus scope is unclear across source documents | High | High | Start with asset and scope reconciliation. |
| FLA files missing or unusable | High | Medium | Use SWF extraction, screenshots, Ruffle, and storyboard rebuilds. |
| Treating Flash conversion as the full product | High | High | Anchor migration in lesson schema and pedagogy audit. |
| Losing Spanish/audio/vocabulary supports | High | Medium | Make bilingual supports required schema fields. |
| 6,500 SWF objects overwhelm manual migration | High | High | Build migration classification and batching workflow. |
| AI expands before data foundation exists | High | High | Limit MVP AI to hints and teacher summaries. |
| Speech recognition accuracy and privacy risks | High | Medium | Phase speech after transcript alignment and privacy design. |
| Teacher console under-scoped | High | Medium | Restore historical teacher controls in MVP scope. |
| Accessibility issues in animated lessons | Medium | Medium | Add WCAG QA to every lesson type. |
| Full rebuild timeline underestimated | High | High | Treat 90 days as pilot package; full 2.0 likely needs longer cycle. |

## 12. Team Roles

### 12.1 Historical Roles Referenced in Phase I Materials

The Phase I proposal identified roles such as PI, co-PI, Learning Architect, Product Manager, program analysis/coding lead, and external evaluator. It also referenced expertise in methodology, psychometrics, educational entrepreneurship, math product architecture, HELP Math product management, HTML5 coding, and external evaluation.

Current planning should preserve these role categories rather than merely preserve names.

### 12.2 Recommended Modern Team

- Product/Program Lead: scope, timeline, stakeholder coordination.
- Learning Engineering Lead: lesson schema, pedagogy, diagnostic logic.
- Legacy Flash Specialist: FLA/SWF/ActionScript audit and extraction.
- Frontend Lead: Next.js, React, SVG/Canvas runtime.
- Animation/Interaction Designer: HELP 1.5 storyboard modernization.
- Backend/Data Engineer: users, rosters, learning events, reports.
- AI Engineer: AI Gateway, hint engine, teacher summaries.
- Speech/Language Engineer: reading practice, ASR, transcripts, math discourse.
- Assessment/Psychometrics Advisor: diagnostic assessment and mastery model.
- UX/UI Designer: student player, teacher console, content tooling.
- QA Lead: math correctness, browser/device compatibility, accessibility.
- Privacy/Compliance Advisor: FERPA, COPPA, WCAG, AI data governance.
- Pilot/Evaluation Lead: usability testing, teacher feedback, implementation data.

### 12.3 Dr. Peter Hu's Recommended Role

Dr. Peter Hu should be positioned as:

- Learning Engineering and AI Modernization Advisor.
- Pedagogical Recovery Lead.
- AI Feature Prioritization Advisor.
- Pilot Evaluation and Evidence Strategy Lead.

The strongest contribution is not hand-converting every Flash file. It is helping HELP Math decide what to preserve, what to rebuild, how to structure learning data, and where AI can improve instruction without weakening the original evidence-based design.

## 13. 90-Day Plan

### Days 1-15: Recovery Audit Sprint

Deliverables:

- Corpus scope reconciliation memo.
- Legacy asset inventory.
- Flash complexity classification.
- Lesson schema v0.1.
- Teacher/admin feature inventory.
- Diagnostic/assessment inventory.
- AI and speech opportunity map.
- 10-20 lesson MVP candidate list.

Key work:

- Validate 44 lessons, 73 lessons, 300+ hours, and 6,500 SWF references.
- Identify priority modules: Numbers Make Sense, Geometry, Algebra, Data Analysis, plus any K-2 expansion candidates.
- Select representative lesson pages from all major section types.
- Identify existing audio, Spanish, Key Terms, and assessment assets.

### Days 16-30: Architecture and Prototype

Deliverables:

- Next.js application shell.
- Lesson runtime prototype.
- Learning object schema prototype.
- One L1/L2 lesson rebuilt in React/SVG.
- One L3 interaction rebuilt with state and feedback.
- One virtual manipulative proof of concept.
- Teacher console wireframe.
- AI Gateway design.

Key work:

- Use original SWF/Ruffle/Adobe Animate output as visual reference.
- Implement event logging for lesson interactions.
- Validate audio/text/animation synchronization approach.
- Define QA protocol based on Phase I compatibility testing concept.

### Days 31-60: MVP Build

Deliverables:

- 10-20 representative rebuilt learning objects.
- Student lesson player.
- Key Terms and bilingual support prototype.
- Try-It feedback and hint prototype.
- Basic quiz scoring.
- Teacher progress view.
- AI Hint Engine v0.1.
- Teacher Insight Summary v0.1.

Key work:

- Build side-by-side original/rebuilt comparison workflow.
- Restore teacher controls: Spanish support, calculator, navigation mode, mastery threshold.
- Build content QA checklist.
- Start accessibility testing.

### Days 61-75: QA and Pilot Readiness

Deliverables:

- Browser/device compatibility matrix.
- Accessibility audit report.
- Content QA report.
- AI safety review.
- Teacher testing protocol.
- Pilot data collection plan.

Key work:

- Test on Chrome, Safari, Edge, Firefox, Chromebook, tablet, and mobile.
- Compare with Phase I proposal's compatibility-testing philosophy, updating it for 2026 devices.
- Run internal teacher-style usability reviews.
- Verify no raw student audio is stored in MVP.
- Adapt the Phase I usability-testing model: internal team testing first, then teacher/pre-service-teacher style testing, structured bug reports, surveys, focus groups, and follow-up interviews.
- Keep child-student research out of the first usability QA unless a separate IRB/privacy plan is approved.

### Days 76-90: Pilot Package and Full Roadmap

Deliverables:

- Pilot-ready MVP demo.
- Recovery Audit Report.
- Modern Architecture Blueprint.
- AI and Speech Roadmap.
- Full HELP Math 2.0 scope and cost model.
- 18-24 month product roadmap.
- Stakeholder presentation deck outline.

Key work:

- Package MVP around concrete teacher/student use cases.
- Define Phase 2: speech recognition, reading practice, math discourse, diagnostic assignment, additional languages.
- Define Phase 3: virtual tutor dialogs, adaptive sequencing, expanded K-8/K-2 scope.

## 14. Full Product Timeline Recommendation

The attached 2.0 scope document suggests a six-month product review/design phase, one-year development cycle, and six-month QA testing cycle. That is more realistic for full HELP Math 2.0 than a 90-day build.

Recommended framing:

- 0-3 months: Recovery audit and pilot MVP.
- 3-9 months: Product review/design, content schema, full migration factory, core platform.
- 9-21 months: Full content rebuild and new feature development.
- 21-27 months: QA, accessibility, compliance, pilot, implementation support.

If HELP Math leadership wants a faster commercial release, release it as staged modules rather than waiting for full K-8/K-2 coverage.

## 15. Immediate Questions for HELP Math Leadership

1. Who currently owns the HELP Math 1.5 assets, source code, assessment banks, audio, and rights?
2. Are all FLA source files available, or only SWF outputs?
3. Which corpus is the target for recovery: 44 lessons, 73 lessons, 300+ hours, or the full 6,500 learning-object repository?
4. Is the first target market grade 6-8, grade 3-8, K-8, K-2 expansion, or ELL remediation generally?
5. Should Spanish remain the first bilingual priority, and which additional languages are commercially important?
6. What is the desired relationship with Istation, Sunburst, Boulder Learning, and any current distributor?
7. Is the virtual tutor/speech recognition roadmap still strategically central?
8. What budget and team are available for the first 90 days?
9. What schools or teachers can participate in pilot testing?
10. What data privacy posture does the team want for AI and speech data?

## 16. Recommended Immediate Next Step

Start a 2-3 week Recovery Audit Sprint with a small cross-functional team. The sprint should produce:

1. HELP Math Legacy Asset Inventory.
2. HELP Math Pedagogical and Content Architecture Map.
3. HELP Math Technical Migration Classification.
4. HELP Math MVP Lesson Candidate List.
5. HELP Math Modern Architecture Blueprint.
6. HELP Math AI, Speech, and Learning Analytics Roadmap.

This positions the project as a serious recovery and modernization initiative, not a narrow Flash conversion job.

## 17. References

### Attached Source Documents

- `About HELP Math.pdf`
- `BoulderLearning.PhaseI.HMwithHTML5.pdf`
- `HELP Math 2.0 Scope.pdf`

### External References

- Adobe Flash Player EOL: https://www.adobe.com/products/flashplayer/end-of-life-alternative.html
- FTC Children's Privacy / COPPA guidance: https://www.ftc.gov/business-guidance/privacy-security/childrens-privacy
- U.S. Department of Education FERPA overview: https://studentprivacy.ed.gov/ferpa
- W3C WCAG 2.2 Recommendation: https://www.w3.org/TR/WCAG22/
