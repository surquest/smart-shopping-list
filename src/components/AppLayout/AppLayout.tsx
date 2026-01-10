'use client';

import * as React from 'react';
import {
    Box,
    AppBar,
    Toolbar,
    IconButton,
    BottomNavigation,
    BottomNavigationAction,
    Paper,
    Avatar,
    Stack,
    Menu,
    MenuItem,
    Typography,
    Container
} from '@mui/material';
import {
    List,
    LocalOffer,
    Store,
    CreditCard,
    Translate,
} from '@mui/icons-material';
import { useTranslation } from '@/i18n/useTranslation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AppLayoutProps {
    children: React.ReactNode;
}

/**
 * Navigation Configuration
 * Centralizing this makes the component cleaner and easier to update.
 */
type NavLabelKey = 'lists' | 'products' | 'stores' | 'cards';

const NAV_ITEMS: { labelKey: NavLabelKey; icon: React.JSX.Element; path: string }[] = [
    { labelKey: 'lists', icon: <List />, path: '/lists' },
    { labelKey: 'products', icon: <LocalOffer />, path: '/products' },
    { labelKey: 'stores', icon: <Store />, path: '/stores' },
    { labelKey: 'cards', icon: <CreditCard />, path: '/cards' },
];

/**
 * Custom hook to manage MUI Menu state.
 */
const useMenu = () => {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const isOpen = Boolean(anchorEl);

    const handleOpen = React.useCallback((event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    }, []);

    const handleClose = React.useCallback(() => {
        setAnchorEl(null);
    }, []);

    return { anchorEl, isOpen, handleOpen, handleClose };
};

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    const pathname = usePathname();
    const { t, language, setLanguage, languages } = useTranslation();
    const langMenu = useMenu();

    /**
     * Memoized active path logic.
     * Extracts the root segment (e.g., /lists/123 -> /lists) to keep the 
     * correct navigation tab highlighted.
     */
    const activeTab = React.useMemo(() => {
        const match = NAV_ITEMS.find(item => pathname.startsWith(item.path));
        return match ? match.path : pathname;
    }, [pathname]);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* Header Navigation */}
            <AppBar position="sticky" elevation={1} color="inherit" sx={{ bgcolor: 'background.paper' }}>
                <Toolbar>
                    <Typography 
                        variant="h1" 
                        component="h1" 
                        sx={{ flexGrow: 1, fontWeight: 700 }}
                    >
                        {t.app?.title ?? 'App'}
                    </Typography>

                    <Stack direction="row" spacing={1} alignItems="center">
                        {/* Language Selector */}
                        <IconButton
                            onClick={langMenu.handleOpen}
                            aria-label={t.aria?.changeLanguage}
                            size="small"
                            sx={{ borderRadius: 2, px: 1 }}
                        >
                            <Translate fontSize="small" />
                            <Typography variant="body2" sx={{ ml: 0.5, fontWeight: 'bold' }}>
                                {language.toUpperCase()}
                            </Typography>
                        </IconButton>

                        <Menu
                            anchorEl={langMenu.anchorEl}
                            open={langMenu.isOpen}
                            onClose={langMenu.handleClose}
                            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                        >
                            {languages.map((lang) => (
                                <MenuItem
                                    key={lang}
                                    selected={lang === language}
                                    onClick={() => {
                                        setLanguage(lang);
                                        langMenu.handleClose();
                                    }}
                                >
                                    {lang.toUpperCase()}
                                </MenuItem>
                            ))}
                        </Menu>

                        <IconButton 
                            size="small"
                            aria-label={t.aria?.userProfile}
                                >
                            <Avatar sx={{ width: 32, height: 32 }} />
                        </IconButton>
                    </Stack>
                </Toolbar>
            </AppBar>

            {/* Main Content Area */}
            <Box 
                component="main" 
                sx={{ 
                    flexGrow: 1, 
                    pb: { xs: 10, sm: 4 }, // Padding bottom for Mobile Nav
                    pt: 2 
                }}
            >
                <Container maxWidth="lg">
                    {children}
                </Container>
            </Box>

            {/* Bottom Navigation for Mobile/Tablet */}
            <Paper
                sx={{ 
                    position: 'fixed', 
                    bottom: 0, 
                    left: 0, 
                    right: 0, 
                    zIndex: 1000,
                    borderTop: 1,
                    borderColor: 'divider'
                }}
                elevation={0}
            >
                <BottomNavigation
                    showLabels
                    value={activeTab}
                >
                    {NAV_ITEMS.map((item) => (
                        <BottomNavigationAction
                            key={item.path}
                            label={t.nav[item.labelKey]}
                            icon={item.icon}
                            value={item.path}
                            component={Link}
                            href={item.path}
                        />
                    ))}
                </BottomNavigation>
            </Paper>
        </Box>
    );
};

export default AppLayout;