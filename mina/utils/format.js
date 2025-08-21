// utils/format.js
// 格式化工具函数

/**
 * 格式化时间为相对时间
 * @param {string|Date} time - 时间
 * @returns {string} 格式化后的时间字符串
 */
export function formatTime(time) {
  if (!time) return '';
  
  const now = new Date();
  const targetTime = new Date(time);
  const diff = now.getTime() - targetTime.getTime();
  
  // 小于1分钟
  if (diff < 60 * 1000) {
    return '刚刚';
  }
  
  // 小于1小时
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `${minutes}分钟前`;
  }
  
  // 小于1天
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `${hours}小时前`;
  }
  
  // 小于7天
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return `${days}天前`;
  }
  
  // 格式化为具体日期
  const year = targetTime.getFullYear();
  const month = String(targetTime.getMonth() + 1).padStart(2, '0');
  const day = String(targetTime.getDate()).padStart(2, '0');
  
  // 如果是今年，不显示年份
  if (year === now.getFullYear()) {
    return `${month}-${day}`;
  }
  
  return `${year}-${month}-${day}`;
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的文件大小
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 格式化数字，添加千分位分隔符
 * @param {number} num - 数字
 * @returns {string} 格式化后的数字字符串
 */
export function formatNumber(num) {
  if (typeof num !== 'number') return '0';
  return num.toLocaleString();
}

/**
 * 格式化百分比
 * @param {number} value - 数值（0-1之间）
 * @param {number} decimals - 小数位数，默认1位
 * @returns {string} 格式化后的百分比字符串
 */
export function formatPercentage(value, decimals = 1) {
  if (typeof value !== 'number') return '0%';
  return (value * 100).toFixed(decimals) + '%';
}

/**
 * 截断文本
 * @param {string} text - 文本
 * @param {number} maxLength - 最大长度
 * @param {string} suffix - 后缀，默认为'...'
 * @returns {string} 截断后的文本
 */
export function truncateText(text, maxLength, suffix = '...') {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength) + suffix;
}

/**
 * 格式化持续时间（毫秒转为可读格式）
 * @param {number} ms - 毫秒数
 * @returns {string} 格式化后的持续时间
 */
export function formatDuration(ms) {
  if (!ms || ms < 0) return '0秒';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`;
  }
  
  if (minutes > 0) {
    return `${minutes}分钟${seconds % 60}秒`;
  }
  
  return `${seconds}秒`;
}