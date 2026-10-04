import React, { useState } from 'react';
import { Task, DailyPlan, TaskCompletion, SQUAD_MEMBERS } from '../types';
import { UserAvatar } from './UserAvatar';
import { formatTimestampIST } from '../utils/dateUtils';
import { soundEffects, triggerConfetti } from '../utils/soundAndEffects';
import { Check, Clock, Award, ShieldAlert, AlertCircle } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  plan: DailyPlan;
  completions: TaskCompletion[];
  activeUserId: string;
  activeUserName: string;
  onComplete: (task: Task) => Promise<void>;
  isReadOnly?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  plan,
  completions,
  activeUserId,
  activeUserName,
  onComplete,
  isReadOnly = false,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check completions for all 4 squad members
  const memberCompletionMap = new Map<string, TaskCompletion>();
  completions.forEach((c) => {
    if (c.taskId === task.id) {
      memberCompletionMap.set(c.userId, c);
    }
  });

  const isCompletedByActiveUser = memberCompletionMap.has(activeUserId);
  const activeUserCompletion = memberCompletionMap.get(activeUserId);

  const handleMarkCompleted = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!plan.isLocked) {
      setErrorMessage('The daily plan must be locked before marking tasks as completed.');
      return;
    }
    if (isCompletedByActiveUser || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      // Play pleasant audio chord
      soundEffects.playCompleteTask();

      // Trigger celebratory confetti around the click origin
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const originX = (rect.left + rect.width / 2) / window.innerWidth;
      const originY = (rect.top + rect.height / 2) / window.innerHeight;
      triggerConfetti(originX, originY);

      await onComplete(task);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to mark task as completed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const difficultyColors = {
    Easy: 'text-emerald-400 bg-emerald-950/50 border-emerald-800/50',
    Medium: 'text-amber-400 bg-amber-950/50 border-amber-800/50',
    Hard: 'text-rose-400 bg-rose-950/50 border-rose-800/50',
  };

  const totalMembersCompleted = memberCompletionMap.size;
  const isAllSquadCompleted = totalMembersCompleted === 4;

  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${
        isAllSquadCompleted
          ? 'bg-neutral-900/90 border-emerald-500/30 shadow-lg shadow-emerald-950/10'
          : isCompletedByActiveUser
          ? 'bg-neutral-900/70 border-neutral-700/60'
          : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
      } p-4 sm:p-5`}
    >
      {/* Top Header: Subject, Points, Difficulty */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">
            {task.subject}
          </span>
          <span className="text-neutral-600">·</span>
          <span
            className={`text-xs px-2 py-0.5 rounded border font-medium ${
              difficultyColors[task.difficulty] || difficultyColors.Medium
            }`}
          >
            {task.difficulty}
          </span>
        </div>

        {/* Points Display */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono font-bold text-xs tracking-tight">
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>+{task.points} PTS</span>
        </div>
      </div>

      {/* Topic Title & Description */}
      <div className="mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-neutral-100 tracking-tight leading-snug">
          {task.title}
        </h3>
        {task.description && (
          <p className="mt-1 text-xs sm:text-sm text-neutral-400 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* 4 Members' Completion Status Grid */}
      <div className="pt-3 border-t border-neutral-800/80 mb-4">
        <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
          <span>Squad Completion Status</span>
          <span className="font-mono font-medium text-neutral-300">
            {totalMembersCompleted}/4 Completed
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SQUAD_MEMBERS.map((member) => {
            const completion = memberCompletionMap.get(member.id);
            const isCompleted = !!completion;
            const isMe = member.id === activeUserId;

            return (
              <div
                key={member.id}
                className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between transition-colors ${
                  isCompleted
                    ? 'bg-emerald-950/30 border-emerald-800/40 text-neutral-200'
                    : 'bg-neutral-950/60 border-neutral-800/60 text-neutral-400'
                } ${isMe ? 'ring-1 ring-indigo-500/40' : ''}`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <UserAvatar userIdOrName={member.id} size="sm" />
                  <div className="truncate">
                    <span className="font-medium text-neutral-200 block truncate">
                      {member.displayName}
                    </span>
                    {isMe && (
                      <span className="text-[10px] text-indigo-400 font-mono uppercase block -mt-0.5">
                        (You)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-1 pt-1 border-t border-neutral-800/50">
                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                      <Check className="w-3 h-3 stroke-[3]" /> Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500 font-medium">
                      <Clock className="w-3 h-3" /> Pending
                    </span>
                  )}

                  {isCompleted && completion && (
                    <span
                      className="text-[10px] text-neutral-500 font-mono truncate max-w-[60px]"
                      title={`Completed at ${formatTimestampIST(completion.completedAt)}`}
                    >
                      +{completion.pointsAwarded}p
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action / Completion Button for the Logged-In User */}
      {!isReadOnly && plan.isLocked && (
        <div className="mt-3">
          {isCompletedByActiveUser ? (
            <div className="w-full py-2.5 px-4 rounded-lg bg-emerald-950/40 border border-emerald-800/50 flex items-center justify-between text-xs text-emerald-300">
              <span className="flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                You completed this topic!
              </span>
              <span className="font-mono text-emerald-400 font-bold">
                +{activeUserCompletion?.pointsAwarded || task.points} PTS EARNED
              </span>
            </div>
          ) : (
            <button
              onClick={handleMarkCompleted}
              disabled={isSubmitting}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Mark My Task Completed (+{task.points} pts)</span>
            </button>
          )}

          {errorMessage && (
            <div className="mt-2 text-xs text-rose-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      )}

      {!plan.isLocked && (
        <div className="mt-2 text-xs text-amber-400/90 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span>Plan is currently in draft. Once locked, squad members can mark tasks completed.</span>
        </div>
      )}
    </div>
  );
};
