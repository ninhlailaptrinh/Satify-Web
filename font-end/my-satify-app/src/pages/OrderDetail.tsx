import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axiosClient';
import { Box, Typography, Paper, Stack, Chip, Divider, Grid, Avatar, Skeleton, Button } from '@mui/material';
import { formatCurrency } from '../utils/format';

interface OrderItem { product: { _id: string; name: string; image: string }; qty: number; price: number; }
interface OrderDto { _id: string; total: number; status: string; createdAt: string; user?: { name: string; email: string }; items: OrderItem[]; shippingAddress?: { name?: string; phone?: string; address?: string; note?: string }; trackingNumber?: string; carrier?: string; estimateDeliveryDate?: string; shippedAt?: string; deliveredAt?: string; }

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data);
      } finally { setLoading(false); }
    };
    load();
  }, [id]);

  if (loading) return (
    <Box sx={{ p: 4 }}>
      <Skeleton variant="rectangular" height={120} />
      <Skeleton sx={{ mt: 2 }} />
      <Skeleton />
    </Box>
  );

  if (!order) return <Box sx={{ p: 4 }}><Typography>Không tìm thấy đơn hàng</Typography></Box>;

  const steps = ['created','paid','shipped','completed'];
    Math.max(0, steps.indexOf(order.status));
    return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" gutterBottom>Chi tiết đơn hàng</Typography>
      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
          <Stack>
            <Typography fontWeight={700}>Mã đơn: {order._id}</Typography>
            <Typography variant="body2" color="text.secondary">{new Date(order.createdAt).toLocaleString()}</Typography>
            {order.user && <Typography variant="body2">Khách: {order.user.name} ({order.user.email})</Typography>}
            {order.shippingAddress && (
              <>
                <Typography variant="body2">Người nhận: {order.shippingAddress.name} • {order.shippingAddress.phone}</Typography>
                <Typography variant="body2">Địa chỉ: {order.shippingAddress.address}</Typography>
                {order.shippingAddress.note && <Typography variant="body2" color="text.secondary">Ghi chú: {order.shippingAddress.note}</Typography>}
              </>
            )}
          </Stack>
          <Chip label={order.status} color={order.status === 'created' ? 'default' : order.status === 'paid' ? 'primary' : order.status === 'shipped' ? 'secondary' : order.status === 'completed' ? 'success' : 'error'} />
        </Stack>
        <Divider sx={{ my: 2 }} />
        {(order.trackingNumber || order.carrier || order.estimateDeliveryDate) && (
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
            {order.carrier && <Chip label={`ĐVVC: ${order.carrier}`} />}
            {order.trackingNumber && <Chip label={`Mã vận đơn: ${order.trackingNumber}`} />}
            {order.estimateDeliveryDate && <Chip label={`Dự kiến: ${new Date(order.estimateDeliveryDate).toLocaleDateString()}`} />}
          </Stack>
        )}
        <Grid container spacing={2}>
          {order.items.map((it, idx) => (
            <Grid item xs={12} md={6} key={idx}>
              <Stack direction="row" spacing={2}>
                <Avatar variant="rounded" src={it.product?.image} sx={{ width: 56, height: 56 }} />
                <Box>
                  <Typography fontWeight={600}>{it.product?.name || 'Sản phẩm'}</Typography>
                  <Typography variant="body2" color="text.secondary">{it.qty} x {formatCurrency(it.price)}</Typography>
                </Box>
              </Stack>
            </Grid>
          ))}
        </Grid>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} sx={{ mt: 2 }}>
          <Typography fontWeight={700}>Tổng: {formatCurrency(order.total)}</Typography>
          <Stack direction="row" spacing={1}>
            {order.status === 'created' && <Button variant="contained">Thanh toán</Button>}
            {(order.status === 'paid' || order.status === 'shipped') && <Button variant="outlined">Theo dõi vận chuyển</Button>}
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
