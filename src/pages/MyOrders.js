import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getMyOrders } from '../services/orderApi';

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const data = await getMyOrders();
            setOrders(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Helper for Status Steps
    const getStatusStep = (status) => {
        const normalizedStatus = status?.toLowerCase() || '';
        const steps = ['pending', 'confirmed', 'shipped', 'delivered'];
        let currentIndex = steps.indexOf(normalizedStatus);
        if (normalizedStatus === 'cancelled') return -1;
        return currentIndex;
    };

    if (loading) return <div className="text-center mt-20 text-green-600">Loading Orders...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            <Navbar />
            <div className="max-w-4xl mx-auto pt-24 px-4">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">📦 My Orders</h2>
                
                {orders.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm">
                        <p className="text-xl text-gray-500">No orders placed yet.</p>
                        <Link to="/" className="text-green-600 hover:underline mt-2 inline-block">Start Shopping</Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => {
                            const stepIndex = getStatusStep(order.status);
                            
                            return (
                                <div key={order._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                    {/* Header */}
                                    <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b border-gray-100">
                                        <div>
                                            <p className="text-sm text-gray-500">Order ID: #{order._id.slice(-6).toUpperCase()}</p>
                                            <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-800">₹{order.totalAmount}</p>
                                            <span className={`text-xs px-2 py-1 rounded-full ${
                                                order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {order.status.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Tracking & Items Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:divide-x divide-gray-100">
                                        
                                        {/* Left Column: Items */}
                                        <div className="md:col-span-2 px-6 py-4">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition p-2 rounded-lg">
                                                    <div className="flex gap-4">
                                                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                                                            {/* Placeholder Icon based on name/category would be better, but generic for now */}
                                                            🥬
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-800">{item.productName}</p>
                                                            <p className="text-xs text-gray-500 mt-1">Seller: {order.farmerId?.name || 'FarmConnect Farmer'}</p>
                                                            <p className="text-xs text-gray-600 mt-1 font-medium">Qty: {item.quantity} {item.unit}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-gray-900">₹{item.subtotal}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Right Column: Vertical Helper Timeline */}
                                        <div className="px-6 py-6 bg-gray-50/30">
                                            <h4 className="font-bold text-gray-700 mb-6 text-sm uppercase tracking-wider">Order Status</h4>
                                            
                                            {order.status.toLowerCase() === 'cancelled' ? (
                                                <div className="flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-xl border border-red-100">
                                                    <span className="text-2xl">🚫</span>
                                                    <div>
                                                        <p className="font-bold">Order Cancelled</p>
                                                        <p className="text-xs text-red-400">Please contact support if this was a mistake.</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="relative pl-2">
                                                    {/* Vertical Connecting Line -- Dynamic Height */}
                                                    <div className="absolute left-[15px] top-3 bottom-6 w-[2px] bg-gray-200"></div>

                                                    {['pending', 'confirmed', 'shipped', 'delivered'].map((step, idx) => {
                                                        const isCompleted = idx <= stepIndex;
                                                        const isCurrent = idx === stepIndex;
                                                        const labels = {
                                                            pending: 'Order Placed',
                                                            confirmed: 'Order Confirmed',
                                                            shipped: 'Shipped',
                                                            delivered: 'Delivered'
                                                        };
                                                        
                                                        return (
                                                            <div key={step} className="relative flex items-start gap-4 mb-8 last:mb-0 z-10 group">
                                                                {/* Dot/Icon */}
                                                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all duration-300 ${
                                                                    isCompleted 
                                                                        ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-200' 
                                                                        : 'bg-white border-gray-300 text-gray-300'
                                                                }`}>
                                                                    {isCompleted ? '✓' : (idx + 1)}
                                                                </div>

                                                                {/* Label */}
                                                                <div className={`transition-all duration-300 ${isCompleted ? 'opacity-100' : 'opacity-50'}`}>
                                                                    <p className={`font-bold text-sm ${isCompleted ? 'text-green-800' : 'text-gray-500'}`}>
                                                                        {labels[step]}
                                                                    </p>
                                                                    <p className="text-[10px] text-gray-400">
                                                                        {isCurrent ? `Your order is ${labels[step].toLowerCase()}` : 
                                                                         isCompleted ? new Date(order.updatedAt).toLocaleDateString() : ''}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Footer */}
                                    <div className="px-6 py-3 bg-gray-50 text-xs text-gray-500 flex justify-between">
                                        <span>Sold by: {order.farmerId?.name || 'Farmer'}</span>
                                        {order.status === 'pending' && <span className="text-orange-500">Waiting for farmer acceptance...</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyOrders;
