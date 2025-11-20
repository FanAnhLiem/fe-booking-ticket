'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const BASE_API = 'http://localhost:8080/api';
const MOVIE_ADDRESS_API = `${BASE_API}/movie/address`;
const SHOWTIME_MOVIE_API = `${BASE_API}/showtime/movie`;

interface ApiResponse<T> {
  code?: number;
  message?: string;
  result?: T;
}

interface ShowTimeSummary {
  showTimeId: number;
  startTime: string;
  endTime: string;
}

interface CinemaShowTime {
  cinemaId: number;
  cinemaName: string;
  showTimeSummaryResponseList: ShowTimeSummary[];
}

interface BookingShowtimeProps {
  movieId: number;
}

type DateItem = {
  key: string; // yyyy-MM-dd
  date: Date;
  day: string;
  month: string;
  weekday: string;
};

const buildDateList = (days = 14): DateItem[] => {
  const result: DateItem[] = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const weekdayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const weekday = weekdayNames[d.getDay()];
    const key = `${d.getFullYear()}-${month}-${day}`;

    result.push({
      key,
      date: d,
      day,
      month,
      weekday,
    });
  }
  return result;
};

// format đúng pattern của BE: dd/MM/yyyy
const formatApiDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatTime = (time: string | null | undefined) => {
  if (!time) return '';
  // 'HH:mm:ss' -> 'HH:mm'
  return time.slice(0, 5);
};

export default function BookingShowtime({ movieId }: BookingShowtimeProps) {
  const router = useRouter();

  const dates = useMemo(() => buildDateList(14), []);
  const [selectedDateKey, setSelectedDateKey] = useState<string>(dates[0]?.key);

  // ngày đang chọn (mặc định chính là HÔM NAY)
  const selectedDate = useMemo(
    () => dates.find((d) => d.key === selectedDateKey) ?? dates[0],
    [dates, selectedDateKey],
  );

  const [addresses, setAddresses] = useState<string[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  const [showtimes, setShowtimes] = useState<CinemaShowTime[]>([]);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [loadingShowtime, setLoadingShowtime] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ====== CALL API 1: /movie/address (movie_id + date) ======
  useEffect(() => {
    let cancelled = false;

    const fetchAddresses = async () => {
      setLoadingAddress(true);
      setError(null);
      setAddresses([]);
      setSelectedAddress(null);

      try {
        const body = {
          movie_id: movieId,
          date: formatApiDate(selectedDate.date), // <== đúng FilterMovie
        };

        const res = await fetch(MOVIE_ADDRESS_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        const data: ApiResponse<string[]> = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Không lấy được danh sách khu vực');
        }

        if (!cancelled) {
          const list = data.result || [];
          setAddresses(list);
          // mặc định chọn address đầu tiên
          setSelectedAddress(list[0] ?? null);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('Fetch cinema address error:', err);
          setError(err.message || 'Có lỗi xảy ra khi tải khu vực.');
          setAddresses([]);
          setSelectedAddress(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingAddress(false);
        }
      }
    };

    fetchAddresses();

    return () => {
      cancelled = true;
    };
  }, [movieId, selectedDate]);

  // ====== CALL API 2: /showtime/movie (movie_id + date + address) ======
  useEffect(() => {
    let cancelled = false;

    const fetchShowtimes = async () => {
      if (!selectedAddress) {
        setShowtimes([]);
        return;
      }

      setLoadingShowtime(true);
      setError(null);

      try {
        const body = {
          movie_id: movieId,
          date: formatApiDate(selectedDate.date),
          address: selectedAddress,
        };

        const res = await fetch(SHOWTIME_MOVIE_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        const data: ApiResponse<CinemaShowTime[]> = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Không lấy được danh sách suất chiếu');
        }

        if (!cancelled) {
          setShowtimes(data.result || []);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('Fetch showtime error:', err);
          setError(err.message || 'Có lỗi xảy ra khi tải suất chiếu.');
          setShowtimes([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingShowtime(false);
        }
      }
    };

    fetchShowtimes();

    return () => {
      cancelled = true;
    };
  }, [movieId, selectedAddress, selectedDate]);

  return (
    <div className="mt-8 mb-12">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-4 md:p-6 lg:p-8">
        {/* ===== HÀNG CHỌN NGÀY ===== */}
        <div className="mb-6">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3">
            Chọn ngày chiếu
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {dates.map((d) => {
              const isActive = d.key === selectedDateKey;
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setSelectedDateKey(d.key)}
                  className={`flex flex-col items-center justify-center min-w-[72px] px-3 py-2 rounded-xl border text-sm transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-slate-50 text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  <span className="text-[11px] uppercase tracking-wide opacity-80">
                    {d.weekday}
                  </span>
                  <span className="text-lg font-bold leading-none">{d.day}</span>
                  <span className="text-[11px] mt-0.5">Th {d.month}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ===== HÀNG CHỌN KHU VỰC (address) ===== */}
        <div className="mb-6">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3">
            Chọn khu vực
          </h2>
          {loadingAddress && addresses.length === 0 ? (
            <p className="text-sm text-gray-500">Đang tải danh sách khu vực...</p>
          ) : addresses.length === 0 ? (
            <p className="text-sm text-gray-500">
              Không có rạp chiếu phim cho ngày này.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {addresses.map((addr) => {
                const isActive = addr === selectedAddress;
                return (
                  <button
                    key={addr}
                    type="button"
                    onClick={() => setSelectedAddress(addr)}
                    className={`px-4 py-1.5 rounded-full text-sm border transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    {addr}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Lỗi chung */}
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ===== DANH SÁCH SUẤT CHIẾU ===== */}
        <div className="border-t border-gray-100 pt-4 mt-2">
          {loadingShowtime && showtimes.length === 0 ? (
            <p className="text-sm text-gray-500">Đang tải suất chiếu...</p>
          ) : showtimes.length === 0 ? (
            <p className="text-sm text-gray-500">
              Không tìm thấy suất chiếu nào cho lựa chọn hiện tại.
            </p>
          ) : (
            <div className="space-y-6">
              {showtimes.map((cinema) => (
                <div
                  key={cinema.cinemaId}
                  className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0"
                >
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                    {cinema.cinemaName}
                  </h3>

                  <div className="flex flex-wrap gap-3">
                    {cinema.showTimeSummaryResponseList.map((s) => (
                      <button
                        key={s.showTimeId}
                        type="button"
                        className="px-5 py-2.5 rounded-xl border border-gray-200 bg-slate-50 text-base md:text-lg font-medium text-gray-800 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all"
                        onClick={() => {
                          // Điều hướng sang trang chọn ghế cho suất chiếu này
                          router.push(`/booking-seat/${s.showTimeId}`);
                        }}
                      >
                        {formatTime(s.startTime)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
