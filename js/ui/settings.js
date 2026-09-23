/* My AI English Coach — TAB GROUP A
 * Tab: settings ⚙️
 * Profile form, quiet hours, theme toggle, data export/import,
 * reset (confirm), storage size display. Everything guarded.
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

  function defaultShape() {
    return {
      profile: { name: '', level: 1, targetLevel: 5, dailyGoal: 15, planLength: 30, accentGoal: 'Neutral Indian' },
      xp: 0,
      streak: { current: 0, longest: 0, lastDay: null, freezes: 1 },
      skills: { speaking: 0, grammar: 0, vocabulary: 0, pronunciation: 0, fluency: 0, sentence: 0, listening: 0, interview: 0 },
      mistakes: [], vocab: {}, verbs: {}, daily: {}, achievements: [],
      placement: { taken: false, date: null, score: 0, level: 1 },
      sessions: [], weekFocus: { skill: null, start: null },
      settings: { theme: 'light', quietStart: '', quietEnd: '' }
    };
  }

  function field(labelText, inputEl) {
    return E('label', { class: 'ec-field' },
      E('div', { class: 'ec-flabel', text: labelText }), inputEl);
  }
  function selectOf(options, val) {
    var s = E('select', { class: 'ec-select' });
    options.forEach(function (o) {
      var v = (typeof o === 'object') ? o.v : o;
      var t = (typeof o === 'object') ? o.t : o;
      var opt = E('option', { value: String(v), text: t });
      if (String(v) === String(val)) opt.setAttribute('selected', 'true');
      s.appendChild(opt);
    });
    try { s.value = String(val); } catch (e) {}
    return s;
  }

  function applyTheme(theme) {
    try {
      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
      }
    } catch (e) {}
  }

  function storageSize() {
    try {
      if (typeof localStorage === 'undefined') return null;
      var total = 0;
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        total += (k || '').length + (localStorage.getItem(k) || '').length;
      }
      return total;
    } catch (e) { return null; }
  }

  function render(container) {
    container.innerHTML = '';
    var wrap = E('div', { class: 'ec-tab' });
    wrap.appendChild(E('h2', { class: 'ec-title', text: '⚙️ Settings' }));
    var data = d();
    data.profile = data.profile || {};
    data.settings = data.settings || {};
    var p = data.profile, st = data.settings;

    /* ---- profile ---- */
    var pc = E('div', { class: 'ec-card' }, E('div', { class: 'ec-cardtitle', text: '👤 Profile' }));
    var nameI = E('input', { class: 'ec-input', type: 'text', placeholder: 'Tumhara naam', value: p.name || '' });
    var levelI = selectOf([1, 2, 3, 4, 5].map(function (n) { return { v: n, t: 'Level ' + n }; }), p.level || 1);
    var targetI = selectOf([1, 2, 3, 4, 5].map(function (n) { return { v: n, t: 'Level ' + n }; }), p.targetLevel || 5);
    var goalI = E('input', { class: 'ec-input', type: 'number', min: '5', max: '180', value: String(p.dailyGoal || 15) });
    var planI = selectOf([15, 30, 45, 60].map(function (n) { return { v: n, t: n + ' days' }; }), p.planLength || 30);
    var accentI = selectOf(['Neutral Indian', 'American', 'British', 'Australian'], p.accentGoal || 'Neutral Indian');
    pc.appendChild(field('Name', nameI));
    pc.appendChild(field('Current level', levelI));
    pc.appendChild(field('Target level', targetI));
    pc.appendChild(field('Daily goal (minutes)', goalI));
    pc.appendChild(field('Plan length', planI));
    pc.appendChild(field('Accent goal', accentI));
    var saveBtn = E('button', { class: 'ec-btn ec-primary', text: '💾 Save profile' });
    saveBtn.addEventListener('click', function () {
      p.name = (nameI.value || '').trim();
      p.level = parseInt(levelI.value, 10) || 1;
      p.targetLevel = parseInt(targetI.value, 10) || 5;
      p.dailyGoal = Math.max(5, parseInt(goalI.value, 10) || 15);
      p.planLength = parseInt(planI.value, 10) || 30;
      p.accentGoal = accentI.value || 'Neutral Indian';
      save();
      toast('Profile saved ✅');
    });
    pc.appendChild(saveBtn);
    wrap.appendChild(pc);

    /* ---- quiet hours + theme ---- */
    var qc = E('div', { class: 'ec-card' }, E('div', { class: 'ec-cardtitle', text: '🔔 Quiet hours' }));
    var qsI = E('input', { class: 'ec-input', type: 'time', value: st.quietStart || '' });
    var qeI = E('input', { class: 'ec-input', type: 'time', value: st.quietEnd || '' });
    qc.appendChild(field('No reminders from', qsI));
    qc.appendChild(field('Until', qeI));
    var qSave = E('button', { class: 'ec-btn', text: '💾 Save quiet hours' });
    qSave.addEventListener('click', function () {
      st.quietStart = qsI.value || ''; st.quietEnd = qeI.value || '';
      save(); toast('Quiet hours saved ✅');
    });
    qc.appendChild(qSave);
    wrap.appendChild(qc);

    var tc = E('div', { class: 'ec-card' }, E('div', { class: 'ec-cardtitle', text: '🎨 Theme' }));
    var themeBtn = E('button', { class: 'ec-btn', text: (st.theme === 'dark' ? '☀️ Switch to light' : '🌙 Switch to dark') });
    themeBtn.addEventListener('click', function () {
      st.theme = (st.theme === 'dark') ? 'light' : 'dark';
      applyTheme(st.theme); save();
      themeBtn.textContent = (st.theme === 'dark' ? '☀️ Switch to light' : '🌙 Switch to dark');
      toast('Theme: ' + st.theme);
    });
    tc.appendChild(themeBtn);
    wrap.appendChild(tc);
    applyTheme(st.theme || 'light');

    /* ---- data ---- */
    var dc = E('div', { class: 'ec-card' }, E('div', { class: 'ec-cardtitle', text: '💾 Your data' }));
    var size = storageSize();
    dc.appendChild(E('div', { class: 'ec-muted',
      text: size === null ? 'Storage size: unavailable' : 'Storage used: ' + (size / 1024).toFixed(1) + ' KB' }));

    var expBtn = E('button', { class: 'ec-btn', text: '⬇️ Export (download JSON)' });
    expBtn.addEventListener('click', function () {
      try {
        if (typeof Blob === 'undefined') { toast('Export not supported here'); return; }
        var blob = new Blob([JSON.stringify(d(), null, 2)], { type: 'application/json' });
        var a = document.createElement('a');
        var url = (window.URL && window.URL.createObjectURL) ? window.URL.createObjectURL(blob) : null;
        if (!url) { toast('Export not supported here'); return; }
        a.href = url; a.download = 'english-coach-backup.json';
        document.body.appendChild(a); a.click();
        setTimeout(function () { try { if (a.remove) a.remove(); if (window.URL.revokeObjectURL) window.URL.revokeObjectURL(url); } catch (e) {} }, 800);
        toast('Backup downloaded ⬇️');
      } catch (e) { toast('Export failed'); }
    });

    var impLabel = E('label', { class: 'ec-btn', text: '⬆️ Import backup' });
    var impInput = E('input', { type: 'file', accept: '.json,application/json', style: { display: 'none' } });
    impInput.addEventListener('change', function () {
      var f = impInput.files && impInput.files[0];
      if (!f) return;
      if (typeof FileReader === 'undefined') { toast('Import not supported here'); return; }
      var fr = new FileReader();
      fr.onload = function () {
        try {
          var obj = JSON.parse(fr.result);
          if (!obj || typeof obj !== 'object' || !obj.profile) { toast('Ye valid backup nahi lagta ❌'); return; }
          if (EC.store) { EC.store.data = obj; save(); }
          applyTheme((obj.settings && obj.settings.theme) || 'light');
          toast('Backup imported ✅ — page reload karo');
        } catch (e) { toast('Import failed — file corrupt?'); }
      };
      fr.readAsText(f);
    });
    impLabel.appendChild(impInput);

    var resetBtn = E('button', { class: 'ec-btn ec-danger', text: '🗑 Reset all data' });
    resetBtn.addEventListener('click', function () {
      var ok = true;
      try { if (typeof confirm === 'function') ok = confirm('Saara data delete ho jayega. Pakka reset karna hai?'); } catch (e) {}
      if (!ok) return;
      if (EC.store) { EC.store.data = defaultShape(); save(); }
      applyTheme('light');
      toast('Reset ho gaya. Fresh start! 🌱');
      render(container);
    });

    dc.appendChild(E('div', { class: 'ec-row' }, expBtn, impLabel));
    dc.appendChild(resetBtn);
    wrap.appendChild(dc);

    container.appendChild(wrap);
  }

  EC.register('settings', { title: 'Settings', icon: '⚙️', render: render });
})();
