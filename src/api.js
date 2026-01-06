// ALWAYS AT TOP
import axios from "axios";

// Use environment variable, defaults to false for production (use real API by default)
const USE_MOCK = process.env.REACT_APP_USE_MOCK === "true";

// 🔹 MOCK API (works when backend is not available)
const mockApi = {
  post: async (path, payload) => {
    console.log("Mock POST:", path, payload);

    await new Promise((res) => setTimeout(res, 600));

    // Handle different endpoints
    if (path === "/predict" || path === "/api/predict") {
      return {
        data: {
          transaction_id: `T_${Date.now()}`,
          prediction: payload.transaction_amount > 10000 ? "Fraud" : "Legit",
          confidence: payload.transaction_amount > 10000 ? 0.85 : 0.15,
          risk_score: payload.transaction_amount > 10000 ? 0.85 : 0.15,
          explanation: payload.transaction_amount > 10000 
            ? "High transaction amount detected. Pattern suggests potential fraud."
            : "Transaction appears normal based on historical patterns.",
          status: "success"
        },
      };
    }

    if (path === "/explain" || path === "/api/explain") {
      return {
        data: {
          short: "Transaction analyzed by AI model",
          detail: "The model analyzed multiple factors including transaction amount, channel, account age, and KYC status to determine the risk level.",
        },
      };
    }

    if (path === "/auth/login" || path === "/api/auth/login") {
      if (payload.email === "admin@gmail.com" && payload.password === "admin123") {
        return {
          data: {
            success: true,
            token: "mock_token_123",
            user: { email: payload.email, name: "Admin User" },
          },
        };
      }
      throw new Error("Invalid credentials");
    }

    return {
      data: {
        transaction_id: `T_${Date.now()}`,
        prediction: payload.transaction_amount > 10000 ? "Fraud" : "Legit",
        risk_score: payload.transaction_amount > 10000 ? 0.85 : 0.15,
      },
    };
  },

  get: async (path) => {
    console.log("Mock GET:", path);

    await new Promise((res) => setTimeout(res, 500));

    if (path === "/metrics" || path === "/api/metrics") {
      return {
        data: {
          accuracy: 93,
          precision: 90,
          recall: 88,
          f1_score: 89,
          auc: 92,
          total_predictions: 1500,
          fraud_detected: 220,
          legit_detected: 1280,
        },
      };
    }

    if (path === "/history" || path === "/api/history") {
      return {
        data: JSON.parse(localStorage.getItem("prediction_history") || "[]"),
      };
    }

    return {
      data: {
        accuracy: 0.93,
        precision: 0.90,
        recall: 0.88,
        f1_score: 0.89,
        auc: 0.92,
      },
    };
  },
};

// 🔹 REAL API (used when backend is ready)
const realApi = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL || "http://localhost:8000",
  timeout: 30000,
});

// Add request interceptor to include auth token
realApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
realApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// 🔹 Export the correct one
const api = USE_MOCK ? mockApi : realApi;

export default api;
