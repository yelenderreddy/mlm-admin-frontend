# Admin Dashboard API Integration Guide

This guide explains how to integrate all backend APIs into your admin dashboard.

## 📁 Files Created

1. **`src/api-endpoints.js`** - Complete list of all API endpoints with examples
2. **`src/config.js`** - Configuration settings and helper functions
3. **`API_INTEGRATION_GUIDE.md`** - This guide

## 🚀 Quick Start

### 1. Import the API endpoints in your components:

```javascript
import { ADMIN_ENDPOINTS, PRODUCT_ENDPOINTS, getAdminHeaders } from './api-endpoints';
import config, { getFullUrl, logDebug } from './config';
```

### 2. Use the endpoints in your API calls:

```javascript
// Example: Fetch dashboard stats
const fetchDashboardStats = async () => {
  try {
    const response = await fetch(ADMIN_ENDPOINTS.DASHBOARD, {
      headers: getAdminHeaders()
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
  }
};

// Example: Create a product
const createProduct = async (productData) => {
  try {
    const response = await fetch(PRODUCT_ENDPOINTS.CREATE, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify(productData)
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating product:', error);
  }
};
```

## 📋 Available API Categories

### 1. **Admin Dashboard APIs** (`ADMIN_ENDPOINTS`)

#### Dashboard Overview
- `DASHBOARD` - Get admin dashboard statistics

#### User Management
- `USERS.LIST` - List all users
- `USERS.DETAIL(id)` - Get specific user details
- `USERS.UPDATE_STATUS(id)` - Update user status
- `USERS.RESET_PASSWORD(id)` - Reset user password

#### Product Management
- `PRODUCTS.LIST` - List all products
- `PRODUCTS.DETAIL(id)` - Get specific product details

#### Wallet & Payout Management
- `WALLETS.LIST` - List all user wallets
- `PAYOUTS.LIST` - List all payout requests
- `PAYOUTS.APPROVE(id)` - Approve payout request
- `PAYOUTS.DECLINE(id)` - Decline payout request

#### Gift Management
- `GIFTS.LIST` - List all gifts
- `GIFTS.CREATE` - Create new gift
- `GIFTS.UPDATE(id)` - Update gift
- `GIFTS.DELETE(id)` - Delete gift
- `GIFTS.APPROVE(id)` - Approve gift
- `GIFTS.REJECT(id)` - Reject gift
- `GIFTS.DELIVER(id)` - Mark gift as delivered
- `GIFTS.LOGS(id)` - Get gift logs

#### Settings Management
- `SETTINGS.GET` - Get admin settings
- `SETTINGS.UPDATE` - Update admin settings

#### Income Reports & Analytics
- `INCOME_REPORTS.LIST` - List income reports
- `INCOME_REPORTS.TOP_EARNERS` - Get top earners
- `INCOME_REPORTS.DAILY` - Get daily income

#### Referral Management
- `REFERRAL_TREE(userId)` - Get referral tree for a user

### 2. **Product Management APIs** (`PRODUCT_ENDPOINTS`)

#### Product CRUD
- `LIST` - Get all products
- `CREATE` - Create new product
- `UPDATE(id)` - Update product
- `DELETE(id)` - Delete product

#### Product Images
- `UPLOAD_IMAGES(id)` - Upload product images
- `GET_IMAGE(imageId)` - Get product image
- `DELETE_IMAGE(imageId)` - Delete product image

### 3. **Authentication APIs** (`AUTH_ENDPOINTS`)

- `ADMIN_LOGIN` - Admin login
- `ADMIN_REGISTER` - Admin registration
- `USER_LOGIN` - User login
- `USER_REGISTER` - User registration
- `USER_PROFILE` - Get user profile

## 🔧 Helper Functions

### Authentication Headers

```javascript
// For admin requests
const adminHeaders = getAdminHeaders();

// For user requests
const userHeaders = getUserHeaders();

// For file uploads (FormData)
const formDataHeaders = getFormDataHeaders(true); // true for admin
```

### Configuration

```javascript
// Get full URL for an endpoint
const fullUrl = getFullUrl('/admin/dashboard');

// Logging (only in debug mode)
logDebug('Fetching dashboard data', { userId: 123 });
logError('API call failed', error);

// Access configuration
const baseUrl = config.API.BASE_URL;
const maxFileSize = config.UPLOAD.MAX_FILE_SIZE;
```

## 📝 Usage Examples

### 1. Dashboard Stats

```javascript
const DashboardStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(ADMIN_ENDPOINTS.DASHBOARD, {
          headers: getAdminHeaders()
        });
        const data = await response.json();
        setStats(data);
      } catch (error) {
        logError('Failed to fetch dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!stats) return <div>Error loading stats</div>;

  return (
    <div>
      <h2>Dashboard Statistics</h2>
      {/* Display stats */}
    </div>
  );
};
```

### 2. User Management

```javascript
const UserManagement = () => {
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(ADMIN_ENDPOINTS.USERS.LIST, {
        headers: getAdminHeaders()
      });
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      logError('Failed to fetch users', error);
    }
  };

  const updateUserStatus = async (userId, status) => {
    try {
      const response = await fetch(ADMIN_ENDPOINTS.USERS.UPDATE_STATUS(userId), {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        fetchUsers(); // Refresh the list
      }
    } catch (error) {
      logError('Failed to update user status', error);
    }
  };

  return (
    <div>
      <h2>User Management</h2>
      {/* User list and management UI */}
    </div>
  );
};
```

### 3. Product Management with Images

```javascript
const ProductManagement = () => {
  const [products, setProducts] = useState([]);

  const createProduct = async (productData, images) => {
    try {
      // Step 1: Create product
      const productResponse = await fetch(PRODUCT_ENDPOINTS.CREATE, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify(productData)
      });
      const newProduct = await productResponse.json();

      // Step 2: Upload images if provided
      if (images && images.length > 0) {
        const formData = new FormData();
        images.forEach(img => formData.append('images', img));

        await fetch(PRODUCT_ENDPOINTS.UPLOAD_IMAGES(newProduct.id), {
          method: 'POST',
          headers: getFormDataHeaders(true),
          body: formData
        });
      }

      // Refresh products list
      fetchProducts();
    } catch (error) {
      logError('Failed to create product', error);
    }
  };

  return (
    <div>
      <h2>Product Management</h2>
      {/* Product management UI */}
    </div>
  );
};
```

### 4. Gift Management

```javascript
const GiftManagement = () => {
  const [gifts, setGifts] = useState([]);

  const createGift = async (giftData) => {
    try {
      const response = await fetch(ADMIN_ENDPOINTS.GIFTS.CREATE, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify(giftData)
      });
      if (response.ok) {
        fetchGifts(); // Refresh the list
      }
    } catch (error) {
      logError('Failed to create gift', error);
    }
  };

  const approveGift = async (giftId) => {
    try {
      const response = await fetch(ADMIN_ENDPOINTS.GIFTS.APPROVE(giftId), {
        method: 'POST',
        headers: getAdminHeaders()
      });
      if (response.ok) {
        fetchGifts(); // Refresh the list
      }
    } catch (error) {
      logError('Failed to approve gift', error);
    }
  };

  return (
    <div>
      <h2>Gift Management</h2>
      {/* Gift management UI */}
    </div>
  );
};
```

## 🎨 UI Integration Tips

### 1. Loading States
Always show loading states during API calls:

```javascript
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    // API call
  } finally {
    setLoading(false);
  }
};
```

### 2. Error Handling
Use the predefined error messages:

```javascript
const [error, setError] = useState(null);

try {
  // API call
} catch (err) {
  setError(config.ERRORS.NETWORK);
}
```

### 3. Success Messages
Use the predefined success messages:

```javascript
const [success, setSuccess] = useState(null);

if (response.ok) {
  setSuccess(config.SUCCESS.CREATE);
}
```

## 🔒 Security Notes

1. **Authentication**: All admin endpoints require Bearer token authentication
2. **CORS**: Backend is configured for `http://localhost:3000`
3. **File Uploads**: Use `FormData` for image uploads
4. **Token Storage**: Tokens are stored in `localStorage`

## 🚨 Common Issues & Solutions

### 1. CORS Errors
- Ensure backend is running on `http://localhost:3001`
- Check that CORS is properly configured in backend

### 2. 401 Unauthorized
- Check if admin token exists in `localStorage`
- Verify token hasn't expired
- Ensure proper Authorization header format

### 3. File Upload Issues
- Don't set `Content-Type` header for FormData
- Use `getFormDataHeaders()` helper function
- Check file size and type restrictions

### 4. Image Display Issues
- Use the correct image URL format: `http://localhost:3001/product/images/{imageId}`
- Ensure image files exist in the backend uploads directory

## 📚 Next Steps

1. **Start with Dashboard Stats** - Implement the main dashboard overview
2. **Add User Management** - Create user listing and management features
3. **Implement Product Management** - Add product CRUD operations
4. **Add Gift Management** - Implement gift approval workflow
5. **Add Analytics** - Implement income reports and top earners
6. **Add Settings** - Implement admin settings management

## 🆘 Need Help?

- Check the browser's Network tab for API request/response details
- Use the `logDebug()` function to debug API calls
- Verify all endpoints in Swagger UI at `http://localhost:3001/api`
- Check backend logs for server-side errors 