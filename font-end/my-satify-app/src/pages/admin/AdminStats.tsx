import { useEffect, useState } from "react";
import { Container, Grid, Paper, Typography, Stack, Divider, Chip, LinearProgress, Box, TextField, MenuItem, Tooltip, Switch, FormControlLabel } from "@mui/material";
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
  const [bestCategory, setBestCategory] = useState<string>('');
  const [dailyDays, setDailyDays] = useState<number>(14);
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [barWidth, setBarWidth] = useState<number>(12);
  const [barScheme, setBarScheme] = useState<'orange' | 'blue'>('orange');
  const [showAvg, setShowAvg] = useState<boolean>(true);

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

  // fetch best sellers when category changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const bestRes = await api.get<{ data: BestSeller[] }>("/products/best_sellers", { params: { limit: 8, category: bestCategory || undefined } });
        if (mounted) setBest((bestRes.data as any).data || (bestRes.data as any) || []);
      } catch {}
    })();
    return () => { mounted = false; };
  }, [bestCategory]);

  // fetch revenue daily when range changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const params: any = {};
        if (from && to) { params.from = from; params.to = to; }
        else { params.days = dailyDays; }
        const dailyRes = await api.get<{ data: RevenueDaily[] }>("/stats/revenue_daily", { params });
        if (mounted) setDaily(dailyRes.data.data || []);
      } catch {}
    })();
    return () => { mounted = false; };
  }, [dailyDays, from, to]);

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
            <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between" sx={{ mb: 1 }} spacing={1}>
              <Typography variant="subtitle1" fontWeight={700}>Doanh thu theo ngày</Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                <TextField size="small" type="date" label="Từ" InputLabelProps={{ shrink: true }} value={from} onChange={(e) => setFrom(e.target.value)} />
                <TextField size="small" type="date" label="Đến" InputLabelProps={{ shrink: true }} value={to} onChange={(e) => setTo(e.target.value)} />
                <TextField size="small" select value={dailyDays} onChange={(e) => setDailyDays(Number(e.target.value))} disabled={!!(from && to)}>
                  {[7,14,30,60].map((d) => <MenuItem key={d} value={d}>{d} ngày</MenuItem>)}
                </TextField>
                <TextField size="small" type="number" label="Độ dày" value={barWidth} onChange={(e) => setBarWidth(Math.max(6, Math.min(24, Number(e.target.value) || 12)))} inputProps={{ min: 6, max: 24 }} sx={{ width: 110 }} />
                <TextField size="small" select label="Màu" value={barScheme} onChange={(e) => setBarScheme(e.target.value as any)} sx={{ width: 130 }}>
                  <MenuItem value="orange">Cam</MenuItem>
                  <MenuItem value="blue">Xanh</MenuItem>
                </TextField>
                <FormControlLabel control={<Switch checked={showAvg} onChange={(e) => setShowAvg(e.target.checked)} />} label="Đường TB" sx={{ ml: 1 }} />
              </Stack>
            </Stack>
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 0.75, height: 220, overflowX: 'auto', pb: 1 }}>
              {(() => {
                const chartHeight = 180; // px for column area
                const bw = Math.max(6, Math.min(24, barWidth));
                if (!daily.length) {
                  return <Typography variant="body2" color="text.secondary">Không có dữ liệu</Typography>;
                }
                const maxTotal = Math.max(1, ...daily.map((d) => d.total));
                const avg = daily.reduce((s, d) => s + d.total, 0) / daily.length;
                const avgH = avg > 0 ? Math.max(0, Math.round((avg / maxTotal) * chartHeight)) : 0;

                return (
                  <>
                    {/* Average line */}
                    {showAvg && avgH > 0 && (
                      <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: `${avgH}px`, height: 0 }}>
                        <Box sx={{ borderTop: '2px dashed', borderColor: 'secondary.main' }} />
                        <Typography variant="caption" sx={{ position: 'absolute', right: 0, transform: 'translateY(-100%)', bgcolor: 'background.paper', px: 0.5, borderRadius: 0.5, color: 'text.secondary' }}>
                          Trung bình: {formatCurrency(Math.round(avg))}
                        </Typography>
                      </Box>
                    )}

                    {/* Bars */}
                    {daily.map((d, idx) => {
                      const h = Math.max(4, Math.round((d.total / maxTotal) * chartHeight));
                      const bg = barScheme === 'orange' ? 'linear-gradient(180deg, #ffb300, #ee4d2d)' : 'linear-gradient(180deg, #64b5f6, #1976d2)';
                      return (
                        <Box key={idx} sx={{ width: bw, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Tooltip title={`${d.date}: ${formatCurrency(d.total)}`} arrow>
                            <Box sx={{ width: '100%', height: `${h}px`, borderRadius: 1,
                              background: bg,
                              boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
                            }} />
                          </Tooltip>
                          <Typography variant="caption" sx={{ mt: 0.5, whiteSpace: 'nowrap' }}>{d.date.slice(5)}</Typography>
                        </Box>
                      );
                    })}
                  </>
                );
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
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle1" gutterBottom fontWeight={700}>Top bán chạy</Typography>
              <TextField size="small" select value={bestCategory} onChange={(e) => setBestCategory(e.target.value)} sx={{ minWidth: 180 }}>
                <MenuItem value="">Tất cả danh mục</MenuItem>
                {['Chó','Mèo','Phụ kiện','Thức ăn','Đồ chơi','general'].map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </TextField>
            </Stack>
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
