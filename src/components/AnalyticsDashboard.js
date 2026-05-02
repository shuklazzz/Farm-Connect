import React, { useEffect, useState } from 'react';
import { getFarmerAnalytics } from '../services/orderApi';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const AnalyticsDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const result = await getFarmerAnalytics();
                setData(result);
            } catch (error) {
                console.error("Failed to load analytics", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) return <div className="text-gray-500 text-center py-10">Loading insights... 📊</div>;

    if (!data) return <div className="text-red-500 text-center py-10">Failed to load analytics.</div>;

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    // Custom Tooltip for Pie Chart to show Quantity + Unit
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const { name, value, unit } = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg">
                    <p className="font-bold text-gray-800">{name}</p>
                    <p className="text-green-600 font-bold">
                        {value} {unit}
                    </p>
                    <p className="text-xs text-gray-400">sold</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg">
                    <p className="text-green-100 text-sm font-bold uppercase tracking-wider">Total Revenue</p>
                    <h3 className="text-3xl font-black mt-1">₹{data.totalRevenue.toLocaleString()}</h3>
                    <p className="text-xs text-green-100 mt-2 opacity-80">Lifetime earnings</p>
                </div>
                
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg">
                    <p className="text-blue-100 text-sm font-bold uppercase tracking-wider">Weekly Revenue</p>
                    <h3 className="text-3xl font-black mt-1">₹{data.weeklyRevenue?.toLocaleString() || 0}</h3>
                    <p className="text-xs text-blue-100 mt-2 opacity-80">Last 7 days</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Total Orders</p>
                    <h3 className="text-3xl font-black text-gray-800 mt-1">{data.totalOrders}</h3>
                    <p className="text-xs text-gray-400 mt-2">Completed orders</p>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Sales Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-700 mb-4">Sales Trend (Last 7 Days) 📅</h4>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                                <YAxis tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value}`} />
                                <Tooltip 
                                    cursor={{fill: '#f3f4f6'}}
                                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                                    formatter={(value) => [`₹${value}`, 'Sales']}
                                />
                                <Bar dataKey="sales" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Products Pie Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-700 mb-4">Top Selling Items 🏆</h4>
                    {data.topProducts.length > 0 ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.topProducts}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {data.topProducts.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl">
                            <span className="text-4xl mb-2">📉</span>
                            <span className="text-sm">No sales data yet.</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
