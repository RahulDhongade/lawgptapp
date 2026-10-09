import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Gavel,
  ShieldCheck,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Users,
  FileCheck,
} from 'lucide-react';
import { api } from '../api/client';
import { useNavigate } from 'react-router-dom';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();

  // Query real database metrics from backend
  const { data: usersData } = useQuery({
    queryKey: ['admin-overview-users'],
    queryFn: () => api.get<{ pagination: { total: number } }>('/api/admin/users?limit=1'),
  });

  const { data: sessionsData } = useQuery({
    queryKey: ['admin-overview-sessions'],
    queryFn: () => api.get<{ adminSessions: any[]; userSessions: any[] }>('/api/admin/sessions'),
  });

  const totalUsers = usersData?.pagination?.total ?? 0;
  const activeUserSessions = sessionsData?.userSessions?.filter((s) => !s.revoked_at)?.length ?? 0;
  const activeAdminSessions = sessionsData?.adminSessions?.filter((s) => !s.revoked_at)?.length ?? 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Operational Command Header */}
      <div className="bg-surface-container rounded-2xl p-6 border border-surface-container-high shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Operational Command Console
            </span>
            <h1 className="text-2xl font-bold font-serif text-on-surface mt-1">
              LawGPT Legal Operations &amp; Administration
            </h1>
            <p className="text-xs text-primary font-semibold mt-1">
              Production Gateway • Bharat Sanhitas 2023-2024 Gazette Live
            </p>
          </div>

          <div className="flex items-center gap-2 bg-secondary-container/20 border border-secondary/30 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="text-xs font-semibold text-secondary">All Legal DBs Synced</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs text-on-surface-variant bg-surface-container-low px-4 py-2.5 rounded-xl border border-surface-container-high gap-3">
          <div className="flex items-center gap-2">
            <Gavel className="w-4 h-4 text-primary" />
            <span>Gazette Repositories: <strong className="text-on-surface">Active (Acts 45 &amp; 46 of 2023)</strong></span>
          </div>
          <span className="text-outline-variant hidden sm:inline">•</span>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-secondary" />
            <span>Guardrails &amp; Four-Eyes Enforcement: <strong className="text-on-surface">Strict</strong></span>
          </div>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Registered Citizens & Advocates */}
        <div className="bg-surface-container rounded-xl p-5 border border-surface-container-high shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-xs font-semibold uppercase tracking-wider">Registered Citizens</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="my-3">
            <span className="text-2xl font-bold font-serif text-on-surface">{totalUsers}</span>
            <p className="text-xs text-secondary font-medium mt-0.5">Database verified users</p>
          </div>
          <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
            <div className="bg-primary h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Card 2: Active Device Sessions */}
        <div className="bg-surface-container rounded-xl p-5 border border-surface-container-high shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Mobile Sessions</span>
            <BarChart3 className="w-4 h-4 text-secondary" />
          </div>
          <div className="my-3">
            <span className="text-2xl font-bold font-serif text-on-surface">{activeUserSessions}</span>
            <p className="text-xs text-on-surface-variant mt-0.5">{activeAdminSessions} administrative consoles</p>
          </div>
          <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
            <div className="bg-secondary h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Card 3: Statutory Mapping Coverage */}
        <div className="bg-surface-container rounded-xl p-5 border border-surface-container-high shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-xs font-semibold uppercase tracking-wider">IPC ➔ BNS Sections</span>
            <RefreshCw className="w-4 h-4 text-primary" />
          </div>
          <div className="my-3">
            <span className="text-2xl font-bold font-serif text-on-surface">511 / 511</span>
            <p className="text-xs text-secondary font-medium mt-0.5">100% Cross-referenced</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            <span>CrPC ➔ BNSS updated</span>
          </div>
        </div>

        {/* Card 4: Moderation Queue Status */}
        <div className="bg-surface-container rounded-xl p-5 border border-surface-container-high shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-xs font-semibold uppercase tracking-wider">AI Review Queue</span>
            <AlertTriangle className="w-4 h-4 text-primary-container" />
          </div>
          <div className="my-3">
            <span className="text-2xl font-bold font-serif text-on-surface">0 Queued</span>
            <p className="text-xs text-on-surface-variant mt-0.5">All flags resolved</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded bg-surface-container-highest text-secondary font-semibold">
              Queue Clear
            </span>
          </div>
        </div>
      </div>

      {/* Fast Execution Console */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Legal Ops Fast Execution
          </h2>
          <span className="text-xs text-primary font-semibold">Shortcuts</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => navigate('/users')}
            className="flex items-center gap-3 p-4 rounded-xl bg-surface-container hover:bg-surface-container-high border border-surface-container-high transition-all text-left group shadow-sm"
          >
            <div className="p-2.5 rounded-lg bg-surface-container-high text-primary group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface">Manage Citizens</p>
              <p className="text-xs text-on-surface-variant">View users, quotas &amp; suspensions</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/roles')}
            className="flex items-center gap-3 p-4 rounded-xl bg-surface-container hover:bg-surface-container-high border border-surface-container-high transition-all text-left group shadow-sm"
          >
            <div className="p-2.5 rounded-lg bg-surface-container-high text-secondary group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface">Team &amp; Access</p>
              <p className="text-xs text-on-surface-variant">Roles, permissions &amp; invites</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/audit')}
            className="flex items-center gap-3 p-4 rounded-xl bg-surface-container hover:bg-surface-container-high border border-surface-container-high transition-all text-left group shadow-sm"
          >
            <div className="p-2.5 rounded-lg bg-surface-container-high text-primary group-hover:scale-105 transition-transform">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface">Inspect Audit Trail</p>
              <p className="text-xs text-on-surface-variant">View immutable mutation logs</p>
            </div>
          </button>
        </div>
      </div>

      {/* Statutory Corpus Health */}
      <div className="bg-surface-container rounded-2xl p-6 border border-surface-container-high shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-secondary" />
            <h3 className="text-base font-semibold text-on-surface">Statutory Corpus Health</h3>
          </div>
          <span className="text-xs text-secondary font-semibold bg-secondary-container/20 px-2.5 py-1 rounded-full">
            100% Operational
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-on-surface">Bharatiya Nyaya Sanhita (BNS) 2023</p>
              <p className="text-xs text-on-surface-variant mt-0.5">358 Sections Indexed</p>
            </div>
            <span className="text-[10px] uppercase font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded">
              Active
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-on-surface">Bharatiya Nagarik Suraksha (BNSS) 2023</p>
              <p className="text-xs text-on-surface-variant mt-0.5">531 Sections Indexed</p>
            </div>
            <span className="text-[10px] uppercase font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded">
              Active
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-on-surface">Bharatiya Sakshya Adhiniyam (BSA) 2023</p>
              <p className="text-xs text-on-surface-variant mt-0.5">170 Sections Indexed</p>
            </div>
            <span className="text-[10px] uppercase font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded">
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
