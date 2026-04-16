/**
 * Main App Component
 * Handles routing for the application
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LeadFinderPage } from './pages/LeadFinderPage';
import { EmailVerifierPage } from './pages/EmailVerifierPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ScrollToTop } from './components/ScrollToTop';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/product/lead-finder" element={<LeadFinderPage />} />
          <Route path="/product/email-verifier" element={<EmailVerifierPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
