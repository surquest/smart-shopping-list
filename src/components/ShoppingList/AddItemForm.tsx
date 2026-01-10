import React, { useEffect, useRef, useState } from 'react';
import { Stack, TextField, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MicIcon from '@mui/icons-material/Mic';

interface AddItemFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  placeholder: string;
  ariaLabel: string;
  locale?: string;
  voiceLabels?: {
    start: string;
    stop: string;
    listening?: string;
  };
}

export const AddItemForm: React.FC<AddItemFormProps> = ({
  value,
  onChange,
  onSubmit,
  inputRef,
  placeholder,
  ariaLabel,
  locale,
  voiceLabels,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const SpeechRecognitionConstructor =
    typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onresult = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  const startRecognition = () => {
    if (!SpeechRecognitionConstructor) return;

    try {
      const recog = new SpeechRecognitionConstructor();
      recognitionRef.current = recog;
      recog.lang = locale || navigator.language || 'en-US';
      recog.interimResults = false;
      recog.maxAlternatives = 1;

      recog.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join(' ')
          .trim();
        if (transcript) {
          onChange((value + ' ' + transcript).trim());
        }
      };


      recog.onerror = () => {
        setIsRecording(false);
      };

      recog.onend = () => {
        setIsRecording(false);
      };

      setIsRecording(true);
      recog.start();
    } catch (e) {
      // ignore failures silently
    }
  };

  const stopRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) stopRecognition();
    else startRecognition();
  };

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

      {value.trim() ? (
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
      ) : (
        <Button
          variant="contained"
          onClick={toggleRecording}
          sx={{
            minWidth: 48,
            height: 48,
          }}
          aria-label={isRecording ? (voiceLabels?.stop ?? 'Stop voice input') : (voiceLabels?.start ?? 'Start voice input')}
          aria-pressed={isRecording}
        >
          <MicIcon color={isRecording ? 'error' : 'inherit'} />
        </Button>
      )}
    </Stack>
  );
};
