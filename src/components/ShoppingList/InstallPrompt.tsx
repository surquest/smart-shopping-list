'use client';

import { useEffect, useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, Typography, Box } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import IosShareIcon from '@mui/icons-material/IosShare';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  useEffect(() => {
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

  if (isStandalone) return null;

  // Render button if we have a deferred prompt (Android/Desktop) OR if we are on iOS
  if (!deferredPrompt && !isIos) return null;

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={<DownloadIcon />}
        onClick={handleInstallClick}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          boxShadow: 3
        }}
      >
        Install
      </Button>

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
        </DialogContent>
      </Dialog>
    </>
  );
}
