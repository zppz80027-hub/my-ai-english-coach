/* ============================================================
   My AI English Coach — UI TAB GROUP B
   Tab: sentences (🧩) — Sentence Builder + Article/Preposition Clinic
   Vanilla JS. Consumes global EC contract; guards everything.
   ============================================================ */
(function () {
  'use strict';
  var EC = window.EC;
  if (!EC || typeof EC.register !== 'function') return;

  /* ---------- guarded helpers ---------- */
  var U = EC.ui || {};
  var SP = EC.speech || {};
  var AI = EC.ai || {};
  var store = EC.store || null;
  function save() { try { if (store && typeof store.save === 'function') store.save(); } catch (e) {} }
  function touchDay() { try { if (typeof EC.touchDay === 'function') EC.touchDay(); } catch (e) {} }
  function addXP(n) { try { if (typeof EC.addXP === 'function') EC.addXP(n); } catch (e) {} }
  function bumpSkill(s, n) { try { if (typeof EC.bumpSkill === 'function') EC.bumpSkill(s, n == null ? 1 : n); } catch (e) {} }
  function toast(m) { try { if (typeof U.toast === 'function') { U.toast(m); return; } } catch (e) {} }
  function h(tag, cls, text) {
    var e;
    try { if (typeof U.el === 'function') { e = U.el(tag, cls); if (!e || !e.appendChild) throw 0; } else throw 0; }
    catch (err) { e = document.createElement(tag); if (cls) e.className = cls; }
    if (text != null) e.textContent = text;
    return e;
  }
  function speak(t) {
    try { if (typeof SP.speak === 'function') { SP.speak(t); return; } } catch (e) {}
    try { var u = new SpeechSynthesisUtterance(t); u.lang = 'en-US'; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch (e) {}
  }
  function speakBtn(t) {
    try { if (typeof U.speakBtn === 'function') { var b = U.speakBtn(t); if (b) return b; } } catch (e) {}
    var b2 = h('button', 'ec-say', '🔊'); b2.type = 'button';
    b2.addEventListener('click', function (ev) { ev.stopPropagation(); speak(t); });
    return b2;
  }

  var CSS_ID = 'ec-tab-sentences-css';
  function injectCSS() {
    if (document.getElementById(CSS_ID)) return;
    var s = document.createElement('style'); s.id = CSS_ID;
    s.textContent = [
      '.ecS{font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.5;color:#1c1c1e;}',
      '.ecS .ec-sub{display:flex;gap:8px;overflow-x:auto;padding:8px 0;margin-bottom:6px;}',
      '.ecS .ec-chip{flex:0 0 auto;border:1px solid #d1d1d6;background:#f2f2f7;border-radius:999px;padding:8px 14px;font-size:14px;cursor:pointer;}',
      '.ecS .ec-chip.on{background:#0a84ff;color:#fff;border-color:#0a84ff;}',
      '.ecS .ec-card{background:#fff;border:1px solid #e5e5ea;border-radius:14px;padding:14px;margin:10px 0;box-shadow:0 1px 3px rgba(0,0,0,.06);}',
      '.ecS .ec-row{display:flex;align-items:center;gap:10px;}',
      '.ecS .ec-grow{flex:1;}',
      '.ecS .ec-title{font-weight:700;font-size:16px;}',
      '.ecS .ec-hi{color:#636366;font-size:13px;}',
      '.ecS .ec-lbl{font-size:12px;font-weight:700;color:#8e8e93;text-transform:uppercase;letter-spacing:.4px;margin:12px 0 4px;}',
      '.ecS .ec-say{border:none;background:#e5f0ff;border-radius:50%;width:34px;height:34px;font-size:16px;cursor:pointer;flex:0 0 auto;}',
      '.ecS .ec-btn{background:#0a84ff;color:#fff;border:none;border-radius:10px;padding:10px 16px;font-size:15px;cursor:pointer;margin:4px 6px 4px 0;}',
      '.ecS .ec-btn.ghost{background:#f2f2f7;color:#1c1c1e;}',
      '.ecS .ec-btn.green{background:#34c759;}',
      '.ecS .ec-wchip{display:inline-block;border:1px solid #0a84ff;background:#eef4ff;color:#0a54a8;border-radius:10px;padding:8px 12px;margin:4px;font-size:15px;cursor:pointer;}',
      '.ecS .ec-wchip.used{opacity:.25;pointer-events:none;}',
      '.ecS .ec-build{min-height:56px;border:2px dashed #c7c7cc;border-radius:12px;padding:8px;margin:10px 0;background:#fafafa;}',
      '.ecS .ec-bchip{display:inline-block;background:#0a84ff;color:#fff;border-radius:10px;padding:8px 12px;margin:4px;font-size:15px;cursor:pointer;}',
      '.ecS .ec-fb{font-size:14px;margin:8px 0;}',
      '.ecS .ec-fb.ok{color:#1a7f37;font-weight:700;}',
      '.ecS .ec-fb.bad{color:#c92a22;font-weight:700;}',
      '.ecS .ec-opt{display:inline-block;border:1px solid #d1d1d6;background:#fff;border-radius:10px;padding:10px 16px;margin:4px;font-size:16px;cursor:pointer;min-width:64px;}',
      '.ecS .ec-opt.ok{background:#d7f0d8;border-color:#34c759;}',
      '.ecS .ec-opt.bad{background:#fbd9d5;border-color:#ff3b30;}',
      '.ecS .ec-opt:disabled{opacity:.8;cursor:default;}',
      '.ecS .ec-cloze{font-size:18px;margin:8px 0;}',
      '.ecS .ec-score{font-weight:700;font-size:15px;}'
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ---------- built-in scramble pool (fallback) ---------- */
  var POOL = {
    easy: [
      'I am happy today', 'She likes mangoes', 'We play cricket', 'He is my friend',
      'I drink milk daily', 'They are students', 'Open the door', 'I love my mom',
      'It is raining', 'She sings well'
    ],
    medium: [
      'I have finished my homework', 'She is cooking delicious food', 'We will win the match tomorrow',
      'They went to the market yesterday', 'He has been working since morning',
      'My mother makes tasty parathas', 'The children are playing in the park',
      'I want to learn English well'
    ],
    hard: [
      'If it rains tomorrow we will stay at home', 'She had already left before I reached there',
      'The teacher asked the students to open their books', 'I have been learning English for two years now',
      'Would you like to have a cup of tea', 'He is one of the best players in our team'
    ]
  };

  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* Try engine first, fall back to built-in pool */
  function getScramble(level, cb) {
    try {
      if (typeof AI.generateExercise === 'function') {
        var r = AI.generateExercise('sentence-scramble', { level: level });
        if (r) {
          var words = null, answer = null;
          if (Array.isArray(r.prompt)) words = r.prompt.slice();
          else if (typeof r.prompt === 'string') words = r.prompt.split(/\s+/);
          if (typeof r.answer === 'string') answer = r.answer;
          else if (Array.isArray(r.answer)) answer = r.answer.join(' ');
          if (words && words.length >= 3) {
            cb({ words: words, answer: answer || words.slice().sort().join(' ') , hint: r.hint || r.explainHinglish || '' });
            return;
          }
        }
      }
    } catch (e) {}
    var arr = POOL[level] || POOL.easy;
    var s = arr[Math.floor(Math.random() * arr.length)];
    cb({ words: s.split(' '), answer: s, hint: '' });
  }

  /* ---------- sub-view: sentence builder ---------- */
  function viewBuilder(box) {
    box.innerHTML = '';
    var level = 'easy', score = 0, rounds = 0;
    var bar = h('div', 'ec-sub'); box.appendChild(bar);
    var scoreEl = h('div', 'ec-score', '⭐ Score: 0'); box.appendChild(scoreEl);
    var game = h('div', ''); box.appendChild(game);
    var levels = [['easy', '😊 Easy'], ['medium', '🙂 Medium'], ['hard', '🤔 Hard']];
    var chips = [];
    levels.forEach(function (lv, i) {
      var c = h('button', 'ec-chip' + (i === 0 ? ' on' : ''), lv[1]); c.type = 'button';
      c.addEventListener('click', function () { chips.forEach(function (x) { x.classList.remove('on'); }); c.classList.add('on'); level = lv[0]; newRound(); });
      chips.push(c); bar.appendChild(c);
    });

    function newRound() {
      game.innerHTML = '';
      game.appendChild(h('div', 'ec-hi', 'Words ko sahi order me tap karo — sentence banao! 🧩'));
      var load = h('div', 'ec-hi', '⏳ Sentence taiyaar ho raha…'); game.appendChild(load);
      getScramble(level, function (ex) {
        game.innerHTML = '';
        game.appendChild(h('div', 'ec-hi', 'Words ko sahi order me tap karo — sentence banao! 🧩'));
        var words = shuffle(ex.words.map(function (w, i) { return { w: w, k: i }; }));
        var build = h('div', 'ec-build'); game.appendChild(build);
        var tray = h('div', ''); game.appendChild(tray);
        var picked = [];
        function refresh() {
          build.innerHTML = '';
          picked.forEach(function (p) {
            var chip = h('span', 'ec-bchip', p.w); chip.title = 'Hatane ke liye tap karo';
            chip.addEventListener('click', function () {
              picked.splice(picked.indexOf(p), 1);
              var t = tray.querySelector('[data-k="' + p.k + '"]');
              if (t) t.classList.remove('used');
              refresh();
            });
            build.appendChild(chip);
          });
          if (!picked.length) build.appendChild(h('span', 'ec-hi', 'Yahan tap kiye words aayenge…'));
        }
        words.forEach(function (p) {
          var chip = h('span', 'ec-wchip', p.w);
          chip.setAttribute('data-k', p.k);
          chip.addEventListener('click', function () {
            if (chip.classList.contains('used')) return;
            chip.classList.add('used'); picked.push(p); refresh();
          });
          tray.appendChild(chip);
        });
        refresh();
        var fb = h('div', 'ec-fb', ''); game.appendChild(fb);
        var row = h('div', ''); game.appendChild(row);
        var check = h('button', 'ec-btn green', '✓ Check'); check.type = 'button';
        var hear = h('button', 'ec-btn ghost', '🔊 Suno'); hear.type = 'button';
        var next = h('button', 'ec-btn', '➡ Next'); next.type = 'button'; next.style.display = 'none';
        hear.addEventListener('click', function () { speak(ex.answer); });
        check.addEventListener('click', function () {
          var made = picked.map(function (p) { return p.w; }).join(' ');
          var norm = function (s) { return s.toLowerCase().replace(/[.,!?]/g, '').replace(/\s+/g, ' ').trim(); };
          rounds++;
          if (norm(made) === norm(ex.answer)) {
            var pts = level === 'easy' ? 5 : level === 'medium' ? 10 : 15;
            score += pts; addXP(pts); bumpSkill('sentence', 2);
            fb.className = 'ec-fb ok'; fb.textContent = '✅ Bilkul sahi! +' + pts + ' XP';
            speak(ex.answer);
          } else {
            fb.className = 'ec-fb bad';
            fb.textContent = '❌ Abhi galat hai. Sahi: "' + ex.answer + '"';
            var hb = h('div', ''); hb.appendChild(speakBtn(ex.answer)); fb.appendChild(hb);
          }
          scoreEl.textContent = '⭐ Score: ' + score + ' • Round: ' + rounds;
          check.style.display = 'none'; next.style.display = '';
          touchDay(); save();
        });
        next.addEventListener('click', newRound);
        row.appendChild(check); row.appendChild(hear); row.appendChild(next);
      });
    }
    newRound();
  }

  /* ---------- sub-view: article & preposition clinic ---------- */
  var CLINIC = [
    { s: '___ apple a day keeps the doctor away.', o: ['a', 'an', 'the', '—'], a: 1, why: 'apple = vowel sound (a), isliye "an".', kind: 'article' },
    { s: 'She is ___ honest girl.', o: ['a', 'an', 'the', '—'], a: 1, why: '"honest" me h silent hai, sound "o" se — isliye "an".', kind: 'article' },
    { s: '___ sun rises in the east.', o: ['a', 'an', 'the', '—'], a: 2, why: 'Sun ek hi hai — unique cheez ke saath "the".', kind: 'article' },
    { s: 'I saw ___ movie last night. ___ movie was great.', o: ['a / the', 'the / a', 'an / the', 'the / the'], a: 0, why: 'Pehli baar "a", phir wahi movie = "the".', kind: 'article' },
    { s: 'He plays ___ cricket.', o: ['a', 'an', 'the', '—'], a: 3, why: 'Khelon ke naam ke saath article nahi lagta.', kind: 'article' },
    { s: '___ water is important for life.', o: ['a', 'an', 'the', '—'], a: 3, why: 'General baat (paani aam taur par) — no article.', kind: 'article' },
    { s: 'She is ___ best student in class.', o: ['a', 'an', 'the', '—'], a: 2, why: 'Superlative (best) ke saath hamesha "the".', kind: 'article' },
    { s: 'I need ___ umbrella.', o: ['a', 'an', 'the', '—'], a: 1, why: 'umbrella = vowel sound, isliye "an".', kind: 'article' },
    { s: '___ Ganga is a holy river.', o: ['a', 'an', 'the', '—'], a: 2, why: 'Nadiyon ke naam ke saath "the".', kind: 'article' },
    { s: 'He is ___ engineer.', o: ['a', 'an', 'the', '—'], a: 1, why: 'engineer = vowel sound (e), isliye "an".', kind: 'article' },
    { s: 'I was born ___ 2005.', o: ['in', 'on', 'at', 'to'], a: 0, why: 'Saal/month/season ke saath "in".', kind: 'prep' },
    { s: 'The meeting is ___ Monday.', o: ['in', 'on', 'at', 'to'], a: 1, why: 'Din/date ke saath "on".', kind: 'prep' },
    { s: 'She sleeps ___ night.', o: ['in', 'on', 'at', 'to'], a: 2, why: '"at night" fixed phrase hai.', kind: 'prep' },
    { s: 'He is waiting ___ the bus stop.', o: ['in', 'on', 'at', 'to'], a: 2, why: 'Chhoti jagah/point ke liye "at".', kind: 'prep' },
    { s: 'The book is ___ the table.', o: ['in', 'on', 'at', 'to'], a: 1, why: 'Upar surface par = "on".', kind: 'prep' },
    { s: 'She lives ___ Delhi.', o: ['in', 'on', 'at', 'to'], a: 0, why: 'Sheher/desh ke andar = "in".', kind: 'prep' },
    { s: 'I am going ___ school.', o: ['in', 'on', 'at', 'to'], a: 3, why: 'Direction/manzil ke liye "to".', kind: 'prep' },
    { s: 'He arrived ___ time.', o: ['in', 'on', 'at', 'to'], a: 1, why: '"on time" = bilkul time par (fixed phrase).', kind: 'prep' },
    { s: 'The cat is hiding ___ the bed.', o: ['in', 'on', 'under', 'at'], a: 2, why: 'Neeche = "under".', kind: 'prep' },
    { s: 'She is good ___ maths.', o: ['in', 'on', 'at', 'to'], a: 2, why: '"good at" fixed phrase hai.', kind: 'prep' }
  ];

  function viewClinic(box) {
    box.innerHTML = '';
    box.appendChild(h('div', 'ec-hi', 'Khali jagah bharo — turant Hinglish explanation milega! 🩺'));
    var bar = h('div', 'ec-sub'); box.appendChild(bar);
    var body = h('div', ''); box.appendChild(body);
    var kinds = [['all', 'Sab'], ['article', 'a/an/the'], ['prep', 'in/on/at/to']];
    var chips = [];
    kinds.forEach(function (k, i) {
      var c = h('button', 'ec-chip' + (i === 0 ? ' on' : ''), k[1]); c.type = 'button';
      c.addEventListener('click', function () { chips.forEach(function (x) { x.classList.remove('on'); }); c.classList.add('on'); draw(k[0]); });
      chips.push(c); bar.appendChild(c);
    });
    function draw(kind) {
      body.innerHTML = '';
      CLINIC.filter(function (x) { return kind === 'all' || x.kind === kind; }).forEach(function (it, i) {
        var card = h('div', 'ec-card');
        card.appendChild(h('div', 'ec-cloze', (i + 1) + '. ' + it.s));
        var fb = h('div', 'ec-fb', '');
        var row = h('div', '');
        it.o.forEach(function (opt) {
          var b = h('button', 'ec-opt', opt); b.type = 'button';
          b.addEventListener('click', function () {
            var btns = row.querySelectorAll('.ec-opt');
            for (var k = 0; k < btns.length; k++) btns[k].disabled = true;
            var correct = it.o[it.a];
            if (opt === correct) { b.classList.add('ok'); addXP(5); bumpSkill('grammar', 1); fb.className = 'ec-fb ok'; fb.textContent = '✅ Sahi! +5 XP — ' + it.why; }
            else { b.classList.add('bad'); for (var k2 = 0; k2 < btns.length; k2++) if (btns[k2].textContent === correct) btns[k2].classList.add('ok'); fb.className = 'ec-fb bad'; fb.textContent = '❌ Sahi: "' + correct + '" — ' + it.why; }
            touchDay(); save();
          });
          row.appendChild(b);
        });
        card.appendChild(row); card.appendChild(fb);
        body.appendChild(card);
      });
    }
    draw('all');
  }

  /* ---------- register ---------- */
  EC.register('sentences', {
    title: 'Sentence Builder',
    icon: '🧩',
    render: function (containerEl) {
      injectCSS();
      touchDay();
      var root = h('div', 'ecS');
      containerEl.innerHTML = '';
      containerEl.appendChild(root);
      var bar = h('div', 'ec-sub');
      var body = h('div', '');
      root.appendChild(bar); root.appendChild(body);
      var tabs = [
        ['🧩 Sentence Builder', viewBuilder],
        ['🩺 Article & Preposition Clinic', viewClinic]
      ];
      var chips = [];
      tabs.forEach(function (tb, i) {
        var c = h('button', 'ec-chip' + (i === 0 ? ' on' : ''), tb[0]); c.type = 'button';
        c.addEventListener('click', function () { chips.forEach(function (x) { x.classList.remove('on'); }); c.classList.add('on'); tb[1](body); });
        chips.push(c); bar.appendChild(c);
      });
      tabs[0][1](body);
    }
  });
})();
