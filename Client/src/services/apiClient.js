import axios from "axios";

const apiClient = axios.create({
  // server exposes routes under /api/auth etc., no version prefix
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  maxContentLength: 10 * 1024 * 1024,
  maxBodyLength: 10 * 1024 * 1024,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log(
      "API Request with token:",
      `${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
    );
  } else {
    console.log(
      "API Request WITHOUT token:",
      `${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
    );
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error(
      "API Error:",
      error.config?.url,
      error.response?.status,
      error.response?.data,
    );
    return Promise.reject(error);
  },
);

export default apiClient;
