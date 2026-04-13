import { Link } from 'react-router-dom';
import { Calendar, MapPin, Building2, Users, DollarSign } from 'lucide-react';
import type { Tender } from '../types';

interface Props {
  tender: Tender;
}

const statusStyles: Record<string, string> = {
  OPEN: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-slate-100 text-slate-700',
  AWARDED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(v);

const formatBudget = (min: number | null, max: number | null): string => {
  if (min && max) return `${formatCurrency(min)} - ${formatCurrency(max)}`;
  if (max) return `Up to ${formatCurrency(max)}`;
  if (min) return `From ${formatCurrency(min)}`;
  return 'Not specified';
};

const daysUntil = (dateStr: string): number => {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
};

export function TenderCard({ tender }: Props) {
  const days = daysUntil(tender.deadline);
  const isUrgent = days <= 7 && days > 0;

  return (
    <Link
      to={`/tenders/${tender.id}`}
      className="card group flex flex-col overflow-hidden transition-all hover:border-primary-500 hover:shadow-md"
    >
      <div className="flex-1 p-5">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <span className="badge bg-primary-50 text-primary-700">
            {tender.categoryName}
          </span>
          <span className={`badge ${statusStyles[tender.status]}`}>
            {tender.status}
          </span>
        </div>

        {/* Title */}
        <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-slate-900 group-hover:text-primary-600">
          {tender.title}
        </h3>

        {/* Ref */}
        <p className="mb-3 text-xs font-mono text-slate-500">
          {tender.referenceNumber}
        </p>

        {/* Description */}
        <p className="mb-4 line-clamp-2 text-sm text-slate-600">
          {tender.description}
        </p>

        {/* Meta */}
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 flex-shrink-0 text-slate-400" />
            <span className="truncate">{tender.organizationName}</span>
          </div>
          {tender.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 flex-shrink-0 text-slate-400" />
              <span className="truncate">{tender.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 flex-shrink-0 text-slate-400" />
            <span className="truncate font-medium">
              {formatBudget(tender.budgetMin, tender.budgetMax)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-3">
        <div className="flex items-center gap-1.5 text-sm">
          <Calendar className="h-4 w-4 text-slate-400" />
          {days > 0 ? (
            <span className={isUrgent ? 'font-medium text-amber-600' : 'text-slate-600'}>
              {days} {days === 1 ? 'day' : 'days'} left
            </span>
          ) : (
            <span className="text-slate-500">Deadline passed</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <Users className="h-4 w-4" />
          <span>{tender.bidCount} bids</span>
        </div>
      </div>
    </Link>
  );
}
