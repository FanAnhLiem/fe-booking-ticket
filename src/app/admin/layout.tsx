import { NavAdmin } from '@/components/nav-admin';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Admin Management System',
};

export default function PageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#f3f4f6] text-gray-800`}>
        <div className="flex h-screen p-4 gap-4 overflow-hidden">
          {/* Sidebar - Không cuộn theo trang */}
          <aside className="shrink-0 h-full">
            <NavAdmin />
          </aside>

          {/* Main Content - Cuộn độc lập */}
          <main className="flex-1 h-full overflow-y-auto bg-white rounded-2xl border border-gray-200 shadow-sm relative">
            {/* Thêm wrapper để padding nội dung bên trong đẹp hơn */}
            <div className="min-h-full">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
