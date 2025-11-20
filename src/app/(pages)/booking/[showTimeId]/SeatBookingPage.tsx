'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

const BASE_API = 'http://localhost:8080/api';
const SEAT_SHOWTIME_API = `${BASE_API}/seat`; // => GET /seat/{showTimeId}

interface ApiResponse<T> {
  code?: number;
  message?: string;
  result?: T;
}

interface SeatShowTimeSeat {
  id: number;
  seatCode: string;
  price: number; // BigDecimal -> number
  status: string; // "AVAILABLE", "HOLDING", "BOOKED", "DISABLED"
  seatTypeName: string; // "STANDARD", "VIP", "SWEETBOX"
}

interface SeatShowTime {
  showTimeId: number;
  movieName: string;
  cinemaName: string;
  sumSeats: number;
  seatList: SeatShowTimeSeat[];
}

// ===== Enum mirror từ backend =====
const SeatStatus = {
  AVAILABLE: 'AVAILABLE',
  HOLDING: 'HOLDING',
  BOOKED: 'BOOKED',
  DISABLED: 'DISABLED',
} as const;

const SeatType = {
  STANDARD: 'STANDARD',
  VIP: 'VIP',
  SWEETBOX: 'SWEETBOX',
} as const;

// ===== Helpers =====
const splitSeat = (seatCode: string) => {
  const match = seatCode.match(/^([A-Z]+)(\d+)$/i);
  if (!match) return { row: seatCode, col: 0 };
  return { row: match[1].toUpperCase(), col: Number(match[2]) };
};

const formatCurrency = (n: number) =>
  n.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' đ';

const isAvailableStatus = (status: string | null | undefined) =>
  (status || '').toUpperCase() === SeatStatus.AVAILABLE;

// ===== Component =====
export default function SeatBookingPage({
  showTimeId,
}: {
  showTimeId: string;
}) {
  const [data, setData] = useState<SeatShowTime | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<number>>(
    new Set(),
  );

  // ===== Fetch seat data =====
  useEffect(() => {
    let cancelled = false;

    const fetchSeats = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${SEAT_SHOWTIME_API}/${showTimeId}`, {
          cache: 'no-store',
        });

        const dataRes: ApiResponse<SeatShowTime> = await res.json();

        if (!res.ok) {
          throw new Error(
            dataRes.message || 'Không thể tải danh sách ghế cho suất chiếu này.',
          );
        }

        if (!cancelled) {
          setData(dataRes.result || null);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('Fetch seats error:', err);
          setError(
            err.message || 'Có lỗi xảy ra khi tải danh sách ghế. Vui lòng thử lại.',
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

  // ===== Chuẩn hóa dữ liệu hàng ghế =====
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

  // ===== Seats selected + tổng tiền =====
  const selectedSeats = useMemo(() => {
    if (!data?.seatList) return [];
    return data.seatList.filter((s) => selectedSeatIds.has(s.id));
  }, [data, selectedSeatIds]);

  const totalPrice = useMemo(
    () =>
      selectedSeats.reduce(
        (sum, s) => sum + (typeof s.price === 'number' ? s.price : 0),
        0,
      ),
    [selectedSeats],
  );

  // ===== Handler chọn ghế =====
  const toggleSeat = (seat: SeatShowTimeSeat) => {
    if (!isAvailableStatus(seat.status)) return; // ghế ko khả dụng
    setSelectedSeatIds((prev) => {
      const next = new Set(prev);
      if (next.has(seat.id)) {
        next.delete(seat.id);
      } else {
        next.add(seat.id);
      }
      return next;
    });
  };

  // ===== Class màu ghế =====
  const getSeatClasses = (seat: SeatShowTimeSeat) => {
    const base =
      'w-8 h-8 md:w-9 md:h-9 rounded-md text-xs md:text-sm flex items-center justify-center border transition-all';

    const status = (seat.status || '').toUpperCase();
    const type = (seat.seatTypeName || '').toUpperCase();
    const isSelected = selectedSeatIds.has(seat.id);

    // 1. BOOKED / DISABLED => xám, gạch, không chọn được
    if (status === SeatStatus.BOOKED || status === SeatStatus.DISABLED) {
      return (
        base +
        ' bg-gray-300 border-gray-300 text-gray-400 cursor-not-allowed line-through'
      );
    }

    // 2. HOLDING => vàng nhạt, không chọn được
    if (status === SeatStatus.HOLDING) {
      return (
        base +
        ' bg-amber-100 border-amber-400 text-amber-800 cursor-not-allowed'
      );
    }

    // 3. AVAILABLE + đang được chọn
    if (isSelected) {
      return (
        base +
        ' bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200'
      );
    }

    // 4. AVAILABLE + chưa chọn -> theo SeatType
    if (type === SeatType.VIP) {
      return (
        base +
        ' bg-amber-50 border-amber-500 text-amber-800 hover:bg-amber-100 hover:border-amber-600'
      );
    }

    if (type === SeatType.SWEETBOX) {
      return (
        base +
        ' bg-pink-50 border-pink-500 text-pink-800 hover:bg-pink-100 hover:border-pink-600'
      );
    }

    // STANDARD / mặc định
    return (
      base +
      ' bg-slate-50 border-gray-300 text-gray-800 hover:bg-blue-50 hover:border-blue-400'
    );
  };

  // ===== Legend sample classes =====
  const legendSeatClass = (extra: string) =>
    'w-6 h-6 rounded-sm border ' + extra;

  // ===== UI =====
  if (loading && !data) {
    return (
      <main className="min-h-[60vh] bg-slate-50">
        <div className="container mx-auto px-4 py-10">
          <p className="text-center text-gray-600 text-base">
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
          <p className="text-center text-red-600 text-base">{error}</p>
          <div className="text-center">
            <Link
              href="/cinemas"
              className="inline-flex items-center px-4 py-2 rounded-full border border-gray-300 text-sm text-gray-700 hover:bg-gray-100"
            >
              Quay lại danh sách rạp
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-10">
      <div className="border-b bg-white/80 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="space-y-1">
            <p className="text-xs md:text-sm text-gray-500 uppercase tracking-[0.2em]">
              Đặt vé online
            </p>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              {data?.movieName || 'Chọn ghế'}
            </h1>
            <p className="text-xs md:text-sm text-gray-600">
              {data?.cinemaName && (
                <>
                  Rạp: <span className="font-medium">{data.cinemaName}</span>
                </>
              )}
              {data?.sumSeats ? (
                <>
                  {' '}
                  • Tổng số ghế:{' '}
                  <span className="font-medium">{data.sumSeats}</span>
                </>
              ) : null}
            </p>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <Link
              href="/cinemas"
              className="px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-700 hover:bg-gray-100"
            >
              Quay lại chọn rạp
            </Link>
          </div>
        </div>
      </div>

      <section className="container mx-auto px-4 pt-6 space-y-6">
        {/* SCREEN label */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 px-4 md:px-8 pt-5 pb-6">
          <div className="flex flex-col items-center gap-4">
            <div className="w-full max-w-3xl">
              <div className="h-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent rounded-full" />
            </div>
            <div className="text-xs md:text-sm font-semibold tracking-[0.25em] text-gray-500 uppercase">
              Màn hình
            </div>

            {/* SEAT GRID */}
            <div className="mt-4 w-full flex justify-center">
              <div className="inline-flex flex-col items-center gap-2">
                {rows.map(({ row, seats }) => (
                  <div key={row} className="flex items-center gap-2">
                    <span className="w-6 text-xs md:text-sm text-gray-500 text-right">
                      {row}
                    </span>
                    <div className="flex gap-1.5">
                      {seats.map((seat) => (
                        <button
                          key={seat.id}
                          type="button"
                          className={getSeatClasses(seat)}
                          onClick={() => toggleSeat(seat)}
                        >
                          {seat.seatCode.replace(row, '')}
                        </button>
                      ))}
                    </div>
                    <span className="w-6" /> {/* đối xứng bên phải */}
                  </div>
                ))}
              </div>
            </div>

            {/* LEGEND */}
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs md:text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span
                  className={legendSeatClass('bg-slate-50 border-gray-300')}
                />
                Ghế thường (STANDARD)
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={legendSeatClass('bg-amber-50 border-amber-500')}
                />
                Ghế VIP
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={legendSeatClass('bg-pink-50 border-pink-500')}
                />
                Ghế đôi / Sweetbox
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={legendSeatClass('bg-blue-600 border-blue-600')}
                />
                Ghế đang chọn
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={legendSeatClass(
                    'bg-amber-100 border-amber-400',
                  )}
                />
                Đang giữ chỗ (HOLDING)
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={legendSeatClass('bg-gray-300 border-gray-300')}
                />
                Đã bán / khóa (BOOKED / DISABLED)
              </div>
            </div>
          </div>
        </div>

        {/* SUMMARY BAR */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 px-4 md:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
              Thông tin ghế
            </p>
            {selectedSeats.length === 0 ? (
              <p className="text-sm text-gray-600">
                Hãy chọn ghế trên sơ đồ để tiếp tục.
              </p>
            ) : (
              <div className="text-sm text-gray-800">
                <span className="font-semibold">Ghế: </span>
                {selectedSeats.map((s) => s.seatCode).join(', ')}
                <br />
                <span className="font-semibold">Số lượng: </span>
                {selectedSeats.length}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-sm md:text-base">
              <span className="text-gray-600 mr-2">Tổng tiền:</span>
              <span className="font-bold text-blue-600">
                {formatCurrency(totalPrice)}
              </span>
            </div>
            <button
              type="button"
              disabled={selectedSeats.length === 0}
              className={`px-6 py-2.5 rounded-full text-sm md:text-base font-semibold transition-all ${
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
