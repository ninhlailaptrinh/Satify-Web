import { Card, CardContent, Typography, CardActions, Button, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../utils/format";
import { useCart } from "../context/CartContext";

interface ProductCardProps {
    id?: string;
    name: string;
    price: number;
    image: string;
}

export default function ProductCard({ id, name, price, image }: ProductCardProps) {
    const navigate = useNavigate();
    const { add } = useCart();

    const handleBuyNow = () => {
        add({ productId: id, name, price, image, qty: 1 });
        navigate('/cart');
    };

    return (
        <Card sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', ':hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.12)' } }}>
            <Box sx={{ position: 'relative', width: '100%', pt: { xs: '100%', sm: '75%', md: '66.66%' }, overflow: 'hidden' }}>
                <img src={image} alt={name} loading="lazy" decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            </Box>
            <CardContent sx={{ flex: '0 0 auto' }}>
                <Typography variant="subtitle1" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 48 }}>{name}</Typography>
                <Typography color="text.primary" sx={{ mt: 0.5, fontWeight: 700 }}>{formatCurrency(price)}</Typography>
            </CardContent>
            <CardActions sx={{ mt: 'auto', pt: 0, pb: 2, px: 2, gap: 1 }}>
                <Button fullWidth size="small" onClick={() => id && navigate(`/products/${id}`)}>Chi tiết</Button>
                <Button fullWidth size="small" variant="contained" onClick={handleBuyNow}>Mua</Button>
            </CardActions>
        </Card>
    );
}
