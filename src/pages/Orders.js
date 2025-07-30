import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ADMIN_ENDPOINTS, getAdminHeaders } from '../api-endpoints';
import { logDebug, logError } from '../config';

const orderStatuses = ["All", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
const orderTypes = ["All", "Direct", "Referral", "Gift"];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: "All",
    type: "All",
    dateFrom: "",
    dateTo: "",
    customer: "",
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [summary, setSummary] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });

  // Fetch orders data
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      logDebug('Fetching orders data');
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.status !== 'All') params.append('status', filters.status);
      if (filters.type !== 'All') params.append('type', filters.type);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.customer) params.append('customer', filters.customer);
      
      const response = await fetch(`${ADMIN_ENDPOINTS.ORDERS.LIST}?${params.toString()}`, {
        headers: getAdminHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      logDebug('Orders data received', responseData);
      
      // Handle different response formats - now using dedicated orders endpoint
      let data = [];
      if (Array.isArray(responseData)) {
        data = responseData;
      } else if (responseData && Array.isArray(responseData.data)) {
        data = responseData.data;
      } else {
        logDebug('No valid orders array found in response, using empty array');
        data = [];
      }
      
      // Transform API data to match our UI structure
      const transformedOrders = data.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber || order.orderId || `#${order.id}`,
        customer: order.user?.name || order.customerName || order.customer || order.userName || 'Unknown',
        customerId: order.userId || order.user?.id || order.customerId,
        products: order.items || order.products || [],
        totalAmount: order.total || order.totalAmount || order.amount || 0,
        status: order.status || 'Pending',
        type: order.type || order.orderType || 'Direct',
        orderDate: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A',
        shippingAddress: order.shippingAddress || order.address || 'N/A',
        paymentMethod: order.paymentMethod || 'N/A',
        paymentStatus: order.paymentStatus || 'Pending',
        trackingNumber: order.trackingNumber || 'N/A',
        notes: order.notes || '',
        collected: order.collected || false,
      }));

      setOrders(transformedOrders);
    } catch (err) {
      logError('Failed to fetch orders', err);
      setError(err.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch order statistics
  const fetchOrderStats = useCallback(async () => {
    try {
      logDebug('Fetching order statistics');
      
      const response = await fetch(ADMIN_ENDPOINTS.ORDERS.STATS, {
        headers: getAdminHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logDebug('Order stats received', data);
      
      setSummary({
        totalOrders: data.totalOrders || 0,
        totalRevenue: data.totalRevenue || 0,
        pendingOrders: data.pendingOrders || 0,
        completedOrders: data.completedOrders || 0,
      });
    } catch (err) {
      logError('Failed to fetch order stats', err);
      // Keep default values if stats fail
    }
  }, []);

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchOrders();
    fetchOrderStats();
  }, [fetchOrders, fetchOrderStats]);

  // Filter logic
  const filtered = orders.filter((order) => {
    const matchStatus = filters.status === "All" || order.status === filters.status;
    const matchType = filters.type === "All" || order.type === filters.type;
    const matchDateFrom = !filters.dateFrom || order.orderDate >= filters.dateFrom;
    const matchDateTo = !filters.dateTo || order.orderDate <= filters.dateTo;
    const matchCustomer = !filters.customer || order.customer.toLowerCase().includes(filters.customer.toLowerCase());
    return matchStatus && matchType && matchDateFrom && matchDateTo && matchCustomer;
  });

  // Update order status
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      logDebug(`Updating order ${orderId} status to ${newStatus}`);
      
      const response = await fetch(ADMIN_ENDPOINTS.ORDERS.UPDATE_STATUS(orderId), {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      logDebug('Order status updated successfully');
    } catch (err) {
      logError('Failed to update order status', err);
      alert('Failed to update order status. Please try again.');
    }
  };

  // View order details
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  // Calculate summary statistics
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Processing': return 'bg-blue-100 text-blue-800';
      case 'Shipped': return 'bg-purple-100 text-purple-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Direct': return 'bg-blue-100 text-blue-800';
      case 'Referral': return 'bg-green-100 text-green-800';
      case 'Gift': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 sm:p-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Orders Management</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:scale-105 transition-transform duration-200 text-sm disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
          <div className="text-sm text-slate-500 dark:text-slate-400">Total Orders</div>
          <div className="text-2xl font-bold text-blue-600">{summary.totalOrders}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
          <div className="text-sm text-slate-500 dark:text-slate-400">Total Revenue</div>
          <div className="text-2xl font-bold text-green-600">₹{summary.totalRevenue.toLocaleString()}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
          <div className="text-sm text-slate-500 dark:text-slate-400">Pending Orders</div>
          <div className="text-2xl font-bold text-yellow-600">{summary.pendingOrders}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
          <div className="text-sm text-slate-500 dark:text-slate-400">Completed Orders</div>
          <div className="text-2xl font-bold text-purple-600">{summary.completedOrders}</div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Error:</strong> {error}
          <button 
            onClick={() => setError(null)}
            className="ml-4 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        >
          {orderStatuses.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        >
          {orderTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
          className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          placeholder="From"
        />
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
          className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          placeholder="To"
        />
        <input
          type="text"
          placeholder="Customer"
          value={filters.customer}
          onChange={(e) => setFilters({ ...filters, customer: e.target.value })}
          className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        />
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto rounded-lg shadow mb-8">
        <table className="min-w-full bg-white dark:bg-slate-800">
          <thead>
            <tr className="bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm">
              <th className="py-3 px-4 text-left">Order #</th>
              <th className="py-3 px-4 text-left">Customer</th>
              <th className="py-3 px-4 text-center">Products</th>
              <th className="py-3 px-4 text-center">Total ₹</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">Type</th>
              <th className="py-3 px-4 text-center">Date</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-slate-500">
                  <div className="animate-pulse">Loading orders...</div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-slate-500">No orders found.</td>
              </tr>
            ) : (
              filtered.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-slate-700 transition">
                  <td className="py-3 px-4 whitespace-nowrap font-medium">{order.orderNumber}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{order.customer}</td>
                  <td className="py-3 px-4 text-center">{order.products.length} items</td>
                  <td className="py-3 px-4 text-center font-bold">₹{order.totalAmount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeColor(order.type)}`}>
                      {order.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">{order.orderDate}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex items-center gap-2">
                      <button 
                        onClick={() => handleViewOrder(order)}
                        className="px-3 py-1 text-xs font-medium text-blue-600 bg-transparent hover:bg-blue-50 dark:hover:bg-slate-800 focus:z-10 focus:outline-none transition rounded"
                      >
                        View
                      </button>
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      >
                        {orderStatuses.filter(status => status !== 'All').map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Order Details</h2>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Order Number</label>
                    <p className="text-lg font-semibold">{selectedOrder.orderNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Customer</label>
                    <p className="text-lg">{selectedOrder.customer}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Order Date</label>
                    <p className="text-lg">{selectedOrder.orderDate}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Amount</label>
                    <p className="text-lg font-bold text-green-600">₹{selectedOrder.totalAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Type</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeColor(selectedOrder.type)}`}>
                      {selectedOrder.type}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Products</label>
                  <div className="mt-2 space-y-2">
                    {selectedOrder.products.map((product, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-slate-700 rounded">
                        <span>{product.name || product.productName || 'Product'}</span>
                        <span className="font-semibold">₹{product.price || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Shipping Address</label>
                  <p className="text-sm mt-1">{selectedOrder.shippingAddress}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Method</label>
                  <p className="text-sm mt-1">{selectedOrder.paymentMethod}</p>
                </div>

                {selectedOrder.trackingNumber && selectedOrder.trackingNumber !== 'N/A' && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tracking Number</label>
                    <p className="text-sm mt-1">{selectedOrder.trackingNumber}</p>
                  </div>
                )}

                {selectedOrder.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Notes</label>
                    <p className="text-sm mt-1">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
} 