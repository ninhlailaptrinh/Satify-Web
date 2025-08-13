import { useEffect, useState } from "react";
import { Container, Grid, Paper, Typography, Stack, Divider, Chip, LinearProgress, Box, Avatar } from "@mui/material";
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PaidIcon from '@mui/icons-material/Paid';
import api from "../../api/axiosClient";
import { formatCurrency } from "../../utils/format";

interface StatsResponse {
  users: { total: number };
  products: { total: number };
  orders: { total: number; byStatus: Record<string, number> };
  revenue: { total: number; last30d: number };
}

export default function AdminStats() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get<StatsResponse>("/stats");
        if (mounted) setStats(res.data);
      } catch (e: any) {
        setError(e?.response?.data?.message || "Không thể tải thống kê");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <LinearProgress sx={{ mt: 2 }} />;
  if (error) return <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>;
  if (!stats) return null;

  const statusEntries = Object.entries(stats.orders.byStatus || {});

  return (
    <Container disableGutters>
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2.5, borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(238,77,45,0.06), rgba(255,179,0,0.06))' }} />
            <Stack direction="row" alignItems="center" spacing={2} sx={{ position: 'relative' }}>
              <Avatar sx={{ bgcolor: 'primary.main', color: 'white' }}>
                <PeopleAltIcon />
              </Avatar>
              <Box>
                <Typography variant="overline" color="text.secondary">Người dùng</Typography>
                <Typography variant="h4" fontWeight={800}>{stats.users.total}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2.5, borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(238,77,45,0.06), rgba(255,179,0,0.06))' }} />
            <Stack direction="row" alignItems="center" spacing={2} sx={{ position: 'relative' }}>
              <Avatar sx={{ bgcolor: 'secondary.main', color: 'white' }}>
                <Inventory2Icon />
              </Avatar>
              <Box>
                <Typography variant="overline" color="text.secondary">Sản phẩm</Typography>
                <Typography variant="h4" fontWeight={800}>{stats.products.total}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2.5, borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(238,77,45,0.06), rgba(255,179,0,0.06))' }} />
            <Stack direction="row" alignItems="center" spacing={2} sx={{ position: 'relative' }}>
              <Avatar sx={{ bgcolor: 'primary.dark', color: 'white' }}>
                <ReceiptLongIcon />
              </Avatar>
              <Box>
                <Typography variant="overline" color="text.secondary">Đơn hàng</Typography>
                <Typography variant="h4" fontWeight={800}>{stats.orders.total}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2.5, borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(238,77,45,0.06), rgba(255,179,0,0.06))' }} />
            <Stack direction="row" alignItems="center" spacing={2} sx={{ position: 'relative' }}>
              <Avatar sx={{ bgcolor: 'success.main', color: 'white' }}>
                <PaidIcon />
              </Avatar>
              <Box>
                <Typography variant="overline" color="text.secondary">Doanh thu 30 ngày</Typography>
                <Typography variant="h6" fontWeight={800}>{formatCurrency(stats.revenue.last30d)}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2.5, borderRadius: 3, background: 'linear-gradient(135deg, #fff, #fff)', position: 'relative' }}>
            <Typography variant="subtitle1" gutterBottom fontWeight={700}>Tổng doanh thu</Typography>
            <Typography variant="h4" fontWeight={800}>{formatCurrency(stats.revenue.total)}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Tính đến hiện tại</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight={700}>Đơn hàng theo trạng thái</Typography>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {statusEntries.length === 0 && <Typography color="text.secondary">Không có dữ liệu</Typography>}
              {statusEntries.map(([status, count]) => (
                <Chip key={status} label={`${status}: ${count}`} color={status === 'completed' ? 'success' : status === 'paid' ? 'primary' : status === 'shipped' ? 'secondary' : status === 'cancelled' ? 'error' : 'default'} variant="outlined" />
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
