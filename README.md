# My AI English Coach 🎓

A **dependency-free static web app** — an AI-powered English learning & speaking coach that runs entirely on-device. No npm, no build step, no backend, no API keys. Open `index.html` in any modern browser (including Android Chrome) and it just works.

Built for a Hindi/Hinglish-speaking learner: every explanation is in **simple English + Hinglish**, with zero textbook jargon.

## How to run

- **Easiest:** open `index.html` directly in Chrome/Edge/Firefox (double-tap on Android via a file manager, or serve it).
- **Recommended for Android:** serve the folder over local Wi-Fi so mic + speech work best:
  ```bash
  cd ~/workspace/english-coach
  python3 -m http.server 8000
  # then open http://<your-computer-ip>:8000 on the phone
  ```
- **Deploy:** copy the folder to Render Static Site, GitHub Pages, Netlify, or any static host — no build command needed.

Voice features use the **Web Speech API** (`SpeechRecognition` for mic input, `speechSynthesis` for playback). If the browser doesn't support them, every voice feature gracefully falls back to **text input mode** — nothing breaks.

## Features (21 tabs)

| Tab | What it does |
|---|---|
| 📊 Dashboard | 8 skill scores (0–100), XP, streak (+freeze note), today's mission progress, Weekly Focus Sprint, "past-you vs current-you" |
| 🎤 Speak with AI | Mic/text → transcript → feedback card (What You Said / ❌ Mistake / 🧠 Why / 🇮🇳 Hinglish / ✅ Correct / ⭐ Natural / 🔊 Listen / 🎤 Repeat / ➡️ Next) + fluency-vs-accuracy split |
| 💬 Conversation | 8 topics × 5 modes: Normal, Strict Teacher, Shadowing, Debate, Roleplay (5 personas) |
| 📅 Daily Mission | Adaptive task set — weakest skill gets extra tasks; streak/XP tracking |
| 📈 Progress | Canvas-drawn charts (no libs), mistake categories with Practice jump buttons, achievements |
| 🧪 Placement Test | 15-question first-run assessment → L1–L5 estimate (labeled **not** an official CEFR cert) → roadmap; retake comparison |
| 📝 Weekly Report | Template-based report from real stats, with voice playback |
| ⏳ Tenses | All 12 tenses (Hinglish meaning, formula, examples, tricks, quizzes) + tense comparison chains + conditionals + modals |
| 📚 Verbs | 131 verbs (V1–V5, Hindi meaning), search/filter/favorites, flashcards, quiz, Daily 10, 40 phrasal verbs |
| 🔤 Vocabulary | 200 words across 9 categories, SRS flashcards, 2 quiz types, 40-idiom bank |
| 🧩 Sentence Builder | Scrambled-word game (E/M/H) + Article & Preposition Clinic |
| 🇮🇳 Hinglish↔English | Both directions, with a distinct 🔁 calque tag (e.g. "I am having a doubt") |
| 🔊 Pronunciation | TH/R/V-W/S-Z/-ED/stress guides, 24 minimal pairs, record-and-playback, accent-goal selector (reference only) |
| 🎤 Interview Coach | HR/Technical/Internship/Behavioral/Viva banks, STAR coach, mock full interview with consolidated report |
| 💻 Technical English | Project-explanation framework drill + non-technical vs senior-engineer register switch |
| 🧠 Think in English | Situational prompts + 1/3/5-min internal-monologue timer (zero correction during) |
| 💬 Simulations | 8 real-life + 5 difficult-conversation roleplays with goal checklists |
| 🎧 Listening | 6 passages × 3 levels with TTS playback, speed control, comprehension quizzes (accent label is honest: "device voice") |
| ✍️ Writing | Journal/email/LinkedIn/resume/interview checks + resume-bullet rewriter |
| 💪 Confidence Lab | Techniques, rescue phrases practiced in mini-conversations, 30s→5min ladder |
| ⚙️ Settings | Profile, daily goal, plan length, quiet hours, accent goal, theme, export/import/reset |

**Level system:** L1 Beginner → L5 Advanced, auto-adjusted from performance with a "why" explanation line.

## How the "AI" works (no LLM)

There is **no live LLM** — everything runs on-device:

- `js/ai/grammar.js` — rule-based mistake detector for the top Hindi-speaker error categories: articles (a/an/the), subject-verb agreement, tense forms, prepositions, common calques ("I am having a doubt", "Myself Rahul", "give exam", "revert back"...), plurals/countables, double negatives, word order, `i`→`I`. Returns character-accurate spans, plain-English + Hinglish explanations, corrections, and a best-effort natural rewrite. Also fluency scoring (filler words, pause marks).
- `js/ai/engine.js` — `analyzeSentence`, `correctSentence`, `detectCalque`, `explainGrammar`, `generateExercise` (8 kinds), `generateConversation` (**scripted template engine** — replies come from curated templates per mode/topic/persona, stated honestly in code comments), `evaluateAnswer` (rubric + STAR detection), `scoreRepeat` (word-level LCS), `weeklyReport`, `recommendFocus`.

All user data (mistake profile, skill profile, XP, streak, SRS state) persists in `localStorage` under the versioned key `ec_coach_v1`.

## Plugging in a real LLM backend later

The app is built behind a clean abstraction — `EC.ai` in `js/ai/engine.js`:

```js
EC.ai.analyzeSentence(text)      // -> {mistakes[], fluency{}, accuracy}
EC.ai.correctSentence(text)      // -> {corrected, natural, explanations[]}
EC.ai.generateExercise(kind,opts)// -> {prompt, options?, answer, explainHinglish, hint}
EC.ai.generateConversation(mode, topic, persona, history) // -> {reply, followUp, correction}
EC.ai.evaluateAnswer(q, a, rubric)// -> {scores, feedback[], better, star{}}
EC.ai.explainGrammar(key)         // -> {simple, hinglish, examples[], trick}
```

To upgrade: keep these signatures and swap the internals to `fetch()` your backend (`Frontend → Backend → LLM`, keys in env vars server-side — see `SECURITY` note: never expose keys client-side). All 21 UI tabs call only these functions, so no UI changes are needed.

## Adding content (data guide)

All content lives in `js/data/*.js` as plain arrays on `EC.data` — just append entries:

- `verbs.js` — `{id, v1, v2, v3, v4, v5, hindi, regular, ex:[...], mistake}` (131 now)
- `words.js` — `{id, w, pos, hinglish, meaning, ex, syn, ant, cat, d}` (200 now)
- `idioms.js` / `phrasals.js` / `tenses.js` / `conditionals.js` (modals) / `interview.js` / `passages.js` / `pronunciation.js` / `scenarios.js` / `missions.js` / `confidence.js`

Quizzes and flashcards read these files automatically — no other changes needed.

## Project structure

```
index.html  css/style.css  css/group-a.css
js/core.js          # EC namespace: store, nav, ui helpers, speech, XP/streak
js/app.js           # boots app, builds tab bar, hash routing
js/ai/grammar.js    # rule-based grammar engine (also Node-testable)
js/ai/engine.js     # EC.ai abstraction layer
js/ai/selftest.js   # dev-only 56-assertion test suite (not loaded by the app)
js/data/*.js        # 12 content files
js/ui/*.js          # 21 tab modules, each EC.register(id, {title, icon, render})
```

## Testing done

- `node --check` on all 38 JS files — pass.
- `js/ai/selftest.js` — **56/56 pass** (10 required Hindi-speaker sentences + 17 extra categories + span validity + false-positive sweep on 14 clean sentences).
- Full load-order integration test (all 35 scripts in page order, stubbed DOM): **21/21 tabs register, 0 load errors, 0 render errors**; all 9 `EC.ai` functions present; store shape verified.
- UI groups each shipped their own smoke harnesses (71 + deep-flow + 47 assertions — all passing).
- Fixed during integration: `generateExercise('tense-mcq')` verb-shape mismatch (engine expected `base/past/pp/third`, data uses `v1..v5` — normalized), and added the missing `EC.nav.go` / `EC.ui.showTab` cross-tab navigation API.

## Honest limitations

- Grammar detection is pattern-based: it catches the most common Hindi-speaker mistakes but won't understand complex or creative sentences like a real LLM.
- "Natural" rewrites are template-applied corrections, not native-speaker rephrasing.
- Conversation/interview bot replies are scripted templates, not generative AI.
- TTS voices/accents depend on the device; mic recognition needs Chrome + internet.
- Skill scores and levels are practice metrics, not certifications.
