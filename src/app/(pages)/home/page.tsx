import Link from 'next/link';
import Movie from '@/components/movies/movie';
import { TypeMovie } from '@/types/alltypes';

interface ApiResponse<T> {
  code?: number;
  message?: string;
  result?: T;
}

const BASE_API = 'http://localhost:8080/api';

async function fetchMovies(path: string): Promise<TypeMovie[]> {
  try {
    const res = await fetch(`${BASE_API}${path}`, { cache: 'no-store' });
    const data: ApiResponse<TypeMovie[]> = await res.json();

    if (!res.ok) {
      console.error('Fetch movies error:', data.message);
      return [];
    }

    if (data.result && Array.isArray(data.result)) {
      return data.result;
    }

    return [];
  } catch (error) {
    console.error('Fetch movies error:', error);
    return [];
  }
}

export default async function Home() {
  const [nowPlaying, upcoming] = await Promise.all([
    fetchMovies('/movie/nowplaying'),
    fetchMovies('/movie/upcoming'),
  ]);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* HERO */}
      <section className="bg-gradient-to-r from-blue-900 via-indigo-700 to-sky-500 text-white">
        <div className="container mx-auto px-4 py-12 md:py-16 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-4">
            <p className="text-xs uppercase tracking-[0.2em] text-blue-200">
              Đặt vé xem phim online
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight">
              Sẵn sàng cho <span className="text-amber-300">trải nghiệm điện ảnh</span> của bạn.
            </h1>
            <p className="text-sm md:text-base text-blue-100 max-w-xl">
              Chọn phim, rạp và suất chiếu yêu thích chỉ với vài bước đơn giản.
              Không cần xếp hàng, không lo hết chỗ đẹp.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/movie-showing"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-blue-700 font-semibold text-sm shadow-md hover:bg-blue-50 hover:-translate-y-0.5 transition-all"
              >
                Đặt vé ngay
              </Link>
              <Link
                href="/movie-coming-soon"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/60 text-sm text-white/90 hover:bg-white/10 transition-colors"
              >
                Xem phim sắp chiếu
              </Link>
            </div>

            <div className="flex items-center gap-6 pt-4 text-xs md:text-sm text-blue-100">
              <div>
                <span className="font-semibold text-white">+100</span> suất chiếu mỗi ngày
              </div>
              <div>
                <span className="font-semibold text-white">Đặt vé</span> trong chưa tới 1 phút
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-md w-full">
            <div className="rounded-3xl bg-white/10 border border-white/20 p-4 shadow-2xl">
              <p className="text-xs text-blue-100 mb-3">Đang chiếu nổi bật</p>
              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                {nowPlaying.slice(0, 3).map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 hover:bg-white/15 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white line-clamp-1">
                        {m.name}
                      </p>
                      <p className="text-[11px] text-blue-100">
                        {m.category} • {m.duration} phút
                      </p>
                    </div>
                  </div>
                ))}
                {nowPlaying.length === 0 && (
                  <p className="text-xs text-blue-100">
                    Hiện chưa có phim đang chiếu để hiển thị.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PHIM ĐANG CHIẾU */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Phim đang chiếu
          </h2>
          <Link
            href="/movie-showing"
            className="text-xs md:text-sm text-blue-600 hover:text-blue-700"
          >
            Xem tất cả
          </Link>
        </div>

        {nowPlaying.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-10">
            Hiện chưa có phim đang chiếu.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-8">
            {nowPlaying.slice(0, 8).map((movie) => (
              <Movie key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </section>

      {/* PHIM SẮP CHIẾU */}
      <section className="container mx-auto px-4 pb-14">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Phim sắp chiếu
          </h2>
          <Link
            href="/movie-coming-soon"
            className="text-xs md:text-sm text-blue-600 hover:text-blue-700"
          >
            Xem tất cả
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-10">
            Hiện chưa có phim sắp chiếu.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-8">
            {upcoming.slice(0, 8).map((movie) => (
              <Movie key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
