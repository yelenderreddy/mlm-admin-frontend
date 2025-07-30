import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  WalletIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  EyeIcon,
  FunnelIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { ADMIN_ENDPOINTS, getAdminHeaders } from '../api-endpoints';
import { logDebug, logError } from '../config';

export default function Payouts() {
  const [payouts, setPayouts] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'All',
    member: '',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: ''
  });
  const [summary, setSummary] = useState({
    totalPayouts: 0,
    totalAmount: 0,
    pendingPayouts: 0,
    approvedPayouts: 0,
    declinedPayouts: 0,
    totalWalletBalance: 0
  });
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch payouts data
  const fetchPayouts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      logDebug('Fetching payouts data');
      
      const response = await fetch(ADMIN_ENDPOINTS.PAYOUTS.LIST, {
        headers: getAdminHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logDebug('Payouts data received', data);
      
      setPayouts(Array.isArray(data) ? data : []);
    } catch (err) {
      logError('Failed to fetch payouts', err);
      setError(err.message);
      setPayouts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch wallet data
  const fetchWallets = useCallback(async () => {
    try {
      logDebug('Fetching wallet data');
      
      const response = await fetch(`${ADMIN_ENDPOINTS.USERS.LIST}?includeWallets=true`, {
        headers: getAdminHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logDebug('Wallet data received', data);
      
      // Transform user data to wallet format
      const walletData = data.map(user => ({
        id: user.id,
        member: user.name,
        email: user.email,
        totalEarned: user.rewards?.reduce((sum, reward) => sum + (reward.points || 0), 0) || 0,
        pendingPayouts: user.payouts?.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0) || 0,
        totalPaid: user.payouts?.filter(p => p.status === 'Approved').reduce((sum, p) => sum + p.amount, 0) || 0,
        balance: (user.rewards?.reduce((sum, reward) => sum + (reward.points || 0), 0) || 0) - 
                (user.payouts?.filter(p => p.status === 'Approved').reduce((sum, p) => sum + p.amount, 0) || 0)
      }));

      setWallets(walletData);
    } catch (err) {
      logError('Failed to fetch wallet data', err);
      setWallets([]);
    }
  }, []);

  // Calculate summary statistics
  const calculateSummary = useCallback(() => {
    const totalPayouts = payouts.length;
    const totalAmount = payouts.reduce((sum, payout) => sum + (payout.amount || 0), 0);
    const pendingPayouts = payouts.filter(p => p.status === 'Pending').length;
    const approvedPayouts = payouts.filter(p => p.status === 'Approved').length;
    const declinedPayouts = payouts.filter(p => p.status === 'Declined').length;
    const totalWalletBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);

    setSummary({
      totalPayouts,
      totalAmount,
      pendingPayouts,
      approvedPayouts,
      declinedPayouts,
      totalWalletBalance
    });
  }, [payouts, wallets]);

  // Load data on component mount
  useEffect(() => {
    fetchPayouts();
    fetchWallets();
  }, [fetchPayouts, fetchWallets]);

  useEffect(() => {
    calculateSummary();
  }, [calculateSummary]);

  // Handle payout approval
  const handleApprovePayout = async (payoutId) => {
    try {
      const response = await fetch(ADMIN_ENDPOINTS.PAYOUTS.APPROVE(payoutId), {
        method: 'POST',
        headers: getAdminHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update local state
      setPayouts(prevPayouts => 
        prevPayouts.map(payout => 
          payout.id === payoutId ? { ...payout, status: 'Approved' } : payout
        )
      );

      logDebug('Payout approved successfully');
    } catch (err) {
      logError('Failed to approve payout', err);
      alert('Failed to approve payout. Please try again.');
    }
  };

  // Handle payout decline
  const handleDeclinePayout = async (payoutId) => {
    try {
      const response = await fetch(ADMIN_ENDPOINTS.PAYOUTS.DECLINE(payoutId), {
        method: 'POST',
        headers: getAdminHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update local state
      setPayouts(prevPayouts => 
        prevPayouts.map(payout => 
          payout.id === payoutId ? { ...payout, status: 'Declined' } : payout
        )
      );

      logDebug('Payout declined successfully');
    } catch (err) {
      logError('Failed to decline payout', err);
      alert('Failed to decline payout. Please try again.');
    }
  };

  // Filter payouts
  const filteredPayouts = payouts.filter(payout => {
    if (filters.status !== 'All' && payout.status !== filters.status) return false;
    if (filters.member && !payout.user?.name?.toLowerCase().includes(filters.member.toLowerCase())) return false;
    if (filters.minAmount && payout.amount < parseFloat(filters.minAmount)) return false;
    if (filters.maxAmount && payout.amount > parseFloat(filters.maxAmount)) return false;
    return true;
  });

  // Filter wallets
  const filteredWallets = wallets.filter(wallet => {
    if (filters.member && !wallet.member.toLowerCase().includes(filters.member.toLowerCase())) return false;
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-700';
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Declined': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved': return <CheckCircleIcon className="w-4 h-4" />;
      case 'Pending': return <ClockIcon className="w-4 h-4" />;
      case 'Declined': return <XCircleIcon className="w-4 h-4" />;
      default: return <ExclamationTriangleIcon className="w-4 h-4" />;
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payout Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage member payout requests and wallet balances</p>
        </div>
        <button
          onClick={() => { fetchPayouts(); fetchWallets(); }}
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Payouts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalPayouts}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">All time</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <WalletIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{summary.totalAmount.toLocaleString()}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Paid out</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Payouts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.pendingPayouts}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Awaiting approval</p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
              <ClockIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Wallet Balance</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{summary.totalWalletBalance.toLocaleString()}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Available balance</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <WalletIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
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
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Declined">Declined</option>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Amount</label>
            <input
              type="number"
              placeholder="Min amount"
              value={filters.minAmount}
              onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Amount</label>
            <input
              type="number"
              placeholder="Max amount"
              value={filters.maxAmount}
              onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Payout Requests Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payout Requests</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Showing {filteredPayouts.length} of {payouts.length} requests
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Requested Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    <div className="animate-pulse">Loading payout requests...</div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-red-500">
                    Error: {error}
                  </td>
                </tr>
              ) : filteredPayouts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No payout requests found.
                  </td>
                </tr>
              ) : (
                filteredPayouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {payout.user?.name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {payout.user?.email || 'No email'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                      ₹{(payout.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(payout.status)}`}>
                        {getStatusIcon(payout.status)}
                        <span className="ml-1">{payout.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {payout.requestedAt ? new Date(payout.requestedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {payout.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleApprovePayout(payout.id)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeclinePayout(payout.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <XCircleIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setSelectedPayout(payout);
                            setShowDetailModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
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

      {/* Wallet Overview Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Member Wallet Overview</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Showing {filteredWallets.length} of {wallets.length} members
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Earned</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Pending Payouts</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Balance</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {filteredWallets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No wallet data found.
                  </td>
                </tr>
              ) : (
                filteredWallets.map((wallet) => (
                  <tr key={wallet.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {wallet.member}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {wallet.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      ₹{wallet.totalEarned.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 dark:text-yellow-400">
                      ₹{wallet.pendingPayouts.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                      ₹{wallet.totalPaid.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                      ₹{wallet.balance.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Detail Modal */}
      {showDetailModal && selectedPayout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payout Details</h3>
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
                <p className="text-sm text-gray-900 dark:text-white">{selectedPayout.user?.name || 'Unknown'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <p className="text-sm text-gray-900 dark:text-white">{selectedPayout.user?.email || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                <p className="text-sm font-bold text-gray-900 dark:text-white">₹{(selectedPayout.amount || 0).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedPayout.status)}`}>
                  {getStatusIcon(selectedPayout.status)}
                  <span className="ml-1">{selectedPayout.status}</span>
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Requested Date</label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {selectedPayout.requestedAt ? new Date(selectedPayout.requestedAt).toLocaleString() : 'N/A'}
                </p>
              </div>
              {selectedPayout.approvedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Approved Date</label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {new Date(selectedPayout.approvedAt).toLocaleString()}
                  </p>
                </div>
              )}
              {selectedPayout.declinedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Declined Date</label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {new Date(selectedPayout.declinedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
} 