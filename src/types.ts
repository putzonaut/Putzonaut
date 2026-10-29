export type User = { id: string; name: string; username: string; role: 'admin' | 'member'; outfit: string; xp: number; stars: number; level: number; levelXp: number; nextLevelXp: number };
export type Task = { id: string; title: string; room: string; icon: string; minutes: number; xp: number; stars: number; cadence: string; occurrenceKey: string; completion: null | { user_name: string; created_at: string } };
export type Reward = { id: string; title: string; cost: number; icon: string };
export type Outfit = { id: string; title: string; cost: number; level: number; unlocked: boolean };
export type State = {
  user: User;
  household: { id: string; name: string; goalTitle: string; weekGoal: number; weekCount: number; timezone: string };
  tasks: Task[];
  members: (User & { weekCount: number })[];
  rewards: Reward[];
  redemptions: { id: string; title: string; cost: number; user_name: string; fulfilled_at: string | null; created_at: string }[];
  outfits: Outfit[];
  recent: { id: string; title: string; name: string; createdAt: string }[];
  completedCount: number;
};
