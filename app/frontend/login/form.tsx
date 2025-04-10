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
          <div className="mt-6"> {/* Khoảng cách phía trên */}
            <div className="relative"> {/* Container tương đối để định vị đường kẻ */}
              <div className="absolute inset-0 flex items-center"> {/* Container tuyệt đối để chứa đường kẻ */}
                <div className="w-full border-t border-gray-300"></div> {/* Đường kẻ ngang */}
              </div>
              <div className="relative flex justify-center text-sm"> {/* Container tương đối cho text, căn giữa */}
                <span className="px-2 bg-white text-gray-500">Or continue with</span> {/* Text với background trắng để che đường kẻ */}
              </div>
            </div>

            {/* Phần các nút đăng nhập mạng xã hội */}
            <div className="mt-6 grid grid-cols-3 gap-3"> {/* Grid 3 cột với khoảng cách */}
              {/* Nút Facebook */}
              <div>
                <a
                  href="#" // Thay đổi link nếu cần
                  // Style chung cho các nút social
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span className="sr-only">Sign in with Facebook</span> {/* Cho screen reader */}
                  {/* Icon Facebook */}
                  <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>

              {/* Nút Twitter */}
              <div>
                <a
                  href="#" // Thay đổi link nếu cần
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span className="sr-only">Sign in with Twitter</span>
                  {/* Icon Twitter */}
                  <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              </div>

              {/* Nút Google */}
              <div>
                <a
                  href="#" // Thay đổi link nếu cần
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span className="sr-only">Sign in with Google</span>
                  {/* Icon Google (Simple version) */}
                  <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 4.418 2.865 8.147 6.839 9.489l.011-.003.017-.005a9.93 9.93 0 001.637-.407 9.935 9.935 0 003.06-.182c.9-.22 1.72-.545 2.47-.957a10.02 10.02 0 003.132-3.132c.412-.75.737-1.57.957-2.47a9.935 9.935 0 00.182-3.06 9.93 9.93 0 00.407-1.637l.005-.017.003-.011A9.954 9.954 0 0020 10c0-5.523-4.477-10-10-10zm5.33 11.139H10v-2.278h5.33c.08.43.12.879.12 1.339 0 3.132-2.12 5.33-5.45 5.33-3.04 0-5.51-2.47-5.51-5.51s2.47-5.51 5.51-5.51c1.4 0 2.64.53 3.6.1.43l1.75-1.68c-1.17-1.1-2.75-1.78-4.55-1.78-3.78 0-6.85 3.07-6.85 6.85s3.07 6.85 6.85 6.85c3.97 0 6.63-2.82 6.63-6.71 0-.49-.05-.95-.12-1.38z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div> {/* Kết thúc grid các nút social */}
          </div> {/* Kết thúc phần phân cách và social */}
        </div> {/* Kết thúc thẻ chứa form */}
      </div> {/* Kết thúc container thẻ form */}
    </div> // Kết thúc container toàn trang
  );
  // --- KẾT THÚC PHẦN GIAO DIỆN ---
}