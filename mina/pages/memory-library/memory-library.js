// pages/memory-library/memory-library.js
import { api } from '../../utils/api.js'
import { requireAuth } from '../../utils/auth.js'
import { showToast, showLoading, hideLoading, showConfirm } from '../../utils/utils.js'
import { formatTime } from '../../utils/format.js'

Page({
  data: {
    memories: [],
    loading: false,
    refreshing: false,
    hasMore: true,
    page: 1,
    pageSize: 20,
    searchKeyword: '',
    selectedCategory: 'all',
    categories: [
      { id: 'all', name: '全部', count: 0 },
      { id: 'study', name: '学习', count: 0 },
      { id: 'work', name: '工作', count: 0 },
      { id: 'life', name: '生活', count: 0 },
      { id: 'other', name: '其他', count: 0 }
    ],
    showSearch: false,
    sortBy: 'created_at', // created_at, updated_at, title
    sortOrder: 'desc' // asc, desc
  },

  onLoad() {
    // 检查登录状态
    if (!requireAuth()) {
      return
    }
    
    this.loadMemories()
  },

  onShow() {
    // 页面显示时刷新数据
    this.refreshMemories()
  },

  // 加载记忆项列表
  async loadMemories(reset = false) {
    if (this.data.loading) return
    
    this.setData({ loading: true })
    
    try {
      const params = {
        page: reset ? 1 : this.data.page,
        page_size: this.data.pageSize,
        search: this.data.searchKeyword || undefined,
        category: this.data.selectedCategory === 'all' ? undefined : this.data.selectedCategory,
        sort_by: this.data.sortBy,
        sort_order: this.data.sortOrder
      }
      
      const result = await api.memory.getList(params)
      
      const newMemories = result.data.items.map(item => ({
        ...item,
        created_at_formatted: formatTime(item.created_at),
        updated_at_formatted: formatTime(item.updated_at)
      }))
      
      this.setData({
        memories: reset ? newMemories : [...this.data.memories, ...newMemories],
        hasMore: result.data.has_more,
        page: reset ? 2 : this.data.page + 1
      })
      
      // 更新分类统计
      this.updateCategoryStats(result.data.category_stats || {})
      
    } catch (error) {
      console.error('加载记忆项失败:', error)
      showToast('加载失败，请重试')
    } finally {
      this.setData({ loading: false, refreshing: false })
    }
  },

  // 刷新记忆项
  async refreshMemories() {
    this.setData({ refreshing: true, page: 1 })
    await this.loadMemories(true)
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMemories()
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshMemories().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 更新分类统计
  updateCategoryStats(stats) {
    const categories = this.data.categories.map(cat => ({
      ...cat,
      count: stats[cat.id] || 0
    }))
    
    // 更新全部分类的数量
    categories[0].count = Object.values(stats).reduce((sum, count) => sum + count, 0)
    
    this.setData({ categories })
  },

  // 切换分类
  onCategoryChange(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ 
      selectedCategory: category,
      page: 1
    })
    this.loadMemories(true)
  },

  // 切换搜索框显示
  onToggleSearch() {
    this.setData({ showSearch: !this.data.showSearch })
    if (!this.data.showSearch) {
      this.setData({ searchKeyword: '' })
      this.loadMemories(true)
    }
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
  },

  // 执行搜索
  onSearch() {
    this.setData({ page: 1 })
    this.loadMemories(true)
  },

  // 清空搜索
  onClearSearch() {
    this.setData({ searchKeyword: '', page: 1 })
    this.loadMemories(true)
  },

  // 排序选择
  onSortChange() {
    wx.showActionSheet({
      itemList: ['按创建时间', '按更新时间', '按标题'],
      success: (res) => {
        const sortOptions = [
          { sortBy: 'created_at', sortOrder: 'desc' },
          { sortBy: 'updated_at', sortOrder: 'desc' },
          { sortBy: 'title', sortOrder: 'asc' }
        ]
        
        const option = sortOptions[res.tapIndex]
        this.setData({ 
          sortBy: option.sortBy,
          sortOrder: option.sortOrder,
          page: 1
        })
        this.loadMemories(true)
      }
    })
  },

  // 查看记忆项详情
  onViewMemory(e) {
    const memoryId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/memory-item/memory-item?id=${memoryId}`
    })
  },

  // 编辑记忆项
  onEditMemory(e) {
    const memoryId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/memory-item/memory-item?id=${memoryId}&mode=edit`
    })
  },

  // 删除记忆项
  async onDeleteMemory(e) {
    const memoryId = e.currentTarget.dataset.id
    const memory = this.data.memories.find(m => m.id === memoryId)
    
    const confirmed = await showConfirm(
      '确认删除',
      `确定要删除记忆项"${memory?.title || ''}"吗？此操作不可恢复。`
    )
    
    if (!confirmed) return
    
    showLoading('删除中...')
    
    try {
      await api.memory.delete(memoryId)
      
      // 从列表中移除
      const memories = this.data.memories.filter(m => m.id !== memoryId)
      this.setData({ memories })
      
      showToast('删除成功', 'success')
      
    } catch (error) {
      console.error('删除记忆项失败:', error)
      showToast('删除失败，请重试')
    } finally {
      hideLoading()
    }
  },

  // 分享记忆项
  onShareMemory(e) {
    const memoryId = e.currentTarget.dataset.id
    const memory = this.data.memories.find(m => m.id === memoryId)
    
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
    
    // 设置分享内容
    this.shareMemory = memory
  },

  // 创建新记忆项
  onCreateMemory() {
    wx.navigateTo({
      url: '/pages/index/index'
    })
  },

  // 页面分享
  onShareAppMessage() {
    if (this.shareMemory) {
      return {
        title: `分享记忆：${this.shareMemory.title}`,
        path: `/pages/memory-item/memory-item?id=${this.shareMemory.id}`,
        imageUrl: this.shareMemory.image_url
      }
    }
    
    return {
      title: '我的记忆库 - MemBuddy',
      path: '/pages/memory-library/memory-library'
    }
  }
})