import { Box, Typography, Grid, TextField, MenuItem, Stack, Paper, Button, Pagination, Skeleton, Drawer, Divider } from "@mui/material";
import FilterListIcon from '@mui/icons-material/FilterList';
import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import api from "../api/axiosClient";
import { useSearchParams } from "react-router-dom";

interface ProductDto {
    _id: string;
    name: string;
    price: number;
    image: string;
}

export default function ProductList() {
    const [params, setParams] = useSearchParams();
    const [products, setProducts] = useState<ProductDto[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);

    const q = params.get('q') || '';
    const sort = params.get('sort') || 'newest';
    const minPrice = params.get('minPrice') || '';
    const maxPrice = params.get('maxPrice') || '';
    const limit = params.get('limit') || '12';

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            const page = Number(params.get('page') || 1);
            const res = await api.get("/products", { params: { q, sort, minPrice: minPrice || undefined, maxPrice: maxPrice || undefined, page, limit: Number(limit) } });
            const data = Array.isArray(res.data) ? res.data : res.data.data;
            const meta = Array.isArray(res.data) ? { total: data.length, page: 1, limit: data.length } : res.data.meta;
            setProducts(data);
            setTotal(meta.total || 0);
            setLoading(false);
        };
        fetchProducts();
    }, [q, sort, minPrice, maxPrice, params]);

    const list = useMemo(() => products, [products]);

    const updateParam = (key: string, value?: string) => {
        const next = new URLSearchParams(params);
        if (value && value.length > 0) next.set(key, value); else next.delete(key);
        setParams(next, { replace: true });
    };

    const [filterOpen, setFilterOpen] = useState(false);
    const [draft, setDraft] = useState({ qDraft: q, sortDraft: sort, minDraft: minPrice, maxDraft: maxPrice, limitDraft: limit });

    const openFilter = () => {
        setDraft({ qDraft: q, sortDraft: sort, minDraft: minPrice, maxDraft: maxPrice, limitDraft: limit });
        setFilterOpen(true);
    };
    const applyFilter = () => {
        const next = new URLSearchParams(params);
        const { qDraft, sortDraft, minDraft, maxDraft, limitDraft } = draft;
        const setOrDelete = (k: string, v?: string) => { if (v && v.length > 0) next.set(k, v); else next.delete(k); };
        setOrDelete('q', qDraft);
        setOrDelete('sort', sortDraft);
        setOrDelete('minPrice', minDraft);
        setOrDelete('maxPrice', maxDraft);
        setOrDelete('limit', limitDraft);
        next.delete('page');
        setParams(next, { replace: true });
        setFilterOpen(false);
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 } }}>
            <Typography variant="h4" mb={2}>Danh sách sản phẩm</Typography>

            {/* Desktop/tablet filters */}
            <Paper sx={{ p: 2, mb: 3, display: { xs: 'none', md: 'block' } }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
                    <TextField
                        label="Tìm kiếm"
                        variant="outlined"
                        value={q}
                        onChange={(e) => updateParam('q', e.target.value)}
                        fullWidth
                    />
                    <TextField select label="Sắp xếp" value={sort} onChange={(e) => updateParam('sort', e.target.value)} sx={{ minWidth: 180 }}>
                        <MenuItem value="newest">Mới nhất</MenuItem>
                        <MenuItem value="price_asc">Giá tăng dần</MenuItem>
                        <MenuItem value="price_desc">Giá giảm dần</MenuItem>
                    </TextField>
                    <TextField label="Giá từ" type="number" value={minPrice} onChange={(e) => updateParam('minPrice', e.target.value)} sx={{ width: 140 }} />
                    <TextField label="đến" type="number" value={maxPrice} onChange={(e) => updateParam('maxPrice', e.target.value)} sx={{ width: 140 }} />
                    <TextField select label="Hiển thị" value={limit} onChange={(e) => updateParam('limit', e.target.value)} sx={{ width: 140 }}>
                        {[12, 24, 48].map(n => <MenuItem key={n} value={String(n)}>{n}/trang</MenuItem>)}
                    </TextField>
                    <Button onClick={() => setParams(new URLSearchParams(), { replace: true })}>Xoá lọc</Button>
                </Stack>
            </Paper>

            {/* Mobile filter trigger */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, mb: 2 }}>
                <Button variant="outlined" startIcon={<FilterListIcon />} onClick={openFilter}>Bộ lọc</Button>
            </Box>

            <Grid container spacing={2}>
                {loading ? (
                    Array.from({ length: Number(limit) }).map((_, i) => (
                        <Grid item xs={12} sm={6} md={3} key={i}>
                            <Skeleton variant="rectangular" width={'100%'} height={260} />
                        </Grid>
                    ))
                ) : (
                    list.map((p) => (
                        <Grid item xs={12} sm={6} md={3} key={p._id}>
                            <ProductCard id={p._id} name={p.name} price={p.price} image={p.image} />
                        </Grid>
                    ))
                )}
            </Grid>

            <Box mt={3} display="flex" justifyContent="center">
                <Pagination
                    page={Number(params.get('page') || 1)}
                    count={Math.max(1, Math.ceil(total / Number(params.get('limit') || 12)))}
                    onChange={(_, p) => updateParam('page', String(p))}
                    color="primary"
                />
            </Box>

            {/* Mobile bottom filter drawer */}
            <Drawer anchor="bottom" open={filterOpen} onClose={() => setFilterOpen(false)}>
                <Box sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>Bộ lọc</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Stack spacing={2}>
                        <TextField
                            label="Tìm kiếm"
                            variant="outlined"
                            value={draft.qDraft}
                            onChange={(e) => setDraft((d) => ({ ...d, qDraft: e.target.value }))}
                            fullWidth
                        />
                        <TextField select label="Sắp xếp" value={draft.sortDraft} onChange={(e) => setDraft((d) => ({ ...d, sortDraft: e.target.value }))}>
                            <MenuItem value="newest">Mới nhất</MenuItem>
                            <MenuItem value="price_asc">Giá tăng dần</MenuItem>
                            <MenuItem value="price_desc">Giá giảm dần</MenuItem>
                        </TextField>
                        <Stack direction="row" spacing={2}>
                            <TextField label="Giá từ" type="number" value={draft.minDraft} onChange={(e) => setDraft((d) => ({ ...d, minDraft: e.target.value }))} fullWidth />
                            <TextField label="đến" type="number" value={draft.maxDraft} onChange={(e) => setDraft((d) => ({ ...d, maxDraft: e.target.value }))} fullWidth />
                        </Stack>
                        <TextField select label="Hiển thị" value={draft.limitDraft} onChange={(e) => setDraft((d) => ({ ...d, limitDraft: e.target.value }))}>
                            {[12, 24, 48].map(n => <MenuItem key={n} value={String(n)}>{n}/trang</MenuItem>)}
                        </TextField>
                        <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                            <Button fullWidth onClick={() => { setDraft({ qDraft: '', sortDraft: 'newest', minDraft: '', maxDraft: '', limitDraft: '12' }); }}>Xoá lọc</Button>
                            <Button variant="contained" fullWidth onClick={applyFilter}>Áp dụng</Button>
                        </Stack>
                    </Stack>
                </Box>
            </Drawer>
        </Box>
    );
}
