// ./lib/email.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // Ví dụ: smtp.gmail.com
  port: Number(process.env.EMAIL_PORT), // Ví dụ: 587
  secure: process.env.EMAIL_PORT === '465', // true nếu dùng port 465 (SSL)
  auth: {
    user: process.env.EMAIL_USER, // Email của bạn
    pass: process.env.EMAIL_PASS, // Mật khẩu ứng dụng (App Password nếu dùng Gmail)
  },
});

interface SendOTPEmailParams {
  to: string;
  otp: string;
}
interface SendCertificateEmailParams {
  to: string;
  subject: string;
  html: string;
}
export async function sendOTPEmail({ to, otp }: SendOTPEmailParams) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'no-reply@yourapp.com',
    to,
    subject: 'Mã OTP Xác Thực Đăng Ký',
    text: `Mã OTP của bạn là: ${otp}. Mã này có hiệu lực trong 10 phút.`,
    html: `<p>Mã OTP của bạn là: <strong>${otp}</strong>. Mã này có hiệu lực trong 10 phút.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${to}`);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Không thể gửi email OTP. Vui lòng thử lại sau.');
  }
}
export async function sendCertificateEmail({ to, subject, html }: SendCertificateEmailParams) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'no-reply@yourapp.com',
    to,
    subject: subject || 'Chứng nhận hoàn thành khóa học từ AI', // Default subject if not provided
    text: 'Bạn đã hoàn thành khóa học. Vui lòng xem chứng nhận trong email này.', // Fallback text for non-HTML email clients
    html: html, // The HTML content of the certificate
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Certificate email sent to ${to}`);
  } catch (error) {
    console.error('Error sending Certificate email:', error);
    throw new Error('Không thể gửi email chứng nhận. Vui lòng thử lại sau.');
  }
}