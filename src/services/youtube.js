const { youtubeApiKey } = require('../config');

const BASE = 'https://www.googleapis.com/youtube/v3';

async function search(query, maxResults = 5) {
  if (!youtubeApiKey) throw new Error('YOUTUBE_API_KEY not configured.');

  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    maxResults: String(Math.min(maxResults, 10)),
    key: youtubeApiKey,
  });

  const res = await fetch(`${BASE}/search?${params}`);
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
  const data = await res.json();

  return (data.items || []).map(item => ({
    id: item.id.videoId,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    description: item.snippet.description?.slice(0, 150) || '',
    thumbnail: item.snippet.thumbnails?.default?.url || null,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    publishedAt: item.snippet.publishedAt,
  }));
}

async function getVideoDetails(videoId) {
  if (!youtubeApiKey) throw new Error('YOUTUBE_API_KEY not configured.');

  const params = new URLSearchParams({
    part: 'snippet,statistics,contentDetails',
    id: videoId,
    key: youtubeApiKey,
  });

  const res = await fetch(`${BASE}/videos?${params}`);
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
  const data = await res.json();
  const item = data.items?.[0];
  if (!item) return null;

  return {
    id: item.id,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    description: item.snippet.description?.slice(0, 300) || '',
    thumbnail: item.snippet.thumbnails?.high?.url || null,
    views: Number(item.statistics?.viewCount || 0),
    likes: Number(item.statistics?.likeCount || 0),
    duration: item.contentDetails?.duration || '?',
    url: `https://www.youtube.com/watch?v=${item.id}`,
  };
}

module.exports = { search, getVideoDetails };
