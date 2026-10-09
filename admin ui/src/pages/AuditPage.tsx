import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Download,
  Filter,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { apiClient } from '../api/client';

interface AuditLogEntry {
  id: string;
  actor_id: string;
  actor_role: string;
  action: string;
  object_type: string;
  object_id: string;
  before_state: string | null;
  after_state: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface AuditResponse {
  total: number;
  limit: number;
  offset: number;
  logs: AuditLogEntry[];
}

export const AuditPage: React.FC = () => {
  const [filterAction, setFilterAction] = useState('');
  const [filterObjectType, setFilterObjectType] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const [inspectEntry, setInspectEntry] = useState<AuditLogEntry | null>(null);

  const { data, isLoading, refetch } = useQuery<AuditResponse>({
    queryKey: ['audit-logs', filterAction, filterObjectType, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterAction) params.append('action', filterAction);
      if (filterObjectType) params.append('objectType', filterObjectType);
      params.append('limit', pageSize.toString());
      params.append('offset', (page * pageSize).toString());

      return await apiClient.get<AuditResponse>(`/api/admin/audit?${params.toString()}`);
    },
  });

  const handleExportCsv = async () => {
    try {
      const res = await fetch('/api/admin/audit/export/csv', {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lawgpt-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV Export failed', err);
    }
  };

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  const formatJson = (val: string | null) => {
    if (!val) return 'None';
    try {
      return JSON.stringify(JSON.parse(val), null, 2);
    } catch {
      return val;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-bold text-on-surface">Append-Only Audit Trail</h1>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-secondary-container/20 text-secondary border border-secondary">
              Immutable Triggers Active
            </span>
          </div>
          <p className="text-sm text-on-surface-variant">
            Full statutory activity log for LawGPT platform operations. Updates and deletions are physically blocked by
            database triggers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg border border-surface-container-high bg-surface-container-low hover:bg-surface-container text-on-surface-variant"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 bg-primary text-on-primary font-semibold rounded-lg text-sm flex items-center gap-2 shadow-sm hover:brightness-105"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
          <Filter className="w-4 h-4 text-primary" />
          Filters:
        </div>

        <input
          type="text"
          placeholder="Filter by action (e.g. users.suspend)"
          value={filterAction}
          onChange={(e) => {
            setFilterAction(e.target.value);
            setPage(0);
          }}
          className="px-3 py-1.5 bg-surface-container border border-surface-container-highest rounded-lg text-xs text-on-surface focus:outline-none focus:border-primary w-64"
        />

        <input
          type="text"
          placeholder="Filter by object type (e.g. user, content)"
          value={filterObjectType}
          onChange={(e) => {
            setFilterObjectType(e.target.value);
            setPage(0);
          }}
          className="px-3 py-1.5 bg-surface-container border border-surface-container-highest rounded-lg text-xs text-on-surface focus:outline-none focus:border-primary w-64"
        />

        {(filterAction || filterObjectType) && (
          <button
            onClick={() => {
              setFilterAction('');
              setFilterObjectType('');
              setPage(0);
            }}
            className="text-xs text-outline hover:text-on-surface underline ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Log Table */}
      <div className="bg-surface-container-low border border-surface-container-high rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-on-surface-variant animate-pulse">
            Querying audit repository...
          </div>
        ) : !data || data.logs.length === 0 ? (
          <div className="p-12 text-center text-sm text-on-surface-variant">
            No audit records matching the specified criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container border-b border-surface-container-high uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="py-3 px-4">Timestamp (IST)</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Entity Target</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high">
                {data.logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-container transition-colors">
                    <td className="py-3 px-4 font-mono text-outline">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-primary font-mono">{log.action}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant">
                          {log.actor_role}
                        </span>
                        <span className="font-mono text-outline">{log.actor_id.substring(0, 8)}...</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-primary-container/20 text-primary border border-primary/20 text-[10px] uppercase font-bold">
                          {log.object_type}
                        </span>
                        <span className="font-mono text-outline">{log.object_id}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-outline">{log.ip_address || '127.0.0.1'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setInspectEntry(log)}
                        className="p-1.5 rounded-lg border border-surface-container-highest hover:bg-surface-container-high text-primary inline-flex items-center gap-1 text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect Diff
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {data && totalPages > 1 && (
          <div className="p-4 border-t border-surface-container-high bg-surface-container flex items-center justify-between text-xs text-on-surface-variant">
            <span>
              Showing {data.offset + 1} - {Math.min(data.offset + data.limit, data.total)} of {data.total} records
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded border border-surface-container-highest disabled:opacity-30 hover:bg-surface-container-high"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-medium">
                Page {page + 1} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded border border-surface-container-highest disabled:opacity-30 hover:bg-surface-container-high"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* JSON Diff Inspector Modal */}
      {inspectEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container-low border border-surface-container-high rounded-xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-surface-container-high pb-3">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-serif font-bold text-on-surface">Audit State Inspector</h3>
              </div>
              <span className="font-mono text-xs text-outline">{inspectEntry.id}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-surface-container p-3 rounded-lg border border-surface-container-high">
              <div>
                <span className="text-outline">Actor:</span>{' '}
                <span className="font-semibold text-on-surface">{inspectEntry.actor_id}</span> ({inspectEntry.actor_role})
              </div>
              <div>
                <span className="text-outline">Action:</span>{' '}
                <span className="font-semibold text-primary">{inspectEntry.action}</span>
              </div>
              <div>
                <span className="text-outline">Object:</span>{' '}
                <span className="font-semibold text-on-surface">
                  {inspectEntry.object_type} ({inspectEntry.object_id})
                </span>
              </div>
              <div>
                <span className="text-outline">Recorded:</span>{' '}
                <span className="font-semibold text-on-surface">{new Date(inspectEntry.created_at).toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto">
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-error flex items-center gap-1">
                  <span>State Before Mutation</span>
                </label>
                <pre className="flex-1 p-3 bg-surface border border-surface-container-high rounded-lg text-xs font-mono text-on-surface-variant overflow-x-auto whitespace-pre-wrap">
                  {formatJson(inspectEntry.before_state)}
                </pre>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-secondary flex items-center gap-1">
                  <span>State After Mutation</span>
                </label>
                <pre className="flex-1 p-3 bg-surface border border-surface-container-high rounded-lg text-xs font-mono text-secondary overflow-x-auto whitespace-pre-wrap">
                  {formatJson(inspectEntry.after_state)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-surface-container-high">
              <button
                onClick={() => setInspectEntry(null)}
                className="px-4 py-2 bg-surface-container-highest hover:bg-surface-container-high text-xs font-semibold rounded-lg text-on-surface"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
