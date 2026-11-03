export type MissionReactionKind='watering'|'sock'|'shine';
/** Only the completed task determines its decoration, never a guessed title. */
export function missionReaction(task?:{category?:string;icon?:string}):MissionReactionKind|undefined{
 if(!task)return;
 const category=task.category??({plant:'plants',laundry:'laundry',bath:'bath',window:'bath',spray:'bath'} as Record<string,string>)[task.icon??''];
 if(category==='plants')return 'watering';
 if(category==='laundry')return 'sock';
 if(category==='bath'||category==='kitchen')return 'shine';
}
