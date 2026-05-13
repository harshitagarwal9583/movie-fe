import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { movieAPI } from '../api/auth';
import { buildTrailerUrl } from '../utils/trailer';

const formatMoney = (value) => {
  if (!value) {
    return 'N/A';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

export default function MovieDetail() {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [relatedMovies, setRelatedMovies] = useState([]);
  const [trailerUrl, setTrailerUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trailerLoading, setTrailerLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        setLoading(true);
        const response = await movieAPI.getMovieById(movieId);
        const movieData = response.data.movie;

        setMovie(movieData);
        setRelatedMovies(response.data.relatedMovies || []);
        setTrailerUrl(response.data.trailer || movieData?.trailer || '');

        const token = localStorage.getItem('token');
        if (token && movieData?.title) {
          movieAPI.addToHistory({ movieName: movieData.title }).catch((error) => {
            console.error('Failed to add to history:', error);
          });
        }
      } catch (err) {
        setError('Failed to load movie details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [movieId]);

  const infoItems = useMemo(() => {
    if (!movie) {
      return [];
    }

    return [
      movie.releaseDate ? { label: 'Release Date', value: movie.releaseDate } : null,
      movie.runtime ? { label: 'Runtime', value: `${movie.runtime} mins` } : null,
      movie.voteCount ? { label: 'Vote Count', value: movie.voteCount.toLocaleString() } : null,
      movie.popularity ? { label: 'Popularity', value: movie.popularity.toFixed(1) } : null,
      movie.budget ? { label: 'Budget', value: formatMoney(movie.budget) } : null,
      movie.revenue ? { label: 'Revenue', value: formatMoney(movie.revenue) } : null,
      movie.originalLanguage ? { label: 'Language', value: movie.originalLanguage.toUpperCase() } : null,
      movie.status ? { label: 'Status', value: movie.status } : null,
    ].filter(Boolean);
  }, [movie]);

  const handleAddToFavorites = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('Please login to add to favorites');
        return;
      }

      await movieAPI.addToFavorites({ movieName: movie.title });
      setMessage('Added to favorites!');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Failed to add to favorites');
    }
  };

  const handleAddToWishlist = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('Please login to add to wishlist');
        return;
      }

      await movieAPI.addToWishlist({ movieName: movie.title });
      setMessage('Added to wishlist!');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Failed to add to wishlist');
    }
  };

  const handleWatchTrailer = async () => {
    const trailerLink = buildTrailerUrl({ trailerUrl, movieTitle: movie?.title });
    const trailerTab = window.open(trailerLink, '_blank', 'noopener,noreferrer');

    if (!trailerTab) {
      setMessage('Popup was blocked. Please allow popups and try again.');
      return;
    }

    try {
      setTrailerLoading(true);
    } catch {
      setMessage('Could not open trailer');
    } finally {
      setTrailerLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-dark via-darker to-dark flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-dark via-darker to-dark flex flex-col items-center justify-center px-4 text-center">
        <div className="text-white text-2xl mb-4">{error}</div>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-red-700 transition"
        >
          ← Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark via-darker to-dark text-white">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
          >
            ← Back to Home
          </button>

          <Link
            to="/profile"
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-700 transition"
          >
            View Profile
          </Link>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-[360px,1fr] gap-8"
        >
          <div className="rounded-3xl overflow-hidden border border-gray-800 bg-[#10131a] shadow-2xl shadow-black/20">
            {movie.posterPath ? (
              <img src={movie.posterPath} alt={movie.title} className="w-full h-full object-cover" />
            ) : (
              <div className="min-h-[540px] bg-gradient-to-br from-gray-700 via-gray-800 to-gray-950 flex flex-col items-center justify-center px-6 text-center">
                <h2 className="text-3xl font-bold mb-3">{movie.title}</h2>
                <p className="text-gray-400 text-sm">Poster unavailable from the local dataset.</p>
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div>
              {movie.tagline && <p className="text-primary text-sm uppercase tracking-[0.3em] mb-3">{movie.tagline}</p>}
              <h1 className="text-5xl font-bold leading-tight mb-4">{movie.title}</h1>

              <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-gray-300">
                {movie.releaseYear && <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">{movie.releaseYear}</span>}
                {movie.rating && <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">⭐ {movie.rating.toFixed(1)}/10</span>}
                {movie.voteCount && <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">{movie.voteCount.toLocaleString()} votes</span>}
                {movie.runtime && <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">{movie.runtime} min</span>}
              </div>

              {movie.overview && <p className="text-gray-300 text-lg leading-relaxed max-w-4xl">{movie.overview}</p>}
            </div>

            {movie.genres?.length > 0 && (
              <div>
                <p className="text-gray-400 text-sm uppercase tracking-[0.2em] mb-3">Genres</p>
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((genre) => (
                    <span key={genre} className="px-3 py-1 rounded-full bg-primary/15 text-primary border border-primary/20">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {movie.homepage && (
              <a
                href={movie.homepage}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-primary hover:text-red-400 transition"
              >
                Visit Official Website
              </a>
            )}

            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleWatchTrailer}
                disabled={trailerLoading}
                className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-red-700 transition disabled:opacity-50"
              >
                {trailerLoading ? '▶ Loading...' : '▶ Watch Trailer'}
              </button>
              <button
                onClick={handleAddToFavorites}
                className="px-6 py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-700 transition"
              >
                ❤️ Add to Favorites
              </button>
              <button
                onClick={handleAddToWishlist}
                className="px-6 py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-700 transition"
              >
                📌 Add to Wishlist
              </button>
            </div>

            {message && <p className={`text-sm ${message.includes('Failed') ? 'text-red-500' : 'text-green-500'}`}>{message}</p>}
          </div>
        </motion.section>

        {infoItems.length > 0 && (
          <section className="bg-[#10131a] border border-gray-800 rounded-3xl p-6 shadow-2xl shadow-black/20">
            <h2 className="text-2xl font-bold mb-6">Movie Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {infoItems.map((item) => (
                <div key={item.label} className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <p className="text-gray-400 text-sm">{item.label}</p>
                  <p className="text-white font-semibold mt-1 break-words">{item.value}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {movie.keywords?.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4">Keywords</h2>
            <div className="flex flex-wrap gap-2">
              {movie.keywords.slice(0, 18).map((keyword) => (
                <span key={keyword} className="px-3 py-1 rounded-full bg-gray-800 text-gray-200 text-sm">
                  {keyword}
                </span>
              ))}
            </div>
          </section>
        )}

        {relatedMovies.length > 0 && (
          <section>
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-2xl font-bold">More Like This</h2>
              <p className="text-gray-400 text-sm">Related picks from the same catalog</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {relatedMovies.map((relatedMovie) => (
                <button
                  key={relatedMovie.id}
                  onClick={() => navigate(`/movie/${relatedMovie.id}`)}
                  className="text-left rounded-2xl overflow-hidden bg-[#10131a] border border-gray-800 hover:border-primary transition"
                >
                  <div className="aspect-[2/3] bg-gray-900">
                    {relatedMovie.posterPath ? (
                      <img src={relatedMovie.posterPath} alt={relatedMovie.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center px-3 text-center text-sm text-gray-400">
                        {relatedMovie.title}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm text-white font-semibold truncate">{relatedMovie.title}</p>
                    <p className="text-xs text-gray-400 mt-1">⭐ {relatedMovie.rating?.toFixed(1)}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}