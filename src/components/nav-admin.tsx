'use client';

import { navs } from '@/datas/nav-admin-data';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

const BASE_API = 'http://localhost:8080/api';
const LOGOUT_API = `${BASE_API}/auth/logout`;

export function NavAdmin() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('accessToken')
          : null;

      // Gửi request logout kèm Bearer token để BE blacklist JWT
      if (token) {
        const res = await fetch(LOGOUT_API, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // cố gắng đọc body, nhưng không bắt buộc
        const data = await res.json().catch(() => null);

        if (!res.ok || (data && data.code !== 0)) {
          console.error('Logout API error:', data);
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Dù BE trả sao thì FE cũng coi như đã đăng xuất:
      // xoá token + điều hướng ra trang login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
      }

      toast.success('Đăng xuất thành công!');
      router.push('/sign-in');
    }
  };

  return (
    <div className="flex flex-col w-[260px] h-full bg-white border border-gray-200 rounded-2xl shadow-sm">
      {/* --- LOGO AREA --- */}
      <div className="flex items-center justify-center h-20 border-b border-gray-100">
        <div className="flex items-center gap-2 text-[#0c46d6]">
          <ShieldCheck size={32} strokeWidth={2.5} />
          <span className="text-2xl font-bold tracking-wide">
            Admin<span className="text-gray-800">Panel</span>
          </span>
        </div>
      </div>

      {/* --- NAVIGATION LIST --- */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
        <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Menu Chính
        </p>

        <ul className="space-y-1">
          {navs.map((nav) => {
            const isActive = pathname === nav.url;

            return (
              <li key={nav.url}>
                <Link
                  href={nav.url}
                  className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#0c46d6] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10">
                    {nav.icon}
                  </span>
                  <span>{nav.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* --- FOOTER / LOGOUT --- */}
      <div className="p-4 border-t border-gray-100">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut size={20} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}
