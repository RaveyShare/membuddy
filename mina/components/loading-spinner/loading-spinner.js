// components/loading-spinner/loading-spinner.js
Component({
  properties: {
    message: {
      type: String,
      value: 'AI 正在生成记忆辅助工具...'
    },
    showBrain: {
      type: Boolean,
      value: true
    },
    visible: {
      type: Boolean,
      value: true
    }
  },

  data: {
    dots: ['', '.', '..', '...']
  },

  lifetimes: {
    attached() {
      this.startAnimation()
    },

    detached() {
      this.stopAnimation()
    }
  },

  methods: {
    startAnimation() {
      let index = 0
      this.animationTimer = setInterval(() => {
        this.setData({
          currentDot: this.data.dots[index % this.data.dots.length]
        })
        index++
      }, 500)
    },

    stopAnimation() {
      if (this.animationTimer) {
        clearInterval(this.animationTimer)
        this.animationTimer = null
      }
    }
  }
})