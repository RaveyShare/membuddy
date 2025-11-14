/**
 * 登录页面
 * @author Ravey
 * @since 1.0.0
 */
import { api } from '../../../utils/api.js';
import { setAuth, wxLogin, getUserProfile, userCenterLogin, isAuthenticated } from '../../../utils/auth.js';
import { showToast, showLoading, hideLoading } from '../../../utils/utils.js';
import { getCurrentEnvConfig } from '../../../utils/dev-config.js';

Page({
  data: {
    loading: false,
    wechatLoading: false,
    envConfig: null,
    useUserCenter: true, // 默认使用用户中心
    appId: 'wxe6d828ae0245ab9c' // 微信小程序 AppID
  },

  onLoad() {
    // 获取当前环境配置
    const envConfig = getCurrentEnvConfig();
    this.setData({ 
      envConfig,
      useUserCenter: true // 始终使用用户中心
    });
    
    console.log('当前环境配置:', envConfig);

    // 如果已登录，直接跳转到首页
    if (isAuthenticated()) {
      console.log('登录页: 已有有效令牌，跳转首页');
      wx.switchTab({
        url: '/pages/index/index',
        success: () => console.log('登录页: switchTab 成功'),
        fail: (err) => console.warn('登录页: switchTab 失败', err)
      });
    }
  },

  // 微信登录
  async onWechatLogin(userInfo = null) {
    this.setData({ wechatLoading: true });
    showLoading('登录中...');
    
    try {
      // 获取微信登录code
      const code = await wxLogin();
      console.log('获取微信登录code成功:', code);
      
      if (this.data.useUserCenter) {
        // 使用用户中心登录
        const loginData = await userCenterLogin(this.data.appId, code, userInfo);
        console.log('用户中心登录成功:', loginData);
        
        showToast('登录成功');
      } else {
        // 使用旧版本登录（兼容）
        const response = await api.auth.wxLogin(code, userInfo);
        
        // 保存认证信息
        setAuth(response.data.token, response.data.refreshToken, response.data.user);
        
        showToast('登录成功');
      }
      
      // 跳转到首页（tabBar页必须使用 switchTab）
      wx.switchTab({
        url: '/pages/index/index',
        success: () => console.log('登录成功后: switchTab 成功'),
        fail: (err) => console.warn('登录成功后: switchTab 失败', err)
      });
      
    } catch (error) {
      console.error('微信登录失败:', error);
      
      // 根据错误类型显示不同的提示
      let errorMessage = '登录失败，请重试';
      if (error.message) {
        if (error.message.includes('网络')) {
          errorMessage = '网络连接失败，请检查网络后重试';
        } else if (error.message.includes('授权')) {
          errorMessage = '微信授权失败，请重新授权';
        } else {
          errorMessage = error.message;
        }
      }
      
      showToast(errorMessage);
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
      
      // 执行微信登录，传递用户信息
      await this.onWechatLogin(userInfo);
      
    } catch (error) {
      console.error('获取用户信息失败:', error);
      
      // 如果用户拒绝授权，仍然可以进行登录，但没有用户信息
      if (error.errMsg && error.errMsg.includes('deny')) {
        showToast('您可以稍后在个人中心完善用户信息');
        // 不传递用户信息进行登录
        await this.onWechatLogin();
      } else {
        showToast('获取用户信息失败，请重试');
      }
    }
  },

  // 快速登录（不获取用户信息）
  async onQuickLogin() {
    await this.onWechatLogin();
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: 'MemBuddy - AI记忆助手，让记忆更简单',
      path: '/pages/index/index'
    };
  }
})