/* ============================================================
   My AI English Coach — UI TAB GROUP B
   Tab: translate (🇮🇳) — Hinglish ↔ English practice
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
  function logMistake(m) { try { if (typeof EC.logMistake === 'function') EC.logMistake(m); } catch (e) {} }
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

  var CSS_ID = 'ec-tab-translate-css';
  function injectCSS() {
    if (document.getElementById(CSS_ID)) return;
    var s = document.createElement('style'); s.id = CSS_ID;
    s.textContent = [
      '.ecTr{font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.5;color:#1c1c1e;}',
      '.ecTr .ec-sub{display:flex;gap:8px;overflow-x:auto;padding:8px 0;margin-bottom:6px;}',
      '.ecTr .ec-chip{flex:0 0 auto;border:1px solid #d1d1d6;background:#f2f2f7;border-radius:999px;padding:8px 14px;font-size:14px;cursor:pointer;}',
      '.ecTr .ec-chip.on{background:#0a84ff;color:#fff;border-color:#0a84ff;}',
      '.ecTr .ec-card{background:#fff;border:1px solid #e5e5ea;border-radius:14px;padding:14px;margin:10px 0;box-shadow:0 1px 3px rgba(0,0,0,.06);}',
      '.ecTr .ec-title{font-weight:700;font-size:16px;}',
      '.ecTr .ec-hi{color:#636366;font-size:13px;}',
      '.ecTr .ec-src{background:#f2f2f7;border-radius:12px;padding:14px;font-size:17px;margin:10px 0;}',
      '.ecTr textarea{width:100%;box-sizing:border-box;border:1px solid #d1d1d6;border-radius:10px;padding:10px;font-size:15px;min-height:70px;font-family:inherit;}',
      '.ecTr .ec-btn{background:#0a84ff;color:#fff;border:none;border-radius:10px;padding:10px 16px;font-size:15px;cursor:pointer;margin:6px 6px 6px 0;}',
      '.ecTr .ec-btn.ghost{background:#f2f2f7;color:#1c1c1e;}',
      '.ecTr .ec-fb{font-size:14px;margin:8px 0;padding:10px;border-radius:10px;}',
      '.ecTr .ec-fb.ok{background:#e6f6e9;}',
      '.ecTr .ec-fb.mid{background:#fff8e1;}',
      '.ecTr .ec-fb.bad{background:#fdecea;}',
      '.ecTr .ec-calque{background:#fff3e0;border:1px dashed #e0a800;border-radius:10px;padding:10px;margin:8px 0;font-size:14px;}',
      '.ecTr .ec-model{background:#e8f0ff;border-radius:10px;padding:10px;margin:8px 0;}',
      '.ecTr .ec-say{border:none;background:#e5f0ff;border-radius:50%;width:34px;height:34px;font-size:16px;cursor:pointer;flex:0 0 auto;}',
      '.ecTr .ec-row{display:flex;align-items:center;gap:10px;}',
      '.ecTr .ec-grow{flex:1;}'
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ---------- built-in pool: 24 pairs ----------
     hi: Hinglish sentence | en: model English | key: content keywords for check
     calque: common Hindi-se-seedha-translate mistake pattern for this item */
  var PAIRS = [
    { hi: 'Mere paas ek car hai.', en: 'I have a car.', key: ['have', 'car'], calque: { pat: 'i am having', fix: '"I am having" nahi — "I have" bolo. Have = paas hona, isme -ing nahi lagta.' } },
    { hi: 'Woh roz school jaata hai.', en: 'He goes to school daily.', key: ['goes', 'school'] },
    { hi: 'Kya tum chai piyoge?', en: 'Will you have tea?', key: ['tea'], alt: ['will', 'would'] },
    { hi: 'Mujhe bhookh lagi hai.', en: 'I am hungry.', key: ['hungry'], calque: { pat: 'hunger', fix: '"Mujhe hunger lagi" jaisa mat socho — "I am hungry" (adjective) bolo.' } },
    { hi: 'Tum kal kahaan the?', en: 'Where were you yesterday?', key: ['where', 'yesterday'] },
    { hi: 'Usne mujhe dhokha diya.', en: 'He cheated me.', key: ['cheat'], alt: ['deceiv'] },
    { hi: 'Baarish ho rahi hai.', en: 'It is raining.', key: ['raining'], calque: { pat: 'rain is coming', fix: '"Rain is coming" samajh aata hai par natural hai "It is raining".' } },
    { hi: 'Main tumse kal milunga.', en: 'I will meet you tomorrow.', key: ['meet', 'tomorrow'] },
    { hi: 'Usne khaana kha liya hai.', en: 'He has eaten food.', key: ['eaten'], alt: ['has'] },
    { hi: 'Kripya darwaza band kar do.', en: 'Please close the door.', key: ['close', 'door'] },
    { hi: 'Mujhe angrezi seekhni hai.', en: 'I want to learn English.', key: ['learn', 'english'] },
    { hi: 'Woh bahut tez daudta hai.', en: 'He runs very fast.', key: ['runs', 'fast'] },
    { hi: 'Tumne mera pen kahaan rakha?', en: 'Where did you keep my pen?', key: ['pen', 'keep', 'where'] },
    { hi: 'Main kal se beemar hoon.', en: 'I have been ill since yesterday.', key: ['since', 'yesterday'], alt: ['sick'], calque: { pat: 'from yesterday', fix: '"from yesterday" ki jagah "since yesterday" — point of time ke liye since.' } },
    { hi: 'Agar woh aayega to main jaunga.', en: 'If he comes, I will go.', key: ['comes', 'will'], calque: { pat: 'if he will come', fix: '"If" wale part me will MAT lagao — "If he comes" sahi hai.' } },
    { hi: 'Tumhe roz padhna chahiye.', en: 'You should study daily.', key: ['should', 'study'] },
    { hi: 'Maine use kabhi nahi dekha.', en: 'I have never seen him.', key: ['never', 'seen'] },
    { hi: 'Woh mujhse lamba hai.', en: 'He is taller than me.', key: ['taller'], calque: { pat: 'more long', fix: '"More long" nahi — "taller" (comparative) bolo.' } },
    { hi: 'Kitne baje hain?', en: 'What is the time?', key: ['time'], alt: ['what'] },
    { hi: 'Mujhe maaf kar do.', en: 'Please forgive me.', key: ['forgive'], alt: ['sorry'] },
    { hi: 'Yeh kitaab meri hai.', en: 'This book is mine.', key: ['mine'], alt: ['my book'] },
    { hi: 'Woh kal aa raha hai.', en: 'He is coming tomorrow.', key: ['coming', 'tomorrow'] },
    { hi: 'Tum jhooth kyun bol rahe ho?', en: 'Why are you lying?', key: ['lying', 'why'] },
    { hi: 'Mehnat ka phal meetha hota hai.', en: 'Hard work pays off.', key: ['hard work'], alt: ['pays'] }
  ];

  /* Direction B keywords: expected meaning/tense keywords (Hindi/Hinglish mix) */
  var PAIRS_B = PAIRS.map(function (p) {
    return { en: p.en, hi: p.hi, key: meaningKeys(p) };
  });
  function meaningKeys(p) {
    // crude keyword extraction from hinglish + english content words
    var stop = { 'hai': 1, 'ho': 1, 'ke': 1, 'ka': 1, 'ki': 1, 'ko': 1, 'me': 1, 'mein': 1, 'se': 1, 'par': 1, 'aur': 1, 'the': 1, 'a': 1, 'an': 1, 'is': 1, 'are': 1, 'to': 1, 'i': 1 };
    var words = (p.hi + ' ' + p.en).toLowerCase().replace(/[^a-z\u0900-\u097F ]/g, ' ').split(/\s+/);
    var out = [];
    words.forEach(function (w) { if (w.length > 2 && !stop[w] && out.indexOf(w) < 0) out.push(w); });
    return out.slice(0, 6);
  }

  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function norm(s) { return (s || '').toLowerCase().replace(/[^a-z\u0900-\u097F0-9 ]/g, ' ').replace(/\s+/g, ' ').trim(); }

  function keywordScore(text, keys, alt) {
    var t = ' ' + norm(text) + ' ';
    var hit = 0, missed = [];
    keys.forEach(function (k) {
      var kk = norm(k);
      if (t.indexOf(kk) >= 0 || t.indexOf(' ' + kk) >= 0 || t.indexOf(kk + ' ') >= 0) hit++;
      else missed.push(k);
    });
    var altHit = false;
    if (alt) alt.forEach(function (k) { if (t.indexOf(norm(k)) >= 0) altHit = true; });
    return { hit: hit, total: keys.length, missed: missed, altHit: altHit };
  }

  function engineAnalyze(text) {
    // Guarded: use EC.ai.analyzeSentence if present, never depend on shape
    try {
      if (typeof AI.analyzeSentence === 'function') {
        var r = AI.analyzeSentence(text);
        if (r && typeof r === 'object') return r;
        if (typeof r === 'string') return { note: r };
      }
    } catch (e) {}
    return null;
  }

  /* ---------- direction A: Hinglish -> English ---------- */
  function viewA(box) {
    box.innerHTML = '';
    var order = shuffle(PAIRS), idx = 0, good = 0;
    box.appendChild(h('div', 'ec-hi', 'Hinglish padho, English me likho. Enter dabao ya Check karo. ⌨️'));
    var prog = h('div', 'ec-hi', ''); box.appendChild(prog);
    var card = h('div', 'ec-card'); box.appendChild(card);

    function show() {
      prog.textContent = 'Sentence ' + (idx + 1) + ' / ' + order.length + ' • Sahi: ' + good;
      if (idx >= order.length) {
        card.innerHTML = '';
        card.appendChild(h('div', 'ec-title', '🎉 Sab ho gaye!'));
        card.appendChild(h('div', 'ec-hi', good + '/' + order.length + ' sahi'));
        var again = h('button', 'ec-btn', '🔁 Phir se'); again.type = 'button';
        again.addEventListener('click', function () { viewA(box); });
        card.appendChild(again);
        touchDay(); save(); return;
      }
      var p = order[idx];
      card.innerHTML = '';
      var src = h('div', 'ec-src', '🇮🇳 ' + p.hi); card.appendChild(src);
      var ta = h('textarea', ''); ta.placeholder = 'English me likho…'; card.appendChild(ta);
      var row = h('div', ''); card.appendChild(row);
      var check = h('button', 'ec-btn', '✓ Check'); check.type = 'button';
      var skip = h('button', 'ec-btn ghost', '⏭ Skip'); skip.type = 'button';
      row.appendChild(check); row.appendChild(skip);
      var fb = h('div', ''); card.appendChild(fb);
      var model = h('div', ''); card.appendChild(model);

      function doCheck() {
        var typed = ta.value.trim();
        if (!typed) { toast('Pehle kuch likho!'); return; }
        var sc = keywordScore(typed, p.key, p.alt);
        var ratio = sc.total ? sc.hit / sc.total : 1;
        // calque detection
        var cal = null;
        if (p.calque && norm(typed).indexOf(p.calque.pat) >= 0) cal = p.calque.fix;
        // engine analysis (guarded)
        var eng = engineAnalyze(typed);
        fb.innerHTML = '';
        model.innerHTML = '';
        var cls = 'ec-fb ', msg;
        if (ratio >= 1 || (ratio >= 0.66 && sc.altHit)) { cls += 'ok'; msg = '✅ Bahut badhiya! Sahi hai. +10 XP'; good++; addXP(10); bumpSkill('sentence', 2); }
        else if (ratio >= 0.5) { cls += 'mid'; msg = '🟡 Kareeb ho! Kuch words missing: ' + sc.missed.join(', ') + '. +3 XP'; addXP(3); bumpSkill('sentence', 1); }
        else { cls += 'bad'; msg = '❌ Abhi match nahi hua. Missing: ' + sc.missed.join(', ') + '. Model answer dekho 👇'; logMistake({ type: 'translate', text: typed, expected: p.en }); }
        fb.className = cls; fb.textContent = msg;
        if (eng && (eng.errors || eng.note || eng.feedback)) {
          var en = h('div', 'ec-hi', '🤖 AI note: ' + (eng.note || eng.feedback || JSON.stringify(eng.errors).slice(0, 120)));
          fb.appendChild(en);
        }
        if (cal) {
          var cz = h('div', 'ec-calque', '🔁 Calque — Hindi se seedha translate: ' + cal);
          fb.appendChild(cz);
        }
        var m = h('div', 'ec-model');
        var r = h('div', 'ec-row');
        var g = h('div', 'ec-grow', '');
        g.appendChild(h('div', 'ec-title', 'Model answer:'));
        g.appendChild(h('div', '', p.en));
        r.appendChild(g); r.appendChild(speakBtn(p.en));
        m.appendChild(r);
        model.appendChild(m);
        row.innerHTML = '';
        var next = h('button', 'ec-btn', '➡ Next'); next.type = 'button';
        next.addEventListener('click', function () { idx++; show(); });
        row.appendChild(next);
        touchDay(); save();
      }
      check.addEventListener('click', doCheck);
      ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doCheck(); } });
      skip.addEventListener('click', function () {
        model.innerHTML = '';
        var m = h('div', 'ec-model', 'Model: ' + p.en);
        model.appendChild(m); idx++; prog.textContent = 'Sentence ' + (idx + 1) + ' / ' + order.length + ' • Sahi: ' + good;
        setTimeout(show, 1200);
      });
    }
    show();
  }

  /* ---------- direction B: English -> Hinglish meaning ---------- */
  function viewB(box) {
    box.innerHTML = '';
    var order = shuffle(PAIRS_B), idx = 0, good = 0;
    box.appendChild(h('div', 'ec-hi', 'English sentence ka MATLAB apne shabdon me samjhao (Hindi/Hinglish me). Kaunsa tense hai, ye bhi likh sakte ho. 💭'));
    var prog = h('div', 'ec-hi', ''); box.appendChild(prog);
    var card = h('div', 'ec-card'); box.appendChild(card);

    function show() {
      prog.textContent = 'Sentence ' + (idx + 1) + ' / ' + order.length + ' • Achhe: ' + good;
      if (idx >= order.length) {
        card.innerHTML = '';
        card.appendChild(h('div', 'ec-title', '🎉 Khatam!'));
        card.appendChild(h('div', 'ec-hi', good + '/' + order.length + ' achhe jawab'));
        var again = h('button', 'ec-btn', '🔁 Phir se'); again.type = 'button';
        again.addEventListener('click', function () { viewB(box); });
        card.appendChild(again);
        touchDay(); save(); return;
      }
      var p = order[idx];
      card.innerHTML = '';
      var r0 = h('div', 'ec-row');
      var g0 = h('div', 'ec-grow ec-src', '🇬🇧 ' + p.en);
      r0.appendChild(g0); r0.appendChild(speakBtn(p.en));
      card.appendChild(r0);
      var ta = h('textarea', ''); ta.placeholder = 'Matlab apne shabdon me likho… (jaise: iska matlab hai…)'; card.appendChild(ta);
      var row = h('div', ''); card.appendChild(row);
      var check = h('button', 'ec-btn', '✓ Check'); check.type = 'button';
      row.appendChild(check);
      var fb = h('div', ''); card.appendChild(fb);
      var model = h('div', ''); card.appendChild(model);

      check.addEventListener('click', function () {
        var typed = ta.value.trim();
        if (!typed) { toast('Pehle kuch likho!'); return; }
        var sc = keywordScore(typed, p.key);
        var ratio = sc.total ? sc.hit / sc.total : 0;
        fb.innerHTML = ''; model.innerHTML = '';
        var cls = 'ec-fb ', msg;
        if (ratio >= 0.5) { cls += 'ok'; msg = '✅ Sahi samjha! +8 XP'; good++; addXP(8); bumpSkill('sentence', 1); }
        else { cls += 'mid'; msg = '🟡 Thoda aur detail likho — in shabdon ke aas-paas socho: ' + sc.missed.slice(0, 3).join(', ') + '. +2 XP'; addXP(2); }
        fb.className = cls; fb.textContent = msg;
        var m = h('div', 'ec-model', '');
        m.appendChild(h('div', 'ec-title', 'Model meaning:'));
        m.appendChild(h('div', '', p.hi));
        model.appendChild(m);
        row.innerHTML = '';
        var next = h('button', 'ec-btn', '➡ Next'); next.type = 'button';
        next.addEventListener('click', function () { idx++; show(); });
        row.appendChild(next);
        touchDay(); save();
      });
    }
    show();
  }

  /* ---------- register ---------- */
  EC.register('translate', {
    title: 'Hinglish ↔ English',
    icon: '🇮🇳',
    render: function (containerEl) {
      injectCSS();
      touchDay();
      var root = h('div', 'ecTr');
      containerEl.innerHTML = '';
      containerEl.appendChild(root);
      var bar = h('div', 'ec-sub');
      var body = h('div', '');
      root.appendChild(bar); root.appendChild(body);
      var tabs = [
        ['🇮🇳→🇬🇧 Hinglish → English', viewA],
        ['🇬🇧→🇮🇳 English → Matlab', viewB]
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
