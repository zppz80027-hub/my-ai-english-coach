/* ============================================================
   My AI English Coach — UI TAB GROUP C
   Tab: Writing ('writing') ✍️
   - Type picker (journal / email / LinkedIn post / resume bullet /
     interview answer) → textarea → rule-based check
   - EC.ai.analyzeSentence per sentence when available, else local rules
   - Tone tips per type + corrections + rewritten suggestion
   - Resume Bullet Rewriter: rough bullet → 2-3 stronger versions
   Guards everything: works even if EC core pieces are missing.
   ============================================================ */
(function () {
'use strict';
if (typeof window === 'undefined') return;
var EC = window.EC;
if (!EC || typeof EC.register !== 'function') return;

var ui = EC.ui || {};
var ai = EC.ai || {};

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
  var t = el('div', 'ecw-toast', String(msg));
  document.body.appendChild(t);
  setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2400);
}
function addXP(n, why) { try { if (typeof EC.addXP === 'function') EC.addXP(n, why); } catch (e) {} }
function touchDay() { try { if (typeof EC.touchDay === 'function') EC.touchDay(); } catch (e) {} }
function bumpSkill(s, n) { try { if (typeof EC.bumpSkill === 'function') EC.bumpSkill(s, n); } catch (e) {} }
function logMistake(m) { try { if (typeof EC.logMistake === 'function') EC.logMistake(m); } catch (e) {} }
function css() {
  if (document.getElementById('ecw-css')) return;
  var s = document.createElement('style');
  s.id = 'ecw-css';
  s.textContent =
    '.ecw-wrap{max-width:640px;margin:0 auto;padding:12px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1f2937;padding-bottom:40px}' +
    '.ecw-wrap h2{margin:6px 0 2px;font-size:22px}' +
    '.ecw-sub{color:#6b7280;font-size:14px;margin:0 0 12px}' +
    '.ecw-card{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:14px;margin:10px 0;box-shadow:0 1px 3px rgba(0,0,0,.06)}' +
    '.ecw-btn{display:block;width:100%;padding:14px 16px;margin:8px 0;border:none;border-radius:12px;background:#db2777;color:#fff;font-size:16px;font-weight:700;cursor:pointer}' +
    '.ecw-btn:active{transform:scale(.98)}' +
    '.ecw-btn.sec{background:#fce7f3;color:#9d174d}' +
    '.ecw-btn.ghost{background:#f3f4f6;color:#374151}' +
    '.ecw-btn.sm{width:auto;display:inline-block;padding:8px 14px;font-size:14px;margin:4px 6px 4px 0}' +
    '.ecw-ta{width:100%;border:2px solid #e5e7eb;border-radius:12px;padding:12px;font-size:16px;font-family:inherit;box-sizing:border-box;min-height:150px}' +
    '.ecw-type{display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:#fff;border:2px solid #e5e7eb;border-radius:14px;padding:13px;margin:8px 0;cursor:pointer;font-size:16px;font-weight:600;color:#1f2937}' +
    '.ecw-type:active{border-color:#db2777}' +
    '.ecw-type .em{font-size:28px}' +
    '.ecw-fix{background:#fef2f2;border-left:4px solid #ef4444;padding:8px 12px;border-radius:8px;margin:6px 0;font-size:14px}' +
    '.ecw-ok{background:#f0fdf4;border-left:4px solid #22c55e;padding:8px 12px;border-radius:8px;margin:6px 0;font-size:14px}' +
    '.ecw-suggest{background:#fdf2f8;border:1px dashed #f472b6;border-radius:12px;padding:12px;margin:10px 0;font-size:15px;line-height:1.65;white-space:pre-wrap}' +
    '.ecw-tone{font-size:14px;margin:5px 0}' +
    '.ecw-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:24px;background:#111827;color:#fff;padding:12px 20px;border-radius:24px;font-size:14px;z-index:10000;max-width:90%;text-align:center}' +
    '.ecw-ver{background:#fff;border:2px solid #f9a8d4;border-radius:12px;padding:12px;margin:8px 0;font-size:15px}';
  document.head.appendChild(s);
}

/* ---------------- writing types ---------------- */
var TYPES = {
  journal: { name: 'Journal / Diary', icon: '📔', desc: 'Daily diary — apne din ke baare me',
    placeholder: 'Today was a good day. In the morning I…',
    tips: ['Past tense use karo (was, went, felt)', 'Feelings words jodo (happy, tired, excited)', 'Roz 5 lines — habit banegi!'] },
  email: { name: 'Email', icon: '📧', desc: 'Professional email — job / college',
    placeholder: 'Subject: Request for leave\n\nDear Sir,\n\nI am writing to…\n\nThanks and regards,\nYour Name',
    tips: ['Subject line likhna mat bhoolo', 'Greeting se start karo (Dear Sir / Hello)', 'Thanks / Regards se end karo + apna naam'] },
  linkedin: { name: 'LinkedIn Post', icon: '💼', desc: 'Professional post — achievement share karo',
    placeholder: 'Excited to share that I just completed…',
    tips: ['Pehli line = hook (dhyaan kheenche!)', 'Positive + professional tone', 'End me 2-3 hashtags (#Learning #Growth)'] },
  resume: { name: 'Resume Bullet', icon: '📄', desc: 'One-line achievement — resume ke liye',
    placeholder: 'Built a billing app used by 2 shops…',
    tips: ['Action verb se start karo (Built, Led, Improved)', 'Number jodo (%, kitne log, kitna fast)', 'Ek line = ek achievement'] },
  interview: { name: 'Interview Answer', icon: '🎤', desc: 'Likhit jawab — phir bolke practice karo',
    placeholder: 'Tell me about yourself…',
    tips: ['STAR structure (Situation → Task → Action → Result)', 'Bolne pe 60-90 second ka ho', 'Result me number jodo'] }
};

/* ---------------- sentence analysis ---------------- */
function splitSentences(text) {
  var parts = String(text || '').split(/(?<=[.!?…])\s+/);
  if (parts.length <= 1) parts = String(text || '').split(/\n+/);
  return parts.map(function (s) { return s.trim(); }).filter(Boolean);
}
function localAnalyze(sentence) {
  var notes = [];
  var s = sentence;
  if (/^[a-z]/.test(s)) notes.push({ issue: 'Capital letter se start karo.', fix: 'cap' });
  if (/(^|\s)i(\s|$|[.,!?])/.test(s)) { notes.push({ issue: '"i" nahi, "I" (capital) likho.', fix: 'I' }); logMistake({ tab: 'writing', mistake: "lowercase 'i'", correction: "Use capital 'I'", at: Date.now() }); }
  if (!/[.!?…]$/.test(s)) notes.push({ issue: 'Sentence ke end me . ! ya ? lagao.', fix: 'punct' });
  var m;
  if ((m = s.match(/\b(dont|cant|wont|isnt|arent|doesnt|didnt|im|ive|ill)\b/i))) notes.push({ issue: '"' + m[0] + '" me apostrophe lagao → "' + apostrophe(m[0]) + '".', fix: 'apos' });
  if (/\b(\w+)\s+\1\b/i.test(s)) notes.push({ issue: 'Word repeat ho gaya — ek hatao.', fix: 'repeat' });
  if (s.split(/\s+/).length > 28) notes.push({ issue: 'Bahut lamba sentence — 2 me todo.', fix: null });
  if (/  /.test(s)) notes.push({ issue: 'Double space hai.', fix: 'spaces' });
  return notes;
}
function apostrophe(w) {
  var map = { dont: "don't", cant: "can't", wont: "won't", isnt: "isn't", arent: "aren't", doesnt: "doesn't", didnt: "didn't", im: "I'm", ive: "I've", ill: "I'll" };
  var k = w.toLowerCase();
  return map[k] || w;
}
function autoFix(sentence) {
  var s = sentence.trim().replace(/ {2,}/g, ' ');
  s = s.replace(/\b(dont|cant|wont|isnt|arent|doesnt|didnt|im|ive|ill)\b/gi, function (w) { return apostrophe(w); });
  s = s.replace(/(^|\s)i(\s|$)/g, '$1I$2');
  s = s.replace(/\b(\w+)(\s+\1\b)+/gi, '$1');
  s = s.charAt(0).toUpperCase() + s.slice(1);
  if (!/[.!?…]$/.test(s)) s += '.';
  return s;
}
function analyzeAll(sentences, done) {
  var fn = ai.analyzeSentence;
  var out = new Array(sentences.length);
  var pending = sentences.length;
  if (!pending) { done([]); return; }
  if (typeof fn !== 'function') {
    done(sentences.map(function (s) { return { sentence: s, notes: localAnalyze(s) }; }));
    return;
  }
  sentences.forEach(function (s, i) {
    try {
      var r = fn(s);
      if (r && typeof r.then === 'function') {
        r.then(function (res) { out[i] = normAi(res, s); if (--pending === 0) done(out); },
               function () { out[i] = { sentence: s, notes: localAnalyze(s) }; if (--pending === 0) done(out); });
      } else {
        out[i] = normAi(r, s);
        if (--pending === 0) done(out);
      }
    } catch (e) {
      out[i] = { sentence: s, notes: localAnalyze(s) };
      if (--pending === 0) done(out);
    }
  });
}
function normAi(res, s) {
  var notes = localAnalyze(s);
  try {
    if (res && Array.isArray(res.issues)) {
      res.issues.forEach(function (is) {
        notes.push({ issue: String(is.text || is.message || is), fix: null });
      });
    } else if (res && typeof res === 'object' && res.feedback) {
      notes.push({ issue: String(res.feedback), fix: null });
    }
  } catch (e) {}
  return { sentence: s, notes: notes };
}

/* ---------------- tone checks per type ---------------- */
function toneChecks(typeId, text) {
  var t = String(text || '');
  var tl = ' ' + t.toLowerCase();
  var checks = [];
  if (typeId === 'email') {
    checks.push({ ok: /(^|\n)(dear|hello|hi|respected|good morning)\b/i.test(t), label: 'Greeting hai? (Dear/Hello…)' });
    checks.push({ ok: /subject\s*:/i.test(t), label: 'Subject line hai?' });
    checks.push({ ok: /(thanks|thank you|regards|best regards|sincerely)/i.test(t), label: 'Thanks/Regards se ending?' });
  } else if (typeId === 'resume') {
    checks.push({ ok: /^(built|developed|created|led|designed|managed|improved|achieved|organised|organized|launched|fixed|delivered|increased|reduced|trained|mentored|published|won)\b/i.test(t.trim()), label: 'Action verb se start? (Built, Led…)' });
    checks.push({ ok: /\d/.test(t), label: 'Number / % hai? (quantify karo!)' });
  } else if (typeId === 'linkedin') {
    var first = t.split('\n')[0] || '';
    checks.push({ ok: first.length > 5 && first.length < 90, label: 'Pehli line short + catchy (hook)?' });
    checks.push({ ok: /#\w+/.test(t), label: 'Hashtags hain? (#Learning)' });
    checks.push({ ok: !/(hate|stupid|worst|damn)/i.test(t), label: 'Tone positive & professional?' });
  } else if (typeId === 'interview') {
    var starWords = (tl.match(/\b(when|my role|i built|i made|i led|i created|result|successfully|improved)\b/g) || []).length;
    checks.push({ ok: starWords >= 2, label: 'STAR words hain? (when / my role / result…)' });
    checks.push({ ok: t.trim().split(/\s+/).length >= 40, label: 'Kam se kam 40 words? (60-90 sec speech)' });
  } else { /* journal */
    checks.push({ ok: /(was|were|did|went|felt|thought|enjoyed|visited|saw|met|had)\b/i.test(t), label: 'Past tense use hua?' });
    checks.push({ ok: /(happy|sad|tired|excited|nervous|proud|angry|calm|grateful)\b/i.test(t), label: 'Feelings word hai?' });
  }
  return checks;
}

/* ---------------- UI ---------------- */
function render(container) {
  css();
  container.innerHTML = '';
  var wrap = el('div', 'ecw-wrap');
  container.appendChild(wrap);
  showMenu(wrap);
}
function showMenu(box) {
  box.innerHTML = '';
  box.appendChild(el('h2', '', '✍️ Writing Practice'));
  box.appendChild(el('p', 'ecw-sub', 'Likho, check karo, improve karo! Har type ke apne rules hain.'));
  Object.keys(TYPES).forEach(function (id) {
    var t = TYPES[id];
    var b = el('button', 'ecw-type', '<span class="em">' + t.icon + '</span><span>' + t.name + '<br><small style="font-weight:400;color:#6b7280">' + t.desc + '</small></span>');
    b.addEventListener('click', function () { showEditor(box, id); });
    box.appendChild(b);
  });
  var rb = el('button', 'ecw-btn sec', '⚡ Resume Bullet Rewriter');
  rb.addEventListener('click', function () { showRewriter(box); });
  box.appendChild(rb);
}
function backBtn(box, fn) {
  var b = el('button', 'ecw-btn ghost sm', '← Back');
  b.addEventListener('click', fn);
  return b;
}
function showEditor(box, typeId) {
  var t = TYPES[typeId];
  box.innerHTML = '';
  box.appendChild(backBtn(box, function () { showMenu(box); }));
  box.appendChild(el('h2', '', t.icon + ' ' + t.name));
  var tipCard = el('div', 'ecw-card', '<b>💡 Tips:</b><ul style="margin:6px 0;padding-left:20px;font-size:14px">' + t.tips.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>');
  box.appendChild(tipCard);
  var ta = el('textarea', 'ecw-ta');
  ta.placeholder = t.placeholder;
  box.appendChild(ta);
  var check = el('button', 'ecw-btn', '🔍 Check my writing');
  var res = el('div');
  check.addEventListener('click', function () {
    var text = ta.value.trim();
    if (text.split(/\s+/).filter(Boolean).length < 5) { toast('Thoda aur likho — kam se kam ek poori line! 🙂'); return; }
    res.innerHTML = '<div class="ecw-card">🤔 Checking…</div>';
    var sentences = splitSentences(text);
    analyzeAll(sentences, function (analyzed) {
      showAnalysis(box, typeId, text, analyzed, res);
      addXP(8, 'writing check');
      bumpSkill('grammar', 1);
      touchDay();
    });
  });
  box.appendChild(check);
  box.appendChild(res);
}
function showAnalysis(box, typeId, text, analyzed, res) {
  res.innerHTML = '';
  var totalIssues = 0;
  analyzed.forEach(function (a) { totalIssues += a.notes.length; });
  var head = el('div', 'ecw-card');
  head.innerHTML = totalIssues === 0
    ? '🎉 <b>Perfect!</b> Koi mistake nahi mili. Bahut badhiya!'
    : '📝 <b>' + analyzed.length + ' sentences, ' + totalIssues + ' suggestions</b> mile:';
  res.appendChild(head);
  analyzed.forEach(function (a, i) {
    if (!a.notes.length) {
      res.appendChild(el('div', 'ecw-ok', '✅ Sentence ' + (i + 1) + ': <i>“' + escapeHtml(a.sentence.slice(0, 80)) + '”</i> — clean!'));
    } else {
      a.notes.forEach(function (n) {
        res.appendChild(el('div', 'ecw-fix', '❌ S' + (i + 1) + ': ' + escapeHtml(n.issue) + '<br><small style="color:#6b7280">“' + escapeHtml(a.sentence.slice(0, 70)) + (a.sentence.length > 70 ? '…' : '') + '”</small>'));
      });
    }
  });
  /* tone checks */
  var tones = toneChecks(typeId, text);
  var tc = el('div', 'ecw-card', '<b>🎯 ' + TYPES[typeId].name + ' style check:</b>');
  tones.forEach(function (c) {
    tc.appendChild(el('div', 'ecw-tone', (c.ok ? '✅' : '⚠️') + ' ' + c.label));
  });
  res.appendChild(tc);
  /* rewritten suggestion */
  var fixed = analyzed.map(function (a) { return autoFix(a.sentence); }).join(' ');
  var sg = el('div', 'ecw-card', '<b>✨ Suggested version:</b>');
  var pre = el('div', 'ecw-suggest', '');
  pre.textContent = fixed;
  sg.appendChild(pre);
  var copy = el('button', 'ecw-btn sec sm', '📋 Copy');
  copy.addEventListener('click', function () { copyText(fixed); });
  sg.appendChild(copy);
  sg.appendChild(el('div', '', '<small style="color:#6b7280">Ye auto-fix hai — khud bhi ek baar padh lo! 👀</small>'));
  res.appendChild(sg);
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
}
function copyText(t) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(function () { toast('📋 Copied!'); }, function () { toast('Copy nahi hua — manually copy karo.'); });
      return;
    }
  } catch (e) {}
  toast('Copy not supported — manually copy karo.');
}

/* ---------------- Resume Bullet Rewriter ---------------- */
var VERB_MAP = [
  { k: ['team', 'together', 'group', 'members'], v: 'Collaborated' },
  { k: ['lead', 'led', 'head', 'managed'], v: 'Led' },
  { k: ['design', 'ui', 'screen'], v: 'Designed' },
  { k: ['fix', 'bug', 'solve', 'debug'], v: 'Resolved' },
  { k: ['test'], v: 'Tested' },
  { k: ['help', 'assist', 'support'], v: 'Assisted' },
  { k: ['write', 'wrote', 'blog', 'article'], v: 'Authored' },
  { k: ['teach', 'train', 'mentor'], v: 'Mentored' },
  { k: ['improve', 'better', 'fast'], v: 'Improved' },
  { k: ['make', 'made', 'build', 'built', 'create', 'develop'], v: 'Developed' },
  { k: ['present', 'presentation'], v: 'Presented' },
  { k: ['win', 'won', 'award', 'prize'], v: 'Won' }
];
function strongVerb(text) {
  var t = ' ' + text.toLowerCase() + ' ';
  for (var i = 0; i < VERB_MAP.length; i++) {
    for (var j = 0; j < VERB_MAP[i].k.length; j++) {
      if (t.indexOf(VERB_MAP[i].k[j]) !== -1) return VERB_MAP[i].v;
    }
  }
  return 'Delivered';
}
function cleanBullet(raw) {
  var s = String(raw || '').trim()
    .replace(/^[-•*]\s*/, '')
    .replace(/^(i|we)\s+(have\s+|had\s+|did\s+|was\s+|were\s+)?/i, '')
    .replace(/^(made|make|did|do|worked on)\s+/i, '');
  s = s.replace(/[.!]+$/, '');
  return s.charAt(0).toLowerCase() + s.slice(1);
}
function rewriteBullet(raw) {
  var core = cleanBullet(raw);
  var verb = strongVerb(raw);
  var hasNum = /\d/.test(raw);
  var numHint = hasNum ? '' : ' [add your number: e.g. 30%, 500 users, 2 weeks]';
  return [
    verb + ' ' + core + ', improving efficiency' + numHint + '.',
    verb + ' ' + core + ' using modern tools and best practices, delivering measurable results' + numHint + '.',
    'Drove ' + core + ' end-to-end, earning recognition for quality and on-time delivery' + numHint + '.'
  ];
}
function showRewriter(box) {
  box.innerHTML = '';
  box.appendChild(backBtn(box, function () { showMenu(box); }));
  box.appendChild(el('h2', '', '⚡ Resume Bullet Rewriter'));
  box.appendChild(el('p', 'ecw-sub', 'Rough line likho → 3 strong resume bullets pao! Formula: <b>Action verb + kya kiya + number</b>'));
  var card = el('div', 'ecw-card');
  card.appendChild(el('div', '', '<b>Apni rough bullet yahan likho:</b>'));
  var ta = el('textarea', 'ecw-ta');
  ta.rows = 3;
  ta.placeholder = 'e.g. i made a website for college fest with my team';
  card.appendChild(ta);
  box.appendChild(card);
  var go = el('button', 'ecw-btn', '✨ Rewrite it!');
  var res = el('div');
  go.addEventListener('click', function () {
    var raw = ta.value.trim();
    if (raw.split(/\s+/).filter(Boolean).length < 4) { toast('Thoda detail likho — kya banaya/kya kiya? 🙂'); return; }
    var versions = rewriteBullet(raw);
    res.innerHTML = '';
    res.appendChild(el('div', 'ecw-card', '💡 <b>Tip:</b> <span style="color:#b91c1c">[brackets]</span> me apne REAL numbers bharo — resume me numbers = power! 💪'));
    versions.forEach(function (v, i) {
      var d = el('div', 'ecw-ver', '<b>Version ' + (i + 1) + ':</b><br>• ' + escapeHtml(v));
      var cp = el('button', 'ecw-btn sec sm', '📋 Copy');
      cp.addEventListener('click', function () { copyText(v); });
      d.appendChild(el('br'));
      d.appendChild(cp);
      res.appendChild(d);
    });
    addXP(10, 'resume bullet rewrite');
    bumpSkill('vocabulary', 1);
    touchDay();
  });
  box.appendChild(go);
  box.appendChild(res);
}

EC.register('writing', { title: 'Writing', icon: '✍️', render: render });
})();
