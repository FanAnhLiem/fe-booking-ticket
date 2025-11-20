'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Film,
  Building,
  CalendarDays,
  User,
  Ticket,
} from 'lucide-react';

// ====== Kiểu dữ liệu khớp backend ======
interface InvoiceSummary {
  id: number;
  code: string;
  movieName: string;
  showTime: string;
  screenRoom: string;
  totalMoney: number;
  createDate: string; // yyyy-MM-dd
}

interface InvoiceSeat {
  id: number;
  seatCode: string;
  price: number;
}

interface InvoiceDetail {
  invoiceId: number;
  bookingCode: string;
  movieName: string;
  showTime: string;
  showDate: string;
  screenRoomTypeName: string;
  screenRoomName: string;
  cinema: string;
  bookDay: string;
  userId: number;
  userName: string;
  userEmail: string;
  userPhone: string;
  status: string;
  totalMoney: number;
  seatList: InvoiceSeat[];
}

// ====== URL backend ======
const BASE_API = 'http://localhost:8080/api';
const INVOICE_ADMIN_API = `${BASE_API}/admin/invoice`;

// Lấy Authorization header từ localStorage
const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('accessToken');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

// ====== Helper ======
const formatDateDisplay = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
};

const formatMoney = (value: number | null | undefined): string => {
  if (value == null || Number.isNaN(value)) return '0';
  return value.toLocaleString('vi-VN');
};

const mapStatusLabel = (status: string | null | undefined): string => {
  switch (status) {
    case 'PENDING':
      return 'Chờ thanh toán';
    case 'PAID':
      return 'Đã thanh toán';
    case 'FAIL':
      return 'Thanh toán thất bại';
    case 'CHECKED_IN':
      return 'Đã check-in';
    default:
      return status || 'Không xác định';
  }
};

const mapStatusClass = (status: string | null | undefined): string => {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-50 text-amber-700 border-amber-100';
    case 'PAID':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'FAIL':
      return 'bg-rose-50 text-rose-700 border-rose-100';
    case 'CHECKED_IN':
      return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

export default function OrdersTable() {
  const [orders, setOrders] = useState<InvoiceSummary[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Chi tiết đơn hàng
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<InvoiceSummary | null>(null);
  const [detail, setDetail] = useState<InvoiceDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // ====== FETCH LIST: GET /admin/invoice ======
  const reloadOrders = async () => {
    setLoadingList(true);
    try {
      const res = await fetch(INVOICE_ADMIN_API, {
        headers: {
          ...getAuthHeaders(),
        },
      });

      const data = await res.json().catch(() => null);

      if (res.ok && Array.isArray(data?.result)) {
        const list: InvoiceSummary[] = data.result.map((item: any) => ({
          id: item.id,
          code: item.code,
          movieName: item.movieName,
          showTime: item.showTime,
          screenRoom: item.screenRoom,
          totalMoney: Number(item.totalMoney ?? 0),
          createDate: item.createDate,
        }));

        // Sắp xếp mới nhất lên đầu theo ngày tạo + id
        list.sort((a, b) => {
          const da = new Date(a.createDate ?? '').getTime() || 0;
          const db = new Date(b.createDate ?? '').getTime() || 0;
          if (db !== da) return db - da;
          return (b.id || 0) - (a.id || 0);
        });

        setOrders(list);
      } else {
        console.error('Get invoices wrong data: ', data);
      }
    } catch (error) {
      console.error('Get invoices failed: ', error);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    void reloadOrders();
  }, []);

  // ====== SEARCH + PAGING ======
  const filteredOrders = useMemo(() => {
    const lower = searchTerm.toLowerCase().trim();
    if (!lower) return orders;

    return orders.filter((o) => {
      const code = o.code?.toLowerCase() ?? '';
      const movie = o.movieName?.toLowerCase() ?? '';
      const show = o.showTime?.toLowerCase() ?? '';
      const room = o.screenRoom?.toLowerCase() ?? '';
      return (
        code.includes(lower) ||
        movie.includes(lower) ||
        show.includes(lower) ||
        room.includes(lower)
      );
    });
  }, [orders, searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / itemsPerPage),
  );

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // ====== DETAIL ======
  const openDetail = async (order: InvoiceSummary) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
    setDetail(null);
    setDetailError(null);
    setLoadingDetail(true);

    try {
      const res = await fetch(`${INVOICE_ADMIN_API}/${order.id}`, {
        headers: {
          ...getAuthHeaders(),
        },
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.result) {
        throw new Error(data?.message || 'Lấy chi tiết đơn hàng thất bại');
      }

      const payload = data.result;
      const detailData: InvoiceDetail = {
        invoiceId: payload.invoiceId,
        bookingCode: payload.bookingCode,
        movieName: payload.movieName,
        showTime: payload.showTime,
        showDate: payload.showDate,
        screenRoomTypeName: payload.screenRoomTypeName,
        screenRoomName: payload.screenRoomName,
        cinema: payload.cinema,
        bookDay: payload.bookDay,
        userId: payload.userId,
        userName: payload.userName,
        userEmail: payload.userEmail,
        userPhone: payload.userPhone,
        status: payload.status,
        totalMoney: Number(payload.totalMoney ?? 0),
        seatList: Array.isArray(payload.seatList)
          ? payload.seatList.map((s: any) => ({
              id: s.id,
              seatCode: s.seatCode,
              price: Number(s.price ?? 0),
            }))
          : [],
      };

      setDetail(detailData);
    } catch (error: any) {
      console.error('Get invoice detail error: ', error);
      setDetailError(error.message || 'Có lỗi xảy ra khi lấy chi tiết đơn hàng');
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    if (loadingDetail) return;
    setIsDetailOpen(false);
    setSelectedOrder(null);
    setDetail(null);
    setDetailError(null);
  };

  // ====== RENDER ======
  return (
    <div className="w-full max-w-6xl mx-auto mt-8 relative">
      {/* Thanh trên: search + refresh */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-2 w-full sm:w-96 border rounded-lg px-3 py-2 bg-white">
          <Search size={18} className="text-slate-500" />
          <input
            type="text"
            placeholder="Tìm theo mã đơn / phim / lịch chiếu / rạp..."
            className="w-full outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 self-start text-xs text-slate-500">
          <button
            type="button"
            onClick={reloadOrders}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {loadingList && <Loader2 className="animate-spin" size={14} />}
            Làm mới
          </button>
        </div>
      </div>

      {/* Bảng danh sách đơn hàng */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <span>Danh sách đơn hàng</span>
            {loadingList && <Loader2 className="animate-spin" size={16} />}
          </div>
          <p className="text-xs text-slate-500">
            Danh sách hóa đơn đặt vé. Bấm &quot;Xem chi tiết&quot; để xem đầy đủ thông tin.
          </p>
        </div>

        <div className="overflow-x-auto max-h-[520px]">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2 text-left w-12">#</th>
                <th className="px-4 py-2 text-left">Mã đơn</th>
                <th className="px-4 py-2 text-left">Phim</th>
                <th className="px-4 py-2 text-left">Lịch chiếu</th>
                <th className="px-4 py-2 text-left">Phòng / Rạp</th>
                <th className="px-4 py-2 text-right">Tổng tiền (VND)</th>
                <th className="px-4 py-2 text-left">Ngày tạo</th>
                <th className="px-4 py-2 text-center w-32">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.length === 0 && !loadingList && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-6 text-center text-slate-500 text-sm"
                  >
                    Chưa có đơn hàng nào.
                  </td>
                </tr>
              )}

              {paginatedOrders.map((o, index) => (
                <tr
                  key={o.id}
                  className="border-t last:border-b hover:bg-slate-50/60"
                >
                  <td className="px-4 py-2 text-slate-500">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="px-4 py-2 font-medium text-slate-800">
                    {o.code}
                  </td>
                  <td className="px-4 py-2 text-slate-700">
                    {o.movieName}
                  </td>
                  <td className="px-4 py-2 text-slate-700">
                    {o.showTime}
                  </td>
                  <td className="px-4 py-2 text-slate-700">
                    {o.screenRoom}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold text-slate-800">
                    {formatMoney(o.totalMoney)}
                  </td>
                  <td className="px-4 py-2 text-slate-700">
                    {formatDateDisplay(o.createDate)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs"
                      onClick={() => openDetail(o)}
                    >
                      <Eye size={14} />
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t flex items-center justify-between text-xs text-slate-600">
          <span>
            Trang {currentPage} / {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-1 rounded border bg-white disabled:opacity-40"
              disabled={currentPage === 1}
              onClick={() =>
                setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev))
              }
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="p-1 rounded border bg-white disabled:opacity-40"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((prev) =>
                  prev < totalPages ? prev + 1 : prev,
                )
              }
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* PANEL CHI TIẾT ĐƠN HÀNG */}
      {isDetailOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-end z-50">
          <div className="bg-white h-full w-full max-w-xl shadow-xl border-l flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Chi tiết đơn hàng</p>
                <p className="text-sm font-semibold text-slate-800">
                  Mã đơn: {selectedOrder.code}
                </p>
              </div>
              <button
                type="button"
                className="p-1 rounded-full hover:bg-slate-100"
                onClick={closeDetail}
                disabled={loadingDetail}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 text-sm">
              {loadingDetail && (
                <div className="flex items-center justify-center py-10 text-slate-500 text-sm">
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Đang tải chi tiết đơn hàng...
                </div>
              )}

              {detailError && !loadingDetail && (
                <div className="border border-rose-200 bg-rose-50 text-rose-700 text-xs px-3 py-2 rounded-lg">
                  {detailError}
                </div>
              )}

              {detail && !loadingDetail && (
                <>
                  {/* Trạng thái + tổng tiền */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">Trạng thái</p>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs border ${mapStatusClass(
                          detail.status,
                        )}`}
                      >
                        {mapStatusLabel(detail.status)}
                      </span>
                    </div>
                    <div className="space-y-1 text-right sm:text-left">
                      <p className="text-xs text-slate-500">Tổng tiền</p>
                      <p className="text-base font-semibold text-slate-900">
                        {formatMoney(detail.totalMoney)} VND
                      </p>
                    </div>
                  </div>

                  {/* Thông tin phim / suất chiếu */}
                  <div className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                      <Film size={14} />
                      <span>Thông tin phim &amp; suất chiếu</span>
                    </div>
                    <div className="mt-1 text-sm">
                      <p className="font-semibold text-slate-900">
                        {detail.movieName}
                      </p>
                      <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <CalendarDays size={14} />
                          <span>
                            {detail.showDate} · {detail.showTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building size={14} />
                          <span>
                            {detail.cinema}
                            {detail.screenRoomName && detail.screenRoomName !== detail.cinema
                              ? ` · ${detail.screenRoomName}`
                              : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Ticket size={14} />
                          <span>{detail.screenRoomTypeName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarDays size={14} />
                          <span>Ngày đặt: {detail.bookDay}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Thông tin khách hàng */}
                  <div className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                      <User size={14} />
                      <span>Thông tin khách hàng</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-700 space-y-1">
                      <p>
                        <span className="font-medium">Tên: </span>
                        {detail.userName}
                      </p>
                      <p>
                        <span className="font-medium">Email: </span>
                        {detail.userEmail}
                      </p>
                      <p>
                        <span className="font-medium">Số điện thoại: </span>
                        {detail.userPhone}
                      </p>
                      <p className="text-slate-500">
                        (Mã user: {detail.userId})
                      </p>
                    </div>
                  </div>

                  {/* Danh sách ghế */}
                  <div className="border rounded-lg">
                    <div className="px-3 py-2 border-b flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                        <Ticket size={14} />
                        <span>Danh sách ghế</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Tổng số vé:{' '}
                        <span className="font-semibold">
                          {detail.seatList.length}
                        </span>
                      </div>
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            <th className="px-3 py-1 text-left w-16">#</th>
                            <th className="px-3 py-1 text-left">Mã ghế</th>
                            <th className="px-3 py-1 text-right">
                              Giá (VND)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {detail.seatList.length === 0 && (
                            <tr>
                              <td
                                colSpan={3}
                                className="px-3 py-3 text-center text-slate-500"
                              >
                                Không có ghế nào trong đơn này.
                              </td>
                            </tr>
                          )}

                          {detail.seatList.map((s, idx) => (
                            <tr key={s.id} className="border-t">
                              <td className="px-3 py-1 text-slate-500">
                                {idx + 1}
                              </td>
                              <td className="px-3 py-1 text-slate-800">
                                {s.seatCode}
                              </td>
                              <td className="px-3 py-1 text-right text-slate-800">
                                {formatMoney(s.price)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
