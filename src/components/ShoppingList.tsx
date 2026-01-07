'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Fab,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AddIcon from '@mui/icons-material/Add';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { ShoppingItem } from '@/types';
import ShoppingListItem from './ShoppingListItem';
import AddItemDialog from './AddItemDialog';

const STORAGE_KEY = 'smart-shopping-list';

export default function ShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Load items from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load items:', error);
      }
    }
  }, []);

  // Save items to localStorage whenever they change
  useEffect(() => {
    if (items.length > 0 || localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items]);

  const handleAddItem = (name: string) => {
    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      name,
      completed: false,
      createdAt: Date.now(),
    };
    setItems([...items, newItem]);
    setDialogOpen(false);
  };

  const handleToggleItem = (id: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleClearCompleted = () => {
    setItems(items.filter(item => !item.completed));
  };

  const completedCount = items.filter(item => item.completed).length;
  const totalCount = items.length;

  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          <ShoppingCartIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Smart Shopping List
          </Typography>
          {completedCount > 0 && (
            <IconButton
              color="inherit"
              onClick={handleClearCompleted}
              title="Clear completed items"
            >
              <DeleteSweepIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="sm" sx={{ mt: 10, mb: 10 }}>
        <Paper elevation={3} sx={{ p: 3, minHeight: '60vh' }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {completedCount} of {totalCount} completed
            </Typography>
          </Box>

          {items.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '40vh',
                color: 'text.secondary',
              }}
            >
              <ShoppingCartIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
              <Typography variant="h6" gutterBottom>
                Your shopping list is empty
              </Typography>
              <Typography variant="body2">
                Tap the + button to add items
              </Typography>
            </Box>
          ) : (
            <Box>
              {items.map(item => (
                <ShoppingListItem
                  key={item.id}
                  item={item}
                  onToggle={handleToggleItem}
                  onDelete={handleDeleteItem}
                />
              ))}
            </Box>
          )}
        </Paper>
      </Container>

      <Fab
        color="primary"
        aria-label="add"
        onClick={() => setDialogOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
      >
        <AddIcon />
      </Fab>

      <AddItemDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAdd={handleAddItem}
      />
    </>
  );
}
