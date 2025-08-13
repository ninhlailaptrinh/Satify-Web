import { useEffect, useState } from 'react';
import api from '../../api/axiosClient';
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Select, MenuItem, Stack, TextField, Pagination } from '@mui/material';

interface User { _id: string; name: string; email: string; role: 'user' | 'admin'; createdAt: string; }

export default function AdminUsers() {
  const [list, setList] = useState<User[]>([]);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const load = async () => {
    const res = await api.get('/users', { params: { q: q || undefined, role: role || undefined, page, limit } });
    const payload = Array.isArray(res.data) ? { data: res.data, meta: { total: res.data.length } } : res.data;
    setList(payload.data);
    setTotal(payload.meta.total || payload.data.length);
  };

  useEffect(() => { load(); }, [q, role, page]);

  const updateRole = async (id: string, role: 'user' | 'admin') => {
    await api.put(`/users/${id}/role`, { role });
    await load();
  };

  return (
    <Box sx={{ p: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Quản lý người dùng</Typography>
        <Stack direction="row" spacing={2}>
          <TextField size="small" placeholder="Tìm kiếm" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
          <TextField select size="small" label="Quyền" value={role} onChange={(e) => { setPage(1); setRole(e.target.value); }} sx={{ minWidth: 160 }}>
            <MenuItem value="">Tất cả</MenuItem>
            <MenuItem value="user">user</MenuItem>
            <MenuItem value="admin">admin</MenuItem>
          </TextField>
        </Stack>
      </Stack>
      <Paper>
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
              <TableRow key={u._id}>
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
    </Box>
  );
}
