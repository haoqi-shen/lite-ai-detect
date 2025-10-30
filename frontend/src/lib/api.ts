import axios from 'axios';
import { auth } from './firebase';

export const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8000'
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`
    };
  }
  return config;
});

export default api;


