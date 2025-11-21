'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const BASE_API = 'http://localhost:8080/api';

const getAccessToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
};

interface ApiResponse<T> {
  code?: number;
  message?: string;
  result?: T;
}

// Map đúng với InvoiceDetailResponse bên BE
interface InvoiceDetailFE {
  invoiceId: number;
  movieName: string;
  screenRoomType: string;
  bookingCode: string;
  showDate: string;
  startTime: string;
  screenRoomName: string;
  seatList: string[];
  totalTicket: number;
  totalMoney: number;
  userId: number;
  userName: string;
}

const formatCurrency = (n: number) =>
  n.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' đ';

const formatTime = (t: string) => (t ? t.slice(0, 5) : '');

const formatDate = (d: string) => {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
};

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const invoiceId = params?.id;

  const [detail, setDetail] = useState<InvoiceDetailFE | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!invoiceId) return;

    const token = getAccessToken();
    if (!token) {
      const redirectPath =
        typeof window !== 'undefined'
          ? window.location.pathname + window.location.search
          : `/my-tickets/${invoiceId}`;
      router.push(`/sign-in?redirect=${encodeURIComponent(redirectPath)}`);
      return;
    }

    const fetchDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${BASE_API}/invoice/${invoiceId}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });

        const rawText = await res.text();

        if (!res.ok) {
          let msg = '';
          try {
            const err = JSON.parse(rawText) as ApiResponse<unknown>;
            msg = err.message || '';
          } catch {
            // ignore
          }
          throw new Error(msg || rawText || 'Không thể tải chi tiết hóa đơn.');
        }

        if (!rawText) {
          throw new Error('Không tìm thấy dữ liệu hóa đơn.');
        }

        let json: ApiResponse<InvoiceDetailFE>;
        try {
          json = JSON.parse(rawText) as ApiResponse<InvoiceDetailFE>;
        } catch (e) {
          console.error('Invoice detail JSON error:', rawText);
          throw new Error('Dữ liệu chi tiết hóa đơn không phải JSON hợp lệ.');
        }

        if (!json.result) {
          throw new Error('Không tìm thấy thông tin hóa đơn.');
        }

        const result = json.result;
        setDetail({
          invoiceId: result.invoiceId,
          movieName: result.movieName,
          screenRoomType: result.screenRoomType,
          bookingCode: result.bookingCode,
          showDate: String(result.showDate),
          startTime: String(result.startTime),
          screenRoomName: result.screenRoomName,
          seatList: Array.isArray(result.seatList) ? result.seatList : [],
          totalTicket: result.totalTicket,
          totalMoney: Number(result.totalMoney ?? 0),
          userId: result.userId,
          userName: result.userName,
        });
      } catch (e: any) {
        console.error('Fetch invoice detail error:', e);
        setError(
          e.message ||
            'Có lỗi xảy ra khi tải chi tiết hóa đơn. Vui lòng thử lại sau.',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [invoiceId, router]);

  return (
    <main className="min-h-screen bg-slate-50 pb-10">
      {/* HEADER */}
      <section className="border-b bg-gradient-to-r from-slate-900 via-blue-900 to-sky-700 text-white">
        <div className="container mx-auto px-4 py-6 md:py-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs md:text-sm uppercase tracking-[0.2em] text-blue-200">
              Chi tiết hóa đơn
            </p>
            <h1 className="mt-1 text-2xl md:text-3xl font-bold">
              Hóa đơn #{invoiceId}
            </h1>
            {detail?.movieName && (
              <p className="mt-2 text-sm md:text-base text-blue-100 max-w-xl">
                Phim: <span className="font-semibold">{detail.movieName}</span>
              </p>
            )}
          </div>
          <Link
            href="/my-tickets"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/30 text-xs md:text-sm hover:bg-white/20"
          >
            ← Quay lại lịch sử vé
          </Link>
        </div>
      </section>

      {/* BODY */}
      <section className="container mx-auto px-4 pt-6 space-y-4">
        {loading && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 text-center text-slate-600 text-sm">
            Đang tải chi tiết hóa đơn...
          </div>
        )}

        {error && !loading && (
          <div className="bg-white rounded-3xl shadow-sm border border-red-100 p-6 text-sm text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && detail && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Thông tin phim & suất chiếu */}
            <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-5 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-base md:text-lg font-semibold text-slate-900">
                  {detail.movieName}
                </h2>
                {detail.bookingCode && (
                  <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-2.5 py-0.5 text-[11px] font-medium">
                    Mã hóa đơn: {detail.bookingCode}
                  </span>
                )}
                {detail.screenRoomType && (
                  <span className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 px-2.5 py-0.5 text-[11px] font-medium">
                    {detail.screenRoomType}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs md:text-sm text-slate-700">
                <div className="space-y-1">
                  <p>
                    <span className="font-medium">Suất chiếu:</span>{' '}
                    {formatDate(detail.showDate)}{' '}
                    <span className="text-slate-500">
                      • {formatTime(detail.startTime)}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">Phòng chiếu:</span>{' '}
                    {detail.screenRoomName || '—'}
                  </p>
                  <p>
                    <span className="font-medium">Số vé:</span>{' '}
                    {detail.totalTicket}
                  </p>
                </div>

                <div className="space-y-1">
                  <p>
                    <span className="font-medium">Khách hàng:</span>{' '}
                    {detail.userName || '—'}
                  </p>
                  <p>
                    <span className="font-medium">Mã khách hàng:</span>{' '}
                    {detail.userId ?? '—'}
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <p className="text-xs font-semibold text-slate-800 mb-1">
                  Danh sách ghế
                </p>
                {detail.seatList.length === 0 ? (
                  <p className="text-xs text-slate-500">Không có dữ liệu ghế.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {detail.seatList.map((seat, idx) => (
                      <span
                        key={seat + idx}
                        className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[11px] font-medium"
                      >
                        {seat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tổng tiền & thông tin tóm tắt */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Tóm tắt hóa đơn
              </h3>
              <div className="space-y-1 text-xs md:text-sm text-slate-700">
                <p>
                  <span className="font-medium">Mã hóa đơn:</span>{' '}
                  {detail.invoiceId}
                </p>
                <p>
                  <span className="font-medium">Số vé:</span>{' '}
                  {detail.totalTicket}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-3 mt-2">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  Tổng tiền
                </p>
                <p className="text-xl md:text-2xl font-bold text-blue-600">
                  {formatCurrency(detail.totalMoney)}
                </p>
              </div>

              <p className="text-[11px] text-slate-500">
                Vui lòng xuất trình mã đặt chỗ/QR tương ứng tại quầy vé hoặc
                cổng soát vé của rạp để được hỗ trợ nhanh nhất.
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
