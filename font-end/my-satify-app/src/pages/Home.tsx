import { Box, Typography, Grid, Button, Container, Paper, Stack, Skeleton } from "@mui/material";
import ProductCard from "../components/ProductCard";
import { useEffect, useState } from "react";
import api from "../api/axiosClient";
import { Link as RouterLink } from "react-router-dom";
import HeroSlider from "../components/HeroSlider";
import FlashSale from "../components/FlashSale";

export default function Home() {
    const [featured, setFeatured] = useState<any[]>([]);
    const [best, setBest] = useState<any[]>([]);
    const [recent, setRecent] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get('/products', { params: { limit: 8, sort: 'newest' } });
                const data = Array.isArray(res.data) ? res.data : res.data.data;
                setFeatured(data.slice(0, 8));
                try {
                    const bestRes = await api.get('/products/best_sellers', { params: { limit: 8 } });
                    const bestData = Array.isArray(bestRes.data) ? bestRes.data : bestRes.data.data;
                    setBest(bestData.slice(0, 8));
                } catch {}
                try {
                    const raw = localStorage.getItem('satify_recent_products');
                    const ids: string[] = raw ? JSON.parse(raw) : [];
                    if (ids.length) {
                        const results = await Promise.all(
                            ids.map(async (pid) => {
                                try { const r = await api.get(`/products/${pid}`); return r.data; } catch { return null; }
                            })
                        );
                        setRecent(results.filter(Boolean));
                    }
                } catch {}
            } finally { setLoading(false); }
        };
        load();
    }, []);

    return (
        <Box>
            <Box
                sx={{
                    position: 'relative',
                    color: 'white',
                    py: { xs: 8, md: 12 },
                    background: 'linear-gradient(135deg, #ee4d2d 0%, #ff7e4d 50%, #ffb300 100%)',
                    overflow: 'hidden',
                    mt: '-2px'
                }}
            >
                <Box sx={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
                    backgroundSize: '24px 24px', opacity: 0.15
                }} />
                <Container sx={{ position: 'relative' }}>
                    <Box sx={{
                        maxWidth: 960,
                        mx: 'auto',
                        textAlign: 'center',
                        backdropFilter: 'blur(4px)',
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 3,
                        p: { xs: 3, md: 5 }
                    }}>
                        <Typography
                            sx={{
                                fontWeight: 800,
                                letterSpacing: 0.5,
                                lineHeight: 1,
                                textShadow: '0 2px 12px rgba(0,0,0,0.25)',
                                fontSize: { xs: '2rem', md: '3rem' },
                                mb: 0
                            }}
                        >
                            Satify Pet Shop
                        </Typography>
                        <Typography
                            sx={{ mt: 0.5, opacity: 0.95, fontSize: { xs: '1.125rem', md: '1.375rem' } }}
                        >
                            Nơi tìm thú cưng đáng yêu cho bạn
                        </Typography>
                        <Stack direction="row" spacing={2} sx={{ mt: 3 }} justifyContent="center">
                            <Button component={RouterLink} to="/products" variant="contained" color="inherit" sx={{ color: 'primary.main' }}>Xem sản phẩm</Button>
                            <Button component={RouterLink} to="/products?sort=newest" variant="outlined" sx={{ borderColor: 'white', color: 'white' }}>Khám phá ngay</Button>
                        </Stack>
                    </Box>
                </Container>
            </Box>

            <Container sx={{ py: 4 }}>
                <HeroSlider />
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
                        {['Chó', 'Mèo', 'Phụ kiện'].map((c, i) => (
                            <Button key={i} component={RouterLink} to={`/products?category=${encodeURIComponent(c)}`} variant="outlined">{c}</Button>
                        ))}
                    </Stack>
                </Paper>
                <Box sx={{ mb: 4 }}>
                    <FlashSale />
                </Box>

                <Typography variant="h5" mb={2}>Sản phẩm mới</Typography>
                <Grid container spacing={2}>
                    {loading ? (
                        Array.from({ length: 8 }).map((_, i) => (
                            <Grid item xs={12} sm={6} md={3} key={i}><Skeleton variant="rectangular" width={'100%'} height={260} /></Grid>
                        ))
                    ) : (
                        featured.map((p, i) => (
                            <Grid item xs={12} sm={6} md={3} key={i}><ProductCard id={p._id} name={p.name} price={p.price} image={p.image} /></Grid>
                        ))
                    )}
                </Grid>

                <Typography variant="h5" mt={4} mb={2}>Bán chạy</Typography>
                <Grid container spacing={2}>
                    {loading ? (
                        Array.from({ length: 8 }).map((_, i) => (
                            <Grid item xs={12} sm={6} md={3} key={i}><Skeleton variant="rectangular" width={'100%'} height={260} /></Grid>
                        ))
                    ) : (
                        best.map((p, i) => (
                            <Grid item xs={12} sm={6} md={3} key={i}><ProductCard id={p._id} name={p.name} price={p.price} image={p.image} /></Grid>
                        ))
                    )}
                </Grid>

                {recent.length > 0 && (
                    <>
                        <Typography variant="h5" mt={4} mb={2}>Xem gần đây</Typography>
                        <Grid container spacing={2}>
                            {recent.map((p: any) => (
                                <Grid item xs={12} sm={6} md={3} key={p._id}>
                                    <ProductCard id={p._id} name={p.name} price={p.price} image={p.image} />
                                </Grid>
                            ))}
                        </Grid>
                    </>
                )}
            </Container>
        </Box>
    );
}
