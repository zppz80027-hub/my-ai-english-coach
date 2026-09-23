/* My AI English Coach — TAB GROUP A
 * Tab: daily 📅 "Daily Mission"
 * Builds today's task list from EC.data.missionTemplates adapted by
 * EC.ai.recommendFocus() (weakest skill gets 2 tasks / more minutes).
 * Each task card: Start -> inline activity -> Done. Persists in store.daily[YYYY-MM-DD].
 */
(function () {
  'use strict';
  if (typeof EC === 'undefined' || !EC || typeof EC.register !== 'function') return;

  var SKILL_LABEL = {
    speaking: 'Speaking', grammar: 'Grammar', vocabulary: 'Vocabulary',
    pronunciation: 'Pronunciation', fluency: 'Fluency', sentence: 'Sentence Building',
    listening: 'Listening', interview: 'Interview'
  };

  var DEFAULT_TEMPLATES = [
    { id: 't-words', skill: 'vocabulary', label: 'Learn 5 new words', minutes: 10, kind: 'words' },
    { id: 't-speak', skill: 'speaking', label: 'Speak 5 sentences aloud', minutes: 10, kind: 'speaking' },
    { id: 't-grammar', skill: 'grammar', label: 'Grammar drill — 5 questions', minutes: 10, kind: 'grammar' },
    { id: 't-listen', skill: 'listening', label: 'Listen & repeat practice', minutes: 10, kind: 'listening' },
    { id: 't-sentence', skill: 'sentence', label: 'Build 5 sentences', minutes: 10, kind: 'sentence' }
  ];

  var FALLBACK_WORDS = [
    { word: 'improve', meaning: 'behtar banana / sudhaarna' },
    { word: 'confident', meaning: 'aatmavishwaasi' },
    { word: 'achieve', meaning: 'haasil karna (mehnat se)' },
    { word: 'polite', meaning: 'vinamra / tameezdaar' },
    { word: 'practice', meaning: 'abhyaas karna' },
    { word: 'brave', meaning: 'bahaadur' },
    { word: 'honest', meaning: 'imaandaar' },
    { word: 'quickly', meaning: 'jaldi se' }
  ];

  var FALLBACK_GRAMMAR = [
    { q: 'She ___ to school every day.', options: ['go', 'goes', 'going', 'gone'], answer: 1 },
    { q: 'I ___ my homework yesterday.', options: ['do', 'did', 'done', 'doing'], answer: 1 },
    { q: 'There ___ many books on the table.', options: ['is', 'are', 'was', 'be'], answer: 1 },
    { q: 'He has lived here ___ 2020.', options: ['for', 'since', 'from', 'at'], answer: 1 },
    { q: 'If it rains, we ___ at home.', options: ['stayed', 'stay', 'will stay', 'stays'], answer: 2 }
  ];

  var LISTEN_LINES = [
    'Practice makes a man perfect.',
    'I wake up early every morning.',
    'Honesty is the best policy.',
    'She speaks English very well.'
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
  function bumpSkill(s, dl) { try { if (typeof EC.bumpSkill === 'function') EC.bumpSkill(s, dl); } catch (e) {} }
  function touchDay() { try { if (typeof EC.touchDay === 'function') EC.touchDay(); } catch (e) {} }
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

  function gotoTab(id) {
    try {
      if (EC.ui && typeof EC.ui.showTab === 'function') { EC.ui.showTab(id); return; }
      if (EC.tabs && typeof EC.tabs.show === 'function') { EC.tabs.show(id); return; }
      if (typeof document !== 'undefined' && document.querySelector) {
        var el = document.querySelector('[data-tab="' + id + '"]');
        if (el && typeof el.click === 'function') { el.click(); return; }
      }
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('ec:goto-tab', { detail: id }));
        return;
      }
    } catch (e) {}
    toast('Please open the "' + id + '" tab');
  }

  function micInput(container, onText, btnLabel) {
    if (EC.speech && typeof EC.speech.micOrText === 'function') {
      try { EC.speech.micOrText(container, onText); return; } catch (e) {}
    }
    var ta = E('textarea', { class: 'ec-textarea', placeholder: 'Type here… (mic not available)' });
    var btn = E('button', { class: 'ec-btn ec-primary', text: btnLabel || 'Submit ➤' });
    btn.addEventListener('click', function () {
      var v = (ta.value || '').trim();
      if (!v) { toast('Pehle kuch likho 🙂'); return; }
      onText(v);
    });
    container.appendChild(ta); container.appendChild(btn);
  }

  function getTemplates() {
    var t = null;
    try { if (EC.data && EC.data.missionTemplates) t = EC.data.missionTemplates; } catch (e) {}
    if (!t || !t.length) return DEFAULT_TEMPLATES.slice();
    return t.map(function (x, i) {
      return {
        id: x.id || ('t' + i), skill: x.skill || 'speaking',
        label: x.label || x.title || 'Practice', minutes: x.minutes || 10,
        kind: x.kind || x.type || 'generic'
      };
    });
  }

  function weakestSkill() {
    var focus = null;
    try { if (EC.ai && typeof EC.ai.recommendFocus === 'function') focus = EC.ai.recommendFocus(); } catch (e) {}
    if (focus && focus.skill) return focus.skill;
    var sk = d().skills || {}, worst = 'speaking', wv = 101;
    ['speaking', 'grammar', 'vocabulary', 'pronunciation', 'fluency', 'sentence', 'listening', 'interview'].forEach(function (s) {
      var v = parseFloat(sk[s]); if (isNaN(v)) v = 0;
      if (v < wv) { wv = v; worst = s; }
    });
    return worst;
  }

  /* Adapt templates: weakest skill gets 2 tasks and +5 minutes each */
  function buildTasks() {
    var weak = weakestSkill();
    var tasks = getTemplates().map(function (t) {
      return { id: t.id, skill: t.skill, label: t.label, minutes: t.minutes, kind: t.kind, done: false };
    });
    var weakTasks = tasks.filter(function (t) { return t.skill === weak; });
    if (weakTasks.length < 2) {
      var base = weakTasks[0] || { id: 't-weak', skill: weak, label: (SKILL_LABEL[weak] || weak) + ' practice', minutes: 10, kind: 'generic' };
      tasks.push({ id: base.id + '-2', skill: weak, label: base.label + ' (part 2)', minutes: base.minutes + 5, kind: base.kind, done: false });
    }
    tasks.forEach(function (t) { if (t.skill === weak) t.minutes += 5; });
    return tasks;
  }

  function getDay() {
    var data = d(), key = todayKey();
    data.daily = data.daily || {};
    if (!data.daily[key] || !data.daily[key].tasks) {
      data.daily[key] = { tasks: buildTasks(), date: key };
      save();
    }
    return data.daily[key];
  }

  function normWords() {
    var raw = null;
    try { if (EC.data && EC.data.words) raw = EC.data.words; } catch (e) {}
    var out = [];
    if (raw && raw.length) {
      for (var i = 0; i < raw.length && out.length < 12; i++) {
        var w = raw[i];
        if (typeof w === 'string') out.push({ word: w, meaning: '' });
        else if (w) out.push({ word: w.word || w.en || w.term || '', meaning: w.meaning || w.hi || w.hinglish || w.def || '' });
      }
      out = out.filter(function (x) { return x.word; });
    }
    return out.length ? out : FALLBACK_WORDS;
  }

  function grammarQuestions() {
    var q = null;
    try { if (EC.ai && typeof EC.ai.generateExercise === 'function') q = EC.ai.generateExercise('grammar', 5); } catch (e) {}
    if (!q || !q.length) return FALLBACK_GRAMMAR;
    return q.slice(0, 5).map(function (x) {
      return { q: x.q || x.question || '', options: x.options || x.choices || [], answer: (typeof x.answer === 'number' ? x.answer : 0) };
    }).filter(function (x) { return x.q && x.options.length >= 2; });
  }

  /* ---------- inline activities ---------- */

  function wordsActivity(box, task, onDone) {
    var list = normWords().slice(0, 5);
    var i = 0, known = 0;
    function show() {
      box.innerHTML = '';
      if (i >= list.length) {
        box.appendChild(E('div', { class: 'ec-good', text: 'Done! ' + known + '/' + list.length + ' words yaad rahe 🎉' }));
        try {
          var dd = d(); dd.vocab = dd.vocab || {};
          list.forEach(function (w) { dd.vocab[w.word] = true; });
          save();
        } catch (e) {}
        bumpSkill('vocabulary', 3);
        onDone();
        return;
      }
      var w = list[i];
      box.appendChild(E('div', { class: 'ec-muted', text: 'Word ' + (i + 1) + '/' + list.length }));
      box.appendChild(E('div', { class: 'ec-flashword', text: w.word }));
      var meanBtn = E('button', { class: 'ec-btn', text: '👁 Meaning dekho' });
      var meanDiv = E('div', { class: 'ec-muted' });
      meanBtn.addEventListener('click', function () { meanDiv.textContent = '🇮🇳 ' + (w.meaning || '(meaning)'); });
      var row = E('div', { class: 'ec-row' });
      var yes = E('button', { class: 'ec-btn ec-primary', text: '✅ Yaad tha' });
      var no = E('button', { class: 'ec-btn', text: '❌ Nahi aata tha' });
      yes.addEventListener('click', function () { known++; i++; show(); });
      no.addEventListener('click', function () { i++; show(); });
      row.appendChild(yes); row.appendChild(no);
      box.appendChild(meanBtn); box.appendChild(meanDiv); box.appendChild(row);
    }
    show();
  }

  function speakingActivity(box, task, onDone) {
    box.appendChild(E('div', { class: 'ec-muted', text: 'Neeche wali line zor se bolo (ya type karo):' }));
    box.appendChild(E('div', { class: 'ec-said', text: '“' + LISTEN_LINES[Math.floor(Math.random() * LISTEN_LINES.length)] + '”' }));
    var quick = E('div');
    micInput(quick, function (spoken) {
      var line = box.querySelector ? null : null;
      quick.innerHTML = '';
      quick.appendChild(E('div', { class: 'ec-good', text: 'Shabaash! Bolne ki practice ho gayi 🗣️' }));
      bumpSkill('speaking', 2); bumpSkill('pronunciation', 1);
      addXP(5, 'speaking task');
      onDone();
    }, 'Bol diya ✅');
    box.appendChild(quick);
    var goBtn = E('button', { class: 'ec-btn', text: '🎤 Speak tab kholo (detail feedback)' });
    goBtn.addEventListener('click', function () { gotoTab('speak'); });
    box.appendChild(goBtn);
  }

  function grammarActivity(box, task, onDone) {
    var qs = grammarQuestions().slice(0, 5);
    var i = 0, score = 0;
    function show() {
      box.innerHTML = '';
      if (i >= qs.length) {
        box.appendChild(E('div', { class: score >= 3 ? 'ec-good' : 'ec-muted',
          text: 'Score: ' + score + '/' + qs.length + (score >= 3 ? ' — badhiya! 🎉' : ' — practice jaari rakho 💪') }));
        bumpSkill('grammar', 2);
        onDone();
        return;
      }
      var q = qs[i];
      box.appendChild(E('div', { class: 'ec-muted', text: 'Q' + (i + 1) + '/' + qs.length }));
      box.appendChild(E('div', { class: 'ec-q', text: q.q }));
      q.options.forEach(function (opt, idx) {
        var b = E('button', { class: 'ec-btn ec-opt', text: opt });
        b.addEventListener('click', function () {
          if (idx === q.answer) { score++; b.classList.add('ec-opt-ok'); }
          else { b.classList.add('ec-opt-bad'); toast('Sahi jawab: ' + q.options[q.answer]); }
          setTimeout(function () { i++; show(); }, 650);
        });
        box.appendChild(b);
      });
    }
    show();
  }

  function listeningActivity(box, task, onDone) {
    var line = LISTEN_LINES[Math.floor(Math.random() * LISTEN_LINES.length)];
    box.appendChild(E('div', { class: 'ec-muted', text: 'Pehle suno, phir repeat karo:' }));
    var play = E('button', { class: 'ec-btn', text: '🔊 Play line' });
    play.addEventListener('click', function () {
      try { if (EC.speech && typeof EC.speech.speak === 'function') EC.speech.speak(line); } catch (e) {}
    });
    box.appendChild(play);
    var quick = E('div');
    micInput(quick, function (spoken) {
      var pct = wordScore(line, spoken);
      quick.innerHTML = '';
      quick.appendChild(E('div', { class: pct >= 60 ? 'ec-good' : 'ec-muted',
        text: 'Match: ' + pct + '%' + (pct >= 60 ? ' — sunna + bolna dono sahi! 👂' : ' — dobara suno aur try karo 💪') }));
      bumpSkill('listening', 2);
      onDone();
    }, 'Repeat kiya ✅');
    box.appendChild(quick);
  }

  function sentenceActivity(box, task, onDone) {
    var prompts = ['my best friend', 'yesterday evening', 'my dream job', 'a rainy day', 'my phone'];
    var p = prompts[Math.floor(Math.random() * prompts.length)];
    box.appendChild(E('div', { class: 'ec-muted', text: 'Is topic par 1 English sentence banao:' }));
    box.appendChild(E('div', { class: 'ec-flashword', text: '💡 ' + p }));
    var quick = E('div');
    micInput(quick, function (spoken) {
      var ok = words(spoken).length >= 3;
      quick.innerHTML = '';
      if (ok && EC.ai && typeof EC.ai.analyzeSentence === 'function') {
        var res; try { res = EC.ai.analyzeSentence(spoken) || {}; } catch (e) { res = {}; }
        quick.appendChild(E('div', { class: 'ec-correct', text: '✅ ' + (res.corrected || spoken) }));
      } else {
        quick.appendChild(E('div', { class: 'ec-good', text: ok ? 'Good sentence! ✅' : 'Thoda lamba sentence try karo 🙂' }));
      }
      bumpSkill('sentence', 2);
      onDone();
    }, 'Sentence banaya ✅');
    box.appendChild(quick);
  }

  function genericActivity(box, task, onDone) {
    box.appendChild(E('div', { class: 'ec-muted', text: task.minutes + ' minute is par focus karo, phir Done dabao. Timer tumhare saath hai ⏱' }));
    var left = task.minutes * 60, tdiv = E('div', { class: 'ec-flashword', text: '' });
    function fmt(s) { return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
    tdiv.textContent = fmt(left);
    box.appendChild(tdiv);
    var iv = setInterval(function () {
      left--;
      if (left <= 0) { clearInterval(iv); tdiv.textContent = 'Time up! 🎉'; onDone(); return; }
      tdiv.textContent = fmt(left);
    }, 1000);
    var early = E('button', { class: 'ec-btn', text: '⏩ Finish early' });
    early.addEventListener('click', function () { clearInterval(iv); onDone(); });
    box.appendChild(early);
  }

  /* ---------- render ---------- */

  function render(container) {
    container.innerHTML = '';
    var wrap = E('div', { class: 'ec-tab' });
    wrap.appendChild(E('h2', { class: 'ec-title', text: '📅 Daily Mission' }));
    var weak = weakestSkill();
    wrap.appendChild(E('div', { class: 'ec-muted',
      text: 'Aaj ka focus: ' + (SKILL_LABEL[weak] || weak) + ' 🎯 (weakest skill ko extra time)' }));

    var day = getDay();
    var progWrap = E('div', { class: 'ec-card' });
    wrap.appendChild(progWrap);

    function paintProgress() {
      progWrap.innerHTML = '';
      var doneN = day.tasks.filter(function (t) { return t.done; }).length;
      var pct = day.tasks.length ? Math.round(doneN / day.tasks.length * 100) : 0;
      progWrap.appendChild(E('div', { class: 'ec-meter-top' },
        E('span', { text: 'Aaj ki progress' }), E('span', { text: doneN + '/' + day.tasks.length + ' (' + pct + '%)' })));
      progWrap.appendChild(E('div', { class: 'ec-bar ec-bigbar' },
        E('div', { class: 'ec-barfill', style: { width: pct + '%' } })));
      if (doneN === day.tasks.length && day.tasks.length) {
        progWrap.appendChild(E('div', { class: 'ec-good', text: '🎉 Mission complete! Kal phir milte hain.' }));
      }
    }

    function completeTask(task) {
      if (task.done) return;
      task.done = true;
      var xp = Math.max(5, task.minutes);
      addXP(xp, 'daily task');
      bumpSkill(task.skill, 2);
      touchDay();
      save(); paintProgress();
      var doneN = day.tasks.filter(function (t) { return t.done; }).length;
      if (doneN === day.tasks.length) {
        addXP(20, 'daily mission complete');
        award('mission_done');
        toast('🎉 Daily mission complete! +20 bonus XP');
      } else {
        toast('+' + xp + ' XP ⭐ (' + doneN + '/' + day.tasks.length + ')');
      }
    }

    day.tasks.forEach(function (task) {
      var card = E('div', { class: 'ec-card ec-task' + (task.done ? ' ec-task-done' : '') });
      var head = E('div', { class: 'ec-taskhead' },
        E('div', {},
          E('div', { class: 'ec-tasklabel', text: (task.done ? '✅ ' : '') + task.label }),
          E('div', { class: 'ec-muted', text: (SKILL_LABEL[task.skill] || task.skill) + ' · ' + task.minutes + ' min' })
        ));
      var actBox = E('div', { class: 'ec-activity', style: { display: 'none' } });
      var doneBtn = E('button', { class: 'ec-btn ec-primary ec-small', text: task.done ? 'Done ✓' : 'Done' });
      if (task.done) doneBtn.setAttribute('disabled', 'true');

      var startBtn = E('button', { class: 'ec-btn ec-small', text: task.done ? 'Review' : '▶ Start' });
      startBtn.addEventListener('click', function () {
        var open = actBox.style.display !== 'none';
        actBox.style.display = open ? 'none' : '';
        if (!open && !actBox.children.length) {
          var kind = task.kind;
          var finish = function () { /* activity finished its internal flow; user still taps Done */ };
          if (kind === 'words') wordsActivity(actBox, task, finish);
          else if (kind === 'speaking') speakingActivity(actBox, task, finish);
          else if (kind === 'grammar') grammarActivity(actBox, task, finish);
          else if (kind === 'listening') listeningActivity(actBox, task, finish);
          else if (kind === 'sentence') sentenceActivity(actBox, task, finish);
          else genericActivity(actBox, task, finish);
        }
        startBtn.textContent = (actBox.style.display !== 'none') ? '▲ Hide' : (task.done ? 'Review' : '▶ Start');
      });
      doneBtn.addEventListener('click', function () {
        completeTask(task);
        card.classList.add('ec-task-done');
        doneBtn.textContent = 'Done ✓';
        doneBtn.setAttribute('disabled', 'true');
        head.children[0].children[0].textContent = '✅ ' + task.label;
      });

      head.appendChild(E('div', { class: 'ec-row' }, startBtn, doneBtn));
      card.appendChild(head); card.appendChild(actBox);
      wrap.appendChild(card);
    });

    paintProgress();
    container.appendChild(wrap);
  }

  EC.register('daily', { title: 'Daily Mission', icon: '📅', render: render });
})();
