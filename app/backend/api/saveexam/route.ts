// app/api/baithi/route.ts

import { NextResponse } from "next/server";
import prisma from "../../lib/prisma";


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, diem, soCauDung, ngayVaoThi, cauHoi, hoTen } = body;

    // Kiểm tra các trường bắt buộc
    if (!email || diem === undefined || soCauDung === undefined || !hoTen) {
      return NextResponse.json(
        {
          error:
            "Thiếu các trường bắt buộc: email, diem, soCauDung, hoTen",
        },
        { status: 400 }
      );
    }

    // Tìm nhân viên dựa trên email
    let nhanVien = await prisma.nhanVien.findUnique({
      where: { email: email },
    });

    // Nếu không tìm thấy nhân viên, tạo nhân viên mới
    if (!nhanVien) {
      nhanVien = await prisma.nhanVien.create({
        data: {
          id: crypto.randomUUID(), // Tạo ID ngẫu nhiên
          email: email,
          hoTen: hoTen, // Thêm trường bắt buộc hoTen
          // Thêm các trường bắt buộc khác nếu có, hoặc để mặc định nếu không bắt buộc
        },
      });
    }

    // Kiểm tra xem đã có bài thi nào với nhanVienId tương ứng chưa
    const existingBaiThi = await prisma.baiThi.findFirst({
      where: {
        nhanVienId: nhanVien.id,
      },
    });

    if (existingBaiThi) {
      return NextResponse.json(
        { error: "Email này đã được sử dụng cho một bài thi khác" },
        { status: 400 }
      );
    }

    // Validate danh sách câu hỏi
    let cauHoiData = null;
    if (cauHoi) {
      if (!Array.isArray(cauHoi)) {
        return NextResponse.json(
          { error: "Danh sách câu hỏi phải là một mảng" },
          { status: 400 }
        );
      }
      cauHoiData = cauHoi;
    }

    // Tạo bản ghi BaiThi mới với nhanVienId từ nhân viên
    const baiThi = await prisma.baiThi.create({
      data: {
        nhanVienId: nhanVien.id,
        diem: parseFloat(diem),
        soCauDung: parseInt(soCauDung),
        ngayVaoThi: ngayVaoThi ? new Date(ngayVaoThi) : new Date(),
        cauHoi: cauHoiData || [],
      },
    });

    return NextResponse.json(
      {
        message: "Lưu bài thi thành công",
        data: { ...baiThi, email: nhanVien.email, hoTen: nhanVien.hoTen }, // Trả về thêm hoTen
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Lỗi khi lưu bài thi:", error);
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi lưu bài thi" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}