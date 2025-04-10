// ./app/auth/register/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';

// Định nghĩa kiểu dữ liệu cho thông tin gửi OTP
interface SendOTPCredentials {
  email: string;
}

// Định nghĩa kiểu dữ liệu cho thông tin đăng ký gửi lên API
interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

// Định nghĩa kiểu dữ liệu cho response của API send-otp
interface SendOTPResponse {
  message: string;
  email: string;
  otp: string;
  otp_expires_at: number; // Thời gian hết hạn (timestamp)
}

// Hàm gọi API gửi OTP
const sendOTPMutationFn = async (credentials: SendOTPCredentials) => {
  const response = await fetch(`/api/sendOTP`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Gửi mã OTP không thành công. Vui lòng thử lại.');
  }

  // Thêm thời gian hết hạn (10 phút từ thời điểm hiện tại) vào response
  data.otp_expires_at = Date.now() + 10 * 60 * 1000; // 10 phút
  return data as SendOTPResponse;
};

// Hàm gọi API đăng ký
const registerMutationFn = async (credentials: RegisterCredentials) => {
  const response = await fetch(`/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Đăng ký không thành công. Vui lòng thử lại.');
  }

  return data;
};

export default function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp' | 'register'>('email'); // Quản lý bước: nhập email, nhập OTP, nhập thông tin đăng ký
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [serverOtp, setServerOtp] = useState<string | null>(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null); // Thời gian còn lại của OTP

  // Mutation để gửi OTP
  const sendOTPMutation = useMutation({
    mutationFn: sendOTPMutationFn,
    onSuccess: (data) => {
      console.log('OTP sent successfully:', data);
      setServerOtp(data.otp);
      setOtpExpiresAt(data.otp_expires_at);
      setStep('otp'); // Chuyển sang bước nhập OTP
    },
    onError: (error) => {
      console.error('Send OTP error:', error);
    },
  });

  // Mutation để đăng ký
  const registerMutation = useMutation({
    mutationFn: registerMutationFn,
    onSuccess: (data) => {
      console.log('Registration successful:', data);
      alert('Đăng ký thành công! Bạn sẽ được chuyển hướng đến trang đăng nhập.');
      router.push('/login');
    },
    onError: (error) => {
      console.error('Registration error:', error);
    },
  });

  // Tính toán thời gian còn lại của OTP
  useEffect(() => {
    if (!otpExpiresAt) return;

    const interval = setInterval(() => {
      const timeRemaining = otpExpiresAt - Date.now();
      setTimeLeft(timeRemaining > 0 ? timeRemaining : 0);

      if (timeRemaining <= 0) {
        setOtpError('Mã OTP đã hết hạn. Vui lòng gửi lại mã.');
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [otpExpiresAt]);

  // Xử lý submit form nhập email để gửi OTP
  const handleEmailSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const emailInput = formData.get('email') as string;

    if (!emailInput) {
      setOtpError('Vui lòng nhập email.');
      return;
    }

    setEmail(emailInput);
    sendOTPMutation.mutate({ email: emailInput });
  };

  // Xử lý submit form nhập OTP
  const handleOTPSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setOtpError(null);

    const formData = new FormData(e.currentTarget);
    const otpInput = formData.get('otp') as string;

    if (!otpInput) {
      setOtpError('Vui lòng nhập mã OTP.');
      return;
    }

    if (!serverOtp) {
      setOtpError('Không có mã OTP để xác thực. Vui lòng gửi lại mã.');
      return;
    }

    if (otpInput !== serverOtp) {
      setOtpError('Mã OTP không đúng. Vui lòng kiểm tra lại.');
      return;
    }

    if (timeLeft && timeLeft <= 0) {
      setOtpError('Mã OTP đã hết hạn. Vui lòng gửi lại mã.');
      return;
    }

    // Nếu OTP khớp, chuyển sang bước nhập thông tin đăng ký
    setOtp(otpInput);
    setStep('register');
  };

  // Xử lý submit form đăng ký
  const handleRegisterSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setConfirmPasswordError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('fullName') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!name || !password || !confirmPassword) {
      console.error('Vui lòng điền đầy đủ thông tin.');
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Mật khẩu xác nhận không khớp.');
      return;
    }

    // Gọi API đăng ký
    registerMutation.mutate({ name, email, password });
  };

  // Xử lý gửi lại OTP
  const handleResendOTP = () => {
    setOtpError(null);
    setOtp('');
    sendOTPMutation.mutate({ email });
  };

  // Format thời gian còn lại
  const formatTimeLeft = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Bước 1: Nhập email để gửi OTP
  if (step === 'email') {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Xác Thực Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 max-w">
            Vui lòng nhập email để nhận mã OTP.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              {/* Hiển thị lỗi từ API gửi OTP */}
              {sendOTPMutation.isError && (
                <div
                  className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg"
                  role="alert"
                >
                  <span className="font-medium">Lỗi:</span>{' '}
                  {sendOTPMutation.error instanceof Error
                    ? sendOTPMutation.error.message
                    : 'Đã xảy ra lỗi không xác định.'}
                </div>
              )}

              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Enter your email address"
                    disabled={sendOTPMutation.isPending}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={sendOTPMutation.isPending}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendOTPMutation.isPending ? 'Đang gửi mã OTP...' : 'Gửi Mã OTP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Bước 2: Nhập OTP
  if (step === 'otp') {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Xác Thực Mã OTP
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 max-w">
            Vui lòng nhập mã OTP đã được gửi đến email: <strong>{email}</strong>
          </p>
          {timeLeft !== null && (
            <p className="mt-2 text-center text-sm text-gray-600 max-w">
              Thời gian còn lại: <strong>{formatTimeLeft(timeLeft)}</strong>
            </p>
          )}
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form onSubmit={handleOTPSubmit} className="space-y-6">
              {/* Hiển thị lỗi từ xác thực OTP */}
              {otpError && (
                <div
                  className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg"
                  role="alert"
                >
                  <span className="font-medium">Lỗi:</span> {otpError}
                </div>
              )}

              {/* OTP Input */}
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                  Mã OTP
                </label>
                <div className="mt-1">
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Nhập mã OTP (5 chữ số)"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Xác Thực OTP
                </button>
              </div>

              {/* Resend OTP Button */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={Boolean(sendOTPMutation.isPending || (timeLeft && timeLeft > 0))}                  className="text-sm text-indigo-600 hover:text-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendOTPMutation.isPending ? 'Đang gửi lại...' : 'Gửi lại mã OTP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Bước 3: Nhập thông tin đăng ký
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 max-w">
          Email đã được xác thực: <strong>{email}</strong>
        </p>
        <p className="mt-2 text-center text-sm text-gray-600 max-w">
          Already have an account?{' '}
          <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </a>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleRegisterSubmit} className="space-y-6">
            {/* Hiển thị lỗi chung từ API */}
            {registerMutation.isError && (
              <div
                className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg"
                role="alert"
              >
                <span className="font-medium">Lỗi đăng ký:</span>{' '}
                {registerMutation.error instanceof Error
                  ? registerMutation.error.message
                  : 'Đã xảy ra lỗi không xác định.'}
              </div>
            )}

            {/* Hiển thị lỗi confirm password */}
            {confirmPasswordError && (
              <div
                className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg"
                role="alert"
              >
                <span className="font-medium">Lỗi:</span> {confirmPasswordError}
              </div>
            )}

            {/* Full Name Input */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your full name"
                  disabled={registerMutation.isPending}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your password"
                  disabled={registerMutation.isPending}
                />
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className={`appearance-none rounded-md relative block w-full px-3 py-2 border ${
                    confirmPasswordError ? 'border-red-500' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                  placeholder="Confirm your password"
                  disabled={registerMutation.isPending}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {registerMutation.isPending ? 'Đang đăng ký...' : 'Register'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}