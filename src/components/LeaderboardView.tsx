import React, { useState } from 'react';
import { MemberStats, LeaderboardTimeframe, SQUAD_MEMBERS } from '../types';
import { UserAvatar } from './UserAvatar';
import { Trophy, Flame, CheckCircle, Zap, Shield, Sparkles } from 'lucide-react';

interface LeaderboardViewProps {
  stats: MemberStats[];
  activeUserId: string;
  timeframe: LeaderboardTimeframe;
  onTimeframeChange: (tf: LeaderboardTimeframe) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  stats,
  activeUserId,
  timeframe,
  onTimeframeChange,
}) => {
  const getPointsForTimeframe = (m: MemberStats) => {
    switch (timeframe) {
      case 'today':
        return m.todayPoints;
      case 'week':
        return m.weekPoints;
      case 'month':
        return m.monthPoints;
      case 'all':
      default:
        return m.totalPoints;
    }
  };

  const rankAccents = [
    {
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      cardBorder: 'border-amber-500/40 bg-gradient-to-r from-amber-950/20 via-neutral-900 to-neutral-900',
      label: '1st',
      title: 'Squad Champion',
      icon: '👑',
    },
    {
      badgeBg: 'bg-slate-300/20 text-slate-200 border-slate-400/40',
      cardBorder: 'border-slate-500/30 bg-neutral-900/90',
      label: '2nd',
      title: 'Runner Up',
      icon: '🥈',
    },
    {
      badgeBg: 'bg-amber-700/20 text-amber-400 border-amber-700/40',
      cardBorder: 'border-amber-700/30 bg-neutral-900/90',
      label: '3rd',
      title: 'Podium Finisher',
      icon: '🥉',
    },
    {
      badgeBg: 'bg-neutral-800 text-neutral-400 border-neutral-700',
      cardBorder: 'border-neutral-800 bg-neutral-900/60',
      label: '4th',
      title: 'Challenger',
      icon: '⚡',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Timeframe Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-indigo-400">
            Real-Time Study Squad Rankings
          </span>
          <h2 className="text-2xl font-bold text-neutral-100 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <span>Competitive Leaderboard</span>
          </h2>
        </div>

        {/* Timeframe Segmented Controls */}
        <div className="flex items-center p-1 bg-neutral-900 border border-neutral-800 rounded-xl">
          {(
            [
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
              { id: 'all', label: 'All Time' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => onTimeframeChange(t.id)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                timeframe === t.id
                  ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Cards */}
      <div className="space-y-3">
        {stats.map((member, index) => {
          const accent = rankAccents[index] || rankAccents[3];
          const isCurrentUser = member.userId === activeUserId;
          const displayPoints = getPointsForTimeframe(member);
          const memberConfig = SQUAD_MEMBERS.find((m) => m.id === member.userId);

          return (
            <div
              key={member.userId}
              className={`relative rounded-xl border p-4 sm:p-5 transition-all ${
                accent.cardBorder
              } ${
                isCurrentUser ? 'ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-950/20' : ''
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Left zone: Rank, Avatar, Name & Bio */}
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Rank Number & Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl border flex flex-col items-center justify-center font-mono font-bold shrink-0 ${accent.badgeBg}`}
                  >
                    <span className="text-xs leading-none">{accent.icon}</span>
                    <span className="text-xs">{accent.label}</span>
                  </div>

                  <UserAvatar userIdOrName={member.userId} size="lg" />

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-neutral-100">
                        {member.displayName}
                      </h3>
                      {isCurrentUser && (
                        <span className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          YOU
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">
                      {memberConfig?.bio || 'Study Squad Member'}
                    </p>
                  </div>
                </div>

                {/* Right zone: Numerical Metrics */}
                <div className="flex items-center justify-between sm:justify-end gap-5 sm:gap-8 pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-800">
                  {/* Streak */}
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-neutral-400 block">Streak</span>
                    <div className="flex items-center sm:justify-end gap-1 font-mono font-semibold text-xs sm:text-sm text-amber-400">
                      <Flame className="w-3.5 h-3.5 fill-amber-400/20" />
                      <span>{member.currentStreak}d</span>
                      <span className="text-[10px] text-neutral-500 font-normal">
                        (max {member.longestStreak})
                      </span>
                    </div>
                  </div>

                  {/* Tasks Completed */}
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-neutral-400 block">Tasks Done</span>
                    <div className="flex items-center sm:justify-end gap-1 font-mono font-semibold text-xs sm:text-sm text-emerald-400">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{member.tasksCompleted}</span>
                    </div>
                  </div>

                  {/* Points for Selected Timeframe */}
                  <div className="text-right min-w-[90px]">
                    <span className="text-[11px] text-neutral-400 block uppercase">
                      {timeframe === 'all' ? 'All-Time Pts' : `${timeframe} Pts`}
                    </span>
                    <span className="text-xl sm:text-2xl font-mono font-extrabold text-amber-300 tracking-tight">
                      +{displayPoints}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Verification note */}
      <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Rankings are computed dynamically from verified task completions. Points cannot be
            artificially injected.
          </span>
        </div>
        <span className="text-[11px] text-neutral-400 font-mono">
          Sync: Realtime Active
        </span>
      </div>
    </div>
  );
};
