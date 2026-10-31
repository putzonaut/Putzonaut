import {ApiError} from './api.ts';
import {replayProblem} from '../shared/offline.ts';
import type {CompletionIntent} from '../shared/offline.ts';
import type {State} from './types.ts';

/** A temporary failure must never turn an unsent completion into a conflict. */
export function completionFailure(error:unknown):'authentication'|'retry'|'conflict'{
 if(!(error instanceof ApiError))return 'retry';
 if(error.status===401)return 'authentication';
 if(error.status===0||[408,425,429].includes(error.status)||error.status>=500)return 'retry';
 return 'conflict';
}

type SyncPorts<T>={
 send:(intent:CompletionIntent,state:State)=>Promise<T>;
 remove:(key:string)=>Promise<void>;
 mark:(intent:CompletionIntent,message:string)=>Promise<void>;
 lock:()=>void;
};

export async function submitQueuedCompletion<T>(intent:CompletionIntent,state:State,ports:SyncPorts<T>):Promise<T>{
 try{
  const issue=replayProblem(intent,state);if(issue)throw new ApiError(409,issue);
  const result=await ports.send(intent,state);
  await ports.remove(intent.requestKey);
  return result;
 }catch(error){
  const failure=completionFailure(error);
  if(failure==='authentication')ports.lock();
  else if(failure==='conflict')await ports.mark(intent,(error as Error).message);
  throw error;
 }
}

export async function replayQueuedCompletions<T>(queue:CompletionIntent[],state:State,ports:SyncPorts<T>){
 let count=0;
 for(const intent of queue){
  if(intent.status!=='pending')continue;
  try{await submitQueuedCompletion(intent,state,ports);count++;}
  catch(error){if(completionFailure(error)!=='conflict')break;}
 }
 return count;
}
