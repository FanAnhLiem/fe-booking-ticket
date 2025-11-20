'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Loader2,
  Plus,
  Trash2,
  Pencil,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// Kiểu dữ liệu ngày lễ (map đúng SpecialDayEntity backend)
interface SpecialDay {
  id: number;
  day: number;
  month: number;
  description: string;
}

// ====== URL backend ======
const BASE_API = 'http://localhost:8080/api';
const HOLIDAYS_ADMIN_API = `${BASE_API}/admin/specialDay`;

// Lấy Authorization header từ localStorage
const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('accessToken');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

// Helper hiển thị dd/MM
const formatDayMonth = (h: SpecialDay): string => {
  const d = String(h.day).padStart(2, '0');
  const m = String(h.month).padStart(2, '0');
  return `${d}/${m}`;
};

export default function HolidaysTable() {
  const [holidays, setHolidays] = useState<SpecialDay[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal create / edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<SpecialDay | null>(null);

  const [formDay, setFormDay] = useState('');
  const [formMonth, setFormMonth] = useState('');
  const [formDescription, setFormDescription] = useState('');

  // ====== FETCH LIST: GET /admin/specialDay ======
  const reloadHolidays = async () => {
    setLoadingList(true);
    try {
      const res = await fetch(HOLIDAYS_ADMIN_API, {
        headers: {
          ...getAuthHeaders(),
        },
      });

      const data = await res.json().catch(() => null);

      if (res.ok && Array.isArray(data?.result)) {
        const list: SpecialDay[] = data.result.map((item: any) => ({
          id: item.id,
          day: item.day,
          month: item.month,
          description: item.description ?? '',
        }));
        // Sort theo tháng / ngày
        list.sort((a, b) => {
          if (a.month !== b.month) return a.month - b.month;
          return a.day - b.day;
        });
        setHolidays(list);
      } else {
        console.error('Get holidays wrong data: ', data);
      }
    } catch (error) {
      console.error('Get holidays failed: ', error);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    void reloadHolidays();
  }, []);

  // ====== SEARCH + PAGING ======
  const filteredHolidays = useMemo(() => {
    const lower = searchTerm.toLowerCase().trim();
    if (!lower) return holidays;

    return holidays.filter((h) => {
      const desc = (h.description ?? '').toLowerCase();
      const dateStr = formatDayMonth(h);
      return desc.includes(lower) || dateStr.includes(lower);
    });
  }, [holidays, searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredHolidays.length / itemsPerPage),
  );

  const paginatedHolidays = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredHolidays.slice(start, start + itemsPerPage);
  }, [filteredHolidays, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // ====== HANDLERS ======
  const openCreateModal = () => {
    setIsCreating(true);
    setEditingHoliday(null);
    setFormDay('');
    setFormMonth('');
    setFormDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (h: SpecialDay) => {
    setIsCreating(false);
    setEditingHoliday(h);
    setFormDay(String(h.day));
    setFormMonth(String(h.month));
    setFormDescription(h.description ?? '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingHoliday(null);
  };

  // Validate khớp với backend: day & month là int 1–31,1–12
  const validateDayMonth = (day: number, month: number): string | null => {
    if (!Number.isInteger(day) || !Number.isInteger(month)) {
      return 'Ngày / tháng phải là số nguyên';
    }
    if (month < 1 || month > 12) {
      return 'Tháng phải từ 1 đến 12';
    }
    if (day < 1 || day > 31) {
      return 'Ngày phải từ 1 đến 31';
    }
    // Không cần quá chặt, backend cũng chỉ lưu int day/month
    return null;
  };

  // CREATE (POST) / UPDATE (PUT) dùng SpecialDayRequest { day, month, description }
  const handleSave = async () => {
    const dayInt = Number(formDay);
    const monthInt = Number(formMonth);
    const errorMsg = validateDayMonth(dayInt, monthInt);
    if (errorMsg) {
      alert(errorMsg);
      return;
    }

    const body = {
      day: dayInt,
      month: monthInt,
      description: formDescription.trim(),
    };

    setIsSaving(true);
    try {
      let res: Response;
      if (isCreating) {
        // POST /admin/specialDay
        res = await fetch(HOLIDAYS_ADMIN_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify(body),
        });
      } else if (editingHoliday) {
        // PUT /admin/specialDay/{id}
        res = await fetch(`${HOLIDAYS_ADMIN_API}/${editingHoliday.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify(body),
        });
      } else {
        throw new Error('Không xác định bản ghi cần sửa');
      }

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.result) {
        // Nếu trùng day+month backend ném ErrorCode.SPECIAL_DAY_EXISTED -> message trả về
        throw new Error(
          data?.message ||
            (isCreating
              ? 'Tạo ngày lễ thất bại'
              : 'Cập nhật ngày lễ thất bại'),
        );
      }

      await reloadHolidays();
      closeModal();
    } catch (error: any) {
      console.error('Save holiday error: ', error);
      alert(error.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setIsSaving(false);
    }
  };

  // DELETE /admin/specialDay/{id}
  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá ngày lễ này?')) {
      return;
    }
    try {
      const res = await fetch(`${HOLIDAYS_ADMIN_API}/${id}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
        },
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || 'Xoá ngày lễ thất bại');
      }

      await reloadHolidays();
    } catch (error: any) {
      console.error('Delete holiday error: ', error);
      alert(error.message || 'Có lỗi xảy ra khi xoá ngày lễ');
    }
  };

  // ====== RENDER ======
  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      {/* Thanh trên: search + button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-2 w-full sm:w-80 border rounded-lg px-3 py-2 bg-white">
          <Search size={18} className="text-slate-500" />
          <input
            type="text"
            placeholder="Tìm theo mô tả hoặc ngày (vd: 01/01)..."
            className="w-full outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 self-start">
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#0c46d6] text-white text-sm hover:bg-slate-800 transition-colors"
          >
            <Plus size={16} />
            Thêm ngày lễ
          </button>
        </div>
      </div>

      {/* Bảng danh sách ngày lễ */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="font-semibold text-sm">Danh sách ngày lễ</h2>
          {loadingList && (
            <span className="flex items-center text-xs text-slate-500">
              <Loader2 className="animate-spin mr-1" size={14} />
              Đang tải...
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2 text-left w-12">#</th>
                <th className="px-4 py-2 text-left w-32">Ngày</th>
                <th className="px-4 py-2 text-left">Mô tả</th>
                <th className="px-4 py-2 text-center w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedHolidays.length === 0 && !loadingList && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-slate-500 text-sm"
                  >
                    Chưa có ngày lễ nào được cấu hình.
                  </td>
                </tr>
              )}

              {paginatedHolidays.map((h, index) => (
                <tr
                  key={h.id}
                  className="border-t last:border-b hover:bg-slate-50/60"
                >
                  <td className="px-4 py-2 text-slate-500">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="px-4 py-2 text-slate-700 font-medium">
                    {formatDayMonth(h)}
                  </td>
                  <td className="px-4 py-2 text-slate-700">
                    {h.description || '-'}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
                        onClick={() => openEditModal(h)}
                      >
                        <Pencil size={14} />
                        Sửa
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50"
                        onClick={() => handleDelete(h.id)}
                      >
                        <Trash2 size={14} />
                        Xoá
                      </button>
                    </div>
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

      {/* Modal create / edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="font-semibold text-sm">
                {isCreating ? 'Thêm ngày lễ' : 'Chỉnh sửa ngày lễ'}
              </h3>
              <button
                type="button"
                className="p-1 rounded-full hover:bg-slate-100"
                onClick={closeModal}
                disabled={isSaving}
              >
                ✕
              </button>
            </div>

            <div className="px-4 py-3 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Ngày
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400 bg-white"
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value)}
                    placeholder="vd: 1"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Tháng
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400 bg-white"
                    value={formMonth}
                    onChange={(e) => setFormMonth(e.target.value)}
                    placeholder="vd: 1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Mô tả
                </label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400 bg-white resize-none min-h-[80px]"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ví dụ: Tết dương lịch, Quốc khánh, Giáng sinh..."
                />
              </div>

              <p className="text-[11px] text-slate-500">
                Những ngày này sẽ được hệ thống xem là <b>Ngày lễ / cuối tuần</b>{' '}
                để áp dụng giá vé tương ứng trong phần cấu hình giá vé.
              </p>
            </div>

            <div className="px-4 py-3 border-t flex justify-end gap-2">
              <button
                type="button"
                className="px-3 py-2 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
                onClick={closeModal}
                disabled={isSaving}
              >
                Huỷ
              </button>
              <button
                type="button"
                className="px-3 py-2 text-sm rounded-lg bg-[#0c46d6] text-white hover:bg-slate-800 flex items-center gap-2 disabled:opacity-60"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving && <Loader2 className="animate-spin" size={16} />}
                {isCreating ? 'Tạo mới' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
