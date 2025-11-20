import { MovieDetail } from '@/types/alltypes';
import Image from 'next/image';
import Link from 'next/link';
import { Ticket } from 'lucide-react'; // ⬅️ thêm icon

const BASE_API = 'http://localhost:8080/api';

interface ApiResponse<T> {
  code?: number;
  message?: string;
  result?: T;
}

async function getMovieDetail(id: string): Promise<MovieDetail | null> {
  try {
    const res = await fetch(`${BASE_API}/movie/${id}`, {
      cache: 'no-store',
    });

    const data: ApiResponse<MovieDetail> = await res.json();

    if (!res.ok) {
      console.error('Get movie detail failed:', data.message);
      return null;
    }

    if (!data.result) return null;

    return data.result;
  } catch (error) {
    console.error('Get movie detail error:', error);
    return null;
  }
}

export default async function MovieDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const movie = await getMovieDetail(id);

  if (!movie) {
    return (
      <main className="min-h-[60vh] bg-slate-50">
        <div className="container mx-auto px-4 py-10">
          <p className="text-center text-gray-600">
            Không tìm thấy thông tin phim.
          </p>
          <div className="mt-4 text-center">
            <Link
              href="/home"
              className="inline-flex items-center px-4 py-2 rounded-full border border-gray-300 text-sm text-gray-700 hover:bg-gray-100"
            >
              Quay lại trang chủ
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const ageLabel =
    movie.ageLimit && movie.ageLimit > 0
      ? `Giới hạn tuổi: ${movie.ageLimit}+`
      : 'Phù hợp với mọi lứa tuổi';

  const statusLabel = movie.status ? 'Đang chiếu' : 'Ngừng chiếu';

  return (
    <main className="min-h-screen bg-slate-50 pb-12">
      {/* Breadcrumb */}
      <div className="border-b bg-white/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <nav className="text-xs md:text-sm text-gray-500">
            <Link href="/home" className="hover:text-blue-600">
              Trang chủ
            </Link>
            <span className="mx-1">/</span>
            <Link href="/movie-showing" className="hover:text-blue-600">
              Phim
            </Link>
            <span className="mx-1">/</span>
            <span className="text-gray-700 font-medium">
              {movie.name || 'Chi tiết phim'}
            </span>
          </nav>
        </div>
      </div>

      <section className="container mx-auto px-4 pt-8">
        {/* ========== CARD TRẮNG: POSTER + INFO + MÔ TẢ SONG SONG ========== */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 lg:p-10">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">
            {/* POSTER BÊN TRÁI */}
            <div className="flex-shrink-0 flex justify-center lg:justify-start">
              <div className="relative w-[230px] md:w-[260px] aspect-[2/3] rounded-3xl overflow-hidden shadow-xl bg-gray-200">
                <Image
                  src={movie.posterUrl}
                  alt={movie.name || 'Poster phim'}
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* BÊN PHẢI: TIÊU ĐỀ + INFO + MÔ TẢ */}
            <div className="flex-1 space-y-5">
              {/* HEADER */}
              <div className="border-b border-gray-100 pb-4">
                <p className="text-xs md:text-sm uppercase tracking-[0.2em] text-blue-500 mb-2">
                  Nội dung phim
                </p>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-3">
                  {movie.name || 'Chi tiết phim'}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-gray-600">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold">
                    {statusLabel}
                  </span>
                  <span className="text-gray-500">{ageLabel}</span>
                </div>
              </div>

              {/* INFO CHI TIẾT */}
              <div className="space-y-2.5 text-sm md:text-base text-gray-800">
                {movie.director && (
                  <p>
                    <span className="font-semibold text-gray-900">
                      Đạo diễn:
                    </span>{' '}
                    {movie.director}
                  </p>
                )}
                {movie.actors && (
                  <p>
                    <span className="font-semibold text-gray-900">
                      Diễn viên:
                    </span>{' '}
                    {movie.actors}
                  </p>
                )}
                {movie.category && (
                  <p>
                    <span className="font-semibold text-gray-900">
                      Thể loại:
                    </span>{' '}
                    {movie.category}
                  </p>
                )}
                {movie.country && (
                  <p>
                    <span className="font-semibold text-gray-900">
                      Quốc gia:
                    </span>{' '}
                    {movie.country}
                  </p>
                )}
                {movie.releaseDate && (
                  <p>
                    <span className="font-semibold text-gray-900">
                      Khởi chiếu:
                    </span>{' '}
                    {movie.releaseDate}
                  </p>
                )}
                {movie.duration && (
                  <p>
                    <span className="font-semibold text-gray-900">
                      Thời lượng:
                    </span>{' '}
                    {movie.duration} phút
                  </p>
                )}
              </div>

              {/* MÔ TẢ + NÚT ĐẶT VÉ NGAY DƯỚI */}
              <div className="pt-2 space-y-4">
                <div>
                  <h2 className="text-base md:text-lg font-bold text-gray-900 mb-2">
                    Mô tả
                  </h2>
                  {movie.description ? (
                    <p className="text-sm md:text-base leading-relaxed text-gray-800 whitespace-pre-line">
                      {movie.description}
                    </p>
                  ) : (
                    <p className="text-sm md:text-base text-gray-500">
                      Nội dung phim đang được cập nhật.
                    </p>
                  )}
                </div>

                {/* Nút ĐẶT VÉ */}
                <div className="pt-2">
                  <Link
                    href={`/booking/${movie.id}`}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#0e53e7] hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all duration-200 active:scale-95"
                  >
                    <Ticket className="w-5 h-5" />
                    ĐẶT VÉ
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========== TRAILER BÊN DƯỚI ========== */}
        <section className="mt-10 md:mt-12">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3">
            Trailer
          </h2>
          <div className="w-full flex justify-center">
            <div className="w-full max-w-2xl aspect-video rounded-2xl overflow-hidden border border-gray-200 bg-black/5">
              {movie.trailer ? (
                <div
                  className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full"
                  dangerouslySetInnerHTML={{ __html: movie.trailer }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm md:text-base">
                  Chưa có trailer cho phim này.
                </div>
              )}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
