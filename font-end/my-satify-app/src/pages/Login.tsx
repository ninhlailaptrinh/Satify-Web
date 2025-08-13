import React, { useState } from "react";
import {
    Container,
    TextField,
    Button,
    Typography,
    Paper,
    Box,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosClient";
import { useToast } from "../context/ToastContext";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const { showToast } = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post("/auth/login", { email, password });
            const { accessToken, user } = res.data as any;
            localStorage.setItem("satify_token", accessToken);
            localStorage.setItem("satify_role", user.role);
            if (user && user._id) localStorage.setItem('satify_user_id', user._id);
            showToast('Đăng nhập thành công', 'success');
            navigate(user.role === 'admin' ? "/admin" : "/");
        } catch (err: any) {
            showToast(err?.response?.data?.message || "Đăng nhập thất bại", 'error');
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 6 }}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom>
                    Login
                </Typography>
                <Box component="form" onSubmit={handleLogin} sx={{ mt: 2 }}>
                    <TextField
                        label="Email"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextField
                        label="Password"
                        type="password"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        sx={{ mt: 2 }}
                    >
                        Login
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}
