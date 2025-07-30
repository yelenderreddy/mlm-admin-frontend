import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HomeIcon,
  UsersIcon,
  GiftIcon,
  CubeIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  ShoppingCartIcon,
  StarIcon,
  UserGroupIcon,
  ChartBarIcon,
  WalletIcon,
  CreditCardIcon
} from "@heroicons/react/24/outline";
import "./index.css";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
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
import Rewards from './pages/Rewards';
import Payouts from './pages/Payouts';
import Payments from './pages/Payments';

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

const sidebarLinks = [
  { name: "Dashboard", icon: HomeIcon },
  { name: "Members", icon: UsersIcon },
  { name: "Products", icon: CubeIcon },
  { name: "Orders", icon: ShoppingCartIcon },
  { name: "Rewards", icon: StarIcon },
  { name: "Payouts", icon: WalletIcon },
  { name: "Payments", icon: CreditCardIcon },
  { name: "Tree View", icon: UserGroupIcon },
  { name: "Income Reports", icon: ChartBarIcon },
  { name: "Gift Management", icon: GiftIcon },
  { name: "Settings", icon: Cog6ToothIcon },
];

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark" ||
        (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
    return false;
  });
  useEffect(() => {
    const root = window.document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);
  return [dark, setDark];
}

function Header({ onMenuClick, dark, setDark }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const profileRef = useRef();
  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [profileOpen]);
  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/login");
  };
  return (
    <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between px-2 sm:px-4 md:px-6 py-3 bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-20">
      <div className="flex items-center justify-between w-full md:w-auto">
        <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent select-none">MLM Company</span>
        <button
          className="md:hidden p-2 ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
          aria-label="Open sidebar menu"
          onClick={onMenuClick}
        >
          <Bars3Icon className="h-7 w-7 text-slate-700 dark:text-slate-200" />
        </button>
      </div>
      <div className="flex-1 w-full md:mx-8 mt-2 md:mt-0">
        <input
          type="text"
          placeholder="Search by name, email, ID"
          className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400 transition text-sm sm:text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        />
      </div>
      <div className="flex items-center gap-3 sm:gap-4 mt-2 md:mt-0 justify-end">
        <button className="relative p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition" aria-label="Notifications">
          <div className="h-6 w-6 text-gray-500 dark:text-gray-300 flex items-center justify-center">
            <span className="text-lg">🔔</span>
          </div>
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
        </button>
        <button
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition"
          aria-label="Toggle dark mode"
          onClick={() => setDark((d) => !d)}
        >
          {dark ? <SunIcon className="h-6 w-6 text-yellow-400" /> : <MoonIcon className="h-6 w-6 text-slate-700 dark:text-slate-200" />}
        </button>
        <div className="relative">
          <button className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-slate-800 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition" aria-label="Change language">
            <div className="h-5 w-5 text-gray-500 dark:text-gray-300 flex items-center justify-center">
              <span className="text-sm">🌐</span>
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-200">EN</span>
          </button>
        </div>
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
    Rewards: "/rewards",
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
      <div className="flex items-center gap-2 px-6 py-6 shrink-0">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xl select-none shadow-md">M</div>
        <span className="text-xl font-bold bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent select-none">MLM company</span>
      </div>
      {/* All nav links - scrollable, hide scrollbar */}
      <nav className="flex-1 flex flex-col gap-1 px-2 overflow-y-auto min-h-0 scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {allLinks.map((link) => (
          <motion.button
            key={link.name}
            whileHover={{ scale: 1.03 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-base font-medium w-full text-left
              ${location.pathname === linkToRoute[link.name] ? "bg-purple-100 text-purple-700 shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
            tabIndex={0}
            aria-label={link.name}
            onClick={() => navigate(linkToRoute[link.name])}
          >
            <link.icon className={`h-6 w-6 ${location.pathname === linkToRoute[link.name] ? "text-purple-600" : "text-slate-400 group-hover:text-purple-400"}`} />
            <span>{link.name}</span>
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
      <aside className="hidden md:flex flex-col w-56 min-w-[14rem] flex-shrink-0 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 h-screen sticky top-0 left-0 z-30 shadow-lg">
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
            <div className="w-56 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 h-full flex flex-col shadow-xl relative">
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
                <div className="flex-1 flex flex-col min-h-screen">
                  <Header onMenuClick={() => setSidebarOpen(true)} dark={dark} setDark={setDark} />
                  <div className="flex-1 overflow-y-auto">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/members" element={<Members />} />
                      <Route path="/tree" element={<ReferralTree />} />
                      <Route path="/income-reports" element={<IncomeReports />} />
                      <Route path="/gifts" element={<GiftManagement />} />
                      <Route path="/products" element={<ProductManagement />} />
                      <Route path="/orders" element={<Orders />} />
                      <Route path="/rewards" element={<Rewards />} />
                      <Route path="/payouts" element={<Payouts />} />
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
