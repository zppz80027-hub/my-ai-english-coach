/* ============================================================
   My AI English Coach — UI TAB GROUP C
   Tab: Think in English ('think') 🧠
   - Situational prompt cards → speak/type response → light,
     encouraging feedback (ONE tip, no heavy correction)
   - Internal Monologue Timer: 1/3/5 min, ZERO correction during,
     fluency feedback after (filler-word based)
   Guards everything: works even if EC core pieces are missing.
   ============================================================ */
(function () {
'use strict';
if (typeof window === 'undefined') return;
var EC = window.EC;
if (!EC || typeof EC.register !== 'function') return;

var ui = EC.ui || {};
var speech = EC.speech || {};

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
  var t = el('div', 'ecth-toast', String(msg));
  document.body.appendChild(t);
  setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2400);
}
function addXP(n, why) { try { if (typeof EC.addXP === 'function') EC.addXP(n, why); } catch (e) {} }
function touchDay() { try { if (typeof EC.touchDay === 'function') EC.touchDay(); } catch (e) {} }
function bumpSkill(s, n) { try { if (typeof EC.bumpSkill === 'function') EC.bumpSkill(s, n); } catch (e) {} }
function css() {
  if (document.getElementById('ecth-css')) return;
  var s = document.createElement('style');
  s.id = 'ecth-css';
  s.textContent =
    '.ecth-wrap{max-width:640px;margin:0 auto;padding:12px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1f2937;padding-bottom:40px}' +
    '.ecth-wrap h2{margin:6px 0 2px;font-size:22px}' +
    '.ecth-sub{color:#6b7280;font-size:14px;margin:0 0 12px}' +
    '.ecth-card{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:14px;margin:10px 0;box-shadow:0 1px 3px rgba(0,0,0,.06)}' +
    '.ecth-btn{display:block;width:100%;padding:14px 16px;margin:8px 0;border:none;border-radius:12px;background:#7c3aed;color:#fff;font-size:16px;font-weight:700;cursor:pointer}' +
    '.ecth-btn:active{transform:scale(.98)}' +
    '.ecth-btn.sec{background:#ede9fe;color:#5b21b6}' +
    '.ecth-btn.ghost{background:#f3f4f6;color:#374151}' +
    '.ecth-btn.sm{width:auto;display:inline-block;padding:8px 14px;font-size:14px;margin:4px 6px 4px 0}' +
    '.ecth-prompt{background:linear-gradient(135deg,#ede9fe,#fdf4ff);border:2px solid #c4b5fd;border-radius:14px;padding:16px;margin:10px 0;font-size:17px;font-weight:600}' +
    '.ecth-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:24px;background:#111827;color:#fff;padding:12px 20px;border-radius:24px;font-size:14px;z-index:10000;max-width:90%;text-align:center}' +
    '.ecth-fb{background:#f0fdf4;border-left:4px solid #22c55e;padding:10px 12px;border-radius:8px;margin:8px 0;font-size:14px}' +
    '.ecth-fb.tip{background:#eff6ff;border-left-color:#3b82f6}' +
    '.ecth-timer{font-size:64px;font-weight:800;text-align:center;color:#7c3aed;margin:10px 0}' +
    '.ecth-talk{background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;border-radius:18px;padding:28px 18px;text-align:center;font-size:20px;font-weight:700;margin:12px 0;animation:ecthPulse 2s infinite}' +
    '@keyframes ecthPulse{0%{transform:scale(1);box-shadow:0 0 0 0 rgba(124,58,237,.4)}50%{transform:scale(1.03);box-shadow:0 0 0 18px rgba(124,58,237,0)}100%{transform:scale(1);box-shadow:0 0 0 0 rgba(124,58,237,0)}}' +
    '.ecth-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:flex-end;justify-content:center}' +
    '.ecth-modal{background:#fff;width:100%;max-width:640px;border-radius:18px 18px 0 0;padding:18px;max-height:85vh;overflow:auto}' +
    '.ecth-ta{width:100%;border:2px solid #e5e7eb;border-radius:12px;padding:12px;font-size:16px;font-family:inherit;box-sizing:border-box}' +
    '.ecth-row{display:flex;gap:8px}.ecth-row .ecth-btn{flex:1}';
  document.head.appendChild(s);
}

/* ---------------- data ---------------- */
var PROMPTS = [
  { t: 'You just woke up — describe what you are doing.', h: '“I just woke up. I am brushing my teeth…” (abhi kya kar rahe ho, bolo)' },
  { t: 'Look around you. Describe 5 things you can see.', h: 'Apne aas-paas dekho — 5 cheezein describe karo.' },
  { t: 'What did you eat today? Describe it in detail.', h: 'Aaj kya khaya? Taste, colour, sab batao!' },
  { t: 'Talk about your best friend for one minute.', h: 'Best friend kaisa hai? Kya pasand hai use?' },
  { t: 'Describe your journey to college / work today.', h: 'Aaj college/kaam tak ka safar — kya dekha?' },
  { t: 'What will you do this weekend? Make a plan.', h: 'Weekend plans banao — future tense practice!' },
  { t: 'Talk about a movie or show you liked recently.', h: 'Koi movie/series — story kya thi? Kyun pasand aayi?' },
  { t: 'Describe your room in detail.', h: 'Tumhara room kaisa dikhta hai?' },
  { t: 'What is one skill you want to learn? Why?', h: 'Koi skill seekhni hai? Kyun?' },
  { t: 'Describe your morning routine step by step.', h: 'Subah uthne se lekar ghar se nikalne tak.' }
];
var FILLERS = ['um', 'uh', 'hmm', 'er', 'like', 'you know', 'basically', 'actually'];

/* ---------------- answer input (mic or modal) ---------------- */
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
  var ov = el('div', 'ecth-overlay');
  var box = el('div', 'ecth-modal');
  box.appendChild(el('h3', '', String(title)));
  var ta = el('textarea', 'ecth-ta');
  ta.placeholder = 'Type what you said / want to say…';
  ta.rows = 6;
  box.appendChild(ta);
  var row = el('div', 'ecth-row');
  var ok = el('button', 'ecth-btn', '✅ Done');
  var cancel = el('button', 'ecth-btn ghost', 'Cancel');
  ok.addEventListener('click', function () { var v = ta.value.trim(); document.body.removeChild(ov); cb(v); });
  cancel.addEventListener('click', function () { document.body.removeChild(ov); cb(''); });
  row.appendChild(ok); row.appendChild(cancel);
  box.appendChild(row);
  ov.appendChild(box);
  document.body.appendChild(ov);
  setTimeout(function () { try { ta.focus(); } catch (e) {} }, 50);
}

/* ---------------- light feedback (encouragement + ONE tip) ---------------- */
function lightFeedback(text) {
  var words = String(text || '').trim().split(/\s+/).filter(Boolean);
  var wc = words.length;
  var t = ' ' + String(text || '').toLowerCase() + ' ';
  var fillers = 0;
  FILLERS.forEach(function (f) {
    var m = t.match(new RegExp('\\b' + f.replace(/ /g, '\\s') + '\\b', 'g'));
    if (m) fillers += m.length;
  });
  var out = [];
  if (wc >= 30) out.push({ kind: 'good', text: '🔥 ' + wc + ' words! Tum soch-samajh ke English me bol rahe ho — yehi fluency hai!' });
  else if (wc >= 12) out.push({ kind: 'good', text: '👏 ' + wc + ' words — acchi shuruaat! Roz thoda-thoda badhega.' });
  else out.push({ kind: 'good', text: '👏 Shuruaat kar di — yehi sabse mushkil step tha! Agli baar 1-2 line aur jodne ki koshish karo.' });

  var tip;
  if (fillers >= 3) tip = '💡 One tip: “um/uh” ki jagah 1 second chup raho — pause confident lagta hai, filler nahi!';
  else if (t.indexOf('because') === -1 && wc >= 12) tip = '💡 One tip: “because” jodo — reason dena English ko natural banata hai. (“…because I like it.”)';
  else if (wc < 20) tip = '💡 One tip: ek “and then…” jod ke story aage badhao. Lambi story = lambi practice!';
  else tip = '💡 One tip: kal isi prompt ko dobara try karo — dekho kitna aasaan lagega. Repetition = magic! ✨';
  out.push({ kind: 'tip', text: tip });
  return { out: out, wc: wc, fillers: fillers };
}

/* ---------------- UI ---------------- */
function render(container) {
  css();
  container.innerHTML = '';
  var wrap = el('div', 'ecth-wrap');
  container.appendChild(wrap);
  showMenu(wrap);
}
function showMenu(box) {
  box.innerHTML = '';
  box.appendChild(el('h2', '', '🧠 Think in English'));
  box.appendChild(el('p', 'ecth-sub', 'Hindi me sochna band, English me bolna shuru! No pressure — yahan galti allowed hai. 😊'));
  var b1 = el('button', 'ecth-btn', '💭 Situational Prompts');
  b1.addEventListener('click', function () { showPrompts(box); });
  var b2 = el('button', 'ecth-btn sec', '⏱️ Internal Monologue Timer');
  b2.addEventListener('click', function () { showTimerMenu(box); });
  box.appendChild(b1); box.appendChild(b2);
  box.appendChild(el('div', 'ecth-card', '💡 <b>Rule:</b> Pehle Hindi me mat socho. Seedha English me bolo — tooti-footi chalegi! Brain ko aadat padegi. 🧠✨'));
}
function backBtn(box, fn) {
  var b = el('button', 'ecth-btn ghost sm', '← Back');
  b.addEventListener('click', fn);
  return b;
}

/* ----- situational prompts ----- */
function showPrompts(box) {
  box.innerHTML = '';
  box.appendChild(backBtn(box, function () { showMenu(box); }));
  box.appendChild(el('h2', '', '💭 Situational Prompts'));
  box.appendChild(el('p', 'ecth-sub', 'Ek card chuno, phir seedha English me bolo/likho. Sirf encouragement + 1 tip milega!'));
  PROMPTS.forEach(function (p) {
    var c = el('div', 'ecth-prompt', '💬 ' + p.t + '<br><small style="font-weight:400;color:#6b7280">' + p.h + '</small>');
    c.style.cursor = 'pointer';
    c.addEventListener('click', function () { answerPrompt(box, p); });
    box.appendChild(c);
  });
}
function answerPrompt(box, p) {
  box.innerHTML = '';
  box.appendChild(backBtn(box, function () { showPrompts(box); }));
  box.appendChild(el('div', 'ecth-prompt', '💬 ' + p.t));
  var btn = el('button', 'ecth-btn', '🎙️ Respond (speak or type)');
  btn.addEventListener('click', function () {
    getAnswer('Respond in English — ' + p.t, function (text) {
      if (!text || !text.trim()) { toast('Kuch toh bolo! 🙂'); return; }
      var fb = lightFeedback(text);
      box.innerHTML = '';
      box.appendChild(backBtn(box, function () { showPrompts(box); }));
      box.appendChild(el('h2', '', '🌟 Well done!'));
      var card = el('div', 'ecth-card', '<b>Tumne bola:</b> <i>“' + escapeHtml(String(text).slice(0, 280)) + (text.length > 280 ? '…' : '') + '”</i>');
      fb.out.forEach(function (f) { card.appendChild(el('div', f.kind === 'good' ? 'ecth-fb' : 'ecth-fb tip', f.text)); });
      box.appendChild(card);
      var next = el('button', 'ecth-btn', '➡️ Next prompt');
      next.addEventListener('click', function () {
        var i = Math.floor(Math.random() * PROMPTS.length);
        answerPrompt(box, PROMPTS[i]);
      });
      box.appendChild(next);
      addXP(8, 'think prompt');
      bumpSkill('fluency', 1);
      bumpSkill('speaking', 1);
      touchDay();
    });
  });
  box.appendChild(btn);
  box.appendChild(el('div', 'ecth-card', '🎯 <b>Challenge:</b> bina ruke 30 second bolo. Galti ho? Koi baat nahi — keep going!'));
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
}

/* ----- internal monologue timer ----- */
function showTimerMenu(box) {
  box.innerHTML = '';
  box.appendChild(backBtn(box, function () { showMenu(box); }));
  box.appendChild(el('h2', '', '⏱️ Internal Monologue Timer'));
  box.appendChild(el('p', 'ecth-sub', 'Timer chalega — tumhe bas <b>lagataar English me bolna</b> hai. Jo dikhe, jo karo, sab describe karo!'));
  box.appendChild(el('div', 'ecth-card', '📜 <b>Rules:</b><br>1️⃣ Timer ke dauraan <b>ZERO correction</b> — galti allowed!<br>2️⃣ Ruko mat — “just keep talking” 🗣️<br>3️⃣ Hum sun nahi rahe, par tumhara muh practice kar raha hai — yehi kaafi hai! 😄'));
  [1, 3, 5].forEach(function (m) {
    var b = el('button', 'ecth-btn' + (m === 1 ? '' : ' sec'), '▶️ ' + m + ' minute' + (m > 1 ? 's' : ''));
    b.addEventListener('click', function () { runTimer(box, m); });
    box.appendChild(b);
  });
}
function runTimer(box, minutes) {
  var total = minutes * 60, left = total;
  box.innerHTML = '';
  box.appendChild(el('h2', '', '🗣️ Keep talking!'));
  var disp = el('div', 'ecth-timer', fmt(left));
  box.appendChild(disp);
  var talk = el('div', 'ecth-talk', '🗣️ JUST KEEP TALKING…<br><small style="font-weight:400;font-size:15px">Jo kar rahe ho, describe karo. Ruko mat! Galti = OK ✅</small>');
  box.appendChild(talk);
  var stop = el('button', 'ecth-btn ghost', '⏹️ Stop early');
  box.appendChild(stop);
  var iv = setInterval(function () {
    left--;
    disp.textContent = fmt(left);
    if (left <= 0) { clearInterval(iv); timerDone(box, minutes); }
  }, 1000);
  stop.addEventListener('click', function () { clearInterval(iv); timerDone(box, minutes); });
}
function fmt(s) {
  var m = Math.floor(s / 60), r = s % 60;
  return (m < 10 ? '0' + m : m) + ':' + (r < 10 ? '0' + r : r);
}
function timerDone(box, minutes) {
  box.innerHTML = '';
  box.appendChild(el('h2', '', '🎉 Time up!'));
  box.appendChild(el('p', 'ecth-sub', minutes + ' minute lagataar English — ye badi achievement hai! Ab quick check:'));
  box.appendChild(el('div', 'ecth-card', '✍️ <b>Ab likho/bolo:</b> tumne abhi kya-kya describe kiya? 4-5 lines me summary do — isse fluency score banega.'));
  var btn = el('button', 'ecth-btn', '📝 Give summary (speak or type)');
  btn.addEventListener('click', function () {
    getAnswer('What did you talk about?', function (text) {
      if (!text || !text.trim()) { timerReport(box, minutes, '', 0); return; }
      var fb = lightFeedback(text);
      timerReport(box, minutes, text, fb);
    });
  });
  box.appendChild(btn);
  var skip = el('button', 'ecth-btn ghost', 'Skip summary');
  skip.addEventListener('click', function () { timerReport(box, minutes, '', 0); });
  box.appendChild(skip);
}
function timerReport(box, minutes, text, fb) {
  box.innerHTML = '';
  box.appendChild(el('h2', '', '📊 Monologue report'));
  var card = el('div', 'ecth-card');
  var score, msg;
  if (fb && fb.wc > 0) {
    var density = fb.fillers / Math.max(1, fb.wc);
    score = Math.max(2, Math.min(10, Math.round(8 - density * 40 + Math.min(2, fb.wc / 40))));
    msg = '🗣️ Fluency score: <b>' + score + '/10</b><br><small style="color:#6b7280">Based on filler words (um/uh/like) — kam filler = zyada fluent!</small>';
    card.innerHTML = msg;
    card.appendChild(el('div', 'ecth-fb tip', '💡 ' + fb.wc + ' words, ' + fb.fillers + ' fillers. ' + (fb.fillers <= 1 ? 'Almost no fillers — excellent flow! 🌊' : 'Tip: filler ki jagah chhota pause lo — dheere bolo, confident lago.')));
  } else {
    score = 6;
    card.innerHTML = '💪 Tumne ' + minutes + ' minute bola — practice complete! Summary skip kiya, koi baat nahi.';
  }
  card.appendChild(el('div', 'ecth-fb', '🎯 Next level: ' + (minutes >= 5 ? '5 min master! Ab difficult topics try karo.' : 'Agli baar ' + (minutes === 1 ? '3' : '5') + ' minute try karo!')));
  box.appendChild(card);
  var again = el('button', 'ecth-btn', '🔁 Again');
  again.addEventListener('click', function () { showTimerMenu(box); });
  box.appendChild(again);
  box.appendChild(backBtn(box, function () { showMenu(box); }));
  addXP(10 + minutes * 5, 'monologue timer');
  bumpSkill('fluency', 2);
  touchDay();
  toast('+' + (10 + minutes * 5) + ' XP! Keep talking 🗣️');
}

EC.register('think', { title: 'Think in English', icon: '🧠', render: render });
})();
