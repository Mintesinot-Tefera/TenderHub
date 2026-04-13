import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Building2,
  Users,
  DollarSign,
  FileText,
  CheckCircle2,
  AlertCircle,
  Upload,
  X,
} from 'lucide-react';
import { tenderApi, bidApi, getErrorMessage } from '../services/api';
import type { Tender, BidWithTender } from '../types';
import { useAuth } from '../context/AuthContext';
import { FullPageSpinner, Spinner } from '../components/Spinner';
import { DiscussionSection } from '../components/DiscussionSection';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(v);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

export function TenderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tender, setTender] = useState<Tender | null>(null);
  const [existingBid, setExistingBid] = useState<BidWithTender | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Bid form
  const [bidForm, setBidForm] = useState({ amount: '', proposal: '', deliveryDays: '' });
  const [document, setDocument] = useState<File | null>(null);
  const [bidError, setBidError] = useState('');
  const [bidSuccess, setBidSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setBidError('Only PDF and DOC/DOCX files are allowed');
        e.target.value = '';
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setBidError('File size must be less than 5 MB');
        e.target.value = '';
        return;
      }
      setBidError('');
    }
    setDocument(file);
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    tenderApi
      .getById(id)
      .then(setTender)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  // Check if bidder already applied
  useEffect(() => {
    if (!id || user?.role !== 'BIDDER') return;
    bidApi
      .myBids()
      .then((bids) => {
        const match = bids.find((b) => b.tenderId === id && b.status !== 'WITHDRAWN');
        setExistingBid(match ?? null);
      })
      .catch(() => {});
  }, [id, user]);

  const handleBidSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setBidError('');
    setSubmitting(true);
    try {
      await bidApi.submit(id, {
        amount: parseFloat(bidForm.amount),
        proposal: bidForm.proposal,
        deliveryDays: parseInt(bidForm.deliveryDays, 10),
        document,
      });
      setBidSuccess(true);
      setBidForm({ amount: '', proposal: '', deliveryDays: '' });
      setDocument(null);
      // Refresh tender to update bid count
      const updated = await tenderApi.getById(id);
      setTender(updated);
    } catch (err) {
      setBidError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <FullPageSpinner />;

  if (error || !tender) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-red-600">{error || 'Tender not found'}</p>
        <Link to="/" className="btn-secondary mt-4">
          Back to tenders
        </Link>
      </div>
    );
  }

  const daysLeft = Math.ceil((new Date(tender.deadline).getTime() - Date.now()) / 86400000);
  const tenderOpen = tender.status === 'OPEN' && daysLeft > 0;
  const canBid = user?.role === 'BIDDER' && tenderOpen && !existingBid;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-primary-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tenders
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Header card */}
          <div className="card p-6 sm:p-8">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="badge bg-primary-50 text-primary-700">
                {tender.categoryName}
              </span>
              <span
                className={`badge ${
                  tender.status === 'OPEN'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {tender.status}
              </span>
              <span className="font-mono text-xs text-slate-500">
                {tender.referenceNumber}
              </span>
            </div>

            <h1 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl">
              {tender.title}
            </h1>

            <p className="whitespace-pre-line leading-relaxed text-slate-700">
              {tender.description}
            </p>
          </div>

          {/* Requirements */}
          {tender.requirements && (
            <div className="card p-6 sm:p-8">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900">
                <FileText className="h-5 w-5 text-primary-600" />
                Requirements
              </h2>
              <p className="whitespace-pre-line text-slate-700">{tender.requirements}</p>
            </div>
          )}

          {/* Bid form */}
          {canBid && (
            <div className="card p-6 sm:p-8">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                Submit Your Bid
              </h2>

              {bidSuccess ? (
                <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                  <div>
                    <p className="font-medium text-emerald-900">Bid submitted successfully!</p>
                    <p className="text-sm text-emerald-700">
                      The organization will review your proposal and get back to you.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBidSubmit} className="space-y-4">
                  {bidError && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <span>{bidError}</span>
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="amount" className="label">
                        Bid amount (USD)
                      </label>
                      <input
                        id="amount"
                        type="number"
                        required
                        min="1"
                        step="0.01"
                        value={bidForm.amount}
                        onChange={(e) => setBidForm({ ...bidForm, amount: e.target.value })}
                        className="input"
                        placeholder="100000"
                      />
                    </div>
                    <div>
                      <label htmlFor="deliveryDays" className="label">
                        Delivery time (days)
                      </label>
                      <input
                        id="deliveryDays"
                        type="number"
                        required
                        min="1"
                        value={bidForm.deliveryDays}
                        onChange={(e) =>
                          setBidForm({ ...bidForm, deliveryDays: e.target.value })
                        }
                        className="input"
                        placeholder="30"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="proposal" className="label">
                      Proposal
                    </label>
                    <textarea
                      id="proposal"
                      required
                      minLength={20}
                      rows={5}
                      value={bidForm.proposal}
                      onChange={(e) => setBidForm({ ...bidForm, proposal: e.target.value })}
                      className="input resize-y"
                      placeholder="Describe your approach, experience, and why you're the best fit for this tender..."
                    />
                    <p className="mt-1 text-xs text-slate-500">Minimum 20 characters</p>
                  </div>

                  <div>
                    <label htmlFor="document" className="label">
                      Proposal Document (optional)
                    </label>
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
                        <label
                          htmlFor="document"
                          className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-500 transition-colors hover:border-primary-400 hover:bg-primary-50 hover:text-primary-600"
                        >
                          <Upload className="h-4 w-4" />
                          <span>Click to upload PDF or DOC/DOCX</span>
                        </label>
                      )}
                      <input
                        id="document"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      PDF, DOC, or DOCX up to 5 MB
                    </p>
                  </div>

                  <button type="submit" disabled={submitting} className="btn-primary">
                    {submitting ? <Spinner className="h-5 w-5" /> : 'Submit Bid'}
                  </button>
                </form>
              )}
            </div>
          )}

          {existingBid && (
            <div className="card border-primary-200 bg-primary-50 p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">
                    You've already applied to this tender
                  </p>
                  <p className="mb-3 text-sm text-slate-600">
                    Your bid of {formatCurrency(existingBid.amount)} is{' '}
                    <span className="font-medium">{existingBid.status.replace('_', ' ').toLowerCase()}</span>.
                  </p>
                  <Link to="/my-bids" className="btn-primary">
                    Manage application
                  </Link>
                </div>
              </div>
            </div>
          )}

          {!user && tenderOpen && (
            <div className="card border-primary-200 bg-primary-50 p-6 text-center">
              <p className="mb-3 text-slate-700">Sign in as a bidder to submit your proposal</p>
              <button
                onClick={() => navigate('/login', { state: { from: `/tenders/${id}` } })}
                className="btn-primary"
              >
                Sign in to bid
              </button>
            </div>
          )}

          {/* Q&A Discussion */}
          <DiscussionSection tenderId={tender.id} organizationId={tender.organizationId} />
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="card sticky top-36 space-y-5 p-6">
            <h3 className="font-semibold text-slate-900">Tender Details</h3>

            <DetailRow
              icon={<Building2 className="h-5 w-5" />}
              label="Organization"
              value={tender.organizationName}
            />

            <DetailRow
              icon={<DollarSign className="h-5 w-5" />}
              label="Budget"
              value={
                tender.budgetMin && tender.budgetMax
                  ? `${formatCurrency(tender.budgetMin)} - ${formatCurrency(tender.budgetMax)}`
                  : 'Not specified'
              }
            />

            <DetailRow
              icon={<Calendar className="h-5 w-5" />}
              label="Deadline"
              value={formatDate(tender.deadline)}
              sub={
                daysLeft > 0 ? (
                  <span className={daysLeft <= 7 ? 'text-amber-600' : 'text-emerald-600'}>
                    {daysLeft} {daysLeft === 1 ? 'day' : 'days'} remaining
                  </span>
                ) : (
                  <span className="text-red-600">Deadline passed</span>
                )
              }
            />

            {tender.location && (
              <DetailRow
                icon={<MapPin className="h-5 w-5" />}
                label="Location"
                value={tender.location}
              />
            )}

            <DetailRow
              icon={<Users className="h-5 w-5" />}
              label="Bids received"
              value={String(tender.bidCount)}
            />

            <DetailRow
              icon={<Calendar className="h-5 w-5" />}
              label="Published"
              value={new Date(tender.createdAt).toLocaleDateString()}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="text-slate-400">{icon}</div>
      <div className="flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="font-medium text-slate-900">{value}</p>
        {sub && <p className="text-sm font-medium">{sub}</p>}
      </div>
    </div>
  );
}
