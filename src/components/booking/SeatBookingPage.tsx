'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const BASE_API = 'http://localhost:8080/api';
const SEAT_SHOWTIME_API = `${BASE_API}/seat`;
const LOGIN_PAGE = '/login'; // 👈 đường dẫn trang đăng nhập

interface ApiResponse<T> {
  code?: number;
  message?: string;
  result?: T;
}

interface SeatShowTimeSeat {
  id: number;
  seatCode: string;
  price: number | string;
  status: string;       // AVAILABLE / HOLDING / BOOKED / DISABLED
  seatTypeName: string; // STANDARD / VIP / SWEETBOX
}

interface SeatShowTime {
  showTimeId: number;
  movieName: string;
  cinemaName: string;
  screenRoomName: string;
  showDate: string;
  showTime: string;
  sumSeats: number;
  seatList: SeatShowTimeSeat[];
}

// ===== Helpers =====
const splitSeat = (seatCode: string) => {
  const match = seatCode.match(/^([A-Z]+)(\d+)$/i);
  if (!match) return { row: seatCode, col: 0 };
  return { row: match[1].toUpperCase(), col: Number(match[2]) };
};

const formatCurrency = (n: number) =>
  n.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' đ';

const isAvailableStatus = (status: string | null | undefined) =>
  (status || '').toUpperCase() === 'AVAILABLE';

const formatShowDate = (raw: string | null | undefined) => {
  if (!raw) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw; // dd/MM/yyyy
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split('-');
    return `${d}/${m}/${y}`;
  }
  return raw;
};

const formatShowTime = (raw: string | null | undefined) => {
  if (!raw) return '';
  return raw.slice(0, 5); // HH:mm:ss -> HH:mm
};

// lấy token đăng nhập (JWT) trên client
const getAccessToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken'); // 👈 đúng key bạn đang dùng
};

export default function SeatBookingPage({ showTimeId }: { showTimeId: string }) {
  const router = useRouter();

  const [data, setData] = useState<SeatShowTime | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<number>>(new Set());

  // ===== Fetch danh sách ghế cho 1 showtime =====
  useEffect(() => {
    let cancelled = false;

    const fetchSeats = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${SEAT_SHOWTIME_API}/${showTimeId}`, {
          cache: 'no-store',
        });

        const raw = await res.text();

        if (!res.ok) {
          let msg = '';
          try {
            if (raw) {
              const errJson = JSON.parse(raw) as ApiResponse<unknown>;
              msg = errJson.message || '';
            }
          } catch {
            // ignore
          }
          throw new Error(
            msg || raw || 'Không thể tải danh sách ghế cho suất chiếu này.',
          );
        }

        if (!raw) {
          throw new Error('API /seat trả về rỗng, không có dữ liệu.');
        }

        let dataRes: ApiResponse<SeatShowTime>;
        try {
          dataRes = JSON.parse(raw) as ApiResponse<SeatShowTime>;
        } catch (e) {
          console.error('Dữ liệu /seat không phải JSON hợp lệ:', raw);
          throw new Error('Dữ liệu trả về không phải JSON hợp lệ.');
        }

        if (!cancelled) {
          setData(dataRes.result || null);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('Fetch seats error:', err);
          setError(
            err.message ||
              'Có lỗi xảy ra khi tải danh sách ghế. Vui lòng thử lại.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSeats();
    return () => {
      cancelled = true;
    };
  }, [showTimeId]);

  // ===== Chuẩn hoá thành các hàng ghế A, B, C... =====
  const rows = useMemo(() => {
    if (!data?.seatList) return [];

    const byRow: Record<string, SeatShowTimeSeat[]> = {};
    data.seatList.forEach((seat) => {
      const { row } = splitSeat(seat.seatCode);
      if (!byRow[row]) byRow[row] = [];
      byRow[row].push(seat);
    });

    return Object.entries(byRow)
      .sort(([r1], [r2]) => r1.localeCompare(r2, 'en'))
      .map(([rowKey, seats]) => ({
        row: rowKey,
        seats: seats.sort(
          (a, b) => splitSeat(a.seatCode).col - splitSeat(b.seatCode).col,
        ),
      }));
  }, [data]);

  // ===== Ghế đã chọn + tổng tiền =====
  const selectedSeats = useMemo(() => {
    if (!data?.seatList) return [];
    return data.seatList.filter((s) => selectedSeatIds.has(s.id));
  }, [data, selectedSeatIds]);

  const totalPrice = useMemo(
    () =>
      selectedSeats.reduce((sum, s) => {
        const priceNumber =
          typeof s.price === 'number' ? s.price : Number(s.price ?? 0);
        return sum + (Number.isFinite(priceNumber) ? priceNumber : 0);
      }, 0),
    [selectedSeats],
  );

  const toggleSeat = (seat: SeatShowTimeSeat) => {
    if (!isAvailableStatus(seat.status)) return; // chỉ chọn ghế AVAILABLE
    setSelectedSeatIds((prev) => {
      const next = new Set(prev);
      if (next.has(seat.id)) next.delete(seat.id);
      else next.add(seat.id);
      return next;
    });
  };

  const getSeatLabel = (seat: SeatShowTimeSeat, row: string) => {
    const status = (seat.status || '').toUpperCase();
    if (status === 'BOOKED' || status === 'HOLDING') return 'X';
    if (status === 'DISABLED') return '';
    return seat.seatCode.replace(row, '');
  };

  // ===== Class màu ghế theo Status + Type =====
  const getSeatClasses = (seat: SeatShowTimeSeat) => {
    const status = (seat.status || '').toUpperCase();
    const type = (seat.seatTypeName || '').toUpperCase();
    const isSelected = selectedSeatIds.has(seat.id);

    let sizeClass = 'w-9 h-9 md:w-10 md:h-10';
    if (type === 'SWEETBOX') {
      sizeClass = 'w-20 h-9 md:w-24 md:h-10';
    }

    const base =
      `${sizeClass} rounded-md text-sm md:text-base flex items-center justify-center border transition-all`;

    if (status === 'BOOKED' || status === 'HOLDING') {
      return (
        base + ' bg-gray-500 border-gray-600 text-white cursor-not-allowed'
      );
    }

    if (status === 'DISABLED') {
      return (
        base + ' bg-white border-gray-300 text-gray-300 cursor-not-allowed'
      );
    }

    if (isSelected) {
      return (
        base +
        ' bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200'
      );
    }

    if (type === 'VIP') {
      return (
        base +
        ' bg-orange-100 border-orange-500 text-orange-900 hover:bg-orange-200 hover:border-orange-600'
      );
    }

    if (type === 'SWEETBOX') {
      return (
        base +
        ' bg-red-500 border-red-600 text-white hover:bg-red-600 hover:border-red-700'
      );
    }

    return (
      base +
      ' bg-slate-50 border-gray-300 text-gray-800 hover:bg-blue-50 hover:border-blue-400'
    );
  };

  const legendSeatClass = (extra: string) =>
    'w-7 h-7 rounded-sm border ' + extra;

  // ===== HANDLE TIẾP TỤC → TRANG THANH TOÁN =====
  const handleContinue = () => {
    if (selectedSeats.length === 0 || totalPrice <= 0 || !data) return;

    // 1. Kiểm tra đăng nhập
    const token = getAccessToken();
    if (!token) {
      // URL hiện tại (để login xong quay lại)
      const currentPath =
        typeof window !== 'undefined'
          ? window.location.pathname + window.location.search
          : `/booking-seat/${data.showTimeId}`;

      router.push(
        `${LOGIN_PAGE}?redirect=${encodeURIComponent(currentPath)}`,
      );
      return;
    }

    // 2. Đã login → sang trang thanh toán
    const seatIdsParam = selectedSeats.map((s) => s.id).join(',');
    const amount = Math.round(totalPrice);

    router.push(
      `/payment?showTimeId=${encodeURIComponent(
        data.showTimeId.toString(),
      )}&seatIds=${encodeURIComponent(seatIdsParam)}&amount=${amount}`,
    );
  };

  // ===== States loading / error toàn trang =====
  if (loading && !data) {
    return (
      <main className="min-h-[60vh] bg-slate-50">
        <div className="container mx-auto px-4 py-10">
          <p className="text-center text-gray-600 text-lg">
            Đang tải sơ đồ ghế...
          </p>
        </div>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="min-h-[60vh] bg-slate-50">
        <div className="container mx-auto px-4 py-10 space-y-4">
          <p className="text-center text-red-600 text-lg">{error}</p>
          <div className="text-center">
            <Link
              href="/cinemas"
              className="inline-flex items-center px-5 py-2.5 rounded-full border border-gray-300 text-base text-gray-700 hover:bg-gray-100"
            >
              Quay lại danh sách rạp
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ===== UI chính =====
  return (
    <main className="min-h-screen bg-slate-50 pb-10">
      {/* HEADER */}
      <div className="border-b bg-white/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="space-y-1">
            <p className="text-sm md:text-base text-gray-500 uppercase tracking-[0.2em]">
              Đặt vé online
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {data?.movieName || 'Chọn ghế'}
            </h1>

            {/* Dòng 1: rạp + phòng */}
            <p className="text-sm md:text-base text-gray-600">
              {data?.cinemaName && (
                <>
                  Rạp: <span className="font-medium">{data.cinemaName}</span>
                </>
              )}
              {data?.screenRoomName && (
                <>
                  {' '}
                  • Phòng:{' '}
                  <span className="font-medium">{data.screenRoomName}</span>
                </>
              )}
            </p>

            {/* Dòng 2: ngày chiếu + giờ + tổng ghế */}
            <p className="text-sm md:text-base text-gray-600">
              {data?.showDate && (
                <>
                  Ngày chiếu:{' '}
                  <span className="font-medium">
                    {formatShowDate(data.showDate)}
                  </span>
                </>
              )}
              {data?.showTime && (
                <>
                  {' '}
                  • Giờ:{' '}
                  <span className="font-medium">
                    {formatShowTime(data.showTime)}
                  </span>
                </>
              )}
              {typeof data?.sumSeats === 'number' && data.sumSeats > 0 && (
                <>
                  {' '}
                  • Tổng số ghế:{' '}
                  <span className="font-medium">{data.sumSeats}</span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <Link
              href="/cinemas"
              className="px-5 py-2.5 rounded-full border border-gray-200 text-base text-gray-700 hover:bg-gray-100"
            >
              Quay lại chọn rạp
            </Link>
          </div>
        </div>
      </div>

      {/* BODY */}
      <section className="container mx-auto px-4 pt-6 space-y-6">
        {/* SCREEN + SEAT GRID */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 px-4 md:px-8 pt-6 pb-7">
          <div className="flex flex-col items-center gap-5">
            <div className="w-full max-w-3xl">
              <div className="h-1.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent rounded-full" />
            </div>
            <div className="text-sm md:text-base font-semibold tracking-[0.25em] text-gray-500 uppercase">
              Màn hình
            </div>

            <div className="mt-4 w-full flex justify-center">
              <div className="inline-flex flex-col items-center gap-3">
                {rows.map(({ row, seats }) => (
                  <div key={row} className="flex items-center gap-3">
                    <span className="w-7 text-sm md:text-base text-gray-500 text-right">
                      {row}
                    </span>
                    <div className="flex gap-2">
                      {seats.map((seat) => (
                        <button
                          key={seat.id}
                          type="button"
                          className={getSeatClasses(seat)}
                          onClick={() => toggleSeat(seat)}
                        >
                          {getSeatLabel(seat, row)}
                        </button>
                      ))}
                    </div>
                    <span className="w-7" />
                  </div>
                ))}
              </div>
            </div>

            {/* LEGEND */}
            <div className="mt-6 flex flex-wrap justify-center gap-5 text-sm md:text-base text-gray-600">
              <div className="flex items-center gap-2">
                <span
                  className={legendSeatClass('bg-slate-50 border-gray-300')}
                />
                Ghế thường (STANDARD)
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={legendSeatClass('bg-orange-200 border-orange-500')}
                />
                Ghế VIP
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={legendSeatClass('bg-red-500 border-red-600')}
                />
                Ghế đôi / Sweetbox
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={legendSeatClass('bg-gray-500 border-gray-600')}
                />
                Đang giữ / Đã đặt (HOLDING / BOOKED)
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={legendSeatClass('bg-white border-gray-300')}
                />
                Ghế đang sửa (DISABLED)
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={legendSeatClass('bg-blue-600 border-blue-600')}
                />
                Ghế đang chọn
              </div>
            </div>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 px-5 md:px-8 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-sm md:text-base uppercase tracking-[0.2em] text-gray-500">
              Thông tin ghế
            </p>
            {selectedSeats.length === 0 ? (
              <p className="text-base md:text-lg text-gray-600">
                Hãy chọn ghế trên sơ đồ để tiếp tục.
              </p>
            ) : (
              <div className="text-base md:text-lg text-gray-800">
                <span className="font-semibold">Ghế: </span>
                {selectedSeats.map((s) => s.seatCode).join(', ')}
                <br />
                <span className="font-semibold">Số lượng: </span>
                {selectedSeats.length}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="text-base md:text-lg">
              <span className="text-gray-600 mr-2">Tổng tiền:</span>
              <span className="font-bold text-blue-600">
                {formatCurrency(totalPrice)}
              </span>
            </div>
            <button
              type="button"
              disabled={selectedSeats.length === 0}
              onClick={handleContinue}
              className={`px-7 py-3 rounded-full text-base md:text-lg font-semibold transition-all ${
                selectedSeats.length === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:-translate-y-0.5'
              }`}
            >
              Tiếp tục
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
