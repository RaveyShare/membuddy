// components/ui/button/button.js
Component({
  properties: {
    // 按钮变体
    variant: {
      type: String,
      value: 'default' // default, destructive, outline, secondary, ghost, link
    },
    // 按钮尺寸
    size: {
      type: String,
      value: 'default' // default, sm, lg, icon
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      value: false
    },
    // 是否加载中
    loading: {
      type: Boolean,
      value: false
    },
    // 按钮类型
    type: {
      type: String,
      value: 'button' // button, submit, reset
    },
    // 自定义类名
    customClass: {
      type: String,
      value: ''
    },
    // 按钮文本
    text: {
      type: String,
      value: ''
    },
    // 图标
    icon: {
      type: String,
      value: ''
    },
    // 图标位置
    iconPosition: {
      type: String,
      value: 'left' // left, right
    }
  },

  data: {
    // 按钮样式类名映射
    variantClasses: {
      default: 'btn-default',
      destructive: 'btn-destructive',
      outline: 'btn-outline',
      secondary: 'btn-secondary',
      ghost: 'btn-ghost',
      link: 'btn-link'
    },
    sizeClasses: {
      default: 'btn-default-size',
      sm: 'btn-sm',
      lg: 'btn-lg',
      icon: 'btn-icon'
    }
  },

  computed: {
    // 计算按钮的完整类名
    buttonClass() {
      const { variant, size, disabled, loading, customClass } = this.data;
      const variantClass = this.data.variantClasses[variant] || 'btn-default';
      const sizeClass = this.data.sizeClasses[size] || 'btn-default-size';
      
      let classes = ['btn', variantClass, sizeClass];
      
      if (disabled || loading) {
        classes.push('btn-disabled');
      }
      
      if (loading) {
        classes.push('btn-loading');
      }
      
      if (customClass) {
        classes.push(customClass);
      }
      
      return classes.join(' ');
    }
  },

  methods: {
    // 按钮点击事件
    handleTap(e) {
      if (this.data.disabled || this.data.loading) {
        return;
      }
      
      this.triggerEvent('tap', {
        detail: e.detail,
        currentTarget: e.currentTarget
      });
    },

    // 按钮长按事件
    handleLongPress(e) {
      if (this.data.disabled || this.data.loading) {
        return;
      }
      
      this.triggerEvent('longpress', {
        detail: e.detail,
        currentTarget: e.currentTarget
      });
    },

    // 触摸开始
    handleTouchStart(e) {
      if (this.data.disabled || this.data.loading) {
        return;
      }
      
      this.triggerEvent('touchstart', {
        detail: e.detail,
        currentTarget: e.currentTarget
      });
    },

    // 触摸结束
    handleTouchEnd(e) {
      if (this.data.disabled || this.data.loading) {
        return;
      }
      
      this.triggerEvent('touchend', {
        detail: e.detail,
        currentTarget: e.currentTarget
      });
    }
  },

  lifetimes: {
    attached() {
      // 组件初始化时计算样式类名
      this.setData({
        computedClass: this.buttonClass
      });
    }
  },

  observers: {
    'variant, size, disabled, loading, customClass': function() {
      // 当相关属性变化时重新计算样式类名
      this.setData({
        computedClass: this.buttonClass
      });
    }
  }
});