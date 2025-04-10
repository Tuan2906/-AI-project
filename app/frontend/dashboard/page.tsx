// app/dashboard/page.tsx
'use client';

import { signOut, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarInset, SidebarProvider } from '../components/ui/sidebar';
import { AppSidebar } from '../components/app-sidebar';
import { SiteHeader } from '../components/site-header';
import { ChartAreaInteractive } from '../components/chart-area-interactive';
import { SectionCards } from '../components/section-cards';
import TranscriptVideo from '../transcript-video/page';
import QuanLyBaiThi from '../baithi/quanlybaithi';

// Hàm phân tích JWT token
function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    console.error('Lỗi khi phân tích JWT:', e);
    return { exp: 0 };
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status }: any = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/login');
    },
  });

  // Trạng thái để theo dõi view hiện tại
  const [currentView, setCurrentView] = useState('dashboard');

  // Xử lý khi bấm vào mục trong sidebar
  const handleItemClick = (url: string) => {
    if (url === '/transcript-video') {
      setCurrentView('transcript-video');
    } else if (url === '/reports') {
      setCurrentView('reports');
    } else if (url === '/word-assistant') {
      setCurrentView('word-assistant');
    }
    else if (url === '/quan-ly-bai-thi') {
      setCurrentView('quan-ly-bai-thi');
    } 
    else {
      setCurrentView('dashboard');
    }
  };

  // Xử lý thời gian hết hạn của token
  useEffect(() => {
    if (status === 'loading' || !session?.access_token) return;

    const { exp } = parseJwt(session.access_token);
    const expiryTime = exp * 1000 - Date.now();

    if (expiryTime <= 0) {
      signOut({ callbackUrl: '/login' });
      return;
    }

    const timeout = setTimeout(() => {
      signOut({ callbackUrl: '/login' });
    }, expiryTime);

    return () => clearTimeout(timeout);
  }, [session, status, router]);

  // Xử lý đăng xuất
  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.replace('/login');
  };

  // Hiển thị trạng thái đang tải
  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Đang tải...</div>;
  }

  // Ánh xạ currentView thành tiêu đề
  const getTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Documents';
      case 'transcript-video':
        return 'Transcript Video';
      case 'reports':
        return 'Reports';
      case 'word-assistant':
        return 'Word Assistant';
      case 'quan-ly-bai-thi': // Thêm tiêu đề cho Quản lý bài thi
        return 'Quản lý bài thi';
      default:
        return 'Documents';
    }
  };

  // Render nội dung dựa trên view hiện tại
  const renderContent = () => {
    console.log("dadddasda", currentView);
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <SectionCards />
                <div className="px-4 lg:px-6">
                  <ChartAreaInteractive />
                </div>
              </div>
            </div>
          </div>
        );
      case 'transcript-video':
        return <TranscriptVideo />;
      case 'quan-ly-bai-thi': // Thêm case cho Quản lý bài thi
        return <QuanLyBaiThi />;
      case 'reports':
        return (
          <div className="flex flex-1 flex-col p-4">
            <h1 className="text-2xl font-bold">Báo cáo</h1>
            <p>Chào mừng đến với trang Báo cáo!</p>
          </div>
        );
      
      case 'word-assistant':
        return (
          <div className="flex flex-1 flex-col p-4">
            <h1 className="text-2xl font-bold">Trợ lý Word</h1>
            <p>Chào mừng đến với trang Trợ lý Word!</p>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center min-h-screen">
            <p>Không tìm thấy trang</p>
          </div>
        );
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar
        variant="inset"
        onLogout={handleLogout}
        user={session.user}
        onItemClick={handleItemClick}
      />
      <SidebarInset>
        <SiteHeader title={getTitle()} /> {/* Truyền tiêu đề vào SiteHeader */}
        {renderContent()}
      </SidebarInset>
    </SidebarProvider>
  );
}