import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Container, Grid, Typography } from '@mui/material';
import api from '../api/axiosClient';
import ProductCard from '../components/ProductCard';

export default function FavoritesPublic() {
  const { userId } = useParams();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        if (!userId) return;
        const idsRes = await api.get(`/users/${userId}/wishlist_public`);
        const ids: string[] = idsRes.data?.ids || [];
        if (ids.length === 0) { setItems([]); return; }
        const res = await api.get('/products', { params: { ids: ids.join(','), limit: ids.length } });
        const data = Array.isArray(res.data) ? res.data : res.data.data;
        setItems(data);
      } catch { setItems([]); }
    };
    load();
  }, [userId]);

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Wishlist của người dùng</Typography>
      {items.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography>Danh sách trống hoặc không tồn tại.</Typography>
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
