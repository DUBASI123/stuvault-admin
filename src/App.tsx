import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useStore } from './lib/store';

// Pages
import Login from './pages/Login';
import RegisterSelection from './pages/RegisterSelection';
import RegisterCollegeAdmin from './pages/RegisterCollegeAdmin';
import RegisterDepartmentAdmin from './pages/RegisterDepartmentAdmin';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Colleges from './pages/Colleges';
import Departments from './pages/Departments';
import Students from './pages/Students';
import Approvals from './pages/Approvals';
import Users from './pages/Users';
import Profile from './pages/Profile';
import Logs from './pages/Logs';
import Reports from './pages/Reports';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const currentUser = useStore(state => state.currentUser);

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const currentUser = useStore(state => state.currentUser);

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

import { useEffect } from 'react';

export default function App() {
  const initialize = useStore(state => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);



  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterSelection /></PublicRoute>} />
        <Route path="/register/college-admin" element={<PublicRoute><RegisterCollegeAdmin /></PublicRoute>} />
        <Route path="/register/department-admin" element={<PublicRoute><RegisterDepartmentAdmin /></PublicRoute>} />

        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/colleges" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><Colleges /></ProtectedRoute>} />
          <Route path="/departments" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN']}><Departments /></ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'DEPARTMENT_ADMIN']}><Students /></ProtectedRoute>} />
          <Route path="/approvals" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN']}><Approvals /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><Users /></ProtectedRoute>} />
          <Route path="/logs" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN']}><Logs /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Route>
      </Routes>
    </Router>
  );
}
