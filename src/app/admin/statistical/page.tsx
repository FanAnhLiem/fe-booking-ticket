'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';

const BASE_API = 'http://localhost:8080/api';
const REVENUE_ADMIN_API = `${BASE_API}/admin/revenue`;

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
                  <div className="mt-1 text-[11px] text-slate-600">
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
          month: s.month,
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

  const sortedMonthStats = useMemo(
    () => [...monthStats].sort((a, b) => a.month - b.month),
    [monthStats],
  );

  return (
    <div className="w-full max-w-6xl mx-auto mt-8 space-y-6">
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
          <p className="text-xs text-slate-500 mb-1">
            Số vé tháng hiện tại
          </p>
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SimpleBarChart<StatisticSummary>
          title="Doanh thu theo tháng"
          data={sortedMonthStats}
          getLabel={(m) => `Th ${m.month}`}
          getValue={(m) => m.monthRevenue}
          valueFormatter={(v) => formatCurrency(v)}
        />
        <SimpleBarChart<StatisticSummary>
          title="Số vé theo tháng"
          data={sortedMonthStats}
          getLabel={(m) => `Th ${m.month}`}
          getValue={(m) => m.monthTicket}
          valueFormatter={(v) => formatNumber(v)}
        />
      </div>
    </div>
  );
}
