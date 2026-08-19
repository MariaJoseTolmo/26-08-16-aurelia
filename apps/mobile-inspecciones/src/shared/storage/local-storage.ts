import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocalStorageDriver {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  keys(prefix?: string): Promise<string[]>;
  clear(prefix?: string): Promise<void>;
}

class MemoryLocalStorageDriver implements LocalStorageDriver {
  private readonly values = new Map<string, string>();

  async get<T>(key: string): Promise<T | null> {
    const value = this.values.get(key);
    return value ? JSON.parse(value) as T : null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.values.set(key, JSON.stringify(value));
  }

  async remove(key: string): Promise<void> {
    this.values.delete(key);
  }

  async keys(prefix = ''): Promise<string[]> {
    return [...this.values.keys()].filter((key) => key.startsWith(prefix));
  }

  async clear(prefix = ''): Promise<void> {
    const keys = await this.keys(prefix);
    keys.forEach((key) => this.values.delete(key));
  }
}

class BrowserLocalStorageDriver implements LocalStorageDriver {
  constructor(private readonly namespace: string) {}

  async get<T>(key: string): Promise<T | null> {
    const value = globalThis.localStorage?.getItem(this.toKey(key));
    return value ? JSON.parse(value) as T : null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    globalThis.localStorage?.setItem(this.toKey(key), JSON.stringify(value));
  }

  async remove(key: string): Promise<void> {
    globalThis.localStorage?.removeItem(this.toKey(key));
  }

  async keys(prefix = ''): Promise<string[]> {
    const storage = globalThis.localStorage;
    if (!storage) return [];
    const keys: string[] = [];
    const fullPrefix = this.toKey(prefix);
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key?.startsWith(fullPrefix)) keys.push(key.replace(`${this.namespace}:`, ''));
    }
    return keys;
  }

  async clear(prefix = ''): Promise<void> {
    const keys = await this.keys(prefix);
    keys.forEach((key) => globalThis.localStorage?.removeItem(this.toKey(key)));
  }

  private toKey(key: string): string {
    return `${this.namespace}:${key}`;
  }
}

class AsyncStorageDriver implements LocalStorageDriver {
  constructor(private readonly namespace: string) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await AsyncStorage.getItem(this.toKey(key));
    return value ? JSON.parse(value) as T : null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(this.toKey(key), JSON.stringify(value));
  }

  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(this.toKey(key));
  }

  async keys(prefix = ''): Promise<string[]> {
    const keys = await AsyncStorage.getAllKeys();
    const fullPrefix = this.toKey(prefix);
    return keys
      .filter((key) => key.startsWith(fullPrefix))
      .map((key) => key.replace(`${this.namespace}:`, ''));
  }

  async clear(prefix = ''): Promise<void> {
    const keys = await this.keys(prefix);
    if (keys.length === 0) return;
    await Promise.all(keys.map((key) => AsyncStorage.removeItem(this.toKey(key))));
  }

  private toKey(key: string): string {
    return `${this.namespace}:${key}`;
  }
}

function canUseBrowserStorage(): boolean {
  if (Platform.OS !== 'web') return false;
  try {
    return typeof globalThis.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

export const localStorageDriver: LocalStorageDriver = canUseBrowserStorage()
  ? new BrowserLocalStorageDriver('aurelia-mobile-inspecciones')
  : Platform.OS === 'web'
    ? new MemoryLocalStorageDriver()
    : new AsyncStorageDriver('aurelia-mobile-inspecciones');
