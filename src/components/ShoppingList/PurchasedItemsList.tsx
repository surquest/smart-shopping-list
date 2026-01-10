import React, { useMemo } from 'react';
import { Box, List, Typography } from '@mui/material';
import ShoppingItem from './types/ShoppingItem.types';
import ShoppingListItem from './ShoppingListItem';
import { Translation } from '../../i18n';

/**
 * Props for the PurchasedItemsList component.
 * Uses specific types for translation and callbacks to ensure type safety.
 */
interface PurchasedItemsListProps {
  items: ShoppingItem[];
  onTogglePurchase: (id: string) => void;
  onStartEdit: (item: ShoppingItem) => void;
  editingId: string | null;
  editingText: string;
  onEditingTextChange: (text: string) => void;
  onSaveEdit: () => void;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, id: string) => void;
  /** Translation object - ideally should be typed according to your i18n schema */
  t: Translation; 
}

/**
 * Renders a list of items that have already been marked as purchased.
 * Optimized with React.memo to prevent unnecessary parent re-renders.
 */
export const PurchasedItemsList: React.FC<PurchasedItemsListProps> = React.memo(({
  items,
  onTogglePurchase,
  onStartEdit,
  editingId,
  editingText,
  onEditingTextChange,
  onSaveEdit,
  onMenuOpen,
  t,
}) => {
  
  // Early return if no items exist to keep the DOM clean
  if (items.length === 0) return null;

  // Memoize the list header to avoid recalculation on every render
  const listHeader = useMemo(() => (
    <Typography 
      variant="overline" 
      sx={{ fontWeight: 'bold', color: 'text.secondary' }}
    >
      {t.list.purchased} ({items.length})
    </Typography>
  ), [items.length, t.list.purchased]);

  return (
    <Box mt={4} component="section" aria-labelledby="purchased-items-title">
      {listHeader}

      <List>
        {items.map((item) => (
          <ShoppingListItem
            key={item.id}
            item={item}
            isPurchased={true}
            // Passing individual handlers to avoid creating new anonymous functions 
            // inside the map if they were defined inside this component.
            onTogglePurchase={() => onTogglePurchase(item.id)}
            onStartEdit={() => onStartEdit(item)}
            isEditing={editingId === item.id}
            editingText={editingText}
            onEditingTextChange={onEditingTextChange}
            onSaveEdit={onSaveEdit}
            onMenuOpen={(e) => onMenuOpen(e, item.id)}
            t={t}
          />
        ))}
      </List>
    </Box>
  );
});

// Set display name for easier debugging in React DevTools
PurchasedItemsList.displayName = 'PurchasedItemsList';