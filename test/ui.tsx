import { createRequestId } from '../src/id';
// Isolated UI harness. Vite's production entry does not import or ship this file.
// All API traffic is handled in memory; this does not access or bypass accounts.
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../src/App';
import '../src/style.css';
import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/nunito/latin-900.css';
import type { State } from '../src/types';
const data: State = {
  user: {id:'test-admin',name:'Denny',username:'ui-example',role:'admin',outfit:'starter',xp:3360,stars:240,level:7,levelXp:360,nextLevelXp:500},
  household: {id:'ui-house',name:'Die Chaoscrew',goalTitle:'Gemeinsam zum Filmabend',weekGoal:24,weekCount:18,timezone:'Europe/Berlin'},
  tasks: [
    {id:'t1',title:'Staubsaugen',room:'Wohnen',icon:'vacuum',minutes:15,xp:60,stars:20,cadence:'daily',occurrenceKey:'ui-test',completion:null},
    {id:'t2',title:'Spülmaschine einräumen',room:'Küche',icon:'dishes',minutes:8,xp:40,stars:15,cadence:'daily',occurrenceKey:'ui-test',completion:null},
    {id:'t3',title:'Wäsche aufhängen',room:'Haushalt',icon:'laundry',minutes:10,xp:50,stars:15,cadence:'daily',occurrenceKey:'ui-test',completion:null},
    {id:'t4',title:'Pflanzen gießen',room:'Wohnen',icon:'plant',minutes:5,xp:25,stars:10,cadence:'weekly',occurrenceKey:'ui-test',completion:null},
  ],
  members: [], rewards:[{id:'r1',title:'Film aussuchen',cost:100,icon:'film'},{id:'r2',title:'Eis essen gehen',cost:180,icon:'ice'},{id:'r3',title:'Wunschessen',cost:120,icon:'meal'}],
  redemptions:[],outfits:[{id:'starter',title:'Starter',cost:0,level:1,unlocked:true},{id:'comet',title:'Komet',cost:300,level:1,unlocked:false},{id:'sun',title:'Sonnenheld',cost:0,level:8,unlocked:false}],recent:[],completedCount:18,
};
data.members=[{...data.user,weekCount:6},...['Mia','Ben','Lina'].map((name,i)=>({...data.user,id:'ui-'+i,name,role:'member' as const,weekCount:i===0?5:4}))];
const fetchReal=window.fetch.bind(window);
window.fetch=async (input, init)=>{
  const url=String(input); if(!url.startsWith('/api/')) return fetchReal(input,init);
  const route=url.slice(4), body=init?.body?JSON.parse(String(init.body)):{};
  let result:any={ok:true};
  if(route==='/bootstrap') result={needsSetup:false};
  else if(route==='/state') result=data;
  else if(route.match(/^\/tasks\/[^/]+\/complete$/)){
    const task=data.tasks.find(t=>t.id===route.split('/')[2])!;
    if(task.completion)return Response.json({error:'Diese Mission wurde schon erledigt.'},{status:409});
    task.completion={user_name:data.user.name,created_at:new Date().toISOString()};
    data.user.stars+=task.stars; data.user.xp+=task.xp; data.user.levelXp=data.user.xp%500;
    data.user.level=Math.floor(data.user.xp/500)+1;data.household.weekCount++;data.completedCount++;
    data.members[0]={...data.user,weekCount:data.members[0].weekCount+1};
    data.recent.unshift({id:createRequestId(),title:task.title,name:data.user.name,createdAt:new Date().toISOString()});
    result={title:task.title,xp:task.xp,stars:task.stars,user:data.user};
  } else if(route==='/tasks' && init?.method==='POST') data.tasks.push({...body,id:createRequestId(),occurrenceKey:'ui-test',completion:null});
  else if(route.match(/^\/tasks\/[^/]+$/) && init?.method==='PATCH') Object.assign(data.tasks.find(t=>t.id===route.split('/')[2])!,body);
  else if(route.match(/^\/tasks\/[^/]+$/) && init?.method==='DELETE') data.tasks=data.tasks.filter(t=>t.id!==route.split('/')[2]);
  else if(route==='/household') Object.assign(data.household,body);
  else if(route==='/rewards'&&init?.method==='POST') data.rewards.push({...body,id:createRequestId()});
  else if(route.match(/^\/rewards\/[^/]+\/redeem$/)){
    const reward=data.rewards.find(r=>r.id===route.split('/')[2])!;
    if(data.user.stars<reward.cost)return Response.json({error:'Dir fehlen noch Sterne.'},{status:409});
    data.user.stars-=reward.cost;data.redemptions.unshift({id:createRequestId(),title:reward.title,cost:reward.cost,user_name:data.user.name,created_at:new Date().toISOString(),fulfilled_at:null});
  }else if(route.match(/^\/redemptions\/[^/]+\/fulfill$/))data.redemptions.find(r=>r.id===route.split('/')[2])!.fulfilled_at=new Date().toISOString();
  else if(route.startsWith('/outfits/')){
    const outfit=data.outfits.find(o=>o.id===route.split('/')[2])!;
    if(!outfit.unlocked){data.user.stars-=outfit.cost;outfit.unlocked=true;}
    data.user.outfit=outfit.id;
  }else if(route==='/invitations')result={token:'ui-test-only-no-valid-invitation'};
  return Response.json(result);
};
class FixtureEvents { addEventListener(){} close(){} onerror=null; }
window.EventSource=FixtureEvents as unknown as typeof EventSource;
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
