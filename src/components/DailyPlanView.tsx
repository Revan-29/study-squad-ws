import React from 'react';
import { DailyPlan, Task, TaskCompletion, SquadMemberConfig } from '../types';
import { TaskCard } from './TaskCard';
import { formatPlanDateIST, getTodayDateIST, formatTimestampIST } from '../utils/dateUtils';
import {
  Layers,
  Plus,
  Lock,
  FileEdit,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';

interface DailyPlanViewProps {
  plan: DailyPlan | null;
  tasks: Task[];
  completions: TaskCompletion[];
  activeUser: SquadMemberConfig;
  onOpenCreateModal: () => void;
  onCompleteTask: (task: Task) => Promise<void>;
}

export const DailyPlanView: React.FC<DailyPlanViewProps> = ({
  plan,
  tasks,
  completions,
  activeUser,
  onOpenCreateModal,
  onCompleteTask,
}) => {
  const todayIST = getTodayDateIST();
  const totalPoints = tasks.reduce((sum, t) => sum + t.points, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-indigo-400">
            Daily Plan Management (Asia/Kolkata)
          </span>
          <h2 className="text-2xl font-bold text-neutral-100 flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-400" />
            <span>Today's Study Plan · {formatPlanDateIST(todayIST)}</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manually created by the squad each day. No auto-generated topics or sample tasks.
          </p>
        </div>

        {/* Action Button */}
        {!plan ? (
          <button
            onClick={onOpenCreateModal}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer self-start sm:self-center"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ CREATE TODAY'S STUDY PLAN</span>
          </button>
        ) : !plan.isLocked ? (
          <button
            onClick={onOpenCreateModal}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 transition-all cursor-pointer self-start sm:self-center"
          >
            <FileEdit className="w-4 h-4" />
            <span>Edit or Lock Plan</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-emerald-400 self-start sm:self-center">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Locked & Immutable</span>
          </div>
        )}
      </div>

      {/* NO PLAN STATE */}
      {!plan && (
        <div className="p-8 sm:p-12 rounded-3xl bg-neutral-900/40 border border-dashed border-neutral-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-500 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-xl font-bold text-neutral-100">
              No study plan created for today.
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400">
              One of the four members (Revanasiddayya, Vinodini, Rubiya, or Mahantesh) will manually
              create today's topics and decide points. Click below to enter today's plan.
            </p>
          </div>
          <button
            onClick={onOpenCreateModal}
            className="min-h-[48px] px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold text-sm inline-flex items-center gap-2 shadow-xl shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span>+ CREATE TODAY'S STUDY PLAN</span>
          </button>
        </div>
      )}

      {/* DRAFT STATE */}
      {plan && !plan.isLocked && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Draft Mode:</strong> This plan has not been locked yet. Any member can add or
                edit topics. Once locked, points and topic names become permanent.
              </span>
            </div>
            <button
              onClick={onOpenCreateModal}
              className="py-2 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shrink-0 cursor-pointer"
            >
              Lock Plan Now
            </button>
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
                isReadOnly={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* LOCKED STATE */}
      {plan && plan.isLocked && (
        <div className="space-y-6">
          <div className="p-4 sm:p-5 rounded-xl bg-neutral-900/80 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                  Permanently Locked Study Plan
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Locked by <strong>{plan.lockedByName || 'Squad Member'}</strong>
                {plan.lockedAt ? ` at ${formatTimestampIST(plan.lockedAt)}` : ''}. Database triggers
                prohibit modifications.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-neutral-400 block">Total Topics</span>
                <span className="text-base font-bold text-neutral-100">{tasks.length}</span>
              </div>
              <div>
                <span className="text-neutral-400 block">Available Points</span>
                <span className="text-base font-bold text-amber-300">+{totalPoints} PTS</span>
              </div>
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
      )}
    </div>
  );
};
