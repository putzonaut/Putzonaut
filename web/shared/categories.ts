import {TASK_TEMPLATES,TEMPLATE_CATEGORIES} from './setup.ts';
import type {TemplateCategory} from './setup.ts';

export const CATEGORY_IDS=['kitchen','bath','laundry','tidy','household','plants','pets'] as const;
/** Historical evidence only: never look at a task's mutable current values. */
export function evidenceCategory(task:{category?:string;icon?:string;room?:string;title?:string}):TemplateCategory|undefined{
 if(CATEGORY_IDS.includes(task.category as TemplateCategory))return task.category as TemplateCategory;
 const template=TASK_TEMPLATES.find(t=>t.title===task.title&&t.icon===task.icon&&t.room===task.room);
 if(template)return template.category;
 if(task.icon==='laundry')return 'laundry';
 if(task.icon==='plant')return 'plants';
 if(task.icon==='bath')return 'bath';
 if(task.icon==='dishes')return 'kitchen';
 if(task.icon==='trash')return 'household';
 if(task.icon==='vacuum')return 'tidy';
 if(task.icon==='sparkles'&&task.room==='Küche')return 'kitchen';
 if(task.icon==='sparkles'&&task.room==='Bad')return 'bath';
 return undefined;
}
export function categoryLabel(category?:string){return TEMPLATE_CATEGORIES.find(c=>c.id===category)?.label??'Aufräumen';}
