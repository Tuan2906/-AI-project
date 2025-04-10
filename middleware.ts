import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token, // Kiểm tra xem có token không
  },
});

// Cấu hình matcher để áp dụng middleware cho các route cụ thể
export const config = {
  matcher: ['/dashboard/:path*'], // Chỉ áp dụng cho /dashboard và các sub-route
};