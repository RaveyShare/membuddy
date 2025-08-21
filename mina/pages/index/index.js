// pages/index/index.js
import { api } from '../../utils/api.js';
import { requireAuth, getCurrentUser, isAuthenticated, addAuthListener } from '../../utils/auth.js';
import { showToast, showLoading, hideLoading } from '../../utils/utils.js';
import { formatTime } from '../../utils/format.js';

Page({
  data: {
    // 认证状态
    isAuthenticated: false,
    currentUser: null,
    // 用户输入
    inputContent: '',
    inputPlaceholder: '输入你想记住的内容...',
    
    // 记忆辅助生成状态
    generating: false,
    generatedAids: null,
    
    // 今日统计
    todayStats: {
      reviewed: 0,
      planned: 0,
      accuracy: 0
    },
    
    // 快速复习
    quickReview: null,
    showQuickReview: false,
    
    // 最近记忆项
    recentMemories: [],
    loadingRecent: false,
    
    // 功能卡片
    featureCards: [
      {
        id: 'memory-library',
        title: '记忆库',
        desc: '管理你的记忆内容',
        icon: '📚',
        color: '#667eea',
        path: '/pages/memory-library/memory-library'
      },
      {
        id: 'review',
        title: '智能复习',
        desc: '科学复习，强化记忆',
        icon: '🧠',
        color: '#10b981',
        path: '/pages/review/review'
      },
      {
        id: 'profile',
        title: '个人中心',
        desc: '查看学习统计',
        icon: '👤',
        color: '#f59e0b',
        path: '/pages/profile/profile'
      }
    ],
    
    // 记忆辅助类型
    aidTypes: [
      { key: 'mindMap', label: '思维导图', icon: '🗺️' },
      { key: 'keyPrinciples', label: '关键原理', icon: '🔑' },
      { key: 'memoryScenes', label: '记忆场景', icon: '🎬' },
      { key: 'mnemonics', label: '记忆法', icon: '💡' },
      { key: 'sensoryAssociations', label: '感官联想', icon: '👁️' }
    ]
  },

  // 页面加载
  onLoad(options) {
    console.log('首页加载');
    
    // 初始化认证状态
    this.initAuth();
    
    // 设置认证状态监听
    this.setupAuthListener();
    
    // 加载页面数据
    this.loadPageData();
  },

  // 初始化认证状态
  initAuth() {
    const authenticated = isAuthenticated();
    const user = getCurrentUser();
    
    const updateData = {
      isAuthenticated: authenticated
    };
    
    // 只有当用户存在时才设置currentUser
    if (user) {
      updateData.currentUser = user;
    }
    
    this.setData(updateData);
  },

  // 设置认证状态监听
  setupAuthListener() {
    addAuthListener(() => {
      this.initAuth();
      if (this.data.isAuthenticated) {
        this.loadPageData();
      }
    });
  },

  // 加载页面数据
  loadPageData() {
    if (!this.data.isAuthenticated) {
      return;
    }
    
    this.loadTodayStats();
    this.loadRecentMemories();
    this.loadQuickReview();
  },

  onShow() {
    // 页面显示时刷新认证状态和数据
    this.initAuth();
    if (this.data.isAuthenticated) {
      this.loadTodayStats();
      this.loadQuickReview();
    }
  },

  onPullDownRefresh() {
    this.refreshData();
  },

  // 刷新数据
  async refreshData() {
    try {
      await Promise.all([
        this.loadTodayStats(),
        this.loadRecentMemories(),
        this.loadQuickReview()
      ]);
    } catch (error) {
      console.error('刷新数据失败:', error);
    } finally {
      wx.stopPullDownRefresh();
    }
  },

  // 输入内容变化
  onInputChange(e) {
    this.setData({
      inputContent: e.detail.value
    });
  },

  // 生成记忆辅助
  async generateMemoryAids() {
    const { inputContent } = this.data;
    
    if (!inputContent.trim()) {
      showToast('请输入要记忆的内容');
      return;
    }

    this.setData({ generating: true });
    showLoading('AI正在生成记忆辅助...');

    try {
      const response = await api.memory.generateAids(inputContent);

      this.setData({
        generatedAids: {
          memoryId: response.data.memoryId,
          mnemonic: response.data.aids.mnemonic,
          association: response.data.aids.association,
          visualization: response.data.aids.visualization,
          story: response.data.aids.story
        },
        inputContent: ''
      });

      showToast('记忆辅助生成成功！');
      
      // 刷新最近记忆项
      this.loadRecentMemories();
      
    } catch (error) {
      console.error('生成记忆辅助失败:', error);
      showToast('生成失败，请重试');
    } finally {
      this.setData({ generating: false });
      hideLoading();
    }
  },

  // 保存记忆项
  async saveMemoryItem() {
    const { inputContent } = this.data;
    
    if (!inputContent.trim()) {
      showToast('请输入要记忆的内容');
      return;
    }

    showLoading('保存中...');

    try {
      await api.memory.create({
        title: inputContent.substring(0, 50) + (inputContent.length > 50 ? '...' : ''),
        content: inputContent,
        category: 'general',
        tags: []
      });

      this.setData({ inputContent: '' });
      showToast('保存成功！');
      
      // 刷新最近记忆项
      this.loadRecentMemories();
      
    } catch (error) {
      console.error('保存记忆项失败:', error);
      showToast('保存失败，请重试');
    } finally {
      hideLoading();
    }
  },

  // 加载今日统计
  async loadTodayStats() {
    try {
      const response = await api.review.getTodayStats();
      this.setData({
        todayStats: {
          reviewed: response.data.reviewed || 0,
          planned: response.data.planned || 0,
          accuracy: response.data.accuracy || 0
        }
      });
    } catch (error) {
      console.error('加载今日统计失败:', error);
    }
  },

  // 加载最近记忆项
  async loadRecentMemories() {
    this.setData({ loadingRecent: true });
    
    try {
      const response = await api.memory.getList({
        page: 1,
        limit: 5,
        sortBy: 'updated_at',
        sortOrder: 'desc'
      });
      
      this.setData({ 
        recentMemories: response.data.items.map(memory => ({
          ...memory,
          timeAgo: formatTime(memory.createdAt)
        })) || []
      });
    } catch (error) {
      console.error('加载最近记忆项失败:', error);
    } finally {
      this.setData({ loadingRecent: false });
    }
  },

  // 加载快速复习
  async loadQuickReview() {
    try {
      const response = await api.review.getNext();
      this.setData({ 
        quickReview: response.data,
        showQuickReview: !!response.data
      });
    } catch (error) {
      console.error('加载快速复习失败:', error);
      this.setData({ showQuickReview: false });
    }
  },

  // 查看记忆辅助详情
  viewAidDetail(e) {
    const { type } = e.currentTarget.dataset;
    const { generatedAids } = this.data;
    
    if (!generatedAids || !generatedAids[type]) {
      return;
    }

    // 显示详情弹窗或跳转到详情页
    wx.navigateTo({
      url: `/pages/memory-item/memory-item?id=${generatedAids.memoryId}&tab=${type}`
    });
  },

  // 关闭记忆辅助预览
  closeAidsPreview() {
    this.setData({ generatedAids: null });
  },

  // 功能卡片点击
  onFeatureCardTap(e) {
    const { card } = e.currentTarget.dataset;
    wx.navigateTo({
      url: card.path
    });
  },

  // 最近记忆项点击
  onRecentMemoryTap(e) {
    const { memory } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/memory-item/memory-item?id=${memory.id}`
    });
  },

  // 快速复习 - 显示答案
  showQuickReviewAnswer() {
    this.setData({
      'quickReview.showAnswer': true
    });
  },

  // 快速复习 - 提交结果
  async submitQuickReview(e) {
    const { difficulty } = e.currentTarget.dataset;
    const { quickReview } = this.data;
    
    if (!quickReview) return;

    try {
      await api.review.complete(quickReview.id, {
        difficulty: parseInt(difficulty),
        duration: Date.now() - quickReview.startTime
      });

      showToast('复习完成！');
      
      // 加载下一个复习项
      this.loadQuickReview();
      this.loadTodayStats();
      
    } catch (error) {
      console.error('提交复习结果失败:', error);
      showToast('提交失败，请重试');
    }
  },

  // 跳过快速复习
  skipQuickReview() {
    this.setData({ showQuickReview: false });
  },

  // 去复习页面
  goToReview() {
    wx.navigateTo({
      url: '/pages/review/review'
    });
  },

  // 去记忆库
  goToMemoryLibrary() {
    wx.navigateTo({
      url: '/pages/memory-library/memory-library'
    });
  },

  // 分享应用
  onShareAppMessage() {
    return {
      title: 'MemBuddy - AI记忆助手',
      desc: '让记忆更简单，让学习更高效',
      path: '/pages/index/index'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: 'MemBuddy - AI记忆助手，让记忆更简单！'
    };
  }
});