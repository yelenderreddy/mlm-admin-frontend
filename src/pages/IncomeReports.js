import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { 
  CurrencyDollarIcon, 
  UserGroupIcon, 
  FunnelIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  ArrowPathIcon,
  BanknotesIcon,
  GiftIcon
} from '@heroicons/react/24/outline';
import { ADMIN_ENDPOINTS, getAdminHeaders } from '../api-endpoints';
import { logDebug, logError } from '../config';

const incomeTypes = ["All", "Rewards", "Commission", "Direct"];
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

export default function IncomeReports() {
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    member: "",
    type: "All",
    minAmount: "",
    maxAmount: "",
  });
  const [incomeData, setIncomeData] = useState([]);
  const [topEarners, setTopEarners] = useState([]);
  const [dailyIncome, setDailyIncome] = useState([]);
  const [incomeByType, setIncomeByType] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalMembers: 0,
    averageIncome: 0,
    topEarner: null,
    growthRate: 0,
    totalRewards: 0,
    totalOrders: 0,
  });

  // Fetch income reports data from backend
  const fetchIncomeData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      logDebug('Fetching income reports data from backend');
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.member) params.append('member', filters.member);
      if (filters.type !== 'All') params.append('type', filters.type);
      if (filters.minAmount) params.append('minAmount', filters.minAmount);
      if (filters.maxAmount) params.append('maxAmount', filters.maxAmount);
      
      // Fetch income reports data
      const response = await fetch(`${ADMIN_ENDPOINTS.INCOME_REPORTS.LIST}?${params.toString()}`, {
        headers: getAdminHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logDebug('Income reports data received', data);
      
      // Transform backend data to our format
      const transformedData = [];
      
      // Process rewards data
      if (data.rewards && Array.isArray(data.rewards)) {
        data.rewards.forEach(reward => {
          transformedData.push({
            id: `reward-${reward.id}`,
            member: reward.user?.name || 'Unknown',
            memberId: reward.userId,
            amount: reward.points || 0,
            type: 'Rewards',
            category: reward.reason || 'General Reward',
            date: reward.createdAt,
            status: reward.revoked ? 'Revoked' : 'Active',
            source: 'Rewards'
          });
        });
      }
      
      // Process orders data (as income)
      if (data.orders && Array.isArray(data.orders)) {
        data.orders.forEach(order => {
          // Calculate commission (10% of order total)
          const commission = (order.total || 0) * 0.1;
          const directIncome = (order.total || 0) * 0.9;
          
          transformedData.push({
            id: `commission-${order.id}`,
            member: order.user?.name || 'Unknown',
            memberId: order.userId,
            amount: commission,
            type: 'Commission',
            category: 'Order Commission',
            date: order.createdAt,
            status: order.status,
            source: 'Orders',
            orderTotal: order.total
          });
          
          transformedData.push({
            id: `direct-${order.id}`,
            member: order.user?.name || 'Unknown',
            memberId: order.userId,
            amount: directIncome,
            type: 'Direct',
            category: 'Direct Sales',
            date: order.createdAt,
            status: order.status,
            source: 'Orders',
            orderTotal: order.total
          });
        });
      }

      setIncomeData(transformedData);
      
      // Update summary with backend income stats if available
      if (data.incomeStats) {
        setSummary(prev => ({
          ...prev,
          totalIncome: data.incomeStats.totalIncome || 0,
          totalRewards: data.incomeStats.totalRewardsIncome || 0,
          totalOrders: data.incomeStats.totalOrderIncome || 0,
        }));
      }
      
    } catch (err) {
      logError('Failed to fetch income reports data', err);
      setError(err.message);
      setIncomeData([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch top earners data
  const fetchTopEarners = useCallback(async () => {
    try {
      const response = await fetch(ADMIN_ENDPOINTS.INCOME_REPORTS.TOP_EARNERS, {
        headers: getAdminHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logDebug('Top earners data received', data);
      
      setTopEarners(Array.isArray(data) ? data : []);
    } catch (err) {
      logError('Failed to fetch top earners', err);
      setTopEarners([]);
    }
  }, []);

  // Fetch daily income data
  const fetchDailyIncome = useCallback(async () => {
    try {
      const response = await fetch(ADMIN_ENDPOINTS.INCOME_REPORTS.DAILY, {
        headers: getAdminHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logDebug('Daily income data received', data);
      
      setDailyIncome(Array.isArray(data) ? data : []);
    } catch (err) {
      logError('Failed to fetch daily income', err);
      setDailyIncome([]);
    }
  }, []);

  // Calculate summary statistics
  const calculateSummary = useCallback(() => {
    if (incomeData.length === 0) {
      setSummary({
        totalIncome: 0,
        totalMembers: 0,
        averageIncome: 0,
        topEarner: null,
        growthRate: 0,
        totalRewards: 0,
        totalOrders: 0,
      });
      return;
    }

    const totalIncome = incomeData.reduce((sum, item) => sum + item.amount, 0);
    const uniqueMembers = new Set(incomeData.map(item => item.memberId)).size;
    const averageIncome = totalIncome / incomeData.length;
    const topEarner = topEarners[0] || null;
    
    const totalRewards = incomeData
      .filter(item => item.type === 'Rewards')
      .reduce((sum, item) => sum + item.amount, 0);
    
    const totalOrders = incomeData
      .filter(item => item.type === 'Commission' || item.type === 'Direct')
      .reduce((sum, item) => sum + item.amount, 0);

    // Calculate growth rate (simplified)
    const growthRate = incomeData.length > 1 ? 
      ((incomeData[incomeData.length - 1]?.amount || 0) - (incomeData[0]?.amount || 0)) / (incomeData[0]?.amount || 1) * 100 : 0;

    setSummary({
      totalIncome,
      totalMembers: uniqueMembers,
      averageIncome,
      topEarner,
      growthRate,
      totalRewards,
      totalOrders,
    });
  }, [incomeData, topEarners]);

  // Calculate income by type for pie chart
  const calculateIncomeByType = useCallback(() => {
    const typeData = [
      { name: 'Rewards', value: incomeData.filter(item => item.type === 'Rewards').reduce((sum, item) => sum + item.amount, 0) },
      { name: 'Commission', value: incomeData.filter(item => item.type === 'Commission').reduce((sum, item) => sum + item.amount, 0) },
      { name: 'Direct', value: incomeData.filter(item => item.type === 'Direct').reduce((sum, item) => sum + item.amount, 0) },
    ].filter(item => item.value > 0);

    setIncomeByType(typeData);
  }, [incomeData]);

  // Load data on component mount
  useEffect(() => {
    fetchIncomeData();
    fetchTopEarners();
    fetchDailyIncome();
  }, [fetchIncomeData, fetchTopEarners, fetchDailyIncome]);

  useEffect(() => {
    calculateSummary();
    calculateIncomeByType();
  }, [calculateSummary, calculateIncomeByType]);

  // Filter income data
  const filteredIncomeData = incomeData.filter(item => {
    if (filters.type !== "All" && item.type !== filters.type) return false;
    if (filters.member && !item.member.toLowerCase().includes(filters.member.toLowerCase())) return false;
    if (filters.minAmount && item.amount < parseFloat(filters.minAmount)) return false;
    if (filters.maxAmount && item.amount > parseFloat(filters.maxAmount)) return false;
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
      case "Paid":
      case "Completed": return "bg-green-100 text-green-700";
      case "Pending": return "bg-yellow-100 text-yellow-700";
      case "Failed":
      case "Cancelled":
      case "Revoked": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "Direct": return "bg-blue-100 text-blue-700";
      case "Rewards": return "bg-purple-100 text-purple-700";
      case "Commission": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    try {
      const exportData = filteredIncomeData.map(({ member, amount, type, category, date, status, source }) => ({
        Member: member,
        Amount: amount,
        Type: type,
        Category: category,
        Date: new Date(date).toLocaleDateString(),
        Status: status,
        Source: source,
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Income Reports");
      XLSX.writeFile(workbook, `Income_Reports_${new Date().toISOString().slice(0,10)}.xlsx`);
      logDebug('Income reports exported to Excel');
    } catch (err) {
      logError('Failed to export Excel', err);
    }
  };

  // Export to PDF
  const handleExportPDF = async () => {
    try {
      const input = document.getElementById('income-table');
      if (!input) {
        logError('Table element not found for PDF export');
        return;
      }
      const canvas = await html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`Income_Reports_${new Date().toISOString().slice(0,10)}.pdf`);
      logDebug('Income reports exported to PDF');
    } catch (err) {
      logError('Failed to export PDF', err);
    }
  };

  const handleRefresh = () => {
    fetchIncomeData();
    fetchTopEarners();
    fetchDailyIncome();
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Income Reports</h1>
          <p className="text-gray-600 dark:text-gray-400">Financial income analysis and earnings tracking</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleExportExcel}
            disabled={loading || filteredIncomeData.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={handleExportPDF}
            disabled={loading || filteredIncomeData.length === 0}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Income Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Income</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{summary.totalIncome.toLocaleString()}</p>
              <p className={`text-sm ${summary.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.growthRate >= 0 ? '+' : ''}{summary.growthRate.toFixed(1)}% growth
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <CurrencyDollarIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Earning Members</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalMembers}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active earners</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <UserGroupIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rewards Income</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{summary.totalRewards.toLocaleString()}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Points distributed</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <GiftIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Order Income</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{summary.totalOrders.toLocaleString()}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Commission + Direct</p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
              <BanknotesIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Filter Income Data</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Income Type</label>
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
        >
          {incomeTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
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

      {/* Income Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Income Trend */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Income Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyIncome}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Income']} />
              <Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={2} name="Total Income" />
              <Line type="monotone" dataKey="rewards" stroke="#82ca9d" strokeWidth={2} name="Rewards" />
              <Line type="monotone" dataKey="orders" stroke="#ffc658" strokeWidth={2} name="Order Income" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Income Distribution */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Income Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={incomeByType}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {incomeByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Earners */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Income Earners</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Income</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rewards</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Order Income</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
            </tr>
          </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {topEarners.map((earner, index) => (
                <tr key={earner.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    #{index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {earner.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                    ₹{earner.total.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 dark:text-purple-400">
                    ₹{earner.rewardsIncome.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                    ₹{earner.orderIncome.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {earner.email}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Income Transactions Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Income Transactions</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Showing {filteredIncomeData.length} of {incomeData.length} transactions
          </p>
        </div>
        <div className="overflow-x-auto">
          <table id="income-table" className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount ₹</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Source</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    <div className="animate-pulse">Loading income data...</div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-red-500">
                    Error: {error}
                  </td>
                </tr>
              ) : filteredIncomeData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No income transactions found matching your filters.
                  </td>
              </tr>
            ) : (
                filteredIncomeData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {item.member}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                      ₹{item.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(item.type)}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {item.source}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </motion.div>
  );
} 