// Sidebar navigation links for admin dashboard
import { Bars3Icon, UsersIcon, ShoppingBagIcon, CreditCardIcon, CurrencyDollarIcon, Cog6ToothIcon, GiftIcon, UserGroupIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

export const sidebarLinks = [
  { name: 'Dashboard', icon: Bars3Icon },
  { name: 'Members', icon: UsersIcon },
  { name: 'Products', icon: ShoppingBagIcon },
  { name: 'Orders', icon: CreditCardIcon },
  { name: 'Payouts', icon: CurrencyDollarIcon },
  { name: 'Payments', icon: CreditCardIcon },
  { name: 'Tree View', icon: UserGroupIcon },
  { name: 'Income Reports', icon: ArrowTrendingUpIcon },
  { name: 'Gift Management', icon: GiftIcon },
  { name: 'Settings', icon: Cog6ToothIcon },
];
export const BASE_URL = "http://54.234.251.28:3000";

export const config = {
  API: {
    BASE_URL: "http://54.234.251.28:3000",
    FRONTEND_URL: "http://54.234.251.28:3000",
    TIMEOUT: 30000,
  },
  AUTH: {
    ADMIN_TOKEN_KEY: "adminToken",
    USER_TOKEN_KEY: "userToken",
    TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000,
  },
  UPLOAD: {
    MAX_FILE_SIZE: 5242880,
    ALLOWED_TYPES: [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp'
    ],
    MAX_FILES: 10,
  },
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,
    PAGE_SIZE_OPTIONS: [5, 10, 20, 50, 100],
  },
  UI: {
    APP_NAME: "MLM Admin Dashboard",
    APP_VERSION: "1.0.0",
    THEME: {
      PRIMARY_COLOR: "#3B82F6",
      SECONDARY_COLOR: "#6B7280",
      SUCCESS_COLOR: "#10B981",
      WARNING_COLOR: "#F59E0B",
      ERROR_COLOR: "#EF4444",
    },
  },
  DEV: {
    DEBUG_MODE: true,
    LOG_LEVEL: 'debug',
  },
  ENDPOINTS: {},
  DEFAULT_DATA: {},
  ERRORS: {
    NETWORK: "Network error. Please check your connection.",
    UNAUTHORIZED: "You are not authorized to perform this action.",
    FORBIDDEN: "Access denied. Insufficient permissions.",
    NOT_FOUND: "The requested resource was not found.",
    VALIDATION: "Please check your input and try again.",
    SERVER: "Server error. Please try again later.",
    TIMEOUT: "Request timed out. Please try again.",
    FILE_TOO_LARGE: "File size exceeds the maximum limit.",
    INVALID_FILE_TYPE: "File type not allowed.",
    TOO_MANY_FILES: "Too many files selected.",
  },
  SUCCESS: {
    LOGIN: "Login successful!",
    LOGOUT: "Logout successful!",
    CREATE: "Created successfully!",
    UPDATE: "Updated successfully!",
    DELETE: "Deleted successfully!",
    UPLOAD: "File uploaded successfully!",
    SAVE: "Saved successfully!",
    APPROVE: "Approved successfully!",
    REJECT: "Rejected successfully!",
  },
};

export const getFullUrl = (endpoint) => {
  return `${config.API.BASE_URL}${endpoint}`;
};

export const getAuthHeaders = (isAdmin = true) => {
  const tokenKey = isAdmin ? config.AUTH.ADMIN_TOKEN_KEY : config.AUTH.USER_TOKEN_KEY;
  const token = localStorage.getItem(tokenKey);
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

export const getFormDataHeaders = (isAdmin = true) => {
  const tokenKey = isAdmin ? config.AUTH.ADMIN_TOKEN_KEY : config.AUTH.USER_TOKEN_KEY;
  const token = localStorage.getItem(tokenKey);
  return {
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

export const logDebug = (message, data = null) => {
  if (config.DEV.DEBUG_MODE) {
    console.log(`[DEBUG] ${message}`, data);
  }
};

export const logError = (message, error = null) => {
  console.error(`[ERROR] ${message}`, error);
};