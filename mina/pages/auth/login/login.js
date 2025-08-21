// pages/auth/login/login.js
import { api } from '../../../utils/api.js';
import { setAuth, wxLogin, getUserProfile } from '../../../utils/auth.js';
import { showToast, showLoading, hideLoading } from '../../../utils/utils.js';

Page({
  data: {
    loading: false,
    wechatLoading: false
  },

  onLoad() {
    // 页面加载时的逻辑
  },

  // 微信登录
  async onWechatLogin() {
    this.setData({ wechatLoading: true });
    showLoading('登录中...');
    
    try {
      // 获取微信登录code
      const code = await wxLogin();
      
      // 调用后端API进行登录
      const response = await api.auth.wxLogin(code);
      
      // 保存认证信息
      setAuth(response.data.token, response.data.refreshToken, response.data.user);
      
      showToast('登录成功');
      
      // 跳转到首页
      wx.reLaunch({
        url: '/pages/index/index'
      });
      
    } catch (error) {
      console.error('微信登录失败:', error);
      showToast('登录失败，请重试');
    } finally {
      this.setData({ wechatLoading: false });
      hideLoading();
    }
  },

  // 获取用户信息并登录
  async onGetUserProfile() {
    try {
      const userInfo = await getUserProfile();
      console.log('获取用户信息成功:', userInfo);
      
      // 执行微信登录
      await this.onWechatLogin();
      
    } catch (error) {
      console.error('获取用户信息失败:', error);
      showToast('需要授权才能使用完整功能');
    }
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: 'MemBuddy - AI记忆助手，让记忆更简单',
      path: '/pages/index/index'
    };
  }
})