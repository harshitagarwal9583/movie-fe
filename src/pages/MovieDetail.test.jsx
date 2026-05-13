import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MovieDetail from './MovieDetail';

vi.mock('framer-motion', () => ({
  motion: {
    section: ({ children, ...props }) => <section {...props}>{children}</section>,
  },
}));

vi.mock('../api/auth', () => ({
  movieAPI: {
    getMovieById: vi.fn(),
    addToHistory: vi.fn(),
    addToFavorites: vi.fn(),
    addToWishlist: vi.fn(),
  },
}));

vi.mock('../utils/trailer', () => ({
  buildTrailerUrl: vi.fn(({ trailerUrl, movieTitle }) =>
    trailerUrl || `https://www.youtube.com/results?search_query=${movieTitle}+trailer`
  ),
}));

import { movieAPI } from '../api/auth';
import { buildTrailerUrl } from '../utils/trailer';

const MOVIE = {
  id: '42',
  title: 'Inception',
  overview: 'A thief who steals corporate secrets.',
  tagline: 'Your mind is the scene of the crime.',
  posterPath: 'https://example.com/poster.jpg',
  rating: 8.8,
  releaseYear: '2010',
  releaseDate: '2010-07-16',
  runtime: 148,
  voteCount: 30000,
  popularity: 100.5,
  budget: 160000000,
  revenue: 836800000,
  originalLanguage: 'en',
  status: 'Released',
  genres: ['Action', 'Sci-Fi', 'Thriller'],
  keywords: ['dream', 'heist', 'mind'],
  homepage: 'https://inception.example.com',
  trailer: 'dQw4w9WgXcQ',
};

const renderMovieDetail = (movieId = '42') =>
  render(
    <MemoryRouter initialEntries={[`/movie/${movieId}`]}>
      <Routes>
        <Route path="/movie/:movieId" element={<MovieDetail />} />
        <Route path="/" element={<div>Home Page</div>} />
        <Route path="/profile" element={<div>Profile Page</div>} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  movieAPI.addToHistory.mockResolvedValue({});
});

afterEach(() => {
  localStorage.clear();
});

describe('MovieDetail – loading state', () => {
  it('shows Loading... while fetching', async () => {
    let resolve;
    movieAPI.getMovieById.mockReturnValue(new Promise((r) => { resolve = r; }));

    renderMovieDetail();
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    resolve({ data: { movie: MOVIE, relatedMovies: [] } });
  });
});

describe('MovieDetail – error state', () => {
  it('shows error message when API call fails', async () => {
    movieAPI.getMovieById.mockRejectedValue(new Error('Network error'));
    renderMovieDetail();

    await waitFor(() => {
      expect(screen.getByText(/Failed to load movie details/i)).toBeInTheDocument();
    });
  });

  it('shows Back to Home button in error state', async () => {
    movieAPI.getMovieById.mockRejectedValue(new Error('Network error'));
    renderMovieDetail();

    await waitFor(() => {
      const buttons = screen.getAllByRole('button', { name: /Back to Home/i });
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  it('navigates home when Back to Home is clicked from error state', async () => {
    movieAPI.getMovieById.mockRejectedValue(new Error('Network error'));
    renderMovieDetail();

    await waitFor(() => screen.getByText(/Failed to load movie details/i));
    fireEvent.click(screen.getAllByRole('button', { name: /Back to Home/i })[0]);

    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });
});

describe('MovieDetail – successful render', () => {
  const setup = async () => {
    movieAPI.getMovieById.mockResolvedValue({
      data: { movie: MOVIE, relatedMovies: [], trailer: 'dQw4w9WgXcQ' },
    });
    renderMovieDetail();
    await waitFor(() => screen.getByRole('heading', { level: 1, name: /Inception/i }));
  };

  it('renders the movie title as h1', async () => {
    await setup();
    expect(screen.getByRole('heading', { level: 1, name: /Inception/i })).toBeInTheDocument();
  });

  it('renders the movie tagline', async () => {
    await setup();
    expect(screen.getByText(/Your mind is the scene of the crime/i)).toBeInTheDocument();
  });

  it('renders the movie overview', async () => {
    await setup();
    expect(screen.getByText(/A thief who steals corporate secrets/i)).toBeInTheDocument();
  });

  it('renders the movie poster', async () => {
    await setup();
    const poster = screen.getByAltText('Inception');
    expect(poster).toBeInTheDocument();
    expect(poster).toHaveAttribute('src', MOVIE.posterPath);
  });

  it('renders all genres', async () => {
    await setup();
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('Sci-Fi')).toBeInTheDocument();
    expect(screen.getByText('Thriller')).toBeInTheDocument();
  });

  it('renders keywords (up to 18)', async () => {
    await setup();
    expect(screen.getByText('dream')).toBeInTheDocument();
    expect(screen.getByText('heist')).toBeInTheDocument();
  });

  it('renders the rating and vote count', async () => {
    await setup();
    expect(screen.getByText(/8.8\/10/)).toBeInTheDocument();
    expect(screen.getByText(/30,000 votes/i)).toBeInTheDocument();
  });

  it('renders the runtime in the header badges', async () => {
    await setup();
    // The runtime badge in the header shows "148 min"
    const runtimeBadge = screen.getAllByText(/148 min/i).find((el) =>
      el.tagName === 'SPAN'
    );
    expect(runtimeBadge).toBeTruthy();
  });

  it('renders Movie Details section with budget and revenue', async () => {
    await setup();
    expect(screen.getByText(/Budget/i)).toBeInTheDocument();
    expect(screen.getByText(/\$160,000,000/i)).toBeInTheDocument();
    expect(screen.getByText(/Revenue/i)).toBeInTheDocument();
    expect(screen.getByText(/\$836,800,000/i)).toBeInTheDocument();
  });

  it('renders language and status in Movie Details', async () => {
    await setup();
    expect(screen.getByText('EN')).toBeInTheDocument();
    expect(screen.getByText('Released')).toBeInTheDocument();
  });

  it('renders the official website link', async () => {
    await setup();
    const link = screen.getByRole('link', { name: /Visit Official Website/i });
    expect(link).toHaveAttribute('href', MOVIE.homepage);
  });

  it('renders Watch Trailer, Add to Favorites, and Add to Wishlist buttons', async () => {
    await setup();
    expect(screen.getByRole('button', { name: /Watch Trailer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add to Favorites/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add to Wishlist/i })).toBeInTheDocument();
  });

  it('renders a Back to Home button', async () => {
    await setup();
    const backBtns = screen.getAllByRole('button', { name: /Back to Home/i });
    expect(backBtns.length).toBeGreaterThan(0);
  });

  it('renders a View Profile link', async () => {
    await setup();
    expect(screen.getByRole('link', { name: /View Profile/i })).toBeInTheDocument();
  });
});

describe('MovieDetail – poster fallback', () => {
  it('renders "Poster unavailable" text when posterPath is missing', async () => {
    const movieNoPoster = { ...MOVIE, posterPath: undefined };
    movieAPI.getMovieById.mockResolvedValue({
      data: { movie: movieNoPoster, relatedMovies: [] },
    });
    renderMovieDetail();

    await waitFor(() => screen.getByRole('heading', { level: 1, name: /Inception/i }));
    expect(screen.getByText('Poster unavailable from the local dataset.')).toBeInTheDocument();
  });

  it('renders movie title in h2 fallback when no poster', async () => {
    const movieNoPoster = { ...MOVIE, posterPath: undefined };
    movieAPI.getMovieById.mockResolvedValue({
      data: { movie: movieNoPoster, relatedMovies: [] },
    });
    renderMovieDetail();

    await waitFor(() => screen.getByRole('heading', { level: 2, name: /Inception/i }));
    expect(screen.getByRole('heading', { level: 2, name: /Inception/i })).toBeInTheDocument();
  });
});

describe('MovieDetail – history tracking', () => {
  it('calls addToHistory when token is present', async () => {
    localStorage.setItem('token', 'test-token');
    movieAPI.getMovieById.mockResolvedValue({
      data: { movie: MOVIE, relatedMovies: [] },
    });
    renderMovieDetail();

    await waitFor(() => screen.getByRole('heading', { level: 1, name: /Inception/i }));
    expect(movieAPI.addToHistory).toHaveBeenCalledWith({ movieName: 'Inception' });
  });

  it('does NOT call addToHistory when no token', async () => {
    localStorage.removeItem('token');
    movieAPI.getMovieById.mockResolvedValue({
      data: { movie: MOVIE, relatedMovies: [] },
    });
    renderMovieDetail();

    await waitFor(() => screen.getByRole('heading', { level: 1, name: /Inception/i }));
    expect(movieAPI.addToHistory).not.toHaveBeenCalled();
  });
});

describe('MovieDetail – Add to Favorites', () => {
  const setup = async () => {
    movieAPI.getMovieById.mockResolvedValue({
      data: { movie: MOVIE, relatedMovies: [] },
    });
    renderMovieDetail();
    await waitFor(() => screen.getByRole('heading', { level: 1, name: /Inception/i }));
  };

  it('shows "Please login" if no token when adding to favorites', async () => {
    localStorage.removeItem('token');
    await setup();
    fireEvent.click(screen.getByRole('button', { name: /Add to Favorites/i }));
    expect(screen.getByText(/Please login to add to favorites/i)).toBeInTheDocument();
  });

  it('calls addToFavorites when token is present', async () => {
    localStorage.setItem('token', 'tok');
    movieAPI.addToFavorites.mockResolvedValue({});
    await setup();
    fireEvent.click(screen.getByRole('button', { name: /Add to Favorites/i }));
    await waitFor(() => {
      expect(movieAPI.addToFavorites).toHaveBeenCalledWith({ movieName: 'Inception' });
    });
  });

  it('shows "Added to favorites!" on success', async () => {
    localStorage.setItem('token', 'tok');
    movieAPI.addToFavorites.mockResolvedValue({});
    await setup();
    fireEvent.click(screen.getByRole('button', { name: /Add to Favorites/i }));
    await waitFor(() => {
      expect(screen.getByText('Added to favorites!')).toBeInTheDocument();
    });
  });

  it('shows "Failed to add to favorites" when API rejects', async () => {
    localStorage.setItem('token', 'tok');
    movieAPI.addToFavorites.mockRejectedValue(new Error('Server error'));
    await setup();
    fireEvent.click(screen.getByRole('button', { name: /Add to Favorites/i }));
    await waitFor(() => {
      expect(screen.getByText('Failed to add to favorites')).toBeInTheDocument();
    });
  });
});

describe('MovieDetail – Add to Wishlist', () => {
  const setup = async () => {
    movieAPI.getMovieById.mockResolvedValue({
      data: { movie: MOVIE, relatedMovies: [] },
    });
    renderMovieDetail();
    await waitFor(() => screen.getByRole('heading', { level: 1, name: /Inception/i }));
  };

  it('shows "Please login" if no token when adding to wishlist', async () => {
    localStorage.removeItem('token');
    await setup();
    fireEvent.click(screen.getByRole('button', { name: /Add to Wishlist/i }));
    expect(screen.getByText(/Please login to add to wishlist/i)).toBeInTheDocument();
  });

  it('calls addToWishlist and shows success message', async () => {
    localStorage.setItem('token', 'tok');
    movieAPI.addToWishlist.mockResolvedValue({});
    await setup();
    fireEvent.click(screen.getByRole('button', { name: /Add to Wishlist/i }));
    await waitFor(() => {
      expect(movieAPI.addToWishlist).toHaveBeenCalledWith({ movieName: 'Inception' });
      expect(screen.getByText('Added to wishlist!')).toBeInTheDocument();
    });
  });

  it('shows failure message when API rejects', async () => {
    localStorage.setItem('token', 'tok');
    movieAPI.addToWishlist.mockRejectedValue(new Error('Server error'));
    await setup();
    fireEvent.click(screen.getByRole('button', { name: /Add to Wishlist/i }));
    await waitFor(() => {
      expect(screen.getByText('Failed to add to wishlist')).toBeInTheDocument();
    });
  });
});

describe('MovieDetail – Watch Trailer', () => {
  const setup = async (trailerUrl = 'dQw4w9WgXcQ') => {
    movieAPI.getMovieById.mockResolvedValue({
      data: { movie: MOVIE, relatedMovies: [], trailer: trailerUrl },
    });
    renderMovieDetail();
    await waitFor(() => screen.getByRole('heading', { level: 1, name: /Inception/i }));
  };

  it('calls window.open when Watch Trailer is clicked', async () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue({});
    await setup();
    fireEvent.click(screen.getByRole('button', { name: /Watch Trailer/i }));
    expect(openSpy).toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it('shows popup blocked message when window.open returns null', async () => {
    vi.spyOn(window, 'open').mockReturnValueOnce(null);
    await setup();
    fireEvent.click(screen.getByRole('button', { name: /Watch Trailer/i }));
    expect(screen.getByText(/Popup was blocked/i)).toBeInTheDocument();
  });

  it('calls buildTrailerUrl with the trailerUrl and movieTitle', async () => {
    vi.spyOn(window, 'open').mockReturnValue({});
    await setup('dQw4w9WgXcQ');
    fireEvent.click(screen.getByRole('button', { name: /Watch Trailer/i }));
    expect(buildTrailerUrl).toHaveBeenCalledWith(
      expect.objectContaining({ movieTitle: 'Inception' })
    );
  });
});

describe('MovieDetail – related movies', () => {
  it('renders "More Like This" section when relatedMovies exist', async () => {
    movieAPI.getMovieById.mockResolvedValue({
      data: {
        movie: MOVIE,
        relatedMovies: [
          { id: '10', title: 'InterstellarFilm', rating: 8.6, posterPath: null },
          { id: '11', title: 'TenetFilm', rating: 7.5, posterPath: null },
        ],
      },
    });
    renderMovieDetail();

    await waitFor(() => {
      expect(screen.getByText('More Like This')).toBeInTheDocument();
      // The related movie title appears in both the fallback div and the p element
      expect(screen.getAllByText('InterstellarFilm').length).toBeGreaterThan(0);
      expect(screen.getAllByText('TenetFilm').length).toBeGreaterThan(0);
    });
  });

  it('does not render "More Like This" section when relatedMovies is empty', async () => {
    movieAPI.getMovieById.mockResolvedValue({
      data: { movie: MOVIE, relatedMovies: [] },
    });
    renderMovieDetail();
    await waitFor(() => screen.getByRole('heading', { level: 1, name: /Inception/i }));
    expect(screen.queryByText('More Like This')).not.toBeInTheDocument();
  });

  it('navigates to the related movie detail page on click', async () => {
    movieAPI.getMovieById.mockResolvedValueOnce({
      data: {
        movie: MOVIE,
        relatedMovies: [{ id: '10', title: 'InterstellarFilm', rating: 8.6, posterPath: null }],
      },
    });
    movieAPI.getMovieById.mockResolvedValueOnce({
      data: { movie: { ...MOVIE, id: '10', title: 'InterstellarFilm' }, relatedMovies: [] },
    });

    renderMovieDetail();
    await waitFor(() => screen.getByText('More Like This'));

    // Click the related movie button
    const relatedBtn = screen.getAllByRole('button').find(
      (btn) => btn.textContent.includes('InterstellarFilm')
    );
    expect(relatedBtn).toBeTruthy();
    fireEvent.click(relatedBtn);

    await waitFor(() => {
      expect(movieAPI.getMovieById).toHaveBeenCalledWith('10');
    });
  });
});

describe('MovieDetail – infoItems / Movie Details section', () => {
  it('does not render Movie Details section when movie has no optional fields', async () => {
    const minimalMovie = { id: '1', title: 'MinimalMovieXYZ' };
    movieAPI.getMovieById.mockResolvedValue({
      data: { movie: minimalMovie, relatedMovies: [] },
    });
    renderMovieDetail('1');
    await waitFor(() =>
      screen.getByRole('heading', { level: 1, name: /MinimalMovieXYZ/i })
    );
    expect(screen.queryByRole('heading', { name: /Movie Details/i })).not.toBeInTheDocument();
  });

  it('renders runtime in "N mins" format in the details section', async () => {
    movieAPI.getMovieById.mockResolvedValue({
      data: { movie: MOVIE, relatedMovies: [] },
    });
    renderMovieDetail();
    await waitFor(() => screen.getByRole('heading', { level: 1, name: /Inception/i }));
    // "148 mins" appears in the Movie Details info grid (different from "148 min" in header)
    expect(screen.getByText('148 mins')).toBeInTheDocument();
  });

  it('renders vote count formatted with commas', async () => {
    movieAPI.getMovieById.mockResolvedValue({
      data: { movie: MOVIE, relatedMovies: [] },
    });
    renderMovieDetail();
    await waitFor(() => screen.getByRole('heading', { level: 1, name: /Inception/i }));
    expect(screen.getByText('30,000')).toBeInTheDocument();
  });
});