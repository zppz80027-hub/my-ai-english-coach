/* ============================================================
   My AI English Coach — UI TAB GROUP C
   Tab: Simulations ('simulations') 💬
   - Scenario cards (from EC.data.scenarios) + Difficult
     Conversations → roleplay chat with a persona
   - Uses EC.ai.generateConversation('roleplay', …) when available,
     else a local persona-aware fallback bot
   - Goal checklist auto-ticks from keywords → simple end score
   Guards everything: works even if EC core pieces are missing.
   ============================================================ */
(function () {
'use strict';
if (typeof window === 'undefined') return;
var EC = window.EC;
if (!EC || typeof EC.register !== 'function') return;

var ui = EC.ui || {};
var speech = EC.speech || {};
var ai = EC.ai || {};
var data = EC.data || {};

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
  var t = el('div', 'ecsim-toast', String(msg));
  document.body.appendChild(t);
  setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2400);
}
function addXP(n, why) { try { if (typeof EC.addXP === 'function') EC.addXP(n, why); } catch (e) {} }
function touchDay() { try { if (typeof EC.touchDay === 'function') EC.touchDay(); } catch (e) {} }
function bumpSkill(s, n) { try { if (typeof EC.bumpSkill === 'function') EC.bumpSkill(s, n); } catch (e) {} }
function speak(text) { try { if (typeof speech.speak === 'function') { speech.speak(text); return; } } catch (e) {} }
function css() {
  if (document.getElementById('ecsim-css')) return;
  var s = document.createElement('style');
  s.id = 'ecsim-css';
  s.textContent =
    '.ecsim-wrap{max-width:640px;margin:0 auto;padding:12px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1f2937;padding-bottom:40px}' +
    '.ecsim-wrap h2{margin:6px 0 2px;font-size:22px}' +
    '.ecsim-sub{color:#6b7280;font-size:14px;margin:0 0 12px}' +
    '.ecsim-card{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:14px;margin:10px 0;box-shadow:0 1px 3px rgba(0,0,0,.06)}' +
    '.ecsim-btn{display:block;width:100%;padding:14px 16px;margin:8px 0;border:none;border-radius:12px;background:#0d9488;color:#fff;font-size:16px;font-weight:700;cursor:pointer}' +
    '.ecsim-btn:active{transform:scale(.98)}' +
    '.ecsim-btn.sec{background:#ccfbf1;color:#0f766e}' +
    '.ecsim-btn.ghost{background:#f3f4f6;color:#374151}' +
    '.ecsim-btn.danger{background:#fee2e2;color:#b91c1c}' +
    '.ecsim-btn.sm{width:auto;display:inline-block;padding:8px 14px;font-size:14px;margin:4px 6px 4px 0}' +
    '.ecsim-scn{display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:#fff;border:2px solid #e5e7eb;border-radius:14px;padding:12px;margin:8px 0;cursor:pointer;font-size:15px;font-weight:600;color:#1f2937}' +
    '.ecsim-scn:active{border-color:#0d9488}' +
    '.ecsim-scn .em{font-size:30px}' +
    '.ecsim-scn small{display:block;font-weight:400;color:#6b7280;font-size:13px}' +
    '.ecsim-scn.hard{border-color:#fecaca;background:#fff7f7}' +
    '.ecsim-chat{background:#f0fdfa;border-radius:14px;padding:10px;min-height:220px;max-height:46vh;overflow-y:auto;margin:8px 0}' +
    '.ecsim-msg{max-width:85%;padding:9px 13px;border-radius:16px;margin:6px 0;font-size:15px;line-height:1.45;clear:both}' +
    '.ecsim-msg.bot{background:#fff;border:1px solid #e5e7eb;float:left;border-bottom-left-radius:4px}' +
    '.ecsim-msg.me{background:#0d9488;color:#fff;float:right;border-bottom-right-radius:4px}' +
    '.ecsim-clear{clear:both}' +
    '.ecsim-inputrow{display:flex;gap:8px;margin-top:8px}' +
    '.ecsim-input{flex:1;border:2px solid #e5e7eb;border-radius:24px;padding:11px 15px;font-size:15px;font-family:inherit}' +
    '.ecsim-send{background:#0d9488;color:#fff;border:none;border-radius:50%;width:48px;height:48px;font-size:20px;cursor:pointer;flex-shrink:0}' +
    '.ecsim-goal{font-size:13px;padding:6px 10px;border-radius:8px;background:#f3f4f6;margin:4px 0;color:#6b7280}' +
    '.ecsim-goal.done{background:#d1fae5;color:#065f46;text-decoration:line-through}' +
    '.ecsim-typing{color:#6b7280;font-size:13px;font-style:italic;padding:4px 8px}' +
    '.ecsim-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:24px;background:#111827;color:#fff;padding:12px 20px;border-radius:24px;font-size:14px;z-index:10000;max-width:90%;text-align:center}' +
    '.ecsim-big{font-size:40px;text-align:center;margin:8px 0}';
  document.head.appendChild(s);
}

/* ---------------- fallback scenarios ---------------- */
function G(t, k) { return { t: t, k: k, done: false }; }
var FALLBACK_SCENARIOS = [
  { id: 'professor', title: 'Talking to a Professor', icon: '🎓', persona: 'Professor Mehta, a kind but busy college professor',
    opener: 'Hello! How can I help you today?',
    context: 'Tumhe assignment me ek doubt hai. Professor se politely poocho.',
    goals: [G('Greet politely', ['hello', 'hi', 'good morning', 'good afternoon']), G('Introduce yourself', ['i am', "i'm", 'my name']), G('Ask your doubt clearly', ['doubt', 'question', 'understand', 'explain', 'how']), G('Say thank you', ['thank', 'thanks'])] },
  { id: 'newfriend', title: 'Making a New Friend', icon: '👋', persona: 'Aarav, a friendly new classmate',
    opener: 'Hey! I just joined this class. What\'s your name?',
    context: 'Naya classmate — dosti karo! Small talk practice.',
    goals: [G('Introduce yourself', ['i am', "i'm", 'my name']), G('Ask about them', ['you', '?', 'your']), G('Find a common interest', ['like', 'love', 'enjoy', 'hobby', 'cricket', 'music', 'movie']), G('Say goodbye nicely', ['bye', 'see you', 'nice'])] },
  { id: 'presentation', title: 'Giving a Short Presentation', icon: '🎤', persona: 'Your teacher, listening to your 1-minute presentation',
    opener: 'Welcome! Please start your short presentation whenever you are ready.',
    context: 'Kisi bhi topic pe 1-minute presentation do.',
    goals: [G('Introduce your topic', ['today', 'topic', 'talk about', 'present']), G('Give your first point', ['first', 'firstly']), G('Give a second point / example', ['second', 'example', 'also']), G('Conclude', ['conclusion', 'thank', 'finally', 'summary'])] },
  { id: 'phonecall', title: 'Phone Call: Job Enquiry', icon: '📞', persona: 'Priya, HR executive at a company',
    opener: 'Hello, this is Priya from ABC Company. How can I help you?',
    context: 'Phone pe job/internship ke baare me poocho. Phone English practice!',
    goals: [G('Greet + introduce', ['hello', 'hi', 'i am', "i'm"]), G('Ask about vacancy', ['vacancy', 'job', 'opening', 'internship', 'hiring']), G('Ask about next steps', ['apply', 'next', 'process', 'send', 'email']), G('Thank + close', ['thank', 'bye'])] },
  { id: 'restaurant', title: 'At a Restaurant', icon: '🍔', persona: 'A polite waiter at a restaurant',
    opener: 'Good evening! Table for one? What would you like to order?',
    context: 'Restaurant me order karo — real-life English!',
    goals: [G('Greet', ['hello', 'hi', 'good evening']), G('Order food', ['like', 'want', 'order', 'please']), G('Ask for the bill', ['bill', 'check', 'pay']), G('Thank them', ['thank', 'thanks'])] },
  { id: 'doctor', title: 'At the Doctor', icon: '🩺', persona: 'Dr. Rao, a caring doctor',
    opener: 'Hello, what seems to be the problem?',
    context: 'Apni problem describe karo — health English seekho.',
    goals: [G('Describe symptoms', ['pain', 'fever', 'cough', 'hurt', 'sick', 'problem']), G('Say since when', ['since', 'days', 'yesterday', 'morning']), G('Ask for advice/medicine', ['medicine', 'advice', 'should', 'what'])] }
];
var FALLBACK_DIFFICULT = [
  { id: 'deadline', title: 'Asking for a Deadline Extension', icon: '⏰', persona: 'Professor Sharma — strict about deadlines',
    opener: 'Yes? The assignment is due tomorrow. What do you want?',
    context: 'Extension chahiye, par professor strict hai. Politely request karo!',
    goals: [G('Greet politely', ['hello', 'sir', 'maam', "ma'am", 'good']), G('Explain your reason honestly', ['because', 'reason', 'sick', 'problem', 'could not', "couldn't"]), G('Request extension politely', ['please', 'extend', 'extension', 'extra', 'kindly', 'request']), G('Thank them', ['thank', 'thanks'])] },
  { id: 'disagree', title: 'Disagreeing Politely', icon: '🤝', persona: 'Rahul, your friend who thinks English movies are boring',
    opener: 'English movies are so boring, yaar! Hindi movies are the best, no doubt!',
    context: 'Dost se disagree karo — par politely! Friendship bachi rahe. 😅',
    goals: [G('Disagree politely', ['see your point', 'respect', 'but', 'however', 'opinion']), G('Give your reason', ['because', 'reason', 'think']), G('Suggest a compromise', ['maybe', 'together', 'both', 'try'])] },
  { id: 'sayno', title: 'Saying No to Extra Work', icon: '🙅', persona: 'A senior at work who wants you to finish his report tonight',
    opener: 'Hey, can you finish my report tonight? I have plans with friends.',
    context: '"No" bolna seekho — bina rude lage!',
    goals: [G('Say no politely', ['sorry', "can't", 'cannot', 'afraid', 'busy']), G('Give a reason', ['because', 'have to', 'my own', 'deadline']), G('Offer an alternative', ['tomorrow', 'help', 'morning', 'later'])] },
  { id: 'feedback', title: 'Asking for Honest Feedback', icon: '🪞', persona: 'Your mentor, after your presentation',
    opener: 'So… how do you think your presentation went?',
    context: 'Honest feedback maango — growth ke liye!',
    goals: [G('Self-reflect honestly', ['think', 'felt', 'nervous', 'good', 'mistake']), G('Ask for specific feedback', ['feedback', 'improve', 'suggest', 'advice', 'what']), G('Thank them', ['thank', 'thanks'])] }
];
function getScenarios() {
  try {
    if (data.scenarios) {
      if (Array.isArray(data.scenarios) && data.scenarios.length) return { easy: data.scenarios, hard: [] };
      if (data.scenarios.easy || data.scenarios.normal) return { easy: data.scenarios.easy || data.scenarios.normal || [], hard: data.scenarios.difficult || data.scenarios.hard || [] };
    }
  } catch (e) {}
  return { easy: FALLBACK_SCENARIOS, hard: FALLBACK_DIFFICULT };
}
function getDifficult() {
  try {
    if (Array.isArray(data.difficultConversations) && data.difficultConversations.length) return data.difficultConversations;
    if (Array.isArray(data.difficult) && data.difficult.length) return data.difficult;
    if (data.scenarios && (data.scenarios.difficult || data.scenarios.hard)) return data.scenarios.difficult || data.scenarios.hard;
  } catch (e) {}
  return FALLBACK_DIFFICULT;
}
function normScenario(s) {
  s = s || {};
  return {
    id: s.id || 'scn',
    title: s.title || s.name || 'Roleplay',
    icon: s.icon || '💬',
    persona: s.persona || s.role || 'A friendly person',
    opener: s.opener || s.start || 'Hello! Let\'s talk.',
    context: s.context || s.description || '',
    goals: (s.goals || []).map(function (g) {
      if (typeof g === 'string') return G(g, []);
      return G(g.t || g.text || g.label || 'Goal', g.k || g.keywords || []);
    })
  };
}

/* ---------------- bot (AI or fallback) ---------------- */
var FALLBACK_REPLIES = [
  'Interesting! Tell me a little more about that.',
  'I see. And what happened next?',
  'Hmm, could you explain that in a bit more detail?',
  'That makes sense. What would you do in that situation?',
  'Good! Now let me ask you — why do you think that?',
  'Nice. Can you give me an example?',
  'Okay! And how did that make you feel?',
  'Got it. What else would you like to add?'
];
function fallbackBot(history) {
  var last = '';
  for (var i = history.length - 1; i >= 0; i--) {
    if (history[i].who === 'me') { last = history[i].text; break; }
  }
  var t = ' ' + last.toLowerCase() + ' ';
  if (/^(hi|hello|hey|good (morning|afternoon|evening))\b/.test(last.toLowerCase().trim())) return 'Hello! Nice to meet you. So, tell me — what brings you here today?';
  if (last.indexOf('?') !== -1) return 'Good question! In my experience, it depends on the situation. What do YOU think about it?';
  if (/\b(thank|thanks)\b/.test(t)) return 'You\'re welcome! Anything else you\'d like to talk about?';
  if (/\b(bye|goodbye|see you)\b/.test(t)) return 'Goodbye! It was really nice talking to you. Keep practising! 👋';
  return FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)];
}
function botReply(scenario, history, cb) {
  var fn = ai.generateConversation;
  if (typeof fn === 'function') {
    try {
      var r = fn('roleplay', { persona: scenario.persona, scenario: scenario.title, context: scenario.context, history: history });
      if (r && typeof r.then === 'function') {
        r.then(function (t) { cb(cleanBotText(t) || fallbackBot(history)); }, function () { cb(fallbackBot(history)); });
        return;
      }
      var txt = cleanBotText(r);
      if (txt) { cb(txt); return; }
    } catch (e) { /* fall through */ }
  }
  setTimeout(function () { cb(fallbackBot(history)); }, 700);
}
function cleanBotText(r) {
  if (typeof r === 'string') return r.trim();
  if (r && typeof r === 'object') {
    if (typeof r.text === 'string') return r.text.trim();
    if (typeof r.reply === 'string') return r.reply.trim();
    if (typeof r.message === 'string') return r.message.trim();
  }
  return '';
}

/* ---------------- UI ---------------- */
function render(container) {
  css();
  container.innerHTML = '';
  var wrap = el('div', 'ecsim-wrap');
  container.appendChild(wrap);
  showMenu(wrap);
}
function showMenu(box) {
  box.innerHTML = '';
  box.appendChild(el('h2', '', '💬 Real-Life Simulations'));
  box.appendChild(el('p', 'ecsim-sub', 'Real situations me English bolo — AI persona ke saath roleplay! (Jaise asli zindagi!)'));
  var sc = getScenarios();
  var easy = sc.easy.map(normScenario);
  var hard = getDifficult().map(normScenario);

  box.appendChild(el('h3', '', '🌱 Everyday situations'));
  easy.forEach(function (s) { box.appendChild(scnBtn(box, s, false)); });
  box.appendChild(el('h3', '', '🔥 Difficult conversations'));
  box.appendChild(el('p', 'ecsim-sub', 'Mushkil baatein — politely! Yehi asli confidence hai. 💪'));
  hard.forEach(function (s) { box.appendChild(scnBtn(box, s, true)); });
}
function scnBtn(box, s, hard) {
  var b = el('button', 'ecsim-scn' + (hard ? ' hard' : ''), '<span class="em">' + s.icon + '</span><span>' + escapeHtml(s.title) + '<small>' + escapeHtml(s.context) + '</small></span>');
  b.addEventListener('click', function () { startChat(box, s); });
  return b;
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
}
function backBtn(box, fn) {
  var b = el('button', 'ecsim-btn ghost sm', '← Scenarios');
  b.addEventListener('click', fn);
  return b;
}

function startChat(box, scenario) {
  box.innerHTML = '';
  var head = el('div', 'ecsim-card');
  head.appendChild(el('div', '', '<b>' + scenario.icon + ' ' + escapeHtml(scenario.title) + '</b> <small style="color:#6b7280">with ' + escapeHtml(scenario.persona) + '</small>'));
  box.appendChild(head);

  var goalBox = el('div', 'ecsim-card', '<b>🎯 Your goals:</b>');
  var goalEls = scenario.goals.map(function (g) {
    var d = el('div', 'ecsim-goal', '⬜ ' + escapeHtml(g.t));
    goalBox.appendChild(d);
    return d;
  });
  box.appendChild(goalBox);

  var chat = el('div', 'ecsim-chat');
  box.appendChild(chat);
  var history = [];

  function addMsg(who, text) {
    var m = el('div', 'ecsim-msg ' + who, '');
    m.textContent = text;
    chat.appendChild(m);
    chat.appendChild(el('div', 'ecsim-clear'));
    chat.scrollTop = chat.scrollHeight;
    history.push({ who: who, text: text });
  }
  function checkGoals(text) {
    var t = ' ' + String(text).toLowerCase() + ' ';
    scenario.goals.forEach(function (g, i) {
      if (g.done || !g.k.length) return;
      if (g.k.some(function (k) { return t.indexOf(String(k).toLowerCase()) !== -1; })) {
        g.done = true;
        goalEls[i].className = 'ecsim-goal done';
        goalEls[i].textContent = '✅ ' + g.t;
        toast('🎯 Goal complete: ' + g.t);
      }
    });
  }

  addMsg('bot', scenario.opener);
  speak(scenario.opener);

  var typing = null;
  function userSend(text) {
    text = String(text || '').trim();
    if (!text) return;
    addMsg('me', text);
    checkGoals(text);
    typing = el('div', 'ecsim-typing', scenario.persona.split(',')[0] + ' is typing…');
    chat.appendChild(typing);
    chat.scrollTop = chat.scrollHeight;
    botReply(scenario, history, function (reply) {
      if (typing && typing.parentNode) typing.parentNode.removeChild(typing);
      addMsg('bot', reply);
      speak(reply);
    });
  }

  var row = el('div', 'ecsim-inputrow');
  var input = el('input', 'ecsim-input');
  input.placeholder = 'Type your reply… (English me likho)';
  input.setAttribute('autocomplete', 'off');
  var send = el('button', 'ecsim-send', '➤');
  send.setAttribute('aria-label', 'Send');
  function doSend() { var v = input.value; input.value = ''; userSend(v); try { input.focus(); } catch (e) {} }
  send.addEventListener('click', doSend);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') doSend(); });
  row.appendChild(input); row.appendChild(send);
  box.appendChild(row);

  var micBtn = el('button', 'ecsim-btn sec sm', '🎙️ Speak instead');
  micBtn.addEventListener('click', function () {
    var fn = speech.micOrText;
    if (typeof fn === 'function') {
      try {
        var r = fn('Say your reply', function (t) { if (t && t.trim()) userSend(t); });
        if (r && typeof r.then === 'function') r.then(function (t) { if (t && t.trim()) userSend(t); });
        return;
      } catch (e) {}
    }
    toast('Mic not available — type karke bhejo! ⌨️');
    try { input.focus(); } catch (e2) {}
  });
  box.appendChild(micBtn);

  var end = el('button', 'ecsim-btn danger', '🏁 End conversation');
  end.addEventListener('click', function () { endChat(box, scenario, history); });
  box.appendChild(end);
  box.appendChild(backBtn(box, function () { showMenu(box); }));
  setTimeout(function () { try { input.focus(); } catch (e) {} }, 300);
}

function endChat(box, scenario, history) {
  var turns = history.filter(function (h) { return h.who === 'me'; }).length;
  var goalsHit = scenario.goals.filter(function (g) { return g.done; }).length;
  var totalGoals = scenario.goals.length;
  var goalScore = totalGoals ? Math.round(goalsHit / totalGoals * 70) : 50;
  var turnScore = Math.min(30, turns * 5);
  var score = Math.min(100, goalScore + turnScore);
  var stars = score >= 85 ? '⭐⭐⭐' : score >= 60 ? '⭐⭐' : score >= 35 ? '⭐' : '💪';

  box.innerHTML = '';
  box.appendChild(el('h2', '', '🏁 Conversation over!'));
  var card = el('div', 'ecsim-card');
  card.appendChild(el('div', 'ecsim-big', stars));
  card.appendChild(el('div', '', '<b>Score: ' + score + '/100</b><br>🎯 Goals: ' + goalsHit + '/' + totalGoals + ' complete<br>💬 Tumhare replies: ' + turns));
  var msg = score >= 85 ? '🔥 Amazing! Bilkul natural conversation!' : score >= 60 ? '👍 Bahut badhiya! Goals pe focus karo, perfect ho jayega.' : '💪 Acchi shuruaat! Goals checklist dekho aur dobara try karo — practice makes perfect.';
  card.appendChild(el('div', '', '<br>' + msg));
  var missed = scenario.goals.filter(function (g) { return !g.done; });
  if (missed.length) {
    card.appendChild(el('div', '', '<br><b>Missed goals — agli baar try karo:</b>'));
    missed.forEach(function (g) { card.appendChild(el('div', 'ecsim-goal', '⬜ ' + escapeHtml(g.t))); });
  }
  box.appendChild(card);
  var again = el('button', 'ecsim-btn', '🔁 Try again');
  again.addEventListener('click', function () { startChat(box, scenario); });
  box.appendChild(again);
  box.appendChild(backBtn(box, function () { showMenu(box); }));

  addXP(15 + goalsHit * 5, 'simulation');
  bumpSkill('speaking', 2);
  bumpSkill('fluency', 1);
  touchDay();
  toast('+' + (15 + goalsHit * 5) + ' XP! 🎉');
}

EC.register('simulations', { title: 'Simulations', icon: '💬', render: render });
})();
