'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

type BaiThi = {
    hoTen: string;
    email: string | null;
    diemSo: number | null; // Điểm số có thể null nếu chưa chấm
    ngayThi: string; // Thời gian bắt đầu làm bài
    ngayNop: string | null; // Thời gian nộp bài, null nếu chưa nộp
};

const fetchDanhSachBaiThi = async (): Promise<BaiThi[]> => {
    const res = await fetch('/api/listbaithi', {
        method: 'POST', // Sử dụng POST thay vì GET
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Bạn có thể thêm payload nếu API yêu cầu
    });
    if (!res.ok) throw new Error('Lỗi khi lấy danh sách bài thi');
    return (await res.json()).data;
};
export default function TheoDoiBaiThi() {
    const [isMounted, setIsMounted] = useState(false); // Để kiểm tra component đã mount chưa
    console.log("vooooooooo")
    // Sử dụng useQuery với refetch interval 5 giây
    const { data: danhSachBaiThi, isLoading, error } = useQuery({
        queryKey: ['danhSachBaiThi'],
        queryFn: fetchDanhSachBaiThi,
        refetchInterval: 1000, // Cập nhật mỗi 1 giây
        refetchOnWindowFocus: false, // Không refetch khi focus lại
        staleTime: 0, // Dữ liệu luôn được coi là "stale" để refetch ngay
    });
    // Đánh dấu component đã mount để tránh hiển thị giao diện không mong muốn khi mới load
    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted || isLoading) return <p>Đang tải...</p>;
    if (error) return <p>Lỗi: {(error as Error).message}</p>;

    // Hàm tính trạng thái bài thi
    const tinhTrangThai = (baiThi: BaiThi): 'DaHoanThanh' | 'DangLam' => {
        // Nếu diemSo và ngayNop đều không null, bài thi đã hoàn thành
        if (baiThi.diemSo !== null && baiThi.ngayNop !== null) {
            return 'DaHoanThanh';
        }
        // Ngược lại, bài thi đang làm
        return 'DangLam';
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Theo Dõi Bài Thi</h1>
            <p className="text-sm text-gray-500 mb-4">Dữ liệu được cập nhật mỗi 5 giây.</p>

            {/* Bảng hiển thị danh sách bài thi */}
            {danhSachBaiThi && danhSachBaiThi.length > 0 ? (
                <table className="w-full border-collapse border">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border p-2">STT</th>
                            <th className="border p-2">Họ và Tên</th>
                            <th className="border p-2">Email</th>
                            <th className="border p-2">Ngày Vào Làm</th>
                            <th className="border p-2">Ngày Nộp</th>
                            <th className="border p-2">Điểm Số</th>
                            <th className="border p-2">Trạng Thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {danhSachBaiThi.map((baiThi, index) => {
                            const trangThai = tinhTrangThai(baiThi); // Tính trạng thái
                            return (
                                <tr key={index} className="hover:bg-gray-100">
                                    <td className="border p-2 text-center">{index + 1}</td>
                                    <td className="border p-2">{baiThi.hoTen}</td>
                                    <td className="border p-2">{baiThi.email || 'Không có email'}</td>
                                    <td className="border p-2 text-center">
                                        {new Date(baiThi.ngayThi).toLocaleString('vi-VN')}
                                    </td>
                                    <td className="border p-2 text-center">
                                        {baiThi.ngayNop
                                            ? new Date(baiThi.ngayNop).toLocaleString('vi-VN')
                                            : 'Chưa nộp'}
                                    </td>
                                    <td className="border p-2 text-center">
                                        {baiThi.diemSo !== null ? baiThi.diemSo : 'Chưa chấm'}
                                    </td>
                                    <td className="border p-2 text-center">
                                        <span
                                            className={
                                                trangThai === 'DaHoanThanh'
                                                    ? 'text-green-600'
                                                    : 'text-yellow-600'
                                            }
                                        >
                                            {trangThai === 'DaHoanThanh' ? 'Đã Hoàn Thành' : 'Đang Làm'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            ) : (
                <p>Không có dữ liệu bài thi.</p>
            )}
        </div>
    );
}