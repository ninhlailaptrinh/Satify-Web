import { useEffect, useState } from 'react';
import { Box, Container, Grid, Typography, Button, Stack } from '@mui/material';
import ProductCard from '../components/ProductCard';
import { useWishlist } from '../context/WishlistContext';
import api from '../api/axiosClient';

export default function Favorites() {
  const { ids } = useWishlist();
  const [items, setItems] = useState<any[]>([]);

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

  return (
    <Container sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h4">Yêu thích</Typography>
        <Typography color="text.secondary">{items.length} sản phẩm</Typography>
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
