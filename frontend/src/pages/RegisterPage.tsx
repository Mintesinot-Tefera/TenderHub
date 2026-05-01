import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, AlertCircle, MailCheck } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';
import { Spinner } from '../components/Spinner';
import type { UserRole } from '../types';

export function RegisterPage() {
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'BIDDER' as UserRole,
    companyName: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successEmail, setSuccessEmail] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        role: form.role,
        companyName: form.companyName || undefined,
        phone: form.phone || undefined,
      });
      setSuccessEmail(form.email);
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  if (successEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <MailCheck className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-slate-900">Check your inbox</h1>
          <p className="mb-1 text-slate-600">
            We've sent a verification link to
          </p>
          <p className="mb-6 font-semibold text-slate-900">{successEmail}</p>
          <p className="mb-6 text-sm text-slate-500">
            Click the link in the email to activate your account. Check your spam folder if you don't see it.
          </p>
          <Link to="/login" className="btn-primary">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="mb-4 inline-flex items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900">TenderHub</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="mt-1 text-slate-600">Start bidding on tenders today</p>
        </div>

        <div className="card p-6 sm:p-8">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="label">
                Full name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={form.fullName}
                onChange={handleChange}
                className="input"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                className="input"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                className="input"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label htmlFor="role" className="label">
                I am a...
              </label>
              <select
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
                className="input"
              >
                <option value="BIDDER">Bidder (submit bids on tenders)</option>
                <option value="ORGANIZATION">Organization (publish tenders)</option>
              </select>
            </div>

            <div>
              <label htmlFor="companyName" className="label">
                Company name <span className="text-slate-400">(optional)</span>
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                value={form.companyName}
                onChange={handleChange}
                className="input"
                placeholder="Acme Inc."
              />
            </div>

            <div>
              <label htmlFor="phone" className="label">
                Phone <span className="text-slate-400">(optional)</span>
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
                Format: +251 followed by 9 digits
              </p>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Spinner className="h-5 w-5" /> : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
              Sign in
            </Link>
          </p>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-3 text-slate-500">or sign up with Google</span>
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-slate-500">
              Role selected above ({form.role === 'ORGANIZATION' ? 'Organization' : 'Bidder'}) will apply
            </p>
            <div className="mt-2 flex justify-center">
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  if (credentialResponse.credential) {
                    setLoading(true);
                    googleLogin(credentialResponse.credential, form.role)
                      .then(() => navigate('/', { replace: true }))
                      .catch((err) => setError(getErrorMessage(err)))
                      .finally(() => setLoading(false));
                  }
                }}
                onError={() => setError('Google sign-up failed. Please try again.')}
                text="signup_with"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
