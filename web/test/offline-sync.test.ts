import test from 'node:test';
import assert from 'node:assert/strict';
import {ApiError} from '../src/api.ts';
import {replayQueuedCompletions,submitQueuedCompletion} from '../src/offline-sync.ts';
import {cacheSnapshot,intentFor} from '../shared/offline.ts';
import {newHousehold,view} from '../server/domain.ts';
import type {CompletionIntent} from '../shared/offline.ts';
import type {State} from '../src/types.ts';

function fixture(){
 const now=new Date('2026-10-30T14:00:00Z');
 const state=view(newHousehold('test-account','Alex','Testcrew',true,now),'test-account',now,[],1) as State;
 const data=cacheSnapshot(undefined,state);
 data.queue=state.tasks.slice(0,2).map(t=>intentFor(state,t,[],crypto.randomUUID(),now));
 let locked=false;const sent:string[]=[];
 let response:(q:CompletionIntent)=>Promise<unknown>=async()=>({ok:true});
 const ports={
  send:async(q:CompletionIntent)=>{sent.push(q.requestKey);return response(q);},
  remove:async(key:string)=>{data.queue=data.queue.filter(q=>q.requestKey!==key);},
  mark:async(q:CompletionIntent,error:string)=>{q.status='conflict';q.error=error;},
  lock:()=>{locked=true;}
 };
 return {state,data,ports,sent,get locked(){return locked;},reply(fn:typeof response){response=fn;}};
}

for(const status of [0,408,425,429,500,503])test(`temporary completion failure ${status} preserves the queue and stops the batch`,async()=>{
 const f=fixture(),keys=f.data.queue.map(q=>q.requestKey);
 f.reply(async()=>{throw new ApiError(status,'Please retry');});
 assert.equal(await replayQueuedCompletions(f.data.queue,f.state,f.ports),0);
 assert.deepEqual(f.sent,[keys[0]]);
 assert.deepEqual(f.data.queue.map(q=>[q.requestKey,q.status,q.error]),keys.map(k=>[k,'pending',undefined]));
 assert.equal(f.state.user.stars,0);assert.equal(f.locked,false);
 f.reply(async()=>({ok:true}));
 assert.equal(await replayQueuedCompletions(f.data.queue,f.state,f.ports),2);
 assert.equal(f.data.queue.length,0);
});

test('expired authentication locks the local view without sacrificing pending completions',async()=>{
 const f=fixture();f.reply(async()=>{throw new ApiError(401,'Sign in again');});
 assert.equal(await replayQueuedCompletions(f.data.queue,f.state,f.ports),0);
 assert.equal(f.locked,true);assert.equal(f.sent.length,1);
 assert.ok(f.data.queue.every(q=>q.status==='pending'&&!q.error));
 f.reply(async()=>({ok:true})); // A fresh authenticated snapshot may retry the same requests.
 assert.equal(await replayQueuedCompletions(f.data.queue,f.state,f.ports),2);
});

test('permanent conflicts stay visible while an independent valid completion is sent',async()=>{
 const f=fixture(),first=f.data.queue[0];
 f.reply(async q=>{if(q===first)throw new ApiError(409,'Changed task');return {ok:true};});
 assert.equal(await replayQueuedCompletions(f.data.queue,f.state,f.ports),1);
 assert.deepEqual(f.data.queue,[first]);assert.equal(first.status,'conflict');assert.equal(first.error,'Changed task');
 const attempts=f.sent.length;
 assert.equal(await replayQueuedCompletions(f.data.queue,f.state,f.ports),0);assert.equal(f.sent.length,attempts);
});

test('account, crew and restore changes never transmit a queued completion to a different scope',async()=>{
 for(const change of [(s:any)=>s.viewer.id='other',(s:any)=>s.household.id='other',(s:any)=>s.restoreEpoch='restored']){
  const f=fixture(),changed=structuredClone(f.state);change(changed);
  assert.equal(await replayQueuedCompletions(f.data.queue,changed,f.ports),0);
  assert.equal(f.sent.length,0);assert.ok(f.data.queue.every(q=>q.status==='conflict'));
 }
});

test('lost successful response is retried with its original key and only removed after acknowledgement',async()=>{
 const f=fixture(),intent=f.data.queue[0],credited=new Set<string>();let lost=true;
 f.reply(async q=>{credited.add(q.requestKey);if(lost){lost=false;throw new ApiError(0,'Lost response');}return {replayed:true};});
 await assert.rejects(submitQueuedCompletion(intent,f.state,f.ports));
 assert.ok(f.data.queue.includes(intent));assert.equal(intent.status,'pending');
 assert.deepEqual(await submitQueuedCompletion(intent,f.state,f.ports),{replayed:true});
 assert.equal(credited.size,1);assert.deepEqual(f.sent,[intent.requestKey,intent.requestKey]);
 assert.ok(!f.data.queue.includes(intent));
});

test('failure to remove a confirmed local intent retains its original retry key',async()=>{
 const f=fixture(),intent=f.data.queue[0];
 const broken={...f.ports,remove:async()=>{throw new Error('Device storage unavailable');}};
 await assert.rejects(submitQueuedCompletion(intent,f.state,broken));
 assert.equal(intent.status,'pending');assert.ok(f.data.queue.includes(intent));
});
