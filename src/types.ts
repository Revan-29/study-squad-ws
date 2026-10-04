export type MemberUsername = 'revanasiddayya' | 'vinodini' | 'rubiya' | 'mahantesh';

export interface SquadMemberConfig {
  id: string;
  username: MemberUsername;
  displayName: string;
  defaultEmail: string;
  avatarColor: string;
  avatarBg: string;
  borderColor: string;
  textColor: string;
  accentGlow: string;
  initials: string;
  bio: string;
}

export const SQUAD_MEMBERS: SquadMemberConfig[] = [
  {
    id: 'user-revanasiddayya',
    username: 'revanasiddayya',
    displayName: 'Revanasiddayya',
    defaultEmail: 'revanasiddayya@studysquad.local',
    avatarColor: 'from-blue-600 to-indigo-700',
    avatarBg: 'bg-blue-950/40 text-blue-400 border-blue-800/60',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
    accentGlow: 'shadow-blue-500/20',
    initials: 'RH',
    bio: 'Algorithms, Data Structures & System Architecture enthusiast.',
  },
  {
    id: 'user-vinodini',
    username: 'vinodini',
    displayName: 'Vinodini',
    defaultEmail: 'vinodini@studysquad.local',
    avatarColor: 'from-emerald-600 to-teal-700',
    avatarBg: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60',
    borderColor: 'border-emerald-500/30',
    textColor: 'text-emerald-400',
    accentGlow: 'shadow-emerald-500/20',
    initials: 'VK',
    bio: 'Programming fundamentals, problem solving & clean code.',
  },
  {
    id: 'user-rubiya',
    username: 'rubiya',
    displayName: 'Rubiya',
    defaultEmail: 'rubiya@studysquad.local',
    avatarColor: 'from-purple-600 to-pink-700',
    avatarBg: 'bg-purple-950/40 text-purple-400 border-purple-800/60',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-400',
    accentGlow: 'shadow-purple-500/20',
    initials: 'RS',
    bio: 'Database systems, core theory & logic consistency.',
  },
  {
    id: 'user-mahantesh',
    username: 'mahantesh',
    displayName: 'Mahantesh',
    defaultEmail: 'mahantesh@studysquad.local',
    avatarColor: 'from-amber-600 to-orange-700',
    avatarBg: 'bg-amber-950/40 text-amber-400 border-amber-800/60',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-400',
    accentGlow: 'shadow-amber-500/20',
    initials: 'MP',
    bio: 'Competitive coding, speed solving & milestone tracker.',
  },
];

export type TaskDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface Task {
  id: string;
  planId: string;
  subject: string;
  title: string;
  description?: string;
  difficulty: TaskDifficulty;
  points: number;
  orderIndex: number;
  createdAt: string;
}

export interface TaskDraft {
  tempId: string;
  subject: string;
  title: string;
  description?: string;
  difficulty: TaskDifficulty;
  points: number;
}

export interface DailyPlan {
  id: string;
  planDate: string; // YYYY-MM-DD in Asia/Kolkata
  createdBy: string;
  createdByName: string;
  isLocked: boolean;
  lockedAt?: string | null;
  lockedBy?: string | null;
  lockedByName?: string | null;
  createdAt: string;
  updatedAt: string;
  tasks?: Task[];
}

export interface TaskCompletion {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  completedAt: string;
  pointsAwarded: number;
}

export interface ActivityLogItem {
  id: string;
  userId: string;
  userName: string;
  taskId?: string;
  taskTitle?: string;
  subject?: string;
  actionType: 'task_completed' | 'plan_created' | 'plan_locked' | 'achievement_unlocked';
  message: string;
  points?: number;
  createdAt: string;
}

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  iconName: string;
  pointsThreshold?: number;
  streakThreshold?: number;
  tasksThreshold?: number;
  specialCondition?: string;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: string;
}

export interface MemberStats {
  userId: string;
  userName: string;
  displayName: string;
  avatarColor: string;
  totalPoints: number;
  todayPoints: number;
  weekPoints: number;
  monthPoints: number;
  tasksCompleted: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number; // percentage
  rank: number;
}

export type LeaderboardTimeframe = 'today' | 'week' | 'month' | 'all';
