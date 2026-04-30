import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { tenderApi, categoryApi, getErrorMessage } from '../services/api';
import type { Category, Tender } from '../types';
import { Spinner } from '../components/Spinner';

const toDateInputValue = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0];
};

const todayValue = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

export function TenderFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [initError, setInitError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    budgetMin: '',
    budgetMax: '',
    deadline: todayValue(),
    location: '',
    requirements: '',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const init = async () => {
      setLoadingInit(true);
      try {
        const cats = await categoryApi.list();
        setCategories(cats);

        if (isEditing && id) {
          const tender: Tender = await tenderApi.getById(id);
          setForm({
            title: tender.title,
            description: tender.description,
            categoryId: tender.categoryId,
            budgetMin: tender.budgetMin != null ? String(tender.budgetMin) : '',
            budgetMax: tender.budgetMax != null ? String(tender.budgetMax) : '',
            deadline: toDateInputValue(tender.deadline),
            location: tender.location ?? '',
            requirements: tender.requirements ?? '',
          });
        }
      } catch (err) {
        setInitError(getErrorMessage(err));
      } finally {
        setLoadingInit(false);
      }
    };
    init();
  }, [id, isEditing]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        categoryId: form.categoryId,
        budgetMin: form.budgetMin ? parseFloat(form.budgetMin) : null,
        budgetMax: form.budgetMax ? parseFloat(form.budgetMax) : null,
        deadline: new Date(form.deadline).toISOString(),
        location: form.location || null,
        requirements: form.requirements || null,
      };

      if (isEditing && id) {
        await tenderApi.update(id, payload);
      } else {
        await tenderApi.create(payload);
      }

      navigate('/org/tenders');
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  if (loadingInit) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner className="h-8 w-8 text-primary-600" />
      </div>
    );
  }

  if (initError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-red-600">{initError}</p>
        <Link to="/org/tenders" className="btn-secondary mt-4">
          Back to my tenders
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to="/org/tenders"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-primary-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to my tenders
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          {isEditing ? 'Edit Tender' : 'Post a New Tender'}
        </h1>
        <p className="mt-1 text-slate-600">
          {isEditing
            ? 'Update the details of your tender. Only open tenders can be edited.'
            : 'Fill in the details below to publish your tender and receive bids.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6 p-6 sm:p-8">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className="label">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            minLength={5}
            value={form.title}
            onChange={handleChange}
            className="input"
            placeholder="e.g. Construction of Community Health Centre"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="label">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            required
            minLength={20}
            rows={5}
            value={form.description}
            onChange={handleChange}
            className="input resize-none"
            placeholder="Provide a detailed overview of this tender..."
          />
        </div>

        {/* Category + Deadline */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="categoryId" className="label">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="categoryId"
              name="categoryId"
              required
              value={form.categoryId}
              onChange={handleChange}
              className="input"
            >
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="deadline" className="label">
              Deadline <span className="text-red-500">*</span>
            </label>
            <input
              id="deadline"
              name="deadline"
              type="date"
              required
              value={form.deadline}
              onChange={handleChange}
              className="input"
              min={todayValue()}
            />
          </div>
        </div>

        {/* Budget */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="budgetMin" className="label">
              Budget minimum (USD)
            </label>
            <input
              id="budgetMin"
              name="budgetMin"
              type="number"
              min="1"
              step="0.01"
              value={form.budgetMin}
              onChange={handleChange}
              className="input"
              placeholder="50000"
            />
          </div>
          <div>
            <label htmlFor="budgetMax" className="label">
              Budget maximum (USD)
            </label>
            <input
              id="budgetMax"
              name="budgetMax"
              type="number"
              min="1"
              step="0.01"
              value={form.budgetMax}
              onChange={handleChange}
              className="input"
              placeholder="200000"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="label">
            Location
          </label>
          <input
            id="location"
            name="location"
            type="text"
            value={form.location}
            onChange={handleChange}
            className="input"
            placeholder="e.g. Addis Ababa, Ethiopia"
          />
        </div>

        {/* Requirements */}
        <div>
          <label htmlFor="requirements" className="label">
            Requirements
          </label>
          <textarea
            id="requirements"
            name="requirements"
            rows={4}
            value={form.requirements}
            onChange={handleChange}
            className="input resize-none"
            placeholder="List specific qualifications, certifications, or technical requirements..."
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Link to="/org/tenders" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? (
              <>
                <Spinner />
                {isEditing ? 'Saving…' : 'Publishing…'}
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                {isEditing ? 'Save changes' : 'Publish tender'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
