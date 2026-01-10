'use client';

import { useEffect, useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, Typography, Box, Fab } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import IosShareIcon from '@mui/icons-material/IosShare';
import { useTranslation } from '@/i18n/useTranslation';

export default function InstallPrompt() {
  const [isMounted, setIsMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const { t, language, setLanguage } = useTranslation();

  useEffect(() => {
    // Mark component as mounted to prevent hydration mismatch
    setIsMounted(true);

    // Check if already in standalone mode
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Listen for the beforeinstallprompt event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (isIos) {
      setShowIosInstructions(true);
      return;
    }

    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setDeferredPrompt(null);
      });
    }
  };

  // Don't render anything until mounted on client to prevent hydration mismatch
  if (!isMounted) return null;

  if (isStandalone) return null;

  // Render button if we have a deferred prompt (Android/Desktop) OR if we are on iOS
  if (!deferredPrompt && !isIos) return null;

  return (
    <Box sx={{ '& > :not(style)': { m: 1 } }}>
      <Fab
        variant="extended"
        color="primary"
        onClick={handleInstallClick}
        aria-label="Install"
        sx={{
          position: 'fixed',
          bottom: 72,
          right: 24,
          zIndex: 1000
        }}
      >
        <DownloadIcon />
      </Fab>

      <Dialog
        open={showIosInstructions}
        onClose={() => setShowIosInstructions(false)}
      >
        <DialogTitle>Install on iOS</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} py={1}>
            <Typography>
              To install this app on your iPhone or iPad:
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography>1. Tap the Share button</Typography>
              <IosShareIcon color="primary" />
            </Box>
            <Typography>
              2. Scroll down and tap <strong>"Add to Home Screen"</strong>
            </Typography>
          </Box>
        </DialogContent >
      </Dialog >
    </Box >
  );
}
