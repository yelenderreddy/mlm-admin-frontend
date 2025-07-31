import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { ADMIN_ENDPOINTS, getAdminHeaders } from '../api-endpoints';
import { logDebug, logError } from '../config';

// Default tree structure when no data is available
const defaultTree = {
  id: 0,
  name: "No Data Available",
  joinDate: "N/A",
  totalReferrals: 0,
  wallet: 0,
  children: [],
};

function TreeNode({ node, level = 1, maxLevel = 4 }) {
  const [expanded, setExpanded] = useState(level < 3); // expand first 2 levels by default
  const nodeRef = useRef();
  const childrenRefs = useRef([]);

  return (
    <div className="relative flex flex-col items-center group" data-treenode ref={nodeRef}>
      {/* Node Card */}
      <motion.div
        layout
        className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 mb-2 border-2 border-purple-200 dark:border-slate-700 min-w-[220px] max-w-xs w-full relative z-10 transition-transform duration-200 group-hover:scale-105`}
        whileHover={{ boxShadow: "0 8px 32px 0 rgba(139, 92, 246, 0.15)" }}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-400 flex items-center justify-center text-white font-bold text-lg shadow-md">
            {node.name ? node.name[0].toUpperCase() : '?'}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-purple-700 dark:text-purple-300">{node.name || 'Unknown'}</div>
            <div className="text-xs text-slate-500 dark:text-slate-300">Joined: {node.joinDate || 'N/A'}</div>
            <div className="text-xs text-slate-500 dark:text-slate-300">Referrals: {node.totalReferrals || 0}</div>
            <div className="text-xs text-slate-500 dark:text-slate-300">Wallet: ₹{node.wallet || 0}</div>
            {node.email && (
              <div className="text-xs text-slate-500 dark:text-slate-300">Email: {node.email}</div>
            )}
            {node.mobileNumber && (
              <div className="text-xs text-slate-500 dark:text-slate-300">Mobile: {node.mobileNumber}</div>
            )}
            {node.referralCode && (
              <div className="text-xs text-slate-500 dark:text-slate-300">Code: {node.referralCode}</div>
            )}
            {node.status && (
              <div className="text-xs text-slate-500 dark:text-slate-300">
                Status: <span className={`px-1 py-0.5 rounded text-xs ${
                  node.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>{node.status}</span>
              </div>
            )}
          </div>
          {node.children && node.children.length > 0 && level < maxLevel && (
            <button
              className="ml-2 px-2 py-1 text-xs rounded bg-purple-100 dark:bg-slate-700 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-slate-600 transition"
              onClick={() => setExpanded((e) => !e)}
              title={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              )}
            </button>
          )}
        </div>
      </motion.div>
      {/* Children nodes */}
      <AnimatePresence>
        {expanded && node.children && node.children.length > 0 && level < maxLevel && (
          <motion.div
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-row gap-8 mt-6 relative" data-children-row>
            {node.children.map((child, idx) => (
              <div
                key={child.id}
                className="flex flex-col items-center relative"
                data-treenode
                ref={el => childrenRefs.current[idx] = el}
              >
                <TreeNode node={child} level={level + 1} maxLevel={maxLevel} />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ReferralTree() {
  const [search, setSearch] = useState("");
  const [root, setRoot] = useState(defaultTree);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const treeRef = useRef();

  // Fetch referral tree for a specific user
  const fetchReferralTree = useCallback(async (userId) => {
    try {
      setLoading(true);
      setError(null);
      
      logDebug(`Fetching referral tree for user ${userId}`);
      
      const response = await fetch(ADMIN_ENDPOINTS.REFERRAL_TREE(userId), {
        headers: getAdminHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logDebug('Referral tree data received', data);
      
      // Transform API data to match our tree structure
      const transformNode = (node) => ({
        id: node.id,
        name: node.name || 'Unknown',
        email: node.email,
        joinDate: node.createdAt ? new Date(node.createdAt).toLocaleDateString() : 'N/A',
        totalReferrals: node.referralCount || node.totalReferrals || 0,
        wallet: node.walletBalance || node.wallet || 0,
        children: node.children ? node.children.map(transformNode) : [],
        referralCode: node.referralCode,
        status: node.status,
        role: node.role,
      });

      const transformedTree = transformNode(data);
      setRoot(transformedTree);
    } catch (err) {
      logError('Failed to fetch referral tree', err);
      setError(err.message);
      setRoot(defaultTree);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch users by referral code
  const fetchUsersByReferralCode = useCallback(async (referralCode) => {
    try {
      setLoading(true);
      setError(null);
      
      logDebug(`Fetching users referred by ${referralCode}`);
      
      const response = await fetch(ADMIN_ENDPOINTS.USERS.REFERRED_BY(referralCode), {
        headers: getAdminHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logDebug('Users referred by code data received', data);
      
      if (data.data && data.data.length > 0) {
        // Create a tree structure from the referred users
        const referredUsers = data.data.map(user => ({
          id: user.id,
          name: user.name || 'Unknown',
          email: user.email,
          joinDate: user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A',
          totalReferrals: user.referralCount || 0,
          wallet: 0, // Default wallet value
          children: [], // No children for now
          referralCode: user.referral_code,
          status: user.payment_status,
          mobileNumber: user.mobileNumber,
          address: user.address,
          gender: user.gender,
          referredByCode: user.referred_by_code,
        }));

        // Create a root node with the referral code
        const rootNode = {
          id: 0,
          name: `Referral Code: ${referralCode}`,
          email: '',
          joinDate: 'N/A',
          totalReferrals: referredUsers.length,
          wallet: 0,
          children: referredUsers,
          referralCode: referralCode,
          status: 'ACTIVE',
        };

        setRoot(rootNode);
      } else {
        setRoot({
          ...defaultTree,
          name: `No users found for referral code: ${referralCode}`,
        });
      }
    } catch (err) {
      logError('Failed to fetch users by referral code', err);
      setError(err.message);
      setRoot(defaultTree);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search for users
  const searchUsers = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      logDebug(`Searching for users with query: ${query}`);
      
      const response = await fetch(`${ADMIN_ENDPOINTS.USERS.LIST}?search=${encodeURIComponent(query)}`, {
        headers: getAdminHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logDebug('Search results received', data);
      
      setSearchResults(data.slice(0, 5)); // Limit to 5 results
      setShowSearchResults(true);
    } catch (err) {
      logError('Failed to search users', err);
      setSearchResults([]);
    }
  }, []);

  // Handle search input changes
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    
    if (value.trim()) {
      searchUsers(value);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      // Check if the search looks like a referral code (alphanumeric, 8 characters)
      const isReferralCode = /^[A-Za-z0-9]{8}$/.test(search.trim());
      
      if (isReferralCode) {
        // Search by referral code
        fetchUsersByReferralCode(search.trim());
      } else {
        // Search by user name/email
        searchUsers(search);
      }
    }
  };

  // Select a user from search results
  const selectUser = (user) => {
    setSearch(user.name);
    setShowSearchResults(false);
    fetchReferralTree(user.id);
  };

  // Load default tree on component mount
  useEffect(() => {
    // You can set a default user ID here or load the first user
    // For now, we'll show the default tree
    setRoot(defaultTree);
  }, []);

  // Export as image
  const handleExportImage = async () => {
    if (treeRef.current) {
      try {
        const canvas = await html2canvas(treeRef.current);
        const link = document.createElement("a");
        link.download = `referral-tree-${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL();
        link.click();
      } catch (err) {
        logError('Failed to export image', err);
        alert('Failed to export image. Please try again.');
      }
    }
  };

  // Export as PDF
  const handleExportPDF = async () => {
    if (treeRef.current) {
      try {
        const canvas = await html2canvas(treeRef.current);
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({ orientation: "landscape" });
        const width = pdf.internal.pageSize.getWidth();
        const height = (canvas.height * width) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 10, width, height);
        pdf.save(`referral-tree-${new Date().toISOString().split('T')[0]}.pdf`);
      } catch (err) {
        logError('Failed to export PDF', err);
        alert('Failed to export PDF. Please try again.');
      }
    }
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Referral Tree</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExportImage}
            disabled={loading}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:scale-105 transition-transform duration-200 text-sm disabled:opacity-50"
          >
            Export Image
          </button>
          <button
            onClick={handleExportPDF}
            disabled={loading}
            className="bg-gradient-to-r from-indigo-600 to-purple-500 text-white px-4 py-2 rounded-lg font-semibold shadow hover:scale-105 transition-transform duration-200 text-sm disabled:opacity-50"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 relative">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search member by name, email, or referral code (8 characters)"
              value={search}
              onChange={handleSearchChange}
              className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 w-full"
            />
            {/* Search Results Dropdown */}
            <AnimatePresence>
              {showSearchResults && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50 mt-1"
                >
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => selectUser(user)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-slate-700 border-b border-gray-100 dark:border-slate-700 last:border-b-0"
                    >
                      <div className="font-medium text-slate-800 dark:text-slate-200">{user.name}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{user.email}</div>
                      {user.referralCode && (
                        <div className="text-xs text-slate-400 dark:text-slate-500">Code: {user.referralCode}</div>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-purple-700 transition text-sm disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Search'}
          </button>
        </form>
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

      {/* Tree Visualization */}
      <div ref={treeRef} className="w-full overflow-x-auto pb-4">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-slate-600 dark:text-slate-400">Loading referral tree...</span>
          </div>
        ) : (
          <div className="flex justify-center min-w-[600px]">
            <TreeNode node={root} />
          </div>
        )}
      </div>

      {/* Instructions */}
      {!loading && root.id === 0 && (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <p>Search for a member to view their referral tree</p>
          <p className="text-sm mt-2">Enter a member's name, email, or referral code above</p>
        </div>
      )}
    </div>
  );
} 