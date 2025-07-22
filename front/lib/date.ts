import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Formats a date string into the user's local timezone using dayjs.
 * @param dateString The date string or Date object from the API.
 * @param formatString The desired output format string (e.g., 'YYYY-MM-DD HH:mm').
 * @returns The formatted date string in the local timezone.
 */
export function formatInLocalTimezone(dateString: string | Date, formatString: string): string {
  if (!dateString) {
    return "N/A";
  }
  try {
    // Detect the user's timezone from the browser environment
    const userTimezone = dayjs.tz.guess();
    
    // Create a dayjs object from the date string
    // Assume the date string is in UTC format from the backend
    // Parse it as UTC first, then convert to the user's local timezone
    const zonedDate = dayjs.utc(dateString).tz(userTimezone);
    
    // Format the date
    return zonedDate.format(formatString);
  } catch (error) {
    console.error("Failed to format date with dayjs:", error);
    // Fallback to a simple format if conversion fails
    return dayjs(dateString).format(formatString);
  }
}
