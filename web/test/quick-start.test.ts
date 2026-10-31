import test from 'node:test';
import assert from 'node:assert/strict';
import {availableMissions,quickMissions} from '../shared/quick-start.ts';
import {TASK_TEMPLATES,STARTER_TEMPLATES,TEMPLATE_CATEGORIES} from '../shared/setup.ts';
import {templateDraft} from '../src/drafts.ts';
import type {Task} from '../src/types.ts';
import {taskSchema} from '../server/domain.ts';

const t=(id:string,extra:Partial<Task>={}):Task=>({id,title:id,room:'Wohnen',icon:'sparkles',minutes:5,xp:20,stars:5,cadence:'daily',occurrenceKey:'2026-10-30',effectiveDueDate:'2026-10-30',nextDueDate:'2026-10-31',status:'today',completion:null,...extra});
test('quick start offers only currently doable own or unassigned missions, even for captains',()=>{
 const all=[t('free'),t('mine',{effectiveAssignedTo:'me'}),t('other',{effectiveAssignedTo:'other'}),...(['done','paused','pending','upcoming'] as const).map(status=>t(status,{status})),t('stale',{occurrenceKey:''})];
 assert.deepEqual(availableMissions(all,{id:'me'}).map(t=>t.id),['mine','free']);
});
test('time budgets include whole missions, never shorten tasks, and limit choice to three',()=>{
 const all=[t('5'),t('10',{minutes:10}),t('15',{minutes:15}),t('20',{minutes:20}),t('25',{minutes:25})];
 assert.deepEqual(quickMissions(all,{id:'me'},5).map(t=>t.id),['5']);
 assert.deepEqual(quickMissions(all,{id:'me'},10).map(t=>t.id),['5','10']);
 assert.deepEqual(quickMissions(all,{id:'me'},20).map(t=>t.id),['5','10','15']);
 assert.deepEqual(quickMissions([t('long',{minutes:25})],{id:'me'},20),[]);
});
test('personal assignments lead, overdue tasks follow, and equal tasks have a stable order',()=>{
 const all=[t('unassigned-old',{status:'overdue',effectiveDueDate:'2026-10-28'}),t('mine-new',{effectiveAssignedTo:'me'}),t('z'),t('a')];
 assert.deepEqual(availableMissions(all,{id:'me'}).map(t=>t.id),['mine-new','unassigned-old','a','z']);
 assert.equal(quickMissions(all,{id:'me'},10)[0].title,'mine-new');
});
test('all 51 editable templates fit the task contract while onboarding remains six choices',()=>{
 assert.equal(TASK_TEMPLATES.length,51);assert.equal(STARTER_TEMPLATES.length,6);
 assert.equal(new Set(TASK_TEMPLATES.map(t=>t.key)).size,51);
 assert.equal(new Set(TASK_TEMPLATES.map(t=>t.title)).size,51);
 for(const template of TASK_TEMPLATES){const draft=templateDraft(template.key);assert.equal(taskSchema.safeParse(draft).success,true,template.title);assert.ok(TEMPLATE_CATEGORIES.some(c=>c.id===template.category));assert.equal('id' in draft,false);assert.ok((draft.steps??[]).every(s=>!s.id));}
 assert.ok(TASK_TEMPLATES.filter(t=>t.minutes<=5).length>=20);
});
