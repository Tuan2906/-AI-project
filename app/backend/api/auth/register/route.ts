// ./app/api/register/route.ts
import { NextResponse } from 'next/server';
import { hash } from 'bcrypt';
import prisma from '@/app/backend/lib/prisma';

// Định nghĩa type cho body của request
interface RegisterRequestBody {
  email: string;
  name: string;
  password: string;
}

// Hàm validate email
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Hàm validate password
const validatePassword = (password: string): boolean => {
  return password.length >= 6; // Có thể thêm các điều kiện phức tạp hơn
};

export async function POST(request: Request) {
  try {
    // Parse request body
    const { email, password, name }: RegisterRequestBody = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email và mật khẩu là bắt buộc' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Email không hợp lệ' },
        { status: 400 }
      );
    }

    if (!validatePassword(password)) {
      return NextResponse.json(
        { error: 'Mật khẩu phải có ít nhất 6 ký tự' },
        { status: 400 }
      );
    }

    // Kiểm tra xem email đã tồn tại chưa
    const existingUser = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email đã được đăng ký' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Insert user vào database
    await prisma.user.create({
      data: {
        email: email,
        name: name,
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      { message: 'Đăng ký thành công' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Lỗi khi đăng ký:', error);

    // Xử lý lỗi cụ thể nếu email đã tồn tại (trường hợp lỗi constraint unique)
    if (error.code === 'P2002') { // Mã lỗi của Prisma cho unique constraint violation
      return NextResponse.json(
        { error: 'Email đã được đăng ký' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra trong quá trình đăng ký' },
      { status: 500 }
    );
  }
}