import 'server-only';
import OpenAI from 'openai';
import fs from 'node:fs';
import path from 'node:path';

const cleanEnvValue = (value?: string) =>
  String(value || '')
    .trim()
    .replace(/^['"]|['"]$/g, '');

const readKeyFromEnvFile = (): string => {
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return '';
    const text = fs.readFileSync(envPath, 'utf8');
    const line = text
      .split(/\r?\n/)
      .find((row) => row.trim().startsWith('OPENAI_API_KEY='));
    if (!line) return '';
    return cleanEnvValue(line.split('=').slice(1).join('='));
  } catch {
    return '';
  }
};

export const getOpenAIKey = (): string => {
  const rawApiKey =
    process.env.OPENAI_API_KEY ||
    process.env.NEXT_PUBLIC_OPENAI_API_KEY ||
    process.env.OPENAI_APIKEY ||
    readKeyFromEnvFile() ||
    '';
  return cleanEnvValue(rawApiKey);
};

export const getOpenAIClient = (): OpenAI => {
  const apiKey = getOpenAIKey();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured on server');
  }
  return new OpenAI({ apiKey });
};
