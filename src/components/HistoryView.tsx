import React, { useState, useEffect } from 'react';
import { DailyPlan, Task, TaskCompletion } from '../types';
import { dataService } from '../services/dataService';
import { TaskCard } from './TaskCard';
import { getTodayDateIST, formatPlanDateIST } from '../utils/dateUtils';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, AlertCircle, Lock } from 'lucide-react';

interface HistoryViewProps {
  activeUserId: string;
  activeUserName: string;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  activeUserId,
  activeUserName,
}) => {
  const todayIST = getTodayDateIST();
  const [selectedDate, setSelectedDate] = useState<string>(todayIST);
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [availableDates, setAvailableDates] = useState<{ planDate: string; isLocked: boolean; taskCount: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAvailableDates();
  }, []);

  useEffect(() => {
    loadPlanForDate(selectedDate);
  }, [selectedDate]);

  const loadAvailableDates = async () => {
    const dates = await dataService.getAllPlansWithDates();
    setAvailableDates(dates);
  };

  const loadPlanForDate = async (dateStr: string) => {
    setIsLoading(true);
    try {
      const res = await dataService.getDailyPlan(dateStr);
      setPlan(res.plan);
      setTasks(res.tasks);

      if (res.plan) {
        const comps = await dataService.getCompletionsForPlan(res.plan.id);
        setCompletions(comps);
      } else {
        setCompletions([]);
      }
    } catch (e) {
      console.error('Failed to load plan history:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const shiftDay = (days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    date.setUTCDate(date.getUTCDate() + days);
    const newDateStr = date.toISOString().slice(0, 10);
    // Don't allow future dates
    if (newDateStr <= todayIST) {
      setSelectedDate(newDateStr);
    }
  };

  const totalPoints = tasks.reduce((sum, t) => sum + t.points, 0);

  return (
    <div className="space-y-6">
      {/* Header and Date Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-indigo-400">
            Archive & Daily Records (Asia/Kolkata)
          </span>
          <h2 className="text-2xl font-bold text-neutral-100 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-indigo-400" />
            <span>Study History</span>
          </h2>
        </div>

        {/* Date Selector Navigation Bar */}
        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 p-1.5 rounded-xl">
          <button
            onClick={() => shiftDay(-1)}
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="date"
            max={todayIST}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs sm:text-sm font-mono text-neutral-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          />

          <button
            onClick={() => shiftDay(1)}
            disabled={selectedDate >= todayIST}
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {selectedDate !== todayIST && (
            <button
              onClick={() => setSelectedDate(todayIST)}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 transition-colors cursor-pointer"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* Available Plans Quick-Jump Bar if any exist */}
      {availableDates.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
          <span className="text-neutral-400 shrink-0">Recorded Days:</span>
          {availableDates.map((item) => (
            <button
              key={item.planDate}
              onClick={() => setSelectedDate(item.planDate)}
              className={`px-3 py-1.5 rounded-lg border font-mono shrink-0 transition-colors cursor-pointer ${
                selectedDate === item.planDate
                  ? 'bg-neutral-800 border-indigo-500 text-indigo-300 font-semibold'
                  : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              {item.planDate} ({item.taskCount} topics)
            </button>
          ))}
        </div>
      )}

      {/* Selected Day Overview */}
      <div className="p-4 sm:p-5 rounded-xl bg-neutral-900/60 border border-neutral-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-neutral-100">
              {formatPlanDateIST(selectedDate)}
            </h3>
            <span className="text-xs text-neutral-400 font-mono">
              Date: {selectedDate} {selectedDate === todayIST ? '(Today)' : '(Archived)'}
            </span>
          </div>

          {plan && (
            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-neutral-400 block">Topics</span>
                <span className="text-neutral-200 font-bold">{tasks.length}</span>
              </div>
              <div>
                <span className="text-neutral-400 block">Total Points</span>
                <span className="text-amber-400 font-bold">+{totalPoints} PTS</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-800 border border-neutral-700 text-neutral-300">
                <Lock className="w-3.5 h-3.5 text-neutral-400" />
                <span>{plan.isLocked ? 'Locked' : 'Draft'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content State */}
      {isLoading ? (
        <div className="p-12 text-center text-sm text-neutral-500 font-mono">
          Loading archived daily plan...
        </div>
      ) : !plan || tasks.length === 0 ? (
        <div className="p-12 rounded-2xl bg-neutral-900/30 border border-dashed border-neutral-800 text-center">
          <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-500 flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold text-neutral-300 mb-1">
            No study plan created for this day
          </h4>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            The squad did not register or save any study topics on {selectedDate}. Historical records
            remain strictly authentic and are never artificially generated.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
            <span>Archived Topics & Squad Status</span>
            <span>Historical plans are read-only</span>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                plan={plan}
                completions={completions}
                activeUserId={activeUserId}
                activeUserName={activeUserName}
                onComplete={async () => {}}
                isReadOnly={selectedDate !== todayIST || !plan.isLocked}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
