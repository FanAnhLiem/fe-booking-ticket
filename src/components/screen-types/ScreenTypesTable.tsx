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

// Kiểu dữ liệu loại phòng chiếu (map đúng ScreenRoomTypeResponse)
interface ScreenRoomType {
  id: number;
  name: string;
  priceFactor: number;
}

// ====== URL backend (theo ScreenRoomTypeAdminController) ======
const BASE_API = 'http://localhost:8080/api';
const SCREEN_TYPE_ADMIN_API = `${BASE_API}/admin/screenRoomType`;

// Lấy Authorization header từ localStorage (giống chỗ phim / rạp)
const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('accessToken');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

export default function ScreenTypesTable() {
  const [screenTypes, setScreenTypes] = useState<ScreenRoomType[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // search + paging
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // modal create / edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(true);
  const [selectedType, setSelectedType] = useState<ScreenRoomType | null>(null);

  // form state
  const [formName, setFormName] = useState('');
  const [formPriceFactor, setFormPriceFactor] = useState('');

  // ====== FETCH LIST ======
  const reloadScreenTypes = async () => {
    setLoadingList(true);
    try {
      const res = await fetch(SCREEN_TYPE_ADMIN_API, {
        headers: {
          ...getAuthHeaders(),
        },
      });

      const data = await res.json();

      // ApiResponse<List<ScreenRoomTypeResponse>>
      if (res.ok && Array.isArray(data.result)) {
        const list: ScreenRoomType[] = data.result.map((item: any) => ({
          id: item.id,
          name: item.name,
          priceFactor: item.priceFactor,
        }));
        setScreenTypes(list);
      } else {
        console.error('Get screen room types wrong data: ', data);
      }
    } catch (error) {
      console.error('Get screen room types failed: ', error);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    void reloadScreenTypes();
  }, []);

  // ====== SEARCH + PAGING ======
  const filteredScreenTypes = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return screenTypes.filter(
      (item) =>
        item.name.toLowerCase().includes(lower) ||
        String(item.priceFactor ?? '').includes(lower),
    );
  }, [screenTypes, searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredScreenTypes.length / itemsPerPage),
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPageItems = filteredScreenTypes.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // ====== OPEN / CLOSE MODAL ======
  const openCreateModal = () => {
    setIsCreating(true);
    setSelectedType(null);
    setFormName('');
    setFormPriceFactor('');
    setIsModalOpen(true);
  };

  const openEditModal = (type: ScreenRoomType) => {
    setIsCreating(false);
    setSelectedType(type);
    setFormName(type.name);
    setFormPriceFactor(
      type.priceFactor != null ? String(type.priceFactor) : '',
    );
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedType(null);
  };

  // ====== SAVE (CREATE / UPDATE) ======
  const handleSave = async () => {
    const trimmedName = formName.trim();
    if (!trimmedName) {
      alert('Tên loại phòng chiếu không được để trống');
      return;
    }

    const priceValue = formPriceFactor.trim()
      ? Number(formPriceFactor.trim())
      : 0;

    if (Number.isNaN(priceValue) || priceValue < 0) {
      alert('Hệ số giá phải là số không âm');
      return;
    }

    const body = {
      name: trimmedName,
      priceFactor: priceValue,
    };

    setIsSaving(true);
    try {
      if (isCreating) {
        // CREATE: POST /api/admin/screenRoomType
        const res = await fetch(SCREEN_TYPE_ADMIN_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify(body),
        });

        const data = await res.json();
        if (!res.ok || !data.result) {
          throw new Error(data?.message || 'Tạo loại phòng chiếu thất bại');
        }
      } else if (selectedType) {
        // UPDATE: PUT /api/admin/screenRoomType/{id}
        const res = await fetch(`${SCREEN_TYPE_ADMIN_API}/${selectedType.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify(body),
        });

        const data = await res.json();
        if (!res.ok || !data.result) {
          throw new Error(
            data?.message || 'Cập nhật loại phòng chiếu thất bại',
          );
        }
      }

      await reloadScreenTypes();
      closeModal();
    } catch (error: any) {
      console.error('Save screen room type error: ', error);
      alert(error.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setIsSaving(false);
    }
  };

  // ====== DELETE ======
  const handleDelete = async (id: number) => {
    if (!confirm('Bạn chắc chắn muốn xoá loại phòng chiếu này?')) return;

    const previous = [...screenTypes];
    setScreenTypes((prev) => prev.filter((item) => item.id !== id));

    try {
      const res = await fetch(`${SCREEN_TYPE_ADMIN_API}/${id}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
        },
      });

      const data = await res.json().catch(() => null);
      // delete trả ApiResponse<Boolean> => result = true mới OK
      if (!res.ok || (data && data.result === false)) {
        throw new Error(data?.message || 'Xoá loại phòng chiếu thất bại');
      }

      await reloadScreenTypes();
    } catch (error) {
      console.error('Delete screen room type error: ', error);
      alert('Xoá thất bại, vui lòng thử lại!');
      setScreenTypes(previous);
    }
  };

  // ====== UI ======
  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      {/* Thanh trên: search + nút thêm mới */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 w-full sm:w-80 border rounded-lg px-3 py-2 bg-white">
          <Search size={18} className="text-slate-500" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc hệ số giá..."
            className="w-full outline-none text-sm"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-black text-white text-sm hover:bg-slate-800 transition-colors self-start"
        >
          <Plus size={16} />
          Thêm loại phòng
        </button>
      </div>

      {/* Bảng danh sách loại phòng chiếu */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="font-semibold text-sm">Danh sách loại phòng chiếu</h2>
          {loadingList && (
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
                <th className="px-4 py-2 text-left font-medium text-xs text-slate-500">
                  #
                </th>
                <th className="px-4 py-2 text-left font-medium text-xs text-slate-500">
                  Tên loại phòng
                </th>
                <th className="px-4 py-2 text-left font-medium text-xs text-slate-500">
                  Hệ số giá
                </th>
                <th className="px-4 py-2 text-right font-medium text-xs text-slate-500">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody>
              {currentPageItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-sm text-slate-500"
                  >
                    Không có loại phòng chiếu nào.
                  </td>
                </tr>
              ) : (
                currentPageItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-t hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-2 text-xs text-slate-500">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-4 py-2 font-medium text-slate-800">
                      {item.name}
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      {item.priceFactor}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="px-2 py-1 text-xs rounded border bg-white hover:bg-slate-50 inline-flex items-center gap-1"
                          onClick={() => openEditModal(item)}
                        >
                          <Pencil size={14} />
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="px-2 py-1 text-xs rounded border border-red-200 text-red-600 hover:bg-red-50 inline-flex items-center gap-1"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 size={14} />
                          Xoá
                        </button>
                      </div>
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
            Trang {currentPage} / {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-1 rounded border bg-white disabled:opacity-40"
              disabled={currentPage === 1}
              onClick={() =>
                setCurrentPage((prev) => Math.max(1, prev - 1))
              }
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="p-1 rounded border bg-white disabled:opacity-40"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal tạo / sửa loại phòng chiếu */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold text-sm">
                {isCreating
                  ? 'Thêm loại phòng chiếu'
                  : 'Chỉnh sửa loại phòng chiếu'}
              </h3>
              <button
                type="button"
                className="p-1 rounded-full hover:bg-slate-100"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <div className="px-4 py-4 space-y-4 text-sm">
              <div className="space-y-1">
                <label className="font-medium text-xs text-slate-700">
                  Tên loại phòng <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ví dụ: 2D, 3D, IMAX..."
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-xs text-slate-700">
                  Hệ số giá (price factor)
                </label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400"
                  value={formPriceFactor}
                  onChange={(e) => setFormPriceFactor(e.target.value)}
                  placeholder="Ví dụ: 1, 1.2, 1.5..."
                />
                <p className="text-xs text-slate-500">
                  Hệ số này sẽ được dùng để nhân với giá vé cơ bản tuỳ logic
                  backend.
                </p>
              </div>
            </div>

            <div className="px-4 py-3 border-t flex justify-end gap-2">
              <button
                type="button"
                className="px-3 py-2 text-sm rounded-lg border bg-white hover:bg-slate-50"
                onClick={closeModal}
                disabled={isSaving}
              >
                Huỷ
              </button>
              <button
                type="button"
                className="px-3 py-2 text-sm rounded-lg bg-black text-white hover:bg-slate-800 flex items-center gap-2 disabled:opacity-60"
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
