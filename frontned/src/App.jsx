import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TranslationProvider } from './context/TranslationContext';
import { DatasetProvider } from './context/DatasetContext';
import LandingPage from './pages/LandingPage';
import AuthLayout from './components/AuthLayout';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import ForgotPasswordForm from './components/ForgotPasswordForm';
import HomePage from './pages/HomePage';
import DatasetsPage from './pages/DatasetsPage';
import StudioPage from './pages/StudioPage';
import SettingsPage from './pages/SettingsPage';
import PageLoader from './components/PageLoader';

function App() {
  return (
    <AuthProvider>
      <TranslationProvider>
        <DatasetProvider>
          <Router>
          <PageLoader />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={
            <AuthLayout isLogin={true}>
              <LoginForm />
            </AuthLayout>
          } />
          <Route path="/register" element={
            <AuthLayout isLogin={false}>
              <RegisterForm />
            </AuthLayout>
          } />
          <Route path="/forgot-password" element={
            <AuthLayout isLogin={true}>
              <ForgotPasswordForm />
            </AuthLayout>
          } />
          <Route path="/home" element={<HomePage />} />
          <Route path="/datasets" element={<DatasetsPage />} />
          <Route path="/studio" element={<StudioPage />} />
          <Route path="/studio/:dashboardId" element={<StudioPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Router>
      </DatasetProvider>
    </TranslationProvider>
  </AuthProvider>
  );
}

export default App;
