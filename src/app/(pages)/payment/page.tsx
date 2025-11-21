'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const BASE_API = 'http://localhost:8080/api';
const SEAT_SHOWTIME_API = `${BASE_API}/seat`;
const VNPAY_PAYMENT_API = `${BASE_API}/vnpay/payment`;
const INVOICE_API = `${BASE_API}/invoice`;

interface ApiResponse<T> {
  code?: number;
  message?: string;
  result?: T;
}

interface SeatShowTimeSeat {
  id: number;
  seatCode: string;
  price: number | string;
  status: string;
  seatTypeName: string;
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

const formatCurrency = (n: number) =>
  n.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' đ';

const formatShowDate = (raw: string | null | undefined) => {
  if (!raw) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split('-');
    return `${d}/${m}/${y}`;
  }
  return raw;
};

const formatShowTime = (raw: string | null | undefined) => {
  if (!raw) return '';
  return raw.slice(0, 5);
};

const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('accessToken');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

export default function PaymentPage() {
  const searchParams = useSearchParams();

  const showTimeId = searchParams.get('showTimeId') ?? '';
  const seatIdsParam = searchParams.get('seatIds') ?? '';
  const amountParam = searchParams.get('amount') ?? '';

  const seatIdNumbers = useMemo(
    () =>
      seatIdsParam
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
        .map((x) => Number(x))
        .filter((x) => Number.isFinite(x)),
    [seatIdsParam],
  );

  const amountNumber = useMemo(() => {
    const n = Number(amountParam);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [amountParam]);

  const [seatData, setSeatData] = useState<SeatShowTime | null>(null);
  const [loadingSeat, setLoadingSeat] = useState(false);
  const [loadingPay, setLoadingPay] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  // Fetch lại info showtime/seat
  useEffect(() => {
    if (!showTimeId) return;

    let cancelled = false;
    const fetchSeat = async () => {
      setLoadingSeat(true);
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
            msg || raw || 'Không thể tải thông tin suất chiếu.',
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

        if (!cancelled) setSeatData(dataRes.result || null);
      } catch (err: any) {
        if (!cancelled) {
          console.error('Fetch seat/showtime error:', err);
          setError(
            err.message || 'Có lỗi xảy ra khi tải thông tin suất chiếu.',
          );
        }
      } finally {
        if (!cancelled) setLoadingSeat(false);
      }
    };

    fetchSeat();
    return () => {
      cancelled = true;
    };
  }, [showTimeId]);

  const selectedSeats = useMemo(() => {
    if (!seatData?.seatList || seatIdNumbers.length === 0) return [];
    const setIds = new Set(seatIdNumbers);
    return seatData.seatList.filter((s) => setIds.has(s.id));
  }, [seatData, seatIdNumbers]);

  const displayAmount =
    amountNumber ||
    selectedSeats.reduce((sum, s) => {
      const p = typeof s.price === 'number' ? s.price : Number(s.price ?? 0);
      return sum + (Number.isFinite(p) ? p : 0);
    }, 0);

  // ===== HANDLE PAY =====
  const handlePay = async () => {
    setPayError(null);

    if (!agreed) {
      setPayError('Bạn cần xác nhận thông tin chính xác trước khi thanh toán.');
      return;
    }
    if (!showTimeId || seatIdNumbers.length === 0 || displayAmount <= 0) {
      setPayError('Thiếu thông tin thanh toán. Hãy quay lại bước chọn ghế.');
      return;
    }

    try {
      setLoadingPay(true);

      // 1. Tạo giao dịch VNPay
      const payRes = await fetch(VNPAY_PAYMENT_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          amount: Math.round(displayAmount),
          bankCode: 'NCB',
        }),
      });

      const payRaw = await payRes.text();
      let payData: ApiResponse<{ status: string; paymentUrl: string }> | null =
        null;
      try {
        if (payRaw) {
          payData = JSON.parse(
            payRaw,
          ) as ApiResponse<{ status: string; paymentUrl: string }>;
        }
      } catch {
        // ignore
      }

      if (!payRes.ok || !payData?.result?.paymentUrl) {
        let msg = '';
        if (payData?.message) msg = payData.message;

        throw new Error(
          msg || payRaw || 'Không tạo được giao dịch thanh toán VNPay.',
        );
      }

      const paymentUrl = payData.result.paymentUrl;

      // 2. Lấy vnp_TxnRef & vnp_Amount từ paymentUrl
      let vnp_TxnRef = '';
      let vnp_Amount = '';

      try {
        const url = new URL(paymentUrl);
        vnp_TxnRef = url.searchParams.get('vnp_TxnRef') ?? '';
        vnp_Amount = url.searchParams.get('vnp_Amount') ?? '';
      } catch (e) {
        console.warn('Không parse được paymentUrl:', e);
      }

      // 3. Gọi createInvoice trước khi redirect
      try {
        await fetch(INVOICE_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            showtime_id: Number(showTimeId),
            listSeatId: seatIdNumbers,
            vnp_TxnRef,
            vnp_Amount,
          }),
        });
      } catch (e) {
        console.error('Create invoice error (vẫn redirect VNPay):', e);
      }

      // 4. Redirect sang VNPay
      window.location.href = paymentUrl;
    } catch (err: any) {
      console.error('Thanh toán VNPay lỗi:', err);
      setPayError(
        err.message || 'Có lỗi xảy ra khi tạo giao dịch VNPay. Vui lòng thử lại.',
      );
    } finally {
      setLoadingPay(false);
    }
  };

  // ===== UI =====
  return (
    <main className="min-h-screen bg-slate-50 pb-10">
      <div className="container mx-auto px-4 py-6 md:py-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT – Thông tin phim & thanh toán */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thông tin phim */}
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm px-5 py-4 md:px-7 md:py-6">
            <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-900">
              Thông tin phim
            </h2>

            {loadingSeat ? (
              <p className="text-sm md:text-base text-gray-500">
                Đang tải thông tin suất chiếu...
              </p>
            ) : !seatData ? (
              <p className="text-sm md:text-base text-red-500">
                Không tìm thấy thông tin suất chiếu. Hãy quay lại chọn ghế.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-y-3 text-sm md:text-base text-gray-800">
                <div className="space-y-2">
                  <p className="text-gray-500">Phim</p>
                  <p className="font-semibold text-base md:text-lg">
                    {seatData.movieName}
                  </p>

                  <p className="text-gray-500 mt-3">Ngày giờ chiếu</p>
                  <p className="font-medium">
                    <span className="text-amber-500">
                      {formatShowTime(seatData.showTime)}
                    </span>{' '}
                    - {formatShowDate(seatData.showDate)}
                  </p>

                  <p className="text-gray-500 mt-3">Định dạng</p>
                  <p className="font-medium">2D</p>
                </div>

                <div className="space-y-2">
                  <p className="text-gray-500">Rạp</p>
                  <p className="font-medium">{seatData.cinemaName}</p>

                  <p className="text-gray-500 mt-3">Ghế</p>
                  <p className="font-medium">
                    {selectedSeats.length > 0
                      ? selectedSeats.map((s) => s.seatCode).join(', ')
                      : 'Chưa chọn ghế'}
                  </p>

                  <p className="text-gray-500 mt-3">Phòng chiếu</p>
                  <p className="font-medium">{seatData.screenRoomName}</p>
                </div>
              </div>
            )}
          </section>

          {/* Thông tin thanh toán */}
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm px-5 py-4 md:px-7 md:py-6">
            <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-900">
              Thông tin thanh toán
            </h2>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-slate-50/60">
              <div className="grid grid-cols-3 bg-slate-100 text-xs md:text-sm text-gray-600 px-4 py-2">
                <div>Danh mục</div>
                <div>Số lượng</div>
                <div className="text-right">Tổng tiền</div>
              </div>
              <div className="grid grid-cols-3 px-4 py-3 text-sm md:text-base text-gray-800">
                <div>
                  Ghế{' '}
                  {selectedSeats.length > 0
                    ? selectedSeats.map((s) => s.seatCode).join(', ')
                    : ''}
                </div>
                <div>{selectedSeats.length}</div>
                <div className="text-right font-medium">
                  {formatCurrency(displayAmount)}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT – Phương thức thanh toán */}
        <div className="space-y-6">
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm px-5 py-4 md:px-7 md:py-6">
            <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-900">
              Phương thức thanh toán
            </h2>

            {/* VNPay là phương thức duy nhất – active */}
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-rose-400 bg-rose-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-rose-500 flex items-center justify-center text-xs font-bold text-white">
                  V
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm md:text-base font-semibold text-gray-900">
                    VNPay (VietQR)
                  </span>
                  <span className="text-xs text-gray-500">
                    Thanh toán QR / Internet Banking
                  </span>
                </div>
              </div>
              <span className="text-xs md:text-sm text-rose-500 font-medium">
                Đang chọn
              </span>
            </button>

            {/* Tổng tiền */}
            <div className="mt-5 border-t border-gray-200 pt-4 space-y-3 text-sm md:text-base text-gray-800">
              <div className="flex justify-between">
                <span>Thanh toán</span>
                <span>{formatCurrency(displayAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Phí</span>
                <span>0 đ</span>
              </div>
              <div className="flex justify-between font-semibold text-lg">
                <span>Tổng cộng</span>
                <span>{formatCurrency(displayAmount)}</span>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2 text-xs md:text-sm text-gray-700">
              <input
                id="agree"
                type="checkbox"
                className="mt-1"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <label htmlFor="agree">
                Tôi xác nhận các thông tin đã chính xác và đồng ý với các{' '}
                <span className="underline cursor-pointer">
                  điều khoản &amp; chính sách
                </span>
                .
              </label>
            </div>

            {payError && (
              <p className="mt-3 text-xs md:text-sm text-red-500">{payError}</p>
            )}

            <button
              type="button"
              onClick={handlePay}
              disabled={loadingPay || !seatData || selectedSeats.length === 0}
              className={`mt-5 w-full py-3 rounded-full text-sm md:text-base font-semibold transition-all ${
                loadingPay || !seatData || selectedSeats.length === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-rose-600 text-white hover:bg-rose-700 shadow-md'
              }`}
            >
              {loadingPay ? 'Đang tạo giao dịch...' : 'Thanh toán VNPay'}
            </button>

            <button
              type="button"
              className="mt-3 w-full py-2 rounded-full text-xs md:text-sm border border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              <Link href="/cinemas">Quay lại</Link>
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}
