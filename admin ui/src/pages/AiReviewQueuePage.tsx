import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Eye,
  PlusCircle,
  Play,
  RefreshCw,
  Settings,
  Send,
  Zap,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ConfirmationModal } from '../components/common/ConfirmationModal';

interface ChatLogItem {
  id: string;
  user_id_hash: string;
  question: string;
  answer: string;
  citations: string[];
  model: string;
  prompt_version: string;
  latency_ms: number;
  risk_level: 'HIGH' | 'MEDIUM' | 'LOW';
  flags: string[];
  review_status: 'pending' | 'approved' | 'corrected' | 'blocked';
  reviewer_notes: string | null;
  reviewer_name: string | null;
  reviewed_at: string | null;
  created_at: string;
}

interface QATestCase {
  id: string;
  category: string;
  question: string;
  expected_statute: string;
  critical_directive: string;
  risk_level: string;
  last_run_answer: string | null;
  last_run_latency_ms: number | null;
  last_run_citations: string | null;
  reviewer_verdict: 'PASS' | 'FAIL' | 'FLAGGED' | null;
  reviewer_notes: string | null;
  score: number | null;
  updated_at: string;
}

interface AISettings {
  model: string;
  systemPrompt: string;
  promptVersion: string;
  citationRequired: boolean;
  retentionDays: number;
  blockedKeywords: string[];
}

export const AiReviewQueuePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const [activeTab, setActiveTab] = useState<'queue' | 'benchmarks' | 'settings'>('queue');

  // Review Queue Filters
  const [queueStatus, setQueueStatus] = useState<string>('pending');
  const [queueRisk, setQueueRisk] = useState<string>('');
  const [selectedChat, setSelectedChat] = useState<ChatLogItem | null>(null);

  // Review Action Modal
  const [actionModal, setActionModal] = useState<{
    action: 'approve' | 'correct' | 'block_topic' | 'add_to_test_set';
    title: string;
    chatId: string;
  } | null>(null);
  const [actionForm, setActionForm] = useState({
    notes: '',
    correctionText: '',
    blockedKeyword: '',
  });

  // QA Verdict Modal
  const [verdictModal, setVerdictModal] = useState<{
    caseId: string;
    verdict: 'PASS' | 'FAIL' | 'FLAGGED';
    notes: string;
  } | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch Review Queue
  const {
    data: queueData,
    isLoading: isQueueLoading,
    refetch: refetchQueue,
  } = useQuery<{
    counts: { total: number; pending: number; highRiskPending: number };
    items: ChatLogItem[];
  }>({
    queryKey: ['ai-review-queue', queueStatus, queueRisk],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (queueStatus) params.append('status', queueStatus);
      if (queueRisk) params.append('riskLevel', queueRisk);
      return await apiClient.get(`/api/admin/ai/review-queue?${params.toString()}`);
    },
    enabled: activeTab === 'queue',
  });

  // Fetch QA Benchmarks
  const {
    data: qaData,
    isLoading: isQaLoading,
    refetch: refetchQA,
  } = useQuery<{
    metrics: { total: number; passCount: number; failCount: number; passRatePercent: number; averageLatencyMs: number };
    testCases: QATestCase[];
  }>({
    queryKey: ['ai-qa-benchmarks'],
    queryFn: async () => {
      return await apiClient.get('/api/admin/ai/qa-benchmarks');
    },
    enabled: activeTab === 'benchmarks',
  });

  // Fetch AI Settings
  const {
    data: settingsData,
    refetch: refetchSettings,
  } = useQuery<AISettings>({
    queryKey: ['ai-settings'],
    queryFn: async () => {
      return await apiClient.get('/api/admin/ai/settings');
    },
    enabled: activeTab === 'settings',
  });

  // Review Action Mutation
  const reviewActionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof actionForm & { action: string } }) => {
      return await apiClient.post(`/api/admin/ai/review-queue/${id}/action`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-review-queue'] });
      setActionModal(null);
      setSelectedChat(null);
      setActionForm({ notes: '', correctionText: '', blockedKeyword: '' });
      setErrorMessage(null);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to submit review verdict');
    },
  });

  // Run QA Evaluation Mutation
  const runQaMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.post('/api/admin/ai/qa-benchmarks/run');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-qa-benchmarks'] });
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Benchmark run failed');
    },
  });

  // Sync QA Questions Mutation
  const syncQaMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.post('/api/admin/ai/qa-benchmarks/sync');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-qa-benchmarks'] });
    },
  });

  // QA Verdict Mutation
  const verdictMutation = useMutation({
    mutationFn: async (payload: { caseId: string; verdict: string; notes: string }) => {
      return await apiClient.post(`/api/admin/ai/qa-benchmarks/${payload.caseId}/verdict`, {
        verdict: payload.verdict,
        notes: payload.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-qa-benchmarks'] });
      setVerdictModal(null);
    },
  });

  // Save Settings Mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (payload: Partial<AISettings>) => {
      return await apiClient.patch('/api/admin/ai/settings', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-settings'] });
      setErrorMessage(null);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to update AI settings');
    },
  });

  // Purge Logs Mutation
  const purgeMutation = useMutation({
    mutationFn: async (retentionDays: number) => {
      return await apiClient.post('/api/admin/ai/purge-logs', { retentionDays });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-review-queue'] });
    },
  });

  const canPromptEdit = hasPermission('ai.prompt_edit');

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'HIGH':
        return 'bg-error-container/20 text-error border-error';
      case 'MEDIUM':
        return 'bg-primary-container text-on-primary-container border-primary';
      case 'LOW':
      default:
        return 'bg-secondary-container/20 text-secondary border-secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-bold text-on-surface">AI Observability & Quality Assurance</h1>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-primary-container/20 text-primary border border-primary">
              Human-in-the-Loop Active
            </span>
          </div>
          <p className="text-sm text-on-surface-variant">
            Inspect live legal telemetries, flag hallucinated statutes, execute QA suites, and tune prompts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (activeTab === 'queue') refetchQueue();
              if (activeTab === 'benchmarks') refetchQA();
              if (activeTab === 'settings') refetchSettings();
            }}
            className="p-2 rounded-lg border border-surface-container-high bg-surface-container-low hover:bg-surface-container text-on-surface-variant"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
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
          onClick={() => setActiveTab('queue')}
          className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'queue'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Flagged Review Queue ({queueData?.counts.pending ?? '...'})
        </button>
        <button
          onClick={() => setActiveTab('benchmarks')}
          className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'benchmarks'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Zap className="w-4 h-4" />
          Statutory QA Benchmarks ({qaData?.metrics.total ?? '...'})
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'settings'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Settings className="w-4 h-4" />
          Model & Prompt Settings
        </button>
      </div>

      {/* TAB 1: REVIEW QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-surface-container-low border border-surface-container-high rounded-xl">
              <span className="text-xs text-outline font-semibold uppercase">Pending Human Triage</span>
              <p className="text-2xl font-serif font-bold text-on-surface mt-1">
                {queueData?.counts.pending || 0}
              </p>
            </div>
            <div className="p-4 bg-surface-container-low border border-error/30 rounded-xl">
              <span className="text-xs text-error font-semibold uppercase">High-Risk Triggers</span>
              <p className="text-2xl font-serif font-bold text-error mt-1">
                {queueData?.counts.highRiskPending || 0}
              </p>
            </div>
            <div className="p-4 bg-surface-container-low border border-surface-container-high rounded-xl">
              <span className="text-xs text-outline font-semibold uppercase">All Recorded Logs</span>
              <p className="text-2xl font-serif font-bold text-primary mt-1">
                {queueData?.counts.total || 0}
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-3 flex gap-4 items-center">
            <select
              value={queueStatus}
              onChange={(e) => setQueueStatus(e.target.value)}
              className="px-3 py-1.5 bg-surface-container border border-surface-container-highest rounded-lg text-xs text-on-surface"
            >
              <option value="pending">Status: Pending Review</option>
              <option value="approved">Status: Approved Safe</option>
              <option value="corrected">Status: Corrected</option>
              <option value="blocked">Status: Blocked Topic</option>
              <option value="all">Status: All Telemetry</option>
            </select>

            <select
              value={queueRisk}
              onChange={(e) => setQueueRisk(e.target.value)}
              className="px-3 py-1.5 bg-surface-container border border-surface-container-highest rounded-lg text-xs text-on-surface"
            >
              <option value="">All Risk Tiers</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Low Risk</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-surface-container-low border border-surface-container-high rounded-xl overflow-hidden shadow-sm">
            {isQueueLoading ? (
              <div className="p-12 text-center text-sm text-on-surface-variant animate-pulse">
                Loading review queue telemetries...
              </div>
            ) : !queueData || queueData.items.length === 0 ? (
              <div className="p-12 text-center text-sm text-on-surface-variant">
                No telemetry logs matching the criteria. Review queue is clear!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container border-b border-surface-container-high uppercase tracking-wider text-on-surface-variant">
                    <tr>
                      <th className="py-3 px-4">User Legal Query</th>
                      <th className="py-3 px-4">Risk Severity</th>
                      <th className="py-3 px-4">Automated Triggers</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Latency</th>
                      <th className="py-3 px-4">Logged At</th>
                      <th className="py-3 px-4 text-right">Triage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high">
                    {queueData.items.map((chat) => (
                      <tr key={chat.id} className="hover:bg-surface-container transition-colors">
                        <td className="py-3 px-4 font-medium text-on-surface max-w-xs truncate" title={chat.question}>
                          <p className="font-semibold">{chat.question}</p>
                          <span className="text-[10px] text-outline truncate block">{chat.answer}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getRiskColor(chat.risk_level)}`}>
                            {chat.risk_level}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {chat.flags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {chat.flags.map((f, i) => (
                                <span key={i} className="text-[10px] px-1.5 py-0.2 rounded bg-surface-container-highest text-primary">
                                  {f.split(':')[0]}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-outline">None</span>
                          )}
                        </td>
                        <td className="py-3 px-4 uppercase text-[10px] font-semibold text-outline">
                          {chat.review_status}
                        </td>
                        <td className="py-3 px-4 font-mono text-outline">{chat.latency_ms}ms</td>
                        <td className="py-3 px-4 text-outline">{new Date(chat.created_at).toLocaleTimeString()}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedChat(chat)}
                            className="px-2.5 py-1.5 rounded-lg border border-surface-container-highest hover:bg-surface-container-high text-primary font-semibold inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Triage
                          </button>
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

      {/* TAB 2: QA BENCHMARKS */}
      {activeTab === 'benchmarks' && (
        <div className="space-y-4">
          {/* Metrics Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-surface-container-low border border-surface-container-high rounded-xl">
              <span className="text-xs text-outline font-semibold uppercase">Total Benchmarks</span>
              <p className="text-2xl font-serif font-bold text-on-surface mt-1">{qaData?.metrics.total || 0}</p>
            </div>
            <div className="p-4 bg-surface-container-low border border-secondary/30 rounded-xl">
              <span className="text-xs text-secondary font-semibold uppercase">Passing Verdicts</span>
              <p className="text-2xl font-serif font-bold text-secondary mt-1">{qaData?.metrics.passCount || 0}</p>
            </div>
            <div className="p-4 bg-surface-container-low border border-surface-container-high rounded-xl">
              <span className="text-xs text-outline font-semibold uppercase">Statutory Pass Rate</span>
              <p className="text-2xl font-serif font-bold text-primary mt-1">
                {qaData?.metrics.passRatePercent || 0}%
              </p>
            </div>
            <div className="p-4 bg-surface-container-low border border-surface-container-high rounded-xl">
              <span className="text-xs text-outline font-semibold uppercase">Mean Evaluation Latency</span>
              <p className="text-2xl font-serif font-bold text-on-surface mt-1">
                {qaData?.metrics.averageLatencyMs || 0}ms
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-xs text-on-surface-variant">
              Every benchmark requires human advocate verification. Answers are never automatically stamped correct.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => syncQaMutation.mutate()}
                disabled={syncQaMutation.isPending}
                className="px-3 py-1.5 rounded-lg border border-surface-container-high text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
              >
                Sync QA Set
              </button>
              <button
                onClick={() => runQaMutation.mutate()}
                disabled={runQaMutation.isPending}
                className="px-4 py-1.5 bg-primary text-on-primary text-xs font-bold rounded-lg flex items-center gap-1.5 hover:brightness-105"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {runQaMutation.isPending ? 'Running Pipeline...' : 'Run Test Suite'}
              </button>
            </div>
          </div>

          {/* Test Cases Table */}
          <div className="bg-surface-container-low border border-surface-container-high rounded-xl overflow-hidden shadow-sm">
            {isQaLoading ? (
              <div className="p-12 text-center text-sm text-on-surface-variant animate-pulse">
                Evaluating benchmark test suite...
              </div>
            ) : !qaData || qaData.testCases.length === 0 ? (
              <div className="p-12 text-center text-sm text-on-surface-variant space-y-2">
                <p>No benchmark cases loaded.</p>
                <button
                  onClick={() => syncQaMutation.mutate()}
                  className="px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-lg"
                >
                  Sync from /docs/qa-questions.json
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container border-b border-surface-container-high uppercase tracking-wider text-on-surface-variant">
                    <tr>
                      <th className="py-3 px-4">Test ID / Category</th>
                      <th className="py-3 px-4">Question</th>
                      <th className="py-3 px-4">Expected Statute</th>
                      <th className="py-3 px-4">Evaluation Output</th>
                      <th className="py-3 px-4">Latency</th>
                      <th className="py-3 px-4">Human Verdict</th>
                      <th className="py-3 px-4 text-right">Appraise</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high">
                    {qaData.testCases.map((tc) => (
                      <tr key={tc.id} className="hover:bg-surface-container transition-colors">
                        <td className="py-3 px-4 font-mono">
                          <p className="font-semibold text-primary">{tc.id}</p>
                          <span className="text-[10px] text-outline uppercase">{tc.category}</span>
                        </td>
                        <td className="py-3 px-4 font-medium text-on-surface max-w-xs truncate" title={tc.question}>
                          {tc.question}
                        </td>
                        <td className="py-3 px-4 text-outline font-semibold">{tc.expected_statute}</td>
                        <td className="py-3 px-4 text-outline max-w-xs truncate" title={tc.last_run_answer || 'None'}>
                          {tc.last_run_answer || <span className="text-outline italic">Pending Run</span>}
                        </td>
                        <td className="py-3 px-4 font-mono text-outline">
                          {tc.last_run_latency_ms ? `${tc.last_run_latency_ms}ms` : '—'}
                        </td>
                        <td className="py-3 px-4">
                          {tc.reviewer_verdict === 'PASS' ? (
                            <span className="px-2 py-0.5 rounded bg-secondary-container/20 text-secondary border border-secondary text-[10px] font-bold">
                              PASS
                            </span>
                          ) : tc.reviewer_verdict === 'FAIL' ? (
                            <span className="px-2 py-0.5 rounded bg-error-container/20 text-error border border-error text-[10px] font-bold">
                              FAIL
                            </span>
                          ) : (
                            <span className="text-outline italic text-[10px]">Unrated</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => setVerdictModal({ caseId: tc.id, verdict: 'PASS', notes: '' })}
                              className="px-2 py-1 rounded bg-secondary-container/20 text-secondary hover:bg-secondary-container/40 text-[10px] font-bold"
                            >
                              Pass
                            </button>
                            <button
                              onClick={() => setVerdictModal({ caseId: tc.id, verdict: 'FAIL', notes: '' })}
                              className="px-2 py-1 rounded bg-error-container/20 text-error hover:bg-error-container/40 text-[10px] font-bold"
                            >
                              Fail
                            </button>
                          </div>
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

      {/* TAB 3: AI SETTINGS */}
      {activeTab === 'settings' && settingsData && (
        <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-6 shadow-sm space-y-6 max-w-3xl">
          <div className="flex items-center justify-between border-b border-surface-container-high pb-4">
            <div>
              <h2 className="text-lg font-serif font-bold text-on-surface">Legal Engine AI Hyperparameters</h2>
              <p className="text-xs text-on-surface-variant">
                Configure generative model, master prompt directives, and telemetry retention schedules.
              </p>
            </div>
            {!canPromptEdit && (
              <span className="text-xs text-outline italic">Read-only (Requires ai.prompt_edit)</span>
            )}
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-on-surface mb-1">Inference Model</label>
              <select
                disabled={!canPromptEdit}
                value={settingsData.model}
                onChange={(e) => saveSettingsMutation.mutate({ model: e.target.value })}
                className="w-full px-3 py-2 bg-surface-container border border-surface-container-highest rounded-lg text-sm text-on-surface disabled:opacity-50"
              >
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Recommended for Indian Legal Reasoning)</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash (Fast Statutory Retrieval)</option>
                <option value="gpt-4o">GPT-4o</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-on-surface mb-1">System Prompt Directive</label>
              <textarea
                disabled={!canPromptEdit}
                rows={6}
                value={settingsData.systemPrompt}
                onChange={(e) => saveSettingsMutation.mutate({ systemPrompt: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-surface-container-highest rounded-lg font-mono text-xs text-on-surface disabled:opacity-50"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-surface-container rounded-lg border border-surface-container-high">
              <div>
                <p className="font-semibold text-on-surface">Statutory Citation Requirement</p>
                <p className="text-outline text-[11px]">Reject or flag any answer that lacks verified Acts/Section citations.</p>
              </div>
              <input
                type="checkbox"
                disabled={!canPromptEdit}
                checked={settingsData.citationRequired}
                onChange={(e) => saveSettingsMutation.mutate({ citationRequired: e.target.checked })}
                className="w-4 h-4 text-primary rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-surface-container rounded-lg border border-surface-container-high">
              <div>
                <p className="font-semibold text-on-surface">Telemetry Retention Period</p>
                <p className="text-outline text-[11px]">Automatically purge chat logs older than statutory limit.</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  disabled={!canPromptEdit}
                  value={settingsData.retentionDays}
                  onChange={(e) => saveSettingsMutation.mutate({ retentionDays: Number(e.target.value) })}
                  className="w-20 px-2 py-1 bg-surface border border-surface-container-highest rounded text-center text-xs"
                />
                <span className="text-outline">Days</span>
                <button
                  onClick={() => purgeMutation.mutate(settingsData.retentionDays)}
                  className="px-3 py-1 bg-surface-container-highest hover:bg-surface-container-high rounded text-xs font-semibold"
                >
                  Purge Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Chat Triage Drawer */}
      {selectedChat && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-surface-container border-l border-surface-container-high p-6 shadow-2xl flex flex-col justify-between overflow-y-auto space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-surface-container-high pb-4">
                <div>
                  <h2 className="text-lg font-serif font-bold text-on-surface">Telemetry Exchange Triage</h2>
                  <p className="text-xs text-outline font-mono">ID: {selectedChat.id}</p>
                </div>
                <button onClick={() => setSelectedChat(null)} className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface">
                  ✕
                </button>
              </div>

              {/* Exchange Box */}
              <div className="space-y-3">
                <div className="p-3 bg-surface border border-surface-container-high rounded-lg text-xs space-y-1">
                  <span className="font-bold text-primary uppercase text-[10px]">User Query</span>
                  <p className="text-on-surface">{selectedChat.question}</p>
                </div>

                <div className="p-3 bg-surface border border-surface-container-high rounded-lg text-xs space-y-1">
                  <span className="font-bold text-secondary uppercase text-[10px]">AI Generated Advice</span>
                  <p className="text-on-surface-variant leading-relaxed">{selectedChat.answer}</p>
                </div>

                <div className="p-3 bg-surface-container-low rounded-lg text-xs space-y-1">
                  <span className="font-bold text-outline uppercase text-[10px]">Citations Captured</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedChat.citations.length > 0 ? (
                      selectedChat.citations.map((c, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-surface-container text-primary font-mono text-[10px]">
                          {c}
                        </span>
                      ))
                    ) : (
                      <span className="text-error italic">Zero statutory citations present!</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Triage Actions */}
              <div className="pt-4 border-t border-surface-container-high space-y-2">
                <h4 className="text-xs font-bold uppercase text-on-surface-variant">Reviewer Verdict & Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      setActionModal({
                        action: 'approve',
                        title: 'Approve & Clear Flag',
                        chatId: selectedChat.id,
                      })
                    }
                    className="p-2 rounded-lg bg-secondary-container/20 text-secondary border border-secondary hover:bg-secondary-container/30 text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Approve As Safe
                  </button>

                  <button
                    onClick={() =>
                      setActionModal({
                        action: 'correct',
                        title: 'Register Gold-Standard Correction',
                        chatId: selectedChat.id,
                      })
                    }
                    className="p-2 rounded-lg bg-primary-container text-on-primary-container border border-primary hover:bg-primary-container/80 text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Correct Answer
                  </button>

                  <button
                    onClick={() =>
                      setActionModal({
                        action: 'block_topic',
                        title: 'Add Topic to Guardrail Blocklist',
                        chatId: selectedChat.id,
                      })
                    }
                    className="p-2 rounded-lg bg-error-container/20 text-error border border-error hover:bg-error-container/30 text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Block Topic
                  </button>

                  <button
                    onClick={() =>
                      setActionModal({
                        action: 'add_to_test_set',
                        title: 'Promote Query to QA Benchmark Suite',
                        chatId: selectedChat.id,
                      })
                    }
                    className="p-2 rounded-lg bg-surface-container-highest text-primary border border-primary/40 hover:bg-surface-container-high text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Add to QA Suite
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Action Dialog */}
      {actionModal && (
        <ConfirmationModal
          isOpen={!!actionModal}
          title={actionModal.title}
          message="Confirm your human triage decision. All review operations are permanently logged to the append-only audit trail."
          confirmLabel={reviewActionMutation.isPending ? 'Recording...' : 'Confirm Decision'}
          onConfirm={() => {
            reviewActionMutation.mutate({
              id: actionModal.chatId,
              data: { ...actionForm, action: actionModal.action },
            });
          }}
          onCancel={() => setActionModal(null)}
        >
          <div className="mt-4 space-y-3">
            {actionModal.action === 'correct' || actionModal.action === 'add_to_test_set' ? (
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Gold Standard Legal Correction
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Cite exact Section of BNS/BNSS..."
                  value={actionForm.correctionText}
                  onChange={(e) => setActionForm({ ...actionForm, correctionText: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-surface-container-highest rounded-lg text-xs text-on-surface"
                />
              </div>
            ) : null}

            {actionModal.action === 'block_topic' && (
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Guardrail Keyword to Block
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. extortion, judge bribe"
                  value={actionForm.blockedKeyword}
                  onChange={(e) => setActionForm({ ...actionForm, blockedKeyword: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-surface-container-highest rounded-lg text-xs text-on-surface"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Reviewer Evaluation Notes
              </label>
              <textarea
                rows={2}
                placeholder="Optional notes for audit log..."
                value={actionForm.notes}
                onChange={(e) => setActionForm({ ...actionForm, notes: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-surface-container-highest rounded-lg text-xs text-on-surface"
              />
            </div>
          </div>
        </ConfirmationModal>
      )}

      {/* QA Verdict Modal */}
      {verdictModal && (
        <ConfirmationModal
          isOpen={!!verdictModal}
          title={`Register ${verdictModal.verdict} Verdict`}
          message="Confirm the statutory correctness of the AI response for this benchmark."
          confirmLabel="Save Verdict"
          onConfirm={() => {
            verdictMutation.mutate({
              caseId: verdictModal.caseId,
              verdict: verdictModal.verdict,
              notes: verdictModal.notes,
            });
          }}
          onCancel={() => setVerdictModal(null)}
        >
          <div className="mt-4">
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Advocate Review Notes</label>
            <textarea
              rows={3}
              placeholder="Verified against current Supreme Court / High Court precedent..."
              value={verdictModal.notes}
              onChange={(e) => setVerdictModal({ ...verdictModal, notes: e.target.value })}
              className="w-full px-3 py-2 bg-surface border border-surface-container-highest rounded-lg text-xs text-on-surface"
            />
          </div>
        </ConfirmationModal>
      )}
    </div>
  );
};
