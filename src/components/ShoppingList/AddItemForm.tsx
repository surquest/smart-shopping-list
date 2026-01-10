import React from 'react';
import { Stack, TextField, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface AddItemFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  placeholder: string;
  ariaLabel: string;
}

export const AddItemForm: React.FC<AddItemFormProps> = ({
  value,
  onChange,
  onSubmit,
  inputRef,
  placeholder,
  ariaLabel,
}) => {
  return (
    <Stack
      direction="row"
      spacing={1}
      component="form"
      onSubmit={onSubmit}
      mb={3}
      alignItems="stretch"
    >
      <TextField
        fullWidth
        size="small"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputRef={inputRef}
        sx={{
          '& .MuiInputBase-root': {
            height: 48,
          },
        }}
      />

      <Button
        variant="contained"
        type="submit"
        disabled={!value.trim()}
        sx={{
          minWidth: 48,
          height: 48,
        }}
        aria-label={ariaLabel}
      >
        <AddIcon />
      </Button>
    </Stack>
  );
};
