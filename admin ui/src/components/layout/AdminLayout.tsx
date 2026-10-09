import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  FileText,
  Activity,
  LogOut,
  Bell,
  Scale,
  Sparkles,
  Settings,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLayout: React.FC = () => {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Overview & Ops', path: '/', icon: LayoutDashboard, requiredPerm: null },
    { label: 'User Directory', path: '/users', icon: Users, requiredPerm: 'users.read' },
    { label: 'Team & Roles', path: '/roles', icon: ShieldCheck, requiredPerm: 'users.read' },
    { label: 'Audit Trail', path: '/audit', icon: FileText, requiredPerm: 'audit.view' },
    { label: 'Active Sessions', path: '/sessions', icon: Activity, requiredPerm: 'sessions.read' },
    { label: 'Statutory Content', path: '/content', icon: BookOpen, requiredPerm: 'content.read' },
    { label: 'AI Review & QA', path: '/ai-queue', icon: Sparkles, requiredPerm: 'ai.review_queue' },
    { label: 'System Config', path: '/config', icon: Settings, requiredPerm: 'config.read' },
  ];

  const roleBadgeColor =
    user?.role === 'admin'
      ? 'bg-primary-container text-on-primary-container border-primary'
      : user?.role === 'subadmin'
      ? 'bg-secondary-container/20 text-secondary border-secondary'
      : user?.role === 'reviewer'
      ? 'bg-surface-container-high text-primary border-outline'
      : 'bg-surface-container-high text-on-surface-variant border-outline';

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface antialiased">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-40 bg-surface-container/95 backdrop-blur-md border-b border-surface-container-high px-6 h-16 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-surface-container-highest border border-primary/30 flex items-center justify-center text-primary shadow-sm">
              <Scale className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg font-bold text-on-surface tracking-tight">LawGPT</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary-container/20 text-primary border border-primary/20">
                  Console v2.4
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span className="flex items-center gap-1 text-secondary">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                  BNS Live
                </span>
                <span>•</span>
                <span>All Legal DBs Synced</span>
              </div>
            </div>
          </div>
        </div>

        {/* User Dossier & Actions */}
        <div className="flex items-center gap-4">
          <button
            title="Notifications"
            className="relative p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-tertiary-container ring-2 ring-surface-container" />
          </button>

          <div className="flex items-center gap-3 pl-3 border-l border-surface-container-high">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-on-surface">{user?.fullName || 'Administrator'}</p>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded border ${roleBadgeColor}`}>
                  {user?.role}
                </span>
              </div>
            </div>

            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-xs shadow-md">
              {user?.fullName?.charAt(0) || 'A'}
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-lg text-error hover:bg-error-container/20 transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-64 bg-surface-container-low border-r border-surface-container-high flex flex-col justify-between p-4 flex-shrink-0">
          <nav className="space-y-1.5">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-outline">
              Operational Command
            </div>
            {navItems.map((item) => {
              // Conditional display based on user permission
              if (item.requiredPerm && !hasPermission(item.requiredPerm)) {
                return null;
              }

              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-surface-container-high text-primary border-l-2 border-primary shadow-sm font-semibold'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="p-3 bg-surface-container rounded-lg border border-surface-container-high text-xs text-on-surface-variant space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-primary">Sovereign India Engine</span>
              <span className="text-secondary">Protected</span>
            </div>
            <p className="text-[10px] leading-tight text-outline">
              Acts 45 & 46 of 2023. Append-only audit active.
            </p>
          </div>
        </aside>

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-6 bg-surface">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
