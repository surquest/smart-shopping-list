import React, { useState, useCallback } from 'react';
import {
  Stack, Typography, IconButton, Menu, MenuItem, ListItemIcon, ListItemText
} from '@mui/material';
import {
  Language as LanguageIcon,
  MoreVert as MoreVertIcon,
  ClearAll as ClearAllIcon,
  WhatsApp as WhatsAppIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import { translations, Language } from '../../i18n';

interface ShoppingListHeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onClearAll: () => void;
  hasItems: boolean;
  onShareWhatsApp: () => void;
  onCopyLink: () => void;
}

/**
 * Custom hook to manage MUI Menu state and boilerplate.
 * Reduces repetitive state management for multiple menus.
 */
const useMenu = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isOpen = Boolean(anchorEl);
  
  const handleOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);
  
  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  return { anchorEl, isOpen, handleOpen, handleClose };
};

export const ShoppingListHeader: React.FC<ShoppingListHeaderProps> = ({
  language,
  onLanguageChange,
  onClearAll,
  hasItems,
  onShareWhatsApp,
  onCopyLink,
}) => {
  const t = translations[language];
  
  // Initialize separate menu controllers
  const langMenu = useMenu();
  const actionMenu = useMenu();

  /**
   * Defines the configuration for the action menu items.
   * Centralizing this makes it easier to add or remove features.
   */
  const actionItems = [
    {
      label: t.menu.clearList,
      icon: <ClearAllIcon fontSize="small" />,
      action: onClearAll,
      disabled: !hasItems,
    },
    {
      label: t.menu.shareWhatsApp,
      icon: <WhatsAppIcon fontSize="small" />,
      action: onShareWhatsApp,
      disabled: false,
    },
    {
      label: t.menu.copyLink,
      icon: <ShareIcon fontSize="small" />,
      action: onCopyLink,
      disabled: false,
    },
  ];

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      mb={2}
      component="header" // Semantic HTML
    >
      <Typography variant="h5" fontWeight="bold">
        {t.header.title}
      </Typography>
      
      <Stack direction="row" spacing={0.5}>
        {/* LANGUAGE SELECTOR */}
        <IconButton
          onClick={langMenu.handleOpen}
          aria-controls={langMenu.isOpen ? 'language-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={langMenu.isOpen ? 'true' : undefined}
          aria-label={t.aria.changeLanguage}
        >
          <LanguageIcon />
        </IconButton>
        
        <Menu
          id="language-menu"
          anchorEl={langMenu.anchorEl}
          open={langMenu.isOpen}
          onClose={langMenu.handleClose}
        >
          {(Object.keys(translations) as Language[]).map((lang) => (
            <MenuItem
              key={lang}
              selected={lang === language}
              onClick={() => {
                onLanguageChange(lang);
                langMenu.handleClose();
              }}
            >
              {lang.toUpperCase()}
            </MenuItem>
          ))}
        </Menu>

        {/* ACTIONS MENU */}
        <IconButton
          id="action-menu-button"
          aria-controls={actionMenu.isOpen ? 'action-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={actionMenu.isOpen ? 'true' : undefined}
          onClick={actionMenu.handleOpen}
          edge="end"
          aria-label={t.aria.openActions}
        >
          <MoreVertIcon />
        </IconButton>

        <Menu
          id="action-menu"
          aria-labelledby="action-menu-button"
          anchorEl={actionMenu.anchorEl}
          open={actionMenu.isOpen}
          onClose={actionMenu.handleClose}
          // Alignment for better UX on mobile/right-aligned buttons
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          {actionItems.map((item, index) => (
            <MenuItem
              key={index}
              disabled={item.disabled}
              onClick={() => {
                item.action();
                actionMenu.handleClose();
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText>{item.label}</ListItemText>
            </MenuItem>
          ))}
        </Menu>
      </Stack>
    </Stack>
  );
};