import axios from 'axios';

export const institutionApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
});

institutionApiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('institutionAccessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

