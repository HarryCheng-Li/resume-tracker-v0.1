import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/useAuth';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ResumesPage from './pages/ResumesPage';
import ResumeWorkflowPage from './pages/ResumeWorkflowPage';
import UploadResumePage from './pages/UploadResumePage';
import DepartmentsPage from './pages/DepartmentsPage';
import UsersPage from './pages/UsersPage';
import NotificationsPage from './pages/NotificationsPage';
import ApprovalCenterPage from './pages/ApprovalCenterPage';
import ProfilePage from './pages/ProfilePage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/resumes" element={<ResumesPage />} />
              <Route path="/resumes/:id" element={<ResumeWorkflowPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route
                path="/approval-center"
                element={
                  <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
                    <ApprovalCenterPage />
                  </ProtectedRoute>
                }
              />
              
              {/* Role Protected Routes */}
              <Route 
                path="/upload" 
                element={
                  <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
                    <UploadResumePage />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/departments" 
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'HR', 'L2_MANAGER', 'L3_ASSISTANT']}>
                    <DepartmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'HR', 'L2_MANAGER', 'L3_ASSISTANT']}>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
