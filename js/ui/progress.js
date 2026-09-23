/* My AI English Coach — TAB GROUP A
 * Tab: progress 📈
 * Canvas line chart (last 14 days, XP + skill avg — hand-drawn, no libs),
 * per-skill trend bars, common mistakes with Practice buttons,
 * achievements grid, lifetime stats.
 */
(function () {
  'use strict';
  if (typeof EC === 'undefined' || !EC || typeof EC.register !== 'function') return;

  var SKILLS = ['speaking', 'grammar', 'vocabulary', 'pronunciation', 'fluency', 'sentence', 'listening', 'interview'];
  var SKILL_LABEL = {
    speaking: 'Speaking', grammar: 'Grammar', vocabulary: 'Vocabulary',
    pronunciation: 'Pronunciation', fluency: 'Fluency', sentence: 'Sentence Building',
    listening: 'Listening', interview: 'Interview'
  };
  var PRACTICE_TAB = {
    grammar: 'daily', vocabulary: 'daily', spelling: 'daily', sentence: 'speak',
    speaking: 'speak', pronunciation: 'speak', fluency: 'conversation',
    listening: 'daily', interview: 'conversation', general: 'daily'
  };
  var ACHIEVEMENTS = [
    { id: 'first_sentence', icon: '🌱', name: 'First Words', desc: 'Analyze your first sentence' },
    { id: 'streak_3', icon: '🔥', name: '3-Day Streak', desc: 'Practice 3 days in a row' },
    { id: 'streak_7', icon: '⚡', name: 'Week Warrior', desc: 'Reach a 7-day streak' },
    { id: 'xp_100', icon: '💯', name: 'Century', desc: 'Earn 100 total XP' },
    { id: 'mission_done', icon: '📅', name: 'Mission Complete', desc: 'Finish a full daily mission' },
    { id: 'placement_done', icon: '🧪', name: 'Know Yourself', desc: 'Finish the placement test' },
    { id: 'chat_10', icon: '💬', name: 'Chatterbox', desc: '10 turns in one conversation' },
    { id: 'repeat_90', icon: '🎯', name: 'Sharp Ears', desc: 'Score 90%+ on a repeat' }
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
  function toast(m) { try { if (EC.ui && typeof EC.ui.toast === 'function') EC.ui.toast(m); } catch (e) {} }
  function dayKey(ts) {
    var t = new Date(ts);
    return t.getFullYear() + '-' + ('0' + (t.getMonth() + 1)).slice(-2) + '-' + ('0' + t.getDate()).slice(-2);
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
        window.dispatchEvent(new CustomEvent('ec:goto-tab', { detail: id })); return;
      }
    } catch (e) {}
    toast('Please open the "' + id + '" tab');
  }

  /* Aggregate sessions into per-day {xp, skillAvg} for last N days */
  function lastNDays(n) {
    var days = [], map = {};
    var now = new Date(); now.setHours(0, 0, 0, 0);
    for (var i = n - 1; i >= 0; i--) {
      var ts = now.getTime() - i * 864e5;
      var k = dayKey(ts);
      map[k] = { key: k, label: (new Date(ts).getDate()) + '/' + (new Date(ts).getMonth() + 1), xp: 0, avgSum: 0, avgN: 0 };
      days.push(map[k]);
    }
    try {
      var sessions = d().sessions || [];
      for (var s = 0; s < sessions.length; s++) {
        var se = sessions[s] || {};
        var ts2 = se.ts || (se.date ? Date.parse(se.date) : 0);
        if (!ts2) continue;
        var kk = dayKey(ts2);
        if (!map[kk]) continue;
        if (typeof se.xp === 'number') map[kk].xp += se.xp;
        else if (se.kind === 'speak') map[kk].xp += 10;
        else if (typeof se.turns === 'number') map[kk].xp += Math.min(60, se.turns * 5);
        if (typeof se.skillAvg === 'number') { map[kk].avgSum += se.skillAvg; map[kk].avgN++; }
        else if (typeof se.accuracy === 'number') { map[kk].avgSum += se.accuracy; map[kk].avgN++; }
      }
    } catch (e) {}
    return days;
  }

  function drawChart(canvas, days) {
    var ctx = null;
    try { ctx = canvas.getContext('2d'); } catch (e) {}
    if (!ctx) return false;
    var W = 340, H = 190, padL = 30, padB = 22, padT = 10, padR = 8;
    try {
      if (typeof window !== 'undefined' && window.devicePixelRatio) {
        canvas.width = W * 2; canvas.height = H * 2;
        canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
        ctx.scale(2, 2);
      } else { canvas.width = W; canvas.height = H; }
    } catch (e2) { try { canvas.width = W; canvas.height = H; } catch (e3) {} }
    var iw = W - padL - padR, ih = H - padT - padB;
    var maxXP = 10;
    for (var i = 0; i < days.length; i++) if (days[i].xp > maxXP) maxXP = days[i].xp;
    function X(i) { return padL + (days.length === 1 ? iw / 2 : iw * i / (days.length - 1)); }
    function Yxp(v) { return padT + ih - (v / maxXP) * ih; }
    function Yavg(v) { return padT + ih - (v / 100) * ih; }
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1;
    for (var g = 0; g <= 4; g++) {
      var gy = padT + ih * g / 4;
      ctx.beginPath(); ctx.moveTo(padL, gy); ctx.lineTo(W - padR, gy); ctx.stroke();
    }
    ctx.fillStyle = '#9ca3af'; ctx.font = '9px sans-serif';
    for (var l = 0; l < days.length; l += 3) ctx.fillText(days[l].label, X(l) - 8, H - 8);
    ctx.fillText('0', 4, padT + ih); ctx.fillText(String(maxXP), 4, padT + 8);

    function line(getY, color, valid) {
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
      var started = false;
      for (var i = 0; i < days.length; i++) {
        if (!valid(days[i])) { started = false; continue; }
        var x = X(i), y = getY(days[i]);
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, 7); ctx.fill();
      }
      ctx.stroke();
    }
    line(function (dd) { return Yxp(dd.xp); }, '#3b82f6', function () { return true; });
    line(function (dd) { return Yavg(dd.avgSum / dd.avgN); }, '#22c55e', function (dd) { return dd.avgN > 0; });

    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#3b82f6'; ctx.fillText('— XP', padL + 4, padT + 2);
    ctx.fillStyle = '#22c55e'; ctx.fillText('— Skill avg', padL + 46, padT + 2);
    return true;
  }

  function skillTrend(name) {
    var sk = d().skills || {};
    var now = parseFloat(sk[name]); if (isNaN(now)) now = 0;
    var delta = null;
    try {
      var sessions = d().sessions || [];
      var cutoff = Date.now() - 14 * 864e5, sum = 0, n = 0;
      for (var i = 0; i < sessions.length; i++) {
        var s = sessions[i] || {};
        var ts = s.ts || (s.date ? Date.parse(s.date) : 0);
        if (ts && ts < cutoff && s.skills && typeof s.skills[name] === 'number') { sum += s.skills[name]; n++; }
      }
      if (n) delta = Math.round(now - sum / n);
    } catch (e) {}
    var row = E('div', { class: 'ec-skillrow' },
      E('div', { class: 'ec-skilltop' },
        E('span', { class: 'ec-skillname', text: SKILL_LABEL[name] || name }),
        E('span', { class: 'ec-skillval', text: Math.round(now) + (delta === null ? '' : (delta >= 0 ? ' (+' + delta + ')' : ' (' + delta + ')')) })
      ),
      E('div', { class: 'ec-bar' }, E('div', { class: 'ec-barfill', style: { width: Math.max(0, Math.min(100, now)) + '%' } }))
    );
    return row;
  }

  function mistakesList() {
    var counts = {};
    try {
      var ms = d().mistakes || [];
      for (var i = 0; i < ms.length; i++) {
        var c = (ms[i] && ms[i].category) || 'general';
        counts[c] = (counts[c] || 0) + 1;
      }
    } catch (e) {}
    var keys = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 5);
    var box = E('div', { class: 'ec-card' }, E('div', { class: 'ec-cardtitle', text: '🧱 Common Mistakes' }));
    if (!keys.length) {
      box.appendChild(E('div', { class: 'ec-muted', text: 'Abhi koi mistakes logged nahi — Speak tab me practice karo 🙂' }));
      return box;
    }
    keys.forEach(function (k) {
      var tab = PRACTICE_TAB[k] || 'daily';
      var row = E('div', { class: 'ec-mistrow' },
        E('div', {}, E('div', { text: k }), E('div', { class: 'ec-muted', text: counts[k] + ' times' })));
      var btn = E('button', { class: 'ec-btn ec-small', text: 'Practice ➤' });
      btn.addEventListener('click', function () { gotoTab(tab); });
      row.appendChild(btn);
      box.appendChild(row);
    });
    return box;
  }

  function achievementsGrid() {
    var unlocked = {};
    try {
      var a = d().achievements || [];
      for (var i = 0; i < a.length; i++) unlocked[typeof a[i] === 'string' ? a[i] : a[i].id] = true;
    } catch (e) {}
    var box = E('div', { class: 'ec-card' }, E('div', { class: 'ec-cardtitle', text: '🏆 Achievements' }));
    var grid = E('div', { class: 'ec-achgrid' });
    ACHIEVEMENTS.forEach(function (ac) {
      var has = !!unlocked[ac.id];
      grid.appendChild(E('div', { class: 'ec-ach' + (has ? '' : ' ec-locked') },
        E('div', { class: 'ec-achicon', text: has ? ac.icon : '🔒' }),
        E('div', { class: 'ec-achname', text: ac.name }),
        E('div', { class: 'ec-muted', text: ac.desc })
      ));
    });
    box.appendChild(grid);
    return box;
  }

  function statsRow() {
    var data = d(), sessions = [];
    try { sessions = data.sessions || []; } catch (e) {}
    var speakMin = 0, sentences = 0;
    for (var i = 0; i < sessions.length; i++) {
      var s = sessions[i] || {};
      if (s.kind === 'conversation' || s.kind === 'speak' || s.kind === 'speaking') speakMin += (typeof s.minutes === 'number' ? s.minutes : 1);
      if (s.kind === 'speak') sentences += 1;
      if (typeof s.sentences === 'number') sentences += s.sentences;
    }
    var wordsLearned = 0;
    try { wordsLearned = Object.keys(data.vocab || {}).length; } catch (e) {}
    return E('div', { class: 'ec-card ec-statsrow' },
      E('div', { class: 'ec-stat' }, E('div', { class: 'ec-statbig', text: String(sessions.length) }), E('div', { class: 'ec-muted', text: 'sessions' })),
      E('div', { class: 'ec-stat' }, E('div', { class: 'ec-statbig', text: String(speakMin) }), E('div', { class: 'ec-muted', text: 'speaking min' })),
      E('div', { class: 'ec-stat' }, E('div', { class: 'ec-statbig', text: String(wordsLearned) }), E('div', { class: 'ec-muted', text: 'words learned' })),
      E('div', { class: 'ec-stat' }, E('div', { class: 'ec-statbig', text: String(sentences) }), E('div', { class: 'ec-muted', text: 'sentences' }))
    );
  }

  function render(container) {
    container.innerHTML = '';
    var wrap = E('div', { class: 'ec-tab' });
    wrap.appendChild(E('h2', { class: 'ec-title', text: '📈 Progress' }));

    var days = lastNDays(14);
    var chartCard = E('div', { class: 'ec-card' },
      E('div', { class: 'ec-cardtitle', text: 'Last 14 days' }));
    var canvas = E('canvas', { class: 'ec-chart' });
    chartCard.appendChild(canvas);
    var hasData = days.some(function (dd) { return dd.xp > 0 || dd.avgN > 0; });
    if (!hasData) chartCard.appendChild(E('div', { class: 'ec-muted', text: 'No data yet — practice karo, chart yahin banega 📈' }));
    wrap.appendChild(chartCard);
    try { drawChart(canvas, days); } catch (e) {}

    var trendCard = E('div', { class: 'ec-card' }, E('div', { class: 'ec-cardtitle', text: '📊 Skill trends (vs 14 days ago)' }));
    for (var i = 0; i < SKILLS.length; i++) trendCard.appendChild(skillTrend(SKILLS[i]));
    wrap.appendChild(trendCard);

    wrap.appendChild(mistakesList());
    wrap.appendChild(achievementsGrid());
    wrap.appendChild(statsRow());

    container.appendChild(wrap);
  }

  EC.register('progress', { title: 'Progress', icon: '📈', render: render });
})();
