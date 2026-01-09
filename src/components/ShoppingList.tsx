import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box, List, ListItem, ListItemText, ListItemIcon, IconButton,
  Checkbox, TextField, Button, Paper, Typography, Divider, Stack,
  Tooltip, useTheme, useMediaQuery,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Menu, MenuItem,
  Chip
} from '@mui/material';
import {
  DragDropContext, Droppable, Draggable, DropResult,
} from '@hello-pangea/dnd';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShareIcon from '@mui/icons-material/Share';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LanguageIcon from '@mui/icons-material/Language';
import Snackbar, { SnackbarCloseReason } from '@mui/material/Snackbar';
import {
  ShoppingItem,
  generateItemId,
  encodeItemsForUrl,
  decodeItemsFromUrl,
  saveToIndexedDB,
  loadFromIndexedDB,
} from '../utils/shoppingListStorage';
import { translations, getBrowserLanguage, Language } from '../i18n';

const ShoppingList: React.FC = () => {
  const theme = useTheme();

  // Used to adjust spacing, shadows, and layout for mobile UX
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  /** Full ordered list (active items first, purchased last) */
  const [items, setItems] = useState<ShoppingItem[]>([]);

  /** Controlled input value for new item */
  const [newItemText, setNewItemText] = useState('');
  /** Ref to the new-item input so we can focus it programmatically */
  const newItemInputRef = useRef<HTMLInputElement | null>(null);

  /** Edit mode state */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  /** Item Menu state */
  const [itemMenuAnchorEl, setItemMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [itemMenuId, setItemMenuId] = useState<string | null>(null);

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

  /** Language Menu state */
  const [langAnchorEl, setLangAnchorEl] = useState<null | HTMLElement>(null);
  const openLangMenu = Boolean(langAnchorEl);
  const handleLangMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setLangAnchorEl(event.currentTarget);
  };
  const handleLangMenuClose = () => {
    setLangAnchorEl(null);
  };
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    handleLangMenuClose();
  };

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
   * Persist state to URL and IndexedDB on every change.
   * Enables sharing the list via link and offline storage.
   * Debounced to prevent excessive writes and checking history API limits.
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

  /**
   * Updates an item's quantity ensuring it stays at >= 1
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
   * Start editing an item
   */
  const handleStartEdit = (item: ShoppingItem) => {
    setEditingId(item.id);
    setEditingText(item.text);
  };

  /**
   * Save edited text
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
            {t.header.title}
          </Typography>
          {/* Clear & Share actions */}
          <Stack direction="row" spacing={0.5}>
            <IconButton
              onClick={handleLangMenuClick}
              aria-controls={openLangMenu ? 'language-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={openLangMenu ? 'true' : undefined}
              aria-label={t.aria.changeLanguage}
            >
              <LanguageIcon />
            </IconButton>
            <Menu
              id="language-menu"
              anchorEl={langAnchorEl}
              open={openLangMenu}
              onClose={handleLangMenuClose}
            >
              {(Object.keys(translations) as Language[]).map((lang) => (
                <MenuItem
                  key={lang}
                  selected={lang === language}
                  onClick={() => handleLanguageChange(lang)}
                >
                  {lang.toUpperCase()}
                </MenuItem>
              ))}
            </Menu>

            <IconButton
              id="action-menu-button"
              aria-controls={openMenu ? 'action-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={openMenu ? 'true' : undefined}
              onClick={handleMenuClick}
              edge="end"
              aria-label={t.aria.openActions}
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
                <ListItemText>{t.menu.clearList}</ListItemText>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  const text = `${t.share.text}${window.location.href}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                }}
              >
                <ListItemIcon>
                  <WhatsAppIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{t.menu.shareWhatsApp}</ListItemText>
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
                <ListItemText>{t.menu.copyLink}</ListItemText>
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
          alignItems="stretch"
        >
          <TextField
            fullWidth
            size="small"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder={t.input.placeholder}
            inputRef={newItemInputRef}
            sx={{
              '& .MuiInputBase-root': {
                height: 48,
              },
            }}
          />

          <Button
            variant="contained"
            type="submit"
            disabled={!newItemText.trim()}
            sx={{
              minWidth: 48,
              height: 48,
            }}
            aria-label={t.aria.addItem}
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
                        {...provided.dragHandleProps}
                        divider
                        sx={{
                          bgcolor: snapshot.isDragging
                            ? 'background.paper'
                            : 'inherit',
                          flexWrap: 'nowrap',
                          alignItems: 'center',
                          pr: 1,
                          pl: 0,
                          cursor: 'grab',
                          '&:active': { cursor: 'grabbing' },
                        }}
                      >
                        {/* Drag handle (visual only — whole ListItem is the handle) */}
                        <ListItemIcon
                          sx={{
                            minWidth: 32,
                          }}
                        >
                          <IconButton
                            aria-hidden="true"
                            tabIndex={-1}
                            disableRipple
                          >
                            <DragIndicatorIcon aria-hidden="true" />
                          </IconButton>
                        </ListItemIcon>

                        <Checkbox
                          checked={item.isPurchased}
                          onChange={() => handleTogglePurchase(item.id)}
                          slotProps={{
                            input: {
                              'aria-label': t.aria.markPurchased.replace('{item}', item.text)
                            },
                          }}
                        />

                        <ListItemText
                          sx={{
                            flexGrow: 1,
                            mr: 1,
                            overflow: 'hidden',
                          }}
                          primary={
                            editingId === item.id ? (
                              <TextField
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                onBlur={handleSaveEdit}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEdit();
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
                                onDoubleClick={() => handleStartEdit(item)}
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
                            <Chip
                              label={item.quantity || 1}
                              onClick={() => handleUpdateQuantity(item.id, 1)}
                              onDelete={() => handleUpdateQuantity(item.id, -1)}
                              icon={<AddIcon aria-hidden="true" />}
                              deleteIcon={<RemoveIcon aria-hidden="true" />}
                              aria-label={
                                t.aria.quantity.replace('{item}', item.text).replace('{count}', String(item.quantity || 1))
                              }
                              sx={{
                                // 1. Target the leading icon
                                '& .MuiChip-icon': {
                                  color: theme.palette.text.secondary,
                                },
                                // 2. Target the trailing (delete) icon
                                '& .MuiChip-deleteIcon': {
                                  color: theme.palette.text.secondary,
                                  opacity: 1, // Overrides default MUI fading (0.7)
                                  // 3. Prevent color/opacity shifting on hover
                                  '&:hover': {
                                    color: theme.palette.text.secondary,
                                    opacity: 1,
                                  },
                                },
                              }}
                            />
                          </Stack>
                          <IconButton
                            onClick={(e) => handleItemMenuOpen(e, item.id)}
                            aria-label={
                              t.aria.openItemMenu.replace('{item}', item.text)
                            }
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Stack>
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
              {t.list.purchased} ({purchasedItems.length})
            </Typography>

            <List>
              {purchasedItems.map(item => (
                <ListItem
                  key={item.id}
                  divider
                  sx={{
                    flexWrap: 'nowrap',
                    alignItems: 'center',
                    pr: 1,
                    pl: 0,
                  }}
                >
                  {/* Spacer to align with drag handle */}
                  <Box sx={{ minWidth: 32 }} />

                  <Checkbox
                    checked
                    onChange={() => handleTogglePurchase(item.id)}
                    slotProps={{
                      input: {
                        'aria-label': t.aria.unmarkPurchased.replace('{item}', item.text)
                      },
                    }}
                  />

                  <ListItemText
                    sx={{
                      flexGrow: 1,
                      mr: 1,
                      overflow: 'hidden',
                      ...(editingId === item.id
                        ? {}
                        : { textDecoration: 'line-through' }),
                    }}
                    primary={
                      editingId === item.id ? (
                        <TextField
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onBlur={handleSaveEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
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
                          onDoubleClick={() => handleStartEdit(item)}
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

                  <Stack direction="row" alignItems="center" flexShrink={0}>
                    <Chip
                      label={item.quantity || 1}
                      aria-label={
                        t.aria.quantity.replace('{item}', item.text).replace('{count}', String(item.quantity || 1))
                      }
                    />
                    <IconButton
                      onClick={(e) => handleItemMenuOpen(e, item.id)}
                      aria-label={
                        t.aria.openItemMenu.replace('{item}', item.text)
                      }
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Stack>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Item Action Menu */}
        <Menu
          anchorEl={itemMenuAnchorEl}
          open={Boolean(itemMenuAnchorEl)}
          onClose={handleItemMenuClose}
        >
          <MenuItem onClick={handleDeleteItem}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t.item.delete}</ListItemText>
          </MenuItem>
        </Menu>

        {/* Confirm Clear All Dialog */}
        <Dialog open={openClearDialog} onClose={cancelClearAll}>
          <DialogTitle>{t.clearDialog.title}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {t.clearDialog.description}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={cancelClearAll}>{t.clearDialog.cancel}</Button>
            <Button onClick={confirmClearAll} color="error" variant="contained">{t.clearDialog.confirm}</Button>
          </DialogActions>
        </Dialog>

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
