import { Box, Container, Stack, Typography, Link as MuiLink } from '@mui/material';

export default function TopBar() {
  return (
    <Box sx={{ bgcolor: 'primary.dark', color: 'rgba(255,255,255,0.9)' }}>
      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 0.5, fontSize: 12 }}>
          <Typography variant="caption">Khuyến mãi mùa hè: Giảm tới 30% • Miễn phí vận chuyển đơn trên 1.000.000₫</Typography>
          <Typography variant="caption">
            Hotline: <MuiLink href="tel:0123456789" color="inherit" underline="hover">0123 456 789</MuiLink>
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
