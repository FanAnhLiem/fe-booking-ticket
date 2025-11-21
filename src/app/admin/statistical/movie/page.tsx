'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

const BASE_API = 'http://localhost:8080/api';
const REVENUE_ADMIN_API = `${BASE_API}/admin/revenue`;

const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('accessToken');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

interface MovieRevenue {
  movieName: string;
  totalTicket: number;
  totalRevenue: number;
}

const formatCurrency = (value: number): string =>
  value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const formatNumber = (value: number): string =>
  value.toLocaleString('vi-VN');

// yyyy-MM-dd -> dd-MM-yyyy (đúng format BE)
const isoToDdMmYyyy = (iso: string): string => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
};

const buildDateQuery = (startIso: string, endIso: string): string => {
  const params = new URLSearchParams({
    startDay: isoToDdMmYyyy(startIso),
    endDay: isoToDdMmYyyy(endIso),
  });
  return params.toString();
};

const ITEMS_PER_PAGE = 10;

export default function MovieRevenuePage() {
  const today = new Date();
  const thisYear = today.getFullYear();
  const defaultStartIso = `${thisYear}-01-01`;
  const defaultEndIso = today.toISOString().slice(0, 10);

  const [startIso, setStartIso] = useState(defaultStartIso);
  const [endIso, setEndIso] = useState(defaultEndIso);
  const [data, setData] = useState<MovieRevenue[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const fetchMovieRevenue = async () => {
    setLoading(true);
    try {
      const query = buildDateQuery(startIso, endIso);
      const res = await fetch(`${REVENUE_ADMIN_API}/movie?${query}`, {
        headers: { ...getAuthHeaders() },
      });

      const json = await res.json().catch(() => null);
      if (res.ok && Array.isArray(json?.result)) {
        const list: MovieRevenue[] = json.result.map((m: any) => ({
          movieName: m.movieName,
          totalTicket: Number(m.totalTicket ?? m.totalTickets ?? 0),
          totalRevenue: Number(m.totalRevenue ?? 0),
        }));

        // sort theo số vé giảm dần để biểu đồ nhìn đẹp
        list.sort((a, b) => b.totalTicket - a.totalTicket);
        setData(list);
        setPage(1);
      } else {
        console.error('Get movie revenue error:', json);
        setData([]);
      }
    } catch (error) {
      console.error('Fetch movie revenue failed:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovieRevenue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.max(1, Math.ceil(data.length / ITEMS_PER_PAGE));
  const currentData = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return data.slice(start, start + ITEMS_PER_PAGE);
  }, [data, page]);

  // Top 12 phim để vẽ chart
  const chartData = useMemo(() => data.slice(0, 12), [data]);

  return (
    <div className="w-full max-w-6xl mx-auto mt-8 space-y-6">
      {/* Filter */}
      <div className="bg-white rounded-xl border shadow-sm p-4 flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-800 mb-1">
            Số vé bán ra theo phim
          </p>
          <p className="text-[11px] text-slate-500">
            Thống kê theo khoảng thời gian (yyyy-MM-dd).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 text-xs">
          <div className="flex flex-col">
            <label className="text-[11px] text-slate-600 mb-1">Từ ngày</label>
            <input
              type="date"
              value={startIso}
              onChange={(e) => setStartIso(e.target.value)}
              className="border rounded-lg px-2 py-1 text-xs"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[11px] text-slate-600 mb-1">Đến ngày</label>
            <input
              type="date"
              value={endIso}
              onChange={(e) => setEndIso(e.target.value)}
              className="border rounded-lg px-2 py-1 text-xs"
            />
          </div>
          <button
            onClick={fetchMovieRevenue}
            disabled={loading}
            className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? 'Đang tải...' : 'Lọc'}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center text-xs text-slate-500 gap-2">
          <Loader2 className="animate-spin" size={14} />
          Đang tải dữ liệu doanh thu theo phim...
        </div>
      )}

      {/* Biểu đồ cột: Số vé bán ra theo phim */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <h3 className="text-sm font-semibold text-slate-800 text-center mb-2">
          Số vé bán ra theo phim
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 20, left: 0, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="movieName"
              interval={0}
              angle={-40}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 10 }}
            />
            <YAxis tickFormatter={(v) => v.toLocaleString('vi-VN')} />
            <Tooltip
              formatter={(v: any) => formatNumber(Number(v))}
              labelFormatter={(label) => `Phim: ${label}`}
            />
            <Legend />
            <Bar dataKey="totalTicket" name="Số vé bán ra" fill="#36a2eb" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bảng + phân trang */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-700">
            Danh sách phim (theo vé bán)
          </p>
          <p className="text-[11px] text-slate-500">
            Tổng: {formatNumber(data.length)} phim
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-[11px] text-slate-600">
                  #
                </th>
                <th className="px-3 py-2 text-left font-semibold text-[11px] text-slate-600">
                  Tên phim
                </th>
                <th className="px-3 py-2 text-right font-semibold text-[11px] text-slate-600">
                  Số vé bán
                </th>
                <th className="px-3 py-2 text-right font-semibold text-[11px] text-slate-600">
                  Doanh thu
                </th>
              </tr>
            </thead>
            <tbody>
              {currentData.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-4 text-center text-[11px] text-slate-500"
                  >
                    Không có dữ liệu.
                  </td>
                </tr>
              ) : (
                currentData.map((m, index) => (
                  <tr
                    key={m.movieName + index}
                    className="border-t hover:bg-slate-50/80"
                  >
                    <td className="px-3 py-2 text-[11px] text-slate-700">
                      {(page - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-slate-800">
                      {m.movieName}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-right text-slate-700">
                      {formatNumber(m.totalTicket)}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-right text-slate-800">
                      {formatCurrency(m.totalRevenue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-2 flex items-center justify-between border-t text-[11px] text-slate-600">
          <span>
            Trang {page}/{totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded-md border hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 rounded-md border hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
