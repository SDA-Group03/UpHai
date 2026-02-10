import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || '';

const ax = axios.create({
  baseURL: `${BASE_URL}/api`,
  //withCredentials: true
});


ax.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("uph_access_token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default ax;