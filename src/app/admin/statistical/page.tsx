'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';

const BASE_API = 'http://localhost:8080/api';
const REVENUE_ADMIN_API = `${BASE_API}/admin/revenue`;

// Lấy token cho admin
const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('accessToken');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

interface RevenueDashboard {
  todayTicket: number;
  todayRevenue: number;
  monthRevenue: number;
  monthTicket: number;
}

interface StatisticSummary {
  month: number;
  monthTicket: number;
  monthRevenue: number;
}

const formatCurrency = (value: number): string =>
  value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const formatNumber = (value: number): string =>
  value.toLocaleString('vi-VN');

export default function StatisticalOverviewPage() {
  const [dashboard, setDashboard] = useState<RevenueDashboard | null>(null);
  const [monthStats, setMonthStats] = useState<StatisticSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const [resDash, resStats] = await Promise.all([
        fetch(`${REVENUE_ADMIN_API}/dashbroad`, {
          headers: { ...getAuthHeaders() },
        }),
        fetch(`${REVENUE_ADMIN_API}/statistics/list`, {
          headers: { ...getAuthHeaders() },
        }),
      ]);

      const dashData = await resDash.json().catch(() => null);
      if (resDash.ok && dashData?.result) {
        const r = dashData.result;
        setDashboard({
          todayTicket: Number(r.todayTicket ?? 0),
          todayRevenue: Number(r.todayRevenue ?? 0),
          monthRevenue: Number(r.monthRevenue ?? 0),
          monthTicket: Number(r.monthTicket ?? r.monthTickets ?? 0),
        });
      } else {
        console.error('Get dashboard revenue error:', dashData);
      }

      const statsData = await resStats.json().catch(() => null);
      if (resStats.ok && Array.isArray(statsData?.result)) {
        const list: StatisticSummary[] = statsData.result.map((s: any) => ({
          month: Number(s.month ?? 0),
          monthTicket: Number(s.monthTicket ?? 0),
          monthRevenue: Number(s.monthRevenue ?? 0),
        }));
        setMonthStats(list);
      } else {
        console.error('Get revenue statistics list error:', statsData);
      }
    } catch (error) {
      console.error('Fetch overview failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  /**
   * chartData: luôn có đủ từ tháng 1 -> tháng lớn nhất trong dữ liệu.
   * Tháng nào không có dữ liệu thì revenue = 0, tickets = 0.
   */
  const chartData = useMemo(() => {
    if (!monthStats.length) return [];

    const maxMonth = Math.max(
      ...monthStats.map((m) => (m.month ? Number(m.month) : 0)),
    );

    const byMonth = new Map<number, StatisticSummary>();
    monthStats.forEach((m) => {
      if (m.month) byMonth.set(Number(m.month), m);
    });

    const filled: { monthLabel: string; revenue: number; tickets: number }[] =
      [];

    for (let m = 1; m <= maxMonth; m += 1) {
      const stat = byMonth.get(m);
      filled.push({
        monthLabel: `Th ${m}`,
        revenue: stat ? stat.monthRevenue : 0,
        tickets: stat ? stat.monthTicket : 0,
      });
    }

    return filled;
  }, [monthStats]);

  return (
    <div className="w-full max-w-6xl mx-auto mt-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Thống kê doanh thu
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tổng quan doanh thu và số vé theo ngày / theo tháng.
          </p>
        </div>
        <button
          onClick={fetchOverview}
          disabled={loading}
          className="px-3 py-2 rounded-lg text-xs bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">Vé hôm nay</p>
          <p className="text-2xl font-semibold text-slate-900">
            {dashboard ? formatNumber(dashboard.todayTicket) : 0}
          </p>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">Doanh thu hôm nay</p>
          <p className="text-lg font-semibold text-slate-900">
            {dashboard ? formatCurrency(dashboard.todayRevenue) : '0 đ'}
          </p>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">
            Doanh thu tháng hiện tại
          </p>
          <p className="text-lg font-semibold text-slate-900">
            {dashboard ? formatCurrency(dashboard.monthRevenue) : '0 đ'}
          </p>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">Vé tháng hiện tại</p>
          <p className="text-2xl font-semibold text-slate-900">
            {dashboard ? formatNumber(dashboard.monthTicket) : 0}
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center text-xs text-slate-500 gap-2">
          <Loader2 className="animate-spin" size={14} />
          Đang tải dữ liệu thống kê...
        </div>
      )}

      {/* Charts: line + bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Line chart doanh thu theo tháng */}
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-800 text-center mb-2">
            Doanh thu theo tháng
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="monthLabel" />
              <YAxis tickFormatter={(v) => v.toLocaleString('vi-VN')} />
              <Tooltip
                formatter={(v: any) => formatCurrency(Number(v))}
                labelFormatter={(label) => `Tháng: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Doanh thu"
                stroke="#ff6384"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart số vé theo tháng */}
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-800 text-center mb-2">
            Số vé bán theo tháng
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="monthLabel" />
              <YAxis tickFormatter={(v) => v.toLocaleString('vi-VN')} />
              <Tooltip
                formatter={(v: any) => formatNumber(Number(v))}
                labelFormatter={(label) => `Tháng: ${label}`}
              />
              <Legend />
              <Bar
                dataKey="tickets"
                name="Số vé bán ra"
                fill="#36a2eb"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
