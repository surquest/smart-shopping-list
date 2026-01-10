import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button
} from '@mui/material';
import { Translation } from '../../i18n';

interface EditItemDialogProps {
  open: boolean;
  text: string;
  onTextChange: (text: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  t: Translation;
}

export const EditItemDialog: React.FC<EditItemDialogProps> = ({
  open,
  text,
  onTextChange,
  onClose,
  onConfirm,
  t,
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t.editDialog.title}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          fullWidth
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onConfirm(); }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t.editDialog.cancel}</Button>
        <Button onClick={onConfirm} variant="contained">{t.editDialog.confirm}</Button>
      </DialogActions>
    </Dialog>
  );
};
