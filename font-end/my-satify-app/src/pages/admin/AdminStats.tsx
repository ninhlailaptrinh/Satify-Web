import { useEffect, useState } from "react";
import { Container, Grid, Paper, Typography, Stack, Divider, Chip, LinearProgress, Box } from "@mui/material";
import api from "../../api/axiosClient";
import { formatCurrency } from "../../utils/format";
import { useMemo } from "react";
interface RevenueDaily { date: string; total: number }

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
  const [daily, setDaily] = useState<RevenueDaily[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [res, dailyRes] = await Promise.all([
          api.get<StatsResponse>("/stats"),
          api.get<{ data: RevenueDaily[] }>("/stats/revenue_daily", { params: { days: 14 } })
        ]);
        if (mounted) {
          setStats(res.data);
          setDaily(dailyRes.data.data || []);
        }
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

  const kpis = useMemo(() => ([
    { label: 'Người dùng', value: stats.users.total },
    { label: 'Sản phẩm', value: stats.products.total },
    { label: 'Đơn hàng', value: stats.orders.total },
    { label: 'Doanh thu 30 ngày', value: formatCurrency(stats.revenue.last30d) },
  ]), [stats]);

  return (
    <Container disableGutters>
      <Grid container spacing={2}>
        {kpis.map((k, i) => (
          <Grid key={i} item xs={12} md={3}>
            <Paper sx={{ p: 2.5, borderRadius: 3 }}>
              <Typography variant="overline" color="text.secondary">{k.label}</Typography>
              <Typography variant="h4" fontWeight={800}>{k.value}</Typography>
            </Paper>
          </Grid>
        ))}

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight={700}>Doanh thu theo ngày (14 ngày)</Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 160 }}>
              {daily.map((d, idx) => (
                <Box key={idx} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Box sx={{ width: '100%', bgcolor: 'primary.main', borderRadius: 1, height: `${Math.max(6, Math.min(100, d.total))}px`, opacity: 0.8 }} />
                  <Typography variant="caption" sx={{ mt: 0.5 }}>{d.date.slice(5)}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight={700}>Đơn hàng theo trạng thái</Typography>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {statusEntries.length === 0 && <Typography color="text.secondary">Không có dữ liệu</Typography>}
              {statusEntries.map(([status, count]) => (
                <Chip key={status} label={`${status}: ${count}`} variant="outlined" />
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
