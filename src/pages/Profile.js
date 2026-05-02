import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import Navbar from '../components/Navbar';

const Profile = () => {
  const { user, updateUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    location: { address: '', city: '', district: '', state: '', pincode: '' },
    farmDetails: { farmName: '', deliveryRadius: '', deliveryFee: '', allowPickup: false }
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await userAPI.getProfile();
        // Prepopulate exact keys
        setFormData({
            name: data.user.name || '',
            email: data.user.email || '',
            location: {
                address: data.user.location?.address || '',
                city: data.user.location?.city || '',
                district: data.user.location?.district || '',
                state: data.user.location?.state || '',
                pincode: data.user.location?.pincode || '',
            },
            farmDetails: {
                farmName: data.user.farmDetails?.farmName || '',
                deliveryRadius: data.user.farmDetails?.deliveryRadius || '',
                deliveryFee: data.user.farmDetails?.deliveryFee || '',
                allowPickup: data.user.farmDetails?.allowPickup || false,
            }
        });
      } catch (err) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
        fetchProfile();
    }
  }, [user]);

  const fetchPincodeDetails = async (pincode) => {
      try {
          const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
          const data = await response.json();
          if (data && data[0] && data[0].Status === 'Success') {
              const postOffice = data[0].PostOffice[0];
              setFormData(prev => ({
                  ...prev,
                  location: {
                      ...prev.location,
                      city: postOffice.Block !== 'NA' ? postOffice.Block : postOffice.District,
                      district: postOffice.District,
                      state: postOffice.State
                  }
              }));
          }
      } catch (err) {
          console.error("Pincode API failed", err);
      }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('location.')) {
        const field = name.split('.')[1];
        setFormData(prev => ({
            ...prev,
            location: { ...prev.location, [field]: value }
        }));
        
        if (field === 'pincode' && value.length === 6 && /^\d+$/.test(value)) {
            fetchPincodeDetails(value);
        }
    } else if (name.startsWith('farmDetails.')) {
        const field = name.split('.')[1];
        setFormData(prev => ({
            ...prev,
            farmDetails: { ...prev.farmDetails, [field]: type === 'checkbox' ? checked : value }
        }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    
    try {
      const payload = {
          name: formData.name,
          email: formData.email,
          location: formData.location,
          // Only send farm details if the user is a farmer
          ...(user.role === 'farmer' && { farmDetails: formData.farmDetails })
      };
      
      const response = await userAPI.updateProfile(payload);
      
      // Immediately reflect updates in the global App Context (e.g., changes Navbar city seamlessly)
      updateUser(response.user);
      
      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#f3fbf6] min-h-screen">
         <Navbar title="My Profile" />
         <div className="flex justify-center items-center h-64 text-green-700 font-bold animate-pulse">Loading Profile...</div>
      </div>
    );
  }

  return (
    <div className="bg-[#f3fbf6] min-h-screen pb-12">
      <Navbar title="My Profile ⚙️" />
      
      <div className="container mx-auto px-4 mt-8 max-w-3xl">
        <div className="bg-white rounded-3xl shadow-xl border-4 border-green-50 p-6 sm:p-10">
            <div className="flex items-center gap-4 border-b border-gray-100 pb-6 mb-6">
                <div className="bg-green-100 text-green-800 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black shadow-inner">
                   {formData.name.charAt(0).toUpperCase()}
                </div>
                <div>
                   <h2 className="text-2xl font-black text-green-900">{formData.name}</h2>
                   <span className="text-xs font-bold uppercase tracking-wider text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                       {user?.role} Account
                   </span>
                </div>
            </div>

            {error && <div className="mb-6 p-4 bg-red-50 text-red-700 font-bold rounded-xl border border-red-200">{error}</div>}
            {successMsg && <div className="mb-6 p-4 bg-green-50 text-green-700 font-bold rounded-xl border border-green-200">{successMsg}</div>}

            <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* General Info */}
                <section>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><span>👤</span> Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1">Full Name</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-gray-50" required />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1">Email <span className="text-gray-400 font-normal">(Cannot be changed)</span></label>
                            <input type="email" value={formData.email} disabled className="w-full p-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed" />
                        </div>
                    </div>
                </section>

                {/* Location Info */}
                <section>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><span>📍</span> Address Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div className="sm:col-span-2">
                            <label className="block text-sm font-bold text-gray-600 mb-1">Street Address</label>
                            <input type="text" name="location.address" value={formData.location.address} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-gray-50" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1">City / Village <span className="text-red-500">*</span></label>
                            <input type="text" name="location.city" value={formData.location.city} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-gray-50" required />
                            <p className="text-[10px] text-gray-400 mt-1">Used for calculating delivery distances</p>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1">District<span className="text-red-500">*</span></label>
                            <input type="text" name="location.district" value={formData.location.district} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-gray-50" required />
                        </div>
                         <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1">State<span className="text-red-500">*</span></label>
                            <input type="text" name="location.state" value={formData.location.state} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-gray-50" required />
                        </div>
                         <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1">Pincode<span className="text-red-500">*</span></label>
                            <input type="text" name="location.pincode" value={formData.location.pincode} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-gray-50" required />
                        </div>
                    </div>
                </section>

                {/* Farmer Exclusives */}
                {user?.role === 'farmer' && (
                    <section className="bg-green-50/50 p-6 rounded-2xl border border-green-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-yellow-400 text-green-900 text-xs font-black px-3 py-1 rounded-bl-xl">FARMER ONLY</div>
                        <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2"><span>🚜</span> Business & Farm Settings</h3>
                        
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-bold text-green-800 mb-1">Farm/Business Name</label>
                                <input type="text" name="farmDetails.farmName" value={formData.farmDetails.farmName} onChange={handleChange} className="w-full p-3 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-white" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-green-800 mb-1">Out-Of-City Delivery Fee (₹) <span className="text-green-600">*</span></label>
                                <input type="number" name="farmDetails.deliveryFee" value={formData.farmDetails.deliveryFee} onChange={handleChange} min="0" placeholder="e.g. 50" className="w-full p-3 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-white font-mono" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-green-800 mb-1">Max Delivery Radius (km)</label>
                                <input type="number" name="farmDetails.deliveryRadius" value={formData.farmDetails.deliveryRadius} onChange={handleChange} min="1" placeholder="e.g. 25" className="w-full p-3 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-white font-mono" />
                            </div>
                            
                            <div className="sm:col-span-2 mt-4 bg-white p-4 rounded-xl border border-green-100 flex items-center justify-between shadow-sm cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, farmDetails: { ...prev.farmDetails, allowPickup: !prev.farmDetails.allowPickup } }))}>
                                <div>
                                    <p className="font-bold text-green-900">Allow Farm Pickup?</p>
                                    <p className="text-xs text-gray-500">Buyers can save on delivery fees by coming to you.</p>
                                </div>
                                <div className={`w-12 h-6 rounded-full transition-colors relative ${formData.farmDetails.allowPickup ? 'bg-green-500' : 'bg-gray-300'}`}>
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${formData.farmDetails.allowPickup ? 'left-7' : 'left-1'}`}></div>
                                </div>
                            </div>
                         </div>
                    </section>
                )}

                <div className="pt-4 border-t border-gray-100">
                     <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-green-600 text-white font-black py-4 rounded-xl hover:bg-green-700 transition shadow-lg shadow-green-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                        {saving ? 'Saving Changes...' : 'Save Profile Changes'}
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-4">Changes take effect immediately across the marketplace.</p>
                </div>

            </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
