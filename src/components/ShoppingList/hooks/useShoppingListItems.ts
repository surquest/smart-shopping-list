import { useState, useEffect } from 'react';
import ShoppingItem from '../types/ShoppingItem.types';
import {
  encodeItemsForUrl,
  decodeItemsFromUrl,
  saveToIndexedDB,
  loadFromIndexedDB,
} from '../utils/shoppingListStorage';
import { Language } from '../../../i18n';

/**
 * Manages the shopping list state, including initialization from URL/DB
 * and syncing changes back to storage.
 */
export const useShoppingListItems = (language: Language, isMounted: boolean) => {
  const [items, setItems] = useState<ShoppingItem[]>([]);

  // -- Initialization --
  useEffect(() => {
    if (!isMounted) return;

    const initData = async () => {
      const params = new URLSearchParams(window.location.search);
      const encodedData = params.get('data');

      // Priority 1: URL Data (User opened a shared link)
      if (encodedData) {
        const urlItems = decodeItemsFromUrl(encodedData);
        setItems(urlItems);
        // Immediately sync URL data to local DB to cache it
        await saveToIndexedDB(urlItems);
      } else {
        // Priority 2: Local Storage (User returning to the app)
        const dbItems = await loadFromIndexedDB();
        if (dbItems && dbItems.length > 0) {
          setItems(dbItems);
        }
      }
    };
    initData();
  }, [isMounted]);

  // -- Persistence (Debounced) --
  useEffect(() => {
    if (!isMounted) return;

    // We debounce the save operation to avoid lag during rapid typing/interaction
    const timeoutId = setTimeout(() => {
      const url = new URL(window.location.href);

      // 1. Update URL Params
      if (items.length === 0) {
        url.searchParams.delete('data');
      } else {
        const encodedData = encodeItemsForUrl(items);
        if (encodedData) url.searchParams.set('data', encodedData);
      }
      
      // Maintain language preference in URL
      url.searchParams.set('lang', language);
      
      // Update browser history without a page reload
      window.history.replaceState({}, '', url.toString());

      // 2. Sync to IndexedDB
      saveToIndexedDB(items);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [items, language, isMounted]);

  return { items, setItems };
};
