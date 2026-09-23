/* My AI English Coach — TAB GROUP A
 * Tab: dashboard 📊
 * Consumes the global EC contract (EC.register / EC.store / EC.ui / EC.ai).
 * Guards everything so it renders even if data/engine are partially missing.
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

  function E(tag, attrs) {
    var args = [tag, attrs || {}];
    for (var i = 2; i < arguments.length; i++) args.push(arguments[i]);
    if (EC.ui && typeof EC.ui.el === 'function') return EC.ui.el.apply(EC.ui, args);
    var el = document.createElement(tag); // last-resort fallback
    if (attrs && attrs.text) el.textContent = attrs.text;
    return el;
  }
  function d() { return (EC.store && EC.store.data) ? EC.store.data : {}; }
  function save() { try { if (EC.store && typeof EC.store.save === 'function') EC.store.save(); } catch (e) {} }
  function toast(m) { try { if (EC.ui && typeof EC.ui.toast === 'function') EC.ui.toast(m); } catch (e) {} }
  function todayKey() {
    var t = new Date();
    return t.getFullYear() + '-' + ('0' + (t.getMonth() + 1)).slice(-2) + '-' + ('0' + t.getDate()).slice(-2);
  }
  function skillVal(s) {
    var sk = d().skills || {};
    var v = parseFloat(sk[s]);
    return isNaN(v) ? 0 : Math.max(0, Math.min(100, v));
  }
  function skillAvg() {
    var sum = 0;
    for (var i = 0; i < SKILLS.length; i++) sum += skillVal(SKILLS[i]);
    return Math.round(sum / SKILLS.length);
  }

  /* ---- recent accuracy from session log (last 7 days) ---- */
  function recentAccuracy() {
    var out = { avg: null, n: 0 };
    try {
      var sessions = d().sessions || [];
      var now = Date.now(), sum = 0, n = 0;
      for (var i = 0; i < sessions.length; i++) {
        var s = sessions[i] || {};
        var t = s.ts || (s.date ? Date.parse(s.date) : 0);
        if (t && now - t < 7 * 864e5 && typeof s.accuracy === 'number') { sum += s.accuracy; n++; }
      }
      if (n) { out.avg = Math.round(sum / n); out.n = n; }
    } catch (e) {}
    return out;
  }

  function levelWhyLine(level) {
    var ra = recentAccuracy();
    if (ra.avg === null) return 'Finish your first practice — accuracy yahin dikhegi, aur level usi se set hoga.';
    var nextAt = { 1: 50, 2: 65, 3: 80, 4: 90, 5: 100 }[level] || 100;
    if (level >= 5) return 'Recent accuracy ' + ra.avg + '% — top level! Ab isko maintain karo. 🏆';
    return 'Recent accuracy ' + ra.avg + '% (' + ra.n + ' sessions). L' + (level + 1) + ' ke liye ' + nextAt + '%+ chahiye.';
  }

  function skillBar(name) {
    var v = skillVal(name);
    var row = E('div', { class: 'ec-skillrow' },
      E('div', { class: 'ec-skilltop' },
        E('span', { class: 'ec-skillname', text: SKILL_LABEL[name] || name }),
        E('span', { class: 'ec-skillval', text: v + '' })
      ),
      E('div', { class: 'ec-bar' }, E('div', { class: 'ec-barfill', style: { width: v + '%' } }))
    );
    return row;
  }

  function ring(pct) {
    pct = Math.max(0, Math.min(1, pct));
    var r = 26, c = 2 * Math.PI * r;
    var svg = E('svg', { class: 'ec-ring', width: '76', height: '76', viewBox: '0 0 76 76' });
    svg.appendChild(E('circle', { cx: '38', cy: '38', r: String(r), fill: 'none', stroke: '#e5e7eb', 'stroke-width': '9' }));
    svg.appendChild(E('circle', {
      cx: '38', cy: '38', r: String(r), fill: 'none', stroke: '#22c55e', 'stroke-width': '9',
      'stroke-linecap': 'round', 'stroke-dasharray': c.toFixed(1),
      'stroke-dashoffset': (c * (1 - pct)).toFixed(1), transform: 'rotate(-90 38 38)'
    }));
    svg.appendChild(E('text', {
      x: '38', y: '44', 'text-anchor': 'middle', 'font-size': '15',
      'font-weight': '700', fill: '#111827'
    }, Math.round(pct * 100) + '%'));
    return svg;
  }

  function missionProgress() {
    var tasks = [], doneN = 0;
    try {
      var day = (d().daily || {})[todayKey()];
      if (day && day.tasks && day.tasks.length) {
        tasks = day.tasks;
        for (var i = 0; i < tasks.length; i++) if (tasks[i].done) doneN++;
      }
    } catch (e) {}
    return { total: tasks.length, done: doneN, pct: tasks.length ? doneN / tasks.length : 0 };
  }

  function focusBanner() {
    var focus = null;
    try {
      if (EC.ai && typeof EC.ai.recommendFocus === 'function') focus = EC.ai.recommendFocus();
    } catch (e) { focus = null; }
    var skill = focus && focus.skill, reason = focus && focus.reason, mins = focus && focus.minutes;
    if (!skill) {
      // fallback: weakest skill from profile
      var worst = SKILLS[0], wv = 101;
      for (var i = 0; i < SKILLS.length; i++) { var v = skillVal(SKILLS[i]); if (v < wv) { wv = v; worst = SKILLS[i]; } }
      skill = worst; reason = 'Sabse kam score wali skill — ise strong banao.'; mins = 15;
    }
    return E('div', { class: 'ec-card ec-focus' },
      E('div', { class: 'ec-focus-title', text: '🎯 Weekly Focus Sprint' }),
      E('div', { class: 'ec-focus-skill', text: (SKILL_LABEL[skill] || skill) + (mins ? ' · ' + mins + ' min/day' : '') }),
      E('div', { class: 'ec-focus-reason', text: reason || '' })
    );
  }

  /* Past-you vs Current-you: skill avg now vs ~30 days ago from sessions log */
  function pastVsNow() {
    var nowAvg = skillAvg(), pastAvg = null, pastN = 0;
    try {
      var sessions = d().sessions || [];
      var now = Date.now(), sum = 0, n = 0;
      for (var i = 0; i < sessions.length; i++) {
        var s = sessions[i] || {};
        var t = s.ts || (s.date ? Date.parse(s.date) : 0);
        if (!t) continue;
        var daysAgo = (now - t) / 864e5;
        if (daysAgo >= 24 && daysAgo <= 36) {
          var a = (typeof s.skillAvg === 'number') ? s.skillAvg : null;
          if (a === null && s.skills) {
            var tot = 0, c = 0;
            for (var k = 0; k < SKILLS.length; k++) if (typeof s.skills[SKILLS[k]] === 'number') { tot += s.skills[SKILLS[k]]; c++; }
            if (c) a = tot / c;
          }
          if (a !== null) { sum += a; n++; }
        }
      }
      if (n) { pastAvg = Math.round(sum / n); pastN = n; }
    } catch (e) {}
    var card = E('div', { class: 'ec-card' },
      E('div', { class: 'ec-cardtitle', text: '🪞 Past-you vs Current-you' }));
    if (pastAvg === null) {
      card.appendChild(E('div', { class: 'ec-muted', text: 'Keep practicing — comparison unlocks soon 🌱 (30 din ka data chahiye)' }));
    } else {
      var delta = nowAvg - pastAvg;
      var line = '30 din pehle: ' + pastAvg + ' → Aaj: ' + nowAvg +
        (delta > 0 ? '  (+' + delta + ' 📈 badhiya!)' : delta < 0 ? '  (' + delta + ' — practice badhao 💪)' : '  (same — lage raho!)');
      card.appendChild(E('div', { class: 'ec-vsnums' },
        E('div', { class: 'ec-vscol' }, E('div', { class: 'ec-vsbig', text: pastAvg + '' }), E('div', { class: 'ec-muted', text: '30 days ago' })),
        E('div', { class: 'ec-vsarrow', text: '→' }),
        E('div', { class: 'ec-vscol' }, E('div', { class: 'ec-vsbig', text: nowAvg + '' }), E('div', { class: 'ec-muted', text: 'Today' }))
      ));
      card.appendChild(E('div', { class: 'ec-muted', text: line }));
    }
    return card;
  }

  function render(container) {
    container.innerHTML = '';
    var wrap = E('div', { class: 'ec-tab' });
    var data = d(), profile = data.profile || {};
    var name = profile.name || 'Friend';
    var level = parseInt(profile.level, 10); if (!(level >= 1 && level <= 5)) level = 1;
    var hour = new Date().getHours();
    var greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    wrap.appendChild(E('div', { class: 'ec-hello' },
      E('div', { class: 'ec-hellotext', text: greet + ', ' + name + '! 👋' }),
      E('div', { class: 'ec-levelbadge', text: 'Level L' + level })
    ));
    wrap.appendChild(E('div', { class: 'ec-whylevel', text: levelWhyLine(level) }));

    // XP + streak
    var streak = data.streak || {};
    var freezes = (typeof streak.freezes === 'number') ? streak.freezes : 1;
    wrap.appendChild(E('div', { class: 'ec-card ec-statsrow' },
      E('div', { class: 'ec-stat' }, E('div', { class: 'ec-statbig', text: String(data.xp || 0) }), E('div', { class: 'ec-muted', text: 'XP ⭐' })),
      E('div', { class: 'ec-stat' }, E('div', { class: 'ec-statbig', text: (streak.current || 0) + ' 🔥' }), E('div', { class: 'ec-muted', text: 'day streak' })),
      E('div', { class: 'ec-stat' }, E('div', { class: 'ec-statbig', text: String(streak.longest || 0) }), E('div', { class: 'ec-muted', text: 'longest' }))
    ));
    wrap.appendChild(E('div', { class: 'ec-freeze', text: '🧊 ' + freezes + ' freeze available — one missed day won\'t break your streak' }));

    // Today's mission progress
    var mp = missionProgress();
    var missionCard = E('div', { class: 'ec-card ec-missionrow' }, ring(mp.pct),
      E('div', { class: 'ec-missiontext' },
        E('div', { class: 'ec-cardtitle', text: '📅 Today\'s Mission' }),
        E('div', { class: 'ec-muted', text: mp.total ? (mp.done + ' of ' + mp.total + ' tasks done') : 'No mission yet — open the Daily tab to start!' })
      ));
    wrap.appendChild(missionCard);

    // Weekly focus sprint
    wrap.appendChild(focusBanner());

    // Skills
    var sc = E('div', { class: 'ec-card' }, E('div', { class: 'ec-cardtitle', text: '💪 Your Skills' }));
    for (var i = 0; i < SKILLS.length; i++) sc.appendChild(skillBar(SKILLS[i]));
    wrap.appendChild(sc);

    // Past vs now
    wrap.appendChild(pastVsNow());

    container.appendChild(wrap);
  }

  EC.register('dashboard', { title: 'Dashboard', icon: '📊', render: render });
})();
