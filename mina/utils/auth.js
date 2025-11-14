/**
 * 微信小程序认证管理工具
 * 基于 front/lib/auth.ts 实现，适配小程序环境
 * 支持用户中心认证流程
 * @author Ravey
 * @since 1.0.0
 */

// 存储键名
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';
const ACCESS_TOKEN_KEY = 'access_token'; // 用户中心访问令牌
const TOKEN_TYPE_KEY = 'token_type'; // 令牌类型
const EXPIRES_IN_KEY = 'expires_in'; // 过期时间

/**
 * 认证管理类
 */
class AuthManager {
  constructor() {
    this.user = null;
    this.token = null;
    this.refreshToken = null;
    this.accessToken = null; // 用户中心访问令牌
    this.tokenType = null; // 令牌类型
    this.expiresIn = null; // 过期时间
    this.listeners = [];
    
    // 从本地存储加载数据
    this.loadFromStorage();
  }

  // 从本地存储加载认证数据
  loadFromStorage() {
    try {
      // 加载旧版本token
      this.token = wx.getStorageSync(TOKEN_KEY) || null;
      this.refreshToken = wx.getStorageSync(REFRESH_TOKEN_KEY) || null;
      
      // 加载用户中心token
      this.accessToken = wx.getStorageSync(ACCESS_TOKEN_KEY) || null;
      this.tokenType = wx.getStorageSync(TOKEN_TYPE_KEY) || null;
      {
        const exp = wx.getStorageSync(EXPIRES_IN_KEY);
        this.expiresIn = exp ? Number(exp) : null;
      }
      
      // 加载用户数据
      const userData = wx.getStorageSync(USER_KEY);
      if (userData) {
        this.user = typeof userData === 'string' ? JSON.parse(userData) : userData;
      }
    } catch (error) {
      console.error('加载认证数据失败:', error);
      this.clearAuth();
    }
  }

  // 通知监听器
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('认证状态监听器执行失败:', error);
      }
    });
  }

  // 添加认证状态监听器
  addListener(listener) {
    if (typeof listener === 'function') {
      this.listeners.push(listener);
      
      // 返回取消监听的函数
      return () => {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
          this.listeners.splice(index, 1);
        }
      };
    }
    return () => {};
  }

  // 检查是否已认证
  isAuthenticated() {
    const hasToken = !!(this.accessToken || this.token);
    // 认证仅依赖有效令牌；用户信息可后续拉取
    const expired = this.isTokenExpired();
    try {
      console.log('Auth:isAuthenticated', {
        hasToken,
        expired,
        hasUser: !!this.user,
        accessTokenPresent: !!this.accessToken,
        tokenPresent: !!this.token,
        expiresIn: this.expiresIn
      });
    } catch (_) {}
    return !!(hasToken && !expired);
  }

  // 获取当前用户
  getCurrentUser() {
    return this.user;
  }

  // 获取认证令牌
  getToken() {
    // 优先返回用户中心的accessToken
    return this.accessToken || this.token;
  }

  // 获取用户中心访问令牌
  getAccessToken() {
    return this.accessToken;
  }

  // 获取令牌类型
  getTokenType() {
    return this.tokenType || 'Bearer';
  }

  // 设置认证数据
  setAuth(authData) {
    try {
      // 适配新的用户中心格式
      if (authData.data) {
        // 用户中心格式：{ code: 0, data: { token, expiresIn, userInfo } }
        this.accessToken = authData.data.token;
        this.tokenType = 'Bearer';
        // 用户中心返回的 expiresIn 为相对秒数（TTL），需转换为绝对过期时间戳（秒）
        {
          const nowSec = Math.floor(Date.now() / 1000);
          const raw = Number(authData.data.expiresIn);
          const expiresAt = raw > 1000000000 ? raw : nowSec + raw;
          this.expiresIn = expiresAt;
        }
        this.user = authData.data.userInfo;
        
        // 保存用户中心格式到本地存储
        wx.setStorageSync(ACCESS_TOKEN_KEY, authData.data.token);
        wx.setStorageSync(TOKEN_TYPE_KEY, 'Bearer');
        // 统一将绝对过期时间戳保存到本地
        wx.setStorageSync(EXPIRES_IN_KEY, this.expiresIn);
        wx.setStorageSync(USER_KEY, authData.data.userInfo);
      } 
      // 支持旧的用户中心格式
      else if (authData.accessToken) {
        this.accessToken = authData.accessToken;
        this.tokenType = authData.tokenType || 'Bearer';
        // 兼容旧的用户中心格式：expiresIn 可能为 TTL，需要转换为绝对过期时间戳
        {
          const nowSec = Math.floor(Date.now() / 1000);
          const rawVal = authData.expiresIn;
          const raw = rawVal == null ? null : Number(rawVal);
          const expiresAt = raw ? (raw > 1000000000 ? raw : nowSec + raw) : null;
          this.expiresIn = expiresAt;
        }
        this.refreshToken = authData.refreshToken;
        this.user = authData.user;
        
        // 保存用户中心格式到本地存储
        wx.setStorageSync(ACCESS_TOKEN_KEY, authData.accessToken);
        wx.setStorageSync(TOKEN_TYPE_KEY, authData.tokenType || 'Bearer');
        wx.setStorageSync(EXPIRES_IN_KEY, this.expiresIn);
        wx.setStorageSync(REFRESH_TOKEN_KEY, authData.refreshToken);
        wx.setStorageSync(USER_KEY, authData.user);
      }
      // 兼容旧版本格式
      else if (authData.token) {
        this.token = authData.token;
        this.refreshToken = authData.refreshToken;
        this.user = authData.user;
        
        // 保存旧版本格式到本地存储
        wx.setStorageSync(TOKEN_KEY, authData.token);
        wx.setStorageSync(REFRESH_TOKEN_KEY, authData.refreshToken);
        wx.setStorageSync(USER_KEY, authData.user);
      }

      this.notifyListeners();
    } catch (error) {
      console.error('设置认证数据失败:', error);
    }
  }

  // 清除认证数据
  clearAuth() {
    try {
      this.user = null;
      this.token = null;
      this.refreshToken = null;
      this.accessToken = null;
      this.tokenType = null;
      this.expiresIn = null;

      // 清除本地存储
      wx.removeStorageSync(TOKEN_KEY);
      wx.removeStorageSync(REFRESH_TOKEN_KEY);
      wx.removeStorageSync(USER_KEY);
      wx.removeStorageSync(ACCESS_TOKEN_KEY);
      wx.removeStorageSync(TOKEN_TYPE_KEY);
      wx.removeStorageSync(EXPIRES_IN_KEY);

      this.notifyListeners();
    } catch (error) {
      console.error('清除认证数据失败:', error);
    }
  }

  // 检查令牌是否过期
  isTokenExpired() {
    // 优先检查用户中心token
    if (this.accessToken) {
      // 如果有expiresIn，使用它来判断
      if (this.expiresIn !== null && this.expiresIn !== undefined) {
        const currentTime = Date.now() / 1000;
        const expired = this.expiresIn < currentTime;
        try {
          console.log('Auth:isTokenExpired via expiresIn', {
            expiresIn: this.expiresIn,
            currentTime,
            expired
          });
        } catch (_) {}
        return expired;
      }
      
      // 尝试解析JWT格式的accessToken
      try {
        const parts = this.accessToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(this.base64UrlDecode(parts[1]));
          const currentTime = Date.now() / 1000;
          return payload.exp < currentTime;
        }
      } catch (error) {
        console.warn('无法解析用户中心JWT令牌:', error);
      }
      
      // 如果无法解析，假设未过期
      return false;
    }
    
    // 检查旧版本token
    if (!this.token) return true;

    try {
      // 简单的JWT解码（仅解析payload部分）
      const parts = this.token.split('.');
      if (parts.length !== 3) return true;
      
      const payload = JSON.parse(this.base64UrlDecode(parts[1]));
      const currentTime = Date.now() / 1000;
      
      const expired = payload.exp < currentTime;
      try {
        console.log('Auth:isTokenExpired via jwt', { exp: payload.exp, currentTime, expired });
      } catch (_) {}
      return expired;
    } catch (error) {
      console.warn('无法解析JWT令牌，视为已过期:', error);
      return true;
    }
  }

  // Base64 URL 解码
  base64UrlDecode(str) {
    // 添加填充
    str += new Array(5 - str.length % 4).join('=');
    // 替换字符
    str = str.replace(/\-/g, '+').replace(/_/g, '/');
    // 解码
    return decodeURIComponent(escape(atob(str)));
  }

  // 获取刷新令牌
  getRefreshToken() {
    return this.refreshToken;
  }

  // 更新用户信息
  updateUser(userData) {
    try {
      this.user = { ...this.user, ...userData };
      wx.setStorageSync(USER_KEY, this.user);
      this.notifyListeners();
    } catch (error) {
      console.error('更新用户信息失败:', error);
    }
  }

  // 微信登录
  async wxLogin() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            resolve(res.code);
          } else {
            reject(new Error('获取微信登录code失败'));
          }
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
  }

  // 获取用户信息
  async getUserProfile() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          resolve(res.userInfo);
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
  }

  // 用户中心登录
  async userCenterLogin(appId, code, userInfo) {
    try {
      const { api } = require('./api.js');
      
      const response = await api.userCenter.wxLogin(appId, code, userInfo);

      if (response.success && response.data && response.data.code === 0) {
        // 设置认证数据（新的用户中心格式）
        this.setAuth(response.data);
        
        return response.data.data;
      } else {
        throw new Error(response.data?.message || response.message || '登录失败');
      }
    } catch (error) {
      console.error('用户中心登录失败:', error);
      throw error;
    }
  }

  // 刷新用户中心token
  async refreshUserCenterToken() {
    try {
      if (!this.refreshToken) {
        throw new Error('没有刷新令牌');
      }

      const api = require('./api.js').default;
      
      const response = await api.userCenter.refreshToken({
        refreshToken: this.refreshToken
      });

      if (response.success) {
        // 更新认证数据
        this.setAuth({
          accessToken: response.data.accessToken,
          tokenType: response.data.tokenType,
          expiresIn: response.data.expiresIn,
          refreshToken: response.data.refreshToken || this.refreshToken,
          user: this.user
        });
        
        return response.data;
      } else {
        throw new Error(response.message || '刷新令牌失败');
      }
    } catch (error) {
      console.error('刷新用户中心令牌失败:', error);
      // 刷新失败，清除认证数据
      this.clearAuth();
      throw error;
    }
  }
}

// 创建单例实例
const authManager = new AuthManager();

// 导出认证管理器和相关函数
export default authManager;

export {
  authManager,
  TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_KEY,
  ACCESS_TOKEN_KEY,
  TOKEN_TYPE_KEY,
  EXPIRES_IN_KEY
};

// 便捷函数
export function isAuthenticated() {
  return authManager.isAuthenticated();
}

export function getCurrentUser() {
  return authManager.getCurrentUser();
}

export function getToken() {
  return authManager.getToken();
}

export function getRefreshToken() {
  return authManager.getRefreshToken();
}

export function clearAuth() {
  authManager.clearAuth();
}

export function setAuth(token, refreshToken, user) {
  authManager.setAuth({ token, refreshToken, user });
}

export function updateUser(userData) {
  authManager.updateUser(userData);
}

export function addAuthListener(listener) {
  return authManager.addListener(listener);
}

// 微信相关函数
export function wxLogin() {
  return authManager.wxLogin();
}

export function getUserProfile() {
  return authManager.getUserProfile();
}

// 用户中心相关函数
export function getAccessToken() {
  return authManager.getAccessToken();
}

export function getTokenType() {
  return authManager.getTokenType();
}

export function userCenterLogin(appId, code, userInfo) {
  return authManager.userCenterLogin(appId, code, userInfo);
}

export function refreshUserCenterToken() {
  return authManager.refreshUserCenterToken();
}

// 认证检查中间件
export function requireAuth(callback) {
  if (!authManager.isAuthenticated()) {
    wx.showModal({
      title: '需要登录',
      content: '请先登录后再使用此功能',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/auth/login/login'
          });
        }
      }
    });
    return false;
  }
  
  if (typeof callback === 'function') {
    callback();
  }
  return true;
}