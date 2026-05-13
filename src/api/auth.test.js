import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the axios client module before importing auth.js
vi.mock('./client', () => {
  const client = {
    get: vi.fn(),
    post: vi.fn(),
  };
  return { default: client };
});

import { movieAPI } from './auth';
import client from './client';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('movieAPI – new methods added in PR', () => {
  describe('getPopularMovies', () => {
    it('calls GET /movies/popular with no params by default', () => {
      client.get.mockResolvedValueOnce({ data: { movies: [] } });
      movieAPI.getPopularMovies();
      expect(client.get).toHaveBeenCalledWith('/movies/popular', { params: {} });
    });

    it('forwards provided params', () => {
      client.get.mockResolvedValueOnce({ data: { movies: [] } });
      movieAPI.getPopularMovies({ page: 2, limit: 20 });
      expect(client.get).toHaveBeenCalledWith('/movies/popular', {
        params: { page: 2, limit: 20 },
      });
    });

    it('returns the axios promise', async () => {
      const mockResponse = { data: { movies: [{ id: 1, title: 'Interstellar' }] } };
      client.get.mockResolvedValueOnce(mockResponse);
      const result = await movieAPI.getPopularMovies();
      expect(result).toBe(mockResponse);
    });
  });

  describe('getCatalog', () => {
    it('calls GET /movies/catalog with no params by default', () => {
      client.get.mockResolvedValueOnce({ data: { movies: [], total: 0 } });
      movieAPI.getCatalog();
      expect(client.get).toHaveBeenCalledWith('/movies/catalog', { params: {} });
    });

    it('forwards query and limit params', () => {
      client.get.mockResolvedValueOnce({ data: { movies: [], total: 0 } });
      movieAPI.getCatalog({ query: 'inception', limit: 60 });
      expect(client.get).toHaveBeenCalledWith('/movies/catalog', {
        params: { query: 'inception', limit: 60 },
      });
    });

    it('returns the axios promise', async () => {
      const mockResponse = { data: { movies: [{ id: 42, title: 'Dune' }], total: 1 } };
      client.get.mockResolvedValueOnce(mockResponse);
      const result = await movieAPI.getCatalog({ query: 'dune' });
      expect(result).toBe(mockResponse);
    });

    it('propagates rejection from client', async () => {
      client.get.mockRejectedValueOnce(new Error('Network error'));
      await expect(movieAPI.getCatalog()).rejects.toThrow('Network error');
    });
  });

  describe('getMovieById', () => {
    it('calls GET /movies/movie/:movieId with the correct path', () => {
      client.get.mockResolvedValueOnce({ data: { movie: {} } });
      movieAPI.getMovieById('123');
      expect(client.get).toHaveBeenCalledWith('/movies/movie/123');
    });

    it('works with numeric IDs', () => {
      client.get.mockResolvedValueOnce({ data: { movie: {} } });
      movieAPI.getMovieById(456);
      expect(client.get).toHaveBeenCalledWith('/movies/movie/456');
    });

    it('returns the axios promise with movie data', async () => {
      const mockResponse = {
        data: { movie: { id: '123', title: 'Inception' }, relatedMovies: [] },
      };
      client.get.mockResolvedValueOnce(mockResponse);
      const result = await movieAPI.getMovieById('123');
      expect(result).toBe(mockResponse);
    });

    it('propagates rejection for a not-found ID', async () => {
      client.get.mockRejectedValueOnce(new Error('404 Not Found'));
      await expect(movieAPI.getMovieById('nonexistent')).rejects.toThrow('404 Not Found');
    });
  });

  describe('pre-existing methods remain intact', () => {
    it('getRecommendations passes filters as params', () => {
      client.get.mockResolvedValueOnce({ data: { movies: [] } });
      movieAPI.getRecommendations({ genre: 'Action', mood: 'Thrilling' });
      expect(client.get).toHaveBeenCalledWith('/movies/recommend', {
        params: { genre: 'Action', mood: 'Thrilling' },
      });
    });

    it('addToFavorites posts to /movies/favorite', () => {
      client.post.mockResolvedValueOnce({ data: {} });
      movieAPI.addToFavorites({ movieName: 'Dune', movieId: '42' });
      expect(client.post).toHaveBeenCalledWith('/movies/favorite', {
        movieName: 'Dune',
        movieId: '42',
      });
    });
  });
});