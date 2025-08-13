import { AppBar, Toolbar, Typography, IconButton, Box, Button, InputBase, Badge, Container, Stack, Drawer, List, ListItem, ListItemButton, ListItemText, Divider } from "@mui/material";
import PetsIcon from "@mui/icons-material/Pets";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import FavoriteIcon from '@mui/icons-material/Favorite';
import MenuIcon from '@mui/icons-material/Menu';
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axiosClient";
import { useCart } from "../context/CartContext";
import SearchIcon from '@mui/icons-material/Search';
import { useEffect, useRef, useState } from "react";

export default function Navbar() {
    const navigate = useNavigate();
    const token = typeof window !== 'undefined' ? localStorage.getItem('satify_token') : null;
    const role = typeof window !== 'undefined' ? localStorage.getItem('satify_role') : null;
    const { totalQuantity } = useCart();
    const [mobileOpen, setMobileOpen] = useState(false as boolean);
    const [searchValue, setSearchValue] = useState("");
    const appBarRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const updateHeightVar = () => {
            try {
                const h = appBarRef.current?.getBoundingClientRect().height || 72;
                document.documentElement.style.setProperty('--appbar-height', `${Math.round(h)}px`);
            } catch {}
        };
        updateHeightVar();
        window.addEventListener('resize', updateHeightVar);
        return () => window.removeEventListener('resize', updateHeightVar);
    }, []);

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
        } catch {}
        localStorage.removeItem('satify_token');
        localStorage.removeItem('satify_role');
        navigate('/');
    };

    const cartCount = totalQuantity;
    const toggleDrawer = (open: boolean) => () => setMobileOpen(open);
    const onSearch = () => {
        const query = searchValue.trim();
        navigate(query ? `/products?q=${encodeURIComponent(query)}` : '/products');
    };

    const categories = ['Chó', 'Mèo', 'Phụ kiện', 'Thức ăn', 'Đồ chơi'];

    return (
        <AppBar position="sticky" color="primary" sx={{ boxShadow: 'none' }} ref={appBarRef}>
            {/* Top promo bar moved to TopBar component */}
            <Container>
                <Toolbar sx={{ gap: 2, px: 0, minHeight: 72 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mr: 2 }}>
                        <PetsIcon />
                        <Typography
                            variant="h6"
                            component={Link}
                            to="/"
                            sx={{ textDecoration: "none", color: "inherit", fontWeight: 800, letterSpacing: 0.3 }}
                        >
                            Satify
                        </Typography>
                    </Stack>

                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Box sx={{
                            bgcolor: 'white', color: 'text.primary', display: 'flex', alignItems: 'center',
                            borderRadius: 3, px: 1.5, py: 0.5, width: { xs: '100%', md: '70%' }
                        }}>
                            <SearchIcon sx={{ color: 'action.active' }} />
                            <InputBase
                                placeholder="Tìm sản phẩm, giống thú cưng, phụ kiện..."
                                sx={{ ml: 1, flex: 1 }} inputProps={{ 'aria-label': 'search' }}
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                onKeyDown={(e: any) => { if (e.key === 'Enter') onSearch(); }}
                            />
                            <Button variant="contained" color="primary" sx={{ ml: 1 }} onClick={onSearch}>
                                Tìm kiếm
                            </Button>
                        </Box>
                    </Box>

                    <Stack direction="row" alignItems="center" spacing={1} sx={{ ml: 2, display: { xs: 'none', md: 'flex' } }}>
                        {token ? (
                            <>
                                {role === 'admin' && (
                                    <Button color="inherit" component={Link} to="/admin">Admin</Button>
                                )}
                                <Button color="inherit" component={Link} to="/orders">Đơn hàng</Button>
                                <Button color="inherit" component={Link} to="/profile">Hồ sơ</Button>
                                <Button color="inherit" onClick={handleLogout}>Đăng xuất</Button>
                            </>
                        ) : (
                            <>
                                <Button color="inherit" component={Link} to="/login">Đăng nhập</Button>
                                <Button color="inherit" component={Link} to="/register">Đăng ký</Button>
                            </>
                        )}
                        <IconButton color="inherit" component={Link} to="/favorites" aria-label="Yêu thích">
                            <FavoriteIcon />
                        </IconButton>
                        <IconButton color="inherit" component={Link} to="/cart" aria-label="Giỏ hàng">
                            <Badge color="secondary" badgeContent={cartCount} showZero>
                                <ShoppingCartIcon />
                            </Badge>
                        </IconButton>
                    </Stack>
                    <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                        <IconButton color="inherit" aria-label="menu" onClick={toggleDrawer(true)}>
                            <MenuIcon />
                        </IconButton>
                    </Box>
                </Toolbar>
                <Box sx={{ display: { xs: 'none', md: 'block' }, pt: 0, pb: 0, mt: 0, mb: 0 }}>
                    <Stack direction="row" spacing={2} sx={{ px: 0 }}>
                        {categories.map((c) => (
                            <Button key={c} component={Link} to={`/products?category=${encodeURIComponent(c)}`} sx={{ color: 'rgba(255,255,255,0.9)' }}>
                                {c}
                            </Button>
                        ))}
                    </Stack>
                </Box>
            </Container>
            <Drawer anchor="right" open={mobileOpen} onClose={toggleDrawer(false)}>
                <Box sx={{ width: 280 }} role="presentation" onClick={toggleDrawer(false)}>
                    <List>
                        {categories.map((text) => (
                            <ListItem key={text} disablePadding>
                                <ListItemButton component={Link} to={`/products?category=${encodeURIComponent(text)}`}>
                                    <ListItemText primary={text} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                    <Divider />
                    <List>
                        {token ? (
                            <>
                                {role === 'admin' && (
                                    <ListItem disablePadding>
                                        <ListItemButton component={Link} to="/admin"><ListItemText primary="Admin" /></ListItemButton>
                                    </ListItem>
                                )}
                                <ListItem disablePadding>
                                    <ListItemButton component={Link} to="/orders"><ListItemText primary="Đơn hàng" /></ListItemButton>
                                </ListItem>
                                <ListItem disablePadding>
                                    <ListItemButton component={Link} to="/profile"><ListItemText primary="Hồ sơ" /></ListItemButton>
                                </ListItem>
                                <ListItem disablePadding>
                                    <ListItemButton onClick={handleLogout}><ListItemText primary="Đăng xuất" /></ListItemButton>
                                </ListItem>
                            </>
                        ) : (
                            <>
                                <ListItem disablePadding>
                                    <ListItemButton component={Link} to="/login"><ListItemText primary="Đăng nhập" /></ListItemButton>
                                </ListItem>
                                <ListItem disablePadding>
                                    <ListItemButton component={Link} to="/register"><ListItemText primary="Đăng ký" /></ListItemButton>
                                </ListItem>
                            </>
                        )}
                        <ListItem disablePadding>
                            <ListItemButton component={Link} to="/favorites"><ListItemText primary="Yêu thích" /></ListItemButton>
                        </ListItem>
                        <ListItem disablePadding>
                            <ListItemButton component={Link} to="/cart">
                                <ListItemText primary={`Giỏ hàng (${cartCount})`} />
                            </ListItemButton>
                        </ListItem>
                    </List>
                </Box>
            </Drawer>
        </AppBar>
    );
}
