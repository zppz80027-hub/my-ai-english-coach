/* My AI English Coach - core infrastructure.
   Plain old script (no ES modules) so it runs from file:// on Android Chrome.
   Exposes window.EC: store, tab registry, ui helpers, speech, xp/streak,
   achievements, mistakes log and skill levels. */
(function () {
  'use strict';
  var EC = (window.EC = window.EC || {});

  /* ================= Store ================= */
  var KEY = 'ec_coach_v1';

  function defaults() {
    return {
      v: 1,
      profile: { name: '', level: 2, targetLevel: 4, dailyGoal: 30, planLength: 30, accentGoal: 'neutral', quietHours: { from: '22:00', to: '07:00' } },
      xp: 0,
      streak: { current: 0, longest: 0, lastDay: '', freezes: 1 },
      skills: { speaking: 40, grammar: 40, vocabulary: 40, pronunciation: 40, fluency: 40, sentence: 40, listening: 40, interview: 40 },
      mistakes: [],
      vocab: {},
      verbs: {},
      daily: {},
      achievements: [],
      placement: { taken: false, date: '', score: 0, level: 0 },
      sessions: [],
      weekFocus: { skill: 'grammar', start: '' },
      settings: { theme: 'dark' }
    };
  }

  function isObj(o) { return o && typeof o === 'object' && !Array.isArray(o); }

  function deepMerge(t, s) {
    for (var k in s) {
      if (isObj(s[k]) && isObj(t[k])) deepMerge(t[k], s[k]);
      else t[k] = s[k];
    }
    return t;
  }

  function load() {
    var d = defaults();
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') deepMerge(d, parsed);
      }
    } catch (e) { /* corrupted storage: start fresh */ }
    return d;
  }

  EC.store = {
    key: KEY,
    data: load(),
    save: function () {
      try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) {}
    },
    reset: function () {
      this.data = defaults();
      this.save();
      EC.applyTheme();
    },
    exportJSON: function () { return JSON.stringify(this.data); },
    importJSON: function (text) {
      try {
        var parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false;
        var d = defaults();
        deepMerge(d, parsed);
        this.data = d;
        this.save();
        EC.applyTheme();
        return true;
      } catch (e) { return false; }
    }
  };

  /* ================= Theme ================= */
  EC.applyTheme = function () {
    var t = (EC.store.data.settings && EC.store.data.settings.theme) || 'dark';
    document.documentElement.setAttribute('data-theme', t === 'light' ? 'light' : 'dark');
  };
  EC.applyTheme();

  /* ================= Tab registry ================= */
  // EC.register(id, { title, icon, render })
  // render(containerEl) builds the tab UI inside the given element.
  EC._registry = {};
  EC.register = function (id, def) {
    if (!id || !def || typeof def.render !== 'function') return;
    EC._registry[id] = {
      title: def.title || id,
      icon: def.icon || '',
      render: def.render
    };
  };
  EC.tabs = function () { return Object.keys(EC._registry); };

  /* Tab navigation helper — used by "Practice" / cross-tab buttons. */
  EC.nav = {
    go: function (id) {
      if (!id || !EC._registry[id]) return;
      try {
        var target = '#/' + id;
        if (typeof location !== 'undefined') {
          if (location.hash === target && typeof EC._onRoute === 'function') EC._onRoute();
          else location.hash = target;
        }
      } catch (e) {}
    }
  };

  /* ================= UI helpers ================= */
  function setAttrs(node, attrs) {
    for (var k in attrs) {
      var v = attrs[k];
      if (v === undefined || v === null) continue;
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k === 'style' && isObj(v)) {
        for (var p in v) node.style[p] = v[p];
      } else if (k.slice(0, 2) === 'on' && typeof v === 'function') {
        node.addEventListener(k.slice(2), v);
      } else if (k === 'dataset' && isObj(v)) {
        for (var d in v) node.dataset[d] = v[d];
      } else {
        node.setAttribute(k, v);
      }
    }
  }

  function appendKids(node, kids) {
    kids.forEach(function (kid) {
      if (kid === undefined || kid === null || kid === false) return;
      if (Array.isArray(kid)) { appendKids(node, kid); return; }
      if (typeof Node !== 'undefined' && kid instanceof Node) { node.appendChild(kid); return; }
      node.appendChild(document.createTextNode(String(kid)));
    });
  }

  var toastRoot = null;
  function getToastRoot() {
    if (!toastRoot) {
      toastRoot = document.createElement('div');
      toastRoot.id = 'toast-root';
      document.body.appendChild(toastRoot);
    }
    return toastRoot;
  }

  EC.ui = {
    el: function (tag, attrs) {
      var node = document.createElement(tag || 'div');
      setAttrs(node, attrs || {});
      appendKids(node, Array.prototype.slice.call(arguments, 2));
      return node;
    },
    toast: function (msg) {
      var root = getToastRoot();
      var t = document.createElement('div');
      t.className = 'toast';
      t.textContent = msg;
      root.appendChild(t);
      setTimeout(function () { t.classList.add('show'); }, 10);
      setTimeout(function () {
        t.classList.remove('show');
        setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 300);
      }, 2600);
    },
    card: function (title, bodyEl) {
      var card = EC.ui.el('section', { class: 'card' });
      if (title) card.appendChild(EC.ui.el('h3', { class: 'card-title', text: title }));
      var body = EC.ui.el('div', { class: 'card-body' });
      if (bodyEl) {
        if (Array.isArray(bodyEl)) appendKids(body, bodyEl);
        else if (typeof Node !== 'undefined' && bodyEl instanceof Node) body.appendChild(bodyEl);
        else if (bodyEl && typeof bodyEl.appendChild === 'function' && typeof bodyEl.setAttribute === 'function') body.appendChild(bodyEl);
        else body.textContent = String(bodyEl);
      }
      card.appendChild(body);
      return card;
    },
    chip: function (text) {
      return EC.ui.el('span', { class: 'chip', text: text });
    },
    speakBtn: function (text) {
      var b = EC.ui.el('button', { class: 'icon-btn speak-btn', 'aria-label': 'Listen' }, '\uD83D\uDD0A');
      b.addEventListener('click', function () {
        if (!EC.speech.speak(text)) EC.ui.toast('Speech not supported on this device');
      });
      return b;
    },
    progressBar: function (pct) {
      var p = Math.max(0, Math.min(100, Math.round(pct || 0)));
      var bar = EC.ui.el('div', { class: 'pbar', role: 'progressbar', 'aria-valuenow': p, 'aria-valuemin': 0, 'aria-valuemax': 100 });
      bar.appendChild(EC.ui.el('div', { class: 'pbar-fill', style: { width: p + '%' } }));
      return bar;
    },
    stars: function (n) {
      var full = Math.max(0, Math.min(5, Math.round(n || 0)));
      var wrap = EC.ui.el('span', { class: 'stars', 'aria-label': full + ' out of 5 stars' });
      for (var i = 1; i <= 5; i++) {
        wrap.appendChild(EC.ui.el('span', { class: 'star' + (i <= full ? ' on' : ''), text: '\u2605' }));
      }
      return wrap;
    },
    /* Cross-tab navigation (used by "Practice" buttons in other tabs). */
    showTab: function (id) { if (EC.nav) EC.nav.go(id); }
  };

  /* ================= Speech ================= */
  function pickVoice() {
    try {
      var vs = window.speechSynthesis.getVoices() || [];
      if (!vs.length) return null;
      var en = vs.filter(function (v) { return v.lang && v.lang.toLowerCase().indexOf('en') === 0; });
      if (!en.length) return null;
      return en.filter(function (v) { return /en[-_]IN/i.test(v.lang); })[0] ||
             en.filter(function (v) { return /en[-_]US/i.test(v.lang); })[0] ||
             en[0];
    } catch (e) { return null; }
  }

  EC.speech = {
    supported: {
      tts: !!(window.speechSynthesis && window.SpeechSynthesisUtterance),
      stt: !!(window.SpeechRecognition || window.webkitSpeechRecognition)
    },
    speak: function (text, opts) {
      if (!EC.speech.supported.tts || !text) return false;
      try {
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(String(text));
        u.lang = 'en-IN';
        u.rate = (opts && opts.rate) || 0.95;
        var v = pickVoice();
        if (v) u.voice = v;
        window.speechSynthesis.speak(u);
        return true;
      } catch (e) { return false; }
    },
    listen: function (opts) {
      opts = opts || {};
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        if (opts.onError) opts.onError('not-supported');
        return null;
      }
      var rec;
      try { rec = new SR(); } catch (e) {
        if (opts.onError) opts.onError('Mic could not start.');
        return null;
      }
      rec.lang = 'en-IN';
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.onresult = function (ev) {
        try {
          var text = '';
          var isFinal = false;
          for (var i = ev.resultIndex; i < ev.results.length; i++) {
            text += ev.results[i][0].transcript;
            if (ev.results[i].isFinal) isFinal = true;
          }
          if (opts.onResult) opts.onResult(text, isFinal);
        } catch (e) {}
      };
      rec.onerror = function (ev) {
        var msg = (ev && ev.error) || 'unknown';
        if (msg === 'not-allowed' || msg === 'service-not-allowed') msg = 'Mic permission denied. Allow mic access and try again.';
        else if (msg === 'no-speech') msg = 'No speech heard. Try again.';
        else if (msg === 'network') msg = 'Network needed for speech recognition.';
        if (opts.onError) opts.onError(msg);
      };
      rec.onend = function () { if (opts.onEnd) opts.onEnd(); };
      try { rec.start(); } catch (e) {
        if (opts.onError) opts.onError('Mic could not start.');
        return null;
      }
      return rec;
    },
    // Renders a mic button when STT is supported, else a textarea + submit.
    // onText(text) is called with the final recognized or typed text.
    micOrText: function (container, onText) {
      container.innerHTML = '';
      if (EC.speech.supported.stt) {
        var wrap = EC.ui.el('div', { class: 'mic-wrap' });
        var btn = EC.ui.el('button', { class: 'btn mic-btn', 'aria-label': 'Speak your answer' }, '\uD83C\uDFA4 Speak');
        var out = EC.ui.el('div', { class: 'muted mic-status', text: 'Tap and speak in English' });
        var rec = null, recording = false, done = false;
        function reset() {
          recording = false; rec = null; done = false;
          btn.innerHTML = '\uD83C\uDFA4 Speak';
          btn.classList.remove('recording');
        }
        function finish(t) {
          if (done) return;
          done = true;
          try { if (rec) rec.stop(); } catch (e) {}
          reset();
          out.textContent = '';
          if (t && t.trim()) onText(t.trim());
        }
        btn.addEventListener('click', function () {
          if (recording) { try { if (rec) rec.stop(); } catch (e) {} reset(); out.textContent = 'Tap and speak in English'; return; }
          recording = true; done = false;
          btn.innerHTML = '\u23F9 Stop';
          btn.classList.add('recording');
          out.textContent = 'Listening... speak now';
          rec = EC.speech.listen({
            onResult: function (t, isFinal) {
              out.textContent = t;
              if (isFinal) finish(t);
            },
            onError: function (m) {
              reset();
              out.textContent = (m === 'not-supported' ? 'Mic not supported on this device.' : m);
            },
            onEnd: function () {
              if (recording && !done) { reset(); out.textContent = 'Tap and speak in English'; }
            }
          });
        });
        wrap.appendChild(btn);
        wrap.appendChild(out);
        container.appendChild(wrap);
      } else {
        var ta = EC.ui.el('textarea', { class: 'input', rows: '3', placeholder: 'Mic not available here. Type your answer in English...' });
        var sb = EC.ui.el('button', { class: 'btn btn-primary', text: 'Submit' });
        sb.addEventListener('click', function () {
          var v = ta.value.trim();
          if (v) onText(v);
          else EC.ui.toast('Please type something first');
        });
        container.appendChild(ta);
        container.appendChild(sb);
      }
    }
  };

  /* ================= Skills ================= */
  EC.bumpSkill = function (skill, delta) {
    var sk = EC.store.data.skills;
    if (!sk || typeof sk[skill] !== 'number') return;
    var v = Math.round(sk[skill] + (delta || 0));
    sk[skill] = Math.max(0, Math.min(100, v));
    EC.store.save();
  };

  /* ================= Mistakes ================= */
  function newId(prefix) {
    return prefix + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
  }
  // Merges duplicates by category+correction, nudges the related skill down.
  EC.logMistake = function (m) {
    m = m || {};
    var list = EC.store.data.mistakes;
    var found = null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].category === m.category && list[i].correction === m.correction) { found = list[i]; break; }
    }
    if (found) {
      found.count = (found.count || 1) + 1;
      found.ts = Date.now();
    } else {
      list.unshift({
        id: newId('m'),
        ts: Date.now(),
        category: m.category || 'general',
        original: m.original || '',
        spanText: m.spanText || '',
        correction: m.correction || '',
        hinglish: m.hinglish || '',
        count: 1
      });
      if (list.length > 300) list.length = 300;
    }
    if (m.category && typeof EC.store.data.skills[m.category] === 'number') {
      EC.bumpSkill(m.category, -2);
    } else {
      EC.bumpSkill('grammar', -1);
    }
    EC.store.save();
  };

  /* ================= XP, streak, achievements ================= */
  function dayStr(d) {
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  EC.dayStr = dayStr;

  // Call on any completed activity. Updates lastDay/current/longest.
  EC.touchDay = function () {
    var st = EC.store.data.streak;
    var today = dayStr(new Date());
    if (st.lastDay === today) return st.current;
    var yesterday = dayStr(new Date(Date.now() - 864e5));
    st.current = (st.lastDay === yesterday) ? (st.current + 1) : 1;
    if (st.current > st.longest) st.longest = st.current;
    st.lastDay = today;
    EC.store.save();
    if (st.current >= 7) EC.award('streak7');
    return st.current;
  };

  var ACHIEVEMENTS = {
    'first-session': { title: 'First Session', desc: 'You completed your first practice session. Shabaash, shuruaat ho gayi!' },
    'streak7': { title: '7-Day Streak', desc: '7 din lagataar practice! Consistency hi asli superpower hai.' },
    'xp500': { title: '500 XP', desc: '500 XP earned. Your English is clearly levelling up.' },
    'words50': { title: '50 Words', desc: '50 words saved in your vocabulary. Word by word, sentence by sentence!' },
    'speak10min': { title: '10 Minutes Speaking', desc: '10 minutes of speaking practice in one go. Bolna hi seekhna hai!' }
  };
  EC.achievements = ACHIEVEMENTS;

  EC.award = function (id) {
    if (!ACHIEVEMENTS[id]) return false;
    var list = EC.store.data.achievements;
    if (list.indexOf(id) >= 0) return false;
    list.push(id);
    EC.store.save();
    EC.ui.toast('Achievement unlocked: ' + ACHIEVEMENTS[id].title);
    return true;
  };

  EC.addXP = function (n, reason) {
    n = Math.max(0, Math.round(n || 0));
    var d = EC.store.data;
    d.xp += n;
    EC.touchDay();
    d.sessions.push({ ts: Date.now(), xp: n, reason: reason || '' });
    if (d.sessions.length > 200) d.sessions = d.sessions.slice(-200);
    if (n > 0) {
      EC.award('first-session');
      if (d.xp >= 500) EC.award('xp500');
    }
    EC.store.save();
    return d.xp;
  };
})();
