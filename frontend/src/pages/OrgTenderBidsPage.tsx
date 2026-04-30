import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  AlertCircle,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  DollarSign,
  CalendarDays,
  FileText,
  Building2,
} from 'lucide-react';
import { bidApi, tenderApi, getErrorMessage } from '../services/api';
import type { BidWithBidder, BidStatus, Tender } from '../types';
import { FullPageSpinner, Spinner } from '../components/Spinner';
import { EmptyState } from '../components/EmptyState';
import { Avatar } from '../components/Avatar';

const statusConfig: Record<
  BidStatus,
  { label: string; badge: string; Icon: typeof Clock }
> = {
  SUBMITTED: { label: 'Submitted', badge: 'bg-blue-100 text-blue-700', Icon: Clock },
  UNDER_REVIEW: { label: 'Under Review', badge: 'bg-amber-100 text-amber-700', Icon: Eye },
  ACCEPTED: { label: 'Accepted', badge: 'bg-emerald-100 text-emerald-700', Icon: CheckCircle2 },
  REJECTED: { label: 'Rejected', badge: 'bg-red-100 text-red-700', Icon: XCircle },
  WITHDRAWN: { label: 'Withdrawn', badge: 'bg-slate-100 text-slate-600', Icon: XCircle },
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(v);

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

type ReviewAction = 'under_review' | 'accept' | 'reject';

interface ActionButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  loading: boolean;
  className: string;
}

function ActionButton({ label, icon, onClick, loading, className }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {loading ? <Spinner /> : icon}
      {label}
    </button>
  );
}

interface BidCardProps {
  bid: BidWithBidder;
  tenderAwarded: boolean;
  onReview: (bidId: string, action: ReviewAction) => void;
  reviewingId: string | null;
}

function BidCard({ bid, tenderAwarded, onReview, reviewingId }: BidCardProps) {
  const { label, badge, Icon } = statusConfig[bid.status];
  const loading = reviewingId === bid.id;
  const canAct = bid.status !== 'REJECTED' && bid.status !== 'ACCEPTED' && bid.status !== 'WITHDRAWN';

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* Bidder info */}
        <div className="flex items-center gap-3">
          <Avatar src={null} name={bid.bidderName} size="md" />
          <div>
            <p className="font-semibold text-slate-900">{bid.bidderName}</p>
            <p className="text-sm text-slate-500">{bid.bidderEmail}</p>
            {bid.bidderCompany && (
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <Building2 className="h-3 w-3" />
                {bid.bidderCompany}
              </p>
            )}
          </div>
        </div>

        {/* Status badge */}
        <span className={`badge ${badge} flex items-center gap-1`}>
          <Icon className="h-3 w-3" />
          {label}
        </span>
      </div>

      {/* Bid metrics */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3">
          <DollarSign className="h-4 w-4 flex-shrink-0 text-primary-600" />
          <div>
            <p className="text-xs text-slate-500">Bid Amount</p>
            <p className="font-semibold text-slate-900">{formatCurrency(bid.amount)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3">
          <CalendarDays className="h-4 w-4 flex-shrink-0 text-primary-600" />
          <div>
            <p className="text-xs text-slate-500">Delivery</p>
            <p className="font-semibold text-slate-900">{bid.deliveryDays} days</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3">
          <CalendarDays className="h-4 w-4 flex-shrink-0 text-slate-400" />
          <div>
            <p className="text-xs text-slate-500">Submitted</p>
            <p className="font-semibold text-slate-900">{formatDate(bid.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Proposal */}
      <div className="mt-4">
        <p className="mb-1 text-xs font-medium text-slate-500">Proposal</p>
        <p className="whitespace-pre-line text-sm text-slate-700">{bid.proposal}</p>
      </div>

      {/* Document link */}
      {bid.documentUrl && (
        <a
          href={bid.documentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          <FileText className="h-4 w-4" />
          View attached document
        </a>
      )}

      {/* Actions */}
      {canAct && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {bid.status !== 'UNDER_REVIEW' && (
            <ActionButton
              label="Mark Under Review"
              icon={<Eye className="h-3.5 w-3.5" />}
              onClick={() => onReview(bid.id, 'under_review')}
              loading={loading}
              className="border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
            />
          )}
          {!tenderAwarded && (
            <ActionButton
              label="Accept Bid"
              icon={<CheckCircle2 className="h-3.5 w-3.5" />}
              onClick={() => onReview(bid.id, 'accept')}
              loading={loading}
              className="border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            />
          )}
          <ActionButton
            label="Reject Bid"
            icon={<XCircle className="h-3.5 w-3.5" />}
            onClick={() => onReview(bid.id, 'reject')}
            loading={loading}
            className="border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
          />
        </div>
      )}
    </div>
  );
}

export function OrgTenderBidsPage() {
  const { id } = useParams<{ id: string }>();
  const [tender, setTender] = useState<Tender | null>(null);
  const [bids, setBids] = useState<BidWithBidder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const load = async () => {
    if (!id) return;
    setError('');
    try {
      const [t, b] = await Promise.all([tenderApi.getById(id), bidApi.getTenderBids(id)]);
      setTender(t);
      setBids(b);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleReview = async (bidId: string, action: ReviewAction) => {
    setReviewingId(bidId);
    setActionError('');
    try {
      await bidApi.review(bidId, action);
      await load();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setReviewingId(null);
    }
  };

  if (loading) return <FullPageSpinner />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to="/org/tenders"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-primary-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to my tenders
      </Link>

      {/* Tender summary */}
      {tender && (
        <div className="mb-8">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="badge bg-primary-50 text-primary-700">{tender.categoryName}</span>
            <span
              className={`badge ${
                tender.status === 'OPEN'
                  ? 'bg-emerald-100 text-emerald-700'
                  : tender.status === 'AWARDED'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {tender.status}
            </span>
            <span className="font-mono text-xs text-slate-500">{tender.referenceNumber}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{tender.title}</h1>
          <p className="mt-1 text-slate-600">
            {bids.length} bid{bids.length !== 1 ? 's' : ''} received
          </p>
        </div>
      )}

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

      {tender?.status === 'AWARDED' && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
          <div>
            <p className="font-medium text-blue-900">Tender awarded</p>
            <p className="text-sm text-blue-700">
              This tender has been awarded. The winning bid is marked as Accepted.
            </p>
          </div>
        </div>
      )}

      {bids.length === 0 ? (
        <EmptyState
          title="No bids yet"
          message="Bids submitted by bidders will appear here."
        />
      ) : (
        <div className="space-y-4">
          {bids.map((bid) => (
            <BidCard
              key={bid.id}
              bid={bid}
              tenderAwarded={tender?.status === 'AWARDED'}
              onReview={handleReview}
              reviewingId={reviewingId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
