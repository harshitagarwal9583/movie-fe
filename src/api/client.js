import axios from 'axios';

<<<<<<< HEAD
const API_BASE_URL = 'http://localhost:5000/api';
// const API_BASE_URL = 'https://movie-be-rsbm.onrender.com/api';
=======
// const API_BASE_URL = 'http://localhost:5000/api';
const API_BASE_URL = 'https://movie-be-rsbm.onrender.com/api';

>>>>>>> 1751861220f524a08303658c6567cce49bdc6892

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
