import { TypeMovie } from '@/types/alltypes';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Clock, Tag, Ticket } from 'lucide-react';

export default function Movie({ movie }: { movie: TypeMovie }) {
  return (
    // Thêm min-w-[200px] để đảm bảo thẻ không bị bóp quá bé
    <div className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:-translate-y-2 transition-all duration-300 border border-gray-100 min-w-[200px]">
      {/* --- PHẦN HÌNH ẢNH (CLICK -> CHI TIẾT) --- */}
      <Link
        href={`/movie/${movie.id}`}
        className="relative w-full aspect-[2/3] overflow-hidden bg-gray-200"
      >
        <Image
          src={movie.posterUrl}
          alt={movie.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* sửa bg-linear-to-t -> bg-gradient-to-t cho tailwind chạy đúng */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
      </Link>

      {/* --- PHẦN NỘI DUNG --- */}
      <div className="flex flex-col grow p-4 space-y-4">
        {/* Tên phim (CLICK -> CHI TIẾT) */}
        <Link href={`/movie/${movie.id}`}>
          <h3
            className="text-[22px] font-bold text-gray-800 leading-tight line-clamp-2 min-h-[2.25em] group-hover:text-blue-600 transition-colors"
            title={movie.name}
          >
            {movie.name}
          </h3>
        </Link>

        {/* Thông tin chi tiết */}
        <div className="space-y-3 text-sm text-gray-600 grow">
          {/* Dòng 1: Thể loại */}
          <div className="flex items-center gap-3">
            <Tag className="w-5 h-5 text-blue-500 shrink-0" />
            <div className="flex items-center w-full">
              <span className="font-bold text-gray-800 uppercase text-xs whitespace-nowrap min-w-[60px]">
                Thể loại:
              </span>
              <span
                className="font-medium truncate ml-1"
                title={movie.category}
              >
                {movie.category}
              </span>
            </div>
          </div>

          {/* Dòng 2: Thời lượng */}
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-green-500 shrink-0" />
            <div className="flex items-center w-full">
              <span className="font-bold text-gray-800 uppercase text-xs whitespace-nowrap min-w-[60px]">
                Thời lượng:
              </span>
              <span className="font-medium ml-1 whitespace-nowrap">
                {movie.duration} phút
              </span>
            </div>
          </div>

          {/* Dòng 3: Khởi chiếu */}
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-orange-500 shrink-0" />
            <div className="flex items-center w-full">
              <span className="font-bold text-gray-800 uppercase text-xs whitespace-nowrap min-w-[60px]">
                Khởi chiếu:
              </span>
              <span className="font-medium ml-1 whitespace-nowrap">
                {movie.releaseDate}
              </span>
            </div>
          </div>
        </div>

        {/* --- NÚT ĐẶT VÉ (đi tới trang booking) --- */}
        <div className="pt-4 mt-auto">
          <Link
            href={`/booking/${movie.id}`}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-[#0e53e7] hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all duration-200 active:scale-95 group/btn"
          >
            <Ticket className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
            ĐẶT VÉ
          </Link>
        </div>
      </div>
    </div>
  );
}
