'use client';

import React from 'react';
import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Checkbox,
  Box,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { ShoppingItem } from '@/types';

interface ShoppingListItemProps {
  item: ShoppingItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ShoppingListItem({ item, onToggle, onDelete }: ShoppingListItemProps) {
  return (
    <ListItem
      disablePadding
      secondaryAction={
        <IconButton
          edge="end"
          aria-label="delete"
          onClick={() => onDelete(item.id)}
        >
          <DeleteIcon />
        </IconButton>
      }
      sx={{ mb: 1 }}
    >
      <ListItemButton onClick={() => onToggle(item.id)} dense>
        <ListItemIcon>
          <Checkbox
            edge="start"
            checked={item.completed}
            tabIndex={-1}
            disableRipple
          />
        </ListItemIcon>
        <ListItemText
          primary={item.name}
          sx={{
            textDecoration: item.completed ? 'line-through' : 'none',
            color: item.completed ? 'text.disabled' : 'text.primary',
          }}
        />
      </ListItemButton>
    </ListItem>
  );
}
