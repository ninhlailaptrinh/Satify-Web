import PDFDocument from 'pdfkit';

export async function generateInvoicePdf(order: any): Promise<Buffer> {
  return await new Promise<Buffer>((resolve, reject) => {
    const chunks: any[] = [];
    const doc = new (PDFDocument as any)({ size: 'A4', margin: 50 });
    doc.on('data', (d: any) => chunks.push(d));
    doc.on('error', reject);
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    // Header
    doc.rect(0, 0, doc.page.width, 70).fill('#ee4d2d');
    doc.fill('#ffffff').fontSize(22).text('Satify Pet Shop', 50, 25, { align: 'left' });
    doc.fill('#000000');
    doc.moveDown(2);
    doc.fontSize(16).text('Hóa đơn', { align: 'left' });
    doc.moveDown(0.25);
    doc.fontSize(12).text(`Mã đơn: ${order._id}`);
    doc.text(`Ngày: ${new Date(order.createdAt as any).toLocaleString()}`);
    if (order.user) doc.text(`Khách: ${order.user.name} <${order.user.email}>`);
    if (order.shippingAddress) {
      const s = order.shippingAddress;
      doc.text(`Người nhận: ${s.name || ''} - ${s.phone || ''}`);
      doc.text(`Địa chỉ: ${s.address || ''}`);
      if (s.note) doc.text(`Ghi chú: ${s.note}`);
    }

    // Items table
    doc.moveDown();
    doc.fontSize(14).text('Chi tiết sản phẩm');
    doc.moveDown(0.5);
    const tableTop = doc.y + 5;
    const colX = { name: 50, qty: 330, price: 390, line: 470 } as const;
    doc.fontSize(12).text('Sản phẩm', colX.name, tableTop);
    doc.text('SL', colX.qty, tableTop);
    doc.text('Đơn giá', colX.price, tableTop);
    doc.text('Thành tiền', colX.line, tableTop);
    doc.moveTo(50, tableTop + 15).lineTo(doc.page.width - 50, tableTop + 15).stroke('#dddddd');

    let y = tableTop + 25;
    (order.items || []).forEach((it: any) => {
      const name = it.product?.name || 'Sản phẩm';
      const qty = it.qty || 0;
      const priceNum = Number(it.price || 0);
      const lineTotal = qty * priceNum;
      const fmt = (n: number) => `${n.toLocaleString()}₫`;
      doc.text(name, colX.name, y, { width: 260 });
      doc.text(String(qty), colX.qty, y);
      doc.text(fmt(priceNum), colX.price, y);
      doc.text(fmt(lineTotal), colX.line, y);
      y += 18;
    });

    doc.moveDown(1.5);
    const total = Number(order.total || 0);
    doc.fontSize(14).text(`Tổng: ${total.toLocaleString()}₫`, { align: 'right' });
    if (order.trackingNumber) {
      doc.moveDown();
      if (order.carrier) doc.fontSize(12).text(`ĐVVC: ${order.carrier}`);
      doc.fontSize(12).text(`Mã vận đơn: ${order.trackingNumber}`);
      if (order.estimateDeliveryDate) doc.text(`Dự kiến giao: ${new Date(order.estimateDeliveryDate).toLocaleDateString()}`);
    }

    doc.end();
  });
}
