import { randomUUID } from 'node:crypto';
import type { Query } from './database.ts';

export class AppError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
export function localDay(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function weekKey(date: Date, timeZone: string): string {
  const day = new Date(`${localDay(date, timeZone)}T12:00:00Z`);
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  return day.toISOString().slice(0, 10);
}
export function occurrenceKey(cadence: string, date: Date, timeZone: string): string {
  return cadence === 'daily' ? localDay(date, timeZone) : cadence === 'weekly' ? weekKey(date, timeZone) : 'once';
}
export const OUTFITS = [
  { id: 'starter', title: 'Starter', cost: 0, level: 1 },
  { id: 'comet', title: 'Komet', cost: 300, level: 1 },
  { id: 'sun', title: 'Sonnenheld', cost: 0, level: 8 },
];
export function publicUser(row: any) {
  return { id: row.id, name: row.name, username: row.username, role: row.role, outfit: row.outfit,
    xp: row.total_xp, stars: row.stars, level: Math.floor(row.total_xp / 500) + 1,
    levelXp: row.total_xp % 500, nextLevelXp: 500 };
}
export async function seedHousehold(q: Query, householdId: string) {
  const tasks = [
    ['Staubsaugen', 'Wohnen', 'vacuum', 15, 60, 20, 'daily'],
    ['Spülmaschine einräumen', 'Küche', 'dishes', 8, 40, 15, 'daily'],
    ['Wäsche aufhängen', 'Haushalt', 'laundry', 10, 50, 15, 'daily'],
    ['Pflanzen gießen', 'Wohnen', 'plant', 5, 25, 10, 'weekly'],
    ['Bad zum Strahlen bringen', 'Bad', 'bath', 20, 80, 25, 'weekly'],
    ['Müll rausbringen', 'Haushalt', 'trash', 5, 25, 10, 'daily'],
  ];
  for (const task of tasks) await q.query(`INSERT INTO tasks
    (id, household_id, title, room, icon, minutes, xp, stars, cadence) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [randomUUID(), householdId, ...task]);
  for (const [title, cost, icon] of [['Film aussuchen', 100, 'film'], ['Eis essen gehen', 180, 'ice'], ['Wunschessen', 120, 'meal']]) {
    await q.query('INSERT INTO rewards (id, household_id, title, cost, icon) VALUES ($1,$2,$3,$4,$5)', [randomUUID(), householdId, title, cost, icon]);
  }
}
