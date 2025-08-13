import React, { useState } from "react";
import { Container, Paper, Typography, Box, TextField, Button } from "@mui/material";
import api from "../api/axiosClient";
import { useToast } from "../context/ToastContext";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [adminKey, setAdminKey] = useState("");
  const { showToast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', { name, email, password, adminKey: adminKey || undefined });
      showToast('Đăng ký thành công, vui lòng đăng nhập', 'success');
      navigate('/login');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Đăng ký thất bại', 'error');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>Đăng ký</Typography>
        <Box component="form" onSubmit={submit}>
          <TextField label="Tên" fullWidth margin="normal" value={name} onChange={e => setName(e.target.value)} />
          <TextField label="Email" fullWidth margin="normal" value={email} onChange={e => setEmail(e.target.value)} />
          <TextField label="Mật khẩu" type="password" fullWidth margin="normal" value={password} onChange={e => setPassword(e.target.value)} />
          <TextField label="Admin Key (tuỳ chọn)" fullWidth margin="normal" value={adminKey} onChange={e => setAdminKey(e.target.value)} />
          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>Tạo tài khoản</Button>
        </Box>
      </Paper>
    </Container>
  );
}
