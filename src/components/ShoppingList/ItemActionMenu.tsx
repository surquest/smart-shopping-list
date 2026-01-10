import React from 'react';
import { Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface ItemActionMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  t: any;
}

export const ItemActionMenu: React.FC<ItemActionMenuProps> = ({
  anchorEl,
  onClose,
  onEdit,
  onDelete,
  t,
}) => {
  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
    >
      <MenuItem onClick={() => {
        onEdit();
        // The original code handleOpenEditDialog calls handleItemMenuClose inside it
        // But here we might want to ensure menu closes
      }}>
        <ListItemIcon>
          <EditIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>{t.item.edit}</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => {
        onDelete();
      }}>
        <ListItemIcon>
          <DeleteIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>{t.item.delete}</ListItemText>
      </MenuItem>
    </Menu>
  );
};
