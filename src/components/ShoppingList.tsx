import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, List, ListItem, ListItemText, ListItemIcon, IconButton,
  Checkbox, TextField, Button, Paper, Typography, Divider, Stack,
  Tooltip, useTheme, useMediaQuery,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Menu, MenuItem,
} from '@mui/material';
import {
  DragDropContext, Droppable, Draggable, DropResult,
} from '@hello-pangea/dnd';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import AddIcon from '@mui/icons-material/Add';
import ShareIcon from '@mui/icons-material/Share';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Snackbar, { SnackbarCloseReason } from '@mui/material/Snackbar';
import {
  ShoppingItem,
  generateItemId,
  encodeItemsForUrl,
  decodeItemsFromUrl,
  saveToIndexedDB,
  loadFromIndexedDB,
} from '../utils/shoppingListStorage';

const ShoppingList: React.FC = () => {
  const theme = useTheme();

  // Used to adjust spacing, shadows, and layout for mobile UX
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  /** Full ordered list (active items first, purchased last) */
  const [items, setItems] = useState<ShoppingItem[]>([]);

  /** Controlled input value for new item */
  const [newItemText, setNewItemText] = useState('');
  /** Dialog open state for clearing the list */
  const [openClearDialog, setOpenClearDialog] = useState(false);
  /** Menu anchor element and open state */
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  /** 
  /** Snackbar open state for for copy success */
  const [openSnackbar, setOpenSnackbar] = useState(false);

  /**
   * Prevents hydration mismatch:
   * component only renders once client APIs (window, URL) are available
   */
  const [isMounted, setIsMounted] = useState(false);

  /**
   * Initial load:
   * - mark component as mounted
   * - read shopping list state from URL (if present)
   * - fall back to IndexedDB if URL is empty
   * - ensure sync between URL and IndexedDB
   */
  useEffect(() => {
    setIsMounted(true);

    const init = async () => {
      const params = new URLSearchParams(window.location.search);
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
   * Persist state to URL and IndexedDB on every change.
   * Enables sharing the list via link and offline storage.
   */
  useEffect(() => {
    if (!isMounted) return;

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
    window.history.replaceState({}, '', url.toString());

    // Sync to IndexedDB
    saveToIndexedDB(items);
  }, [items, isMounted]);

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
   * Maps item ID → visible position number
   * Keeps numbering consistent across both sections
   */
  const itemPositions = useMemo(
    () =>
      items.reduce<Record<string, number>>((acc, item, index) => {
        acc[item.id] = index + 1;
        return acc;
      }, {}),
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
    };

    setItems(prev => [
      newItem,
      ...prev.filter(i => !i.isPurchased),
      ...prev.filter(i => i.isPurchased),
    ]);

    setNewItemText('');
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

  /** Cancel clearing the list */
  const cancelClearAll = () => {
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
   * Only active (unpurchased) items are draggable.
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
   * Toggles purchase state and moves item
   * between active and purchased sections
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
        {/* Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h5" fontWeight="bold">
            Shopping List
          </Typography>
          {/* Clear & Share actions */}
          <Stack direction="row" spacing={0.5}>
            <IconButton
              id="action-menu-button"
              aria-controls={openMenu ? 'action-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={openMenu ? 'true' : undefined}
              onClick={handleMenuClick}
              edge="end"
            >
              <MoreVertIcon />
            </IconButton>
            <Menu
              id="action-menu"
              aria-labelledby="action-menu-button"
              anchorEl={anchorEl}
              open={openMenu}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  handleClearAll();
                }}
                disabled={items.length === 0}
              >
                <ListItemIcon>
                  <ClearAllIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Clear List</ListItemText>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  const text = `Check out my shopping list: ${window.location.href}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                }}
              >
                <ListItemIcon>
                  <WhatsAppIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Share on WhatsApp</ListItemText>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  navigator.clipboard.writeText(window.location.href);
                  setOpenSnackbar(true);
                }}
              >
                <ListItemIcon>
                  <ShareIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Copy Link</ListItemText>
              </MenuItem>
            </Menu>
          </Stack>
        </Stack>

        {/* Add item form */}
        <Stack
          direction="row"
          spacing={1}
          component="form"
          onSubmit={handleAddItem}
          mb={3}
        >
          <TextField
            fullWidth
            value={newItemText}
            onChange={e => setNewItemText(e.target.value)}
            placeholder="Add item..."
          />
          <Button
            variant="contained"
            type="submit"
            disabled={!newItemText.trim()}
          >
            <AddIcon />
          </Button>
        </Stack>

        {/* Active items with drag-and-drop */}
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="list">
            {provided => (
              <List ref={provided.innerRef} {...provided.droppableProps}>
                {activeItems.map((item, index) => (
                  <Draggable
                    key={item.id}
                    draggableId={item.id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <ListItem
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        divider
                        secondaryAction={
                          <IconButton
                            onClick={() =>
                              setItems(prev =>
                                prev.filter(i => i.id !== item.id)
                              )
                            }
                          >
                            <DeleteIcon />
                          </IconButton>
                        }
                        sx={{
                          bgcolor: snapshot.isDragging
                            ? 'background.paper'
                            : 'inherit',
                        }}
                      >
                        {/* Drag handle */}
                        <ListItemIcon {...provided.dragHandleProps}>
                          <DragIndicatorIcon />
                        </ListItemIcon>

                        <Checkbox
                          checked={item.isPurchased}
                          onChange={() =>
                            handleTogglePurchase(item.id)
                          }
                        />

                        <ListItemText
                          primary={`${itemPositions[item.id]}. ${item.text}`}
                        />
                      </ListItem>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </List>
            )}
          </Droppable>
        </DragDropContext>

        {/* Purchased items section */}
        {purchasedItems.length > 0 && (
          <Box mt={4}>
            <Typography variant="overline">
              Purchased ({purchasedItems.length})
            </Typography>

            <List>
              {purchasedItems.map(item => (
                <ListItem
                  key={item.id}
                  divider
                  secondaryAction={
                    <IconButton
                      onClick={() =>
                        setItems(prev =>
                          prev.filter(i => i.id !== item.id)
                        )
                      }
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  {/* Spacer to align with drag handle */}
                  <Box sx={{ width: 48 }} />

                  <Checkbox
                    checked
                    onChange={() =>
                      handleTogglePurchase(item.id)
                    }
                  />

                  <ListItemText
                    sx={{ textDecoration: 'line-through' }}
                    primary={`${itemPositions[item.id]}. ${item.text}`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Confirm Clear All Dialog */}
        <Dialog open={openClearDialog} onClose={cancelClearAll}>
          <DialogTitle>Clear entire list?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              This will permanently remove all items from your shopping list. This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={cancelClearAll}>Cancel</Button>
            <Button onClick={confirmClearAll} color="error" variant="contained">Clear All</Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={openSnackbar}
          autoHideDuration={5000}
          onClose={handleCloseSnackbar}
          message="Link copied to clipboard, you can share it now!"
        />

        {/* Empty state */}
        {items.length === 0 && (
          <Box textAlign="center" py={8}>
            <Typography color="text.secondary">
              Your list is empty.
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ShoppingList;
