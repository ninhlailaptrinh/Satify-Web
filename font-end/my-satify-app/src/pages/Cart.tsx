import { Box, Typography, Grid, Card, CardContent, CardMedia, Button, Stack } from "@mui/material";
import api from "../api/axiosClient";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../utils/format";
import { useToast } from "../context/ToastContext";

export default function Cart() {
  const { items, totalAmount, changeQty, remove, clear } = useCart();
  const { showToast } = useToast();

  const checkout = async () => {
    if (items.length === 0) return;
    try {
      const payload = { items: items.map(i => ({ product: i.productId, qty: i.qty, price: i.price })) };
      await api.post('/orders', payload);
      showToast('Đặt hàng thành công', 'success');
      clear();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Vui lòng đăng nhập để đặt hàng', 'error');
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" mb={2}>Giỏ hàng</Typography>
      <Grid container spacing={2}>
        {items.map((i, idx) => (
          <Grid item key={idx} xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardMedia component="img" height={180} image={i.image} />
              <CardContent>
                <Typography variant="h6" noWrap title={i.name}>{i.name}</Typography>
                <Typography color="text.secondary">{formatCurrency(i.price)} x {i.qty}</Typography>
                <Stack direction="row" spacing={1} mt={1}>
                  <Button size="small" variant="outlined" onClick={() => changeQty(i.productId, i.name, -1)}>-</Button>
                  <Button size="small" variant="outlined" onClick={() => changeQty(i.productId, i.name, +1)}>+</Button>
                  <Button size="small" color="error" variant="outlined" onClick={() => remove(i.productId, i.name)}>Xóa</Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box mt={3} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Tổng: {formatCurrency(totalAmount)}</Typography>
        <Button sx={{ mt: 1 }} variant="contained" onClick={checkout} disabled={items.length === 0}>Thanh toán</Button>
      </Box>
    </Box>
  );
}
