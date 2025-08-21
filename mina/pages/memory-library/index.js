// pages/memory-library/index.js
const { formatDate, getRelativeTime } = require('../../utils/date')
const api = require('../../utils/api')
const { showToast, showModal } = require('../../utils/ui')

Page({
  data: {
    // 搜索和筛选
    searchQuery: '',
    categoryIndex: 0,
    sortIndex: 0,
    categoryOptions: [
      { value: 'all', label: '全部' },
      { value: '历史', label: '历史' },
      { value: '化学', label: '化学' },
      { value: '语言', label: '语言' },
      { value: '数学', label: '数学' },
      { value: '地理', label: '地理' }
    ],
    sortOptions: [
      { value: 'recent', label: '下次复习' },
      { value: 'mastery', label: '掌握度' },
      { value: 'reviews', label: '复习次数' },
      { value: 'alphabetical', label: '字母顺序' }
    ],
    
    // 数据
    memoryItems: [],
    sortedItems: [],
    isLoading: true,
    
    // 统计信息
    stats: {
      totalItems: 0,
      averageMastery: 0,
      totalReviews: 0,
      starredItems: 0
    },
    
    // 操作菜单
    showActionMenu: false,
    selectedItem: null
  },

  onLoad() {
    this.loadMemoryItems()
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadMemoryItems()
  },

  // 加载记忆项目
  async loadMemoryItems() {
    try {
      this.setData({ isLoading: true })
      
      const items = await api.getMemoryItems()
      
      // 处理数据
      const processedItems = items.map(item => {
        return {
          ...item,
          masteryLevel: this.getMasteryLevel(item.mastery),
          nextReviewText: item.next_review_date ? formatDate(item.next_review_date, 'MM-DD HH:mm') : '无计划',
          relativeTimeText: this.getRelativeTimeText(item.next_review_date)
        }
      })
      
      // 计算统计信息
      const stats = this.calculateStats(processedItems)
      
      this.setData({
        memoryItems: processedItems,
        stats,
        isLoading: false
      })
      
      // 应用筛选和排序
      this.applyFilterAndSort()
      
    } catch (error) {
      console.error('加载记忆项目失败:', error)
      showToast('加载失败，请重试')
      this.setData({ isLoading: false })
    }
  },

  // 计算统计信息
  calculateStats(items) {
    const totalItems = items.length
    const averageMastery = totalItems > 0 
      ? Math.round(items.reduce((sum, item) => sum + item.mastery, 0) / totalItems)
      : 0
    const totalReviews = items.reduce((sum, item) => sum + (item.reviewCount || 0), 0)
    const starredItems = items.filter(item => item.starred).length
    
    return {
      totalItems,
      averageMastery,
      totalReviews,
      starredItems
    }
  },

  // 获取掌握度等级
  getMasteryLevel(mastery) {
    if (mastery >= 80) return 'high'
    if (mastery >= 60) return 'medium'
    return 'low'
  },

  // 获取相对时间文本
  getRelativeTimeText(reviewDate) {
    if (!reviewDate) return '无计划'
    
    const now = new Date()
    const reviewTime = new Date(reviewDate)
    const diffMillis = reviewTime.getTime() - now.getTime()
    
    if (diffMillis <= 0) return '已到期'
    
    const diffMinutes = Math.floor(diffMillis / (1000 * 60))
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) return `${diffDays}天后`
    if (diffHours > 0) return `${diffHours}小时后`
    return `${diffMinutes}分钟后`
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({
      searchQuery: e.detail.value
    })
    this.applyFilterAndSort()
  },

  // 分类筛选
  onCategoryChange(e) {
    this.setData({
      categoryIndex: parseInt(e.detail.value)
    })
    this.applyFilterAndSort()
  },

  // 排序方式
  onSortChange(e) {
    this.setData({
      sortIndex: parseInt(e.detail.value)
    })
    this.applyFilterAndSort()
  },

  // 应用筛选和排序
  applyFilterAndSort() {
    const { memoryItems, searchQuery, categoryIndex, sortIndex, categoryOptions, sortOptions } = this.data
    
    // 筛选
    let filteredItems = memoryItems.filter(item => {
      // 搜索匹配
      const matchesSearch = !searchQuery || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
      
      // 分类匹配
      const selectedCategory = categoryOptions[categoryIndex].value
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
      
      return matchesSearch && matchesCategory
    })
    
    // 排序
    const sortBy = sortOptions[sortIndex].value
    filteredItems.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          const aTime = a.next_review_date ? new Date(a.next_review_date).getTime() : Infinity
          const bTime = b.next_review_date ? new Date(b.next_review_date).getTime() : Infinity
          return aTime - bTime
        case 'mastery':
          return b.mastery - a.mastery
        case 'reviews':
          return (b.reviewCount || 0) - (a.reviewCount || 0)
        case 'alphabetical':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })
    
    this.setData({
      sortedItems: filteredItems
    })
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  },

  // 点击记忆项目
  onItemTap(e) {
    const item = e.currentTarget.dataset.item
    this.onViewDetails({ currentTarget: { dataset: { item } } })
  },

  // 显示操作菜单
  onCardActions(e) {
    const item = e.currentTarget.dataset.item
    this.setData({
      showActionMenu: true,
      selectedItem: item
    })
  },

  // 隐藏操作菜单
  hideActionMenu() {
    this.setData({
      showActionMenu: false,
      selectedItem: null
    })
  },

  // 查看详情
  onViewDetails(e) {
    const item = e.currentTarget.dataset.item
    this.hideActionMenu()
    wx.navigateTo({
      url: `/pages/memory-item/index?id=${item.id}`
    })
  },

  // 开始复习
  onStartReview(e) {
    const item = e.currentTarget.dataset.item
    wx.navigateTo({
      url: `/pages/review/index?id=${item.id}`
    })
  },

  // 编辑项目
  onEditItem(e) {
    const item = e.currentTarget.dataset.item
    this.hideActionMenu()
    wx.navigateTo({
      url: `/pages/memory-item/edit?id=${item.id}`
    })
  },

  // 删除项目
  async onDeleteItem(e) {
    const item = e.currentTarget.dataset.item
    this.hideActionMenu()
    
    const result = await showModal({
      title: '确认删除',
      content: `您确定要删除"${item.title}"吗？此操作不可撤销。`
    })
    
    if (result.confirm) {
      try {
        await api.deleteMemoryItem(item.id)
        showToast('删除成功')
        this.loadMemoryItems() // 重新加载数据
      } catch (error) {
        console.error('删除失败:', error)
        showToast('删除失败，请重试')
      }
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadMemoryItems().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 触底加载更多（如果需要分页）
  onReachBottom() {
    // 暂时不实现分页，如果数据量大可以考虑
  }
})