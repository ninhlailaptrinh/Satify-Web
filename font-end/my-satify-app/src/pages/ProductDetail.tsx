import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axiosClient";
import { Box, Typography, Grid, Button, Skeleton, Stack, Chip, Breadcrumbs, Link as MuiLink } from "@mui/material";
import { Link as RouterLink } from 'react-router-dom';
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
  const [related, setRelated] = useState<ProductDto[]>([]);
  const { add, replace } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOne = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data);
        try {
          const raw = localStorage.getItem('satify_recent_products');
          const arr = raw ? (JSON.parse(raw) as string[]) : [];
          const next = [res.data._id, ...arr.filter((x: string) => x !== res.data._id)].slice(0, 10);
          localStorage.setItem('satify_recent_products', JSON.stringify(next));
        } catch {}
      } finally {
        setLoading(false);
      }
    };
    fetchOne();
  }, [id]);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        if (!product || !(product as any).category) return;
        const res = await api.get('/products', { params: { category: (product as any).category, sort: 'newest', limit: 8 } });
        const data = Array.isArray(res.data) ? res.data : res.data.data;
        setRelated((data as ProductDto[]).filter((p) => p._id !== product._id));
      } catch {}
    };
    fetchRelated();
  }, [product]);

  const bumpFavCategory = (cat: string) => {
    try {
      const raw = localStorage.getItem('satify_fav_categories');
      const map = raw ? JSON.parse(raw) as Record<string, number> : {};
      map[cat] = (map[cat] || 0) + 1;
      localStorage.setItem('satify_fav_categories', JSON.stringify(map));
    } catch {}
  };

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
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <MuiLink component={RouterLink} underline="hover" color="inherit" to="/">Trang chủ</MuiLink>
        <MuiLink component={RouterLink} underline="hover" color="inherit" to="/products">Sản phẩm</MuiLink>
        <Typography color="text.primary">Chi tiết</Typography>
      </Breadcrumbs>
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
          {product && (product as any).category && (
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Chip label={(product as any).category} onClick={() => bumpFavCategory((product as any).category)} component={RouterLink as any} to={`/products?category=${encodeURIComponent((product as any).category)}`} clickable />
            </Stack>
          )}
        </Grid>
      </Grid>
      {related.length > 0 && (
        <>
          <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>Sản phẩm liên quan</Typography>
          <Grid container spacing={2}>
            {related.map((p) => (
              <Grid item xs={12} sm={6} md={3} key={p._id}>
                {/* lazy import to avoid cycle not needed, direct reuse */}
                <Button variant="text" onClick={() => navigate(`/products/${p._id}`)} sx={{ p: 0, textAlign: 'left' }}>
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ position: 'relative', width: '100%', pt: '66.66%', overflow: 'hidden', borderRadius: 2, boxShadow: 1 }}>
                      <img src={p.image} alt={p.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    </Box>
                    <Typography sx={{ mt: 1, fontWeight: 600 }}>{p.name}</Typography>
                    <Typography color="primary">{formatCurrency(p.price)}</Typography>
                  </Box>
                </Button>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  );
}
