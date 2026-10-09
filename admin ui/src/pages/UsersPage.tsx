import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Filter,
  UserX,
  UserCheck,
  Ban,
  RotateCcw,
  LogOut,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ConfirmationModal } from '../components/common/ConfirmationModal';

export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 15;

  // Selected user for details drawer
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Modal dialog states
  const [confirmAction, setConfirmAction] = useState<{
    type: 'suspend' | 'unsuspend' | 'block' | 'reset-quota' | 'force-logout';
    userId: string;
    userName: string;
  } | null>(null);

  const [suspendReason, setSuspendReason] = useState('');

  // Fetch users list
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter, statusFilter, page],
    queryFn: () => {
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: (page * pageSize).toString(),
      });
      if (search) params.append('q', search);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);
      return api.get<{ users: any[]; pagination: { total: number } }>(`/api/admin/users?${params.toString()}`);
    },
  });

  // Fetch selected user details
  const { data: userDetail } = useQuery({
    queryKey: ['admin-user-detail', selectedUserId],
    queryFn: () => api.get<{ user: any; sessions: any[] }>(`/api/admin/users/${selectedUserId}`),
    enabled: !!selectedUserId,
  });

  // Action mutations
  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/api/admin/users/${id}/suspend`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail'] });
      setConfirmAction(null);
      setSuspendReason('');
    },
  });

  const unsuspendMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/admin/users/${id}/unsuspend`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail'] });
      setConfirmAction(null);
    },
  });

  const blockMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/admin/users/${id}/block`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail'] });
      setConfirmAction(null);
    },
  });

  const resetQuotaMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/admin/users/${id}/reset-quota`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail'] });
      setConfirmAction(null);
    },
  });

  const forceLogoutMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/admin/users/${id}/force-logout`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail'] });
      setConfirmAction(null);
    },
  });

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'suspend') {
      suspendMutation.mutate({ id: confirmAction.userId, reason: suspendReason || 'Administrative suspension' });
    } else if (confirmAction.type === 'unsuspend') {
      unsuspendMutation.mutate(confirmAction.userId);
    } else if (confirmAction.type === 'block') {
      blockMutation.mutate(confirmAction.userId);
    } else if (confirmAction.type === 'reset-quota') {
      resetQuotaMutation.mutate(confirmAction.userId);
    } else if (confirmAction.type === 'force-logout') {
      forceLogoutMutation.mutate(confirmAction.userId);
    }
  };

  const users = data?.users || [];
  const total = data?.pagination?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-on-surface">Citizens &amp; Advocates Directory</h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Total {total} registered users in database. Manage accounts, quotas, and active sessions.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-surface-container p-4 rounded-xl border border-surface-container-high shadow-sm">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-outline absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search by name, email, or mobile..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-container-low border border-surface-container-high text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-outline" />
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high text-xs text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="">All Roles</option>
            <option value="citizen">Citizen</option>
            <option value="advocate">Advocate</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high text-xs text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-surface-container rounded-xl border border-surface-container-high overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-high text-on-surface-variant text-[11px] uppercase tracking-wider border-b border-surface-container-highest">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Free Quota</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Registered</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-on-surface-variant text-sm">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-on-surface-variant text-sm">
                    No users matching criteria
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSuspended = u.is_suspended === 1;
                  const isBlocked = u.is_blocked === 1;

                  return (
                    <tr key={u.id} className="hover:bg-surface-container-high/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-on-surface">{u.full_name}</div>
                        <div className="text-xs text-on-surface-variant">{u.email} • {u.mobile}</div>
                        {u.bar_council_number && (
                          <div className="text-[11px] text-primary">Bar: {u.bar_council_number}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs px-2 py-0.5 rounded capitalize bg-surface-container-highest border border-outline/30 font-medium">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <span className="font-semibold text-on-surface">{u.free_quota_used}</span> / 3 Used
                      </td>
                      <td className="py-3.5 px-4">
                        {isBlocked ? (
                          <span className="text-xs px-2 py-0.5 rounded bg-error-container/30 text-error font-semibold">
                            Blocked
                          </span>
                        ) : isSuspended ? (
                          <span className="text-xs px-2 py-0.5 rounded bg-error-container/20 text-tertiary font-semibold">
                            Suspended
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded bg-secondary-container/20 text-secondary font-semibold">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-on-surface-variant">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedUserId(u.id)}
                            title="View Dossier"
                            className="p-1.5 rounded hover:bg-surface-container-highest text-primary"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {hasPermission('users.suspend') && (
                            <>
                              {isSuspended ? (
                                <button
                                  onClick={() =>
                                    setConfirmAction({
                                      type: 'unsuspend',
                                      userId: u.id,
                                      userName: u.full_name,
                                    })
                                  }
                                  title="Unsuspend User"
                                  className="p-1.5 rounded hover:bg-surface-container-highest text-secondary"
                                >
                                  <UserCheck className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    setConfirmAction({
                                      type: 'suspend',
                                      userId: u.id,
                                      userName: u.full_name,
                                    })
                                  }
                                  title="Suspend User"
                                  className="p-1.5 rounded hover:bg-surface-container-highest text-tertiary"
                                >
                                  <UserX className="w-4 h-4" />
                                </button>
                              )}

                              {!isBlocked && (
                                <button
                                  onClick={() =>
                                    setConfirmAction({
                                      type: 'block',
                                      userId: u.id,
                                      userName: u.full_name,
                                    })
                                  }
                                  title="Block User"
                                  className="p-1.5 rounded hover:bg-surface-container-highest text-error"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}

                          {hasPermission('users.reset_quota') && (
                            <button
                              onClick={() =>
                                setConfirmAction({
                                  type: 'reset-quota',
                                  userId: u.id,
                                  userName: u.full_name,
                                })
                              }
                              title="Reset Free Quota"
                              className="p-1.5 rounded hover:bg-surface-container-highest text-on-surface-variant hover:text-primary"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}

                          {hasPermission('sessions.revoke') && (
                            <button
                              onClick={() =>
                                setConfirmAction({
                                  type: 'force-logout',
                                  userId: u.id,
                                  userName: u.full_name,
                                })
                              }
                              title="Force Logout / Revoke All Sessions"
                              className="p-1.5 rounded hover:bg-surface-container-highest text-outline hover:text-error"
                            >
                              <LogOut className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-surface-container-high border-t border-surface-container-highest text-xs text-on-surface-variant">
          <span>
            Showing page {page + 1} of {Math.max(1, totalPages)} ({total} total)
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="p-1.5 rounded bg-surface-container hover:bg-surface-container-lowest disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded bg-surface-container hover:bg-surface-container-lowest disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* User Dossier Drawer */}
      {selectedUserId && userDetail?.user && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-surface-container border-l border-surface-container-high p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-surface-container-high pb-4">
                <div>
                  <h2 className="text-lg font-bold font-serif text-on-surface">{userDetail.user.full_name}</h2>
                  <p className="text-xs text-primary font-medium capitalize">{userDetail.user.role} Dossier</p>
                </div>
                <button
                  onClick={() => setSelectedUserId(null)}
                  className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-surface-container-low rounded-lg space-y-1">
                  <span className="text-outline uppercase text-[10px] font-bold">Contact</span>
                  <p className="text-on-surface font-medium">{userDetail.user.email}</p>
                  <p className="text-on-surface font-medium">{userDetail.user.mobile}</p>
                </div>

                {userDetail.user.bar_council_number && (
                  <div className="p-3 bg-surface-container-low rounded-lg space-y-1">
                    <span className="text-outline uppercase text-[10px] font-bold">Bar Enrollment</span>
                    <p className="text-primary font-semibold">{userDetail.user.bar_council_number}</p>
                  </div>
                )}

                <div className="p-3 bg-surface-container-low rounded-lg space-y-1">
                  <span className="text-outline uppercase text-[10px] font-bold">Free Question Quota</span>
                  <p className="text-on-surface">{userDetail.user.free_quota_used} of 3 free questions consumed</p>
                </div>

                {userDetail.user.is_suspended === 1 && (
                  <div className="p-3 bg-error-container/20 border border-error/30 rounded-lg space-y-1 text-error">
                    <span className="uppercase text-[10px] font-bold">Suspension Notice</span>
                    <p>{userDetail.user.suspension_reason || 'No reason specified'}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-outline mb-2 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-secondary" />
                    Active Device Sessions ({userDetail.sessions?.length || 0})
                  </h3>
                  <div className="space-y-2">
                    {userDetail.sessions?.length === 0 ? (
                      <p className="text-on-surface-variant italic">No active device sessions recorded.</p>
                    ) : (
                      userDetail.sessions.map((sess: any) => (
                        <div
                          key={sess.id}
                          className="p-3 bg-surface-container-low border border-surface-container-high rounded-lg text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between font-semibold text-on-surface">
                            <span>{sess.device_name || 'Mobile App'}</span>
                            <span className={sess.revoked_at ? 'text-error' : 'text-secondary'}>
                              {sess.revoked_at ? 'Revoked' : 'Active'}
                            </span>
                          </div>
                          <p className="text-[11px] text-outline">Device ID: {sess.device_id}</p>
                          <p className="text-[11px] text-outline">
                            Last Active: {new Date(sess.last_active_at).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-surface-container-high">
              <button
                onClick={() => setSelectedUserId(null)}
                className="w-full py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-bright text-xs font-semibold text-on-surface"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <ConfirmationModal
          isOpen={true}
          title={
            confirmAction.type === 'suspend'
              ? `Suspend ${confirmAction.userName}`
              : confirmAction.type === 'unsuspend'
              ? `Unsuspend ${confirmAction.userName}`
              : confirmAction.type === 'block'
              ? `Permanently Block ${confirmAction.userName}`
              : confirmAction.type === 'reset-quota'
              ? `Reset Free Quota for ${confirmAction.userName}`
              : `Force Logout ${confirmAction.userName}`
          }
          message={
            confirmAction.type === 'suspend'
              ? 'Suspending this user will immediately revoke all active mobile sessions and prevent any new sign-in attempts. Please enter a formal reason for the audit trail.'
              : confirmAction.type === 'block'
              ? 'Blocking is an irreversible action that permanently disables access for this identity. An immutable record will be appended to the audit log.'
              : confirmAction.type === 'force-logout'
              ? 'This will immediately revoke all active refresh tokens and device sessions across all devices for this user.'
              : 'This action will be executed immediately and recorded in the tamper-evident audit log.'
          }
          variant={confirmAction.type === 'block' || confirmAction.type === 'suspend' ? 'danger' : 'primary'}
          confirmLabel={confirmAction.type.toUpperCase().replace('-', ' ')}
          onConfirm={handleConfirm}
          onCancel={() => {
            setConfirmAction(null);
            setSuspendReason('');
          }}
          isLoading={
            suspendMutation.isPending ||
            unsuspendMutation.isPending ||
            blockMutation.isPending ||
            resetQuotaMutation.isPending ||
            forceLogoutMutation.isPending
          }
        >
          {confirmAction.type === 'suspend' && (
            <div className="mt-3">
              <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                Reason for Suspension (Required for Audit Trail):
              </label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="e.g. Repeated violation of advisory disclaimers or automated scraping..."
                className="w-full p-2.5 rounded-lg bg-surface-container-low border border-surface-container-high text-xs text-on-surface focus:outline-none focus:border-primary"
                rows={3}
              />
            </div>
          )}
        </ConfirmationModal>
      )}
    </div>
  );
};
