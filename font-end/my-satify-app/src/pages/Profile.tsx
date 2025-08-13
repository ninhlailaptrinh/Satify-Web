import { useEffect, useState } from 'react';
import { Box, Button, Container, Paper, Stack, TextField, Typography } from '@mui/material';
import api from '../api/axiosClient';
import { useToast } from '../context/ToastContext';

export default function Profile() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/users/me');
        setName(res.data.name);
        setEmail(res.data.email);
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
    </Container>
  );
}
