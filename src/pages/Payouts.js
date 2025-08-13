import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  EyeIcon,
  ArrowPathIcon,
  ClockIcon,
  EllipsisVerticalIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import { ADMIN_ENDPOINTS, getAdminHeaders } from '../api-endpoints';
import { logDebug, logError } from '../config';

export default function Payouts({ setPayoutNotificationCount }) {
  const [redeemRequests, setRedeemRequests] = useState([]);
  const [selectedRedeemRequest, setSelectedRedeemRequest] = useState(null);
  const [showRedeemDetailModal, setShowRedeemDetailModal] = useState(false);
  const [showStatusUpdateModal, setShowStatusUpdateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [newStatus, setNewStatus] = useState('processing');
  const [paymentLoading, setPaymentLoading] = useState(false);



  // Fetch redeem requests
  const fetchRedeemRequests = useCallback(async () => {
    try {
      logDebug('Fetching redeem requests');
      
      const response = await fetch(ADMIN_ENDPOINTS.BANK_DETAILS.GET_ALL_WITH_USERS, {
        headers: getAdminHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logDebug('Redeem requests data received', data);
      
      if (data.statusCode === 200 && data.data) {
        // Filter only records with redeem amounts > 0
        const redeemData = data.data.filter(item => item.redeemAmount > 0);
        setRedeemRequests(redeemData);
        // Count pending payouts (not deposited)
        if (typeof setPayoutNotificationCount === 'function') {
          const pendingCount = redeemData.filter(item => item.redeemStatus !== 'deposited').length;
          setPayoutNotificationCount(pendingCount);
        }
      } else {
        setRedeemRequests([]);
        if (typeof setPayoutNotificationCount === 'function') {
          setPayoutNotificationCount(0);
        }
      }
    } catch (err) {
      logError('Failed to fetch redeem requests', err);
      setRedeemRequests([]);
    }
  }, [setPayoutNotificationCount]);



  // Load data on component mount
  useEffect(() => {
    fetchRedeemRequests();
  }, [fetchRedeemRequests]);

  // Handle redeem status update
  const handleUpdateRedeemStatus = async (userId, status) => {
    try {
      const response = await fetch(ADMIN_ENDPOINTS.BANK_DETAILS.UPDATE_REDEEM_STATUS(userId), {
        method: 'PUT',
        headers: {
          ...getAdminHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update local state
      setRedeemRequests(prevRequests => {
        const updated = prevRequests.map(request => 
          request.user.id === userId ? { ...request, redeemStatus: status } : request
        );
        // Update notification count after status change
        if (typeof setPayoutNotificationCount === 'function') {
          const pendingCount = updated.filter(item => item.redeemStatus !== 'deposited').length;
          setPayoutNotificationCount(pendingCount);
        }
        return updated;
      });

      setShowStatusUpdateModal(false);
      setSelectedRedeemRequest(null);
      logDebug('Redeem status updated successfully');
    } catch (err) {
      logError('Failed to update redeem status', err);
      alert('Failed to update redeem status. Please try again.');
    }
  };

  // Handle view redeem details
  const handleViewRedeemDetails = (redeemRequest) => {
    setSelectedRedeemRequest(redeemRequest);
    setShowRedeemDetailModal(true);
  };

  // Handle update status modal
  const handleUpdateStatus = (redeemRequest) => {
    setSelectedRedeemRequest(redeemRequest);
    setNewStatus(redeemRequest.redeemStatus);
    setShowStatusUpdateModal(true);
  };

  // Handle payment modal
  const handlePayment = (redeemRequest) => {
    setSelectedRedeemRequest(redeemRequest);
    setShowPaymentModal(true);
  };

  // Handle Razorpay payment
  const handleRazorpayPayment = async () => {
    if (!selectedRedeemRequest) return;
    
    try {
      setPaymentLoading(true);
      
      // Create Razorpay order
      const orderResponse = await fetch(ADMIN_ENDPOINTS.PAYMENTS.RAZORPAY.CREATE_ORDER, {
        method: 'POST',
        headers: {
          ...getAdminHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: selectedRedeemRequest.user.id,
          amount: selectedRedeemRequest.redeemAmount,
          receipt: `payout_${selectedRedeemRequest.id}_${Date.now()}`,
          notes: {
            type: 'admin_payout',
            redeem_request_id: selectedRedeemRequest.id.toString(),
            user_name: selectedRedeemRequest.user.name,
            purpose: 'Redeem payout'
          }
        })
      });

      if (!orderResponse.ok) {
        throw new Error(`Failed to create payment order: ${orderResponse.status}`);
      }

      const orderData = await orderResponse.json();
      
      if (orderData.statusCode !== 201) {
        throw new Error(orderData.message || 'Failed to create payment order');
      }

      const order = orderData.data;
      
              // Initialize Razorpay payment
        const options = {
          key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_JNLEoGZvX3AWac', // Use your Razorpay key
          amount: order.amount,
        currency: order.currency || 'INR',
        name: 'CamelQ Software Solutions',
        description: `Payout for ${selectedRedeemRequest.user.name}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            // Payment successful - update redeem status to deposited
            await handleUpdateRedeemStatus(selectedRedeemRequest.user.id, 'deposited');
            setShowPaymentModal(false);
            setSelectedRedeemRequest(null);
            logDebug('Payment successful', response);
          } catch (error) {
            logError('Failed to update redeem status after payment', error);
            alert('Payment successful but failed to update status. Please update manually.');
          }
        },
        prefill: {
          name: selectedRedeemRequest.user.name,
          email: selectedRedeemRequest.user.email,
          contact: selectedRedeemRequest.user.mobileNumber
        },
        theme: {
          color: '#7c3aed'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      logError('Payment initialization failed', error);
      alert('Failed to initialize payment. Please try again.');
    } finally {
      setPaymentLoading(false);
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Redeem Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage member redeem requests</p>
        </div>
        <button
          onClick={() => fetchRedeemRequests()}
          className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Refresh
        </button>
      </div>







      {/* Redeem Requests Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Redeem Requests</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Showing {redeemRequests.length} redeem requests
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Referral Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {redeemRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No redeem requests found.
                  </td>
                </tr>
              ) : (
                redeemRequests.map((redeemRequest) => (
                  <tr key={redeemRequest.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {redeemRequest.user?.name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {redeemRequest.user?.email || 'No email'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                      ₹{redeemRequest.redeemAmount?.toLocaleString() || '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <span className="font-mono bg-gray-100 dark:bg-slate-600 px-2 py-1 rounded text-xs">
                          {redeemRequest.user?.referral_code || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        redeemRequest.redeemStatus === 'deposited' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                      }`}>
                        {redeemRequest.redeemStatus === 'deposited' ? (
                          <CheckCircleIcon className="w-3 h-3 mr-1" />
                        ) : (
                          <ClockIcon className="w-3 h-3 mr-1" />
                        )}
                        {redeemRequest.redeemStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewRedeemDetails(redeemRequest)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="View Details"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(redeemRequest)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title="Update Status"
                        >
                          <EllipsisVerticalIcon className="w-4 h-4" />
                        </button>
                        {redeemRequest.redeemStatus !== 'deposited' && (
                          <button
                            onClick={() => handlePayment(redeemRequest)}
                            className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                            title="Pay via Razorpay"
                          >
                            <CreditCardIcon className="w-4 h-4" />
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





      {/* Redeem Detail Modal */}
      {showRedeemDetailModal && selectedRedeemRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Redeem Request Details</h3>
              <button
                onClick={() => setShowRedeemDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User Details */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2">User Details</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedRedeemRequest.user?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedRedeemRequest.user?.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mobile Number</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedRedeemRequest.user?.mobileNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Referral Code</label>
                  <p className="text-sm text-gray-900 dark:text-white font-mono">{selectedRedeemRequest.user?.referral_code || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Referral Count</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedRedeemRequest.user?.referralCount || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Wallet Balance</label>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">₹{selectedRedeemRequest.user?.wallet_balance?.toLocaleString() || '0'}</p>
                </div>
              </div>

              {/* Bank Details */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2">Bank Details</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Holder</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedRedeemRequest.accountHolderName || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bank Name</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedRedeemRequest.bankName || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Number</label>
                  <p className="text-sm text-gray-900 dark:text-white font-mono">{selectedRedeemRequest.accountNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">IFSC Code</label>
                  <p className="text-sm text-gray-900 dark:text-white font-mono">{selectedRedeemRequest.ifscCode || 'N/A'}</p>
                </div>
              </div>

              {/* Redeem Details */}
              <div className="md:col-span-2 space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2">Redeem Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Redeem Amount</label>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">₹{selectedRedeemRequest.redeemAmount?.toLocaleString() || '0'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                      selectedRedeemRequest.redeemStatus === 'deposited' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                    }`}>
                      {selectedRedeemRequest.redeemStatus === 'deposited' ? (
                        <CheckCircleIcon className="w-3 h-3 mr-1" />
                      ) : (
                        <ClockIcon className="w-3 h-3 mr-1" />
                      )}
                      {selectedRedeemRequest.redeemStatus}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Request Date</label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedRedeemRequest.created_at ? new Date(selectedRedeemRequest.created_at).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusUpdateModal && selectedRedeemRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Update Redeem Status</h3>
              <button
                onClick={() => setShowStatusUpdateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">User</label>
                <p className="text-sm text-gray-900 dark:text-white">{selectedRedeemRequest.user?.name || 'Unknown'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount</label>
                <p className="text-sm font-bold text-gray-900 dark:text-white">₹{selectedRedeemRequest.redeemAmount?.toLocaleString() || '0'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Status</label>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                  selectedRedeemRequest.redeemStatus === 'deposited' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                }`}>
                  {selectedRedeemRequest.redeemStatus}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                >
                  <option value="processing">Processing</option>
                  <option value="deposited">Deposited</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handleUpdateRedeemStatus(selectedRedeemRequest.user.id, newStatus)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Update Status
                </button>
                <button
                  onClick={() => setShowStatusUpdateModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedRedeemRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Process Payment</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">User</label>
                <p className="text-sm text-gray-900 dark:text-white">{selectedRedeemRequest.user?.name || 'Unknown'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount to Pay</label>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">₹{selectedRedeemRequest.redeemAmount?.toLocaleString() || '0'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CreditCardIcon className="w-4 h-4" />
                  Razorpay Payment Gateway
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> This will open Razorpay payment gateway. After successful payment, the redeem status will automatically update to "deposited".
                </p>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleRazorpayPayment}
                  disabled={paymentLoading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {paymentLoading ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCardIcon className="w-4 h-4" />
                      Pay Now
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
} 