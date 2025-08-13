import { Box, Typography, Grid, TextField, MenuItem, Stack, Paper, Button, Pagination, Skeleton, Drawer, Divider, Chip, RadioGroup, FormControlLabel, Radio, Breadcrumbs, Link as MuiLink, useMediaQuery } from "@mui/material";
import Autocomplete from '@mui/material/Autocomplete';
import { useTheme } from '@mui/material/styles';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
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
    const category = params.get('category') || '';
    const minRating = params.get('minRating') || '';

    // responsive
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Load products whenever filters change
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            const page = Number(params.get('page') || 1);
            const res = await api.get("/products", { params: { q, sort, category: category || undefined, minPrice: minPrice || undefined, maxPrice: maxPrice || undefined, minRating: minRating || undefined, page, limit: Number(limit) } });
            const data = Array.isArray(res.data) ? res.data : res.data.data;
            const meta = Array.isArray(res.data) ? { total: data.length, page: 1, limit: data.length } : res.data.meta;
            setProducts(data);
            setTotal(meta.total || 0);
            setLoading(false);
        };
        fetchProducts();
    }, [q, sort, category, minPrice, maxPrice, minRating, params]);

    // Infinite scroll for mobile: increment limit when reaching anchor
    useEffect(() => {
        if (!isMobile) return;
        const anchor = document.getElementById('infinite-anchor');
        if (!anchor) return;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                const current = Number(params.get('limit') || 12);
                const next = Math.min(current + 12, total || current + 12);
                if (next !== current) updateParam('limit', String(next));
            }
        }, { rootMargin: '200px' });
        observer.observe(anchor);
        return () => observer.disconnect();
    }, [isMobile, params, total]);

    // Persist filters to localStorage
    useEffect(() => {
        try {
            if (typeof window === 'undefined') return;
            const saved = {
                q, sort, category, minPrice, maxPrice, limit
            };
            localStorage.setItem('satify_product_list_filters', JSON.stringify(saved));
        } catch {}
    }, [q, sort, category, minPrice, maxPrice, limit]);

    // On first load, if URL has no filters, hydrate from localStorage
    useEffect(() => {
        try {
            if (typeof window === 'undefined') return;
            const hasAny = ['q','sort','category','minPrice','maxPrice','limit'].some(k => params.get(k));
            if (hasAny) return;
            const raw = localStorage.getItem('satify_product_list_filters');
            if (!raw) return;
            const parsed = JSON.parse(raw || '{}') || {};
            const next = new URLSearchParams(params);
            ['q','sort','category','minPrice','maxPrice','limit'].forEach((k) => {
                const v = parsed[k];
                if (v && typeof v === 'string' && v.length > 0) next.set(k, v);
            });
            if ([...next.keys()].length > 0) setParams(next, { replace: true });
        } catch {}
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const list = useMemo(() => products, [products]);

    const updateParam = (key: string, value?: string) => {
        const next = new URLSearchParams(params);
        if (value && value.length > 0) next.set(key, value); else next.delete(key);
        setParams(next, { replace: true });
    };

    // Purchased product ids for badge (logged-in users)
    const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('satify_token') : null;
        if (!token) { setPurchasedIds(new Set()); return; }
        (async () => {
            try {
                const res = await api.get('/orders/me');
                const orders = Array.isArray(res.data) ? res.data : res.data?.data || [];
                const ids = new Set<string>();
                orders.forEach((o: any) => {
                    (o.items || []).forEach((it: any) => {
                        const pid = (it.product && (it.product._id || it.product)) || it.productId;
                        if (pid) ids.add(String(pid));
                    });
                });
                setPurchasedIds(ids);
            } catch {
                setPurchasedIds(new Set());
            }
        })();
    }, []);

    const [filterOpen, setFilterOpen] = useState(false);
    const [sortOpen, setSortOpen] = useState(false);
    const [draft, setDraft] = useState({ qDraft: q, sortDraft: sort, minDraft: minPrice, maxDraft: maxPrice, limitDraft: limit, minRatingDraft: minRating });
    const [searchInput, setSearchInput] = useState(q);

    useEffect(() => { setSearchInput(q); }, [q]);

    const openFilter = () => {
        setDraft({ qDraft: q, sortDraft: sort, minDraft: minPrice, maxDraft: maxPrice, limitDraft: limit, minRatingDraft: minRating });
        setFilterOpen(true);
    };
    const applyFilter = () => {
        const next = new URLSearchParams(params);
        const { qDraft, sortDraft, minDraft, maxDraft, limitDraft, minRatingDraft } = draft;
        const setOrDelete = (k: string, v?: string) => { if (v && v.length > 0) next.set(k, v); else next.delete(k); };
        setOrDelete('q', qDraft);
        setOrDelete('sort', sortDraft);
        setOrDelete('minPrice', minDraft);
        setOrDelete('maxPrice', maxDraft);
        setOrDelete('minRating', minRatingDraft);
        setOrDelete('limit', limitDraft);
        next.delete('page');
        setParams(next, { replace: true });
        setFilterOpen(false);
    };

    const priceRanges = [
        { key: 'lt200', label: '< 200k', min: '', max: '200000' },
        { key: '200to500', label: '200k - 500k', min: '200000', max: '500000' },
        { key: 'gt500', label: '> 500k', min: '500000', max: '' },
    ] as const;

    const fallbackCategories = ['Chó', 'Mèo', 'Phụ kiện', 'Thức ăn', 'Đồ chơi'];
    const dynamicCategories = useMemo(() => {
        const set = new Set<string>();
        products.forEach(p => { if ((p as any).category) set.add((p as any).category); });
        // union with fallback
        fallbackCategories.forEach(c => set.add(c));
        let categories = Array.from(set);
        try {
            const raw = localStorage.getItem('satify_fav_categories');
            if (raw) {
                const fav = JSON.parse(raw) as Record<string, number>;
                categories.sort((a, b) => (fav[b] || 0) - (fav[a] || 0));
            }
        } catch {}
        return categories;
    }, [products]);

    const [serverSuggestions, setServerSuggestions] = useState<string[]>([]);
    useEffect(() => {
        const controller = new AbortController();
        const run = async () => {
            try {
                if (!searchInput || searchInput.length < 2) { setServerSuggestions([]); return; }
                const res = await api.get('/products/suggest', { params: { q: searchInput }, signal: controller.signal });
                const data = Array.isArray(res.data) ? res.data : res.data.data;
                setServerSuggestions(data || []);
            } catch {}
        };
        const t = setTimeout(run, 200);
        return () => { clearTimeout(t); controller.abort(); };
    }, [searchInput]);

    const onSelectCategory = (c: string) => {
        const current = params.get('category') || '';
        updateParam('category', current === c ? '' : c);
        updateParam('page', '1');
    };

    const onSelectPriceRange = (key: typeof priceRanges[number]['key']) => {
        const found = priceRanges.find(r => r.key === key)!;
        // toggle if already selected
        const selected = (minPrice || '') === (found.min || '') && (maxPrice || '') === (found.max || '');
        if (selected) {
            updateParam('minPrice', '');
            updateParam('maxPrice', '');
        } else {
            updateParam('minPrice', found.min);
            updateParam('maxPrice', found.max);
        }
        updateParam('page', '1');
    };

    const isRangeSelected = (r: typeof priceRanges[number]) => (minPrice || '') === (r.min || '') && (maxPrice || '') === (r.max || '');

    const hasActiveFilters = Boolean(
        (q && q.length > 0) ||
        (category && category.length > 0) ||
        (minPrice && minPrice.length > 0) ||
        (maxPrice && maxPrice.length > 0) ||
        (minRating && minRating.length > 0) ||
        sort !== 'newest' ||
        limit !== '12'
    );

    const clearAll = () => {
        const next = new URLSearchParams();
        setParams(next, { replace: true });
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 } }}>
            <Typography variant="h4" mb={2}>Danh sách sản phẩm</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Tìm thấy {total} sản phẩm</Typography>

            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1.5 }}>
                <MuiLink component={RouterLink as any} underline="hover" color="inherit" to="/">Trang chủ</MuiLink>
                <Typography color="text.primary">{category || 'Tất cả sản phẩm'}</Typography>
            </Breadcrumbs>

            {/* Quick filter chips */}
            <Box sx={{ position: { xs: 'sticky', md: 'static' }, top: { xs: 'calc(var(--appbar-height, 72px))', md: 'auto' }, zIndex: (t) => t.zIndex.appBar - 1, bgcolor: 'background.default', py: 1, mb: 2, borderBottom: { xs: 1, md: 0 }, borderColor: 'divider', boxShadow: { xs: 1, md: 'none' } }}>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                    {dynamicCategories.map((c) => (
                        <Chip key={c} label={c} clickable color={category === c ? 'primary' : 'default'} onClick={() => onSelectCategory(c)} />
                    ))}
                    <Chip label="< 200k" clickable color={isRangeSelected(priceRanges[0]) ? 'primary' : 'default'} onClick={() => onSelectPriceRange('lt200')} />
                    <Chip label="200k - 500k" clickable color={isRangeSelected(priceRanges[1]) ? 'primary' : 'default'} onClick={() => onSelectPriceRange('200to500')} />
                    <Chip label="> 500k" clickable color={isRangeSelected(priceRanges[2]) ? 'primary' : 'default'} onClick={() => onSelectPriceRange('gt500')} />
                    {hasActiveFilters && (
                        <Chip label="Xoá tất cả" onClick={clearAll} variant="outlined" color="default" />
                    )}
                </Stack>
            </Box>

            {/* Applied filter badges */}
            {hasActiveFilters && (
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 2 }}>
                    {q && <Chip label={`Từ khóa: ${q}`} onDelete={() => updateParam('q', '')} />}
                    {category && <Chip label={`Danh mục: ${category}`} onDelete={() => updateParam('category', '')} />}
                    {(minPrice || maxPrice) && (
                        <Chip label={`Giá: ${minPrice ? `${Number(minPrice).toLocaleString()}₫` : '0₫'} - ${maxPrice ? `${Number(maxPrice).toLocaleString()}₫` : '∞'}`} onDelete={() => { updateParam('minPrice', ''); updateParam('maxPrice', ''); }} />
                    )}
                    {sort !== 'newest' && <Chip label={`Sắp xếp: ${sort === 'price_asc' ? 'Giá tăng' : 'Giá giảm'}`} onDelete={() => updateParam('sort', 'newest')} />}
                    {minRating && <Chip label={`Đánh giá: ≥ ${minRating}★`} onDelete={() => updateParam('minRating', '')} />}
                    {limit !== '12' && <Chip label={`Hiển thị: ${limit}/trang`} onDelete={() => updateParam('limit', '12')} />}
                </Stack>
            )}

            {/* Desktop/tablet filters */}
            <Paper sx={{ p: 2, mb: 3, display: { xs: 'none', md: 'block' } }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
                    <Autocomplete
                        freeSolo
                        options={serverSuggestions}
                        inputValue={searchInput}
                        onInputChange={(_, v) => setSearchInput(v)}
                        onChange={(_, v) => updateParam('q', String(v || ''))}
                        renderInput={(params) => (
                            <TextField {...params} label="Tìm kiếm" variant="outlined" fullWidth onBlur={() => updateParam('q', searchInput)} />
                        )}
                        sx={{ flex: 1 }}
                    />
                    <TextField select label="Sắp xếp" value={sort} onChange={(e) => updateParam('sort', e.target.value)} sx={{ minWidth: 180 }}>
                        <MenuItem value="newest">Mới nhất</MenuItem>
                        <MenuItem value="price_asc">Giá tăng dần</MenuItem>
                        <MenuItem value="price_desc">Giá giảm dần</MenuItem>
                        <MenuItem value="rating_desc">Điểm cao nhất</MenuItem>
                    </TextField>
                    <TextField label="Giá từ" type="number" value={minPrice} onChange={(e) => updateParam('minPrice', e.target.value)} sx={{ width: 140 }} />
                    <TextField label="đến" type="number" value={maxPrice} onChange={(e) => updateParam('maxPrice', e.target.value)} sx={{ width: 140 }} />
                    <TextField select label="Hiển thị" value={limit} onChange={(e) => updateParam('limit', e.target.value)} sx={{ width: 140 }}>
                        {[12, 24, 48].map(n => <MenuItem key={n} value={String(n)}>{n}/trang</MenuItem>)}
                    </TextField>
                    <Button onClick={() => setParams(new URLSearchParams(), { replace: true })}>Xoá lọc</Button>
                </Stack>
            </Paper>

            {/* Mobile filter/sort triggers */}
            <Stack direction="row" spacing={2} sx={{ display: { xs: 'flex', md: 'none' }, mb: 2 }}>
                <Button variant="outlined" startIcon={<FilterListIcon />} onClick={openFilter}>Bộ lọc</Button>
                <Button variant="outlined" startIcon={<SortIcon />} onClick={() => setSortOpen(true)}>Sắp xếp</Button>
            </Stack>

            {/* Results grid or empty state */}
            {(!loading && list.length === 0) ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography sx={{ mb: 1 }}>Không tìm thấy sản phẩm phù hợp.</Typography>
                    <Button variant="outlined" onClick={() => setParams(new URLSearchParams(), { replace: true })}>Xoá tất cả bộ lọc</Button>
                </Paper>
            ) : (
                <Grid container spacing={2}>
                    {loading ? (
                        Array.from({ length: Number(limit) }).map((_, i) => (
                            <Grid item xs={12} sm={6} md={3} key={i}>
                                <Skeleton variant="rectangular" sx={{ width: '100%', height: { xs: 220, md: 260 } }} />
                            </Grid>
                        ))
                    ) : (
                        list.map((p) => (
                            <Grid item xs={12} sm={6} md={3} key={p._id}>
                                <ProductCard id={p._id} name={p.name} price={p.price} image={p.image} ratingAvg={(p as any).ratingAvg} ratingCount={(p as any).ratingCount} purchased={purchasedIds.has(p._id)} />
                            </Grid>
                        ))
                    )}
                </Grid>
            )}

            <Box mt={3} display={{ xs: 'none', md: 'flex' }} justifyContent="center">
                <Pagination
                    page={Number(params.get('page') || 1)}
                    count={Math.max(1, Math.ceil(total / Number(params.get('limit') || 12)))}
                    onChange={(_, p) => updateParam('page', String(p))}
                    color="primary"
                />
            </Box>

            {/* Infinite scroll on mobile */}
            {isMobile && (
                <Box id="infinite-anchor" />
            )}

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
                            <MenuItem value="rating_desc">Điểm cao nhất</MenuItem>
                        </TextField>
                        <Stack direction="row" spacing={2}>
                            <TextField label="Giá từ" type="number" value={draft.minDraft} onChange={(e) => setDraft((d) => ({ ...d, minDraft: e.target.value }))} fullWidth />
                            <TextField label="đến" type="number" value={draft.maxDraft} onChange={(e) => setDraft((d) => ({ ...d, maxDraft: e.target.value }))} fullWidth />
                        </Stack>
                        <TextField select label="Đánh giá tối thiểu" value={draft.minRatingDraft} onChange={(e) => setDraft((d) => ({ ...d, minRatingDraft: e.target.value }))}>
                            {[5,4.5,4,3.5,3].map(v => <MenuItem key={v} value={String(v)}>{`≥ ${v}★`}</MenuItem>)}
                        </TextField>
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

            {/* Mobile bottom sort drawer */}
            <Drawer anchor="bottom" open={sortOpen} onClose={() => setSortOpen(false)}>
                <Box sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>Sắp xếp</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <RadioGroup
                        value={sort}
                        onChange={(e) => { updateParam('sort', e.target.value); setSortOpen(false); }}
                    >
                        <FormControlLabel value="newest" control={<Radio />} label="Mới nhất" />
                        <FormControlLabel value="price_asc" control={<Radio />} label="Giá tăng dần" />
                        <FormControlLabel value="price_desc" control={<Radio />} label="Giá giảm dần" />
                    </RadioGroup>
                </Box>
            </Drawer>
        </Box>
    );
}
