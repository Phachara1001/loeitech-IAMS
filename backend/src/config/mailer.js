import nodemailer from 'nodemailer';

/**
 * ตัวส่งอีเมล (SMTP transporter)
 * ตั้งค่าผ่าน environment variables ใน .env:
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM
 */
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true สำหรับ port 465, false สำหรับ port อื่น (STARTTLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * ส่งอีเมล
 * @param {{ to: string, subject: string, html: string }} options
 */
export const sendMail = async ({ to, subject, html }) => {
  return await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html
  });
};