import { Card, CardContent, Typography, CardActions, Button, Box, IconButton, Tooltip, Stack, Rating } from "@mui/material";
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../utils/format";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

interface ProductCardProps {
    id?: string;
    name: string;
    price: number;
    image: string;
    ratingAvg?: number;
    ratingCount?: number;
}

export default function ProductCard({ id, name, price, image, ratingAvg, ratingCount }: ProductCardProps) {
    const navigate = useNavigate();
    const { add } = useCart();
    const { isFav, toggle } = useWishlist();

    const handleBuyNow = () => {
        add({ productId: id, name, price, image, qty: 1 });
        navigate('/cart');
    };

    return (
        <Card sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', ':hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.12)' } }}>
            <Box sx={{ position: 'relative', width: '100%', pt: { xs: '100%', sm: '75%', md: '66.66%' }, overflow: 'hidden' }}>
                <img src={image} alt={name} loading="lazy" decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                <Box sx={{ position: 'absolute', top: 4, right: 4 }}>
                    <Tooltip title={isFav(id) ? 'Bỏ yêu thích' : 'Yêu thích'}>
                        <IconButton size="small" color={isFav(id) ? 'error' : 'default'} onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggle(id); }}>
                            {isFav(id) ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
            <CardContent sx={{ flex: '0 0 auto' }}>
                <Typography variant="subtitle1" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 48 }}>{name}</Typography>
                {typeof ratingAvg === 'number' && typeof ratingCount === 'number' && (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                        <Rating value={Number(ratingAvg)} precision={0.5} size="small" readOnly />
                        <Typography variant="caption" color="text.secondary">({ratingCount})</Typography>
                    </Stack>
                )}
                <Typography color="text.primary" sx={{ mt: 0.5, fontWeight: 700 }}>{formatCurrency(price)}</Typography>
            </CardContent>
            <CardActions sx={{ mt: 'auto', pt: 0, pb: 2, px: 2, gap: 1 }}>
                <Button fullWidth size="small" onClick={() => id && navigate(`/products/${id}`)}>Chi tiết</Button>
                <Button fullWidth size="small" variant="contained" onClick={handleBuyNow}>Mua</Button>
            </CardActions>
        </Card>
    );
}
