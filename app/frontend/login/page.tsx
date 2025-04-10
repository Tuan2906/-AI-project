import { getServerSession } from 'next-auth';
import Form from './form';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../components/ui/button';

export default async function LoginPage() {
  const session = await getServerSession();
  if (session) {
    redirect('/');
  }

  return (
    <div>
     <header className="bg-white border-b">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="text-lg font-bold">
          Trang chủ
        </Link>
        <Link href="/baithi">
          <Button>Thi AI</Button>
        </Link>
      </nav>
    </header>
      <Form />
    </div>
  );
}
