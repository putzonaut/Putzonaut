import type {Task,User} from '../src/types.ts';

/** Suggest whole, available missions. Captains are not silently offered other
 * people's assignments; the normal mission controls remain authoritative. */
export function availableMissions(tasks:Task[], user:Pick<User,'id'>):Task[] {
  return tasks.filter(t => ['today','overdue'].includes(t.status)
    && !!t.occurrenceKey && (!t.effectiveAssignedTo || t.effectiveAssignedTo === user.id))
    .sort((a,b) => Number(b.effectiveAssignedTo===user.id)-Number(a.effectiveAssignedTo===user.id)
      || Number(b.status==='overdue')-Number(a.status==='overdue')
      || (a.effectiveDueDate??'').localeCompare(b.effectiveDueDate??'')
      || a.minutes-b.minutes || a.id.localeCompare(b.id));
}

export function quickMissions(tasks:Task[], user:Pick<User,'id'>, minutes:number):Task[] {
  return availableMissions(tasks,user).filter(t=>t.minutes<=minutes).slice(0,3);
}
