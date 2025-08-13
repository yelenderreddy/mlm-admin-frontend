import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts";
import { ADMIN_ENDPOINTS, getAdminHeaders } from '../api-endpoints';
import { logDebug, logError } from '../config';

// Summary Cards Component
function SummaryCard({ label, value, icon, color, loading = false }) {
  return (
    <motion.div
      whileHover={{ scale: 1.04, boxShadow: "0 4px 24px 0 rgba(139,92,246,0.10)" }}
      whileTap={{ scale: 0.97 }}
      className="flex items-center gap-4 bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-white/40 dark:border-slate-700 shadow-lg backdrop-blur-md p-5 min-w-[180px] w-full min-h-[140px] h-auto transition-all duration-300 hover:shadow-2xl hover:bg-white/80 dark:hover:bg-slate-800/80 animated-gradient justify-center"
      style={{ boxShadow: '0 2px 16px 0 rgba(139,92,246,0.08)' }}
    >
      <div className={`flex items-center justify-center h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500/80 to-indigo-500/80 shadow-lg ring-2 ring-purple-200/40 text-3xl`}>
        <span className="text-2xl drop-shadow">{icon}</span>
      </div>
      <div>
        <div className="text-2xl font-extrabold text-slate-800 dark:text-white leading-tight">
          {loading ? (
            <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-8 w-20 rounded"></div>
          ) : (
            value
          )}
        </div>
        <div className="text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wide mt-1">{label}</div>
      </div>
    </motion.div>
  );
}

// Charts Section Component
function ChartsSection({ dailyJoinsData, giftPoolData, pieData, loading = false }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
              <div className="h-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Line Chart: Daily Joins */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
        <div className="font-semibold mb-2 text-slate-700 dark:text-slate-200">Daily Join Trend</div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={dailyJoinsData}>
            <XAxis dataKey="date" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip />
            <Line type="monotone" dataKey="joins" stroke="#8B5CF6" strokeWidth={3} dot={true} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Bar Chart: Gift Pool */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
        <div className="font-semibold mb-2 text-slate-700 dark:text-slate-200">Gift Pool Collection</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={giftPoolData}>
            <XAxis dataKey="date" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="pool" fill="#6366F1" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Pie Chart: Gift Pool Distribution */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4 flex flex-col items-center">
        <div className="font-semibold mb-2 text-slate-700 dark:text-slate-200">Gift Pool Distribution</div>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={60}
              label
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-2 mt-2 justify-center">
          {pieData.map((entry) => (
            <span key={entry.name} className="flex items-center gap-1 text-xs">
              <span className="inline-block w-3 h-3 rounded-full" style={{ background: entry.color }}></span>
              {entry.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Activity Feed Component
function ActivityFeed({ activities, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4 mt-6">
        <div className="font-semibold mb-2 text-slate-700 dark:text-slate-200">Latest Activity</div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <div className="h-6 w-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded flex-1"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4 mt-6">
      <div className="font-semibold mb-2 text-slate-700 dark:text-slate-200">Latest Activity</div>
      {activities && activities.length > 0 ? (
        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
          {activities.map((item, idx) => (
            <li key={idx} className="flex items-center gap-3 py-3">
              <span className={`text-lg ${item.color}`}>{item.icon}</span>
              <span className={`text-sm ${item.color}`}>{item.text}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-gray-500 dark:text-gray-400 text-sm py-4">No recent activity</div>
      )}
    </div>
  );
}

// Main Dashboard Component
function Dashboard() {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  // Combined fetch function to get all dashboard data at once
  const fetchAllDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch dashboard stats from the new admin endpoint
      const dashboardResponse = await fetch(ADMIN_ENDPOINTS.DASHBOARD, { 
        headers: getAdminHeaders() 
      });

      if (!dashboardResponse.ok) {
        throw new Error(`Dashboard API error: ${dashboardResponse.status}`);
      }

      const dashboardData = await dashboardResponse.json();
      
      // Extract data from the response
      const combinedData = {
        ...dashboardData.data, // The actual stats are in the data property
        // Additional data can be added here if needed
      };

      logDebug('Dashboard data received', combinedData);
      
      setDashboardStats(combinedData);

    } catch (err) {
      logError('Failed to fetch dashboard data', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Single useEffect to fetch data on component mount
  useEffect(() => {
    fetchAllDashboardData();
  }, [fetchAllDashboardData]);

  // Prepare summary cards data
  const summaryCards = [
    { 
      label: "Total Members", 
      value: dashboardStats?.totalUsers?.toLocaleString() || "0", 
      icon: "👥", 
      color: "bg-blue-100 text-blue-600" 
    },
    { 
      label: "Daily Joins", 
      value: dashboardStats?.todayJoins || "0", 
      icon: "📈", 
      color: "bg-green-100 text-green-600" 
    },
    { 
      label: "Weekly Joins", 
      value: dashboardStats?.weeklyJoins || "0", 
      icon: "📊", 
      color: "bg-indigo-100 text-indigo-600" 
    },
    { 
      label: "Monthly Joins", 
      value: dashboardStats?.monthlyJoins || "0", 
      icon: "📅", 
      color: "bg-purple-100 text-purple-600" 
    },
    { 
      label: "Gift Pool Balance", 
      value: `₹${(dashboardStats?.giftPoolBalance || 0).toLocaleString()}`, 
      icon: "🎁", 
      color: "bg-pink-100 text-pink-600" 
    },
    { 
      label: "Top Referrer Today", 
      value: dashboardStats?.topReferrerToday || "None", 
      icon: "🏆", 
      color: "bg-yellow-100 text-yellow-600" 
    },
  ];

  // Prepare chart data (use real data from API, fallback to dummy data)
  const dailyJoinsData = dashboardStats?.dailyJoinsData || [
    { date: "Mon", joins: 60 },
    { date: "Tue", joins: 70 },
    { date: "Wed", joins: 85 },
    { date: "Thu", joins: 80 },
    { date: "Fri", joins: 90 },
    { date: "Sat", joins: 75 },
    { date: "Sun", joins: 85 },
  ];

  const giftPoolData = dashboardStats?.giftPoolData || [
    { date: "Mon", pool: 40000 },
    { date: "Tue", pool: 50000 },
    { date: "Wed", pool: 60000 },
    { date: "Thu", pool: 70000 },
    { date: "Fri", pool: 80000 },
    { date: "Sat", pool: 90000 },
    { date: "Sun", pool: 100000 },
  ];

  const pieData = dashboardStats?.pieData || [
    { name: "Daily", value: 40, color: "#8B5CF6" },
    { name: "Weekly", value: 30, color: "#6366F1" },
    { name: "Milestone", value: 20, color: "#F59E42" },
    { name: "Company Profit", value: 10, color: "#10B981" },
  ];

  // Prepare activity feed
  const activities = dashboardStats?.activities || [
    { type: "join", text: "User A joined 5 people today — triggered ₹500 cashback", color: "text-green-600", icon: "👥" },
    { type: "reward", text: "User B crossed 100 joins — iPhone reward pending approval", color: "text-yellow-600", icon: "🎁" },
    { type: "payout", text: "User C requested ₹3,000 payout", color: "text-blue-600", icon: "💰" },
  ];

  // Error state
  if (error) {
    return (
      <div className="flex-1 px-1 xs:px-2 sm:px-4 md:px-8 py-6 sm:py-8 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Error:</strong> {error}
          <button 
            onClick={fetchAllDashboardData}
            className="ml-4 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
      className="flex-1 px-1 xs:px-2 sm:px-4 md:px-8 py-6 sm:py-8 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 min-h-screen relative overflow-x-hidden"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {summaryCards.map((card) => (
          <SummaryCard key={card.label} {...card} loading={loading} />
        ))}
      </div>

      {/* Charts Section */}
      <ChartsSection 
        dailyJoinsData={dailyJoinsData}
        giftPoolData={giftPoolData}
        pieData={pieData}
        loading={loading}
      />

      {/* Activity Feed */}
      <ActivityFeed activities={activities} loading={loading} />
    </motion.main>
  );
}

export default Dashboard; 