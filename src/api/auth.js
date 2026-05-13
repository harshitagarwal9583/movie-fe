import client from './client';

// Auth API calls
export const authAPI = {
  signup: (data) => client.post('/auth/signup', data),
  verifyOTP: (data) => client.post('/auth/verify-otp', data),
  resendOTP: (data) => client.post('/auth/resend-otp', data),
  login: (data) => client.post('/auth/login', data),
};

// Movie API calls
export const movieAPI = {
  getRecommendations: (filters) => client.get('/movies/recommend', { params: filters }),
  searchMovies: (query) => client.get('/movies/search', { params: { query } }),
  getPopularMovies: (params = {}) => client.get('/movies/popular', { params }),
  getCatalog: (params = {}) => client.get('/movies/catalog', { params }),
  getMovieById: (movieId) => client.get(`/movies/movie/${movieId}`),
  addToFavorites: ({ movieName, movieId }) => client.post('/movies/favorite', { movieName, movieId }),
  addToWishlist: ({ movieName, movieId }) => client.post('/movies/wishlist', { movieName, movieId }),
  addToHistory: ({ movieName, movieId }) => client.post('/movies/history', { movieName, movieId }),
  getUserProfile: () => client.get('/movies/profile'),
};
