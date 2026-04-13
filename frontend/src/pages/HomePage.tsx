import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { tenderApi, categoryApi, getErrorMessage } from '../services/api';
import type { PaginatedTenders, Category, TenderStatus } from '../types';
import { TenderCard } from '../components/TenderCard';
import { FullPageSpinner, Spinner } from '../components/Spinner';
import { EmptyState } from '../components/EmptyState';
import { useDebounce } from '../hooks/useDebounce';

export function HomePage() {
  const [data, setData] = useState<PaginatedTenders | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<TenderStatus | ''>('OPEN');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounce(search);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryId, status]);

  // Load categories once
  useEffect(() => {
    categoryApi.list().then(setCategories).catch(() => {});
  }, []);

  // Load tenders
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setSearching(true);
      setError('');
      try {
        const result = await tenderApi.list({
          search: debouncedSearch || undefined,
          categoryId: categoryId || undefined,
          status: status || undefined,
          page,
          limit: 12,
        });
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) {
          setSearching(false);
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, categoryId, status, page]);

  const clearFilters = () => {
    setSearch('');
    setCategoryId('');
    setStatus('OPEN');
  };

  const hasActiveFilters = search || categoryId || status !== 'OPEN';

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-br from-primary-600 via-primary-700 to-blue-800">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              Find & bid on tenders that match your expertise
            </h1>
            <p className="mt-4 text-lg text-blue-100">
              Browse open tenders from verified organizations. Submit competitive
              bids and grow your business.
            </p>
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="sticky top-16 z-30 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tenders by title, description, or reference number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input !pl-11"
              />
              {searching && (
                <Spinner className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2" />
              )}
            </div>

            {/* Filter toggle (mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary sm:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>

            {/* Filters (desktop always visible, mobile toggleable) */}
            <div
              className={`flex flex-col gap-3 sm:flex sm:flex-row ${
                showFilters ? 'flex' : 'hidden'
              }`}
            >
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="input sm:w-48"
              >
                <option value="">All categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TenderStatus | '')}
                className="input sm:w-40"
              >
                <option value="">All statuses</option>
                <option value="OPEN">Open</option>
                <option value="CLOSED">Closed</option>
                <option value="AWARDED">Awarded</option>
              </select>

              {hasActiveFilters && (
                <button onClick={clearFilters} className="btn-secondary">
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <FullPageSpinner />
        ) : error ? (
          <div className="card border-red-200 bg-red-50 p-6 text-center text-red-700">
            {error}
          </div>
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            title="No tenders found"
            message="Try adjusting your search or filter criteria."
          />
        ) : (
          <>
            {/* Count */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Showing <span className="font-semibold">{data.items.length}</span> of{' '}
                <span className="font-semibold">{data.total}</span> tenders
              </p>
            </div>

            {/* Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((tender) => (
                <TenderCard key={tender.id} tender={tender} />
              ))}
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary !px-3"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-4 text-sm font-medium text-slate-700">
                  Page {data.page} of {data.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page >= data.totalPages}
                  className="btn-secondary !px-3"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
