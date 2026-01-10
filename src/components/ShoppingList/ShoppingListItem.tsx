import React, { memo } from 'react';
import {
  ListItem, ListItemIcon, IconButton, Checkbox, ListItemText,
  Stack, Chip, TextField, Typography, useTheme, Box
} from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ShoppingItem from './types/ShoppingItem.types';

/**
 * Props for the ShoppingListItem component.
 * Includes DND (Drag and Drop) integration and local state management for editing.
 */
interface ShoppingListItemProps {
  item: ShoppingItem;
  isPurchased: boolean;
  onTogglePurchase: () => void;
  /** Optional handler to change quantity. If missing, quantity is read-only. */
  onUpdateQuantity?: (delta: number) => void;
  onStartEdit: () => void;
  isEditing: boolean;
  editingText: string;
  onEditingTextChange: (text: string) => void;
  onSaveEdit: () => void;
  /** Triggered when the vertical menu icon is clicked */
  onMenuOpen: (e: React.MouseEvent<HTMLElement>) => void;
  /** Translation object for localized strings and ARIA labels */
  t: any; 
  /** Props provided by react-beautiful-dnd or similar library */
  dragHandleProps?: any;
  innerRef?: React.Ref<HTMLLIElement>;
  draggableProps?: any;
  isDragging?: boolean;
}

/**
 * A single row in the shopping list. Supports:
 * 1. Drag-and-drop sorting
 * 2. Inline editing on double-click
 * 3. Quantity management via Chip icons
 * 4. Strikethrough style for purchased items
 */
const ShoppingListItem: React.FC<ShoppingListItemProps> = memo(({
  item,
  isPurchased,
  onTogglePurchase,
  onUpdateQuantity,
  onStartEdit,
  isEditing,
  editingText,
  onEditingTextChange,
  onSaveEdit,
  onMenuOpen,
  t,
  dragHandleProps,
  innerRef,
  draggableProps = {},
  isDragging = false,
}) => {
  const theme = useTheme();

  // Helper to safely format ARIA labels
  const formatAria = (template: string, replacements: Record<string, string | number>) => {
    let result = template;
    Object.entries(replacements).forEach(([key, val]) => {
      result = result.replace(`{${key}}`, String(val));
    });
    return result;
  };

  return (
    <ListItem
      ref={innerRef}
      {...draggableProps}
      {...dragHandleProps}
      divider
      sx={{
        bgcolor: isDragging ? 'action.hover' : 'background.paper',
        flexWrap: 'nowrap',
        alignItems: 'center',
        pr: 1,
        pl: 0,
        transition: theme.transitions.create(['background-color', 'box-shadow']),
        // Visual feedback for draggability
        cursor: dragHandleProps ? 'grab' : 'default',
        '&:active': { cursor: dragHandleProps ? 'grabbing' : 'default' },
        ...draggableProps.style
      }}
    >
      {/* 1. Drag Handle / Spacer: Ensures items align vertically regardless of draggable state */}
      {dragHandleProps ? (
        <ListItemIcon sx={{ minWidth: 40, justifyContent: 'center' }}>
          <DragIndicatorIcon color="action" fontSize="small" />
        </ListItemIcon>
      ) : (
        <Box sx={{ minWidth: 40 }} />
      )}

      {/* 2. Purchase Toggle */}
      <Checkbox
        checked={isPurchased}
        onChange={onTogglePurchase}
        inputProps={{
          'aria-label': formatAria(
            isPurchased ? t.aria.unmarkPurchased : t.aria.markPurchased, 
            { item: item.text }
          )
        }}
      />

      {/* 3. Item Text / Edit Field */}
      <ListItemText
        sx={{
          flexGrow: 1,
          mr: 1,
          overflow: 'hidden',
          textDecoration: isPurchased && !isEditing ? 'line-through' : 'none',
          color: isPurchased ? 'text.disabled' : 'text.primary',
        }}
        primary={
          isEditing ? (
            <TextField
              value={editingText}
              onChange={(e) => onEditingTextChange(e.target.value)}
              onBlur={onSaveEdit}
              onKeyDown={(e) => e.key === 'Enter' && onSaveEdit()}
              autoFocus
              fullWidth
              variant="standard"
              size="small"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <Typography
              variant="body1"
              onDoubleClick={onStartEdit}
              sx={{
                cursor: 'text',
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
              }}
            >
              {item.text}
            </Typography>
          )
        }
      />

      {/* 4. Controls: Quantity and Menu */}
      <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
        <Box sx={{ bgcolor: 'action.selected', borderRadius: 1 }}>
          {onUpdateQuantity ? (
             <Chip
               label={item.quantity || 1}
               onClick={() => onUpdateQuantity(1)}
               onDelete={() => onUpdateQuantity(-1)}
               icon={<AddIcon />}
               deleteIcon={<RemoveIcon />}
               aria-label={formatAria(t.aria.quantity, { 
                 item: item.text, 
                 count: item.quantity || 1 
               })}
               sx={{
                 '& .MuiChip-icon, & .MuiChip-deleteIcon': {
                   color: 'text.secondary',
                   '&:hover': { color: 'primary.main' },
                 },
               }}
             />
          ) : (
            <Chip 
              label={item.quantity || 1} 
              size="small" 
              variant="outlined" 
            />
          )}
        </Box>

        <IconButton
          edge="end"
          onClick={onMenuOpen}
          aria-label={formatAria(t.aria.openItemMenu, { item: item.text })}
        >
          <MoreVertIcon />
        </IconButton>
      </Stack>
    </ListItem>
  );
});

ShoppingListItem.displayName = 'ShoppingListItem';

export default ShoppingListItem;