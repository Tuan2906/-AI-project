// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { getServerSession } from 'next-auth';
import Link from 'next/link'; // Keep Link if used elsewhere
import Logout from './logout';
import Providers from './providers'; // Import the new Providers component

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Exam',
  description: 'A hub for Next.js development resources',
  icons: {
    icon: '/favicon.ico',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // You can still fetch server-side data here
  const session = await getServerSession();

  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Wrap the main content and navigation with Providers */}
        <Providers>
          {false && 
          <nav>
          {!!session && <Logout />}
          {/* Example: Conditionally show login link */}
          {/* {!session && <Link href="/login">Login</Link>} */}
        </nav>
          }
          
          <main>{children}</main> {/* Render children inside Providers */}
        </Providers>
      </body>
    </html>
  );
}