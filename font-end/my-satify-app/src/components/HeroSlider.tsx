import { useEffect, useMemo, useState } from 'react';
import { Box, Container, Typography, Stack, IconButton } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface Slide {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  background?: string;
}

interface HeroSliderProps {
  slides?: Slide[];
  intervalMs?: number;
}

export default function HeroSlider({ slides: slidesProp, intervalMs = 5000 }: HeroSliderProps) {
  const slides = useMemo<Slide[]>(() => slidesProp || [
    { title: 'Satify Pet Shop', subtitle: 'Thú cưng đáng yêu cho bạn', background: 'linear-gradient(135deg,#ee4d2d,#ffb300)' },
    { title: 'Giảm giá mùa hè', subtitle: 'Ưu đãi đến 30%', background: 'linear-gradient(135deg,#ff8a00,#e52e71)' },
    { title: 'Miễn phí vận chuyển', subtitle: 'Đơn hàng trên 1.000.000₫', background: 'linear-gradient(135deg,#36d1dc,#5b86e5)' },
  ], [slidesProp]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [slides.length, intervalMs]);

  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setIndex((i) => (i + 1) % slides.length);

  const s = slides[index];

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: 2, mb: 3 }}>
      <Box sx={{
        minHeight: { xs: 240, md: 280 },
        display: 'flex', alignItems: 'center',
        background: s.background, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative'
      }}>
        <Box sx={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.12 }} />
        <Container sx={{ position: 'relative' }}>
          <Box sx={{
            maxWidth: 640,
            backdropFilter: 'blur(4px)',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 2,
            p: { xs: 2.5, md: 3 }
          }}>
            <Typography
              sx={{
                fontWeight: 800,
                color: 'white',
                textShadow: '0 2px 10px rgba(0,0,0,0.25)',
                fontSize: { xs: '1.75rem', md: '2.25rem' },
                lineHeight: 1.15
              }}
            >
              {s.title}
            </Typography>
            {s.subtitle && (
              <Typography color="white" sx={{ opacity: 0.95, mt: 1, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                {s.subtitle}
              </Typography>
            )}
          </Box>
        </Container>
      </Box>
      <IconButton onClick={prev} sx={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)', color: 'white', display: { xs: 'none', sm: 'flex' } }}>
        <ChevronLeftIcon />
      </IconButton>
      <IconButton onClick={next} sx={{ position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)', color: 'white', display: { xs: 'none', sm: 'flex' } }}>
        <ChevronRightIcon />
      </IconButton>
      <Stack direction="row" spacing={1} sx={{ position: 'absolute', bottom: 12, left: 0, right: 0 }} justifyContent="center">
        {slides.map((_, i) => (
          <Box key={i} sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: i === index ? 'white' : 'rgba(255,255,255,0.6)' }} />
        ))}
      </Stack>
    </Box>
  );
}
