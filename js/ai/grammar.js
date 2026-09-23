/* My AI English Coach — on-device grammar engine (no LLM, no API).
 * Plain <script> file; attaches to window.EC.ai. Also loads under Node
 * (module.exports = EC.ai) so rules can be unit-tested.
 * No DOM usage in this file. */
(function () {
'use strict';

var EC = (typeof window !== 'undefined') ? (window.EC = window.EC || {}) :
  (typeof module !== 'undefined' && module.exports) ? module.exports : {};
EC.ai = EC.ai || {};
var ai = EC.ai;

/* ------------------------------ helpers ------------------------------ */

function clamp(n, lo, hi) {
  n = +n || 0;
  if (n < lo) return lo;
  if (n > hi) return hi;
  return n;
}

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

// Run a global regex over text, calling cb(match) for every hit.
function eachMatch(re, text, cb) {
  re.lastIndex = 0;
  var m;
  while ((m = re.exec(text)) !== null) {
    cb(m);
    if (m[0].length === 0) re.lastIndex++; // avoid infinite loop on empty match
  }
}

// Character span [start,end] of a regex subgroup inside the whole match.
function subSpan(m, gi) {
  var g = m[gi];
  if (g == null) return null;
  var at = m[0].indexOf(g);
  if (at < 0) return null;
  var s = m.index + at;
  return [s, s + g.length];
}

function mkMistake(category, label, start, end, text, why, hinglish, fix) {
  return {
    category: category,
    span: [start, end],
    spanText: text.slice(start, end),
    label: label,
    why: why,
    hinglish: hinglish,
    fix: fix,
    natural: '' // filled in by analyzeSentence
  };
}

/* --------------------------- verb data maps -------------------------- */

// base -> third-person-singular
var THIRD = {
  go: 'goes', do: 'does', have: 'has', eat: 'eats', play: 'plays',
  watch: 'watches', work: 'works', like: 'likes', want: 'wants',
  read: 'reads', write: 'writes', speak: 'speaks', come: 'comes',
  make: 'makes', take: 'takes', know: 'knows', think: 'thinks',
  live: 'lives', study: 'studies', run: 'runs', walk: 'walks',
  talk: 'talks', sleep: 'sleeps', drink: 'drinks', buy: 'buys',
  teach: 'teaches', learn: 'learns', help: 'helps', call: 'calls',
  try: 'tries', carry: 'carries', fly: 'flies', pass: 'passes',
  miss: 'misses', wash: 'washes', fix: 'fixes', say: 'says',
  get: 'gets', give: 'gives', see: 'sees'
};
var THIRD_FORMS = {}; // third -> base
Object.keys(THIRD).forEach(function (b) { THIRD_FORMS[THIRD[b]] = b; });

// did + X -> correct simple past
var DID_PAST = {
  go: 'went', eat: 'ate', come: 'came', see: 'saw', take: 'took',
  make: 'made', know: 'knew', think: 'thought', do: 'did', have: 'had',
  get: 'got', write: 'wrote', speak: 'spoke', sleep: 'slept',
  buy: 'bought', teach: 'taught', drink: 'drank', swim: 'swam',
  sing: 'sang', begin: 'began', break: 'broke', choose: 'chose',
  drive: 'drove', forget: 'forgot', give: 'gave', grow: 'grew',
  ride: 'rode', wear: 'wore', win: 'won', run: 'ran'
};
// past-simple words that must NOT follow did/have/has/had
var PAST_WORDS = {
  went: 1, ate: 1, came: 1, saw: 1, took: 1, knew: 1, did: 1, got: 1,
  wrote: 1, spoke: 1, ran: 1, bought: 1, drank: 1, swam: 1, sang: 1,
  began: 1, broke: 1, chose: 1, drove: 1, forgot: 1, gave: 1, grew: 1,
  rode: 1, wore: 1, won: 1
};
// have/has/had + X -> past participle (only entries that CHANGE the word)
var PAST_PART = {
  went: 'gone', ate: 'eaten', saw: 'seen', came: 'come', took: 'taken',
  did: 'done', knew: 'known', got: 'gotten', wrote: 'written',
  spoke: 'spoken', ran: 'run', drank: 'drunk', swam: 'swum',
  sang: 'sung', began: 'begun', broke: 'broken', chose: 'chosen',
  drove: 'driven', forgot: 'forgotten', gave: 'given', grew: 'grown',
  rode: 'ridden', wore: 'worn',
  eat: 'eaten', go: 'gone', see: 'seen', come: 'come', take: 'taken',
  make: 'made', do: 'done', know: 'known', get: 'gotten',
  write: 'written', speak: 'spoken', run: 'run', buy: 'bought',
  drink: 'drunk', swim: 'swum', sing: 'sung', begin: 'begun',
  break: 'broken', choose: 'chosen', drive: 'driven', forget: 'forgotten',
  give: 'given', grow: 'grown', ride: 'ridden', wear: 'worn'
};

var GERUND_SPECIAL = { run: 'running', swim: 'swimming', sit: 'sitting', get: 'getting', put: 'putting', stop: 'stopping' };
function gerund(v) {
  if (GERUND_SPECIAL[v]) return GERUND_SPECIAL[v];
  if (/[^aeiou]ie$/.test(v)) return v.slice(0, -2) + 'ying';
  if (/ee$/.test(v)) return v + 'ing';
  if (/e$/.test(v)) return v.slice(0, -1) + 'ing';
  return v + 'ing';
}

// base verbs that must take -ing after am/is/are ("I am go" -> "I am going")
var AM_BASE = ['go', 'eat', 'play', 'watch', 'work', 'read', 'write', 'speak',
  'come', 'make', 'take', 'think', 'live', 'study', 'walk', 'talk', 'sleep', 'give', 'do'];

/* --------------------------- rule detectors --------------------------- */
/* Each detector pushes mistake objects into `out`. Spans are character
 * offsets into the ORIGINAL text (regex match.index based). */

function detectArticles(text, out) {
  // "a" before a vowel SOUND -> "an" (excluding consonant-sound words like "university", "one")
  eachMatch(/\ba\s+(?!(?:university|uniforms?|users?|usual|one|once|europeans?|unicorns?|utility)\b)([aeiou][a-z]*)/gi, text, function (m) {
    var fix = (m[0].charAt(0) === 'A' ? 'An ' : 'an ') + m[1];
    out.push(mkMistake('articles', 'Article: use "an" before vowel sounds',
      m.index, m.index + m[0].length, text,
      'Use "an" (not "a") before words that start with a vowel sound: a, e, i, o, u.',
      'Vowel sound (a, e, i, o, u) se shuru hone wale shabd se pehle "a" nahi, "an" lagta hai. Jaise: an apple, an egg.',
      fix));
  });
  // "a" before silent-h words (an hour, an honest man)
  eachMatch(/\ba\s+(hours?|honest\w*|heirs?|honou?rs?)\b/gi, text, function (m) {
    var fix = (m[0].charAt(0) === 'A' ? 'An ' : 'an ') + m[1];
    out.push(mkMistake('articles', 'Article: "an" before silent-h words',
      m.index, m.index + m[0].length, text,
      'Words like "hour" and "honest" start with a vowel SOUND (the h is silent), so they take "an".',
      '"Hour" aur "honest" me "h" silent hai, isliye awaaz vowel se shuru hoti hai — "an hour", "an honest man" bolo.',
      fix));
  });
  // "an" before consonant-sound words -> "a" (a university, a one-time offer)
  eachMatch(/\ban\s+(university|uniforms?|users?|usual|one|once|europeans?|unicorns?|utility)\b/gi, text, function (m) {
    var fix = (m[0].charAt(0) === 'A' ? 'A ' : 'a ') + m[1];
    out.push(mkMistake('articles', 'Article: use "a" before consonant sounds',
      m.index, m.index + m[0].length, text,
      '"University", "one", "user" start with a "yoo" consonant sound, so they take "a", not "an".',
      '"University / one / user" bolne me "yu" ki awaaz aati hai — ye consonant sound hai, isliye "a university", "a one-time".',
      fix));
  });
  // missing article: "I am teacher" -> "I am a teacher", "He is honest man" -> "an honest man"
  var roles = 'teacher|student|doctor|engineer|nurse|manager|man|woman|boy|girl|lawyer|chef|driver|farmer|writer|artist|actor|player|leader|captain|friend|person|child|officer|clerk|author|king|queen';
  var adjs = 'good|honest|nice|great|big|new|old|young|small|tall|rich|poor|kind|brave|smart|hardworking';
  var re = new RegExp('\\b(am|is|are|was|were)\\s+((?:(?:' + adjs + ')\\s+)?(?:' + roles + '))\\b', 'gi');
  eachMatch(re, text, function (m) {
    var sp = subSpan(m, 2);
    if (!sp) return;
    var phrase = m[2];
    var art = (/^[aeiou]/i.test(phrase) || /^(honest|hour)/i.test(phrase)) ? 'an' : 'a';
    out.push(mkMistake('articles', 'Article missing before a countable noun',
      sp[0], sp[1], text,
      'A singular countable noun needs "a"/"an" after am/is/are: "I am a teacher", not "I am teacher".',
      'English me akela "teacher" nahi kehte — "a teacher" kehte hain. Hindi ke "main teacher hoon" me "a" chhup jata hai, par English me lagana padta hai.',
      art + ' ' + phrase));
  });
  // "the" misuse basics
  eachMatch(/\bplay\s+the\s+(cricket|football|tennis|hockey|chess|badminton|volleyball)\b/gi, text, function (m) {
    out.push(mkMistake('articles', 'Unnecessary "the" before game names',
      m.index, m.index + m[0].length, text,
      'No "the" before names of games and sports: "play cricket", not "play the cricket".',
      'Khelon ke naam se pehle "the" nahi lagta — "I play cricket" bolo, "I play the cricket" nahi.',
      'play ' + m[1]));
  });
  eachMatch(/\bgo\s+to\s+the\s+home\b/gi, text, function (m) {
    out.push(mkMistake('articles', 'Unnecessary "the" before "home"',
      m.index, m.index + m[0].length, text,
      'With "go/come", "home" needs no "the": "go home", "come home".',
      '"Ghar jana" = "go home". "The" lagane ki zaroorat nahi hai.',
      'go home'));
  });
  eachMatch(/\bthe\s+(India|Pakistan|Nepal|China|Japan|France|Germany|England|America|Russia|Italy|Spain)\b/gi, text, function (m) {
    var fix = m[1];
    out.push(mkMistake('articles', 'Unnecessary "the" before country names',
      m.index, m.index + m[0].length, text,
      'Most country names take no article: "India", not "the India". (Exceptions like "the USA", "the UK".)',
      'Zyadatar deshon ke naam se pehle "the" nahi lagta — "India" bolo, "the India" nahi. ("the USA" alag case hai.)',
      fix));
  });
}

function detectSVAgreement(text, out) {
  var bases = Object.keys(THIRD).join('|');
  // he/she/it + base verb -> third-person -s form ("he go" -> "he goes")
  var re = new RegExp('(?<!\\bdoes\\s)(?<!\\bdo\\s)(?<!\\bdid\\s)\\b(he|she|it)\\s+(' + bases + ')\\b', 'gi');
  eachMatch(re, text, function (m) {
    var base = m[2].toLowerCase();
    var fix = m[1] + ' ' + THIRD[base];
    out.push(mkMistake('sv-agreement', 'Subject-verb agreement: he/she/it needs verb + s',
      m.index, m.index + m[0].length, text,
      'With he/she/it, add -s/-es to the verb in present tense: "he goes", "she has", "it works".',
      'He/she/it ke saath present tense me verb me "s" lagta hai — "he go" nahi, "he goes". "She have" nahi, "she has".',
      fix));
  });
  // they/we/you/I + -s verb -> base form ("they goes" -> "they go")
  var thirds = Object.keys(THIRD_FORMS).join('|');
  var re2 = new RegExp('\\b(they|we|you|I)\\s+(' + thirds + ')\\b', 'gi');
  eachMatch(re2, text, function (m) {
    var fix = m[1] + ' ' + THIRD_FORMS[m[2].toLowerCase()];
    out.push(mkMistake('sv-agreement', 'Subject-verb agreement: plural subject takes base verb',
      m.index, m.index + m[0].length, text,
      'With I/you/we/they, use the base verb without -s: "they go", not "they goes".',
      'I/you/we/they ke saath verb me "s" nahi lagta — "they go" bolo, "they goes" nahi.',
      fix));
  });
  // be-verb agreement: "I is" -> "I am", "you is" -> "you are", "he are" -> "he is"
  eachMatch(/\bi\s+is\b/gi, text, function (m) {
    out.push(mkMistake('sv-agreement', 'Subject-verb agreement: "I" takes "am"',
      m.index, m.index + m[0].length, text,
      '"I" always pairs with "am": "I am", never "I is".',
      '"I" ke saath hamesha "am" aata hai — "I is" bilkul galat hai.',
      'I am'));
  });
  eachMatch(/\b(you|we|they)\s+is\b/gi, text, function (m) {
    out.push(mkMistake('sv-agreement', 'Subject-verb agreement: you/we/they take "are"',
      m.index, m.index + m[0].length, text,
      '"You", "we" and "they" pair with "are": "you are", never "you is".',
      '"You/we/they" ke saath "are" lagta hai — "you is" nahi, "you are".',
      m[1] + ' are'));
  });
  eachMatch(/\b(he|she|it)\s+are\b/gi, text, function (m) {
    out.push(mkMistake('sv-agreement', 'Subject-verb agreement: he/she/it takes "is"',
      m.index, m.index + m[0].length, text,
      '"He", "she" and "it" pair with "is": "he is", never "he are".',
      '"He/she/it" ke saath "is" lagta hai — "he are" nahi, "he is".',
      m[1] + ' is'));
  });
  // don't / doesn't mix-ups
  eachMatch(/\b(he|she|it)\s+don't\b/gi, text, function (m) {
    out.push(mkMistake('sv-agreement', 'Use "doesn\'t" with he/she/it',
      m.index, m.index + m[0].length, text,
      'Negative of "does" is "doesn\'t" for he/she/it: "she doesn\'t like it".',
      'He/she/it ke saath "don\'t" nahi, "doesn\'t" lagta hai — "she doesn\'t like coffee".',
      m[1] + " doesn't"));
  });
  eachMatch(/\b(they|we|you|I)\s+doesn't\b/gi, text, function (m) {
    out.push(mkMistake('sv-agreement', 'Use "don\'t" with I/you/we/they',
      m.index, m.index + m[0].length, text,
      'With I/you/we/they the negative is "don\'t": "they don\'t know".',
      'I/you/we/they ke saath "don\'t" lagta hai — "they don\'t know".',
      m[1] + " don't"));
  });
  // compound subject: "my friend and I goes" / "Tom and Jerry goes" -> base verb
  var cThirds = 'goes|does|has|eats|plays|watches|works|likes|wants|reads|writes|speaks|comes|makes|takes|knows|thinks|lives|studies|runs|walks|talks|sleeps|drinks|buys';
  var reC = new RegExp('\\band\\s+(?:[A-Za-z]+\\s+){1,3}(' + cThirds + ')\\b', 'gi');
  eachMatch(reC, text, function (m) {
    var sp = subSpan(m, 1);
    if (!sp) return;
    var fix = THIRD_FORMS[m[1].toLowerCase()];
    out.push(mkMistake('sv-agreement', 'Subject-verb agreement: compound subject takes base verb',
      sp[0], sp[1], text,
      'A compound subject ("A and B") is plural, so the verb takes no -s: "go", not "goes".',
      '"A aur B" dono milkar plural hote hain — verb me "s" nahi lagta: "go" bolo, "goes" nahi.',
      fix));
  });
}

function detectTenses(text, out) {
  // "I am go" -> "I am going" (am/is/are + base verb)
  var reAm = new RegExp('\\b(am|is|are)\\s+(' + AM_BASE.join('|') + ')\\b', 'gi');
  eachMatch(reAm, text, function (m) {
    var fix = m[1] + ' ' + gerund(m[2].toLowerCase());
    out.push(mkMistake('tenses', 'Tense: use -ing after am/is/are',
      m.index, m.index + m[0].length, text,
      'After am/is/are the verb needs -ing ("I am going"). Or drop am/is/are for simple present: "I go". Pick one pattern.',
      '"am/is/are" ke baad verb me -ing lagta hai — "I am going". Ya phir simple present bolo: "I go". Dono mix mat karo.',
      fix));
  });
  // "did went" / "did go" -> "went" (double past / did + past)
  eachMatch(/\bdid\s+([a-z]+)\b/gi, text, function (m) {
    var v = m[1].toLowerCase(), fixWord = null;
    if (PAST_WORDS[v]) fixWord = v;            // did went -> went
    else if (DID_PAST[v]) fixWord = DID_PAST[v]; // did go -> went
    else if (/ed$/.test(v) && v.length > 3) fixWord = v; // did played -> played
    if (!fixWord) return;
    out.push(mkMistake('tenses', 'Tense: only one past marker ("did went" is wrong)',
      m.index, m.index + m[0].length, text,
      '"Did" already marks the past, so the main verb must not be past too: "did go" or "went" — never "did went".',
      '"Did" khud past dikhata hai, isliye verb dobara past me nahi hoga. "Did you go?" ya "You went?" — "did went" kabhi nahi.',
      fixWord));
  });
  // "has went" / "I have eat" -> "has gone" / "have eaten"
  var ppKeys = Object.keys(PAST_PART).join('|');
  var reHave = new RegExp('\\b(has|have|had)\\s+(' + ppKeys + ')\\b', 'gi');
  eachMatch(reHave, text, function (m) {
    var v = m[2].toLowerCase();
    var pp = PAST_PART[v];
    if (!pp || pp === v) return;
    var fix = m[1] + ' ' + pp;
    out.push(mkMistake('tenses', 'Tense: use past participle after has/have/had',
      m.index, m.index + m[0].length, text,
      'After has/have/had use the past participle (third form): "has gone", "have eaten" — not "has went" / "have eat".',
      '"Has/have/had" ke baad verb ka third form lagta hai — "has gone", "have eaten". "Has went" ya "have eat" galat hai.',
      fix));
  });
  // "will goes" -> "will go"
  var thirds = Object.keys(THIRD_FORMS).join('|');
  var reWill = new RegExp('\\bwill\\s+(' + thirds + ')\\b', 'gi');
  eachMatch(reWill, text, function (m) {
    var fix = 'will ' + THIRD_FORMS[m[1].toLowerCase()];
    out.push(mkMistake('tenses', 'Tense: base verb after "will"',
      m.index, m.index + m[0].length, text,
      'After "will" always use the base verb: "will go", "will eat" — never "will goes".',
      '"Will" ke baad hamesha verb ka simple form lagta hai — "will go", "will goes" kabhi nahi.',
      fix));
  });
}

function detectPrepositions(text, out) {
  function prep(re, fixFn, label, why, hinglish) {
    eachMatch(re, text, function (m) {
      out.push(mkMistake('prepositions', label, m.index, m.index + m[0].length, text, why, hinglish, fixFn(m)));
    });
  }
  prep(/\bmarried\s+with\b/gi, function () { return 'married to'; },
    'Preposition: "married to", not "married with"',
    '"Married" always pairs with "to": "She is married to him."',
    '"Married" ke saath hamesha "to" lagta hai — "with" nahi. "She is married to him."');
  prep(/\bdiscuss\s+about\b/gi, function () { return 'discuss'; },
    'Preposition: no "about" after "discuss"',
    '"Discuss" already means "talk about", so "discuss about" repeats the idea. Just say "discuss the plan".',
    '"Discuss" ka matlab hi "baat karna" hai, isliye "about" lagana repeat ho jata hai. Sirf "discuss the plan" bolo.');
  prep(/\bcomprise\s+of\b/gi, function () { return 'comprise'; },
    'Preposition: "comprise", not "comprise of"',
    '"Comprise" already means "consist of". Say "The team comprises ten players" or "consists of ten players".',
    '"Comprise" ka matlab hi "consist of" hai. "Comprise of" double ho jata hai — "comprise" bolo ya "consist of".');
  prep(/\benter\s+into\b/gi, function () { return 'enter'; },
    'Preposition: "enter the room", not "enter into"',
    '"Enter" already includes the idea of going in: "enter the room".',
    '"Enter" me hi "andar jana" chhupa hai — "enter the room" bolo, "enter into" nahi.');
  prep(/\bdifferent\s+than\b/gi, function () { return 'different from'; },
    'Preposition: "different from", not "different than"',
    'Standard usage is "different from": "This is different from that."',
    '"Different" ke saath "from" lagta hai — "different from", "different than" nahi.');
  prep(/\blisten\s+(music|him|her|them|us|me)\b/gi, function (m) { return 'listen to ' + m[1]; },
    'Preposition: "listen to", not just "listen"',
    '"Listen" needs "to" before its object: "listen to music", "listen to me".',
    '"Listen" ke baad "to" lagta hai — "listen to music", "listen to me".');
  prep(/\bsince\s+(\d+)\s+(years?|months?|weeks?|days?|hours?|minutes?|seconds?)\b/gi,
    function (m) { return 'for ' + m[1] + ' ' + m[2]; },
    'Preposition: "for" with durations, "since" with points of time',
    '"Since" = from a point in time ("since 2020", "since Monday"). "For" = a duration ("for 5 years").',
    '"Since" matlab "kab se" (since Monday, since 2020). "For" matlab "kitne time se" (for 5 years). "Since 5 years" galat hai.');
  var months = 'monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|morning|evening|night|201[0-9]|202[0-9]';
  prep(new RegExp('\\bfor\\s+(' + months + ')\\b', 'gi'),
    function (m) { return 'since ' + m[1]; },
    'Preposition: "since" with points of time',
    '"Since" is used with a starting point: "since Monday", "since morning", "since 2020".',
    '"Kab se" wale time ke saath "since" lagta hai — "since Monday", "since 2020". "For Monday" galat hai.');
}

function detectCalques(text, out) {
  function cal(re, fixFn, label, why, hinglish) {
    eachMatch(re, text, function (m) {
      out.push(mkMistake('calques', label, m.index, m.index + m[0].length, text, why, hinglish, fixFn(m)));
    });
  }
  // "Myself Rahul" at sentence start -> "My name is Rahul"
  var mm = /^\s*[Mm]yself\s+([A-Z][a-z]+)/.exec(text);
  if (mm) {
    out.push(mkMistake('calques', 'Calque: "Myself Rahul" is not a sentence',
      mm.index, mm.index + mm[0].length, text,
      '"Myself" cannot start a sentence. Say "My name is Rahul" or "I am Rahul".',
      'Sentence "Myself" se shuru nahi hota. "My name is Rahul" ya "I am Rahul" bolo.',
      'My name is ' + mm[1]));
  }
  // "I am give exam" -> "I am taking an exam" (combined, beats the generic rule below)
  cal(/\b(am|is|are)\s+give\s+(an?\s+)?exams?\b/gi, function (m) { return m[1] + ' taking an exam'; },
    'Calque: "give exam" -> "take an exam"',
    'In English you "take" or "write" an exam; "give an exam" means you are the examiner.',
    'English me exam "diya" nahi jata, "take" kiya jata hai — "I take an exam". "Give exam" ka matlab examiner wala "dena" ho jata hai.');
  // generic "give exam" -> "take an exam"
  cal(/\bgive\s+(an?\s+)?exams?\b/gi, function () { return 'take an exam'; },
    'Calque: "give exam" -> "take an exam"',
    'In English you "take" or "write" an exam; "give an exam" means you are the examiner.',
    'English me exam "take" karte hain — "take an exam".');
  cal(/\bwhat\s+is\s+your\s+good\s+name\b/gi,
    function (m) { return (m[0].charAt(0) === 'W' ? 'What' : 'what') + ' is your name'; },
    'Calque: "What is your good name?"',
    'Native speakers just say "What is your name?" — "good name" is a direct Hindi translation ("shubh naam").',
    '"Shubh naam" ka seedha translation "good name" lagta hai, par native speaker sirf "What is your name?" kehte hain.');
  cal(/\b(am|is|are)\s+having\s+a\s+doubt\b/gi,
    function (m) { return ({ am: 'have', is: 'has', are: 'have' })[m[1].toLowerCase()] + ' a doubt'; },
    'Calque: "I am having a doubt" -> "I have a doubt"',
    '"Have" for possession is not used in continuous form. Say "I have a doubt", not "I am having a doubt".',
    '"Mere paas doubt hai" = "I have a doubt". "Having" wala continuous form yahan galat hai.');
  cal(/\b(am|is|are)\s+not\s+having\b/gi,
    function (m) { return m[1].toLowerCase() === 'is' ? 'does not have' : 'do not have'; },
    'Calque: "I am not having" -> "I do not have"',
    'For possession use "do not have": "I don\'t have a car", not "I am not having a car".',
    '"Mere paas nahi hai" = "I don\'t have". "I am not having" galat hai.');
  cal(/\bpassed\s+out\b/gi, function () { return 'graduated'; },
    'Calque: "passed out" (college)',
    'In Indian English "passed out" means finished college, but worldwide it means "fainted". Say "graduated".',
    'India me "pass out" ka matlab college complete karna hai, par bahar iska matlab "behosh ho jana" hai! "I graduated in 2020" bolo.');
  cal(/\bpass\s+out\b/gi, function () { return 'graduate'; },
    'Calque: "pass out" (college)',
    'In Indian English "pass out" means finished college, but worldwide it means "fainted". Say "graduate".',
    'College complete karne ke liye "graduate" shabd use karo — "pass out" ka matlab bahar "behosh hona" hota hai.');
  cal(/\brevert\s+back\b/gi, function () { return 'reply'; },
    'Calque: "revert back" -> "reply"',
    '"Revert" means "go back to an earlier state". For answering a mail, just say "reply" or "get back to you".',
    'Mail ka jawab dene ke liye "reply" kaho. "Revert" ka asli matlab "pehli halat me lautna" hota hai.');
  cal(/\bdo\s+the\s+needful\b/gi, function () { return 'do what is needed'; },
    'Calque: "do the needful"',
    '"Do the needful" is outdated Indian-office English. Say "please do what is needed" or "please take the necessary action".',
    '"Do the needful" purani office-English hai. "Please do what is needed" zyada natural lagta hai.');
  cal(/\bout\s+of\s+station\b/gi, function () { return 'out of town'; },
    'Calque: "out of station"',
    'Native speakers say "out of town" or "not in town" instead of "out of station".',
    '"Station se bahar" ka natural English "out of town" hai — "I am out of town this week."');
  cal(/\bpreponed\b/gi, function () { return 'moved to an earlier date'; },
    'Calque: "prepone" is Indian English only',
    '"Prepone" is not understood outside India. Say "moved to an earlier date" or "brought forward".',
    '"Prepone" sirf India me samajh aata hai. "The meeting was moved to an earlier date" bolo.');
  cal(/\bpreponing\b/gi, function () { return 'bringing forward'; },
    'Calque: "prepone" is Indian English only',
    '"Prepone" is not understood outside India. Say "bringing the meeting forward".',
    '"Prepone" sirf India me chalta hai — "bring forward" use karo.');
  cal(/\bprepone\b/gi, function () { return 'bring forward'; },
    'Calque: "prepone" is Indian English only',
    '"Prepone" is not understood outside India. Say "bring forward" or "move to an earlier date".',
    '"Prepone" sirf India me samajh aata hai — "bring forward" bolo.');
  cal(/\bcent\s+percent\b/gi, function () { return 'a hundred percent'; },
    'Calque: "cent percent" -> "a hundred percent"',
    'Say "a hundred percent" (or "100%"), not "cent percent".',
    '"Cent percent" nahi, "a hundred percent" bolo.');
  cal(/\bonly\s+only\b/gi, function () { return 'only'; },
    'Calque: repeated "only only"',
    'One "only" is enough — "only only" is a spoken Hindi-pattern repetition.',
    'Ek "only" hi kaafi hai — "only only" bolna Hindi pattern ka repeat hai.');
  cal(/\bmyself\s+(did|went|have|has|do|does|will|can|am)\b/gi,
    function (m) { return 'I ' + m[1]; },
    'Calque: "myself" used as subject',
    '"Myself" is reflexive — it cannot be the subject. Use "I": "I did it", not "myself did it".',
    '"Myself" subject nahi ban sakta. "Myself did" ki jagah "I did" bolo.');
}

function detectPronouns(text, out) {
  eachMatch(/\bme\s+and\s+my\s+friend\b/gi, text, function (m) {
    var fix = (m[0].charAt(0) === 'M' ? 'My friend and I' : 'my friend and I');
    out.push(mkMistake('pronouns', 'Pronoun case: "my friend and I"',
      m.index, m.index + m[0].length, text,
      'As a subject, say "my friend and I" (and put yourself last): "My friend and I went there."',
      'Subject ke roop me "me and my friend" nahi, "my friend and I" bolo — aur khud ko hamesha last me rakho.',
      fix));
  });
  eachMatch(/\bbetween\s+you\s+and\s+I\b/g, text, function (m) {
    out.push(mkMistake('pronouns', 'Pronoun case: "between you and me"',
      m.index, m.index + m[0].length, text,
      'After a preposition use the object form: "between you and me".',
      'Preposition (between, with, for) ke baad "me" aata hai — "between you and me".',
      'between you and me'));
  });
}

function detectWordOrder(text, out) {
  // "Where you are going?" -> "Where are you going?"
  eachMatch(/\b(where|when|what|why|how|who)\s+(you|he|she|it|they|we)\s+(are|is|do|does|did|will|can|could|have|has|was|were)\b/gi,
    text, function (m) {
      out.push(mkMistake('word-order', 'Word order: question word + helping verb + subject',
        m.index, m.index + m[0].length, text,
        'In questions the helping verb comes before the subject: "Where are you going?"',
        'Sawaal me helping verb subject se pehle aata hai — "Where are you going?", "Where you are going" nahi.',
        m[1] + ' ' + m[3] + ' ' + m[2]));
    });
  // adjective order: "a red big car" -> "a big red car" (size before colour)
  eachMatch(/\b(red|blue|green|black|white|yellow)\s+(big|small|large|little|long|short)\s+(car|house|dog|cat|box|bag|table|chair|room|tree)\b/gi,
    text, function (m) {
      out.push(mkMistake('word-order', 'Word order: size adjective before colour',
        m.index, m.index + m[0].length, text,
        'Adjective order: size comes before colour — "a big red car".',
        'Adjective ka order hota hai: pehle size, phir colour — "a big red car".',
        m[2] + ' ' + m[1] + ' ' + m[3]));
    });
}

function detectPlurals(text, out) {
  var uncount = {
    informations: 'information', furnitures: 'furniture', advices: 'advice',
    luggages: 'luggage', homeworks: 'homework', equipments: 'equipment', baggages: 'baggage'
  };
  // "many informations" -> "much information" (many + uncountable)
  eachMatch(/\bmany\s+(informations|furnitures|advices|luggages|homeworks|equipments|baggages)\b/gi, text, function (m) {
    var fix = 'much ' + uncount[m[1].toLowerCase()];
    out.push(mkMistake('plurals', 'Use "much" with uncountable nouns',
      m.index, m.index + m[0].length, text,
      '"' + fix + '" is uncountable: use "much", not "many", and no -s.',
      'Ye shabd uncountable hai — "many" nahi, "much" lagta hai, aur -s bhi nahi: "much information".',
      fix));
  });
  eachMatch(/\b(informations|furnitures|advices|luggages|homeworks|equipments|baggages)\b/gi, text, function (m) {
    var fix = uncount[m[1].toLowerCase()];
    if (m[1].charAt(0) === m[1].charAt(0).toUpperCase()) fix = cap(fix);
    out.push(mkMistake('plurals', 'Uncountable noun must not take -s',
      m.index, m.index + m[0].length, text,
      '"' + fix + '" is uncountable — it has no plural form. Say "much information", "a piece of advice".',
      'Ye shabd ginne wale nahi hain — inka plural nahi hota. "Informations" nahi, "information" bolo.',
      fix));
  });
  eachMatch(/\bmuch\s+(people|students|books|cars|friends|children|teachers)\b/gi, text, function (m) {
    out.push(mkMistake('plurals', 'Use "many" with countable nouns',
      m.index, m.index + m[0].length, text,
      '"Much" is for uncountable things ("much water"); "many" is for countable ones ("many people").',
      'Ginne wali cheezon (people, books) ke saath "many" lagta hai — "much" sirf uncountable ke saath.',
      'many ' + m[1]));
  });
  eachMatch(/\bless\s+(people|students|books|cars|friends|children)\b/gi, text, function (m) {
    out.push(mkMistake('plurals', 'Use "fewer" with countable nouns',
      m.index, m.index + m[0].length, text,
      '"Less" is for uncountable ("less sugar"); "fewer" is for countable ("fewer people").',
      'Ginne wali cheezon ke saath "fewer" lagta hai — "fewer people", "less people" nahi.',
      'fewer ' + m[1]));
  });
}

function detectMisc(text, out) {
  // double negatives: "I don't know nothing" -> "anything"
  var posMap = { nothing: 'anything', nobody: 'anybody', never: 'ever', none: 'any' };
  eachMatch(/\b(don't|doesn't|didn't|can't|cannot|won't|isn't|aren't|wasn't|weren't|haven't|hasn't|hadn't)\b([\w\s]{0,15}?)\b(nothing|nobody|never|none)\b/gi,
    text, function (m) {
      var sp = subSpan(m, 3);
      if (!sp) return;
      // guard: "never mind" is an idiom, not a double negative
      if (m[3].toLowerCase() === 'never' && /^mind\b/i.test(text.slice(sp[1]))) return;
      out.push(mkMistake('misc', 'Double negative',
        sp[0], sp[1], text,
        'Two negatives cancel out. Use one negative + a positive word: "I don\'t know anything".',
        'Do negative ek-dusre ko kaat dete hain. Ek negative + positive shabd use karo — "I don\'t know anything".',
        posMap[m[3].toLowerCase()]));
    });
  eachMatch(/\b(don't|doesn't|didn't|can't|won't)\s+have\s+no\s+(money|time|idea|problem|work|food|chance)\b/gi,
    text, function (m) {
      var sp = subSpan(m, 0);
      var fix = m[1] + ' have any ' + m[2];
      out.push(mkMistake('misc', 'Double negative',
        sp[0], sp[1], text,
        'Two negatives cancel out: "I don\'t have any money", not "I don\'t have no money".',
        '"I don\'t have no money" galat hai — "I don\'t have any money" bolo.',
        fix));
    });
  // "more better" -> "better"
  eachMatch(/\bmore\s+(better|faster|slower|bigger|smaller|easier|harder|cheaper|longer)\b/gi, text, function (m) {
    var fix = m[1];
    out.push(mkMistake('misc', 'Double comparative: "more better"',
      m.index, m.index + m[0].length, text,
      '"Better" is already comparative — "more" is extra. Just say "better".',
      '"Better" me comparison pehle se hai, "more" extra hai. Sirf "better" bolo.',
      fix));
  });
  // "most unique" -> "unique"
  eachMatch(/\bmost\s+(unique|perfect)\b/gi, text, function (m) {
    var fix = m[1];
    out.push(mkMistake('misc', '"most unique" — absolute adjectives take no degree',
      m.index, m.index + m[0].length, text,
      '"Unique" means one-of-a-kind; it cannot be "more" or "most". Just say "unique".',
      '"Unique" ka matlab hi "sabse alag" hai — isse zyada unique kuch nahi hota. Sirf "unique" bolo.',
      fix));
  });
  // lowercase "i" -> "I" (case-sensitive: a correct capital "I" must not be flagged)
  eachMatch(/\bi('m|'ve|'ll|'d)?\b/g, text, function (m) {
    var fix = 'I' + (m[1] || '');
    out.push(mkMistake('misc', 'Capitalize "I"',
      m.index, m.index + m[0].length, text,
      'The pronoun "I" is always capital, even mid-sentence.',
      'English me "I" hamesha capital hota hai — beech sentence me bhi.',
      fix));
  });
}

/* ------------------------- rule registry ------------------------------ */

var RULES = [
  { category: 'articles', detect: detectArticles },
  { category: 'sv-agreement', detect: detectSVAgreement },
  { category: 'tenses', detect: detectTenses },
  { category: 'prepositions', detect: detectPrepositions },
  { category: 'calques', detect: detectCalques, calque: true },
  { category: 'pronouns', detect: detectPronouns },
  { category: 'word-order', detect: detectWordOrder },
  { category: 'plurals', detect: detectPlurals },
  { category: 'misc', detect: detectMisc }
];

// Longest match wins when spans overlap; result sorted by start offset.
function dedupe(ms) {
  var sorted = ms.slice().sort(function (a, b) {
    return (b.span[1] - b.span[0]) - (a.span[1] - a.span[0]);
  });
  var kept = [];
  for (var i = 0; i < sorted.length; i++) {
    var s = sorted[i].span, clash = false;
    for (var j = 0; j < kept.length; j++) {
      var k = kept[j].span;
      if (s[0] < k[1] && k[0] < s[1]) { clash = true; break; }
    }
    if (!clash) kept.push(sorted[i]);
  }
  kept.sort(function (a, b) { return a.span[0] - b.span[0]; });
  return kept;
}

function applyFixes(text, mistakes) {
  var out = '', pos = 0, i, m, s, e;
  for (i = 0; i < mistakes.length; i++) {
    m = mistakes[i]; s = m.span[0]; e = m.span[1];
    if (s < pos) continue; // safety: skip anything overlapping
    out += text.slice(pos, s) + m.fix;
    pos = e;
  }
  out += text.slice(pos);
  out = out.replace(/\s{2,}/g, ' ').replace(/\s+([,.!?;:])/g, '$1').trim();
  out = out.replace(/^[a-z]/, function (c) { return c.toUpperCase(); });
  return out;
}

function analyzeFluency(text) {
  var fillers = 0, words = [];
  eachMatch(/\b(um+|uh+|hmm+|like|you know|actually|basically)\b/gi, text, function (m) {
    fillers++;
    words.push(m[0].toLowerCase());
  });
  var pauses = 0;
  eachMatch(/(\.\.\.|--|,,)/g, text, function () { pauses++; });
  return {
    fillers: fillers,
    pauseMarks: pauses,
    fillerWords: words,
    score: clamp(100 - 8 * fillers - 6 * pauses, 0, 100)
  };
}

/* --------------------------- public API ------------------------------- */

ai.analyzeSentence = function (text) {
  text = String(text == null ? '' : text);
  var out = [], i;
  for (i = 0; i < RULES.length; i++) RULES[i].detect(text, out);
  var mistakes = dedupe(out);
  var natural = mistakes.length ? applyFixes(text, mistakes) : text;
  for (i = 0; i < mistakes.length; i++) mistakes[i].natural = natural;
  return {
    original: text,
    mistakes: mistakes,
    fluency: analyzeFluency(text),
    accuracy: clamp(100 - 12 * mistakes.length, 5, 100)
  };
};

ai.correctSentence = function (text) {
  var a = ai.analyzeSentence(text);
  var fixed = a.mistakes.length ? applyFixes(a.original, a.mistakes) : a.original;
  return {
    corrected: fixed,
    natural: fixed,
    explanations: a.mistakes.map(function (m) {
      return { label: m.label, why: m.why, hinglish: m.hinglish, fix: m.fix, spanText: m.spanText };
    })
  };
};

// Calque-only matches (Hindi -> English word-for-word patterns).
ai.detectCalque = function (text) {
  text = String(text == null ? '' : text);
  var out = [], i;
  for (i = 0; i < RULES.length; i++) if (RULES[i].calque) RULES[i].detect(text, out);
  var ms = dedupe(out);
  var natural = ms.length ? applyFixes(text, ms) : text;
  for (i = 0; i < ms.length; i++) ms[i].natural = natural;
  return ms;
};

var GRAMMAR_TOPICS = {
  'articles': {
    simple: 'Use "a" before consonant sounds (a book, a university), "an" before vowel sounds (an apple, an hour), and "the" when both speaker and listener know which one (the book on the table). No article for general plurals: "Dogs are loyal."',
    hinglish: '"A/an" = koi ek (a teacher = koi teacher). "The" = woh khaas wala jiske baare me dono jaante hain (the teacher = woh wali teacher). Awaaz dekho, akshar nahi — "an hour" (h silent), "a university" (yu sound).',
    examples: ['I am a teacher. (koi ek teacher)', 'An apple a day keeps the doctor away.', 'The sun is bright today. (sab jaante hain kaun sa sun)'],
    trick: 'Pehle awaaz suno: vowel sound = an, consonant sound = a. "An hour, a house."'
  },
  'tenses': {
    simple: 'Present simple = habits/facts ("I go daily"). Present continuous = happening now ("I am going now"). Past simple = finished time ("I went yesterday"). Present perfect = past with present result ("I have eaten" = abhi pet bhara hai).',
    hinglish: 'Roz ki aadat = "I go". Abhi ho raha = "I am going". Kal khatam = "I went". "Have + third form" = kaam ho chuka, asar abhi hai ("I have finished my work").',
    examples: ['She plays cricket daily. (habit)', 'She is playing now. (abhi)', 'She played yesterday. (finished)', 'She has played already. (ho chuka)'],
    trick: '"Yesterday / last night" dikhe to simple past. "Already / just / yet" dikhe to have + third form.'
  },
  'prepositions': {
    simple: 'Time: at (clock time), on (days/dates), in (months/years/parts of day). Common pairs: married to, discuss (no about), listen to, different from, depend on, good at.',
    hinglish: '"At 5 o\'clock", "on Monday", "in June / in the morning". Kuch pairs rat lo: married TO, discuss (about nahi!), listen TO, different FROM, enter (into nahi).',
    examples: ['The meeting is at 5 pm on Monday.', 'She is married to him.', 'Let us discuss the plan.'],
    trick: '"Discuss about", "married with", "enter into" — ye teeno galat hain. Inhe dekhte hi kaat do.'
  },
  'sv-agreement': {
    simple: 'The verb must match the subject. He/she/it + verb-s ("he goes"). I/you/we/they + base verb ("they go"). "I" takes "am"; he/she/it takes "is" and "doesn\'t".',
    hinglish: 'He/she/it ke saath verb me "s" lagao — "he goes, she has". I/you/we/they ke saath simple verb — "they go". "I is" nahi, "I am". "She don\'t" nahi, "she doesn\'t".',
    examples: ['He goes to school daily.', 'They go to school daily.', 'She doesn\'t like coffee.'],
    trick: 'Subject me "s" hai (he/she/it singular nahi... yaad rakho ulta hai): verb me "s" = he/she/it. Dono me ek saath "s" nahi aata.'
  },
  'conditionals': {
    simple: 'Zero: "If you heat water, it boils." (fact). First: "If it rains, I will stay home." (real future). Second: "If I were rich, I would travel." (imaginary). Third: "If I had studied, I would have passed." (past regret).',
    hinglish: 'Sach = zero ("If you heat ice, it melts"). Sambhav future = first ("If it rains, I will stay"). Kalpana = second ("If I were rich..."). Pachtawa = third ("If I had studied, I would have passed").',
    examples: ['If you heat water, it boils.', 'If it rains, we will stay home.', 'If I were you, I would join.', 'If I had left early, I would have caught the bus.'],
    trick: '"If I was" nahi — imaginary wale me hamesha "If I were".'
  },
  'modals': {
    simple: 'Can = ability, could = past ability/polite request, may = permission/possibility, might = weaker possibility, must = strong necessity, should = advice. Modal + base verb, no -s, no "to": "She can swim."',
    hinglish: 'Can = sakta hai, could = sakta tha / polite request ("Could you help?"), should = chahiye/salah, must = zaroor karna hai. Modal ke baad hamesha simple verb — "He can goes" galat, "He can go" sahi.',
    examples: ['I can swim.', 'You should rest.', 'We must leave now.', 'It might rain.'],
    trick: 'Modal ke baad verb kabhi nahi badalta — can go, could go, should go, must go.'
  },
  'voice': {
    simple: 'Active: "She wrote a letter." Passive: "A letter was written by her." Form: be-verb + past participle ("is made", "was broken"). Use passive when the doer is unknown or unimportant.',
    hinglish: 'Active = kaam karne wala pehle ("Ram ne khana banaya" = "Ram cooked food"). Passive = cheez pehle ("Khana banaya gaya" = "Food was cooked"). Formula: is/was + third form.',
    examples: ['They built this school. (active)', 'This school was built in 1990. (passive)', 'The work is done.'],
    trick: '"By" ke baad karne wala aata hai — "The cake was baked by my mother."'
  },
  'reported-speech': {
    simple: 'Direct: She said, "I am tired." Reported: She said (that) she was tired. Backshift: present -> past ("am" -> "was"), past -> past perfect ("went" -> "had gone"), will -> would, can -> could.',
    hinglish: 'Dusre ki baat sunana = reported speech. Tense ek step peeche: "I am tired" -> "she was tired". "I will come" -> "she would come". "Said" ke baad comma-quote hat jata hai.',
    examples: ['"I am busy," he said. -> He said he was busy.', '"I will help," she said. -> She said she would help.'],
    trick: 'Reporting verb past me ("said") hai to andar ka tense bhi past me shift karo — bas ek kadam peeche.'
  }
};

ai.explainGrammar = function (topicKey) {
  var t = GRAMMAR_TOPICS[String(topicKey || '').toLowerCase()];
  if (!t) {
    return {
      simple: 'Unknown topic. Try: articles, tenses, prepositions, sv-agreement, conditionals, modals, voice, reported-speech.',
      hinglish: 'Ye topic nahi mila. Inme se chuno: articles, tenses, prepositions, sv-agreement, conditionals, modals, voice, reported-speech.',
      examples: [],
      trick: ''
    };
  }
  return { simple: t.simple, hinglish: t.hinglish, examples: t.examples.slice(), trick: t.trick };
};

if (typeof module !== 'undefined' && module.exports) module.exports = EC.ai;

})();
