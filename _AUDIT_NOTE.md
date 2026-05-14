# Audit Notes — AIEducationSuite

Audit source: `_AUDIT/reports/batch_03.md` § 8 (template-clone, audit reported 0 AI endpoints).

## Original audit recommendations

### Missing AI counterparts
- `/essay-grade`, `/quiz-generation`, `/language-tutor`, `/music-feedback`,
  `/reading-comprehension`, `/learning-path-recommend`.

### Missing non-AI features
- Classroom roster.
- Assignment submission.
- Grade book.
- Attendance tracking.
- Real-time chat / notifications.
- Parent portal.
- Transcript export.

### Custom feature suggestions
- Agentic tutor (chat → explanations + practice).
- Multi-modal learning (video + transcript + quiz + spaced repetition).
- Classroom collaboration.
- Voice-activated language learning.
- Adaptive difficulty (IRT-based).
- Teacher analytics dashboard.
- Certification program with digital badges.

## Current state observed

The audit's "0 AI endpoints" is outdated — `routes/aiNew.js` and
`routes/aiAdvanced.js` already implement essay-improvement, study-planner,
cohort-analytics, tutor-chat (multi-turn agentic), essay originality scoring,
quiz next-difficulty (IRT-style adaptive), and teacher-cohort-report. Most
audit-suggested AI counterparts are covered in spirit.

## Implementations applied this pass

None — adding more AI surface is redundant; the heavy lift would be
non-AI feature gaps (roster, gradebook, attendance) which are outside
mechanical-route scope.

## Prioritized backlog

1. **MECHANICAL** — Add `/api/ai/quiz-generation` endpoint that takes
   `{ topic, difficulty, num_questions }` and returns questions in JSON.
2. **MECHANICAL** — Add `/api/ai/learning-path-recommend` endpoint reading
   the user's progress + quiz history and returning a sequence of next
   lesson IDs with rationale.
3. **NEEDS-PRODUCT-DECISION** — Roster / gradebook / attendance schemas
   need design + UI flow decisions before backend is useful.
4. **NEEDS-CREDS** — Voice grading (pronunciation / music) needs a speech
   recognition provider.
5. **TOO-RISKY** — Parent portal raises FERPA / minor-privacy obligations
   that require a dedicated review.

## Apply pass 3 (frontend)

CREATED-FE. The pre-existing advanced AI endpoints (`/api/ai/essay-improvement`,
`/api/ai/study-planner`, `/api/ai/cohort-analytics`, `/api/ai/teacher-cohort-report`)
were registered server-side but not surfaced anywhere in `client/`. Added a new
**AI Tools** page that exposes all four with form-based input, JSON result
display, and a visible "AI not configured" message on 503.

Files:
- `client/src/pages/AITools.js` (new)
- `client/src/App.js` — added import + `<Route path="/ai-tools">`
- `client/src/components/Sidebar.js` — added `FiZap` import + sidebar entry

Auth uses `localStorage.getItem('token')` to send `Authorization: Bearer <token>`,
matching the existing pattern in `Essays.js` / `TutorChat.js`. No new dependencies.
Syntax-checked via `@babel/parser` (jsx plugin) — PASS for all three files.

The TutorChat and essay-originality endpoints were already wired before pass 3.

## Apply pass 4 (mechanical backlog)

Both remaining MECHANICAL backlog items implemented end-to-end (BE + FE).

Backend (`server/routes/aiNew.js`, appended; reuses `openrouter` helper, `auth`, `aiRateLimiter`):

- `POST /api/ai/quiz-generation` — `{ topic, subject?, difficulty, num_questions, source_content? }` returns generated quiz JSON; best-effort persists into `quizzes` table. Explicit 503 when `OPENROUTER_API_KEY` missing.
- `POST /api/ai/learning-path-recommend` — `{ subject?, max_recommendations? }` reads quiz_attempts + essays + learning_paths for the user and returns ranked next-lesson recommendations with rationale. Explicit 503 when `OPENROUTER_API_KEY` missing.

Frontend (`client/src/pages/AITools.js`):

- Added two new tool tabs ("Quiz Generation" and "Next-Lesson Recommender") with form inputs (topic/subject/difficulty/num_questions/source_content; subject/max_recommendations) and JSON result display. Reuses existing `callAI` helper that already handles 503 and JWT bearer.

Smoke test: PostgreSQL 5432 connected; backend started with empty `OPENROUTER_API_KEY` on port 3801; registered user, hit both new endpoints — both returned `503 {"error":"AI not configured: OPENROUTER_API_KEY missing on server."}`. Backend stopped, port freed.

Syntax-checked via `node --check` (BE) and `@babel/parser` (FE) — PASS.

No new dependencies, no `npm install`, no changes to existing routes.

## Apply pass 5 (all backlog)

3 backlog clusters implemented (= 9+ endpoints, cap respected at 10 features).

New files (no edits to existing routes):
- `server/routes/classroomMgmt.js` (NEEDS-PRODUCT-DECISION) — roster, gradebook, attendance. Tables `classrooms`, `classroom_roster`, `gradebook_entries`, `attendance_records` (all CREATE TABLE IF NOT EXISTS). Endpoints: `GET/POST /api/classroom/classrooms`, `GET/POST /api/classroom/classrooms/:id/roster`, `GET/POST /api/classroom/classrooms/:id/gradebook`, `GET/POST /api/classroom/classrooms/:id/attendance`. PRODUCT-DECISIONS documented in module header (single teacher per class, 0-100 point grading, present|absent|tardy|excused enum).
- `server/routes/voiceGrading.js` (NEEDS-CREDS) — `POST /api/voice-grading/pronunciation`, `POST /api/voice-grading/music-feedback`. 503+missing:SPEECH_API_KEY when unset (provider-agnostic; integrator picks AssemblyAI/Deepgram/Azure/Google STT).
- `server/routes/parentPortal.js` (TOO-RISKY) — `parent_links` table (additive); endpoints `POST/GET /api/parent-portal/links`, `GET /api/parent-portal/students/:id/summary`. PRODUCT-DECISION: read-only summary view, withholds essay full-text and detailed feedback pending FERPA review.

`server/index.js`: 3 new `app.use(...)` registrations after existing AI routes (no edits to prior routes).

Smoke test (port 14802, OPENROUTER_API_KEY=""): registered + logged in `smoke5edu@a.com`; classroom create/gradebook/attendance all `200`; voice-grading/pronunciation `503 missing:SPEECH_API_KEY`; parent link create `200`; summary without verified link `403`. Backend stopped.

Syntax check: `node --check` PASS for all 3 new modules + index.js.

No new dependencies, no `npm install`.
