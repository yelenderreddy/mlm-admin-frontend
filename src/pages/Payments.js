import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCardIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  EyeIcon,
  FunnelIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { ADMIN_ENDPOINTS, getAdminHeaders } from '../api-endpoints';
import { logDebug, logError } from '../config';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'All',
    method: 'All',
    member: '',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: ''
  });
  const [summary, setSummary] = useState({
    totalPayments: 0,
    totalAmount: 0,
    successfulPayments: 0,
    failedPayments: 0,
    pendingPayments: 0,
    averageAmount: 0
  });
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  // Fetch payments data from new API
  const fetchPayments = useCallback(async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      logDebug('Fetching payments data from new API');
      
      const response = await fetch(`${ADMIN_ENDPOINTS.ORDERS.ORDER_DETAILS}?page=${page}&limit=${limit}`, {
        headers: getAdminHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      logDebug('Payments data received', responseData);
      
      if (responseData.data && responseData.data.orders) {
        const transformedPayments = responseData.data.orders.map(order => ({
        id: order.id,
          member: order.userName || 'Unknown User',
          memberId: order.userId,
          memberEmail: order.userEmail,
          memberMobile: order.userMobile,
          memberAddress: order.userAddress,
          memberGender: order.userGender,
          memberReferralCode: order.userReferralCode,
          amount: (order.productPrice || 0) * order.quantity,
        method: order.paymentMethod || 'Cash',
          status: order.userPaymentStatus || 'Pending',
        orderId: order.id,
          orderStatus: order.status || 'Pending',
          createdAt: order.orderedAt,
        updatedAt: order.updatedAt,
          products: [{
            id: order.productId,
            name: order.productName,
            price: order.productPrice || 0,
            quantity: order.quantity,
            productCount: order.productCount,
            productStatus: order.productStatus,
            productCode: order.productCode,
          }],
          // Store original data for modals
          originalData: order,
        }));

        setPayments(transformedPayments);
        setPagination(responseData.data.pagination);
      } else {
        setPayments([]);
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
      logError('Failed to fetch payments', err);
      setError(err.message);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate summary statistics
  const calculateSummary = useCallback(() => {
    const totalPayments = pagination.total;
    const totalAmount = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const successfulPayments = payments.filter(p => p.status === 'PAID').length;
    const failedPayments = payments.filter(p => p.status === 'FAILED' || p.status === 'CANCELLED').length;
    const pendingPayments = payments.filter(p => p.status === 'PENDING').length;
    const averageAmount = totalPayments > 0 ? totalAmount / totalPayments : 0;

    setSummary({
      totalPayments,
      totalAmount,
      successfulPayments,
      failedPayments,
      pendingPayments,
      averageAmount
    });
  }, [payments, pagination.total]);

  // Load data on component mount and when pagination changes
  useEffect(() => {
    fetchPayments(pagination.page, pagination.limit);
  }, [fetchPayments, pagination.page, pagination.limit]);

  useEffect(() => {
    calculateSummary();
  }, [calculateSummary]);

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

  // Handle payment refund
  const handleRefundPayment = async (paymentId) => {
    try {
      const response = await fetch(ADMIN_ENDPOINTS.PAYMENTS.REFUND(paymentId), {
        method: 'POST',
        headers: getAdminHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update local state
      setPayments(prevPayments => 
        prevPayments.map(payment => 
          payment.id === paymentId ? { ...payment, status: 'Refunded' } : payment
        )
      );

      logDebug('Payment refunded successfully');
    } catch (err) {
      logError('Failed to refund payment', err);
      alert('Failed to refund payment. Please try again.');
    }
  };

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    if (filters.status !== 'All' && payment.status !== filters.status) return false;
    if (filters.method !== 'All' && payment.method !== filters.method) return false;
    if (filters.member && !payment.member.toLowerCase().includes(filters.member.toLowerCase())) return false;
    if (filters.minAmount && payment.amount < parseFloat(filters.minAmount)) return false;
    if (filters.maxAmount && payment.amount > parseFloat(filters.maxAmount)) return false;
    if (filters.dateFrom && payment.createdAt && new Date(payment.createdAt) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && payment.createdAt && new Date(payment.createdAt) > new Date(filters.dateTo)) return false;
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'FAILED':
      case 'CANCELLED': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'REFUNDED': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PAID': return <CheckCircleIcon className="w-4 h-4" />;
      case 'PENDING': return <ClockIcon className="w-4 h-4" />;
      case 'FAILED':
      case 'CANCELLED': return <XCircleIcon className="w-4 h-4" />;
      case 'REFUNDED': return <ArrowTrendingUpIcon className="w-4 h-4" />;
      default: return <ExclamationTriangleIcon className="w-4 h-4" />;
    }
  };

  const getMethodColor = (method) => {
    switch (method) {
      case 'Credit Card': return 'bg-blue-100 text-blue-700';
      case 'Debit Card': return 'bg-green-100 text-green-700';
      case 'UPI': return 'bg-purple-100 text-purple-700';
      case 'Net Banking': return 'bg-orange-100 text-orange-700';
      case 'Cash': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor and manage all payment transactions</p>
        </div>
        <button
          onClick={() => fetchPayments(pagination.page, pagination.limit)}
          disabled={loading}
          className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
        >
          <ArrowPathIcon className="w-4 h-4" />
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{pagination.total}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">All transactions</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <CreditCardIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{summary.totalAmount.toLocaleString()}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Processed</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <BanknotesIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Successful</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.successfulPayments}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.pendingPayments}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Awaiting</p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
              <ClockIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Amount</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{summary.averageAmount.toLocaleString()}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Per transaction</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <ArrowTrendingUpIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            >
              <option value="All">All Status</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Method</label>
            <select
              value={filters.method}
              onChange={(e) => setFilters({ ...filters, method: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            >
              <option value="All">All Methods</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="UPI">UPI</option>
              <option value="Net Banking">Net Banking</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Member</label>
            <input
              type="text"
              placeholder="Search member"
              value={filters.member}
              onChange={(e) => setFilters({ ...filters, member: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date From</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date To</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.minAmount}
                onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.maxAmount}
                onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Transactions</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Showing {filteredPayments.length} of {pagination.total} transactions (Page {pagination.page} of {pagination.totalPages})
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Products</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    <div className="animate-pulse">Loading payment transactions...</div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-red-500">
                    Error: {error}
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No payment transactions found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {payment.member}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {payment.memberEmail}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {payment.products?.[0]?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Qty: {payment.products?.[0]?.quantity || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                      ₹{(payment.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getMethodColor(payment.method)}`}>
                        {payment.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        <span className="ml-1">{payment.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      #{payment.orderId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {payment.status === 'PAID' && (
                          <button
                            onClick={() => handleRefundPayment(payment.id)}
                            className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                            title="Refund Payment"
                          >
                            <ArrowTrendingUpIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowDetailModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="View Details"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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

      {/* Payment Detail Modal */}
      {showDetailModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Member Details */}
            <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2">Member Details</h4>
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <p className="text-sm text-gray-900 dark:text-white">{selectedPayment.member}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <p className="text-sm text-gray-900 dark:text-white">{selectedPayment.memberEmail}</p>
              </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mobile</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedPayment.memberMobile || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Referral Code</label>
                  <p className="text-sm text-gray-900 dark:text-white font-mono">{selectedPayment.memberReferralCode || 'N/A'}</p>
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2">Payment Details</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">₹{(selectedPayment.amount || 0).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getMethodColor(selectedPayment.method)}`}>
                  {selectedPayment.method}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedPayment.status)}`}>
                  {getStatusIcon(selectedPayment.status)}
                  <span className="ml-1">{selectedPayment.status}</span>
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Order ID</label>
                <p className="text-sm text-gray-900 dark:text-white">#{selectedPayment.orderId}</p>
              </div>
              </div>

              {/* Product Details */}
              <div className="md:col-span-2 space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2">Product Details</h4>
                {selectedPayment.products && selectedPayment.products.length > 0 ? (
                  <div className="space-y-2">
                    {selectedPayment.products.map((product, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700 rounded">
                        <div>
                          <span className="font-medium">{product.name}</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">x {product.quantity}</span>
                        </div>
                        <span className="font-semibold">₹{product.price}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No product information available</p>
                )}
              </div>

              {/* Transaction Info */}
              <div className="md:col-span-2 space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2">Transaction Info</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Transaction Date</label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {selectedPayment.createdAt ? new Date(selectedPayment.createdAt).toLocaleString() : 'N/A'}
                </p>
              </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Updated</label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedPayment.updatedAt ? new Date(selectedPayment.updatedAt).toLocaleString() : 'N/A'}
                    </p>
                      </div>
                  </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
} 