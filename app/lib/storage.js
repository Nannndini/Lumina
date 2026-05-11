/**
 * storage.js — cross-platform storage utility for Lumina.
 *
 * On web, @react-native-async-storage/async-storage adds an internal prefix
 * (e.g. "Lumina_") to localStorage keys. To avoid key mismatches between
 * saves and loads, this module bypasses AsyncStorage on web and writes
 * directly to localStorage using the bare key name — no prefix added.
 *
 * On native, it delegates to AsyncStorage as normal.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const Storage = {
  async getItem(key) {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.error('Storage.getItem error (web):', e);
        return null;
      }
    }
    return AsyncStorage.getItem(key);
  },

  async setItem(key, value) {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.error('Storage.setItem error (web):', e);
      }
      return;
    }
    return AsyncStorage.setItem(key, value);
  },

  async removeItem(key) {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error('Storage.removeItem error (web):', e);
      }
      return;
    }
    return AsyncStorage.removeItem(key);
  },
};
