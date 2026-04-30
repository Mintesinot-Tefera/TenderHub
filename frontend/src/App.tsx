import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { FullPageSpinner } from './components/Spinner';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { TenderDetailPage } from './pages/TenderDetailPage';
import { MyBidsPage } from './pages/MyBidsPage';
import { ProfilePage } from './pages/ProfilePage';
import { OrgTendersPage } from './pages/OrgTendersPage';
import { TenderFormPage } from './pages/TenderFormPage';
import { OrgTenderBidsPage } from './pages/OrgTenderBidsPage';
import type { UserRole } from './types';

function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function GuestRoute() {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}

function ProtectedRoute({ roles }: { roles: UserRole[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}

function AppRoutes() {
  const { loading } = useAuth();
  if (loading) return <FullPageSpinner />;

  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/tenders/:id" element={<TenderDetailPage />} />
        <Route element={<ProtectedRoute roles={['BIDDER']} />}>
          <Route path="/my-bids" element={<MyBidsPage />} />
        </Route>
        <Route element={<ProtectedRoute roles={['ORGANIZATION']} />}>
          <Route path="/org/tenders" element={<OrgTendersPage />} />
          <Route path="/org/tenders/new" element={<TenderFormPage />} />
          <Route path="/org/tenders/:id/edit" element={<TenderFormPage />} />
          <Route path="/org/tenders/:id/bids" element={<OrgTenderBidsPage />} />
        </Route>
        <Route element={<ProtectedRoute roles={['ADMIN', 'ORGANIZATION', 'BIDDER']} />}>
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
