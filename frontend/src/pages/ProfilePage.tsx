import { useState } from 'react';
import type { FormEvent } from 'react';
import { AlertCircle, CheckCircle2, Mail, Calendar, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi, getErrorMessage } from '../services/api';
import { Spinner } from '../components/Spinner';
import { Avatar } from '../components/Avatar';

const PHONE_PATTERN = /^\+251\d{9}$/;

export function ProfilePage() {
  const { user, setUser } = useAuth();

  const [form, setForm] = useState({
    fullName: user?.fullName ?? '',
    companyName: user?.companyName ?? '',
    phone: user?.phone ?? '',
    avatarUrl: user?.avatarUrl ?? '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSuccess(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (form.phone && !PHONE_PATTERN.test(form.phone)) {
      setError('Phone must start with +251 followed by 9 digits (e.g. +251911234567)');
      return;
    }

    setSaving(true);
    try {
      const updated = await authApi.updateProfile({
        fullName: form.fullName,
        companyName: form.companyName || undefined,
        phone: form.phone || undefined,
        avatarUrl: form.avatarUrl || undefined,
      });
      setUser(updated);
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const isDirty =
    form.fullName !== (user.fullName ?? '') ||
    form.companyName !== (user.companyName ?? '') ||
    form.phone !== (user.phone ?? '') ||
    form.avatarUrl !== (user.avatarUrl ?? '');

  // Live avatar preview: use form value if valid-ish, else current user value
  const previewUrl = form.avatarUrl.trim() || user.avatarUrl;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Profile Settings</h1>
        <p className="mt-1 text-slate-600">Manage your account information</p>
      </div>

      {/* Header card with avatar */}
      <div className="card mb-6 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary-600 to-blue-700" />
        <div className="px-6 pb-6">
          <div className="-mt-12 mb-4">
            <Avatar src={previewUrl} name={form.fullName || user.fullName} size="xl" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">{user.fullName}</h2>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
            <span className="flex items-center gap-1.5">
              <Mail className="h-4 w-4 text-slate-400" />
              {user.email}
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-slate-400" />
              <span className="badge bg-primary-100 text-primary-700">{user.role}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-slate-400" />
              Joined {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSubmit} className="card space-y-5 p-6 sm:p-8">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>Profile updated successfully</span>
          </div>
        )}

        <div>
          <label htmlFor="avatarUrl" className="label">
            Profile image URL
          </label>
          <input
            id="avatarUrl"
            name="avatarUrl"
            type="url"
            value={form.avatarUrl}
            onChange={handleChange}
            className="input"
            placeholder="https://example.com/avatar.jpg"
          />
          <p className="mt-1 text-xs text-slate-500">
            Paste a direct link to an image. Leave empty to use initials.
          </p>
        </div>

        <div>
          <label htmlFor="fullName" className="label">
            Full name <span className="text-red-500">*</span>
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            minLength={2}
            value={form.fullName}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div>
          <label htmlFor="companyName" className="label">
            Company name
          </label>
          <input
            id="companyName"
            name="companyName"
            type="text"
            value={form.companyName}
            onChange={handleChange}
            className="input"
            placeholder="Your organization"
          />
        </div>

        <div>
          <label htmlFor="phone" className="label">
            Phone number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            className="input"
            placeholder="+251911234567"
            pattern="^\+251\d{9}$"
            title="Must start with +251 followed by 9 digits"
          />
          <p className="mt-1 text-xs text-slate-500">
            Ethiopian format: <span className="font-mono">+251</span> followed by 9 digits
          </p>
        </div>

        {/* Read-only fields */}
        <div className="rounded-lg bg-slate-50 p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Account (read-only)
          </p>
          <div className="space-y-1 text-sm text-slate-700">
            <div>
              <span className="text-slate-500">Email:</span> {user.email}
            </div>
            <div>
              <span className="text-slate-500">Role:</span> {user.role}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving || !isDirty} className="btn-primary">
            {saving ? <Spinner className="h-5 w-5" /> : 'Save changes'}
          </button>
          {isDirty && (
            <button
              type="button"
              onClick={() => {
                setForm({
                  fullName: user.fullName,
                  companyName: user.companyName ?? '',
                  phone: user.phone ?? '',
                  avatarUrl: user.avatarUrl ?? '',
                });
                setError('');
                setSuccess(false);
              }}
              className="btn-secondary"
            >
              Reset
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
