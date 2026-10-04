import React from 'react';
import { ActivityLogItem } from '../types';
import { UserAvatar } from './UserAvatar';
import { formatTimestampIST, formatRelativeTime } from '../utils/dateUtils';
import { CheckCircle, Lock, Trophy, Sparkles, Activity } from 'lucide-react';

interface ActivityFeedProps {
  activities: ActivityLogItem[];
  maxItems?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  maxItems = 15,
}) => {
  const displayItems = activities.slice(0, maxItems);

  const getActionBadge = (item: ActivityLogItem) => {
    switch (item.actionType) {
      case 'task_completed':
        return (
          <div className="w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle className="w-3.5 h-3.5" />
          </div>
        );
      case 'plan_locked':
        return (
          <div className="w-7 h-7 rounded-lg bg-amber-950/60 border border-amber-800/60 text-amber-400 flex items-center justify-center shrink-0">
            <Lock className="w-3.5 h-3.5" />
          </div>
        );
      case 'achievement_unlocked':
        return (
          <div className="w-7 h-7 rounded-lg bg-purple-950/60 border border-purple-800/60 text-purple-400 flex items-center justify-center shrink-0">
            <Trophy className="w-3.5 h-3.5" />
          </div>
        );
      default:
        return (
          <div className="w-7 h-7 rounded-lg bg-indigo-950/60 border border-indigo-800/60 text-indigo-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  return (
    <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Live Activity Feed</span>
        </h3>
        <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          Realtime
        </span>
      </div>

      {displayItems.length === 0 ? (
        <div className="py-8 text-center text-xs text-neutral-400">
          No activities recorded yet. When squad members complete topics, updates will stream live
          here!
        </div>
      ) : (
        <div className="space-y-3">
          {displayItems.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-neutral-950/50 border border-neutral-800/60 flex items-start gap-3 transition-colors hover:border-neutral-700/60"
            >
              {getActionBadge(item)}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-neutral-200 truncate">
                    {item.userName}
                  </span>
                  <span
                    className="text-[10px] text-neutral-400 font-mono shrink-0"
                    title={formatTimestampIST(item.createdAt)}
                  >
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </div>

                <p className="text-xs text-neutral-300 mt-0.5 leading-snug">
                  {item.message}
                </p>

                {item.points && item.points > 0 ? (
                  <span className="inline-block mt-1 text-[11px] font-mono font-bold text-amber-400">
                    +{item.points} PTS
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
