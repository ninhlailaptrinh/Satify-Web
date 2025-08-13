import { Container, Typography, Paper, TextField, Button, Stack, Tabs, Tab } from "@mui/material";
import { useState } from "react";
import ImageUploader from "../components/ImageUploader";
import api from "../api/axiosClient";
import AdminProducts from "./admin/AdminProducts";
import AdminOrders from "./admin/AdminOrders";
import AdminUsers from "./admin/AdminUsers";

export default function AdminDashboard() {
    const [tab, setTab] = useState(0);
    const [name, setName] = useState("");
    const [price, setPrice] = useState<number>(0);
    const [imageUrl, setImageUrl] = useState<string>("");
    const [description, setDescription] = useState("");

    const handleCreate = async () => {
        await api.post("/products", { name, price, image: imageUrl, description });
        alert("Tạo sản phẩm thành công");
        setName(""); setPrice(0); setImageUrl(""); setDescription("");
    };

    return (
        <Container sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom>
                Admin Dashboard
            </Typography>
            <Paper sx={{ mb: 3 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                    <Tab label="Sản phẩm" />
                    <Tab label="Đơn hàng" />
                    <Tab label="Người dùng" />
                    <Tab label="Tạo mới sản phẩm" />
                </Tabs>
            </Paper>
            {tab === 0 && <AdminProducts />}
            {tab === 1 && <AdminOrders />}
            {tab === 2 && <AdminUsers />}
            {tab === 3 && (
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>Tạo sản phẩm</Typography>
                    <Stack spacing={2}>
                        <TextField label="Tên" value={name} onChange={(e) => setName(e.target.value)} />
                        <TextField label="Giá" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
                        <TextField label="Mô tả" value={description} onChange={(e) => setDescription(e.target.value)} />
                        <ImageUploader onUploaded={(url) => setImageUrl(url)} />
                        <TextField label="Ảnh URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} helperText="Hoặc dán URL ảnh đã upload" />
                        <Button variant="contained" onClick={handleCreate}>Tạo</Button>
                    </Stack>
                </Paper>
            )}
        </Container>
    );
}

