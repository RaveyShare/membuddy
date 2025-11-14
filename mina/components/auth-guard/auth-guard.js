/**
 * 认证守卫组件
 * 用于保护需要登录的页面和功能
 */

import { isAuthenticated, addAuthListener } from '../../utils/auth.js';

Component({
  properties: {
    // 是否显示加载状态
    loading: {
      type: Boolean,
      value: false
    },
    // 未登录时的提示文本
    loginText: {
      type: String,
      value: '请先登录后使用此功能'
    },
    // 是否自动跳转到登录页
    autoRedirect: {
      type: Boolean,
      value: true
    }
  },

  data: {
    authenticated: false,
    checking: true
  },

  lifetimes: {
    attached() {
      this.checkAuth();
      this.setupAuthListener();
    },

    detached() {
      if (this.removeAuthListener) {
        this.removeAuthListener();
      }
    }
  },

  methods: {
    // 检查认证状态
    checkAuth() {
      const authenticated = isAuthenticated();
      try {
        console.log('AuthGuard:checkAuth', { authenticated });
      } catch (_) {}
      this.setData({
        authenticated,
        checking: false
      });

      // 触发认证状态变化事件
      this.triggerEvent('authchange', { authenticated });
    },

    // 设置认证状态监听器
    setupAuthListener() {
      this.removeAuthListener = addAuthListener(() => {
        console.log('AuthGuard:监听到认证状态变化');
        this.checkAuth();
      });
    },

    // 处理登录按钮点击
    onLoginTap() {
      if (this.data.autoRedirect) {
        wx.navigateTo({
          url: '/pages/auth/login/login'
        });
      } else {
        this.triggerEvent('login');
      }
    },

    // 手动刷新认证状态
    refresh() {
      this.setData({ checking: true });
      this.checkAuth();
    }
  }
});