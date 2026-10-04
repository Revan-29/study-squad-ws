import React, { useState } from 'react';
import { SQUAD_MEMBERS, SquadMemberConfig } from '../types';
import { UserAvatar } from './UserAvatar';
import { dataService } from '../services/dataService';
import {
  Flame,
  Database,
  BrainCircuit,
  LogIn,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  Layers,
  Trophy,
  Calendar,
  BarChart3,
  User
} from 'lucide-react';

export type NavTab = 'dashboard' | 'daily_plan' | 'leaderboard' | 'history' | 'statistics' | 'profile';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeUser: SquadMemberConfig;
  onOpenAuth: () => void;
  onOpenSupabaseSetup: () => void;
  onOpenAiHelper: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  activeUser,
  onOpenAuth,
  onOpenSupabaseSetup,
  onOpenAiHelper,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isSupabaseConnected = dataService.getIsConfigured();

  const navLinks: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'daily_plan', label: 'Daily Plan', icon: <Layers className="w-4 h-4" /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="w-4 h-4" /> },
    { id: 'history', label: 'History', icon: <Calendar className="w-4 h-4" /> },
    { id: 'statistics', label: 'Statistics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* ZONE 1: BRAND TITLE (Wordmark) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNavClick('dashboard')}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-500 p-0.5 shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-neutral-950 rounded-[10px] flex items-center justify-center">
                  <Flame className="w-5 h-5 text-amber-400 fill-amber-400/20" />
                </div>
              </div>
              <div>
                <span className="text-base sm:text-lg font-extrabold tracking-tight text-white block leading-none">
                  STUDY SQUAD
                </span>
                <span className="text-[10px] font-mono text-neutral-400 block tracking-wider uppercase mt-0.5">
                  Revanasiddayya · Vinodini · Rubiya · Mahantesh
                </span>
              </div>
            </button>
          </div>

          {/* ZONE 2: 4-6 NAV LINKS (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-neutral-800/90 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* ZONE 3: PRIMARY ACTIONS */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* AI Doubt Solver / Image Note Analyzer Button */}
            <button
              onClick={onOpenAiHelper}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border border-purple-800/60 text-xs font-medium transition-colors cursor-pointer"
              title="Snap & analyze study notes or solve doubts with Gemini"
            >
              <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden lg:inline">AI Study Solver</span>
            </button>

            {/* Supabase Connection Status Pill */}
            <button
              onClick={onOpenSupabaseSetup}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
                isSupabaseConnected
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/40'
                  : 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:bg-neutral-800'
              }`}
              title="Supabase Database & Realtime Status"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isSupabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="hidden sm:inline font-sans text-xs">
                {isSupabaseConnected ? 'Supabase' : 'Connect DB'}
              </span>
            </button>

            {/* Active User Avatar / Switcher Trigger */}
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-200 transition-colors cursor-pointer"
              title={`Logged in as ${activeUser.displayName}. Click to switch user.`}
            >
              <UserAvatar userIdOrName={activeUser.id} size="sm" showBadge />
              <span className="hidden sm:inline font-semibold">{activeUser.displayName}</span>
              <ChevronDown className="w-3 h-3 text-neutral-500" />
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-4 border-t border-neutral-800 bg-neutral-950/95 space-y-1">
          {navLinks.map((link) => {
            const isActive = currentTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition-colors ${
                  isActive
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </button>
            );
          })}

          <div className="pt-2 border-t border-neutral-800/80 mt-2 flex items-center justify-between">
            <button
              onClick={() => {
                onOpenAiHelper();
                setMobileMenuOpen(false);
              }}
              className="px-3 py-2 rounded-lg bg-purple-950/50 text-purple-300 border border-purple-800/60 text-xs font-medium flex items-center gap-1.5"
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>AI Study Solver</span>
            </button>

            <button
              onClick={() => {
                onOpenAuth();
                setMobileMenuOpen(false);
              }}
              className="text-xs text-neutral-400 hover:text-neutral-200"
            >
              Switch Account
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
