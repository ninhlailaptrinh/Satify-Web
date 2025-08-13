import { useEffect, useState } from "react";
import {
    Box,
    Container,
    Grid,
    Typography,
    Button,
    Stack,
    TextField,
    MenuItem,
} from "@mui/material";
import ProductCard from "../components/ProductCard";
import { useWishlist } from "../context/WishlistContext";
import api from "../api/axiosClient";

interface Product {
    _id: string;
    name: string;
    price: number;
    image: string;
}

export default function Favorites() {
    const { ids } = useWishlist();
    const [items, setItems] = useState<Product[]>([]);
    const [shareUrl, setShareUrl] = useState("");
    const [_shareToken, setShareToken] = useState("");
    const [ttl, setTtl] = useState(60); // minutes

    useEffect(() => {
        if (ids.length === 0) {
            setItems([]);
            return;
        }

        const fetchProducts = async () => {
            try {
                const res = await api.get("/products", {
                    params: { ids: ids.join(","), limit: ids.length },
                });
                const data: Product[] = Array.isArray(res.data)
                    ? res.data
                    : res.data?.data || [];
                setItems(data);
            } catch {
                setItems([]);
            }
        };

        fetchProducts();
    }, [ids]);

    const generateShare = async () => {
        try {
            const res = await api.post("/users/me/wishlist_share", {
                ttlMinutes: ttl,
            });
            const token = res.data?.token;

            if (typeof window === "undefined") return;
            const uid = localStorage.getItem("satify_user_id");
            if (!uid || !token) return;

            setShareToken(token);
            setShareUrl(`${window.location.origin}/favorites/${uid}?token=${token}`);
        } catch {}
    };

    const revokeShare = async () => {
        try {
            await api.delete("/users/me/wishlist_share");
            setShareToken("");
            setShareUrl("");
        } catch {}
    };

    const copyToClipboard = async () => {
        if (navigator?.clipboard && shareUrl) {
            try {
                await navigator.clipboard.writeText(shareUrl);
            } catch {}
        }
    };

    return (
        <Container sx={{ py: 4 }}>
            <Stack
                direction={{ xs: "column", md: "row" }}
                alignItems={{ md: "center" }}
                justifyContent="space-between"
                sx={{ mb: 2 }}
                spacing={2}
            >
                <Typography variant="h4">Yêu thích</Typography>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    alignItems={{ sm: "center" }}
                >
                    <Typography color="text.secondary">
                        {items.length} sản phẩm
                    </Typography>
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        alignItems={{ sm: "center" }}
                    >
                        <TextField
                            select
                            size="small"
                            value={ttl}
                            onChange={(e) => setTtl(Number(e.target.value))}
                            sx={{ width: 160 }}
                        >
                            <MenuItem value={60}>Hết hạn: 1 giờ</MenuItem>
                            <MenuItem value={60 * 24}>Hết hạn: 1 ngày</MenuItem>
                            <MenuItem value={60 * 24 * 7}>Hết hạn: 7 ngày</MenuItem>
                        </TextField>

                        <Button variant="outlined" onClick={generateShare}>
                            Tạo link chia sẻ
                        </Button>

                        {shareUrl && (
                            <Button variant="text" color="error" onClick={revokeShare}>
                                Thu hồi link
                            </Button>
                        )}

                        {shareUrl && (
                            <Stack direction="row" spacing={1} alignItems="center">
                                <TextField
                                    size="small"
                                    value={shareUrl}
                                    InputProps={{ readOnly: true }}
                                    sx={{ width: { xs: "100%", sm: 360 } }}
                                    onFocus={(e) => e.currentTarget.select()}
                                />
                                <Button variant="outlined" onClick={copyToClipboard}>
                                    Copy
                                </Button>
                            </Stack>
                        )}
                    </Stack>
                </Stack>
            </Stack>

            {items.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 6 }}>
                    <Typography>Bạn chưa thêm sản phẩm yêu thích nào.</Typography>
                </Box>
            ) : (
                <Grid container spacing={2}>
                    {items.map((p) => (
                        <Grid item xs={12} sm={6} md={3} key={p._id}>
                            <ProductCard
                                id={p._id}
                                name={p.name}
                                price={p.price}
                                image={p.image}
                            />
                        </Grid>
                    ))}
                </Grid>
            )}
        </Container>
    );
}
