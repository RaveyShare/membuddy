// A simple client-side notification manager
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// 扩展 dayjs 插件
dayjs.extend(utc);
dayjs.extend(timezone);

// Store timeout IDs to be able to clear them later
const scheduledNotificationIds: NodeJS.Timeout[] = [];

/**
 * Requests permission from the user to show notifications.
 * @returns {Promise<PermissionState>} The permission state ('granted', 'denied', or 'default').
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notification');
    return 'denied';
  }
  const permission = await Notification.requestPermission();
  return permission;
};

/**
 * Schedules a single review notification.
 * @param {string} title The title of the memory item.
 * @param {string} reviewDate The ISO string of the review date.
 * @param {string} itemId The ID of the memory item for navigation.
 */
const scheduleNotification = (title: string, reviewDate: string, itemId?: string) => {
  // 使用 dayjs 处理 UTC 日期时间
  const userTimezone = dayjs.tz.guess();
  const now = dayjs();
  const reviewTime = dayjs.utc(reviewDate).tz(userTimezone);
  
  // 计算时间差（毫秒）
  const delay = reviewTime.diff(now);

  // Only schedule for future dates and if permission is granted
  if (delay > 0 && Notification.permission === 'granted') {
    const timeoutId = setTimeout(() => {
      try {
        const notification = new Notification('复习时间到了！', {
          body: `该复习 "${title}" 了`,
          icon: '/placeholder-logo.svg',
          tag: `memory-review-${itemId || Date.now()}`, // 使用唯一标识
          requireInteraction: false, // 允许自动关闭
        });
        
        notification.onclick = () => {
          notification.close();
          window.focus();
          // 跳转到复习页面
          if (itemId) {
            window.location.href = `/review/${itemId}`;
          }
        };
        
      } catch (error) {
        // 备用方案：使用 alert
        const shouldReview = confirm(`复习提醒：该复习 "${title}" 了！\n\n点击确定前往复习页面`);
        if (shouldReview && itemId) {
          window.location.href = `/review/${itemId}`;
        }
      }
    }, delay);
    scheduledNotificationIds.push(timeoutId);
  }
};

/**
 * Clears all previously scheduled notifications.
 */
export const clearAllScheduledNotifications = () => {
  scheduledNotificationIds.forEach(id => clearTimeout(id));
  scheduledNotificationIds.length = 0; // Clear the array
};

/**
 * Schedules notifications for a list of memory items.
 * It clears any previously scheduled notifications before setting new ones.
 * @param {Array<{title: string, next_review_date?: string | null}>} items - The memory items.
 */
export const scheduleReviewNotifications = (items: Array<{ id?: string; title: string; content: string; next_review_date?: string | null }>) => {
  clearAllScheduledNotifications();
  
  if (Notification.permission !== 'granted') {
    return;
  }

  items.forEach(item => {
    if (item.next_review_date) {
      const title = item.title || item.content.substring(0, 30) + '...';
      scheduleNotification(title, item.next_review_date, item.id);
    }
  });
};
