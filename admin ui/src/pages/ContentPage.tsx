import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  RefreshCw,
  Plus,
  Send,
  CheckCircle,
  Eye,
  FileCheck2,
  History,
  RotateCcw,
  AlertTriangle,
  Globe,
  FileText,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ConfirmationModal } from '../components/common/ConfirmationModal';

interface ContentItem {
  id: string;
  type: string;
  key: string;
  language: string;
  status: 'draft' | 'in_review' | 'reviewed' | 'published' | 'archived';
  current_version_id: string;
  version_number: number;
  body: any;
  source: string | null;
  section_reference: string | null;
  created_by: string;
  author_name: string | null;
  created_at: string;
  updated_at: string;
}

interface ContentVersion {
  id: string;
  content_item_id: string;
  version_number: number;
  body_json: string;
  body: any;
  source: string | null;
  section_reference: string | null;
  created_by: string;
  author_name: string | null;
  review_status: string;
  reviewed_by: string | null;
  reviewer_name: string | null;
  review_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
}

const CONTENT_TYPES = [
  { id: 'ipc_bns_mapping', label: 'IPC ➔ BNS Mapping' },
  { id: 'rights', label: 'Fundamental Rights' },
  { id: 'glossary', label: 'Legal Glossary' },
  { id: 'document_template', label: 'Document Templates' },
  { id: 'fir_guide', label: 'FIR Guides' },
  { id: 'cyber_fraud_guide', label: 'Cyber Fraud' },
  { id: 'legal_aid_entry', label: 'Legal Aid' },
  { id: 'law_of_the_day', label: 'Law of the Day' },
];

export const ContentPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  // Filters
  const [selectedType, setSelectedType] = useState<string>('ipc_bns_mapping');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected item for drawer/inspection
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // New Draft Modal
  const [newDraftModal, setNewDraftModal] = useState(false);
  const [newDraftForm, setNewDraftForm] = useState({
    type: 'ipc_bns_mapping',
    key: '',
    language: 'en' as 'en' | 'hi' | 'mr',
    source: '',
    sectionReference: '',
    bodyJson: '{\n  "title": "",\n  "description": ""\n}',
  });

  // Action Modals
  const [reviewModal, setReviewModal] = useState<{ itemId: string; notes: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    action: 'submit-review' | 'publish' | 'revert';
    itemId: string;
    targetVersionId?: string;
    title: string;
    message: string;
  } | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch content list
  const {
    data: listData,
    isLoading: isListLoading,
    refetch,
  } = useQuery<{ total: number; items: ContentItem[] }>({
    queryKey: ['admin-content', selectedType, selectedLanguage, selectedStatus, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedType) params.append('type', selectedType);
      if (selectedLanguage) params.append('language', selectedLanguage);
      if (selectedStatus) params.append('status', selectedStatus);
      if (searchQuery) params.append('search', searchQuery);
      return await apiClient.get(`/api/admin/content?${params.toString()}`);
    },
  });

  // Fetch single item details + version history
  const { data: itemDetail } = useQuery<{
    item: ContentItem;
    versions: ContentVersion[];
  }>({
    queryKey: ['admin-content-detail', selectedItemId],
    queryFn: async () => {
      return await apiClient.get(`/api/admin/content/${selectedItemId}`);
    },
    enabled: !!selectedItemId,
  });

  // Create Draft Mutation
  const createDraftMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await apiClient.post('/api/admin/content', payload);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      setNewDraftModal(false);
      setSelectedItemId(data.itemId);
      setErrorMessage(null);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to create content draft');
    },
  });

  // Submit Review Mutation
  const submitReviewMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return await apiClient.post(`/api/admin/content/${itemId}/submit-review`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      queryClient.invalidateQueries({ queryKey: ['admin-content-detail', selectedItemId] });
      setConfirmModal(null);
      setErrorMessage(null);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to submit for review');
    },
  });

  // Review Mutation
  const reviewMutation = useMutation({
    mutationFn: async ({ itemId, notes }: { itemId: string; notes: string }) => {
      return await apiClient.post(`/api/admin/content/${itemId}/review`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      queryClient.invalidateQueries({ queryKey: ['admin-content-detail', selectedItemId] });
      setReviewModal(null);
      setErrorMessage(null);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to record review');
    },
  });

  // Publish Mutation (with Four-Eyes protection)
  const publishMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return await apiClient.post(`/api/admin/content/${itemId}/publish`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      queryClient.invalidateQueries({ queryKey: ['admin-content-detail', selectedItemId] });
      setConfirmModal(null);
      setErrorMessage(null);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to publish content');
      setConfirmModal(null);
    },
  });

  // Revert Mutation
  const revertMutation = useMutation({
    mutationFn: async ({ itemId, targetVersionId }: { itemId: string; targetVersionId: string }) => {
      return await apiClient.post(`/api/admin/content/${itemId}/revert`, { targetVersionId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      queryClient.invalidateQueries({ queryKey: ['admin-content-detail', selectedItemId] });
      setConfirmModal(null);
      setErrorMessage(null);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to revert version');
    },
  });

  const canEditDraft = hasPermission('content.edit_draft');
  const canReview = hasPermission('content.review');
  const canPublish = hasPermission('content.publish');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-secondary-container/20 text-secondary border-secondary';
      case 'reviewed':
        return 'bg-primary-container text-on-primary-container border-primary';
      case 'in_review':
        return 'bg-surface-container-high text-primary border-primary/40';
      case 'draft':
      default:
        return 'bg-surface-container-high text-on-surface-variant border-surface-container-highest';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-bold text-on-surface">Statutory Content Management</h1>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-primary-container/20 text-primary border border-primary">
              Four-Eyes Rule Active
            </span>
          </div>
          <p className="text-sm text-on-surface-variant">
            Official Indian legal provisions, BNS concordance, and templates. Authors cannot self-publish.
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
          {canEditDraft && (
            <button
              onClick={() => {
                setNewDraftForm({
                  type: selectedType,
                  key: '',
                  language: selectedLanguage as any,
                  source: '',
                  sectionReference: '',
                  bodyJson: '{\n  "title": "",\n  "description": ""\n}',
                });
                setNewDraftModal(true);
              }}
              className="px-4 py-2 bg-primary text-on-primary font-semibold rounded-lg text-sm flex items-center gap-2 shadow-sm hover:brightness-105"
            >
              <Plus className="w-4 h-4" />
              New Legal Draft
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

      {/* Content Type Tabs */}
      <div className="border-b border-surface-container-high flex gap-2 overflow-x-auto pb-1">
        {CONTENT_TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedType(t.id)}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap ${
              selectedType === t.id
                ? 'bg-surface-container-high text-primary border-b-2 border-primary font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filter and Language Toolbar */}
      <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-surface-container p-1 rounded-lg border border-surface-container-high text-xs">
            <Globe className="w-3.5 h-3.5 text-primary ml-1" />
            <button
              onClick={() => setSelectedLanguage('en')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                selectedLanguage === 'en' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant'
              }`}
            >
              EN (English)
            </button>
            <button
              onClick={() => setSelectedLanguage('hi')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                selectedLanguage === 'hi' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant'
              }`}
            >
              HI (हिन्दी)
            </button>
            <button
              onClick={() => setSelectedLanguage('mr')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                selectedLanguage === 'mr' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant'
              }`}
            >
              MR (मराठी)
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 bg-surface-container border border-surface-container-highest rounded-lg text-xs text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="">All Lifecycle Stages</option>
            <option value="draft">Draft</option>
            <option value="in_review">In Review</option>
            <option value="reviewed">Reviewed (Pending 4-Eyes Publish)</option>
            <option value="published">Published Live</option>
          </select>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by statute key or terms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3 py-1.5 bg-surface-container border border-surface-container-highest rounded-lg text-xs text-on-surface focus:outline-none focus:border-primary w-64"
        />
      </div>

      {/* Main Table */}
      <div className="bg-surface-container-low border border-surface-container-high rounded-xl overflow-hidden shadow-sm">
        {isListLoading ? (
          <div className="p-12 text-center text-sm text-on-surface-variant animate-pulse">
            Querying statutory catalog...
          </div>
        ) : !listData || listData.items.length === 0 ? (
          <div className="p-12 text-center text-sm text-on-surface-variant space-y-2">
            <BookOpen className="w-8 h-8 mx-auto text-outline" />
            <p className="font-semibold text-on-surface">No records found for the selected criteria.</p>
            <p className="text-xs text-outline">
              Seed sample records from the CLI via `npm run seed:content` or create a new draft above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container border-b border-surface-container-high uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="py-3 px-4">Statutory Key / Title</th>
                  <th className="py-3 px-4">Concordance Reference</th>
                  <th className="py-3 px-4">Language</th>
                  <th className="py-3 px-4">Active Rev</th>
                  <th className="py-3 px-4">Review State</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high">
                {listData.items.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-container transition-colors">
                    <td className="py-3 px-4 font-medium text-on-surface">
                      <div>
                        <p className="font-semibold text-primary">{item.key}</p>
                        <p className="text-[10px] text-outline truncate max-w-xs">
                          {item.body?.title || item.body?.name || item.body?.oldCode?.title || 'Legal Document'}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant font-mono text-[11px]">
                      {item.section_reference || item.body?.newCode?.section || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="uppercase font-bold px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant text-[10px]">
                        {item.language}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">v{item.version_number || 1}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getStatusBadge(item.status)}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-outline font-medium">{item.author_name || 'System Legal Official'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedItemId(item.id)}
                        className="px-2.5 py-1.5 rounded-lg border border-surface-container-highest hover:bg-surface-container-high text-primary inline-flex items-center gap-1 font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect / Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Item Detail / Trilingual Drawer */}
      {selectedItemId && itemDetail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-surface-container border-l border-surface-container-high p-6 shadow-2xl flex flex-col justify-between overflow-y-auto space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-surface-container-high pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold font-serif text-on-surface">{itemDetail.item.key}</h2>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getStatusBadge(itemDetail.item.status)}`}>
                      {itemDetail.item.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    Type: <span className="font-semibold text-primary">{itemDetail.item.type}</span> • Lang:{' '}
                    <span className="uppercase font-semibold">{itemDetail.item.language}</span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedItemId(null)}
                  className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface"
                >
                  ✕
                </button>
              </div>

              {/* Four-Eyes Advisory Alert */}
              <div className="p-3 bg-surface-container-low border border-primary/30 rounded-lg text-xs space-y-1">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <CheckCircle className="w-4 h-4" />
                  Four-Eyes Governance Policy
                </div>
                <p className="text-outline text-[11px]">
                  Draft author ({itemDetail.versions[0]?.author_name || 'Author'}) cannot self-publish. A separate
                  supervisory officer must approve and publish to the live mobile app.
                </p>
              </div>

              {/* Version History Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-primary" />
                  Version History & Transition Trail
                </h3>
                <div className="border border-surface-container-high rounded-lg overflow-hidden bg-surface">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-container text-[10px] uppercase text-outline">
                      <tr>
                        <th className="py-2 px-3">Rev</th>
                        <th className="py-2 px-3">State</th>
                        <th className="py-2 px-3">Author</th>
                        <th className="py-2 px-3">Reviewer</th>
                        <th className="py-2 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-high">
                      {itemDetail.versions.map((ver) => (
                        <tr key={ver.id} className="hover:bg-surface-container/50">
                          <td className="py-2 px-3 font-mono font-bold text-primary">v{ver.version_number}</td>
                          <td className="py-2 px-3">
                            <span className="text-[10px] uppercase font-semibold text-outline">{ver.review_status}</span>
                          </td>
                          <td className="py-2 px-3 text-outline">{ver.author_name || 'Official'}</td>
                          <td className="py-2 px-3 text-outline">{ver.reviewer_name || 'Pending'}</td>
                          <td className="py-2 px-3 text-right">
                            {canPublish && ver.id !== itemDetail.item.current_version_id && (
                              <button
                                onClick={() =>
                                  setConfirmModal({
                                    action: 'revert',
                                    itemId: itemDetail.item.id,
                                    targetVersionId: ver.id,
                                    title: `Revert to Version ${ver.version_number}`,
                                    message: `Are you sure you want to revert to Revision ${ver.version_number}? This transition will be permanently recorded in the audit log.`,
                                  })
                                }
                                className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"
                              >
                                <RotateCcw className="w-3 h-3" />
                                Revert
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Current Version Content Body */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  Active Revision Content JSON
                </h3>
                <pre className="p-4 bg-surface border border-surface-container-high rounded-lg text-xs font-mono text-on-surface overflow-x-auto max-h-72 whitespace-pre-wrap">
                  {JSON.stringify(itemDetail.versions[0]?.body || {}, null, 2)}
                </pre>
              </div>
            </div>

            {/* Workflow Transition Buttons */}
            <div className="pt-4 border-t border-surface-container-high flex flex-wrap gap-2 justify-end">
              {itemDetail.item.status === 'draft' && canEditDraft && (
                <button
                  onClick={() =>
                    setConfirmModal({
                      action: 'submit-review',
                      itemId: itemDetail.item.id,
                      title: 'Submit for Supervisory Review',
                      message: 'Submit this statutory revision to the review queue for senior officer appraisal?',
                    })
                  }
                  className="px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded-lg flex items-center gap-1.5 hover:brightness-105"
                >
                  <Send className="w-3.5 h-3.5" />
                  Submit for Review
                </button>
              )}

              {itemDetail.item.status === 'in_review' && canReview && (
                <button
                  onClick={() => setReviewModal({ itemId: itemDetail.item.id, notes: '' })}
                  className="px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded-lg flex items-center gap-1.5 hover:brightness-105"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  Verify & Mark Reviewed
                </button>
              )}

              {itemDetail.item.status === 'reviewed' && canPublish && (
                <button
                  onClick={() =>
                    setConfirmModal({
                      action: 'publish',
                      itemId: itemDetail.item.id,
                      title: 'Publish Statutory Content Live',
                      message:
                        'Publish this revision to all LawGPT mobile devices? Server-side Four-Eyes verification will ensure you were not the initial author.',
                    })
                  }
                  className="px-4 py-2 bg-secondary text-surface text-xs font-bold rounded-lg flex items-center gap-1.5 hover:brightness-105 shadow-md"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Publish (Four-Eyes Verified)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Modal with Notes */}
      {reviewModal && (
        <ConfirmationModal
          isOpen={!!reviewModal}
          title="Approve & Mark Content Reviewed"
          message="Confirm statutory veracity against official Acts and Gazette. Add optional supervisor verification notes."
          confirmLabel={reviewMutation.isPending ? 'Recording Review...' : 'Mark Reviewed'}
          onConfirm={() => {
            reviewMutation.mutate({ itemId: reviewModal.itemId, notes: reviewModal.notes });
          }}
          onCancel={() => setReviewModal(null)}
        >
          <div className="mt-4">
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">
              Supervisor Verification Notes
            </label>
            <textarea
              rows={3}
              placeholder="Verified against Acts 45 & 46 of 2023..."
              value={reviewModal.notes}
              onChange={(e) => setReviewModal({ ...reviewModal, notes: e.target.value })}
              className="w-full px-3 py-2 bg-surface border border-surface-container-highest rounded-lg text-xs text-on-surface focus:outline-none focus:border-primary"
            />
          </div>
        </ConfirmationModal>
      )}

      {/* Generic Workflow Confirmation Modal */}
      {confirmModal && (
        <ConfirmationModal
          isOpen={!!confirmModal}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel="Confirm Action"
          onConfirm={() => {
            if (confirmModal.action === 'submit-review') {
              submitReviewMutation.mutate(confirmModal.itemId);
            } else if (confirmModal.action === 'publish') {
              publishMutation.mutate(confirmModal.itemId);
            } else if (confirmModal.action === 'revert' && confirmModal.targetVersionId) {
              revertMutation.mutate({ itemId: confirmModal.itemId, targetVersionId: confirmModal.targetVersionId });
            }
          }}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {/* New Draft Modal */}
      {newDraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container-low border border-surface-container-high rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 text-primary">
              <BookOpen className="w-6 h-6" />
              <h3 className="text-lg font-serif font-bold text-on-surface">Author New Legal Content Draft</h3>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                try {
                  const bodyObj = JSON.parse(newDraftForm.bodyJson);
                  createDraftMutation.mutate({
                    type: newDraftForm.type,
                    key: newDraftForm.key,
                    language: newDraftForm.language,
                    source: newDraftForm.source,
                    sectionReference: newDraftForm.sectionReference,
                    body: bodyObj,
                  });
                } catch {
                  setErrorMessage('Invalid JSON syntax in body payload.');
                }
              }}
              className="space-y-3 pt-2"
            >
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Content Type</label>
                <select
                  value={newDraftForm.type}
                  onChange={(e) => setNewDraftForm({ ...newDraftForm, type: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container border border-surface-container-highest rounded-lg text-xs text-on-surface"
                >
                  {CONTENT_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Unique Key (e.g. bns_103, right_art_21)
                </label>
                <input
                  type="text"
                  required
                  placeholder="bns_103"
                  value={newDraftForm.key}
                  onChange={(e) => setNewDraftForm({ ...newDraftForm, key: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container border border-surface-container-highest rounded-lg text-xs text-on-surface"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Language</label>
                <select
                  value={newDraftForm.language}
                  onChange={(e) => setNewDraftForm({ ...newDraftForm, language: e.target.value as any })}
                  className="w-full px-3 py-2 bg-surface-container border border-surface-container-highest rounded-lg text-xs text-on-surface"
                >
                  <option value="en">English (en)</option>
                  <option value="hi">Hindi (hi)</option>
                  <option value="mr">Marathi (mr)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Official Gazette Source</label>
                <input
                  type="text"
                  placeholder="Official Gazette Acts 45 & 46 of 2023"
                  value={newDraftForm.source}
                  onChange={(e) => setNewDraftForm({ ...newDraftForm, source: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container border border-surface-container-highest rounded-lg text-xs text-on-surface"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Section Reference</label>
                <input
                  type="text"
                  placeholder="BNS Section 103"
                  value={newDraftForm.sectionReference}
                  onChange={(e) => setNewDraftForm({ ...newDraftForm, sectionReference: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container border border-surface-container-highest rounded-lg text-xs text-on-surface"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Content Body (JSON)</label>
                <textarea
                  rows={6}
                  required
                  value={newDraftForm.bodyJson}
                  onChange={(e) => setNewDraftForm({ ...newDraftForm, bodyJson: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-surface-container-highest rounded-lg text-xs font-mono text-on-surface"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setNewDraftModal(false)}
                  className="px-4 py-2 rounded-lg border border-surface-container-high text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDraftMutation.isPending}
                  className="px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded-lg hover:brightness-105 disabled:opacity-50"
                >
                  {createDraftMutation.isPending ? 'Creating Draft...' : 'Save As Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
