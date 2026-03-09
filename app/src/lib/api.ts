import axios from "axios";

// API Configuration
const API_BASE_URL = import.meta.env.PROD
  ? "https://examzz.vercel.app" // Same domain as frontend, will be routed to backend
  : "http://localhost:8000";

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error("API Response Error:", error);

    if (error.response?.status === 429) {
      error.message = "Too many requests. Please try again later.";
    } else if (error.response?.status === 400) {
      error.message = error.response.data?.detail || "Invalid request";
    } else if (error.code === "ECONNABORTED") {
      error.message = "Request timed out. Please try again.";
    } else if (!error.response) {
      error.message = "Network error. Please check your connection.";
    }

    return Promise.reject(error);
  },
);

// Quiz API endpoints
export const quizAPI = {
  generate: (formData: FormData) =>
    api.post("/api/quiz/generate", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  health: () => api.get("/api/quiz/health"),

  testGemini: () => api.post("/api/quiz/test-gemini"),
};

export default api;
