import { Badge, Box, BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import CategoryIcon from '@mui/icons-material/Category';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalQuantity } = useCart();
  const token = typeof window !== 'undefined' ? localStorage.getItem('satify_token') : null;

  const current = useMemo(() => {
    if (location.pathname.startsWith('/products')) return 'categories';
    if (location.pathname.startsWith('/cart')) return 'cart';
    if (location.pathname.startsWith('/profile') || location.pathname.startsWith('/login') || location.pathname.startsWith('/register')) return 'account';
    return 'home';
  }, [location.pathname]);

  const [value, setValue] = useState(current);
  useEffect(() => setValue(current), [current]);

  const onChange = (_: any, newValue: string) => {
    setValue(newValue);
    switch (newValue) {
      case 'home':
        navigate('/');
        break;
      case 'categories':
        navigate('/products');
        break;
      case 'cart':
        navigate('/cart');
        break;
      case 'account':
        navigate(token ? '/profile' : '/login');
        break;
    }
  };

  return (
    <Paper elevation={3} sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: { xs: 'block', md: 'none' }, zIndex: (t) => t.zIndex.appBar }}>
      <BottomNavigation value={value} onChange={onChange} showLabels>
        <BottomNavigationAction label="Trang chủ" value="home" icon={<HomeIcon />} />
        <BottomNavigationAction label="Danh mục" value="categories" icon={<CategoryIcon />} />
        <BottomNavigationAction label="Giỏ hàng" value="cart" icon={<Badge color="secondary" badgeContent={totalQuantity} showZero><ShoppingCartIcon /></Badge>} />
        <BottomNavigationAction label="Tài khoản" value="account" icon={<AccountCircleIcon />} />
      </BottomNavigation>
    </Paper>
  );
}
