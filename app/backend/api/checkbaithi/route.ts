import { NextResponse } from "next/server";
import prisma from "../../lib/prisma";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, hoTen, phongBan, ngayVaoThi } = body;

    // Kiểm tra các trường bắt buộc
    if (!email || !hoTen || !ngayVaoThi) {
      return NextResponse.json(
        {
          error: "Thiếu các trường bắt buộc: email, hoTen, ngayVaoThi",
        },
        { status: 400 }
      );
    }

    // Tìm nhân viên dựa trên email
    let nhanVien = await prisma.nhanVien.findUnique({
      where: { email: email },
    });

    // Nếu không tìm thấy nhân viên -> tạo mới nhân viên và bài thi
    if (!nhanVien) {
      // Tạo mới nhân viên với phongBan
      nhanVien = await prisma.nhanVien.create({
        data: {
          id: crypto.randomUUID(),
          email: email,
          hoTen: hoTen,
          phongBan: phongBan || null, // Lưu phongBan, nếu không có thì để null
        },
      });

      // Tạo bài thi chỉ với nhanVienId và ngayVaoThi từ client
      const newBaiThi = await prisma.baiThi.create({
        data: {
          nhanVienId: nhanVien.id,
          ngayVaoThi: new Date(ngayVaoThi),
        },
      });

      return NextResponse.json(
        {
          message: "Nhân viên chưa tồn tại, đã đăng ký và tạo bài thi thành công",
          eligible: true,
          nhanVien: {
            id: nhanVien.id,
            email: nhanVien.email,
            hoTen: nhanVien.hoTen,
            phongBan: nhanVien.phongBan, // Trả về phongBan
          },
          baiThi: {
            id: newBaiThi.id,
            nhanVienId: newBaiThi.nhanVienId,
            ngayVaoThi: newBaiThi.ngayVaoThi,
          },
        },
        { status: 201 }
      );
    }

    // Nếu tìm thấy nhân viên, kiểm tra xem họ đã thi trong ngày hiện tại chưa
    const clientDate = new Date(ngayVaoThi);
    const startOfDay = new Date(clientDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(clientDate.setHours(23, 59, 59, 999));

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
        nhanVien: {
          id: nhanVien.id,
          email: nhanVien.email,
          hoTen: nhanVien.hoTen,
          phongBan: nhanVien.phongBan, // Trả về phongBan nếu có
        },
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