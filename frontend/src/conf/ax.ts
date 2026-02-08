import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;

const ax = axios.create({
  baseURL: BASE_URL,
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