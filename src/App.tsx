import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ScrollSourceProvider } from "@/contexts/ScrollSourceContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ControlCenter from "@/pages/ControlCenter";
import Center from "@/pages/Center";
import AI from "@/pages/AI";
import Insights from "@/pages/Insights";
import LabInsights from "@/pages/LabInsights";
import Labs from "@/pages/Labs";
import Store from "@/pages/Store";
import Notifications from "@/pages/Notifications";
import Profile from "@/pages/Profile";
import SmartWake from "@/pages/SmartWake";
import NotFound from "./pages/NotFound";
import SplashScreen from "@/components/SplashScreen";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ScrollSourceProvider>
            <SplashScreen />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Navigate to="/control" replace />} />
              <Route path="/control" element={<ControlCenter />} />
              <Route path="/center" element={<Center />} />
              <Route path="/ai" element={<AI />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/lab-insights" element={<LabInsights />} />
              <Route path="/data" element={<Labs />} />
              <Route path="/shop" element={<Store />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            {/* Standalone pages without AppLayout */}
            <Route path="/smart-wake" element={<ProtectedRoute><SmartWake /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
            </ScrollSourceProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
