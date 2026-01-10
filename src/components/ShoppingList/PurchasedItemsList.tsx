import React from 'react';
import { Box, List, Typography } from '@mui/material';
import ShoppingItem from './types/ShoppingItem.types';
import ShoppingListItem from './ShoppingListItem';

interface PurchasedItemsListProps {
  items: ShoppingItem[];
  onTogglePurchase: (id: string) => void;
  onStartEdit: (item: ShoppingItem) => void;
  editingId: string | null;
  editingText: string;
  onEditingTextChange: (text: string) => void;
  onSaveEdit: () => void;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, id: string) => void;
  t: any;
}

export const PurchasedItemsList: React.FC<PurchasedItemsListProps> = ({
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
  if (items.length === 0) return null;

  return (
    <Box mt={4}>
      <Typography variant="overline">
        {t.list.purchased} ({items.length})
      </Typography>

      <List>
        {items.map((item) => (
          <ShoppingListItem
            key={item.id}
            item={item}
            isPurchased={true}
            onTogglePurchase={() => onTogglePurchase(item.id)}
            onStartEdit={() => onStartEdit(item)}
            isEditing={editingId === item.id}
            editingText={editingText}
            onEditingTextChange={onEditingTextChange}
            onSaveEdit={onSaveEdit}
            onMenuOpen={(e) => onMenuOpen(e, item.id)}
            t={t}
            // No drag props, no update quantity
          />
        ))}
      </List>
    </Box>
  );
};
