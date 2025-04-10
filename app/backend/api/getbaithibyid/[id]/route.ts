import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';



export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        // Get the exam ID from the URL parameters
        const baiThiId = params?.id;
        
        // Validate the ID
        if (!baiThiId) {
            return NextResponse.json({
                status: 'error',
                message: 'ID bài thi không được để trống',
            }, { status: 400 });
        }

        // Find the exam by ID
        const baiThi = await prisma.baiThi.findUnique({
            where: {
                id: baiThiId,
            },
            select: {
                id: true,
                nhanVienId: true,
                cauHoi: true,
            },
        });

        // Check if the exam exists
        if (!baiThi) {
            return NextResponse.json({
                status: 'error',
                message: 'Không tìm thấy bài thi với ID này',
            }, { status: 404 });
        }

        // Get the employee information
    
        // Prepare the response with only the necessary information
        const result = {
            danhSachCauHoi: baiThi.cauHoi,
        };

        return NextResponse.json({
            status: 'success',
            data: result,
        }, { status: 200 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({
            status: 'error',
            message: 'Lỗi khi lấy danh sách câu hỏi của bài thi',
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}