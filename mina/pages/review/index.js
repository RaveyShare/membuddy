// pages/review/index.js
const api = require('../../utils/api')
const { formatDate, getRelativeTime } = require('../../utils/date')

Page({
  data: {
    // 基础数据
    itemId: '',
    item: null,
    editableContent: '',
    currentSchedule: null,
    
    // 加载状态
    isLoading: true,
    isSubmitting: false,
    
    // 复习状态
    mastery: 0,
    difficulty: 'medium',
    nextReviewDate: new Date(),
    category: '',
    tags: [],
    currentTag: '',
    
    // 选项数据
    difficultyOptions: [
      { value: 'easy', label: '简单' },
      { value: 'medium', label: '中等' },
      { value: 'hard', label: '困难' }
    ],
    categoryOptions: ['历史', '化学', '语言', '数学', '地理', '其他'],
    categoryIndex: 0,
    
    // 日期时间选择器数据
    dateTimeRange: [[], [], [], []], // 年、月、日、时
    dateTimeValue: [0, 0, 0, 0],
    
    // 计算属性
    nextReviewText: '',
    nextReviewDateText: '',
    difficultyText: ''
  },

  onLoad(options) {
    const itemId = options.id
    if (!itemId) {
      wx.showToast({
        title: '参数错误',
        icon: 'error'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }
    
    this.setData({ itemId })
    this.initDateTimePicker()
    this.loadReviewData()
  },

  // 初始化日期时间选择器
  initDateTimePicker() {
    const now = new Date()
    const currentYear = now.getFullYear()
    
    // 生成年份选项（当前年份到未来5年）
    const years = []
    for (let i = 0; i < 6; i++) {
      years.push(`${currentYear + i}年`)
    }
    
    // 生成月份选项
    const months = []
    for (let i = 1; i <= 12; i++) {
      months.push(`${i}月`)
    }
    
    // 生成日期选项
    const days = []
    for (let i = 1; i <= 31; i++) {
      days.push(`${i}日`)
    }
    
    // 生成小时选项
    const hours = []
    for (let i = 0; i < 24; i++) {
      hours.push(`${i.toString().padStart(2, '0')}时`)
    }
    
    this.setData({
      dateTimeRange: [years, months, days, hours],
      dateTimeValue: [
        0, // 当前年份
        now.getMonth(), // 当前月份
        now.getDate() - 1, // 当前日期
        now.getHours() // 当前小时
      ]
    })
  },

  // 加载复习数据
  async loadReviewData() {
    try {
      this.setData({ isLoading: true })
      
      // 并行获取记忆项目和复习计划
      const [item, schedules] = await Promise.all([
        api.getMemoryItem(this.data.itemId),
        api.getReviewSchedules(this.data.itemId)
      ])
      
      // 设置基础数据
      this.setData({
        item,
        editableContent: item.content,
        mastery: item.mastery,
        difficulty: item.difficulty,
        category: item.category,
        tags: item.tags || []
      })
      
      // 设置下次复习时间
      if (item.next_review_date) {
        const nextDate = new Date(item.next_review_date)
        this.setData({ nextReviewDate: nextDate })
        this.updateDateTimePicker(nextDate)
      }
      
      // 设置分类索引
      const categoryIndex = this.data.categoryOptions.indexOf(item.category)
      this.setData({ categoryIndex: categoryIndex >= 0 ? categoryIndex : 0 })
      
      // 查找当前复习计划
      const upcomingSchedules = schedules
        .filter(s => !s.completed)
        .sort((a, b) => new Date(a.review_date).getTime() - new Date(b.review_date).getTime())
      
      if (upcomingSchedules.length > 0) {
        this.setData({ currentSchedule: upcomingSchedules[0] })
      }
      
      this.updateComputedData()
      
    } catch (error) {
      console.error('Failed to load review data:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } finally {
      this.setData({ isLoading: false })
    }
  },

  // 更新日期时间选择器
  updateDateTimePicker(date) {
    const currentYear = new Date().getFullYear()
    const yearIndex = date.getFullYear() - currentYear
    const monthIndex = date.getMonth()
    const dayIndex = date.getDate() - 1
    const hourIndex = date.getHours()
    
    this.setData({
      dateTimeValue: [yearIndex, monthIndex, dayIndex, hourIndex]
    })
  },

  // 更新计算属性
  updateComputedData() {
    const { item, nextReviewDate, difficulty } = this.data
    
    // 更新下次复习文本
    const nextReviewText = item.next_review_date 
      ? formatDate(new Date(item.next_review_date), 'MM-DD HH:mm')
      : '无计划'
    
    // 更新下次复习日期文本
    const nextReviewDateText = formatDate(nextReviewDate, 'YYYY年MM月DD日 HH时')
    
    // 更新难度文本
    const difficultyMap = {
      'easy': '简单',
      'medium': '中等', 
      'hard': '困难'
    }
    const difficultyText = difficultyMap[difficulty] || '中等'
    
    this.setData({
      nextReviewText,
      nextReviewDateText,
      difficultyText
    })
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  },

  // 内容输入
  onContentInput(e) {
    this.setData({
      editableContent: e.detail.value
    })
  },

  // 掌握度变化
  onMasteryChange(e) {
    this.setData({
      mastery: e.detail.value
    })
  },

  // 难度变化
  onDifficultyChange(e) {
    const difficulty = e.currentTarget.dataset.value
    this.setData({ difficulty })
    this.updateComputedData()
  },

  // 日期时间变化
  onDateTimeChange(e) {
    const values = e.detail.value
    const currentYear = new Date().getFullYear()
    
    const year = currentYear + values[0]
    const month = values[1]
    const day = values[2] + 1
    const hour = values[3]
    
    const nextReviewDate = new Date(year, month, day, hour, 0, 0)
    
    this.setData({
      dateTimeValue: values,
      nextReviewDate
    })
    this.updateComputedData()
  },

  // 分类变化
  onCategoryChange(e) {
    const categoryIndex = e.detail.value
    const category = this.data.categoryOptions[categoryIndex]
    
    this.setData({
      categoryIndex,
      category
    })
  },

  // 标签输入
  onTagInput(e) {
    this.setData({
      currentTag: e.detail.value
    })
  },

  // 添加标签
  addTag() {
    const { currentTag, tags } = this.data
    
    if (!currentTag.trim()) {
      return
    }
    
    if (tags.includes(currentTag.trim())) {
      wx.showToast({
        title: '标签已存在',
        icon: 'none'
      })
      return
    }
    
    this.setData({
      tags: [...tags, currentTag.trim()],
      currentTag: ''
    })
  },

  // 移除标签
  removeTag(e) {
    const tagToRemove = e.currentTarget.dataset.tag
    const tags = this.data.tags.filter(tag => tag !== tagToRemove)
    
    this.setData({ tags })
  },

  // 完成复习
  async completeReview() {
    if (this.data.isSubmitting) {
      return
    }
    
    const { 
      item, 
      editableContent, 
      mastery, 
      difficulty, 
      nextReviewDate, 
      category, 
      tags, 
      currentSchedule 
    } = this.data
    
    if (!item) {
      wx.showToast({
        title: '数据不完整',
        icon: 'error'
      })
      return
    }
    
    try {
      this.setData({ isSubmitting: true })
      
      // 如果有当前复习计划，完成它
      if (currentSchedule) {
        await api.completeReview(currentSchedule.id, {
          mastery,
          difficulty
        })
      }
      
      // 更新记忆项目
      await api.updateMemoryItem(item.id, {
        content: editableContent,
        category,
        tags,
        next_review_date: nextReviewDate.toISOString(),
        memory_aids: item.memory_aids
      })
      
      wx.showToast({
        title: '复习完成！',
        icon: 'success'
      })
      
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      
    } catch (error) {
      console.error('Failed to complete review:', error)
      wx.showToast({
        title: '保存失败',
        icon: 'error'
      })
    } finally {
      this.setData({ isSubmitting: false })
    }
  }
})