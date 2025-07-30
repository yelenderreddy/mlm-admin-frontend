import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  PlusIcon, 
  FunnelIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  GiftIcon
} from '@heroicons/react/24/outline';
import { ADMIN_ENDPOINTS, getAdminHeaders } from '../api-endpoints';
import { logDebug, logError } from '../config';

export default function GiftManagement() {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    reward: 'All',
    status: 'All',
    member: '',
    dateFrom: '',
    dateTo: ''
  });
  const [summary, setSummary] = useState({
    totalGifts: 0,
    pendingGifts: 0,
    approvedGifts: 0,
    deliveredGifts: 0,
  });
  const [selectedGift, setSelectedGift] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    memberId: '',
    reward: '',
    criteria: '',
    date: '',
    status: 'Pending'
  });

  // Fetch gifts data
  const fetchGifts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      logDebug('Fetching gifts data');
      
      const response = await fetch(ADMIN_ENDPOINTS.GIFTS.LIST, {
        headers: getAdminHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logDebug('Gifts data received', data);
      
      setGifts(Array.isArray(data) ? data : []);
    } catch (err) {
      logError('Failed to fetch gifts', err);
      setError(err.message);
      setGifts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch gift statistics
  const fetchGiftStats = useCallback(async () => {
    try {
      logDebug('Fetching gift statistics');
      
      const response = await fetch(ADMIN_ENDPOINTS.GIFTS.STATS, {
        headers: getAdminHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logDebug('Gift stats received', data);
      
      setSummary({
        totalGifts: data.totalGifts || 0,
        pendingGifts: data.pendingGifts || 0,
        approvedGifts: data.approvedGifts || 0,
        deliveredGifts: data.deliveredGifts || 0,
      });
    } catch (err) {
      logError('Failed to fetch gift stats', err);
      // Don't set error for stats, just use defaults
    }
  }, []);

  // Handle gift actions
  const handleApprove = async (giftId) => {
    try {
      const response = await fetch(ADMIN_ENDPOINTS.GIFTS.APPROVE(giftId), {
        method: 'POST',
        headers: getAdminHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchGifts(); // Refresh data
      logDebug('Gift approved successfully');
    } catch (err) {
      logError('Failed to approve gift', err);
      alert('Failed to approve gift: ' + err.message);
    }
  };

  const handleReject = async (giftId) => {
    try {
      const response = await fetch(ADMIN_ENDPOINTS.GIFTS.REJECT(giftId), {
        method: 'POST',
        headers: getAdminHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchGifts(); // Refresh data
      logDebug('Gift rejected successfully');
    } catch (err) {
      logError('Failed to reject gift', err);
      alert('Failed to reject gift: ' + err.message);
    }
  };

  const handleDeliver = async (giftId) => {
    try {
      const response = await fetch(ADMIN_ENDPOINTS.GIFTS.DELIVER(giftId), {
        method: 'POST',
        headers: getAdminHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchGifts(); // Refresh data
      logDebug('Gift marked as delivered successfully');
    } catch (err) {
      logError('Failed to mark gift as delivered', err);
      alert('Failed to mark gift as delivered: ' + err.message);
    }
  };

  const handleViewDetails = async (gift) => {
    setSelectedGift(gift);
    setShowDetailModal(true);
  };

  const handleCreateGift = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(ADMIN_ENDPOINTS.GIFTS.CREATE, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchGifts(); // Refresh data
      setShowCreateModal(false);
      setFormData({ memberId: '', reward: '', criteria: '', date: '', status: 'Pending' });
      logDebug('Gift created successfully');
    } catch (err) {
      logError('Failed to create gift', err);
      alert('Failed to create gift: ' + err.message);
    }
  };

  // Filter logic
  const filteredGifts = gifts.filter((gift) => {
    const matchReward = filters.reward === 'All' || gift.reward === filters.reward;
    const matchStatus = filters.status === 'All' || gift.status === filters.status;
    const matchMember = !filters.member || 
      (gift.user && gift.user.name && gift.user.name.toLowerCase().includes(filters.member.toLowerCase()));
    const matchDateFrom = !filters.dateFrom || new Date(gift.date) >= new Date(filters.dateFrom);
    const matchDateTo = !filters.dateTo || new Date(gift.date) <= new Date(filters.dateTo);
    
    return matchReward && matchStatus && matchMember && matchDateFrom && matchDateTo;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Delivered': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getRewardTypes = () => {
    const types = [...new Set(gifts.map(g => g.reward))];
    return ['All', ...types];
  };

  useEffect(() => {
    fetchGifts();
    fetchGiftStats();
  }, [fetchGifts, fetchGiftStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 sm:p-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gift Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage physical rewards and gift redemptions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Gift
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <GiftIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Gifts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalGifts}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.pendingGifts}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.approvedGifts}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <TruckIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Delivered</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.deliveredGifts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow mb-6">
        <div className="flex items-center mb-4">
          <FunnelIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filters</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <select
            value={filters.reward}
            onChange={(e) => setFilters({ ...filters, reward: e.target.value })}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          >
            {getRewardTypes().map((type) => (
              <option key={type} value={type}>{type}</option>
          ))}
        </select>
          
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
        >
            {['All', 'Pending', 'Approved', 'Rejected', 'Delivered'].map((status) => (
              <option key={status} value={status}>{status}</option>
          ))}
        </select>
          
          <input
            type="text"
            placeholder="Search member..."
            value={filters.member}
            onChange={(e) => setFilters({ ...filters, member: e.target.value })}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          />
          
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          />
          
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
          <div className="flex">
            <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
            <span>Error: {error}</span>
          </div>
        </div>
      )}

      {/* Gifts Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Reward</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Criteria</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {filteredGifts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    {loading ? 'Loading gifts...' : 'No gifts found.'}
                  </td>
                </tr>
              ) : (
                filteredGifts.map((gift) => (
                  <tr key={gift.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {gift.user?.name || 'Unknown Member'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {gift.reward}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {gift.criteria}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(gift.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(gift.status)}`}>
                        {gift.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(gift)}
                          className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        {gift.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(gift.id)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            >
                              <CheckIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(gift.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {gift.status === 'Approved' && (
                          <button
                            onClick={() => handleDeliver(gift.id)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <TruckIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>

      {/* Gift Details Modal */}
      {showDetailModal && selectedGift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Gift Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Member</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedGift.user?.name || 'Unknown'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reward</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedGift.reward}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Criteria</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedGift.criteria}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{new Date(selectedGift.date).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <span className={`mt-1 inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedGift.status)}`}>
                  {selectedGift.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Gift Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Create New Gift</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateGift} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Member ID</label>
                <input
                  type="number"
                  value={formData.memberId}
                  onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reward</label>
                <input
                  type="text"
                  value={formData.reward}
                  onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Criteria</label>
                <input
                  type="text"
                  value={formData.criteria}
                  onChange={(e) => setFormData({ ...formData, criteria: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-md hover:bg-gray-200 dark:hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                >
                  Create Gift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
} 