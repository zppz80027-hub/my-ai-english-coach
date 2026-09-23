// Self-test for the English Coach AI engine (run: node selftest.js)
var ai = require('/home/hatch/workspace/english-coach/js/ai/grammar.js');
globalThis.EC = { ai: ai }; // make engine.js reuse the same EC.ai object
var eng = require('/home/hatch/workspace/english-coach/js/ai/engine.js');

var pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' :: ' + extra : '')); }
}
function fixesFor(a) { return a.mistakes.map(function (m) { return m.spanText + '->' + m.fix; }).join(' | '); }

console.log('== grammar.js: 10 sample sentences ==');
var tests = [
  ['He go to school daily', ['he goes']],
  ['I am having a doubt in this chapter', ['I have a doubt']],
  ['Myself Rahul and I am give exam tomorrow', ['My name is Rahul', 'am taking an exam']],
  ['She don\'t like coffee', ['doesn\'t']],
  ['I have eat my lunch', ['have eaten']],
  ['He is a honest man', ['an honest']],
  ['I want to discuss about the plan', ['discuss the plan']],
  ['Where you are going?', ['Where are you going?']],
  ['I don\'t know nothing about it', ['anything']],
  ['i am married with her since 5 years', ['I am married to her for 5 years']]
];
tests.forEach(function (t, i) {
  var a = ai.analyzeSentence(t[0]);
  var nat = '';
  a.mistakes.forEach(function (m) { nat = m.natural; });
  var natLow = nat.toLowerCase();
  var ok = t[1].every(function (frag) { return natLow.indexOf(frag.toLowerCase()) >= 0; });
  check('S' + (i + 1) + ' "' + t[0] + '"', ok,
    'natural="' + nat + '" fixes=[' + fixesFor(a) + ']');
  // span sanity: spanText must equal original slice
  var spanOk = a.mistakes.every(function (m) {
    return a.original.slice(m.span[0], m.span[1]) === m.spanText;
  });
  check('S' + (i + 1) + ' spans valid', spanOk);
});

console.log('== grammar.js: extra category checks ==');
var extra = [
  ['I am teacher', 'I am a teacher'],
  ['They goes to market', 'They go to market'],
  ['I did went there', 'I went there'],
  ['He has went home', 'He has gone home'],
  ['They will goes tomorrow', 'They will go tomorrow'],
  ['We need to revert back soon', 'We need to reply soon'],
  ['I passed out in 2020', 'I graduated in 2020'],
  ['What is your good name?', 'What is your name?'],
  ['She is more better than me', 'She is better than me'],
  ['This is most unique', 'This is unique'],
  ['I have many informations', 'much information'],
  ['There are less people here', 'There are fewer people here'],
  ['between you and I', 'between you and me'],
  ['me and my friend goes there', 'My friend and I go there'],
  ['I play the cricket daily', 'I play cricket daily'],
  ['a apple', 'an apple'],
  ['an university', 'a university']
];
extra.forEach(function (t, i) {
  var nat = ai.correctSentence(t[0]).natural;
  check('X' + (i + 1) + ' "' + t[0] + '"', nat.toLowerCase().indexOf(t[1].toLowerCase()) >= 0, 'got "' + nat + '"');
});

console.log('== correctSentence / detectCalque / explainGrammar / fluency ==');
var cs = ai.correctSentence('He go to school daily');
check('correctSentence', cs.corrected === 'He goes to school daily' && cs.explanations.length === 1,
  JSON.stringify(cs));
var cal = ai.detectCalque('Please do the needful, I am out of station');
check('detectCalque', cal.length === 2, JSON.stringify(cal.map(function (m) { return m.fix; })));
var eg = ai.explainGrammar('tenses');
check('explainGrammar tenses', !!(eg.simple && eg.hinglish && eg.examples.length >= 3 && eg.trick));
var allKeys = ['articles', 'tenses', 'prepositions', 'sv-agreement', 'conditionals', 'modals', 'voice', 'reported-speech'];
check('explainGrammar all keys', allKeys.every(function (k) { var e = ai.explainGrammar(k); return e.simple && e.hinglish && e.examples.length && e.trick; }));
var fl = ai.analyzeSentence('Um, I think, uh, like, you know... it is, hmm, basically fine');
check('fluency', fl.fluency.fillers >= 5 && fl.fluency.pauseMarks >= 1 && fl.fluency.score < 100,
  JSON.stringify(fl.fluency));
var clean = ai.analyzeSentence('She goes to school daily.');
check('clean sentence', clean.mistakes.length === 0 && clean.accuracy === 100, JSON.stringify(clean.mistakes.map(function (m) { return m.label; })));

console.log('== engine.js ==');
var kinds = ['tense-mcq', 'article-cloze', 'preposition-cloze', 'sentence-scramble', 'translate-hin-eng', 'vocab-context', 'minimal-pair', 'error-spot'];
var kindsOk = kinds.every(function (k) {
  var e = eng.generateExercise(k);
  return e.kind === k && e.prompt && e.answer !== undefined && e.explainHinglish && ('hint' in e);
});
check('generateExercise all 8 kinds', kindsOk);
var ex = eng.generateExercise('tense-mcq');
check('tense-mcq options contain answer', ex.options.indexOf(ex.answer) >= 0, JSON.stringify(ex));

var conv = eng.generateConversation('normal', 'college', 'senior', []);
check('conversation normal', conv.reply.length > 0 && conv.followUp.length > 0);
var strict = eng.generateConversation('strict', 'interview', 'hr-manager', [{ role: 'user', text: 'He go to office daily' }]);
check('conversation strict corrects', strict.correction && /goes/.test(strict.correction.fix), JSON.stringify(strict.correction));
var shadow = eng.generateConversation('shadowing', 'travel', null, []);
check('conversation shadowing', /repeat/i.test(shadow.reply) && /word for word/i.test(shadow.followUp));
var debate = eng.generateConversation('debate', 'movies', null, []);
check('conversation debate', debate.reply.length > 20);
var role = eng.generateConversation('roleplay', 'interview', 'hr-manager', []);
check('conversation roleplay', role.reply.length > 10);

var ev = eng.evaluateAnswer('Tell me about a challenge you faced', 'Um, in my college, uh, me and my friend had a project and we completed it.', []);
check('evaluateAnswer', ev.scores.grammar < 100 && ev.feedback.length >= 3 && ev.better.length > 20 && ev.star.missing.length === 4,
  JSON.stringify(ev.scores));
var sr = eng.scoreRepeat('I go to school daily', 'I go to school daily');
check('scoreRepeat exact', sr.percent === 100 && sr.total === 5, JSON.stringify(sr));
var sr2 = eng.scoreRepeat('I go to school daily', 'I go school');
check('scoreRepeat partial', sr2.percent === 60 && sr2.missedWords.indexOf('to') >= 0 && sr2.missedWords.indexOf('daily') >= 0, JSON.stringify(sr2));

// store-backed weekly report
globalThis.EC.store = {
  sessions: [
    { date: new Date(Date.now() - 1 * 864e5).toISOString(), skill: 'grammar', score: 80 },
    { date: new Date(Date.now() - 2 * 864e5).toISOString(), skill: 'grammar', score: 60 },
    { date: new Date(Date.now() - 9 * 864e5).toISOString(), skill: 'grammar', score: 50 },
    { date: new Date(Date.now() - 1 * 864e5).toISOString(), skill: 'vocabulary', score: 55 },
    { date: new Date(Date.now() - 9 * 864e5).toISOString(), skill: 'vocabulary', score: 50 }
  ]
};
var rep = eng.weeklyReport();
check('weeklyReport', rep.weakest === 'vocabulary' && /vocabulary/.test(rep.text) && rep.improvements.length >= 1,
  JSON.stringify({ weakest: rep.weakest, imp: rep.improvements }));
var rec = eng.recommendFocus();
check('recommendFocus', rec.weakest === 'vocabulary' && rec.mix.length === 3 && rec.tip.length > 10,
  JSON.stringify(rec));
delete globalThis.EC.store;
var repEmpty = eng.weeklyReport();
check('weeklyReport no store', /practice data nahi hai/.test(repEmpty.text));

console.log('\nRESULT: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
