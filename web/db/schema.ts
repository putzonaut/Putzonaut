import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const households=sqliteTable('households',{
 id:text('id').primaryKey(),document:text('document').notNull(),revision:integer('revision').notNull().default(1),updatedAt:text('updated_at').notNull(),
});
export const memberships=sqliteTable('memberships',{
 accountId:text('account_id').primaryKey(),householdId:text('household_id').notNull().references(()=>households.id),memberId:text('member_id').notNull(),
},t=>[index('memberships_household').on(t.householdId),uniqueIndex('memberships_member').on(t.memberId)]);
export const events=sqliteTable('events',{
 id:text('id').primaryKey(),householdId:text('household_id').notNull().references(()=>households.id),memberId:text('member_id').notNull(),kind:text('kind').notNull(),createdAt:text('created_at').notNull(),requestKey:text('request_key'),payload:text('payload').notNull(),
},t=>[index('events_household_time').on(t.householdId,t.createdAt),uniqueIndex('events_request').on(t.memberId,t.requestKey)]);

// One rollback point per crew, replaced atomically with each restoration.
export const crewRecovery=sqliteTable('crew_recovery',{
 householdId:text('household_id').primaryKey().references(()=>households.id),
 document:text('document').notNull(),sourceRevision:integer('source_revision').notNull(),createdAt:text('created_at').notNull(),
});
export const crewRecoveryEvents=sqliteTable('crew_recovery_events',{
 householdId:text('household_id').notNull().references(()=>households.id),
 eventId:text('event_id').notNull(),payload:text('payload').notNull(),
},t=>[uniqueIndex('crew_recovery_event').on(t.householdId,t.eventId)]);
