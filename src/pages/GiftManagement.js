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
  const [rewardTargets, setRewardTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    reward: 'All',
    referralCount: 'All',
    dateFrom: '',
    dateTo: ''
  });
  const [summary, setSummary] = useState({
    totalTargets: 0,
    activeTargets: 0,
    totalRewards: 0,
    averageReferralCount: 0,
  });
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    referralCount: '',
    reward: '',
    target: ''
  });

  // Fetch reward targets data
  const fetchRewardTargets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      logDebug('Fetching reward targets data');
      
      const response = await fetch(ADMIN_ENDPOINTS.REWARD_TARGETS.LIST, {
        headers: getAdminHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logDebug('Reward targets data received', data);
      
      setRewardTargets(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      logError('Failed to fetch reward targets', err);
      setError(err.message);
      setRewardTargets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch reward targets statistics
  const fetchRewardTargetStats = useCallback(async () => {
    try {
      logDebug('Fetching reward targets statistics');
      
      // Calculate stats from the data we have
      const totalTargets = rewardTargets.length;
      const totalRewards = rewardTargets.reduce((sum, target) => sum + parseInt(target.reward || 0), 0);
      const averageReferralCount = totalTargets > 0 
        ? rewardTargets.reduce((sum, target) => sum + target.referralCount, 0) / totalTargets 
        : 0;
      
      setSummary({
        totalTargets,
        activeTargets: totalTargets, // All targets are considered active
        totalRewards,
        averageReferralCount: Math.round(averageReferralCount),
      });
    } catch (err) {
      logError('Failed to fetch reward targets stats', err);
      // Don't set error for stats, just use defaults
    }
  }, [rewardTargets]);

  // Handle reward target actions
  const handleDelete = async (targetId) => {
    try {
      const response = await fetch(ADMIN_ENDPOINTS.REWARD_TARGETS.DELETE(targetId), {
        method: 'DELETE',
        headers: getAdminHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchRewardTargets(); // Refresh data
      logDebug('Reward target deleted successfully');
    } catch (err) {
      logError('Failed to delete reward target', err);
      alert('Failed to delete reward target: ' + err.message);
    }
  };

  const handleViewDetails = async (target) => {
    setSelectedTarget(target);
    setShowDetailModal(true);
  };

  const handleCreateRewardTarget = async (e) => {
    e.preventDefault();
    try {
      // Check if token exists
      const token = localStorage.getItem("adminToken");
      
      if (!token) {
        alert('Authentication token not found. Please login again.');
        window.location.href = '/login';
        return;
      }

      // Convert form data to correct types
      const payload = {
        referralCount: parseInt(formData.referralCount, 10),
        reward: formData.reward,
        target: formData.target
      };

      // Validate the data
      if (isNaN(payload.referralCount) || payload.referralCount <= 0) {
        alert('Please enter a valid referral count (must be a positive number)');
        return;
      }

      if (!payload.reward || payload.reward.trim() === '') {
        alert('Please enter a reward amount');
        return;
      }

      if (!payload.target || payload.target.trim() === '') {
        alert('Please enter a target description');
        return;
      }

      const headers = getAdminHeaders();
      
      const response = await fetch(ADMIN_ENDPOINTS.REWARD_TARGETS.CREATE, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      await response.json(); // Response not used, just await for completion

      await fetchRewardTargets(); // Refresh data
      setShowCreateModal(false);
      setFormData({ referralCount: '', reward: '', target: '' });
    } catch (err) {
      console.error('Failed to create reward target', err);
      alert('Failed to create reward target: ' + err.message);
    }
  };

  // Filter logic
  const filteredTargets = rewardTargets.filter((target) => {
    const matchReward = filters.reward === 'All' || target.reward === filters.reward;
    const matchReferralCount = filters.referralCount === 'All' || target.referralCount.toString() === filters.referralCount;
    const matchDateFrom = !filters.dateFrom || new Date(target.created_at) >= new Date(filters.dateFrom);
    const matchDateTo = !filters.dateTo || new Date(target.created_at) <= new Date(filters.dateTo);
    
    return matchReward && matchReferralCount && matchDateFrom && matchDateTo;
  });

  const getRewardTypes = () => {
    const types = [...new Set(rewardTargets.map(t => t.reward))];
    return ['All', ...types];
  };

  const getReferralCounts = () => {
    const counts = [...new Set(rewardTargets.map(t => t.referralCount.toString()))];
    return ['All', ...counts];
  };

  useEffect(() => {
    fetchRewardTargets();
  }, [fetchRewardTargets]);

  useEffect(() => {
    fetchRewardTargetStats();
  }, [fetchRewardTargetStats]);

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reward Targets Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage reward targets and referral goals</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Target
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <GiftIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Targets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalTargets}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Targets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.activeTargets}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Rewards</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{summary.totalRewards}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <TruckIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Referrals</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.averageReferralCount}</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            value={filters.referralCount}
            onChange={(e) => setFilters({ ...filters, referralCount: e.target.value })}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          >
            {getReferralCounts().map((count) => (
              <option key={count} value={count}>{count}</option>
            ))}
          </select>
          
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

      {/* Reward Targets Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Referral Count</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Reward</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Target</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {filteredTargets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    {loading ? 'Loading reward targets...' : 'No reward targets found.'}
                  </td>
                </tr>
              ) : (
                filteredTargets.map((target) => (
                  <tr key={target.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      #{target.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {target.referralCount} referrals
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      ₹{target.reward}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="max-w-xs truncate" title={target.target}>
                        {target.target}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(target.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(target)}
                          className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                          title="View Details"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(target.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete Target"
                        >
                          <XMarkIcon className="w-4 h-4" />
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

      {/* Reward Target Details Modal */}
      {showDetailModal && selectedTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Reward Target Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target ID</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">#{selectedTarget.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Referral Count</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedTarget.referralCount} referrals</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reward</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">₹{selectedTarget.reward}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Description</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedTarget.target}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Created Date</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{new Date(selectedTarget.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Reward Target Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Create New Reward Target</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateRewardTarget} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Referral Count</label>
                <input
                  type="number"
                  value={formData.referralCount}
                  onChange={(e) => setFormData({ ...formData, referralCount: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
                  placeholder="e.g., 5"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reward Amount</label>
                <input
                  type="text"
                  value={formData.reward}
                  onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
                  placeholder="e.g., 500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Description</label>
                <textarea
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
                  placeholder="e.g., do 5 referals in a day to earn 500 reward"
                  rows={3}
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
                  Create Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
} 