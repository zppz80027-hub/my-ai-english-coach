/* ============================================================
   My AI English Coach — UI TAB GROUP C
   Tab: Listening ('listening') 🎧
   - Passage picker by level (EC.data.passages or fallback)
   - ▶ Play via EC.speech.speak with rate control (0.8 / 1 / 1.2)
   - Honest accent label: "device voice — accent varies by phone"
   - 3 comprehension MCQs per passage → score + XP
   - Accent-variety: same passage at different rate/pitch,
     clearly labeled as simulation
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
  var t = el('div', 'ecls-toast', String(msg));
  document.body.appendChild(t);
  setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2400);
}
function addXP(n, why) { try { if (typeof EC.addXP === 'function') EC.addXP(n, why); } catch (e) {} }
function touchDay() { try { if (typeof EC.touchDay === 'function') EC.touchDay(); } catch (e) {} }
function bumpSkill(s, n) { try { if (typeof EC.bumpSkill === 'function') EC.bumpSkill(s, n); } catch (e) {} }
function speak(text, opts) {
  if (typeof speech.speak !== 'function') return false;
  try { speech.speak(text, opts || {}); return true; } catch (e) { return false; }
}
function stopSpeak() { try { if (typeof speech.stop === 'function') speech.stop(); } catch (e) {} }
function css() {
  if (document.getElementById('ecls-css')) return;
  var s = document.createElement('style');
  s.id = 'ecls-css';
  s.textContent =
    '.ecls-wrap{max-width:640px;margin:0 auto;padding:12px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1f2937;padding-bottom:40px}' +
    '.ecls-wrap h2{margin:6px 0 2px;font-size:22px}' +
    '.ecls-sub{color:#6b7280;font-size:14px;margin:0 0 12px}' +
    '.ecls-card{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:14px;margin:10px 0;box-shadow:0 1px 3px rgba(0,0,0,.06)}' +
    '.ecls-btn{display:block;width:100%;padding:14px 16px;margin:8px 0;border:none;border-radius:12px;background:#0891b2;color:#fff;font-size:16px;font-weight:700;cursor:pointer}' +
    '.ecls-btn:active{transform:scale(.98)}' +
    '.ecls-btn.sec{background:#cffafe;color:#0e7490}' +
    '.ecls-btn.ghost{background:#f3f4f6;color:#374151}' +
    '.ecls-btn.sm{width:auto;display:inline-block;padding:8px 14px;font-size:14px;margin:4px 6px 4px 0}' +
    '.ecls-btn.on{background:#0e7490;box-shadow:0 0 0 3px #a5f3fc}' +
    '.ecls-lvl{display:inline-block;padding:10px 18px;margin:4px;border-radius:24px;border:2px solid #e5e7eb;background:#fff;font-weight:700;cursor:pointer;font-size:15px;color:#1f2937}' +
    '.ecls-lvl.on{border-color:#0891b2;background:#ecfeff}' +
    '.ecls-pass{display:block;width:100%;text-align:left;background:#fff;border:2px solid #e5e7eb;border-radius:14px;padding:12px;margin:8px 0;cursor:pointer;font-size:15px;color:#1f2937}' +
    '.ecls-pass:active{border-color:#0891b2}' +
    '.ecls-passage{background:#f8fafc;border-radius:12px;padding:14px;font-size:16px;line-height:1.7;margin:10px 0}' +
    '.ecls-opt{display:block;width:100%;text-align:left;background:#fff;border:2px solid #e5e7eb;border-radius:12px;padding:12px;margin:6px 0;font-size:15px;cursor:pointer;color:#1f2937}' +
    '.ecls-opt.sel{border-color:#0891b2;background:#ecfeff}' +
    '.ecls-opt.right{border-color:#22c55e;background:#f0fdf4}' +
    '.ecls-opt.wrong{border-color:#ef4444;background:#fef2f2}' +
    '.ecls-opt:disabled{cursor:default}' +
    '.ecls-note{background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:10px 12px;font-size:13px;margin:8px 0;color:#92400e}' +
    '.ecls-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:24px;background:#111827;color:#fff;padding:12px 20px;border-radius:24px;font-size:14px;z-index:10000;max-width:90%;text-align:center}' +
    '.ecls-big{font-size:44px;font-weight:800;color:#0891b2;text-align:center}';
  document.head.appendChild(s);
}

/* ---------------- fallback passages ---------------- */
function Q(q, options, answer) { return { q: q, options: options, answer: answer }; }
var FALLBACK_PASSAGES = [
  { id: 'b1', level: 'beginner', title: '☀️ My Morning Routine',
    text: 'I wake up at six o\'clock every morning. First, I brush my teeth and wash my face. Then I drink a big glass of warm water. After that, I go for a short walk in the park near my house. I come back home at seven and eat breakfast with my family. We usually eat parathas and drink milk. Then I get ready and go to college by bus.',
    questions: [
      Q('What time does he wake up?', ['5 o\'clock', '6 o\'clock', '7 o\'clock', '8 o\'clock'], 1),
      Q('What does he drink in the morning?', ['Cold water', 'Tea', 'Warm water', 'Juice'], 2),
      Q('How does he go to college?', ['By car', 'By bus', 'By cycle', 'On foot'], 1)
    ] },
  { id: 'b2', level: 'beginner', title: '🛒 A Visit to the Market',
    text: 'Yesterday, I went to the market with my mother. We wanted to buy vegetables and fruits. The market was very crowded because it was Sunday. We bought tomatoes, potatoes, onions, apples and bananas. My mother bargained with the shopkeeper and got a good price. We came home happy with two big bags.',
    questions: [
      Q('Who went to the market?', ['Father and son', 'Mother and child', 'Two friends', 'Brother and sister'], 1),
      Q('Why was the market crowded?', ['It was Sunday', 'There was a sale', 'It was raining', 'A festival'], 0),
      Q('What did the mother do with the shopkeeper?', ['Fought', 'Bargained', 'Ran away', 'Sang a song'], 1)
    ] },
  { id: 'i1', level: 'intermediate', title: '📚 Learning English the Smart Way',
    text: 'Many students study English grammar for years but still feel nervous while speaking. The reason is simple: speaking is a skill, and skills grow only with practice, not with reading. Experts suggest thinking in English during small daily tasks — describing what you see, narrating your actions, or talking to yourself in the mirror. Just fifteen minutes of loud practice every day can change your fluency in three months. Mistakes are not failures; they are proof that you are trying.',
    questions: [
      Q('Why do students feel nervous while speaking?', ['They don\'t know grammar', 'They only read, but don\'t practise speaking', 'English is too difficult', 'Teachers are strict'], 1),
      Q('What do experts suggest?', ['Think in English during daily tasks', 'Buy expensive books', 'Watch movies only', 'Stop making mistakes'], 0),
      Q('How much daily practice is suggested?', ['One hour', 'Fifteen minutes', 'Five minutes', 'Three hours'], 1)
    ] },
  { id: 'i2', level: 'intermediate', title: '🎉 My Favourite Festival: Diwali',
    text: 'Diwali is my favourite festival of the year. It is called the festival of lights. People clean their houses, wear new clothes and decorate everything with diyas and colourful lights. In the evening, families pray together and share sweets with neighbours. Children enjoy bursting crackers, though many people now prefer a green, eco-friendly Diwali. For me, Diwali means family time, delicious food and new beginnings.',
    questions: [
      Q('Diwali is also called…', ['Festival of colours', 'Festival of lights', 'Festival of music', 'Festival of food'], 1),
      Q('What do people do in the evening?', ['Sleep early', 'Pray together and share sweets', 'Go to office', 'Watch TV alone'], 1),
      Q('What kind of Diwali do many people prefer now?', ['Loud Diwali', 'Eco-friendly Diwali', 'No Diwali', 'Diwali abroad'], 1)
    ] },
  { id: 'a1', level: 'advanced', title: '🤖 The Future of Artificial Intelligence',
    text: 'Artificial intelligence is no longer science fiction; it writes emails, drives cars and even helps doctors find diseases early. However, experts warn that AI also brings serious challenges. Jobs that involve repetitive tasks may disappear, and false information can spread faster than ever. The solution is not to fear AI but to learn to work with it. People who understand AI tools will have a clear advantage in the coming decade. In short, AI will not replace humans — but humans who use AI may replace those who don\'t.',
    questions: [
      Q('According to the passage, what is the solution?', ['Ban AI completely', 'Learn to work with AI', 'Stop using the internet', 'Fear AI'], 1),
      Q('Which jobs are at risk?', ['Creative jobs', 'Jobs with repetitive tasks', 'Teaching jobs', 'Farming jobs'], 1),
      Q('What is the main message of the last line?', ['AI will replace everyone', 'Humans using AI will have an advantage', 'AI is useless', 'Nobody needs AI'], 1)
    ] },
  { id: 'a2', level: 'advanced', title: '😴 Why Sleep Matters More Than You Think',
    text: 'Most students proudly say they study late at night, but scientists say this habit quietly damages learning. During deep sleep, the brain organises the day\'s information and moves it into long-term memory. Without enough sleep, concentration drops, mood worsens and even simple problems feel difficult. Research shows that sleeping seven to eight hours improves both memory and creativity. So the smartest study technique might not be another energy drink — it might be going to bed on time.',
    questions: [
      Q('What does the brain do during deep sleep?', ['Dreams only', 'Organises information into long-term memory', 'Stops working', 'Forgets everything'], 1),
      Q('What happens without enough sleep?', ['Memory improves', 'Concentration drops and mood worsens', 'Nothing happens', 'You become smarter'], 1),
      Q('How much sleep is recommended?', ['4–5 hours', '7–8 hours', '10–12 hours', '2–3 hours'], 1)
    ] }
];
function getPassages() {
  try {
    if (Array.isArray(data.passages) && data.passages.length) {
      return data.passages.map(function (p) {
        return {
          id: p.id || Math.random().toString(36).slice(2),
          level: (p.level || 'beginner').toLowerCase(),
          title: p.title || 'Passage',
          text: p.text || p.passage || '',
          questions: (p.questions || p.mcqs || []).slice(0, 3).map(function (q) {
            return { q: q.q || q.question || '', options: q.options || q.choices || [], answer: (typeof q.answer === 'number' ? q.answer : 0) };
          })
        };
      }).filter(function (p) { return p.text && p.questions.length; });
    }
  } catch (e) {}
  return FALLBACK_PASSAGES;
}
var LEVELS = [
  { id: 'beginner', name: '🌱 Beginner', desc: 'Slow, simple words' },
  { id: 'intermediate', name: '🌿 Intermediate', desc: 'Natural speed, richer vocab' },
  { id: 'advanced', name: '🌳 Advanced', desc: 'Fast, complex ideas' }
];

/* ---------------- UI ---------------- */
function render(container) {
  css();
  container.innerHTML = '';
  var wrap = el('div', 'ecls-wrap');
  container.appendChild(wrap);
  showLevels(wrap);
}
function backBtn(box, fn, label) {
  var b = el('button', 'ecls-btn ghost sm', '← ' + (label || 'Back'));
  b.addEventListener('click', function () { stopSpeak(); fn(); });
  return b;
}
function showLevels(box) {
  box.innerHTML = '';
  box.appendChild(el('h2', '', '🎧 Listening Practice'));
  box.appendChild(el('p', 'ecls-sub', 'Suno, samjho, jawab do! Pehle passage suno, phir 3 questions.'));
  LEVELS.forEach(function (l) {
    var count = getPassages().filter(function (p) { return p.level === l.id; }).length;
    var b = el('button', 'ecls-lvl', l.name);
    b.title = l.desc;
    b.addEventListener('click', function () { showPassages(box, l.id); });
    box.appendChild(b);
  });
  box.appendChild(el('div', 'ecls-card', '<b>Kaise karein:</b><br>1️⃣ Level chuno → passage chuno<br>2️⃣ ▶ Play dabao, dhyaan se suno (2 baar sun sakte ho!)<br>3️⃣ Text mat dekho pehle — sirf suno! 👂<br>4️⃣ Phir 3 questions ke jawab do'));
}
function showPassages(box, levelId) {
  box.innerHTML = '';
  box.appendChild(backBtn(box, function () { showLevels(box); }));
  var lname = levelId.charAt(0).toUpperCase() + levelId.slice(1);
  box.appendChild(el('h2', '', lname + ' passages'));
  var list = getPassages().filter(function (p) { return p.level === levelId; });
  if (!list.length) { box.appendChild(el('div', 'ecls-card', 'Is level ke liye passages nahi mile.')); return; }
  list.forEach(function (p) {
    var b = el('button', 'ecls-pass', '<b>' + escapeHtml(p.title) + '</b><br><small style="color:#6b7280">' + p.questions.length + ' questions • ~1 min audio</small>');
    b.addEventListener('click', function () { showPlayer(box, p, levelId); });
    box.appendChild(b);
  });
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
}

var currentRate = 1;
function showPlayer(box, passage, levelId) {
  box.innerHTML = '';
  box.appendChild(backBtn(box, function () { showPassages(box, levelId); }));
  box.appendChild(el('h2', '', escapeHtml(passage.title)));
  box.appendChild(el('p', 'ecls-sub', 'Level: <b>' + passage.level + '</b>'));

  var note = el('div', 'ecls-note', '🔊 <b>Honest note:</b> Ye tumhare <b>phone ki awaaz</b> hai (device voice) — accent phone-to-phone alag hota hai. Real native speaker jaisa nahi, par listening practice ke liye perfect! (Accent simulation neeche 👇)');
  box.appendChild(note);

  var playCard = el('div', 'ecls-card');
  playCard.appendChild(el('div', '', '<b>🎙️ Listen to the passage</b>'));
  var rateRow = el('div', '');
  rateRow.appendChild(el('span', '', '<small style="color:#6b7280">Speed: </small>'));
  [0.8, 1, 1.2].forEach(function (r) {
    var rb = el('button', 'ecls-btn sm' + (r === currentRate ? ' on' : ''), r + '×');
    rb.addEventListener('click', function () {
      currentRate = r;
      var btns = rateRow.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) btns[i].classList.remove('on');
      rb.classList.add('on');
    });
    rateRow.appendChild(rb);
  });
  playCard.appendChild(rateRow);
  var play = el('button', 'ecls-btn', '▶️ Play passage');
  play.addEventListener('click', function () {
    if (!speak(passage.text, { rate: currentRate })) toast('Voice not available — neeche text padh ke practice karo. 📖');
    else toast('🔊 Suno dhyaan se… (' + currentRate + '× speed)');
  });
  var stop = el('button', 'ecls-btn ghost', '⏹️ Stop');
  stop.addEventListener('click', stopSpeak);
  playCard.appendChild(play);
  playCard.appendChild(stop);

  var showText = el('button', 'ecls-btn sec sm', '📖 Show text (pehle sunne ke baad!)');
  var textDiv = el('div', 'ecls-passage', '');
  textDiv.style.display = 'none';
  textDiv.textContent = passage.text;
  showText.addEventListener('click', function () {
    textDiv.style.display = textDiv.style.display === 'none' ? 'block' : 'none';
  });
  playCard.appendChild(showText);
  playCard.appendChild(textDiv);
  box.appendChild(playCard);

  /* accent variety — clearly labeled simulation */
  var acc = el('div', 'ecls-card');
  acc.appendChild(el('div', '', '<b>🎭 Accent variety <small style="color:#6b7280">(simulation)</small></b><br><small style="color:#6b7280">Same passage, different style — jaise alag-alag speakers!</small>'));
  var presets = [
    { name: '🐢 Slow & clear', rate: 0.8, pitch: 1.0 },
    { name: '🙂 Normal', rate: 1.0, pitch: 1.0 },
    { name: '🚀 Fast (native-like)', rate: 1.25, pitch: 1.1 }
  ];
  presets.forEach(function (pr) {
    var b = el('button', 'ecls-btn sec sm', pr.name);
    b.addEventListener('click', function () {
      if (!speak(passage.text, { rate: pr.rate, pitch: pr.pitch })) toast('Voice not available on this device.');
      else toast('🎭 Simulation: ' + pr.name);
    });
    acc.appendChild(b);
  });
  box.appendChild(acc);

  var qBtn = el('button', 'ecls-btn', '📝 I listened — start questions');
  qBtn.addEventListener('click', function () { stopSpeak(); showQuiz(box, passage, levelId); });
  box.appendChild(qBtn);
}

function showQuiz(box, passage, levelId) {
  box.innerHTML = '';
  box.appendChild(backBtn(box, function () { showPlayer(box, passage, levelId); }));
  box.appendChild(el('h2', '', '📝 Comprehension check'));
  box.appendChild(el('p', 'ecls-sub', 'Bina text dekhe jawab do — memory test! 🧠'));
  var answers = [];
  passage.questions.forEach(function (q, qi) {
    var card = el('div', 'ecls-card');
    card.appendChild(el('div', '', '<b>Q' + (qi + 1) + '.</b> ' + escapeHtml(q.q)));
    answers[qi] = -1;
    q.options.forEach(function (opt, oi) {
      var b = el('button', 'ecls-opt', escapeHtml(opt));
      b.addEventListener('click', function () {
        answers[qi] = oi;
        var btns = card.querySelectorAll('.ecls-opt');
        for (var i = 0; i < btns.length; i++) btns[i].classList.remove('sel');
        b.classList.add('sel');
      });
      card.appendChild(b);
    });
    box.appendChild(card);
  });
  var submit = el('button', 'ecls-btn', '✅ Submit answers');
  submit.addEventListener('click', function () {
    if (answers.some(function (a) { return a === -1; })) { toast('Saare questions ke jawab do! 🙂'); return; }
    showScore(box, passage, levelId, answers);
  });
  box.appendChild(submit);
}

function showScore(box, passage, levelId, answers) {
  var correct = 0;
  passage.questions.forEach(function (q, i) { if (answers[i] === q.answer) correct++; });
  box.innerHTML = '';
  box.appendChild(el('h2', '', '🏁 Result'));
  var card = el('div', 'ecls-card');
  card.appendChild(el('div', 'ecls-big', correct + '/3'));
  var msg = correct === 3 ? '🔥 Perfect! Tumhara listening ekdum sharp hai!' : correct === 2 ? '👍 Bahut badhiya! Ek baar aur suno, 3/3 pakka!' : '💪 Koi baat nahi! Passage dobara suno (0.8× speed pe) aur phir try karo.';
  card.appendChild(el('div', '', msg + '<br><br><b>Correct answers:</b>'));
  passage.questions.forEach(function (q, i) {
    var ok = answers[i] === q.answer;
    card.appendChild(el('div', '', (ok ? '✅' : '❌') + ' Q' + (i + 1) + ': <b>' + escapeHtml(q.options[q.answer]) + '</b>'));
  });
  box.appendChild(card);
  var again = el('button', 'ecls-btn', '🔁 Listen again');
  again.addEventListener('click', function () { showPlayer(box, passage, levelId); });
  var more = el('button', 'ecls-btn sec', '📚 More passages');
  more.addEventListener('click', function () { showPassages(box, levelId); });
  box.appendChild(again);
  box.appendChild(more);
  var xp = correct === 3 ? 20 : correct === 2 ? 12 : 6;
  addXP(xp, 'listening quiz');
  bumpSkill('listening', correct >= 2 ? 2 : 1);
  touchDay();
  toast('+' + xp + ' XP! 🎧');
}

EC.register('listening', { title: 'Listening', icon: '🎧', render: render });
})();
