'use client';

import { navs } from '@/datas/nav-admin-data';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, ShieldCheck } from 'lucide-react';

export function NavAdmin() {
  const pathname = usePathname(); 

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
        <ul>
          {navs.map((nav, index) => {
            // Kiểm tra xem link này có đang active không
            const isActive =
              pathname === nav.url || pathname.startsWith(`${nav.url}/`);

            return (
              <li key={index}>
                <Link
                  href={nav.url}
                  className={`
                    group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm
                    ${
                      isActive
                        ? 'bg-[#0c46d6] text-white shadow-md shadow-blue-200' // Style khi Active
                        : 'text-gray-600 hover:bg-gray-50 hover:text-[#0c46d6]' // Style bình thường
                    }
                  `}
                >
                  {/* Clone icon để đổi màu hoặc kích thước nếu cần */}
                  <span
                    className={`${
                      isActive
                        ? 'text-white'
                        : 'text-gray-400 group-hover:text-[#0c46d6]'
                    }`}
                  >
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
        <button className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors">
          <LogOut size={20} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}
