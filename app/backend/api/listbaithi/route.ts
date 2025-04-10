import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const danhSachBaiThi = await prisma.baiThi.findMany({
            select: {
                id: true,
                nhanVienId: true,
                diem: true,
                soCauDung: true,
                ngayVaoThi: true,
                ngaynop: true,
                cauHoi: true,
            },
        });

        const nhanVienIds = danhSachBaiThi.map((baiThi) => baiThi.nhanVienId);

        const danhSachNhanVien = await prisma.nhanVien.findMany({
            where: {
                id: { in: nhanVienIds },
            },
            select: {
                id: true,
                hoTen: true,
                email: true,
                phongBan: true,
            },
        });

        // Khai báo kiểu cho nhanVienMap
        const nhanVienMap: { [key: string]: { hoTen: string; email: string | null,phongBan: string | null } } = danhSachNhanVien.reduce(
            (map: { [key: string]: { hoTen: string; email: string | null, phongBan: string | null } }, nv) => {
                map[nv.id] = { hoTen: nv.hoTen, email: nv.email, phongBan: nv.phongBan }; // Không còn lỗi
                return map;
            },
            {}
        );

        const result = danhSachBaiThi.map((baiThi) => ({
            hoTen: nhanVienMap[baiThi.nhanVienId]?.hoTen || 'Không tìm thấy',
            email: nhanVienMap[baiThi.nhanVienId]?.email || 'Không tìm thấy',
            phongBan: nhanVienMap[baiThi.nhanVienId]?.phongBan || 'Không tìm thấy',
            diemSo: baiThi.diem,
            soCauDung: baiThi.soCauDung,
            noiDungBaiThi: baiThi.cauHoi,
            ngayThi: baiThi.ngayVaoThi,
            ngayNop: baiThi.ngaynop,

        }));

        return NextResponse.json({
            status: 'success',
            data: result,
        }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({
            status: 'error',
            message: 'Lỗi khi lấy danh sách bài thi',
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}