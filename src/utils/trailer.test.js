import { describe, it, expect } from 'vitest';
import { buildTrailerUrl } from './trailer';

describe('buildTrailerUrl', () => {
  describe('bare 11-character YouTube video ID', () => {
    it('returns a watch URL for a valid 11-char alphanumeric ID', () => {
      expect(buildTrailerUrl({ trailerUrl: 'dQw4w9WgXcQ' })).toBe(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      );
    });

    it('handles IDs that contain underscores and hyphens', () => {
      expect(buildTrailerUrl({ trailerUrl: 'abc-_123456' })).toBe(
        'https://www.youtube.com/watch?v=abc-_123456'
      );
    });

    it('does NOT treat a 10-char string as a direct ID', () => {
      // 10-char string is not a valid bare ID; falls through to search
      const result = buildTrailerUrl({ trailerUrl: '1234567890', movieTitle: 'Test Movie' });
      expect(result).toBe(
        'https://www.youtube.com/results?search_query=Test%20Movie%20trailer'
      );
    });

    it('does NOT treat a 12-char string as a direct ID', () => {
      const result = buildTrailerUrl({ trailerUrl: '123456789012', movieTitle: 'Test' });
      expect(result).toBe(
        'https://www.youtube.com/results?search_query=Test%20trailer'
      );
    });
  });

  describe('youtube.com/watch?v= URLs', () => {
    it('extracts video ID from a standard watch URL', () => {
      expect(buildTrailerUrl({ trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })).toBe(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      );
    });

    it('extracts video ID from a watch URL with additional query params', () => {
      expect(
        buildTrailerUrl({ trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s' })
      ).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    });

    it('handles watch URL without www prefix', () => {
      expect(buildTrailerUrl({ trailerUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ' })).toBe(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      );
    });
  });

  describe('youtu.be short URLs', () => {
    it('extracts video ID from a youtu.be URL', () => {
      expect(buildTrailerUrl({ trailerUrl: 'https://youtu.be/dQw4w9WgXcQ' })).toBe(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      );
    });

    it('handles youtu.be URL with query string', () => {
      expect(buildTrailerUrl({ trailerUrl: 'https://youtu.be/dQw4w9WgXcQ?t=30' })).toBe(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      );
    });
  });

  describe('youtube.com/embed/ URLs', () => {
    it('extracts video ID from an embed URL', () => {
      expect(buildTrailerUrl({ trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' })).toBe(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      );
    });
  });

  describe('youtube.com/shorts/ URLs', () => {
    it('extracts video ID from a shorts URL', () => {
      expect(buildTrailerUrl({ trailerUrl: 'https://www.youtube.com/shorts/dQw4w9WgXcQ' })).toBe(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      );
    });
  });

  describe('non-YouTube http(s) URLs', () => {
    it('returns the URL as-is for a non-YouTube http URL', () => {
      const url = 'https://example.com/trailer.mp4';
      expect(buildTrailerUrl({ trailerUrl: url })).toBe(url);
    });

    it('returns the URL as-is for an http (non-https) URL', () => {
      const url = 'http://cdn.example.com/movie-trailer.mp4';
      expect(buildTrailerUrl({ trailerUrl: url })).toBe(url);
    });
  });

  describe('fallback to YouTube search', () => {
    it('builds a YouTube search URL when trailerUrl is empty', () => {
      expect(buildTrailerUrl({ trailerUrl: '', movieTitle: 'Inception' })).toBe(
        'https://www.youtube.com/results?search_query=Inception%20trailer'
      );
    });

    it('builds a YouTube search URL when trailerUrl is undefined', () => {
      expect(buildTrailerUrl({ movieTitle: 'The Dark Knight' })).toBe(
        'https://www.youtube.com/results?search_query=The%20Dark%20Knight%20trailer'
      );
    });

    it('builds a search URL with only "trailer" when both fields are empty/missing', () => {
      expect(buildTrailerUrl({})).toBe(
        'https://www.youtube.com/results?search_query=trailer'
      );
    });

    it('builds a search URL with only "trailer" when called with no arguments', () => {
      expect(buildTrailerUrl()).toBe(
        'https://www.youtube.com/results?search_query=trailer'
      );
    });

    it('URL-encodes special characters in the movie title', () => {
      expect(buildTrailerUrl({ movieTitle: 'Spider-Man: No Way Home' })).toBe(
        'https://www.youtube.com/results?search_query=Spider-Man%3A%20No%20Way%20Home%20trailer'
      );
    });

    it('falls back to search for a plain non-http string that is not 11 chars', () => {
      const result = buildTrailerUrl({ trailerUrl: 'notavalidurl', movieTitle: 'Avatar' });
      expect(result).toBe(
        'https://www.youtube.com/results?search_query=Avatar%20trailer'
      );
    });
  });

  describe('whitespace handling', () => {
    it('trims whitespace from a bare video ID', () => {
      expect(buildTrailerUrl({ trailerUrl: '  dQw4w9WgXcQ  ' })).toBe(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      );
    });

    it('trims whitespace from a youtube.com watch URL', () => {
      expect(
        buildTrailerUrl({ trailerUrl: '  https://www.youtube.com/watch?v=dQw4w9WgXcQ  ' })
      ).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    });
  });

  describe('edge cases', () => {
    it('returns search URL when trailerUrl is null-like (non-string)', () => {
      // null is falsy so extractYouTubeVideoId returns null; non-http so falls to search
      expect(buildTrailerUrl({ trailerUrl: null, movieTitle: 'Dune' })).toBe(
        'https://www.youtube.com/results?search_query=Dune%20trailer'
      );
    });

    it('handles an empty-string movieTitle gracefully (just "trailer" in query)', () => {
      expect(buildTrailerUrl({ trailerUrl: '', movieTitle: '' })).toBe(
        'https://www.youtube.com/results?search_query=trailer'
      );
    });

    it('video ID is truncated to 11 chars from a watch URL with a very long v param', () => {
      // The implementation slices the v param to 11 chars
      const result = buildTrailerUrl({
        trailerUrl: 'https://www.youtube.com/watch?v=ABCDEFGHIJKLMNOP',
      });
      expect(result).toBe('https://www.youtube.com/watch?v=ABCDEFGHIJK');
    });
  });
});