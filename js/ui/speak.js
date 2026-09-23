/* My AI English Coach — TAB GROUP A
 * Tab: speak 🎤 "Speak with AI"
 * mic-or-text input -> EC.ai.analyzeSentence -> SMART FEEDBACK CARD
 * + 🎤 Repeat (word-match score) + ➡️ Next. +10 XP per analyzed sentence.
 */
(function () {
  'use strict';
  if (typeof EC === 'undefined' || !EC || typeof EC.register !== 'function') return;

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
  function addXP(n, reason) { try { if (typeof EC.addXP === 'function') EC.addXP(n, reason); } catch (e) {} }
  function bumpSkill(s, dl) { try { if (typeof EC.bumpSkill === 'function') EC.bumpSkill(s, dl); } catch (e) {} }
  function logMistake(m) { try { if (typeof EC.logMistake === 'function') EC.logMistake(m); } catch (e) {} }
  function award(id) { try { if (typeof EC.award === 'function') EC.award(id); } catch (e) {} }
  function speakBtn(text) {
    try {
      if (EC.ui && typeof EC.ui.speakBtn === 'function') return EC.ui.speakBtn(text);
    } catch (e) {}
    var b = E('button', { class: 'ec-btn', text: '🔊 Listen' });
    b.addEventListener('click', function () {
      try { if (EC.speech && typeof EC.speech.speak === 'function') EC.speech.speak(text); } catch (e2) {}
    });
    return b;
  }
  function todayKey() {
    var t = new Date();
    return t.getFullYear() + '-' + ('0' + (t.getMonth() + 1)).slice(-2) + '-' + ('0' + t.getDate()).slice(-2);
  }

  function words(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9'\s]/g, ' ').split(/\s+/).filter(Boolean);
  }
  /* % of expected words found in spoken */
  function wordScore(expected, spoken) {
    var ew = words(expected), sw = words(spoken);
    if (!ew.length) return 0;
    var set = {};
    for (var i = 0; i < sw.length; i++) set[sw[i]] = true;
    var hit = 0;
    for (var j = 0; j < ew.length; j++) if (set[ew[j]]) hit++;
    return Math.round(hit / ew.length * 100);
  }

  /* Highlight mistake spans in red inside the sentence */
  function highlightSentence(text, mistakes) {
    var withSpan = [], plain = [];
    for (var i = 0; i < mistakes.length; i++) {
      var m = mistakes[i] || {};
      if (m.span && m.span.length === 2 && typeof m.span[0] === 'number') withSpan.push(m); else plain.push(m);
    }
    withSpan.sort(function (a, b) { return a.span[0] - b.span[0]; });
    var parts = [], pos = 0;
    for (var k = 0; k < withSpan.length; k++) {
      var s = Math.max(0, withSpan[k].span[0]);
      var e2 = Math.min(text.length, withSpan[k].span[1]);
      if (s > pos) parts.push(text.slice(pos, s));
      if (e2 > s) { parts.push(E('span', { class: 'ec-err', text: text.slice(s, e2) })); pos = e2; }
    }
    if (pos < text.length) parts.push(text.slice(pos));
    // fallback: highlight by spanText occurrence for mistakes without spans
    var box = E('div', { class: 'ec-said' });
    if (parts.length) { for (var p = 0; p < parts.length; p++) box.appendChild(parts[p]); }
    else box.appendChild(E('span', { text: text }));
    for (var q = 0; q < plain.length; q++) {
      var st = plain[q].spanText;
      if (st && box.textContent.indexOf(st) !== -1) {
        box.appendChild(E('div', { class: 'ec-errline' }, E('span', { class: 'ec-err', text: st })));
      }
    }
    return box;
  }

  function applyFixes(text, mistakes) {
    var fixed = withSpanOnly(mistakes);
    fixed.sort(function (a, b) { return b.span[0] - a.span[0]; });
    var out = text;
    for (var i = 0; i < fixed.length; i++) {
      var m = fixed[i];
      if (m.fix) out = out.slice(0, m.span[0]) + m.fix + out.slice(m.span[1]);
    }
    return out;
  }
  function withSpanOnly(mistakes) {
    var r = [];
    for (var i = 0; i < mistakes.length; i++) {
      var m = mistakes[i];
      if (m && m.span && m.span.length === 2) r.push(m);
    }
    return r;
  }

  function meter(label, pct, color) {
    pct = Math.max(0, Math.min(100, Math.round(pct)));
    return E('div', { class: 'ec-meter' },
      E('div', { class: 'ec-meter-top' }, E('span', { text: label }), E('span', { text: pct + '%' })),
      E('div', { class: 'ec-bar' }, E('div', { class: 'ec-barfill', style: { width: pct + '%', background: color } }))
    );
  }

  function micInput(container, onText, btnLabel) {
    if (EC.speech && typeof EC.speech.micOrText === 'function') {
      try { EC.speech.micOrText(container, onText); return; } catch (e) {}
    }
    // fallback: plain textarea + button
    var ta = E('textarea', { class: 'ec-textarea', placeholder: 'Type your sentence here… (mic not available)' });
    var btn = E('button', { class: 'ec-btn ec-primary', text: btnLabel || 'Analyze ➤' });
    btn.addEventListener('click', function () {
      var v = (ta.value || '').trim();
      if (!v) { toast('Pehle kuch likho / bolo 🙂'); return; }
      onText(v);
    });
    container.appendChild(ta); container.appendChild(btn);
  }

  function render(container) {
    container.innerHTML = '';
    var wrap = E('div', { class: 'ec-tab' });
    wrap.appendChild(E('h2', { class: 'ec-title', text: '🎤 Speak with AI' }));
    wrap.appendChild(E('div', { class: 'ec-muted', text: 'Bolo ya likho — AI tumhari galti pakdega aur sahi karna sikhayega.' }));

    var inputWrap = E('div', { class: 'ec-card' });
    var outWrap = E('div');
    wrap.appendChild(inputWrap);
    wrap.appendChild(outWrap);
    container.appendChild(wrap);

    function newInput() {
      inputWrap.innerHTML = '';
      inputWrap.appendChild(E('div', { class: 'ec-cardtitle', text: '🗣️ Say something in English' }));
      micInput(inputWrap, onText, 'Analyze ➤');
    }

    function onText(text) {
      if (!EC.ai || typeof EC.ai.analyzeSentence !== 'function') { toast('Engine loading…'); return; }
      var res;
      try { res = EC.ai.analyzeSentence(text) || {}; } catch (e) { toast('Engine loading…'); return; }
      var mistakes = res.mistakes || [];
      var corrected = res.corrected || applyFixes(text, mistakes) || text;
      var natural = res.natural || res.moreNatural || corrected;
      var accuracy = (typeof res.accuracy === 'number') ? res.accuracy : (mistakes.length ? Math.max(0, 100 - mistakes.length * 15) : 95);
      var flu = res.fluency || {};
      var fluencyScore = (typeof flu.score === 'number') ? flu.score : 70;
      var fillers = (typeof flu.fillers === 'number') ? flu.fillers : 0;

      outWrap.innerHTML = '';
      var card = E('div', { class: 'ec-card ec-feedback' });

      // 🗣️ What You Said (mistakes highlighted red)
      card.appendChild(E('div', { class: 'ec-fb-sec' },
        E('div', { class: 'ec-fb-head', text: '🗣️ What You Said' }),
        highlightSentence(text, mistakes)));

      // ❌ Mistakes + 🧠 Why + 🇮🇳 Hinglish (per mistake)
      if (!mistakes.length) {
        card.appendChild(E('div', { class: 'ec-fb-sec' },
          E('div', { class: 'ec-fb-head', text: '❌ Mistake' }),
          E('div', { class: 'ec-good', text: 'Koi galti nahi mili — perfect! 🎉' })));
      } else {
        for (var i = 0; i < mistakes.length; i++) {
          (function (m) {
            var sec = E('div', { class: 'ec-fb-sec' },
              E('div', { class: 'ec-fb-head', text: '❌ Mistake: ' + (m.label || m.category || 'error') }),
              E('div', { class: 'ec-muted', text: m.category ? ('Category: ' + m.category) : '' }),
              E('div', { class: 'ec-fb-head', text: '🧠 Why' }),
              E('div', { text: m.why || 'Is sentence me thodi sudhaar ki zaroorat hai.' }),
              E('div', { class: 'ec-fb-head', text: '🇮🇳 Hinglish me samjho' }),
              E('div', { text: m.hinglish || m.why || '' })
            );
            card.appendChild(sec);
            logMistake({ category: m.category || 'general', spanText: m.spanText || '', fix: m.fix || '', date: todayKey(), source: 'speak' });
          })(mistakes[i]);
        }
      }

      // ✅ Correct Sentence
      card.appendChild(E('div', { class: 'ec-fb-sec' },
        E('div', { class: 'ec-fb-head', text: '✅ Correct Sentence' }),
        E('div', { class: 'ec-correct', text: corrected })));

      // ⭐ More Natural
      card.appendChild(E('div', { class: 'ec-fb-sec' },
        E('div', { class: 'ec-fb-head', text: '⭐ More Natural' }),
        E('div', { class: 'ec-natural', text: natural })));

      // 🔊 Listen
      var listenRow = E('div', { class: 'ec-fb-sec' },
        E('div', { class: 'ec-fb-head', text: '🔊 Listen' }));
      listenRow.appendChild(speakBtn(corrected + '. ' + natural));
      card.appendChild(listenRow);

      // Fluency vs Accuracy split
      var split = E('div', { class: 'ec-fb-sec' },
        E('div', { class: 'ec-fb-head', text: '📊 Fluency vs Accuracy' }));
      split.appendChild(meter('🎯 Accuracy (sahi grammar/words)', accuracy, '#3b82f6'));
      split.appendChild(meter('🌊 Fluency (bina ruke bolna)', fluencyScore, '#22c55e'));
      if (fillers) split.appendChild(E('div', { class: 'ec-muted', text: 'Filler words ("um", "uh", "like"): ' + fillers + ' — inhe kam karo, fluency badhegi.' }));
      card.appendChild(split);

      // 🎤 Repeat
      var repeatSec = E('div', { class: 'ec-fb-sec' },
        E('div', { class: 'ec-fb-head', text: '🎤 Repeat (corrected sentence bolo)' }),
        E('div', { class: 'ec-muted', text: 'Target: “' + corrected + '”' }));
      var repeatBtn = E('button', { class: 'ec-btn', text: '🎤 Repeat abhi' });
      var repeatOut = E('div');
      repeatBtn.addEventListener('click', function () {
        repeatOut.innerHTML = '';
        micInput(repeatOut, function (spoken) {
          var pct = wordScore(corrected, spoken);
          repeatOut.innerHTML = '';
          repeatOut.appendChild(E('div', { class: pct >= 80 ? 'ec-good' : 'ec-muted', text: 'Match: ' + pct + '%' + (pct >= 80 ? ' — bahut badhiya! 🎯' : ' — ek baar aur try karo 💪') }));
          if (pct >= 80) { addXP(5, 'repeat'); }
          if (pct >= 90) award('repeat_90');
          save();
        }, 'Check ➤');
      });
      repeatSec.appendChild(repeatBtn); repeatSec.appendChild(repeatOut);
      card.appendChild(repeatSec);

      // ➡️ Next
      var nextBtn = E('button', { class: 'ec-btn ec-primary', text: '➡️ Next' });
      nextBtn.addEventListener('click', function () { outWrap.innerHTML = ''; newInput(); });
      card.appendChild(nextBtn);

      outWrap.appendChild(card);

      // rewards + session log
      addXP(10, 'sentence analyzed');
      bumpSkill('speaking', 2); bumpSkill('fluency', 1);
      try {
        var dd = d(); dd.sessions = dd.sessions || [];
        dd.sessions.push({ date: todayKey(), ts: Date.now(), kind: 'speak', accuracy: accuracy, minutes: 1 });
        award('first_sentence');
        save();
      } catch (e) {}
      toast('+10 XP ⭐');
    }

    newInput();
  }

  EC.register('speak', { title: 'Speak', icon: '🎤', render: render });
})();
