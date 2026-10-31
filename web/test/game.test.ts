import test from 'node:test';import assert from 'node:assert/strict';
import {suggestedPoints,REWARD_IDEAS} from '../shared/game.ts';
import {TASK_TEMPLATES,STARTER_TEMPLATE_KEYS,DEFAULT_STARTER_TEMPLATE_KEYS,HOUSEHOLD_TYPES,setupGoals} from '../shared/setup.ts';
import {addDays,weekday,plan,localDay} from '../shared/planning.ts';
test('point suggestions distinguish effort and time within the accepted task limits',()=>{
 assert.deepEqual(suggestedPoints(10,'normal'),{xp:40,stars:15});assert.deepEqual(suggestedPoints(20,'hard'),{xp:120,stars:40});assert.ok(suggestedPoints(20,'easy').xp<suggestedPoints(20,'hard').xp);
 for(const minutes of [-1,1,10,180,999,NaN]){const p=suggestedPoints(minutes,'hard');assert.ok(p.xp>=1&&p.xp<=1000);assert.ok(p.stars>=0&&p.stars<=500);assert.ok(Number.isInteger(p.xp)&&Number.isInteger(p.stars));}
});
test('reward ideas cover each supported household type and remain editable suggestions',()=>{for(const kind of ['family','couple','shared','solo'] as const){assert.ok(REWARD_IDEAS[kind].length>=3);assert.ok(REWARD_IDEAS[kind].every(r=>r.cost>0&&r.title.length<=60));}assert.ok(REWARD_IDEAS.solo.some(r=>r.title.includes('mich')));});

test('new template points follow the same duration and effort rule as a new custom mission',()=>{
 for(const t of TASK_TEMPLATES)assert.deepEqual({xp:t.xp,stars:t.stars},suggestedPoints(t.minutes,t.difficulty??'normal'),t.title);
});

test('new crew goals fit every starter selection and remaining Berlin calendar week',()=>{
 for(const kind of HOUSEHOLD_TYPES.map(t=>t.id))for(let mask=0;mask<64;mask++)for(let day=0;day<7;day++){
  const keys=STARTER_TEMPLATE_KEYS.filter((_,i)=>mask&(1<<i));const today=addDays('2026-10-26',day);
  const tasks=TASK_TEMPLATES.filter(t=>keys.includes(t.key));const rounds=new Set<string>();
  for(let n=0;n<8-weekday(today);n++)for(const task of tasks){const p=plan({...task,createdOn:today},addDays(today,n),today);if(p.occurrenceKey)rounds.add(task.key+':'+p.occurrenceKey);}
  const goals=setupGoals(kind,keys,today);
  assert.ok(goals.firstWeek>=1&&Number.isInteger(goals.firstWeek));
  assert.ok(goals.firstWeek<=Math.max(1,rounds.size),`${kind}, ${today}, ${keys}`);
  assert.ok(goals.firstWeek<=goals.followingWeeks);
 }
 assert.deepEqual(setupGoals('family',STARTER_TEMPLATE_KEYS,'2026-10-30'),{firstWeek:11,followingWeeks:24});
 assert.deepEqual(setupGoals('family',['plant'],'2026-10-30'),{firstWeek:1,followingWeeks:1});
 assert.deepEqual(setupGoals('family',DEFAULT_STARTER_TEMPLATE_KEYS,'2026-10-31'),{firstWeek:4,followingWeeks:14});
 assert.deepEqual(setupGoals('family',[],'2026-10-31'),{firstWeek:1,followingWeeks:1});
 assert.deepEqual(setupGoals('family',['fridge-clean'],'2026-10-31'),{firstWeek:1,followingWeeks:1});
 // Berlin has already crossed midnight here, both in winter and summer time.
 assert.deepEqual(setupGoals('family',STARTER_TEMPLATE_KEYS,localDay(new Date('2027-01-03T23:30:00Z'))),{firstWeek:24,followingWeeks:24});
 assert.deepEqual(setupGoals('family',STARTER_TEMPLATE_KEYS,localDay(new Date('2027-06-06T22:30:00Z'))),{firstWeek:24,followingWeeks:24});
});
