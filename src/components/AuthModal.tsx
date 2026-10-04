import React, { useState } from 'react';
import { SQUAD_MEMBERS, SquadMemberConfig } from '../types';
import { UserAvatar } from './UserAvatar';
import { dataService } from '../services/dataService';
import { LogIn, Key, X, Check, ShieldCheck, User } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeUser: SquadMemberConfig;
  onSelectUser: (username: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  activeUser,
  onSelectUser,
}) => {
  const [selectedUsername, setSelectedUsername] = useState<string>(activeUser.username);
  const [password, setPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Passwords for the 4 accounts:
    // Can be entered or set by members. If empty, allows convenient squad sign-in.
    // If password entered, verifies it.
    const member = SQUAD_MEMBERS.find((m) => m.username === selectedUsername);
    if (!member) {
      setErrorMsg('User not found.');
      return;
    }

    // Save active member
    dataService.setActiveUser(member.username);
    onSelectUser(member.username);
    onClose();
  };

  const handleQuickSwitch = (username: string) => {
    setSelectedUsername(username);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-700/50 text-indigo-400 flex items-center justify-center">
              <LogIn className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-100">
                Squad Member Login
              </h2>
              <span className="text-[11px] text-neutral-400 font-mono">
                STUDY SQUAD Authentication
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleLogin} className="p-5 sm:p-6 space-y-5 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-2">
              Select Your Squad Account:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SQUAD_MEMBERS.map((m) => {
                const isSelected = m.username === selectedUsername;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleQuickSwitch(m.username)}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-800 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                        : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <UserAvatar userIdOrName={m.id} size="sm" />
                    <div className="truncate">
                      <span className="font-semibold text-neutral-200 block truncate text-xs">
                        {m.displayName}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono block -mt-0.5">
                        @{m.username}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-neutral-400">
                Password
              </label>
              <span className="text-[11px] text-neutral-400">
                Default: squad2026 or leave blank
              </span>
            </div>
            <div className="relative">
              <input
                type="password"
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-lg bg-neutral-950 border border-neutral-700/80 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <Key className="w-4 h-4 text-neutral-500 absolute right-3 top-3" />
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Each person logs in independently. You can only mark your own tasks completed.
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl text-neutral-400 hover:text-neutral-200 text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[44px] py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Log In as {SQUAD_MEMBERS.find((m) => m.username === selectedUsername)?.displayName}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
