import React, { useState } from 'react';
import { SUPABASE_SETUP_SQL } from '../services/supabaseSchema';
import { dataService } from '../services/dataService';
import {
  Database,
  CheckCircle,
  Copy,
  Download,
  ExternalLink,
  X,
  Key,
  Globe,
  Share2,
  Users,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [supabaseUrl, setSupabaseUrl] = useState(() => {
    return (
      localStorage.getItem('study_squad_supabase_url') ||
      import.meta.env.VITE_SUPABASE_URL ||
      ''
    );
  });
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(() => {
    return (
      localStorage.getItem('study_squad_supabase_anon_key') ||
      import.meta.env.VITE_SUPABASE_ANON_KEY ||
      ''
    );
  });

  const [copiedSQL, setCopiedSQL] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const isConnected = dataService.getIsConfigured();

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 2500);
  };

  const handleDownloadSQL = () => {
    const blob = new Blob([SUPABASE_SETUP_SQL], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'study_squad_schema.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyShareLink = () => {
    const appUrl = window.location.origin;
    navigator.clipboard.writeText(appUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSaveAndTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const ok = dataService.saveSupabaseCredentials(supabaseUrl, supabaseAnonKey);
      if (!ok) {
        setTestResult({
          success: false,
          message: 'Please provide both a valid Project URL (https://...) and Anon Key.',
        });
        setIsTesting(false);
        return;
      }

      const client = dataService.getSupabaseClient();
      if (!client) {
        setTestResult({ success: false, message: 'Could not create Supabase client.' });
        setIsTesting(false);
        return;
      }

      // Test reading profiles table
      const { data, error } = await client.from('profiles').select('id, username').limit(4);
      if (error) {
        setTestResult({
          success: false,
          message: `Connection established, but query failed (${error.message}). Have you run the SQL schema in the SQL Editor yet?`,
        });
      } else {
        setTestResult({
          success: true,
          message: `Connected successfully! Found ${data?.length || 0} registered squad profiles in Supabase. Realtime synchronization is active!`,
        });
      }
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || 'Connection failed.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearCredentials = () => {
    setSupabaseUrl('');
    setSupabaseAnonKey('');
    dataService.saveSupabaseCredentials('', '');
    setTestResult({
      success: true,
      message: 'Credentials removed. STUDY SQUAD is now running in local-first multi-tab mode.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-800 bg-neutral-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-700/50 text-indigo-400 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-100">
                Supabase Backend & Team Setup
              </h2>
              <p className="text-xs text-neutral-400">
                PostgreSQL database, Row Level Security & Real-Time Sync
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto space-y-6 text-xs sm:text-sm">
          {/* Current Connection Status Banner */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isConnected
                ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                : 'bg-indigo-950/30 border-indigo-800/40 text-indigo-300'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full mt-1 sm:mt-0 shrink-0 ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-400'
                }`}
              />
              <div>
                <span className="font-bold text-sm block">
                  {isConnected
                    ? 'Connected to Live Supabase Backend'
                    : 'Running in Local Multi-User Mode'}
                </span>
                <span className="text-xs text-neutral-400">
                  {isConnected
                    ? 'All task creations, locks, and completions sync in real time across devices.'
                    : 'The app is fully functional right now in your browser. Connect Supabase to sync across friends’ mobile phones!'}
                </span>
              </div>
            </div>

            <button
              onClick={handleCopyShareLink}
              className="py-1.5 px-3 rounded-lg bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 text-neutral-200 text-xs font-medium flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedLink ? 'Link Copied!' : 'Share App Link'}</span>
            </button>
          </div>

          {/* Setup Steps Accordion / Guide */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-400">
              Quick Setup Guide (5 Minutes)
            </h3>

            {/* Step 1: Create Supabase Project */}
            <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-200 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 text-xs flex items-center justify-center font-mono">
                    1
                  </span>
                  Create a Free Supabase Project
                </span>
                <a
                  href="https://database.new"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                >
                  <span>Open Supabase</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-neutral-400">
                Go to Supabase.com, click <strong>New Project</strong>, set any name (e.g.{' '}
                <code>study-squad</code>) and choose a database password.
              </p>
            </div>

            {/* Step 2: Run SQL Schema */}
            <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-200 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 text-xs flex items-center justify-center font-mono">
                    2
                  </span>
                  Run Database Schema & Security Policies
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                In Supabase, navigate to <strong>SQL Editor</strong> → <strong>New Query</strong>, paste
                the complete schema, and click <strong>Run</strong>. This creates all 7 tables,
                triggers enforcing locked plans, and real-time broadcast publications.
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySQL}
                  className="py-2 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedSQL ? 'SQL Script Copied!' : 'Copy Complete SQL Script'}</span>
                </button>

                <button
                  onClick={handleDownloadSQL}
                  className="py-2 px-3.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium text-xs flex items-center gap-1.5 border border-neutral-700 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .sql</span>
                </button>
              </div>
            </div>

            {/* Step 3: Connect Credentials */}
            <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-200 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 text-xs flex items-center justify-center font-mono">
                    3
                  </span>
                  Enter API Credentials
                </span>
                <span className="text-[11px] text-neutral-400">
                  Settings → API → Project URL & Anon Key
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://xyzcompany.supabase.co"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-900 border border-neutral-700/80 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">
                    Supabase Public Anon Key
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-900 border border-neutral-700/80 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                    testResult.success
                      ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-800/50 text-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleSaveAndTest}
                  disabled={isTesting}
                  className="py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{isTesting ? 'Testing Connection...' : 'Save & Test Connection'}</span>
                </button>

                {isConnected && (
                  <button
                    type="button"
                    onClick={handleClearCredentials}
                    className="text-xs text-neutral-500 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    Disconnect Supabase
                  </button>
                )}
              </div>
            </div>

            {/* Step 4: Share with Squad Members */}
            <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2">
              <span className="font-semibold text-neutral-200 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 text-xs flex items-center justify-center font-mono">
                  4
                </span>
                Share Link with the Four Friends
              </span>
              <p className="text-xs text-neutral-400">
                Share this website URL with <strong>Revanasiddayya</strong>, <strong>Vinodini</strong>,{' '}
                <strong>Rubiya</strong>, and <strong>Mahantesh</strong>. Each friend selects their
                profile or logs in with their credentials to view today's plan and mark their tasks
                completed!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
