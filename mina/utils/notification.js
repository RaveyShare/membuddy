/**
 * 微信小程序通知和提醒工具
 * 基于 front/lib/notification.ts 实现，适配小程序环境
 */

import { formatDate, addDays, isToday } from './utils.js';
import storage from './storage.js';

// 存储键名
const NOTIFICATION_SETTINGS_KEY = 'notification_settings';
const SCHEDULED_NOTIFICATIONS_KEY = 'scheduled_notifications';

/**
 * 通知设置默认值
 */
const DEFAULT_NOTIFICATION_SETTINGS = {
  enabled: true,
  reviewReminder: true,
  dailyReview: true,
  weeklyReport: true,
  reviewTime: '20:00', // 默认复习提醒时间
  advanceNotice: 30, // 提前通知分钟数
  soundEnabled: true,
  vibrationEnabled: true
};

/**
 * 通知管理类
 */
class NotificationManager {
  constructor() {
    this.settings = DEFAULT_NOTIFICATION_SETTINGS;
    this.scheduledNotifications = [];
    this.loadSettings();
  }

  // 加载通知设置
  async loadSettings() {
    try {
      const settings = await storage.get(NOTIFICATION_SETTINGS_KEY, DEFAULT_NOTIFICATION_SETTINGS);
      this.settings = { ...DEFAULT_NOTIFICATION_SETTINGS, ...settings };
      
      const notifications = await storage.get(SCHEDULED_NOTIFICATIONS_KEY, []);
      this.scheduledNotifications = notifications;
    } catch (error) {
      console.error('加载通知设置失败:', error);
    }
  }

  // 保存通知设置
  async saveSettings() {
    try {
      await storage.set(NOTIFICATION_SETTINGS_KEY, this.settings);
      await storage.set(SCHEDULED_NOTIFICATIONS_KEY, this.scheduledNotifications);
    } catch (error) {
      console.error('保存通知设置失败:', error);
    }
  }

  // 获取通知设置
  getSettings() {
    return { ...this.settings };
  }

  // 更新通知设置
  async updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
  }

  // 检查通知权限
  async checkNotificationPermission() {
    return new Promise((resolve) => {
      wx.getSetting({
        success: (res) => {
          const hasPermission = res.authSetting['scope.notification'] !== false;
          resolve(hasPermission);
        },
        fail: () => resolve(false)
      });
    });
  }

  // 请求通知权限
  async requestNotificationPermission() {
    return new Promise((resolve) => {
      wx.authorize({
        scope: 'scope.notification',
        success: () => resolve(true),
        fail: () => {
          wx.showModal({
            title: '通知权限',
            content: '开启通知权限后，可以及时收到复习提醒',
            confirmText: '去设置',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting({
                  success: (settingRes) => {
                    resolve(settingRes.authSetting['scope.notification'] === true);
                  },
                  fail: () => resolve(false)
                });
              } else {
                resolve(false);
              }
            }
          });
        }
      });
    });
  }

  // 显示本地通知
  async showLocalNotification(options) {
    const {
      title = '记忆助手',
      content = '',
      sound = this.settings.soundEnabled,
      vibration = this.settings.vibrationEnabled,
      showToast = true
    } = options;

    if (!this.settings.enabled) {
      return false;
    }

    try {
      // 检查权限
      const hasPermission = await this.checkNotificationPermission();
      if (!hasPermission) {
        if (showToast) {
          wx.showToast({
            title: content,
            icon: 'none',
            duration: 3000
          });
        }
        return false;
      }

      // 显示通知
      wx.showToast({
        title: content,
        icon: 'none',
        duration: 3000
      });

      // 震动反馈
      if (vibration) {
        wx.vibrateShort();
      }

      return true;
    } catch (error) {
      console.error('显示通知失败:', error);
      return false;
    }
  }

  // 安排复习提醒
  async scheduleReviewNotification(memoryItem) {
    if (!this.settings.enabled || !this.settings.reviewReminder) {
      return;
    }

    const {
      id,
      title,
      content,
      next_review_date
    } = memoryItem;

    if (!next_review_date) {
      return;
    }

    const reviewDate = new Date(next_review_date);
    const now = new Date();
    
    // 只为未来的复习日期安排提醒
    if (reviewDate <= now) {
      return;
    }

    const notification = {
      id: `review_${id}`,
      type: 'review',
      title: '复习提醒',
      content: `该复习「${title || content.substring(0, 20)}」了`,
      scheduledTime: reviewDate.getTime(),
      memoryItemId: id,
      created: Date.now()
    };

    // 添加到计划列表
    this.scheduledNotifications.push(notification);
    await this.saveSettings();

    console.log('已安排复习提醒:', notification);
  }

  // 批量安排复习提醒
  async scheduleReviewNotifications(memoryItems) {
    if (!Array.isArray(memoryItems)) {
      return;
    }

    // 清除旧的复习提醒
    await this.clearReviewNotifications();

    // 安排新的提醒
    for (const item of memoryItems) {
      await this.scheduleReviewNotification(item);
    }
  }

  // 清除复习提醒
  async clearReviewNotifications() {
    this.scheduledNotifications = this.scheduledNotifications.filter(
      notification => notification.type !== 'review'
    );
    await this.saveSettings();
  }

  // 安排每日复习提醒
  async scheduleDailyReviewReminder() {
    if (!this.settings.enabled || !this.settings.dailyReview) {
      return;
    }

    const now = new Date();
    const [hour, minute] = this.settings.reviewTime.split(':').map(Number);
    
    // 计算今天的提醒时间
    const todayReminder = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
    
    // 如果今天的提醒时间已过，安排明天的
    const reminderTime = todayReminder <= now ? addDays(todayReminder, 1) : todayReminder;

    const notification = {
      id: 'daily_review',
      type: 'daily',
      title: '每日复习',
      content: '该进行今日复习了，坚持学习！',
      scheduledTime: reminderTime.getTime(),
      created: Date.now()
    };

    // 移除旧的每日提醒
    this.scheduledNotifications = this.scheduledNotifications.filter(
      n => n.id !== 'daily_review'
    );
    
    // 添加新的每日提醒
    this.scheduledNotifications.push(notification);
    await this.saveSettings();
  }

  // 检查并触发到期的通知
  async checkPendingNotifications() {
    const now = Date.now();
    const pendingNotifications = this.scheduledNotifications.filter(
      notification => notification.scheduledTime <= now
    );

    for (const notification of pendingNotifications) {
      await this.showLocalNotification({
        title: notification.title,
        content: notification.content
      });

      // 如果是每日提醒，重新安排下一次
      if (notification.type === 'daily') {
        await this.scheduleDailyReviewReminder();
      }
    }

    // 移除已触发的通知
    this.scheduledNotifications = this.scheduledNotifications.filter(
      notification => notification.scheduledTime > now
    );
    
    if (pendingNotifications.length > 0) {
      await this.saveSettings();
    }

    return pendingNotifications.length;
  }

  // 获取今日待复习项目数量
  async getTodayReviewCount() {
    try {
      // 这里应该调用API获取实际数据，暂时返回模拟数据
      return 5;
    } catch (error) {
      console.error('获取今日复习数量失败:', error);
      return 0;
    }
  }

  // 发送每周报告
  async sendWeeklyReport() {
    if (!this.settings.enabled || !this.settings.weeklyReport) {
      return;
    }

    try {
      // 获取本周统计数据
      const stats = await this.getWeeklyStats();
      
      const content = `本周学习报告：复习了${stats.reviewCount}次，掌握了${stats.masteredCount}个知识点。继续加油！`;
      
      await this.showLocalNotification({
        title: '每周学习报告',
        content
      });
    } catch (error) {
      console.error('发送每周报告失败:', error);
    }
  }

  // 获取每周统计数据
  async getWeeklyStats() {
    // 这里应该调用API获取实际数据，暂时返回模拟数据
    return {
      reviewCount: 25,
      masteredCount: 8,
      studyDays: 5
    };
  }

  // 获取计划中的通知
  getScheduledNotifications() {
    return [...this.scheduledNotifications];
  }

  // 取消特定通知
  async cancelNotification(notificationId) {
    this.scheduledNotifications = this.scheduledNotifications.filter(
      notification => notification.id !== notificationId
    );
    await this.saveSettings();
  }

  // 清除所有通知
  async clearAllNotifications() {
    this.scheduledNotifications = [];
    await this.saveSettings();
  }

  // 初始化通知系统
  async initialize() {
    await this.loadSettings();
    
    // 检查权限
    const hasPermission = await this.checkNotificationPermission();
    if (!hasPermission && this.settings.enabled) {
      console.log('通知权限未授权，将在需要时请求');
    }

    // 安排每日复习提醒
    await this.scheduleDailyReviewReminder();
    
    // 检查待处理的通知
    await this.checkPendingNotifications();
  }
}

// 创建通知管理器实例
const notificationManager = new NotificationManager();

// 导出通知管理器
export default notificationManager;

// 导出便捷方法
export const {
  getSettings,
  updateSettings,
  checkNotificationPermission,
  requestNotificationPermission,
  showLocalNotification,
  scheduleReviewNotification,
  scheduleReviewNotifications,
  clearReviewNotifications,
  scheduleDailyReviewReminder,
  checkPendingNotifications,
  getTodayReviewCount,
  sendWeeklyReport,
  getScheduledNotifications,
  cancelNotification,
  clearAllNotifications,
  initialize
} = notificationManager;

// 快捷通知方法
export const notify = {
  success: (content) => notificationManager.showLocalNotification({
    title: '操作成功',
    content
  }),
  
  error: (content) => notificationManager.showLocalNotification({
    title: '操作失败',
    content
  }),
  
  info: (content) => notificationManager.showLocalNotification({
    title: '提示',
    content
  }),
  
  warning: (content) => notificationManager.showLocalNotification({
    title: '警告',
    content
  }),
  
  review: (itemTitle) => notificationManager.showLocalNotification({
    title: '复习提醒',
    content: `该复习「${itemTitle}」了`
  })
};