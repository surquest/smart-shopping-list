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
 * Custom hook to manage MUI Menu state and boilerplate.
 * Reduces repetitive state management for multiple menus.
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

    // Determine which tab is active based on the URL path
    // This handles sub-routes (e.g., /lists/123 still highlights /lists)
    const getActiveValue = () => {
        if (pathname.startsWith('/lists')) return '/lists';
        if (pathname.startsWith('/products')) return '/products';
        if (pathname.startsWith('/stores')) return '/stores';
        if (pathname.startsWith('/cards')) return '/cards';
        return pathname;
    };

    // Initialize separate menu controllers
    const langMenu = useMenu();

    const [value, setValue] = React.useState<string>(getActiveValue());

    const { t, language, setLanguage, languages } = useTranslation();

    // Keep BottomNavigation in sync with route changes
    React.useEffect(() => {
        setValue(getActiveValue());
    }, [pathname]);

    return (
        <Box sx={{ pb: 7 }}>

            <AppBar position="sticky" elevation={1} color='default'>
                <Toolbar>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h1">{t.app?.title ?? ''}</Typography>
                    </Box>

                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        component="header" // Semantic HTML
                    >
                        {/* Language Switcher */}
                        <IconButton
                            onClick={langMenu.handleOpen}
                            aria-label={t.aria.changeLanguage}
                            title={t.aria.changeLanguage}
                        >
                            <Translate fontSize="small" />
                        </IconButton>

                        {/* User Profile */}
                        <IconButton>
                            <Avatar sx={{ width: 32, height: 32 }} />
                        </IconButton>
                        <Stack direction="row" spacing={0.5}>
                            <Menu
                                id="language-menu"
                                anchorEl={langMenu.anchorEl}
                                open={langMenu.isOpen}
                                onClose={langMenu.handleClose}
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
                        </Stack>

                    </Stack>
                </Toolbar>
            </AppBar>

            <Box component="main" sx={{ p: { xs: 0, sm: 2 } }}>
                {children}
            </Box>

            <Paper
                sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
                elevation={3}
            >
                <BottomNavigation
                    showLabels
                    value={getActiveValue()}
                >
                    <BottomNavigationAction
                        label={t.nav.lists}
                        icon={<List />}
                        value="/lists"
                        component={Link}
                        href="/lists"
                    />
                    <BottomNavigationAction
                        label={t.nav.products}
                        icon={<LocalOffer />}
                        value="/products"
                        component={Link}
                        href="/products"
                    />
                    <BottomNavigationAction
                        label={t.nav.stores}
                        icon={<Store />}
                        value="/stores"
                        component={Link}
                        href="/stores"
                    />
                    <BottomNavigationAction
                        label={t.nav.cards}
                        icon={<CreditCard />}
                        value="/cards"
                        component={Link}
                        href="/cards"
                    />
                </BottomNavigation>
            </Paper>
        </Box>
    );
};

export default AppLayout;
