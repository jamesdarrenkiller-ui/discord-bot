const { twitterApiKey, twitterApiSecret, twitterAccessToken, twitterAccessSecret, twitterBearerToken } = require('../config');

// Simple OAuth 1.0a signature for Twitter v2 tweet creation
// Uses crypto for HMAC-SHA1 signing

const crypto = require('crypto');

function percentEncode(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function buildAuthorizationHeader(method, url, params) {
  const oauth = {
    oauth_consumer_key: twitterApiKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000),
    oauth_token: twitterAccessToken,
    oauth_version: '1.0',
  };

  const allParams = { ...oauth, ...params };
  const sortedParams = Object.keys(allParams)
    .sort()
    .map(k => `${percentEncode(k)}=${percentEncode(allParams[k])}`)
    .join('&');

  const baseString = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(sortedParams)}`;
  const signingKey = `${percentEncode(twitterApiSecret)}&${percentEncode(twitterAccessSecret)}`;
  const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');

  oauth.oauth_signature = signature;
  return 'OAuth ' + Object.keys(oauth)
    .sort()
    .map(k => `${percentEncode(k)}="${percentEncode(oauth[k])}"`)
    .join(', ');
}

async function postTweet(text) {
  if (!twitterApiKey || !twitterAccessToken) throw new Error('Twitter API keys not configured.');

  const url = 'https://api.twitter.com/2/tweets';
  const body = JSON.stringify({ text });
  const auth = buildAuthorizationHeader('POST', url, {});

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: auth,
      'Content-Type': 'application/json',
    },
    body,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.errors?.[0]?.message || `Twitter error: ${res.status}`);
  return {
    id: data.data.id,
    text: data.data.text,
    url: `https://twitter.com/i/status/${data.data.id}`,
  };
}

async function searchTweets(query, count = 5) {
  if (!twitterBearerToken) throw new Error('TWITTER_BEARER_TOKEN not configured.');

  const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=${Math.min(count, 10)}&tweet.fields=created_at,public_metrics,author_id`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${twitterBearerToken}` },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.errors?.[0]?.message || `Twitter search error: ${res.status}`);
  return (data.data || []).map(t => ({
    id: t.id,
    text: t.text.slice(0, 200),
    likes: t.public_metrics?.like_count || 0,
    retweets: t.public_metrics?.retweet_count || 0,
    url: `https://twitter.com/i/status/${t.id}`,
    createdAt: t.created_at,
  }));
}

module.exports = { postTweet, searchTweets };
