import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Ban,
  ExternalLink,
  FileText,
  Upload,
} from 'lucide-react';
import { bidApi, getErrorMessage, api } from '../services/api';
import type { BidWithTender, BidStatus } from '../types';
import { EDITABLE_BID_STATUSES } from '../types';
import { FullPageSpinner, Spinner } from '../components/Spinner';
import { EmptyState } from '../components/EmptyState';

// --- Status config ---

const statusConfig: Record<
  BidStatus,
  { label: string; badge: string; Icon: typeof Clock }
> = {
  SUBMITTED: { label: 'Submitted', badge: 'bg-blue-100 text-blue-700', Icon: Clock },
  UNDER_REVIEW: { label: 'Under Review', badge: 'bg-amber-100 text-amber-700', Icon: Eye },
  ACCEPTED: { label: 'Accepted', badge: 'bg-emerald-100 text-emerald-700', Icon: CheckCircle2 },
  REJECTED: { label: 'Rejected', badge: 'bg-red-100 text-red-700', Icon: XCircle },
  WITHDRAWN: { label: 'Withdrawn', badge: 'bg-slate-100 text-slate-600', Icon: Ban },
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(v);

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// --- Page ---

export function MyBidsPage() {
  const [bids, setBids] = useState<BidWithTender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<BidStatus | 'ALL'>('ALL');

  const [editing, setEditing] = useState<BidWithTender | null>(null);
  const [withdrawing, setWithdrawing] = useState<BidWithTender | null>(null);

  const load = async () => {
    setError('');
    try {
      const data = await bidApi.myBids();
      setBids(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = filter === 'ALL' ? bids : bids.filter((b) => b.status === filter);

  const counts = bids.reduce<Record<string, number>>((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  if (loading) return <FullPageSpinner />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">My Applications</h1>
        <p className="mt-1 text-slate-600">
          Track and manage your submitted bids
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {bids.length === 0 ? (
        <EmptyState
          title="No applications yet"
          message="Browse tenders and submit your first bid to get started."
        />
      ) : (
        <>
          {/* Status filter tabs */}
          <div className="mb-6 flex flex-wrap gap-2">
            <FilterTab
              active={filter === 'ALL'}
              onClick={() => setFilter('ALL')}
              label="All"
              count={bids.length}
            />
            {(Object.keys(statusConfig) as BidStatus[]).map((s) =>
              counts[s] ? (
                <FilterTab
                  key={s}
                  active={filter === s}
                  onClick={() => setFilter(s)}
                  label={statusConfig[s].label}
                  count={counts[s]}
                />
              ) : null
            )}
          </div>

          {/* List */}
          <div className="space-y-4">
            {filtered.map((bid) => (
              <BidRow
                key={bid.id}
                bid={bid}
                onEdit={() => setEditing(bid)}
                onWithdraw={() => setWithdrawing(bid)}
              />
            ))}
          </div>
        </>
      )}

      {/* Modals */}
      {editing && (
        <EditBidModal
          bid={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}

      {withdrawing && (
        <WithdrawModal
          bid={withdrawing}
          onClose={() => setWithdrawing(null)}
          onDone={() => {
            setWithdrawing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

// --- Filter tab ---

function FilterTab({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-primary-600 text-white'
          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
      }`}
    >
      {label}
      <span
        className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${
          active ? 'bg-white/20' : 'bg-slate-100'
        }`}
      >
        {count}
      </span>
    </button>
  );
}

// --- Bid row ---

function BidRow({
  bid,
  onEdit,
  onWithdraw,
}: {
  bid: BidWithTender;
  onEdit: () => void;
  onWithdraw: () => void;
}) {
  const cfg = statusConfig[bid.status];
  const canEdit =
    EDITABLE_BID_STATUSES.includes(bid.status) &&
    bid.tenderStatus === 'OPEN' &&
    new Date(bid.tenderDeadline) > new Date();
  const canWithdraw = EDITABLE_BID_STATUSES.includes(bid.status);
  const wasEdited = bid.updatedAt !== bid.createdAt && bid.status !== 'WITHDRAWN';

  return (
    <div className="card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Left: info */}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={`badge ${cfg.badge}`}>
              <cfg.Icon className="mr-1 h-3.5 w-3.5" />
              {cfg.label}
            </span>
            <span className="font-mono text-xs text-slate-500">
              {bid.tenderReferenceNumber}
            </span>
          </div>

          <Link
            to={`/tenders/${bid.tenderId}`}
            className="group mb-3 inline-flex items-start gap-1.5"
          >
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-primary-600">
              {bid.tenderTitle}
            </h3>
            <ExternalLink className="mt-1 h-4 w-4 flex-shrink-0 text-slate-400 group-hover:text-primary-600" />
          </Link>

          <p className="mb-3 line-clamp-2 text-sm text-slate-600">{bid.proposal}</p>

          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
            <span>
              <span className="text-slate-400">Amount:</span>{' '}
              <span className="font-semibold text-slate-900">
                {formatCurrency(bid.amount)}
              </span>
            </span>
            <span>
              <span className="text-slate-400">Delivery:</span>{' '}
              <span className="font-medium">{bid.deliveryDays} days</span>
            </span>
            <span>
              <span className="text-slate-400">Submitted:</span>{' '}
              {formatDate(bid.createdAt)}
              {wasEdited && <span className="ml-1 text-xs text-slate-400">(edited)</span>}
            </span>
            {bid.documentUrl && (
              <a
                href={`${api.defaults.baseURL?.replace('/api', '')}${bid.documentUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700"
              >
                <FileText className="h-3.5 w-3.5" />
                View Document
              </a>
            )}
          </div>
        </div>

        {/* Right: actions */}
        {(canEdit || canWithdraw) && (
          <div className="flex gap-2 sm:flex-col">
            {canEdit && (
              <button onClick={onEdit} className="btn-secondary !px-3 !py-2 text-sm">
                <Pencil className="h-4 w-4" />
                Edit
              </button>
            )}
            {canWithdraw && (
              <button
                onClick={onWithdraw}
                className="btn !px-3 !py-2 border border-red-200 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Withdraw
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Edit modal ---

function EditBidModal({
  bid,
  onClose,
  onSaved,
}: {
  bid: BidWithTender;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    amount: String(bid.amount),
    proposal: bid.proposal,
    deliveryDays: String(bid.deliveryDays),
  });
  const [document, setDocument] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setError('Only PDF and DOC/DOCX files are allowed');
        e.target.value = '';
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError('File size must be less than 5 MB');
        e.target.value = '';
        return;
      }
      setError('');
    }
    setDocument(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await bidApi.update(bid.id, {
        amount: parseFloat(form.amount),
        proposal: form.proposal,
        deliveryDays: parseInt(form.deliveryDays, 10),
        document,
      });
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <ModalShell onClose={onClose} title="Edit Bid">
      <p className="mb-4 text-sm text-slate-600">
        <span className="font-medium text-slate-900">{bid.tenderTitle}</span>
        <br />
        Closes {formatDate(bid.tenderDeadline)}
      </p>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Bid amount (USD)</label>
            <input
              type="number"
              required
              min="1"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">Delivery (days)</label>
            <input
              type="number"
              required
              min="1"
              value={form.deliveryDays}
              onChange={(e) => setForm({ ...form, deliveryDays: e.target.value })}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="label">Proposal</label>
          <textarea
            required
            minLength={20}
            rows={5}
            value={form.proposal}
            onChange={(e) => setForm({ ...form, proposal: e.target.value })}
            className="input resize-y"
          />
        </div>

        <div>
          <label className="label">Proposal Document (optional)</label>
          {bid.documentUrl && !document && (
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-600">
              <FileText className="h-4 w-4 text-primary-600" />
              <a
                href={`${api.defaults.baseURL?.replace('/api', '')}${bid.documentUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline"
              >
                Current document
              </a>
            </div>
          )}
          <div className="relative">
            {document ? (
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
                <FileText className="h-4 w-4 flex-shrink-0 text-primary-600" />
                <span className="flex-1 truncate text-slate-700">{document.name}</span>
                <span className="text-xs text-slate-400">
                  {(document.size / 1024).toFixed(0)} KB
                </span>
                <button
                  type="button"
                  onClick={() => setDocument(null)}
                  className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-500 transition-colors hover:border-primary-400 hover:bg-primary-50 hover:text-primary-600">
                <Upload className="h-4 w-4" />
                <span>{bid.documentUrl ? 'Replace document' : 'Upload PDF or DOC/DOCX'}</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">PDF, DOC, or DOCX up to 5 MB</p>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? <Spinner className="h-5 w-5" /> : 'Save changes'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// --- Withdraw modal ---

function WithdrawModal({
  bid,
  onClose,
  onDone,
}: {
  bid: BidWithTender;
  onClose: () => void;
  onDone: () => void;
}) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleWithdraw = async () => {
    setError('');
    setLoading(true);
    try {
      await bidApi.withdraw(bid.id);
      onDone();
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <ModalShell onClose={onClose} title="Withdraw Application?">
      <p className="mb-2 text-slate-600">
        You're about to withdraw your bid for{' '}
        <span className="font-medium text-slate-900">{bid.tenderTitle}</span>.
      </p>
      <p className="mb-6 text-sm text-slate-500">
        You can re-apply later if the tender is still open.
      </p>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleWithdraw}
          disabled={loading}
          className="btn flex-1 bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
        >
          {loading ? <Spinner className="h-5 w-5" /> : 'Yes, withdraw'}
        </button>
        <button onClick={onClose} className="btn-secondary">
          Cancel
        </button>
      </div>
    </ModalShell>
  );
}

// --- Modal shell ---

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="card relative max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
