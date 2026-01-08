export interface ShoppingItem {
  id: string;           // Unique client-side identifier
  text: string;         // Item label
  isPurchased: boolean; // Purchase status
  quantity: number;     // Item quantity
}

/**
 * Compact representation stored in URL:
 * [purchasedFlag, text, quantity]
 */
type SerializedItem = [number, string, number?];

/**
 * Generates short random IDs for list items.
 */
export const generateItemId = () =>
  Math.random().toString(36).slice(2, 7);

/**
 * Encodes UTF-8 string to URL-safe Base64
 */
export const toBase64Url = (input: string) => {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * Decodes URL-safe Base64 back to UTF-8 string
 */
export const fromBase64Url = (input: string) => {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding =
    normalized.length % 4 === 0
      ? ''
      : '='.repeat(4 - (normalized.length % 4));

  const binary = atob(normalized + padding);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new TextDecoder().decode(bytes);
};

export const encodeItemsForUrl = (items: ShoppingItem[]) => {
  if (items.length === 0) return null;

  const payload = JSON.stringify(
    items.map<SerializedItem>(item => [
      item.isPurchased ? 1 : 0,
      item.text,
      item.quantity || 1,
    ])
  );

  return toBase64Url(payload);
};

export const decodeItemsFromUrl = (raw: string): ShoppingItem[] => {
  try {
    const parsed: SerializedItem[] =
      JSON.parse(fromBase64Url(raw));

    return parsed.map(([flag, text, qty]) => ({
      id: generateItemId(),
      text,
      isPurchased: flag === 1,
      quantity: qty || 1,
    }));
  } catch {
    return [];
  }
};

// IndexedDB Helper
const DB_NAME = 'shopping-list-db';
const DB_VERSION = 1;
const STORE_NAME = 'shopping_list';
const KEY = 'current_list_data';

const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

export const saveToIndexedDB = async (items: ShoppingItem[]) => {
  try {
    const db = await getDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    // We store the raw items array. 
    // We could store the serialized string to match the URL exactly, 
    // but storing the object works fine too. 
    // Ideally, for exact sync validation, we might want the string.
    // But let's store the items properly.
    const encoded = encodeItemsForUrl(items); // Use encoded string for consistency validation if needed?
    // Actually, let's just store the object structure or the serialized string?
    // The previous implementation used serialized string for the URL.
    // Let's store the serialized string to make it easy to "sync" (just compare strings).
    // And it avoids IDB struct issues.
    
    if (encoded) {
        store.put(encoded, KEY);
    } else {
        store.delete(KEY);
    }
    
    return new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('Error saving to IndexedDB:', error);
  }
};

export const loadFromIndexedDB = async (): Promise<ShoppingItem[] | null> => {
  try {
    const db = await getDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(KEY);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;
        if (result && typeof result === 'string') {
          resolve(decodeItemsFromUrl(result));
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error loading from IndexedDB:', error);
    return null;
  }
};
