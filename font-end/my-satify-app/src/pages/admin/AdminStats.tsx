import { useEffect, useState } from "react";
import { Container, Grid, Paper, Typography, Stack, Divider, Chip, LinearProgress } from "@mui/material";
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
          <Paper sx={{ p: 2 }}>
            <Typography variant="overline" color="text.secondary">Người dùng</Typography>
            <Typography variant="h4">{stats.users.total}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="overline" color="text.secondary">Sản phẩm</Typography>
            <Typography variant="h4">{stats.products.total}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="overline" color="text.secondary">Đơn hàng</Typography>
            <Typography variant="h4">{stats.orders.total}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="overline" color="text.secondary">Doanh thu 30 ngày</Typography>
            <Typography variant="h5">{formatCurrency(stats.revenue.last30d)}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Tổng doanh thu</Typography>
            <Typography variant="h5">{formatCurrency(stats.revenue.total)}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Đơn hàng theo trạng thái</Typography>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {statusEntries.length === 0 && <Typography color="text.secondary">Không có dữ liệu</Typography>}
              {statusEntries.map(([status, count]) => (
                <Chip key={status} label={`${status}: ${count}`} />
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
