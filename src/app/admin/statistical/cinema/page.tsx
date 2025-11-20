'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

const BASE_API = 'http://localhost:8080/api';
const REVENUE_ADMIN_API = `${BASE_API}/admin/revenue`;

const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('accessToken');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

interface CinemaRevenue {
  cinemaName: string;
  totalTicket: number;
  totalRevenue: number;
}

const formatCurrency = (value: number): string =>
  value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const formatNumber = (value: number): string =>
  value.toLocaleString('vi-VN');

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

interface SimpleBarChartProps<T> {
  title: string;
  data: T[];
  getLabel: (item: T) => string;
  getValue: (item: T) => number;
  valueFormatter?: (val: number) => string;
}

function SimpleBarChart<T>({
  title,
  data,
  getLabel,
  getValue,
  valueFormatter = (v) => v.toString(),
}: SimpleBarChartProps<T>) {
  const values = data.map((d) => getValue(d));
  const maxValue = values.length ? Math.max(...values) : 0;
  const safeMax = maxValue > 0 ? maxValue : 1;

  return (
    <div className="bg-white rounded-xl border shadow-sm p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-slate-800">{title}</h3>
      </div>
      {data.length === 0 ? (
        <p className="text-xs text-slate-500">Chưa có dữ liệu.</p>
      ) : (
        <div className="flex-1 flex flex-col justify-end">
          <div className="flex items-end gap-3 h-56">
            {data.map((item, idx) => {
              const v = getValue(item);
              const heightPercent = (v / safeMax) * 100;
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center flex-1 min-w-[30px]"
                >
                  <div className="text-[10px] text-slate-500 mb-1 truncate max-w-[60px]">
                    {valueFormatter(v)}
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-40 flex items-end overflow-hidden">
                    <div
                      className="w-full bg-[#0c46d6] rounded-full transition-all"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <div className="mt-1 text-[11px] text-slate-600 text-center">
                    {getLabel(item)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CinemaRevenuePage() {
  const today = new Date();
  const thisYear = today.getFullYear();
  const defaultStartIso = `${thisYear}-01-01`;
  const defaultEndIso = today.toISOString().slice(0, 10);

  const [startIso, setStartIso] = useState(defaultStartIso);
  const [endIso, setEndIso] = useState(defaultEndIso);

  const [data, setData] = useState<CinemaRevenue[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  const fetchCinemaRevenue = async () => {
    setLoading(true);
    try {
      const query = buildDateQuery(startIso, endIso);
      const res = await fetch(`${REVENUE_ADMIN_API}/cinema?${query}`, {
        headers: { ...getAuthHeaders() },
      });
      const json = await res.json().catch(() => null);
      if (res.ok && Array.isArray(json?.result)) {
        const list: CinemaRevenue[] = json.result.map((c: any) => ({
          cinemaName: c.cinemaName,
          totalTicket: Number(c.totalTicket ?? c.totalTickets ?? 0),
          totalRevenue: Number(c.totalRevenue ?? 0),
        }));
        list.sort((a, b) => b.totalRevenue - a.totalRevenue);
        setData(list);
        setPage(1);
      } else {
        console.error('Get cinema revenue error:', json);
        setData([]);
      }
    } catch (error) {
      console.error('Fetch cinema revenue failed:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCinemaRevenue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));
  const currentData = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  }, [data, page]);

  return (
    <div className="w-full max-w-6xl mx-auto mt-8 space-y-6">
      {/* Filter */}
      <div className="bg-white rounded-xl border shadow-sm p-4 flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-700 mb-1">
            Khoảng thời gian
          </p>
          <div className="flex flex-col sm:flex-row gap-2 text-xs">
            <label className="flex-1 flex items-center gap-2">
              <span className="whitespace-nowrap">Từ ngày</span>
              <input
                type="date"
                className="flex-1 border rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-slate-400"
                value={startIso}
                onChange={(e) => setStartIso(e.target.value)}
              />
            </label>
            <label className="flex-1 flex items-center gap-2">
              <span className="whitespace-nowrap">Đến ngày</span>
              <input
                type="date"
                className="flex-1 border rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-slate-400"
                value={endIso}
                onChange={(e) => setEndIso(e.target.value)}
              />
            </label>
          </div>
        </div>
        <button
          type="button"
          className="px-3 py-2 rounded-lg bg-[#0c46d6] text-white text-xs hover:bg-slate-800 flex items-center gap-2 self-start sm:self-auto disabled:opacity-60"
          onClick={fetchCinemaRevenue}
          disabled={loading}
        >
          {loading && <Loader2 className="animate-spin" size={14} />}
          Áp dụng lọc
        </button>
      </div>

      {/* Bảng */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-semibold text-sm">Doanh thu theo rạp</h3>
          {loading && (
            <span className="flex items-center text-xs text-slate-500">
              <Loader2 className="animate-spin mr-1" size={14} />
              Đang tải...
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">
                  #
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">
                  Rạp
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">
                  Số vé
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">
                  Doanh thu
                </th>
              </tr>
            </thead>
            <tbody>
              {currentData.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-sm text-slate-500"
                  >
                    Không có dữ liệu.
                  </td>
                </tr>
              ) : (
                currentData.map((c, idx) => (
                  <tr
                    key={c.cinemaName + idx}
                    className="border-t hover:bg-slate-50"
                  >
                    <td className="px-4 py-2 text-xs text-slate-500">
                      {(page - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="px-4 py-2 text-sm text-slate-800">
                      {c.cinemaName}
                    </td>
                    <td className="px-4 py-2 text-right text-sm text-slate-800">
                      {formatNumber(c.totalTicket)}
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-medium text-slate-900">
                      {formatCurrency(c.totalRevenue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t flex items-center justify-between text-xs text-slate-600">
          <span>
            Trang {page} / {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              className="p-1 rounded border bg-white disabled:opacity-40"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="p-1 rounded border bg:white disabled:opacity-40"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Chart top rạp */}
      <SimpleBarChart<CinemaRevenue>
        title="Top rạp theo doanh thu"
        data={data.slice(0, 8)}
        getLabel={(c) => c.cinemaName}
        getValue={(c) => c.totalRevenue}
        valueFormatter={(v) => formatCurrency(v)}
      />
    </div>
  );
}
