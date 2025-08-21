/**
 * 微信小程序认证管理工具
 * 基于 front/lib/auth.ts 实现，适配小程序环境
 */

// 存储键名
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

/**
 * 认证管理类
 */
class AuthManager {
  constructor() {
    this.user = null;
    this.token = null;
    this.refreshToken = null;
    this.listeners = [];
    
    // 从本地存储加载数据
    this.loadFromStorage();
  }

  // 从本地存储加载认证数据
  loadFromStorage() {
    try {
      this.token = wx.getStorageSync(TOKEN_KEY) || null;
      this.refreshToken = wx.getStorageSync(REFRESH_TOKEN_KEY) || null;
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
    return !!(this.token && this.user && !this.isTokenExpired());
  }

  // 获取当前用户
  getCurrentUser() {
    return this.user;
  }

  // 获取认证令牌
  getToken() {
    return this.token;
  }

  // 设置认证数据
  setAuth(authData) {
    try {
      this.user = authData.user;
      this.token = authData.token;
      this.refreshToken = authData.refreshToken;

      // 保存到本地存储
      wx.setStorageSync(TOKEN_KEY, authData.token);
      wx.setStorageSync(REFRESH_TOKEN_KEY, authData.refreshToken);
      wx.setStorageSync(USER_KEY, authData.user);

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

      // 清除本地存储
      wx.removeStorageSync(TOKEN_KEY);
      wx.removeStorageSync(REFRESH_TOKEN_KEY);
      wx.removeStorageSync(USER_KEY);

      this.notifyListeners();
    } catch (error) {
      console.error('清除认证数据失败:', error);
    }
  }

  // 检查令牌是否过期
  isTokenExpired() {
    if (!this.token) return true;

    try {
      // 简单的JWT解码（仅解析payload部分）
      const parts = this.token.split('.');
      if (parts.length !== 3) return true;
      
      const payload = JSON.parse(this.base64UrlDecode(parts[1]));
      const currentTime = Date.now() / 1000;
      
      return payload.exp < currentTime;
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
}

// 创建单例实例
const authManager = new AuthManager();

// 导出认证管理器和相关函数
export default authManager;

export {
  authManager,
  TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_KEY
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