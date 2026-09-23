/* My AI English Coach — TAB GROUP A
 * Tab: report 📝 "Weekly Report"
 * Renders EC.ai.weeklyReport() as a text card + Play (speech.speak) +
 * key numbers: what improved / still weak / one focus / encouragement.
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
  function toast(m) { try { if (EC.ui && typeof EC.ui.toast === 'function') EC.ui.toast(m); } catch (e) {} }

  function weekStats() {
    var out = { xp: 0, sessions: 0, accSum: 0, accN: 0, days: {} };
    try {
      var sessions = d().sessions || [];
      var now = Date.now();
      for (var i = 0; i < sessions.length; i++) {
        var s = sessions[i] || {};
        var ts = s.ts || (s.date ? Date.parse(s.date) : 0);
        if (!ts || now - ts > 7 * 864e5) continue;
        out.sessions++;
        if (typeof s.xp === 'number') out.xp += s.xp;
        else if (s.kind === 'speak') out.xp += 10;
        else if (typeof s.turns === 'number') out.xp += Math.min(60, s.turns * 5);
        if (typeof s.accuracy === 'number') { out.accSum += s.accuracy; out.accN++; }
        var dk = new Date(ts); var k = dk.getFullYear() + '-' + (dk.getMonth() + 1) + '-' + dk.getDate();
        out.days[k] = true;
      }
    } catch (e) {}
    out.activeDays = Object.keys(out.days).length;
    out.avgAcc = out.accN ? Math.round(out.accSum / out.accN) : null;
    return out;
  }

  function fallbackReport(ws) {
    var weakCat = 'grammar', n = 0;
    try {
      var counts = {}, ms = d().mistakes || [], now = Date.now();
      for (var i = 0; i < ms.length; i++) {
        var m = ms[i] || {};
        var t = m.ts || (m.date ? Date.parse(m.date) : 0);
        if (t && now - t > 7 * 864e5) continue;
        var c = m.category || 'general';
        counts[c] = (counts[c] || 0) + 1;
      }
      for (var k in counts) if (counts[k] > n) { n = counts[k]; weakCat = k; }
    } catch (e) {}
    return {
      text: 'Is hafte tumne ' + ws.sessions + ' practice sessions kiye aur ' + ws.xp + ' XP kamaye. ' +
        (ws.sessions ? 'Consistency hi asli jeet hai — agle hafte isse zyada ka target rakho!' : 'Abhi practice shuru nahi hui — Daily Mission se chhota start karo, roz 10 minute kaafi hai.'),
      improved: ws.sessions ? 'Consistency — ' + ws.activeDays + ' din practice ki' : 'Abhi kuch nahi — shuruaat baaki hai',
      weak: n ? (weakCat + ' (' + n + ' mistakes is hafte)') : 'Data kam hai — pehle practice karo',
      focus: 'Roz 15 minute ' + weakCat + ' par do. Daily Mission me ye auto-adjust ho jayega.',
      encouragement: 'Yaad rakho: roz thoda-thoda > ek din bahut saara. Tum kar sakte ho! 💪'
    };
  }

  function getReport() {
    if (EC.ai && typeof EC.ai.weeklyReport === 'function') {
      try {
        var r = EC.ai.weeklyReport();
        if (r && (r.text || r.improved)) return r;
      } catch (e) {}
    }
    toast('Engine loading…');
    return fallbackReport(weekStats());
  }

  function section(title, text) {
    return E('div', { class: 'ec-repsec' },
      E('div', { class: 'ec-fb-head', text: title }),
      E('div', { text: text || '—' }));
  }

  function render(container) {
    container.innerHTML = '';
    var wrap = E('div', { class: 'ec-tab' });
    wrap.appendChild(E('h2', { class: 'ec-title', text: '📝 Weekly Report' }));

    var rep = getReport();
    var ws = weekStats();

    // key numbers
    var nums = E('div', { class: 'ec-card ec-statsrow' },
      E('div', { class: 'ec-stat' }, E('div', { class: 'ec-statbig', text: String(ws.xp) }), E('div', { class: 'ec-muted', text: 'XP this week' })),
      E('div', { class: 'ec-stat' }, E('div', { class: 'ec-statbig', text: String(ws.sessions) }), E('div', { class: 'ec-muted', text: 'sessions' })),
      E('div', { class: 'ec-stat' }, E('div', { class: 'ec-statbig', text: String(ws.activeDays) + '/7' }), E('div', { class: 'ec-muted', text: 'active days' })),
      E('div', { class: 'ec-stat' }, E('div', { class: 'ec-statbig', text: ws.avgAcc === null ? '—' : ws.avgAcc + '%' }), E('div', { class: 'ec-muted', text: 'avg accuracy' }))
    );
    wrap.appendChild(nums);

    // main text card
    var card = E('div', { class: 'ec-card' },
      E('div', { class: 'ec-cardtitle', text: '📰 Tumhare hafte ki kahani' }),
      E('div', { class: 'ec-reptext', text: rep.text || '' })
    );
    var playBtn = E('button', { class: 'ec-btn', text: '🔊 Play report' });
    playBtn.addEventListener('click', function () {
      var t = rep.text || '';
      try {
        if (EC.speech && typeof EC.speech.speak === 'function' && t) EC.speech.speak(t);
        else toast('Speech not available');
      } catch (e) { toast('Speech not available'); }
    });
    card.appendChild(playBtn);
    wrap.appendChild(card);

    // breakdown
    var breakdown = E('div', { class: 'ec-card' },
      E('div', { class: 'ec-cardtitle', text: '🔍 Breakdown' }));
    breakdown.appendChild(section('🌱 What improved', rep.improved));
    breakdown.appendChild(section('🧱 Still weak', rep.weak));
    breakdown.appendChild(section('🎯 One focus for next week', rep.focus));
    breakdown.appendChild(section('💛 Encouragement', rep.encouragement || 'Roz thoda practice = badi jeet. Lage raho! 💪'));
    wrap.appendChild(breakdown);

    container.appendChild(wrap);
  }

  EC.register('report', { title: 'Weekly Report', icon: '📝', render: render });
})();
