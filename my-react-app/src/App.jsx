import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ComplaintProvider } from "@/contexts/ComplaintContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SubmitComplaint from "./pages/SubmitComplaint";
import TrackComplaint from "./pages/TrackComplaint";
import ComplaintDetails from "./pages/ComplaintDetails";
import FeedbackPage from "./pages/FeedbackPage";

import AdminDashboard from "./pages/AdminDashboard";
import AdminComplaints from "./pages/AdminComplaints";          // ✅ NEW
import AdminComplaintDetails from "./pages/AdminComplaintDetails"; // ✅ NEW
import AdminAssignComplaints from "./pages/AdminAssignComplaints";

import DepartmentDashboard from "./pages/DepartmentDashboard";
import DepartmentReports from "./pages/DepartmentReports";
import DepartmentComplaints from "./pages/DepartmentComplaints";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

import "./index.css";

const queryClient = new QueryClient();

// 🔒 Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/" />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <ComplaintProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />

            <Routes>
              {/* PUBLIC */}
              <Route path="/" element={<Login />} />

              {/* ---------------- Citizen Routes ---------------- */}
              <Route
                path="/dashboard"
                element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
              />
              <Route
                path="/submit"
                element={<ProtectedRoute><SubmitComplaint /></ProtectedRoute>}
              />
              <Route
                path="/track"
                element={<ProtectedRoute><TrackComplaint /></ProtectedRoute>}
              />
              <Route
                path="/my-complaints"
                element={<ProtectedRoute><TrackComplaint /></ProtectedRoute>}
              />
              <Route
                path="/complaint/:id"
                element={<ProtectedRoute><ComplaintDetails /></ProtectedRoute>}
              />
              <Route
                path="/feedback/:id"
                element={<ProtectedRoute><FeedbackPage /></ProtectedRoute>}
              />

              {/* ---------------- ADMIN ROUTES ---------------- */}
              
              {/* Admin Home */}
              <Route
                path="/admin-dashboard"
                element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>}
              />

              {/* Admin → Complaints */}
              <Route
                path="/admin-dashboard/complaints"
                element={<ProtectedRoute><AdminComplaints /></ProtectedRoute>}
              />

              {/* Admin → Complaint Details */}
              <Route
                path="/admin-dashboard/complaint/:id"
                element={<ProtectedRoute><AdminComplaintDetails /></ProtectedRoute>}
              />

              {/* Admin → Assign Complaints */}
             {/* ✅ ADD THIS NEW ROUTE */}
              <Route
                path="/admin-dashboard/assign"
                element={<ProtectedRoute><AdminAssignComplaints /></ProtectedRoute>}
              />

              {/* Admin → Users */}
              <Route
                path="/admin-dashboard/users"
                element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>}
              />

              {/* Admin → Settings */}
              <Route
                path="/admin-dashboard/settings"
                element={<ProtectedRoute><Profile /></ProtectedRoute>}
              />


              {/* ---------------- DEPARTMENT ROUTES ---------------- */}
              <Route
                path="/department-dashboard" // This remains the main dashboard
                element={<ProtectedRoute><DepartmentDashboard /></ProtectedRoute>}
              />
              <Route
                path="/department/complaints" // This now correctly points to the dashboard
                element={<ProtectedRoute><DepartmentComplaints /></ProtectedRoute>}
              />
              <Route
                path="/department/reports" // This also points to the dashboard for now
                element={<ProtectedRoute><DepartmentReports /></ProtectedRoute>}
              />


              {/* ---------------- PROFILE ---------------- */}
              <Route
                path="/profile"
                element={<ProtectedRoute><Profile /></ProtectedRoute>}
              />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>

          </TooltipProvider>
        </ComplaintProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
