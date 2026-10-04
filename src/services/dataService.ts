import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  DailyPlan,
  Task,
  TaskCompletion,
  ActivityLogItem,
  MemberStats,
  LeaderboardTimeframe,
  SQUAD_MEMBERS,
  UserAchievement,
  TaskDraft
} from '../types';
import { INITIAL_ACHIEVEMENTS } from '../data/achievements';
import { getTodayDateIST, getStartOfWeekIST, getStartOfMonthIST } from '../utils/dateUtils';

// Local storage keys
const STORAGE_KEYS = {
  SUPABASE_URL: 'study_squad_supabase_url',
  SUPABASE_ANON_KEY: 'study_squad_supabase_anon_key',
  ACTIVE_USER: 'study_squad_active_user',
  DAILY_PLANS: 'study_squad_daily_plans',
  TASKS: 'study_squad_tasks',
  COMPLETIONS: 'study_squad_completions',
  ACTIVITY_LOG: 'study_squad_activity_log',
  USER_ACHIEVEMENTS: 'study_squad_user_achievements',
};

// Broadcast channel for multi-tab sync when running in browser mode
const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('study_squad_realtime_bus')
  : null;

class DataService {
  private supabase: SupabaseClient | null = null;
  private isConfigured: boolean = false;
  private listeners: Set<() => void> = new Set();
  private notificationListeners: Set<(msg: { title: string; body: string; type: 'completion' | 'lock' | 'achievement' }) => void> = new Set();

  constructor() {
    this.initSupabase();

    if (syncChannel) {
      syncChannel.onmessage = (event) => {
        if (event.data?.type === 'SYNC_UPDATE') {
          this.notifyListeners();
          if (event.data.notification) {
            this.notifyNotificationListeners(event.data.notification);
          }
        }
      };
    }
  }

  public initSupabase(): boolean {
    const envUrl = import.meta.env.VITE_SUPABASE_URL;
    const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const storedUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) : null;
    const storedKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.SUPABASE_ANON_KEY) : null;

    const url = storedUrl || envUrl;
    const key = storedKey || envKey;

    if (url && key && url.startsWith('http')) {
      try {
        this.supabase = createClient(url, key, {
          auth: { persistSession: true },
          realtime: { params: { eventsPerSecond: 10 } },
        });
        this.isConfigured = true;
        this.setupRealtimeSubscriptions();
        return true;
      } catch (err) {
        console.error('Failed to initialize Supabase client:', err);
        this.isConfigured = false;
        return false;
      }
    }
    this.isConfigured = false;
    return false;
  }

  public getIsConfigured(): boolean {
    return this.isConfigured;
  }

  public getSupabaseClient(): SupabaseClient | null {
    return this.supabase;
  }

  public saveSupabaseCredentials(url: string, anonKey: string): boolean {
    if (!url || !anonKey) {
      localStorage.removeItem(STORAGE_KEYS.SUPABASE_URL);
      localStorage.removeItem(STORAGE_KEYS.SUPABASE_ANON_KEY);
      this.supabase = null;
      this.isConfigured = false;
      this.notifyListeners();
      return false;
    }
    localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, url.trim());
    localStorage.setItem(STORAGE_KEYS.SUPABASE_ANON_KEY, anonKey.trim());
    const ok = this.initSupabase();
    this.notifyListeners();
    return ok;
  }

  public subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  public onNotification(cb: (msg: { title: string; body: string; type: 'completion' | 'lock' | 'achievement' }) => void) {
    this.notificationListeners.add(cb);
    return () => this.notificationListeners.delete(cb);
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => {
      try { cb(); } catch (e) { console.error(e); }
    });
  }

  private notifyNotificationListeners(msg: { title: string; body: string; type: 'completion' | 'lock' | 'achievement' }) {
    this.notificationListeners.forEach((cb) => {
      try { cb(msg); } catch (e) { console.error(e); }
    });
  }

  private broadcastChange(notification?: { title: string; body: string; type: 'completion' | 'lock' | 'achievement' }) {
    this.notifyListeners();
    if (notification) {
      this.notifyNotificationListeners(notification);
    }
    if (syncChannel) {
      syncChannel.postMessage({ type: 'SYNC_UPDATE', notification });
    }
  }

  private setupRealtimeSubscriptions() {
    if (!this.supabase) return;

    try {
      this.supabase
        .channel('study-squad-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'task_completions' }, (payload) => {
          this.broadcastChange();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_plans' }, (payload) => {
          this.broadcastChange();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
          this.broadcastChange();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_log' }, (payload) => {
          this.broadcastChange();
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime subscription error:', e);
    }
  }

  // ============================================================================
  // DAILY PLANS & TASKS
  // ============================================================================

  public async getDailyPlan(dateStr: string): Promise<{ plan: DailyPlan | null; tasks: Task[] }> {
    if (this.isConfigured && this.supabase) {
      try {
        const { data: planData, error: planError } = await this.supabase
          .from('daily_plans')
          .select('*')
          .eq('plan_date', dateStr)
          .maybeSingle();

        if (planError && planError.code !== 'PGRST116') {
          console.error('Error fetching plan from Supabase:', planError);
        }

        if (!planData) {
          return { plan: null, tasks: [] };
        }

        const { data: taskData } = await this.supabase
          .from('tasks')
          .select('*')
          .eq('plan_id', planData.id)
          .order('order_index', { ascending: true });

        const mappedPlan: DailyPlan = {
          id: planData.id,
          planDate: planData.plan_date,
          createdBy: planData.created_by,
          createdByName: planData.created_by_name,
          isLocked: planData.is_locked,
          lockedAt: planData.locked_at,
          lockedBy: planData.locked_by,
          lockedByName: planData.locked_by_name,
          createdAt: planData.created_at,
          updatedAt: planData.updated_at,
        };

        const mappedTasks: Task[] = (taskData || []).map((t: any) => ({
          id: t.id,
          planId: t.plan_id,
          subject: t.subject,
          title: t.title,
          description: t.description || undefined,
          difficulty: t.difficulty,
          points: t.points,
          orderIndex: t.order_index,
          createdAt: t.created_at,
        }));

        return { plan: mappedPlan, tasks: mappedTasks };
      } catch (e) {
        console.error('Supabase query failed, falling back to local storage:', e);
      }
    }

    // Local storage fallback
    const allPlans: DailyPlan[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.DAILY_PLANS) || '[]');
    const allTasks: Task[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');

    const plan = allPlans.find((p) => p.planDate === dateStr) || null;
    const tasks = plan ? allTasks.filter((t) => t.planId === plan.id).sort((a, b) => a.orderIndex - b.orderIndex) : [];

    return { plan, tasks };
  }

  public async getAllPlansWithDates(): Promise<{ planDate: string; isLocked: boolean; taskCount: number }[]> {
    if (this.isConfigured && this.supabase) {
      try {
        const { data: plans } = await this.supabase
          .from('daily_plans')
          .select('id, plan_date, is_locked')
          .order('plan_date', { ascending: false });

        if (plans) {
          const { data: tasks } = await this.supabase.from('tasks').select('plan_id');
          const taskCountMap = new Map<string, number>();
          (tasks || []).forEach((t: any) => {
            taskCountMap.set(t.plan_id, (taskCountMap.get(t.plan_id) || 0) + 1);
          });

          return plans.map((p: any) => ({
            planDate: p.plan_date,
            isLocked: p.is_locked,
            taskCount: taskCountMap.get(p.id) || 0,
          }));
        }
      } catch (e) {
        console.error('Error fetching all plans:', e);
      }
    }

    const allPlans: DailyPlan[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.DAILY_PLANS) || '[]');
    const allTasks: Task[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
    return allPlans.map((p) => ({
      planDate: p.planDate,
      isLocked: p.isLocked,
      taskCount: allTasks.filter((t) => t.planId === p.id).length,
    })).sort((a, b) => b.planDate.localeCompare(a.planDate));
  }

  /**
   * Create or update daily plan draft.
   * STRICT ENFORCEMENT: Never allows editing if plan is locked!
   */
  public async saveDailyPlanDraft(
    dateStr: string,
    authorId: string,
    authorName: string,
    taskDrafts: TaskDraft[],
    lockNow: boolean = false
  ): Promise<{ plan: DailyPlan; tasks: Task[] }> {
    const existing = await this.getDailyPlan(dateStr);
    if (existing.plan && existing.plan.isLocked) {
      throw new Error('Database Security Violation: This daily plan is permanently locked and cannot be modified.');
    }

    if (taskDrafts.length === 0) {
      throw new Error('Please add at least one topic to the study plan.');
    }

    // Validate points
    for (const t of taskDrafts) {
      if (!t.subject.trim()) throw new Error('Subject name cannot be empty.');
      if (!t.title.trim()) throw new Error('Topic name cannot be empty.');
      if (t.points <= 0 || !Number.isInteger(t.points)) {
        throw new Error(`Points for "${t.title}" must be a positive integer.`);
      }
    }

    const planId = existing.plan ? existing.plan.id : (crypto.randomUUID ? crypto.randomUUID() : `plan-${Date.now()}`);
    const nowIso = new Date().toISOString();

    const plan: DailyPlan = {
      id: planId,
      planDate: dateStr,
      createdBy: existing.plan ? existing.plan.createdBy : authorId,
      createdByName: existing.plan ? existing.plan.createdByName : authorName,
      isLocked: lockNow,
      lockedAt: lockNow ? nowIso : null,
      lockedBy: lockNow ? authorId : null,
      lockedByName: lockNow ? authorName : null,
      createdAt: existing.plan ? existing.plan.createdAt : nowIso,
      updatedAt: nowIso,
    };

    const newTasks: Task[] = taskDrafts.map((d, index) => ({
      id: crypto.randomUUID ? crypto.randomUUID() : `task-${Date.now()}-${index}`,
      planId,
      subject: d.subject.trim(),
      title: d.title.trim(),
      description: d.description?.trim() || undefined,
      difficulty: d.difficulty,
      points: d.points,
      orderIndex: index,
      createdAt: nowIso,
    }));

    if (this.isConfigured && this.supabase) {
      try {
        // Upsert plan
        const { error: pErr } = await this.supabase.from('daily_plans').upsert({
          id: plan.id,
          plan_date: plan.planDate,
          created_by: plan.createdBy,
          created_by_name: plan.createdByName,
          is_locked: plan.isLocked,
          locked_at: plan.lockedAt,
          locked_by: plan.lockedBy,
          locked_by_name: plan.lockedByName,
          updated_at: plan.updatedAt,
        });
        if (pErr) throw pErr;

        // Delete existing tasks for this plan
        await this.supabase.from('tasks').delete().eq('plan_id', plan.id);

        // Insert new tasks
        const { error: tErr } = await this.supabase.from('tasks').insert(
          newTasks.map((t) => ({
            id: t.id,
            plan_id: t.planId,
            subject: t.subject,
            title: t.title,
            description: t.description,
            difficulty: t.difficulty,
            points: t.points,
            order_index: t.orderIndex,
            created_at: t.createdAt,
          }))
        );
        if (tErr) throw tErr;

        if (lockNow) {
          await this.logActivity({
            userId: authorId,
            userName: authorName,
            actionType: 'plan_locked',
            message: `${authorName} locked the study plan for ${dateStr} with ${newTasks.length} topics!`,
            points: 0,
          });
        }
      } catch (err: any) {
        console.error('Supabase write error, using local fallback:', err);
      }
    }

    // Local storage updates
    const allPlans: DailyPlan[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.DAILY_PLANS) || '[]');
    const allTasks: Task[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');

    const pIdx = allPlans.findIndex((p) => p.id === plan.id || p.planDate === plan.planDate);
    if (pIdx >= 0) {
      allPlans[pIdx] = plan;
    } else {
      allPlans.push(plan);
    }
    localStorage.setItem(STORAGE_KEYS.DAILY_PLANS, JSON.stringify(allPlans));

    const remainingTasks = allTasks.filter((t) => t.planId !== plan.id);
    const combinedTasks = [...remainingTasks, ...newTasks];
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(combinedTasks));

    if (lockNow) {
      await this.logActivity({
        userId: authorId,
        userName: authorName,
        actionType: 'plan_locked',
        message: `${authorName} locked the study plan for ${dateStr} with ${newTasks.length} topics!`,
        points: 0,
      });

      this.broadcastChange({
        title: "Study Plan Locked!",
        body: `${authorName} finalized and locked today's ${newTasks.length} topics. Ready to study!`,
        type: 'lock',
      });
    } else {
      this.broadcastChange();
    }

    return { plan, tasks: newTasks };
  }

  // ============================================================================
  // TASK COMPLETIONS
  // ============================================================================

  public async getCompletionsForPlan(planId: string): Promise<TaskCompletion[]> {
    if (this.isConfigured && this.supabase) {
      try {
        const { data: tasks } = await this.supabase.from('tasks').select('id').eq('plan_id', planId);
        if (tasks && tasks.length > 0) {
          const taskIds = tasks.map((t: any) => t.id);
          const { data: comps } = await this.supabase
            .from('task_completions')
            .select('*')
            .in('task_id', taskIds);

          if (comps) {
            return comps.map((c: any) => ({
              id: c.id,
              taskId: c.task_id,
              userId: c.user_id,
              userName: c.user_name,
              completedAt: c.completed_at,
              pointsAwarded: c.points_awarded,
            }));
          }
        }
      } catch (e) {
        console.error('Error fetching completions from Supabase:', e);
      }
    }

    const allComps: TaskCompletion[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLETIONS) || '[]');
    const allTasks: Task[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
    const taskIds = new Set(allTasks.filter((t) => t.planId === planId).map((t) => t.id));
    return allComps.filter((c) => taskIds.has(c.taskId));
  }

  public async getAllCompletions(): Promise<TaskCompletion[]> {
    if (this.isConfigured && this.supabase) {
      try {
        const { data: comps } = await this.supabase.from('task_completions').select('*');
        if (comps) {
          return comps.map((c: any) => ({
            id: c.id,
            taskId: c.task_id,
            userId: c.user_id,
            userName: c.user_name,
            completedAt: c.completed_at,
            pointsAwarded: c.points_awarded,
          }));
        }
      } catch (e) {
        console.error('Error fetching all completions:', e);
      }
    }

    return JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLETIONS) || '[]');
  }

  /**
   * Mark a task completed by the current logged-in user.
   * STRICT SECURITY RULES:
   * 1. Plan must be locked.
   * 2. Cannot complete on behalf of another user.
   * 3. Cannot duplicate points (unique taskId + userId).
   * 4. Task completion cannot be unchecked or reversed.
   */
  public async markTaskCompleted(
    task: Task,
    plan: DailyPlan,
    userId: string,
    userName: string
  ): Promise<TaskCompletion> {
    if (!plan.isLocked) {
      throw new Error('Study plan must be locked before members can complete tasks.');
    }

    // Check duplicate completion
    const existingCompletions = await this.getAllCompletions();
    const alreadyCompleted = existingCompletions.some(
      (c) => c.taskId === task.id && c.userId === userId
    );

    if (alreadyCompleted) {
      throw new Error('You have already marked this task as completed.');
    }

    const nowIso = new Date().toISOString();
    const completion: TaskCompletion = {
      id: crypto.randomUUID ? crypto.randomUUID() : `comp-${Date.now()}`,
      taskId: task.id,
      userId,
      userName,
      completedAt: nowIso,
      pointsAwarded: task.points,
    };

    if (this.isConfigured && this.supabase) {
      try {
        const { error } = await this.supabase.from('task_completions').insert({
          id: completion.id,
          task_id: completion.taskId,
          user_id: completion.userId,
          user_name: completion.userName,
          completed_at: completion.completedAt,
          points_awarded: completion.pointsAwarded,
        });
        if (error) throw error;
      } catch (e: any) {
        console.error('Supabase completion insert failed:', e);
      }
    }

    // Local storage
    const allComps: TaskCompletion[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLETIONS) || '[]');
    allComps.push(completion);
    localStorage.setItem(STORAGE_KEYS.COMPLETIONS, JSON.stringify(allComps));

    // Log to activity feed
    await this.logActivity({
      userId,
      userName,
      taskId: task.id,
      taskTitle: task.title,
      subject: task.subject,
      actionType: 'task_completed',
      message: `${userName} completed ${task.title} (${task.subject}) — +${task.points} pts`,
      points: task.points,
    });

    // Check and trigger achievements
    await this.evaluateAchievementsForUser(userId, userName);

    // Broadcast real-time update
    this.broadcastChange({
      title: "Task Completed!",
      body: `${userName} just completed ${task.title} (+${task.points} points)!`,
      type: 'completion',
    });

    return completion;
  }

  // ============================================================================
  // ACTIVITY LOG
  // ============================================================================

  public async logActivity(item: Omit<ActivityLogItem, 'id' | 'createdAt'>): Promise<void> {
    const nowIso = new Date().toISOString();
    const logItem: ActivityLogItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : `log-${Date.now()}`,
      ...item,
      createdAt: nowIso,
    };

    if (this.isConfigured && this.supabase) {
      try {
        await this.supabase.from('activity_log').insert({
          id: logItem.id,
          user_id: logItem.userId,
          user_name: logItem.userName,
          task_id: logItem.taskId || null,
          task_title: logItem.taskTitle || null,
          subject: logItem.subject || null,
          action_type: logItem.actionType,
          message: logItem.message,
          points: logItem.points || 0,
          created_at: logItem.createdAt,
        });
      } catch (e) {
        console.error('Supabase activity log error:', e);
      }
    }

    const logs: ActivityLogItem[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG) || '[]');
    logs.unshift(logItem);
    // Keep last 100 entries
    if (logs.length > 100) logs.pop();
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG, JSON.stringify(logs));
  }

  public async getRecentActivity(limit: number = 20): Promise<ActivityLogItem[]> {
    if (this.isConfigured && this.supabase) {
      try {
        const { data } = await this.supabase
          .from('activity_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (data) {
          return data.map((d: any) => ({
            id: d.id,
            userId: d.user_id,
            userName: d.user_name,
            taskId: d.task_id,
            taskTitle: d.task_title,
            subject: d.subject,
            actionType: d.action_type,
            message: d.message,
            points: d.points,
            createdAt: d.created_at,
          }));
        }
      } catch (e) {
        console.error('Error fetching activity log from Supabase:', e);
      }
    }

    const logs: ActivityLogItem[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG) || '[]');
    return logs.slice(0, limit);
  }

  // ============================================================================
  // ACHIEVEMENTS & STREAKS
  // ============================================================================

  public async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    if (this.isConfigured && this.supabase) {
      try {
        const { data } = await this.supabase
          .from('user_achievements')
          .select('*')
          .eq('user_id', userId);

        if (data) {
          return data.map((d: any) => ({
            id: d.id,
            userId: d.user_id,
            achievementId: d.achievement_id,
            unlockedAt: d.unlocked_at,
          }));
        }
      } catch (e) {
        console.error('Error fetching user achievements:', e);
      }
    }

    const all: UserAchievement[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_ACHIEVEMENTS) || '[]');
    return all.filter((a) => a.userId === userId);
  }

  private async evaluateAchievementsForUser(userId: string, userName: string) {
    const userStats = await this.getMemberStats(userId);
    const existingAchievements = await this.getUserAchievements(userId);
    const unlockedIds = new Set(existingAchievements.map((a) => a.achievementId));

    for (const ach of INITIAL_ACHIEVEMENTS) {
      if (unlockedIds.has(ach.id)) continue;

      let eligible = false;
      if (ach.pointsThreshold && userStats.totalPoints >= ach.pointsThreshold) eligible = true;
      if (ach.tasksThreshold && userStats.tasksCompleted >= ach.tasksThreshold) eligible = true;
      if (ach.streakThreshold && userStats.currentStreak >= ach.streakThreshold) eligible = true;

      if (eligible) {
        const nowIso = new Date().toISOString();
        const userAch: UserAchievement = {
          id: crypto.randomUUID ? crypto.randomUUID() : `uach-${Date.now()}-${ach.id}`,
          userId,
          achievementId: ach.id,
          unlockedAt: nowIso,
        };

        if (this.isConfigured && this.supabase) {
          try {
            await this.supabase.from('user_achievements').insert({
              id: userAch.id,
              user_id: userAch.userId,
              achievement_id: userAch.achievementId,
              unlocked_at: userAch.unlockedAt,
            });
          } catch (e) {
            console.error('Error inserting user achievement:', e);
          }
        }

        const all: UserAchievement[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_ACHIEVEMENTS) || '[]');
        all.push(userAch);
        localStorage.setItem(STORAGE_KEYS.USER_ACHIEVEMENTS, JSON.stringify(all));

        await this.logActivity({
          userId,
          userName,
          actionType: 'achievement_unlocked',
          message: `🏆 ${userName} unlocked badge: "${ach.title}"!`,
          points: 0,
        });

        this.broadcastChange({
          title: "Achievement Unlocked!",
          body: `${userName} earned "${ach.title}": ${ach.description}`,
          type: 'achievement',
        });
      }
    }
  }

  // ============================================================================
  // LEADERBOARD & STATS COMPUTATION
  // ============================================================================

  public async getMemberStats(userId: string): Promise<MemberStats> {
    const member = SQUAD_MEMBERS.find((m) => m.id === userId);
    const memberName = member?.displayName || userId;
    const completions = await this.getAllCompletions();
    const userCompletions = completions.filter((c) => c.userId === userId);

    const todayStr = getTodayDateIST();
    const weekStartStr = getStartOfWeekIST();
    const monthStartStr = getStartOfMonthIST();

    const allPlans: DailyPlan[] = this.isConfigured && this.supabase
      ? (await this.supabase.from('daily_plans').select('id, plan_date')).data?.map((p: any) => ({
          id: p.id,
          planDate: p.plan_date,
          createdBy: '',
          createdByName: '',
          isLocked: true,
          createdAt: '',
          updatedAt: '',
        })) || []
      : JSON.parse(localStorage.getItem(STORAGE_KEYS.DAILY_PLANS) || '[]');

    const allTasks: Task[] = this.isConfigured && this.supabase
      ? (await this.supabase.from('tasks').select('id, plan_id')).data?.map((t: any) => ({
          id: t.id,
          planId: t.plan_id,
          subject: '',
          title: '',
          difficulty: 'Easy',
          points: 0,
          orderIndex: 0,
          createdAt: '',
        })) || []
      : JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');

    const taskToPlanDate = new Map<string, string>();
    const planMap = new Map<string, string>();
    allPlans.forEach((p) => planMap.set(p.id, p.planDate));
    allTasks.forEach((t) => {
      const pDate = planMap.get(t.planId);
      if (pDate) taskToPlanDate.set(t.id, pDate);
    });

    let totalPoints = 0;
    let todayPoints = 0;
    let weekPoints = 0;
    let monthPoints = 0;

    const completedDates = new Set<string>();

    for (const c of userCompletions) {
      totalPoints += c.pointsAwarded;
      const planDate = taskToPlanDate.get(c.taskId) || c.completedAt.slice(0, 10);
      completedDates.add(planDate);

      if (planDate === todayStr) {
        todayPoints += c.pointsAwarded;
      }
      if (planDate >= weekStartStr) {
        weekPoints += c.pointsAwarded;
      }
      if (planDate >= monthStartStr) {
        monthPoints += c.pointsAwarded;
      }
    }

    // Calculate streaks
    const { currentStreak, longestStreak } = this.calculateStreaks(Array.from(completedDates), todayStr);

    // Total locked tasks count across all plans
    const totalPossibleTasks = allTasks.length;
    const completionRate = totalPossibleTasks > 0
      ? Math.round((userCompletions.length / totalPossibleTasks) * 100)
      : 0;

    return {
      userId,
      userName: member?.username || userId,
      displayName: memberName,
      avatarColor: member?.avatarColor || 'from-indigo-600 to-blue-700',
      totalPoints,
      todayPoints,
      weekPoints,
      monthPoints,
      tasksCompleted: userCompletions.length,
      currentStreak,
      longestStreak,
      completionRate,
      rank: 1, // Will be computed in getLeaderboard
    };
  }

  private calculateStreaks(dates: string[], todayStr: string): { currentStreak: number; longestStreak: number } {
    if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };

    const sorted = [...new Set(dates)].sort(); // Ascending YYYY-MM-DD
    const dateSet = new Set(sorted);

    // Current streak: look backwards from today or yesterday
    let currentStreak = 0;
    const today = new Date(todayStr + 'T12:00:00Z');
    let cursor = new Date(today);

    // If today is completed, streak starts today. If not, maybe yesterday was completed
    let checkDateStr = cursor.toISOString().slice(0, 10);
    if (!dateSet.has(checkDateStr)) {
      // Check yesterday
      cursor.setUTCDate(cursor.getUTCDate() - 1);
      checkDateStr = cursor.toISOString().slice(0, 10);
    }

    while (dateSet.has(checkDateStr)) {
      currentStreak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
      checkDateStr = cursor.toISOString().slice(0, 10);
    }

    // Longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate: Date | null = null;

    for (const dStr of sorted) {
      const curDate = new Date(dStr + 'T12:00:00Z');
      if (prevDate) {
        const diffDays = Math.round((curDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
      prevDate = curDate;
    }

    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
    };
  }

  public async getLeaderboard(timeframe: LeaderboardTimeframe = 'all'): Promise<MemberStats[]> {
    const statsList: MemberStats[] = [];

    for (const member of SQUAD_MEMBERS) {
      const stats = await this.getMemberStats(member.id);
      statsList.push(stats);
    }

    // Sort based on timeframe
    statsList.sort((a, b) => {
      let scoreA = a.totalPoints;
      let scoreB = b.totalPoints;

      if (timeframe === 'today') {
        scoreA = a.todayPoints;
        scoreB = b.todayPoints;
      } else if (timeframe === 'week') {
        scoreA = a.weekPoints;
        scoreB = b.weekPoints;
      } else if (timeframe === 'month') {
        scoreA = a.monthPoints;
        scoreB = b.monthPoints;
      }

      if (scoreB !== scoreA) return scoreB - scoreA;
      // Tie breaker: tasks completed, then current streak
      if (b.tasksCompleted !== a.tasksCompleted) return b.tasksCompleted - a.tasksCompleted;
      return b.currentStreak - a.currentStreak;
    });

    // Assign rank
    return statsList.map((s, idx) => ({ ...s, rank: idx + 1 }));
  }

  // ============================================================================
  // AUTHENTICATION & ACTIVE USER
  // ============================================================================

  public getActiveUser(): typeof SQUAD_MEMBERS[0] {
    const storedUsername = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.ACTIVE_USER) : null;
    const found = SQUAD_MEMBERS.find((m) => m.username === storedUsername);
    return found || SQUAD_MEMBERS[0]; // Default to Revanasiddayya
  }

  public setActiveUser(username: string): void {
    const found = SQUAD_MEMBERS.find((m) => m.username === username || m.id === username);
    if (found) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, found.username);
      this.broadcastChange();
    }
  }
}

export const dataService = new DataService();
