/* ============================================================
   My AI English Coach — UI TAB GROUP B
   Tab: vocab (🔤) — Words, SRS flashcards, quizzes, idioms
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

  var CSS_ID = 'ec-tab-vocab-css';
  function injectCSS() {
    if (document.getElementById(CSS_ID)) return;
    var s = document.createElement('style'); s.id = CSS_ID;
    s.textContent = [
      '.ecW{font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.5;color:#1c1c1e;}',
      '.ecW .ec-sub{display:flex;gap:8px;overflow-x:auto;padding:8px 0;margin-bottom:6px;}',
      '.ecW .ec-chip{flex:0 0 auto;border:1px solid #d1d1d6;background:#f2f2f7;border-radius:999px;padding:8px 14px;font-size:14px;cursor:pointer;}',
      '.ecW .ec-chip.on{background:#0a84ff;color:#fff;border-color:#0a84ff;}',
      '.ecW .ec-card{background:#fff;border:1px solid #e5e5ea;border-radius:14px;padding:14px;margin:10px 0;box-shadow:0 1px 3px rgba(0,0,0,.06);}',
      '.ecW .ec-row{display:flex;align-items:center;gap:10px;}',
      '.ecW .ec-grow{flex:1;}',
      '.ecW .ec-title{font-weight:700;font-size:17px;}',
      '.ecW .ec-hi{color:#636366;font-size:13px;}',
      '.ecW .ec-lbl{font-size:12px;font-weight:700;color:#8e8e93;text-transform:uppercase;letter-spacing:.4px;margin:12px 0 4px;}',
      '.ecW .ec-say{border:none;background:#e5f0ff;border-radius:50%;width:34px;height:34px;font-size:16px;cursor:pointer;flex:0 0 auto;}',
      '.ecW .ec-opt{display:block;width:100%;text-align:left;border:1px solid #d1d1d6;background:#fff;border-radius:10px;padding:10px;margin:6px 0;font-size:14px;cursor:pointer;}',
      '.ecW .ec-opt.ok{background:#d7f0d8;border-color:#34c759;}',
      '.ecW .ec-opt.bad{background:#fbd9d5;border-color:#ff3b30;}',
      '.ecW .ec-opt:disabled{opacity:.85;cursor:default;}',
      '.ecW .ec-fb{font-size:13px;margin:4px 0 10px;color:#636366;}',
      '.ecW .ec-btn{background:#0a84ff;color:#fff;border:none;border-radius:10px;padding:10px 16px;font-size:15px;cursor:pointer;margin:4px 6px 4px 0;}',
      '.ecW .ec-btn.ghost{background:#f2f2f7;color:#1c1c1e;}',
      '.ecW .ec-search{width:100%;box-sizing:border-box;border:1px solid #d1d1d6;border-radius:10px;padding:10px;font-size:15px;margin:4px 0;}',
      '.ecW .ec-pos{display:inline-block;background:#e8f0ff;color:#0a54a8;border-radius:6px;padding:2px 8px;font-size:12px;font-style:italic;margin-left:8px;}',
      '.ecW .ec-flash{min-height:230px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;cursor:pointer;background:linear-gradient(135deg,#fff3e0,#ffe8f0);border-radius:16px;padding:24px;margin:10px 0;}',
      '.ecW .ec-flash .big{font-size:34px;font-weight:800;}',
      '.ecW .ec-flash .small{font-size:15px;color:#636366;margin-top:10px;}',
      '.ecW .ec-syn{font-size:13px;color:#0a84ff;}',
      '.ecW .ec-ant{font-size:13px;color:#ff6b00;}',
      '.ecW .ec-star{border:none;background:none;font-size:22px;cursor:pointer;flex:0 0 auto;}',
      '.ecW .ec-box{font-size:11px;background:#f2f2f7;border-radius:6px;padding:2px 8px;color:#8e8e93;margin-left:8px;}'
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ---------- built-in word data (fallback) ---------- */
  /* [word, pos, hinglish, simple meaning, example, synonyms, antonyms, category] */
  var FALLBACK_WORDS = [
    ['happy', 'adj', 'khush', 'feeling good', 'I am happy today.', 'glad, joyful', 'sad', 'Emotions'],
    ['sad', 'adj', 'udaas', 'feeling bad', 'She feels sad.', 'unhappy, gloomy', 'happy', 'Emotions'],
    ['angry', 'adj', 'gussa', 'very upset', 'He got angry.', 'furious, mad', 'calm', 'Emotions'],
    ['excited', 'adj', 'utsahit', 'very happy about something', 'We are excited for the trip.', 'thrilled', 'bored', 'Emotions'],
    ['nervous', 'adj', 'ghabraya hua', 'worried', 'I feel nervous before exams.', 'anxious', 'confident', 'Emotions'],
    ['confident', 'adj', 'aatmavishwasi', 'believing in yourself', 'Speak with confidence.', 'sure', 'nervous', 'Emotions'],
    ['brave', 'adj', 'bahadur', 'not afraid', 'The brave boy saved the dog.', 'courageous', 'coward', 'Emotions'],
    ['kind', 'adj', 'dayalu', 'nice to others', 'She is kind to animals.', 'gentle', 'cruel', 'Emotions'],
    ['honest', 'adj', 'imaandar', 'truthful', 'Be honest always.', 'truthful', 'dishonest', 'Emotions'],
    ['lazy', 'adj', 'aalsi', 'not wanting to work', 'Don\'t be lazy.', 'idle', 'hardworking', 'Emotions'],
    ['journey', 'noun', 'safar', 'travelling from one place to another', 'The journey was long.', 'trip, travel', '-', 'Travel'],
    ['ticket', 'noun', 'ticket', 'paper to travel/enter', 'Buy two tickets.', 'pass', '-', 'Travel'],
    ['luggage', 'noun', 'samaan', 'bags you carry', 'My luggage is heavy.', 'baggage', '-', 'Travel'],
    ['delay', 'noun/verb', 'deri', 'late', 'The flight is delayed.', 'late', 'on time', 'Travel'],
    ['arrive', 'verb', 'pahunchna', 'to reach', 'We arrived at 9.', 'reach', 'depart', 'Travel'],
    ['depart', 'verb', 'rawana hona', 'to leave', 'The train departs at 6.', 'leave', 'arrive', 'Travel'],
    ['explore', 'verb', 'khojna / ghoomna', 'to travel and discover', 'Explore new places.', 'discover', '-', 'Travel'],
    ['view', 'noun', 'nazara', 'what you see', 'The view is beautiful.', 'sight, scene', '-', 'Travel'],
    ['meeting', 'noun', 'baithak', 'people coming together for work', 'I have a meeting at 3.', '-', '-', 'Work'],
    ['deadline', 'noun', 'aakhri tareekh', 'last date to finish', 'The deadline is Friday.', '-', '-', 'Work'],
    ['salary', 'noun', 'tankhwah', 'monthly pay', 'My salary is good.', 'pay, wages', '-', 'Work'],
    ['colleague', 'noun', 'sahakarmi', 'person you work with', 'My colleague is helpful.', 'coworker', '-', 'Work'],
    ['promotion', 'noun', 'tarakki', 'going to a higher post', 'He got a promotion.', '-', 'demotion', 'Work'],
    ['interview', 'noun', 'sakshatkar', 'meeting for a job', 'I have an interview tomorrow.', '-', '-', 'Work'],
    ['experience', 'noun', 'anubhav', 'what you have done/learned', 'I have 5 years of experience.', '-', '-', 'Work'],
    ['skill', 'noun', 'kaushal', 'ability to do something', 'Learn new skills.', 'ability', '-', 'Work'],
    ['exam', 'noun', 'pariksha', 'test', 'My exam is next week.', 'test', '-', 'Study'],
    ['chapter', 'noun', 'adhyay', 'part of a book', 'Read chapter 5.', 'lesson', '-', 'Study'],
    ['revise', 'verb', 'dohrana', 'to study again', 'Revise before the exam.', 'review', '-', 'Study'],
    ['doubt', 'noun', 'shak / sawal', 'not sure', 'Clear your doubts.', 'question', 'certainty', 'Study'],
    ['focus', 'verb', 'dhyaan dena', 'to concentrate', 'Focus on your goal.', 'concentrate', 'distract', 'Study'],
    ['improve', 'verb', 'sudharna', 'to become better', 'I want to improve my English.', 'enhance', 'worsen', 'Study'],
    ['practice', 'verb/noun', 'abhyas', 'doing again and again', 'Practice makes perfect.', 'rehearse', '-', 'Study'],
    ['delicious', 'adj', 'swadisht', 'tasty', 'The food is delicious.', 'tasty, yummy', 'tasteless', 'Food'],
    ['hungry', 'adj', 'bhookha', 'wanting food', 'I am hungry.', 'starving', 'full', 'Food'],
    ['thirsty', 'adj', 'pyasa', 'wanting water', 'Drink if you are thirsty.', '-', '-', 'Food'],
    ['recipe', 'noun', 'pakane ki vidhi', 'how to cook', 'Share the recipe.', '-', '-', 'Food'],
    ['spicy', 'adj', 'teekha', 'hot taste', 'This curry is spicy.', 'hot', 'mild', 'Food'],
    ['sweet', 'adj', 'meetha', 'sugary taste', 'I like sweet tea.', '-', 'bitter', 'Food'],
    ['fresh', 'adj', 'taaza', 'new/not old', 'Buy fresh vegetables.', 'new', 'stale', 'Food'],
    ['habit', 'noun', 'aadat', 'thing you do regularly', 'Reading is a good habit.', 'routine', '-', 'Daily'],
    ['routine', 'noun', 'dincharya', 'daily schedule', 'My morning routine.', 'schedule', '-', 'Daily'],
    ['chore', 'noun', 'ghar ka kaam', 'small home task', 'Do your chores.', 'task', '-', 'Daily'],
    ['wake up', 'verb', 'uthna', 'to stop sleeping', 'I wake up at 6.', 'rise', 'sleep', 'Daily'],
    ['hurry', 'verb', 'jaldi karna', 'to go fast', 'Hurry up!', 'rush', 'delay', 'Daily'],
    ['remember', 'verb', 'yaad rakhna', 'to not forget', 'Remember my name.', 'recall', 'forget', 'Daily'],
    ['forget', 'verb', 'bhool jana', 'to not remember', 'Don\'t forget your keys.', '-', 'remember', 'Daily'],
    ['decide', 'verb', 'faisla karna', 'to choose', 'I decided to learn English.', 'choose', '-', 'Daily']
  ];

  var FALLBACK_IDIOMS = [
    ['Break the ice', 'pehli baar baat shuru karna (sharm khatam karna)', 'He told a joke to break the ice.'],
    ['Piece of cake', 'bahut aasaan kaam', 'The exam was a piece of cake.'],
    ['Hit the books', 'padhai me lag jana', 'Exams are near, hit the books!'],
    ['Under the weather', 'halka beemar mehsoos karna', 'I feel under the weather today.'],
    ['Spill the beans', 'raaz khol dena', 'Spill the beans! What happened?'],
    ['Cost an arm and a leg', 'bahut mehanga', 'This phone costs an arm and a leg.'],
    ['Once in a blue moon', 'bahut kam-kabhi', 'We meet once in a blue moon.'],
    ['The ball is in your court', 'ab tumhari baari / faisla tumhara', 'The ball is in your court now.'],
    ['Let the cat out of the bag', 'galti se raaz bata dena', 'He let the cat out of the bag.'],
    ['Bite the bullet', 'mushkil kaam himmat se karna', 'Bite the bullet and start.'],
    ['Burn the midnight oil', 'der raat tak padhai/kaam', 'She burned the midnight oil for exams.'],
    ['A blessing in disguise', 'museebat jo faydemand nikle', 'Losing that job was a blessing in disguise.'],
    ['Cry over spilt milk', 'beeti baat par rona', 'Don\'t cry over spilt milk.'],
    ['Kill two birds with one stone', 'ek teer se do nishane', 'Cycling to work kills two birds with one stone.'],
    ['On cloud nine', 'bahut khush', 'She is on cloud nine after the result.'],
    ['Speak of the devil', 'jiski baat, woh haazir', 'Speak of the devil! We were just talking about you.'],
    ['In hot water', 'museebat me', 'He is in hot water with his boss.'],
    ['Go the extra mile', 'zyada mehnat karna', 'Go the extra mile to succeed.']
  ];

  function normWords(raw) {
    if (!Array.isArray(raw) || !raw.length) return null;
    return raw.map(function (w, i) {
      if (Array.isArray(w)) return { id: 'w' + i, word: w[0], pos: w[1], hi: w[2], mean: w[3], ex: w[4], syn: w[5], ant: w[6], cat: w[7] || 'General' };
      return { id: 'w' + i, word: w.word || '', pos: w.pos || '', hi: w.hi || w.hinglish || '', mean: w.mean || w.meaning || '', ex: w.ex || w.example || '', syn: w.syn || w.synonyms || '', ant: w.ant || w.antonyms || '', cat: w.cat || w.category || 'General' };
    });
  }
  function getWords() {
    var r = null;
    try { if (EC.data && EC.data.words) r = normWords(EC.data.words); } catch (e) {}
    return r || normWords(FALLBACK_WORDS);
  }
  function getIdioms() {
    try {
      if (EC.data && Array.isArray(EC.data.idioms) && EC.data.idioms.length) return EC.data.idioms.map(function (x, i) {
        if (Array.isArray(x)) return { id: 'i' + i, idiom: x[0], hi: x[1], ex: x[2] };
        return { id: 'i' + i, idiom: x.idiom || '', hi: x.hi || x.meaning || '', ex: x.ex || x.example || '' };
      });
    } catch (e) {}
    return FALLBACK_IDIOMS.map(function (x, i) { return { id: 'i' + i, idiom: x[0], hi: x[1], ex: x[2] }; });
  }

  /* ---------- SRS store ---------- */
  var DAY = 86400000;
  function ventry(id) {
    var d = sdata();
    if (!d.vocab) d.vocab = {};
    if (!d.vocab[id]) d.vocab[id] = { box: 0, next: 0, fav: false };
    return d.vocab[id];
  }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function dueFirst(words) {
    var now = Date.now();
    return words.slice().sort(function (a, b) {
      var ea = ventry(a.id), eb = ventry(b.id);
      var da = (ea.box === 0 || ea.next <= now) ? 0 : 1;
      var db = (eb.box === 0 || eb.next <= now) ? 0 : 1;
      if (da !== db) return da - db;
      return ea.next - eb.next;
    });
  }

  /* ---------- sub-view: word list ---------- */
  function viewWords(box) {
    box.innerHTML = '';
    var words = getWords();
    var cats = ['All'];
    words.forEach(function (w) { if (cats.indexOf(w.cat) < 0) cats.push(w.cat); });
    cats.push('☆ Favorites');
    var search = h('input', 'ec-search'); search.type = 'search'; search.placeholder = '🔍 Word khojo…';
    box.appendChild(search);
    var bar = h('div', 'ec-sub'); box.appendChild(bar);
    var cur = 'All', chips = [];
    cats.forEach(function (cname, i) {
      var c = h('button', 'ec-chip' + (i === 0 ? ' on' : ''), cname); c.type = 'button';
      c.addEventListener('click', function () { chips.forEach(function (x) { x.classList.remove('on'); }); c.classList.add('on'); cur = cname; draw(); });
      chips.push(c); bar.appendChild(c);
    });
    var listBox = h('div', ''); box.appendChild(listBox);
    function draw() {
      listBox.innerHTML = '';
      var q = (search.value || '').toLowerCase().trim();
      var rows = words.filter(function (w) {
        if (cur === '☆ Favorites') { if (!ventry(w.id).fav) return false; }
        else if (cur !== 'All' && w.cat !== cur) return false;
        if (q && (w.word + ' ' + w.hi + ' ' + w.mean).toLowerCase().indexOf(q) < 0) return false;
        return true;
      });
      if (!rows.length) { listBox.appendChild(h('div', 'ec-hi', 'Kuch nahi mila.')); return; }
      rows.forEach(function (w) {
        var e = ventry(w.id);
        var c = h('div', 'ec-card');
        var r = h('div', 'ec-row');
        var g = h('div', 'ec-grow');
        var title = h('span', 'ec-title', w.word);
        g.appendChild(title);
        if (w.pos) g.appendChild(h('span', 'ec-pos', w.pos));
        if (e.box > 0) g.appendChild(h('span', 'ec-box', 'Box ' + e.box));
        g.appendChild(h('div', 'ec-hi', w.hi + (w.mean ? ' • ' + w.mean : '')));
        g.appendChild(h('div', 'ec-fb', '💬 ' + w.ex));
        if (w.syn && w.syn !== '-') g.appendChild(h('div', 'ec-syn', '↔ Syn: ' + w.syn));
        if (w.ant && w.ant !== '-') g.appendChild(h('div', 'ec-ant', '↔ Ant: ' + w.ant));
        r.appendChild(g); r.appendChild(speakBtn(w.word + '. ' + w.ex));
        var star = h('button', 'ec-star', e.fav ? '★' : '☆'); star.type = 'button';
        star.style.color = e.fav ? '#ff9500' : '#c7c7cc';
        star.addEventListener('click', function () { e.fav = !e.fav; save(); star.textContent = e.fav ? '★' : '☆'; star.style.color = e.fav ? '#ff9500' : '#c7c7cc'; if (cur === '☆ Favorites') draw(); });
        r.appendChild(star);
        c.appendChild(r);
        listBox.appendChild(c);
      });
    }
    var deb; search.addEventListener('input', function () { clearTimeout(deb); deb = setTimeout(draw, 150); });
    draw();
  }

  /* ---------- sub-view: SRS flashcards ---------- */
  function viewFlash(box) {
    box.innerHTML = '';
    var words = getWords();
    var deck = dueFirst(words).slice(0, 20);
    var idx = 0, right = 0;
    box.appendChild(h('div', 'ec-hi', 'SRS flashcards — pehle due words, phir baaki. Sahi = box upar, galat = box 1.'));
    var prog = h('div', 'ec-fb', ''); box.appendChild(prog);
    var flash = h('div', 'ec-flash'); box.appendChild(flash);
    var btnRow = h('div', ''); box.appendChild(btnRow);
    function show() {
      prog.textContent = 'Card ' + Math.min(idx + 1, deck.length) + ' / ' + deck.length + ' • Sahi: ' + right;
      if (idx >= deck.length) {
        flash.innerHTML = '';
        flash.appendChild(h('div', 'ec-title', '🎉 Session khatam!'));
        flash.appendChild(h('div', 'ec-hi', right + '/' + deck.length + ' sahi'));
        btnRow.innerHTML = '';
        var again = h('button', 'ec-btn', '🔁 Naya session'); again.type = 'button';
        again.addEventListener('click', function () { viewFlash(box); });
        btnRow.appendChild(again);
        touchDay(); save(); return;
      }
      var w = deck[idx], flipped = false, e = ventry(w.id);
      flash.innerHTML = '';
      flash.appendChild(h('div', 'ec-big', w.word));
      var sm = h('div', 'ec-small', 'Tap karo = meaning dekho'); flash.appendChild(sm);
      flash.onclick = function () {
        if (flipped) return; flipped = true;
        sm.innerHTML = '';
        sm.appendChild(h('div', '', w.hi + (w.mean ? ' (' + w.mean + ')' : '')));
        sm.appendChild(h('div', 'ec-fb', '💬 ' + w.ex));
        speak(w.word + '. ' + w.ex);
      };
      btnRow.innerHTML = '';
      var no = h('button', 'ec-btn ghost', '❌ Bhool gaya'); no.type = 'button';
      var yes = h('button', 'ec-btn', '✅ Yaad tha'); yes.type = 'button';
      no.addEventListener('click', function () {
        e.box = 1; e.next = Date.now() + 10 * 60000; save(); idx++; show();
      });
      yes.addEventListener('click', function () {
        right++; e.box = Math.min((e.box || 0) + 1, 8); e.next = Date.now() + e.box * DAY; save();
        addXP(3); bumpSkill('vocabulary', 1); idx++; show();
      });
      btnRow.appendChild(no); btnRow.appendChild(yes);
    }
    show();
  }

  /* ---------- sub-view: quizzes ---------- */
  function mcq(card, qtext, options, answer, why) {
    card.appendChild(h('div', 'ec-title', qtext));
    var fb = h('div', 'ec-fb', '');
    options.forEach(function (opt) {
      var b = h('button', 'ec-opt', opt); b.type = 'button';
      b.addEventListener('click', function () {
        var btns = card.querySelectorAll('.ec-opt');
        for (var k = 0; k < btns.length; k++) btns[k].disabled = true;
        if (opt === answer) { b.classList.add('ok'); addXP(5); bumpSkill('vocabulary', 1); fb.textContent = '✅ Sahi! +5 XP' + (why ? ' — ' + why : ''); card._ok = true; }
        else { b.classList.add('bad'); for (var k2 = 0; k2 < btns.length; k2++) if (btns[k2].textContent === answer) btns[k2].classList.add('ok'); fb.textContent = '❌ Sahi: ' + answer + (why ? ' — ' + why : ''); }
        card._done = true;
      });
      card.appendChild(b);
    });
    card.appendChild(fb);
    return card;
  }

  function viewQuizzes(box) {
    box.innerHTML = '';
    var words = getWords();
    box.appendChild(h('div', 'ec-lbl', 'Quiz type chuno'));
    var bar = h('div', 'ec-sub'); box.appendChild(bar);
    var qbox = h('div', ''); box.appendChild(qbox);
    function optWords(n, avoid) { return shuffle(words.filter(function (w) { return w.word !== avoid; })).slice(0, n).map(function (w) { return w.word; }); }
    var modes = [
      ['📖 Definition match', function () {
        qbox.innerHTML = '';
        shuffle(words).slice(0, 8).forEach(function (w, i) {
          var card = h('div', 'ec-card');
          var opts = shuffle([w.word].concat(optWords(3, w.word)));
          mcq(card, (i + 1) + '. "' + w.hi + (w.mean ? ' / ' + w.mean : '') + '" — kaunsa word?', opts, w.word, w.ex);
          qbox.appendChild(card);
        });
        touchDay();
      }],
      ['✍️ Word in context', function () {
        qbox.innerHTML = '';
        shuffle(words).slice(0, 8).forEach(function (w, i) {
          var card = h('div', 'ec-card');
          var sent = w.ex.replace(new RegExp(w.word.split(' ')[0], 'i'), '_____');
          if (sent === w.ex) sent = '_____ — ' + w.hi;
          var opts = shuffle([w.word].concat(optWords(3, w.word)));
          mcq(card, (i + 1) + '. ' + sent, opts, w.word, w.ex);
          var sp = h('div', ''); sp.appendChild(speakBtn(w.ex.replace(new RegExp(w.word.split(' ')[0], 'i'), w.word))); card.appendChild(sp);
          qbox.appendChild(card);
        });
        touchDay();
      }]
    ];
    var chips = [];
    modes.forEach(function (m, i) {
      var c = h('button', 'ec-chip' + (i === 0 ? ' on' : ''), m[0]); c.type = 'button';
      c.addEventListener('click', function () { chips.forEach(function (x) { x.classList.remove('on'); }); c.classList.add('on'); m[1](); });
      chips.push(c); bar.appendChild(c);
    });
    modes[0][1]();
  }

  /* ---------- sub-view: idioms ---------- */
  function viewIdioms(box) {
    box.innerHTML = '';
    var idioms = getIdioms();
    box.appendChild(h('div', 'ec-hi', 'Idioms = aise phrases jinka matlab shabdon se alag hota hai. 😎'));
    idioms.forEach(function (im) {
      var c = h('div', 'ec-card');
      var r = h('div', 'ec-row');
      var g = h('div', 'ec-grow');
      g.appendChild(h('div', 'ec-title', '💡 ' + im.idiom));
      g.appendChild(h('div', 'ec-hi', im.hi));
      g.appendChild(h('div', 'ec-fb', '💬 ' + im.ex));
      r.appendChild(g); r.appendChild(speakBtn(im.idiom + '. ' + im.ex));
      c.appendChild(r);
      box.appendChild(c);
    });
    box.appendChild(h('div', 'ec-lbl', 'Idioms quiz — 5 sawal'));
    var score = 0, done = 0;
    var items = shuffle(idioms).slice(0, 5);
    items.forEach(function (im, i) {
      var card = h('div', 'ec-card');
      var opts = shuffle([im.hi].concat(shuffle(idioms.filter(function (x) { return x.idiom !== im.idiom; })).slice(0, 3).map(function (x) { return x.hi; })));
      mcq(card, (i + 1) + '. "' + im.idiom + '" ka matlab?', opts, im.hi, im.ex);
      box.appendChild(card);
    });
  }

  /* ---------- register ---------- */
  EC.register('vocab', {
    title: 'Vocabulary',
    icon: '🔤',
    render: function (containerEl) {
      injectCSS();
      touchDay();
      var root = h('div', 'ecW');
      containerEl.innerHTML = '';
      containerEl.appendChild(root);
      var bar = h('div', 'ec-sub');
      var body = h('div', '');
      root.appendChild(bar); root.appendChild(body);
      var tabs = [
        ['Words', viewWords], ['🃏 Flashcards', viewFlash],
        ['❓ Quizzes', viewQuizzes], ['💡 Idioms', viewIdioms]
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
