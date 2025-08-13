import { Box, Container, Grid, Typography, Link as MuiLink } from "@mui/material";

export default function Footer() {
    return (
        <Box sx={{ bgcolor: 'primary.main', color: 'white', mt: 6, pt: 4, pb: 10 }} component="footer">
            <Container>
                <Grid container spacing={4}>
                    <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                        <Typography variant="h6" fontWeight={700}>Satify Pet Shop</Typography>
                        <Typography variant="body2" sx={{ mt: 1, opacity: 0.85 }}>
                            Nơi tìm thú cưng đáng yêu cho bạn.
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                        <Typography variant="subtitle1" fontWeight={600}>Liên hệ</Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>Hotline: 0123 456 789</Typography>
                        <Typography variant="body2">Email: support@satify.com</Typography>
                    </Grid>
                    <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                        <Typography variant="subtitle1" fontWeight={600}>Chính sách</Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            <MuiLink color="inherit" underline="hover" href="#">Bảo hành</MuiLink>
                        </Typography>
                        <Typography variant="body2">
                            <MuiLink color="inherit" underline="hover" href="#">Đổi trả</MuiLink>
                        </Typography>
                    </Grid>
                </Grid>
                <Typography variant="body2" sx={{ mt: 3, opacity: 0.9, textAlign: 'center' }}>
                    © 2025 Satify Pet Shop
                </Typography>
            </Container>
        </Box>
    );
}
