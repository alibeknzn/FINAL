/**
 * Utilities Module
 * Contains helper functions used across the application
 */

/**
 * Truncate text to a specific length and add ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Format a date for display
 * @param {Date|string} date - Date to format
 * @param {boolean} includeYear - Whether to include year in the output
 * @returns {string} - Formatted date string
 */
function formatDate(date, includeYear = false) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const options = { month: 'short', day: 'numeric' };

  if (includeYear) {
    options.year = 'numeric';
  }

  return dateObj.toLocaleDateString(undefined, options);
}

/**
 * Check if two dates are the same day
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {boolean} - True if same day
 */
function isSameDay(date1, date2) {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Format time for display (12-hour format)
 * @param {Date|string} time - Time to format
 * @returns {string} - Formatted time string
 */
function formatTime(time) {
  const dateObj = typeof time === 'string' ? new Date(time) : time;
  return dateObj.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Debounce function to limit how often a function can be called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} - Debounced function
 */
function debounce(func, wait) {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Export functions
export default {
  truncateText,
  formatDate,
  isSameDay,
  formatTime,
  debounce,
};
