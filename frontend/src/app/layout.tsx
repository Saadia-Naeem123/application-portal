import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import Shell from '@/components/layout/Shell';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Smart University Complaint & Application Management System',
  description: 'Centralized platform for university applications and complaints',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <AuthProvider>
          <ToastProvider>
            <Shell>{children}</Shell>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
