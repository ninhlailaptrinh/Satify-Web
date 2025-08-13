import { useEffect, useState } from 'react';
import api from '../../api/axiosClient';
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Select, MenuItem, Stack, TextField, Pagination, Button, Drawer, Divider } from '@mui/material';

interface User { _id: string; name: string; email: string; role: 'user' | 'admin'; createdAt: string; }

export default function AdminUsers() {
  const [list, setList] = useState<User[]>([]);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);

  const load = async () => {
    const res = await api.get('/users', { params: { q: q || undefined, role: role || undefined, page, limit } });
    const payload = Array.isArray(res.data) ? { data: res.data, meta: { total: res.data.length } } : res.data;
    setList(payload.data);
    setTotal(payload.meta.total || payload.data.length);
  };

  useEffect(() => { load(); }, [q, role, page]);

  const exportCsv = async () => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (role) params.set('role', role);
    const url = `${import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'}/users/export?${params.toString()}`;
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${localStorage.getItem('satify_token') || ''}` }, credentials: 'include' });
    if (!res.ok) return alert('Xuất CSV thất bại');
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `users_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const openDetail = (u: User) => { setSelected(u); setOpen(true); };

  const updateRole = async (id: string, role: 'user' | 'admin') => {
    await api.put(`/users/${id}/role`, { role });
    await load();
    if (selected && selected._id === id) setSelected({ ...selected, role } as any);
  };

  return (
    <Box sx={{ p: 4 }}>
      <Paper sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={700}>Quản lý người dùng</Typography>
        <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
          <TextField size="small" placeholder="Tìm kiếm" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
          <TextField select size="small" label="Quyền" value={role} onChange={(e) => { setPage(1); setRole(e.target.value); }} sx={{ minWidth: 160 }}>
            <MenuItem value="">Tất cả</MenuItem>
            <MenuItem value="user">user</MenuItem>
            <MenuItem value="admin">admin</MenuItem>
          </TextField>
          <Button variant="outlined" onClick={exportCsv}>Xuất CSV</Button>
        </Stack>
      </Paper>
      <Paper sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tên</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Quyền</TableCell>
              <TableCell>Ngày tạo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {list.map(u => (
              <TableRow key={u._id} hover sx={{ cursor: 'pointer' }} onClick={() => openDetail(u)}>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Select size="small" value={u.role} onChange={(e) => updateRole(u._id, e.target.value as any)}>
                    <MenuItem value="user">user</MenuItem>
                    <MenuItem value="admin">admin</MenuItem>
                  </Select>
                </TableCell>
                <TableCell>{new Date(u.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Box display="flex" justifyContent="center" mt={2}>
        <Pagination page={page} count={Math.max(1, Math.ceil(total / limit))} onChange={(_, p) => setPage(p)} />
      </Box>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: { xs: 320, sm: 400 }, p: 2 }} role="presentation">
          <Typography variant="h6" fontWeight={700}>Chi tiết người dùng</Typography>
          <Divider sx={{ my: 1 }} />
          {!selected ? (
            <Typography color="text.secondary">Chọn người dùng để xem</Typography>
          ) : (
            <Stack spacing={1.5}>
              <Typography variant="body2"><b>Tên:</b> {selected.name}</Typography>
              <Typography variant="body2"><b>Email:</b> {selected.email}</Typography>
              <Typography variant="body2"><b>Vai trò:</b> {selected.role}</Typography>
              <TextField select size="small" label="Cập nhật vai trò" value={selected.role} onChange={(e) => updateRole(selected._id, e.target.value as any)}>
                <MenuItem value="user">user</MenuItem>
                <MenuItem value="admin">admin</MenuItem>
              </TextField>
              <Typography variant="body2"><b>Ngày tạo:</b> {new Date(selected.createdAt).toLocaleString()}</Typography>
            </Stack>
          )}
        </Box>
      </Drawer>
    </Box>
  );
}
