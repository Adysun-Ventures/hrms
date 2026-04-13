import 'server-only';
import OpenAI from 'openai';
import fs from 'node:fs';
import path from 'node:path';

const cleanEnvValue = (value?: string) =>
  String(value || '')
    .trim()
    .replace(/^['"]|['"]$/g, '');

const extractKeyFromEnvText = (text: string): string => {
  const lines = text.split(/\r?\n/);
  const keyLine =
    lines.find((row) => row.trim().startsWith('OPENAI_API_KEY=')) ||
    lines.find((row) => row.trim().startsWith('NEXT_PUBLIC_OPENAI_API_KEY='));
  if (!keyLine) return '';
  return cleanEnvValue(keyLine.split('=').slice(1).join('='));
};

const readKeyFromEnvFile = (): string => {
  try {
    const cwd = process.cwd();
    const candidates = [
      path.join(cwd, '.env.local'),
      path.join(cwd, '.env'),
      path.join(cwd, '..', '.env.local'),
      path.join(cwd, '..', '.env'),
      path.join(cwd, 'hrms', '.env.local'),
      path.join(cwd, 'hrms', '.env'),
    ];

    for (const envPath of candidates) {
      if (!fs.existsSync(envPath)) continue;
      const text = fs.readFileSync(envPath, 'utf8');
      const key = extractKeyFromEnvText(text);
      if (key) return key;
    }

    return '';
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
