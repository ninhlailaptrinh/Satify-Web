import { useEffect, useState } from 'react';
import api from '../../api/axiosClient';
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Stack, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, Pagination } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageUploader from '../../components/ImageUploader';

interface Product { _id: string; name: string; price: number; image: string; stock?: number; category?: string; description?: string; }

export default function AdminProducts() {
  const [list, setList] = useState<Product[]>([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Product>>({});

  const load = async () => {
    const res = await api.get('/products', { params: { q, page, limit } });
    const data = Array.isArray(res.data) ? res.data : res.data.data;
    const meta = Array.isArray(res.data) ? { total: data.length } : res.data.meta;
    setList(data);
    setTotal(meta.total || data.length);
  };

  useEffect(() => { load(); }, [q, page]);

  const remove = async (id: string) => {
    if (!confirm('Xóa sản phẩm?')) return;
    await api.delete(`/products/${id}`);
    await load();
  };

  const openEdit = (p?: Product) => {
    setForm(p || { name: '', price: 0, image: '', description: '' });
    setOpen(true);
  };

  const save = async () => {
    if (form._id) await api.put(`/products/${form._id}`, form);
    else await api.post('/products', form);
    setOpen(false);
    await load();
  };

  return (
    <Box sx={{ p: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Quản lý sản phẩm</Typography>
        <Stack direction="row" spacing={2}>
          <TextField size="small" placeholder="Tìm kiếm" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
          <Button variant="contained" onClick={() => openEdit()}>Thêm sản phẩm</Button>
        </Stack>
      </Stack>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ảnh</TableCell>
              <TableCell>Tên</TableCell>
              <TableCell>Giá</TableCell>
              <TableCell align="right">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {list.map(p => (
              <TableRow key={p._id}>
                <TableCell><img src={p.image} alt={p.name} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6 }} /></TableCell>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.price.toLocaleString()}₫</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => openEdit(p)}><EditIcon /></IconButton>
                  <IconButton onClick={() => remove(p._id)} color="error"><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Box display="flex" justifyContent="center" mt={2}>
        <Pagination page={page} count={Math.max(1, Math.ceil(total / limit))} onChange={(_, p) => setPage(p)} />
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{form._id ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Tên" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Giá" type="number" value={form.price || 0} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            <ImageUploader onUploaded={(url) => setForm({ ...form, image: url })} />
            <TextField label="Ảnh URL" value={form.image || ''} onChange={(e) => setForm({ ...form, image: e.target.value })} />
            <TextField label="Mô tả" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={save}>Lưu</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
