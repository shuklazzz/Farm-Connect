import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productAPI } from '../services/api';
import { createOrder } from '../services/orderApi';
import Navbar from '../components/Navbar';
import CategoryFilter from '../components/CategoryFilter';
import ProductCard from '../components/ProductCard';
import CartDrawer from '../components/CartDrawer';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../components/CheckoutForm';
import { orderAPI } from '../services/api';
import FarmerMap from '../components/FarmerMap';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_fake_key_for_now');

const BuyerDashboard = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userCity, setUserCity] = useState(null); // Store city from API response
  
  // -- Marketplace State --
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showImperfect, setShowImperfect] = useState(false); // New Toggle State
  // -- Cart State Management --
  // Helper to determine the storage key based on the current user
  const getCartKey = (u) => (u && u._id ? `cart_${u._id}` : null);

  const [cartItems, setCartItems] = useState([]); 

  // Load cart when User changes
  useEffect(() => {
    if (!user) {
      setCartItems([]); // Clear cart if no user
      return;
    }

    const key = getCartKey(user);
    if (!key) return;

    try {
        const savedCart = localStorage.getItem(key);
        if (savedCart) {
            setCartItems(JSON.parse(savedCart));
        } else {
            setCartItems([]);
        }
    } catch (error) {
        console.error("Failed to load cart", error);
        setCartItems([]);
    }
  }, [user]);

  // Persist Cart to LocalStorage whenever it changes
  useEffect(() => {
    if (!user) return; // Don't persist for guests

    const key = getCartKey(user);
    if (key) {
      localStorage.setItem(key, JSON.stringify(cartItems));
    }
  }, [cartItems, user]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false); // New Login Prompt State

  // Defined via useCallback to be stable for useEffect dependency
  const loadProducts = React.useCallback(async () => {
    try {
      const response = await productAPI.getAll();
      // Handle the new object structure { products, isGuest, userCity }
      // Or fallback if it's just an array (backward compatibility)
      const data = response.products || response;
      const isGuest = response.isGuest || !user; 
      
      if (response.userCity) {
          setUserCity(response.userCity);
      }

      const finalProducts = Array.isArray(data) ? data : [];
      
      console.log("Products Loaded:", finalProducts.length, "Is Guest:", isGuest);
      setProducts(finalProducts);

    } catch (error) {
      console.error('Failed to load products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProducts();
    const interval = setInterval(loadProducts, 30000); // Auto-refresh
    return () => clearInterval(interval);
  }, [loadProducts]);

  const navigate = useNavigate();

  // -- Cart Logic --
  const addToCart = useCallback((product) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.product._id === product._id);
      if (existing) {
        // Increment quantity
        return prev.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      // Add new item
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true); // Open cart when first adding
  }, [user]);

  const removeFromCart = useCallback((product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product._id === product._id);
      if (existing.quantity === 1) {
        return prev.filter((item) => item.product._id !== product._id);
      }
      return prev.map((item) =>
        item.product._id === product._id
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
    });
  }, []);



  const totalDeliveryFee = useMemo(() => {
    if (!user || cartItems.length === 0) return 0;
    
    // Group by farmer
    const ordersByFarmer = {};
    cartItems.forEach(item => {
        const farmerId = item.product.farmerId?._id || item.product.farmerId;
        if (!farmerId) return;
        if (!ordersByFarmer[farmerId]) ordersByFarmer[farmerId] = [];
        ordersByFarmer[farmerId].push(item);
    });

    let total = 0;
    Object.keys(ordersByFarmer).forEach(farmerId => {
        const items = ordersByFarmer[farmerId];
        const itemsTotal = items.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
        const farmerData = items[0].product?.farmerId;
        
        let fee = 0;
        if (typeof farmerData === 'object') {
            const farmerCity = farmerData?.location?.city?.toLowerCase()?.trim() || '';
            const buyerCity = user.location?.city?.toLowerCase()?.trim() || '';

            if (farmerCity && buyerCity && farmerCity === buyerCity) {
                fee = 40;
            } else if (farmerCity && buyerCity && farmerCity !== buyerCity) {
                const customFee = farmerData.farmDetails?.deliveryFee ? Number(farmerData.farmDetails.deliveryFee) : 0;
                fee = 150 + customFee;
            } else if (farmerData.farmDetails?.deliveryFee) {
                fee = Number(farmerData.farmDetails.deliveryFee);
            }
        }

        if (itemsTotal >= 500) {
            fee = 0;
        }
        total += fee;
    });

    return total;
  }, [cartItems, user]);

  const handleCheckout = async () => {
    if (!user) {
        alert("Please Login or Signup to place your order! 🌱");
        navigate('/login');
        return;
    }

    const realItems = cartItems;
    if (realItems.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    try {
        setLoading(true);
        
        const itemsTotal = realItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        const absoluteTotal = itemsTotal + totalDeliveryFee;

        // 1. Get client secret from Stripe
        const session = await orderAPI.createCheckoutSession(absoluteTotal);
        setClientSecret(session.clientSecret);
        setShowCheckout(true);
        setIsCartOpen(false);
    } catch (error) {
        alert(`⚠️ Failed to trigger checkout: ${error}`);
    } finally {
        setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntent) => {
      try {
        setLoading(true);
        const realItems = cartItems;
        
        // Group items by farmer
        const ordersByFarmer = {};
        realItems.forEach(item => {
            const farmerId = item.product.farmerId?._id || item.product.farmerId;
            if (!farmerId) return;

            if (!ordersByFarmer[farmerId]) {
                ordersByFarmer[farmerId] = [];
            }
            
            ordersByFarmer[farmerId].push({
                productId: item.product._id,
                productName: item.product.name,
                quantity: item.quantity,
                unit: item.product.unit,
                price: item.product.price,
                subtotal: item.product.price * item.quantity
            });
        });

        // Create database orders
        const promises = Object.keys(ordersByFarmer).map(farmerId => {
            const items = ordersByFarmer[farmerId];
            const itemsTotal = items.reduce((sum, i) => sum + i.subtotal, 0);
            const farmerData = items[0].product?.farmerId;
            
            let deliveryFee = 0;
            if (typeof farmerData === 'object') {
                const farmerCity = farmerData?.location?.city?.toLowerCase()?.trim() || '';
                const buyerCity = user.location?.city?.toLowerCase()?.trim() || '';

                if (farmerCity && buyerCity && farmerCity === buyerCity) {
                    deliveryFee = 40;
                } else if (farmerCity && buyerCity && farmerCity !== buyerCity) {
                    const customFee = farmerData.farmDetails?.deliveryFee ? Number(farmerData.farmDetails.deliveryFee) : 0;
                    deliveryFee = 150 + customFee;
                } else if (farmerData.farmDetails?.deliveryFee) {
                    deliveryFee = Number(farmerData.farmDetails.deliveryFee);
                }
            }

            if (itemsTotal >= 500) {
                deliveryFee = 0;
            }

            const totalAmount = itemsTotal + deliveryFee;
            
            return createOrder({
                farmerId,
                items,
                totalAmount,
                deliveryFee,
                deliveryAddress: user.location,
                stripePaymentIntentId: paymentIntent.id
            });
        });

        await Promise.all(promises);

        setCartItems([]);
        setShowCheckout(false);
        navigate('/orders'); 
    } catch (error) {
        console.error("Fulfillment error:", error);
        alert(`⚠️ Order fulfillment failed after payment. Support has been notified.`);
    } finally {
        setLoading(false);
    }
  };

  // -- Filtering Logic --
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        activeCategory === 'all' || product.category === activeCategory;
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      
      // Imperfect Filter
      const matchesImperfect = showImperfect ? product.isImperfect === true : true;
      
      const isMatch = matchesCategory && matchesSearch && matchesImperfect;
      if (!isMatch) console.log(`Filtered out: ${product.name} (Cat: ${matchesCategory}, Search: ${matchesSearch}, Imp: ${matchesImperfect})`);
      return isMatch;
    });
  }, [products, activeCategory, searchTerm, showImperfect]);

  // -- Helpers --
  const getCartItem = (productId) => {
    return cartItems.find((item) => item.product._id === productId);
  };

  const cartTotalItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotalPrice = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const navActions = (
    <div className="flex items-center gap-2 mr-2">
      {user && (
        <button 
          onClick={() => setIsCartOpen(true)}
          className="relative bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition border border-white/10 group"
          title="Open Cart"
        >
          <span className="text-xl">🛒</span>
          {cartItems.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-yellow-400 text-green-900 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-green-700 shadow-sm transform group-hover:scale-110 transition">
              {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </button>
      )}
    </div>
  );

  return (
    <div className="bg-[#f3fbf6] min-h-screen pb-24 font-sans text-gray-900">
      <Navbar title="FarmConnect Market 🌿" actions={navActions} />

      {/* Cart Drawer */}
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onAdd={(p) => addToCart(p)}
        onRemove={(p) => removeFromCart(p)}
        onCheckout={handleCheckout}
        deliveryFee={totalDeliveryFee}
      />
      
      {/* Success Modal (Mock) */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl transform transition-all scale-100 border-4 border-green-50">
           {/* ... existing success modal content ... */}
    <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <span className="text-6xl animate-bounce">🥬</span>
                </div>
                <h3 className="text-2xl font-black text-green-900 mb-2">Order Confirmed!</h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                    Your organic produce is being harvested from the farm for <b>{user?.location?.city || 'Delivery'}</b>.
                </p>
                <button 
                    onClick={() => setShowSuccessModal(false)}
                    className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl hover:bg-green-700 shadow-lg shadow-green-200 transition-transform active:scale-95"
                >
                    Continue Shopping
                </button>
            </div>
        </div>
      )}

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl transform transition-all scale-100 border-4 border-green-50 animate-bounce-in relative">
                <button 
                  onClick={() => setShowLoginPrompt(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-100 rounded-full"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <span className="text-4xl animate-pulse">🔐</span>
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Login Required</h3>
                <p className="text-gray-600 mb-8 leading-relaxed text-sm">
                    Please login to add fresh items to your cart and place orders. It's free and takes moments!
                </p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowLoginPrompt(false)}
                        className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition active:scale-95 border border-gray-200"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => navigate('/login')}
                        className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 transition-transform active:scale-95 flex items-center justify-center gap-2"
                    >
                        Login <span>→</span>
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Stripe Checkout Modal */}
      {showCheckout && clientSecret && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="w-full max-w-md animate-fade-in">
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm 
                        clientSecret={clientSecret} 
                        onPaymentSuccess={handlePaymentSuccess} 
                        onCancel={() => setShowCheckout(false)} 
                    />
                </Elements>
            </div>
        </div>
      )}

      {/* Hero Banner Area */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-800 text-white pt-8 pb-16 px-4 rounded-b-[2.5rem] shadow-lg mb-[-40px] relative overflow-hidden">
          {/* ... (keep decorations) */}
          
          <div className="container mx-auto max-w-5xl relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                      <h1 className="text-3xl font-black tracking-tight mb-2">
                        Farm to Table 🚜
                      </h1>
                      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full inline-flex border border-white/10">
                        <span className="text-xl">📍</span>
                        <span className="font-bold text-sm">Delivering fresh to <span className="text-yellow-300 underline underline-offset-4 decoration-2">{user?.location?.city || 'India (Select Location)'}</span></span>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* Geolocation Map */}
      <div className="max-w-7xl mx-auto px-4 mt-8 relative z-0">
           <FarmerMap buyerLocation={user?.location} />
      </div>

      {/* Sticky Filter Bar */}
      <div className="sticky top-4 z-30 px-4 mt-2">
        <div className="container mx-auto max-w-5xl bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-green-100 p-4">
            {/* Search Bar */}
            <div className="relative mb-4">
                <input
                    type="text"
                    placeholder="Search for 'Spinach', 'Mango'..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-green-50/50 border border-green-100 rounded-xl py-3.5 pl-12 pr-4 text-gray-700 font-medium placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:bg-white focus:border-green-500 outline-none transition-all shadow-inner"
                />
                <span className="absolute left-4 top-3.5 text-green-500 text-lg">🔍</span>
            </div>

            {/* Imperfect Produce Toggle */}
            <div className="flex items-center justify-between bg-yellow-50 p-3 rounded-xl border border-yellow-200 mb-4 transition-all hover:shadow-md">
                <div className="flex items-center gap-3">
                    <div className="bg-yellow-100 p-2 rounded-lg text-2xl">🥕</div>
                    <div>
                        <p className="font-bold text-gray-800 text-sm">Shop "Imperfect" Produce</p>
                        <p className="text-xs text-gray-500">Save up to 50% & fight food waste!</p>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={showImperfect}
                        onChange={() => setShowImperfect(!showImperfect)}
                        className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                </label>
            </div>
            
            {/* Categories */}
            <CategoryFilter 
                activeCategory={activeCategory} 
                onSelect={setActiveCategory} 
            />
        </div>
      </div>

      {/* Product Grid */}
      <div className="container mx-auto max-w-5xl p-4 pt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600 mb-6"></div>
            <p className="text-green-800 font-bold animate-pulse">Harvesting fresh data...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-dashed border-green-200 mx-4">
            <span className="text-6xl block mb-6 filter grayscale opacity-50">🥬</span>
            <h3 className="text-xl font-bold text-gray-600 mb-2">
                {userCity ? `No fresh produce found in ${userCity}` : `No fresh produce found`}
            </h3>
            <p className="text-gray-400 max-w-xs mx-auto">We couldn't find matches for your search. Try "Potato" or "Onion".</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                cartItem={getCartItem(product._id)}
                onAdd={addToCart}
                onRemove={removeFromCart}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mobile Floating Cart Button */}
      {user && !isCartOpen && cartItems.length > 0 && (
        <div className="fixed bottom-6 left-4 right-4 z-40 sm:hidden">
            <button 
                onClick={() => setIsCartOpen(true)}
                className="w-full bg-green-700 text-white font-bold py-4 rounded-2xl shadow-2xl flex justify-between px-6 items-center animate-bounce-in shadow-green-900/20 border border-green-500/30"
            >
                <div className="flex flex-col items-start text-left">
                    <span className="text-[10px] font-black tracking-widest uppercase text-green-200">{cartTotalItemCount} ITEMS</span>
                    <span className="text-xl font-bold">₹{cartTotalPrice}</span>
                </div>
                <div className="flex items-center gap-2 bg-green-800/50 px-3 py-1.5 rounded-lg border border-green-600/30">
                    <span className="text-sm font-bold">View Cart</span>
                    <span className="text-lg">🛒</span>
                </div>
            </button>
        </div>
      )}
    </div>
  );
};

export default BuyerDashboard;

