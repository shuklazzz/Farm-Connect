import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ title = "FarmConnect 🌾", actions }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? "bg-green-900 shadow-inner ring-1 ring-green-600/50" : "hover:bg-green-800/50";

  const getHomePath = () => {
    if (user?.role === 'admin') return '/admin-dashboard';
    if (user?.role === 'farmer') return '/farmer-dashboard';
    return '/';
  };

  return (
    <nav className="bg-green-700 text-white p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold cursor-pointer" onClick={() => navigate(getHomePath())}>{title}</h1>
        <div className="flex items-center gap-4">
          {/* Role-Aware Dashboard Nav Link */}
          <button 
            onClick={() => navigate(getHomePath())} 
            className={`p-2 rounded-lg transition-all duration-200 ${isActive(getHomePath())}`} 
            title={user?.role === 'buyer' || !user ? 'Home' : 'Dashboard'}
          >
            🏠 <span className="hidden sm:inline text-sm font-bold ml-1">{user?.role === 'buyer' || !user ? 'Home' : 'Dashboard'}</span>
          </button>
          
          {/* Explicit Marketplace Link for Farmers/Admins */}
          {user && (user.role === 'farmer' || user.role === 'admin') && (
            <button 
              onClick={() => navigate('/')} 
              className={`p-2 rounded-lg transition-all duration-200 ${isActive('/')}`} 
              title="Marketplace"
            >
              🛒 <span className="hidden sm:inline text-sm font-bold ml-1">Marketplace</span>
            </button>
          )}
          
          {user && user.role !== 'farmer' && user.role !== 'admin' && (
             <button 
                onClick={() => navigate('/orders')} 
                className={`p-2 rounded-lg transition-all duration-200 ${isActive('/orders')}`} 
                title="My Orders"
             >
               📦 <span className="hidden sm:inline text-sm font-bold ml-1">Orders</span>
             </button>
          )}

          {actions}
          {user ? (
            <>
              <span className="font-semibold hidden sm:inline">Welcome, {user.name}</span>
              <button
                onClick={() => navigate('/profile')}
                className="bg-green-800 hover:bg-green-900 px-4 py-2 rounded text-sm font-bold transition shadow-inner flex items-center gap-2"
                title="Profile Settings"
              >
                ⚙️ Profile
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-sm font-bold transition"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/login')}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded text-sm font-bold transition border border-white/50"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="bg-white text-green-700 hover:bg-gray-100 px-4 py-2 rounded text-sm font-bold transition shadow-sm"
              >
                Signup
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
