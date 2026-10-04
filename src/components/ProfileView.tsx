import React, { useState, useEffect } from 'react';
import { MemberStats, SQUAD_MEMBERS, UserAchievement, Achievement } from '../types';
import { INITIAL_ACHIEVEMENTS } from '../data/achievements';
import { dataService } from '../services/dataService';
import { UserAvatar } from './UserAvatar';
import { formatTimestampIST } from '../utils/dateUtils';
import {
  Award,
  Flame,
  CheckCircle,
  Percent,
  Calendar,
  Sparkles,
  Trophy,
  Zap,
  BookOpen,
  ShieldAlert,
  Crown,
  Lock
} from 'lucide-react';

interface ProfileViewProps {
  initialMemberId: string;
  onSwitchActiveUser: (username: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  initialMemberId,
  onSwitchActiveUser,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(initialMemberId);
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfileData(selectedMemberId);
  }, [selectedMemberId]);

  const loadProfileData = async (memberId: string) => {
    setIsLoading(true);
    try {
      const s = await dataService.getMemberStats(memberId);
      const ach = await dataService.getUserAchievements(memberId);
      setStats(s);
      setUserAchievements(ach);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedMember = SQUAD_MEMBERS.find((m) => m.id === selectedMemberId) || SQUAD_MEMBERS[0];
  const unlockedAchievementSet = new Set(userAchievements.map((ua) => ua.achievementId));

  const getAchievementIcon = (name: string, isUnlocked: boolean) => {
    const className = `w-5 h-5 ${isUnlocked ? 'text-amber-400' : 'text-neutral-500'}`;
    switch (name) {
      case 'Zap':
        return <Zap className={className} />;
      case 'Award':
        return <Award className={className} />;
      case 'Flame':
        return <Flame className={className} />;
      case 'ShieldAlert':
        return <ShieldAlert className={className} />;
      case 'BookOpen':
        return <BookOpen className={className} />;
      case 'Trophy':
        return <Trophy className={className} />;
      case 'Crown':
        return <Crown className={className} />;
      case 'Sparkles':
      default:
        return <Sparkles className={className} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 Member Tabs Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 p-1 bg-neutral-900 border border-neutral-800 rounded-xl">
        {SQUAD_MEMBERS.map((m) => {
          const isSelected = m.id === selectedMemberId;
          return (
            <button
              key={m.id}
              onClick={() => setSelectedMemberId(m.id)}
              className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-neutral-800 text-neutral-100 shadow-sm border border-neutral-700/60'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <UserAvatar userIdOrName={m.id} size="sm" />
              <span className="truncate">{m.displayName}</span>
            </button>
          );
        })}
      </div>

      {/* Main Profile Card */}
      {stats && (
        <div className="p-6 sm:p-8 rounded-2xl bg-neutral-900/80 border border-neutral-800 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-neutral-800">
            <div className="flex items-center gap-4 sm:gap-5">
              <UserAvatar userIdOrName={selectedMember.id} size="xl" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-neutral-100">
                    {selectedMember.displayName}
                  </h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                    @{selectedMember.username}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-md">
                  {selectedMember.bio}
                </p>
              </div>
            </div>

            <button
              onClick={() => onSwitchActiveUser(selectedMember.username)}
              className="py-2 px-4 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium border border-indigo-500/30 transition-colors cursor-pointer self-start sm:self-center"
            >
              Log in as {selectedMember.displayName}
            </button>
          </div>

          {/* Core Stat Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
            <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800/80">
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                <span>Total Points</span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-300">
                +{stats.totalPoints}
              </div>
              <div className="text-[11px] text-neutral-400 mt-1">
                Today: +{stats.todayPoints}p · Week: +{stats.weekPoints}p
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800/80">
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                <span>Tasks Completed</span>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-300">
                {stats.tasksCompleted}
              </div>
              <div className="text-[11px] text-neutral-400 mt-1">
                Conquered study topics
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800/80">
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                <span>Current Streak</span>
                <Flame className="w-4 h-4 text-orange-400 fill-orange-400/20" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-orange-300">
                {stats.currentStreak} <span className="text-sm font-normal text-neutral-400">days</span>
              </div>
              <div className="text-[11px] text-neutral-400 mt-1">
                Personal best: {stats.longestStreak} days
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800/80">
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                <span>Completion Rate</span>
                <Percent className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-indigo-300">
                {stats.completionRate}%
              </div>
              <div className="text-[11px] text-neutral-400 mt-1">
                Of all group study plans
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Badges and Achievements */}
      <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>Squad Badges & Milestones</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Unlocked automatically as you conquer study goals and maintain streaks.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-amber-400 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20">
            {unlockedAchievementSet.size} / {INITIAL_ACHIEVEMENTS.length} UNLOCKED
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {INITIAL_ACHIEVEMENTS.map((ach) => {
            const isUnlocked = unlockedAchievementSet.has(ach.id);
            const userAch = userAchievements.find((ua) => ua.achievementId === ach.id);

            return (
              <div
                key={ach.id}
                className={`p-4 rounded-xl border transition-all ${
                  isUnlocked
                    ? 'bg-amber-950/20 border-amber-500/30 shadow-md shadow-amber-950/10'
                    : 'bg-neutral-950/40 border-neutral-800/60 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div
                    className={`w-9 h-9 rounded-lg border flex items-center justify-center ${
                      isUnlocked
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-neutral-900 border-neutral-800'
                    }`}
                  >
                    {getAchievementIcon(ach.iconName, isUnlocked)}
                  </div>
                  {isUnlocked ? (
                    <span className="text-[10px] font-mono text-emerald-400 font-semibold px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800">
                      UNLOCKED
                    </span>
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-neutral-600" />
                  )}
                </div>

                <h4 className="text-sm font-bold text-neutral-200">{ach.title}</h4>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  {ach.description}
                </p>

                {isUnlocked && userAch && (
                  <div className="mt-3 pt-2 border-t border-neutral-800/60 text-[10px] text-neutral-500 font-mono">
                    Unlocked: {formatTimestampIST(userAch.unlockedAt)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
