// app/frontend/reviewbaithi/[id]/page.tsx
'use client'; // Bắt buộc để sử dụng client-side features như useQuery

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation'; // Thay next/router bằng next/navigation

// Định nghĩa type cho câu hỏi
interface Question {
  id: number;
  dapAn: string;
  noiDung: string;
  dapAnDung: string;
}

interface ExamData {
  danhSachCauHoi: Question[];
}

interface ApiResponse {
  status: string;
  data: ExamData;
}

// Hàm fetch data
const fetchExamQuestions = async (examId: string): Promise<Question[]> => {
  const response = await fetch(`/api/getbaithibyid/${examId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch exam questions');
  }
  const data: ApiResponse = await response.json();
  return data.data.danhSachCauHoi;
};

const ExamQuestions = () => {
  const params = useParams(); // Lấy id từ path parameter
  const id = params.id as string; // params.id sẽ là string

  // TanStack Query hook với generic type
  const { 
    data, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useQuery<Question[], Error>({
    queryKey: ['examQuestions', id],
    queryFn: () => fetchExamQuestions(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500 mb-4">
          {error?.message || 'Đã có lỗi xảy ra khi tải câu hỏi'}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Danh sách câu hỏi</h1>
      
      {Array.isArray(data) && data.length > 0 ? (
        <div className="space-y-6">
          {data.map((question, index) => (
            <div
              key={question.id}
              className="bg-white p-6 rounded-lg shadow-md border border-gray-200"
            >
              <h3 className="font-semibold text-lg mb-4 text-gray-900">
                Câu {index + 1}: {question.noiDung}
              </h3>
              <div className="space-y-2">
                <p className="text-gray-700">
                  <span className="font-medium">Đáp án chọn:</span> {question.dapAn}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Đáp án đúng:</span>{' '}
                  <span
                    className={
                      question.dapAn === question.dapAnDung
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  >
                    {question.dapAnDung}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="font-medium">Kết quả:</span>{' '}
                  <span
                    className={
                      question.dapAn === question.dapAnDung
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  >
                    {question.dapAn === question.dapAnDung ? 'Đúng' : 'Sai'}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">
          Không có câu hỏi nào trong danh sách
        </p>
      )}
    </div>
  );
};

export default ExamQuestions;