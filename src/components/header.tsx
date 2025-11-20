'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { CircleUser, Film, Ticket } from 'lucide-react';
import {
  CustomJwtPayload,
  getPayloadFromToken,
  isTokenExpired,
} from '@/utils/jwt';

const BASE_API = 'http://localhost:8080/api';

interface AuthState {
  isAuthenticated: boolean;
  role?: string;
  email?: string;
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
  });

  // Khi load app, đọc token từ localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setAuth({ isAuthenticated: false });
      return;
    }

    // Token hết hạn thì xóa
    if (isTokenExpired(token)) {
      localStorage.removeItem('accessToken');
      setAuth({ isAuthenticated: false });
      return;
    }

    const payload = getPayloadFromToken<CustomJwtPayload>(token);
    if (!payload) {
      setAuth({ isAuthenticated: false });
      return;
    }

    setAuth({
      isAuthenticated: true,
      role: payload.role,
      email: (payload as any).email || payload.sub || '',
    });
  }, []);

  // ==== LOGOUT: gọi BE + xóa token + update UI ====
  const handleLogout = async () => {
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('accessToken')
          : null;

      await fetch(`${BASE_API}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Dù BE trả gì thì FE vẫn xóa token & reset state
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
      }
      setAuth({ isAuthenticated: false });
      router.push('/home');
      router.refresh();
    }
  };

  const navItemClass = (href: string) =>
    `relative py-2 text-sm font-medium transition-colors ${
      pathname === href ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
    }`;

  const navUnderlineClass = (href: string) =>
    `absolute bottom-0 left-0 h-0.5 bg-blue-600 transition-all duration-300 ${
      pathname === href ? 'w-full' : 'w-0 group-hover:w-full'
    }`;

  const shortEmail =
    auth.email && auth.email.length > 22
      ? auth.email.slice(0, 22) + '…'
      : auth.email;

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
        {/* LOGO */}
        <Link href="/home" className="flex items-center gap-2 group cursor-pointer">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300">
            <Film className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold text-gray-900 tracking-tight leading-none group-hover:text-blue-600 transition-colors">
              CINE<span className="text-blue-600">TICKET</span>
            </span>
            <span className="text-xs text-gray-500">Đặt vé xem phim online</span>
          </div>
        </Link>

        {/* NAV TRUNG TÂM */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/home" className={`group ${navItemClass('/home')}`}>
            Trang chủ
            <span className={navUnderlineClass('/home')} />
          </Link>
          <Link
            href="/movie-showing"
            className={`group ${navItemClass('/movie-showing')}`}
          >
            Phim đang chiếu
            <span className={navUnderlineClass('/movie-showing')} />
          </Link>
          <Link
            href="/movie-coming-soon"
            className={`group ${navItemClass('/movie-coming-soon')}`}
          >
            Phim sắp chiếu
            <span className={navUnderlineClass('/movie-coming-soon')} />
          </Link>
          <Link
            href="/my-tickets"
            className={`group ${navItemClass('/my-tickets')}`}
          >
            Vé của tôi
            <span className={navUnderlineClass('/my-tickets')} />
          </Link>

          {/* ➕ MỤC MỚI: TẤT CẢ CÁC RẠP */}
          <Link
            href="/cinemas"
            className={`group ${navItemClass('/cinemas')}`}
          >
            Tất cả các rạp
            <span className={navUnderlineClass('/cinemas')} />
          </Link>
        </nav>

        {/* KHU VỰC PHẢI: AUTH + CTA */}
        <div className="flex items-center gap-3">
          {auth.isAuthenticated ? (
            <>
              {/* Thông tin user */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100">
                <CircleUser className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">
                  {shortEmail || 'Người dùng'}
                </span>
              </div>

              {/* Nút Admin nếu là ADMIN */}
              {auth.role === 'ADMIN' && (
                <Link
                  href="/admin/statistical"
                  className="hidden sm:inline-flex text-xs px-3 py-1.5 rounded-full border border-amber-400 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                >
                  Admin
                </Link>
              )}

              {/* Nút Đăng xuất */}
              <button
                onClick={handleLogout}
                className="text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            // Chưa đăng nhập
            <>
              <Link
                href="/sign-in"
                className="text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                href="/sign-up"
                className="hidden sm:inline-flex text-xs sm:text-sm px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
              >
                Đăng ký
              </Link>
            </>
          )}

          {/* CTA Đặt vé – cho user đi thẳng vào phần phim đang chiếu */}
          <Link
            href="/movie-showing"
            className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white text-xs sm:text-sm font-semibold shadow-md hover:bg-blue-700 hover:-translate-y-0.5 transition-all duration-200"
          >
            <Ticket className="w-4 h-4" />
            <span>Đặt vé</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
