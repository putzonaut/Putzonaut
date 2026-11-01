import type {DatabaseSync} from 'node:sqlite';
import {z} from 'zod';
import type {Household} from '../server/domain.ts';

const mappingSchema=z.array(z.object({oldAccountId:z.string().min(1).max(255),newEmail:z.string().email().max(254)}).strict()).min(1).max(1000);
/** Operator-only, offline mapping after a separately verified full database transfer.
 * No web endpoint; never infer ownership from a name or an email in legacy crew data. */
export function relinkAccounts(crewDb:DatabaseSync,accountsDb:DatabaseSync,input:unknown,apply=false){
 const mappings=mappingSchema.parse(input);
 crewDb.exec('BEGIN IMMEDIATE');
 try{
  const seenOld=new Set<string>(),seenNew=new Set<string>();
  const changes=mappings.map(mapping=>{
   const user=accountsDb.prepare('SELECT id,emailVerified FROM user WHERE lower(email)=?').get(mapping.newEmail.trim().toLowerCase());
   if(!user||!user.emailVerified)throw new Error('Every target account must exist and have a verified email address.');
   const target=String(user.id);
   if(seenOld.has(mapping.oldAccountId)||seenNew.has(target))throw new Error('Duplicate source or target in mapping.');
   seenOld.add(mapping.oldAccountId);seenNew.add(target);
   if(accountsDb.prepare('SELECT id FROM user WHERE id=?').get(mapping.oldAccountId))throw new Error('Source is already an independent account.');
   if(crewDb.prepare('SELECT account_id FROM memberships WHERE account_id=?').get(target))throw new Error('Target already belongs to a crew.');
   const row=crewDb.prepare('SELECT m.member_id,h.id,h.document FROM memberships m JOIN households h ON h.id=m.household_id WHERE m.account_id=?').get(mapping.oldAccountId);
   if(!row)throw new Error('Legacy membership does not exist.');
   const house=JSON.parse(String(row.document)) as Household;
   const member=house.members.find(m=>m.id===row.member_id&&m.accountId===mapping.oldAccountId&&!m.removedAt&&m.kind!=='child');
   if(!member||house.closedAt)throw new Error('Legacy membership is not an active adult.');
   return {oldAccountId:mapping.oldAccountId,newAccountId:target,newEmail:mapping.newEmail,householdId:house.id,crew:house.name,memberId:member.id,member:member.name};
  });
  if(apply){
   for(const householdId of new Set(changes.map(c=>c.householdId))){
    const row=crewDb.prepare('SELECT document FROM households WHERE id=?').get(householdId)!;
    const house=JSON.parse(String(row.document)) as Household;
    const replacements=changes.filter(c=>c.householdId===householdId);
    const replace=(document:Household)=>{for(const replacement of replacements){const member=document.members.find(m=>m.id===replacement.memberId);if(member?.accountId===replacement.oldAccountId)member.accountId=replacement.newAccountId;}};
    replace(house);house.restoreEpoch=crypto.randomUUID();house.lastMutation=crypto.randomUUID();
    crewDb.prepare('UPDATE households SET document=?,revision=revision+1,updated_at=? WHERE id=?').run(JSON.stringify(house),new Date().toISOString(),householdId);
    const recovery=crewDb.prepare('SELECT document FROM crew_recovery WHERE household_id=?').get(householdId);
    if(recovery){const document=JSON.parse(String(recovery.document)) as Household;replace(document);crewDb.prepare('UPDATE crew_recovery SET document=? WHERE household_id=?').run(JSON.stringify(document),householdId);}
   }
   for(const change of changes)crewDb.prepare('UPDATE memberships SET account_id=? WHERE account_id=?').run(change.newAccountId,change.oldAccountId);
  }
  crewDb.exec(apply?'COMMIT':'ROLLBACK');return changes;
 }catch(error){crewDb.exec('ROLLBACK');throw error;}
}
