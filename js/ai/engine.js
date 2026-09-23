/* My AI English Coach — on-device conversation/exercise engine.
 * NOTE: this is a scripted template engine, no LLM. Replies, exercises and
 * feedback are produced from hand-written templates + the rule-based grammar
 * engine in js/ai/grammar.js. Deterministic, offline, no API keys.
 * May read EC.store / EC.data via window.EC when the host app provides them;
 * works without them using built-in fallbacks. No DOM usage here. */
(function () {
'use strict';

var root = (typeof window !== 'undefined') ? window :
  (typeof globalThis !== 'undefined') ? globalThis : {};
var EC = root.EC = root.EC || {};
EC.ai = EC.ai || {};
var ai = EC.ai;

/* ------------------------------ helpers ------------------------------ */

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function shuffle(a) {
  a = a.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

function clamp(n, lo, hi) { n = +n || 0; if (n < lo) return lo; if (n > hi) return hi; return n; }

// Pull a list from EC.data when the host app provides one, else fallback.
function dataPool(name, fallback) {
  try {
    var D = EC.data;
    if (D && Array.isArray(D[name]) && D[name].length) return D[name];
  } catch (e) { /* ignore */ }
  return fallback;
}

/* --------------------------- fallback pools --------------------------- */

var VERBS = [
  { base: 'go', past: 'went', pp: 'gone', third: 'goes' },
  { base: 'eat', past: 'ate', pp: 'eaten', third: 'eats' },
  { base: 'play', past: 'played', pp: 'played', third: 'plays' },
  { base: 'watch', past: 'watched', pp: 'watched', third: 'watches' },
  { base: 'write', past: 'wrote', pp: 'written', third: 'writes' },
  { base: 'speak', past: 'spoke', pp: 'spoken', third: 'speaks' },
  { base: 'come', past: 'came', pp: 'come', third: 'comes' },
  { base: 'take', past: 'took', pp: 'taken', third: 'takes' },
  { base: 'make', past: 'made', pp: 'made', third: 'makes' },
  { base: 'do', past: 'did', pp: 'done', third: 'does' },
  { base: 'have', past: 'had', pp: 'had', third: 'has' },
  { base: 'see', past: 'saw', pp: 'seen', third: 'sees' },
  { base: 'know', past: 'knew', pp: 'known', third: 'knows' },
  { base: 'think', past: 'thought', pp: 'thought', third: 'thinks' },
  { base: 'buy', past: 'bought', pp: 'bought', third: 'buys' },
  { base: 'run', past: 'ran', pp: 'run', third: 'runs' },
  { base: 'read', past: 'read', pp: 'read', third: 'reads' },
  { base: 'sleep', past: 'slept', pp: 'slept', third: 'sleeps' }
];

var ARTICLE_NOUNS = [
  { word: 'apple', article: 'an' }, { word: 'book', article: 'a' },
  { word: 'hour', article: 'an' }, { word: 'umbrella', article: 'an' },
  { word: 'car', article: 'a' }, { word: 'honest man', article: 'an' },
  { word: 'university', article: 'a' }, { word: 'orange', article: 'an' },
  { word: 'dog', article: 'a' }, { word: 'egg', article: 'an' },
  { word: 'house', article: 'a' }, { word: 'ice cream', article: 'an' }
];

var PREP_ITEMS = [
  { s: 'She is good ___ mathematics.', answer: 'at', options: ['at', 'in', 'on', 'with'] },
  { s: 'He is married ___ my cousin.', answer: 'to', options: ['to', 'with', 'from', 'for'] },
  { s: 'We have lived here ___ 2020.', answer: 'since', options: ['since', 'for', 'from', 'at'] },
  { s: 'They waited ___ three hours.', answer: 'for', options: ['for', 'since', 'from', 'at'] },
  { s: 'She is different ___ her sister.', answer: 'from', options: ['from', 'than', 'to', 'with'] },
  { s: 'Please listen ___ me carefully.', answer: 'to', options: ['to', 'at', 'for', 'with'] },
  { s: 'She entered ___ the room quietly.', answer: '(no word)', options: ['into', 'in', '(no word)', 'to'] },
  { s: 'Let us discuss ___ the new plan.', answer: '(no word)', options: ['about', 'on', '(no word)', 'over'] }
];

var SCRAMBLE_SENTENCES = [
  'I go to school daily',
  'She plays cricket very well',
  'We are learning English together',
  'He bought a new book yesterday',
  'They will visit Jaipur next month',
  'My mother cooks tasty food'
];

var TRANSLATE_ITEMS = [
  { hin: 'Main roz subah walk par jata hoon.', eng: 'I go for a walk every morning.' },
  { hin: 'Usne kal ek nayi kitab kharidi.', eng: 'She bought a new book yesterday.' },
  { hin: 'Hum kal movie dekhenge.', eng: 'We will watch a movie tomorrow.' },
  { hin: 'Mujhe is chapter me ek doubt hai.', eng: 'I have a doubt in this chapter.' },
  { hin: 'Woh school me padhati hai.', eng: 'She teaches in a school.' },
  { hin: 'Kya tum mere saath aaoge?', eng: 'Will you come with me?' }
];

var VOCAB_ITEMS = [
  { word: 'confident', meaning: 'bharosa rakhne wala', s: 'She gave a ___ speech on stage.', options: ['confident', 'confused', 'careful', 'common'], answer: 'confident' },
  { word: 'improve', meaning: 'behtar banana', s: 'Daily practice will ___ your English.', options: ['improve', 'impress', 'invite', 'ignore'], answer: 'improve' },
  { word: 'opportunity', meaning: 'mauka', s: 'This job is a great ___.', options: ['opportunity', 'opinion', 'option', 'order'], answer: 'opportunity' },
  { word: 'nervous', meaning: 'ghabraya hua', s: 'He felt ___ before the interview.', options: ['nervous', 'happy', 'healthy', 'honest'], answer: 'nervous' },
  { word: 'punctual', meaning: 'samay ka paband', s: 'She is always ___ for class.', options: ['punctual', 'popular', 'polite', 'patient'], answer: 'punctual' },
  { word: 'honest', meaning: 'imaandar', s: 'An ___ person always speaks the truth.', options: ['honest', 'happy', 'healthy', 'heavy'], answer: 'honest' }
];

var MINIMAL_PAIRS = [
  { a: 'ship', b: 'sheep', ask: 'Which word means "jahaz" (big boat)?', answer: 'ship' },
  { a: 'full', b: 'fool', ask: 'Which word means "bewakoof"?', answer: 'fool' },
  { a: 'live', b: 'leave', ask: 'Which word means "rehna" (to reside)?', answer: 'live' },
  { a: 'pen', b: 'pain', ask: 'Which word means "dard"?', answer: 'pain' },
  { a: 'west', b: 'vest', ask: 'Which word means "baniyan"?', answer: 'vest' },
  { a: 'beer', b: 'bear', ask: 'Which word means "bhalu" (animal)?', answer: 'bear' }
];

var ERROR_SPOT_ITEMS = [
  { wrong: 'He go to school daily.', fixed: 'He goes to school daily.', wrongPart: 'go', options: ['go', 'to', 'school', 'daily'], why: 'He/she/it ke saath verb me "s" lagta hai — "he goes".' },
  { wrong: 'I am having a doubt.', fixed: 'I have a doubt.', wrongPart: 'am having', options: ['am having', 'a doubt', 'I', '.'], why: '"Have" possession ke liye continuous me nahi aata — "I have a doubt".' },
  { wrong: 'She married with him.', fixed: 'She is married to him.', wrongPart: 'with', options: ['She', 'married', 'with', 'him'], why: '"Married" ke saath hamesha "to" lagta hai.' },
  { wrong: 'I have eat lunch.', fixed: 'I have eaten lunch.', wrongPart: 'eat', options: ['have', 'eat', 'lunch', 'I'], why: '"Have" ke baad third form — "have eaten".' },
  { wrong: 'Where you are going?', fixed: 'Where are you going?', wrongPart: 'you are', options: ['Where', 'you are', 'going', '?'], why: 'Sawaal me helping verb pehle — "Where are you going?"' },
  { wrong: 'I don\'t know nothing.', fixed: 'I don\'t know anything.', wrongPart: 'nothing', options: ['don\'t', 'know', 'nothing', '.'], why: 'Do negative ek-dusre ko kaat dete hain — "anything" bolo.' }
];

/* ------------------------- exercise generator ------------------------- */

ai.generateExercise = function (kind, opts) {
  opts = opts || {};
  var verbs = dataPool('verbs', VERBS);

  function tenseMcq() {
    var raw = pick(verbs);
    // App data uses v1..v5; internal fallback pool uses base/past/pp/third — normalize both.
    var v = {
      base: raw.base || raw.v1,
      past: raw.past || raw.v2,
      pp: raw.pp || raw.v3,
      third: raw.third || raw.v5
    };
    var t = Math.floor(Math.random() * 5), prompt, answer, hint, explain;
    if (t === 0) { prompt = 'She ___ to Jaipur yesterday.'; answer = v.past; hint = '"Yesterday" = finished past time.'; explain = '"Yesterday" dikhe to simple past (second form): "' + v.past + '".'; }
    else if (t === 1) { prompt = 'He ___ cricket daily.'; answer = v.third; hint = 'He/she/it + daily habit.'; explain = 'He/she/it ke saath verb me "s": "' + v.third + '".'; }
    else if (t === 2) { prompt = 'I ___ cricket daily.'; answer = v.base; hint = 'I + daily habit.'; explain = '"I" ke saath simple verb, "s" nahi: "' + v.base + '".'; }
    else if (t === 3) { prompt = 'I have ___ my lunch already.'; answer = v.pp; hint = '"have" + which form?'; explain = '"Have" ke baad third form: "have ' + v.pp + '".'; }
    else { prompt = 'They will ___ tomorrow.'; answer = v.base; hint = '"will" + which form?'; explain = '"Will" ke baad hamesha simple verb: "will ' + v.base + '".'; }
    var options = shuffle([v.base, v.past, v.pp, v.third].filter(function (x, i, a) { return a.indexOf(x) === i; }));
    return { kind: 'tense-mcq', prompt: 'Choose the correct verb: ' + prompt, options: options, answer: answer, explainHinglish: explain, hint: hint };
  }

  function articleCloze() {
    var n = pick(ARTICLE_NOUNS);
    return {
      kind: 'article-cloze',
      prompt: 'Fill the blank: ___ ' + n.word + ' is on the table.',
      options: shuffle(['a', 'an', 'the']),
      answer: n.article,
      explainHinglish: 'Awaaz suno: vowel sound = "an", consonant sound = "a". "' + n.word + '" ke liye "' + n.article + '".',
      hint: 'Pehla sound vowel hai ya consonant?'
    };
  }

  function prepCloze() {
    var p = pick(PREP_ITEMS);
    return {
      kind: 'preposition-cloze',
      prompt: 'Fill the blank: ' + p.s,
      options: shuffle(p.options),
      answer: p.answer,
      explainHinglish: 'Preposition pairs yaad rakho: married TO, discuss (about nahi), listen TO, different FROM, since = kab se, for = kitne time se.',
      hint: 'Kaun sa preposition is verb ke saath fix hai?'
    };
  }

  function scramble() {
    var s = pick(SCRAMBLE_SENTENCES);
    var words = shuffle(s.split(' '));
    return {
      kind: 'sentence-scramble',
      prompt: 'Arrange these words into a correct sentence: "' + words.join(' / ') + '"',
      answer: s + '.',
      explainHinglish: 'Order socho: pehle subject (kaun), phir verb (kya karta), phir baki. Jaise: "I + go + to school + daily".',
      hint: 'Subject se shuru karo, verb uske baad.'
    };
  }

  function translate() {
    var t = pick(TRANSLATE_ITEMS);
    return {
      kind: 'translate-hin-eng',
      prompt: 'Translate to English: "' + t.hin + '"',
      answer: t.eng,
      explainHinglish: 'Hindi sentence ka tense pehchano, phir English order me bolo: subject + verb + baki.',
      hint: 'Pehle ye socho: ye baat past ki hai, present ki, ya future ki?'
    };
  }

  function vocab() {
    var v = pick(VOCAB_ITEMS);
    return {
      kind: 'vocab-context',
      prompt: 'Choose the word that fits: ' + v.s + '  (Word: ' + v.word + ' = ' + v.meaning + ')',
      options: shuffle(v.options),
      answer: v.answer,
      explainHinglish: '"' + v.word + '" ka matlab "' + v.meaning + '" hai. Sentence ka mood dekho — kaun sa shabd fit baithta hai?',
      hint: 'Sentence positive hai ya negative? Us hisaab se shabd chuno.'
    };
  }

  function minimalPair() {
    var p = pick(MINIMAL_PAIRS);
    return {
      kind: 'minimal-pair',
      prompt: 'Say both words aloud, slowly: "' + p.a + '" vs "' + p.b + '". ' + p.ask,
      options: shuffle([p.a, p.b]),
      answer: p.answer,
      explainHinglish: 'Dono shabdon ki awaaz me halka farak hai. Dheere-dheere bolo aur farak mehsus karo — yehi listening practice hai.',
      hint: 'Shabd ko tod kar bolo: pehla sound kya hai?'
    };
  }

  function errorSpot() {
    var e = pick(ERROR_SPOT_ITEMS);
    return {
      kind: 'error-spot',
      prompt: 'Spot the wrong part in: "' + e.wrong + '"',
      options: shuffle(e.options),
      answer: e.wrongPart,
      explainHinglish: e.why + ' Sahi sentence: "' + e.fixed + '"',
      hint: 'Verb ya preposition par dhyan do — wahi galti chhupi hai.'
    };
  }

  switch (kind) {
    case 'tense-mcq': return tenseMcq();
    case 'article-cloze': return articleCloze();
    case 'preposition-cloze': return prepCloze();
    case 'sentence-scramble': return scramble();
    case 'translate-hin-eng': return translate();
    case 'vocab-context': return vocab();
    case 'minimal-pair': return minimalPair();
    case 'error-spot': return errorSpot();
    default:
      return { kind: 'unknown', prompt: 'Unknown exercise kind: ' + kind, answer: '', explainHinglish: 'Ye exercise type available nahi hai.', hint: '' };
  }
};

/* --------------------- template conversation engine --------------------
 * Scripted template engine, no LLM. Replies are picked from hand-written
 * templates per mode/topic, with a follow-up question to keep the learner
 * talking. In "strict" mode the learner's last message is checked with the
 * rule-based grammar engine (EC.ai.analyzeSentence) and corrected. */

var TOPIC_QUESTIONS = {
  'college': ['What are you studying these days?', 'Which subject do you enjoy the most?', 'How do you usually prepare for exams?', 'Tell me about your best friend in college.'],
  'friends': ['Who is your closest friend?', 'What do you and your friends do on weekends?', 'Tell me a funny memory with your friends.'],
  'coding': ['What are you building right now?', 'Which programming language do you like most?', 'What was the toughest bug you ever fixed?'],
  'interview': ['Please introduce yourself in two or three lines.', 'What are your biggest strengths?', 'Why should we hire you?', 'Where do you see yourself in three years?'],
  'travel': ['Which place do you want to visit the most?', 'Tell me about your last trip.', 'Do you prefer mountains or beaches?'],
  'daily-routine': ['What time do you wake up?', 'Describe your morning routine in 3 lines.', 'What do you usually do after dinner?'],
  'movies': ['Which movie did you watch recently?', 'Who is your favourite actor?', 'Do you like comedy or action more?'],
  'free-chat': ['How was your day today?', 'What is on your mind these days?', 'Tell me something interesting about yourself.']
};

var ACKS = ['Nice!', 'Interesting.', 'Good to know.', 'Okay, got it.', 'Cool!'];

var SHADOW_LINES = {
  'college': ['I attend my morning lectures regularly.', 'My favourite subject is English.', 'I study with my friends in the library.'],
  'friends': ['My best friend lives near my house.', 'We play cricket every Sunday.', 'True friends always help each other.'],
  'coding': ['I write code every single day.', 'Practice makes a programmer perfect.', 'I learn one new concept daily.'],
  'interview': ['Good morning, I am excited to be here.', 'I am a quick learner and a team player.', 'Thank you for this opportunity.'],
  'travel': ['I love visiting new places.', 'Mountains give me peace of mind.', 'Travelling teaches us many things.'],
  'daily-routine': ['I wake up at six every morning.', 'I drink warm water first.', 'I sleep early at night.'],
  'movies': ['I watched a great movie last night.', 'The story was very touching.', 'The acting was simply superb.'],
  'free-chat': ['Today is a beautiful day.', 'I feel fresh and confident.', 'Small steps lead to big results.']
};

var DEBATE_STANCES = {
  'movies': 'I think old movies are far better than new ones. New films are all noise and no story. Try to change my mind!',
  'travel': 'Beaches are boring — mountains are the only real travel. Prove me wrong!',
  'daily-routine': 'Waking up early is overrated. Night owls do their best work. Disagree?',
  'coding': 'AI will replace all programmers in five years. Tell me why I am wrong.',
  'friends': 'Online friends are not real friends. Only people you meet in person count. Your turn — argue!',
  'college': 'College degrees are a waste of money — skills matter, not certificates. Argue against me.',
  'interview': 'Confidence matters more than knowledge in interviews. Change my view.',
  'free-chat': 'Tea is better than coffee, and this is not debatable. Well... try to debate it anyway!'
};

var ROLEPLAY_OPENERS = {
  'hr-manager': ['Good morning. Please introduce yourself in two or three lines.', 'Tell me about a challenge you handled in college or at work.', 'Why do you want to join our company?'],
  'professor': ['Good. Explain this topic to me in simple words, as if I am a beginner.', 'Why should I give you full marks in this subject? Convince me.'],
  'senior': ['Arre, tension mat le. Tell me honestly — where exactly are you stuck?', 'I was also confused at your stage. What is troubling you the most?'],
  'client': ['Hi, I need this work finished by Friday. Can you handle it?', 'Your last update was unclear. Explain the delay in simple words.'],
  'stranger': ['Excuse me, can you help me find the railway station?', 'Hi! Are you from around here? What is worth seeing in this city?']
};

ai.generateConversation = function (mode, topic, persona, history) {
  mode = mode || 'normal';
  topic = TOPIC_QUESTIONS[topic] ? topic : 'free-chat';
  persona = persona || 'senior';
  history = history || [];

  var lastUser = null;
  for (var i = history.length - 1; i >= 0; i--) {
    if (history[i] && history[i].role === 'user' && history[i].text) { lastUser = history[i].text; break; }
  }

  var res = { mode: mode, topic: topic, persona: persona, reply: '', followUp: '', correction: null };
  var nextQ = function () { return pick(TOPIC_QUESTIONS[topic]); };

  if (mode === 'strict') {
    // Correct the learner's last message with the rule-based grammar engine.
    var q = nextQ();
    if (lastUser && typeof ai.analyzeSentence === 'function') {
      var a = ai.analyzeSentence(lastUser);
      if (a.mistakes.length > 0) {
        var m0 = a.mistakes[0];
        res.correction = { label: m0.label, spanText: m0.spanText, fix: m0.fix, hinglish: m0.hinglish };
        res.reply = 'Good try! One correction: "' + m0.spanText + '" should be "' + m0.fix + '". ' + m0.why;
        res.followUp = q;
        res.reply += ' Now, ' + q.charAt(0).toLowerCase() + q.slice(1);
      } else {
        res.reply = 'Perfect — no mistakes in that sentence! Next question: ' + q;
        res.followUp = q;
      }
    } else {
      res.reply = pick(ACKS) + ' ' + q;
      res.followUp = q;
    }
  } else if (mode === 'shadowing') {
    var line = pick(SHADOW_LINES[topic] || SHADOW_LINES['free-chat']);
    res.reply = 'Repeat after me: "' + line + '"';
    res.followUp = 'Now type it back word for word — exactly as I wrote it.';
  } else if (mode === 'debate') {
    var stance = DEBATE_STANCES[topic] || DEBATE_STANCES['free-chat'];
    res.reply = stance;
    res.followUp = 'Give me your best 2-3 lines against my view.';
  } else if (mode === 'roleplay') {
    var openers = ROLEPLAY_OPENERS[persona] || ROLEPLAY_OPENERS['senior'];
    res.reply = pick(openers);
    res.followUp = 'Reply in character — as if you are really talking to me.';
  } else { // normal
    var nq = nextQ();
    res.reply = pick(ACKS) + ' ' + nq;
    res.followUp = nq;
  }
  return res;
};

/* ------------------------- answer evaluation --------------------------
 * Rule-based scoring, no LLM: grammar via EC.ai.analyzeSentence, fluency via
 * filler-word count, structure via STAR markers, relevance via keyword overlap
 * with the question. */

var STOPWORDS = { what: 1, when: 1, where: 1, which: 1, who: 1, whom: 1, whose: 1, why: 1, how: 1, does: 1, did: 1, are: 1, was: 1, were: 1, have: 1, has: 1, had: 1, will: 1, would: 1, could: 1, should: 1, your: 1, you: 1, the: 1, and: 1, for: 1, with: 1, about: 1, tell: 1, please: 1, describe: 1 };

function questionKeywords(question) {
  var words = String(question || '').toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/);
  var keys = [];
  for (var i = 0; i < words.length; i++) {
    var w = words[i];
    if (w.length > 3 && !STOPWORDS[w] && keys.indexOf(w) < 0) keys.push(w);
  }
  return keys;
}

function analyzeSafe(t) {
  try {
    if (typeof ai.analyzeSentence === 'function') return ai.analyzeSentence(t);
  } catch (e) { /* fall through */ }
  return { mistakes: [], fluency: { fillers: 0, pauseMarks: 0, score: 100 }, accuracy: 100 };
}

ai.evaluateAnswer = function (question, answer, rubric) {
  rubric = rubric || [];
  answer = String(answer == null ? '' : answer);
  var a = analyzeSafe(answer);
  var words = answer.trim().split(/\s+/).filter(Boolean);

  // grammar: from the rule-based engine
  var grammar = a.accuracy;
  // fluency: filler words + too-short answers
  var fluency = clamp(100 - 12 * a.fluency.fillers - 6 * a.fluency.pauseMarks, 0, 100);
  if (words.length > 0 && words.length < 5) fluency = Math.min(fluency, 45);
  // structure: STAR markers for behavioral answers
  var starKeys = ['situation', 'task', 'action', 'result'];
  var found = [], missing = [];
  var low = answer.toLowerCase();
  for (var i = 0; i < starKeys.length; i++) {
    if (new RegExp('\\b' + starKeys[i] + '\\b').test(low)) found.push(starKeys[i]);
    else missing.push(starKeys[i]);
  }
  var storyMarkers = (low.match(/\b(first|then|after that|finally|because|so)\b/g) || []).length;
  var structure = clamp(found.length * 22 + Math.min(storyMarkers * 8, 24), 0, 100);
  // relevance: question keywords covered in the answer
  var keys = questionKeywords(question), covered = 0;
  for (var k = 0; k < keys.length; k++) if (low.indexOf(keys[k]) >= 0) covered++;
  var relevance = keys.length ? Math.round(100 * covered / keys.length) : 60;

  var feedback = [];
  if (a.mistakes.length) {
    var m0 = a.mistakes[0];
    feedback.push('Grammar: ' + a.mistakes.length + ' mistake(s). Pehli galti — "' + m0.spanText + '" should be "' + m0.fix + '". (' + m0.hinglish + ')');
  } else {
    feedback.push('Grammar: clean! Koi grammar mistake nahi mili. Bahut badhiya.');
  }
  if (a.fluency.fillers > 0) feedback.push('Fluency: ' + a.fluency.fillers + ' filler word(s) (' + a.fluency.fillerWords.slice(0, 4).join(', ') + '). Um/uh ke bina bolne ki practice karo.');
  if (words.length < 5) feedback.push('Length: jawab bahut chhota hai. Kam se kam 2-3 poore sentences likho/bolo.');
  if (missing.length === starKeys.length) feedback.push('Structure: STAR format try karo — Situation, Task, Action, Result. Interview me yehi chalta hai.');
  else if (missing.length) feedback.push('Structure: STAR me ye parts missing hain — ' + missing.join(', ') + '. Inhe jodo.');
  else feedback.push('Structure: poora STAR structure mila. Excellent!');
  if (relevance < 50 && keys.length) feedback.push('Relevance: sawaal ke main points (' + keys.slice(0, 3).join(', ') + ') ka jawab do.');
  for (var r = 0; r < rubric.length; r++) feedback.push('Rubric [' + rubric[r] + ']: self-check karo — kya tumhara jawab is par khara utarta hai?');

  // improved sample answer (template-based): filler-free + STAR scaffold
  var cleaned = answer.replace(/\b(um+|uh+|hmm+|like|you know|actually|basically)\b/gi, '')
    .replace(/\s{2,}/g, ' ').trim()
    .replace(/^[a-z]/, function (c) { return c.toUpperCase(); });
  var better = 'A stronger, interview-ready version: "The situation was [' + (keys[0] || 'the topic') + ']. ' +
    'My task was to handle it well. The action I took was [' + (cleaned ? cleaned.slice(0, 80) : 'explain clearly') + ']. ' +
    'The result was positive and I learned from it." ' +
    'Brackets me apni real details bharo — yehi STAR format hai.';

  return {
    scores: { grammar: grammar, fluency: fluency, structure: structure, relevance: relevance },
    feedback: feedback,
    better: better,
    star: { found: found, missing: missing }
  };
};

/* ------------------------------ shadowing ----------------------------- */

function tokenize(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9'\s]/g, ' ').split(/\s+/).filter(Boolean);
}

// Word-level match % via longest-common-subsequence over word tokens.
ai.scoreRepeat = function (expected, actual) {
  var e = tokenize(expected), a = tokenize(actual);
  var n = e.length, m = a.length;
  if (!n) return { percent: 0, matched: 0, total: 0, missedWords: [] };
  var dp = [];
  for (var i = 0; i <= n; i++) { dp[i] = []; for (var j = 0; j <= m; j++) dp[i][j] = 0; }
  for (i = 1; i <= n; i++) {
    for (var j2 = 1; j2 <= m; j2++) {
      dp[i][j2] = e[i - 1] === a[j2 - 1] ? dp[i - 1][j2 - 1] + 1 : Math.max(dp[i - 1][j2], dp[i][j2 - 1]);
    }
  }
  var lcs = dp[n][m];
  var inActual = {};
  for (var k = 0; k < a.length; k++) inActual[a[k]] = 1;
  var missed = [];
  for (var w = 0; w < e.length; w++) {
    if (!inActual[e[w]] && missed.indexOf(e[w]) < 0) missed.push(e[w]);
  }
  return { percent: Math.round(100 * lcs / n), matched: lcs, total: n, missedWords: missed };
};

/* -------------------- weekly report & focus (store) ---------------------
 * Template-based text built from EC.store session stats, no LLM.
 * Session shape (flexible): {date: <ISO or epoch>, skill: 'grammar', score: 0-100}.
 * readSessions tries EC.store.get('sessions'), EC.store.sessions and
 * EC.store.getStats().sessions — missing store simply yields an empty log. */

// Plain-text output (also suitable for voice playback — no SSML/markup).
function readSessions() {
  try {
    var s = EC.store;
    if (!s) return [];
    if (typeof s.get === 'function') {
      var v = s.get('sessions');
      if (Array.isArray(v)) return v;
    }
    if (Array.isArray(s.sessions)) return s.sessions;
    if (typeof s.getStats === 'function') {
      var st = s.getStats();
      if (st && Array.isArray(st.sessions)) return st.sessions;
    }
  } catch (e) { /* ignore */ }
  return [];
}

function skillAverages(sessions, fromMs, toMs) {
  var sum = {}, cnt = {};
  for (var i = 0; i < sessions.length; i++) {
    var se = sessions[i] || {};
    var t = se.date ? new Date(se.date).getTime() : 0;
    if (!t || t < fromMs || t >= toMs) continue;
    var skill = String(se.skill || 'general');
    var score = +se.score || 0;
    sum[skill] = (sum[skill] || 0) + score;
    cnt[skill] = (cnt[skill] || 0) + 1;
  }
  var avg = {};
  for (var k in sum) if (cnt[k]) avg[k] = Math.round(sum[k] / cnt[k]);
  return avg;
}

var ENCOURAGEMENTS = [
  'Roz 15 minute practice tumhe sabse aage rakhegi. Keep going!',
  'Consistency beats talent — kal se thoda behtar bano. You can do it!',
  'Galtiyan hi teacher hain. Har correction tumhe strong banata hai.',
  'Slow progress is still progress. Lage raho!'
];

ai.weeklyReport = function () {
  var sessions = readSessions();
  var now = Date.now(), DAY = 86400000;
  var recent = skillAverages(sessions, now - 7 * DAY, now + DAY);
  var prev = skillAverages(sessions, now - 14 * DAY, now - 7 * DAY);

  var skills = {};
  for (var k in recent) skills[k] = 1;
  for (var k2 in prev) skills[k2] = 1;

  var deltas = [], weakest = null, weakestScore = 101;
  for (var sk in skills) {
    if (recent[sk] != null) {
      if (recent[sk] < weakestScore) { weakestScore = recent[sk]; weakest = sk; }
      if (prev[sk] != null) deltas.push({ skill: sk, delta: recent[sk] - prev[sk] });
    }
  }
  deltas.sort(function (a, b) { return b.delta - a.delta; });
  var improvements = deltas.filter(function (d) { return d.delta > 0; }).slice(0, 2);

  var encouragement = pick(ENCOURAGEMENTS);
  var text;
  if (!weakest) {
    text = 'Abhi practice data nahi hai, isliye report khaali hai. ' +
      'Aaj se roz ek chhota session karo — agle hafte tumhari progress report taiyaar hogi. ' + encouragement;
  } else {
    var impLine = improvements.length
      ? 'Sabse bada sudhaar: ' + improvements.map(function (d) { return d.skill + ' (+' + d.delta + ')'; }).join(', ') + '. '
      : 'Is hafte koi bada jump nahi — consistency hi asli jeet hai. ';
    text = 'Tumhare English week ki report. ' + impLine +
      'Abhi sabse weak skill: ' + weakest + ' (score ' + weakestScore + '). ' +
      'Focus: agle hafte roz ' + weakest + ' ki thodi extra practice karo. ' + encouragement;
  }
  var focus = weakest
    ? 'Focus on "' + weakest + '" — 10 extra minutes daily: one drill + one revision.'
    : 'Start daily practice — 15 minutes: 5 grammar, 5 words, 5 speaking.';
  return { text: text, weakest: weakest, improvements: improvements, focus: focus, encouragement: encouragement };
};

var DAILY_MIX = {
  'grammar': [
    { activity: 'Tense drill — 10 MCQs', minutes: 10 },
    { activity: 'Error-spot exercise', minutes: 5 },
    { activity: 'Write 5 correct sentences aloud', minutes: 10 }
  ],
  'vocabulary': [
    { activity: 'Learn 5 new words with example sentences', minutes: 10 },
    { activity: 'Vocab-in-context quiz', minutes: 10 },
    { activity: "Revise yesterday's words", minutes: 5 }
  ],
  'speaking': [
    { activity: 'Shadowing — repeat lines aloud', minutes: 10 },
    { activity: 'Answer 3 questions aloud', minutes: 10 },
    { activity: 'Record yourself and compare', minutes: 5 }
  ],
  'fluency': [
    { activity: 'Talk 1 minute without um/uh', minutes: 10 },
    { activity: 'Shadowing fast lines', minutes: 10 },
    { activity: 'Filler-word self check', minutes: 5 }
  ],
  'listening': [
    { activity: 'Listen and repeat lines', minutes: 10 },
    { activity: 'Minimal-pair practice', minutes: 10 },
    { activity: 'Dictation — write what you hear', minutes: 5 }
  ]
};

ai.recommendFocus = function () {
  var weakest = null;
  try { weakest = ai.weeklyReport().weakest; } catch (e) { /* ignore */ }
  if (!weakest || !DAILY_MIX[weakest]) weakest = 'grammar';
  return {
    weakest: weakest,
    mix: DAILY_MIX[weakest].slice(),
    tip: 'Weakest skill "' + weakest + '" par roz 25 minute do. Baaki skills ka halka revision hafte me 2 baar kaafi hai. Chhote, roz ke sessions — bade weekend plans se behtar hain.'
  };
};

if (typeof module !== 'undefined' && module.exports) module.exports = EC.ai;

})();
