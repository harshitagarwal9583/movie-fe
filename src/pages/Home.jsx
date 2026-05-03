import { useState } from 'react';
import { motion } from 'framer-motion';
import { movieAPI } from '../api/auth';

export default function Home() {
  const [filters, setFilters] = useState({
    genre: 'Action',
    mood: 'Thrilling',
    year: 'Latest',
    rating: 'Top Rated',
  });

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [trailerLoading, setTrailerLoading] = useState(false);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleGetRecommendations = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await movieAPI.getRecommendations(filters);
      setMovies(response.data.movies || []);
      if (response.data.movies.length === 0) {
        setMessage('No movies found for these filters.');
      } else {
        setMessage(`Found ${response.data.movies.length} movies!`);
      }
    } catch (error) {
      setMessage('Failed to get recommendations. Please try again.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToFavorites = async (movieTitle) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('Please login to add to favorites');
        return;
      }
      await movieAPI.addToFavorites({ movieName: movieTitle });
      setMessage('Added to favorites!');
    } catch (error) {
      setMessage('Failed to add to favorites');
      console.error('Error:', error);
    }
  };

  const openTrailer = async (movie) => {
    try {
      setTrailerLoading(true);

      const token = localStorage.getItem('token');
      if (token) {
        await movieAPI.addToHistory({ movieName: movie.title });
      }

      let trailerUrl = movie.trailer;

      if (!trailerUrl) {
        const response = await movieAPI.searchMovies(movie.title);
        trailerUrl = response.data.movie?.trailer;
      }

      if (!trailerUrl) {
        trailerUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${movie.title} trailer`)}`;
      }

      window.open(trailerUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Trailer error:', error);
      setMessage('Could not open trailer right now.');
    } finally {
      setTrailerLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark via-darker to-dark">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto px-4 py-16"
      >
        <h2 className="text-5xl font-bold text-white mb-2">
          Discover Your Next <span className="text-primary">Favorite Movie</span>
        </h2>
        <p className="text-xl text-gray-300 mb-8">
          AI-powered recommendations just for you
        </p>

        {/* Filters Section */}
        <div className="bg-darker rounded-lg p-8 border border-gray-700 mb-12">
          <h3 className="text-2xl font-bold mb-6 text-white">Customize Your Search</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-gray-300 font-semibold mb-2">Genre</label>
              <select
                name="genre"
                value={filters.genre}
                onChange={handleFilterChange}
                className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded focus:outline-none focus:border-primary"
              >
                <option>Action</option>
                <option>Comedy</option>
                <option>Thriller</option>
                <option>Drama</option>
                <option>Sci-Fi</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-2">Mood</label>
              <select
                name="mood"
                value={filters.mood}
                onChange={handleFilterChange}
                className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded focus:outline-none focus:border-primary"
              >
                <option>Thrilling</option>
                <option>Funny</option>
                <option>Emotional</option>
                <option>Dark</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-2">Release Year</label>
              <select
                name="year"
                value={filters.year}
                onChange={handleFilterChange}
                className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded focus:outline-none focus:border-primary"
              >
                <option>Latest</option>
                <option>Old Classics</option>
                <option>2020+</option>
                <option>2015-2020</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-2">Rating</label>
              <select
                name="rating"
                value={filters.rating}
                onChange={handleFilterChange}
                className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded focus:outline-none focus:border-primary"
              >
                <option>Top Rated</option>
                <option>8+ IMDb</option>
                <option>7+ IMDb</option>
                <option>All</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGetRecommendations}
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded font-bold text-lg hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading ? 'Getting Recommendations...' : 'Get Recommendations'}
          </button>

          {message && (
            <p className={`text-center mt-4 text-sm ${message.includes('Failed') || message.includes('No movies') ? 'text-red-500' : 'text-green-500'}`}>
              {message}
            </p>
          )}
        </div>

        {/* Movies Grid */}
        {movies.length > 0 && (
          <div>
            {message && (
              <p className="text-center text-green-400 mb-6 text-lg">{message}</p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {movies.map((movie, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="rounded-lg overflow-hidden cursor-pointer group"
                >
                  <div className="bg-gray-800 aspect-video flex items-center justify-center rounded-lg relative">
                    {movie.posterPath ? (
                      <img
                        src={movie.posterPath}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                        <span className="text-gray-400 text-center px-2 text-sm">{movie.title}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition flex flex-col items-center justify-center gap-2">
                      <button
                        onClick={() => openTrailer(movie)}
                        disabled={trailerLoading}
                        className="text-white text-xl opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
                      >
                        ▶ Watch
                      </button>
                      <button
                        onClick={() => handleAddToFavorites(movie.title)}
                        className="text-white opacity-0 group-hover:opacity-100 transition text-sm"
                      >
                        ❤️ Favorite
                      </button>
                    </div>
                  </div>
                  <div className="bg-darker p-2 hidden group-hover:block">
                    <h4 className="text-sm font-bold text-white truncate">{movie.title}</h4>
                    <p className="text-xs text-gray-400">{movie.releaseDate?.substring(0, 4)}</p>
                    <p className="text-xs text-yellow-400">⭐ {movie.rating?.toFixed(1)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {movies.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              Select filters and click "Get Recommendations" to see movies
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
