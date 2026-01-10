'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Stack, TextField, Button, Snackbar } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MicIcon from '@mui/icons-material/Mic';

// --- Type Definitions for Web Speech API ---
// Since these aren't always in standard TS libs, we define a minimal interface 
// to avoid using 'any' and improve developer experience.
interface ISpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: any) => void) | null;
}

interface WindowWithSpeech extends Window {
  SpeechRecognition?: { new(): ISpeechRecognition };
  webkitSpeechRecognition?: { new(): ISpeechRecognition };
}

// --- Props Interface ---
interface AddItemFormProps {
  /** The current text value of the input */
  value: string;
  /** Callback when text changes (typed or spoken) */
  onChange: (value: string) => void;
  /** Callback when the form is submitted */
  onSubmit: (e: React.FormEvent) => void;
  /** Reference to the underlying HTML Input element */
  inputRef: React.RefObject<HTMLInputElement>;
  placeholder: string;
  ariaLabel: string;
  /** Language code for speech recognition (e.g., 'en-US') */
  language?: string;
  /** Custom labels for accessibility and UI feedback */
  voiceLabels?: {
    start: string;
    stop: string;
    listening?: string;
  };
}

// --- Custom Hook: useSpeechRecognition ---
// Encapsulates all logic related to the browser's Speech API.
// Returns the recording state, start/stop methods, and whether the feature is supported.
const useSpeechRecognition = (
  language: string = 'en-US',
  onResult: (transcript: string) => void
) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  useEffect(() => {
    // Check if browser supports the API
    const supported = typeof window !== 'undefined' &&
      (!!(window as WindowWithSpeech).SpeechRecognition || !!(window as WindowWithSpeech).webkitSpeechRecognition);
    setIsSupported(supported);
  }, []);

  const startRecording = useCallback(() => {
    if (!isSupported) return;

    const win = window as WindowWithSpeech;
    const SpeechConstructor = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechConstructor) {
      const recog = new SpeechConstructor();
      recognitionRef.current = recog;
      recog.lang = language;
      recog.interimResults = false;
      recog.maxAlternatives = 1;

      // Handle successful transcription
      recog.onresult = (event: any) => {
        const transcript = Array.from(event.results as any[])
          .map((r: any) => r[0].transcript)
          .join(' ')
          .trim();

        if (transcript) {
          onResult(transcript);
        }
      };

      // Cleanup when recording ends naturally or errors out
      recog.onerror = () => setIsRecording(false);
      recog.onend = () => setIsRecording(false);

      try {
        recog.start();
        setIsRecording(true);
      } catch (e) {
        console.error("Speech recognition failed to start", e);
        setIsRecording(false);
      }
    }
  }, [language, isSupported, onResult]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  // Cleanup effect to stop recognition if component unmounts
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null; // Prevent state updates on unmount
        recognitionRef.current.stop();
      }
    };
  }, []);

  return { isRecording, startRecording, stopRecording, isSupported };
};


// --- Main Component ---
export const AddItemForm: React.FC<AddItemFormProps> = ({
  value,
  onChange,
  onSubmit,
  inputRef,
  placeholder,
  ariaLabel,
  language = 'en-US', // Default value
  voiceLabels,
}) => {

  // Callback wrapper to append spoken text to existing text
  const handleSpeechResult = useCallback((transcript: string) => {
    // We add a space if there is already text, then append the transcript
    const newValue = `${value} ${transcript}`.trim();
    onChange(newValue);
  }, [value, onChange]);

  // Use our custom hook
  const { isRecording, startRecording, stopRecording, isSupported } =
    useSpeechRecognition(language, handleSpeechResult);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Determine if we should show the "Add" button or the "Mic" button
  // Logic: If there is text, show Add. If empty, show Mic (if supported).
  const hasText = value.trim().length > 0;
  const showMicButton = !hasText && isSupported;

  return (
    <>
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
          // Ensure consistent height with the button
          sx={{
            '& .MuiInputBase-root': {
              height: 48,
            },
          }}
        />

        {showMicButton ? (
          <Button
            variant="contained"
            onClick={toggleRecording}
            // Ensure consistent square shape
            sx={{ minWidth: 48, height: 48 }}
            color={isRecording ? "error" : "primary"}
            aria-label={isRecording ? (voiceLabels?.stop ?? 'Stop voice input') : (voiceLabels?.start ?? 'Start voice input')}
            aria-pressed={isRecording}
          >
            <MicIcon />
          </Button>
        ) : (
          <Button
            variant="contained"
            type="submit"
            disabled={!hasText}
            sx={{ minWidth: 48, height: 48 }}
            aria-label={ariaLabel}
          >
            <AddIcon />
          </Button>
        )}
      </Stack>

      {/* Snackbar provides visual feedback that the app is listening */}
      <Snackbar
        open={isRecording}
        message={voiceLabels?.listening ?? 'Listening...'}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        action={
          <Button color="inherit" size="small" onClick={stopRecording}>
            {voiceLabels?.stop ?? 'Stop'}
          </Button>
        }
      />
    </>
  );
};