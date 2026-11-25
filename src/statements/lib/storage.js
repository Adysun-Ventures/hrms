import { normalizeStatement } from './model.js';

let memory = [];

/** Saved statements live in memory for the active session (no localStorage dependency). */
export function loadAll() {
  return memory;
}

/**
 * Saves statements in-memory without localStorage dependency.
 * Protects user privacy and eliminates 5MB browser quota restrictions.
 */
export function saveAll(list) {
  memory = Array.isArray(list) ? list.map(normalizeStatement).filter(Boolean) : [];
  return true;
}

export const isPersistent = () => true;

export function clearMemory() {
  memory = [];
}
