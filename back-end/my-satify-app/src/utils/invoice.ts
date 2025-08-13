import PDFDocument from 'pdfkit';

export async function generateInvoicePdf(order: any): Promise<Buffer> {
  return await new Promise<Buffer>((resolve, reject) => {
    const chunks: any[] = [];
    const doc = new (PDFDocument as any)({ size: 'A4', margin: 50 });
    doc.on('data', (d: any) => chunks.push(d));
    doc.on('error', reject);
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    doc.fontSize(18).text('Satify Pet Shop - Hóa đơn', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Mã đơn: ${order._id}`);
    doc.text(`Ngày: ${new Date(order.createdAt as any).toLocaleString()}`);
    if (order.user) doc.text(`Khách: ${order.user.name} <${order.user.email}>`);
    if (order.shippingAddress) {
      const s = order.shippingAddress;
      doc.text(`Người nhận: ${s.name || ''} - ${s.phone || ''}`);
      doc.text(`Địa chỉ: ${s.address || ''}`);
      if (s.note) doc.text(`Ghi chú: ${s.note}`);
    }

    doc.moveDown();
    doc.fontSize(14).text('Chi tiết sản phẩm');
    doc.moveDown(0.5);
    (order.items || []).forEach((it: any, idx: number) => {
      const name = it.product?.name || 'Sản phẩm';
      const qty = it.qty || 0;
      const price = (it.price && (it.price.toLocaleString?.() || it.price)) || 0;
      const line = `${idx + 1}. ${name}  x${qty}  -  ${price}₫`;
      doc.fontSize(12).text(line);
    });

    doc.moveDown();
    const total = (order.total && (order.total.toLocaleString?.() || order.total)) || 0;
    doc.fontSize(14).text(`Tổng: ${total}₫`, { align: 'right' });
    if (order.trackingNumber) {
      doc.moveDown();
      if (order.carrier) doc.fontSize(12).text(`ĐVVC: ${order.carrier}`);
      doc.fontSize(12).text(`Mã vận đơn: ${order.trackingNumber}`);
      if (order.estimateDeliveryDate) doc.text(`Dự kiến giao: ${new Date(order.estimateDeliveryDate).toLocaleDateString()}`);
    }

    doc.end();
  });
}
