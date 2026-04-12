import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth, googleProvider, createUserWithEmailAndPassword, signInWithPopup } from '../firebase';

function RegisterForm({ onNavigate }) {
  const navigate = useNavigate();
  const { register, loginWithFirebase, sendOtp, verifyOtp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    agreeToTerms: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.agreeToTerms) {
      return setError('You must agree to the terms to continue.');
    }

    try {
      // 1. Create User in Firebase
      await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      // 2. Send 6-digit OTP using our custom backend
      const otpRes = await sendOtp(formData.email, formData.fullName);
      
      if (!otpRes.success) {
        setError(otpRes.error);
        return;
      }

      // 3. Show OTP Modal
      setShowOtpModal(true);
      
    } catch (err) {
      console.error('Firebase registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already in use.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'Failed to register.');
      }
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    
    if (otpCode.length !== 6) {
      return setError('Please enter a valid 6-digit code.');
    }

    const res = await verifyOtp(formData.email, otpCode);
    if (res.success) {
      navigate('/home');
    } else {
      setError(res.error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
        setError('');
        const result = await signInWithPopup(auth, googleProvider);
        const idToken = await result.user.getIdToken(true); // force refresh
        
        const backendResult = await loginWithFirebase(idToken);
        if (backendResult.success) {
            navigate('/home');
        } else {
            setError(backendResult.error);
        }
    } catch (err) {
        console.error('Google registration error:', err);
        setError(err.message || 'Failed to sign in with Google');
    }
  };

  const handleSignIn = (e) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('/login');
    }
  };

  return (
    <div className="h-screen flex flex-col justify-center px-6 lg:px-10 xl:px-14">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <svg className="size-5 text-white" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path>
          </svg>
        </div>
        <span className="text-[#111318] text-lg font-bold tracking-tight">AutoBI Studio</span>
      </div>

      {/* Header */}
      {!showOtpModal ? (
        <>
          <h1 className="text-2xl font-bold text-[#111318] mb-0.5">Create your account</h1>
          <p className="text-gray-500 text-sm mb-4">Start your Analytics Journey Today.</p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-[#111318] mb-0.5">Check your email</h1>
          <p className="text-gray-500 text-sm mb-4">We've sent a 6-digit code to <strong>{formData.email}</strong>.</p>
        </>
      )}

      {/* Conditional rendering between Registration Form and OTP Form */}
      {!showOtpModal ? (
        <>
            {/* Social Sign-in Buttons */}
            <div className="flex gap-3 mb-3">
                <button 
                type="button"
                onClick={handleGoogleSignIn}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-xs font-medium text-gray-700">Google</span>
                </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Or sign up with email</span>
                <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-2.5">
                <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                <input
                    type="text"
                    placeholder="Your Name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    required
                />
                </div>

                <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Work Email Address</label>
                <input
                    type="email"
                    placeholder="your-mail@gmai.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    required
                />
                </div>

                <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                    <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none pr-10"
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

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2 mt-2">
                    <span className="material-symbols-outlined text-red-500 text-base">error</span>
                    <p className="text-xs text-red-600">{error}</p>
                    </div>
                )}

                {/* checkbox of terms and conditions 
                <div className="flex items-start gap-2 pt-1">
                <input
                    type="checkbox"
                    id="terms"
                    checked={formData.agreeToTerms}
                    onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                    className="mt-0.5 w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="terms" className="text-xs text-gray-600 leading-tight">
                    I agree to the <a href="#" className="text-primary hover:underline font-medium">Terms</a> and <a href="#" className="text-primary hover:underline font-medium">Privacy Policy</a>
                </label>
                </div>
                */}

                <button
                type="submit"
                className="w-full bg-primary text-white py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mt-1"
                >
                Get Started
                <span className="text-sm">🚀</span>
                </button>
            </form>
        </>
      ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
               <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">6-Digit Verification Code</label>
                <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} // Only allow digits
                    className="w-full px-3 py-3 text-2xl tracking-[0.5em] text-center font-mono border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    required
                />
              </div>

              {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2 mt-2">
                  <span className="material-symbols-outlined text-red-500 text-base">error</span>
                  <p className="text-xs text-red-600">{error}</p>
                  </div>
              )}

              <button
                type="submit"
                className="w-full bg-primary text-white py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                Verify Code
                <span className="material-symbols-outlined text-base">verified</span>
              </button>
              
              <p className="text-center text-xs text-gray-500 mt-2">
                  Didn't receive a code? <button type="button" onClick={() => { setError(''); sendOtp(formData.email, formData.fullName); }} className="text-primary hover:underline font-semibold">Resend</button>
              </p>
          </form>
      )}

      {/* Sign in link */}
      <p className="text-center text-gray-500 text-sm mt-3">
        Already have an account? <button onClick={handleSignIn} className="text-primary hover:underline font-semibold">Sign in</button>
      </p>
    </div>
  );
}

export default RegisterForm;
