import React from 'react';
import {
  DailyPlan,
  Task,
  TaskCompletion,
  MemberStats,
  ActivityLogItem,
  SquadMemberConfig,
  SQUAD_MEMBERS
} from '../types';
import { TaskCard } from './TaskCard';
import { UserAvatar } from './UserAvatar';
import { ActivityFeed } from './ActivityFeed';
import { formatPlanDateIST, getTodayDateIST } from '../utils/dateUtils';
import {
  Plus,
  Lock,
  FileEdit,
  Trophy,
  CheckCircle2,
  Award,
  Sparkles,
  ShieldCheck,
  Flame,
  Clock,
  ArrowRight
} from 'lucide-react';

interface DashboardViewProps {
  plan: DailyPlan | null;
  tasks: Task[];
  completions: TaskCompletion[];
  stats: MemberStats[];
  activities: ActivityLogItem[];
  activeUser: SquadMemberConfig;
  onOpenCreatePlan: () => void;
  onCompleteTask: (task: Task) => Promise<void>;
  onNavigateToLeaderboard: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  plan,
  tasks,
  completions,
  stats,
  activities,
  activeUser,
  onOpenCreatePlan,
  onCompleteTask,
  onNavigateToLeaderboard,
}) => {
  const todayIST = getTodayDateIST();

  // Calculate today's aggregate metrics
  const totalTasks = tasks.length;
  const maxPossibleCompletions = totalTasks * 4;
  const actualCompletionsCount = completions.length;
  const squadOverallProgress = maxPossibleCompletions > 0
    ? Math.round((actualCompletionsCount / maxPossibleCompletions) * 100)
    : 0;

  // Active user's today completions
  const myCompletedCount = completions.filter((c) => c.userId === activeUser.id).length;
  const myTodayPoints = completions
    .filter((c) => c.userId === activeUser.id)
    .reduce((sum, c) => sum + c.pointsAwarded, 0);

  const totalPossiblePoints = tasks.reduce((sum, t) => sum + t.points, 0);

  return (
    <div className="space-y-8">
      {/* Top Greeting & Date Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-indigo-400">
            <span>Asia/Kolkata Time</span>
            <span>·</span>
            <span>{formatPlanDateIST(todayIST)}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-100 tracking-tight mt-1">
            Welcome, {activeUser.displayName}!
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            Manage your daily study goals and compete with the squad in real time.
          </p>
        </div>

        {/* Action Button: Create or View Plan */}
        {!plan ? (
          <button
            onClick={onOpenCreatePlan}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer self-start sm:self-center"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ CREATE TODAY'S STUDY PLAN</span>
          </button>
        ) : !plan.isLocked ? (
          <button
            onClick={onOpenCreatePlan}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 transition-all cursor-pointer self-start sm:self-center"
          >
            <FileEdit className="w-4 h-4" />
            <span>Review & Lock Today's Plan</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-emerald-400 self-start sm:self-center">
            <Lock className="w-3.5 h-3.5" />
            <span>Plan Locked & Active</span>
          </div>
        )}
      </div>

      {/* STATE 1: NO PLAN CREATED FOR TODAY */}
      {!plan && (
        <div className="p-8 sm:p-12 rounded-3xl bg-neutral-900/40 border border-dashed border-neutral-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-400 flex items-center justify-center mx-auto shadow-inner">
            <Clock className="w-8 h-8 text-neutral-500" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-xl font-bold text-neutral-100">
              No study plan created for today.
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              We decide our study topics ourselves every day. No topics are ever automatically
              generated. One member creates the plan, sets the points, and locks it for the squad.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onOpenCreatePlan}
              className="min-h-[48px] px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold text-sm inline-flex items-center gap-2 shadow-xl shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              <span>+ CREATE TODAY'S STUDY PLAN</span>
            </button>
          </div>
        </div>
      )}

      {/* STATE 2: DRAFT PLAN (UNLOCKED) */}
      {plan && !plan.isLocked && (
        <div className="p-5 sm:p-6 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>DRAFT STUDY PLAN IN PROGRESS</span>
            </div>
            <h3 className="text-base font-bold text-neutral-100">
              {tasks.length} topics drafted by {plan.createdByName || 'a squad member'}
            </h3>
            <p className="text-xs text-neutral-400">
              Topics and points can still be edited. Once locked, no changes are allowed and task
              completion begins!
            </p>
          </div>

          <button
            onClick={onOpenCreatePlan}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-600/20 transition-all cursor-pointer shrink-0"
          >
            <Lock className="w-4 h-4" />
            <span>Review & Lock Today's Plan</span>
          </button>
        </div>
      )}

      {/* STATE 3: LOCKED PLAN & ACTIVE SQUAD STUDY */}
      {plan && plan.isLocked && (
        <div className="space-y-6">
          {/* Top Squad Metric Summary Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <span className="text-[11px] text-neutral-400 block">Total Topics Today</span>
              <span className="text-2xl font-bold font-mono text-neutral-100">
                {totalTasks}
              </span>
              <span className="text-[10px] text-neutral-400 block mt-0.5">
                Targeted subjects for today
              </span>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <span className="text-[11px] text-neutral-400 block">Total Points Possible</span>
              <span className="text-2xl font-bold font-mono text-amber-300">
                +{totalPossiblePoints} <span className="text-xs font-normal text-neutral-400">pts</span>
              </span>
              <span className="text-[10px] text-neutral-400 block mt-0.5">
                Per person on 100% completion
              </span>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <span className="text-[11px] text-neutral-400 block">Your Today Progress</span>
              <span className="text-2xl font-bold font-mono text-emerald-300">
                {myCompletedCount}/{totalTasks}
              </span>
              <span className="text-[10px] text-neutral-400 block mt-0.5 font-mono">
                +{myTodayPoints} pts earned by you
              </span>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <span className="text-[11px] text-neutral-400 block">Group Task Completion</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold font-mono text-indigo-300">
                  {squadOverallProgress}%
                </span>
                <div className="flex-1 h-2 rounded-full bg-neutral-950 overflow-hidden border border-neutral-800">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${squadOverallProgress}%` }}
                  />
                </div>
              </div>
              <span className="text-[10px] text-neutral-400 block mt-0.5">
                {actualCompletionsCount} of {maxPossibleCompletions} squad completions
              </span>
            </div>
          </div>

          {/* 4 Member Progress Cards Grid */}
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-3 px-1">
              <span className="font-semibold uppercase font-mono tracking-wider">
                Live Squad Member Progress Today
              </span>
              <span className="font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {SQUAD_MEMBERS.map((member) => {
                const memberComps = completions.filter((c) => c.userId === member.id);
                const count = memberComps.length;
                const points = memberComps.reduce((sum, c) => sum + c.pointsAwarded, 0);
                const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
                const isMe = member.id === activeUser.id;

                return (
                  <div
                    key={member.id}
                    className={`p-4 rounded-xl border transition-all ${
                      pct === 100
                        ? 'bg-emerald-950/20 border-emerald-500/40 shadow-md shadow-emerald-950/10'
                        : 'bg-neutral-900/60 border-neutral-800'
                    } ${isMe ? 'ring-1 ring-indigo-500/50' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar userIdOrName={member.id} size="md" />
                        <div>
                          <span className="font-bold text-neutral-200 block text-xs truncate">
                            {member.displayName}
                          </span>
                          {isMe && (
                            <span className="text-[10px] text-indigo-400 font-mono uppercase block -mt-0.5">
                              (Active You)
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-300">
                        +{points}p
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
                        <span>Tasks: {count}/{totalTasks}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-neutral-950 overflow-hidden border border-neutral-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            pct === 100 ? 'bg-emerald-400' : 'bg-indigo-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's Manually Entered Topics (The Core Daily List) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                  <span>Today's Study Topics ({tasks.length})</span>
                </h2>
                <span className="text-xs text-neutral-400">
                  Click below to mark your own task completed. Unchecking is strictly prohibited.
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  plan={plan}
                  completions={completions}
                  activeUserId={activeUser.id}
                  activeUserName={activeUser.displayName}
                  onComplete={onCompleteTask}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Section: Mini Leaderboard & Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-neutral-800/80">
        {/* Mini Leaderboard Widget */}
        <div className="lg:col-span-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Current Squad Leaderboard</span>
            </h3>
            <button
              onClick={onNavigateToLeaderboard}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>Full Board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {stats.slice(0, 4).map((member, idx) => {
              const medals = ['🥇', '🥈', '🥉', '⚡'];
              const isCurrentUser = member.userId === activeUser.id;

              return (
                <div
                  key={member.userId}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                    isCurrentUser
                      ? 'bg-neutral-800/70 border-indigo-500/40'
                      : 'bg-neutral-950/40 border-neutral-800/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm shrink-0">{medals[idx]}</span>
                    <UserAvatar userIdOrName={member.userId} size="sm" />
                    <div>
                      <span className="font-semibold text-neutral-200 block truncate">
                        {member.displayName}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        Streak: {member.currentStreak}d · Done: {member.tasksCompleted}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-amber-300 text-sm block">
                      +{member.totalPoints} pts
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      Today: +{member.todayPoints}p
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Activity Feed Widget */}
        <div className="lg:col-span-6">
          <ActivityFeed activities={activities} maxItems={8} />
        </div>
      </div>
    </div>
  );
};
