import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Smartphone,
  Trash2,
  RefreshCw,
  Laptop,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ConfirmationModal } from '../components/common/ConfirmationModal';

interface AdminSession {
  id: string;
  admin_user_id: string;
  user_agent: string | null;
  ip_address: string | null;
  expires_at: string;
  created_at: string;
  full_name: string;
  email: string;
  role: string;
}

interface UserSession {
  id: string;
  user_id: string;
  device_id: string;
  device_name: string | null;
  ip_address: string | null;
  last_active_at: string;
  created_at: string;
  full_name: string;
  email: string;
  mobile: string;
}

export const SessionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'admins' | 'users'>('admins');
  const [revokeModal, setRevokeModal] = useState<{
    type: 'admin' | 'user';
    id: string;
    label: string;
  } | null>(null);

  // Admin Sessions
  const {
    data: adminSessions = [],
    isLoading: isAdminLoading,
    refetch: refetchAdmins,
  } = useQuery<AdminSession[]>({
    queryKey: ['sessions-admin'],
    queryFn: async () => {
      const res = await apiClient.get<{ sessions: AdminSession[] }>('/api/admin/sessions/admins');
      return res.sessions;
    },
  });

  // Mobile User Sessions
  const {
    data: userSessions = [],
    isLoading: isUserLoading,
    refetch: refetchUsers,
  } = useQuery<UserSession[]>({
    queryKey: ['sessions-user'],
    queryFn: async () => {
      const res = await apiClient.get<{ sessions: UserSession[] }>('/api/admin/sessions/users');
      return res.sessions;
    },
  });

  // Revoke Admin Session Mutation
  const revokeAdminMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete(`/api/admin/sessions/admins/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions-admin'] });
      setRevokeModal(null);
    },
  });

  // Revoke User Session Mutation
  const revokeUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete(`/api/admin/sessions/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions-user'] });
      setRevokeModal(null);
    },
  });

  const canRevoke = hasPermission('sessions.revoke');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-on-surface">Active Session Management</h1>
          <p className="text-sm text-on-surface-variant">
            Monitor active web console and mobile application device tokens with real-time remote revocation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              refetchAdmins();
              refetchUsers();
            }}
            className="p-2 rounded-lg border border-surface-container-high bg-surface-container-low hover:bg-surface-container text-on-surface-variant"
            title="Refresh Sessions"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-surface-container-high flex gap-4">
        <button
          onClick={() => setActiveTab('admins')}
          className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'admins'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Laptop className="w-4 h-4" />
          Admin Web Sessions ({adminSessions.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'users'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          Mobile App Devices ({userSessions.length})
        </button>
      </div>

      {/* Admin Sessions Table */}
      {activeTab === 'admins' && (
        <div className="bg-surface-container-low border border-surface-container-high rounded-xl overflow-hidden shadow-sm">
          {isAdminLoading ? (
            <div className="p-12 text-center text-sm text-on-surface-variant animate-pulse">
              Querying active administrative sessions...
            </div>
          ) : adminSessions.length === 0 ? (
            <div className="p-12 text-center text-sm text-on-surface-variant">
              No active administrative web sessions.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container border-b border-surface-container-high uppercase tracking-wider text-on-surface-variant">
                  <tr>
                    <th className="py-3 px-4">Officer</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4">Browser & Agent</th>
                    <th className="py-3 px-4">Expires In</th>
                    <th className="py-3 px-4 text-right">Revocation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high">
                  {adminSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-surface-container transition-colors">
                      <td className="py-3 px-4 font-medium text-on-surface">
                        <div>
                          <p className="font-semibold">{session.full_name}</p>
                          <span className="text-[10px] text-outline font-mono">{session.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant">
                          {session.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-outline">{session.ip_address || '127.0.0.1'}</td>
                      <td className="py-3 px-4 text-outline max-w-xs truncate" title={session.user_agent || 'Unknown'}>
                        {session.user_agent || 'Unknown User Agent'}
                      </td>
                      <td className="py-3 px-4 text-outline font-mono">
                        {new Date(session.expires_at).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {canRevoke ? (
                          <button
                            onClick={() =>
                              setRevokeModal({
                                type: 'admin',
                                id: session.id,
                                label: `${session.full_name} (${session.ip_address || 'Unknown'})`,
                              })
                            }
                            className="p-1.5 rounded-lg border border-error/30 text-error hover:bg-error-container/20 transition-colors inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Revoke
                          </button>
                        ) : (
                          <span className="text-outline italic">Protected</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* User Sessions Table */}
      {activeTab === 'users' && (
        <div className="bg-surface-container-low border border-surface-container-high rounded-xl overflow-hidden shadow-sm">
          {isUserLoading ? (
            <div className="p-12 text-center text-sm text-on-surface-variant animate-pulse">
              Querying mobile device active registry...
            </div>
          ) : userSessions.length === 0 ? (
            <div className="p-12 text-center text-sm text-on-surface-variant">
              No active mobile devices currently connected.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container border-b border-surface-container-high uppercase tracking-wider text-on-surface-variant">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Phone / Email</th>
                    <th className="py-3 px-4">Device Name / ID</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4">Last Activity</th>
                    <th className="py-3 px-4 text-right">Revocation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high">
                  {userSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-surface-container transition-colors">
                      <td className="py-3 px-4 font-medium text-on-surface">
                        <div>
                          <p className="font-semibold">{session.full_name}</p>
                          <span className="text-[10px] text-outline font-mono">{session.user_id.substring(0, 8)}...</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-outline">
                        {session.mobile} <span className="text-[10px] block text-outline/80">{session.email}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-primary" />
                          <span className="font-semibold text-on-surface">
                            {session.device_name || 'LawGPT Android Client'}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-outline block">{session.device_id}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-outline">{session.ip_address || '127.0.0.1'}</td>
                      <td className="py-3 px-4 text-outline font-mono">
                        {new Date(session.last_active_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {canRevoke ? (
                          <button
                            onClick={() =>
                              setRevokeModal({
                                type: 'user',
                                id: session.id,
                                label: `${session.full_name}'s device (${session.device_id})`,
                              })
                            }
                            className="p-1.5 rounded-lg border border-error/30 text-error hover:bg-error-container/20 transition-colors inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Revoke
                          </button>
                        ) : (
                          <span className="text-outline italic">Protected</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Revocation Confirmation Modal */}
      {revokeModal && (
        <ConfirmationModal
          isOpen={!!revokeModal}
          title="Revoke Session & Refresh Token"
          message={`Are you sure you want to revoke the session for ${revokeModal.label}? The user or officer will be immediately logged out upon their next API interaction.`}
          confirmLabel={
            revokeAdminMutation.isPending || revokeUserMutation.isPending ? 'Revoking...' : 'Confirm Revoke'
          }
          isDestructive={true}
          onConfirm={() => {
            if (revokeModal.type === 'admin') {
              revokeAdminMutation.mutate(revokeModal.id);
            } else {
              revokeUserMutation.mutate(revokeModal.id);
            }
          }}
          onCancel={() => setRevokeModal(null)}
        />
      )}
    </div>
  );
};
