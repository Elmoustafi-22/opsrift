import { Routes, Route, Navigate, Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import { useAuthStore } from "../store/useAuthStore";

import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import TasksPage from "../pages/TasksPage";
import TaskDetailsPage from "../pages/TaskDetailsPage";
import ProfilePage from "../pages/ProfilePage";
import Layout from "../components/Layout";

// Placeholder components
const Unauthorized = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const redirectPath = isAuthenticated ? "/dashboard" : "/login";
  const redirectLabel = isAuthenticated ? "dashboard" : "login page";

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(redirectPath, { replace: true });
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate, redirectPath]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDFDFD] p-8 text-center">
      <div className="bg-red-50 text-red-600 p-4 rounded-full mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      </div>
      <h2 className="text-3xl font-black font-heading text-neutral-900 tracking-tight">Unauthorized Access</h2>
      <p className="mt-4 text-neutral-500 font-medium">You don't have permission to view this page.</p>
      <p className="mt-2 text-sm text-neutral-400 font-bold uppercase tracking-widest">Redirecting to your {redirectLabel} in 5 seconds...</p>
    </div>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected Routes - Admin, Manager, Staff */}
      <Route element={<ProtectedRoute allowedRoles={["admin", "manager", "staff"]} />}>
        <Route element={<Layout children={<Outlet />} />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/tasks/:id" element={<TaskDetailsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
