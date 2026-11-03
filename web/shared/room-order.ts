/** Retain the selected work and the first priority task, grouping nearby tasks.
 * Explicit user-authored routines do not use this ordering. */
export function roomOrder<T extends {areaId?:string;room?:string}>(tasks:readonly T[]):T[]{
 const groups=new Map<string,T[]>();
 tasks.forEach((task,i)=>{const key=task.areaId?'id:'+task.areaId:task.room?'room:'+task.room:'unknown:'+i;const group=groups.get(key)??[];group.push(task);groups.set(key,group);});
 return [...groups.values()].flat();
}
