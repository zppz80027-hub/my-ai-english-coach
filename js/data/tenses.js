window.EC=window.EC||{};EC.data=EC.data||{};
EC.data.tenses=[
{id:'present-simple',name:'Simple Present',hinglish:'roz hone wali aadat ya sach',formula:'Subject + V1 (+ s/es)',helping:'do/does',when:'habits, facts, schedules',signals:['daily','always','usually'],ex:{pos:'I play cricket daily.',neg:'I do not play cricket.',q:'Do you play cricket?'},mistakes:['He go → He goes','She watch TV → She watches TV'],trick:'HABIT = Simple Present',quiz:[
{q:'Choose the correct sentence:',options:['She go to college daily.','She goes to college daily.','She going to college daily.','She gone to college daily.'],a:1,why:'he/she/it ke saath V1 + s/es lagta hai.'},
{q:'Which sentence is Simple Present?',options:['I am playing.','I have played.','I play.','I played.'],a:2,why:'I play = Subject + V1, yahi Simple Present hai.'}
]},
{id:'present-continuous',name:'Present Continuous',hinglish:'abhi ho raha kaam',formula:'Subject + is/am/are + V1-ing',helping:'is/am/are',when:'happening right now, temporary actions',signals:['now','right now','at the moment'],ex:{pos:'I am learning English now.',neg:'She is not sleeping.',q:'Are they coming?'},mistakes:['I am play → I am playing','She is go → She is going'],trick:'NOW = is/am/are + ing',quiz:[
{q:'She ___ TV right now.',options:['watch','watches','is watching','watched'],a:2,why:'right now = Present Continuous: is + V-ing.'},
{q:'Choose the correct negative:',options:['I am not go.','I do not going.','I am not going.','I not going.'],a:2,why:'am + not + V-ing hota hai.'}
]},
{id:'present-perfect',name:'Present Perfect',hinglish:'kaam ho gaya, asar abhi hai',formula:'Subject + has/have + V3',helping:'has/have',when:'finished action with a present result',signals:['already','just','yet','ever','never'],ex:{pos:'I have finished my work.',neg:'She has not eaten yet.',q:'Have you seen this movie?'},mistakes:['I have went → I have gone','She have done → She has done'],trick:'HAVE + V3 = Present Perfect',quiz:[
{q:'I ___ my homework already.',options:['finish','finished','have finished','finishing'],a:2,why:'already + have + V3 lagta hai.'},
{q:'Choose the correct question:',options:['Did you ever been to Delhi?','Have you ever been to Delhi?','You have ever been to Delhi?','Are you ever been to Delhi?'],a:1,why:'Have + subject + V3 = Present Perfect question.'}
]},
{id:'present-perfect-continuous',name:'Present Perfect Continuous',hinglish:'pehle se chal raha kaam, abhi bhi jaari',formula:'Subject + has/have + been + V1-ing',helping:'has/have been',when:'action started in past, still going on',signals:['since','for','all day'],ex:{pos:'I have been studying since morning.',neg:'He has not been sleeping well.',q:'Have you been waiting long?'},mistakes:['I am studying since morning → I have been studying since morning','She has been worked → She has been working'],trick:'SINCE/FOR + ing = Perfect Continuous',quiz:[
{q:'She ___ here since 2020.',options:['works','is working','has been working','worked'],a:2,why:'since + lamba samay + abhi bhi jaari = has/have been + V-ing.'},
{q:'Choose the correct sentence:',options:['I am here for two hours.','I have been here for two hours.','I was here for two hours now.','I have here for two hours.'],a:1,why:'for + duration with ongoing action = Present Perfect Continuous.'}
]},
{id:'past-simple',name:'Simple Past',hinglish:'beete hue kal ka kaam',formula:'Subject + V2',helping:'did',when:'finished past actions',signals:['yesterday','last night','ago'],ex:{pos:'I watched a movie yesterday.',neg:'She did not come.',q:'Did you enjoy the trip?'},mistakes:['I did not went → I did not go','He buyed → He bought'],trick:'YESTERDAY = V2',quiz:[
{q:'He ___ to Mumbai last week.',options:['go','goes','went','gone'],a:2,why:'last week = Past Simple = V2 (went).'},
{q:'Choose the correct negative:',options:['She did not went.','She did not go.','She does not went.','She not went.'],a:1,why:'did + not + V1 (did me hi past hai, isliye go).'}
]},
{id:'past-continuous',name:'Past Continuous',hinglish:'beete kal me chal raha kaam',formula:'Subject + was/were + V1-ing',helping:'was/were',when:'action in progress at a past time, or interrupted',signals:['while','when','at 5 PM yesterday'],ex:{pos:'I was sleeping at 10 PM.',neg:'They were not playing.',q:'Were you watching TV?'},mistakes:['I was play → I was playing','They was running → They were running'],trick:'WAS/WERE + ing = Past Continuous',quiz:[
{q:'I ___ TV when you called.',options:['watch','was watching','am watching','watched'],a:1,why:'past me chal rahi action = was/were + V-ing.'},
{q:'They ___ football at 5 PM yesterday.',options:['play','are playing','were playing','played'],a:2,why:'at 5 PM yesterday = exact past moment, chal rahi action = were + V-ing.'}
]},
{id:'past-perfect',name:'Past Perfect',hinglish:'do beete kaamon me pehle wala',formula:'Subject + had + V3',helping:'had',when:'the earlier of two past actions',signals:['before','after','already','by the time'],ex:{pos:'I had finished dinner before he came.',neg:'She had not seen the movie.',q:'Had you met him before?'},mistakes:['I had went → I had gone','She had ate → She had eaten'],trick:'HAD + V3 = pehle wala past',quiz:[
{q:'When I reached, the train ___.',options:['already left','had already left','has already left','already leaves'],a:1,why:'pehle hui past action = had + V3.'},
{q:'She was hungry because she ___ lunch.',options:['had not ate','had not eaten','did not eaten','has not eaten'],a:1,why:'had + not + V3 hota hai.'}
]},
{id:'past-perfect-continuous',name:'Past Perfect Continuous',hinglish:'past me lambi chali action, phir kuch hua',formula:'Subject + had + been + V1-ing',helping:'had been',when:'long action before another past moment',signals:['for','since','all day (in past)'],ex:{pos:'I had been waiting for two hours.',neg:'He had not been feeling well.',q:'Had you been working there long?'},mistakes:['I was waiting since morning → I had been waiting since morning','He had been worked → He had been working'],trick:'HAD BEEN + ing = past me lamba kaam',quiz:[
{q:'He was tired because he ___ all day.',options:['had been working','has been working','was work','worked'],a:0,why:'past me lambi action ka result = had been + V-ing.'},
{q:'They ___ for an hour when the bus came.',options:['have been waiting','had been waiting','are waiting','wait'],a:1,why:'bus aane se pehle ka wait = had been + V-ing.'}
]},
{id:'future-simple',name:'Simple Future',hinglish:'aane wale kal ka waada ya faisla',formula:'Subject + will + V1',helping:'will/shall',when:'promises, quick decisions, predictions',signals:['tomorrow','soon','next week'],ex:{pos:'I will help you.',neg:'She will not come.',q:'Will you join us?'},mistakes:['I will to go → I will go','He will goes → He will go'],trick:'WILL + V1 = Future Simple',quiz:[
{q:'I ___ you tomorrow.',options:['call','will call','called','calling'],a:1,why:'tomorrow = future = will + V1.'},
{q:'Choose the correct question:',options:['Will you to come?','You will come?','Will you come?','Do you will come?'],a:2,why:'Will + subject + V1 hota hai.'}
]},
{id:'future-continuous',name:'Future Continuous',hinglish:'future me chal raha hoga kaam',formula:'Subject + will + be + V1-ing',helping:'will be',when:'action in progress at a future time',signals:['at 5 PM tomorrow','this time next week'],ex:{pos:'I will be travelling at this time tomorrow.',neg:'She will not be sleeping.',q:'Will you be coming?'},mistakes:['I will be go → I will be going','They will be play → They will be playing'],trick:'WILL BE + ing = future me chal raha kaam',quiz:[
{q:'This time tomorrow, she ___ to Delhi.',options:['will fly','will be flying','flies','flew'],a:1,why:'this time tomorrow = exact future moment, chal rahi action = will be + V-ing.'},
{q:'Do not call at 9 PM, we ___ dinner then.',options:['will be having','will have','have','are have'],a:0,why:'then = exact future time, chal rahi action = will be + V-ing.'}
]},
{id:'future-perfect',name:'Future Perfect',hinglish:'future ke ek time tak kaam poora',formula:'Subject + will + have + V3',helping:'will have',when:'action finished before a future time',signals:['by tomorrow','by 2026','already (future)'],ex:{pos:'I will have finished by 6 PM.',neg:'She will not have eaten.',q:'Will you have completed it?'},mistakes:['I will have finish → I will have finished','He will has gone → He will have gone'],trick:'WILL HAVE + V3 = future se pehle khatam',quiz:[
{q:'By next year, I ___ my degree.',options:['will complete','will have completed','complete','completed'],a:1,why:'by + future time = will have + V3.'},
{q:'She ___ the project by Friday.',options:['will have finished','will finished','has finished','finished'],a:0,why:'by Friday (future) = will have + V3.'}
]},
{id:'future-perfect-continuous',name:'Future Perfect Continuous',hinglish:'future tak chalti rahegi lambi action',formula:'Subject + will + have + been + V1-ing',helping:'will have been',when:'long action continuing until a future time',signals:['for','by','since (with future)'],ex:{pos:'I will have been working here for 5 years.',neg:'He will not have been sleeping.',q:'Will you have been waiting long?'},mistakes:['I will be working since 2020 → I will have been working since 2020','She will have been worked → She will have been working'],trick:'WILL HAVE BEEN + ing = future tak chalti action',quiz:[
{q:'By December, she ___ here for ten years.',options:['will have been working','will be working','works','worked'],a:0,why:'by + future time + duration = will have been + V-ing.'},
{q:'Next month, I ___ English for one year.',options:['will have been learning','will learn','learn','learned'],a:0,why:'future me poora hone wala duration = will have been + V-ing.'}
]}
];
