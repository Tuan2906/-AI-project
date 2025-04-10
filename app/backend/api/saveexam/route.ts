import { NextResponse } from "next/server";
import prisma from "../../lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, diem, soCauDung, cauHoi,ngayNop } = body;

    // Kiểm tra các trường bắt buộc
    if (!email || diem === undefined || soCauDung === undefined) {
      return NextResponse.json(
        {
          error: "Thiếu các trường bắt buộc: email, diem, soCauDung",
        },
        { status: 400 }
      );
    }

    // Tìm nhân viên dựa trên email
    const nhanVien = await prisma.nhanVien.findUnique({
      where: { email: email },
    });

    if (!nhanVien) {
      return NextResponse.json(
        { error: "Không tìm thấy nhân viên với email này" },
        { status: 404 }
      );
    }

    // Tìm bài thi hiện có dựa trên nhanVienId
    const existingBaiThi = await prisma.baiThi.findFirst({
      where: {
        nhanVienId: nhanVien.id,
      },
    });

    if (!existingBaiThi) {
      return NextResponse.json(
        { error: "Không tìm thấy bài thi cho nhân viên này" },
        { status: 404 }
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

    // Cập nhật bài thi với các trường được cung cấp
    const updatedBaiThi = await prisma.baiThi.update({
      where: {
        id: existingBaiThi.id, // Dùng id của bài thi để cập nhật
      },
      data: {
        diem: parseFloat(diem),
        soCauDung: parseInt(soCauDung),
        ngaynop: ngayNop ? new Date(ngayNop) : new Date(), // Dùng giá trị từ body nếu có
        cauHoi: cauHoiData || [],
        // Các trường khác như ngaynop, createdById, updatedById nếu cần có thể thêm vào đây
        // Ví dụ: ngaynop: new Date(),
      },
    });

    return NextResponse.json(
      {
        message: "Cập nhật bài thi thành công",
        examId: updatedBaiThi.id
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi khi cập nhật bài thi:", error);
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi cập nhật bài thi" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}