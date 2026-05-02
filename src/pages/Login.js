import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import ErrorModal from '../components/ErrorModal';

const Login = () => {
  const navigate = useNavigate();
  const { login, user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
        if (user.role === 'admin') navigate('/admin-dashboard', { replace: true });
        else if (user.role === 'farmer') navigate('/farmer-dashboard', { replace: true });
        else navigate('/buyer-dashboard', { replace: true });
    }
  }, [user, isAuthenticated, navigate]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await authAPI.login(formData.email, formData.password);
      
      // CRITICAL FIX: Merge token into user object so it's saved in localStorage
      // api.js expects user.token to exist!
      const userWithToken = { ...result.user, token: result.token, refreshToken: result.refreshToken };
      
      login(userWithToken);

      // Redirect based on role
      const userRole = result.user.role;
      if (userRole === 'admin') {
        navigate('/admin-dashboard');
      } else if (userRole === 'farmer') {
        navigate('/farmer-dashboard');
      } else {
        navigate('/buyer-dashboard');
      }
    } catch (error) {
      setError(error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative bg-green-50 flex items-center justify-center min-h-screen overflow-hidden">
      <ErrorModal 
        show={!!error} 
        message={error} 
        onClose={() => setError(null)} 
      />
      {/* Floating Vegetables & Spices */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Left vegetables */}
        <div className="absolute top-10 left-10 text-5xl animate-float-to-center" style={{ animationDelay: '0s' }}>🥕</div>
        <div className="absolute top-20 left-24 text-6xl animate-float-to-center" style={{ animationDelay: '0.2s' }}>🌽</div>
        <div className="absolute top-32 left-12 text-5xl animate-float-to-center" style={{ animationDelay: '0.4s' }}>🥔</div>

        {/* Top Right vegetables */}
        <div className="absolute top-16 right-20 text-5xl animate-float-to-center" style={{ animationDelay: '0.1s' }}>🍅</div>
        <div className="absolute top-32 right-12 text-6xl animate-float-to-center" style={{ animationDelay: '0.3s' }}>🥬</div>
        <div className="absolute top-24 right-32 text-5xl animate-float-to-center" style={{ animationDelay: '0.5s' }}>🌶️</div>

        {/* Bottom Left vegetables */}
        <div className="absolute bottom-20 left-16 text-5xl animate-float-to-center" style={{ animationDelay: '0.15s' }}>🧄</div>
        <div className="absolute bottom-32 left-32 text-6xl animate-float-to-center" style={{ animationDelay: '0.35s' }}>🥒</div>
        <div className="absolute bottom-16 left-48 text-5xl animate-float-to-center" style={{ animationDelay: '0.55s' }}>🍆</div>

        {/* Bottom Right vegetables */}
        <div className="absolute bottom-24 right-24 text-5xl animate-float-to-center" style={{ animationDelay: '0.25s' }}>🧅</div>
        <div className="absolute bottom-32 right-40 text-6xl animate-float-to-center" style={{ animationDelay: '0.45s' }}>🥦</div>
        <div className="absolute bottom-12 right-16 text-5xl animate-float-to-center" style={{ animationDelay: '0.6s' }}>🌶️</div>

        {/* Middle sides vegetables */}
        <div className="absolute top-1/2 left-8 text-5xl animate-float-to-center" style={{ animationDelay: '0.2s' }}>🥕</div>
        <div className="absolute top-1/3 right-8 text-6xl animate-float-to-center" style={{ animationDelay: '0.4s' }}>🌽</div>
        <div className="absolute bottom-1/3 left-20 text-5xl animate-float-to-center" style={{ animationDelay: '0.3s' }}>🍅</div>
        <div className="absolute top-2/3 right-20 text-5xl animate-float-to-center" style={{ animationDelay: '0.5s' }}>🥬</div>
      </div>

      {/* Vine from top-left */}
      <div className="absolute top-0 left-0 animate-vine-top-left">
        <svg className="w-48 h-48 text-green-600 opacity-80" viewBox="0 0 200 200" preserveAspectRatio="none">
          <path d="M 20 0 Q 40 30, 60 50 Q 80 70, 100 80 Q 110 85, 120 90" stroke="currentColor" fill="none" strokeWidth="3" strokeLinecap="round"/>
          <circle cx="60" cy="50" r="4" fill="currentColor"/>
          <circle cx="85" cy="75" r="4" fill="currentColor"/>
          <circle cx="105" cy="85" r="4" fill="currentColor"/>
        </svg>
      </div>

      {/* Vine from top-right */}
      <div className="absolute top-0 right-0 animate-vine-top-right">
        <svg className="w-48 h-48 text-green-600 opacity-80" viewBox="0 0 200 200" preserveAspectRatio="none">
          <path d="M 180 0 Q 160 30, 140 50 Q 120 70, 100 80 Q 90 85, 80 90" stroke="currentColor" fill="none" strokeWidth="3" strokeLinecap="round"/>
          <circle cx="140" cy="50" r="4" fill="currentColor"/>
          <circle cx="115" cy="75" r="4" fill="currentColor"/>
          <circle cx="95" cy="85" r="4" fill="currentColor"/>
        </svg>
      </div>

      {/* Vine from bottom-left */}
      <div className="absolute bottom-0 left-0 animate-vine-bottom-left">
        <svg className="w-48 h-48 text-green-600 opacity-80" viewBox="0 0 200 200" preserveAspectRatio="none">
          <path d="M 20 200 Q 40 170, 60 150 Q 80 130, 100 120 Q 110 115, 120 110" stroke="currentColor" fill="none" strokeWidth="3" strokeLinecap="round"/>
          <circle cx="60" cy="150" r="4" fill="currentColor"/>
          <circle cx="85" cy="125" r="4" fill="currentColor"/>
          <circle cx="105" cy="115" r="4" fill="currentColor"/>
        </svg>
      </div>

      {/* Vine from bottom-right */}
      <div className="absolute bottom-0 right-0 animate-vine-bottom-right">
        <svg className="w-48 h-48 text-green-600 opacity-80" viewBox="0 0 200 200" preserveAspectRatio="none">
          <path d="M 180 200 Q 160 170, 140 150 Q 120 130, 100 120 Q 90 115, 80 110" stroke="currentColor" fill="none" strokeWidth="3" strokeLinecap="round"/>
          <circle cx="140" cy="150" r="4" fill="currentColor"/>
          <circle cx="115" cy="125" r="4" fill="currentColor"/>
          <circle cx="95" cy="115" r="4" fill="currentColor"/>
        </svg>
      </div>

      <style>{`
        @keyframes vine-top-left {
          0% {
            transform: translateX(-100%) translateY(-100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0) translateY(0);
            opacity: 1;
          }
        }
        @keyframes vine-top-right {
          0% {
            transform: translateX(100%) translateY(-100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0) translateY(0);
            opacity: 1;
          }
        }
        @keyframes vine-bottom-left {
          0% {
            transform: translateX(-100%) translateY(100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0) translateY(0);
            opacity: 1;
          }
        }
        @keyframes vine-bottom-right {
          0% {
            transform: translateX(100%) translateY(100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0) translateY(0);
            opacity: 1;
          }
        }
        @keyframes float-to-center {
          0% {
            transform: scale(0) translateX(0) translateY(0);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: scale(1) translateX(var(--tx, 50vw)) translateY(var(--ty, 50vh));
            opacity: 0.3;
          }
        }
        .animate-vine-top-left {
          animation: vine-top-left 1.2s ease-out forwards;
        }
        .animate-vine-top-right {
          animation: vine-top-right 1.2s ease-out forwards;
        }
        .animate-vine-bottom-left {
          animation: vine-bottom-left 1.2s ease-out forwards;
        }
        .animate-vine-bottom-right {
          animation: vine-bottom-right 1.2s ease-out forwards;
        }
        .animate-float-to-center {
          animation: float-to-center 2.5s ease-in-out infinite;
        }
      `}</style>

      {/* Login Box */}
      <div className="relative z-10 bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-login-box">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-700 mb-2">🌿 FarmConnect</h1>
          <p className="text-gray-600 font-semibold">Welcome Back</p>
          <p className="text-gray-500 text-sm">Login to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Checking Credentials...' : 'Login'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" className="text-green-600 font-bold hover:underline">
            Sign up
          </Link>
        </p>
        <p className="mt-3 text-center text-sm">
          <Link to="/forgot-password" className="text-green-600 font-medium hover:underline transition-all">
            Forgot your password?
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes login-box-fade {
          0% {
            transform: scale(0.9);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-login-box {
          animation: login-box-fade 0.8s ease-out 0.3s backwards;
        }
      `}</style>
    </div>
  );
};

export default Login;

