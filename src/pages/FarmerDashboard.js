import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { productAPI, marketPriceAPI } from '../services/api';
import { getIncomingOrders } from '../services/orderApi';
import Navbar from '../components/Navbar';
import { getIcon } from '../utils/helpers';
import ProductSuccessModal from '../components/ProductSuccessModal';
import DuplicateProductModal from '../components/DuplicateProductModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import OrderManager from '../components/OrderManager';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import { io } from 'socket.io-client';

const FarmerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('list');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [marketInfo, setMarketInfo] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateProduct, setDuplicateProduct] = useState(null);
  const [editingValues, setEditingValues] = useState({}); // Track local edits
  const [imageFile, setImageFile] = useState(null); // File upload state
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    quantity: '',
    unit: 'kg',
    category: 'Vegetables',
    isImperfect: false,
  });

  // New state for Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  
  // Analytics Modal State
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  
  // Notification State
  const [showOrderNotification, setShowOrderNotification] = useState(false);

  // Real-Time Socket.io Order Notifications
  useEffect(() => {
      if (!user?.id) return;

      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
      const socket = io(API_BASE_URL);

      socket.on('connect', () => {
          socket.emit('join_farmer_room', user.id);
          console.log("WebSocket connected. Listening for orders...");
      });

      socket.on('new_order', (data) => {
          console.log("LIVE ALERT:", data);
          setShowOrderNotification(true);
          
          // Play a native browser Notification if permitted
          if ("Notification" in window && Notification.permission === "granted") {
              new Notification(data.message, { body: `Amount: ₹${data.totalAmount}` });
          }

          // Auto hide toast after 8 seconds
          setTimeout(() => setShowOrderNotification(false), 8000);
      });

      return () => {
          socket.disconnect();
      };
  }, [user]);

  const loadProducts = useCallback(async () => {
    try {
      const data = await productAPI.getByFarmer(user.id);
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  }, [user.id]);

  useEffect(() => {
    // Only load products if we are on the list tab
    if (activeTab === 'list') {
      loadProducts();
    }
  }, [activeTab, loadProducts]);

  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }));
  };

  const fetchMarketRate = async (itemName) => {
    if (itemName.length < 3) {
      setMarketInfo(null);
      return;
    }

    try {
      const data = await marketPriceAPI.getPrice(itemName);
      setMarketInfo(data);
    } catch (error) {
      console.error("Market Price Error:", error);
      setMarketInfo(null);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.name.length > 2) {
        fetchMarketRate(formData.name);
      } else {
        setMarketInfo(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.name]);

  const handleProductNameChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, name: value }));
  };

  const updatePriceComparison = () => {
    if (!marketInfo || !formData.price) return;
    
    const marketRate = marketInfo.price;
    const farmerPrice = parseFloat(formData.price);
    
    // The buyer pays exactly the farmerPrice on the app. (Any platform fees are deducted from payout later).
    const diff = marketRate - farmerPrice;

    return {
      diff,
      consumerPrice: farmerPrice,
      marketRate,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Check if product with same name already exists
    const existingProduct = products.find(
      (p) => p.name.toLowerCase() === formData.name.toLowerCase()
    );

    if (existingProduct) {
      setDuplicateProduct(existingProduct);
      setShowDuplicateModal(true);
      setLoading(false);
      return;
    }

    let submitData;
    
    // If the farmer attached an image, we MUST use FormData to send binary files safely to the backend
    if (imageFile) {
        submitData = new FormData();
        submitData.append('farmerId', user.id);
        submitData.append('name', formData.name);
        submitData.append('price', formData.price);
        submitData.append('quantity', formData.quantity);
        submitData.append('unit', formData.unit);
        submitData.append('category', formData.category);
        submitData.append('isImperfect', formData.isImperfect);
        submitData.append('image', imageFile); // Attach actual file!
    } else {
        submitData = {
          farmerId: user.id,
          name: formData.name,
          price: formData.price,
          quantity: formData.quantity,
          unit: formData.unit,
          category: formData.category,
          isImperfect: formData.isImperfect,
        };
    }

    try {
      // Create new product
      await productAPI.create(submitData);
      setShowProductModal(true);
      setFormData({
        name: '',
        price: '',
        quantity: '',
        unit: 'kg',
        category: 'Vegetables',
        isImperfect: false,
      });
      setImageFile(null); // Clear image after success
      setMarketInfo(null);
      loadProducts();
    } catch (error) {
      alert('Error saving product: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditDuplicate = () => {
    if (duplicateProduct) {
      setFormData({
        name: duplicateProduct.name,
        price: duplicateProduct.price.toString(),
        quantity: duplicateProduct.quantity.toString(),
        unit: duplicateProduct.unit,
        category: duplicateProduct.category,
        isImperfect: duplicateProduct.isImperfect,
      });
      setShowDuplicateModal(false);
      setActiveTab('list');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAddAnother = () => {
    setShowProductModal(false);
    setActiveTab('add');
  };

  const handleViewProducts = () => {
    setShowProductModal(false);
    setActiveTab('list');
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditChange = (productId, field, value) => {
    setEditingValues((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));
  };

  const handleSaveChanges = async (productId, originalProduct) => {
    const edits = editingValues[productId];
    if (!edits) return;

    try {
      const updateData = {};
      if (edits.price !== undefined && edits.price !== originalProduct.price) {
        updateData.price = parseFloat(edits.price);
      }
      if (edits.quantity !== undefined && edits.quantity !== originalProduct.quantity) {
        updateData.quantity = parseInt(edits.quantity);
      }

      if (Object.keys(updateData).length > 0) {
        await productAPI.update(productId, updateData);
        setEditingValues((prev) => {
          const newEdits = { ...prev };
          delete newEdits[productId];
          return newEdits;
        });
        loadProducts();
        alert('Product updated successfully!');
      }
    } catch (error) {
      alert('Error updating product: ' + error.message);
    }
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    
    try {
      await productAPI.delete(productToDelete._id);
      loadProducts();
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (error) {
      alert('Error deleting product: ' + error.message);
    }
  };

  const comparison = updatePriceComparison();

  return (
    <div className="bg-gray-50 min-h-screen">
      <DeleteConfirmationModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        productName={productToDelete?.name}
      />

      <ProductSuccessModal 
        show={showProductModal} 
        onClose={() => setShowProductModal(false)}
        onViewProducts={handleViewProducts}
        onAddAnother={handleAddAnother}
      />

      <DuplicateProductModal 
        show={showDuplicateModal}
        product={duplicateProduct}
        onEdit={handleEditDuplicate}
        onCancel={() => {
          setShowDuplicateModal(false);
          setFormData({
            name: '',
            price: '',
            quantity: '',
            unit: 'kg',
            category: 'Vegetables',
            isImperfect: false,
          });
        }}
      />
      
      {/* New Order Notification Toast */}
      {showOrderNotification && (
          <div className="fixed top-24 right-4 z-[110] bg-white border-l-4 border-green-600 shadow-2xl rounded-lg p-4 animate-bounce-in flex items-center gap-4 max-w-sm">
              <div className="bg-green-100 p-2 rounded-full text-2xl">🔔</div>
              <div>
                  <h4 className="font-bold text-gray-800">New Order Received!</h4>
                  <p className="text-sm text-gray-600">Check your Orders tab now.</p>
              </div>
              <button 
                onClick={() => {
                    setShowOrderNotification(false);
                    setActiveTab('orders');
                }}
                className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-md hover:bg-green-700 transition"
              >
                View
              </button>
          </div>
      )}
      
      {/* Analytics Modal */}
      {/* Analytics Modal */}
      {showAnalyticsModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-modal-slow">
            <button 
              onClick={() => setShowAnalyticsModal(false)}
              className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 text-gray-800 p-2 rounded-full transition-colors"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">
              Your Business Analytics 📈
            </h2>
            <AnalyticsDashboard />
            <div className="mt-6 flex justify-end px-4">
                 <button 
                    onClick={() => setShowAnalyticsModal(false)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-xl transition-colors"
                >
                    Close Dashboard
                </button>
            </div>
          </div>
          <style>{`
            @keyframes modal-pop-slow {
              0% {
                opacity: 0;
                transform: scale(0.9) translateY(20px);
              }
              100% {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
            }
            .animate-modal-slow {
              animation: modal-pop-slow 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}</style>
        </div>
      )}
      
      <Navbar />

      <div className="container mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-lg sticky top-6">
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => setActiveTab('list')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition ${
                  activeTab === 'list'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                List Product
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition ${
                  activeTab === 'orders'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                View Orders
              </button>
              <button
                onClick={() => setShowAnalyticsModal(true)}
                className="flex-1 py-2 px-3 rounded-lg text-sm font-bold transition bg-purple-600 text-white hover:bg-purple-700 shadow-md"
              >
                Analytics 📊
              </button>
            </div>

            {activeTab === 'list' && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                  Add New Product
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Product Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={handleProductNameChange}
                      placeholder="e.g. Fresh Potatoes"
                      className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Price (₹)
                      </label>
                      <input
                        type="number"
                        id="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="20"
                        className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Qty/Stock
                      </label>
                      <input
                        type="number"
                        id="quantity"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        placeholder="50"
                        className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Unit
                      </label>
                      <select
                        id="unit"
                        value={formData.unit}
                        onChange={handleInputChange}
                        className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
                      >
                        <option value="kg">kg</option>
                        <option value="dozen">dozen</option>
                        <option value="piece">pieces</option>
                      </select>
                    </div>
                  </div>

                  {marketInfo && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-blue-800 font-bold">
                          📢 Market Rate ({marketInfo.matchedName}):
                        </span>
                        <span className="text-blue-600 font-bold">
                          ₹{marketInfo.price}/kg
                        </span>
                      </div>
                      {comparison && (
                        <div
                          className={`text-xs ${
                            comparison.diff > 0
                              ? 'text-green-700 font-bold'
                              : 'text-red-600 font-bold'
                          }`}
                        >
                          {comparison.diff > 0 ? (
                            <>
                              ✅ Great price! Consumer saves{' '}
                              <b>₹{comparison.diff.toFixed(1)}</b> vs Market.
                            </>
                          ) : (
                            <>
                              ⚠️ High price. You are{' '}
                              <b>₹{Math.abs(comparison.diff).toFixed(1)}</b>{' '}
                              above Market rate.
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
                    >
                      <option value="Vegetables">Vegetables 🥕</option>
                      <option value="Fruits">Fruits 🍎</option>
                      <option value="Millets">Millets 🌾</option>
                      <option value="Dry Fruits">Dry Fruits 🌰</option>
                      <option value="Spices">Spices 🌶️</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Photo <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-green-300 border-dashed rounded-xl bg-green-50/20 hover:bg-green-50/50 transition-colors relative">
                      {imageFile ? (
                        <div className="flex flex-col items-center">
                          <img 
                            src={URL.createObjectURL(imageFile)} 
                            alt="Preview" 
                            className="h-32 w-auto object-cover rounded-lg shadow-md mb-3 border border-gray-200"
                          />
                          <button 
                            type="button" 
                            onClick={(e) => {
                                e.preventDefault();
                                setImageFile(null);
                            }} 
                            className="text-red-500 bg-red-50 px-3 py-1 rounded-full text-xs font-bold hover:bg-red-100 transition-colors"
                          >
                            × Remove Photo
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1 text-center">
                          <div className="text-4xl mb-2">📸</div>
                          <div className="flex text-sm text-gray-600 justify-center">
                            <label className="relative cursor-pointer rounded-md font-extrabold text-green-600 hover:text-green-500 focus-within:outline-none">
                              <span>Select a photo from device</span>
                              <input type="file" className="sr-only" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
                            </label>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">Provides best buyer engagement. PNG/JPG up to 10MB.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        id="isImperfect"
                        checked={formData.isImperfect}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-green-600 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Is this "Imperfect/Wonky"?
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-6">
                      Sell ugly but fresh veg at a discount to reduce waste.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-600/30 disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Uploading & Saving... 🚀
                        </>
                      ) : (
                        'List Product in Marketplace'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'orders' && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                  Incoming Orders
                </h2>
                <OrderManager />
              </div>
            )}


          </div>
        </div>

        <div className="md:col-span-2">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Your Active Listings
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.length === 0 ? (
              <div className="col-span-2 text-center text-gray-400 py-10">
                No products listed yet.
              </div>
            ) : (
              products.map((product) => (
                <div
                  key={product._id}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                        {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded-xl shadow-sm border-2 border-green-50" />
                        ) : (
                            <div className="text-3xl bg-gray-50 w-16 h-16 flex items-center justify-center rounded-xl border border-gray-100 shadow-sm">
                              {getIcon(product.category)}
                            </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                              {product.category}
                            </span>
                            {product.isImperfect && (
                              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-bold">
                                ♻️ Wonky Veg
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-lg text-gray-800 leading-tight">
                            {product.name}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-green-700 font-bold text-xl">
                              ₹{product.price}/{product.unit}
                            </p>
                            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 font-medium tracking-tight">
                              📦 Stock: {product.quantity}
                            </span>
                          </div>
                        </div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-semibold text-gray-700 w-16">Price:</label>
                      <input
                        type="number"
                        value={editingValues[product._id]?.price ?? product.price}
                        onChange={(e) => handleEditChange(product._id, 'price', e.target.value)}
                        className="flex-1 px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-500">/{product.unit}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-semibold text-gray-700 w-16">Stock:</label>
                      <input
                        type="number"
                        value={editingValues[product._id]?.quantity ?? product.quantity}
                        onChange={(e) => handleEditChange(product._id, 'quantity', e.target.value)}
                        className="flex-1 px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-500">{product.unit}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveChanges(product._id, product)}
                        className="flex-1 bg-green-600 text-white font-semibold px-3 py-2 text-sm rounded-lg hover:bg-green-700 transition-colors shadow-md"
                      >
                        ✓ Update
                      </button>
                      <button
                        onClick={() => handleDeleteClick(product)}
                        className="bg-red-50 text-red-600 border border-red-200 font-semibold px-3 py-2 text-sm rounded-lg hover:bg-red-100 transition-colors"
                        title="Delete Product"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerDashboard;
