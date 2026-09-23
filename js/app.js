/* My AI English Coach - app bootstrap.
   Loads after core.js (and any future js/data, js/ai, js/ui modules).
   Builds the bottom nav from EC's tab registry, routes via location.hash,
   shows the placement banner, and wires the header (XP/streak/theme). */
(function () {
  'use strict';
  var EC = window.EC;
  var bannerDismissed = false;

  function tabs() { return EC.tabs(); }

  function currentId() {
    var h = (location.hash || '').replace(/^#\/?/, '');
    var ids = tabs();
    if (ids.indexOf(h) >= 0) return h;
    return ids[0] || '';
  }

  function buildNav() {
    var nav = document.getElementById('tabbar');
    nav.innerHTML = '';
    tabs().forEach(function (id) {
      var t = EC._registry[id];
      var b = EC.ui.el('button', { class: 'nav-item', 'data-tab': id, 'aria-label': t.title });
      b.appendChild(EC.ui.el('span', { class: 'nav-icon', text: t.icon || '\u2022' }));
      b.appendChild(EC.ui.el('span', { class: 'nav-label', text: t.title }));
      b.addEventListener('click', function () {
        var target = '#/' + id;
        if (location.hash === target) render(id);
        else location.hash = target;
      });
      nav.appendChild(b);
    });
  }

  function updateHeader() {
    var d = EC.store.data;
    var xp = document.getElementById('xp-pill');
    var streak = document.getElementById('streak-pill');
    if (xp) xp.textContent = d.xp + ' XP';
    if (streak) streak.textContent = '\uD83D\uDD25 ' + d.streak.current;
    var toggle = document.getElementById('theme-toggle');
    if (toggle) toggle.textContent = (d.settings.theme === 'light') ? '\u2600\uFE0F' : '\uD83C\uDF19';
  }

  function render(id) {
    var view = document.getElementById('view');
    var t = EC._registry[id];
    view.innerHTML = '';
    if (t && typeof t.render === 'function') {
      try { t.render(view); }
      catch (e) {
        view.appendChild(EC.ui.card('Oops', 'This tab could not load. Please try again.'));
      }
    }
    var items = document.querySelectorAll('#tabbar .nav-item');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('active', items[i].getAttribute('data-tab') === id);
    }
    updateHeader();
    window.scrollTo(0, 0);
  }

  function maybeBanner() {
    if (bannerDismissed) return;
    var d = EC.store.data;
    if (d.placement && d.placement.taken) return;
    if (tabs().indexOf('placement') < 0) return;
    var main = document.querySelector('#app main');
    if (!main || document.getElementById('placement-banner')) return;
    var banner = EC.ui.el('div', { class: 'banner', id: 'placement-banner' });
    var txt = EC.ui.el('div', { class: 'banner-text' },
      EC.ui.el('strong', {}, 'Placement test pending! '),
      'Take a quick 5-minute test so your coach knows your level. (Bas 5 minute ka test hai!)'
    );
    var row = EC.ui.el('div', { class: 'banner-actions' });
    var go = EC.ui.el('a', { class: 'btn btn-primary btn-sm', href: '#/placement', text: 'Start placement test' });
    var x = EC.ui.el('button', { class: 'icon-btn', 'aria-label': 'Dismiss' }, '\u2715');
    x.addEventListener('click', function () {
      bannerDismissed = true;
      if (banner.parentNode) banner.parentNode.removeChild(banner);
    });
    row.appendChild(go);
    row.appendChild(x);
    banner.appendChild(txt);
    banner.appendChild(row);
    main.insertBefore(banner, main.firstChild);
  }

  function wireThemeToggle() {
    var toggle = document.getElementById('theme-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', function () {
      var s = EC.store.data.settings;
      s.theme = (s.theme === 'light') ? 'dark' : 'light';
      EC.store.save();
      EC.applyTheme();
      document.querySelector('meta[name="theme-color"]')
        .setAttribute('content', s.theme === 'light' ? '#f4f6fb' : '#0f1420');
      updateHeader();
    });
  }

  function renderWelcome(view) {
    var c = EC.ui.card('Welcome to your English Coach',
      'Practice speaking, grammar, vocabulary and more \u2014 thoda roz, roz thoda. ' +
      'Your learning tabs will appear in the menu below as they are added.');
    view.appendChild(c);
  }

  function init() {
    buildNav();
    wireThemeToggle();
    var id = currentId();
    var view = document.getElementById('view');
    if (!id) {
      renderWelcome(view);
    } else {
      render(id);
    }
    maybeBanner();
    updateHeader();
    window.addEventListener('hashchange', function () {
      var nid = currentId();
      if (nid) render(nid);
      maybeBanner();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
