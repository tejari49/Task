import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SoundProvider } from "./contexts/SoundContext";
import ToastContainer from "./components/Toast";
import LoginPage from "./pages/LoginPage";
import OnboardingPage from "./pages/OnboardingPage";
import HomePage from "./pages/HomePage";

function AppRoutes() {
  const { user, loading, isOnboarded } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950">
      <div className="text-center">
        <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-pp-500 to-violet-500 flex items-center justify-center shadow-xl shadow-pp-500/15 mx-auto mb-5 animate-pulse">
          <span className="text-4xl">🏓</span>
        </div>
        <div className="w-8 h-8 border-2 border-pp-500/30 border-t-pp-500 rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );
  if (!user) return <LoginPage />;
  if (!isOnboarded) return <OnboardingPage />;
  return <Routes><Route path="/" element={<HomePage />} /><Route path="/chat/:chatId" element={<HomePage />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes>;
}

export default function App() {
  return (
    <ThemeProvider><AuthProvider><SoundProvider>
      <HashRouter><AppRoutes /><ToastContainer /></HashRouter>
    </SoundProvider></AuthProvider></ThemeProvider>
  );
}
