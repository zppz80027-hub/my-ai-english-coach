/* My AI English Coach — TAB GROUP A
 * Tab: conversation 💬
 * Topics, 5 modes (Normal / Strict Teacher / Shadowing / Debate / Roleplay),
 * roleplay personas, chat with micOrText, strict inline corrections,
 * shadowing repeat-scoring, end-chat summary with XP.
 */
(function () {
  'use strict';
  if (typeof EC === 'undefined' || !EC || typeof EC.register !== 'function') return;

  var TOPICS = ['college', 'friends', 'coding', 'interview', 'travel', 'daily-routine', 'movies', 'free-chat'];
  var MODES = [
    { id: 'normal', label: 'Normal 🙂' },
    { id: 'strict', label: 'Strict Teacher 🧑‍🏫' },
    { id: 'shadowing', label: 'Shadowing 🔁' },
    { id: 'debate', label: 'Debate ⚔️' },
    { id: 'roleplay', label: 'Roleplay 🎭' }
  ];
  var PERSONAS = ['HR Manager', 'Strict Professor', 'Friendly Senior', 'Foreign Client', 'Café Stranger'];

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
  function logMistake(m) { try { if (typeof EC.logMistake === 'function') EC.logMistake(m); } catch (e) {} }
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

  function botSay(mode, topic, persona, history) {
    if (EC.ai && typeof EC.ai.generateConversation === 'function') {
      try {
        var r = EC.ai.generateConversation(mode, topic, persona, history);
        if (r) return r;
      } catch (e) {}
    }
    toast('Engine loading…');
    var fallbacks = {
      normal: 'Nice! Tell me more about ' + topic + '. 🙂',
      strict: 'Good. Now say that again — but with correct grammar this time. 🧑‍🏫',
      shadowing: 'Repeat after me, exactly: "Practice makes perfect."',
      debate: 'I disagree! ' + topic + ' is overrated. Change my mind. ⚔️',
      roleplay: 'Hello! I am your ' + (persona || 'partner') + '. Let\'s talk about ' + topic + '.'
    };
    return fallbacks[mode] || fallbacks.normal;
  }

  function bubble(role, text) {
    return E('div', { class: 'ec-msg ec-' + role }, E('div', { text: text }));
  }

  function micInput(container, onText) {
    if (EC.speech && typeof EC.speech.micOrText === 'function') {
      try { EC.speech.micOrText(container, onText); return; } catch (e) {}
    }
    var ta = E('textarea', { class: 'ec-textarea', placeholder: 'Type your reply… (mic not available)' });
    var btn = E('button', { class: 'ec-btn ec-primary', text: 'Send ➤' });
    btn.addEventListener('click', function () {
      var v = (ta.value || '').trim();
      if (!v) { toast('Pehle kuch likho 🙂'); return; }
      ta.value = '';
      onText(v);
    });
    container.appendChild(ta); container.appendChild(btn);
  }

  function render(container) {
    container.innerHTML = '';
    var wrap = E('div', { class: 'ec-tab' });
    wrap.appendChild(E('h2', { class: 'ec-title', text: '💬 Conversation with AI' }));

    var state = { topic: 'free-chat', mode: 'normal', persona: PERSONAS[0], history: [], started: false, turns: 0 };

    // topic chips
    var topicRow = E('div', { class: 'ec-chips' });
    var topicBtns = {};
    TOPICS.forEach(function (t) {
      var b = E('button', { class: 'ec-chip' + (t === state.topic ? ' ec-chip-on' : ''), text: t });
      b.addEventListener('click', function () {
        state.topic = t;
        for (var k in topicBtns) topicBtns[k].classList.remove('ec-chip-on');
        b.classList.add('ec-chip-on');
      });
      topicBtns[t] = b; topicRow.appendChild(b);
    });

    // mode buttons
    var modeRow = E('div', { class: 'ec-chips' });
    var modeBtns = {};
    MODES.forEach(function (m) {
      var b = E('button', { class: 'ec-chip' + (m.id === state.mode ? ' ec-chip-on' : ''), text: m.label });
      b.addEventListener('click', function () {
        state.mode = m.id;
        for (var k in modeBtns) modeBtns[k].classList.remove('ec-chip-on');
        b.classList.add('ec-chip-on');
        personaWrap.style.display = (m.id === 'roleplay') ? '' : 'none';
      });
      modeBtns[m.id] = b; modeRow.appendChild(b);
    });

    // persona picker (roleplay only)
    var personaWrap = E('div', { class: 'ec-card', style: { display: 'none' } },
      E('div', { class: 'ec-cardtitle', text: '🎭 Choose your roleplay partner' }));
    var personaSel = E('select', { class: 'ec-select' });
    PERSONAS.forEach(function (p) {
      var o = E('option', { value: p, text: p });
      personaSel.appendChild(o);
    });
    try { personaSel.value = state.persona; } catch (e) {}
    personaSel.addEventListener('change', function () { state.persona = personaSel.value; });
    personaWrap.appendChild(personaSel);

    // chat window + input + controls
    var chatWin = E('div', { class: 'ec-chatwin' });
    var inputWrap = E('div', { class: 'ec-card' });
    var controls = E('div', { class: 'ec-row' });
    var startBtn = E('button', { class: 'ec-btn ec-primary', text: '▶ Start chat' });
    var endBtn = E('button', { class: 'ec-btn', text: '⏹ End chat', style: { display: 'none' } });
    controls.appendChild(startBtn); controls.appendChild(endBtn);

    wrap.appendChild(E('div', { class: 'ec-muted', text: 'Topic chuno:' })); wrap.appendChild(topicRow);
    wrap.appendChild(E('div', { class: 'ec-muted', text: 'Mode chuno:' })); wrap.appendChild(modeRow);
    wrap.appendChild(personaWrap);
    wrap.appendChild(controls);
    wrap.appendChild(chatWin);
    wrap.appendChild(inputWrap);
    container.appendChild(wrap);

    function scrollDown() { try { chatWin.scrollTop = chatWin.scrollHeight; } catch (e) {} }

    function addBot(text) {
      var row = E('div');
      row.appendChild(bubble('bot', text));
      // shadowing: "Repeat exactly" + score button under every bot line
      if (state.mode === 'shadowing' && state.started) {
        var rptBtn = E('button', { class: 'ec-btn ec-small', text: '🎤 Repeat exactly' });
        var rptOut = E('div');
        rptBtn.addEventListener('click', function () {
          rptOut.innerHTML = '';
          micInput(rptOut, function (spoken) {
            var pct;
            try {
              pct = (EC.ai && typeof EC.ai.scoreRepeat === 'function') ? EC.ai.scoreRepeat(text, spoken) : wordScore(text, spoken);
            } catch (e) { pct = wordScore(text, spoken); }
            pct = Math.max(0, Math.min(100, Math.round(pct)));
            rptOut.innerHTML = '';
            rptOut.appendChild(E('div', { class: pct >= 80 ? 'ec-good' : 'ec-muted',
              text: 'Match: ' + pct + '%' + (pct >= 80 ? ' — ekdum sahi! 🔁' : ' — dobara try karo 💪') }));
            if (pct >= 80) addXP(5, 'shadowing');
            if (pct >= 90) award('repeat_90');
            save();
          });
        });
        row.appendChild(rptBtn); row.appendChild(rptOut);
      }
      chatWin.appendChild(row); scrollDown();
    }

    function strictCorrection(userText) {
      if (!EC.ai || typeof EC.ai.analyzeSentence !== 'function') return;
      var res; try { res = EC.ai.analyzeSentence(userText) || {}; } catch (e) { return; }
      var mistakes = res.mistakes || [];
      if (!mistakes.length) {
        chatWin.appendChild(E('div', { class: 'ec-strict-ok', text: '🧑‍🏫 Strict Teacher: No mistakes. Well done!' }));
      } else {
        var m0 = mistakes[0];
        var card = E('div', { class: 'ec-card ec-strict' },
          E('div', { class: 'ec-fb-head', text: '🧑‍🏫 Strict Teacher correction' }),
          E('div', { text: '❌ ' + userText }),
          E('div', { class: 'ec-correct', text: '✅ ' + (res.corrected || userText) }),
          E('div', { class: 'ec-muted', text: '🧠 ' + (m0.why || '') + (m0.hinglish ? ' 🇮🇳 ' + m0.hinglish : '') })
        );
        chatWin.appendChild(card);
        for (var i = 0; i < mistakes.length; i++) {
          logMistake({ category: mistakes[i].category || 'general', spanText: mistakes[i].spanText || '', fix: mistakes[i].fix || '', date: todayKey(), source: 'conversation' });
        }
      }
      scrollDown();
    }

    function onUser(text) {
      if (!state.started) return;
      state.history.push({ role: 'user', text: text });
      chatWin.appendChild(bubble('user', text));
      if (state.mode === 'strict') strictCorrection(text);
      state.turns++;
      bumpSkill('speaking', 1); bumpSkill('fluency', 1);
      var reply = botSay(state.mode, state.topic, state.persona, state.history);
      state.history.push({ role: 'bot', text: reply });
      addBot(reply);
    }

    startBtn.addEventListener('click', function () {
      state.started = true; state.turns = 0; state.history = [];
      chatWin.innerHTML = ''; inputWrap.innerHTML = '';
      startBtn.style.display = 'none'; endBtn.style.display = '';
      var first = botSay(state.mode, state.topic, state.persona, state.history);
      state.history.push({ role: 'bot', text: first });
      addBot(first);
      micInput(inputWrap, onUser);
      toast('Chat shuru! End chat dabana mat bhoolna 🙂');
    });

    endBtn.addEventListener('click', function () {
      if (!state.started) return;
      state.started = false;
      inputWrap.innerHTML = '';
      endBtn.style.display = 'none'; startBtn.style.display = '';
      startBtn.textContent = '▶ Start new chat';
      var xp = Math.min(60, state.turns * 5);
      addXP(xp, 'conversation');
      bumpSkill('speaking', Math.min(5, state.turns));
      bumpSkill('fluency', Math.min(5, state.turns));
      if (state.turns >= 10) award('chat_10');
      try {
        var dd = d(); dd.sessions = dd.sessions || [];
        dd.sessions.push({ date: todayKey(), ts: Date.now(), kind: 'conversation', topic: state.topic, mode: state.mode, turns: state.turns, minutes: state.turns, xp: xp });
        save();
      } catch (e) {}
      var summary = E('div', { class: 'ec-card ec-summary' },
        E('div', { class: 'ec-cardtitle', text: '📋 Session Summary' }),
        E('div', { text: '💬 Turns: ' + state.turns }),
        E('div', { text: '⭐ XP earned: +' + xp }),
        E('div', { text: '🎯 Topic: ' + state.topic + ' · Mode: ' + state.mode }),
        E('div', { class: 'ec-muted', text: state.turns >= 10 ? 'Shandaar! 10+ turns — keep talking! 🗣️' : 'Agle chat me aur zyada bolo — practice hi fluency hai 💪' })
      );
      chatWin.appendChild(summary); scrollDown();
      toast('+' + xp + ' XP ⭐');
    });
  }

  EC.register('conversation', { title: 'Conversation', icon: '💬', render: render });
})();
