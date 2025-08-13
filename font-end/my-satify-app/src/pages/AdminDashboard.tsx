import { Container, Typography, Paper, TextField, Button, Stack, Tabs, Tab, Grid, List, ListItemButton, ListItemIcon, ListItemText, Box, Divider } from "@mui/material";
import DashboardIcon from '@mui/icons-material/Dashboard';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useState } from "react";
import ImageUploader from "../components/ImageUploader";
import api from "../api/axiosClient";
import AdminProducts from "./admin/AdminProducts";
import AdminOrders from "./admin/AdminOrders";
import AdminUsers from "./admin/AdminUsers";
import AdminStats from "./admin/AdminStats";

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
            <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h5" fontWeight={700}>Bảng điều khiển Admin</Typography>
                <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', sm: 'flex' } }}>
                    <Button size="small" variant={tab === 4 ? 'contained' : 'outlined'} startIcon={<AddCircleOutlineIcon />} onClick={() => setTab(4)}>
                        Tạo sản phẩm
                    </Button>
                </Stack>
            </Paper>

            <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 0, position: 'sticky', top: 'calc(var(--appbar-height, 72px) + 16px)' }}>
                        {/* Mobile: top tabs for easier navigation */}
                        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                            <Tabs
                                value={tab}
                                onChange={(_, v) => setTab(v)}
                                variant="scrollable"
                                scrollButtons="auto"
                                aria-label="Admin tabs"
                            >
                                <Tab label="Tổng quan" />
                                <Tab label="Sản phẩm" />
                                <Tab label="Đơn hàng" />
                                <Tab label="Người dùng" />
                                <Tab label="Tạo mới" />
                            </Tabs>
                        </Box>
                        {/* Desktop: sidebar nav */}
                        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                            <List component="nav">
                                <ListItemButton selected={tab === 0} onClick={() => setTab(0)}>
                                    <ListItemIcon><DashboardIcon /></ListItemIcon>
                                    <ListItemText primary="Tổng quan" />
                                </ListItemButton>
                                <ListItemButton selected={tab === 1} onClick={() => setTab(1)}>
                                    <ListItemIcon><Inventory2Icon /></ListItemIcon>
                                    <ListItemText primary="Sản phẩm" />
                                </ListItemButton>
                                <ListItemButton selected={tab === 2} onClick={() => setTab(2)}>
                                    <ListItemIcon><ReceiptLongIcon /></ListItemIcon>
                                    <ListItemText primary="Đơn hàng" />
                                </ListItemButton>
                                <ListItemButton selected={tab === 3} onClick={() => setTab(3)}>
                                    <ListItemIcon><PeopleAltIcon /></ListItemIcon>
                                    <ListItemText primary="Người dùng" />
                                </ListItemButton>
                                <Divider sx={{ my: 0.5 }} />
                                <ListItemButton selected={tab === 4} onClick={() => setTab(4)}>
                                    <ListItemIcon><AddCircleOutlineIcon /></ListItemIcon>
                                    <ListItemText primary="Tạo sản phẩm" />
                                </ListItemButton>
                            </List>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={9}>
                    {tab === 0 && <AdminStats />}
                    {tab === 1 && <AdminProducts />}
                    {tab === 2 && <AdminOrders />}
                    {tab === 3 && <AdminUsers />}
                    {tab === 4 && (
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
                </Grid>
            </Grid>
        </Container>
    );
}

