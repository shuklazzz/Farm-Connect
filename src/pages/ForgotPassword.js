import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  // Manage the 3-step UI sequence
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  
  // Form State
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Step 1: Send the email
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authAPI.forgotPassword(email);
      setStep(2);
      setSuccessMsg("A 6-digit code has been sent to your email.");
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Ensure email is registered.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Validate the code
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await authAPI.verifyOTP(email, otp);
      setStep(3); // Successfully matched OTP! Move to final step.
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Establish the new password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authAPI.resetPassword(email, otp, newPassword);
      setSuccessMsg("Password reset successfully! Redirecting to login...");
      // Wait 2 seconds so the user sees the success message before booting them to login
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative bg-green-50 flex items-center justify-center min-h-screen overflow-hidden">
        {/* Simple Thematic Background */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
             <div className="absolute top-[10%] left-[10%] text-6xl drop-shadow-md">🌾</div>
             <div className="absolute bottom-[15%] right-[15%] text-7xl drop-shadow-md">🚜</div>
        </div>

      <div className="relative z-10 bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border-4 border-green-50">
        <div className="text-center mb-8">
          <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
            <span className="text-3xl">🔐</span>
          </div>
          <h1 className="text-3xl font-black text-green-800 mb-2">Password Reset</h1>
          <p className="text-gray-500 text-sm font-medium">
            {step === 1 && "Enter your email to receive a recovery code"}
            {step === 2 && "Enter the 6-digit code we sent you"}
            {step === 3 && "Create a secure new password"}
          </p>
        </div>

        {/* Dynamic Alerts */}
        {error && <div className="mb-6 text-sm font-bold text-red-700 bg-red-50 border border-red-200 p-4 rounded-xl shadow-sm animate-pulse">{error}</div>}
        {successMsg && <div className="mb-6 text-sm font-bold text-green-700 bg-green-50 border border-green-200 p-4 rounded-xl shadow-sm">{successMsg}</div>}

        {/* --- STEP 1 FORM --- */}
        {step === 1 && (
          <form onSubmit={handleRequestOTP} className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Registered Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="farmer@example.com"
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all shadow-inner bg-gray-50 focus:bg-white"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700 transition shadow-lg shadow-green-200 active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Sending Code...' : 'Send Recovery Code'}
            </button>
          </form>
        )}

        {/* --- STEP 2 FORM --- */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">6-Digit Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full p-4 border border-gray-300 rounded-xl text-center tracking-[0.5em] text-3xl font-black text-green-800 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all shadow-inner bg-gray-50 focus:bg-white"
                required
                maxLength={6}
              />
              <p className="text-xs text-center text-gray-400 mt-2">Code expires in 15 minutes</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700 transition shadow-lg shadow-green-200 active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
        )}

        {/* --- STEP 3 FORM --- */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all shadow-inner bg-gray-50 focus:bg-white"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700 transition shadow-lg shadow-green-200 active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save & Login'}
            </button>
          </form>
        )}

        <div className="mt-8 border-t border-gray-100 pt-6">
            <p className="text-center text-sm text-gray-500">
            Remembered your password?{' '}
            <Link to="/login" className="text-green-600 font-bold hover:text-green-800 transition">
                Back to Login
            </Link>
            </p>
        </div>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ForgotPassword;
