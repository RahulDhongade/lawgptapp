import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  UserPlus,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  XCircle,
  Lock,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ConfirmationModal } from '../components/common/ConfirmationModal';

interface TeamMember {
  id: string;
  email: string;
  full_name: string;
  role: 'support' | 'reviewer' | 'subadmin' | 'admin';
  totp_enabled: number;
  created_at: string;
}

interface PermissionMatrix {
  roles: string[];
  permissions: string[];
  matrix: Record<string, string[]>;
}

export const RolesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user: currentAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'team' | 'matrix'>('team');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    fullName: '',
    role: 'reviewer' as 'support' | 'reviewer' | 'subadmin' | 'admin',
    initialPassword: '',
  });

  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [newRole, setNewRole] = useState<'support' | 'reviewer' | 'subadmin' | 'admin'>('reviewer');
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch Team Members
  const {
    data: team = [],
    isLoading: isTeamLoading,
    refetch: refetchTeam,
  } = useQuery<TeamMember[]>({
    queryKey: ['admin-team'],
    queryFn: async () => {
      const res = await apiClient.get<{ team: TeamMember[] }>('/api/admin/team');
      return res.team;
    },
  });

  // Fetch Permission Matrix
  const {
    data: matrixData,
    isLoading: isMatrixLoading,
  } = useQuery<PermissionMatrix>({
    queryKey: ['admin-permission-matrix'],
    queryFn: async () => {
      const res = await apiClient.get<PermissionMatrix>('/api/admin/team/permissions/matrix');
      return res;
    },
  });

  // Invite Mutation
  const inviteMutation = useMutation({
    mutationFn: async (data: typeof inviteData) => {
      return await apiClient.post('/api/admin/team/invite', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-team'] });
      setInviteModalOpen(false);
      setInviteData({ email: '', fullName: '', role: 'reviewer', initialPassword: '' });
      setErrorMessage(null);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to invite team member');
    },
  });

  // Change Role Mutation
  const changeRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      return await apiClient.patch(`/api/admin/team/${id}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-team'] });
      setRoleModalOpen(false);
      setSelectedMember(null);
      setErrorMessage(null);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to update administrative role');
    },
  });

  const handleOpenRoleModal = (member: TeamMember) => {
    setSelectedMember(member);
    setNewRole(member.role);
    setRoleModalOpen(true);
    setErrorMessage(null);
  };

  const isSuperAdmin = currentAdmin?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-on-surface">Team & Access Governance</h1>
          <p className="text-sm text-on-surface-variant">
            Manage administrative personnel, grant least-privilege roles, and audit security permissions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetchTeam()}
            className="p-2 rounded-lg border border-surface-container-high bg-surface-container-low hover:bg-surface-container text-on-surface-variant"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => {
                setErrorMessage(null);
                setInviteModalOpen(true);
              }}
              className="px-4 py-2 bg-primary text-on-primary font-semibold rounded-lg text-sm flex items-center gap-2 shadow-sm hover:brightness-105"
            >
              <UserPlus className="w-4 h-4" />
              Invite Admin
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-surface-container-high flex gap-4">
        <button
          onClick={() => setActiveTab('team')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'team'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Administrative Officers ({team.length})
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'matrix'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Dynamic Permission Matrix
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-lg bg-error-container/20 border border-error text-error flex items-center gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <div className="bg-surface-container-low border border-surface-container-high rounded-xl overflow-hidden shadow-sm">
          {isTeamLoading ? (
            <div className="p-12 text-center text-sm text-on-surface-variant animate-pulse">
              Loading administrative roster...
            </div>
          ) : team.length === 0 ? (
            <div className="p-12 text-center text-sm text-on-surface-variant">
              No administrative users enrolled.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-container border-b border-surface-container-high text-xs uppercase tracking-wider text-on-surface-variant">
                  <tr>
                    <th className="py-3 px-4">Name / Official</th>
                    <th className="py-3 px-4">Official Email</th>
                    <th className="py-3 px-4">Designated Role</th>
                    <th className="py-3 px-4">2FA Enforced</th>
                    <th className="py-3 px-4">Enrolled Date</th>
                    <th className="py-3 px-4 text-right">Access Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high">
                  {team.map((member) => (
                    <tr key={member.id} className="hover:bg-surface-container transition-colors">
                      <td className="py-3.5 px-4 font-medium text-on-surface">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-surface-container-highest text-primary flex items-center justify-center font-bold text-xs">
                            {member.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold">{member.full_name}</p>
                            <span className="text-[10px] text-outline">{member.id.substring(0, 8)}...</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-on-surface-variant font-mono text-xs">{member.email}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs uppercase font-bold px-2 py-0.5 rounded border ${
                            member.role === 'admin'
                              ? 'bg-primary-container text-on-primary-container border-primary'
                              : member.role === 'subadmin'
                              ? 'bg-secondary-container/20 text-secondary border-secondary'
                              : member.role === 'reviewer'
                              ? 'bg-surface-container-high text-primary border-outline'
                              : 'bg-surface-container-high text-on-surface-variant border-outline'
                          }`}
                        >
                          {member.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {member.totp_enabled ? (
                          <span className="flex items-center gap-1.5 text-xs text-secondary font-medium">
                            <CheckCircle className="w-4 h-4" />
                            Active (TOTP)
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs text-tertiary-container font-medium">
                            <Lock className="w-4 h-4" />
                            Pending Enrollment
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-on-surface-variant">
                        {new Date(member.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isSuperAdmin ? (
                          <button
                            onClick={() => handleOpenRoleModal(member)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-surface-container-highest hover:bg-surface-container-high text-primary font-medium"
                          >
                            Modify Role
                          </button>
                        ) : (
                          <span className="text-xs text-outline italic">Admin Managed</span>
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

      {/* Dynamic Permission Matrix Tab */}
      {activeTab === 'matrix' && (
        <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-serif font-bold text-on-surface">LawGPT Statutory Permission Grid</h2>
            <p className="text-xs text-on-surface-variant">
              Every sensitive action is protected by granular capabilities mapped to designated role tiers. Wildcards
              (`*`) grant superuser authority.
            </p>
          </div>

          {isMatrixLoading ? (
            <div className="p-8 text-center text-sm text-on-surface-variant animate-pulse">
              Calculating permission mapping...
            </div>
          ) : matrixData ? (
            <div className="overflow-x-auto border border-surface-container-high rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container border-b border-surface-container-high uppercase tracking-wider text-on-surface-variant">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Permission Capability</th>
                    {matrixData.roles.map((role) => (
                      <th key={role} className="py-3 px-4 font-semibold text-center uppercase">
                        {role}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high">
                  {matrixData.permissions.map((perm) => (
                    <tr key={perm} className="hover:bg-surface-container transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-on-surface">{perm}</td>
                      {matrixData.roles.map((role) => {
                        const rolePerms = matrixData.matrix[role] || [];
                        const hasPerm = rolePerms.includes('*') || rolePerms.includes(perm);
                        return (
                          <td key={role} className="py-3 px-4 text-center">
                            {hasPerm ? (
                              <CheckCircle className="w-4 h-4 text-secondary mx-auto" />
                            ) : (
                              <XCircle className="w-4 h-4 text-outline/40 mx-auto" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      )}

      {/* Invite Admin Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container-low border border-surface-container-high rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-primary">
              <ShieldCheck className="w-6 h-6" />
              <h3 className="text-lg font-serif font-bold text-on-surface">Enroll Administrative Officer</h3>
            </div>
            <p className="text-xs text-on-surface-variant">
              Create an administrative credential. The officer must configure TOTP 2FA upon their initial sign-in.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                inviteMutation.mutate(inviteData);
              }}
              className="space-y-4 pt-2"
            >
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  placeholder="Adv. Rajesh Kumar"
                  value={inviteData.fullName}
                  onChange={(e) => setInviteData({ ...inviteData, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container border border-surface-container-highest rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Official Email</label>
                <input
                  type="email"
                  required
                  placeholder="rajesh@lawgpt.in"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container border border-surface-container-highest rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                  value={inviteData.initialPassword}
                  onChange={(e) => setInviteData({ ...inviteData, initialPassword: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container border border-surface-container-highest rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Assigned Role</label>
                <select
                  value={inviteData.role}
                  onChange={(e) =>
                    setInviteData({
                      ...inviteData,
                      role: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 bg-surface-container border border-surface-container-highest rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="support">Support (Read-only dossiers, user quotas)</option>
                  <option value="reviewer">Reviewer (Content draft, AI logs inspection, QA)</option>
                  <option value="subadmin">Subadmin (User moderation, content publishing, sessions)</option>
                  <option value="admin">Admin (Full superuser access & team control)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-surface-container-high text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteMutation.isPending}
                  className="px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded-lg hover:brightness-105 disabled:opacity-50"
                >
                  {inviteMutation.isPending ? 'Enrolling...' : 'Enroll Official'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modify Role Confirmation Modal */}
      {roleModalOpen && selectedMember && (
        <ConfirmationModal
          isOpen={roleModalOpen}
          title={`Modify Role for ${selectedMember.full_name}`}
          message={
            selectedMember.role === 'admin' && newRole !== 'admin'
              ? 'Warning: You are demoting an Admin. The system prevents demoting the last active administrator.'
              : `Select a new role tier for ${selectedMember.email}. Their capabilities will update instantly across all sessions.`
          }
          confirmLabel={changeRoleMutation.isPending ? 'Updating...' : 'Confirm Role Change'}
          onConfirm={() => {
            changeRoleMutation.mutate({ id: selectedMember.id, role: newRole });
          }}
          onCancel={() => {
            setRoleModalOpen(false);
            setSelectedMember(null);
          }}
        >
          <div className="mt-4">
            <label className="block text-xs font-semibold text-on-surface-variant mb-2">New Administrative Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as any)}
              className="w-full px-3 py-2 bg-surface-container border border-surface-container-highest rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary"
            >
              <option value="support">Support</option>
              <option value="reviewer">Reviewer</option>
              <option value="subadmin">Subadmin</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </ConfirmationModal>
      )}
    </div>
  );
};
