import { AppBar, Toolbar, Typography, IconButton, Box, Button, InputBase, Badge, Container, Stack } from "@mui/material";
import PetsIcon from "@mui/icons-material/Pets";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axiosClient";
import { useCart } from "../context/CartContext";
import SearchIcon from '@mui/icons-material/Search';

export default function Navbar() {
    const navigate = useNavigate();
    const token = typeof window !== 'undefined' ? localStorage.getItem('satify_token') : null;
    const role = typeof window !== 'undefined' ? localStorage.getItem('satify_role') : null;
    const { totalQuantity } = useCart();

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
        } catch {}
        localStorage.removeItem('satify_token');
        localStorage.removeItem('satify_role');
        navigate('/');
    };

    const cartCount = totalQuantity;

    const categories = ['Chó', 'Mèo', 'Phụ kiện', 'Thức ăn', 'Đồ chơi'];

    return (
        <AppBar position="sticky" color="primary" sx={{ boxShadow: 'none' }}>
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
                                onKeyDown={(e: any) => { if (e.key === 'Enter') navigate(`/products?q=${encodeURIComponent(e.target.value)}`) }}
                            />
                            <Button variant="contained" color="primary" sx={{ ml: 1 }} onClick={() => navigate('/products')}>
                                Tìm kiếm
                            </Button>
                        </Box>
                    </Box>

                    <Stack direction="row" alignItems="center" spacing={1} sx={{ ml: 2 }}>
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
                        <IconButton color="inherit" component={Link} to="/cart" aria-label="Giỏ hàng">
                            <Badge color="secondary" badgeContent={cartCount} showZero>
                                <ShoppingCartIcon />
                            </Badge>
                        </IconButton>
                    </Stack>
                </Toolbar>
                <Box sx={{ display: { xs: 'none', md: 'block' }, pb: 0 }}>
                    <Stack direction="row" spacing={2} sx={{ px: 0 }}>
                        {categories.map((c) => (
                            <Button key={c} component={Link} to={`/products?category=${encodeURIComponent(c)}`} sx={{ color: 'rgba(255,255,255,0.9)' }}>
                                {c}
                            </Button>
                        ))}
                    </Stack>
                </Box>
            </Container>
        </AppBar>
    );
}
