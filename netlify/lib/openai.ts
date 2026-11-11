import OpenAI from 'openai';

// OPENAI_API_KEY comes from .env.local in dev (loaded by vite.config.ts) and from Netlify env in production.
export const getOpenAIKey = (): string => (process.env.OPENAI_API_KEY || '').trim().replace(/^['"]|['"]$/g, '');

export const getOpenAIClient = (): OpenAI => {
  const apiKey = getOpenAIKey();
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured on server');
  return new OpenAI({ apiKey });
};
