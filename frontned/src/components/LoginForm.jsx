import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth, signInWithEmailAndPassword, signInWithPopup } from '../firebase';
import { GoogleAuthProvider } from 'firebase/auth';

function LoginForm({ onNavigate }) {
  const navigate = useNavigate();
  const { login, loginWithFirebase } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    keepSignedIn: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 1. Sign in with Firebase explicitly first
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const firebaseUser = userCredential.user;

      // 2. Enforce Email Verification Rule
      if (!firebaseUser.emailVerified) {
        setError('Please verify your email address before logging in. Check your inbox or create a new account.');
        await auth.signOut();
        return;
      }

      // 3. Get the ID token
      const idToken = await firebaseUser.getIdToken(true);

      // 4. Send token to our backend to get our own JWT and complete login
      const res = await loginWithFirebase(idToken);
      
      if (res.success) {
        navigate('/home');
      } else {
        // If our backend rejects it, sign them out of Firebase too
        await auth.signOut();
        setError(res.error || 'Failed to authenticate with server');
      }

    } catch (err) {
      console.error('Login error:', err);
      let errorMsg = 'Invalid email or password.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMsg = 'Invalid email or password.';
      } else if (err.code === 'auth/too-many-requests') {
          errorMsg = 'Too many attempts. Please try again later.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
        setError('');
        setIsLoading(true);
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const idToken = await result.user.getIdToken();

        const res = await loginWithFirebase(idToken);
        if (res.success) {
            navigate('/home');
        } else {
            await auth.signOut();
            setError(res.error || 'Failed to authenticate with server');
        }
    } catch (err) {
        // Silently ignore cancelled popup — user just closed the window
        if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
            return;
        }
        console.error('Google sign-in error:', err);
        setError(err.message || 'Failed to sign in with Google');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {isLoading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="mt-4 text-[12px] font-bold text-gray-500 uppercase tracking-widest animate-pulse">Authenticating</p>
        </div>
      )}
      {/* Top right - Create account link */}
      <div className="flex justify-end px-8 lg:px-12 py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">New to AutoBI?</span>
          <button 
            type="button"
            onClick={() => onNavigate('/register')}
            className="px-4 py-2 border border-primary text-primary text-sm font-semibold rounded-full hover:bg-primary/5 transition-colors"
          >
            Create an account
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-8 lg:px-14 xl:px-20 max-w-lg mx-auto w-full">
        {/* Header */}
        <h1 className="text-3xl font-bold text-[#111318] mb-1">Sign In</h1>
        <p className="text-gray-500 text-base mb-6">Enter your workspace credentials</p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
              <input
              type="email"
              placeholder="yourmail@gmail.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none bg-gray-50/50"
              required
              />
          </div>

          <div>
              <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
              <button type="button" onClick={() => navigate('/forgot-password')} className="text-sm text-primary hover:underline font-medium focus:outline-none">Forgot password?</button>
              </div>
              <div className="relative">
              <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none pr-10 bg-gray-50/50"
                  required
              />
              <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                  <span className="material-symbols-outlined text-lg">
                  {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
              </button>
              </div>
          </div>

          <div className="flex items-center gap-2.5">
              <input
              type="checkbox"
              id="keepSignedIn"
              checked={formData.keepSignedIn}
              onChange={(e) => setFormData({ ...formData, keepSignedIn: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="keepSignedIn" className="text-sm text-gray-600">
              Keep me signed in
              </label>
          </div>

          {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500 text-lg">error</span>
                  <p className="text-sm text-red-600">{error}</p>
              </div>
              )}

              <button
              type="submit"
              className="w-full bg-primary text-white py-3.5 rounded-xl font-bold text-base hover:bg-blue-700 transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
              Continue to Studio
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
          </button>
        </form>

        {/* Enterprise SSO Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Enterprise SSO</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* Google SSO Button */}
        <div className="flex gap-3">
            <button 
                type="button"
                onClick={handleGoogleSignIn}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-sm font-medium text-gray-700">Google</span>
            </button>
        </div>
        
        
      </div>
    </div>
  );
}

export default LoginForm;
