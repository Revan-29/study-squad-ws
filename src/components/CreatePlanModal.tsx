import React, { useState } from 'react';
import { TaskDraft, TaskDifficulty, DailyPlan, Task } from '../types';
import { getTodayDateIST, formatPlanDateIST } from '../utils/dateUtils';
import { soundEffects } from '../utils/soundAndEffects';
import {
  Plus,
  Trash2,
  Lock,
  Save,
  AlertTriangle,
  X,
  FileCheck,
  Award,
  Layers,
  Sparkles
} from 'lucide-react';

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingPlan: DailyPlan | null;
  existingTasks: Task[];
  activeUserId: string;
  activeUserName: string;
  onSave: (tasks: TaskDraft[], lockNow: boolean) => Promise<void>;
}

export const CreatePlanModal: React.FC<CreatePlanModalProps> = ({
  isOpen,
  onClose,
  existingPlan,
  existingTasks,
  activeUserId,
  activeUserName,
  onSave,
}) => {
  const todayIST = getTodayDateIST();

  // If there are existing draft tasks, initialize with them; otherwise start with 1 clean empty row
  const [draftTasks, setDraftTasks] = useState<TaskDraft[]>(() => {
    if (existingTasks && existingTasks.length > 0) {
      return existingTasks.map((t) => ({
        tempId: t.id,
        subject: t.subject,
        title: t.title,
        description: t.description || '',
        difficulty: t.difficulty,
        points: t.points,
      }));
    }
    // Exactly ONE clean, blank row for manual input (strictly NO dummy or auto-generated topics!)
    return [
      {
        tempId: `draft-row-${Date.now()}-1`,
        subject: '',
        title: '',
        description: '',
        difficulty: 'Medium',
        points: 10,
      },
    ];
  });

  const [showLockConfirmation, setShowLockConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddTopic = () => {
    setDraftTasks((prev) => [
      ...prev,
      {
        tempId: `draft-row-${Date.now()}-${prev.length + 1}`,
        subject: prev.length > 0 ? prev[prev.length - 1].subject : '',
        title: '',
        description: '',
        difficulty: 'Medium',
        points: 10,
      },
    ]);
  };

  const handleRemoveTopic = (tempId: string) => {
    if (draftTasks.length <= 1) {
      setFormError('The plan must contain at least one study topic.');
      return;
    }
    setDraftTasks((prev) => prev.filter((t) => t.tempId !== tempId));
  };

  const handleFieldChange = (
    tempId: string,
    field: keyof TaskDraft,
    value: string | number
  ) => {
    setDraftTasks((prev) =>
      prev.map((t) => (t.tempId === tempId ? { ...t, [field]: value } : t))
    );
  };

  const validateForm = (): boolean => {
    setFormError(null);
    if (draftTasks.length === 0) {
      setFormError('Please add at least one topic.');
      return false;
    }

    for (let i = 0; i < draftTasks.length; i++) {
      const t = draftTasks[i];
      if (!t.subject.trim()) {
        setFormError(`Topic #${i + 1}: Subject name is required.`);
        return false;
      }
      if (!t.title.trim()) {
        setFormError(`Topic #${i + 1}: Topic name is required.`);
        return false;
      }
      if (!t.points || Number(t.points) <= 0 || !Number.isInteger(Number(t.points))) {
        setFormError(`Topic #${i + 1} (${t.title || 'Untitled'}): Points must be a positive integer.`);
        return false;
      }
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) return;
    try {
      setIsSubmitting(true);
      await onSave(draftTasks, false);
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save draft.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmLock = async () => {
    if (!validateForm()) {
      setShowLockConfirmation(false);
      return;
    }
    try {
      setIsSubmitting(true);
      soundEffects.playLockSound();
      await onSave(draftTasks, true);
      setShowLockConfirmation(false);
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to lock plan.');
      setShowLockConfirmation(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Plan summary calculations
  const totalTopics = draftTasks.length;
  const totalPoints = draftTasks.reduce((acc, t) => acc + (Number(t.points) || 0), 0);
  const distinctSubjects = Array.from(new Set(draftTasks.map((t) => t.subject.trim()).filter(Boolean)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-800 bg-neutral-950/50">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-indigo-400">
              Daily Study Planner (Asia/Kolkata)
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-neutral-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>Study Plan for {formatPlanDateIST(todayIST)}</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {/* Author & Instructions Notice */}
          <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800/80 text-xs text-neutral-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-neutral-200 font-medium">Planner:</span> {activeUserName} ·{' '}
              <span className="text-neutral-200 font-medium">Date:</span> {todayIST} (IST)
            </div>
            <div className="text-neutral-400">
              Add topics decided by the group. You can edit before locking.
            </div>
          </div>

          {formError && (
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Topics List Form */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">
                Topics & Points ({draftTasks.length})
              </h3>
              <span className="text-xs text-neutral-500">
                Unlimited topics and subjects allowed
              </span>
            </div>

            {draftTasks.map((topic, index) => (
              <div
                key={topic.tempId}
                className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-3 relative group transition-colors focus-within:border-indigo-500/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                    Topic #{index + 1}
                  </span>
                  {draftTasks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(topic.tempId)}
                      className="text-xs text-neutral-500 hover:text-rose-400 p-1 rounded transition-colors flex items-center gap-1 cursor-pointer"
                      title="Remove Topic"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* Subject Name */}
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-medium text-neutral-400 mb-1">
                      Subject Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. DSA, C Programming, OS"
                      value={topic.subject}
                      onChange={(e) =>
                        handleFieldChange(topic.tempId, 'subject', e.target.value)
                      }
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-neutral-900 border border-neutral-700/80 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Topic / Task Name */}
                  <div className="sm:col-span-8">
                    <label className="block text-xs font-medium text-neutral-400 mb-1">
                      Topic / Task Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Arrays, Linked List, Pointers"
                      value={topic.title}
                      onChange={(e) =>
                        handleFieldChange(topic.tempId, 'title', e.target.value)
                      }
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-neutral-900 border border-neutral-700/80 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Optional Description */}
                  <div className="sm:col-span-6">
                    <label className="block text-xs font-medium text-neutral-400 mb-1">
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Solve 3 LeetCode problems or read chapter 4"
                      value={topic.description || ''}
                      onChange={(e) =>
                        handleFieldChange(topic.tempId, 'description', e.target.value)
                      }
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-neutral-900 border border-neutral-700/80 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Difficulty */}
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-medium text-neutral-400 mb-1">
                      Difficulty
                    </label>
                    <select
                      value={topic.difficulty}
                      onChange={(e) =>
                        handleFieldChange(
                          topic.tempId,
                          'difficulty',
                          e.target.value as TaskDifficulty
                        )
                      }
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-neutral-900 border border-neutral-700/80 text-neutral-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  {/* Points (Entered Manually) */}
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-medium text-neutral-400 mb-1">
                      Points (Manual) <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={topic.points}
                        onChange={(e) =>
                          handleFieldChange(
                            topic.tempId,
                            'points',
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-neutral-900 border border-neutral-700/80 text-neutral-100 font-mono font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                      <span className="absolute right-3 top-2 text-xs font-mono text-neutral-400">
                        PTS
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* + Add Another Topic Button */}
            <button
              type="button"
              onClick={handleAddTopic}
              className="w-full py-3 px-4 border border-dashed border-neutral-700 hover:border-indigo-500 rounded-xl bg-neutral-950/40 text-neutral-300 hover:text-indigo-300 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ ADD ANOTHER TOPIC</span>
            </button>
          </div>

          {/* Plan Summary Section */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>Plan Summary Before Locking</span>
            </h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800">
                <span className="text-[11px] text-neutral-400 block">Total Topics</span>
                <span className="text-lg font-bold text-neutral-100 font-mono">
                  {totalTopics}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800">
                <span className="text-[11px] text-neutral-400 block">Total Points</span>
                <span className="text-lg font-bold text-amber-400 font-mono">
                  +{totalPoints}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800">
                <span className="text-[11px] text-neutral-400 block">Subjects</span>
                <span className="text-lg font-bold text-indigo-400 font-mono">
                  {distinctSubjects.length || 0}
                </span>
              </div>
            </div>
            {distinctSubjects.length > 0 && (
              <div className="mt-3 text-xs text-neutral-400 flex flex-wrap gap-2 items-center">
                <span className="text-neutral-400">Included Subjects:</span>
                {distinctSubjects.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-200 font-mono text-[11px]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions: SAVE AS DRAFT & LOCK TODAY'S PLAN */}
        <div className="px-5 sm:px-6 py-4 border-t border-neutral-800 bg-neutral-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none min-h-[44px] px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 border border-neutral-700 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>SAVE AS DRAFT</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (validateForm()) {
                  setShowLockConfirmation(true);
                }
              }}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>LOCK TODAY'S PLAN</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Permanent Locking */}
      {showLockConfirmation && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90">
          <div className="w-full max-w-md bg-neutral-900 border border-amber-600/40 rounded-2xl p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-600/40 text-amber-400 flex items-center justify-center mb-4 mx-auto">
              <Lock className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-center text-neutral-100 mb-2">
              Lock Today's Study Plan?
            </h3>

            <p className="text-sm text-neutral-300 text-center mb-4 leading-relaxed">
              Are you sure? Once locked, the topics and points cannot be changed.
            </p>

            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-400 mb-6 space-y-1">
              <div>• {totalTopics} topics will be permanently locked.</div>
              <div>• Total possible points: +{totalPoints} pts.</div>
              <div>• Revanasiddayya, Vinodini, Rubiya, & Mahantesh can immediately begin competing!</div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowLockConfirmation(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
              >
                Go Back & Edit
              </button>

              <button
                type="button"
                onClick={handleConfirmLock}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-md shadow-amber-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Lock className="w-4 h-4" />
                <span>Confirm & Lock</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
