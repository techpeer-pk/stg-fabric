import toast from 'react-hot-toast'

/**
 * Centralized error handler for async operations
 * Shows user-friendly toast and logs error details
 * @param {Error} error - The error object
 * @param {string} context - Where the error occurred (for logging)
 * @param {string} [userMessage] - Custom message to show user; defaults to generic
 */
export const handleError = (error, context = 'Operation', userMessage = null) => {
  const message = userMessage || 'An error occurred. Please try again.'
  
  // Show user-friendly toast
  toast.error(message)
  
  // Log full error for debugging
  console.error(`[${context}]`, error)
  
  // Could send to external logging service (Sentry, Firebase, etc.)
  // Example: logErrorToService(error, context)
}

/**
 * Show success notification
 * @param {string} message - Success message to display
 */
export const showSuccess = (message = 'Success!') => {
  toast.success(message)
}

/**
 * Show info notification
 * @param {string} message - Info message to display
 */
export const showInfo = (message = 'Information') => {
  toast.info(message)
}

/**
 * Show loading notification (returns id for later removal)
 * @param {string} message - Loading message
 * @returns {string} Toast ID
 */
export const showLoading = (message = 'Loading...') => {
  return toast.loading(message)
}

/**
 * Dismiss a toast by ID
 * @param {string} toastId - ID from showLoading
 */
export const dismissToast = (toastId) => {
  toast.dismiss(toastId)
}
