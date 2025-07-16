// A simple client-side notification manager

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
 */
const scheduleNotification = (title: string, reviewDate: string) => {
  const now = new Date().getTime();
  const reviewTime = new Date(reviewDate).getTime();
  const delay = reviewTime - now;

  // Only schedule for future dates and if permission is granted
  if (delay > 0 && Notification.permission === 'granted') {
    const timeoutId = setTimeout(() => {
      new Notification('复习时间到了！', {
        body: `该复习 "${title}" 了`,
        icon: '/placeholder-logo.svg', // Optional: add an icon
      });
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
export const scheduleReviewNotifications = (items: Array<{ title: string; content: string; next_review_date?: string | null }>) => {
  clearAllScheduledNotifications();
  
  if (Notification.permission !== 'granted') {
    console.log('Notification permission not granted. Skipping scheduling.');
    return;
  }

  console.log(`Scheduling notifications for ${items.length} items.`);
  items.forEach(item => {
    if (item.next_review_date) {
      const title = item.title || item.content.substring(0, 30) + '...';
      scheduleNotification(title, item.next_review_date);
    }
  });
};
