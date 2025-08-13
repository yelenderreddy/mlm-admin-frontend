import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import ActionMenu from "./ActionMenu";
import { ADMIN_ENDPOINTS, getAdminHeaders } from '../api-endpoints';
import { logDebug, logError } from '../config';

const orderStatuses = ["All", "Packing", "packed", "Delivered", "Cancelled", "confirmed"];
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
  const [showUserModal, setShowUserModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  // Fetch orders data from new API
  const fetchOrders = useCallback(async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      logDebug('Fetching orders data from new API');
      
      const response = await fetch(`${ADMIN_ENDPOINTS.ORDERS.ORDER_DETAILS}?page=${page}&limit=${limit}`, {
        headers: getAdminHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      logDebug('Orders data received', responseData);
      
      if (responseData.data && responseData.data.orders) {
        const transformedOrders = responseData.data.orders.map(order => ({
          id: order.id,
          orderNumber: `#${order.id}`,
          customer: order.userName || 'Unknown',
          customerId: order.userId,
          customerEmail: order.userEmail,
          customerMobile: order.userMobile,
          customerAddress: order.userAddress,
          customerGender: order.userGender,
          customerReferralCode: order.userReferralCode,
          customerPaymentStatus: order.userPaymentStatus,
          products: [{
            id: order.productId,
            name: order.productName,
            price: order.productPrice || 0,
            quantity: order.quantity,
            productCount: order.productCount,
            productStatus: order.productStatus,
            productCode: order.productCode,
          }],
          totalAmount: (order.productPrice || 0) * order.quantity,
          status: order.status || 'Pending',
          type: 'Direct', // Default type since it's not in the API
          orderDate: order.orderedAt ? new Date(order.orderedAt).toLocaleDateString() : 'N/A',
          shippingAddress: order.userAddress || 'N/A',
          paymentMethod: 'N/A',
          paymentStatus: order.userPaymentStatus || 'Pending',
          trackingNumber: 'N/A',
          notes: '',
          collected: false,
          // Store original data for modals
          originalData: order,
        }));

        setOrders(transformedOrders);
        setPagination(responseData.data.pagination);
      } else {
        setOrders([]);
        setPagination({
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        });
      }
    } catch (err) {
      logError('Failed to fetch orders', err);
      setError(err.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);



  // Load data on component mount and when pagination changes
  useEffect(() => {
    fetchOrders(pagination.page, pagination.limit);
  }, [fetchOrders, pagination.page, pagination.limit]);

  // Pagination controls
  const handlePrevPage = () => {
    if (pagination.hasPrev) {
      setPagination(prev => ({ ...prev, page: prev.page - 1 }));
    }
  };

  const handleNextPage = () => {
    if (pagination.hasNext) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    }
  };

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
      
      const response = await fetch(ADMIN_ENDPOINTS.ORDERS.UPDATE_ORDER_STATUS(orderId), {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      logDebug('Order status update response', result);

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

  // View user details
  const handleViewUser = (order) => {
    setSelectedUser({
      id: order.customerId,
      name: order.customer,
      email: order.customerEmail,
      mobile: order.customerMobile,
      address: order.customerAddress,
      gender: order.customerGender,
      referralCode: order.customerReferralCode,
      paymentStatus: order.customerPaymentStatus,
    });
    setShowUserModal(true);
  };

  // View product details
  const handleViewProduct = (order) => {
    const product = order.products[0];
    setSelectedProduct({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      productCount: product.productCount,
      productStatus: product.productStatus,
      productCode: product.productCode,
    });
    setShowProductModal(true);
  };

  // Calculate summary statistics
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Processing': return 'bg-blue-100 text-blue-800';
      case 'Shipped': return 'bg-purple-100 text-purple-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
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

  // User Details Modal
  const UserModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">User Details</h2>
            <button
              onClick={() => setShowUserModal(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-lg font-semibold">{selectedUser.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-lg">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Mobile</label>
                  <p className="text-lg">{selectedUser.mobile}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Gender</label>
                  <p className="text-lg">{selectedUser.gender || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Referral Code</label>
                  <p className="text-lg font-mono">{selectedUser.referralCode}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Status</label>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    selectedUser.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedUser.paymentStatus}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Address</label>
                <p className="text-sm mt-1">{selectedUser.address || 'N/A'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Product Details Modal
  const ProductModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Product Details</h2>
            <button
              onClick={() => setShowProductModal(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          
          {selectedProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Product Name</label>
                  <p className="text-lg font-semibold">{selectedProduct.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Price</label>
                  <p className="text-lg font-bold text-green-600">₹{selectedProduct.price}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Quantity</label>
                  <p className="text-lg">{selectedProduct.quantity}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Product Code</label>
                  <p className="text-lg font-mono">{selectedProduct.productCode}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Stock</label>
                  <p className="text-lg">{selectedProduct.productCount}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    selectedProduct.productStatus === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedProduct.productStatus}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

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
            onClick={() => fetchOrders(pagination.page, pagination.limit)}
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
          <div className="text-2xl font-bold text-blue-600">{pagination.total}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
          <div className="text-sm text-slate-500 dark:text-slate-400">Total Revenue</div>
          <div className="text-2xl font-bold text-green-600">₹{orders.reduce((sum, order) => sum + order.totalAmount, 0).toLocaleString()}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
          <div className="text-sm text-slate-500 dark:text-slate-400">Pending Orders</div>
          <div className="text-2xl font-bold text-yellow-600">{orders.filter(o => o.status === 'Pending').length}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
          <div className="text-sm text-slate-500 dark:text-slate-400">Completed Orders</div>
          <div className="text-2xl font-bold text-purple-600">{orders.filter(o => o.status === 'confirmed' || o.status === 'Delivered').length}</div>
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
              <th className="py-3 px-4 text-left">Products</th>
              <th className="py-3 px-4 text-center">Quantity</th>
              <th className="py-3 px-4 text-center">Total ₹</th>
              <th className="py-3 px-4 text-center">Status</th>
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
                  <td className="py-3 px-4 whitespace-nowrap">{order.products[0]?.name || 'N/A'}</td>
                  <td className="py-3 px-4 text-center">{order.products[0]?.quantity || 0}</td>
                  <td className="py-3 px-4 text-center font-bold">₹{order.totalAmount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">{order.orderDate}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex items-center gap-2">
                      <ActionMenu
                        onView={() => handleViewOrder(order)}
                        onViewUser={() => handleViewUser(order)}
                        onViewProduct={() => handleViewProduct(order)}
                        onUpdateStatus={(newStatus) => handleUpdateStatus(order.id, newStatus)}
                        order={order}
                        orderStatuses={orderStatuses.filter(status => status !== 'All')}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center my-4">
        <button 
          onClick={handlePrevPage} 
          disabled={!pagination.hasPrev} 
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span>Page {pagination.page} of {pagination.totalPages} (Total: {pagination.total})</span>
        <button 
          onClick={handleNextPage} 
          disabled={!pagination.hasNext} 
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
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
                        <span>{product.name}</span>
                        <span className="font-semibold">₹{product.price}</span>
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

      {/* User Details Modal */}
      {showUserModal && <UserModal />}

      {/* Product Details Modal */}
      {showProductModal && <ProductModal />}
    </motion.div>
  );
} 