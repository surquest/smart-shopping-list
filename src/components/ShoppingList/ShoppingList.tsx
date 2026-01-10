import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box, Paper, Typography, useTheme, useMediaQuery,
  Snackbar, SnackbarCloseReason
} from '@mui/material';
import { DropResult } from '@hello-pangea/dnd';
import {
  generateItemId,
  encodeItemsForUrl,
  decodeItemsFromUrl,
  saveToIndexedDB,
  loadFromIndexedDB,
} from './utils/shoppingListStorage';
import ShoppingItem from './types/ShoppingItem.types';
import { translations, getBrowserLanguage, Language } from '../../i18n';

// Components
import { ShoppingListHeader } from './ShoppingListHeader';
import { AddItemForm } from './AddItemForm';
import { ActiveItemsList } from './ActiveItemsList';
import { PurchasedItemsList } from './PurchasedItemsList';
import { ItemActionMenu } from './ItemActionMenu';
import { EditItemDialog } from './EditItemDialog';
import { ClearListDialog } from './ClearListDialog';

const ShoppingList: React.FC = () => {
  const theme = useTheme();

  // Used to adjust spacing, shadows, and layout for mobile UX
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  /** Full ordered list (active items first, purchased last) */
  const [items, setItems] = useState<ShoppingItem[]>([]);

  /** Controlled input value for new item */
  const [newItemText, setNewItemText] = useState('');
  /** Ref to the new-item input so we can focus it programmatically */
  const newItemInputRef = useRef<HTMLInputElement>(null!);

  /** Edit mode state (inline editing) */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  /** Item Menu state */
  const [itemMenuAnchorEl, setItemMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [itemMenuId, setItemMenuId] = useState<string | null>(null);

  /** Dialog open state for clearing the list */
  const [openClearDialog, setOpenClearDialog] = useState(false);
  /** Dialog open state for editing an item from the item menu */
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [dialogEditingId, setDialogEditingId] = useState<string | null>(null);
  const [dialogEditingText, setDialogEditingText] = useState('');

  /** Snackbar open state for copy success */
  const [openSnackbar, setOpenSnackbar] = useState(false);

  /**
   * Prevents hydration mismatch:
   * component only renders once client APIs (window, URL) are available
   */
  const [isMounted, setIsMounted] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const t = translations[language];

  /**
   * Initial load
   */
  useEffect(() => {
    setIsMounted(true);

    const init = async () => {
      const params = new URLSearchParams(window.location.search);

      const queryLang = params.get('lang');
      if (queryLang && queryLang in translations) {
        setLanguage(queryLang as Language);
      } else {
        setLanguage(getBrowserLanguage());
      }

      const encodedData = params.get('data');

      if (encodedData) {
        const urlItems = decodeItemsFromUrl(encodedData);
        setItems(urlItems);
        // Sync URL data to IndexedDB priority is given to URL (sharing scenario)
        await saveToIndexedDB(urlItems);
      } else {
        // Try load from IndexedDB
        const dbItems = await loadFromIndexedDB();
        if (dbItems && dbItems.length > 0) {
          setItems(dbItems);
        }
      }
    };
    init();
  }, []);

  /**
   * Persist state to URL and IndexedDB
   */
  useEffect(() => {
    if (!isMounted) return;

    const timeoutId = setTimeout(() => {
      const url = new URL(window.location.href);

      if (items.length === 0) {
        url.searchParams.delete('data');
      } else {
        const encodedData = encodeItemsForUrl(items);
        if (encodedData) {
          url.searchParams.set('data', encodedData);
        }
      }

      // Update URL without navigation
      url.searchParams.set('lang', language);
      window.history.replaceState({}, '', url.toString());

      // Sync to IndexedDB
      saveToIndexedDB(items);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [items, language, isMounted]);

  /** Derived list of items not yet purchased */
  const activeItems = useMemo(
    () => items.filter(item => !item.isPurchased),
    [items]
  );

  /** Derived list of purchased items */
  const purchasedItems = useMemo(
    () => items.filter(item => item.isPurchased),
    [items]
  );

  /**
   * Adds new item to the top of active items
   */
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    const newItem: ShoppingItem = {
      id: generateItemId(),
      text: newItemText.trim(),
      isPurchased: false,
      quantity: 1,
    };

    setItems(prev => [
      newItem,
      ...prev.filter(i => !i.isPurchased),
      ...prev.filter(i => i.isPurchased),
    ]);

    setNewItemText('');
    // focus the input again so user can quickly add another item
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => newItemInputRef.current?.focus());
    } else {
      setTimeout(() => newItemInputRef.current?.focus(), 0);
    }
  };

  /**
   * Open confirmation dialog to clear entire shopping list
   */
  const handleClearAll = () => {
    setOpenClearDialog(true);
  };

  /** Confirm and clear all items */
  const confirmClearAll = () => {
    setItems([]);
    setOpenClearDialog(false);
  };

  /** Handle Snackbar close event */
  const handleCloseSnackbar = (
    event: React.SyntheticEvent<any> | Event,
    reason?: SnackbarCloseReason
  ) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

  /**
   * Handles drag-and-drop reordering.
   */
  const onDragEnd = (result: DropResult) => {
    const { destination, source } = result;
    if (!destination) return;

    setItems(prev => {
      const active = prev.filter(item => !item.isPurchased);
      const purchased = prev.filter(item => item.isPurchased);

      const reorderedActive = Array.from(active);
      const [removed] = reorderedActive.splice(source.index, 1);
      reorderedActive.splice(destination.index, 0, removed);

      return [...reorderedActive, ...purchased];
    });
  };

  /**
   * Toggles purchase state
   */
  const handleTogglePurchase = (id: string) => {
    setItems(prev => {
      const target = prev.find(item => item.id === id);
      if (!target) return prev;

      const remaining = prev.filter(item => item.id !== id);
      const active = remaining.filter(item => !item.isPurchased);
      const purchased = remaining.filter(item => item.isPurchased);

      const updated = {
        ...target,
        isPurchased: !target.isPurchased,
      };

      return updated.isPurchased
        ? [...active, ...purchased, updated]
        : [updated, ...active, ...purchased];
    });
  };

  /**
   * Updates an item's quantity
   */
  const handleUpdateQuantity = (id: string, delta: number) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const newQuantity = Math.max(1, (item.quantity || 1) + delta);
        return { ...item, quantity: newQuantity };
      })
    );
  };

  /**
   * Start editing an item (inline)
   */
  const handleStartEdit = (item: ShoppingItem) => {
    setEditingId(item.id);
    setEditingText(item.text);
  };

  /**
   * Save edited text (inline)
   */
  const handleSaveEdit = () => {
    if (editingId) {
      const trimmed = editingText.trim();
      if (trimmed) {
        setItems(prev =>
          prev.map(item =>
            item.id === editingId ? { ...item, text: trimmed } : item
          )
        );
      }
      setEditingId(null);
      setEditingText('');
    }
  };

  /** Item Menu Handlers */
  const handleItemMenuOpen = (event: React.MouseEvent<HTMLElement>, id: string) => {
    setItemMenuAnchorEl(event.currentTarget);
    setItemMenuId(id);
  };

  const handleItemMenuClose = () => {
    setItemMenuAnchorEl(null);
    setItemMenuId(null);
  };

  const handleDeleteItem = () => {
    if (itemMenuId) {
      setItems(prev => prev.filter(i => i.id !== itemMenuId));
    }
    handleItemMenuClose();
  };

  /** Open edit dialog for item selected in the item menu */
  const handleOpenEditDialog = () => {
    if (!itemMenuId) return;
    const item = items.find(i => i.id === itemMenuId);
    if (!item) return;
    setDialogEditingId(item.id);
    setDialogEditingText(item.text);
    setOpenEditDialog(true);
    handleItemMenuClose();
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setDialogEditingId(null);
    setDialogEditingText('');
  };

  const handleConfirmEditDialog = () => {
    if (!dialogEditingId) return;
    const trimmed = dialogEditingText.trim();
    if (trimmed) {
      setItems(prev => prev.map(item => item.id === dialogEditingId ? { ...item, text: trimmed } : item));
    }
    handleCloseEditDialog();
  };

  /** Share Actions */
  const handleShareWhatsApp = () => {
    const text = `${t.share.text}${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setOpenSnackbar(true);
  };

  // Avoid rendering until client-only APIs are safe
  if (!isMounted) return null;

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 500,
        margin: isMobile ? '0 auto' : '2rem auto',
        p: isMobile ? 1 : 2,
      }}
    >
      <Paper
        elevation={isMobile ? 0 : 3}
        sx={{
          p: isMobile ? 2 : 3,
          borderRadius: isMobile ? 0 : 2,
          minHeight: isMobile ? '100vh' : 'auto',
        }}
      >
        <ShoppingListHeader
          language={language}
          onLanguageChange={setLanguage}
          onClearAll={handleClearAll}
          hasItems={items.length > 0}
          onShareWhatsApp={handleShareWhatsApp}
          onCopyLink={handleCopyLink}
        />

        <AddItemForm
          value={newItemText}
          onChange={setNewItemText}
          onSubmit={handleAddItem}
          inputRef={newItemInputRef}
          placeholder={t.input.placeholder}
          ariaLabel={t.aria.addItem}
          language={language}
          voiceLabels={{ start: t.voice.start, stop: t.voice.stop, listening: t.voice.listening }}
        />

        <ActiveItemsList
          items={activeItems}
          onDragEnd={onDragEnd}
          onTogglePurchase={handleTogglePurchase}
          onUpdateQuantity={handleUpdateQuantity}
          onStartEdit={handleStartEdit}
          editingId={editingId}
          editingText={editingText}
          onEditingTextChange={setEditingText}
          onSaveEdit={handleSaveEdit}
          onMenuOpen={handleItemMenuOpen}
          t={t}
        />

        <PurchasedItemsList
          items={purchasedItems}
          onTogglePurchase={handleTogglePurchase}
          onStartEdit={handleStartEdit}
          editingId={editingId}
          editingText={editingText}
          onEditingTextChange={setEditingText}
          onSaveEdit={handleSaveEdit}
          onMenuOpen={handleItemMenuOpen}
          t={t}
        />

        <ItemActionMenu
          anchorEl={itemMenuAnchorEl}
          onClose={handleItemMenuClose}
          onEdit={handleOpenEditDialog}
          onDelete={handleDeleteItem}
          t={t}
        />

        <EditItemDialog
          open={openEditDialog}
          text={dialogEditingText}
          onTextChange={setDialogEditingText}
          onClose={handleCloseEditDialog}
          onConfirm={handleConfirmEditDialog}
          t={t}
        />

        <ClearListDialog
          open={openClearDialog}
          onClose={() => setOpenClearDialog(false)}
          onConfirm={confirmClearAll}
          t={t}
        />

        <Snackbar
          open={openSnackbar}
          autoHideDuration={5000}
          onClose={handleCloseSnackbar}
          message={t.feedback.linkCopied}
        />

        {/* Empty state */}
        {items.length === 0 && (
          <Box textAlign="center" py={8}>
            <Typography color="text.secondary">
              {t.list.empty}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ShoppingList;
