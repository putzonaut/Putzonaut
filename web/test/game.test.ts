import test from 'node:test';import assert from 'node:assert/strict';
import {suggestedPoints,REWARD_IDEAS} from '../shared/game.ts';
test('point suggestions distinguish effort and time within the accepted task limits',()=>{
 assert.deepEqual(suggestedPoints(10,'normal'),{xp:40,stars:15});assert.deepEqual(suggestedPoints(20,'hard'),{xp:120,stars:40});assert.ok(suggestedPoints(20,'easy').xp<suggestedPoints(20,'hard').xp);
 for(const minutes of [-1,1,10,180,999,NaN]){const p=suggestedPoints(minutes,'hard');assert.ok(p.xp>=1&&p.xp<=1000);assert.ok(p.stars>=0&&p.stars<=500);assert.ok(Number.isInteger(p.xp)&&Number.isInteger(p.stars));}
});
test('reward ideas cover each supported household type and remain editable suggestions',()=>{for(const kind of ['family','couple','shared','solo'] as const){assert.ok(REWARD_IDEAS[kind].length>=3);assert.ok(REWARD_IDEAS[kind].every(r=>r.cost>0&&r.title.length<=60));}assert.ok(REWARD_IDEAS.solo.some(r=>r.title.includes('mich')));});
