import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AuthProvider, useAuth } from "@/components/auth/AuthContext";
import { PWAProvider } from "@/components/pwa/PWAContext";
import { useDataSync } from "@/hooks/useDataSync";
import { Analytics as VercelAnalytics } from '@vercel/analytics/react';
import Index from "./pages/Index";
import Wallets from "./pages/Wallets";
import AddTransaction from "./pages/AddTransaction";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import HelpFAQ from "./pages/HelpFAQ";
import Privacy from "./pages/Privacy";

const queryClient = new QueryClient();

// Protected Route Component
// Auth Wrapper Component - handles data sync but doesn't force login
const AuthWrapper = ({ children }: { children: ReactNode }) => {
  const { loading } = useAuth();
  useDataSync(); // Enable data sync
  // We can add logic here later to try syncing if a description exists in storage

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  // No redirect - just render children even if !user
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" />
        <AuthProvider>
          <PWAProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* Main Routes - Accessible to all */}
                <Route path="/" element={<AuthWrapper><Index /></AuthWrapper>} />
                <Route path="/wallets" element={<AuthWrapper><Wallets /></AuthWrapper>} />
                <Route path="/add" element={<AuthWrapper><AddTransaction /></AuthWrapper>} />
                <Route path="/analytics" element={<AuthWrapper><Analytics /></AuthWrapper>} />
                <Route path="/settings" element={<AuthWrapper><Settings /></AuthWrapper>} />
                <Route path="/help" element={<AuthWrapper><HelpFAQ /></AuthWrapper>} />
                <Route path="/privacy" element={<AuthWrapper><Privacy /></AuthWrapper>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </PWAProvider>
        </AuthProvider>
        <VercelAnalytics />
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
