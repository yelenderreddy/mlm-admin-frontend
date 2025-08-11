import { BASE_URL } from "./config";

export const ADMIN_ENDPOINTS = {
  DASHBOARD: `${BASE_URL}/api/admin/dashboard/stats`,
  USERS: {
    LIST: `${BASE_URL}/admin/users`,
    DETAIL: (id) => `${BASE_URL}/admin/users/${id}`,
    UPDATE_STATUS: (id) => `${BASE_URL}/admin/users/status/${id}`,
    RESET_PASSWORD: (id) => `${BASE_URL}/admin/users/${id}/reset-password`,
    DELETE: (id) => `${BASE_URL}/admin/users/${id}`,
    REFERRED_BY: (referralCode) => `${BASE_URL}/api/users/referredBy/${referralCode}`,
  },
  PRODUCTS: {
    LIST: `${BASE_URL}/admin/products`,
    DETAIL: (id) => `${BASE_URL}/admin/products/${id}`,
  },
  WALLETS: {
    LIST: `${BASE_URL}/admin/wallets`,
  },
  SETTINGS: {
    GET: `${BASE_URL}/admin/settings`,
    UPDATE: `${BASE_URL}/admin/settings`,
  },
  ADMIN_USERS: {
    CREATE: `${BASE_URL}/admin/admin-users`,
    DELETE: (id) => `${BASE_URL}/admin/admin-users/${id}`,
  },
  INCOME_REPORTS: {
    LIST: `${BASE_URL}/admin/income-reports`,
    TOP_EARNERS: `${BASE_URL}/admin/income-reports/top-earners`,
    DAILY: `${BASE_URL}/admin/income-reports/daily`,
  },
  REFERRAL_TREE: (userId) => `${BASE_URL}/admin/referral-tree/${userId}`,
  ORDERS: {
    LIST: `${BASE_URL}/admin/orders`,
    DETAIL: (id) => `${BASE_URL}/admin/orders/${id}`,
    UPDATE_STATUS: (id) => `${BASE_URL}/admin/orders/${id}/status`,
    UPDATE_TRACKING: (id) => `${BASE_URL}/admin/orders/${id}/tracking`,
    CANCEL: (id) => `${BASE_URL}/admin/orders/${id}/cancel`,
    REFUND: (id) => `${BASE_URL}/admin/orders/${id}/refund`,
    STATS: `${BASE_URL}/admin/orders/stats/summary`,
    ORDER_DETAILS: `${BASE_URL}/product/order-details/all`,
    UPDATE_ORDER_STATUS: (id) => `${BASE_URL}/product/order-status/${id}`,
  },
  REWARDS: {
    LIST: `${BASE_URL}/admin/rewards`,
    DETAIL: (id) => `${BASE_URL}/admin/rewards/${id}`,
    CREATE: `${BASE_URL}/admin/rewards`,
    UPDATE: (id) => `${BASE_URL}/admin/rewards/${id}`,
    DELETE: (id) => `${BASE_URL}/admin/rewards/${id}`,
    REVOKE: (id) => `${BASE_URL}/admin/rewards/${id}/revoke`,
    STATS: `${BASE_URL}/admin/rewards/stats/summary`,
  },
  PAYOUTS: {
    LIST: `${BASE_URL}/admin/payouts`,
    DETAIL: (id) => `${BASE_URL}/admin/payouts/${id}`,
    APPROVE: (id) => `${BASE_URL}/admin/payouts/${id}/approve`,
    DECLINE: (id) => `${BASE_URL}/admin/payouts/${id}/decline`,
    CREATE: `${BASE_URL}/admin/payouts`,
    UPDATE: (id) => `${BASE_URL}/admin/payouts/${id}`,
    STATS: `${BASE_URL}/admin/payouts/stats/summary`,
  },
  BANK_DETAILS: {
    GET: (userId) => `${BASE_URL}/api/bankDetails/getBankDetails/${userId}`,
    CREATE: (userId) => `${BASE_URL}/api/bankDetails/createBankDetails/${userId}`,
    UPDATE: (userId) => `${BASE_URL}/api/bankDetails/updateBankDetails/${userId}`,
    CREATE_OR_UPDATE: (userId) => `${BASE_URL}/api/bankDetails/createOrUpdateBankDetails/${userId}`,
    DELETE: (userId) => `${BASE_URL}/api/bankDetails/deleteBankDetails/${userId}`,
    CHECK: (userId) => `${BASE_URL}/api/bankDetails/checkBankDetails/${userId}`,
    VALIDATE: `${BASE_URL}/api/bankDetails/validateBankDetails`,
    GET_ALL_WITH_USERS: `${BASE_URL}/api/bankDetails/getAllBankDetailsWithUsers`,
    UPDATE_REDEEM_STATUS: (userId) => `${BASE_URL}/api/bankDetails/updateRedeemStatus/${userId}`,
    UPDATE_REDEEM_AMOUNT: (userId) => `${BASE_URL}/api/bankDetails/updateRedeemAmount/${userId}`,
    GET_REDEEM_HISTORY: (userId) => `${BASE_URL}/api/bankDetails/redeemHistory/${userId}`,
  },
  PAYMENTS: {
    LIST: `${BASE_URL}/admin/payments`,
    DETAIL: (id) => `${BASE_URL}/admin/payments/${id}`,
    CREATE: `${BASE_URL}/admin/payments`,
    UPDATE: (id) => `${BASE_URL}/admin/payments/${id}`,
    REFUND: (id) => `${BASE_URL}/admin/payments/${id}/refund`,
    STATS: `${BASE_URL}/admin/payments/stats/summary`,
    RAZORPAY: {
      CREATE_ORDER: `${BASE_URL}/api/payments/create-order`,
    },
  },
  GIFTS: {
    LIST: `${BASE_URL}/admin/gifts`,
    DETAIL: (id) => `${BASE_URL}/admin/gifts/${id}`,
    CREATE: `${BASE_URL}/admin/gifts`,
    UPDATE: (id) => `${BASE_URL}/admin/gifts/${id}`,
    DELETE: (id) => `${BASE_URL}/admin/gifts/${id}`,
    APPROVE: (id) => `${BASE_URL}/admin/gifts/${id}/approve`,
    REJECT: (id) => `${BASE_URL}/admin/gifts/${id}/reject`,
    DELIVER: (id) => `${BASE_URL}/admin/gifts/${id}/deliver`,
    LOGS: (id) => `${BASE_URL}/admin/gifts/${id}/logs`,
    STATS: `${BASE_URL}/admin/gifts/stats/summary`,
  },
  MILESTONES: {
    LIST: `${BASE_URL}/admin/milestones`,
    CREATE: `${BASE_URL}/admin/milestones`,
    UPDATE: (id) => `${BASE_URL}/admin/milestones/${id}`,
    DELETE: (id) => `${BASE_URL}/admin/milestones/${id}`,
  },
  REWARD_TARGETS: {
    LIST: `${BASE_URL}/api/admin/getAll-reward-targets`,
    CREATE: `${BASE_URL}/api/admin/reward-target`,
    UPDATE: (id) => `${BASE_URL}/api/admin/reward-target/${id}`,
    DELETE: (id) => `${BASE_URL}/api/admin/reward-target/${id}`,
  },
};

export const getAdminHeaders = () => {
  const token = localStorage.getItem("adminToken");
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

export const getFormDataHeaders = (isAdmin = true) => {
  const token = isAdmin ? localStorage.getItem("adminToken") : localStorage.getItem("userToken");
  return {
    'Authorization': token ? `Bearer ${token}` : ''
    // Note: Don't set Content-Type for FormData
  };
};

export const ENDPOINTS = {
  ADMIN_LOGIN: "/api/admin/login",
  // Add other endpoints here as needed
}; 