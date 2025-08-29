// src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api', // Adjust if your server uses a different base URL
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // For cookies (refresh token)
});

export default api;