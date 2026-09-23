/* ============================================================
   My AI English Coach — UI TAB GROUP C
   Tab: Interview ('interview') 🎤
   - Type picker (HR / Technical / Internship / Behavioral / Viva)
   - Question cards → Answer via mic/text → rubric evaluation
   - STAR coach (explainer + STAR detector)
   - Mock Full Interview: 6 questions, consolidated report
   Guards everything: works even if EC core pieces are missing.
   ============================================================ */
(function () {
'use strict';
if (typeof window === 'undefined') return;
var EC = window.EC;
if (!EC || typeof EC.register !== 'function') return;

var ui = EC.ui || {};
var speech = EC.speech || {};
var ai = EC.ai || {};
var data = EC.data || {};

/* ---------------- safe helpers ---------------- */
function el(tag, cls, html) {
  var d = null;
  if (typeof ui.el === 'function') {
    try { d = ui.el(tag, cls, html); } catch (e) { d = null; }
  }
  if (!d) {
    d = document.createElement(tag || 'div');
    if (cls) d.className = cls;
    if (html !== undefined && html !== null) d.innerHTML = html;
  }
  return d;
}
function toast(msg) {
  try { if (typeof ui.toast === 'function') { ui.toast(msg); return; } } catch (e) {}
  var t = el('div', 'eciv-toast', String(msg));
  document.body.appendChild(t);
  setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2400);
}
function addXP(n, why) { try { if (typeof EC.addXP === 'function') EC.addXP(n, why); } catch (e) {} }
function touchDay() { try { if (typeof EC.touchDay === 'function') EC.touchDay(); } catch (e) {} }
function bumpSkill(s, n) { try { if (typeof EC.bumpSkill === 'function') EC.bumpSkill(s, n); } catch (e) {} }
function award(id) { try { if (typeof EC.award === 'function') EC.award(id); } catch (e) {} }
function logMistake(m) { try { if (typeof EC.logMistake === 'function') EC.logMistake(m); } catch (e) {} }
function saveSession(info) {
  try {
    if (EC.store && EC.store.data) {
      EC.store.data.sessions = EC.store.data.sessions || [];
      EC.store.data.sessions.push(info);
      if (typeof EC.store.save === 'function') EC.store.save();
    }
  } catch (e) {}
}
function userName() {
  try { if (EC.store && EC.store.data && EC.store.data.profile && EC.store.data.profile.name) return EC.store.data.profile.name; } catch (e) {}
  return 'Champion';
}
function speak(text) {
  try { if (typeof speech.speak === 'function') { speech.speak(text); return true; } } catch (e) {}
  return false;
}
function speakBtnFor(text) {
  try {
    if (typeof ui.speakBtn === 'function') { var b = ui.speakBtn(text); if (b) return b; }
  } catch (e) {}
  var btn = el('button', 'eciv-btn sec sm', '🔊 Listen');
  btn.addEventListener('click', function (ev) {
    ev.stopPropagation();
    if (!speak(text)) toast('Voice not available on this device.');
  });
  return btn;
}
/* Answer input: mic-or-text if available, else a simple modal textarea */
function getAnswer(title, cb) {
  var fn = speech.micOrText;
  if (typeof fn === 'function') {
    try {
      var r = fn(title, function (t) { cb(t || ''); });
      if (r && typeof r.then === 'function') {
        r.then(function (t) { cb(t || ''); }, function () { textModal(title, cb); });
        return;
      }
      return;
    } catch (e) { /* fall through to modal */ }
  }
  textModal(title, cb);
}
function textModal(title, cb) {
  var ov = el('div', 'eciv-overlay');
  var box = el('div', 'eciv-modal');
  box.appendChild(el('h3', '', String(title)));
  var ta = el('textarea', 'eciv-ta');
  ta.placeholder = 'Type your answer here... (Apna jawab yahan likho)';
  ta.rows = 6;
  box.appendChild(ta);
  var row = el('div', 'eciv-row');
  var ok = el('button', 'eciv-btn', '✅ Submit');
  var cancel = el('button', 'eciv-btn sec', 'Cancel');
  ok.addEventListener('click', function () {
    var v = ta.value.trim();
    document.body.removeChild(ov);
    cb(v);
  });
  cancel.addEventListener('click', function () { document.body.removeChild(ov); cb(''); });
  row.appendChild(ok); row.appendChild(cancel);
  box.appendChild(row);
  ov.appendChild(box);
  document.body.appendChild(ov);
  setTimeout(function () { try { ta.focus(); } catch (e) {} }, 50);
}
function css() {
  if (document.getElementById('eciv-css')) return;
  var s = document.createElement('style');
  s.id = 'eciv-css';
  s.textContent =
    '.eciv-wrap{max-width:640px;margin:0 auto;padding:12px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1f2937;padding-bottom:40px}' +
    '.eciv-wrap h2{margin:6px 0 2px;font-size:22px}' +
    '.eciv-sub{color:#6b7280;font-size:14px;margin:0 0 12px}' +
    '.eciv-card{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:14px;margin:10px 0;box-shadow:0 1px 3px rgba(0,0,0,.06)}' +
    '.eciv-btn{display:block;width:100%;padding:14px 16px;margin:8px 0;border:none;border-radius:12px;background:#2563eb;color:#fff;font-size:16px;font-weight:700;cursor:pointer}' +
    '.eciv-btn:active{transform:scale(.98)}' +
    '.eciv-btn.sec{background:#eef2ff;color:#1e3a8a}' +
    '.eciv-btn.ghost{background:#f3f4f6;color:#374151}' +
    '.eciv-btn.sm{width:auto;display:inline-block;padding:8px 14px;font-size:14px;margin:4px 6px 4px 0}' +
    '.eciv-btn:disabled{opacity:.55}' +
    '.eciv-row{display:flex;gap:8px;flex-wrap:wrap}' +
    '.eciv-row .eciv-btn{flex:1;min-width:120px}' +
    '.eciv-type{display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:#fff;border:2px solid #e5e7eb;border-radius:14px;padding:14px;margin:8px 0;cursor:pointer;font-size:16px;font-weight:600;color:#1f2937}' +
    '.eciv-type:active{border-color:#2563eb;background:#eff6ff}' +
    '.eciv-type .em{font-size:28px}' +
    '.eciv-type small{display:block;font-weight:400;color:#6b7280;font-size:13px}' +
    '.eciv-q{font-size:19px;font-weight:700;line-height:1.45}' +
    '.eciv-tag{display:inline-block;background:#dbeafe;color:#1e40af;font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;margin-bottom:8px}' +
    '.eciv-bar{height:10px;background:#e5e7eb;border-radius:6px;overflow:hidden;margin:4px 0 10px}' +
    '.eciv-bar>i{display:block;height:100%;border-radius:6px;background:linear-gradient(90deg,#f59e0b,#ef4444)}' +
    '.eciv-bar>i.good{background:linear-gradient(90deg,#34d399,#10b981)}' +
    '.eciv-bar>i.mid{background:linear-gradient(90deg,#fbbf24,#f59e0b)}' +
    '.eciv-score-row{display:flex;justify-content:space-between;font-size:14px;font-weight:600}' +
    '.eciv-fb{background:#f0fdf4;border-left:4px solid #22c55e;padding:10px 12px;border-radius:8px;margin:8px 0;font-size:14px}' +
    '.eciv-fb.tip{background:#eff6ff;border-left-color:#3b82f6}' +
    '.eciv-fb.warn{background:#fefce8;border-left-color:#eab308}' +
    '.eciv-star{display:inline-block;padding:4px 10px;border-radius:20px;font-size:13px;font-weight:700;margin:3px 4px 3px 0}' +
    '.eciv-star.on{background:#dcfce7;color:#166534}' +
    '.eciv-star.off{background:#f3f4f6;color:#9ca3af}' +
    '.eciv-better{background:#faf5ff;border:1px dashed #a78bfa;border-radius:12px;padding:12px;margin:10px 0;font-size:14px;line-height:1.6}' +
    '.eciv-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:flex-end;justify-content:center}' +
    '.eciv-modal{background:#fff;width:100%;max-width:640px;border-radius:18px 18px 0 0;padding:18px;max-height:85vh;overflow:auto}' +
    '.eciv-ta{width:100%;border:2px solid #e5e7eb;border-radius:12px;padding:12px;font-size:16px;font-family:inherit;box-sizing:border-box}' +
    '.eciv-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:24px;background:#111827;color:#fff;padding:12px 20px;border-radius:24px;font-size:14px;z-index:10000;max-width:90%;text-align:center}' +
    '.eciv-step{display:flex;gap:8px;align-items:center;background:#f8fafc;border-radius:10px;padding:10px;margin:8px 0;font-size:14px}' +
    '.eciv-step .n{background:#2563eb;color:#fff;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;flex-shrink:0}' +
    '.eciv-spin{text-align:center;padding:24px;font-size:16px;color:#4b5563}' +
    '.eciv-big{font-size:44px;font-weight:800;color:#2563eb;text-align:center;margin:6px 0}' +
    '@keyframes ecivPulse{0%{transform:scale(1)}50%{transform:scale(1.05)}100%{transform:scale(1)}}';
  document.head.appendChild(s);
}

/* ---------------- data (fallback if EC.data.interview absent) ---------------- */
var FALLBACK_Q = {
  hr: [
    'Tell me about yourself.',
    'Why should we hire you?',
    'What are your strengths and weaknesses?',
    'Where do you see yourself in 5 years?',
    'Why do you want to work here?',
    'Tell me about a challenge you faced and how you handled it.'
  ],
  technical: [
    'Explain your final-year project in 2 minutes.',
    'What programming languages do you know? Tell me about one.',
    'How would you debug a program that keeps crashing?',
    'Explain OOP (Object-Oriented Programming) in simple words.',
    'What is a database? Why do we use it?',
    'What is the difference between frontend and backend?'
  ],
  internship: [
    'Why do you want this internship?',
    'What skills can you bring to our team?',
    'Tell me about a project you did in college.',
    'How do you learn a new technology quickly?',
    'What do you expect to learn from this internship?',
    'Are you comfortable working in a team?'
  ],
  behavioral: [
    'Tell me about a time you worked in a team.',
    'Describe a difficult problem you solved.',
    'Tell me about a time you failed. What did you learn?',
    'How do you handle pressure or tight deadlines?',
    'Tell me about a time you disagreed with a teammate.',
    'Describe a situation where you showed leadership.'
  ],
  viva: [
    'Explain your project architecture in simple words.',
    'What was your role in the project?',
    'What difficulties did you face and how did you solve them?',
    'What would you improve in your project if you had more time?',
    'Explain one algorithm or concept you used in your project.',
    'How did you test your project?'
  ]
};
var TYPES = [
  { id: 'hr', name: 'HR Round', icon: '👔', desc: 'Tell me about yourself, strengths, goals…' },
  { id: 'technical', name: 'Technical Round', icon: '⚙️', desc: 'Project, coding concepts, problem solving' },
  { id: 'internship', name: 'Internship', icon: '🎓', desc: 'Why this internship? What can you offer?' },
  { id: 'behavioral', name: 'Behavioral (HR)', icon: '🧩', desc: '"Tell me about a time when…" — STAR answers' },
  { id: 'viva', name: 'College Viva', icon: '📝', desc: 'Project viva / lab exam questions' }
];
var BETTER_SAMPLES = {
  'Tell me about yourself.': '“I\'m a final-year BCA student from Delhi. I enjoy building small web apps — last semester I made a chat app with two friends, where I handled the backend. I\'m consistent, I learn fast, and I stay calm under deadlines. I\'m looking for a role where I can grow my coding and communication skills.”',
  'Why should we hire you?': '“You should hire me because I learn fast, I finish work on time, and I work well in a team. In my last project I took responsibility for the backend and delivered it two days early. I\'m genuinely excited about this role and I\'ll give it my full effort.”',
  'What are your strengths and weaknesses?': '“My strength is consistency — I practise coding every day and I don\'t give up on hard problems. My weakness is that I speak fast when I\'m nervous, so I\'m practising slow, clear speaking — like I\'m doing right now.”',
  'Tell me about a time you worked in a team.': '“[Situation] In our final semester, our 4-member team had to build a billing app in 3 weeks. [Task] My role was the database and billing logic. [Action] I made a daily checklist, and when one member fell sick, I took his module too and we did short video calls every night. [Result] We submitted one day early and got an A grade. I learned that clear daily communication saves teams.”',
  'Why do you want this internship?': '“I want this internship because I learn best by doing real work, not just watching tutorials. Your company works on products used by real customers, and I want to see how professional teams build and ship. I\'ll bring energy, fast learning, and I\'m not afraid to ask questions.”',
  'Explain your final-year project in 2 minutes.': '“[Situation] Small shops near my home still use paper notebooks for billing, and bills get lost. [Task] So I decided to build a simple billing app for them. [Action] I used HTML, JavaScript and Firebase. I visited 3 shops, watched how they bill, and kept the buttons big and simple. [Result] Two shops now use it daily and billing takes half the time. Next, I want to add Hindi language support.”'
};
function genericBetter() {
  return 'No fixed script — but use this STAR frame for a strong answer:\n\n' +
    '🟡 Situation: “In my final semester / last project…” (when + where)\n' +
    '🔵 Task: “My role was… / I had to…” (your responsibility)\n' +
    '🟢 Action: “I built / I organised / I fixed…” (what YOU did — use “I”, not “we”)\n' +
    '🔴 Result: “…and we finished 2 days early / got an A grade.” (numbers win!)\n\n' +
    'Keep it 60–90 seconds. Short, clear, confident. 💪';
}
function getQuestions(type) {
  try {
    if (data.interview && data.interview[type] && data.interview[type].length) return data.interview[type];
  } catch (e) {}
  return FALLBACK_Q[type] || [];
}
function typeName(id) {
  for (var i = 0; i < TYPES.length; i++) if (TYPES[i].id === id) return TYPES[i].name;
  return id;
}

/* ---------------- STAR detector ---------------- */
function detectSTAR(text) {
  var t = ' ' + String(text || '').toLowerCase() + ' ';
  return {
    S: /(when |once |last |during |in my |at (college|school|work|home)|situation|project)/.test(t),
    T: /(had to|my (role|task|job|responsibility|duty)|was responsible|needed to|i had)/.test(t),
    A: /(i (built|made|created|designed|led|fixed|wrote|organised|organized|helped|decided|implemented|developed|took|started|managed|handled|learned|learnt|practised|practiced|spoke|talked|presented|completed))/ .test(t),
    R: /(result|increased|decreased|improved|reduced|successfully|%|won|completed|grade|early|selected|appreciated|learned|learnt)/.test(t)
  };
}
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

/* ---------------- local fallback evaluation ---------------- */
function localEvaluate(question, answer) {
  var text = String(answer || '').trim();
  var words = text ? text.split(/\s+/).filter(Boolean) : [];
  var wc = words.length;
  var fillers = (text.match(/\b(um+|uh+|hmm+|er+|like|you know|basically|actually)\b/gi) || []).length;
  var rawSentences = text.split(/[.!?]+/).filter(function (s) { return s.trim().length > 0; });
  var grammar = 10;
  rawSentences.forEach(function (s) {
    var t = s.trim();
    if (t && /[a-z]/.test(t[0]) && t[0] !== t[0].toUpperCase()) grammar -= 1;
  });
  if (/(^|\s)i(\s|$)/.test(text)) { grammar -= 1; logMistake({ tab: 'interview', mistake: "lowercase 'i'", correction: "Write 'I' (capital)", at: Date.now() }); }
  grammar = clamp(Math.round(grammar - fillers * 0.5), 2, 10);

  var uniq = {};
  words.forEach(function (w) { uniq[w.toLowerCase().replace(/[^a-z']/g, '')] = 1; });
  var ratio = wc ? Object.keys(uniq).length / wc : 0;
  var vocabulary = clamp(Math.round(4 + ratio * 6 - (wc < 20 ? 2 : 0)), 2, 10);

  var fluency = clamp(Math.round(wc >= 60 ? 9 : wc >= 35 ? 7 : wc >= 15 ? 5 : 3) - Math.min(3, fillers), 2, 10);

  var hedges = (text.match(/\b(maybe|i think|kind of|sort of|not sure|probably)\b/gi) || []).length;
  var confidence = clamp(Math.round(wc >= 40 ? 8 : wc >= 20 ? 6 : 4) - hedges, 2, 10);

  var connectors = (text.match(/\b(first|then|because|so|however|finally|for example|in conclusion|also|next)\b/gi) || []).length;
  var star = detectSTAR(text);
  var starCount = (star.S ? 1 : 0) + (star.T ? 1 : 0) + (star.A ? 1 : 0) + (star.R ? 1 : 0);
  var structure = clamp(3 + Math.min(4, connectors) + (starCount >= 3 ? 2 : starCount >= 1 ? 1 : 0) + (wc >= 40 ? 1 : 0), 2, 10);

  var feedback = [];
  if (wc >= 40) feedback.push({ kind: 'good', text: '👏 Good length! ' + wc + ' words — interviewers like detailed answers.' });
  else if (wc >= 15) feedback.push({ kind: 'tip', text: '💡 Add one more line — aim for 40+ words. Example: “For example…” (Aur ek line jodo.)' });
  else feedback.push({ kind: 'warn', text: '⚠️ Too short (' + wc + ' words). Interviewers want detail — describe WHAT you did and WHY.' });

  if (fillers > 2) feedback.push({ kind: 'tip', text: '💡 ' + fillers + ' filler words (um/uh/like). Pause silently instead — silence looks confident!' });
  else if (wc > 10) feedback.push({ kind: 'good', text: '👏 Clean delivery — almost no filler words!' });

  if (starCount >= 3) feedback.push({ kind: 'good', text: '🌟 Nice STAR structure detected! Keep using Situation → Task → Action → Result.' });
  else {
    var missing = [];
    if (!star.S) missing.push('Situation (when/where)');
    if (!star.T) missing.push('Task (your role)');
    if (!star.A) missing.push('Action (what YOU did)');
    if (!star.R) missing.push('Result (what happened — numbers!)');
    feedback.push({ kind: 'tip', text: '💡 Add STAR parts: ' + missing.join(', ') + '. (STAR Coach neeche dekho 👇)' });
  }
  if (hedges > 1) feedback.push({ kind: 'tip', text: '💡 “Maybe / I think” kam karo — say “I believe” or just state it. Confidence dikhao!' });

  return {
    scores: { grammar: grammar, vocabulary: vocabulary, fluency: fluency, confidence: confidence, structure: structure },
    feedback: feedback,
    better: BETTER_SAMPLES[question] || genericBetter(),
    star: star
  };
}
function normalizeEval(res, question, answer) {
  var fb = localEvaluate(question, answer);
  if (!res || typeof res !== 'object') return fb;
  var out = {
    scores: { grammar: 5, vocabulary: 5, fluency: 5, confidence: 5, structure: 5 },
    feedback: [],
    better: '',
    star: fb.star
  };
  ['grammar', 'vocabulary', 'fluency', 'confidence', 'structure'].forEach(function (k) {
    var v = res.scores && res.scores[k];
    out.scores[k] = (typeof v === 'number') ? clamp(Math.round(v), 0, 10) : fb.scores[k];
  });
  if (Array.isArray(res.feedback) && res.feedback.length) {
    out.feedback = res.feedback.map(function (f) {
      if (typeof f === 'string') return { kind: 'tip', text: f };
      return { kind: f.kind || 'tip', text: String(f.text || f) };
    });
  } else out.feedback = fb.feedback;
  out.better = res.better || fb.better;
  out.star = res.star || fb.star;
  return out;
}
function evaluate(question, answer, cb) {
  if (typeof ai.evaluateAnswer === 'function') {
    try {
      var r = ai.evaluateAnswer(question, answer, ['grammar', 'vocabulary', 'fluency', 'confidence', 'structure']);
      if (r && typeof r.then === 'function') {
        r.then(function (res) { cb(normalizeEval(res, question, answer)); },
               function () { cb(localEvaluate(question, answer)); });
        return;
      }
      if (r && typeof r === 'object') { cb(normalizeEval(r, question, answer)); return; }
    } catch (e) { /* fall through */ }
  }
  setTimeout(function () { cb(localEvaluate(question, answer)); }, 500);
}

/* ---------------- UI ---------------- */
function render(container) {
  css();
  container.innerHTML = '';
  var wrap = el('div', 'eciv-wrap');
  container.appendChild(wrap);
  showMenu(wrap);
}

function showMenu(box) {
  box.innerHTML = '';
  box.appendChild(el('h2', '', '🎤 Interview Practice'));
  box.appendChild(el('p', 'eciv-sub', 'Real interview questions. Answer aloud or type — get instant feedback. (Bolke ya likhke jawab do!)'));
  var c1 = el('button', 'eciv-btn', '💬 Practice by Round');
  c1.addEventListener('click', function () { showTypes(box); });
  var c2 = el('button', 'eciv-btn sec', '🌟 STAR Answer Coach');
  c2.addEventListener('click', function () { showStarCoach(box); });
  var c3 = el('button', 'eciv-btn sec', '🎯 Mock Full Interview (6 questions)');
  c3.addEventListener('click', function () { startMock(box); });
  box.appendChild(c1); box.appendChild(c2); box.appendChild(c3);
  var tip = el('div', 'eciv-card', '<b>💡 Quick tip:</b> Interview me <b>60–90 second</b> ke jawab best hote hain. Short + clear + ek example = perfect!');
  box.appendChild(tip);
}

function backBtn(box, fn, label) {
  var b = el('button', 'eciv-btn ghost sm', '← ' + (label || 'Back'));
  b.addEventListener('click', fn);
  return b;
}

function showTypes(box) {
  box.innerHTML = '';
  box.appendChild(backBtn(box, function () { showMenu(box); }));
  box.appendChild(el('h2', '', 'Choose your round'));
  box.appendChild(el('p', 'eciv-sub', 'Kis type ka interview practise karna hai?'));
  TYPES.forEach(function (t) {
    var qs = getQuestions(t.id);
    var b = el('button', 'eciv-type', '<span class="em">' + t.icon + '</span><span>' + t.name + '<small>' + t.desc + ' • ' + qs.length + ' questions</small></span>');
    b.addEventListener('click', function () { showQuestions(box, t.id, 0); });
    box.appendChild(b);
  });
}

function showQuestions(box, typeId, qIndex) {
  var qs = getQuestions(typeId);
  if (!qs.length) { toast('No questions found for this type.'); showTypes(box); return; }
  var q = qs[qIndex % qs.length];
  renderQuestionCard(box, { type: typeId, q: q }, {
    onNext: function () { showQuestions(box, typeId, qIndex + 1); },
    onExit: function () { showTypes(box); }
  });
}

function renderQuestionCard(box, item, opts) {
  opts = opts || {};
  box.innerHTML = '';
  box.appendChild(backBtn(box, opts.onExit || function () { showMenu(box); }, 'Exit'));
  var card = el('div', 'eciv-card');
  card.appendChild(el('span', 'eciv-tag', typeName(item.type) + (opts.progress ? ' • Q ' + opts.progress : '')));
  card.appendChild(el('div', 'eciv-q', '“' + String(item.q) + '”'));
  var btnRow = el('div', 'eciv-row');
  btnRow.appendChild(speakBtnFor(item.q));
  card.appendChild(btnRow);
  box.appendChild(card);

  var ansBtn = el('button', 'eciv-btn', '🎙️ Answer (speak or type)');
  ansBtn.addEventListener('click', function () {
    ansBtn.disabled = true;
    getAnswer('Your answer — ' + typeName(item.type), function (text) {
      ansBtn.disabled = false;
      if (!text || !text.trim()) { toast('Kuch toh bolo/likho! 🙂'); return; }
      showEvaluating(box, item, text, opts);
    });
  });
  box.appendChild(ansBtn);
  var skip = el('button', 'eciv-btn ghost', '⏭️ Skip this question');
  skip.addEventListener('click', function () { if (opts.onNext) opts.onNext(); });
  box.appendChild(skip);
}

function showEvaluating(box, item, answer, opts) {
  box.innerHTML = '';
  box.appendChild(el('div', 'eciv-spin', '🤔 Evaluating your answer…<br><small>Ruko, check ho raha hai…</small>'));
  evaluate(item.q, answer, function (res) { showResult(box, item, answer, res, opts); });
}

function scoreBar(label, v) {
  var row = el('div');
  var cls = v >= 7 ? 'good' : (v >= 5 ? 'mid' : '');
  row.appendChild(el('div', 'eciv-score-row', '<span>' + label + '</span><span>' + v + '/10</span>'));
  row.appendChild(el('div', 'eciv-bar', '<i class="' + cls + '" style="width:' + (v * 10) + '%"></i>'));
  return row;
}

function showResult(box, item, answer, res, opts) {
  opts = opts || {};
  box.innerHTML = '';
  box.appendChild(el('h2', '', '📊 Your feedback'));
  var card = el('div', 'eciv-card');
  card.appendChild(el('div', '', '<b>Q:</b> ' + String(item.q)));
  card.appendChild(el('div', '', '<b style="color:#6b7280">Your answer:</b> <span style="color:#4b5563">“' + String(answer).slice(0, 300) + (answer.length > 300 ? '…' : '') + '”</span>'));
  box.appendChild(card);

  var s = res.scores || {};
  var sc = el('div', 'eciv-card', '<b>Rubric scores</b>');
  var keys = [['grammar', '📝 Grammar'], ['vocabulary', '📚 Vocabulary'], ['fluency', '🗣️ Fluency'], ['confidence', '💪 Confidence'], ['structure', '🧱 Structure']];
  var total = 0;
  keys.forEach(function (k) {
    var v = typeof s[k[0]] === 'number' ? s[k[0]] : 5;
    total += v;
    sc.appendChild(scoreBar(k[1], v));
  });
  var avg = Math.round(total / keys.length * 10) / 10;
  sc.appendChild(el('div', 'eciv-big', avg + '/10'));
  box.appendChild(sc);

  var fb = el('div', 'eciv-card', '<b>💬 Feedback</b>');
  (res.feedback || []).forEach(function (f) {
    var cls = f.kind === 'good' ? 'eciv-fb' : (f.kind === 'warn' ? 'eciv-fb warn' : 'eciv-fb tip');
    fb.appendChild(el('div', cls, String(f.text)));
  });
  box.appendChild(fb);

  if (res.star) {
    var st = el('div', 'eciv-card', '<b>🌟 STAR check</b><br><small style="color:#6b7280">Strong answers have all 4:</small><br>');
    [['S', 'Situation'], ['T', 'Task'], ['A', 'Action'], ['R', 'Result']].forEach(function (p) {
      st.appendChild(el('span', 'eciv-star ' + (res.star[p[0]] ? 'on' : 'off'), (res.star[p[0]] ? '✅ ' : '⬜ ') + p[1]));
    });
    box.appendChild(st);
  }

  if (res.better) {
    var bt = el('div', 'eciv-card', '<b>✨ Better answer sample</b>');
    var pre = el('div', 'eciv-better', '');
    pre.textContent = String(res.better);
    bt.appendChild(pre);
    var hb = speakBtnFor(String(res.better));
    bt.appendChild(hb);
    box.appendChild(bt);
  }

  var again = el('button', 'eciv-btn', opts.mockLast ? '🏁 Finish interview' : '➡️ Next question');
  again.addEventListener('click', function () {
    if (opts.onDone) opts.onDone({ item: item, answer: answer, res: res, avg: avg });
    else if (opts.onNext) opts.onNext();
  });
  box.appendChild(again);

  addXP(10, 'interview answer');
  touchDay();
  bumpSkill('interview', 1);
  bumpSkill('speaking', 1);
  saveSession({ tab: 'interview', type: item.type, score: avg, at: Date.now() });
}

/* ---------------- STAR coach ---------------- */
function showStarCoach(box) {
  box.innerHTML = '';
  box.appendChild(backBtn(box, function () { showMenu(box); }));
  box.appendChild(el('h2', '', '🌟 STAR Answer Coach'));
  box.appendChild(el('p', 'eciv-sub', '“Tell me about a time…” questions ka perfect formula!'));
  var steps = [
    ['S', 'Situation', '🟡', 'Kab? Kahan? — Set the scene.', '“In my final semester, our team had to build an app in 3 weeks…”'],
    ['T', 'Task', '🔵', 'Tumhari responsibility kya thi?', '“My role was the database and billing logic…”'],
    ['A', 'Action', '🟢', 'TUMNE kya kiya? (Always say “I”, not “we”.)', '“I made a daily checklist and fixed the payment bug…”'],
    ['R', 'Result', '🔴', 'Result kya hua? Numbers = power!', '“We finished 1 day early and got an A grade.”']
  ];
  steps.forEach(function (s, i) {
    var d = el('div', 'eciv-step', '<span class="n">' + s[0] + '</span><span><b>' + s[2] + ' ' + s[1] + '</b> — ' + s[3] + '<br><i style="color:#6b7280">e.g. ' + s[4] + '</i></span>');
    box.appendChild(d);
  });
  var tryBtn = el('button', 'eciv-btn', '🎤 Try a STAR question now');
  tryBtn.addEventListener('click', function () { showQuestions(box, 'behavioral', 0); });
  box.appendChild(tryBtn);
  var note = el('div', 'eciv-card', '💡 <b>Detector:</b> jab tum answer doge, app automatically check karega ki S-T-A-R chaaro parts hain ya nahi. Missing part = tip milega!');
  box.appendChild(note);
}

/* ---------------- Mock full interview ---------------- */
function startMock(box) {
  var order = ['hr', 'hr', 'technical', 'internship', 'behavioral', 'viva'];
  var qs = [];
  order.forEach(function (t) {
    var arr = getQuestions(t);
    if (arr.length) qs.push({ type: t, q: arr[Math.floor(Math.random() * arr.length)] });
  });
  if (!qs.length) { toast('Questions not available.'); return; }
  var idx = 0, results = [];
  box.innerHTML = '';
  box.appendChild(el('h2', '', '🎯 Mock Full Interview'));
  box.appendChild(el('p', 'eciv-sub', '6 questions, back-to-back — jaise real interview! All the best 💪'));
  var start = el('button', 'eciv-btn', '▶️ Start mock interview');
  start.addEventListener('click', function () { ask(); });
  box.appendChild(start);
  box.appendChild(backBtn(box, function () { showMenu(box); }, 'Cancel'));

  function ask() {
    if (idx >= qs.length) { showMockReport(box, results); return; }
    renderQuestionCard(box, qs[idx], {
      progress: (idx + 1) + '/6',
      mockLast: idx === qs.length - 1,
      onDone: function (r) { results.push(r); idx++; ask(); },
      onExit: function () { showMenu(box); }
    });
  }
}
function showMockReport(box, results) {
  box.innerHTML = '';
  box.appendChild(el('h2', '', '🏁 Mock Interview Report'));
  box.appendChild(el('p', 'eciv-sub', 'Shabash, ' + userName() + '! Poora interview complete kiya! 🎉'));
  var total = 0, perType = {};
  results.forEach(function (r) {
    total += r.avg;
    perType[r.item.type] = perType[r.item.type] || [];
    perType[r.item.type].push(r.avg);
  });
  var overall = results.length ? Math.round(total / results.length * 10) / 10 : 0;
  var card = el('div', 'eciv-card');
  card.appendChild(el('div', '', '<b>Overall score</b>'));
  card.appendChild(el('div', 'eciv-big', overall + '/10'));
  var msg = overall >= 8 ? '🔥 Outstanding! Tum ready ho!' : overall >= 6 ? '👍 Good! Thodi aur practice aur perfect.' : '💪 Acchi shuruaat! Roz 2-3 questions practice karo.';
  card.appendChild(el('div', '', msg));
  box.appendChild(card);

  var det = el('div', 'eciv-card', '<b>Question-wise</b>');
  results.forEach(function (r, i) {
    det.appendChild(el('div', 'eciv-score-row', '<span>Q' + (i + 1) + ' (' + typeName(r.item.type) + ')</span><span>' + r.avg + '/10</span>'));
    det.appendChild(el('div', 'eciv-bar', '<i class="' + (r.avg >= 7 ? 'good' : r.avg >= 5 ? 'mid' : '') + '" style="width:' + (r.avg * 10) + '%"></i>'));
  });
  box.appendChild(det);

  var again = el('button', 'eciv-btn', '🔁 Try another mock');
  again.addEventListener('click', function () { startMock(box); });
  box.appendChild(again);
  box.appendChild(backBtn(box, function () { showMenu(box); }, 'Menu'));

  addXP(50, 'mock interview complete');
  award('mock-interview');
  bumpSkill('interview', 3);
  touchDay();
  saveSession({ tab: 'interview', type: 'mock', score: overall, at: Date.now() });
  toast('+50 XP! Mock interview complete 🎉');
}

EC.register('interview', { title: 'Interview', icon: '🎤', render: render });
})();
