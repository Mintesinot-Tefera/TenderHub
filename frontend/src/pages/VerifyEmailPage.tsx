import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Briefcase, CheckCircle, XCircle } from 'lucide-react';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FullPageSpinner } from '../components/Spinner';
import { tokenStorage } from '../services/api';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setErrorMessage('No verification token found in the URL.');
      return;
    }

    authApi
      .verifyEmail(token)
      .then((result) => {
        tokenStorage.set(result.token);
        setUser(result.user);
        setStatus('success');
        setTimeout(() => navigate('/', { replace: true }), 3000);
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.error?.message ||
          'This verification link is invalid or has already been used.';
        setErrorMessage(msg);
        setStatus('error');
      });
  }, []);

  if (status === 'loading') return <FullPageSpinner />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-12">
      <div className="w-full max-w-md text-center">
        <Link to="/" className="mb-8 inline-flex items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600">
            <Briefcase className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-slate-900">TenderHub</span>
        </Link>

        {status === 'success' ? (
          <div className="mt-8">
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-slate-900">Email verified!</h1>
            <p className="mb-6 text-slate-600">
              Your account is now active. Redirecting you to the homepage…
            </p>
            <Link to="/" className="btn-primary">
              Continue to TenderHub
            </Link>
          </div>
        ) : (
          <div className="mt-8">
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-slate-900">Verification failed</h1>
            <p className="mb-6 text-slate-500">{errorMessage}</p>
            <Link to="/login" className="btn-primary">
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
