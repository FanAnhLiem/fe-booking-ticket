import { CircleUser, Film, Ticket } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  return (
    // Header dính trên cùng (sticky), nền trắng mờ (backdrop-blur)
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-300">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* --- LOGO --- */}
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform duration-300">
            <Film className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold text-gray-800 tracking-tight leading-none group-hover:text-blue-600 transition-colors">
              CINE<span className="text-blue-600">TICKET</span>
            </span>
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">
              Booking Online
            </span>
          </div>
        </Link>

        {/* --- NAVIGATION (MENU GIỮA) --- */}
        <nav className="hidden md:block">
          {' '}
          {/* Ẩn trên mobile */}
          <ul className="flex items-center gap-8 text-[15px] font-semibold text-gray-600">
            <li>
              <Link
                href="/movie-showing"
                className="hover:text-blue-600 transition-colors relative group py-2"
              >
                Phim Đang Chiếu
                {/* Hiệu ứng gạch chân chạy ra từ giữa khi hover */}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            </li>
            <li>
              <Link
                href="/movie-coming-soon"
                className="hover:text-blue-600 transition-colors relative group py-2"
              >
                Phim Sắp Chiếu
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            </li>
            <li>
              <Link
                href="/my-tickets"
                className="hover:text-blue-600 transition-colors relative group py-2 flex items-center gap-1"
              >
                Vé Của Tôi
                {/* Tag 'Mới' nhỏ xinh nếu cần */}
                <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                  Hot
                </span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* --- ACCOUNT / ACTIONS --- */}
        <div className="flex items-center gap-4">
          {/* Nút Đăng nhập cách điệu */}
          <Link
            href="/sign-in"
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm text-gray-700 hover:bg-gray-100 transition-all duration-200 border border-gray-200 hover:border-blue-200"
          >
            <CircleUser className="w-5 h-5 text-gray-500" />
            <span>Đăng Nhập</span>
          </Link>

          {/* Nút Đặt vé nhanh (CTA) */}
          <Link
            href="/movie-showing"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-full font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all duration-200"
          >
            <Ticket className="w-4 h-4" />
            <span>Đặt Vé</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
