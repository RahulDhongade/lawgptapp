import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  PhoneCall,
  UserX,
  Plus,
  RefreshCw,
  AlertTriangle,
  Lock,
  Globe,
  Trash2,
  Clock,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ConfirmationModal } from '../components/common/ConfirmationModal';

interface AppConfigItem {
  key: string;
  value: any;
  valueType: string;
  description: string | null;
  isPublic: boolean;
  updatedBy: string;
  updatedAt: string;
}

interface DirectoryEntry {
  id: string;
  name: string;
  number: string;
  category: string;
  state: string;
  source_url: string;
  verified_on: string;
  is_active: number;
}

interface DeletionRequest {
  id: string;
  user_id: string;
  user_identifier: string;
  status: 'pending' | 'completed' | 'rejected';
  sla_due_date: string;
  isOverdue: boolean;
  daysRemaining: number | null;
  completed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export const ConfigPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuth();

  const [activeTab, setActiveTab] = useState<'config' | 'directory' | 'dpdp'>('config');

  // Config Modal
  const [configModal, setConfigModal] = useState<{ isNew: boolean; item?: AppConfigItem } | null>(null);
  const [configForm, setConfigForm] = useState({
    key: '',
    valueString: '',
    valueType: 'string' as 'boolean' | 'string' | 'number' | 'object',
    description: '',
    isPublic: true,
  });

  // Directory Modal
  const [dirModal, setDirModal] = useState(false);
  const [dirForm, setDirForm] = useState({
    name: '',
    number: '',
    category: 'police',
    state: 'National',
    sourceUrl: 'https://',
    verifiedOn: new Date().toISOString().slice(0, 10),
  });

  // DPDP Modals
  const [fulfillModal, setFulfillModal] = useState<DeletionRequest | null>(null);
  const [rejectModal, setRejectModal] = useState<DeletionRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Queries
  const { data: configData, isLoading: isConfigLoading, refetch: refetchConfig } = useQuery<{ configs: AppConfigItem[] }>({
    queryKey: ['admin-config-list'],
    queryFn: async () => await apiClient.get('/api/admin/config-mgmt'),
    enabled: activeTab === 'config',
  });

  const { data: dirData, isLoading: isDirLoading, refetch: refetchDir } = useQuery<{ entries: DirectoryEntry[] }>({
    queryKey: ['admin-dir-list'],
    queryFn: async () => await apiClient.get('/api/admin/directory'),
    enabled: activeTab === 'directory',
  });

  const { data: dpdpData, isLoading: isDpdpLoading, refetch: refetchDpdp } = useQuery<{
    stats: { total: number; pending: number; completed: number };
    requests: DeletionRequest[];
  }>({
    queryKey: ['admin-dpdp-list'],
    queryFn: async () => await apiClient.get('/api/admin/dpdp/requests'),
    enabled: activeTab === 'dpdp',
  });

  // Mutations
  const saveConfigMutation = useMutation({
    mutationFn: async ({ key, payload }: { key: string; payload: any }) => {
      return await apiClient.put(`/api/admin/config-mgmt/${key}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-config-list'] });
      setConfigModal(null);
      setErrorMessage(null);
    },
    onError: (err: any) => setErrorMessage(err.message || 'Failed to save configuration'),
  });

  const deleteConfigMutation = useMutation({
    mutationFn: async (key: string) => {
      return await apiClient.delete(`/api/admin/config-mgmt/${key}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-config-list'] });
    },
  });

  const createDirMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await apiClient.post('/api/admin/directory', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dir-list'] });
      setDirModal(false);
      setErrorMessage(null);
    },
    onError: (err: any) => setErrorMessage(err.message || 'Failed to add directory entry'),
  });

  const deactivateDirMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete(`/api/admin/directory/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dir-list'] });
    },
  });

  const fulfillErasureMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.post(`/api/admin/dpdp/requests/${id}/fulfill`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dpdp-list'] });
      setFulfillModal(null);
      setErrorMessage(null);
    },
    onError: (err: any) => setErrorMessage(err.message || 'Failed to fulfill erasure'),
  });

  const rejectErasureMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return await apiClient.post(`/api/admin/dpdp/requests/${id}/reject`, { rejectionReason: reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dpdp-list'] });
      setRejectModal(null);
      setRejectReason('');
      setErrorMessage(null);
    },
    onError: (err: any) => setErrorMessage(err.message || 'Failed to reject erasure request'),
  });

  const isAdmin = user?.role === 'admin';
  const canManageDir = hasPermission('directory.manage');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-bold text-on-surface">System Configuration & Statutory DPDP</h1>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-secondary-container/20 text-secondary border border-secondary">
              DPDP Act 2023 SLA Compliant
            </span>
          </div>
          <p className="text-sm text-on-surface-variant">
            Manage remote dynamic parameters, emergency directory helplines, and handle statutory data erasure queues.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (activeTab === 'config') refetchConfig();
              if (activeTab === 'directory') refetchDir();
              if (activeTab === 'dpdp') refetchDpdp();
            }}
            className="p-2 rounded-lg border border-surface-container-high bg-surface-container-low hover:bg-surface-container text-on-surface-variant"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {activeTab === 'config' && isAdmin && (
            <button
              onClick={() => {
                setConfigForm({ key: '', valueString: '', valueType: 'string', description: '', isPublic: true });
                setConfigModal({ isNew: true });
              }}
              className="px-4 py-2 bg-primary text-on-primary font-semibold rounded-lg text-sm flex items-center gap-2 shadow-sm hover:brightness-105"
            >
              <Plus className="w-4 h-4" />
              New Config Parameter
            </button>
          )}
          {activeTab === 'directory' && canManageDir && (
            <button
              onClick={() => setDirModal(true)}
              className="px-4 py-2 bg-primary text-on-primary font-semibold rounded-lg text-sm flex items-center gap-2 shadow-sm hover:brightness-105"
            >
              <Plus className="w-4 h-4" />
              Add Helpline Entry
            </button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-lg bg-error-container/20 border border-error text-error flex items-center gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-auto text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-surface-container-high flex gap-4">
        <button
          onClick={() => setActiveTab('config')}
          className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'config'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Settings className="w-4 h-4" />
          Remote App Config & Feature Flags
        </button>
        <button
          onClick={() => setActiveTab('directory')}
          className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'directory'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          Emergency & Legal Directory
        </button>
        <button
          onClick={() => setActiveTab('dpdp')}
          className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'dpdp'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <UserX className="w-4 h-4" />
          DPDP Act 2023 Erasure Queue ({dpdpData?.stats.pending ?? '...'})
        </button>
      </div>

      {/* TAB 1: REMOTE APP CONFIG */}
      {activeTab === 'config' && (
        <div className="bg-surface-container-low border border-surface-container-high rounded-xl overflow-hidden shadow-sm">
          {isConfigLoading ? (
            <div className="p-12 text-center text-sm text-on-surface-variant animate-pulse">
              Loading dynamic configurations...
            </div>
          ) : !configData || configData.configs.length === 0 ? (
            <div className="p-12 text-center text-sm text-on-surface-variant">
              No configurations found. Standard defaults are active.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container border-b border-surface-container-high uppercase tracking-wider text-on-surface-variant">
                  <tr>
                    <th className="py-3 px-4">Configuration Key</th>
                    <th className="py-3 px-4">Current Value</th>
                    <th className="py-3 px-4">Data Type</th>
                    <th className="py-3 px-4">Exposure Tier</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high">
                  {configData.configs.map((c) => (
                    <tr key={c.key} className="hover:bg-surface-container transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-primary">{c.key}</td>
                      <td className="py-3 px-4 font-mono max-w-xs truncate text-on-surface">
                        {typeof c.value === 'object' ? JSON.stringify(c.value) : String(c.value)}
                      </td>
                      <td className="py-3 px-4 uppercase text-[10px] font-semibold text-outline">{c.valueType}</td>
                      <td className="py-3 px-4">
                        {c.isPublic ? (
                          <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-secondary">
                            <Globe className="w-3 h-3" />
                            Public API
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-outline">
                            <Lock className="w-3 h-3" />
                            Internal Server
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-outline truncate max-w-xs">{c.description || '—'}</td>
                      <td className="py-3 px-4 text-right">
                        {isAdmin ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setConfigForm({
                                  key: c.key,
                                  valueString:
                                    typeof c.value === 'object' ? JSON.stringify(c.value, null, 2) : String(c.value),
                                  valueType: c.valueType as any,
                                  description: c.description || '',
                                  isPublic: c.isPublic,
                                });
                                setConfigModal({ isNew: false, item: c });
                              }}
                              className="px-2.5 py-1 rounded border border-surface-container-highest hover:bg-surface-container-high text-primary font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteConfigMutation.mutate(c.key)}
                              className="p-1 rounded text-error hover:bg-error-container/20"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-outline italic text-[11px]">Protected</span>
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

      {/* TAB 2: EMERGENCY DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="bg-surface-container-low border border-surface-container-high rounded-xl overflow-hidden shadow-sm">
          {isDirLoading ? (
            <div className="p-12 text-center text-sm text-on-surface-variant animate-pulse">
              Loading national emergency helpline catalog...
            </div>
          ) : !dirData || dirData.entries.length === 0 ? (
            <div className="p-12 text-center text-sm text-on-surface-variant">
              No emergency directory records registered. Add verified helplines above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container border-b border-surface-container-high uppercase tracking-wider text-on-surface-variant">
                  <tr>
                    <th className="py-3 px-4">Authority / Agency Name</th>
                    <th className="py-3 px-4">Helpline Number</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Jurisdiction</th>
                    <th className="py-3 px-4">Last Verified</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high">
                  {dirData.entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-surface-container transition-colors">
                      <td className="py-3 px-4 font-semibold text-on-surface">{entry.name}</td>
                      <td className="py-3 px-4 font-mono font-bold text-primary">{entry.number}</td>
                      <td className="py-3 px-4 uppercase text-[10px] font-semibold text-outline">{entry.category}</td>
                      <td className="py-3 px-4 text-outline font-medium">{entry.state}</td>
                      <td className="py-3 px-4 text-outline font-mono">{entry.verified_on}</td>
                      <td className="py-3 px-4">
                        {entry.is_active ? (
                          <span className="px-2 py-0.5 rounded bg-secondary-container/20 text-secondary border border-secondary text-[10px] font-bold">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-surface-container-highest text-outline text-[10px] font-bold">
                            Deactivated
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {canManageDir && entry.is_active ? (
                          <button
                            onClick={() => deactivateDirMutation.mutate(entry.id)}
                            className="px-2 py-1 rounded text-error hover:bg-error-container/20 text-[11px]"
                          >
                            Deactivate
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DPDP ACT ERASURE QUEUE */}
      {activeTab === 'dpdp' && (
        <div className="space-y-4">
          {/* Statutory SLA Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-surface-container-low border border-surface-container-high rounded-xl">
              <span className="text-xs text-outline font-semibold uppercase">Pending Erasure Requests</span>
              <p className="text-2xl font-serif font-bold text-primary mt-1">{dpdpData?.stats.pending || 0}</p>
            </div>
            <div className="p-4 bg-surface-container-low border border-surface-container-high rounded-xl">
              <span className="text-xs text-outline font-semibold uppercase">Statutory SLA Compliance</span>
              <p className="text-2xl font-serif font-bold text-secondary mt-1">30 Days Max</p>
            </div>
            <div className="p-4 bg-surface-container-low border border-surface-container-high rounded-xl">
              <span className="text-xs text-outline font-semibold uppercase">Fulfilled Deletions</span>
              <p className="text-2xl font-serif font-bold text-on-surface mt-1">{dpdpData?.stats.completed || 0}</p>
            </div>
          </div>

          <div className="bg-surface-container-low border border-surface-container-high rounded-xl overflow-hidden shadow-sm">
            {isDpdpLoading ? (
              <div className="p-12 text-center text-sm text-on-surface-variant animate-pulse">
                Querying DPDP statutory queue...
              </div>
            ) : !dpdpData || dpdpData.requests.length === 0 ? (
              <div className="p-12 text-center text-sm text-on-surface-variant">
                No active DPDP data erasure requests registered.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container border-b border-surface-container-high uppercase tracking-wider text-on-surface-variant">
                    <tr>
                      <th className="py-3 px-4">Request ID</th>
                      <th className="py-3 px-4">Data Principal Identifier</th>
                      <th className="py-3 px-4">Submitted Date</th>
                      <th className="py-3 px-4">Statutory SLA Deadline</th>
                      <th className="py-3 px-4">Days Remaining</th>
                      <th className="py-3 px-4">Current Status</th>
                      <th className="py-3 px-4 text-right">Statutory Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high">
                    {dpdpData.requests.map((req) => (
                      <tr key={req.id} className="hover:bg-surface-container transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-primary">{req.id}</td>
                        <td className="py-3 px-4 font-mono text-on-surface">{req.user_identifier}</td>
                        <td className="py-3 px-4 text-outline font-mono">
                          {new Date(req.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 font-mono text-on-surface font-semibold">
                          {new Date(req.sla_due_date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {req.status === 'pending' ? (
                            req.isOverdue ? (
                              <span className="text-error font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                OVERDUE
                              </span>
                            ) : (
                              <span className="text-secondary font-bold flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {req.daysRemaining} days left
                              </span>
                            )
                          ) : (
                            <span className="text-outline">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                              req.status === 'completed'
                                ? 'bg-secondary-container/20 text-secondary border-secondary'
                                : req.status === 'rejected'
                                ? 'bg-error-container/20 text-error border-error'
                                : 'bg-primary-container text-on-primary-container border-primary'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {req.status === 'pending' && isAdmin ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setFulfillModal(req)}
                                className="px-2.5 py-1 rounded bg-error-container text-on-error hover:bg-error-container/80 text-[10px] font-bold"
                              >
                                Fulfill Erasure
                              </button>
                              <button
                                onClick={() => setRejectModal(req)}
                                className="px-2.5 py-1 rounded border border-surface-container-highest hover:bg-surface-container-high text-on-surface-variant text-[10px]"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-outline text-[11px] italic">Completed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit/Create Config Modal */}
      {configModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container-low border border-surface-container-high rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-serif font-bold text-on-surface">
              {configModal.isNew ? 'Create Configuration Key' : `Edit ${configForm.key}`}
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                let parsedVal: any = configForm.valueString;
                if (configForm.valueType === 'boolean') {
                  parsedVal = configForm.valueString === 'true';
                } else if (configForm.valueType === 'number') {
                  parsedVal = Number(configForm.valueString);
                } else if (configForm.valueType === 'object') {
                  try {
                    parsedVal = JSON.parse(configForm.valueString);
                  } catch {
                    setErrorMessage('Invalid JSON format for object value.');
                    return;
                  }
                }

                saveConfigMutation.mutate({
                  key: configForm.key,
                  payload: {
                    value: parsedVal,
                    valueType: configForm.valueType,
                    description: configForm.description,
                    isPublic: configForm.isPublic,
                  },
                });
              }}
              className="space-y-3 pt-2 text-xs"
            >
              <div>
                <label className="block font-semibold text-on-surface mb-1">Configuration Key</label>
                <input
                  type="text"
                  required
                  disabled={!configModal.isNew}
                  placeholder="e.g. guest_question_limit"
                  value={configForm.key}
                  onChange={(e) => setConfigForm({ ...configForm, key: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container border border-surface-container-highest rounded-lg text-on-surface font-mono disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1">Data Type</label>
                <select
                  value={configForm.valueType}
                  onChange={(e) => setConfigForm({ ...configForm, valueType: e.target.value as any })}
                  className="w-full px-3 py-2 bg-surface-container border border-surface-container-highest rounded-lg text-on-surface"
                >
                  <option value="string">String</option>
                  <option value="boolean">Boolean</option>
                  <option value="number">Number</option>
                  <option value="object">JSON Object</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1">Value</label>
                {configForm.valueType === 'object' ? (
                  <textarea
                    rows={4}
                    required
                    value={configForm.valueString}
                    onChange={(e) => setConfigForm({ ...configForm, valueString: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-surface-container-highest rounded-lg text-on-surface font-mono"
                  />
                ) : (
                  <input
                    type="text"
                    required
                    value={configForm.valueString}
                    onChange={(e) => setConfigForm({ ...configForm, valueString: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-surface-container-highest rounded-lg text-on-surface font-mono"
                  />
                )}
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Brief explanation of parameter effect"
                  value={configForm.description}
                  onChange={(e) => setConfigForm({ ...configForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-surface-container-highest rounded-lg text-on-surface"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPublicCheck"
                  checked={configForm.isPublic}
                  onChange={(e) => setConfigForm({ ...configForm, isPublic: e.target.checked })}
                  className="w-4 h-4 text-primary rounded"
                />
                <label htmlFor="isPublicCheck" className="font-semibold text-on-surface">
                  Expose via public GET /api/config
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setConfigModal(null)}
                  className="px-4 py-2 rounded-lg border border-surface-container-high text-on-surface-variant"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveConfigMutation.isPending}
                  className="px-4 py-2 bg-primary text-on-primary font-semibold rounded-lg hover:brightness-105"
                >
                  Save Parameter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Directory Modal */}
      {dirModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container-low border border-surface-container-high rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-serif font-bold text-on-surface">Register Emergency Helpline</h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createDirMutation.mutate(dirForm);
              }}
              className="space-y-3 pt-2 text-xs"
            >
              <div>
                <label className="block font-semibold text-on-surface mb-1">Authority / Agency Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Women in Distress Helpline"
                  value={dirForm.name}
                  onChange={(e) => setDirForm({ ...dirForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container border border-surface-container-highest rounded-lg text-on-surface"
                />
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1">Helpline Number</label>
                <input
                  type="text"
                  required
                  placeholder="1091"
                  value={dirForm.number}
                  onChange={(e) => setDirForm({ ...dirForm, number: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container border border-surface-container-highest rounded-lg text-on-surface font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1">Category</label>
                <select
                  value={dirForm.category}
                  onChange={(e) => setDirForm({ ...dirForm, category: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container border border-surface-container-highest rounded-lg text-on-surface"
                >
                  <option value="police">Police</option>
                  <option value="women_helpline">Women Safety</option>
                  <option value="child_helpline">Child Protection</option>
                  <option value="cyber_crime">Cyber Crime</option>
                  <option value="legal_aid">Legal Aid / NALSA</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1">Official Verification URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={dirForm.sourceUrl}
                  onChange={(e) => setDirForm({ ...dirForm, sourceUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-surface-container-highest rounded-lg text-on-surface"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setDirModal(false)}
                  className="px-4 py-2 rounded-lg border border-surface-container-high text-on-surface-variant"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDirMutation.isPending}
                  className="px-4 py-2 bg-primary text-on-primary font-semibold rounded-lg hover:brightness-105"
                >
                  Register Helpline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fulfill Erasure Modal */}
      {fulfillModal && (
        <ConfirmationModal
          isOpen={!!fulfillModal}
          title="Fulfill Irreversible DPDP Data Erasure"
          message={`Executing erasure for Data Principal ${fulfillModal.user_identifier}. This will permanently anonymize their profile, invalidate all tokens, and close the account pursuant to the Digital Personal Data Protection Act, 2023.`}
          confirmLabel={fulfillErasureMutation.isPending ? 'Executing...' : 'Confirm Erasure'}
          isDestructive={true}
          onConfirm={() => fulfillErasureMutation.mutate(fulfillModal.id)}
          onCancel={() => setFulfillModal(null)}
        />
      )}

      {/* Reject Erasure Modal */}
      {rejectModal && (
        <ConfirmationModal
          isOpen={!!rejectModal}
          title="Reject Data Erasure Request"
          message="Rejection of a DPDP erasure request requires statutory justification (e.g. pending legal obligation or law enforcement investigation)."
          confirmLabel={rejectErasureMutation.isPending ? 'Rejecting...' : 'Reject Request'}
          onConfirm={() => {
            if (!rejectReason) {
              setErrorMessage('Justification reason is required.');
              return;
            }
            rejectErasureMutation.mutate({ id: rejectModal.id, reason: rejectReason });
          }}
          onCancel={() => {
            setRejectModal(null);
            setRejectReason('');
          }}
        >
          <div className="mt-4">
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">
              Statutory Justification Reason
            </label>
            <textarea
              rows={3}
              required
              placeholder="Record statutory retention ground..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-surface-container-highest rounded-lg text-xs text-on-surface"
            />
          </div>
        </ConfirmationModal>
      )}
    </div>
  );
};
