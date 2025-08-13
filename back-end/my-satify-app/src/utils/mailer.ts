import nodemailer from 'nodemailer';
import config from '../config';

export function createTransport() {
  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: config.smtpUser ? { user: config.smtpUser, pass: config.smtpPass } : undefined,
  } as any);
  return transporter;
}

export async function sendMail(options: { to: string; subject: string; text?: string; html?: string; attachments?: any[]; }) {
  if (!config.smtpHost) return; // skip if not configured
  const transporter = createTransport();
  await transporter.sendMail({ from: config.mailFrom, ...options });
}
