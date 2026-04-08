import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ForgotPasswordForm({ onNavigate }) {
  const navigate = useNavigate();
  const { resetPasswordOtp, verifyResetPassword } = useAuth();
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    otpCode: '',
    newPassword: ''
  });

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.email) {
      return setError('Please enter your email address.');
    }

    const otpRes = await resetPasswordOtp(formData.email);
    if (!otpRes.success) {
      setError(otpRes.error);
      return;
    }

    setStep(2);
  };

  const handleVerifyReset = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.otpCode.length !== 6) {
      return setError('Please enter a valid 6-digit code.');
    }
    if (formData.newPassword.length < 6) {
      return setError('Password should be at least 6 characters.');
    }

    const res = await verifyResetPassword(formData.email, formData.otpCode, formData.newPassword);
    
    if (res.success) {
      setSuccessMessage('Password reset successfully!');
      setTimeout(() => {
          navigate('/login');
      }, 2000);
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="h-screen flex flex-col">

      <div className="flex-1 flex flex-col justify-center px-8 lg:px-14 xl:px-20 max-w-lg mx-auto w-full">
        
        {/* Header */}
        {step === 1 ? (
          <>
            <h1 className="text-3xl font-bold text-[#111318] mb-1">Reset Password</h1>
            <p className="text-gray-500 text-base mb-6">Enter your email to receive a reset code</p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-[#111318] mb-1">Check your email</h1>
            <p className="text-gray-500 text-base mb-6">We've sent a 6-digit reset code to <strong>{formData.email}</strong>.</p>
          </>
        )}

        {/* Conditional rendering */}
        {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
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
                    Send Reset Code
                    <span className="material-symbols-outlined text-xl">send</span>
                </button>
            </form>
        ) : (
            <form onSubmit={handleVerifyReset} className="space-y-5">
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">6-Digit Code</label>
                  <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={formData.otpCode}
                      onChange={(e) => setFormData({ ...formData, otpCode: e.target.value.replace(/\D/g, '') })}
                      className="w-full px-4 py-4 text-3xl tracking-[0.5em] text-center font-mono border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      required
                  />
              </div>

              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">New Password</label>
                  <div className="relative">
                      <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••••"
                          value={formData.newPassword}
                          onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
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

              {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-red-500 text-lg">error</span>
                      <p className="text-sm text-red-600">{error}</p>
                  </div>
              )}
              
              {successMessage && (
                  <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                      <p className="text-sm text-green-600">{successMessage}</p>
                  </div>
              )}

              <button
                  type="submit"
                  className="w-full bg-primary text-white py-3.5 rounded-xl font-bold text-base hover:bg-blue-700 transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                  Reset Password
                  <span className="material-symbols-outlined text-xl">lock_reset</span>
              </button>
            </form>
        )}

        <div className="mt-8 text-center">
            <button 
                onClick={() => navigate('/login')} 
                className="text-sm text-gray-500 hover:text-primary transition-colors flex items-center justify-center gap-1.5 mx-auto"
            >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Back to Sign In
            </button>
        </div>

      </div>
    </div>
  );
}

export default ForgotPasswordForm;
