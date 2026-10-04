import React, { useState, useEffect, useCallback } from 'react';
import {
  DailyPlan,
  Task,
  TaskCompletion,
  MemberStats,
  ActivityLogItem,
  SquadMemberConfig,
  LeaderboardTimeframe,
  SQUAD_MEMBERS,
  TaskDraft
} from './types';
import { dataService } from './services/dataService';
import { getTodayDateIST } from './utils/dateUtils';
import { triggerBigWinConfetti } from './utils/soundAndEffects';

// Components
import { Navbar, NavTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { DailyPlanView } from './components/DailyPlanView';
import { LeaderboardView } from './components/LeaderboardView';
import { HistoryView } from './components/HistoryView';
import { StatisticsView } from './components/StatisticsView';
import { ProfileView } from './components/ProfileView';
import { CreatePlanModal } from './components/CreatePlanModal';
import { AuthModal } from './components/AuthModal';
import { SupabaseSetupModal } from './components/SupabaseSetupModal';
import { AiStudyAssistantModal } from './components/AiStudyAssistantModal';

// Icons for mobile bottom bar
import {
  LayoutDashboard,
  Layers,
  Trophy,
  Calendar,
  BarChart3,
  User,
  Database,
  Bell
} from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [activeUser, setActiveUser] = useState<SquadMemberConfig>(() => dataService.getActiveUser());

  // Data states
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [stats, setStats] = useState<MemberStats[]>([]);
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [leaderboardTimeframe, setLeaderboardTimeframe] = useState<LeaderboardTimeframe>('all');

  // Modals
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isAiHelperOpen, setIsAiHelperOpen] = useState(false);

  // Live Toast Notification
  const [toastNotification, setToastNotification] = useState<{
    title: string;
    body: string;
    type: string;
  } | null>(null);

  // Load all today's data
  const refreshData = useCallback(async () => {
    try {
      const todayIST = getTodayDateIST();
      const planRes = await dataService.getDailyPlan(todayIST);
      setPlan(planRes.plan);
      setTasks(planRes.tasks);

      if (planRes.plan) {
        const comps = await dataService.getCompletionsForPlan(planRes.plan.id);
        setCompletions(comps);
      } else {
        setCompletions([]);
      }

      const lb = await dataService.getLeaderboard(leaderboardTimeframe);
      setStats(lb);

      const recAct = await dataService.getRecentActivity(25);
      setActivities(recAct);
    } catch (e) {
      console.error('Data refresh error:', e);
    }
  }, [leaderboardTimeframe]);

  useEffect(() => {
    refreshData();

    // Subscribe to live updates (Supabase Realtime or Broadcast Channel)
    const unsubscribeSync = dataService.subscribe(() => {
      refreshData();
    });

    const unsubscribeNotifications = dataService.onNotification((notif) => {
      setToastNotification(notif);
      if (notif.type === 'lock' || notif.type === 'achievement') {
        triggerBigWinConfetti();
      }
      setTimeout(() => {
        setToastNotification((cur) => (cur === notif ? null : cur));
      }, 5000);
    });

    return () => {
      unsubscribeSync();
      unsubscribeNotifications();
    };
  }, [refreshData]);

  // Handle User Switch
  const handleSelectUser = (username: string) => {
    const found = SQUAD_MEMBERS.find((m) => m.username === username);
    if (found) {
      setActiveUser(found);
      dataService.setActiveUser(found.username);
      refreshData();
    }
  };

  // Handle Save / Lock Daily Plan
  const handleSavePlan = async (taskDrafts: TaskDraft[], lockNow: boolean) => {
    const todayIST = getTodayDateIST();
    const res = await dataService.saveDailyPlanDraft(
      todayIST,
      activeUser.id,
      activeUser.displayName,
      taskDrafts,
      lockNow
    );
    setPlan(res.plan);
    setTasks(res.tasks);
    await refreshData();
  };

  // Handle Marking Task Completed
  const handleCompleteTask = async (task: Task) => {
    if (!plan) return;
    await dataService.markTaskCompleted(task, plan, activeUser.id, activeUser.displayName);
    await refreshData();
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeUser={activeUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenSupabaseSetup={() => setIsSupabaseModalOpen(true)}
        onOpenAiHelper={() => setIsAiHelperOpen(true)}
      />

      {/* Real-Time Live Toast Notification */}
      {toastNotification && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm w-full bg-neutral-900 border border-indigo-500/50 rounded-2xl shadow-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-8 h-8 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 animate-bounce" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-neutral-100">{toastNotification.title}</h4>
            <p className="text-xs text-neutral-300 mt-0.5 leading-snug">
              {toastNotification.body}
            </p>
          </div>
          <button
            onClick={() => setToastNotification(null)}
            className="text-neutral-500 hover:text-neutral-300 text-xs p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-12">
        {currentTab === 'dashboard' && (
          <DashboardView
            plan={plan}
            tasks={tasks}
            completions={completions}
            stats={stats}
            activities={activities}
            activeUser={activeUser}
            onOpenCreatePlan={() => setIsCreatePlanOpen(true)}
            onCompleteTask={handleCompleteTask}
            onNavigateToLeaderboard={() => setCurrentTab('leaderboard')}
          />
        )}

        {currentTab === 'daily_plan' && (
          <DailyPlanView
            plan={plan}
            tasks={tasks}
            completions={completions}
            activeUser={activeUser}
            onOpenCreateModal={() => setIsCreatePlanOpen(true)}
            onCompleteTask={handleCompleteTask}
          />
        )}

        {currentTab === 'leaderboard' && (
          <LeaderboardView
            stats={stats}
            activeUserId={activeUser.id}
            timeframe={leaderboardTimeframe}
            onTimeframeChange={(tf) => setLeaderboardTimeframe(tf)}
          />
        )}

        {currentTab === 'history' && (
          <HistoryView
            activeUserId={activeUser.id}
            activeUserName={activeUser.displayName}
          />
        )}

        {currentTab === 'statistics' && <StatisticsView stats={stats} />}

        {currentTab === 'profile' && (
          <ProfileView
            initialMemberId={activeUser.id}
            onSwitchActiveUser={handleSelectUser}
          />
        )}
      </main>

      {/* Ergonomic Mobile Bottom Nav Bar (Thumb zone reach) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-md border-t border-neutral-800 grid grid-cols-6 items-center h-16 px-1">
        {[
          { id: 'dashboard', label: 'Dash', icon: <LayoutDashboard className="w-5 h-5" /> },
          { id: 'daily_plan', label: 'Plan', icon: <Layers className="w-5 h-5" /> },
          { id: 'leaderboard', label: 'Ranks', icon: <Trophy className="w-5 h-5" /> },
          { id: 'history', label: 'History', icon: <Calendar className="w-5 h-5" /> },
          { id: 'statistics', label: 'Stats', icon: <BarChart3 className="w-5 h-5" /> },
          { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
        ].map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id as NavTab)}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                isActive ? 'text-indigo-400 font-bold' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {tab.icon}
              <span className="text-[10px] mt-1 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Modals */}
      <CreatePlanModal
        isOpen={isCreatePlanOpen}
        onClose={() => setIsCreatePlanOpen(false)}
        existingPlan={plan}
        existingTasks={tasks}
        activeUserId={activeUser.id}
        activeUserName={activeUser.displayName}
        onSave={handleSavePlan}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        activeUser={activeUser}
        onSelectUser={handleSelectUser}
      />

      <SupabaseSetupModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />

      <AiStudyAssistantModal
        isOpen={isAiHelperOpen}
        onClose={() => setIsAiHelperOpen(false)}
      />
    </div>
  );
}
