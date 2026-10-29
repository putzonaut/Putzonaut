import type {progressView} from '../server/progress';
import type {Difficulty} from '../shared/game';
import type { Schedule, Pause } from '../shared/planning';
import type { HouseholdKind } from '../shared/setup';
export type User = {titleId:string|null;patchId:string|null;title:string|null;patch:string|null; id: string; name: string; kind:'account'|'child';guardianId:string|null; username: string; role: 'admin' | 'member'; outfit: string; xp: number; stars: number; level: number; levelXp: number; nextLevelXp: number };
export type Task = { id:string;title:string;room:string;icon:string;minutes:number;xp:number;stars:number;difficulty?:Difficulty;cadence:string;occurrenceKey:string;assignedTo?:string|null;effectiveAssignedTo?:string|null;assignedName?:string|null;dueDate?:string|null;overdue?:boolean;status:'today'|'overdue'|'upcoming'|'paused'|'done'|'pending';effectiveDueDate:string|null;nextDueDate:string|null;schedule?:Schedule;createdOn?:string;rotationIds?:string[];rotationStart?:string;approvalForChildren?:boolean;pause?:Pause|null;completion:null|{occurrenceKey:string;id?:string;status?:string;user_name:string;created_at:string} };
export type PendingCompletion={id:string;taskId:string;title:string;name:string;userId:string;createdAt:string;xp:number;stars:number;canReview:boolean};
export type Reward = { id: string; title: string; cost: number; icon: string };
export type Outfit = { id: string; title: string; cost: number; level: number; unlocked: boolean;achievement?:string|null;requirement?:string|null };
export type State = {
  game:ReturnType<typeof progressView>;
  user: User;
  viewer: User;
  household: { id: string; name: string; kind:HouseholdKind; goalTitle: string; weekGoal: number; nextWeekGoal:number; weekCount: number; timezone: string };
  tasks: Task[];
  pendingCompletions:PendingCompletion[];
  members: (User & { weekCount: number })[];
  rewards: Reward[];
  redemptions: { id: string; title: string; cost: number; user_name: string; fulfilled_at: string | null; created_at: string }[];
  outfits: Outfit[];
  recent: { id: string; title: string; name: string; createdAt: string }[];
  revision:number; syncedAt:string;
  completedCount: number;
};

export type HistoryItem={bonusChanges?:{userId:string;name:string;stars:number;week:string}[];id:string;kind:string;name:string;title:string;createdAt:string;xp?:number;stars?:number;recordedByName?:string;canUndo?:boolean;reversed?:boolean};
