const { groqApiKey, aiApiKey, aiBaseUrl, aiModel } = require('../config');

// Groq models — fast and free
const GROQ_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'];

async function chat(messages, options = {}) {
  // Try Groq first (faster, free)
  if (groqApiKey) {
    try {
      return await groqChat(messages, options);
    } catch (err) {
      console.error('Groq failed, falling back to OpenAI:', err.message);
    }
  }

  // Fallback to OpenAI-compatible API
  if (!aiApiKey) throw new Error('Neither GROQ_API_KEY nor AI_API_KEY is configured.');
  const response = await fetch(`${aiBaseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aiApiKey}` },
    body: JSON.stringify({
      model: options.model || aiModel,
      messages,
      temperature: options.temperature ?? 0.4,
      max_tokens: options.maxTokens || 800,
    }),
  });
  if (!response.ok) throw new Error(`AI request failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || 'No response.';
}

async function groqChat(messages, options = {}) {
  if (!groqApiKey) throw new Error('GROQ_API_KEY not configured.');

  const model = options.model || GROQ_MODELS[0];
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${groqApiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.4,
      max_tokens: options.maxTokens || 800,
    }),
  });

  if (!response.ok) throw new Error(`Groq error: ${response.status} ${await response.text()}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || 'No response.';
}

module.exports = { chat, groqChat };
