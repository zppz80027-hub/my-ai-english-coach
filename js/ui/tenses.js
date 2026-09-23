/* ============================================================
   My AI English Coach — UI TAB GROUP B
   Tab: tenses (⏳) — Tenses, Tense Comparison, Conditionals, Modals
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
  function save() { try { if (store && typeof store.save === 'function') store.save(); } catch (e) {} }
  function touchDay() { try { if (typeof EC.touchDay === 'function') EC.touchDay(); } catch (e) {} }
  function addXP(n) { try { if (typeof EC.addXP === 'function') EC.addXP(n); } catch (e) {} }
  function bumpSkill(s, n) { try { if (typeof EC.bumpSkill === 'function') EC.bumpSkill(s, n == null ? 1 : n); } catch (e) {} }
  function toast(m) { try { if (typeof U.toast === 'function') { U.toast(m); return; } } catch (e) {} }
  function h(tag, cls, text) {
    var e;
    try {
      if (typeof U.el === 'function') { e = U.el(tag, cls); if (!e || !e.appendChild) throw 0; }
      else throw 0;
    } catch (err) { e = document.createElement(tag); if (cls) e.className = cls; }
    if (text != null) e.textContent = text;
    return e;
  }
  function speak(t) {
    try {
      if (typeof SP.speak === 'function') { SP.speak(t); return; }
    } catch (e) {}
    try {
      var u = new SpeechSynthesisUtterance(t); u.lang = 'en-US';
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
    } catch (e) {}
  }
  function speakBtn(t) {
    try {
      if (typeof U.speakBtn === 'function') { var b = U.speakBtn(t); if (b) return b; }
    } catch (e) {}
    var b2 = h('button', 'ec-say', '🔊');
    b2.type = 'button';
    b2.addEventListener('click', function (ev) { ev.stopPropagation(); speak(t); });
    return b2;
  }

  /* ---------- scoped CSS (injected once) ---------- */
  var CSS_ID = 'ec-tab-tenses-css';
  function injectCSS() {
    if (document.getElementById(CSS_ID)) return;
    var s = document.createElement('style');
    s.id = CSS_ID;
    s.textContent = [
      '.ecT{font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.5;color:#1c1c1e;}',
      '.ecT .ec-sub{display:flex;gap:8px;overflow-x:auto;padding:8px 0;margin-bottom:6px;}',
      '.ecT .ec-chip{flex:0 0 auto;border:1px solid #d1d1d6;background:#f2f2f7;border-radius:999px;padding:8px 14px;font-size:14px;cursor:pointer;}',
      '.ecT .ec-chip.on{background:#0a84ff;color:#fff;border-color:#0a84ff;}',
      '.ecT .ec-card{background:#fff;border:1px solid #e5e5ea;border-radius:14px;padding:14px;margin:10px 0;box-shadow:0 1px 3px rgba(0,0,0,.06);}',
      '.ecT .ec-row{display:flex;align-items:center;gap:10px;}',
      '.ecT .ec-grow{flex:1;}',
      '.ecT .ec-title{font-weight:700;font-size:16px;}',
      '.ecT .ec-hi{color:#636366;font-size:13px;margin-top:2px;}',
      '.ecT .ec-lbl{font-size:12px;font-weight:700;color:#8e8e93;text-transform:uppercase;letter-spacing:.4px;margin:12px 0 4px;}',
      '.ecT .ec-ex{background:#f2f2f7;border-radius:10px;padding:8px 10px;margin:6px 0;display:flex;align-items:center;gap:8px;}',
      '.ecT .ec-say{border:none;background:#e5f0ff;border-radius:50%;width:34px;height:34px;font-size:16px;cursor:pointer;flex:0 0 auto;}',
      '.ecT .ec-back{border:1px solid #d1d1d6;background:#fff;border-radius:999px;padding:8px 14px;cursor:pointer;font-size:14px;margin-bottom:4px;}',
      '.ecT .ec-formula{background:#fff8e1;border:1px dashed #e0a800;border-radius:10px;padding:10px;font-family:monospace;font-size:14px;margin:6px 0;}',
      '.ecT .ec-trick{background:#e8f5e9;border-radius:10px;padding:10px;margin:8px 0;font-size:14px;}',
      '.ecT .ec-warn{background:#fdecea;border-radius:10px;padding:10px;margin:8px 0;font-size:14px;}',
      '.ecT .ec-opt{display:block;width:100%;text-align:left;border:1px solid #d1d1d6;background:#fff;border-radius:10px;padding:10px;margin:6px 0;font-size:14px;cursor:pointer;}',
      '.ecT .ec-opt.ok{background:#d7f0d8;border-color:#34c759;}',
      '.ecT .ec-opt.bad{background:#fbd9d5;border-color:#ff3b30;}',
      '.ecT .ec-opt:disabled{opacity:.85;cursor:default;}',
      '.ecT .ec-fb{font-size:13px;margin:4px 0 10px;color:#636366;}',
      '.ecT .ec-btn{background:#0a84ff;color:#fff;border:none;border-radius:10px;padding:10px 16px;font-size:15px;cursor:pointer;}',
      '.ecT .ec-vs{display:grid;grid-template-columns:1fr;gap:6px;}',
      '.ecT .ec-vs .ec-cell{border-left:4px solid #0a84ff;padding:8px 10px;background:#f8f9ff;border-radius:0 10px 10px 0;}',
      '.ecT .ec-tap{cursor:pointer;}',
      '.ecT ul{margin:4px 0;padding-left:20px;}',
      '.ecT .ec-pill{display:inline-block;background:#eef;border-radius:999px;padding:2px 10px;font-size:12px;margin:2px 4px 2px 0;}'
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ---------- data (built-in fallback; EC.data overrides when present) ---------- */
  function D(p, fb) { try { var v = p(); if (v != null) return v; } catch (e) {} return fb; }

  var TENSES = [
    { n: 'Present Simple', hi: 'aadat, daily routine, universal truth', f: 'Subject + V1 (s/es)', help: 'do / does', use: ['roz ki aadat (I wake up at 6)', 'fact (The sun rises in the east)', 'timetable (The train leaves at 9)'], sig: ['always', 'usually', 'every day', 'never', 'often'], pos: 'She plays cricket.', neg: 'She does not play cricket.', q: 'Does she play cricket?', mis: 'He go ❌ → He goes ✅ (he/she/it ke saath s/es lagao)', trick: '🧠 "Simple = Seedha": daily life seedhi baat, no drama — V1 bas.' },
    { n: 'Present Continuous', hi: 'abhi is waqt chal raha kaam', f: 'Subject + am/is/are + V1+ing', help: 'am / is / are', use: ['abhi ho raha kaam (I am eating)', 'temporary situation (I am staying with friends)', 'near future plan (I am meeting him tomorrow)'], sig: ['now', 'right now', 'at the moment', 'currently'], pos: 'They are playing now.', neg: 'They are not playing now.', q: 'Are they playing now?', mis: 'I am agree ❌ → I agree ✅ (stative verbs me -ing nahi: know, like, want, agree)', trick: '🧠 "-ing = chal raha hai": verb ke peeche ing = action live!' },
    { n: 'Present Perfect', hi: 'kaam ho chuka, result abhi dikh raha', f: 'Subject + has/have + V3', help: 'has / have', use: ['just hua kaam (I have just eaten)', 'life experience (I have visited Delhi)', 'abhi tak ka result (She has finished homework)'], sig: ['just', 'already', 'yet', 'ever', 'never', 'since', 'for'], pos: 'I have finished my work.', neg: 'I have not finished my work.', q: 'Have you finished your work?', mis: 'I have went ❌ → I have gone ✅ (perfect me hamesha V3)', trick: '🧠 "Perfect = poora ho gaya": has/have + V3 = kaam complete, asar abhi.' },
    { n: 'Present Perfect Continuous', hi: 'past se lekar ab tak lagatar chal raha', f: 'Subject + has/have been + V1+ing', help: 'has been / have been', use: ['kab se chal raha (I have been waiting since 5)', 'lambi chalti activity ka zor'], sig: ['since', 'for', 'all day', 'how long'], pos: 'She has been cooking since morning.', neg: 'She has not been cooking since morning.', q: 'Has she been cooking since morning?', mis: 'since/for ulta: since = point of time (since Monday), for = duration (for 2 hours)', trick: '🧠 "been + ing = behta hua": since/for dikhe to yehi tense pakdo.' },
    { n: 'Past Simple', hi: 'beeta hua poora kaam', f: 'Subject + V2', help: 'did (question/negative)', use: ['finished past action (I met him yesterday)', 'past habit (We played daily)', 'story telling'], sig: ['yesterday', 'last night', 'ago', 'in 2020'], pos: 'He bought a car.', neg: 'He did not buy a car.', q: 'Did he buy a car?', mis: 'Did you went ❌ → Did you go ✅ (did ke baad V1)', trick: '🧠 "V2 = beet gaya": bas ek V2, kaam khatam, baat khatam.' },
    { n: 'Past Continuous', hi: 'past me ek time par chal raha tha', f: 'Subject + was/were + V1+ing', help: 'was / were', use: ['background action (I was sleeping at 10)', 'interrupted action (I was eating when he came)', 'do parallel actions (While I cooked, she cleaned)'], sig: ['while', 'when', 'at 8 pm yesterday'], pos: 'They were watching TV.', neg: 'They were not watching TV.', q: 'Were they watching TV?', mis: 'I was go ❌ → I was going ✅', trick: '🧠 "was + ing = scene set": kahani ka background music.' },
    { n: 'Past Perfect', hi: 'past me usse bhi pehle hua kaam', f: 'Subject + had + V3', help: 'had', use: ['do past actions ka order (Train had left before I reached)', 'reported speech me'], sig: ['before', 'after', 'by the time', 'already (past)'], pos: 'She had left before I came.', neg: 'She had not left before I came.', q: 'Had she left before you came?', mis: 'Had ke saath V2 ❌ → hamesha V3 ✅', trick: '🧠 "had = double past": past ka bhi past — pehle wala kaam had+V3.' },
    { n: 'Past Perfect Continuous', hi: 'past me ek point tak lagatar chal raha tha', f: 'Subject + had been + V1+ing', help: 'had been', use: ['lambi past activity (He had been working for 5 hours)', 'thakaan/asaar dikhana'], sig: ['since', 'for', 'all day (past)'], pos: 'I had been waiting for two hours.', neg: 'I had not been waiting for two hours.', q: 'Had you been waiting long?', mis: 'had been ke baad V1+ing, V3 nahi', trick: '🧠 "had been + ing = thaka hua past": der tak chala tha.' },
    { n: 'Future Simple', hi: 'aane wale time ka kaam / promise', f: 'Subject + will/shall + V1', help: 'will / shall', use: ['promise (I will help you)', 'spontaneous decision (I will open the door)', 'prediction (It will rain)'], sig: ['tomorrow', 'soon', 'next week', 'tonight'], pos: 'We will win the match.', neg: 'We will not win the match.', q: 'Will we win the match?', mis: 'will goes ❌ → will go ✅ (will ke baad V1)', trick: '🧠 "will = vaada": will + V1, bas.' },
    { n: 'Future Continuous', hi: 'future me ek time par chalta hua kaam', f: 'Subject + will be + V1+ing', help: 'will be', use: ['fixed future scene (I will be travelling at 8)', 'polite enquiry (Will you be using this?)'], sig: ['at this time tomorrow', 'at 9 tonight'], pos: 'She will be cooking at 7.', neg: 'She will not be cooking at 7.', q: 'Will she be cooking at 7?', mis: 'will be + V3 ❌ → V1+ing ✅', trick: '🧠 "will be + ing = future live": future ka live telecast.' },
    { n: 'Future Perfect', hi: 'future ke ek point tak kaam poora ho jayega', f: 'Subject + will have + V3', help: 'will have', use: ['deadline (I will have finished by 9)', 'assumption about past (He will have reached)'], sig: ['by 2030', 'by the time', 'by next month'], pos: 'They will have built the bridge by June.', neg: 'They will not have built it by June.', q: 'Will they have built it by June?', mis: 'by ke baad time point aata hai, duration nahi', trick: '🧠 "will have = ho jayega": by + time dikhe, kaam complete.' },
    { n: 'Future Perfect Continuous', hi: 'future me kab se chal raha hoga', f: 'Subject + will have been + V1+ing', help: 'will have been', use: ['lambi future activity (I will have been working here for 10 years)'], sig: ['for 2 hours (by then)', 'since 2020 (by then)'], pos: 'By 2027, I will have been teaching for 5 years.', neg: '…will not have been teaching…', q: 'Will you have been waiting long?', mis: 'rare tense hai — exam me formula yaad rakho', trick: '🧠 "sabse lamba formula = sabse lamba time".' }
  ];

  /* 2-question mini quizzes per tense (built-in) */
  var TQUIZ = [
    [{ q: 'She ___ cricket daily.', o: ['play', 'plays', 'is playing', 'played'], a: 1 }, { q: 'Water ___ at 100°C.', o: ['boil', 'boils', 'is boiling', 'boiled'], a: 1 }],
    [{ q: 'Look! He ___ .', o: ['run', 'runs', 'is running', 'ran'], a: 2 }, { q: 'I ___ my keys. I can\'t find them.', o: ['am losing', 'lose', 'am lose', 'loses'], a: 0 }],
    [{ q: 'I have ___ my homework.', o: ['finish', 'finished', 'finishing', 'finishs'], a: 1 }, { q: 'She has ___ to Mumbai twice.', o: ['went', 'go', 'been', 'be'], a: 2 }],
    [{ q: 'It has been ___ since morning.', o: ['rain', 'rains', 'raining', 'rained'], a: 2 }, { q: 'We have been ___ here ___ 2019.', o: ['live / since', 'living / since', 'living / for', 'lived / since'], a: 1 }],
    [{ q: 'They ___ yesterday.', o: ['arrive', 'arrived', 'have arrived', 'arriving'], a: 1 }, { q: '___ you see him?', o: ['Have', 'Did', 'Do', 'Are'], a: 1 }],
    [{ q: 'At 9 pm, I ___ dinner.', o: ['was having', 'had', 'have', 'am having'], a: 0 }, { q: 'While she ___, he called.', o: ['cook', 'was cooking', 'cooked', 'is cooking'], a: 1 }],
    [{ q: 'The train had ___ before we reached.', o: ['left', 'leave', 'leaves', 'leaving'], a: 0 }, { q: 'She had ___ her keys.', o: ['lose', 'lost', 'loses', 'losing'], a: 1 }],
    [{ q: 'He had been ___ for 3 hours.', o: ['worked', 'working', 'work', 'works'], a: 1 }, { q: 'They had been ___ since morning.', o: ['waited', 'waiting', 'wait', 'waits'], a: 1 }],
    [{ q: 'I ___ help you.', o: ['shall', 'will', 'would', 'can'], a: 1 }, { q: 'It ___ rain tomorrow.', o: ['will', 'would', 'shall', 'can'], a: 0 }],
    [{ q: 'At 8 tomorrow, I ___ .', o: ['will travel', 'will be travelling', 'travel', 'travelled'], a: 1 }, { q: 'This time next week, we ___ on the beach.', o: ['lie', 'will lie', 'will be lying', 'lied'], a: 2 }],
    [{ q: 'By 2030, India ___ 100 medals.', o: ['will win', 'will have won', 'wins', 'won'], a: 1 }, { q: 'She will have ___ by 9.', o: ['finish', 'finished', 'finishing', 'finishes'], a: 1 }],
    [{ q: 'By next year, he will have been ___ here for a decade.', o: ['worked', 'working', 'work', 'works'], a: 1 }, { q: 'In June, I ___ for 5 years in this job.', o: ['will have been working', 'work', 'worked', 'will work'], a: 0 }]
  ];

  var COMPARE = D(function () { return EC.data.tenseCompare; }, [
    { title: 'Present ka set', rows: [
      ['I eat breakfast at 8.', 'Main roz subah 8 baje nashta karta hoon. (aadat)'],
      ['I am eating breakfast now.', 'Main abhi nashta kar raha hoon. (is waqt)'],
      ['I have eaten breakfast already.', 'Maine nashta kar liya hai. (ho chuka)']
    ]},
    { title: 'Past ka set', rows: [
      ['I ate breakfast at 8.', 'Maine subah 8 baje nashta kiya. (beet gaya)'],
      ['I was eating when you called.', 'Jab tumne call kiya, main nashta kar raha tha. (chal raha tha)'],
      ['I had eaten before you came.', 'Tumhare aane se pehle maine nashta kar liya tha. (usse bhi pehle)']
    ]},
    { title: 'Future ka set', rows: [
      ['I will eat at 8.', 'Main 8 baje khaunga. (vaada/plan)'],
      ['I will be eating at 8.', '8 baje main kha raha hounga. (us time chal raha hoga)'],
      ['I will have eaten by 9.', '9 baje tak main kha chuka hounga. (poora ho jayega)']
    ]},
    { title: 'Since / For wala set', rows: [
      ['I have lived here since 2020.', 'Main 2020 se yahan reh raha hoon. (point of time)'],
      ['I have lived here for 6 years.', 'Main 6 saal se yahan reh raha hoon. (duration)'],
      ['I lived here in 2020.', 'Main 2020 me yahan rehta tha. (sirf past, ab nahi)']
    ]}
  ]);

  var CONDITIONALS = D(function () { return EC.data.conditionals; }, [
    { n: 'Zero Conditional', hi: 'hamesha sach — fact / rule', f: 'If + Present Simple, Present Simple', ex: 'If you heat ice, it melts.', exHi: 'Barf garam karo to pighalti hai.', nuance: 'Science facts, rules, aadat wali baat. Dono side present.' },
    { n: 'First Conditional', hi: 'real future possibility', f: 'If + Present Simple, will + V1', ex: 'If it rains, we will stay home.', exHi: 'Agar baarish hui to hum ghar rahenge.', nuance: 'Ho sakta hai — real chance. "If" wale part me will MAT lagao ❌.' },
    { n: 'Second Conditional', hi: 'imaginary present / dream', f: 'If + Past Simple, would + V1', ex: 'If I were rich, I would travel the world.', exHi: 'Agar main ameer hota to duniya ghoomta.', nuance: 'Sapna / hypothetical. "I were" — was nahi, were lagta hai.' },
    { n: 'Third Conditional', hi: 'imaginary past — regret', f: 'If + had + V3, would have + V3', ex: 'If you had studied, you would have passed.', exHi: 'Agar tumne padha hota to pass ho jaate.', nuance: 'Beeta hua past badal nahi sakta — regret ya blame.' },
    { n: 'Mixed Conditional', hi: 'past ka asar present par', f: 'If + had + V3, would + V1', ex: 'If you had saved money, you would be rich now.', exHi: 'Agar tumne paise bachaye hote to ab ameer hote.', nuance: 'Past action → present result. Dono time mix.' }
  ]);

  var CQUIZ = [
    { q: 'If you heat water, it ___.', o: ['will boil', 'boils', 'would boil', 'boiled'], a: 1, why: 'Zero conditional — fact, dono side present.' },
    { q: 'If I ___ rich, I would help the poor.', o: ['am', 'was', 'were', 'will be'], a: 2, why: 'Second conditional — imaginary, "were" lagta hai.' },
    { q: 'If she had worked hard, she ___ the job.', o: ['will get', 'would get', 'would have got', 'gets'], a: 2, why: 'Third conditional — past regret, would have + V3.' },
    { q: 'If it rains tomorrow, we ___ the match.', o: ['cancel', 'will cancel', 'would cancel', 'cancelled'], a: 1, why: 'First conditional — real future, will + V1.' }
  ];

  var MODALS = D(function () { return EC.data.modals; }, [
    { n: 'can', hi: 'ability / permission', nuance: 'Taakat ya ijazat: "I can swim." Zyada formal nahi.', ex: ['I can speak English.', 'Can I go out?'] },
    { n: 'could', hi: 'past ability / polite request', nuance: '"I could swim at 10." Polite request: "Could you help me?" can se zyada namr.', ex: ['He could run fast.', 'Could you open the door?'] },
    { n: 'may', hi: 'formal permission / possibility', nuance: 'Formal ijazat: "May I come in?" 50-50 chance: "It may rain."', ex: ['May I sit here?', 'It may rain today.'] },
    { n: 'might', hi: 'kam chance wali possibility', nuance: 'may se kam sure: "It might rain." (30% chance jaisa feel)', ex: ['She might come late.', 'I might go.'] },
    { n: 'must', hi: 'strong rule / zor ki salah', nuance: 'Rule ya majboori: "You must wear a helmet." 100% sure guess: "He must be tired."', ex: ['You must follow rules.', 'She must be hungry.'] },
    { n: 'should', hi: 'salah / advice', nuance: 'Dostana salah: "You should rest." must se halka — rule nahi, advice.', ex: ['You should eat healthy.', 'Should I call him?'] },
    { n: 'would', hi: 'polite / past habit / imaginary', nuance: 'Polite: "Would you like tea?" Past habit: "He would play daily." Imaginary: "I would travel."', ex: ['Would you help me?', 'I would love to go.'] }
  ]);

  var MQUIZ = [
    { q: '___ I come in, sir? (formal)', o: ['Can', 'May', 'Must', 'Should'], a: 1, why: 'Formal permission ke liye "may".' },
    { q: 'You ___ wear a helmet. It\'s the law.', o: ['should', 'might', 'must', 'could'], a: 2, why: 'Rule/law = must (strong).' },
    { q: '___ you open the window, please? (polite)', o: ['Can', 'Could', 'Must', 'May'], a: 1, why: 'Polite request = could.' },
    { q: 'You look tired. You ___ take rest. (advice)', o: ['must', 'should', 'can', 'might'], a: 1, why: 'Advice ke liye should.' }
  ];

  /* ---------- quiz renderer (generic MCQ) ---------- */
  function renderQuiz(box, items, skillKey) {
    box.innerHTML = '';
    var score = 0, done = 0;
    items.forEach(function (it, i) {
      var card = h('div', 'ec-card');
      card.appendChild(h('div', 'ec-title', (i + 1) + '. ' + it.q));
      var fb = h('div', 'ec-fb', '');
      it.o.forEach(function (opt, oi) {
        var b = h('button', 'ec-opt', opt);
        b.type = 'button';
        b.addEventListener('click', function () {
          var btns = card.querySelectorAll('.ec-opt');
          for (var k = 0; k < btns.length; k++) btns[k].disabled = true;
          done++;
          if (oi === it.a) { b.classList.add('ok'); score++; addXP(5); bumpSkill(skillKey, 1); fb.textContent = '✅ Sahi! +5 XP' + (it.why ? ' — ' + it.why : ''); }
          else { b.classList.add('bad'); btns[it.a].classList.add('ok'); fb.textContent = '❌ Sahi jawab: ' + it.o[it.a] + (it.why ? ' — ' + it.why : ''); }
          if (done === items.length) {
            var s = h('div', 'ec-card', '🏁 Quiz khatam! Score: ' + score + '/' + items.length);
            box.appendChild(s); touchDay(); save();
          }
        });
        card.appendChild(b);
      });
      card.appendChild(fb);
      box.appendChild(card);
    });
  }

  /* ---------- sub-views ---------- */
  function viewTenses(box) {
    box.innerHTML = '';
    var list = D(function () { return EC.data.tenses; }, null);
    var names = TENSES.map(function (t) { return t.n; });
    // if EC.data.tenses exists as array of names/objects, prefer names but keep our rich data
    if (Array.isArray(list) && list.length === 12) {
      names = list.map(function (t) { return (t && t.n) || t; });
    }
    names.forEach(function (nm, i) {
      var t = TENSES[i];
      var c = h('div', 'ec-card ec-tap');
      var r = h('div', 'ec-row');
      var g = h('div', 'ec-grow');
      g.appendChild(h('div', 'ec-title', (i + 1) + '. ' + nm));
      g.appendChild(h('div', 'ec-hi', t.hi));
      r.appendChild(g);
      r.appendChild(h('div', '', '›'));
      c.appendChild(r);
      c.addEventListener('click', function () { viewTenseDetail(box, i, nm); });
      box.appendChild(c);
    });
  }

  function viewTenseDetail(box, i, nm) {
    box.innerHTML = '';
    var t = TENSES[i];
    var back = h('button', 'ec-back', '← Sab tenses');
    back.type = 'button';
    back.addEventListener('click', function () { viewTenses(box); });
    box.appendChild(back);
    box.appendChild(h('div', 'ec-title', nm));
    box.appendChild(h('div', 'ec-hi', t.hi));
    function sec(lbl, node) { box.appendChild(h('div', 'ec-lbl', lbl)); box.appendChild(node); }
    var f = h('div', 'ec-formula', '📐 ' + t.f); sec('Formula', f);
    sec('Helping verb', h('div', '', '🔧 ' + t.help));
    var ul = h('ul', ''); t.use.forEach(function (x) { var li = h('li', '', x); ul.appendChild(li); });
    sec('Kab use karein? (when)', ul);
    var sig = h('div', ''); t.sig.forEach(function (s) { var p = h('span', 'ec-pill', s); sig.appendChild(p); });
    sec('Signal words 👀', sig);
    var exb = h('div', '');
    [['✅ Positive', t.pos], ['❌ Negative', t.neg], ['❓ Question', t.q]].forEach(function (pair) {
      var row = h('div', 'ec-ex');
      var g = h('div', 'ec-grow'); g.appendChild(h('div', '', pair[0] + ': ' + pair[1]));
      row.appendChild(g); row.appendChild(speakBtn(pair[1])); exb.appendChild(row);
    });
    sec('Examples (sun ke bolo)', exb);
    var w = h('div', 'ec-warn', '⚠️ Common mistake: ' + t.mis); sec('Galti se bacho', w);
    var tr = h('div', 'ec-trick', t.trick); sec('Memory trick', tr);
    box.appendChild(h('div', 'ec-lbl', 'Mini quiz — 2 sawal'));
    var qbox = h('div', ''); box.appendChild(qbox);
    renderQuiz(qbox, TQUIZ[i] || [], 'grammar');
  }

  function viewCompare(box) {
    box.innerHTML = '';
    box.appendChild(h('div', 'ec-hi', 'Ek hi baat, alag-alag tense me — side by side samjho. 👇'));
    COMPARE.forEach(function (ch) {
      var c = h('div', 'ec-card');
      c.appendChild(h('div', 'ec-title', ch.title));
      var vs = h('div', 'ec-vs');
      ch.rows.forEach(function (row) {
        var cell = h('div', 'ec-cell');
        var r = h('div', 'ec-row');
        var g = h('div', 'ec-grow', row[0]);
        r.appendChild(g); r.appendChild(speakBtn(row[0]));
        cell.appendChild(r);
        cell.appendChild(h('div', 'ec-hi', row[1]));
        vs.appendChild(cell);
      });
      c.appendChild(vs);
      box.appendChild(c);
    });
  }

  function viewConditionals(box) {
    box.innerHTML = '';
    CONDITIONALS.forEach(function (cd, i) {
      var c = h('div', 'ec-card');
      c.appendChild(h('div', 'ec-title', (i + 1) + '. ' + cd.n));
      c.appendChild(h('div', 'ec-hi', cd.hi));
      c.appendChild(h('div', 'ec-formula', '📐 ' + cd.f));
      var r = h('div', 'ec-ex');
      var g = h('div', 'ec-grow');
      g.appendChild(h('div', '', cd.ex));
      g.appendChild(h('div', 'ec-hi', cd.exHi));
      r.appendChild(g); r.appendChild(speakBtn(cd.ex));
      c.appendChild(r);
      c.appendChild(h('div', 'ec-fb', '💡 ' + cd.nuance));
      box.appendChild(c);
    });
    box.appendChild(h('div', 'ec-lbl', 'Conditionals quiz — 4 sawal'));
    var qbox = h('div', ''); box.appendChild(qbox);
    renderQuiz(qbox, CQUIZ, 'grammar');
  }

  function viewModals(box) {
    box.innerHTML = '';
    MODALS.forEach(function (m) {
      var c = h('div', 'ec-card');
      c.appendChild(h('div', 'ec-title', m.n + ' — ' + m.hi));
      var r1 = h('div', 'ec-row');
      var g = h('div', 'ec-grow');
      m.ex.forEach(function (e) { g.appendChild(h('div', '', '• ' + e)); });
      r1.appendChild(g); r1.appendChild(speakBtn(m.ex[0]));
      c.appendChild(r1);
      c.appendChild(h('div', 'ec-fb', '💡 Nuance: ' + m.nuance));
      box.appendChild(c);
    });
    box.appendChild(h('div', 'ec-lbl', 'Modals quiz — 4 sawal'));
    var qbox = h('div', ''); box.appendChild(qbox);
    renderQuiz(qbox, MQUIZ, 'grammar');
  }

  /* ---------- register ---------- */
  EC.register('tenses', {
    title: 'Tenses',
    icon: '⏳',
    render: function (containerEl) {
      injectCSS();
      touchDay();
      var root = h('div', 'ecT');
      containerEl.innerHTML = '';
      containerEl.appendChild(root);
      var bar = h('div', 'ec-sub');
      var body = h('div', '');
      root.appendChild(bar); root.appendChild(body);
      var tabs = [
        ['Tenses', viewTenses], ['Compare ⚖️', viewCompare],
        ['Conditionals 🔀', viewConditionals], ['Modals 🎛️', viewModals]
      ];
      var chips = [];
      tabs.forEach(function (tb, i) {
        var c = h('button', 'ec-chip' + (i === 0 ? ' on' : ''), tb[0]);
        c.type = 'button';
        c.addEventListener('click', function () {
          chips.forEach(function (x) { x.classList.remove('on'); });
          c.classList.add('on');
          tb[1](body);
        });
        chips.push(c); bar.appendChild(c);
      });
      tabs[0][1](body);
    }
  });
})();
