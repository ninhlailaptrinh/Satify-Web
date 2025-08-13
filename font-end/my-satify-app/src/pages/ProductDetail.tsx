import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axiosClient";
import { Box, Typography, Grid, Button, Skeleton, Stack } from "@mui/material";
import { formatCurrency } from "../utils/format";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";

interface ProductDto {
  _id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
}

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [loading, setLoading] = useState(true);
  const { add, replace } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOne = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data);
      } finally {
        setLoading(false);
      }
    };
    fetchOne();
  }, [id]);

  const addToCart = () => {
    if (!product) return;
    add({ productId: product._id, name: product.name, price: product.price, image: product.image, qty: 1 });
    alert('Đã thêm vào giỏ');
  };

  const buyNow = () => {
    if (!product) return;
    replace([{ productId: product._id, name: product.name, price: product.price, image: product.image, qty: 1 }]);
    navigate('/cart');
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Skeleton variant="rectangular" width={320} height={240} />
        <Skeleton width={280} />
        <Skeleton width={200} />
      </Box>
    );
  }

  if (!product) return <Box sx={{ p: 4 }}><Typography>Không tìm thấy sản phẩm</Typography></Box>;

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Box sx={{ position: 'relative', width: '100%', pt: '75%', borderRadius: 2, overflow: 'hidden', boxShadow: 1 }}>
            <img src={product.image} alt={product.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>{product.name}</Typography>
          <Typography variant="h5" color="primary" sx={{ my: 1.5 }}>{formatCurrency(product.price)}</Typography>
          <Typography sx={{ mb: 3, color: 'text.secondary' }}>{product.description || 'Không có mô tả'}</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button size="large" variant="contained" onClick={addToCart}>Thêm vào giỏ</Button>
            <Button size="large" variant="outlined" onClick={buyNow}>Mua ngay</Button>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
