// pages/review/review.js
import { api } from '../../utils/api.js'
import { requireAuth } from '../../utils/auth.js'
import { showToast, showLoading, hideLoading } from '../../utils/utils.js'
import { formatTime } from '../../utils/format.js'

Page({
  data: {
    // 页面状态
    loading: true,
    refreshing: false,
    
    // 复习数据
    reviewItems: [],
    currentIndex: 0,
    totalCount: 0,
    completedCount: 0,
    
    // 当前复习项
    currentItem: null,
    showAnswer: false,
    
    // 复习模式
    reviewMode: 'normal', // normal, quick, intensive
    
    // 统计数据
    todayStats: {
      total: 0,
      completed: 0,
      accuracy: 0
    },
    
    // 复习结果
    reviewResults: [],
    showResults: false,
    
    // 难度评级
    difficultyOptions: [
      { value: 1, label: '很简单', color: '#10b981', desc: '立即掌握' },
      { value: 2, label: '简单', color: '#3b82f6', desc: '基本掌握' },
      { value: 3, label: '一般', color: '#f59e0b', desc: '需要练习' },
      { value: 4, label: '困难', color: '#ef4444', desc: '需要重学' }
    ]
  },

  onLoad(options) {
    // 检查登录状态
    if (!requireAuth()) {
      return
    }
    
    // 获取复习模式
    if (options.mode) {
      this.setData({ reviewMode: options.mode })
    }
    
    this.loadReviewData()
    this.loadTodayStats()
  },

  onShow() {
    // 页面显示时刷新数据
    if (!this.data.loading) {
      this.loadTodayStats();
    }
  },

  onPullDownRefresh() {
    this.refreshReviewData();
  },

  // 加载复习数据
  async loadReviewData() {
    try {
      this.setData({ loading: true })
      
      const result = await api.review.getNext({
        mode: this.data.reviewMode,
        limit: 50
      })
      
      const reviewItems = result.data.items || []
      
      this.setData({
        reviewItems,
        totalCount: reviewItems.length,
        currentIndex: 0,
        currentItem: reviewItems.length > 0 ? reviewItems[0] : null,
        showAnswer: false,
        loading: false
      })
      
      if (reviewItems.length === 0) {
        showToast('暂无需要复习的内容', 'none')
      }
    } catch (error) {
      console.error('加载复习数据失败:', error)
      showToast('加载失败，请重试')
      this.setData({ loading: false })
    }
  },

  // 刷新复习数据
  async refreshReviewData() {
    try {
      this.setData({ refreshing: true })
      
      const result = await api.review.getNext({
        mode: this.data.reviewMode,
        limit: 50
      })
      
      const reviewItems = result.data.items || []
      
      this.setData({
        reviewItems,
        totalCount: reviewItems.length,
        currentIndex: 0,
        currentItem: reviewItems.length > 0 ? reviewItems[0] : null,
        showAnswer: false,
        refreshing: false
      })
      
      showToast('刷新成功', 'success')
    } catch (error) {
      console.error('刷新复习数据失败:', error)
      showToast('刷新失败，请重试')
      this.setData({ refreshing: false })
    } finally {
      wx.stopPullDownRefresh()
    }
  },

  // 加载今日统计
  async loadTodayStats() {
    try {
      const result = await api.review.getStats()
      
      this.setData({
        todayStats: result.data
      })
    } catch (error) {
      console.error('加载今日统计失败:', error)
    }
  },

  // 显示答案
  showAnswer() {
    this.setData({ showAnswer: true });
  },

  // 提交复习结果
  async submitReview(event) {
    const { difficulty } = event.currentTarget.dataset
    const { currentItem, currentIndex, reviewItems, reviewResults } = this.data
    
    if (!currentItem) return
    
    try {
      showLoading('提交中...')
      
      // 提交复习结果到后端
      await api.review.submit({
        memory_item_id: currentItem.memory_item_id,
        difficulty: parseInt(difficulty),
        review_time: new Date().toISOString()
      })
      
      // 记录复习结果
      const result = {
        memory_item_id: currentItem.memory_item_id,
        title: currentItem.title,
        difficulty: parseInt(difficulty),
        timestamp: new Date().toISOString()
      }
      
      const newResults = [...reviewResults, result]
      const nextIndex = currentIndex + 1
      const nextItem = nextIndex < reviewItems.length ? reviewItems[nextIndex] : null
      
      this.setData({
        reviewResults: newResults,
        currentIndex: nextIndex,
        currentItem: nextItem,
        showAnswer: false,
        completedCount: newResults.length
      })
      
      // 如果完成所有复习
      if (!nextItem) {
        this.showReviewResults()
      }
      
      // 更新今日统计
      this.loadTodayStats()
      
    } catch (error) {
      console.error('提交复习结果失败:', error)
      showToast('提交失败，请重试')
    } finally {
      hideLoading()
    }
  },

  // 跳过当前项
  skipCurrent() {
    const { currentIndex, reviewItems } = this.data;
    const nextIndex = currentIndex + 1;
    const nextItem = nextIndex < reviewItems.length ? reviewItems[nextIndex] : null;
    
    this.setData({
      currentIndex: nextIndex,
      currentItem: nextItem,
      showAnswer: false
    });
    
    if (!nextItem) {
      this.showReviewResults();
    }
  },

  // 显示复习结果
  showReviewResults() {
    const { reviewResults, totalCount } = this.data;
    
    // 计算准确率
    const easyCount = reviewResults.filter(r => r.difficulty <= 2).length;
    const accuracy = reviewResults.length > 0 ? Math.round((easyCount / reviewResults.length) * 100) : 0;
    
    this.setData({
      showResults: true,
      'todayStats.accuracy': accuracy
    });
  },

  // 继续复习
  continueReview() {
    this.setData({
      showResults: false,
      reviewResults: [],
      completedCount: 0
    });
    
    this.loadReviewData();
  },

  // 返回首页
  goHome() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  // 查看记忆项详情
  viewMemoryItem() {
    const { currentItem } = this.data;
    if (!currentItem) return;
    
    wx.navigateTo({
      url: `/pages/memory-item/memory-item?id=${currentItem.memory_item_id}`
    });
  },

  // 切换复习模式
  switchMode(event) {
    const { mode } = event.currentTarget.dataset;
    
    if (mode === this.data.reviewMode) return;
    
    this.setData({ reviewMode: mode });
    this.loadReviewData();
  },

  // 查看复习历史
  viewHistory() {
    wx.navigateTo({
      url: '/pages/review-history/review-history'
    });
  },

  // 分享复习成果
  shareResults() {
    const { todayStats } = this.data;
    
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 分享给朋友
  onShareAppMessage() {
    const { todayStats } = this.data;
    
    return {
      title: `我今天完成了${todayStats.completed}个记忆复习，准确率${todayStats.accuracy}%！`,
      path: '/pages/index/index',
      imageUrl: '/images/share-review.png'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { todayStats } = this.data
    
    return {
      title: `MemBuddy - 今日复习成果：${todayStats.completed}个记忆项，准确率${todayStats.accuracy}%`,
      imageUrl: '/images/share-review.png'
    }
  }
});