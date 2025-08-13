import { useEffect, useState } from 'react';
import api from '../../api/axiosClient';
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Chip, MenuItem, Select, TextField, Stack, Pagination } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';

interface OrderItem { product: string; qty: number; price: number; }
interface Order { _id: string; total: number; status: string; createdAt: string; user?: { name: string; email: string } | string; items: OrderItem[]; }

export default function AdminOrders() {
  const [list, setList] = useState<Order[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const load = async () => {
    const res = await api.get('/orders', { params: { page, limit, q: q || undefined, status: status || undefined } });
    const payload = Array.isArray(res.data) ? { data: res.data, meta: { total: res.data.length } } : res.data;
    setList(payload.data);
    setTotal(payload.meta.total || payload.data.length);
  };

  useEffect(() => { load(); }, [q, status, page]);

  const changeStatus = async (id: string, status: string) => {
    await api.put(`/orders/${id}/status`, { status });
    await load();
  };

  const color = (s: string) => s === 'created' ? 'default' : s === 'paid' ? 'primary' : s === 'shipped' ? 'secondary' : s === 'completed' ? 'success' : 'error';

  return (
    <Box sx={{ p: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Quản lý đơn hàng</Typography>
        <Stack direction="row" spacing={2}>
          <TextField size="small" placeholder="Tìm kiếm theo mã/khách" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
          <TextField select size="small" label="Trạng thái" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} sx={{ minWidth: 160 }}>
            <MenuItem value="">Tất cả</MenuItem>
            {['created','paid','shipped','completed','cancelled'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        </Stack>
      </Stack>
      <Paper>
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
              <TableRow key={o._id}>
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
    </Box>
  );
}
