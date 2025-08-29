import axios from 'axios';

const api = axios.create({
  baseURL: 'https://skillswap-tk88.onrender.com/api', // 👈 use your deployed backend URL
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // For cookies (refresh token)
});

export default api;
