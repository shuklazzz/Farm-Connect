import React, { useEffect, useState } from 'react';
import { getIncomingOrders, updateOrderStatus } from '../services/orderApi';

const OrderManager = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const data = await getIncomingOrders();
            setOrders(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        if (!window.confirm(`Mark this order as ${newStatus}?`)) return;
        try {
            await updateOrderStatus(orderId, newStatus);
            fetchOrders(); // Refresh
        } catch (error) {
            alert("Failed to update status");
        }
    };

    if (loading) return <div className="text-gray-500">Loading orders...</div>;
    if (orders.length === 0) return <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl">No active orders yet. 🍃</div>;

    return (
        <div className="space-y-4">
            {orders.map((order) => {
                const isCancelled = order.status?.toLowerCase() === 'cancelled';
                return (
                    <div key={order._id} className={`border rounded-xl p-4 shadow-sm transition-colors ${
                        isCancelled ? 'bg-red-50 border-red-100' : 'bg-white'
                    }`}>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="font-bold text-gray-800">Order #{order._id.slice(-6).toUpperCase()}</p>
                            <p className="text-sm text-gray-500">
                                from <span className="font-medium text-gray-700">{order.buyerId?.name || 'Unknown Buyer'}</span>
                            </p>
                            <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-lg text-green-700">₹{order.totalAmount}</p>
                            <span className={`inline-block px-2 py-1 rounded text-xs mt-1 font-medium ${
                                order.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                'bg-gray-100 text-gray-600'
                            }`}>
                                {order.status.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-2">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                                <span>{item.productName} <span className="text-gray-400">x {item.quantity} {item.unit}</span></span>
                                <span>₹{item.subtotal}</span>
                            </div>
                        ))}
                    </div>

                    {/* Address */}
                    <p className="text-xs text-gray-500 mb-4">
                        📍 {order.deliveryAddress?.address || 'Pickup'}, {order.deliveryAddress?.city}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2 border-t pt-3">
                        {order.status === 'pending' && (
                            <>
                                <button 
                                    onClick={() => handleStatusUpdate(order._id, 'confirmed')}
                                    className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition"
                                >
                                    Accept Order ✅
                                </button>
                                <button 
                                    onClick={() => handleStatusUpdate(order._id, 'cancelled')}
                                    className="flex-1 bg-red-100 text-red-600 py-2 rounded-lg text-sm font-bold hover:bg-red-200 transition"
                                >
                                    Reject ❌
                                </button>
                            </>
                        )}
                        {order.status === 'confirmed' && (
                            <button 
                                onClick={() => handleStatusUpdate(order._id, 'shipped')}
                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition"
                            >
                                Mark Shipped 🚚
                            </button>
                        )}
                        {order.status === 'shipped' && (
                            <button 
                                onClick={() => handleStatusUpdate(order._id, 'delivered')}
                                className="flex-1 bg-green-800 text-white py-2 rounded-lg text-sm font-bold hover:bg-green-900 transition"
                            >
                                Mark Delivered 🎉
                            </button>
                        )}
                    </div>
                </div>
                );
            })}
        </div>
    );
};

export default OrderManager;
