import { useEffect, useState } from 'react';
import api from '../../api/axiosClient';
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Chip, MenuItem, Select, TextField, Stack, Pagination, Button, Drawer, Divider } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';

interface OrderItem { product: string; qty: number; price: number; }
interface Order { _id: string; total: number; status: string; createdAt: string; user?: { name: string; email: string } | string; items: OrderItem[]; }

export default function AdminOrders() {
  const [list, setList] = useState<Order[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sum, setSum] = useState(0);
  const limit = 10;
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Order | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const load = async () => {
    const res = await api.get('/orders', { params: { page, limit, q: q || undefined, status: status || undefined } });
    const payload = Array.isArray(res.data) ? { data: res.data, meta: { total: res.data.length } } : res.data;
    setList(payload.data);
    setTotal(payload.meta.total || payload.data.length);
    setSum(payload.meta.sum || 0);
  };

  useEffect(() => { load(); }, [q, status, page]);

  const exportCsv = async () => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status) params.set('status', status);
    const url = `${import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'}/orders/export?${params.toString()}`;
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${localStorage.getItem('satify_token') || ''}` }, credentials: 'include' });
    if (!res.ok) return alert('Xuất CSV thất bại');
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `orders_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const openDetail = async (id: string) => {
    setOpen(true);
    setLoadingDetail(true);
    try {
      const res = await api.get(`/orders/${id}`);
      setSelected(res.data as Order);
    } catch {
      setSelected(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const changeStatus = async (id: string, status: string) => {
    await api.put(`/orders/${id}/status`, { status });
    await load();
    if (selected && selected._id === id) setSelected({ ...selected, status } as any);
  };

  const color = (s: string) => s === 'created' ? 'default' : s === 'paid' ? 'primary' : s === 'shipped' ? 'secondary' : s === 'completed' ? 'success' : 'error';

  return (
    <Box sx={{ p: 4 }}>
      <Paper sx={{ p: 2, mb: 2, display: 'flex', alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', gap: 2, borderRadius: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700}>Quản lý đơn hàng</Typography>
          <Typography variant="body2" color="text.secondary">Tổng: {total} • Doanh thu: {sum.toLocaleString()}₫</Typography>
        </Stack>
        <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
          <TextField size="small" placeholder="Tìm kiếm theo mã/khách" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
          <TextField select size="small" label="Trạng thái" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} sx={{ minWidth: 160 }}>
            <MenuItem value="">Tất cả</MenuItem>
            {['created','paid','shipped','completed','cancelled'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <Button variant="outlined" onClick={exportCsv}>Xuất CSV</Button>
        </Stack>
      </Paper>
      <Paper sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Mã đơn</TableCell>
              <TableCell>Người mua</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Tổng</TableCell>
              <TableCell>Thời gian</TableCell>
              <TableCell>Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {list.map(o => (
              <TableRow key={o._id} hover sx={{ cursor: 'pointer' }} onClick={() => openDetail(o._id)}>
                <TableCell>{o._id}</TableCell>
                <TableCell>{typeof o.user === 'string' ? o.user : `${o.user?.name} (${o.user?.email})`}</TableCell>
                <TableCell><Chip label={o.status} color={color(o.status) as any} /></TableCell>
                <TableCell>{o.total.toLocaleString()}₫</TableCell>
                <TableCell>{new Date(o.createdAt).toLocaleString()}</TableCell>
                <TableCell>
                  <Select size="small" value={o.status} onChange={(e: SelectChangeEvent) => changeStatus(o._id, e.target.value)}>
                    {['created','paid','shipped','completed','cancelled'].map(s => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Box display="flex" justifyContent="center" mt={2}>
        <Pagination page={page} count={Math.max(1, Math.ceil(total / limit))} onChange={(_, p) => setPage(p)} />
      </Box>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: { xs: 360, sm: 440 }, p: 2 }} role="presentation">
          <Typography variant="h6" fontWeight={700}>Chi tiết đơn hàng</Typography>
          <Divider sx={{ my: 1 }} />
          {!selected || loadingDetail ? (
            <Typography color="text.secondary">Đang tải...</Typography>
          ) : (
            <Stack spacing={1.5}>
              <Typography variant="body2"><b>Mã:</b> {selected._id}</Typography>
              <Typography variant="body2"><b>Khách:</b> {typeof selected.user === 'string' ? selected.user : `${(selected.user as any)?.name} (${(selected.user as any)?.email})`}</Typography>
              <Typography variant="body2"><b>Tổng:</b> {selected.total.toLocaleString()}₫</Typography>
              <Typography variant="body2"><b>Trạng thái:</b> <Chip size="small" label={selected.status} color={color(selected.status) as any} /></Typography>
              <TextField select size="small" label="Cập nhật trạng thái" value={selected.status} onChange={(e) => changeStatus(selected._id, e.target.value)}>
                {['created','paid','shipped','completed','cancelled'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
              <Divider />
              <Typography fontWeight={700}>Sản phẩm</Typography>
              <Stack spacing={1}>
                {(selected.items || []).map((it, idx) => (
                  <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{(it as any).product?.name || (it as any).product}</Typography>
                    <Typography variant="body2">x{it.qty} · {(it.price).toLocaleString()}₫</Typography>
                  </Box>
                ))}
              </Stack>
            </Stack>
          )}
        </Box>
      </Drawer>
    </Box>
  );
}
