import { useEffect, useState } from 'react';
import { Box, Typography, Grid, Skeleton } from '@mui/material';
import ProductCard from './ProductCard';
import api from '../api/axiosClient';

export default function FlashSale() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/products', { params: { sort: 'price_desc', limit: 8 } });
        const data = Array.isArray(res.data) ? res.data : res.data.data;
        setList(data.slice(0, 8));
      } finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <Box>
      <Typography variant="h5" mb={2}>Flash Sale</Typography>
      <Grid container spacing={2}>
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" width={'100%'} height={260} />
            </Grid>
          ))
        ) : (
          list.map((p, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <ProductCard id={p._id} name={p.name} price={p.price} image={p.image} />
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
}
