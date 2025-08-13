import { AppBar, Toolbar, Container, Stack, Typography, Link as MuiLink } from '@mui/material';

export default function TopBar() {
  return (
    <AppBar position="static" color="primary" elevation={0} sx={{ bgcolor: 'primary.dark', boxShadow: 'none', mb: '-1px' }}>
      <Container>
        <Toolbar variant="dense" disableGutters sx={{ px: 0, minHeight: 32, color: 'rgba(255,255,255,0.9)' }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            sx={{ width: '100%', fontSize: 12, gap: { xs: 0.5, sm: 0 } }}
          >
            <Typography variant="caption" sx={{ textAlign: { xs: 'left', sm: 'inherit' } }}>
              Khuyến mãi mùa hè: Giảm tới 30% • Miễn phí vận chuyển đơn trên 1.000.000₫
            </Typography>
            <Typography variant="caption">
              Hotline: <MuiLink href="tel:0123456789" color="inherit" underline="hover">0123 456 789</MuiLink>
            </Typography>
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
