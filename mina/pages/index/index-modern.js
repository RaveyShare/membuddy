/*******************************************************************************************
 * 现代深色主题首页 - 增强JavaScript
 * 支持新的UI设计和交互功能
 * @author ravey
 *******************************************************************************************/

// 获取应用实例
const app = getApp();

Page({
  data: {
    // 用户认证状态
    isAuthenticated: false,
    currentUser: null,
    
    // 当前选中标签
    currentTab: 'home',
    
    // 输入内容
    inputContent: '',
    inputPlaceholder: '记一下...',
    generating: false,
    
    // 快速复习
    showQuickReview: false,
    quickReview: null,
    
    // 生成的记忆辅助
    generatedAids: null,
    aidTypes: [
      { key: 'story', label: '故事法', icon: '📖' },
      { key: 'acronym', label: '首字母', icon: '🔤' },
      { key: 'rhyme', label: '押韵', icon: '🎵' },
      { key: 'visual', label: '图像', icon: '🎨' },
      { key: 'chunking', label: '分块', icon: '🧩' },
      { key: 'association', label: '联想', icon: '🔗' }
    ],
    
    // 今日统计
    todayStats: {
      reviewed: 0,
      planned: 0,
      accuracy: 0
    },
    
    // 功能卡片
    featureCards: [
      {
        id: 'memory-bank',
        title: '记忆银行',
        desc: '管理所有记忆内容',
        icon: '🏦',
        color: '#667eea'
      },
      {
        id: 'review-plan',
        title: '复习计划',
        desc: '智能安排复习时间',
        icon: '📅',
        color: '#f093fb'
      },
      {
        id: 'progress-stats',
        title: '学习统计',
        desc: '查看学习进度',
        icon: '📊',
        color: '#4facfe'
      },
      {
        id: 'ai-assistant',
        title: 'AI助手',
        desc: '智能记忆建议',
        icon: '🤖',
        color: '#43e97b'
      }
    ]
  },

  /*******************************************************************************************
   * 生命周期函数
   *******************************************************************************************/

  onLoad: function(options) {
    console.log('现代首页加载完成');
    this.initPage();
  },

  onShow: function() {
    this.updateAuthStatus();
    this.loadTodayStats();
    this.checkQuickReview();
  },

  onReady: function() {
    // 页面渲染完成
  },

  onHide: function() {
    // 页面隐藏
  },

  onUnload: function() {
    // 页面卸载
  },

  /*******************************************************************************************
   * 页面初始化
   *******************************************************************************************/

  initPage: function() {
    this.updateAuthStatus();
    this.loadTodayStats();
    this.checkQuickReview();
  },

  // 更新认证状态
  updateAuthStatus: function() {
    const authManager = require('../../utils/auth-manager');
    const isAuthenticated = authManager.isAuthenticated();
    const currentUser = authManager.getCurrentUser();
    
    this.setData({
      isAuthenticated,
      currentUser
    });

    console.log('认证状态更新:', isAuthenticated, currentUser);
  },

  // 加载今日统计
  loadTodayStats: function() {
    if (!this.data.isAuthenticated) {
      return;
    }

    const api = require('../../utils/api');
    api.get('/api/stats/today')
      .then(res => {
        if (res.data) {
          this.setData({
            todayStats: res.data
          });
        }
      })
      .catch(err => {
        console.error('加载今日统计失败:', err);
      });
  },

  // 检查快速复习
  checkQuickReview: function() {
    if (!this.data.isAuthenticated) {
      return;
    }

    const api = require('../../utils/api');
    api.get('/api/review/quick')
      .then(res => {
        if (res.data && res.data.memory_item) {
          this.setData({
            showQuickReview: true,
            quickReview: res.data
          });
        }
      })
      .catch(err => {
        console.error('检查快速复习失败:', err);
      });
  },

  /*******************************************************************************************
   * 事件处理函数
   *******************************************************************************************/

  // 输入内容变化
  onInputChange: function(e) {
    this.setData({
      inputContent: e.detail.value
    });
  },

  // 快速提交
  onQuickSubmit: function() {
    if (!this.data.inputContent.trim()) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      });
      return;
    }

    // 如果未认证，先登录
    if (!this.data.isAuthenticated) {
      this.onLoginTap();
      return;
    }

    // 使用AI辅助生成记忆工具
    this.generateMemoryAids();
  },

  // 语音输入
  onVoiceInput: function() {
    wx.showToast({
      title: '语音输入功能开发中',
      icon: 'none'
    });
  },

  // 登录按钮点击
  onLoginTap: function() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  // 注册按钮点击
  onRegisterTap: function() {
    wx.navigateTo({
      url: '/pages/register/register'
    });
  },

  // 用户资料点击
  onProfileTap: function() {
    wx.navigateTo({
      url: '/pages/profile/profile'
    });
  },

  // 标签切换
  onTabChange: function(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      currentTab: tab
    });

    // 导航到对应页面
    const routes = {
      'home': '/pages/index/index',
      'memory': '/pages/memory-bank/memory-bank',
      'review': '/pages/review/review',
      'profile': '/pages/profile/profile'
    };

    if (routes[tab] && tab !== 'home') {
      wx.switchTab({
        url: routes[tab]
      });
    }
  },

  /*******************************************************************************************
   * 记忆功能相关
   *******************************************************************************************/

  // 保存记忆项目
  saveMemoryItem: function() {
    if (!this.data.inputContent.trim()) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      });
      return;
    }

    const api = require('../../utils/api');
    api.post('/api/memory-items', {
      title: this.data.inputContent.trim().substring(0, 50),
      content: this.data.inputContent.trim(),
      type: 'text'
    })
    .then(res => {
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });
      
      this.setData({
        inputContent: '',
        generatedAids: null
      });
      
      // 重新加载统计
      this.loadTodayStats();
    })
    .catch(err => {
      wx.showToast({
        title: '保存失败',
        icon: 'error'
      });
      console.error('保存记忆项目失败:', err);
    });
  },

  // 生成记忆辅助
  generateMemoryAids: function() {
    if (!this.data.inputContent.trim()) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      });
      return;
    }

    this.setData({
      generating: true
    });

    const api = require('../../utils/api');
    api.post('/api/ai/generate-aids', {
      content: this.data.inputContent.trim()
    })
    .then(res => {
      if (res.data) {
        this.setData({
          generatedAids: res.data,
          generating: false
        });
        
        wx.showToast({
          title: '生成成功',
          icon: 'success'
        });
      }
    })
    .catch(err => {
      this.setData({
        generating: false
      });
      
      wx.showToast({
        title: '生成失败',
        icon: 'error'
      });
      console.error('生成记忆辅助失败:', err);
    });
  },

  // 关闭辅助预览
  closeAidsPreview: function() {
    this.setData({
      generatedAids: null
    });
  },

  // 查看辅助详情
  viewAidDetail: function(e) {
    const type = e.currentTarget.dataset.type;
    const aid = this.data.generatedAids[type];
    
    if (aid) {
      wx.navigateTo({
        url: `/pages/aid-detail/aid-detail?type=${type}&content=${encodeURIComponent(JSON.stringify(aid))}`
      });
    }
  },

  /*******************************************************************************************
   * 快速复习相关
   *******************************************************************************************/

  // 跳过快速复习
  skipQuickReview: function() {
    this.setData({
      showQuickReview: false,
      quickReview: null
    });
  },

  // 显示快速复习答案
  showQuickReviewAnswer: function() {
    const quickReview = this.data.quickReview;
    quickReview.showAnswer = true;
    
    this.setData({
      quickReview
    });
  },

  // 提交快速复习
  submitQuickReview: function(e) {
    const difficulty = parseInt(e.currentTarget.dataset.difficulty);
    const reviewId = this.data.quickReview.id;

    const api = require('../../utils/api');
    api.post(`/api/review/${reviewId}/submit`, {
      difficulty: difficulty,
      reviewed_at: new Date().toISOString()
    })
    .then(res => {
      wx.showToast({
        title: '提交成功',
        icon: 'success'
      });
      
      // 隐藏快速复习卡片
      this.setData({
        showQuickReview: false,
        quickReview: null
      });
      
      // 重新加载统计和检查新的复习
      this.loadTodayStats();
      setTimeout(() => {
        this.checkQuickReview();
      }, 1000);
    })
    .catch(err => {
      wx.showToast({
        title: '提交失败',
        icon: 'error'
      });
      console.error('提交快速复习失败:', err);
    });
  },

  /*******************************************************************************************
   * 功能卡片相关
   *******************************************************************************************/

  // 功能卡片点击
  onFeatureCardTap: function(e) {
    const card = e.currentTarget.dataset.card;
    
    switch (card.id) {
      case 'memory-bank':
        wx.switchTab({
          url: '/pages/memory-bank/memory-bank'
        });
        break;
        
      case 'review-plan':
        wx.switchTab({
          url: '/pages/review/review'
        });
        break;
        
      case 'progress-stats':
        wx.navigateTo({
          url: '/pages/stats/stats'
        });
        break;
        
      case 'ai-assistant':
        wx.showToast({
          title: 'AI助手功能开发中',
          icon: 'none'
        });
        break;
        
      default:
        wx.showToast({
          title: '功能开发中',
          icon: 'none'
        });
    }
  },

  /*******************************************************************************************
   * 工具函数
   *******************************************************************************************/

  // 显示提示
  showToast: function(title, icon = 'none') {
    wx.showToast({
      title: title,
      icon: icon,
      duration: 2000
    });
  },

  // 显示加载中
  showLoading: function(title = '加载中...') {
    wx.showLoading({
      title: title,
      mask: true
    });
  },

  // 隐藏加载中
  hideLoading: function() {
    wx.hideLoading();
  },

  // 页面滚动到顶部
  scrollToTop: function() {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    });
  }
});