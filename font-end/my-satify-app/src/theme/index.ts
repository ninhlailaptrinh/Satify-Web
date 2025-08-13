import { createTheme } from '@mui/material';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: { main: '#ee4d2d' }, // Shopee-like orange
        secondary: { main: '#ffb300' },
        background: { default: '#fafafa' }
    },
    shape: { borderRadius: 10 },
    components: {
        MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: { root: { textTransform: 'none', borderRadius: 8 } }
        },
        MuiAppBar: { styleOverrides: { root: { boxShadow: 'none', borderBottom: '1px solid #eee' } } },
        MuiCard: { styleOverrides: { root: { borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' } } }
    },
    typography: {
        fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif'
    }
});

export default theme;
