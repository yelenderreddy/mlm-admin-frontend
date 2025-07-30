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

  // Fetch payments data
  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      logDebug('Fetching payments data');
      
      // For now, we'll use orders data as payments since there's no dedicated payments endpoint
      const response = await fetch(ADMIN_ENDPOINTS.ORDERS.LIST, {
        headers: getAdminHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logDebug('Payments data received', data);
      
      // Transform orders data to payments format
      const paymentsData = data.map(order => ({
        id: order.id,
        member: order.user?.name || 'Unknown User',
        memberEmail: order.user?.email || 'N/A',
        amount: order.total || 0,
        method: order.paymentMethod || 'Cash',
        status: order.paymentStatus || 'Pending',
        orderId: order.id,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.items || []
      }));

      setPayments(paymentsData);
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
    const totalPayments = payments.length;
    const totalAmount = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const successfulPayments = payments.filter(p => p.status === 'Paid' || p.status === 'Completed').length;
    const failedPayments = payments.filter(p => p.status === 'Failed' || p.status === 'Cancelled').length;
    const pendingPayments = payments.filter(p => p.status === 'Pending').length;
    const averageAmount = totalPayments > 0 ? totalAmount / totalPayments : 0;

    setSummary({
      totalPayments,
      totalAmount,
      successfulPayments,
      failedPayments,
      pendingPayments,
      averageAmount
    });
  }, [payments]);

  // Load data on component mount
  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    calculateSummary();
  }, [calculateSummary]);

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
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Failed':
      case 'Cancelled': return 'bg-red-100 text-red-700';
      case 'Refunded': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Paid':
      case 'Completed': return <CheckCircleIcon className="w-4 h-4" />;
      case 'Pending': return <ClockIcon className="w-4 h-4" />;
      case 'Failed':
      case 'Cancelled': return <XCircleIcon className="w-4 h-4" />;
      case 'Refunded': return <ArrowTrendingUpIcon className="w-4 h-4" />;
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
          onClick={fetchPayments}
          className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalPayments}</p>
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
              <option value="Paid">Paid</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Refunded">Refunded</option>
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
            Showing {filteredPayments.length} of {payments.length} transactions
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Member</th>
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
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    <div className="animate-pulse">Loading payment transactions...</div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-red-500">
                    Error: {error}
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
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
                        {(payment.status === 'Paid' || payment.status === 'Completed') && (
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

      {/* Payment Detail Modal */}
      {showDetailModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Member</label>
                <p className="text-sm text-gray-900 dark:text-white">{selectedPayment.member}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <p className="text-sm text-gray-900 dark:text-white">{selectedPayment.memberEmail}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                <p className="text-sm font-bold text-gray-900 dark:text-white">₹{(selectedPayment.amount || 0).toLocaleString()}</p>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Transaction Date</label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {selectedPayment.createdAt ? new Date(selectedPayment.createdAt).toLocaleString() : 'N/A'}
                </p>
              </div>
              {selectedPayment.items && selectedPayment.items.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Items</label>
                  <div className="space-y-1">
                    {selectedPayment.items.map((item, index) => (
                      <div key={index} className="text-sm text-gray-900 dark:text-white">
                        {item.product?.name || 'Unknown Product'} x {item.quantity}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
} 