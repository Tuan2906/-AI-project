// app/api/check-exam-eligibility/route.ts

import { NextResponse } from "next/server";
import prisma from "../../lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, hoTen } = body;

    // Kiểm tra các trường bắt buộc
    if (!email || !hoTen) {
      return NextResponse.json(
        {
          error: "Thiếu các trường bắt buộc: email, hoTen",
        },
        { status: 400 }
      );
    }

    // Tìm nhân viên dựa trên email
    const nhanVien = await prisma.nhanVien.findUnique({
      where: { email: email },
    });

    // Nếu không tìm thấy nhân viên -> pass (được phép tạo mới và thi)
    if (!nhanVien) {
      return NextResponse.json(
        {
          message: "Nhân viên chưa tồn tại, có thể đăng ký và làm bài thi",
          eligible: true,
        },
        { status: 200 }
      );
    }

    // Nếu tìm thấy nhân viên, kiểm tra xem họ đã thi trong ngày hiện tại chưa
    const currentDate = new Date();
    const startOfDay = new Date(currentDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(currentDate.setHours(23, 59, 59, 999));

    const existingBaiThi = await prisma.baiThi.findFirst({
      where: {
        nhanVienId: nhanVien.id,
        ngayVaoThi: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (existingBaiThi) {
      return NextResponse.json(
        {
          message: "Nhân viên đã thực hiện bài thi trong ngày hôm nay",
          eligible: false,
          existingExamDate: existingBaiThi.ngayVaoThi,
        },
        { status: 200 }
      );
    }

    // Nếu chưa thi trong ngày hôm nay -> pass
    return NextResponse.json(
      {
        message: "Nhân viên đã tồn tại nhưng chưa thi hôm nay, có thể làm bài thi",
        eligible: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi khi kiểm tra điều kiện thi:", error);
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi kiểm tra điều kiện thi" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}