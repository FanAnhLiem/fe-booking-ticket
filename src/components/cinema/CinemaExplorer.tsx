'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const BASE_API = 'http://localhost:8080/api';
const PROVINCES_API = 'https://provinces.open-api.vn/api/v2/p/';
const CINEMA_BY_ADDRESS_API = `${BASE_API}/cinema/address`;
const SHOWTIME_BY_CINEMA_API = `${BASE_API}/showtime/cinema`;

interface ApiResponse<T> {
  code?: number;
  message?: string;
  result?: T;
}

/** Provinces API */
interface Province {
  code: number;
  name: string;
  name_en: string;
}

/** /cinema/address */
interface CinemaSummary {
  id: number;
  name: string;
}

/** /showtime/cinema */
interface ShowTimeSummary {
  showTimeId: number;
  startTime: string; // LocalTime -> 'HH:mm:ss'
  endTime: string;
}

interface MovieShowTime {
  movieId: number;
  movieName: string;
  posterUrl: string;
  showTimeSummaryResponseList: ShowTimeSummary[];
}

// ===== Helpers =====
const formatApiDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`; // dd/MM/yyyy
};

const formatTime = (time: string | null | undefined) => {
  if (!time) return '';
  return time.slice(0, 5);
};

const buildDateList = (
  days = 14,
): { key: string; label: string; date: Date }[] => {
  const result: { key: string; label: string; date: Date }[] = [];
  const today = new Date();
  const weekdayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const dd = d.getDate().toString().padStart(2, '0');
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const wd = weekdayNames[d.getDay()];

    result.push({
      key: `${d.getFullYear()}-${mm}-${dd}`,
      label: `${wd} ${dd}/${mm}`,
      date: d,
    });
  }
  return result;
};

export default function CinemaExplorer() {
  const router = useRouter();

  // Provinces
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedProvinceName, setSelectedProvinceName] = useState<string | null>(
    null,
  );
  const [loadingProvinces, setLoadingProvinces] = useState(false);

  // Cinemas
  const [cinemas, setCinemas] = useState<CinemaSummary[]>([]);
  const [selectedCinema, setSelectedCinema] = useState<CinemaSummary | null>(
    null,
  );
  const [loadingCinemas, setLoadingCinemas] = useState(false);

  // Showtimes
  const dates = useMemo(() => buildDateList(14), []);
  const [selectedDateKey, setSelectedDateKey] = useState<string>(dates[0]?.key);
  const selectedDate = useMemo(
    () => dates.find((d) => d.key === selectedDateKey)?.date ?? dates[0].date,
    [dates, selectedDateKey],
  );

  const [movieShowTimes, setMovieShowTimes] = useState<MovieShowTime[]>([]);
  const [loadingShowtimes, setLoadingShowtimes] = useState(false);

  // Error chung
  const [error, setError] = useState<string | null>(null);

  // ====== Fetch provinces ======
  useEffect(() => {
    let cancelled = false;

    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      setError(null);
      try {
        const res = await fetch(PROVINCES_API);
        const data = await res.json(); // array

        if (!res.ok) {
          throw new Error('Không tải được danh sách tỉnh / thành phố');
        }

        if (!Array.isArray(data)) {
          throw new Error('Dữ liệu tỉnh/thành không hợp lệ');
        }

        if (!cancelled) {
          // Ưu tiên: TP HCM, Hà Nội lên đầu
          const priorityNames = [
            'Thành phố Hồ Chí Minh',
            'Thành phố Hà Nội',
            'Hồ Chí Minh',
            'Hà Nội',
          ];
          const getPriorityIndex = (name: string) => {
            const idx = priorityNames.findIndex(
              (p) => name === p || name.includes(p),
            );
            return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
          };

          const sorted: Province[] = [...data].sort((a, b) => {
            const pa = getPriorityIndex(a.name);
            const pb = getPriorityIndex(b.name);
            if (pa !== pb) return pa - pb;
            // Sau 2 tỉnh ưu tiên thì sort alphabet thường
            return a.name.localeCompare(b.name, 'vi');
          });

          setProvinces(sorted);

          // chọn mặc định: TP HCM -> Hà Nội -> phần tử đầu tiên
          const defaultProvince =
            sorted.find((p) =>
              ['Thành phố Hồ Chí Minh', 'Hồ Chí Minh'].some((k) =>
                p.name.includes(k),
              ),
            ) ||
            sorted.find((p) =>
              ['Thành phố Hà Nội', 'Hà Nội'].some((k) => p.name.includes(k)),
            ) ||
            sorted[0] ||
            null;

          setSelectedProvinceName(defaultProvince ? defaultProvince.name : null);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('Fetch provinces error:', err);
          setError(
            err.message ||
              'Có lỗi xảy ra khi tải danh sách tỉnh / thành phố.',
          );
        }
      } finally {
        if (!cancelled) setLoadingProvinces(false);
      }
    };

    fetchProvinces();

    return () => {
      cancelled = true;
    };
  }, []);

  // ====== Fetch cinemas by address (province) ======
  useEffect(() => {
    if (!selectedProvinceName) {
      setCinemas([]);
      setSelectedCinema(null);
      return;
    }

    let cancelled = false;

    const fetchCinemas = async () => {
      setLoadingCinemas(true);
      setError(null);
      setCinemas([]);
      setSelectedCinema(null);

      try {
        const body = { address: selectedProvinceName };

        const res = await fetch(CINEMA_BY_ADDRESS_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        const data: ApiResponse<CinemaSummary[]> = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Không tải được danh sách rạp.');
        }

        if (!cancelled) {
          const list = data.result || [];
          setCinemas(list);
          setSelectedCinema(list[0] ?? null);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('Fetch cinemas error:', err);
          setError(err.message || 'Có lỗi xảy ra khi tải danh sách rạp.');
        }
      } finally {
        if (!cancelled) setLoadingCinemas(false);
      }
    };

    fetchCinemas();

    return () => {
      cancelled = true;
    };
  }, [selectedProvinceName]);

  // ====== Fetch showtimes by cinema + date ======
  useEffect(() => {
    if (!selectedCinema) {
      setMovieShowTimes([]);
      return;
    }

    let cancelled = false;

    const fetchShowtimes = async () => {
      setLoadingShowtimes(true);
      setError(null);
      setMovieShowTimes([]);

      try {
        const body = {
          cinema_id: selectedCinema.id,
          date: formatApiDate(selectedDate), // LocalDate.now mặc định lần đầu
        };

        const res = await fetch(SHOWTIME_BY_CINEMA_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        const data: ApiResponse<MovieShowTime[]> = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Không tải được suất chiếu của rạp.');
        }

        if (!cancelled) {
          setMovieShowTimes(data.result || []);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('Fetch showtimes error:', err);
          setError(err.message || 'Có lỗi xảy ra khi tải suất chiếu.');
        }
      } finally {
        if (!cancelled) setLoadingShowtimes(false);
      }
    };

    fetchShowtimes();

    return () => {
      cancelled = true;
    };
  }, [selectedCinema, selectedDate]);

  // ====== UI ======
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Tất cả các rạp
        </h1>
      </div>

      {/* Provinces */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
          Chọn tỉnh / thành phố
        </h2>

        {loadingProvinces ? (
          <p className="text-sm text-gray-500">
            Đang tải danh sách tỉnh / thành...
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-2 text-base md:text-lg">
            {provinces.map((p) => {
              const isActive = p.name === selectedProvinceName;
              return (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => setSelectedProvinceName(p.name)}
                  className={`text-left transition-colors ${
                    isActive
                      ? 'text-blue-600 font-semibold'
                      : 'text-gray-800 hover:text-blue-500'
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        )}

        <hr className="mt-5 border-gray-200" />

        {/* Cinemas in province */}
        <div className="mt-4">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3">
            Rạp tại {selectedProvinceName || '...'}
          </h3>

          {loadingCinemas ? (
            <p className="text-sm text-gray-500">Đang tải danh sách rạp...</p>
          ) : cinemas.length === 0 ? (
            <p className="text-sm text-gray-500">
              Không tìm thấy rạp nào tại khu vực này.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-base md:text-lg">
              {cinemas.map((c) => {
                const isActive = selectedCinema?.id === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCinema(c)}
                    className={`text-left transition-colors ${
                      isActive
                        ? 'text-blue-600 font-semibold'
                        : 'text-gray-800 hover:text-blue-500'
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Error chung */}
      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Showtimes of selected cinema */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 md:p-6 lg:p-8 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              {selectedCinema
                ? selectedCinema.name
                : 'Chọn một rạp để xem lịch chiếu'}
            </h2>
            {selectedProvinceName && (
              <p className="text-sm md:text-base text-gray-500">
                Khu vực: {selectedProvinceName}
              </p>
            )}
          </div>

          {/* Thanh chọn ngày */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {dates.map((d) => {
              const isActive = d.key === selectedDateKey;
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setSelectedDateKey(d.key)}
                  className={`px-4 py-2 rounded-full text-sm md:text-base border transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 text-gray-700 border-gray-200 hover:bg-blue-50 hover:border-blue-400'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        <hr className="border-gray-200" />

        {loadingShowtimes ? (
          <p className="text-sm text-gray-500">Đang tải lịch chiếu...</p>
        ) : !selectedCinema ? (
          <p className="text-sm text-gray-500">
            Hãy chọn một rạp ở phía trên để xem lịch chiếu.
          </p>
        ) : movieShowTimes.length === 0 ? (
          <p className="text-sm text-gray-500">
            Không có suất chiếu nào cho ngày này tại rạp {selectedCinema.name}.
          </p>
        ) : (
          <div className="space-y-6">
            {movieShowTimes.map((movie) => (
              <div
                key={movie.movieId}
                className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0 flex flex-col md:flex-row gap-6"
              >
                {/* Poster to hơn bên trái */}
                <div className="w-[160px] md:w-[200px] flex-shrink-0">
                  <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={movie.posterUrl}
                      alt={movie.movieName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Thông tin phim + giờ chiếu */}
                <div className="flex-1">
                  <h3 className="text-lg md:text-2xl font-semibold text-gray-900 mb-3">
                    {movie.movieName}
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {movie.showTimeSummaryResponseList.map((s) => (
                      <button
                        key={s.showTimeId}
                        type="button"
                        className="px-5 py-2.5 rounded-xl border border-gray-200 bg-slate-50 text-base md:text-lg font-medium text-gray-800 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all"
                        onClick={() => {
                          // Điều hướng sang trang chọn ghế của suất chiếu
                          // Tạo route: /booking-seat/[showTimeId]/page.tsx
                          router.push(`/booking-seat/${s.showTimeId}`);
                        }}
                      >
                        {formatTime(s.startTime)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
