import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ActionMenu from "./ActionMenu";
import { BASE_URL } from '../config';
import { logDebug, logError } from '../config';

const statusColors = {
  Active: "bg-green-100 text-green-700",
  Suspended: "bg-red-100 text-red-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Inactive: "bg-gray-100 text-gray-700",
};

export default function Members() {
  const [filters, setFilters] = useState({
    name: "",
    email: "",
    phone: "",
    referralCode: "",
    status: "",
  });
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [resetPasswordModal, setResetPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [milestones, setMilestones] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(3);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  ///delete/:id
  // Fetch milestones (unchanged)
  const fetchMilestones = useCallback(async () => {
    try {
      const params = new URLSearchParams({ active: 'true', sortBy: 'referralCount', sortDir: 'asc' });
      // You may want to update this endpoint as well if needed
      const response = await fetch(`${BASE_URL}/api/admin/milestones?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setMilestones(Array.isArray(data) ? data : []);
    } catch (err) {
      setMilestones([]);
    }
  }, []);

  // Fetch members from new API
  const fetchMembers = useCallback(async (pageNum = 1, limitNum = 3) => {
    try {
      setLoading(true);
      setError(null);
      logDebug('Fetching members');
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${BASE_URL}/api/users/all?page=${pageNum}&limit=${limitNum}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      logDebug('Members data received', data);
      const users = data.data?.users || [];
      setMembers(users.map(user => ({
        id: user.id,
        name: user.name || 'N/A',
        email: user.email || 'N/A',
        phone: user.mobileNumber || 'N/A',
        referralCode: user.referral_code || 'N/A',
        status: user.payment_status || 'Active',
        wallet: user.walletBalance || 0,
        referralCount: user.referralCount || 0,
        joinedOn: user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A',
        role: user.role || 'USER',
        isActive: user.isActive !== false,
      })));
      setTotalPages(data.data?.totalPages || 1);
      setTotal(data.data?.total || 0);
      setPage(data.data?.page || 1);
      setPageSize(data.data?.pageSize || limitNum);
    } catch (err) {
      logError('Failed to fetch members', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMilestones(); }, [fetchMilestones]);
  useEffect(() => { fetchMembers(page, pageSize); }, [fetchMembers, page, pageSize]);

  // Pagination controls
  const handlePrevPage = () => setPage(p => Math.max(1, p - 1));
  const handleNextPage = () => setPage(p => Math.min(totalPages, p + 1));

  // Update member status
  const handleSuspendActivate = async (member) => {
    try {
      const newStatus = member.status === "Active" ? "Suspended" : "Active";
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${BASE_URL}/api/admin/users/status/${member.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      setMembers(members.map(m => m.id === member.id ? { ...m, status: newStatus } : m));
    } catch (err) {
      logError('Failed to update member status', err);
    }
  };

  // Confirm reset password
  const confirmResetPassword = async () => {
    if (!selectedMember || !newPassword.trim()) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${BASE_URL}/api/admin/users/${selectedMember.id}/reset-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword })
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      setResetPasswordModal(false);
      setNewPassword("");
      setSelectedMember(null);
    } catch (err) {
      logError('Failed to reset password', err);
    }
  };

// Delete member
const handleDelete = async (memberId) => {
  if (!window.confirm("Are you sure you want to delete this member?")) return;
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${BASE_URL}/api/users/delete/${memberId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(result?.message || `HTTP error! status: ${response.status}`);
    }
    // remove from ui state
    setMembers(prev => prev.filter(m => m.id !== memberId));
    alert(result?.message || "Member deleted successfully");
  } catch (err) {
    logError('Failed to delete member', err);
    alert(err.message || "Delete failed");
  }
};




  // Filter logic (unchanged)
  const filteredMembers = members.filter((m) => {
    return (
      (!filters.name || m.name.toLowerCase().includes(filters.name.toLowerCase())) &&
      (!filters.email || m.email.toLowerCase().includes(filters.email.toLowerCase())) &&
      (!filters.phone || m.phone.includes(filters.phone)) &&
      (!filters.referralCode || m.referralCode.toLowerCase().includes(filters.referralCode.toLowerCase())) &&
      (!filters.status || m.status === filters.status)
    );
  });

  // Helper: Get milestone progress for a user
  const getMilestoneProgress = (user) => {
    if (!milestones.length) return { achieved: [], pending: [] };
    const achieved = milestones.filter(m => user.referralCount >= m.referralCount);
    const pending = milestones.filter(m => user.referralCount < m.referralCount);
    return { achieved, pending };
  };

  // Helper: Get next milestone progress percentage
  const getNextMilestoneProgress = (user) => {
    if (!milestones.length) return 0;
    const nextMilestone = milestones.find(m => user.referralCount < m.referralCount);
    if (!nextMilestone) return 100; // All milestones achieved
    const prevMilestone = milestones.filter(m => m.referralCount < nextMilestone.referralCount).pop();
    const start = prevMilestone ? prevMilestone.referralCount : 0;
    const end = nextMilestone.referralCount;
    const progress = ((user.referralCount - start) / (end - start)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  // Profile Modal
  const ProfileModal = () => (
    <AnimatePresence>
      {showProfileModal && selectedMember && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowProfileModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">Member Profile</h3>
            <div className="space-y-3">
              <div><strong>Name:</strong> {selectedMember.name}</div>
              <div><strong>Email:</strong> {selectedMember.email}</div>
              <div><strong>Phone:</strong> {selectedMember.phone}</div>
              <div><strong>Referral Code:</strong> {selectedMember.referralCode}</div>
              <div><strong>Status:</strong> 
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${statusColors[selectedMember.status]}`}>
                  {selectedMember.status}
                </span>
              </div>
              <div><strong>Wallet Balance:</strong> ₹{selectedMember.wallet}</div>
              <div><strong>Referral Count:</strong> {selectedMember.referralCount}</div>
              <div><strong>Joined On:</strong> {selectedMember.joinedOn}</div>
              <div><strong>Role:</strong> {selectedMember.role}</div>
              
              {/* Milestone Progress Section */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-600">
                <h4 className="font-semibold mb-2">Milestone Progress</h4>
                <div className="space-y-2">
                  {getMilestoneProgress(selectedMember).achieved.map((milestone) => (
                    <div key={milestone.id} className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-sm text-green-700 dark:text-green-400">{milestone.name} - {milestone.prize}</span>
                    </div>
                  ))}
                  {getMilestoneProgress(selectedMember).pending.map((milestone) => (
                    <div key={milestone.id} className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                      <span className="text-sm text-gray-500">{milestone.name} - {milestone.prize}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowProfileModal(false)}
              className="mt-6 w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Reset Password Modal
  const ResetPasswordModal = () => (
    <AnimatePresence>
      {resetPasswordModal && selectedMember && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setResetPasswordModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">Reset Password</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Reset password for {selectedMember.name} ({selectedMember.email})
            </p>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={confirmResetPassword}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
              >
                Reset Password
              </button>
              <button
                onClick={() => {
                  setResetPasswordModal(false);
                  setNewPassword("");
                  setSelectedMember(null);
                }}
                className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (error) {
    return (
      <div className="p-4 sm:p-8 max-w-7xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Members Management</h1>
        <p className="text-slate-600 dark:text-slate-400">Manage all registered members and their accounts</p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search by name..."
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          />
          <input
            type="text"
            placeholder="Search by email..."
            value={filters.email}
            onChange={(e) => setFilters({ ...filters, email: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          />
          <input
            type="text"
            placeholder="Search by phone..."
            value={filters.phone}
            onChange={(e) => setFilters({ ...filters, phone: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          />
          <input
            type="text"
            placeholder="Search by referral code..."
            value={filters.referralCode}
            onChange={(e) => setFilters({ ...filters, referralCode: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Pending">Pending</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-left">Email</th>
                <th className="py-3 px-4 text-left">Phone</th>
                <th className="py-3 px-4 text-left">Referral Code</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Joined On</th>
                <th className="py-3 px-4 text-center">Milestone Progress</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500">
                    <div className="animate-pulse">Loading members...</div>
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500">No members found.</td>
                </tr>
              ) : (
                filteredMembers.map((m) => (
                  <motion.tr
                    key={m.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-200">{m.name}</div>
                        <div className="text-sm text-slate-500">₹{m.wallet}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-900 dark:text-slate-200">{m.email}</td>
                    <td className="py-3 px-4 text-slate-900 dark:text-slate-200">{m.phone}</td>
                    <td className="py-3 px-4">
                      <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {m.referralCode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[m.status]}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">{m.joinedOn}</td>
                    <td className="py-3 px-4">
                      <div className="space-y-2">
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${getNextMilestoneProgress(m)}%` }}
                          ></div>
                        </div>
                        {/* Milestone Badges */}
                        <div className="flex flex-wrap gap-1">
                          {getMilestoneProgress(m).achieved.slice(0, 2).map((milestone) => (
                            <span key={milestone.id} className="bg-green-100 text-green-800 text-xs font-medium px-1.5 py-0.5 rounded">
                              {milestone.name}
                            </span>
                          ))}
                          {getMilestoneProgress(m).achieved.length > 2 && (
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-1.5 py-0.5 rounded">
                              +{getMilestoneProgress(m).achieved.length - 2}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {m.referralCount} referrals
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <ActionMenu
                        onView={() => {
                          setSelectedMember(m);
                          setShowProfileModal(true);
                        }}
                        onSuspend={() => handleSuspendActivate(m)}
                        onResetPassword={() => {
                          setSelectedMember(m);
                          setResetPasswordModal(true);
                        }}
                        onDelete={() => handleDelete(m.id)}
                        member={m}
                      />
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProfileModal />
      <ResetPasswordModal />
      <div className="flex justify-between items-center my-4">
        <button onClick={handlePrevPage} disabled={page === 1} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Previous</button>
        <span>Page {page} of {totalPages} (Total: {total})</span>
        <button onClick={handleNextPage} disabled={page === totalPages} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Next</button>
      </div>
    </div>
  );
} 