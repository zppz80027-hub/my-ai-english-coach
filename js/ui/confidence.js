/* ============================================================
   My AI English Coach — UI TAB GROUP C
   Tab: Confidence Lab ('confidence') 💪
   - Technique cards (EC.data.techniques or fallback), each with a
     "Try it" mini-exercise
   - Rescue Phrases: phrase + Hinglish + "Practice in mini-conversation"
     (bot sets up a stuck moment, user must use a rescue phrase —
     keyword check)
   - 30-sec → longer conversation ladder (30s / 1m / 2m / 5m)
   Guards everything: works even if EC core pieces are missing.
   ============================================================ */
(function () {
'use strict';
if (typeof window === 'undefined') return;
var EC = window.EC;
if (!EC || typeof EC.register !== 'function') return;

var ui = EC.ui || {};
var speech = EC.speech || {};
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
  var t = el('div', 'ecc-toast', String(msg));
  document.body.appendChild(t);
  setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2400);
}
function addXP(n, why) { try { if (typeof EC.addXP === 'function') EC.addXP(n, why); } catch (e) {} }
function touchDay() { try { if (typeof EC.touchDay === 'function') EC.touchDay(); } catch (e) {} }
function bumpSkill(s, n) { try { if (typeof EC.bumpSkill === 'function') EC.bumpSkill(s, n); } catch (e) {} }
function award(id) { try { if (typeof EC.award === 'function') EC.award(id); } catch (e) {} }
function speak(text) { try { if (typeof speech.speak === 'function') { speech.speak(text); return; } } catch (e) {} }
function css() {
  if (document.getElementById('ecc-css')) return;
  var s = document.createElement('style');
  s.id = 'ecc-css';
  s.textContent =
    '.ecc-wrap{max-width:640px;margin:0 auto;padding:12px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1f2937;padding-bottom:40px}' +
    '.ecc-wrap h2{margin:6px 0 2px;font-size:22px}' +
    '.ecc-sub{color:#6b7280;font-size:14px;margin:0 0 12px}' +
    '.ecc-card{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:14px;margin:10px 0;box-shadow:0 1px 3px rgba(0,0,0,.06)}' +
    '.ecc-btn{display:block;width:100%;padding:14px 16px;margin:8px 0;border:none;border-radius:12px;background:#f59e0b;color:#fff;font-size:16px;font-weight:700;cursor:pointer}' +
    '.ecc-btn:active{transform:scale(.98)}' +
    '.ecc-btn.sec{background:#fef3c7;color:#92400e}' +
    '.ecc-btn.ghost{background:#f3f4f6;color:#374151}' +
    '.ecc-btn.sm{width:auto;display:inline-block;padding:8px 14px;font-size:14px;margin:4px 6px 4px 0}' +
    '.ecc-tech{background:linear-gradient(135deg,#fffbeb,#fef3c7);border:2px solid #fcd34d;border-radius:14px;padding:14px;margin:10px 0}' +
    '.ecc-phrase{background:#f0fdf4;border:2px solid #86efac;border-radius:14px;padding:12px;margin:8px 0}' +
    '.ecc-phrase .en{font-size:17px;font-weight:700;color:#166534}' +
    '.ecc-phrase .hi{font-size:14px;color:#4b5563}' +
    '.ecc-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:24px;background:#111827;color:#fff;padding:12px 20px;border-radius:24px;font-size:14px;z-index:10000;max-width:90%;text-align:center}' +
    '.ecc-timer{font-size:56px;font-weight:800;text-align:center;color:#f59e0b;margin:8px 0}' +
    '.ecc-talk{background:linear-gradient(135deg,#f59e0b,#f97316);color:#fff;border-radius:18px;padding:24px 16px;text-align:center;font-size:19px;font-weight:700;margin:12px 0;animation:eccPulse 2s infinite}' +
    '@keyframes eccPulse{0%{transform:scale(1)}50%{transform:scale(1.03)}100%{transform:scale(1)}}' +
    '.ecc-ladder{display:flex;gap:6px;margin:10px 0}' +
    '.ecc-rung{flex:1;text-align:center;padding:10px 4px;border-radius:10px;background:#f3f4f6;font-size:13px;font-weight:700;color:#9ca3af}' +
    '.ecc-rung.done{background:#d1fae5;color:#065f46}' +
    '.ecc-rung.now{background:#fef3c7;color:#92400e;box-shadow:0 0 0 3px #fcd34d}' +
    '.ecc-input{width:100%;border:2px solid #e5e7eb;border-radius:12px;padding:12px;font-size:16px;font-family:inherit;box-sizing:border-box}' +
    '.ecc-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:flex-end;justify-content:center}' +
    '.ecc-modal{background:#fff;width:100%;max-width:640px;border-radius:18px 18px 0 0;padding:18px;max-height:85vh;overflow:auto}' +
    '.ecc-ta{width:100%;border:2px solid #e5e7eb;border-radius:12px;padding:12px;font-size:16px;font-family:inherit;box-sizing:border-box}' +
    '.ecc-row{display:flex;gap:8px}.ecc-row .ecc-btn{flex:1}' +
    '.ecc-stars{font-size:34px;cursor:pointer;letter-spacing:4px;text-align:center;margin:8px 0}' +
    '.ecc-bot{background:#fff7ed;border:1px solid #fed7aa;border-radius:14px;padding:12px;margin:8px 0;font-size:15px}';
  document.head.appendChild(s);
}

/* ---------------- fallback data ---------------- */
var FALLBACK_TECHNIQUES = [
  { id: 'intro30', name: '30-Second Intro', icon: '🪞', hinglish: 'Apna intro 30 second me bolo — naam, kaam, ek hobby. Roz subah ek baar!',
    exercise: { kind: 'timer', secs: 30, task: 'Apna 30-second intro ZOR SE bolo! (Name, what you do, one hobby)' } },
  { id: 'mirror', name: 'Mirror Talk', icon: '🪞', hinglish: 'Sheeshe ke saamne khade hoke 1 minute bolo. Khud ko dekh ke bolna = confidence double!',
    exercise: { kind: 'timer', secs: 60, task: 'Sheeshe ke saamne (ya camera me dekh ke) 1 minute lagataar bolo — koi bhi topic!' } },
  { id: 'record', name: 'Record & Replay', icon: '🎙️', hinglish: 'Apni awaaz phone me record karo, phir suno. Pehle ajeeb lagega — normal hai!',
    exercise: { kind: 'talk', task: 'Neeche apna intro bolo/likho, phir 🔊 se suno. Apni awaaz se dosti karo!' } },
  { id: 'breath', name: 'Breathing Reset', icon: '🌬️', hinglish: 'Nervous ho? 4 sec saans andar, 4 sec roko, 4 sec bahar. 3 baar. Instant calm!',
    exercise: { kind: 'timer', secs: 36, task: 'Aankhein band karo. 4-4-4 breathing: 3 rounds. Slow… calm… 😌' } },
  { id: 'powerstart', name: 'Power Start', icon: '⚡', hinglish: 'Har jawab ki pehli line strong rakho: “That\'s a great question…” — shuruaat solid, confidence auto!',
    exercise: { kind: 'talk', task: '“Tell me about yourself” ka jawab “That\'s a great question…” se start karke bolo/likho!' } }
];
var FALLBACK_RESCUE = [
  { en: 'Let me think for a moment…', hi: 'Mujhe ek second sochne do…', keys: ['let me think', 'think for a moment', 'one moment', 'one second'] },
  { en: 'What I mean is…', hi: 'Mera matlab hai…', keys: ['what i mean', 'i mean'] },
  { en: 'In other words…', hi: 'Dusre shabdon me…', keys: ['in other words'] },
  { en: 'How do I say this…', hi: 'Ise kaise kahun…', keys: ['how do i say'] },
  { en: 'Sorry, I lost my train of thought. Let me start again.', hi: 'Sorry, main bhool gaya kya keh raha tha. Phir se shuru karta hun.', keys: ['lost my train', 'start again', 'let me start'] },
  { en: 'Could you please repeat that?', hi: 'Kya aap please dohra sakte hain?', keys: ['repeat', 'say that again', 'come again'] },
  { en: 'Give me a second…', hi: 'Ek second do…', keys: ['give me a second', 'one second'] }
];
var STUCK_MOMENTS = [
  'Interviewer: “So… tell me about… uh… your… hmm, what\'s the word… your biggest… achievement?” 😅 (Tum atak gaye! Rescue phrase use karo!)',
  'Friend: “Yesterday I went to… to… arre yaar, woh jagah… what do you call it… the big… building?” 😅 (Tumhe word nahi mil raha! Rescue phrase!)',
  'Teacher: “Explain… umm… photosynthesis… in… in your own… words?” 😅 (Dimag blank! Rescue phrase use karo!)',
  'HR: “Why should we… hmm… why do you… uh… want THIS job?” 😅 (Sawaal samajh aaya par shabd nahi mil rahe! Rescue phrase!)'
];
function getTechniques() {
  try { if (Array.isArray(data.techniques) && data.techniques.length) return data.techniques.map(normTech); } catch (e) {}
  return FALLBACK_TECHNIQUES;
}
function normTech(t) {
  t = t || {};
  return {
    id: t.id || 'tech',
    name: t.name || t.title || 'Technique',
    icon: t.icon || '💪',
    hinglish: t.hinglish || t.desc || t.description || '',
    exercise: t.exercise || { kind: 'talk', task: t.hinglish || 'Try it now — speak for 1 minute!' }
  };
}
function getRescue() {
  try { if (Array.isArray(data.rescuePhrases) && data.rescuePhrases.length) return data.rescuePhrases.map(normRescue); } catch (e) {}
  return FALLBACK_RESCUE;
}
function normRescue(r) {
  if (typeof r === 'string') return { en: r, hi: '', keys: [r.toLowerCase().split(' ').slice(0, 3).join(' ')] };
  r = r || {};
  return { en: r.en || r.phrase || '', hi: r.hi || r.hinglish || r.meaning || '', keys: r.keys || r.keywords || [(r.en || '').toLowerCase()] };
}

/* ---------------- ladder state ---------------- */
var LADDER = [
  { secs: 30, label: '30s', topic: 'Apna naam, kaam aur ek hobby batao.' },
  { secs: 60, label: '1m', topic: 'Apna aaj ka din describe karo — subah se ab tak.' },
  { secs: 120, label: '2m', topic: 'Tumhara favourite movie/show — story + kyun pasand hai.' },
  { secs: 300, label: '5m', topic: '“My dreams for the next 5 years” — full speech!' }
];
function ladderStep() {
  try {
    if (EC.store && EC.store.data && typeof EC.store.data.confLadder === 'number') return EC.store.data.confLadder;
  } catch (e) {}
  return ladderStep._mem || 0;
}
function setLadderStep(n) {
  ladderStep._mem = n;
  try {
    if (EC.store && EC.store.data) {
      EC.store.data.confLadder = n;
      if (typeof EC.store.save === 'function') EC.store.save();
    }
  } catch (e) {}
}

/* ---------------- mic-or-text ---------------- */
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
    } catch (e) {}
  }
  textModal(title, cb);
}
function textModal(title, cb) {
  var ov = el('div', 'ecc-overlay');
  var box = el('div', 'ecc-modal');
  box.appendChild(el('h3', '', String(title)));
  var ta = el('textarea', 'ecc-ta');
  ta.rows = 6;
  ta.placeholder = 'Type here…';
  box.appendChild(ta);
  var row = el('div', 'ecc-row');
  var ok = el('button', 'ecc-btn', '✅ Done');
  var cancel = el('button', 'ecc-btn ghost', 'Cancel');
  ok.addEventListener('click', function () { var v = ta.value.trim(); document.body.removeChild(ov); cb(v); });
  cancel.addEventListener('click', function () { document.body.removeChild(ov); cb(''); });
  row.appendChild(ok); row.appendChild(cancel);
  box.appendChild(row);
  ov.appendChild(box);
  document.body.appendChild(ov);
  setTimeout(function () { try { ta.focus(); } catch (e) {} }, 50);
}

/* ---------------- UI ---------------- */
function render(container) {
  css();
  container.innerHTML = '';
  var wrap = el('div', 'ecc-wrap');
  container.appendChild(wrap);
  showMenu(wrap);
}
function showMenu(box) {
  box.innerHTML = '';
  box.appendChild(el('h2', '', '💪 Confidence Lab'));
  box.appendChild(el('p', 'ecc-sub', 'Confidence padhne se nahi, KARNE se aata hai. Chhote exercises, bada confidence! 🔥'));
  var b1 = el('button', 'ecc-btn', '🧰 Confidence Techniques');
  b1.addEventListener('click', function () { showTechniques(box); });
  var b2 = el('button', 'ecc-btn sec', '🆘 Rescue Phrases');
  b2.addEventListener('click', function () { showRescue(box); });
  var b3 = el('button', 'ecc-btn sec', '🪜 Conversation Ladder (30s → 5m)');
  b3.addEventListener('click', function () { showLadder(box); });
  box.appendChild(b1); box.appendChild(b2); box.appendChild(b3);
  box.appendChild(el('div', 'ecc-card', '💡 <b>Yaad rakho:</b> Confident log perfect English nahi bolte — wo bas <b>rukte nahi</b>. Atko? Rescue phrase. Ghabrao? Breathing. Bas bolte raho! 🗣️'));
}
function backBtn(box, fn) {
  var b = el('button', 'ecc-btn ghost sm', '← Back');
  b.addEventListener('click', fn);
  return b;
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
}

/* ----- techniques ----- */
function showTechniques(box) {
  box.innerHTML = '';
  box.appendChild(backBtn(box, function () { showMenu(box); }));
  box.appendChild(el('h2', '', '🧰 Confidence Techniques'));
  getTechniques().forEach(function (t) {
    var d = el('div', 'ecc-tech');
    d.appendChild(el('div', '', '<b>' + t.icon + ' ' + escapeHtml(t.name) + '</b><br><span style="font-size:14px;color:#4b5563">' + escapeHtml(t.hinglish) + '</span>'));
    var b = el('button', 'ecc-btn sm', '▶️ Try it');
    b.addEventListener('click', function () { runExercise(box, t); });
    d.appendChild(b);
    box.appendChild(d);
  });
}
function runExercise(box, t) {
  var ex = t.exercise || { kind: 'talk', task: 'Speak for 1 minute!' };
  box.innerHTML = '';
  box.appendChild(backBtn(box, function () { showTechniques(box); }));
  box.appendChild(el('h2', '', t.icon + ' ' + escapeHtml(t.name)));
  box.appendChild(el('div', 'ecc-card', '<b>🎯 Task:</b> ' + escapeHtml(ex.task)));
  if (ex.kind === 'timer') {
    var secs = ex.secs || 60;
    var disp = el('div', 'ecc-timer', fmt(secs));
    box.appendChild(disp);
    var talk = el('div', 'ecc-talk', '🗣️ BOLTE RAHO…<br><small style="font-weight:400;font-size:15px">Rukna mana hai! Galti = OK ✅</small>');
    box.appendChild(talk);
    var start = el('button', 'ecc-btn', '▶️ Start');
    var doneBtn = el('button', 'ecc-btn ghost', '✅ Done');
    doneBtn.style.display = 'none';
    var left = secs, iv = null;
    start.addEventListener('click', function () {
      start.style.display = 'none'; doneBtn.style.display = 'block';
      iv = setInterval(function () {
        left--; disp.textContent = fmt(left);
        if (left <= 0) { clearInterval(iv); exerciseDone(box, t, 'timer'); }
      }, 1000);
    });
    doneBtn.addEventListener('click', function () { if (iv) clearInterval(iv); exerciseDone(box, t, 'timer'); });
    box.appendChild(start); box.appendChild(doneBtn);
  } else {
    var btn = el('button', 'ecc-btn', '🎙️ Do it (speak or type)');
    btn.addEventListener('click', function () {
      getAnswer(t.name, function (text) {
        if (!text || !text.trim()) { toast('Kuch toh karo! 🙂'); return; }
        speak(text);
        exerciseDone(box, t, 'talk');
      });
    });
    box.appendChild(btn);
  }
}
function fmt(s) {
  var m = Math.floor(s / 60), r = s % 60;
  return (m < 10 ? '0' + m : m) + ':' + (r < 10 ? '0' + r : r);
}
function exerciseDone(box, t, kind) {
  box.innerHTML = '';
  box.appendChild(el('h2', '', '🎉 Exercise complete!'));
  box.appendChild(el('div', 'ecc-card', 'Tumne <b>' + escapeHtml(t.name) + '</b> kiya! Har chhota step confidence badhata hai. 💪<br><br>Khud ko rate karo:'));
  var stars = el('div', 'ecc-stars', '★★★★★');
  var rating = 0;
  function paint(n) {
    rating = n;
    var s = '';
    for (var i = 1; i <= 5; i++) s += i <= n ? '⭐' : '☆';
    stars.textContent = s;
  }
  paint(0);
  for (var i = 1; i <= 5; i++) {
    (function (n) {
      var sp = el('span', '', '');
      sp.style.display = 'none';
      stars.appendChild(sp);
    })(i);
  }
  stars.addEventListener('click', function (e) {
    var x = e.clientX, rect = stars.getBoundingClientRect();
    var n = Math.max(1, Math.min(5, Math.ceil((x - rect.left) / rect.width * 5)));
    paint(n);
  });
  box.appendChild(stars);
  var done = el('button', 'ecc-btn', '✅ Done');
  done.addEventListener('click', function () {
    addXP(10 + rating * 2, 'confidence technique');
    bumpSkill('speaking', 1);
    touchDay();
    toast('+' + (10 + rating * 2) + ' XP! Confidence +1 💪');
    showTechniques(box);
  });
  box.appendChild(done);
}

/* ----- rescue phrases ----- */
function showRescue(box) {
  box.innerHTML = '';
  box.appendChild(backBtn(box, function () { showMenu(box); }));
  box.appendChild(el('h2', '', '🆘 Rescue Phrases'));
  box.appendChild(el('p', 'ecc-sub', 'Atak gaye? Ye magic lines bachayengi! Pehle yaad karo, phir practice me use karo.'));
  var phrases = getRescue();
  phrases.forEach(function (p) {
    var d = el('div', 'ecc-phrase');
    d.appendChild(el('div', 'en', '“' + escapeHtml(p.en) + '”'));
    if (p.hi) d.appendChild(el('div', 'hi', p.hi));
    var row = el('div', '');
    var hear = el('button', 'ecc-btn sec sm', '🔊 Hear');
    hear.addEventListener('click', function () { speak(p.en); });
    var prac = el('button', 'ecc-btn sm', '🎭 Practice');
    prac.addEventListener('click', function () { rescuePractice(box, p); });
    row.appendChild(hear); row.appendChild(prac);
    d.appendChild(row);
    box.appendChild(d);
  });
}
function rescuePractice(box, phrase) {
  box.innerHTML = '';
  box.appendChild(backBtn(box, function () { showRescue(box); }));
  box.appendChild(el('h2', '', '🎭 Rescue Practice'));
  var moment = STUCK_MOMENTS[Math.floor(Math.random() * STUCK_MOMENTS.length)];
  box.appendChild(el('div', 'ecc-bot', '<b>🎬 Scene:</b><br>' + moment));
  box.appendChild(el('div', 'ecc-card', '👆 Tum atak gaye ho! Neeche <b>rescue phrase use karke</b> jawab do.<br><small style="color:#6b7280">Hint: “' + escapeHtml(phrase.en) + '” jaisa kuch likho/bolo.</small>'));
  var inp = el('input', 'ecc-input');
  inp.placeholder = 'Type your rescue reply…';
  box.appendChild(inp);
  var check = el('button', 'ecc-btn', '🆘 Use rescue phrase');
  check.addEventListener('click', function () {
    var v = inp.value.trim().toLowerCase();
    if (v.length < 3) { toast('Pehle kuch likho! 🙂'); return; }
    var hit = phrase.keys.some(function (k) { return v.indexOf(String(k).toLowerCase()) !== -1; });
    var fb = el('div', 'ecc-card');
    if (hit) {
      fb.innerHTML = '🎉 <b>Perfect rescue!</b> Tumne “' + escapeHtml(phrase.en) + '” jaisa phrase use kiya. Real conversation me yehi tumhe bachayega! 🦸';
      addXP(12, 'rescue phrase practice');
      bumpSkill('fluency', 1);
      touchDay();
    } else {
      fb.innerHTML = '💡 <b>Almost!</b> Rescue phrase me ye words hote hain: <b>“' + escapeHtml(phrase.en) + '”</b><br>Ek baar phir try karo — phrase ko apne jawab me jodo!';
    }
    box.appendChild(fb);
    var again = el('button', 'ecc-btn sec', '🔁 New scene');
    again.addEventListener('click', function () { rescuePractice(box, phrase); });
    box.appendChild(again);
  });
  box.appendChild(check);
}

/* ----- conversation ladder ----- */
function showLadder(box) {
  box.innerHTML = '';
  box.appendChild(backBtn(box, function () { showMenu(box); }));
  box.appendChild(el('h2', '', '🪜 Conversation Ladder'));
  box.appendChild(el('p', 'ecc-sub', '30 second se 5 minute tak! Har rung complete karo, agla unlock hoga. 🏆'));
  var step = Math.min(ladderStep(), LADDER.length - 1);
  var lad = el('div', 'ecc-ladder');
  LADDER.forEach(function (r, i) {
    var cls = 'ecc-rung' + (i < ladderStep() ? ' done' : i === step ? ' now' : '');
    lad.appendChild(el('div', cls, (i < ladderStep() ? '✅ ' : '') + r.label));
  });
  box.appendChild(lad);
  if (ladderStep() >= LADDER.length) {
    box.appendChild(el('div', 'ecc-card', '🏆 <b>LADDER COMPLETE!</b> Tum 5 minute lagataar English bol sakte ho — ye bahut badi baat hai! 🎉🎉'));
    var reset = el('button', 'ecc-btn ghost', '🔁 Start ladder again');
    reset.addEventListener('click', function () { setLadderStep(0); showLadder(box); });
    box.appendChild(reset);
    return;
  }
  var r = LADDER[step];
  box.appendChild(el('div', 'ecc-card', '<b>🎯 Current rung: ' + r.label + '</b><br>Topic: <i>' + escapeHtml(r.topic) + '</i><br><small style="color:#6b7280">Timer chalega — bas bolte raho, rukna mana hai!</small>'));
  var start = el('button', 'ecc-btn', '▶️ Start ' + r.label + ' talk');
  start.addEventListener('click', function () { runLadderTimer(box, step); });
  box.appendChild(start);
}
function runLadderTimer(box, step) {
  var r = LADDER[step];
  var left = r.secs;
  box.innerHTML = '';
  box.appendChild(el('h2', '', '🪜 Rung: ' + r.label));
  box.appendChild(el('p', 'ecc-sub', 'Topic: <i>' + escapeHtml(r.topic) + '</i>'));
  var disp = el('div', 'ecc-timer', fmt(left));
  box.appendChild(disp);
  box.appendChild(el('div', 'ecc-talk', '🗣️ KEEP TALKING!<br><small style="font-weight:400;font-size:15px">Ruko mat… galti allowed ✅</small>'));
  var iv = setInterval(function () {
    left--; disp.textContent = fmt(left);
    if (left <= 0) { clearInterval(iv); ladderDone(box, step); }
  }, 1000);
  var stop = el('button', 'ecc-btn ghost', '⏹️ Give up (rung lock rahega)');
  stop.addEventListener('click', function () { clearInterval(iv); showLadder(box); });
  box.appendChild(stop);
}
function ladderDone(box, step) {
  var wasLast = step >= LADDER.length - 1;
  setLadderStep(step + 1);
  box.innerHTML = '';
  box.appendChild(el('h2', '', '🎉 Rung complete!'));
  box.appendChild(el('div', 'ecc-card', 'Tumne <b>' + LADDER[step].label + '</b> lagataar English boli! ' + (wasLast ? '🏆 <b>POORI LADDER COMPLETE!</b> 5-minute speaker ban gaye!' : 'Agla rung unlock ho gaya: <b>' + LADDER[step + 1].label + '</b> 💪')));
  var next = el('button', 'ecc-btn', wasLast ? '🏆 See my trophy' : '➡️ Next rung');
  next.addEventListener('click', function () { showLadder(box); });
  box.appendChild(next);
  var xp = 15 + step * 10;
  addXP(xp, 'conversation ladder');
  bumpSkill('fluency', 2);
  bumpSkill('speaking', 1);
  if (wasLast) award('ladder-champion');
  touchDay();
  toast('+' + xp + ' XP! 🪜');
}

EC.register('confidence', { title: 'Confidence Lab', icon: '💪', render: render });
})();
