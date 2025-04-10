'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import danhSachNhanVien from './data.json';
import danhSachnhaMay from './dataNhaMay.json';

// Định nghĩa các type
type NhanVien = {
    name: string;
    phongBan: string;
    email: string;
    trangThai?: 'ChuaLam' | 'DangLam' | 'DaHoanThanh';
    diemSo?: number | null;
    ngayThi?: string;
    ngayNop?: string;
};

type BaiThi = {
    hoTen: string;
    email: string | null;
    diemSo: number | null;
    ngayThi: string;
    ngayNop: string | null;
    phongBan?: string;
};

// Hàm fetch dữ liệu bằng POST
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

// Hàm render bảng (giữ nguyên)
const renderTable = (data: NhanVien[], title: string) => (
    <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        {data.length > 0 ? (
            <table className="w-full border-collapse border">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="border p-2">Họ và Tên</th>
                        <th className="border p-2">Phòng Ban</th>
                        <th className="border p-2">Email</th>
                        <th className="border p-2">Ngày Vào Làm</th>
                        <th className="border p-2">Ngày Nộp</th>
                        <th className="border p-2">Điểm Số</th>
                        <th className="border p-2">Trạng Thái</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-100">
                            <td className="border p-2">{item.name}</td>
                            <td className="border p-2">{item.phongBan}</td>
                            <td className="border p-2">{item.email || 'Không có email'}</td>
                            <td className="border p-2 text-center">
                                {item.ngayThi ? new Date(item.ngayThi).toLocaleString('vi-VN') : 'Chưa làm'}
                            </td>
                            <td className="border p-2 text-center">
                                {item.ngayNop ? new Date(item.ngayNop).toLocaleString('vi-VN') : 'Chưa nộp'}
                            </td>
                            <td className="border p-2 text-center">
                                {item.diemSo !== undefined && item.diemSo !== null ? item.diemSo : 'Chưa chấm'}
                            </td>
                            <td className="border p-2 text-center">
                                <span className={
                                    item.trangThai === 'DaHoanThanh' ? 'text-green-600' :
                                    item.trangThai === 'DangLam' ? 'text-yellow-600' :
                                    'text-red-600'
                                }>
                                    {item.trangThai === 'DaHoanThanh' ? 'Đã Hoàn Thành' :
                                     item.trangThai === 'DangLam' ? 'Đang Làm' :
                                     'Chưa Làm'}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        ) : (
            <p>Không có dữ liệu. Vui lòng kiểm tra file dataNhaMay.json (nếu đang ở tab Nhà Máy).</p>
        )}
    </div>
);

export default function TheoDoiBaiThi() {
    const [isMounted, setIsMounted] = useState(false);
    const [danhSachNV, setDanhSachNV] = useState<NhanVien[]>([]);
    const [danhSachNhaMay, setDanhSachNhaMay] = useState<NhanVien[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'nhanVien' | 'nhaMay'>('nhanVien');

    const { data: danhSachBaiThi, isLoading, error } = useQuery({
        queryKey: ['danhSachBaiThi'],
        queryFn: fetchDanhSachBaiThi,
        refetchInterval: 1000, // Cập nhật mỗi 1 giây
        refetchOnWindowFocus: false, // Không refetch khi focus lại
        staleTime: 0, // Dữ liệu luôn được coi là "stale" để refetch ngay
    });

    // Khởi tạo danh sách nhân viên và nhà máy từ data.json và dataNhaMay.json
    useEffect(() => {
        setIsMounted(true);
        const initialNV = danhSachNhanVien.map(nv => ({
            ...nv,
            phongBan: nv['phong ban'].replace(/Phòng |phong ban/gi, '').trim(),
            trangThai: 'ChuaLam'
        }));

        const initialNhaMay = danhSachnhaMay.map(nm => ({
            ...nm,
            phongBan: nm['phong ban'].replace(/Phòng |phong ban/gi, '').trim(),
            trangThai: 'ChuaLam'
        }));

        setDanhSachNV(initialNV as any);
        setDanhSachNhaMay(initialNhaMay as any);
    }, []);

    // Cập nhật dữ liệu từ API
    useEffect(() => {
        if (danhSachBaiThi && danhSachBaiThi.length > 0) {
            const updatedNV = danhSachNV.map(nv => {
                const baiThi = danhSachBaiThi.find(bt => 
                    bt.hoTen === nv.name || (bt.email && bt.email === nv.email)
                );
                if (baiThi) {
                    return {
                        ...nv,
                        email: baiThi.email || nv.email,
                        trangThai: baiThi.diemSo !== null && baiThi.ngayNop !== null ? 'DaHoanThanh' : 'DangLam',
                        diemSo: baiThi.diemSo,
                        ngayThi: baiThi.ngayThi,
                        ngayNop: baiThi.ngayNop
                    };
                }
                return nv;
            });

            const updatedNhaMay = danhSachNhaMay.map(nm => {
                const baiThi = danhSachBaiThi.find(bt => bt.email && bt.email === nm.email);
                if (baiThi) {
                    return {
                        ...nm,
                        email: baiThi.email || nm.email,
                        trangThai: baiThi.diemSo !== null && baiThi.ngayNop !== null ? 'DaHoanThanh' : 'DangLam',
                        diemSo: baiThi.diemSo,
                        ngayThi: baiThi.ngayThi,
                        ngayNop: baiThi.ngayNop
                    };
                }
                return nm;
            });

            setDanhSachNV(updatedNV as any);
            setDanhSachNhaMay(updatedNhaMay as any);
        }
    }, [danhSachBaiThi, danhSachNV, danhSachNhaMay]);

    // Hàm sắp xếp dữ liệu (giữ nguyên)
    const sortData = (data: NhanVien[]) => {
        return [...data].sort((a, b) => {
            if (a.trangThai === 'DaHoanThanh' && b.trangThai === 'DaHoanThanh') {
                return (b.diemSo || 0) - (a.diemSo || 0);
            }
            if (a.trangThai === 'DaHoanThanh') return -1;
            if (b.trangThai === 'DaHoanThanh') return 1;
            if (a.trangThai === 'DangLam' && b.trangThai !== 'DangLam') return -1;
            if (b.trangThai === 'DangLam' && a.trangThai !== 'DangLam') return 1;
            return 0;
        });
    };

    // Lọc dữ liệu theo trạng thái và tìm kiếm tên (giữ nguyên)
    const filteredNV = useMemo(() => {
        const sorted = sortData(danhSachNV);
        let filtered = sorted;
        if (statusFilter !== 'all') {
            filtered = filtered.filter(nv => nv.trangThai === statusFilter);
        }
        if (searchTerm) {
            filtered = filtered.filter(nv => 
                nv.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return filtered;
    }, [danhSachNV, statusFilter, searchTerm]);

    const filteredNhaMay = useMemo(() => {
        const sorted = sortData(danhSachNhaMay);
        let filtered = sorted;
        if (statusFilter !== 'all') {
            filtered = filtered.filter(nm => nm.trangThai === statusFilter);
        }
        if (searchTerm) {
            filtered = filtered.filter(nm => 
                nm.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return filtered;
    }, [danhSachNhaMay, statusFilter, searchTerm]);

    if (!isMounted || isLoading) return <p>Đang tải...</p>;
    if (error) return <p>Lỗi: {(error as Error).message}</p>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Theo Dõi Bài Thi</h1>
            <p className="text-sm text-gray-500 mb-4">Dữ liệu được cập nhật mỗi 1 giây.</p>

            {/* Bộ lọc trạng thái và tìm kiếm */}
            <div className="mb-4 flex gap-4">
                <div>
                    <label className="mr-2">Lọc theo trạng thái:</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="p-2 border rounded"
                    >
                        <option value="all">Tất cả</option>
                        <option value="DaHoanThanh">Đã Hoàn Thành</option>
                        <option value="DangLam">Đang Làm</option>
                        <option value="ChuaLam">Chưa Làm</option>
                    </select>
                </div>
                <div>
                    <label className="mr-2">Tìm kiếm tên:</label>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Nhập tên để tìm..."
                        className="p-2 border rounded w-64"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-4">
                <div className="flex border-b">
                    <button
                        className={`px-4 py-2 ${activeTab === 'nhanVien' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
                        onClick={() => setActiveTab('nhanVien')}
                    >
                        Nhân Viên Công Ty
                    </button>
                    <button
                        className={`px-4 py-2 ${activeTab === 'nhaMay' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
                        onClick={() => setActiveTab('nhaMay')}
                    >
                        Nhà Máy
                    </button>
                </div>
            </div>

            {/* Nội dung của tab */}
            <div>
                {activeTab === 'nhanVien' && renderTable(filteredNV, "Danh sách nhân viên công ty")}
                {activeTab === 'nhaMay' && renderTable(filteredNhaMay, "Danh sách nhà máy")}
            </div>
        </div>
    );
}