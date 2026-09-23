/* ============================================================
   My AI English Coach — UI TAB GROUP B
   Tab: pronounce (🔊) — Sound guide, minimal pairs, accent goals
   Vanilla JS. Consumes global EC contract; guards everything.
   ============================================================ */
(function () {
  'use strict';
  var EC = window.EC;
  if (!EC || typeof EC.register !== 'function') return;

  /* ---------- guarded helpers ---------- */
  var U = EC.ui || {};
  var SP = EC.speech || {};
  var store = EC.store || null;
  function sdata() { return (store && store.data) || {}; }
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

  var CSS_ID = 'ec-tab-pronounce-css';
  function injectCSS() {
    if (document.getElementById(CSS_ID)) return;
    var s = document.createElement('style'); s.id = CSS_ID;
    s.textContent = [
      '.ecP{font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.5;color:#1c1c1e;}',
      '.ecP .ec-sub{display:flex;gap:8px;overflow-x:auto;padding:8px 0;margin-bottom:6px;}',
      '.ecP .ec-chip{flex:0 0 auto;border:1px solid #d1d1d6;background:#f2f2f7;border-radius:999px;padding:8px 14px;font-size:14px;cursor:pointer;}',
      '.ecP .ec-chip.on{background:#0a84ff;color:#fff;border-color:#0a84ff;}',
      '.ecP .ec-card{background:#fff;border:1px solid #e5e5ea;border-radius:14px;padding:14px;margin:10px 0;box-shadow:0 1px 3px rgba(0,0,0,.06);}',
      '.ecP .ec-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}',
      '.ecP .ec-grow{flex:1;min-width:120px;}',
      '.ecP .ec-title{font-weight:700;font-size:16px;}',
      '.ecP .ec-hi{color:#636366;font-size:13px;}',
      '.ecP .ec-lbl{font-size:12px;font-weight:700;color:#8e8e93;text-transform:uppercase;letter-spacing:.4px;margin:12px 0 4px;}',
      '.ecP .ec-say{border:none;background:#e5f0ff;border-radius:50%;width:34px;height:34px;font-size:16px;cursor:pointer;flex:0 0 auto;}',
      '.ecP .ec-btn{background:#0a84ff;color:#fff;border:none;border-radius:10px;padding:10px 16px;font-size:15px;cursor:pointer;margin:4px 6px 4px 0;}',
      '.ecP .ec-btn.ghost{background:#f2f2f7;color:#1c1c1e;}',
      '.ecP .ec-btn.red{background:#ff3b30;}',
      '.ecP .ec-wbtn{border:1px solid #d1d1d6;background:#f8f9ff;border-radius:10px;padding:8px 12px;margin:4px;font-size:15px;cursor:pointer;}',
      '.ecP .ec-tip{background:#fff8e1;border-radius:10px;padding:10px;margin:8px 0;font-size:14px;}',
      '.ecP .ec-fb{font-size:14px;margin:8px 0;}',
      '.ecP .ec-goal{border:2px solid #e5e5ea;border-radius:14px;padding:14px;margin:8px 0;cursor:pointer;}',
      '.ecP .ec-goal.on{border-color:#0a84ff;background:#f0f7ff;}',
      '.ecP .ec-note{background:#f2f2f7;border-radius:10px;padding:10px;font-size:13px;color:#636366;margin:8px 0;}',
      '.ecP .ec-score{font-weight:700;}'
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ---------- built-in sound guide (fallback) ---------- */
  var FALLBACK_SOUNDS = [
    { key: 'TH', title: 'TH sound — थ / द नहीं!', tip: 'Jibh (tongue) daanton ke beech halki si bahar nikalo, hawa chhodo. "think" me थ jaisa par naram, "this" me द jaisa par naram. Practice: sheeshe me dekho!', words: ['think', 'three', 'thank', 'this', 'that', 'mother', 'with'] },
    { key: 'R', title: 'English R — Hindi ड़ नहीं', tip: 'Jibh ko muh ke andar gol ghumao, daanton ko touch MAT karo. "red" me jibh peeche. Hindi "र" se halka aur gehra.', words: ['red', 'run', 'very', 'correct', 'around', 'river'] },
    { key: 'V / W', title: 'V vs W — दोनों अलग!', tip: 'V: upar ke daant neeche wale honth par (vaseline). W: honth gol karke (water). "very" vs "wary" — farak suno!', words: ['very', 'voice', 'water', 'window', 'vine', 'wine'] },
    { key: 'S / Z', title: 'S vs Z — sansanahat vs gunj', tip: 'S: sirf hawa (sun). Z: gala vibrate karega, haath gale par rakho (zoo). "sip" vs "zip" try karo.', words: ['sip', 'zip', 'bus', 'buzz', 'rice', 'rise'] },
    { key: '-ED', title: '-ED endings — 3 tarike', tip: '"t/d" sound ke baad = /id/ (wanted). Awaaz wali (voiced) ke baad = /d/ (played). Be-awaz ke baad = /t/ (stopped). Extra syllable mat jodo!', words: ['wanted', 'played', 'stopped', 'walked', 'needed', 'rained'] },
    { key: 'STRESS', title: 'Word stress — zor kahan?', tip: 'English me ek syllable par ZOR padta hai: PHOto, phoTOgraphy. Zor galat to word ajeeb lagega. Suno, zor pakdo, dohрао.', words: ['photo', 'photography', 'record (noun)', 'record (verb)', 'present', 'object'] }
  ];

  var FALLBACK_PAIRS = [
    ['ship', 'sheep'], ['full', 'fool'], ['live', 'leave'],
    ['pen', 'pan'], ['very', 'wary'], ['sip', 'zip'],
    ['cot', 'coat'], ['bat', 'bet'], ['thin', 'tin'], ['rice', 'rise']
  ];

  function getSounds() {
    try { if (EC.data && Array.isArray(EC.data.sounds) && EC.data.sounds.length) return EC.data.sounds; } catch (e) {}
    return FALLBACK_SOUNDS;
  }
  function getPairs() {
    try {
      if (EC.data && Array.isArray(EC.data.minimalPairs) && EC.data.minimalPairs.length) {
        return EC.data.minimalPairs.map(function (p) {
          if (Array.isArray(p)) return [p[0], p[1]];
          return [p.a || p.word1 || '', p.b || p.word2 || ''];
        }).filter(function (p) { return p[0] && p[1]; });
      }
    } catch (e) {}
    return FALLBACK_PAIRS;
  }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* ---------- sub-view: sound guide ---------- */
  function viewSounds(box) {
    box.innerHTML = '';
    box.appendChild(h('div', 'ec-hi', 'Har sound ka tip padho, words suno, zor se dohрао! 🗣️'));
    getSounds().forEach(function (snd) {
      var c = h('div', 'ec-card');
      c.appendChild(h('div', 'ec-title', snd.title || snd.key));
      if (snd.tip) c.appendChild(h('div', 'ec-tip', '💡 ' + snd.tip));
      var row = h('div', 'ec-row');
      (snd.words || []).forEach(function (w) {
        var b = h('button', 'ec-wbtn', '🔊 ' + w); b.type = 'button';
        b.addEventListener('click', function () { speak(w); });
        row.appendChild(b);
      });
      c.appendChild(row);
      var prac = h('button', 'ec-btn ghost', '✓ Practice kiya'); prac.type = 'button';
      prac.addEventListener('click', function () {
        addXP(3); bumpSkill('pronunciation', 1); touchDay(); save();
        toast('👏 Shabaash! +3 XP');
      });
      c.appendChild(prac);
      box.appendChild(c);
    });
  }

  /* ---------- sub-view: minimal pairs ---------- */
  function viewPairs(box) {
    box.innerHTML = '';
    var pairs = getPairs();
    box.appendChild(h('div', 'ec-hi', 'Do milte-julte words — kaan tez karo! 👂 Pehle A suno, phir B, phir quiz me pehchano.'));
    var score = 0, rounds = 0;
    var scoreEl = h('div', 'ec-score', 'Score: 0'); box.appendChild(scoreEl);
    var card = h('div', 'ec-card'); box.appendChild(card);

    function hearRound() {
      card.innerHTML = '';
      var p = pairs[Math.floor(Math.random() * pairs.length)];
      card.appendChild(h('div', 'ec-lbl', 'Step 1 — suno aur farak mehsoos karo'));
      var r = h('div', 'ec-row');
      var bA = h('button', 'ec-wbtn', '🔊 A: ' + p[0]); bA.type = 'button';
      var bB = h('button', 'ec-wbtn', '🔊 B: ' + p[1]); bB.type = 'button';
      bA.addEventListener('click', function () { speak(p[0]); });
      bB.addEventListener('click', function () { speak(p[1]); });
      r.appendChild(bA); r.appendChild(bB);
      card.appendChild(r);
      card.appendChild(h('div', 'ec-lbl', 'Step 2 — quiz: kaunsa suna?'));
      var fb = h('div', 'ec-fb', ''); card.appendChild(fb);
      var target = Math.random() < 0.5 ? 0 : 1;
      var played = false;
      var play = h('button', 'ec-btn', '▶ Bajao'); play.type = 'button';
      play.addEventListener('click', function () { speak(p[target]); played = true; });
      card.appendChild(play);
      var r2 = h('div', 'ec-row');
      [p[0], p[1]].forEach(function (w, i) {
        var b = h('button', 'ec-wbtn', w); b.type = 'button';
        b.addEventListener('click', function () {
          if (!played) { toast('Pehle ▶ Bajao dabao!'); return; }
          rounds++;
          if (i === target) { score++; addXP(5); bumpSkill('pronunciation', 1); fb.textContent = '✅ Sahi pehchana! +5 XP'; }
          else { fb.textContent = '❌ Woh "' + p[target] + '" tha. Phir suno!'; }
          scoreEl.textContent = 'Score: ' + score + ' / ' + rounds;
          touchDay(); save();
          var nx = h('button', 'ec-btn', '➡ Next pair'); nx.type = 'button';
          nx.addEventListener('click', hearRound);
          card.appendChild(nx);
          r2.querySelectorAll('button').forEach(function (x) { x.disabled = true; });
        });
        r2.appendChild(b);
      });
      card.appendChild(r2);
    }

    /* record & playback */
    var rec = h('div', 'ec-card'); box.appendChild(rec);
    rec.appendChild(h('div', 'ec-lbl', '🎙️ Record & compare'));
    rec.appendChild(h('div', 'ec-hi', 'Khud bolo, recording suno, demo se compare karo.'));
    var wsel = h('div', 'ec-row'); rec.appendChild(wsel);
    var uniqWords = ['think', 'very', 'ship', 'sheep', 'water', 'window', 'three', 'this'];
    var curW = uniqWords[0];
    uniqWords.forEach(function (w, i) {
      var b = h('button', 'ec-chip' + (i === 0 ? ' on' : ''), w); b.type = 'button';
      b.addEventListener('click', function () {
        wsel.querySelectorAll('.ec-chip').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on'); curW = w;
      });
      wsel.appendChild(b);
    });
    var rrow = h('div', 'ec-row'); rec.appendChild(rrow);
    var demoB = h('button', 'ec-btn ghost', '🔊 Demo suno'); demoB.type = 'button';
    demoB.addEventListener('click', function () { speak(curW); });
    rrow.appendChild(demoB);
    var recB = h('button', 'ec-btn red', '● Record'); recB.type = 'button';
    var playB = h('button', 'ec-btn ghost', '▶ Meri recording'); playB.type = 'button';
    playB.disabled = true;
    rrow.appendChild(recB); rrow.appendChild(playB);
    var rfb = h('div', 'ec-fb', ''); rec.appendChild(rfb);

    var MR = null;
    try { MR = window.MediaRecorder; } catch (e) { MR = null; }
    if (!MR || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      rfb.textContent = '⚠️ Is browser/device me recording support nahi hai — demo sunke zor se dohрао!';
      recB.disabled = true;
    } else {
      var chunks = [], recorder = null, audioURL = null;
      recB.addEventListener('click', function () {
        if (recorder && recorder.state === 'recording') {
          recorder.stop(); recB.textContent = '● Record'; return;
        }
        navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
          chunks = [];
          recorder = new MR(stream);
          recorder.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data); };
          recorder.onstop = function () {
            var blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
            if (audioURL) URL.revokeObjectURL(audioURL);
            audioURL = URL.createObjectURL(blob);
            playB.disabled = false;
            rfb.textContent = '✅ Recording taiyaar! Suno aur demo se compare karo.';
            addXP(5); bumpSkill('pronunciation', 2); touchDay(); save();
            stream.getTracks().forEach(function (t) { t.stop(); });
          };
          recorder.start();
          recB.textContent = '■ Stop';
          rfb.textContent = '🎙️ Recording… "' + curW + '" bolo!';
        }).catch(function () { rfb.textContent = '⚠️ Mic permission nahi mila.'; });
      });
      playB.addEventListener('click', function () {
        if (audioURL) { var a = new Audio(audioURL); a.play(); }
      });
    }
    hearRound();
  }

  /* ---------- sub-view: accent goals ---------- */
  function viewGoals(box) {
    box.innerHTML = '';
    var d = sdata();
    var cur = d.accentGoal || 'neutral';
    box.appendChild(h('div', 'ec-title', '🎯 Accent goal'));
    box.appendChild(h('div', 'ec-note', 'Ye sirf <b>reference</b> hai — kis style ki taraf jhukna hai. <b>Tumhari pehchaan tumhari hai</b> — accent tumhe nahi badalta, sirf clarity badhata hai. 🇮🇳❤️'));
    var goals = [
      ['neutral', '🇮🇳 Neutral Indian', 'Saaf, confident Indian English — interviews aur daily life ke liye best.'],
      ['us', '🇺🇸 US-leaning', 'American shows/movies jaisa flow — "r" zyada, "t" naram (water → wader).'],
      ['uk', '🇬🇧 UK-leaning', 'British style — "r" halka, "a" lamba (dance → daance).']
    ];
    goals.forEach(function (gl) {
      var c = h('div', 'ec-goal' + (cur === gl[0] ? ' on' : ''), '');
      c.appendChild(h('div', 'ec-title', gl[1]));
      c.appendChild(h('div', 'ec-hi', gl[2]));
      c.addEventListener('click', function () {
        d.accentGoal = gl[0]; save(); cur = gl[0];
        box.querySelectorAll('.ec-goal').forEach(function (x) { x.classList.remove('on'); });
        c.classList.add('on');
        toast('🎯 Goal set: ' + gl[1]);
      });
      box.appendChild(c);
    });
    box.appendChild(h('div', 'ec-lbl', 'Practice log'));
    var logB = h('button', 'ec-btn', '✓ Aaj practice ki'); logB.type = 'button';
    logB.addEventListener('click', function () {
      addXP(5); bumpSkill('pronunciation', 2); touchDay(); save();
      toast('🔥 Practice logged! +5 XP');
    });
    box.appendChild(logB);
    box.appendChild(h('div', 'ec-hi', 'Roz 5 minute zor se bolna = 1 mahine me farak dikhega. 💪'));
  }

  /* ---------- register ---------- */
  EC.register('pronounce', {
    title: 'Pronunciation',
    icon: '🔊',
    render: function (containerEl) {
      injectCSS();
      touchDay();
      var root = h('div', 'ecP');
      containerEl.innerHTML = '';
      containerEl.appendChild(root);
      var bar = h('div', 'ec-sub');
      var body = h('div', '');
      root.appendChild(bar); root.appendChild(body);
      var tabs = [
        ['🗣️ Sound Guide', viewSounds],
        ['👂 Minimal Pairs', viewPairs],
        ['🎯 Accent Goal', viewGoals]
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
