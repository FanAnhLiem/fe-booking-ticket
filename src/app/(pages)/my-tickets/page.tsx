'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const BASE_API = 'http://localhost:8080/api';
const MY_TICKETS_API = `${BASE_API}/invoice/list`;

interface ApiResponse<T> {
  code?: number;
  message?: string;
  result?: T;
}

interface InvoiceResponseFE {
  invoiceId: number;
  movieName: string;
  totalTicket: number;
  showDate: string;
  startTime: string;
  totalMoney: number;
}

const getAccessToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
};

const formatCurrency = (n: number) =>
  n.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' đ';

const formatTime = (t: string) => (t ? t.slice(0, 5) : '');

const formatDate = (d: string) => {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
};

export default function MyTicketsPage() {
  const router = useRouter();

  const [tickets, setTickets] = useState<InvoiceResponseFE[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      const redirectPath =
        typeof window !== 'undefined'
          ? window.location.pathname + window.location.search
          : '/my-tickets';
      router.push(`/sign-in?redirect=${encodeURIComponent(redirectPath)}`);
      return;
    }

    const fetchTickets = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(MY_TICKETS_API, {
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
          throw new Error(
            msg || rawText || 'Không thể tải lịch sử vé của bạn.',
          );
        }

        if (!rawText) {
          setTickets([]);
          return;
        }

        let json: ApiResponse<InvoiceResponseFE[]>;
        try {
          json = JSON.parse(rawText) as ApiResponse<InvoiceResponseFE[]>;
        } catch (e) {
          console.error('MyTickets JSON error:', rawText);
          throw new Error('Dữ liệu lịch sử vé không phải JSON hợp lệ.');
        }

        const rawList: InvoiceResponseFE[] = Array.isArray(json.result)
          ? json.result
          : [];

        setTickets(rawList);
      } catch (e: any) {
        console.error('Fetch tickets error:', e);
        setError(
          e.message ||
            'Có lỗi xảy ra khi tải lịch sử vé. Vui lòng thử lại sau ít phút.',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [router]);

  const invoiceCount = tickets.length;
  const totalTicketCount = useMemo(
    () => tickets.reduce((sum, t) => sum + (t.totalTicket ?? 0), 0),
    [tickets],
  );
  const totalSpent = useMemo(
    () => tickets.reduce((sum, t) => sum + Number(t.totalMoney ?? 0), 0),
    [tickets],
  );

  return (
    <main className="min-h-screen bg-slate-50 pb-10">
      {/* HEADER SECTION */}
      <section className="border-b bg-gradient-to-r from-slate-900 via-blue-900 to-sky-700 text-white">
        <div className="container mx-auto px-4 py-6 md:py-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs md:text-sm uppercase tracking-[0.2em] text-blue-200">
              Lịch sử đơn hàng
            </p>
            <h1 className="mt-1 text-2xl md:text-3xl font-bold">
              Vé đã đặt của bạn
            </h1>
            <p className="mt-2 text-sm md:text-base text-blue-100 max-w-xl">
              Xem lại các hóa đơn đã đặt vé, bao gồm phim, số lượng vé, thời
              gian chiếu và tổng tiền.
            </p>
          </div>

          <div className="flex flex-row md:flex-col gap-3 text-sm md:text-base">
            <div className="px-4 py-2 rounded-2xl bg-white/10 border border-white/20 backdrop-blur flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-lg">
                🧾
              </div>
              <div>
                <div className="text-xs text-blue-100">Số hóa đơn</div>
                <div className="text-lg font-semibold">
                  {invoiceCount || 0}
                </div>
              </div>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-white/10 border border-white/20 backdrop-blur flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-lg">
                🎟
              </div>
              <div>
                <div className="text-xs text-blue-100">Tổng số vé</div>
                <div className="text-lg font-semibold">
                  {totalTicketCount || 0}
                </div>
              </div>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-white/10 border border-white/20 backdrop-blur flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-lg">
                💰
              </div>
              <div>
                <div className="text-xs text-blue-100">Tổng tiền</div>
                <div className="text-lg font-semibold">
                  {formatCurrency(totalSpent)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BODY SECTION */}
      <section className="container mx-auto px-4 pt-6 space-y-4">
        {loading && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 text-center text-slate-600 text-sm">
            Đang tải lịch sử vé của bạn...
          </div>
        )}

        {error && !loading && (
          <div className="bg-white rounded-3xl shadow-sm border border-red-100 p-6 text-sm text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && tickets.length === 0 && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 flex flex-col items-center text-center gap-4">
            <p className="text-base md:text-lg font-semibold text-slate-800">
              Bạn chưa có hóa đơn vé nào.
            </p>
            <p className="text-sm text-slate-600 max-w-md">
              Hãy chọn phim đang chiếu và đặt vé ngay để trải nghiệm xem phim và
              quản lý lịch sử hóa đơn của bạn.
            </p>
            <Link
              href="/movie-showing"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 text-white text-sm font-semibold shadow hover:bg-blue-700"
            >
              <span>Xem phim đang chiếu</span> <span>🎬</span>
            </Link>
          </div>
        )}

        {!loading && !error && tickets.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 md:p-6 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base md:text-lg font-semibold text-slate-900">
                Danh sách hóa đơn
              </h2>
              <span className="text-xs md:text-sm text-slate-500">
                Bấm vào từng hóa đơn để xem chi tiết.
              </span>
            </div>

            <div className="space-y-3">
              {tickets.map((inv) => (
                <Link
                  key={inv.invoiceId}
                  href={`/my-tickets/${inv.invoiceId}`}
                  className="block"
                >
                  <article className="rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 hover:border-blue-200 transition-colors shadow-sm px-4 py-3 md:px-5 md:py-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      {/* LEFT INFO */}
                      <div className="flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <h3 className="text-sm md:text-base font-semibold text-slate-900">
                            {inv.movieName}
                          </h3>
                        </div>

                        <div className="text-xs md:text-sm text-slate-700 space-y-0.5">
                          <p>
                            <span className="font-medium">Suất chiếu:</span>{' '}
                            {formatDate(inv.showDate)}{' '}
                            <span className="text-slate-500">
                              • {formatTime(inv.startTime)}
                            </span>
                          </p>
                          <p>
                            <span className="font-medium">Số vé:</span>{' '}
                            {inv.totalTicket}
                          </p>
                        </div>
                      </div>

                      {/* RIGHT SUMMARY */}
                      <div className="w-full md:w-48 flex md:flex-col justify-between md:items-end gap-2 text-xs md:text-sm">
                        <div className="text-right">
                          <p className="text-[11px] uppercase tracking-wide text-slate-500">
                            Tổng tiền
                          </p>
                          <p className="text-base md:text-lg font-bold text-blue-600">
                            {formatCurrency(Number(inv.totalMoney ?? 0))}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500 italic">
                            Nhấn để xem chi tiết
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
