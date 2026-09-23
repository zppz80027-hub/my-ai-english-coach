window.EC=window.EC||{};EC.data=EC.data||{};
EC.data.interview={
hr:[
{q:'Tell me about yourself.',tip:'2 minute me: padhai, skills, ek project, aur goal. Ratta hua na lage.'},
{q:'Why should we hire you?',tip:'Apni 2-3 skills ko company ke kaam se jodo. "I am hardworking" se aage badho.'},
{q:'What are your strengths and weaknesses?',tip:'Strength: real example do. Weakness: aisi batao jise sudhar rahe ho.'},
{q:'Where do you see yourself in 5 years?',tip:'Company me grow karne ki baat karo, "apna business" mat kaho.'},
{q:'Why do you want to join our company?',tip:'Company ke baare me 2 line research karke aao — product, tech stack.'},
{q:'Are you comfortable with night shifts / relocation?',tip:'Imaandari se jawab do, par flexible tone rakho.'},
{q:'What salary do you expect?',tip:'Fresher ho to range do: "As per company standards, around X-Y LPA".'},
{q:'Do you have any questions for us?',tip:'Hamesha 1-2 sawal poochho: team size, tech stack, growth. "No" mat kaho.'},
{q:'How do you handle pressure?',tip:'Ek real example do: deadline, exam, project — STAR me batao.'},
{q:'Tell me about a challenge you faced.',tip:'Chhota sachcha kissa chunno, aur seekh (learning) par khatam karo.'}
],
technical:[
{q:'What is the difference between var, let and const in JavaScript?',tip:'Scope aur re-assign: var=function scope, let/const=block scope, const=reassign nahi.'},
{q:'Explain how the useState hook works in React.',tip:'State variable + setter; setter call par re-render. Example: const [count, setCount] = useState(0).'},
{q:'What is the virtual DOM and why is React fast?',tip:'React memory me copy banata hai, sirf badle hue hisse ko real DOM me update karta hai.'},
{q:'Difference between props and state?',tip:'Props = parent se aata hai, read-only. State = component ka apna data, badal sakta hai.'},
{q:'What is a REST API? Explain GET vs POST.',tip:'GET = data lena, POST = data bhejna. Status codes 200/404/500 yaad rakho.'},
{q:'How do you fetch data in React? Explain useEffect.',tip:'useEffect me fetch call; empty dependency array = sirf ek baar chalega.'},
{q:'What is the difference between SQL and NoSQL databases?',tip:'SQL = table wali (MySQL), NoSQL = flexible (MongoDB). Project me kaunsi use ki, woh batao.'},
{q:'Explain your final year / major project: architecture and your role.',tip:'Pehle problem, phir tech stack, phir TUMHARA contribution, phir result. 2 minute me.'}
],
behavioral:[
{q:'Tell me about a time you worked in a team.',tip:'Team project ya college event ka example lo.',starHint:'S: hackathon team. T: 48 ghante me app banana tha. A: maine frontend sambhala, roz sync kiya. R: hum top 10 me aaye.'},
{q:'Describe a situation where you missed a deadline.',tip:'Galti maano, par sudhar par focus karo.',starHint:'S: assignment late hua. T: time manage karna tha. A: agle project me daily checklist banayi. R: uske baad kabhi late nahi hua.'},
{q:'Tell me about a conflict with a teammate.',tip:'Kisi ka naam kharab mat karo; solution par baat karo.',starHint:'S: design par matbhed. T: dono ko manana tha. A: dono options ka demo banaya. R: behtar wala chuna gaya.'},
{q:'Give an example of when you learned something quickly.',tip:'Nayi technology seekhne ka kissa best hai.',starHint:'S: React nahi aata tha. T: 2 hafte me project. A: roz 3 ghante docs + mini project. R: project time par complete.'},
{q:'Tell me about a time you failed.',tip:'Chhoti failure + badi learning = best answer.',starHint:'S: pehla interview clear nahi hua. T: communication sudharni thi. A: roz English speaking practice. R: agle 2 interviews clear.'},
{q:'Describe a time you took initiative.',tip:'Bina kahe jo kaam kiya, wahi initiative hai.',starHint:'S: team ka code messy tha. T: kisi ne nahi kaha par sudharna tha. A: maine docs aur README likhe. R: onboarding aasaan ho gaya.'},
{q:'How do you prioritize when everything is urgent?',tip:'Ek simple framework batao: urgent vs important.',starHint:'S: exams + project ek saath. T: dono time par. A: kaam ko tukdon me baanta, pehle deadline wala. R: dono complete.'},
{q:'Tell me about feedback you received and acted on.',tip:'Feedback lena = growth mindset dikhata hai.',starHint:'S: mentor ne kaha code me comments kam hain. T: code readable banana tha. A: har function me comments add kiye. R: code review me tareef mili.'}
],
internship:[
{q:'Why do you want this internship?',tip:'Seekhne ki ichha + company ke kaam me dilchaspi dikhao.'},
{q:'What skills can you bring to our team?',tip:'Jo aata hai wahi kaho: HTML, CSS, JS, React basics — jhooth mat bolo.'},
{q:'Have you built any projects? Walk me through one.',tip:'Ek project gehrai se taiyaar karo: kya banaya, kaise, kya seekha.'},
{q:'How do you learn a new technology?',tip:'Apna process batao: docs, YouTube, mini project, phir real project.'},
{q:'Are you comfortable working with a mentor?',tip:'Haan kaho + example do jab tumne kisi se seekha.'},
{q:'What do you expect to learn in these 3 months?',tip:'Real-world workflow: Git, code review, teamwork — sirf "coding" mat kaho.'}
],
viva:[
{q:'Explain the difference between frontend and backend.',tip:'Frontend = user dekhta hai (React). Backend = data sambhalta hai (Node, database).'},
{q:'What is an API and why do we use it?',tip:'Do software ke beech baat-cheet ka rasta. Example: weather app ka data API se aata hai.'},
{q:'What is Git and why is version control important?',tip:'Har badlaav ka hisab; galti ho to wapas ja sakte ho. Commit, push, pull samjhao.'},
{q:'Explain the project architecture of your major project.',tip:'Diagram banao: user → frontend → API → database. Har hisse ka kaam ek line me.'},
{q:'What challenges did you face in your project and how did you solve them?',tip:'Ek technical problem chunno: bug, slow API, design issue — aur solution step by step.'},
{q:'What is the difference between a library and a framework?',tip:'Library = tum control karte ho (tum bulate ho). Framework = woh tumhe control karta hai (React me component structure).'}
]
};
