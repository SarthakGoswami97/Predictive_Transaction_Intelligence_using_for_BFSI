import { toast } from "react-toastify";

/**
 * Toast Notification Utilities
 * Provides consistent notification patterns across the app
 */

// Success notification
export const showSuccess = (message, options = {}) => {
  toast.success(message, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options,
  });
};

// Error notification
export const showError = (message, options = {}) => {
  toast.error(message, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options,
  });
};

// Warning notification
export const showWarning = (message, options = {}) => {
  toast.warn(message, {
    position: "top-right",
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options,
  });
};

// Info notification
export const showInfo = (message, options = {}) => {
  toast.info(message, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options,
  });
};

// Loading toast (returns ID to update later)
export const showLoading = (message = "Processing...") => {
  return toast.loading(message, {
    position: "top-right",
  });
};

// Update loading toast to success/error
export const updateToast = (toastId, type, message) => {
  toast.update(toastId, {
    render: message,
    type: type,
    isLoading: false,
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
  });
};

// Dismiss a specific toast
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

// Dismiss all toasts
export const dismissAll = () => {
  toast.dismiss();
};

// Prediction result notifications
export const showPredictionResult = (prediction, confidence) => {
  if (prediction === "Fraud") {
    toast.error(
      `🚨 FRAUD DETECTED! Risk Score: ${Math.round(confidence * 100)}%`,
      {
        position: "top-center",
        autoClose: 6000,
        style: { background: "#fee2e2", color: "#991b1b" },
      }
    );
  } else {
    toast.success(
      `✅ Transaction Legitimate. Confidence: ${Math.round((1 - confidence) * 100)}%`,
      {
        position: "top-center",
        autoClose: 4000,
        style: { background: "#dcfce7", color: "#166534" },
      }
    );
  }
};

// API error handler
export const handleApiError = (error) => {
  const message = error.response?.data?.message 
    || error.message 
    || "An unexpected error occurred";
  
  showError(message);
  console.error("API Error:", error);
};

export default {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showLoading,
  updateToast,
  dismissToast,
  dismissAll,
  showPredictionResult,
  handleApiError,
};
