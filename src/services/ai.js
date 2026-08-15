const { aiApiKey, aiBaseUrl, aiModel } = require('../config');

async function chat(messages, options = {}) {
  if (!aiApiKey) throw new Error('AI_API_KEY is not configured.');
  const response = await fetch(`${aiBaseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aiApiKey}` },
    body: JSON.stringify({ model: options.model || aiModel, messages, temperature: options.temperature ?? 0.4, max_tokens: options.maxTokens || 800 }),
  });
  if (!response.ok) throw new Error(`AI request failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || 'No response.';
}

module.exports = { chat };
