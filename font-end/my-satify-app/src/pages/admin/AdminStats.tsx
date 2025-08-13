import { useEffect, useState } from "react";
import { Container, Grid, Paper, Typography, Stack, Divider, Chip, LinearProgress, Box, TextField, MenuItem } from "@mui/material";
import api from "../../api/axiosClient";
import { formatCurrency } from "../../utils/format";
interface RevenueDaily { date: string; total: number }
interface BestSeller { _id: string; name: string; image?: string; price?: number; qtySold: number; revenue: number }

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
  const [best, setBest] = useState<BestSeller[]>([]);
  const [dailyDays, setDailyDays] = useState<number>(14);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [res, bestRes] = await Promise.all([
          api.get<StatsResponse>("/stats"),
          api.get<{ data: BestSeller[] }>("/products/best_sellers", { params: { limit: 8 } })
        ]);
        if (mounted) {
          setStats(res.data);
          setBest((bestRes.data as any).data || (bestRes.data as any) || []);
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || "Không thể tải thống kê");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // fetch revenue daily when range changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const dailyRes = await api.get<{ data: RevenueDaily[] }>("/stats/revenue_daily", { params: { days: dailyDays } });
        if (mounted) setDaily(dailyRes.data.data || []);
      } catch {}
    })();
    return () => { mounted = false; };
  }, [dailyDays]);

  if (loading) return <LinearProgress sx={{ mt: 2 }} />;
  if (error) return <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>;
  if (!stats) return null;

  const statusEntries = Object.entries(stats.orders.byStatus || {});
  const kpis = [
    { label: 'Người dùng', value: stats.users.total },
    { label: 'Sản phẩm', value: stats.products.total },
    { label: 'Đơn hàng', value: stats.orders.total },
    { label: 'Doanh thu 30 ngày', value: formatCurrency(stats.revenue.last30d) },
  ];

  return (
    <Container disableGutters>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2.5, borderRadius: 3 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} divider={<Divider orientation={"vertical"} flexItem sx={{ display: { xs: 'none', md: 'block' } }} />} spacing={{ xs: 1.5, md: 0 }}>
              {kpis.map((k, i) => (
                <Box key={i} sx={{ flex: 1 }}>
                  <Typography variant="overline" color="text.secondary">{k.label}</Typography>
                  <Typography variant="h4" fontWeight={800}>{k.value}</Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2.5, borderRadius: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="subtitle1" fontWeight={700}>Doanh thu theo ngày</Typography>
              <TextField size="small" select value={dailyDays} onChange={(e) => setDailyDays(Number(e.target.value))}>
                {[7,14,30,60].map((d) => <MenuItem key={d} value={d}>{d} ngày</MenuItem>)}
              </TextField>
            </Stack>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 200 }}>
              {(() => {
                const maxTotal = Math.max(1, ...daily.map((d) => d.total));
                return daily.map((d, idx) => {
                  const h = Math.max(4, Math.round((d.total / maxTotal) * 176));
                  return (
                    <Box key={idx} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Box sx={{ width: '100%', bgcolor: 'primary.main', borderRadius: 1, height: `${h}px`, opacity: 0.9 }} />
                      <Typography variant="caption" sx={{ mt: 0.5 }}>{d.date.slice(5)}</Typography>
                    </Box>
                  );
                });
              })()}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
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

        <Grid item xs={12}>
          <Paper sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight={700}>Top bán chạy</Typography>
            <Divider sx={{ my: 1 }} />
            <Stack spacing={1.25}>
              {best.length === 0 && <Typography color="text.secondary">Chưa có dữ liệu</Typography>}
              {best.map((p) => (
                <Box key={p._id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 56, height: 56, bgcolor: '#f5f5f5', borderRadius: 1, overflow: 'hidden', flexShrink: 0 }}>
                    {p.image ? (
                      <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : null}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body1" fontWeight={600} noWrap>{p.name}</Typography>
                    {typeof p.price === 'number' && (
                      <Typography variant="caption" color="text.secondary">{formatCurrency(p.price)}</Typography>
                    )}
                  </Box>
                  <Box sx={{ ml: 'auto', textAlign: 'right' }}>
                    <Typography variant="body2">SL: {p.qtySold}</Typography>
                    <Typography variant="caption" color="text.secondary">DT: {formatCurrency(p.revenue || 0)}</Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
