import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button
} from '@mui/material';
import { Translation } from '../../i18n';

interface ClearListDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  t: Translation;
}

export const ClearListDialog: React.FC<ClearListDialogProps> = ({
  open,
  onClose,
  onConfirm,
  t,
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t.clearDialog.title}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t.clearDialog.description}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t.clearDialog.cancel}</Button>
        <Button onClick={onConfirm} color="error" variant="contained">{t.clearDialog.confirm}</Button>
      </DialogActions>
    </Dialog>
  );
};
