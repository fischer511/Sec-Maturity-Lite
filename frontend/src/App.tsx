import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AssessmentWizardPage from './pages/AssessmentWizardPage';
import AssessmentDetailPage from './pages/AssessmentDetailPage';
import TeamsPage from './pages/TeamsPage';
import ImportsPage from './pages/ImportsPage';

// Assessment pages
import DomainsPage from './pages/assessment/DomainsPage';
import MyAssessmentPage from './pages/assessment/MyAssessmentPage';
import AnswersPage from './pages/assessment/AnswersPage';
import EvidencePage from './pages/assessment/EvidencePage';

// Reports pages
import ReportsExportPage from './pages/reports/ReportsExportPage';
import ReportsHistoryPage from './pages/reports/ReportsHistoryPage';
import RecommendationsPage from './pages/reports/RecommendationsPage';

// Actions pages
import CriticalActionsPage from './pages/actions/CriticalActionsPage';
import MediumActionsPage from './pages/actions/MediumActionsPage';
import LowActionsPage from './pages/actions/LowActionsPage';
import TimelinePage from './pages/actions/TimelinePage';

// Tasks pages
import TasksPage from './pages/tasks/TasksPage';

// Evidence library pages
import PoliciesPage from './pages/evidence/PoliciesPage';
import ProceduresPage from './pages/evidence/ProceduresPage';
import NetworkPage from './pages/evidence/NetworkPage';
import LogsPage from './pages/evidence/LogsPage';
import DocumentsPage from './pages/evidence/DocumentsPage';

// Users pages
import ProfilePage from './pages/users/ProfilePage';
import OrganizationsPage from './pages/users/OrganizationsPage';

// Settings pages
import CompanyPage from './pages/settings/CompanyPage';
import BrandingPage from './pages/settings/BrandingPage';
import DomainWeightsPage from './pages/settings/DomainWeightsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Nalaganje...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assessments/new"
          element={
            <ProtectedRoute>
              <AssessmentWizardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assessments/:id"
          element={
            <ProtectedRoute>
              <AssessmentDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teams"
          element={
            <ProtectedRoute>
              <TeamsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/imports"
          element={
            <ProtectedRoute>
              <ImportsPage />
            </ProtectedRoute>
          }
        />
        
        {/* Assessment routes */}
        <Route
          path="/assessment/domains"
          element={
            <ProtectedRoute>
              <DomainsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assessment/my"
          element={
            <ProtectedRoute>
              <MyAssessmentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assessment/answers"
          element={
            <ProtectedRoute>
              <AnswersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assessment/evidence"
          element={
            <ProtectedRoute>
              <EvidencePage />
            </ProtectedRoute>
          }
        />

        {/* Reports routes */}
        <Route
          path="/reports/export"
          element={
            <ProtectedRoute>
              <ReportsExportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/history"
          element={
            <ProtectedRoute>
              <ReportsHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/recommendations"
          element={
            <ProtectedRoute>
              <RecommendationsPage />
            </ProtectedRoute>
          }
        />

        {/* Actions routes */}
        <Route
          path="/actions/critical"
          element={
            <ProtectedRoute>
              <CriticalActionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/actions/medium"
          element={
            <ProtectedRoute>
              <MediumActionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/actions/low"
          element={
            <ProtectedRoute>
              <LowActionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/actions/timeline"
          element={
            <ProtectedRoute>
              <TimelinePage />
            </ProtectedRoute>
          }
        />

        {/* Tasks routes */}
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <TasksPage />
            </ProtectedRoute>
          }
        />

        {/* Evidence library routes */}
        <Route
          path="/evidence/documents"
          element={
            <ProtectedRoute>
              <DocumentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/evidence/policies"
          element={
            <ProtectedRoute>
              <PoliciesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/evidence/procedures"
          element={
            <ProtectedRoute>
              <ProceduresPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/evidence/network"
          element={
            <ProtectedRoute>
              <NetworkPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/evidence/logs"
          element={
            <ProtectedRoute>
              <LogsPage />
            </ProtectedRoute>
          }
        />

        {/* Users routes */}
        <Route
          path="/users/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/organizations"
          element={
            <ProtectedRoute>
              <OrganizationsPage />
            </ProtectedRoute>
          }
        />

        {/* Settings routes */}
        <Route
          path="/settings/company"
          element={
            <ProtectedRoute>
              <CompanyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/branding"
          element={
            <ProtectedRoute>
              <BrandingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/domain-weights"
          element={
            <ProtectedRoute>
              <DomainWeightsPage />
            </ProtectedRoute>
          }
        />
        
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
