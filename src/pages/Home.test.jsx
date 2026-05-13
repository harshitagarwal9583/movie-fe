import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';

// Mock framer-motion so it renders children without animation complexity
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, className, ...rest }) => (
      <div onClick={onClick} className={className}>
        {children}
      </div>
    ),
  },
}));

// Mock the API module
vi.mock('../api/auth', () => ({
  movieAPI: {
    getCatalog: vi.fn(),
    getRecommendations: vi.fn(),
    addToFavorites: vi.fn(),
    addToHistory: vi.fn(),
    searchMovies: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

import { movieAPI } from '../api/auth';

const renderHome = () =>
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mockNavigate.mockClear();
});

afterEach(() => {
  localStorage.clear();
});

describe('Home – initial render', () => {
  it('shows the hero heading', () => {
    renderHome();
    expect(screen.getByText(/Discover Your Next/i)).toBeInTheDocument();
  });

  it('shows the "Get Recommendations" button', () => {
    renderHome();
    expect(screen.getByRole('button', { name: /Get Recommendations/i })).toBeInTheDocument();
  });

  it('shows the catalog search input', () => {
    renderHome();
    expect(screen.getByPlaceholderText(/browse the full catalog/i)).toBeInTheDocument();
  });

  it('shows the catalog total counter area', () => {
    renderHome();
    expect(screen.getByText(/Catalog:/i)).toBeInTheDocument();
  });

  it('shows the empty state prompt when no movies loaded', () => {
    renderHome();
    expect(screen.getByText(/Select a movie or adjust filters/i)).toBeInTheDocument();
  });
});

describe('Home – filter controls', () => {
  // The <select> elements don't have id/htmlFor associations, so we query by index.
  // Genre is the first combobox, Mood is the second.
  const getComboboxes = () => screen.getAllByRole('combobox');

  it('renders genre options including new Romance and Horror entries', () => {
    renderHome();
    const genreSelect = getComboboxes()[0];
    const options = Array.from(genreSelect.querySelectorAll('option')).map((o) => o.value);
    expect(options).toContain('Romance');
    expect(options).toContain('Horror');
  });

  it('updates genre filter when user changes select', async () => {
    renderHome();
    const genreSelect = getComboboxes()[0];
    await userEvent.selectOptions(genreSelect, 'Comedy');
    expect(genreSelect).toHaveValue('Comedy');
  });

  it('updates mood filter', async () => {
    renderHome();
    const moodSelect = getComboboxes()[1];
    await userEvent.selectOptions(moodSelect, 'Funny');
    expect(moodSelect).toHaveValue('Funny');
  });
});

describe('Home – catalog dropdown', () => {
  it('opens the dropdown when the search input is focused', async () => {
    movieAPI.getCatalog.mockResolvedValue({ data: { movies: [], total: 0 } });
    renderHome();
    const input = screen.getByPlaceholderText(/browse the full catalog/i);
    fireEvent.focus(input);
    await waitFor(() => {
      expect(screen.getByText(/Start typing to browse the catalog/i)).toBeInTheDocument();
    });
  });

  it('shows catalog movies returned from API', async () => {
    movieAPI.getCatalog.mockResolvedValue({
      data: {
        movies: [
          { id: '1', title: 'Inception', rating: 8.8, genres: ['Sci-Fi'] },
          { id: '2', title: 'Dune2049', rating: 8.0, genres: ['Adventure'] },
        ],
        total: 2,
      },
    });

    renderHome();
    const input = screen.getByPlaceholderText(/browse the full catalog/i);
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getAllByText('Inception').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Dune2049').length).toBeGreaterThan(0);
    });
  });

  it('shows loading indicator while fetching catalog', async () => {
    let resolve;
    movieAPI.getCatalog.mockReturnValue(new Promise((r) => { resolve = r; }));

    renderHome();
    const input = screen.getByPlaceholderText(/browse the full catalog/i);
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText(/Loading catalog/i)).toBeInTheDocument();
    });
    resolve({ data: { movies: [], total: 0 } });
  });

  it('shows "No matching movies found" when API returns empty array with a query', async () => {
    movieAPI.getCatalog.mockResolvedValue({ data: { movies: [], total: 0 } });
    renderHome();
    const input = screen.getByPlaceholderText(/browse the full catalog/i);
    fireEvent.focus(input);
    await userEvent.type(input, 'xyznonexistent');

    await waitFor(() => {
      expect(screen.getByText(/No matching movies found/i)).toBeInTheDocument();
    });
  });

  it('calls getCatalog with the typed query', async () => {
    movieAPI.getCatalog.mockResolvedValue({ data: { movies: [], total: 0 } });
    renderHome();
    const input = screen.getByPlaceholderText(/browse the full catalog/i);
    fireEvent.focus(input);
    await userEvent.type(input, 'dark');

    await waitFor(() => {
      expect(movieAPI.getCatalog).toHaveBeenCalledWith(
        expect.objectContaining({ query: expect.stringContaining('dark') })
      );
    });
  });

  it('displays error message when getCatalog fails', async () => {
    movieAPI.getCatalog.mockRejectedValue(new Error('Network error'));
    renderHome();
    const input = screen.getByPlaceholderText(/browse the full catalog/i);
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load movies/i)).toBeInTheDocument();
    });
  });
});

describe('Home – movie selection from catalog', () => {
  const setupCatalogWithMovies = async () => {
    movieAPI.getCatalog.mockResolvedValue({
      data: {
        movies: [{ id: '1', title: 'UniqueTitle2024', rating: 8.8, genres: ['Sci-Fi'] }],
        total: 1,
      },
    });
    renderHome();
    const input = screen.getByPlaceholderText(/browse the full catalog/i);
    fireEvent.focus(input);
    await waitFor(() => expect(screen.getAllByText('UniqueTitle2024').length).toBeGreaterThan(0));
  };

  it('selecting a movie sets the input value and closes the dropdown', async () => {
    await setupCatalogWithMovies();
    // Click the dropdown button for this movie (first occurrence)
    fireEvent.click(screen.getAllByText('UniqueTitle2024')[0]);

    const input = screen.getByDisplayValue('UniqueTitle2024');
    expect(input).toBeInTheDocument();
    expect(screen.queryByText(/Start typing/i)).not.toBeInTheDocument();
  });

  it('shows "Selected: <movie title>" chip after selection', async () => {
    await setupCatalogWithMovies();
    fireEvent.click(screen.getAllByText('UniqueTitle2024')[0]);

    expect(screen.getByText(/Selected:/i)).toBeInTheDocument();
    expect(screen.getByText('UniqueTitle2024', { selector: 'strong' })).toBeInTheDocument();
  });

  it('shows a message confirming selection', async () => {
    await setupCatalogWithMovies();
    fireEvent.click(screen.getAllByText('UniqueTitle2024')[0]);
    expect(screen.getByText(/Selected UniqueTitle2024/i)).toBeInTheDocument();
  });

  it('clears the selected movie when the Clear button is clicked', async () => {
    await setupCatalogWithMovies();
    fireEvent.click(screen.getAllByText('UniqueTitle2024')[0]);

    const clearButton = screen.getByRole('button', { name: /Clear/i });
    fireEvent.click(clearButton);

    expect(screen.queryByText(/Selected:/i)).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('')).toBeInTheDocument();
  });
});

describe('Home – get recommendations', () => {
  it('calls getRecommendations with current filters', async () => {
    movieAPI.getRecommendations.mockResolvedValue({
      data: { movies: [] },
    });

    renderHome();
    fireEvent.click(screen.getByRole('button', { name: /Get Recommendations/i }));

    await waitFor(() => {
      expect(movieAPI.getRecommendations).toHaveBeenCalledWith(
        expect.objectContaining({ genre: 'Action', mood: 'Thrilling' })
      );
    });
  });

  it('passes selectedMovieId when a movie is selected', async () => {
    movieAPI.getCatalog.mockResolvedValue({
      data: { movies: [{ id: '99', title: 'MovieXYZ9999', rating: 8.6, genres: [] }], total: 1 },
    });
    movieAPI.getRecommendations.mockResolvedValue({ data: { movies: [] } });

    renderHome();
    fireEvent.focus(screen.getByPlaceholderText(/browse the full catalog/i));
    await waitFor(() => expect(screen.getAllByText('MovieXYZ9999').length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByText('MovieXYZ9999')[0]);

    fireEvent.click(screen.getByRole('button', { name: /Get Recommendations/i }));

    await waitFor(() => {
      expect(movieAPI.getRecommendations).toHaveBeenCalledWith(
        expect.objectContaining({ selectedMovieId: '99' })
      );
    });
  });

  it('shows "No movies found" message when API returns empty array', async () => {
    movieAPI.getRecommendations.mockResolvedValue({ data: { movies: [] } });
    renderHome();
    fireEvent.click(screen.getByRole('button', { name: /Get Recommendations/i }));

    await waitFor(() => {
      expect(screen.getByText(/No movies found for these filters/i)).toBeInTheDocument();
    });
  });

  it('shows "Found N movies" message on success', async () => {
    movieAPI.getRecommendations.mockResolvedValue({
      data: { movies: [{ id: '1', title: 'MovieAlpha', rating: 7.0 }] },
    });
    renderHome();
    fireEvent.click(screen.getByRole('button', { name: /Get Recommendations/i }));

    await waitFor(() => {
      expect(screen.getByText(/Found 1 movies/i)).toBeInTheDocument();
    });
  });

  it('shows error message when getRecommendations rejects', async () => {
    movieAPI.getRecommendations.mockRejectedValue(new Error('Server error'));
    renderHome();
    fireEvent.click(screen.getByRole('button', { name: /Get Recommendations/i }));

    await waitFor(() => {
      expect(screen.getByText(/Failed to get recommendations/i)).toBeInTheDocument();
    });
  });

  it('disables the button while loading', async () => {
    let resolve;
    movieAPI.getRecommendations.mockReturnValue(new Promise((r) => { resolve = r; }));

    renderHome();
    const button = screen.getByRole('button', { name: /Get Recommendations/i });
    fireEvent.click(button);

    expect(button).toBeDisabled();
    resolve({ data: { movies: [] } });
    await waitFor(() => expect(button).not.toBeDisabled());
  });

  it('renders recommended movies grid after successful fetch', async () => {
    movieAPI.getRecommendations.mockResolvedValue({
      data: {
        movies: [
          { id: '1', title: 'AvatarFilm2009', rating: 7.8, releaseYear: '2009' },
          { id: '2', title: 'InceptionFilm2010', rating: 8.8, releaseYear: '2010' },
        ],
      },
    });

    renderHome();
    fireEvent.click(screen.getByRole('button', { name: /Get Recommendations/i }));

    await waitFor(() => {
      // Each movie title appears in a heading h4 and a span (poster fallback)
      expect(screen.getAllByText('AvatarFilm2009').length).toBeGreaterThan(0);
      expect(screen.getAllByText('InceptionFilm2010').length).toBeGreaterThan(0);
    });
  });

  it('navigates to /movie/:id when a movie card is clicked', async () => {
    movieAPI.getRecommendations.mockResolvedValue({
      data: { movies: [{ id: '42', title: 'DuneFilm2021', rating: 8.0 }] },
    });

    renderHome();
    fireEvent.click(screen.getByRole('button', { name: /Get Recommendations/i }));

    // Wait until the movie card h4 appears
    const movieHeading = await waitFor(() => screen.getByRole('heading', { level: 4, name: 'DuneFilm2021' }));
    // Click the card wrapper (the motion.div that has the onClick navigate handler)
    fireEvent.click(movieHeading.closest('div[class]'));

    expect(mockNavigate).toHaveBeenCalledWith('/movie/42');
  });
});

describe('Home – trailer opening', () => {
  it('shows popup-blocked message when window.open returns null', async () => {
    vi.spyOn(window, 'open').mockReturnValueOnce(null);
    movieAPI.getRecommendations.mockResolvedValue({
      data: { movies: [{ id: '1', title: 'TenetFilm2020', rating: 7.5, trailer: '' }] },
    });

    renderHome();
    fireEvent.click(screen.getByRole('button', { name: /Get Recommendations/i }));
    await waitFor(() => screen.getAllByText('TenetFilm2020'));

    // The Watch Trailer button is in the hover overlay (always in DOM)
    const trailerBtn = screen.getByRole('button', { name: /Watch Trailer/i });
    fireEvent.click(trailerBtn);

    expect(screen.getByText(/Popup was blocked/i)).toBeInTheDocument();
  });

  it('adds to history when token is present and trailer opens', async () => {
    localStorage.setItem('token', 'tok');
    vi.spyOn(window, 'open').mockReturnValueOnce({});
    movieAPI.addToHistory.mockResolvedValue({});
    movieAPI.getRecommendations.mockResolvedValue({
      data: { movies: [{ id: '1', title: 'TenetFilm2020', rating: 7.5, trailer: '' }] },
    });

    renderHome();
    fireEvent.click(screen.getByRole('button', { name: /Get Recommendations/i }));
    await waitFor(() => screen.getAllByText('TenetFilm2020'));

    const trailerBtn = screen.getByRole('button', { name: /Watch Trailer/i });
    fireEvent.click(trailerBtn);

    await waitFor(() => {
      expect(movieAPI.addToHistory).toHaveBeenCalledWith({ movieName: 'TenetFilm2020' });
    });
  });
});