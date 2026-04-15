import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import StudentDashboard from "./pages/StudentDashboard";
import WardenDashboard from "./pages/WardenDashboard";
import FinanceDashboard from "./pages/FinanceDashboard";
import StudentAffairsDashboard from "./pages/StudentAffairsDashboard";
import AcademicAffairsDashboard from "./pages/AcademicAffairsDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute allowedRoles={['student']} />}>
              <Route path="/student" element={<StudentDashboard />} />
              <Route path="/student/*" element={<StudentDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['warden']} />}>
              <Route path="/warden" element={<WardenDashboard />} />
              <Route path="/warden/*" element={<WardenDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['finance']} />}>
              <Route path="/finance" element={<FinanceDashboard />} />
              <Route path="/finance/*" element={<FinanceDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['student_affairs']} />}>
              <Route path="/student-affairs" element={<StudentAffairsDashboard />} />
              <Route path="/student-affairs/*" element={<StudentAffairsDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['academic_affairs']} />}>
              <Route path="/academic-affairs" element={<AcademicAffairsDashboard />} />
              <Route path="/academic-affairs/*" element={<AcademicAffairsDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
