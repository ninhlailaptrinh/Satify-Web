import { useEffect, useState } from "react";
import api from "../api/axiosClient";
import { Box, Typography, Card, CardContent, Chip, Stack, Grid, Divider, Avatar, Button } from "@mui/material";
import { formatCurrency } from "../utils/format";

interface OrderItem { product: string; qty: number; price: number; }
interface OrderDto { _id: string; total: number; status: string; createdAt: string; items: OrderItem[]; }

export default function MyOrders() {
  const [orders, setOrders] = useState<OrderDto[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/orders/me');
        setOrders(res.data);
      } catch (err: any) {
        // ignore
      }
    };
    load();
  }, []);

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" mb={2}>Đơn hàng của tôi</Typography>
      <Stack spacing={2}>
        {orders.map(o => (
          <Card key={o._id}>
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between">
                <Typography fontWeight={600}>Mã đơn: {o._id}</Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Chip label={o.status} color={o.status === 'created' ? 'default' : o.status === 'paid' ? 'primary' : o.status === 'shipped' ? 'secondary' : o.status === 'completed' ? 'success' : 'error'} />
                  <Typography variant="body2" color="text.secondary">{new Date(o.createdAt).toLocaleString()}</Typography>
                </Stack>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                {o.items.map((it, idx) => (
                  <Grid item xs={12} md={6} key={idx}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar variant="rounded" src={(it as any).product?.image} sx={{ width: 56, height: 56 }} />
                      <Box>
                        <Typography fontWeight={600}>{(it as any).product?.name || 'Sản phẩm'}</Typography>
                        <Typography variant="body2" color="text.secondary">{it.qty} x {formatCurrency(it.price)}</Typography>
                      </Box>
                    </Stack>
                  </Grid>
                ))}
              </Grid>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} sx={{ mt: 2 }}>
                <Typography fontWeight={700}>Tổng: {formatCurrency(o.total)}</Typography>
                <Stack direction="row" spacing={1}>
                  <Button size="small" variant="outlined" href={`/orders/${o._id}`}>Xem chi tiết</Button>
                  {(o.status === 'created' || o.status === 'paid') && <Button size="small" variant="contained" color="primary" href={`/orders/${o._id}`}>Theo dõi</Button>}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
        {orders.length === 0 && (
          <Typography>Chưa có đơn hàng.</Typography>
        )}
      </Stack>
    </Box>
  );
}
