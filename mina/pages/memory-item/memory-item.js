// pages/memory-item/memory-item.js
import { api } from '../../utils/api.js'
import { requireAuth } from '../../utils/auth.js'
import { showToast, showLoading, hideLoading, showConfirm, copyToClipboard } from '../../utils/utils.js'
import { formatTime } from '../../utils/format.js'

Page({
  data: {
    memoryId: '',
    mode: 'view', // view, edit
    memory: null,
    memoryAids: null,
    loading: false,
    saving: false,
    generating: false,
    
    // 编辑模式数据
    editForm: {
      title: '',
      content: '',
      category: '',
      tags: []
    },
    
    // 记忆辅助展开状态
    expandedSections: {
      mindMap: false,
      keyPrinciples: false,
      memoryScenes: false,
      mnemonics: false,
      sensoryAssociations: false
    },
    
    // 分类选项
    categories: [
      { value: 'study', label: '学习' },
      { value: 'work', label: '工作' },
      { value: 'life', label: '生活' },
      { value: 'other', label: '其他' }
    ],
    
    // 当前选中分类的标签
    selectedCategoryLabel: '请选择分类'
  },

  onLoad(options) {
    // 检查登录状态
    if (!requireAuth()) {
      return
    }
    
    const { id, mode = 'view' } = options
    
    if (!id) {
      showToast('记忆项ID不能为空')
      wx.navigateBack()
      return
    }
    
    this.setData({ 
      memoryId: id,
      mode
    })
    
    this.loadMemoryDetail()
  },

  // 加载记忆项详情
  async loadMemoryDetail() {
    this.setData({ loading: true })
    
    try {
      // 并行加载记忆项和记忆辅助
      const [memoryResult, memoryAidsResult] = await Promise.all([
        api.memory.getById(this.data.memoryId),
        api.memory.getAids(this.data.memoryId)
      ])
      
      const memory = memoryResult.data
      const memoryAids = memoryAidsResult.data
      
      // 格式化时间
      memory.created_at_formatted = formatTime(memory.created_at)
      memory.updated_at_formatted = formatTime(memory.updated_at)
      
      this.setData({ 
        memory,
        memoryAids,
        editForm: {
          title: memory.title,
          content: memory.content,
          category: memory.category || '',
          tags: memory.tags || []
        }
      })
      
      // 更新分类标签
      this.updateSelectedCategoryLabel()
      
    } catch (error) {
      console.error('加载记忆项详情失败:', error)
      showToast('加载失败，请重试')
      wx.navigateBack()
    } finally {
      this.setData({ loading: false })
    }
  },

  // 切换编辑模式
  onToggleEditMode() {
    const newMode = this.data.mode === 'view' ? 'edit' : 'view'
    this.setData({ mode: newMode })
    
    if (newMode === 'edit') {
      // 重置编辑表单
      this.setData({
        editForm: {
          title: this.data.memory.title,
          content: this.data.memory.content,
          category: this.data.memory.category || '',
          tags: this.data.memory.tags || []
        }
      })
      // 更新分类标签
      this.updateSelectedCategoryLabel()
    }
  },

  // 保存编辑
  async onSaveEdit() {
    const { title, content, category, tags } = this.data.editForm
    
    if (!title.trim()) {
      showToast('请输入标题')
      return
    }
    
    if (!content.trim()) {
      showToast('请输入内容')
      return
    }
    
    this.setData({ saving: true })
    showLoading('保存中...')
    
    try {
      const updateData = {
        title: title.trim(),
        content: content.trim(),
        category: category || null,
        tags: tags.filter(tag => tag.trim())
      }
      
      const result = await api.memory.update(this.data.memoryId, updateData)
      const updatedMemory = result.data
      
      // 更新本地数据
      updatedMemory.created_at_formatted = formatTime(updatedMemory.created_at)
      updatedMemory.updated_at_formatted = formatTime(updatedMemory.updated_at)
      
      this.setData({ 
        memory: updatedMemory,
        mode: 'view'
      })
      
      showToast('保存成功', 'success')
      
    } catch (error) {
      console.error('保存记忆项失败:', error)
      showToast('保存失败，请重试')
    } finally {
      this.setData({ saving: false })
      hideLoading()
    }
  },

  // 表单输入处理
  onTitleInput(e) {
    this.setData({
      'editForm.title': e.detail.value
    })
  },

  onContentInput(e) {
    this.setData({
      'editForm.content': e.detail.value
    })
  },

  onCategoryChange(e) {
    const selectedCategory = this.data.categories[e.detail.value]
    this.setData({
      'editForm.category': selectedCategory.value,
      'selectedCategoryLabel': selectedCategory.label
    })
  },
  
  // 更新选中分类标签
  updateSelectedCategoryLabel() {
    const { category } = this.data.editForm
    const selectedCategory = this.data.categories.find(c => c.value === category)
    this.setData({
      selectedCategoryLabel: selectedCategory ? selectedCategory.label : '请选择分类'
    })
  },

  // 标签管理
  onAddTag() {
    wx.showModal({
      title: '添加标签',
      editable: true,
      placeholderText: '请输入标签名称',
      success: (res) => {
        if (res.confirm && res.content) {
          const tag = res.content.trim()
          if (tag && !this.data.editForm.tags.includes(tag)) {
            this.setData({
              'editForm.tags': [...this.data.editForm.tags, tag]
            })
          }
        }
      }
    })
  },

  onRemoveTag(e) {
    const index = e.currentTarget.dataset.index
    const tags = this.data.editForm.tags.filter((_, i) => i !== index)
    this.setData({ 'editForm.tags': tags })
  },

  // 生成记忆辅助
  async onGenerateMemoryAids() {
    if (!this.data.memory) return
    
    this.setData({ generating: true })
    showLoading('AI正在生成记忆辅助...')
    
    try {
      const result = await api.memory.generateAids(this.data.memoryId)
      this.setData({ memoryAids: result.data })
      showToast('生成成功', 'success')
      
    } catch (error) {
      console.error('生成记忆辅助失败:', error)
      showToast('生成失败，请重试')
    } finally {
      this.setData({ generating: false })
      hideLoading()
    }
  },

  // 切换记忆辅助展开状态
  onToggleSection(e) {
    const section = e.currentTarget.dataset.section
    this.setData({
      [`expandedSections.${section}`]: !this.data.expandedSections[section]
    })
  },

  // 复制内容
  onCopyContent(e) {
    const content = e.currentTarget.dataset.content
    copyToClipboard(content)
  },

  // 删除记忆项
  async onDeleteMemory() {
    const confirmed = await showConfirm(
      '确认删除',
      `确定要删除记忆项"${this.data.memory?.title || ''}"吗？此操作不可恢复。`
    )
    
    if (!confirmed) return
    
    showLoading('删除中...')
    
    try {
      await api.memory.delete(this.data.memoryId)
      showToast('删除成功', 'success')
      
      // 返回上一页
      wx.navigateBack()
      
    } catch (error) {
      console.error('删除记忆项失败:', error)
      showToast('删除失败，请重试')
    } finally {
      hideLoading()
    }
  },

  // 分享记忆项
  onShareMemory() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: `分享记忆：${this.data.memory?.title || ''}`,
      path: `/pages/memory-item/memory-item?id=${this.data.memoryId}`,
      imageUrl: this.data.memory?.image_url
    }
  },

  // 页面分享到朋友圈
  onShareTimeline() {
    return {
      title: `${this.data.memory?.title || ''} - MemBuddy`,
      imageUrl: this.data.memory?.image_url
    }
  }
})