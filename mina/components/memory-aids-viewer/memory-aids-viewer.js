// components/memory-aids-viewer/memory-aids-viewer.js
Component({
  properties: {
    aids: {
      type: Object,
      value: null
    },
    visible: {
      type: Boolean,
      value: false
    }
  },

  data: {
    currentTab: 'mindmap',
    tabs: [
      { key: 'mindmap', label: '思维导图', icon: '🧠' },
      { key: 'mnemonics', label: '记忆口诀', icon: '📝' },
      { key: 'sensory', label: '感官联想', icon: '👁️' }
    ]
  },

  observers: {
    'aids': function(aids) {
      this.updateComputedData()
    }
  },

  methods: {
    updateComputedData() {
      const aids = this.data.aids
      if (!aids) return
      
      // 为每个记忆口诀项计算类型图标
      const mnemonicsWithIcons = aids.mnemonics ? aids.mnemonics.map(item => {
        let typeIcon = '📝' // 默认图标
        if (item.type === 'rhyme') typeIcon = '🎵'
        else if (item.type === 'acronym') typeIcon = '🔤'
        else if (item.type === 'story') typeIcon = '📖'
        else if (item.type === 'palace') typeIcon = '🏰'
        
        return {
          ...item,
          typeIcon
        }
      }) : []
      
      // 为每个感官联想项计算类型图标
      const sensoryWithIcons = aids.sensoryAssociations ? aids.sensoryAssociations.map(item => {
        let typeIcon = '✋' // 默认图标
        if (item.type === 'visual') typeIcon = '👁️'
        else if (item.type === 'auditory') typeIcon = '👂'
        
        return {
          ...item,
          typeIcon
        }
      }) : []
      
      this.setData({
        mnemonicsWithIcons,
        sensoryWithIcons
      })
    },

    switchTab(e) {
      const { tab } = e.currentTarget.dataset
      this.setData({ currentTab: tab })
    },

    onShare(e) {
      const { type, content } = e.currentTarget.dataset
      this.triggerEvent('share', { type, content })
    },

    onClose() {
      this.triggerEvent('close')
    },

    onCopy(e) {
      const { content } = e.currentTarget.dataset
      wx.setClipboardData({
        data: content,
        success: () => {
          wx.showToast({
            title: '已复制到剪贴板',
            icon: 'success'
          })
        }
      })
    },

    // 预览思维导图
    previewMindMap() {
      if (!this.data.aids || !this.data.aids.mindMap) return
      
      // 触发事件让父组件处理思维导图预览
      this.triggerEvent('previewMindMap', { mindMap: this.data.aids.mindMap })
    },

    // 生成图片
    generateImage(e) {
      const { content, type } = e.currentTarget.dataset
      this.triggerEvent('generateImage', { content, type })
    },

    // 生成音频
    generateAudio(e) {
      const { content, type } = e.currentTarget.dataset
      this.triggerEvent('generateAudio', { content, type })
    }
  },

  lifetimes: {
    attached() {
      this.updateComputedData()
    }
  }
})