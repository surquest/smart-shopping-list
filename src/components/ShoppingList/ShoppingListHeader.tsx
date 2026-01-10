import React, { useState } from 'react';
import {
  Stack, Typography, IconButton, Menu, MenuItem, ListItemIcon, ListItemText
} from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ShareIcon from '@mui/icons-material/Share';
import { translations, Language } from '../../i18n';

interface ShoppingListHeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onClearAll: () => void;
  hasItems: boolean;
  onShareWhatsApp: () => void;
  onCopyLink: () => void;
}

export const ShoppingListHeader: React.FC<ShoppingListHeaderProps> = ({
  language,
  onLanguageChange,
  onClearAll,
  hasItems,
  onShareWhatsApp,
  onCopyLink,
}) => {
  const t = translations[language];

  // Language Menu
  const [langAnchorEl, setLangAnchorEl] = useState<null | HTMLElement>(null);
  const openLangMenu = Boolean(langAnchorEl);

  const handleLangMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setLangAnchorEl(event.currentTarget);
  };
  const handleLangMenuClose = () => {
    setLangAnchorEl(null);
  };
  const handleLangSelect = (lang: Language) => {
    onLanguageChange(lang);
    handleLangMenuClose();
  };

  // Actions Menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      mb={2}
    >
      <Typography variant="h5" fontWeight="bold">
        {t.header.title}
      </Typography>
      
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
              onClick={() => handleLangSelect(lang)}
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
              onClearAll();
            }}
            disabled={!hasItems}
          >
            <ListItemIcon>
              <ClearAllIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t.menu.clearList}</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleMenuClose();
              onShareWhatsApp();
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
              onCopyLink();
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
  );
};
