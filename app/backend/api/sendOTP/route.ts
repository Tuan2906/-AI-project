// ./app/api/send-otp/route.ts
import { sendOTPEmail } from '@/app/backend/lib/email';
import { NextResponse } from 'next/server';

// Định nghĩa type cho body của request
interface SendOTPRequestBody {
  email: string;
}

// Hàm validate email
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Hàm tạo mã OTP ngẫu nhiên (5 chữ số)
const generateOTP = (): string => {
  return Math.floor(10000 + Math.random() * 90000).toString(); // Tạo số ngẫu nhiên từ 10000 đến 99999
};

export async function POST(request: Request) {
  try {
    // Parse request body
    console.log('request', request);
    const { email }: SendOTPRequestBody = await request.json();

    // Validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email là bắt buộc' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Email không hợp lệ' },
        { status: 400 }
      );
    }

    // Tạo mã OTP
    const otp = generateOTP();

    // Gửi email chứa mã OTP
    await sendOTPEmail({
      to: email,
      otp: otp,
    });

    return NextResponse.json(
      {
        message: 'Mã OTP đã được gửi đến email của bạn.',
        email: email,
        otp: otp, // Trả mã OTP về client để client có thể so sánh
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Lỗi khi gửi mã OTP:', error);
    return NextResponse.json(
      { error: error.message || 'Đã có lỗi xảy ra trong quá trình gửi mã OTP' },
      { status: 500 }
    );
  }
}