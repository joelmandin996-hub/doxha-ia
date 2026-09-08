import pb from './pocketbase';
import { base64EncodeUtf8 } from './base64';

// The Node API (apps/api) is a separate service from PocketBase — it holds
// the Twilio credentials for SMS. It expects the same "base64(JSON{token,record})"
// bearer format the web app sends (see apps/api/src/middleware/pocketbase-auth.js).
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

function authHeader() {
  if (!pb.authStore.isValid) return {};
  const payload = JSON.stringify({ token: pb.authStore.token, record: pb.authStore.record });
  return { Authorization: `Bearer ${base64EncodeUtf8(payload)}` };
}

export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const serverMessage = typeof data?.error === 'string' ? data.error : data?.error?.message;
    throw new Error(serverMessage || data?.message || `Erreur serveur (${response.status})`);
  }

  return data;
}
