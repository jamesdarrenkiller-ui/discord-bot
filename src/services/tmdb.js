const { tmdbApiKey } = require('../config');

const BASE = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p/w500';

async function searchMovies(query) {
  if (!tmdbApiKey) throw new Error('TMDB_API_KEY not configured.');
  const res = await fetch(`${BASE}/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(query)}&language=en-US&page=1`);
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  const data = await res.json();
  return (data.results || []).slice(0, 5).map(m => ({
    id: m.id,
    title: m.title,
    year: m.release_date?.slice(0, 4) || '?',
    rating: m.vote_average,
    overview: m.overview?.slice(0, 200) || 'No overview.',
    poster: m.poster_path ? IMG + m.poster_path : null,
    url: `https://www.themoviedb.org/movie/${m.id}`,
  }));
}

async function searchTv(query) {
  if (!tmdbApiKey) throw new Error('TMDB_API_KEY not configured.');
  const res = await fetch(`${BASE}/search/tv?api_key=${tmdbApiKey}&query=${encodeURIComponent(query)}&language=en-US&page=1`);
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  const data = await res.json();
  return (data.results || []).slice(0, 5).map(m => ({
    id: m.id,
    title: m.name,
    year: m.first_air_date?.slice(0, 4) || '?',
    rating: m.vote_average,
    overview: m.overview?.slice(0, 200) || 'No overview.',
    poster: m.poster_path ? IMG + m.poster_path : null,
    url: `https://www.themoviedb.org/tv/${m.id}`,
  }));
}

async function getMovieDetails(id) {
  if (!tmdbApiKey) throw new Error('TMDB_API_KEY not configured.');
  const res = await fetch(`${BASE}/movie/${id}?api_key=${tmdbApiKey}&language=en-US&append_to_response=credits,videos`);
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  const m = await res.json();
  return {
    id: m.id,
    title: m.title,
    year: m.release_date?.slice(0, 4) || '?',
    rating: m.vote_average,
    runtime: m.runtime ? `${m.runtime}m` : '?',
    overview: m.overview || 'No overview.',
    genres: (m.genres || []).map(g => g.name).join(', ') || '?',
    poster: m.poster_path ? IMG + m.poster_path : null,
    trailer: (m.videos?.results || []).find(v => v.type === 'Trailer' && v.site === 'YouTube')
      ? `https://www.youtube.com/watch?v=${m.videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube').key}`
      : null,
    url: `https://www.themoviedb.org/movie/${m.id}`,
  };
}

module.exports = { searchMovies, searchTv, getMovieDetails };
