// components/ui/input/input.js
Component({
  properties: {
    // 输入框类型
    type: {
      type: String,
      value: 'text' // text, number, idcard, digit, password
    },
    // 输入框值
    value: {
      type: String,
      value: ''
    },
    // 占位符
    placeholder: {
      type: String,
      value: ''
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      value: false
    },
    // 最大长度
    maxlength: {
      type: Number,
      value: 140
    },
    // 是否自动聚焦
    focus: {
      type: Boolean,
      value: false
    },
    // 输入框尺寸
    size: {
      type: String,
      value: 'default' // sm, default, lg
    },
    // 输入框变体
    variant: {
      type: String,
      value: 'default' // default, outline, filled
    },
    // 是否显示清除按钮
    clearable: {
      type: Boolean,
      value: false
    },
    // 左侧图标
    leftIcon: {
      type: String,
      value: ''
    },
    // 右侧图标
    rightIcon: {
      type: String,
      value: ''
    },
    // 自定义类名
    customClass: {
      type: String,
      value: ''
    },
    // 错误状态
    error: {
      type: Boolean,
      value: false
    },
    // 错误信息
    errorMessage: {
      type: String,
      value: ''
    },
    // 标签
    label: {
      type: String,
      value: ''
    },
    // 是否必填
    required: {
      type: Boolean,
      value: false
    }
  },

  data: {
    focused: false,
    sizeClasses: {
      sm: 'input-sm',
      default: 'input-default',
      lg: 'input-lg'
    },
    variantClasses: {
      default: 'input-variant-default',
      outline: 'input-variant-outline',
      filled: 'input-variant-filled'
    }
  },

  computed: {
    inputClass() {
      const { size, variant, disabled, error, focused, customClass } = this.data;
      const sizeClass = this.data.sizeClasses[size] || 'input-default';
      const variantClass = this.data.variantClasses[variant] || 'input-variant-default';
      
      let classes = ['input-wrapper', sizeClass, variantClass];
      
      if (disabled) {
        classes.push('input-disabled');
      }
      
      if (error) {
        classes.push('input-error');
      }
      
      if (focused) {
        classes.push('input-focused');
      }
      
      if (customClass) {
        classes.push(customClass);
      }
      
      return classes.join(' ');
    }
  },

  methods: {
    // 输入事件
    handleInput(e) {
      const value = e.detail.value;
      this.setData({ value });
      this.triggerEvent('input', {
        value,
        detail: e.detail
      });
    },

    // 聚焦事件
    handleFocus(e) {
      this.setData({ focused: true });
      this.triggerEvent('focus', {
        value: this.data.value,
        detail: e.detail
      });
    },

    // 失焦事件
    handleBlur(e) {
      this.setData({ focused: false });
      this.triggerEvent('blur', {
        value: this.data.value,
        detail: e.detail
      });
    },

    // 确认事件
    handleConfirm(e) {
      this.triggerEvent('confirm', {
        value: this.data.value,
        detail: e.detail
      });
    },

    // 清除输入
    handleClear() {
      this.setData({ value: '' });
      this.triggerEvent('input', {
        value: '',
        detail: { value: '' }
      });
      this.triggerEvent('clear');
    },

    // 左侧图标点击
    handleLeftIconTap() {
      this.triggerEvent('leftIconTap');
    },

    // 右侧图标点击
    handleRightIconTap() {
      this.triggerEvent('rightIconTap');
    }
  },

  lifetimes: {
    attached() {
      this.setData({
        computedClass: this.inputClass
      });
    }
  },

  observers: {
    'size, variant, disabled, error, focused, customClass': function() {
      this.setData({
        computedClass: this.inputClass
      });
    },
    'value': function(newVal) {
      // 同步外部传入的值
      if (newVal !== this.data.value) {
        this.setData({ value: newVal });
      }
    }
  }
});