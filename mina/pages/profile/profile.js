// pages/profile/profile.js
import { api } from '../../utils/api.js'
import { getUserInfo, logout, requireAuth } from '../../utils/auth.js'
import { showToast, showLoading, hideLoading, showConfirm } from '../../utils/utils.js'
import { formatTime } from '../../utils/format.js'

Page({
  data: {
    // 用户信息
    userInfo: null,
    
    // 统计数据
    stats: {
      totalMemories: 0,
      totalReviews: 0,
      streakDays: 0,
      accuracy: 0
    },
    
    // 设置选项
    settings: {
      notifications: true,
      autoBackup: true,
      reviewReminder: true,
      darkMode: false
    },
    
    // 页面状态
    loading: true,
    editing: false,
    
    // 编辑表单
    editForm: {
      nickname: '',
      bio: ''
    },
    
    // 功能菜单
    menuItems: [
      {
        id: 'memories',
        icon: '📚',
        title: '我的记忆库',
        desc: '查看所有记忆项',
        url: '/pages/memory-library/memory-library'
      },
      {
        id: 'review-history',
        icon: '📊',
        title: '复习历史',
        desc: '查看复习记录',
        url: '/pages/review-history/review-history'
      },
      {
        id: 'export',
        icon: '📤',
        title: '数据导出',
        desc: '导出记忆数据',
        action: 'exportData'
      },
      {
        id: 'feedback',
        icon: '💬',
        title: '意见反馈',
        desc: '帮助我们改进',
        action: 'showFeedback'
      },
      {
        id: 'about',
        icon: 'ℹ️',
        title: '关于应用',
        desc: '版本信息',
        action: 'showAbout'
      }
    ]
  },

  onLoad() {
    // 检查登录状态
    if (!requireAuth()) {
      return
    }
    
    this.loadUserProfile()
  },

  onShow() {
    // 页面显示时刷新数据
    if (!this.data.loading) {
      this.loadUserStats();
    }
  },

  onPullDownRefresh() {
    this.refreshProfile();
  },

  // 加载用户资料
  async loadUserProfile() {
    try {
      this.setData({ loading: true })
      
      // 获取本地用户信息
      const localUserInfo = getUserInfo()
      if (localUserInfo) {
        this.setData({ 
          userInfo: localUserInfo,
          'editForm.nickname': localUserInfo.nickname || '',
          'editForm.bio': localUserInfo.bio || ''
        })
      }
      
      // 获取用户统计数据
      await this.loadUserStats()
      
      // 获取最新用户信息
      const result = await api.user.getProfile()
      this.setData({
        userInfo: result.data,
        'editForm.nickname': result.data.nickname || '',
        'editForm.bio': result.data.bio || ''
      })
      
      this.setData({ loading: false })
    } catch (error) {
      console.error('加载用户资料失败:', error)
      this.setData({ loading: false })
    }
  },

  // 加载用户统计
  async loadUserStats() {
    try {
      const result = await api.user.getStats()
      this.setData({ stats: result.data })
    } catch (error) {
      console.error('加载用户统计失败:', error)
    }
  },

  // 刷新资料
  async refreshProfile() {
    try {
      await this.loadUserProfile();
      showToast('刷新成功', 'success');
    } catch (error) {
      showToast('刷新失败，请重试');
    } finally {
      wx.stopPullDownRefresh();
    }
  },

  // 开始编辑
  startEdit() {
    this.setData({ editing: true });
  },

  // 取消编辑
  cancelEdit() {
    const { userInfo } = this.data;
    this.setData({
      editing: false,
      'editForm.nickname': userInfo?.nickname || '',
      'editForm.bio': userInfo?.bio || ''
    });
  },

  // 保存编辑
  async saveEdit() {
    const { editForm } = this.data
    
    if (!editForm.nickname.trim()) {
      showToast('请输入昵称')
      return
    }
    
    try {
      showLoading('保存中...')
      
      await api.user.updateProfile({
        nickname: editForm.nickname.trim(),
        bio: editForm.bio.trim()
      })
      
      this.setData({
        editing: false,
        userInfo: {
          ...this.data.userInfo,
          nickname: editForm.nickname.trim(),
          bio: editForm.bio.trim()
        }
      })
      
      showToast('保存成功', 'success')
    } catch (error) {
      console.error('保存用户资料失败:', error)
      showToast('保存失败，请重试')
    } finally {
      hideLoading()
    }
  },

  // 输入处理
  onNicknameInput(event) {
    this.setData({
      'editForm.nickname': event.detail.value
    });
  },

  onBioInput(event) {
    this.setData({
      'editForm.bio': event.detail.value
    });
  },

  // 菜单项点击
  onMenuItemTap(event) {
    const { item } = event.currentTarget.dataset;
    
    if (item.url) {
      wx.navigateTo({
        url: item.url
      });
    } else if (item.action) {
      this[item.action]();
    }
  },

  // 数据导出
  async exportData() {
    try {
      const result = await showConfirm('确认导出', '是否导出所有记忆数据？')
      if (!result.confirm) return
      
      showLoading('导出中...')
      
      const exportResult = await api.user.exportData()
      // 这里可以实现数据下载或分享功能
      showToast('导出成功', 'success')
    } catch (error) {
      console.error('导出数据失败:', error)
      showToast('导出失败，请重试')
    } finally {
      hideLoading()
    }
  },

  // 显示反馈
  showFeedback() {
    wx.navigateTo({
      url: '/pages/feedback/feedback'
    });
  },

  // 显示关于
  showAbout() {
    wx.showModal({
      title: '关于记忆伙伴',
      content: '版本：1.0.0\n\n记忆伙伴是一款基于AI的智能记忆助手，帮助您更好地学习和记忆知识。\n\n© 2024 记忆伙伴团队',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 设置切换
  onSettingChange(event) {
    const { setting } = event.currentTarget.dataset;
    const { value } = event.detail;
    
    this.setData({
      [`settings.${setting}`]: value
    });
    
    // 这里可以调用API保存设置
    this.saveSettings();
  },

  // 保存设置
  async saveSettings() {
    try {
      const { settings } = this.data
      await api.user.updateSettings(settings)
    } catch (error) {
      console.error('保存设置失败:', error)
    }
  },

  // 退出登录
  async handleLogout() {
    try {
      const result = await showConfirm('确认退出', '确定要退出登录吗？')
      if (!result.confirm) return
      
      showLoading('退出中...')
      
      // 调用后端退出接口
      await api.auth.logout()
      
      // 清除本地数据
      logout()
      
      // 跳转到登录页
      wx.reLaunch({
        url: '/pages/auth/login/login'
      })
      
    } catch (error) {
      console.error('退出登录失败:', error)
      showToast('退出失败，请重试')
    } finally {
      hideLoading()
    }
  },

  // 分享应用
  shareApp() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 分享给朋友
  onShareAppMessage() {
    const { stats } = this.data
    
    return {
      title: `我在MemBuddy已经学习了${stats.totalMemories}个知识点，一起来提升记忆力吧！`,
      path: '/pages/index/index',
      imageUrl: '/images/share-app.png'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { stats } = this.data
    
    return {
      title: `MemBuddy - 我的学习成果：${stats.totalMemories}个记忆项，${stats.streakDays}天连续学习`,
      imageUrl: '/images/share-app.png'
    }
  }
});