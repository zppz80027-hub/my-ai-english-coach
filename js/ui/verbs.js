/* ============================================================
   My AI English Coach — UI TAB GROUP B
   Tab: verbs (📚) — Verb forms, flashcards, quiz, daily 10, phrasals
   Vanilla JS. Consumes global EC contract; guards everything.
   ============================================================ */
(function () {
  'use strict';
  var EC = window.EC;
  if (!EC || typeof EC.register !== 'function') return;

  /* ---------- guarded helpers ---------- */
  var U = EC.ui || {};
  var SP = EC.speech || {};
  var store = EC.store || null;
  function sdata() { return (store && store.data) || {}; }
  function save() { try { if (store && typeof store.save === 'function') store.save(); } catch (e) {} }
  function touchDay() { try { if (typeof EC.touchDay === 'function') EC.touchDay(); } catch (e) {} }
  function addXP(n) { try { if (typeof EC.addXP === 'function') EC.addXP(n); } catch (e) {} }
  function bumpSkill(s, n) { try { if (typeof EC.bumpSkill === 'function') EC.bumpSkill(s, n == null ? 1 : n); } catch (e) {} }
  function toast(m) { try { if (typeof U.toast === 'function') { U.toast(m); return; } } catch (e) {} }
  function h(tag, cls, text) {
    var e;
    try { if (typeof U.el === 'function') { e = U.el(tag, cls); if (!e || !e.appendChild) throw 0; } else throw 0; }
    catch (err) { e = document.createElement(tag); if (cls) e.className = cls; }
    if (text != null) e.textContent = text;
    return e;
  }
  function speak(t) {
    try { if (typeof SP.speak === 'function') { SP.speak(t); return; } } catch (e) {}
    try { var u = new SpeechSynthesisUtterance(t); u.lang = 'en-US'; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch (e) {}
  }
  function speakBtn(t) {
    try { if (typeof U.speakBtn === 'function') { var b = U.speakBtn(t); if (b) return b; } } catch (e) {}
    var b2 = h('button', 'ec-say', '🔊'); b2.type = 'button';
    b2.addEventListener('click', function (ev) { ev.stopPropagation(); speak(t); });
    return b2;
  }

  var CSS_ID = 'ec-tab-verbs-css';
  function injectCSS() {
    if (document.getElementById(CSS_ID)) return;
    var s = document.createElement('style'); s.id = CSS_ID;
    s.textContent = [
      '.ecV{font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.5;color:#1c1c1e;}',
      '.ecV .ec-sub{display:flex;gap:8px;overflow-x:auto;padding:8px 0;margin-bottom:6px;}',
      '.ecV .ec-chip{flex:0 0 auto;border:1px solid #d1d1d6;background:#f2f2f7;border-radius:999px;padding:8px 14px;font-size:14px;cursor:pointer;}',
      '.ecV .ec-chip.on{background:#0a84ff;color:#fff;border-color:#0a84ff;}',
      '.ecV .ec-card{background:#fff;border:1px solid #e5e5ea;border-radius:14px;padding:14px;margin:10px 0;box-shadow:0 1px 3px rgba(0,0,0,.06);}',
      '.ecV .ec-row{display:flex;align-items:center;gap:10px;}',
      '.ecV .ec-grow{flex:1;}',
      '.ecV .ec-title{font-weight:700;font-size:16px;}',
      '.ecV .ec-hi{color:#636366;font-size:13px;}',
      '.ecV .ec-lbl{font-size:12px;font-weight:700;color:#8e8e93;text-transform:uppercase;letter-spacing:.4px;margin:12px 0 4px;}',
      '.ecV .ec-say{border:none;background:#e5f0ff;border-radius:50%;width:34px;height:34px;font-size:16px;cursor:pointer;flex:0 0 auto;}',
      '.ecV .ec-back{border:1px solid #d1d1d6;background:#fff;border-radius:999px;padding:8px 14px;cursor:pointer;font-size:14px;margin-bottom:4px;}',
      '.ecV .ec-opt{display:block;width:100%;text-align:left;border:1px solid #d1d1d6;background:#fff;border-radius:10px;padding:10px;margin:6px 0;font-size:14px;cursor:pointer;}',
      '.ecV .ec-opt.ok{background:#d7f0d8;border-color:#34c759;}',
      '.ecV .ec-opt.bad{background:#fbd9d5;border-color:#ff3b30;}',
      '.ecV .ec-opt:disabled{opacity:.85;cursor:default;}',
      '.ecV .ec-fb{font-size:13px;margin:4px 0 10px;color:#636366;}',
      '.ecV .ec-btn{background:#0a84ff;color:#fff;border:none;border-radius:10px;padding:10px 16px;font-size:15px;cursor:pointer;margin:4px 6px 4px 0;}',
      '.ecV .ec-btn.ghost{background:#f2f2f7;color:#1c1c1e;}',
      '.ecV .ec-search{width:100%;box-sizing:border-box;border:1px solid #d1d1d6;border-radius:10px;padding:10px;font-size:15px;margin:4px 0;}',
      '.ecV .ec-forms{font-family:monospace;font-size:13px;background:#f2f2f7;border-radius:8px;padding:6px 8px;margin-top:6px;}',
      '.ecV .ec-star{border:none;background:none;font-size:22px;cursor:pointer;flex:0 0 auto;}',
      '.ecV .ec-check{width:22px;height:22px;flex:0 0 auto;cursor:pointer;}',
      '.ecV .ec-flash{min-height:220px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;cursor:pointer;background:linear-gradient(135deg,#e8f0ff,#f5e8ff);border-radius:16px;padding:24px;margin:10px 0;}',
      '.ecV .ec-flash .big{font-size:34px;font-weight:800;}',
      '.ecV .ec-flash .small{font-size:15px;color:#636366;margin-top:10px;}',
      '.ecV .ec-warn{background:#fdecea;border-radius:10px;padding:10px;margin:8px 0;font-size:14px;}',
      '.ecV .ec-tap{cursor:pointer;}'
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ---------- built-in verb data (fallback) ---------- */
  /* v1,v2,v3,v4(ing),v5(s), hi=Hindi, reg, ex, mis */
  var FALLBACK_VERBS = [
    ['be', 'was/were', 'been', 'being', 'is', 'hona', false, 'I am happy.', 'am/is/are bhoolna'],
    ['have', 'had', 'had', 'having', 'has', 'paas hona / rakhna', false, 'I have a car.', '"I am having a car" ❌ → "I have a car" ✅'],
    ['do', 'did', 'done', 'doing', 'does', 'karna', false, 'I do my work.', 'did ke baad V1: did went ❌'],
    ['go', 'went', 'gone', 'going', 'goes', 'jaana', false, 'We go to school.', 'gooses nahi, goes ✅'],
    ['come', 'came', 'come', 'coming', 'comes', 'aana', false, 'Come here!', 'came/come confuse mat karo'],
    ['eat', 'ate', 'eaten', 'eating', 'eats', 'khaana', false, 'I eat rice.', 'eated ❌ → ate ✅'],
    ['drink', 'drank', 'drunk', 'drinking', 'drinks', 'peena', false, 'Drink water.', 'drinked ❌'],
    ['write', 'wrote', 'written', 'writing', 'writes', 'likhna', false, 'She writes daily.', 'writed ❌'],
    ['read', 'read', 'read', 'reading', 'reads', 'padhna', false, 'I read books.', 'pronunciation: reed → red'],
    ['speak', 'spoke', 'spoken', 'speaking', 'speaks', 'bolna', false, 'Speak slowly.', 'speaked ❌'],
    ['take', 'took', 'taken', 'taking', 'takes', 'lena', false, 'Take this.', 'taked ❌'],
    ['give', 'gave', 'given', 'giving', 'gives', 'dena', false, 'Give me water.', 'gived ❌'],
    ['make', 'made', 'made', 'making', 'makes', 'banana', false, 'I make tea.', 'maked ❌'],
    ['buy', 'bought', 'bought', 'buying', 'buys', 'khareedna', false, 'I bought a pen.', 'buyed ❌'],
    ['sell', 'sold', 'sold', 'selling', 'sells', 'bechna', false, 'He sells fruits.', 'selled ❌'],
    ['bring', 'brought', 'brought', 'bringing', 'brings', 'laana', false, 'Bring your book.', 'bringed ❌'],
    ['think', 'thought', 'thought', 'thinking', 'thinks', 'sochna', false, 'Think twice.', 'thinked ❌'],
    ['know', 'knew', 'known', 'knowing', 'knows', 'jaanna', false, 'I know him.', '"I am knowing" ❌ → "I know" ✅'],
    ['see', 'saw', 'seen', 'seeing', 'sees', 'dekhna', false, 'I saw a movie.', 'seed ❌ → seen/saw ✅'],
    ['run', 'ran', 'run', 'running', 'runs', 'daudna', false, 'He runs fast.', 'runned ❌'],
    ['walk', 'walked', 'walked', 'walking', 'walks', 'chalna', true, 'We walk daily.', '-'],
    ['play', 'played', 'played', 'playing', 'plays', 'khelna', true, 'They play cricket.', '-'],
    ['work', 'worked', 'worked', 'working', 'works', 'kaam karna', true, 'I work hard.', '-'],
    ['study', 'studied', 'studied', 'studying', 'studies', 'padhai karna', true, 'Study daily.', 'studyed ❌ → studied ✅'],
    ['teach', 'taught', 'taught', 'teaching', 'teaches', 'padhana', false, 'She teaches English.', 'teached ❌'],
    ['learn', 'learnt/learned', 'learnt/learned', 'learning', 'learns', 'seekhna', false, 'I learn daily.', '-'],
    ['sleep', 'slept', 'slept', 'sleeping', 'sleeps', 'sona', false, 'I sleep at 10.', 'sleeped ❌'],
    ['wake', 'woke', 'woken', 'waking', 'wakes', 'jaagna', false, 'Wake up!', 'waked ❌'],
    ['cook', 'cooked', 'cooked', 'cooking', 'cooks', 'khana banana', true, 'Mom cooks well.', '-'],
    ['clean', 'cleaned', 'cleaned', 'cleaning', 'cleans', 'saaf karna', true, 'Clean the room.', '-'],
    ['watch', 'watched', 'watched', 'watching', 'watches', 'dekhna (TV)', true, 'We watch movies.', '-'],
    ['listen', 'listened', 'listened', 'listening', 'listens', 'sunna', true, 'Listen to me.', '"listen me" ❌ → "listen to me" ✅'],
    ['help', 'helped', 'helped', 'helping', 'helps', 'madad karna', true, 'Help me.', '-'],
    ['call', 'called', 'called', 'calling', 'calls', 'bulana / phone karna', true, 'Call me.', '-'],
    ['meet', 'met', 'met', 'meeting', 'meets', 'milna', false, 'Nice to meet you.', 'meetings me "to" nahi'],
    ['sit', 'sat', 'sat', 'sitting', 'sits', 'baithna', false, 'Sit down.', 'sitted ❌'],
    ['stand', 'stood', 'stood', 'standing', 'stands', 'khada hona', false, 'Stand up.', 'standed ❌'],
    ['open', 'opened', 'opened', 'opening', 'opens', 'kholna', true, 'Open the door.', '-'],
    ['close', 'closed', 'closed', 'closing', 'closes', 'band karna', true, 'Close it.', '-'],
    ['break', 'broke', 'broken', 'breaking', 'breaks', 'todna', false, 'Don\'t break it.', 'breaked ❌'],
    ['catch', 'caught', 'caught', 'catching', 'catches', 'pakadna', false, 'Catch the ball.', 'catched ❌'],
    ['choose', 'chose', 'chosen', 'choosing', 'chooses', 'chunna', false, 'Choose one.', 'choosed ❌'],
    ['drive', 'drove', 'driven', 'driving', 'drives', 'gaadi chalana', false, 'He drives well.', 'drived ❌'],
    ['fly', 'flew', 'flown', 'flying', 'flies', 'udna', false, 'Birds fly.', 'flied ❌']
  ];

  function normVerbs(raw) {
    if (!Array.isArray(raw) || !raw.length) return null;
    return raw.map(function (v, i) {
      if (Array.isArray(v)) return { id: 'v' + i, v1: v[0], v2: v[1], v3: v[2], v4: v[3], v5: v[4], hi: v[5], reg: !!v[6], ex: v[7], mis: v[8] };
      return { id: 'v' + i, v1: v.v1 || v.base || '', v2: v.v2 || v.past || '', v3: v.v3 || v.pp || '', v4: v.v4 || (v.v1 + 'ing'), v5: v.v5 || (v.v1 + 's'), hi: v.hi || v.hindi || '', reg: !!v.regular, ex: v.ex || v.example || '', mis: v.mis || v.mistake || '' };
    });
  }

  function getVerbs() {
    var fromData = null;
    try { if (EC.data && EC.data.verbs) fromData = normVerbs(EC.data.verbs); } catch (e) {}
    return fromData || normVerbs(FALLBACK_VERBS);
  }

  var FALLBACK_PHRASALS = [
    ['give up', 'haar maan lena', 'Never give up!', 'chhod dena nahi, ladte raho'],
    ['look after', 'dekhbhal karna', 'She looks after her mom.', 'look + after alag mat karo'],
    ['look forward to', 'besabri se intezaar', 'I look forward to meeting you.', '"to meeting" — to ke baad -ing'],
    ['take off', 'udaan bharna / utarna', 'The plane took off.', 'kapde utarne me bhi use hota hai'],
    ['put off', 'taal dena', 'Don\'t put off your work.', 'postpone jaisa'],
    ['run out of', 'khatam ho jana', 'We ran out of milk.', '"of" mat bhoolo'],
    ['come across', 'achanak milna', 'I came across an old friend.', 'unexpected meeting'],
    ['get over', 'se ubharna', 'Get over your fear.', 'recover jaisa'],
    ['break down', 'kharab ho jana / toot jana', 'The car broke down.', 'rona bhi: broke down in tears'],
    ['carry on', 'jaari rakhna', 'Carry on with your work.', 'continue jaisa'],
    ['find out', 'pata lagana', 'I found out the truth.', 'discover jaisa'],
    ['turn down', 'thukra dena / kam karna', 'He turned down the offer.', 'volume kam: turn it down'],
    ['pick up', 'uthana / seekh lena', 'Pick up the phone.', 'language pick up = aasani se seekhna'],
    ['set up', 'shuru karna / lagana', 'They set up a shop.', 'establish jaisa'],
    ['go through', 'se guzarna', 'She went through a tough time.', 'experience karna'],
    ['call off', 'radh karna', 'They called off the match.', 'cancel jaisa'],
    ['bring up', 'paalna / mudda uthana', 'She brought up her kids well.', 'raise jaisa'],
    ['hold on', 'ruko / pakde raho', 'Hold on a minute!', 'phone par: line par raho']
  ];

  function getPhrasals() {
    try { if (EC.data && Array.isArray(EC.data.phrasals) && EC.data.phrasals.length) return EC.data.phrasals.map(function (p, i) {
      if (Array.isArray(p)) return { id: 'p' + i, ph: p[0], hi: p[1], ex: p[2], note: p[3] };
      return { id: 'p' + i, ph: p.phrasal || p.ph || '', hi: p.hi || p.meaning || '', ex: p.ex || p.example || '', note: p.note || '' };
    }); } catch (e) {}
    return FALLBACK_PHRASALS.map(function (p, i) { return { id: 'p' + i, ph: p[0], hi: p[1], ex: p[2], note: p[3] }; });
  }

  /* ---------- per-verb store state ---------- */
  function vstate(id) {
    var d = sdata();
    if (!d.verbs) d.verbs = {};
    if (!d.verbs[id]) d.verbs[id] = {};
    return d.verbs[id];
  }
  function isFav(id) { return !!vstate(id).fav; }
  function isLearned(id) { return !!vstate(id).learned; }

  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function sample(a, n, avoid) {
    var pool = a.filter(function (x) { return x !== avoid; });
    return shuffle(pool).slice(0, n);
  }

  /* ---------- sub-view: verb list ---------- */
  function viewList(box) {
    box.innerHTML = '';
    var verbs = getVerbs();
    var search = h('input', 'ec-search'); search.type = 'search'; search.placeholder = '🔍 Verb khojo… (jaise: go, khana)';
    box.appendChild(search);
    var bar = h('div', 'ec-sub');
    var filters = [['all', 'Sab'], ['reg', 'Regular'], ['irreg', 'Irregular'], ['learned', '✅ Learned'], ['fav', '☆ Favorites']];
    var cur = 'all', chips = [];
    filters.forEach(function (f, i) {
      var c = h('button', 'ec-chip' + (i === 0 ? ' on' : ''), f[1]); c.type = 'button';
      c.addEventListener('click', function () { chips.forEach(function (x) { x.classList.remove('on'); }); c.classList.add('on'); cur = f[0]; draw(); });
      chips.push(c); bar.appendChild(c);
    });
    box.appendChild(bar);
    var listBox = h('div', ''); box.appendChild(listBox);

    function draw() {
      listBox.innerHTML = '';
      var q = (search.value || '').toLowerCase().trim();
      var rows = verbs.filter(function (v) {
        if (cur === 'reg' && !v.reg) return false;
        if (cur === 'irreg' && v.reg) return false;
        if (cur === 'learned' && !isLearned(v.id)) return false;
        if (cur === 'fav' && !isFav(v.id)) return false;
        if (q && (v.v1 + ' ' + v.v2 + ' ' + v.v3 + ' ' + v.hi).toLowerCase().indexOf(q) < 0) return false;
        return true;
      });
      if (!rows.length) { listBox.appendChild(h('div', 'ec-hi', 'Kuch nahi mila. Search badlo ya filter hatao.')); return; }
      rows.forEach(function (v) {
        var c = h('div', 'ec-card ec-tap');
        var r = h('div', 'ec-row');
        var g = h('div', 'ec-grow');
        var t = h('div', 'ec-title', v.v1);
        g.appendChild(t);
        g.appendChild(h('div', 'ec-forms', v.v1 + ' → ' + v.v2 + ' → ' + v.v3));
        g.appendChild(h('div', 'ec-hi', v.hi + (v.reg ? ' • regular' : ' • irregular')));
        r.appendChild(g);
        r.appendChild(speakBtn(v.v1));
        var star = h('button', 'ec-star', isFav(v.id) ? '★' : '☆'); star.type = 'button'; star.title = 'Favorite';
        star.style.color = isFav(v.id) ? '#ff9500' : '#c7c7cc';
        star.addEventListener('click', function (ev) {
          ev.stopPropagation();
          var st = vstate(v.id); st.fav = !st.fav; save();
          star.textContent = st.fav ? '★' : '☆'; star.style.color = st.fav ? '#ff9500' : '#c7c7cc';
          toast(st.fav ? '⭐ Favorite me joda' : 'Favorite se hataya');
        });
        r.appendChild(star);
        var chk = h('input', 'ec-check'); chk.type = 'checkbox'; chk.checked = isLearned(v.id); chk.title = 'Learned';
        chk.addEventListener('click', function (ev) { ev.stopPropagation(); });
        chk.addEventListener('change', function () {
          vstate(v.id).learned = chk.checked; save();
          if (chk.checked) { addXP(2); toast('✅ Yaad ho gaya! +2 XP'); }
          if (cur === 'learned' || cur === 'fav') draw();
        });
        r.appendChild(chk);
        c.appendChild(r);
        c.addEventListener('click', function () { viewVerbDetail(box, v); });
        listBox.appendChild(c);
      });
    }
    var deb; search.addEventListener('input', function () { clearTimeout(deb); deb = setTimeout(draw, 150); });
    draw();
  }

  function viewVerbDetail(box, v) {
    box.innerHTML = '';
    var back = h('button', 'ec-back', '← Verbs'); back.type = 'button';
    back.addEventListener('click', function () { viewList(box); });
    box.appendChild(back);
    var c = h('div', 'ec-card');
    var r = h('div', 'ec-row');
    var g = h('div', 'ec-grow', '');
    g.appendChild(h('div', 'ec-title', v.v1 + '  •  ' + v.hi));
    r.appendChild(g); r.appendChild(speakBtn(v.v1));
    c.appendChild(r);
    var forms = [['V1 (base)', v.v1], ['V2 (past)', v.v2], ['V3 (past participle)', v.v3], ['V4 (-ing)', v.v4], ['V5 (s-form)', v.v5]];
    forms.forEach(function (f) {
      var rr = h('div', 'ec-row'); rr.style.margin = '6px 0';
      rr.appendChild(h('div', 'ec-grow', f[0] + ': ' + f[1]));
      rr.appendChild(speakBtn(f[1]));
      c.appendChild(rr);
    });
    if (v.ex) c.appendChild(h('div', 'ec-fb', '💬 ' + v.ex));
    if (v.mis && v.mis !== '-') c.appendChild(h('div', 'ec-warn', '⚠️ ' + v.mis));
    box.appendChild(c);
    var btn = h('button', 'ec-btn', isLearned(v.id) ? '✅ Learned' : 'Mark as learned');
    btn.type = 'button';
    btn.addEventListener('click', function () { vstate(v.id).learned = true; save(); addXP(2); toast('✅ +2 XP'); viewVerbDetail(box, v); });
    box.appendChild(btn);
    box.appendChild(h('div', 'ec-lbl', 'Mini quiz — V2 / V3 chuno'));
    var qbox = h('div', ''); box.appendChild(qbox);
    renderVerbQuiz(qbox, [v], getVerbs(), 'sentence');
  }

  function renderVerbQuiz(box, quizVerbs, allVerbs, skillKey) {
    box.innerHTML = '';
    var score = 0, done = 0;
    quizVerbs.forEach(function (v, i) {
      var askV2 = Math.random() < 0.5;
      var field = askV2 ? 'v2' : 'v3';
      var label = askV2 ? 'V2 (past)' : 'V3 (past participle)';
      var card = h('div', 'ec-card');
      card.appendChild(h('div', 'ec-title', (i + 1) + '. "' + v.v1 + '" (' + v.hi + ') ka ' + label + ' kya hai?'));
      var fb = h('div', 'ec-fb', '');
      var opts = shuffle([v[field]].concat(sample(allVerbs.map(function (x) { return x[field]; }), 3, v[field])));
      opts.forEach(function (opt) {
        var b = h('button', 'ec-opt', opt); b.type = 'button';
        b.addEventListener('click', function () {
          var btns = card.querySelectorAll('.ec-opt');
          for (var k = 0; k < btns.length; k++) btns[k].disabled = true;
          done++;
          if (opt === v[field]) { b.classList.add('ok'); score++; addXP(5); bumpSkill(skillKey, 1); fb.textContent = '✅ Sahi! +5 XP'; }
          else {
            b.classList.add('bad');
            for (var k2 = 0; k2 < btns.length; k2++) if (btns[k2].textContent === v[field]) btns[k2].classList.add('ok');
            fb.textContent = '❌ Sahi: ' + v[field];
          }
          if (done === quizVerbs.length) { box.appendChild(h('div', 'ec-card', '🏁 Score: ' + score + '/' + quizVerbs.length)); touchDay(); save(); }
        });
        card.appendChild(b);
      });
      card.appendChild(fb);
      box.appendChild(card);
    });
  }

  /* ---------- sub-view: flashcards ---------- */
  function viewFlashcards(box) {
    box.innerHTML = '';
    var verbs = getVerbs();
    var deck = shuffle(verbs.filter(function (v) { return !isLearned(v.id); }));
    if (!deck.length) deck = shuffle(verbs);
    var idx = 0, known = 0;
    box.appendChild(h('div', 'ec-hi', 'Card par tap karo = palto. Yaad hai to ✅, nahi to ❌.'));
    var prog = h('div', 'ec-fb', ''); box.appendChild(prog);
    var flash = h('div', 'ec-flash'); box.appendChild(flash);
    var btnRow = h('div', ''); box.appendChild(btnRow);

    function show() {
      prog.textContent = 'Card ' + (idx + 1) + ' / ' + deck.length + ' • Yaad: ' + known;
      if (idx >= deck.length) {
        flash.innerHTML = '';
        flash.appendChild(h('div', 'ec-title', '🎉 Deck khatam!'));
        flash.appendChild(h('div', 'ec-hi', known + '/' + deck.length + ' yaad'));
        btnRow.innerHTML = '';
        var again = h('button', 'ec-btn', '🔁 Phir se'); again.type = 'button';
        again.addEventListener('click', function () { viewFlashcards(box); });
        btnRow.appendChild(again);
        touchDay(); save(); return;
      }
      var v = deck[idx], flipped = false;
      flash.innerHTML = '';
      var big = h('div', 'big', v.v1);
      var small = h('div', 'small', 'Tap karo = jawab dekho');
      flash.appendChild(big); flash.appendChild(small);
      flash.onclick = function () {
        if (flipped) return; flipped = true;
        small.innerHTML = '';
        small.appendChild(h('div', '', v.v2 + ' → ' + v.v3));
        small.appendChild(h('div', 'ec-hi', v.hi));
        speak(v.v1 + '. ' + v.v2 + '. ' + v.v3 + '.');
      };
      btnRow.innerHTML = '';
      var no = h('button', 'ec-btn ghost', '❌ Yaad nahi'); no.type = 'button';
      var yes = h('button', 'ec-btn', '✅ Yaad hai'); yes.type = 'button';
      no.addEventListener('click', function () { idx++; show(); });
      yes.addEventListener('click', function () {
        known++; addXP(2); bumpSkill('vocabulary', 1);
        vstate(v.id).learned = true; save();
        idx++; show();
      });
      btnRow.appendChild(no); btnRow.appendChild(yes);
    }
    show();
  }

  /* ---------- sub-view: quiz (10 MCQs) ---------- */
  function viewQuiz(box) {
    box.innerHTML = '';
    var verbs = getVerbs();
    box.appendChild(h('div', 'ec-hi', '10 random sawal — V2/V3 forms.'));
    var start = h('button', 'ec-btn', '▶ Quiz shuru karo'); start.type = 'button';
    var qbox = h('div', ''); box.appendChild(start); box.appendChild(qbox);
    start.addEventListener('click', function () {
      start.style.display = 'none';
      renderVerbQuiz(qbox, shuffle(verbs).slice(0, 10), verbs, 'sentence');
    });
  }

  /* ---------- sub-view: daily 10 ---------- */
  function viewDaily(box) {
    box.innerHTML = '';
    var verbs = getVerbs();
    var now = new Date();
    var seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    var picks = [];
    for (var i = 0; i < 10; i++) picks.push(verbs[(seed * (i + 3) * 7919) % verbs.length]);
    box.appendChild(h('div', 'ec-title', '📅 Aaj ke 10 verbs'));
    box.appendChild(h('div', 'ec-hi', 'Har verb ko bolo, likho, yaad karo — phir tick karo.'));
    picks.forEach(function (v, i) {
      var c = h('div', 'ec-card');
      var r = h('div', 'ec-row');
      var g = h('div', 'ec-grow');
      g.appendChild(h('div', 'ec-title', (i + 1) + '. ' + v.v1 + ' → ' + v.v2 + ' → ' + v.v3));
      g.appendChild(h('div', 'ec-hi', v.hi));
      r.appendChild(g); r.appendChild(speakBtn(v.v1));
      var chk = h('input', 'ec-check'); chk.type = 'checkbox'; chk.checked = isLearned(v.id);
      chk.addEventListener('change', function () {
        vstate(v.id).learned = chk.checked; save();
        if (chk.checked) { addXP(2); bumpSkill('vocabulary', 1); toast('✅ +2 XP'); }
      });
      r.appendChild(chk);
      c.appendChild(r);
      box.appendChild(c);
    });
    touchDay();
  }

  /* ---------- sub-view: phrasal verbs ---------- */
  function viewPhrasals(box) {
    box.innerHTML = '';
    var ph = getPhrasals();
    box.appendChild(h('div', 'ec-hi', 'Phrasal verb = verb + chhota word, meaning badal jaata hai!'));
    ph.forEach(function (p) {
      var c = h('div', 'ec-card');
      var r = h('div', 'ec-row');
      var g = h('div', 'ec-grow');
      g.appendChild(h('div', 'ec-title', p.ph));
      g.appendChild(h('div', 'ec-hi', p.hi));
      g.appendChild(h('div', 'ec-fb', '💬 ' + p.ex));
      if (p.note) g.appendChild(h('div', 'ec-fb', '💡 ' + p.note));
      r.appendChild(g); r.appendChild(speakBtn(p.ph));
      c.appendChild(r);
      box.appendChild(c);
    });
    box.appendChild(h('div', 'ec-lbl', 'Phrasal verbs quiz — 5 sawal'));
    var qbox = h('div', ''); box.appendChild(qbox);
    var items = shuffle(ph).slice(0, 5).map(function (p) {
      var opts = shuffle([p.hi].concat(sample(ph.map(function (x) { return x.hi; }), 3, p.hi)));
      return { ph: p.ph, opts: opts, ans: p.hi };
    });
    var score = 0, done = 0;
    items.forEach(function (it, i) {
      var card = h('div', 'ec-card');
      card.appendChild(h('div', 'ec-title', (i + 1) + '. "' + it.ph + '" ka matlab?'));
      var fb = h('div', 'ec-fb', '');
      it.opts.forEach(function (opt) {
        var b = h('button', 'ec-opt', opt); b.type = 'button';
        b.addEventListener('click', function () {
          var btns = card.querySelectorAll('.ec-opt');
          for (var k = 0; k < btns.length; k++) btns[k].disabled = true;
          done++;
          if (opt === it.ans) { b.classList.add('ok'); score++; addXP(5); bumpSkill('vocabulary', 1); fb.textContent = '✅ Sahi! +5 XP'; }
          else { b.classList.add('bad'); for (var k2 = 0; k2 < btns.length; k2++) if (btns[k2].textContent === it.ans) btns[k2].classList.add('ok'); fb.textContent = '❌ Sahi: ' + it.ans; }
          if (done === items.length) { box.appendChild(h('div', 'ec-card', '🏁 Score: ' + score + '/' + items.length)); touchDay(); save(); }
        });
        card.appendChild(b);
      });
      card.appendChild(fb);
      qbox.appendChild(card);
    });
  }

  /* ---------- register ---------- */
  EC.register('verbs', {
    title: 'Verbs',
    icon: '📚',
    render: function (containerEl) {
      injectCSS();
      touchDay();
      var root = h('div', 'ecV');
      containerEl.innerHTML = '';
      containerEl.appendChild(root);
      var bar = h('div', 'ec-sub');
      var body = h('div', '');
      root.appendChild(bar); root.appendChild(body);
      var tabs = [
        ['Verbs', viewList], ['🃏 Flashcards', viewFlashcards], ['❓ Quiz', viewQuiz],
        ['📅 Daily 10', viewDaily], ['🧩 Phrasal Verbs', viewPhrasals]
      ];
      var chips = [];
      tabs.forEach(function (tb, i) {
        var c = h('button', 'ec-chip' + (i === 0 ? ' on' : ''), tb[0]); c.type = 'button';
        c.addEventListener('click', function () { chips.forEach(function (x) { x.classList.remove('on'); }); c.classList.add('on'); tb[1](body); });
        chips.push(c); bar.appendChild(c);
      });
      tabs[0][1](body);
    }
  });
})();
