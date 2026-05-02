import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

const SignUp = () => {
  const navigate = useNavigate();
  const [currentRole, setCurrentRole] = useState('buyer');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    farmName: '',
    deliveryFee: '',
    deliveryRadius: '',
  });

  const fetchPincodeDetails = async (pincode) => {
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();
      if (data && data[0] && data[0].Status === 'Success') {
        const postOffice = data[0].PostOffice[0];
        setFormData(prev => ({
          ...prev,
          city: postOffice.Block !== 'NA' ? postOffice.Block : postOffice.District,
          district: postOffice.District,
          state: postOffice.State
        }));
      }
    } catch (error) {
      console.error("Failed to fetch pincode details:", error);
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));

    if (id === 'pincode' && value.length === 6 && /^\d+$/.test(value)) {
        fetchPincodeDetails(value);
    }
  };

  const handleRoleSelect = (role) => {
    setCurrentRole(role);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const userData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: currentRole,
      location: {
        city: formData.city,
        district: formData.district,
        state: formData.state,
        pincode: formData.pincode,
      },
    };

    if (currentRole === 'farmer') {
      userData.farmDetails = {
        farmName: formData.farmName,
        deliveryFee: formData.deliveryFee || 0,
        deliveryRadius: formData.deliveryRadius || 10,
      };
    }

    try {
      await authAPI.signup(userData);
      setShowSuccessModal(true);
    } catch (error) {
      setErrorMsg(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    setShowSuccessModal(false);
    // Reset form
    setFormData({
      name: '',
      email: '',
      password: '',
      city: '',
      district: '',
      state: '',
      pincode: '',
      farmName: '',
      deliveryFee: '',
      deliveryRadius: '',
    });
    setCurrentRole('buyer');
  };

  return (
    <div className="bg-green-50 flex items-center justify-center min-h-screen p-4">
      <style>{`
        @keyframes form-push-in {
          0% { transform: translateX(-300px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .form-container {
          animation: form-push-in 2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>

      {/* Error Modal */}
      {errorMsg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full animate-card">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Registration Failed</h2>
              <p className="text-gray-600">{errorMsg}</p>
            </div>

            <div className="mt-8">
              <button
                onClick={() => setErrorMsg(null)}
                className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full animate-card">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Account Created!</h2>
              <p className="text-gray-600">Your account has been successfully created. You can now log in or continue exploring.</p>
            </div>

            <div className="space-y-3 mt-8">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate('/login');
                }}
                className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-600/30"
              >
                Login Now
              </button>
              <button
                onClick={handleContinue}
                className="w-full bg-gray-200 text-gray-800 font-bold py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden form-container">
        <div className="bg-green-600 p-6 text-center">
          <h1 className="text-3xl font-bold text-white">FarmConnect</h1>
          <p className="text-green-100 mt-1">Smart Supply Chain System</p>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            Create Your Account
          </h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I am a...
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleRoleSelect('buyer')}
                className={`p-3 border-2 rounded-lg font-bold transition-all ${
                  currentRole === 'buyer'
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-300 bg-white text-gray-500'
                }`}
              >
                Buyer
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('farmer')}
                className={`p-3 border-2 rounded-lg font-bold transition-all ${
                  currentRole === 'farmer'
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-300 bg-white text-gray-500'
                }`}
              >
                Farmer
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
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
                className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="e.g. Patna"
                  className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  District
                </label>
                <input
                  type="text"
                  id="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  placeholder="e.g. Patna"
                  className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  State
                </label>
                <input
                  type="text"
                  id="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="e.g. Bihar"
                  className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                    Pincode
                </label>
                <input
                    type="text"
                    id="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="e.g. 800001"
                    className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    required
                />
              </div>
            </div>

            {currentRole === 'farmer' && (
              <div className="pt-4 border-t border-gray-100 space-y-4">
                <p className="text-sm font-bold text-green-700 bg-green-50 p-2 rounded">
                  🌾 Farm Details
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Farm Name
                  </label>
                  <input
                    type="text"
                    id="farmName"
                    value={formData.farmName}
                    onChange={handleInputChange}
                    className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Delivery Fee (₹)
                    </label>
                    <input
                      type="number"
                      id="deliveryFee"
                      value={formData.deliveryFee}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Radius (km)
                    </label>
                    <input
                      type="number"
                      id="deliveryRadius"
                      value={formData.deliveryRadius}
                      onChange={handleInputChange}
                      placeholder="10"
                      className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors mt-6 shadow-lg shadow-green-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-green-600 font-bold hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;

