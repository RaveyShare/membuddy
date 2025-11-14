/*******************************************************************************************
 * 现代深色主题演示页面
 * 展示新的UI设计和功能
 * @author ravey
 *******************************************************************************************/

// 获取应用实例
const app = getApp();

Page({
  data: {
    // 演示数据
    demoFeatures: [
      {
        id: 'gradient-design',
        title: '渐变设计',
        description: '现代化的渐变色彩和玻璃拟态效果',
        icon: '🎨',
        color: '#44D1FF'
      },
      {
        id: 'glass-morphism',
        title: '玻璃拟态',
        description: '半透明背景和模糊效果',
        icon: '🔮',
        color: '#4C7DFF'
      },
      {
        id: 'smooth-animations',
        title: '流畅动画',
        description: '精心设计的过渡和交互动画',
        icon: '✨',
        color: '#7A58FF'
      },
      {
        id: 'responsive-layout',
        title: '响应式布局',
        description: '适配各种屏幕尺寸的现代化布局',
        icon: '📱',
        color: '#9B5EF7'
      }
    ],
    
    // 主题切换
    currentTheme: 'dark',
    themes: [
      { name: 'dark', label: '深色主题', color: '#000000' },
      { name: 'light', label: '浅色主题', color: '#FFFFFF' }
    ],
    
    // 动画演示
    animationDemo: {
      pulse: false,
      float: false,
      glow: false
    },
    
    // 交互状态
    interactiveStates: {
      buttonHovered: false,
      cardHovered: false,
      inputFocused: false
    }
  },

  /*******************************************************************************************
   * 生命周期函数
   *******************************************************************************************/

  onLoad: function(options) {
    console.log('现代UI演示页面加载完成');
    this.startAnimationDemo();
  },

  onShow: function() {
    this.updateTheme();
  },

  onReady: function() {
    // 页面渲染完成
  },

  /*******************************************************************************************
   * 主题和样式
   *******************************************************************************************/

  // 切换主题
  switchTheme: function(e) {
    const theme = e.currentTarget.dataset.theme;
    this.setData({
      currentTheme: theme
    });
    
    this.updateTheme();
    
    wx.showToast({
      title: `已切换到${theme === 'dark' ? '深色' : '浅色'}主题`,
      icon: 'none'
    });
  },

  // 更新主题样式
  updateTheme: function() {
    const theme = this.data.currentTheme;
    
    // 设置页面背景色
    wx.setBackgroundColor({
      backgroundColor: theme === 'dark' ? '#000000' : '#FFFFFF',
      backgroundColorTop: theme === 'dark' ? '#000000' : '#FFFFFF',
      backgroundColorBottom: theme === 'dark' ? '#121212' : '#F5F5F5'
    });
    
    // 设置导航栏颜色
    wx.setNavigationBarColor({
      frontColor: theme === 'dark' ? '#ffffff' : '#000000',
      backgroundColor: theme === 'dark' ? '#000000' : '#FFFFFF'
    });
  },

  /*******************************************************************************************
   * 动画演示
   *******************************************************************************************/

  // 启动动画演示
  startAnimationDemo: function() {
    // 脉冲动画
    setInterval(() => {
      this.setData({
        'animationDemo.pulse': !this.data.animationDemo.pulse
      });
    }, 2000);
    
    // 浮动动画
    setInterval(() => {
      this.setData({
        'animationDemo.float': !this.data.animationDemo.float
      });
    }, 3000);
    
    // 发光动画
    setInterval(() => {
      this.setData({
        'animationDemo.glow': !this.data.animationDemo.glow
      });
    }, 2500);
  },

  /*******************************************************************************************
   * 交互功能
   *******************************************************************************************/

  // 功能卡片点击
  onFeatureCardTap: function(e) {
    const feature = e.currentTarget.dataset.feature;
    
    wx.showModal({
      title: feature.title,
      content: feature.description,
      showCancel: false,
      confirmText: '知道了',
      confirmColor: feature.color
    });
  },

  // 演示按钮点击
  onDemoButtonTap: function(e) {
    const demoType = e.currentTarget.dataset.type;
    
    switch (demoType) {
      case 'gradient':
        this.showGradientDemo();
        break;
      case 'glass':
        this.showGlassDemo();
        break;
      case 'animation':
        this.showAnimationDemo();
        break;
      case 'responsive':
        this.showResponsiveDemo();
        break;
      default:
        wx.showToast({
          title: '演示功能开发中',
          icon: 'none'
        });
    }
  },

  // 渐变演示
  showGradientDemo: function() {
    wx.showActionSheet({
      itemList: ['主色调渐变', '紫色渐变', '蓝色渐变', '粉色渐变'],
      success: (res) => {
        const gradients = [
          'linear-gradient(135deg, #44D1FF 0%, #4C7DFF 50%, #7A58FF 100%)',
          'linear-gradient(135deg, #FFC0F0 0%, #C874F7 50%, #9B5EF7 100%)',
          'linear-gradient(135deg, #4C7DFF 0%, #44D1FF 100%)',
          'linear-gradient(135deg, #FFC0F0 0%, #F093FB 100%)'
        ];
        
        wx.showModal({
          title: '渐变色彩',
          content: `已选择: ${['主色调', '紫色', '蓝色', '粉色'][res.tapIndex]}渐变`,
          showCancel: false
        });
      }
    });
  },

  // 玻璃拟态演示
  showGlassDemo: function() {
    wx.showModal({
      title: '玻璃拟态效果',
      content: '玻璃拟态(Glassmorphism)是一种现代化的UI设计趋势，通过半透明背景和模糊效果创造出层次感和深度感。',
      showCancel: false,
      confirmText: '很酷！'
    });
  },

  // 动画演示
  showAnimationDemo: function() {
    const animations = [
      '旋转加载动画',
      '脉冲发光效果',
      '浮动上升动画',
      '渐变过渡效果'
    ];
    
    wx.showActionSheet({
      itemList: animations,
      success: (res) => {
        wx.showToast({
          title: `正在演示: ${animations[res.tapIndex]}`,
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 响应式演示
  showResponsiveDemo: function() {
    const systemInfo = wx.getSystemInfoSync();
    
    wx.showModal({
      title: '响应式设计',
      content: `当前设备: ${systemInfo.model}\n屏幕尺寸: ${systemInfo.screenWidth}x${systemInfo.screenHeight}\n像素密度: ${systemInfo.pixelRatio}\n\nUI会自动适配不同设备尺寸。`,
      showCancel: false
    });
  },

  /*******************************************************************************************
   * 交互状态
   *******************************************************************************************/

  // 按钮悬停效果
  onButtonHover: function(e) {
    const hover = e.type === 'touchstart';
    this.setData({
      'interactiveStates.buttonHovered': hover
    });
  },

  // 卡片悬停效果
  onCardHover: function(e) {
    const hover = e.type === 'touchstart';
    this.setData({
      'interactiveStates.cardHovered': hover
    });
  },

  // 输入框聚焦
  onInputFocus: function(e) {
    const focused = e.type === 'focus';
    this.setData({
      'interactiveStates.inputFocused': focused
    });
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

  // 复制到剪贴板
  copyToClipboard: function(text) {
    wx.setClipboardData({
      data: text,
      success: () => {
        this.showToast('已复制到剪贴板');
      }
    });
  },

  // 分享功能
  onShareAppMessage: function() {
    return {
      title: 'MemBuddy - 现代化记忆助手',
      path: '/pages/demo/demo',
      imageUrl: '/assets/images/share-demo.png'
    };
  }
});