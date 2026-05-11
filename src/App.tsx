import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AuthProvider, useAuth } from "@/components/auth/AuthContext";
import { PWAProvider } from "@/components/pwa/PWAContext";
import { useGuestMigration } from "@/hooks/useGuestMigration";
import Index from "./pages/Index";
import Wallets from "./pages/Wallets";
import AddTransaction from "./pages/AddTransaction";
import Analytics from "./pages/Analytics";
import Settlements from "./pages/Settlements";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import HelpFAQ from "./pages/HelpFAQ";
import Privacy from "./pages/Privacy";

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: { retry: false },
  },
});

// Protected Route Component
// Auth Wrapper Component - handles data sync but doesn't force login
const AuthWrapper = ({ children }: { children: ReactNode }) => {
  const { loading } = useAuth();
  useGuestMigration(); // Enable data sync on login
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
                <Route path="/settlements" element={<AuthWrapper><Settlements /></AuthWrapper>} />
                <Route path="/analytics" element={<AuthWrapper><Analytics /></AuthWrapper>} />
                <Route path="/settings" element={<AuthWrapper><Settings /></AuthWrapper>} />
                <Route path="/help" element={<AuthWrapper><HelpFAQ /></AuthWrapper>} />
                <Route path="/privacy" element={<AuthWrapper><Privacy /></AuthWrapper>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </PWAProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
