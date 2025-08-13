import { useEffect, useState } from 'react';
import { Box, Button, Container, Paper, Stack, TextField, Typography, Grid, Rating } from '@mui/material';
import ProductCard from '../components/ProductCard';
import api from '../api/axiosClient';
import { useToast } from '../context/ToastContext';

export default function Profile() {
  const [recent, setRecent] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { showToast } = useToast();
  const [myReviews, setMyReviews] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/users/me');
        setName(res.data.name);
        setEmail(res.data.email);
      } catch {}
      try {
        const r = await api.get('/reviews/me');
        const data = Array.isArray(r.data) ? r.data : r.data.data;
        setMyReviews(data || []);
      } catch {}
      try {
        const raw = localStorage.getItem('satify_recent_products');
        const ids: string[] = raw ? JSON.parse(raw) : [];
        if (ids.length) {
          const results = await Promise.all(
            ids.map(async (pid) => {
              try { const r = await api.get(`/products/${pid}`); return r.data; } catch { return null; }
            })
          );
          setRecent(results.filter(Boolean));
        }
      } catch {}
    };
    load();
  }, []);

  const save = async () => {
    try {
      if (password && password !== confirmPassword) return showToast('Mật khẩu xác nhận không khớp', 'error');
      await api.put('/users/me', { name, password: password || undefined, currentPassword: password ? currentPassword : undefined });
      setPassword('');
      setCurrentPassword('');
      setConfirmPassword('');
      showToast('Cập nhật thành công', 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Cập nhật thất bại', 'error');
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Hồ sơ của tôi</Typography>
      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          <TextField label="Email" value={email} disabled />
          <TextField label="Tên" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="Mật khẩu hiện tại" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          <TextField label="Mật khẩu mới" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <TextField label="Xác nhận mật khẩu mới" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          <Box>
            <Button variant="contained" onClick={save}>Lưu</Button>
          </Box>
        </Stack>
      </Paper>

      {myReviews.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>Đánh giá của tôi</Typography>
          <Grid container spacing={2}>
            {myReviews.map((rv: any) => (
              <Grid item xs={12} md={6} key={rv._id}>
                <Paper sx={{ p: 2 }}>
                  <Stack direction="row" spacing={2}>
                    <Box sx={{ width: 96, height: 96, borderRadius: 1, overflow: 'hidden', flexShrink: 0 }}>
                      <img src={rv.productId?.image} alt={rv.productId?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography fontWeight={600}>{rv.productId?.name}</Typography>
                      <Rating value={rv.rating} readOnly size="small" />
                      {rv.comment && <Typography sx={{ mt: 0.5 }}>{rv.comment}</Typography>}
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Button size="small" variant="outlined" href={`/products/${rv.productId?._id}`}>Xem sản phẩm</Button>
                        <Button size="small" color="error" onClick={async () => {
                          try { await api.delete(`/reviews/${rv.productId?._id}`);
                            setMyReviews((prev) => prev.filter((x) => x._id !== rv._id));
                            showToast('Đã xoá đánh giá', 'success');
                          } catch { showToast('Xoá thất bại', 'error'); }
                        }}>Xóa</Button>
                      </Stack>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

        {recent.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>Đã xem gần đây</Typography>
            <Grid container spacing={2}>
              {recent.map((p: any) => (
                <Grid item xs={12} sm={6} md={3} key={p._id}>
                  <ProductCard id={p._id} name={p.name} price={p.price} image={p.image} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
    </Container>
  );
}
