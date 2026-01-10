import React from 'react';
import {
  ListItem, ListItemIcon, IconButton, Checkbox, ListItemText,
  Stack, Chip, TextField, Typography, useTheme
} from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ShoppingItem from './types/ShoppingItem.types';

interface ShoppingListItemProps {
  item: ShoppingItem;
  isPurchased: boolean;
  onTogglePurchase: () => void;
  onUpdateQuantity?: (delta: number) => void;
  onStartEdit: () => void;
  isEditing: boolean;
  editingText: string;
  onEditingTextChange: (text: string) => void;
  onSaveEdit: () => void;
  onMenuOpen: (e: React.MouseEvent<HTMLElement>) => void;
  t: any; // Translation object
  dragHandleProps?: any;
  innerRef?: React.Ref<HTMLLIElement>;
  draggableProps?: any;
  isDragging?: boolean;
}

const ShoppingListItem: React.FC<ShoppingListItemProps> = ({
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

  return (
    <ListItem
      ref={innerRef}
      {...draggableProps}
      {...dragHandleProps}
      divider
      sx={{
        bgcolor: isDragging
          ? 'background.paper'
          : 'inherit',
        flexWrap: 'nowrap',
        alignItems: 'center',
        pr: 1,
        pl: 0,
        // Only show grab cursor if we have drag handle (active items)
        cursor: dragHandleProps ? 'grab' : 'default',
        '&:active': { cursor: dragHandleProps ? 'grabbing' : 'default' },
        ...draggableProps.style
      }}
    >
      {/* Drag handle or spacer */}
      {dragHandleProps ? (
        <ListItemIcon sx={{ minWidth: 32 }}>
          <IconButton
            aria-hidden="true"
            tabIndex={-1}
            disableRipple
          >
            <DragIndicatorIcon aria-hidden="true" />
          </IconButton>
        </ListItemIcon>
      ) : (
        <React.Fragment>
             {/* Spacer to align with drag handle */}
             {/* Note: The original code used <Box sx={{ minWidth: 32 }} /> for purchased items */}
        </React.Fragment>
      )}
      
      {/* For purchased items, we need a spacer if we want alignment, but let's handle that by passing a spacer flag or just checking dragHandleProps is null */}
      {!dragHandleProps && (
         <div style={{ minWidth: 32 }} />
      )}

      <Checkbox
        checked={isPurchased}
        onChange={onTogglePurchase}
        slotProps={{
          input: {
            'aria-label': (isPurchased ? t.aria.unmarkPurchased : t.aria.markPurchased).replace('{item}', item.text)
          },
        }}
      />

      <ListItemText
        sx={{
          flexGrow: 1,
          mr: 1,
          overflow: 'hidden',
          ...(isPurchased && !isEditing
            ? { textDecoration: 'line-through' }
            : {}),
        }}
        primary={
          isEditing ? (
            <TextField
              value={editingText}
              onChange={(e) => onEditingTextChange(e.target.value)}
              onBlur={onSaveEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveEdit();
              }}
              autoFocus
              fullWidth
              variant="standard"
              size="small"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <Typography
              variant="body1"
              component="div"
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

      <Stack
        direction="row"
        alignItems="center"
        flexShrink={0}
      >
        <Stack
          direction="row"
          alignItems="center"
          flexShrink={0}
          sx={{
            backgroundColor: theme.palette.background.paper,
            borderRadius: 1
          }}
        >
          {onUpdateQuantity ? (
             <Chip
             label={item.quantity || 1}
             onClick={() => onUpdateQuantity(1)}
             onDelete={() => onUpdateQuantity(-1)}
             icon={<AddIcon aria-hidden="true" />}
             deleteIcon={<RemoveIcon aria-hidden="true" />}
             aria-label={
               t.aria.quantity.replace('{item}', item.text).replace('{count}', String(item.quantity || 1))
             }
             sx={{
               '& .MuiChip-icon': {
                 color: theme.palette.text.secondary,
               },
               '& .MuiChip-deleteIcon': {
                 color: theme.palette.text.secondary,
                 opacity: 1,
                 '&:hover': {
                   color: theme.palette.text.secondary,
                   opacity: 1,
                 },
               },
             }}
           />
          ) : (
            <Chip
              label={item.quantity || 1}
              aria-label={
                t.aria.quantity.replace('{item}', item.text).replace('{count}', String(item.quantity || 1))
              }
            />
          )}
         
        </Stack>
        <IconButton
          onClick={onMenuOpen}
          aria-label={
            t.aria.openItemMenu.replace('{item}', item.text)
          }
        >
          <MoreVertIcon />
        </IconButton>
      </Stack>
    </ListItem>
  );
};

export default ShoppingListItem;