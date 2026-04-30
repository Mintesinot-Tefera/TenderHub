import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  FileText,
  Users,
  AlertCircle,
  ChevronRight,
  X,
  Pencil,
  XCircle,
  Lock,
} from 'lucide-react';
import { tenderApi, getErrorMessage } from '../services/api';
import type { Tender, TenderStatus } from '../types';
import { FullPageSpinner, Spinner } from '../components/Spinner';
import { EmptyState } from '../components/EmptyState';

const statusStyles: Record<TenderStatus, string> = {
  OPEN: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-slate-100 text-slate-700',
  AWARDED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}

function ConfirmModal({ title, message, confirmLabel, danger, onConfirm, onClose, loading }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-6 text-sm text-slate-600">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary text-sm" disabled={loading}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`btn text-sm text-white ${danger ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-slate-700 hover:bg-slate-800 focus:ring-slate-500'}`}
          >
            {loading ? <Spinner /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function OrgTendersPage() {
  const navigate = useNavigate();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const [confirm, setConfirm] = useState<{
    tender: Tender;
    action: 'close' | 'cancel';
  } | null>(null);
  const [actioning, setActioning] = useState(false);

  const load = async () => {
    setError('');
    try {
      const data = await tenderApi.myTenders();
      setTenders(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatusAction = async () => {
    if (!confirm) return;
    setActioning(true);
    setActionError('');
    try {
      await tenderApi.updateStatus(confirm.tender.id, confirm.action);
      setConfirm(null);
      load();
    } catch (err) {
      setActionError(getErrorMessage(err));
      setActioning(false);
    }
  };

  if (loading) return <FullPageSpinner />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">My Tenders</h1>
          <p className="mt-1 text-slate-600">Manage the tenders your organisation has posted</p>
        </div>
        <Link to="/org/tenders/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Tender</span>
        </Link>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {actionError && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {tenders.length === 0 ? (
        <EmptyState
          title="No tenders yet"
          message="Post your first tender to start receiving bids from qualified bidders."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Deadline</th>
                  <th className="px-4 py-3 text-center">Bids</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenders.map((tender) => (
                  <tr key={tender.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {tender.referenceNumber}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-900 line-clamp-1">
                        {tender.title}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{tender.categoryName}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${statusStyles[tender.status]}`}>
                        {tender.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(tender.deadline)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => navigate(`/org/tenders/${tender.id}/bids`)}
                        className="inline-flex items-center gap-1 font-medium text-primary-600 hover:text-primary-700"
                      >
                        <Users className="h-3.5 w-3.5" />
                        {tender.bidCount}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/org/tenders/${tender.id}/bids`)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                          title="View bids"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Bids
                          <ChevronRight className="h-3 w-3" />
                        </button>
                        {tender.status === 'OPEN' && (
                          <button
                            onClick={() => navigate(`/org/tenders/${tender.id}/edit`)}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                            title="Edit tender"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                        )}
                        {tender.status === 'OPEN' && (
                          <button
                            onClick={() => { setActionError(''); setConfirm({ tender, action: 'close' }); }}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                            title="Close tender"
                          >
                            <Lock className="h-3.5 w-3.5" />
                            Close
                          </button>
                        )}
                        {(tender.status === 'OPEN' || tender.status === 'CLOSED') && (
                          <button
                            onClick={() => { setActionError(''); setConfirm({ tender, action: 'cancel' }); }}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                            title="Cancel tender"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmModal
          title={confirm.action === 'close' ? 'Close tender?' : 'Cancel tender?'}
          message={
            confirm.action === 'close'
              ? `Closing "${confirm.tender.title}" will stop accepting new bids. This can be reversed by cancelling.`
              : `Cancelling "${confirm.tender.title}" is permanent and cannot be undone.`
          }
          confirmLabel={confirm.action === 'close' ? 'Close tender' : 'Cancel tender'}
          danger={confirm.action === 'cancel'}
          onConfirm={handleStatusAction}
          onClose={() => setConfirm(null)}
          loading={actioning}
        />
      )}
    </div>
  );
}
