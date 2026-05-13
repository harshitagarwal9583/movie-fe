import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { movieAPI } from '../api/auth';
import { buildTrailerUrl } from '../utils/trailer';

export default function Home() {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

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

  const [movieSearchQuery, setMovieSearchQuery] = useState('');
  const [showMovieDropdown, setShowMovieDropdown] = useState(false);
  const [catalogMovies, setCatalogMovies] = useState([]);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  useEffect(() => {
    if (!showMovieDropdown) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoadingCatalog(true);
        const response = await movieAPI.getCatalog({ query: movieSearchQuery, limit: 60 });
        setCatalogMovies(response.data.movies || []);
        setCatalogTotal(response.data.total || 0);
      } catch (error) {
        console.error('Error fetching catalog:', error);
        setMessage('Failed to load movies');
      } finally {
        setLoadingCatalog(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [movieSearchQuery, showMovieDropdown]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMovieDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectMovie = (movie) => {
    setSelectedMovie(movie);
    setMovieSearchQuery(movie.title);
    setShowMovieDropdown(false);
    setMessage(`Selected ${movie.title}.`);
  };

  const handleGetRecommendations = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await movieAPI.getRecommendations({
        ...filters,
        selectedMovieId: selectedMovie?.id || '',
      });

      setMovies(response.data.movies || []);
      if ((response.data.movies || []).length === 0) {
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
    const trailerLink = buildTrailerUrl({ trailerUrl: movie?.trailer, movieTitle: movie?.title });
    const trailerTab = window.open(trailerLink, '_blank', 'noopener,noreferrer');

    if (!trailerTab) {
      setMessage('Popup was blocked. Please allow popups and try again.');
      return;
    }

    try {
      setTrailerLoading(true);

      const token = localStorage.getItem('token');
      if (token) {
        movieAPI.addToHistory({ movieName: movie.title }).catch((error) => {
          console.error('History update error:', error);
        });
      }
    } catch (error) {
      console.error('Trailer error:', error);
      setMessage('Could not open trailer right now.');
    } finally {
      setTrailerLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark via-darker to-dark">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto px-4 py-16"
      >
        <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
          <div>
            <h2 className="text-5xl font-bold text-white mb-2">
              Discover Your Next <span className="text-primary">Favorite Movie</span>
            </h2>
            <p className="text-xl text-gray-300">
              Search the full TMDB dataset and get structured recommendations.
            </p>
          </div>

          <div className="text-sm text-gray-400 bg-gray-900/60 border border-gray-700 rounded-full px-4 py-2">
            Catalog: {catalogTotal || 4803} movies
          </div>
        </div>

        <div className="bg-darker rounded-2xl p-8 border border-gray-700 mb-12 shadow-2xl shadow-black/20">
          <h3 className="text-2xl font-bold mb-6 text-white">Customize Your Search</h3>

          <div className="mb-6 relative" ref={dropdownRef}>
            <label className="block text-gray-300 font-semibold mb-2">Select a movie from the catalog</label>
            <input
              type="text"
              placeholder="Click and type to browse the full catalog..."
              value={movieSearchQuery}
              onChange={(e) => setMovieSearchQuery(e.target.value)}
              onFocus={() => setShowMovieDropdown(true)}
              className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-primary transition"
            />

            {showMovieDropdown && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-[#10131a] border border-gray-700 rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto">
                {loadingCatalog ? (
                  <div className="p-6 text-center text-gray-400">Loading catalog...............</div>
                ) : catalogMovies.length > 0 ? (
                  <div className="p-2">
                    {catalogMovies.map((movie) => (
                      <button
                        key={movie.id}
                        onClick={() => handleSelectMovie(movie)}
                        className="w-full text-left p-3 hover:bg-gray-800 rounded-xl transition border-b border-gray-800 last:border-b-0"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-11 h-16 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xs text-gray-300 font-semibold shrink-0">
                            {movie.title.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-white font-semibold truncate">{movie.title}</p>
                              <span className="text-xs text-yellow-400 whitespace-nowrap">
                                ⭐ {movie.rating?.toFixed(1)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400">
                              {movie.releaseYear || movie.releaseDate?.substring(0, 4) || 'N/A'}
                              {movie.runtime ? ` • ${movie.runtime} min` : ''}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {movie.genres?.slice(0, 3).join(', ') || 'Genre unavailable'}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-400">
                    {movieSearchQuery ? 'No matching movies found.' : 'Start typing to browse the catalog.'}
                  </div>
                )}
              </div>
            )}

            {selectedMovie && (
              <div className="mt-3 p-4 bg-gray-800 rounded-xl flex items-center justify-between gap-4">
                <span className="text-white">
                  Selected: <strong>{selectedMovie.title}</strong>
                </span>
                <button
                  onClick={() => {
                    setSelectedMovie(null);
                    setMovieSearchQuery('');
                  }}
                  className="text-sm text-primary hover:text-red-500 transition"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-gray-300 font-semibold mb-2">Genre</label>
              <select
                name="genre"
                value={filters.genre}
                onChange={handleFilterChange}
                className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-primary"
              >
                <option>Action</option>
                <option>Comedy</option>
                <option>Thriller</option>
                <option>Drama</option>
                <option>Sci-Fi</option>
                <option>Romance</option>
                <option>Horror</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-2">Mood</label>
              <select
                name="mood"
                value={filters.mood}
                onChange={handleFilterChange}
                className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-primary"
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
                className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-primary"
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
                className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-primary"
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
            className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading ? 'Getting Recommendations...' : 'Get Recommendations'}
          </button>

          {message && (
            <p className={`text-center mt-4 text-sm ${message.includes('Failed') || message.includes('No movies') ? 'text-red-500' : 'text-green-500'}`}>
              {message}
            </p>
          )}
        </div>

        {movies.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Recommended Movies</h3>
              {/* <p className="text-gray-400 text-sm">Click any card to open the detail page</p> */}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {movies.map((movie) => (
                <motion.div
                  key={movie.id}
                  whileHover={{ scale: 1.04, y: -4 }}
                  onClick={() => navigate(`/movie/${movie.id}`)}
                  className="rounded-2xl overflow-hidden cursor-pointer group border border-gray-800 bg-[#10131a] shadow-xl shadow-black/10"
                >
                  <div className="aspect-[2/3] bg-gray-900 relative overflow-hidden">
                    {movie.posterPath ? (
                      <img
                        src={movie.posterPath}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-700 via-gray-800 to-gray-950 flex flex-col items-center justify-center px-4 text-center">
                        <span className="text-white font-semibold text-sm">{movie.title}</span>
                        <span className="text-gray-400 text-xs mt-2">{movie.genres?.slice(0, 2).join(' • ')}</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-4 gap-2">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          openTrailer(movie);
                        }}
                        disabled={trailerLoading}
                        className="text-white text-sm font-semibold bg-white/10 backdrop-blur px-3 py-2 rounded-lg hover:bg-white/20 transition disabled:opacity-50"
                      >
                        ▶ Watch Trailer
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleAddToFavorites(movie.title);
                        }}
                        className="text-white text-sm font-semibold bg-white/10 backdrop-blur px-3 py-2 rounded-lg hover:bg-white/20 transition"
                      >
                        ❤️ Favorite
                      </button>
                    </div>
                  </div>

                  <div className="p-3">
                    <h4 className="text-sm font-bold text-white truncate">{movie.title}</h4>
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                      <span>{movie.releaseYear || movie.releaseDate?.substring(0, 4) || 'N/A'}</span>
                      <span className="text-yellow-400">⭐ {movie.rating?.toFixed(1)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {movies.length === 0 && !loading && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">
              Select a movie or adjust filters, then click "Get Recommendations".
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
