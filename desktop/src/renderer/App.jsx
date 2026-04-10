import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import SetupOTPScreen from './screens/SetupOTPScreen';
import VerifyOTPScreen from './screens/VerifyOTPScreen';
import DashboardScreen from './screens/DashboardScreen';
import useAuthStore from './store/authStore';

const style = document.createElement('style');
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg-primary: #1a1a2e;
    --bg-secondary: #16213e;
    --bg-tertiary: #0f3460;
    --accent: #e94560;
    --text-primary: #ffffff;
    --text-secondary: #8892b0;
    --text-muted: #ccd6f6;
    --success: #4ecca3;
    --error: #e94560;
    --border: #0f3460;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: var(--bg-primary);
    color: var(--text-primary);
    min-height: 100vh;
  }
  #root { min-height: 100vh; display: flex; flex-direction: column; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg-secondary); }
  ::-webkit-scrollbar-thumb { background: var(--bg-tertiary); border-radius: 3px; }
`;
document.head.appendChild(style);

function ProtectedRoute({ children }) {
  const token = useAuthStore(s => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const token = useAuthStore(s => s.token);
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const initAuth = useAuthStore(s => s.initAuth);

  useEffect(() => {
    initAuth();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginScreen /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterScreen /></PublicRoute>} />
        <Route path="/verify-otp" element={<VerifyOTPScreen />} />
        <Route path="/setup-otp" element={<ProtectedRoute><SetupOTPScreen /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardScreen /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
