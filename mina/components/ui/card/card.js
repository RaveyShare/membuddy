// components/ui/card/card.js
Component({
  properties: {
    // 自定义类名
    customClass: {
      type: String,
      value: ''
    },
    // 是否显示阴影
    shadow: {
      type: Boolean,
      value: true
    },
    // 是否显示边框
    border: {
      type: Boolean,
      value: true
    },
    // 卡片变体
    variant: {
      type: String,
      value: 'default' // default, glass, solid
    },
    // 是否可点击
    clickable: {
      type: Boolean,
      value: false
    },
    // 圆角大小
    rounded: {
      type: String,
      value: 'default' // sm, default, lg, xl
    }
  },

  data: {
    variantClasses: {
      default: 'card-default',
      glass: 'card-glass',
      solid: 'card-solid'
    },
    roundedClasses: {
      sm: 'card-rounded-sm',
      default: 'card-rounded-default',
      lg: 'card-rounded-lg',
      xl: 'card-rounded-xl'
    }
  },

  computed: {
    cardClass() {
      const { variant, rounded, shadow, border, clickable, customClass } = this.data;
      const variantClass = this.data.variantClasses[variant] || 'card-default';
      const roundedClass = this.data.roundedClasses[rounded] || 'card-rounded-default';
      
      let classes = ['card', variantClass, roundedClass];
      
      if (shadow) {
        classes.push('card-shadow');
      }
      
      if (border) {
        classes.push('card-border');
      }
      
      if (clickable) {
        classes.push('card-clickable');
      }
      
      if (customClass) {
        classes.push(customClass);
      }
      
      return classes.join(' ');
    }
  },

  methods: {
    handleTap(e) {
      if (this.data.clickable) {
        this.triggerEvent('tap', {
          detail: e.detail,
          currentTarget: e.currentTarget
        });
      }
    }
  },

  lifetimes: {
    attached() {
      this.setData({
        computedClass: this.cardClass
      });
    }
  },

  observers: {
    'variant, rounded, shadow, border, clickable, customClass': function() {
      this.setData({
        computedClass: this.cardClass
      });
    }
  }
});