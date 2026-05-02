import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api';
import Navbar from '../components/Navbar';

const AdminDashboard = () => {
  // users variable removed
  const [activeTab, setActiveTab] = useState('users');
  
  // Users state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  
  // Orders state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Farmers state
  const [farmers, setFarmers] = useState([]);
  const [farmersLoading, setFarmersLoading] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  
  // Sales statistics state
  const [salesData, setSalesData] = useState(null);
  const [salesLoading, setSalesLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedFarmerForSales, setSelectedFarmerForSales] = useState("");

  // Load Users
  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const data = await adminAPI.getUsers();
      const nonAdminUsers = data.filter(user => user.role !== 'admin');
      setUsers(nonAdminUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
      alert('Failed to load users: ' + error.message);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // Load Orders
  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const data = await adminAPI.getAllOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
      alert('Failed to load orders: ' + error.message);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  // Load Farmers
  const loadFarmers = useCallback(async () => {
    setFarmersLoading(true);
    try {
      const data = await adminAPI.getAllFarmers();
      setFarmers(data);
    } catch (error) {
      console.error('Failed to load farmers:', error);
      alert('Failed to load farmers: ' + error.message);
    } finally {
      setFarmersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'orders') {
      loadOrders();
    } else if (activeTab === 'farmers') {
      loadFarmers();
    } else if (activeTab === 'sales' && farmers.length === 0) {
      loadFarmers();
    }
  }, [activeTab, loadUsers, loadOrders, loadFarmers, farmers.length]);

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user and all their associated products?')) {
      return;
    }

    try {
      const response = await adminAPI.deleteUser(userId);
      alert(`User deleted successfully!\n${response.deletedProductsCount} products were also removed.`);
      loadUsers();
    } catch (error) {
      alert('Failed to delete user: ' + error.message);
    }
  };

  const handleViewOrderDetails = async (orderId) => {
    try {
      const order = await adminAPI.getOrderDetails(orderId);
      setSelectedOrder(order);
    } catch (error) {
      alert('Failed to load order details: ' + error.message);
    }
  };

  const handleViewFarmerProfile = (farmer) => {
    setSelectedFarmer(farmer);
  };

  const loadSalesStatistics = useCallback(async (farmerId, month, year) => {
    if (!farmerId) return;
    
    setSalesLoading(true);
    try {
      const data = await adminAPI.getFarmerSales(farmerId, month, year);
      setSalesData(data);
    } catch (error) {
      console.error('Failed to load sales statistics:', error);
      alert('Failed to load sales statistics: ' + error.message);
    } finally {
      setSalesLoading(false);
    }
  }, []);

  // Automatically refresh Sales Data whenever Farmer, Month, or Year changes
  useEffect(() => {
    if (activeTab === 'sales' && selectedFarmerForSales) {
        loadSalesStatistics(selectedFarmerForSales, selectedMonth, selectedYear);
    }
  }, [activeTab, selectedFarmerForSales, selectedMonth, selectedYear, loadSalesStatistics]);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

// ...

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar title="FarmConnect 🌾 - Admin" />

      <div className="container mx-auto p-6">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b border-gray-200">
            {['users', 'orders', 'farmers', 'sales'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-semibold text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-green-600 text-green-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">User Management</h2>
            <p className="text-sm text-gray-600 mb-4">
              Note: Admin users are not shown in this list and cannot be deleted.
            </p>

            {usersLoading ? (
              <div className="text-center text-gray-500 py-10">Loading...</div>
            ) : users.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <p className="text-gray-500">No users available to manage.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-green-600 text-white">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {u.location?.city}, {u.location?.pincode}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">All Orders</h2>

            {ordersLoading ? (
              <div className="text-center text-gray-500 py-10">Loading...</div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <p className="text-gray-500">No orders found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order._id} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">
                          Order #{order._id.slice(-8).toUpperCase()}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                        {order.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Buyer</p>
                        <p className="font-semibold">{order.buyerId?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{order.buyerId?.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Farmer</p>
                        <p className="font-semibold">{order.farmerId?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{order.farmerId?.email}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Items ({order.items.length})</p>
                      <div className="space-y-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="text-sm">
                            {item.productName} - {item.quantity} {item.unit} @ ₹{item.price}/{item.unit} = ₹{item.subtotal}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className="text-xl font-bold text-green-700">₹{order.totalAmount.toFixed(2)}</p>
                      </div>
                      <button
                        onClick={() => handleViewOrderDetails(order._id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold transition"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Order Details Modal */}
            {selectedOrder && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-xl font-bold">Order Details</h3>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                      ×
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Order ID</p>
                      <p className="font-semibold">{selectedOrder._id}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Buyer</p>
                        <p className="font-semibold">{selectedOrder.buyerId?.name}</p>
                        <p className="text-xs text-gray-500">{selectedOrder.buyerId?.email}</p>
                        <p className="text-xs text-gray-500">
                          {selectedOrder.buyerId?.location?.city}, {selectedOrder.buyerId?.location?.pincode}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Farmer</p>
                        <p className="font-semibold">{selectedOrder.farmerId?.name}</p>
                        <p className="text-xs text-gray-500">{selectedOrder.farmerId?.email}</p>
                        <p className="text-xs text-gray-500">
                          {selectedOrder.farmerId?.location?.city}, {selectedOrder.farmerId?.location?.pincode}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Items</p>
                      <div className="bg-gray-50 rounded p-4 space-y-2">
                        {selectedOrder.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between">
                            <div>
                              <p className="font-semibold">{item.productName}</p>
                              <p className="text-sm text-gray-600">
                                {item.quantity} {item.unit} × ₹{item.price} = ₹{item.subtotal}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t">
                      <div>
                        <p className="text-sm text-gray-600">Delivery Fee</p>
                        <p className="font-semibold">₹{selectedOrder.deliveryFee || 0}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className="text-2xl font-bold text-green-700">₹{selectedOrder.totalAmount.toFixed(2)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Order Date</p>
                      <p className="font-semibold">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Farmers Tab */}
        {activeTab === 'farmers' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">All Farmers</h2>

            {farmersLoading ? (
              <div className="text-center text-gray-500 py-10">Loading...</div>
            ) : farmers.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <p className="text-gray-500">No farmers found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {farmers.map((farmer) => (
                  <div key={farmer._id} className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{farmer.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{farmer.email}</p>
                    
                    {farmer.farmDetails && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-gray-700">Farm: {farmer.farmDetails.farmName || 'N/A'}</p>
                        <p className="text-xs text-gray-600">
                          Delivery Fee: ₹{farmer.farmDetails.deliveryFee || 0} | 
                          Radius: {farmer.farmDetails.deliveryRadius || 0} km
                        </p>
                      </div>
                    )}
                    
                    <p className="text-sm text-gray-600 mb-4">
                      📍 {farmer.location?.city}, {farmer.location?.pincode}
                    </p>
                    
                    <button
                      onClick={() => handleViewFarmerProfile(farmer)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-bold transition"
                    >
                      View Profile
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Farmer Profile Modal */}
            {selectedFarmer && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-xl font-bold">Farmer Profile</h3>
                    <button
                      onClick={() => setSelectedFarmer(null)}
                      className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                      ×
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-semibold text-lg">{selectedFarmer.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold">{selectedFarmer.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-semibold">
                        {selectedFarmer.location?.city}, {selectedFarmer.location?.pincode}
                      </p>
                    </div>
                    {selectedFarmer.farmDetails && (
                      <div className="bg-gray-50 rounded p-4">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Farm Details</p>
                        <p className="text-sm">Farm Name: {selectedFarmer.farmDetails.farmName || 'N/A'}</p>
                        <p className="text-sm">Delivery Fee: ₹{selectedFarmer.farmDetails.deliveryFee || 0}</p>
                        <p className="text-sm">Delivery Radius: {selectedFarmer.farmDetails.deliveryRadius || 0} km</p>
                        <p className="text-sm">Allow Pickup: {selectedFarmer.farmDetails.allowPickup ? 'Yes' : 'No'}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Member Since</p>
                      <p className="font-semibold">
                        {new Date(selectedFarmer.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab('sales');
                        setSelectedFarmerForSales(selectedFarmer._id);
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-bold transition"
                    >
                      View Sales Statistics
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sales Statistics Tab */}
        {activeTab === 'sales' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Sales Statistics</h2>

            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full p-2 border rounded-lg"
                  >
                    {months.map((month, idx) => (
                      <option key={idx} value={idx + 1}>{month}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                  <input
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full p-2 border rounded-lg"
                    min="2020"
                    max={new Date().getFullYear() + 1}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Farmer</label>
                <select
                  value={selectedFarmerForSales}
                  onChange={(e) => {
                    setSelectedFarmerForSales(e.target.value);
                    if (!e.target.value) {
                      setSalesData(null);
                    }
                  }}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">Select a farmer...</option>
                  {farmers.map((farmer) => (
                    <option key={farmer._id} value={farmer._id}>
                      {farmer.name} - {farmer.farmDetails?.farmName || 'No Farm Name'}
                    </option>
                  ))}
                </select>
              </div>

              {farmers.length === 0 && (
                <button
                  onClick={loadFarmers}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Load farmers first
                </button>
              )}
            </div>

            {salesLoading ? (
              <div className="text-center text-gray-500 py-10">Loading sales data...</div>
            ) : salesData ? (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4">
                  Sales for {salesData.farmer?.name} - {months[salesData.period.month - 1]} {salesData.period.year}
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Total Sales</p>
                    <p className="text-2xl font-bold text-green-700">₹{salesData.statistics.totalSales.toFixed(2)}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-blue-700">{salesData.statistics.totalOrders}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Total Items</p>
                    <p className="text-2xl font-bold text-purple-700">{salesData.statistics.totalItems}</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Avg Order Value</p>
                    <p className="text-2xl font-bold text-yellow-700">₹{salesData.statistics.averageOrderValue.toFixed(2)}</p>
                  </div>
                </div>

                {salesData.orders.length > 0 && (
                  <div>
                    <h4 className="font-bold mb-2">Orders in this period:</h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {salesData.orders.map((order) => (
                        <div key={order._id} className="bg-gray-50 rounded p-3 text-sm border border-gray-100">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-gray-800">Order #{order._id.slice(-8)}</span>
                            <span className="font-bold text-green-700">₹{order.totalAmount.toFixed(2)}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 mb-2">
                            Placed: {new Date(order.createdAt).toLocaleString()} | Status: <span className="uppercase">{order.status}</span>
                          </p>
                          <div className="bg-white rounded border border-gray-100 p-2 space-y-1">
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Items Included:</p>
                             {order.items?.map((item, idx) => (
                                 <div key={idx} className="flex justify-between items-center text-xs text-gray-700">
                                      <span className="truncate pr-2 flex-1">• {item.productName} <span className="text-gray-400">({item.quantity} {item.unit})</span></span>
                                      <span className="font-medium">₹{item.subtotal}</span>
                                 </div>
                             ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <p className="text-gray-500">Select a farmer and month to view sales statistics.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
