'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

type CauHoi = {
    id: number;
    noiDung: string;
    dapAN: string;
    dapANDung: string;
};

type BaiThi = {
    hoTen: string;
    email: string | null;
    diemSo: number;
    soCauDung: number;
    noiDungBaiThi: CauHoi[]; // JSON chứa danh sách câu hỏi
    ngayThi: string;
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


export default function QuanLyBaiThi() {
    console.log("voii   ");

    const [selectedBaiThi, setSelectedBaiThi] = useState<BaiThi | null>(null); // State để lưu bài thi được chọn
    const [isModalOpen, setIsModalOpen] = useState(false); // State để điều khiển modal
    const [selectedDate, setSelectedDate] = useState<string | null>(null); // State để lưu ngày thi được chọn

    const { data: danhSachBaiThi, isLoading, error } = useQuery({
        queryKey: ['danhSachBaiThi'],
        queryFn: fetchDanhSachBaiThi,
        refetchInterval: 1000, // Cập nhật mỗi 1 giây
        refetchOnWindowFocus: false, // Không refetch khi focus lại
        staleTime: 0, // Dữ liệu luôn được coi là "stale" để refetch ngay
    });

    const handleDownloadExcel = async () => {
        if (!danhSachBaiThi || !selectedDate) {
            alert('Vui lòng chọn ngày thi trước khi tải!');
            return;
        }

        const filteredData = danhSachBaiThi.filter(
            (baiThi) => new Date(baiThi.ngayThi).toDateString() === selectedDate
        );

        if (filteredData.length === 0) {
            alert('Không có dữ liệu để tải cho ngày này!');
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('DanhSachBaiThi');

        worksheet.columns = [
            { header: 'STT', key: 'stt', width: 10 },
            { header: 'Họ và Tên', key: 'hoTen', width: 20 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Điểm Số', key: 'diemSo', width: 15 },
            { header: 'Số Câu Đúng', key: 'soCauDung', width: 15 },
            { header: 'Ngày Thi', key: 'ngayThi', width: 15 },
        ];

        filteredData.forEach((baiThi, index) => {
            worksheet.addRow({
                stt: index + 1,
                hoTen: baiThi.hoTen,
                email: baiThi.email || 'Không có email',
                diemSo: baiThi.diemSo,
                soCauDung: `${baiThi.soCauDung} / ${baiThi.noiDungBaiThi.length}`, // Update format for Excel
                ngayThi: new Date(baiThi.ngayThi).toLocaleDateString('vi-VN'),
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `DanhSachBaiThi_${new Date(selectedDate).toISOString().split('T')[0]}.xlsx`);
    };

    // Hàm mở modal và hiển thị chi tiết bài thi
    const openModal = (baiThi: BaiThi) => {
        setSelectedBaiThi(baiThi);
        setIsModalOpen(true);
    };

    // Hàm đóng modal
    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedBaiThi(null);
    };

    if (isLoading) return <p>Đang tải...</p>;
    if (error) return <p>Lỗi: {(error as Error).message}</p>;

    const groupedByDate = danhSachBaiThi?.reduce((acc: { [key: string]: BaiThi[] }, baiThi) => {
        const dateKey = new Date(baiThi.ngayThi).toDateString();
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(baiThi);
        return acc;
    }, {});

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Quản Lý Bài Thi</h1>

            {/* Dropdown để chọn ngày thi */}
            {groupedByDate && Object.keys(groupedByDate).length > 0 && (
                <div className="mb-6 flex items-center space-x-4">
                    <label htmlFor="dateSelect" className="text-lg font-semibold">
                        Chọn ngày thi:
                    </label>
                    <select
                        id="dateSelect"
                        value={selectedDate || ''}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="border p-2 rounded"
                    >
                        <option value="" disabled>
                            -- Chọn ngày --
                        </option>
                        {Object.keys(groupedByDate).map((dateKey, index) => (
                            <option key={index} value={dateKey}>
                                {new Date(dateKey).toLocaleDateString('vi-VN')}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={handleDownloadExcel}
                        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                        disabled={!selectedDate}
                    >
                        Tải Excel
                    </button>
                </div>
            )}

            {/* Modal hiển thị chi tiết bài thi */}
            {isModalOpen && selectedBaiThi && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-11/12 max-w-2xl max-h-[80vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Chi tiết bài thi của {selectedBaiThi.hoTen}</h2>
                        {/* Hiển thị số câu đúng / tổng số câu hỏi */}
                        <p className="text-lg font-semibold mb-4">
                            Số câu đúng: {selectedBaiThi.soCauDung} / {selectedBaiThi.noiDungBaiThi.length}
                        </p>
                        <div className="space-y-4">
                            {selectedBaiThi.noiDungBaiThi.map((cauHoi: any, index) => (
                                <div key={index} className="border-b pb-2">
                                    <p className="font-semibold">Câu {index + 1}: {cauHoi.noiDung}</p>
                                    <p>
                                        Đáp án chọn:{" "}
                                        <span
                                            className={
                                                cauHoi.dapAn === cauHoi.dapAnDung ? "text-green-600" : "text-red-600"
                                            }
                                        >
                                            {cauHoi.dapAn || "Không có đáp án"}
                                        </span>
                                    </p>
                                    <p>
                                        Đáp án đúng:{" "}
                                        <span className="text-green-600">
                                            {cauHoi.dapAnDung || "Không có đáp án"}
                                        </span>
                                    </p>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={closeModal}
                            className="mt-4 bg-red-500 text-white p-2 rounded hover:bg-red-600"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            )}

            {/* Hiển thị danh sách bài thi theo ngày */}
            {groupedByDate ? (
                Object.keys(groupedByDate).map((dateKey, index) => (
                    <div key={index} className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-lg font-semibold">
                                Ngày thi: {new Date(dateKey).toLocaleDateString('vi-VN')}
                            </h2>
                        </div>

                        <table className="w-full border-collapse border">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="border p-2">STT</th>
                                    <th className="border p-2">Họ và Tên</th>
                                    <th className="border p-2">Email</th>
                                    <th className="border p-2">Điểm Số</th>
                                    <th className="border p-2">Số Câu Đúng</th>
                                    <th className="border p-2">Ngày Thi</th>
                                    <th className="border p-2">Thông tin bài làm</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupedByDate[dateKey].map((baiThi, idx) => (
                                    <tr key={idx} className="hover:bg-gray-100">
                                        <td className="border p-2 text-center">{idx + 1}</td>
                                        <td className="border p-2">{baiThi.hoTen}</td>
                                        <td className="border p-2">{baiThi.email || 'Không có email'}</td>
                                        <td className="border p-2 text-center">{baiThi.diemSo}</td>
                                        <td className="border p-2 text-center">
                                            {baiThi.soCauDung} / {baiThi.noiDungBaiThi.length}
                                        </td>
                                        <td className="border p-2 text-center">
                                            {new Date(baiThi.ngayThi).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="border p-2 text-center">
                                            <button
                                                onClick={() => openModal(baiThi)}
                                                className="text-blue-500 hover:underline"
                                            >
                                                Xem chi tiết
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))
            ) : (
                <p>Không có dữ liệu bài thi.</p>
            )}
        </div>
    );
}