const YOUTUBE_WATCH_BASE = 'https://www.youtube.com/watch?v=';

const extractYouTubeVideoId = (urlValue = '') => {
  if (!urlValue || typeof urlValue !== 'string') {
    return null;
  }

  const trimmed = urlValue.trim();
  if (!trimmed) {
    return null;
  }

  // Accept direct IDs coming from API responses.
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'youtu.be') {
      return parsed.pathname.replace('/', '').slice(0, 11) || null;
    }

    if (host.endsWith('youtube.com')) {
      const watchId = parsed.searchParams.get('v');
      if (watchId) {
        return watchId.slice(0, 11);
      }

      const pathParts = parsed.pathname.split('/').filter(Boolean);
      if (pathParts[0] === 'embed' || pathParts[0] === 'shorts') {
        return (pathParts[1] || '').slice(0, 11) || null;
      }
    }
  } catch {
    return null;
  }

  return null;
};

export const buildTrailerUrl = ({ trailerUrl = '', movieTitle = '' } = {}) => {
  const videoId = extractYouTubeVideoId(trailerUrl);
  if (videoId) {
    return `${YOUTUBE_WATCH_BASE}${videoId}`;
  }

  if (trailerUrl && /^https?:\/\//i.test(trailerUrl)) {
    return trailerUrl;
  }

  const query = `${movieTitle || ''} trailer`.trim();
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
};
