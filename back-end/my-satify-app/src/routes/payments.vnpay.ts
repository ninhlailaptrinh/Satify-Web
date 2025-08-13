import { Router } from 'express';
import crypto from 'crypto';
import config from '../config';

const router = Router();

function sortObject(obj: Record<string, any>) {
  const sorted: Record<string, any> = {};
  Object.keys(obj).sort().forEach(k => sorted[k] = obj[k]);
  return sorted;
}

router.get('/create', async (req, res) => {
  try {
    const orderId = String(req.query.orderId || '');
    const amount = Number(req.query.amount || 0);
    if (!orderId || !amount) return res.status(400).json({ message: 'orderId/amount required' });

    const vnpUrl = new URL(config.vnpPayUrl);
    const ipAddr = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
    const createDate = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyyMMddHHmmss = `${createDate.getFullYear()}${pad(createDate.getMonth()+1)}${pad(createDate.getDate())}${pad(createDate.getHours())}${pad(createDate.getMinutes())}${pad(createDate.getSeconds())}`;

    const params: Record<string,string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: config.vnpTmnCode,
      vnp_Amount: String(amount * 100),
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: config.vnpReturnUrl,
      vnp_IpAddr: ipAddr as string,
      vnp_CreateDate: yyyyMMddHHmmss
    };
    const sorted = sortObject(params);
    const signData = new URLSearchParams(sorted).toString();
    const hmac = crypto.createHmac('sha512', config.vnpHashSecret);
    const vnp_SecureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    Object.entries(sorted).forEach(([k,v]) => vnpUrl.searchParams.append(k, v));
    vnpUrl.searchParams.append('vnp_SecureHash', vnp_SecureHash);
    res.json({ payUrl: vnpUrl.toString() });
  } catch (e) {
    res.status(500).json({ message: 'Failed to create VNPay url' });
  }
});

router.get('/return', async (req, res) => {
  try {
    const params = { ...req.query } as any;
    const secure = params.vnp_SecureHash as string;
    delete params.vnp_SecureHash;
    delete params.vnp_SecureHashType;
    const sorted = sortObject(params);
    const signData = new URLSearchParams(sorted as any).toString();
    const signed = crypto.createHmac('sha512', config.vnpHashSecret).update(Buffer.from(signData, 'utf-8')).digest('hex');
    const ok = signed === secure;
    // Redirect back to frontend order detail with result
    const orderId = params.vnp_TxnRef;
    const base = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173') + `/orders/${orderId}`;
    const url = new URL(base);
    url.searchParams.set('vnp_status', String(params.vnp_ResponseCode || ''));
    url.searchParams.set('ok', ok ? '1' : '0');
    res.redirect(url.toString());
  } catch (e) {
    res.status(400).send('Invalid return');
  }
});

router.post('/ipn', async (req, res) => {
  try {
    const params = { ...req.body } as any;
    const secure = params.vnp_SecureHash as string;
    delete params.vnp_SecureHash;
    delete params.vnp_SecureHashType;
    const sorted = sortObject(params);
    const signData = new URLSearchParams(sorted as any).toString();
    const signed = crypto.createHmac('sha512', config.vnpHashSecret).update(Buffer.from(signData, 'utf-8')).digest('hex');
    const ok = signed === secure && params.vnp_ResponseCode === '00';
    if (ok) {
      // TODO: lookup order by params.vnp_TxnRef, verify amount, set status paid
      // await Order.findByIdAndUpdate(params.vnp_TxnRef, { status: 'paid' });
      return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
    }
    return res.status(200).json({ RspCode: '97', Message: 'Invalid signature' });
  } catch (e) {
    return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
});

export default router;
