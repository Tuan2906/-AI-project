import { redirect } from 'next/navigation';

export default function Home() {
  // Chuyển hướng đến trang login
  redirect('/baithi');

  // Không cần return gì vì redirect sẽ xử lý
  return null;
}