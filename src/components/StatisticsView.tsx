import React, { useState, useEffect } from 'react';
import { MemberStats, SQUAD_MEMBERS } from '../types';
import { dataService } from '../services/dataService';
import { UserAvatar } from './UserAvatar';
import { BarChart3, TrendingUp, Award, CheckCircle, Flame, BookOpen } from 'lucide-react';

interface StatisticsViewProps {
  stats: MemberStats[];
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({ stats }) => {
  const [subjectDistribution, setSubjectDistribution] = useState<{ subject: string; count: number; totalPoints: number }[]>([]);

  useEffect(() => {
    loadSubjectData();
  }, []);

  const loadSubjectData = async () => {
    try {
      const dates = await dataService.getAllPlansWithDates();
      const subjectMap = new Map<string, { count: number; totalPoints: number }>();

      for (const d of dates) {
        const { tasks } = await dataService.getDailyPlan(d.planDate);
        tasks.forEach((t) => {
          const s = t.subject.trim().toUpperCase();
          const cur = subjectMap.get(s) || { count: 0, totalPoints: 0 };
          subjectMap.set(s, { count: cur.count + 1, totalPoints: cur.totalPoints + t.points });
        });
      }

      const list = Array.from(subjectMap.entries()).map(([subject, data]) => ({
        subject,
        count: data.count,
        totalPoints: data.totalPoints,
      })).sort((a, b) => b.totalPoints - a.totalPoints);

      setSubjectDistribution(list);
    } catch (e) {
      console.error(e);
    }
  };

  const totalSquadPoints = stats.reduce((sum, s) => sum + s.totalPoints, 0);
  const totalTasksCompleted = stats.reduce((sum, s) => sum + s.tasksCompleted, 0);
  const maxStreak = Math.max(...stats.map((s) => s.longestStreak), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div>
        <span className="text-xs font-mono uppercase tracking-wider text-indigo-400">
          Squad Intelligence & Performance
        </span>
        <h2 className="text-2xl font-bold text-neutral-100 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-400" />
          <span>Squad Statistics</span>
        </h2>
      </div>

      {/* Aggregate Squad Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Cumulative Squad Points</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-amber-300">
            +{totalSquadPoints}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            Points earned collectively across all sessions
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Total Topics Conquered</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-emerald-300">
            {totalTasksCompleted}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            Individual task completions logged
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Record Squad Streak</span>
            <Flame className="w-4 h-4 text-orange-400 fill-orange-400/20" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-orange-300">
            {maxStreak} <span className="text-sm font-normal text-neutral-400">days</span>
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            Longest unbroken study habit by any member
          </div>
        </div>
      </div>

      {/* Comparative Head-to-Head Table */}
      <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 overflow-x-auto">
        <h3 className="text-base font-bold text-neutral-100 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          <span>Head-to-Head Squad Matrix</span>
        </h3>

        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-neutral-800 text-neutral-400 uppercase font-mono text-[11px]">
              <th className="pb-3 font-semibold">Member</th>
              <th className="pb-3 font-semibold text-right">Today Pts</th>
              <th className="pb-3 font-semibold text-right">Week Pts</th>
              <th className="pb-3 font-semibold text-right">All-Time</th>
              <th className="pb-3 font-semibold text-right">Tasks Done</th>
              <th className="pb-3 font-semibold text-right">Current Streak</th>
              <th className="pb-3 font-semibold text-right">Max Streak</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {stats.map((m) => (
              <tr key={m.userId} className="hover:bg-neutral-800/30 transition-colors">
                <td className="py-3.5 pr-4">
                  <div className="flex items-center gap-2.5">
                    <UserAvatar userIdOrName={m.userId} size="sm" />
                    <div>
                      <span className="font-semibold text-neutral-200 block">{m.displayName}</span>
                      <span className="text-[10px] text-neutral-400 font-mono">@{m.userName}</span>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 text-right font-mono font-medium text-amber-400">
                  +{m.todayPoints}
                </td>
                <td className="py-3.5 text-right font-mono font-medium text-amber-300">
                  +{m.weekPoints}
                </td>
                <td className="py-3.5 text-right font-mono font-bold text-amber-300">
                  +{m.totalPoints}
                </td>
                <td className="py-3.5 text-right font-mono text-emerald-400">
                  {m.tasksCompleted}
                </td>
                <td className="py-3.5 text-right font-mono text-orange-400">
                  {m.currentStreak}d
                </td>
                <td className="py-3.5 text-right font-mono text-neutral-400">
                  {m.longestStreak}d
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Subject Distribution */}
      {subjectDistribution.length > 0 && (
        <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800">
          <h3 className="text-base font-bold text-neutral-100 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>Manually Planned Subjects & Points Distribution</span>
          </h3>

          <div className="space-y-3">
            {subjectDistribution.map((item) => {
              const maxPts = subjectDistribution[0]?.totalPoints || 1;
              const pct = Math.round((item.totalPoints / maxPts) * 100);

              return (
                <div key={item.subject} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-200">{item.subject}</span>
                    <span className="font-mono text-neutral-400">
                      {item.count} topics · +{item.totalPoints} pts
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-950 overflow-hidden border border-neutral-800">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
