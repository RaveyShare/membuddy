// app.js
// MemBuddy 微信小程序主应用文件
// 
// 注意: 控制台中的 SharedArrayBuffer 警告是浏览器安全特性提醒，
// 这是 Chrome 92+ 版本的正常行为，不影响小程序的正常运行。
// 详见: https://developer.chrome.com/blog/enabling-shared-array-buffer/

import { isAuthenticated, getCurrentUser, addAuthListener } from './utils/auth.js';
import { showToast } from './utils/utils.js';

App({
  onLaunch(options) {
    console.log('MemBuddy 小程序启动', options);
    
    // 初始化应用
    this.initApp();
    
    // 设置认证状态监听
    this.setupAuthListener();
    
    // 检查更新
    this.checkForUpdate();
  },

  onShow(options) {
    console.log('MemBuddy 小程序显示', options);
    
    // 更新全局数据
    this.updateGlobalData();
  },

  onHide() {
    console.log('MemBuddy 小程序隐藏');
  },

  onError(error) {
    console.error('MemBuddy 小程序错误:', error);
    
    // 错误上报
    this.reportError(error);
  },

  // 初始化应用
  initApp() {
    try {
      // 清理过期日志
      this.cleanupLogs();
      
      // 更新全局数据
      this.updateGlobalData();
      
      // 预加载关键资源
      this.preloadResources();
      
    } catch (error) {
      console.error('应用初始化失败:', error);
    }
  },

  // 设置认证状态监听
  setupAuthListener() {
    addAuthListener(() => {
      this.updateGlobalData();
    });
  },

  // 更新全局数据
  updateGlobalData() {
    this.globalData.isAuthenticated = isAuthenticated();
    this.globalData.currentUser = getCurrentUser();
  },

  // 清理日志
  cleanupLogs() {
    try {
      const logs = wx.getStorageSync('logs') || [];
      const now = Date.now();
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      
      // 只保留一周内的日志
      const recentLogs = logs.filter(log => now - log < oneWeek);
      recentLogs.unshift(now);
      
      // 最多保留100条日志
      const limitedLogs = recentLogs.slice(0, 100);
      
      wx.setStorageSync('logs', limitedLogs);
    } catch (error) {
      console.error('清理日志失败:', error);
    }
  },

  // 预加载资源
  preloadResources() {
    // 预加载关键图片 - 暂时移除不存在的图片预加载
    const criticalImages = [
      // '/images/logo.png',  // 暂时移除
      // '/images/wechat-icon.png'  // 暂时移除
    ];
    
    criticalImages.forEach(src => {
      wx.getImageInfo({
        src,
        success: (res) => {
          console.log(`预加载图片成功: ${src}`, {
            width: res.width,
            height: res.height,
            type: res.type
          });
        },
        fail: (error) => {
          console.warn(`预加载图片失败: ${src}`, error);
          // 图片加载失败时的降级处理
          if (error.errMsg && error.errMsg.includes('file not found')) {
            console.info(`图片文件不存在，这是正常现象: ${src}`);
          }
        }
      });
    });
    
    console.log('资源预加载完成 - 已移除不存在的图片预加载');
  },

  // 检查更新
  checkForUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();
      
      updateManager.onCheckForUpdate((res) => {
        console.log('检查更新结果:', res.hasUpdate);
      });
      
      updateManager.onUpdateReady(() => {
        wx.showModal({
          title: '更新提示',
          content: '新版本已经准备好，是否重启应用？',
          success: (res) => {
            if (res.confirm) {
              updateManager.applyUpdate();
            }
          }
        });
      });
      
      updateManager.onUpdateFailed(() => {
        console.error('新版本下载失败');
      });
    }
  },

  // 错误上报
  reportError(error) {
    // 这里可以集成错误监控服务
    console.error('应用错误:', error);
    
    // 保存错误日志到本地
    try {
      const errorLogs = wx.getStorageSync('error_logs') || [];
      errorLogs.unshift({
        error: error.toString(),
        stack: error.stack,
        timestamp: Date.now(),
        userAgent: wx.getSystemInfoSync()
      });
      
      // 最多保留50条错误日志
      wx.setStorageSync('error_logs', errorLogs.slice(0, 50));
    } catch (e) {
      console.error('保存错误日志失败:', e);
    }
  },

  // 获取用户信息
  getUserInfo() {
    return this.globalData.currentUser;
  },

  // 检查是否已登录
  checkAuth() {
    return this.globalData.isAuthenticated;
  },

  // 全局数据
  globalData: {
    // 认证状态
    isAuthenticated: false,
    currentUser: null,
    
    // 应用配置
    appName: 'MemBuddy',
    version: '1.0.0',
    
    // API配置
    baseURL: 'https://api.membuddy.ravey.site',
    
    // 主题配置
    theme: 'light',
    
    // 用户偏好
    preferences: {
      language: 'zh-CN',
      notifications: true,
      autoSync: true
    }
  }
})