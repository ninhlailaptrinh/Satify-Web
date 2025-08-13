export const formatCurrency = (value: number, currency: string = 'VND') => {
  try {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(value);
  } catch {
    return `${value.toLocaleString()}₫`;
  }
};
