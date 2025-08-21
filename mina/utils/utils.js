// utils/utils.js
// 通用工具函数

// 格式化日期
export function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return ''
  
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  const second = String(d.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
    .replace('ss', second)
}

// 格式化为本地时区时间
export function formatInLocalTimezone(dateString, formatString = 'YYYY-MM-DD HH:mm') {
  if (!dateString) {
    return 'N/A'
  }
  
  try {
    // 处理UTC时间字符串
    let date
    if (typeof dateString === 'string') {
      // 如果是ISO字符串，直接解析
      if (dateString.includes('T') || dateString.includes('Z')) {
        date = new Date(dateString)
      } else {
        // 如果是简单日期字符串，添加时区信息
        date = new Date(dateString + 'T00:00:00.000Z')
      }
    } else {
      date = new Date(dateString)
    }
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return 'N/A'
    }
    
    return formatDate(date, formatString)
  } catch (error) {
    console.error('日期格式化失败:', error)
    return formatDate(dateString, formatString)
  }
}

// 相对时间格式化
export function formatRelativeTime(date) {
  if (!date) return ''
  
  const now = new Date()
  const target = new Date(date)
  const diff = now - target
  
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day
  const month = 30 * day
  
  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`
  } else if (diff < week) {
    return `${Math.floor(diff / day)}天前`
  } else if (diff < month) {
    return `${Math.floor(diff / week)}周前`
  } else {
    return formatDate(date, 'YYYY-MM-DD')
  }
}

// 获取今天的开始和结束时间
export function getTodayRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  
  return {
    start: start.toISOString(),
    end: end.toISOString()
  }
}

// 计算两个日期之间的天数差
export function getDaysDiff(date1, date2) {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const diffTime = Math.abs(d2 - d1)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// 添加天数到日期
export function addDays(date, days) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

// 检查是否为今天
export function isToday(date) {
  const today = new Date()
  const target = new Date(date)
  
  return today.getFullYear() === target.getFullYear() &&
         today.getMonth() === target.getMonth() &&
         today.getDate() === target.getDate()
}

// 检查是否为本周
export function isThisWeek(date) {
  const today = new Date()
  const target = new Date(date)
  
  // 获取本周的开始（周一）
  const startOfWeek = new Date(today)
  const day = today.getDay()
  const diff = today.getDate() - day + (day === 0 ? -6 : 1)
  startOfWeek.setDate(diff)
  startOfWeek.setHours(0, 0, 0, 0)
  
  // 获取本周的结束（周日）
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)
  
  return target >= startOfWeek && target <= endOfWeek
}

// 防抖函数
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// 节流函数
export function throttle(func, limit) {
  let inThrottle
  return function() {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 显示Toast
export function showToast(title, icon = 'none', duration = 2000) {
  wx.showToast({
    title,
    icon,
    duration
  })
}

// 显示加载中
export function showLoading(title = '加载中...') {
  wx.showLoading({
    title,
    mask: true
  })
}

// 隐藏加载中
export function hideLoading() {
  wx.hideLoading()
}

// 显示确认对话框
export function showConfirm(content, title = '提示') {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      success: (res) => {
        resolve(res.confirm)
      }
    })
  })
}

// 复制到剪贴板
export function copyToClipboard(text) {
  return new Promise((resolve, reject) => {
    wx.setClipboardData({
      data: text,
      success: () => {
        showToast('已复制到剪贴板')
        resolve()
      },
      fail: reject
    })
  })
}

// 生成随机ID
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 验证邮箱格式
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

// 验证密码强度
export function validatePassword(password) {
  // 至少8位，包含字母和数字
  const re = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/
  return re.test(password)
}

// 截取文本
export function truncateText(text, maxLength = 50) {
  if (text.length <= maxLength) {
    return text
  }
  return text.substring(0, maxLength) + '...'
}

// 获取文件扩展名
export function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

// 格式化文件大小
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 深拷贝
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime())
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item))
  }
  
  if (typeof obj === 'object') {
    const clonedObj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
}

// 获取系统信息
export function getSystemInfo() {
  return new Promise((resolve) => {
    wx.getSystemInfo({
      success: resolve
    })
  })
}