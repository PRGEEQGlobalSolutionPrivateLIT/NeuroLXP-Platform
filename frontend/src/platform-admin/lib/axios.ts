import axios from 'axios';

export const platformApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
});

platformApiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('platformAccessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
