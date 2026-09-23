/* ============================================================
   My AI English Coach — UI TAB GROUP C
   Tab: Tech English ('tech') 💻
   - Project-explanation framework drill:
     Problem → Solution → Technology → Implementation → Result → Future
   - Register-switch drill: explain to non-technical person
     vs to a senior engineer (jargon comparison)
   Guards everything: works even if EC core pieces are missing.
   ============================================================ */
(function () {
'use strict';
if (typeof window === 'undefined') return;
var EC = window.EC;
if (!EC || typeof EC.register !== 'function') return;

var ui = EC.ui || {};
var speech = EC.speech || {};

/* ---------------- safe helpers ---------------- */
function el(tag, cls, html) {
  var d = null;
  if (typeof ui.el === 'function') {
    try { d = ui.el(tag, cls, html); } catch (e) { d = null; }
  }
  if (!d) {
    d = document.createElement(tag || 'div');
    if (cls) d.className = cls;
    if (html !== undefined && html !== null) d.innerHTML = html;
  }
  return d;
}
function toast(msg) {
  try { if (typeof ui.toast === 'function') { ui.toast(msg); return; } } catch (e) {}
  var t = el('div', 'ect-toast', String(msg));
  document.body.appendChild(t);
  setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2400);
}
function addXP(n, why) { try { if (typeof EC.addXP === 'function') EC.addXP(n, why); } catch (e) {} }
function touchDay() { try { if (typeof EC.touchDay === 'function') EC.touchDay(); } catch (e) {} }
function bumpSkill(s, n) { try { if (typeof EC.bumpSkill === 'function') EC.bumpSkill(s, n); } catch (e) {} }
function css() {
  if (document.getElementById('ect-css')) return;
  var s = document.createElement('style');
  s.id = 'ect-css';
  s.textContent =
    '.ect-wrap{max-width:640px;margin:0 auto;padding:12px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1f2937;padding-bottom:40px}' +
    '.ect-wrap h2{margin:6px 0 2px;font-size:22px}' +
    '.ect-sub{color:#6b7280;font-size:14px;margin:0 0 12px}' +
    '.ect-card{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:14px;margin:10px 0;box-shadow:0 1px 3px rgba(0,0,0,.06)}' +
    '.ect-btn{display:block;width:100%;padding:14px 16px;margin:8px 0;border:none;border-radius:12px;background:#2563eb;color:#fff;font-size:16px;font-weight:700;cursor:pointer}' +
    '.ect-btn:active{transform:scale(.98)}' +
    '.ect-btn.sec{background:#eef2ff;color:#1e3a8a}' +
    '.ect-btn.ghost{background:#f3f4f6;color:#374151}' +
    '.ect-btn.sm{width:auto;display:inline-block;padding:8px 14px;font-size:14px;margin:4px 6px 4px 0}' +
    '.ect-ta{width:100%;border:2px solid #e5e7eb;border-radius:12px;padding:12px;font-size:16px;font-family:inherit;box-sizing:border-box}' +
    '.ect-input{width:100%;border:2px solid #e5e7eb;border-radius:12px;padding:12px;font-size:16px;font-family:inherit;box-sizing:border-box}' +
    '.ect-check{font-size:14px;margin:6px 0;padding:8px 10px;border-radius:8px;background:#f9fafb}' +
    '.ect-check.ok{background:#f0fdf4}' +
    '.ect-check.no{background:#fef2f2}' +
    '.ect-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:24px;background:#111827;color:#fff;padding:12px 20px;border-radius:24px;font-size:14px;z-index:10000;max-width:90%;text-align:center}' +
    '.ect-block{display:flex;gap:10px;align-items:center;background:#f8fafc;border:2px solid #e5e7eb;border-radius:12px;padding:10px;margin:8px 0;font-size:14px}' +
    '.ect-block.done{border-color:#22c55e;background:#f0fdf4}' +
    '.ect-block .n{background:#7c3aed;color:#fff;min-width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800}' +
    '.ect-bar{height:10px;background:#e5e7eb;border-radius:6px;overflow:hidden;margin:6px 0}' +
    '.ect-bar>i{display:block;height:100%;background:linear-gradient(90deg,#8b5cf6,#6d28d9);border-radius:6px}' +
    '.ect-vs{display:flex;gap:8px}.ect-vs>div{flex:1;background:#f8fafc;border-radius:10px;padding:10px;font-size:13px}';
  document.head.appendChild(s);
}

/* ---------------- framework definition ---------------- */
var BLOCKS = [
  { id: 'problem', name: 'Problem', icon: '🔴', hint: 'Kya problem thi? Kaun face karta tha?',
    example: '“Small shopkeepers near my home use paper notebooks for billing. Bills get lost and monthly totals take hours.”',
    checks: [
      { t: 'Problem word hai? (problem / challenge / issue / difficult / need)', k: ['problem', 'challenge', 'issue', 'difficult', 'struggle', 'need', 'needed', 'pain'] },
      { t: 'Kaun face karta hai? (users / customers / people / shopkeepers / students)', k: ['user', 'customer', 'people', 'shop', 'student', 'client', 'team', 'everyone'] }
    ] },
  { id: 'solution', name: 'Solution', icon: '💡', hint: 'Tumhara idea kya tha? App/system kya karta hai?',
    example: '“So I built a simple billing app — the shopkeeper enters items, and the bill + monthly total is ready in one tap.”',
    checks: [
      { t: 'Solution word hai? (solution / built / created / app / system)', k: ['solution', 'built', 'created', 'made', 'app', 'system', 'website', 'tool', 'platform'] },
      { t: 'Kya karta hai? (action verb: enters / shows / sends / saves)', k: ['enter', 'show', 'send', 'save', 'display', 'generate', 'calculate', 'manage', 'track', 'allow', 'help'] }
    ] },
  { id: 'technology', name: 'Technology', icon: '⚙️', hint: 'Kaunsi technologies use ki? (Naam lo!)',
    example: '“I used HTML, CSS and JavaScript for the frontend, and Firebase for the database and login.”',
    checks: [
      { t: 'Tech naam liya? (react / python / java / node / firebase / sql / flutter…)', k: ['react', 'python', 'java', 'node', 'firebase', 'sql', 'flutter', 'javascript', 'html', 'css', 'mongo', 'django', 'flask', 'angular', 'vue', 'php', 'kotlin', 'swift', 'aws', 'api'] },
      { t: 'Kam se kam 10 words likho', k: null, minWords: 10 }
    ] },
  { id: 'implementation', name: 'Implementation', icon: '🔨', hint: 'Kaise banaya? Steps / tumhara kaam.',
    example: '“First I designed the screens on paper. Then I built the billing page, connected Firebase, and tested it with 2 real shops.”',
    checks: [
      { t: 'Action verbs? (built / designed / implemented / tested / connected)', k: ['built', 'designed', 'implemented', 'tested', 'connected', 'created', 'developed', 'wrote', 'added', 'fixed', 'deployed'] },
      { t: 'Order words? (first / then / after / finally)', k: ['first', 'then', 'after', 'finally', 'next', 'before'] }
    ] },
  { id: 'result', name: 'Result', icon: '🏆', hint: 'Result kya hua? Numbers = superpower!',
    example: '“Now 2 shops use it daily. Billing time dropped from 10 minutes to 3 minutes per customer.”',
    checks: [
      { t: 'Result word hai? (result / improved / reduced / faster / now)', k: ['result', 'improved', 'reduced', 'faster', 'now', 'increased', 'decreased', 'saved', 'successfully'] },
      { t: 'Number / % hai? (2 shops, 50%, 3 minutes)', k: null, hasNumber: true }
    ] },
  { id: 'future', name: 'Future', icon: '🚀', hint: 'Aage kya plan hai?',
    example: '“Next, I want to add Hindi language support and a voice-based billing option for old shopkeepers.”',
    checks: [
      { t: 'Future word hai? (will / plan / next / future / want to)', k: ['will', 'plan', 'next', 'future', 'want to', 'going to', 'hope', 'soon'] }
    ] }
];
var JARGON = ['api', 'apis', 'database', 'server', 'framework', 'algorithm', 'deploy', 'backend', 'frontend', 'cloud', 'sdk', 'endpoint', 'cache', 'latency', 'scalable', 'architecture', 'repository', 'compiler', 'encryption', 'authentication', 'middleware', 'devops', 'container', 'kubernetes', 'microservice'];

/* ---------------- rule helpers ---------------- */
function wordsOf(t) { return String(t || '').trim().split(/\s+/).filter(Boolean); }
function checkBlock(block, text) {
  var t = ' ' + String(text || '').toLowerCase() + ' ';
  return block.checks.map(function (c) {
    if (c.minWords) return { ok: wordsOf(text).length >= c.minWords, label: c.t };
    if (c.hasNumber) return { ok: /\d/.test(text), label: c.t };
    var ok = c.k.some(function (k) { return t.indexOf(k) !== -1; });
    return { ok: ok, label: c.t };
  });
}
function countJargon(text) {
  var t = ' ' + String(text || '').toLowerCase() + ' ';
  var found = [];
  JARGON.forEach(function (j) { if (new RegExp('\\b' + j + 's?\\b').test(t)) found.push(j); });
  return found;
}

/* ---------------- UI ---------------- */
function render(container) {
  css();
  container.innerHTML = '';
  var wrap = el('div', 'ect-wrap');
  container.appendChild(wrap);
  showMenu(wrap);
}
function showMenu(box) {
  box.innerHTML = '';
  box.appendChild(el('h2', '', '💻 Tech English'));
  box.appendChild(el('p', 'ect-sub', 'Apne project ko English me explain karna seekho — interview + viva ke liye!'));
  var b1 = el('button', 'ect-btn', '🧱 Project Explanation Drill');
  b1.addEventListener('click', function () { showDrill(box); });
  var b2 = el('button', 'ect-btn sec', '🔀 Register Switch: Simple vs Technical');
  b2.addEventListener('click', function () { showRegister(box); });
  box.appendChild(b1); box.appendChild(b2);
  box.appendChild(el('div', 'ect-card', '💡 <b>Golden rule:</b> Interviewer technical hai → jargon OK. Non-technical hai → simple words. <b>Same project, do styles!</b>'));
}
function backBtn(box, fn) {
  var b = el('button', 'ect-btn ghost sm', '← Back');
  b.addEventListener('click', fn);
  return b;
}

/* ----- Drill: 6 blocks ----- */
function showDrill(box) {
  box.innerHTML = '';
  box.appendChild(backBtn(box, function () { showMenu(box); }));
  box.appendChild(el('h2', '', '🧱 Project Explanation Drill'));
  box.appendChild(el('p', 'ect-sub', '6 blocks me apne project ko explain karo. Har block check hoga!'));
  var nameWrap = el('div', 'ect-card');
  nameWrap.appendChild(el('div', '', '<b>Step 1:</b> Apne project ka naam likho'));
  var inp = el('input', 'ect-input');
  inp.placeholder = 'e.g. Billing App, Chat App, College Website…';
  nameWrap.appendChild(inp);
  var go = el('button', 'ect-btn', '▶️ Start drill');
  go.addEventListener('click', function () {
    var name = inp.value.trim() || 'My Project';
    runBlocks(box, name, 0, []);
  });
  nameWrap.appendChild(go);
  box.appendChild(nameWrap);
  var frame = el('div', 'ect-card', '<b>Framework:</b><br>' + BLOCKS.map(function (b, i) { return (i + 1) + '. ' + b.icon + ' ' + b.name; }).join(' → '));
  box.appendChild(frame);
}
function runBlocks(box, projectName, idx, done) {
  if (idx >= BLOCKS.length) { showDrillReport(box, projectName, done); return; }
  var block = BLOCKS[idx];
  box.innerHTML = '';
  box.appendChild(backBtn(box, function () { showMenu(box); }, 'Exit'));
  box.appendChild(el('h2', '', block.icon + ' ' + block.name + ' <small style="color:#6b7280;font-size:14px">(' + (idx + 1) + '/6)</small>'));
  box.appendChild(el('p', 'ect-sub', 'Project: <b>' + escapeHtml(projectName) + '</b>'));
  var prog = el('div', 'ect-bar', '<i style="width:' + Math.round(idx / BLOCKS.length * 100) + '%"></i>');
  box.appendChild(prog);
  var card = el('div', 'ect-card');
  card.appendChild(el('div', '', '<b>❓ ' + block.hint + '</b>'));
  card.appendChild(el('div', '', '<small style="color:#6b7280">Example: <i>' + block.example + '</i></small>'));
  var ta = el('textarea', 'ect-ta');
  ta.rows = 5;
  ta.placeholder = 'Write 2-3 lines here… (Yahan likho)';
  card.appendChild(ta);
  box.appendChild(card);
  var check = el('button', 'ect-btn', '✅ Check this block');
  var resDiv = el('div');
  check.addEventListener('click', function () {
    var text = ta.value.trim();
    if (wordsOf(text).length < 5) { toast('Thoda aur likho — kam se kam ek poori line! 🙂'); return; }
    var results = checkBlock(block, text);
    resDiv.innerHTML = '';
    var allOk = true;
    results.forEach(function (r) {
      if (!r.ok) allOk = false;
      resDiv.appendChild(el('div', 'ect-check ' + (r.ok ? 'ok' : 'no'), (r.ok ? '✅' : '❌') + ' ' + r.label));
    });
    var tip = el('div', 'ect-card', allOk
      ? '🎉 <b>Perfect block!</b> ' + block.name + ' clear hai. Agla block →'
      : '💡 <b>Tip:</b> upar wale example ko dekho aur missing cheez add karo, phir dobara Check dabao.');
    resDiv.appendChild(tip);
    nextBtn.disabled = false;
    addXP(5, 'tech drill block');
    bumpSkill('speaking', 1);
    touchDay();
  });
  box.appendChild(check);
  box.appendChild(resDiv);
  var nextBtn = el('button', 'ect-btn sec', idx === BLOCKS.length - 1 ? '🏁 Finish drill' : '➡️ Next block');
  nextBtn.disabled = true;
  nextBtn.addEventListener('click', function () {
    done.push({ block: block.name, text: ta.value.trim() });
    runBlocks(box, projectName, idx + 1, done);
  });
  box.appendChild(nextBtn);
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
}
function showDrillReport(box, projectName, done) {
  box.innerHTML = '';
  box.appendChild(el('h2', '', '🎉 Drill complete!'));
  box.appendChild(el('p', 'ect-sub', '<b>' + escapeHtml(projectName) + '</b> — ab tum isko 6 blocks me explain kar sakte ho!'));
  var full = el('div', 'ect-card', '<b>📜 Tumhara full project pitch:</b><br><br>');
  done.forEach(function (d) {
    full.appendChild(el('div', '', '<b>' + d.block + ':</b> ' + escapeHtml(d.text)));
    full.appendChild(el('br'));
  });
  box.appendChild(full);
  var again = el('button', 'ect-btn', '🔁 Practice again');
  again.addEventListener('click', function () { showDrill(box); });
  box.appendChild(again);
  box.appendChild(backBtn(box, function () { showMenu(box); }));
  addXP(30, 'tech drill complete');
  bumpSkill('speaking', 2);
  toast('+30 XP! Project pitch ready 🚀');
}

/* ----- Register switch drill ----- */
function showRegister(box) {
  box.innerHTML = '';
  box.appendChild(backBtn(box, function () { showMenu(box); }));
  box.appendChild(el('h2', '', '🔀 Register Switch Drill'));
  box.appendChild(el('p', 'ect-sub', 'Same project, do audiences. Jargon ka sahi use seekho!'));
  var card = el('div', 'ect-card');
  card.appendChild(el('div', '', '<b>👵 Audience 1: Non-technical person</b><br><small style="color:#6b7280">e.g. dadi, ya 10 saal ka baccha. NO jargon — simple words only!</small>'));
  var ta1 = el('textarea', 'ect-ta'); ta1.rows = 4;
  ta1.placeholder = 'Explain your project simply… (Bilkul simple bhasha me)';
  card.appendChild(ta1);
  card.appendChild(el('div', '', '<b style="margin-top:8px;display:block">👨‍💻 Audience 2: Senior engineer</b><br><small style="color:#6b7280">Technical details + jargon allowed. Impress karo!</small>'));
  var ta2 = el('textarea', 'ect-ta'); ta2.rows = 4;
  ta2.placeholder = 'Explain technically… (Technical words use karo)';
  card.appendChild(ta2);
  box.appendChild(card);
  var cmp = el('button', 'ect-btn', '⚖️ Compare both');
  var res = el('div');
  cmp.addEventListener('click', function () {
    var t1 = ta1.value.trim(), t2 = ta2.value.trim();
    if (wordsOf(t1).length < 8 || wordsOf(t2).length < 8) { toast('Dono me kam se kam 2-3 lines likho! 🙂'); return; }
    var j1 = countJargon(t1), j2 = countJargon(t2);
    res.innerHTML = '';
    var vs = el('div', 'ect-vs');
    vs.appendChild(el('div', '', '<b>👵 Simple version</b><br>Jargon found: <b>' + j1.length + '</b>' + (j1.length ? '<br><small>' + j1.join(', ') + '</small>' : '')));
    vs.appendChild(el('div', '', '<b>👨‍💻 Technical version</b><br>Jargon found: <b>' + j2.length + '</b>' + (j2.length ? '<br><small>' + j2.join(', ') + '</small>' : '')));
    res.appendChild(vs);
    var fb = el('div', 'ect-card');
    if (j1.length === 0 && j2.length >= 2) fb.innerHTML = '🎉 <b>Perfect switch!</b> Simple version me zero jargon, technical me solid terms. Yahi skill interview me kaam aayegi!';
    else if (j1.length > 0) fb.innerHTML = '💡 <b>Simple version me jargon hai:</b> ' + j1.join(', ') + '. Non-technical person ko ye samajh nahi aayega. Try: “database” → “list”, “deploy” → “launch/online karna”, “API” → “connection”.';
    else fb.innerHTML = '💡 <b>Technical version me aur depth do:</b> architecture, database naam, ya performance numbers add karo. Senior ko detail chahiye!';
    if (j1.length <= 1 && j2.length >= 1 && !(j1.length === 0 && j2.length >= 2)) fb.innerHTML += '<br>👍 Direction sahi hai — thoda aur polish karo!';
    res.appendChild(fb);
    var tips = el('div', 'ect-card', '<b>🗣️ Jargon tips:</b><ul style="margin:6px 0;padding-left:20px;font-size:14px"><li>Simple me: “server” → “computer”, “database” → “stored list”, “deploy” → “make it live”</li><li>Technical me: naam lo — “PostgreSQL”, “REST API”, “Redis cache”</li><li>Rule: agar saamne wala confuse lage → turant simple version pe switch karo!</li></ul>');
    res.appendChild(tips);
    addXP(15, 'register switch drill');
    bumpSkill('speaking', 2);
    bumpSkill('vocabulary', 1);
    touchDay();
  });
  box.appendChild(cmp);
  box.appendChild(res);
}

EC.register('tech', { title: 'Tech English', icon: '💻', render: render });
})();
