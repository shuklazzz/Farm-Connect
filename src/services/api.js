const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Helper function for API calls
const apiCall = async (endpoint, options = {}, isRetry = false) => {
  try {
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;
    const token = user?.token;

    const headers = { ...options.headers };

    // Let the browser automatically set the correct Content-Type (with multipart boundaries) if we are sending a file
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // --- SEAMLESS JWT ROTATION INTERCEPTOR ---
    if (response.status === 401 && !isRetry && user?.refreshToken && endpoint !== '/api/login' && endpoint !== '/api/refresh') {
        if (isRefreshing) {
            // Wait until the current refresh is done, then retry
            return new Promise(function(resolve, reject) {
                failedQueue.push({ resolve, reject });
            }).then(newToken => {
                options.headers = { ...options.headers, 'Authorization': `Bearer ${newToken}` };
                return apiCall(endpoint, options, true);
            }).catch(err => {
                return Promise.reject(err);
            });
        }
        
        isRefreshing = true;

        try {
            // Exchange old refresh token for new clean dual tokens
            const refreshRes = await fetch(`${API_BASE_URL}/api/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: user.refreshToken })
            });

            if (!refreshRes.ok) throw new Error("Refresh failed");
            
            const refreshData = await refreshRes.json();
            
            // Save new tokens to localStorage without destroying user UX state
            const newUser = { ...user, token: refreshData.token, refreshToken: refreshData.refreshToken };
            localStorage.setItem('user', JSON.stringify(newUser));
            
            isRefreshing = false;
            processQueue(null, refreshData.token);
            
            // Replay the exact original request that failed
            options.headers = { ...options.headers, 'Authorization': `Bearer ${refreshData.token}` };
            return await apiCall(endpoint, options, true);
            
        } catch (refreshErr) {
            isRefreshing = false;
            processQueue(refreshErr, null);
            
            // Critical fail: Session irreparably dead
            localStorage.removeItem('user');
            window.location.href = '/login'; 
            throw new Error("Session expired securely. Please log in again.");
        }
    }
    // ------------------------------------------

    // Check if response has content before parsing JSON
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          throw new Error('Invalid JSON response from server');
        }
      } else {
        data = {};
      }
    } else {
      const text = await response.text();
      throw new Error(text || `Server returned ${response.status}: ${response.statusText}`);
    }

    if (!response.ok) {
      // Handle AppError format: { status: 'fail'|'error', message: '...' }
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  } catch (error) {
    if (error instanceof Error && error.message) {
      throw error;
    }
    throw new Error('Network error: Could not connect to server');
  }
};

// Auth API
export const authAPI = {
  signup: async (userData) => {
    return apiCall('/api/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  login: async (email, password) => {
    return apiCall('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  logout: async (userId, refreshToken) => {
    return apiCall('/api/logout', {
      method: 'POST',
      body: JSON.stringify({ userId, refreshToken }),
    });
  },

  forgotPassword: async (email) => {
    return apiCall('/api/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  verifyOTP: async (email, otp) => {
    return apiCall('/api/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  resetPassword: async (email, otp, newPassword) => {
    return apiCall('/api/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    });
  },
};

// User Profile API
export const userAPI = {
  getProfile: async () => {
    return apiCall('/api/profile');
  },
  updateProfile: async (profileData) => {
    return apiCall('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }
};

// Order API
export const orderAPI = {
  createCheckoutSession: async (totalAmount) => {
    return apiCall('/api/orders/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ totalAmount }),
    });
  },
  createOrder: async (orderData) => {
    return apiCall('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },
};

// Product API
export const productAPI = {
  create: async (productData) => {
    return apiCall('/api/products', {
      method: 'POST',
      body: productData instanceof FormData ? productData : JSON.stringify(productData),
    });
  },

  getAll: async () => {
    // Add cache-busting timestamp to force fresh data
    const timestamp = new Date().getTime();
    return apiCall(`/api/products/all?_t=${timestamp}`);
  },

  getByFarmer: async (farmerId) => {
    // Add cache-busting timestamp to force fresh data
    const timestamp = new Date().getTime();
    return apiCall(`/api/products/${farmerId}?_t=${timestamp}`);
  },

  update: async (productId, productData) => {
    return apiCall(`/api/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  delete: async (productId) => {
    return apiCall(`/api/products/${productId}`, {
      method: 'DELETE',
    });
  },
};

// Market Price API
export const marketPriceAPI = {
  getPrice: async (itemName) => {
    return apiCall(`/api/market-price?item=${encodeURIComponent(itemName)}`);
  },
};

// Admin API
export const adminAPI = {
  getUsers: async () => {
    return apiCall('/api/admin/users');
  },

  deleteUser: async (userId) => {
    return apiCall(`/api/admin/users/${userId}`, {
      method: 'DELETE',
    });
  },

  getAllOrders: async () => {
    return apiCall('/api/admin/orders');
  },

  getOrderDetails: async (orderId) => {
    return apiCall(`/api/admin/orders/${orderId}`);
  },

  getAllFarmers: async () => {
    return apiCall('/api/admin/farmers');
  },

  getFarmerSales: async (farmerId, month, year) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    return apiCall(`/api/admin/farmers/${farmerId}/sales?${params.toString()}`);
  },
};

