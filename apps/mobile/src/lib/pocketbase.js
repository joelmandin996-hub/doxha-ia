import PocketBase, { AsyncAuthStore } from 'pocketbase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// The web app talks to PocketBase through a same-origin proxy path
// ('/hcgi/platform'), which only works when served from that hosting setup.
// The mobile app has no shared origin, so it needs the real PocketBase URL.
export const POCKETBASE_URL =
  process.env.EXPO_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';

const authStore = new AsyncAuthStore({
  save: async (serialized) => AsyncStorage.setItem('pb_auth', serialized),
  initial: AsyncStorage.getItem('pb_auth'),
  clear: async () => AsyncStorage.removeItem('pb_auth'),
});

export const pb = new PocketBase(POCKETBASE_URL, authStore);

export default pb;
