import { useEffect, useState } from 'react';
import api from '../../api/axiosClient';
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Stack, TextField, Button, Pagination, Chip, Drawer, Divider, MenuItem } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageUploader from '../../components/ImageUploader';

interface Product { _id: string; name: string; price: number; image: string; stock?: number; category?: string; description?: string; }

export default function AdminProducts() {
  const [list, setList] = useState<Product[]>([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<string>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Product>>({});
  const [file, setFile] = useState<File | null>(null);

  const load = async () => {
    const res = await api.get('/products', { params: { q, page, limit, category: category || undefined } });
    const data = Array.isArray(res.data) ? res.data : res.data.data;
    const meta = Array.isArray(res.data) ? { total: data.length } : res.data.meta;
    setList(data);
    setTotal(meta.total || data.length);
  };

  useEffect(() => { load(); }, [q, page, category]);

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
      <Paper sx={{ p: 2, mb: 2, display: 'flex', alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', gap: 2, borderRadius: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700}>Quản lý sản phẩm</Typography>
          <Typography variant="body2" color="text.secondary">Tổng: {total}</Typography>
        </Stack>
        <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
          <TextField size="small" placeholder="Tìm kiếm" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
          <TextField size="small" select label="Danh mục" value={category} onChange={(e) => { setPage(1); setCategory(e.target.value); }} sx={{ minWidth: 160 }}>
            <MenuItem value="">Tất cả</MenuItem>
            {['Chó','Mèo','Phụ kiện','Thức ăn','Đồ chơi','general'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
          <Button variant="contained" onClick={() => openEdit()}>Thêm sản phẩm</Button>
          <Button variant="outlined" onClick={async () => {
            const params = new URLSearchParams();
            if (q) params.set('q', q);
            if (category) params.set('category', category);
            const url = `${import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'}/products/export?${params.toString()}`;
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${localStorage.getItem('satify_token') || ''}` }, credentials: 'include' });
            if (!res.ok) return alert('Xuất CSV thất bại');
            const blob = await res.blob();
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `products_${Date.now()}.csv`; document.body.appendChild(a); a.click(); a.remove();
          }}>Xuất CSV</Button>
          <Button variant="text" component="label">Nhập CSV
            <input hidden type="file" accept=".csv" onChange={async (e) => {
              const f = e.target.files?.[0]; if (!f) return;
              const fd = new FormData(); fd.append('file', f);
              const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'}/products/import`, { method: 'POST', body: fd, headers: { 'Authorization': `Bearer ${localStorage.getItem('satify_token') || ''}` }, credentials: 'include' });
              if (!res.ok) return alert('Nhập CSV thất bại');
              const j = await res.json(); alert(`Tạo: ${j.created}, Cập nhật: ${j.updated}`);
              await load();
            }} />
          </Button>
        </Stack>
      </Paper>
      <Paper sx={{ borderRadius: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Ảnh</TableCell>
              <TableCell>Tên</TableCell>
              <TableCell>Giá</TableCell>
              <TableCell>Danh mục</TableCell>
              <TableCell>Kho</TableCell>
              <TableCell align="right">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {list.map(p => (
              <TableRow key={p._id}>
                <TableCell><img src={p.image} alt={p.name} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6 }} /></TableCell>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.price.toLocaleString()}₫</TableCell>
                <TableCell>{p.category ? <Chip size="small" label={p.category} /> : '-'}</TableCell>
                <TableCell>{typeof p.stock === 'number' ? p.stock : '-'}</TableCell>
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

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: { xs: 360, sm: 420 }, p: 2 }} role="presentation">
          <Typography variant="h6" fontWeight={700} mb={1}>{form._id ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={2}>
            <TextField label="Tên" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Giá" type="number" value={form.price || 0} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            <TextField label="Danh mục" value={(form as any).category || ''} onChange={(e) => setForm({ ...form, category: e.target.value } as any)} />
            <TextField label="Kho" type="number" value={(form as any).stock || 0} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) } as any)} />
            <ImageUploader onUploaded={(url) => setForm({ ...form, image: url })} />
            <TextField label="Ảnh URL" value={form.image || ''} onChange={(e) => setForm({ ...form, image: e.target.value })} />
            <TextField label="Mô tả" multiline minRows={3} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button onClick={() => setOpen(false)}>Hủy</Button>
              <Button variant="contained" onClick={save}>Lưu</Button>
            </Stack>
          </Stack>
        </Box>
      </Drawer>
    </Box>
  );
}
