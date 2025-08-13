import { useEffect, useState } from 'react';
import { Box, Container, Grid, Typography, Button, Stack, TextField } from '@mui/material';
import { useEffect as useReactEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useWishlist } from '../context/WishlistContext';
import api from '../api/axiosClient';

export default function Favorites() {
  const { ids } = useWishlist();
  const [items, setItems] = useState<any[]>([]);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [shareToken, setShareToken] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        if (ids.length === 0) { setItems([]); return; }
        const res = await api.get('/products', { params: { ids: ids.join(','), limit: ids.length } });
        const data = Array.isArray(res.data) ? res.data : res.data.data;
        setItems(data);
      } catch { setItems([]); }
    };
    load();
  }, [ids]);

  const generateShare = async () => {
    try {
      const res = await api.post('/users/me/wishlist_share', { ttlMinutes: 60 * 24 });
      const token = res.data?.token;
      const expiresAt = res.data?.expiresAt;
      const uid = localStorage.getItem('satify_user_id');
      if (!uid || !token) return;
      setShareToken(token);
      const base = window.location.origin;
      setShareUrl(`${base}/favorites/${uid}?token=${token}`);
    } catch {}
  };

  return (
    <Container sx={{ py: 4 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }} justifyContent="space-between" sx={{ mb: 2 }} spacing={2}>
        <Typography variant="h4">Yêu thích</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
          <Typography color="text.secondary">{items.length} sản phẩm</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
            <Button variant="outlined" onClick={generateShare}>Tạo link chia sẻ</Button>
            {shareUrl && (
              <TextField size="small" value={shareUrl} InputProps={{ readOnly: true }} sx={{ width: { xs: '100%', sm: 360 } }} />
            )}
          </Stack>
        </Stack>
      </Stack>
      {items.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography>Bạn chưa thêm sản phẩm yêu thích nào.</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {items.map((p: any) => (
            <Grid item xs={12} sm={6} md={3} key={p._id}>
              <ProductCard id={p._id} name={p.name} price={p.price} image={p.image} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
