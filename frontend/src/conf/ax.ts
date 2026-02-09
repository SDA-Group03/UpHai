import axios from "axios";

const normalizeApiOrigin = (value: string) => {
  const normalized = value.trim().replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized.slice(0, -4) : normalized;
};

const apiOrigin = normalizeApiOrigin(import.meta.env.VITE_API_URL ?? "");

const ax = axios.create({
  baseURL: `${apiOrigin}/api`,
  //withCredentials: true
});


ax.interceptors.request.use(
  (config) => {
 
    /*
    const token = localStorage.getItem("auth_token"); 
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    */

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default ax;
