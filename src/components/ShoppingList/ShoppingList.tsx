import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Box, Paper, Typography, useTheme, useMediaQuery,
  Snackbar
} from '@mui/material';
import { DropResult } from '@hello-pangea/dnd';
import { generateItemId } from './utils/shoppingListStorage';
import { useShoppingListItems } from './hooks/useShoppingListItems';
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



// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
const ShoppingList: React.FC = () => {
  const theme = useTheme();
  // Adjust spacing/layout for mobile devices
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // -- Application State --
  const [isMounted, setIsMounted] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  
  // -- Data State (via Custom Hook) --
  const { items, setItems } = useShoppingListItems(language, isMounted);

  // -- UI Interaction State --
  const [newItemText, setNewItemText] = useState('');
  const newItemInputRef = useRef<HTMLInputElement>(null!);

  // Inline Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Item Context Menu State
  const [itemMenuAnchorEl, setItemMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [itemMenuId, setItemMenuId] = useState<string | null>(null);

  // Dialogs & Feedback State
  const [openClearDialog, setOpenClearDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [dialogEditingId, setDialogEditingId] = useState<string | null>(null);
  const [dialogEditingText, setDialogEditingText] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const t = translations[language];

  // -- Initialization --
  useEffect(() => {
    setIsMounted(true);
    
    // Determine initial language from URL or Browser
    const params = new URLSearchParams(window.location.search);
    const queryLang = params.get('lang');
    if (queryLang && queryLang in translations) {
      setLanguage(queryLang as Language);
    } else {
      setLanguage(getBrowserLanguage());
    }
  }, []);

  // -- Derived State --
  // We use useMemo to prevent recalculating these arrays on every render
  const activeItems = useMemo(() => items.filter(i => !i.isPurchased), [items]);
  const purchasedItems = useMemo(() => items.filter(i => i.isPurchased), [items]);

  // -- Handlers: Item Management --

  /** Adds a new item to the top of the active list */
  const handleAddItem = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = newItemText.trim();
    if (!cleanText) return;

    const newItem: ShoppingItem = {
      id: generateItemId(),
      text: cleanText,
      isPurchased: false,
      quantity: 1,
    };

    // New items go to top, followed by existing active, then purchased
    setItems(prev => [newItem, ...prev]);
    setNewItemText('');

    // Re-focus input for rapid entry
    requestAnimationFrame(() => newItemInputRef.current?.focus());
  }, [newItemText, setItems]);

  /** * Handles Drag & Drop reordering logic.
   * Note: Only active items are draggable in this UI.
   */
  const onDragEnd = useCallback((result: DropResult) => {
    const { destination, source } = result;
    if (!destination) return; // Dropped outside the list
    if (destination.index === source.index) return; // Dropped in same place

    setItems(prev => {
      // 1. Separate lists
      const active = prev.filter(item => !item.isPurchased);
      const purchased = prev.filter(item => item.isPurchased);

      // 2. Reorder the 'active' array specifically
      const reorderedActive = Array.from(active);
      const [removed] = reorderedActive.splice(source.index, 1);
      reorderedActive.splice(destination.index, 0, removed);

      // 3. Recombine (Active items always stay above Purchased items)
      return [...reorderedActive, ...purchased];
    });
  }, [setItems]);

  /** Toggles the purchased status and moves the item between lists */
  const handleTogglePurchase = useCallback((id: string) => {
    setItems(prev => {
      const targetItem = prev.find(item => item.id === id);
      if (!targetItem) return prev;

      const updatedItem = { ...targetItem, isPurchased: !targetItem.isPurchased };
      
      // Filter out the old version of the item
      const remainingItems = prev.filter(item => item.id !== id);

      // We explicitly sort: Active Items first, then Purchased Items
      // This ensures when an item is unchecked, it pops back to the active list
      const nextActive = remainingItems.filter(i => !i.isPurchased);
      const nextPurchased = remainingItems.filter(i => i.isPurchased);

      if (updatedItem.isPurchased) {
        return [...nextActive, ...nextPurchased, updatedItem]; // Add to end of purchased
      } else {
        return [updatedItem, ...nextActive, ...nextPurchased]; // Add to top of active
      }
    });
  }, [setItems]);

  /** Increments or decrements item quantity (min 1) */
  const handleUpdateQuantity = useCallback((id: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      return { ...item, quantity: Math.max(1, (item.quantity || 1) + delta) };
    }));
  }, [setItems]);

  /** Menus & Dialogs helpers */
  const handleItemMenuClose = useCallback(() => {
    setItemMenuAnchorEl(null);
    setItemMenuId(null);
  }, []);

  /** Delete item via Menu */
  const handleDeleteItem = useCallback(() => {
    if (itemMenuId) {
      setItems(prev => prev.filter(i => i.id !== itemMenuId));
    }
    handleItemMenuClose();
  }, [itemMenuId, setItems, handleItemMenuClose]);


  /** Clear all items (Active & Purchased) */
  const confirmClearAll = useCallback(() => {
    setItems([]);
    setOpenClearDialog(false);
  }, [setItems]);

  // -- Handlers: Editing --

  const handleStartEdit = useCallback((item: ShoppingItem) => {
    setEditingId(item.id);
    setEditingText(item.text);
  }, []);

  const handleEditingTextChange = useCallback((text: string) => {
    setEditingText(text);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingId) return;
    const trimmed = editingText.trim();
    
    if (trimmed) {
      setItems(prev => prev.map(item => 
        item.id === editingId ? { ...item, text: trimmed } : item
      ));
    }
    setEditingId(null);
    setEditingText('');
  }, [editingId, editingText, setItems]);

  // -- Handlers: Menus & Dialogs --

  const handleItemMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, id: string) => {
    setItemMenuAnchorEl(event.currentTarget);
    setItemMenuId(id);
  }, []);

  const handleOpenEditDialog = useCallback(() => {
    const item = items.find(i => i.id === itemMenuId);
    if (item) {
      setDialogEditingId(item.id);
      setDialogEditingText(item.text);
      setOpenEditDialog(true);
    }
    handleItemMenuClose();
  }, [items, itemMenuId, handleItemMenuClose]);


  const handleConfirmEditDialog = useCallback(() => {
    if (dialogEditingId && dialogEditingText.trim()) {
      setItems(prev => prev.map(item => 
        item.id === dialogEditingId ? { ...item, text: dialogEditingText.trim() } : item
      ));
    }
    setOpenEditDialog(false);
    setDialogEditingId(null);
  }, [dialogEditingId, dialogEditingText, setItems]);

  // -- Handlers: Sharing --

  const handleShareWhatsApp = useCallback(() => {
    const text = `${t.share.text}${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }, [t.share.text]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setOpenSnackbar(true);
  }, []);

  // -- Render --

  // Prevent hydration mismatch by waiting for mount
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
          onClearAll={() => setOpenClearDialog(true)}
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
          voiceLabels={{ 
            start: t.voice.start, 
            stop: t.voice.stop, 
            listening: t.voice.listening 
          }}
        />

        <ActiveItemsList
          items={activeItems}
          onDragEnd={onDragEnd}
          onTogglePurchase={handleTogglePurchase}
          onUpdateQuantity={handleUpdateQuantity}
          onStartEdit={handleStartEdit}
          editingId={editingId}
          editingText={editingText}
          onEditingTextChange={handleEditingTextChange}
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
          onEditingTextChange={handleEditingTextChange}
          onSaveEdit={handleSaveEdit}
          onMenuOpen={handleItemMenuOpen}
          t={t}
        />

        {/* Global Menus and Dialogs */}
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
          onClose={() => setOpenEditDialog(false)}
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
          onClose={(e, r) => r !== 'clickaway' && setOpenSnackbar(false)}
          message={t.feedback.linkCopied}
        />

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