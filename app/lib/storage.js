/**
 * storage.js — cross-platform storage utility for Lumina.
 *
 * On web, AsyncStorage uses an internal prefix that makes keys inconsistent
 * between saves and loads. This module bypasses AsyncStorage on web and uses
 * localStorage directly with a 'lumina_' prefix, ensuring reliable reads.
 *
 * On native, it delegates to AsyncStorage as normal.
 *
 * All keys are automatically prefixed with 'lumina_' so they never collide
 * with other apps sharing the same localStorage origin.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'lumina_';

function prefixed(key) {
  return PREFIX + key;
}

export const Storage = {
  async getItem(key) {
    const k = prefixed(key);
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(k);
      } catch (e) {
        console.error('Storage.getItem error (web):', e);
        return null;
      }
    }
    return AsyncStorage.getItem(k);
  },

  async setItem(key, value) {
    const k = prefixed(key);
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(k, value);
      } catch (e) {
        console.error('Storage.setItem error (web):', e);
      }
      return;
    }
    return AsyncStorage.setItem(k, value);
  },

  async removeItem(key) {
    const k = prefixed(key);
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(k);
      } catch (e) {
        console.error('Storage.removeItem error (web):', e);
      }
      return;
    }
    return AsyncStorage.removeItem(k);
  },
};
