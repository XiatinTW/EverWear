// API Service Layer - Fashion API v2.1

// 只用相對路徑，讓 Vite proxy 自動代理
const API_BASE_URL = '/api/v2';

// JWT Token 管理
const TokenManager = {
  getToken: () => localStorage.getItem('token'),
  setToken: (token) => localStorage.setItem('token', token),
  removeToken: () => localStorage.removeItem('token'),
  isAuthenticated: () => !!localStorage.getItem('token'),
  getCurrentUserId: () => localStorage.getItem('currentUserId')
};

// 基礎 API 請求函數 
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = TokenManager.getToken();
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    ...options,
  };
  
  try {
    const response = await fetch(url, config);
    const result = await response.json();
    
    if (!response.ok) {
      if (response.status === 401) {
        TokenManager.removeToken();
        localStorage.removeItem('currentUserId');
        localStorage.removeItem('currentUser');
        window.location.href = '/auth';
        return;
      }
      throw new Error(result.error || `API Error: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
};

// 認證相關 API
export const authAPI = {
  // 用戶登入
  login: async (credentials) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password
      })
    });
    TokenManager.setToken(response.data.token);
    localStorage.setItem('currentUserId', response.data.user.id);
    localStorage.setItem('currentUser', JSON.stringify(response.data.user));
    return { success: true, message: response.message, data: response.data };
  },

  // 用戶註冊
  register: async (userData) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        username: userData.username || userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone || ''
      })
    });
    TokenManager.setToken(response.data.token);
    localStorage.setItem('currentUserId', response.data.user.id);
    localStorage.setItem('currentUser', JSON.stringify(response.data.user));
    return { success: true, message: response.message, data: response.data };
  },

  // 驗證令牌
  verifyToken: async () => {
    try {
      const response = await apiRequest('/auth/verify');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('令牌驗證失敗:', error);
      TokenManager.removeToken();
      throw error;
    }
  },

  // Google 登入
  googleLogin: async (googleUser) => {
    const response = await apiRequest('/auth/google-login', {
      method: 'POST',
      body: JSON.stringify({
        google_id: googleUser.id,
        email: googleUser.email,
        first_name: googleUser.first_name || googleUser.firstName || '',
        last_name: googleUser.last_name || googleUser.lastName || '',
        access_token: googleUser.accessToken || ''
      })
    });
    TokenManager.setToken(response.data.token);
    localStorage.setItem('currentUserId', response.data.user.id);
    localStorage.setItem('currentUser', JSON.stringify(response.data.user));
    return { success: true, message: response.message, data: response.data };
  },

  // 登出
  logout: () => {
    TokenManager.removeToken();
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('currentUser');
    window.location.href = '/auth';
  },

  // 郵件驗證
  verifyEmail: async (token, email) => {
    try {
      const response = await apiRequest('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token, email })
      });
      
      return {
        success: true,
        message: response.message,
        data: response.data
      };
    } catch (error) {
      console.error('郵件驗證失敗:', error);
      throw error;
    }
  },

  // 重新發送驗證郵件
  resendVerificationEmail: async (email) => {
    try {
      const response = await apiRequest('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      
      return {
        success: true,
        message: response.message
      };
    } catch (error) {
      console.error('重新發送驗證郵件失敗:', error);
      throw error;
    }
  },

  // 申請密碼重設
  requestPasswordReset: async (email) => {
    try {
      const response = await apiRequest('/auth/request-password-reset', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      
      return {
        success: true,
        message: response.message
      };
    } catch (error) {
      console.error('申請密碼重設失敗:', error);
      throw error;
    }
  },

  // 確認密碼重設
  confirmPasswordReset: async (token, email, newPassword) => {
    try {
      const response = await apiRequest('/auth/confirm-password-reset', {
        method: 'POST',
        body: JSON.stringify({ token, email, newPassword })
      });
      
      return {
        success: true,
        message: response.message
      };
    } catch (error) {
      console.error('密碼重設失敗:', error);
      throw error;
    }
  }
};

// 用戶相關 API
export const userAPI = {
  // 獲取當前用戶資料
  getProfile: async () => {
    const response = await apiRequest('/users/me');
    return { success: true, data: response.data };
  },

  // 更新用戶資料
  updateProfile: async (userData) => {
    const response = await apiRequest('/users/me', {
      method: 'PUT',
      body: JSON.stringify(userData) // 直接使用 snake_case
    });
    localStorage.setItem('currentUser', JSON.stringify(response.data));
    return { success: true, message: response.message, data: response.data };
  },

  // 更新密碼
  updatePassword: async (passwordData) => {
    const response = await apiRequest('/users/me/password', {
      method: 'PUT',
      body: JSON.stringify(passwordData)
    });
    return { success: true, message: response.message };
  }
};

// 聯絡訊息相關 API
export const contactAPI = {
  // 獲取聊天串列表
  getThreads: async (page = 1, limit = 10) => {
    try {
      const response = await apiRequest(`/contacts?page=${page}&limit=${limit}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('獲取聊天串列表失敗:', error);
      throw error;
    }
  },

  // 建立新的聊天串
  createThread: async (threadData) => {
    try {
      const response = await apiRequest('/contacts', {
        method: 'POST',
        body: JSON.stringify(threadData)
      });
      
      return {
        success: true,
        message: response.message,
        data: response.data
      };
    } catch (error) {
      console.error('建立聊天串失敗:', error);
      throw error;
    }
  },

  // 獲取聊天串訊息
  getThreadMessages: async (threadId) => {
    try {
      const response = await apiRequest(`/contacts/${threadId}/messages`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('獲取聊天串訊息失敗:', error);
      throw error;
    }
  },

  // 回覆聊天串
  replyToThread: async (threadId, content) => {
    try {
      const response = await apiRequest(`/contacts/${threadId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ content })
      });
      
      return {
        success: true,
        message: response.message,
        data: response.data
      };
    } catch (error) {
      console.error('回覆聊天串失敗:', error);
      throw error;
    }
  }
};

// 訂單相關 API
export const orderAPI = {
  // 獲取用戶訂單列表
  getUserOrders: async (page = 1, limit = 10, status = null) => {
    try {
      let url = `/orders/me?page=${page}&limit=${limit}`;
      if (status) {
        url += `&status=${status}`;
      }
      
      const response = await apiRequest(url);
      return {
        success: true,
        data: response.data.orders || []  // 確保返回訂單數組
      };
    } catch (error) {
      console.error('獲取訂單列表失敗:', error);
      throw error;
    }
  },

  // 獲取訂單詳情
  getOrderById: async (orderId) => {
    try {
      const response = await apiRequest(`/orders/${orderId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('獲取訂單詳情失敗:', error);
      throw error;
    }
  },

  // 取消訂單
  cancelOrder: async (orderId, reason = '') => {
    try {
      const response = await apiRequest(`/orders/${orderId}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ reason })
      });
      
      return {
        success: true,
        message: response.message
      };
    } catch (error) {
      console.error('取消訂單失敗:', error);
      throw error;
    }
  },

  // 獲取訂單統計
  getOrderStats: async () => {
    try {
      const response = await apiRequest('/orders/me/stats');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('獲取訂單統計失敗:', error);
      throw error;
    }
  }
};

// 向後兼容的默認導出
export default {
  authAPI,
  userAPI,
  contactAPI,
  orderAPI,
  TokenManager
};