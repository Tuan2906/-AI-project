'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query'; // Import useMutation
import Link from 'next/link';

// Define the type for credentials
interface Credentials {
  email: string;
  password: string;
}

// Define the mutation function
// It takes credentials and calls signIn
// It throws an error if signIn returns an error, so useMutation can catch it
const signInMutationFn = async (credentials: Credentials) => {
  const response = await signIn('credentials', {
    ...credentials,
    redirect: false, // Keep redirect false to handle response here
  });

  // Log the raw response for debugging if needed
  console.log('signIn response:', response);

  if (response?.error) {
    // Throw the specific error message from next-auth
    throw new Error(response.error);
  }

  if (!response?.ok) {
    // Handle other potential non-error but failed states (e.g., network issue reported by next-auth)
    throw new Error('Sign in failed. Please try again.');
  }

  // If successful, return the response (or void/true if you don't need the response data)
  return response;
};

export default function Form() {
  const router = useRouter();

  // Use the useMutation hook
  const mutation = useMutation({
    mutationFn: signInMutationFn, // The async function to call
    onSuccess: (data) => {
      // This runs if the mutationFn doesn't throw an error
      console.log('Sign in successful:', data);
      router.push('/dashboard'); // Navigate on success
      router.refresh(); // Refresh server components if needed
    },
    onError: (error) => {
      // This runs if mutationFn throws an error
      // The error state (mutation.error) is already set automatically.
      console.error('Sign in error:', error);
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Basic client-side validation (optional but recommended)
    if (!email || !password) {
      console.error("Email and password are required");
      // Optionally set a local error state here for form validation,
      // or rely on the required attribute of the input fields.
      return;
    }

    // Trigger the mutation
    mutation.mutate({ email, password });
  };

  // --- BẮT ĐẦU PHẦN GIAO DIỆN ---
  return (
    // Container bao ngoài toàn bộ trang, căn giữa nội dung theo chiều dọc
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">

      {/* Phần tiêu đề và link tạo tài khoản */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 max-w">
          Or{' '} {/* Khoảng trắng */}
          {/* /register */}
          <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
            create an account
          </Link>
        </p>
      </div>

      {/* Phần thẻ chứa form chính */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Form đăng nhập */}
          <form onSubmit={handleSubmit} className="space-y-6"> {/* space-y-6 tạo khoảng cách giữa các phần tử con */}

            {/* Khu vực hiển thị lỗi */}
            {mutation.isError && (
              <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert"> {/* Tailwind classes cho alert lỗi */}
                <span className="font-medium">Lỗi đăng nhập:</span>{' '} {/* Chữ đậm */}
                {/* Hiển thị thông báo lỗi từ mutation state */}
                {mutation.error instanceof Error ? mutation.error.message : 'Đã xảy ra lỗi không xác định.'}
              </div>
            )}

            {/* Ô nhập Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1"> {/* Khoảng cách nhỏ phía trên input */}
                <input
                  id="email"
                  name="email" // Quan trọng cho FormData
                  type="email"
                  autoComplete="email" // Hỗ trợ tự động điền
                  required // Bắt buộc nhập
                  // Các class của Tailwind cho input field
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your email address"
                  disabled={mutation.isPending} // Vô hiệu hóa khi đang gửi request
                />
              </div>
            </div>

            {/* Ô nhập Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password" // Quan trọng cho FormData
                  type="password"
                  autoComplete="current-password" // Hỗ trợ tự động điền
                  required // Bắt buộc nhập
                  // Các class của Tailwind cho input field
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your password"
                  disabled={mutation.isPending} // Vô hiệu hóa khi đang gửi request
                />
              </div>
            </div>

            {/* Hàng chứa "Remember me" và "Forgot password" */}
            <div className="flex items-center justify-between"> {/* Căn chỉnh các item và giãn cách đều */}
              {/* Phần "Remember me" */}
              <div className="flex items-center">
                <input
                  id="remember_me"
                  name="remember_me"
                  type="checkbox"
                  // Các class của Tailwind cho checkbox
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-900"> {/* Khoảng cách trái */}
                  Remember me
                </label>
              </div>

              {/* Phần "Forgot password" */}
              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </a>
              </div>
            </div>

            {/* Nút Submit */}
            <div>
              <button
                type="submit"
                disabled={mutation.isPending} // Vô hiệu hóa khi đang gửi request
                // Các class của Tailwind cho nút submit, bao gồm cả style khi bị disable
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {/* Thay đổi text của nút dựa vào trạng thái loading */}
                {mutation.isPending ? 'Đang đăng nhập...' : 'Sign in'}
              </button>
            </div>
          </form> {/* Kết thúc form */}

          {/* Phần phân cách "Or continue with" */}

          {/* Phần các nút đăng nhập mạng xã hội */}
          <div className="mt-6">
            <div className="relative">
              {/* Container tương đối để định vị đường kẻ */}
              <div className="absolute inset-0 flex items-center">
                {/* Container tuyệt đối để chứa đường kẻ */}
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                {/* Container tương đối cho text, căn giữa */}
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <div>
                <a
                  href="#" // Thay đổi link nếu cần
                  className="w-full inline-flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  {/* Icon Google (SVG mới, đơn giản và không lỗi font) */}
                  {/* <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.111.82-.26.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.333-1.754-1.333-1.754-1.09-.745.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.332-5.466-5.93 0-1.31.467-2.381 1.235-3.221-.123-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23.957-.266 1.98-.399 3-.405 1.02.006 2.043.139 3 .405 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.12 3.176.77.84 1.234 1.911 1.234 3.221 0 4.61-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .319.216.694.825.576C20.565 21.795 24 17.298 24 12 24 5.373 18.627 0 12 0z"
                      fill="#4285F4"
                    />
                  </svg> */}
                  {/* Tên "Sign in with Google" hiển thị bên cạnh icon */}
                  <span>Sign in with Google</span>
                </a>
              </div>
            </div>
          </div>

        </div> {/* Kết thúc thẻ chứa form */}
      </div> {/* Kết thúc container thẻ form */}
    </div> // Kết thúc container toàn trang
  );
  // --- KẾT THÚC PHẦN GIAO DIỆN ---
}