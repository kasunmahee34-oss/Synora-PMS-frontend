import axios from 'axios';

const api = axios.create({
 // baseURL: 'http://localhost:5000/api',
  baseURL: 'https://synora-pms-backend-production.up.railway.app/api', // Replace with your production API URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
