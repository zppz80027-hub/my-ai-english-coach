/* My AI English Coach — TAB GROUP A
 * Tab: placement 🧪
 * First-run: 15 questions (grammar MCQ 6, vocab 4, sentence-order 2,
 * listening-note 1, speaking 2 via micOrText) -> score -> L1-L5
 * (clearly labeled informal estimate, NOT an official CEFR certificate)
 * -> roadmap -> save. Retake supported with old-vs-new comparison.
 */
(function () {
  'use strict';
  if (typeof EC === 'undefined' || !EC || typeof EC.register !== 'function') return;

  var BANK = [
    { type: 'mcq', skill: 'grammar', q: 'She ___ to school every day.', options: ['go', 'goes', 'going', 'gone'], answer: 1 },
    { type: 'mcq', skill: 'grammar', q: 'I ___ my homework yesterday.', options: ['do', 'did', 'done', 'doing'], answer: 1 },
    { type: 'mcq', skill: 'grammar', q: 'There ___ many books on the table.', options: ['is', 'are', 'was', 'be'], answer: 1 },
    { type: 'mcq', skill: 'grammar', q: 'He has lived here ___ 2020.', options: ['for', 'since', 'from', 'at'], answer: 1 },
    { type: 'mcq', skill: 'grammar', q: 'If it rains, we ___ at home.', options: ['stayed', 'stay', 'will stay', 'stays'], answer: 2 },
    { type: 'mcq', skill: 'grammar', q: 'This is the ___ movie I have ever seen.', options: ['good', 'better', 'best', 'more good'], answer: 2 },
    { type: 'mcq', skill: 'vocabulary', q: '"Improve" ka matlab hai…', options: ['to become better', 'to become worse', 'to stay the same', 'to run fast'], answer: 0 },
    { type: 'mcq', skill: 'vocabulary', q: '"Confident" ka matlab hai…', options: ['afraid', 'sure of yourself', 'angry', 'tired'], answer: 1 },
    { type: 'mcq', skill: 'vocabulary', q: '"Achieve" ka matlab hai…', options: ['to lose', 'to get by effort', 'to forget', 'to hide'], answer: 1 },
    { type: 'mcq', skill: 'vocabulary', q: '"Polite" ka matlab hai…', options: ['rude', 'loud', 'kind and respectful', 'fast'], answer: 2 },
    { type: 'order', skill: 'sentence', words: ['school', 'to', 'go', 'I', 'daily'], answer: 'I go to school daily' },
    { type: 'order', skill: 'sentence', words: ['reading', 'She', 'is', 'a', 'book'], answer: 'She is reading a book' },
    { type: 'listening', skill: 'listening', line: 'Practice makes a man perfect.' },
    { type: 'speaking', skill: 'speaking', prompt: 'Introduce yourself in 2–3 English sentences.' },
    { type: 'speaking', skill: 'speaking', prompt: 'Describe your daily routine in English.' }
  ];

  function E(tag, attrs) {
    var args = [tag, attrs || {}];
    for (var i = 2; i < arguments.length; i++) args.push(arguments[i]);
    if (EC.ui && typeof EC.ui.el === 'function') return EC.ui.el.apply(EC.ui, args);
    var el = document.createElement(tag);
    if (attrs && attrs.text) el.textContent = attrs.text;
    return el;
  }
  function d() { return (EC.store && EC.store.data) ? EC.store.data : {}; }
  function save() { try { if (EC.store && typeof EC.store.save === 'function') EC.store.save(); } catch (e) {} }
  function toast(m) { try { if (EC.ui && typeof EC.ui.toast === 'function') EC.ui.toast(m); } catch (e) {} }
  function addXP(n, r) { try { if (typeof EC.addXP === 'function') EC.addXP(n, r); } catch (e) {} }
  function award(id) { try { if (typeof EC.award === 'function') EC.award(id); } catch (e) {} }
  function todayKey() {
    var t = new Date();
    return t.getFullYear() + '-' + ('0' + (t.getMonth() + 1)).slice(-2) + '-' + ('0' + t.getDate()).slice(-2);
  }
  function words(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9'\s]/g, ' ').split(/\s+/).filter(Boolean); }
  function wordScore(expected, spoken) {
    var ew = words(expected), sw = words(spoken);
    if (!ew.length) return 0;
    var set = {}; for (var i = 0; i < sw.length; i++) set[sw[i]] = true;
    var hit = 0; for (var j = 0; j < ew.length; j++) if (set[ew[j]]) hit++;
    return Math.round(hit / ew.length * 100);
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  function levelFor(score) {
    if (score >= 13) return 5;
    if (score >= 10) return 4;
    if (score >= 7) return 3;
    if (score >= 4) return 2;
    return 1;
  }
  var LEVEL_DESC = {
    1: 'Beginner — basic words & short sentences se shuru karo.',
    2: 'Elementary — daily use wale simple sentences aate hain.',
    3: 'Intermediate — rozmarra ki English me comfortable.',
    4: 'Upper-Intermediate — detail me baat kar sakte ho.',
    5: 'Advanced — fluent & confident!'
  };

  function micInput(container, onText) {
    if (EC.speech && typeof EC.speech.micOrText === 'function') {
      try { EC.speech.micOrText(container, onText); return; } catch (e) {}
    }
    var ta = E('textarea', { class: 'ec-textarea', placeholder: 'Type here… (mic not available)' });
    var btn = E('button', { class: 'ec-btn ec-primary', text: 'Submit ➤' });
    btn.addEventListener('click', function () {
      var v = (ta.value || '').trim();
      if (!v) { toast('Pehle kuch likho 🙂'); return; }
      onText(v);
    });
    container.appendChild(ta); container.appendChild(btn);
  }

  function roadmap(level, weakSkills) {
    var items = [
      '📅 Daily Mission — roz ka mission poora karo (' + (weakSkills[0] || 'speaking') + ' par extra focus)',
      '🎤 Speak tab — roz kam se kam 5 sentences bolo',
      '💬 Conversation — hafte me 2 baar AI se baat karo',
      '📈 Progress — apni common mistakes dekho aur sudhaaro'
    ];
    if (level <= 2) items.unshift('🌱 Pehle Daily Mission ke easy tasks se shuru karo — jaldi mat karo');
    if (level >= 4) items.push('⚔️ Debate mode try karo — advanced thinking ke liye');
    return items;
  }

  function render(container) {
    container.innerHTML = '';
    var wrap = E('div', { class: 'ec-tab' });
    wrap.appendChild(E('h2', { class: 'ec-title', text: '🧪 Placement Test' }));
    container.appendChild(wrap);

    var data = d();
    var placement = data.placement || {};

    if (placement.taken) { renderResult(wrap, placement, false); return; }
    renderIntro(wrap);
  }

  function renderIntro(wrap) {
    var card = E('div', { class: 'ec-card' },
      E('div', { class: 'ec-cardtitle', text: 'Apna level jaano 🎯' }),
      E('div', { class: 'ec-muted', text: '15 questions · 5–7 minute · Grammar, vocabulary, sentence order, listening aur speaking.' }),
      E('div', { class: 'ec-note', text: '⚠️ Ye sirf ek informal estimate hai — official CEFR certificate NAHI hai.' })
    );
    var start = E('button', { class: 'ec-btn ec-primary', text: '▶ Test shuru karo' });
    start.addEventListener('click', function () { runTest(wrap, null); });
    card.appendChild(start);
    wrap.appendChild(card);
  }

  function renderResult(wrap, placement, justRetaken) {
    var card = E('div', { class: 'ec-card' },
      E('div', { class: 'ec-cardtitle', text: '🧪 Tumhara Level' }),
      E('div', { class: 'ec-levelbig', text: 'L' + placement.level }),
      E('div', { text: LEVEL_DESC[placement.level] || '' }),
      E('div', { class: 'ec-muted', text: 'Score: ' + placement.score + '/15 · Date: ' + (placement.date || '') }),
      E('div', { class: 'ec-note', text: '⚠️ Informal estimate only — NOT an official CEFR certificate.' })
    );
    if (justRetaken && placement.prev) {
      var p = placement.prev;
      var dl = placement.score - p.score, dlL = placement.level - p.level;
      card.appendChild(E('div', { class: 'ec-cardtitle', text: '🪞 Old vs New' }));
      card.appendChild(E('div', { class: 'ec-vsnums' },
        E('div', { class: 'ec-vscol' },
          E('div', { class: 'ec-vsbig', text: 'L' + p.level }),
          E('div', { class: 'ec-muted', text: p.date + ' · ' + p.score + '/15' })),
        E('div', { class: 'ec-vsarrow', text: '→' }),
        E('div', { class: 'ec-vscol' },
          E('div', { class: 'ec-vsbig', text: 'L' + placement.level }),
          E('div', { class: 'ec-muted', text: placement.date + ' · ' + placement.score + '/15' }))
      ));
      card.appendChild(E('div', { class: dl >= 0 ? 'ec-good' : 'ec-muted',
        text: dl > 0 ? ('+' + dl + ' points ka improvement! 🎉') : dl === 0 ? 'Score same raha — practice badhao 💪' : (dl + ' points — haar mat maano, roz practice karo 💪') +
        (dlL > 0 ? ' Level up! L' + p.level + ' → L' + placement.level + ' 🏆' : '') }));
    }
    var rm = E('div', { class: 'ec-card' }, E('div', { class: 'ec-cardtitle', text: '🗺 Tumhara Roadmap' }));
    var weak = placement.weakSkills || ['speaking'];
    roadmap(placement.level, weak).forEach(function (r) { rm.appendChild(E('div', { class: 'ec-road', text: r })); });
    var retake = E('button', { class: 'ec-btn', text: '🔁 Re-take test (har 4–6 hafte me)' });
    retake.addEventListener('click', function () { runTest(wrap, placement); });
    wrap.appendChild(card); wrap.appendChild(rm); wrap.appendChild(retake);
  }

  function runTest(wrap, prevPlacement) {
    wrap.innerHTML = '';
    wrap.appendChild(E('h2', { class: 'ec-title', text: '🧪 Placement Test' }));
    var state = { i: 0, score: 0, skillScore: {} };
    var prog = E('div', { class: 'ec-muted' });
    var qbox = E('div', { class: 'ec-card' });
    wrap.appendChild(prog); wrap.appendChild(qbox);

    function addScore(skill, pts) {
      state.score += pts;
      state.skillScore[skill] = (state.skillScore[skill] || 0) + pts;
    }
    function next() {
      state.i++;
      if (state.i >= BANK.length) finish();
      else showQ();
    }
    function showQ() {
      var q = BANK[state.i];
      qbox.innerHTML = '';
      prog.textContent = 'Question ' + (state.i + 1) + '/' + BANK.length;
      if (q.type === 'mcq') {
        qbox.appendChild(E('div', { class: 'ec-q', text: q.q }));
        q.options.forEach(function (opt, idx) {
          var b = E('button', { class: 'ec-btn ec-opt', text: opt });
          b.addEventListener('click', function () {
            if (idx === q.answer) { addScore(q.skill, 1); toast('Sahi! ✅'); }
            else toast('Galat — sahi: ' + q.options[q.answer]);
            next();
          });
          qbox.appendChild(b);
        });
      } else if (q.type === 'order') {
        qbox.appendChild(E('div', { class: 'ec-muted', text: 'Words ko sahi order me lagao (tap karo):' }));
        var ans = E('div', { class: 'ec-orderans' });
        var pool = E('div', { class: 'ec-chips' });
        var picked = [];
        // NOTE: pool order stays stable (shuffled once) so taps don't reshuffle
        var stable = shuffle(q.words);
        function repaint2() {
          ans.innerHTML = ''; pool.innerHTML = '';
          picked.forEach(function (w, pi) {
            var c = E('button', { class: 'ec-chip ec-chip-on', text: w });
            c.addEventListener('click', function () { picked.splice(pi, 1); repaint2(); });
            ans.appendChild(c);
          });
          stable.forEach(function (w) {
            var used = 0;
            for (var k = 0; k < picked.length; k++) if (picked[k] === w) used++;
            var total = 0;
            for (var m = 0; m < stable.length; m++) if (stable[m] === w) total++;
            if (used >= total) return;
            var c = E('button', { class: 'ec-chip', text: w });
            c.addEventListener('click', function () { picked.push(w); repaint2(); });
            pool.appendChild(c);
          });
        }
        repaint2();
        qbox.appendChild(ans); qbox.appendChild(pool);
        var check = E('button', { class: 'ec-btn ec-primary', text: 'Check ➤' });
        check.addEventListener('click', function () {
          var got = picked.join(' ').toLowerCase().replace(/\s+/g, ' ').trim();
          var want = q.answer.toLowerCase().trim();
          if (got === want) { addScore(q.skill, 1); toast('Perfect order! ✅'); }
          else toast('Sahi order: ' + q.answer);
          next();
        });
        qbox.appendChild(check);
      } else if (q.type === 'listening') {
        qbox.appendChild(E('div', { class: 'ec-muted', text: '🔊 Suno aur type karo — tumne kya suna?' }));
        var play = E('button', { class: 'ec-btn', text: '🔊 Play' });
        play.addEventListener('click', function () {
          try { if (EC.speech && typeof EC.speech.speak === 'function') EC.speech.speak(q.line); } catch (e) {}
        });
        qbox.appendChild(play);
        var ta = E('textarea', { class: 'ec-textarea', placeholder: 'What did you hear?' });
        var sub = E('button', { class: 'ec-btn ec-primary', text: 'Submit ➤' });
        sub.addEventListener('click', function () {
          var v = (ta.value || '').trim();
          if (!v) { toast('Pehle kuch likho 🙂'); return; }
          var pct = wordScore(q.line, v);
          if (pct >= 60) { addScore(q.skill, 1); toast('Sahi suna! 👂 +' + pct + '%'); }
          else toast('Match ' + pct + '% — line thi: "' + q.line + '"');
          next();
        });
        qbox.appendChild(ta); qbox.appendChild(sub);
      } else if (q.type === 'speaking') {
        qbox.appendChild(E('div', { class: 'ec-q', text: '🎤 ' + q.prompt }));
        var holder = E('div');
        micInput(holder, function (spoken) {
          var pts = 0;
          if (EC.ai && typeof EC.ai.analyzeSentence === 'function') {
            try {
              var res = EC.ai.analyzeSentence(spoken) || {};
              var acc = (typeof res.accuracy === 'number') ? res.accuracy : 60;
              pts = acc >= 70 ? 1 : 0;
              toast(acc >= 70 ? 'Badhaas! ✅' : 'Bolne ki koshish achhi — accuracy ' + Math.round(acc) + '%');
            } catch (e) { pts = words(spoken).length >= 5 ? 1 : 0; }
          } else {
            pts = words(spoken).length >= 5 ? 1 : 0;
            toast('Engine loading… — effort ke liye point 🙂');
          }
          addScore(q.skill, pts);
          next();
        });
        qbox.appendChild(holder);
      }
    }
    function finish() {
      var total = Math.round(state.score);
      var level = levelFor(total);
      var weakSkills = Object.keys(state.skillScore).sort(function (a, b) { return state.skillScore[a] - state.skillScore[b]; });
      var placement = { taken: true, date: todayKey(), score: total, level: level, weakSkills: weakSkills.slice(0, 2) };
      if (prevPlacement) placement.prev = { score: prevPlacement.score, level: prevPlacement.level, date: prevPlacement.date };
      try {
        var dd = d();
        dd.placement = placement;
        if (dd.profile) dd.profile.level = level;
        save();
      } catch (e) {}
      addXP(30, 'placement test');
      award('placement_done');
      toast('Test complete! +30 XP ⭐');
      wrap.innerHTML = '';
      wrap.appendChild(E('h2', { class: 'ec-title', text: '🧪 Placement Test' }));
      renderResult(wrap, placement, !!prevPlacement);
    }
    showQ();
  }

  EC.register('placement', { title: 'Placement Test', icon: '🧪', render: render });
})();
