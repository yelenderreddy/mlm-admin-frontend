// Import page components
import Members from "./pages/Members";
import ReferralTree from "./pages/ReferralTree";
import IncomeReports from "./pages/IncomeReports";
import GiftManagement from "./pages/GiftManagement";
import ProductManagement from "./pages/ProductManagement";
import Orders from "./pages/Orders";
import KYCVerification from "./pages/KYCVerification";
import WalletsPayouts from "./pages/WalletsPayouts";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

import Payouts from './pages/Payouts';
import Payments from './pages/Payments';
import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bars3Icon, SunIcon, MoonIcon, XMarkIcon } from '@heroicons/react/24/outline';
import camelqLogo from './assets/camelq logo without background (1).png';
import { sidebarLinks } from './config';

function RequireAdminAuth({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token && location.pathname !== "/login") {
      navigate("/login");
    }
  }, [location, navigate]);
  return children;
}

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const theme = localStorage.getItem('theme');
    return theme === 'dark';
  });
  useEffect(() => {
    const root = window.document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);
  return [dark, setDark];
}

function Header({ onMenuClick, dark, setDark, payoutNotificationCount, notifications, setNotifications }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  // notifications and setNotifications will come from props
  const navigate = useNavigate();
  const profileRef = useRef();
  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    if (profileOpen || notifOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [profileOpen, notifOpen]);

  // Mark notifications as read when opened
  useEffect(() => {
    if (notifOpen && setNotifications) {
        setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
      }
  }, [notifOpen, setNotifications]);
  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/login");
  };
  const notifRef = useRef();
  const unreadCount = (Array.isArray(notifications) ? notifications.filter(n => !n.read).length : 0);
  return (
    <header className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between px-2 sm:px-4 lg:px-6 py-3 bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-20">
      <div className="flex items-center justify-between w-full lg:w-auto">
        <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent select-none"></span>
        <button
          className="lg:hidden p-2 ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
          aria-label="Open sidebar menu"
          onClick={onMenuClick}
        >
          <Bars3Icon className="h-7 w-7 text-slate-700 dark:text-slate-200" />
        </button>
      </div>
      <div className="flex-1 w-full lg:mx-8 mt-2 lg:mt-0">
        <input
          type="text"
          placeholder="Search by name, email, ID"
          className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400 transition text-sm sm:text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        />
      </div>
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 mt-2 lg:mt-0 justify-end">
        <div className="relative" ref={notifRef}>
          <button className="relative p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition" aria-label="Notifications" onClick={() => setNotifOpen((v) => !v)}>
            <div className="h-6 w-6 text-gray-500 dark:text-gray-300 flex items-center justify-center">
              <span className="text-lg">🔔</span>
            </div>
            {/* Notification badge for payout notifications */}
            {unreadCount > 0 && !notifOpen && (
              <span className="absolute top-0 right-0 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900" style={{transform: 'translate(40%,-40%)'}}>
                {unreadCount}
              </span>
            )}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg py-2 z-50 border border-gray-100 dark:border-slate-700"
              >
                <div className="px-4 py-2 font-bold text-slate-700 dark:text-slate-200 border-b border-gray-100 dark:border-slate-700">Notifications</div>
                {Array.isArray(notifications) && notifications.length === 0 ? (
                  <div className="px-4 py-4 text-slate-500 dark:text-slate-300 text-sm">No notifications</div>
                ) : (
                  Array.isArray(notifications) && notifications.map(n => (
                    <div key={n.id} className={`flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700 ${n.read ? 'bg-gray-50 dark:bg-slate-900' : 'bg-purple-50 dark:bg-purple-900'}`}>
                      <span className={`text-sm ${n.read ? 'text-slate-500 dark:text-slate-300' : 'text-purple-700 dark:text-purple-300 font-bold'}`}>{n.message}</span>
                      <button
                        className="ml-2 px-2 py-1 text-xs rounded bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800"
                        onClick={() => {
                          const updated = notifications.filter(x => x.id !== n.id);
                          setNotifications(updated);
                          localStorage.setItem('notifications', JSON.stringify(updated));
                        }}
                      >Remove</button>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition"
          aria-label="Toggle dark mode"
          onClick={() => setDark((d) => !d)}
        >
          {dark ? <SunIcon className="h-6 w-6 text-yellow-400" /> : <MoonIcon className="h-6 w-6 text-slate-700 dark:text-slate-200" />}
        </button>
        <div className="relative" ref={profileRef}>
          <img
            src="https://randomuser.me/api/portraits/women/68.jpg"
            alt="Profile"
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-full border-2 border-purple-500 cursor-pointer hover:scale-105 transition"
            onClick={() => setProfileOpen((v) => !v)}
          />
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg py-2 z-50 border border-gray-100 dark:border-slate-700"
              >
                <button
                  className="w-full text-left px-4 py-2 hover:bg-purple-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm"
                  onClick={() => { setProfileOpen(false); navigate("/profile"); }}
                >
                  Profile
                </button>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-purple-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm"
                  onClick={() => { setProfileOpen(false); navigate("/settings"); }}
                >
                  Settings
                </button>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-slate-700 text-red-600 dark:text-red-400 text-sm border-t border-gray-100 dark:border-slate-700"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  // Map sidebar link names to routes
  const linkToRoute = {
    Dashboard: "/",
    Members: "/members",
    Products: "/products",
    Orders: "/orders",
    Payouts: "/payouts",
    Payments: "/payments",
    "Tree View": "/tree",
    "Income Reports": "/income-reports",
    "Gift Management": "/gifts",
    Settings: "/settings",
  };
  // All links in one array
  const allLinks = sidebarLinks;

  const sidebarContent = (
    <div className="flex flex-col h-full">
             {/* Logo and company name */}
       <div className="flex flex-col items-center justify-center px-4 lg:px-6 py-6 lg:py-8 shrink-0">
         <img 
           src={camelqLogo} 
           alt="CamelQ Logo" 
           className="h-16 w-16 lg:h-20 lg:w-20 object-contain select-none mb-2"
         />
         <span className="text-lg lg:text-xl font-bold bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent select-none"></span>
       </div>
      {/* All nav links - scrollable, hide scrollbar */}
      <nav className="flex-1 flex flex-col gap-1 px-2 overflow-y-auto min-h-0 scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {allLinks.map((link) => (
          <motion.button
            key={link.name}
            whileHover={{ scale: 1.02 }}
            className={`flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-all duration-300 text-sm lg:text-base font-medium w-full text-left
              ${location.pathname === linkToRoute[link.name] ? "bg-purple-100 text-purple-700 shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
            tabIndex={0}
            aria-label={link.name}
            onClick={() => navigate(linkToRoute[link.name])}
          >
            <link.icon className={`h-5 w-5 lg:h-6 lg:w-6 ${location.pathname === linkToRoute[link.name] ? "text-purple-600" : "text-slate-400 group-hover:text-purple-400"}`} />
            <span className="truncate">{link.name}</span>
          </motion.button>
        ))}
      </nav>
      {/* Divider always at the bottom */}
      <div className="border-t border-slate-200 my-2 mx-4 shrink-0" />
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-w-[16rem] flex-shrink-0 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 h-screen sticky top-0 left-0 z-30 shadow-lg">
        {sidebarContent}
      </aside>
      {/* Tablet sidebar */}
      <aside className="hidden md:flex lg:hidden flex-col w-56 min-w-[14rem] flex-shrink-0 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 h-screen sticky top-0 left-0 z-30 shadow-lg">
        {sidebarContent}
      </aside>
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-40 flex md:hidden"
            aria-modal="true"
            role="dialog"
          >
            <div className="w-72 sm:w-80 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 h-full flex flex-col shadow-xl relative">
              <button
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                onClick={onClose}
                aria-label="Close sidebar menu"
              >
                <XMarkIcon className="h-7 w-7 text-slate-700 dark:text-slate-200" />
              </button>
              {sidebarContent}
            </div>
            <div className="flex-1 bg-black bg-opacity-30" onClick={onClose} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useDarkMode();
  // Load notifications from localStorage on mount
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('notifications');
    return saved ? JSON.parse(saved) : [];
  });
  // Only show notifications for payouts that are 'processing'
  const payoutNotificationCount = notifications.filter(n => n.type === 'payout' && n.status === 'processing' && !n.read).length;

  // No demo notification logic. Only use actual notifications from localStorage.

  // Persist notifications to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <RequireAdminAuth>
              <div className="flex min-h-screen font-inter bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
                <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className="flex-1 flex flex-col min-h-screen w-full">
                  <Header
                    onMenuClick={() => setSidebarOpen(true)}
                    dark={dark}
                    setDark={setDark}
                    payoutNotificationCount={payoutNotificationCount}
                    notifications={notifications}
                    setNotifications={setNotifications}
                  />
                  <div className="flex-1 overflow-y-auto px-2 sm:px-4 lg:px-6">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/members" element={<Members />} />
                      <Route path="/tree" element={<ReferralTree />} />
                      <Route path="/income-reports" element={<IncomeReports />} />
                      <Route path="/gifts" element={<GiftManagement />} />
                      <Route path="/products" element={<ProductManagement />} />
                      <Route path="/orders" element={<Orders />} />

                      <Route path="/payouts" element={<Payouts setNotifications={setNotifications} notifications={notifications} />} />
                      <Route path="/payments" element={<Payments />} />
                      <Route path="/kyc" element={<KYCVerification />} />
                      <Route path="/wallets" element={<WalletsPayouts />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="*" element={<Dashboard />} />
                    </Routes>
                  </div>
                </div>
              </div>
            </RequireAdminAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
