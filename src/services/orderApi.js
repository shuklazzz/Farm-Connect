import axios from 'axios';

// Get token from localStorage
const getAuthHeaders = () => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const token = user?.token;
    
    return { 
        headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json' 
        } 
    };
};

// Create a new order
export const createOrder = async (orderData) => {
    try {
        const response = await axios.post('/api/orders', orderData, getAuthHeaders());
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Failed to create order";
    }
};

// Get Buyer's Orders
export const getMyOrders = async () => {
    try {
        const response = await axios.get('/api/orders/buyer', getAuthHeaders());
        return response.data;
    } catch (error) {
        return [];
    }
};

// Get Farmer's Orders
export const getIncomingOrders = async () => {
    try {
        const response = await axios.get('/api/orders/farmer', getAuthHeaders());
        return response.data;
    } catch (error) {
        return [];
    }
};

// Get Farmer Analytics
export const getFarmerAnalytics = async () => {
    try {
        const response = await axios.get('/api/orders/farmer/analytics', getAuthHeaders());
        return response.data;
    } catch (error) {
        console.error("Analytics API Error:", error);
        return { totalRevenue: 0, totalOrders: 0, chartData: [], topProducts: [] };
    }
};

// Update Order Status
export const updateOrderStatus = async (orderId, status) => {
    try {
        const response = await axios.put(`/api/orders/${orderId}/status`, { status }, getAuthHeaders());
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Failed to update status";
    }
};
