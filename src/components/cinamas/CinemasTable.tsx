'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  X,
  Loader2,
  ChevronDown,
  Plus,
  Trash2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { TypeCinema, TypeCinemaType, Province } from '@/types/alltypes';

interface CinemasTableProps {
  listCinemas?: TypeCinema[]; // cho phép không truyền
}


// Các URL backend
const BASE_API = 'http://localhost:8080/api';
const CINEMA_ADMIN_API = `${BASE_API}/admin/cinema`;
const CINEMA_LIST_API = CINEMA_ADMIN_API; // GET /api/admin/cinema
const CINEMA_TYPES_API = `${CINEMA_ADMIN_API}/type`; // GET /api/admin/cinema/type
const PROVINCES_API = 'https://provinces.open-api.vn/api/v2/p/';

// Lấy headers Authorization từ localStorage (kiểu rõ ràng)
const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('accessToken');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

export default function CinemasTable({ listCinemas }: CinemasTableProps) {
  // --- STATE CHÍNH ---
  const [cinemas, setCinemas] = useState<TypeCinema[]>(listCinemas || []);
  const [loadingList, setLoadingList] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'ACTIVE' | 'INACTIVE'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [selectedCinema, setSelectedCinema] = useState<TypeCinema | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [cinemaTypes, setCinemaTypes] = useState<TypeCinemaType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);

  const [formName, setFormName] = useState('');
  const [formCinemaTypeId, setFormCinemaTypeId] = useState<number | ''>('');
  const [formProvinceName, setFormProvinceName] = useState('');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // --- FETCH danh sách rạp ---
  const reloadCinemas = async () => {
    setLoadingList(true);
    try {
      const res = await fetch(CINEMA_LIST_API, {
        headers: {
          ...getAuthHeaders(),
        },
      });

      const data = await res.json();

      if (res.ok && data.code === 0 && Array.isArray(data.result)) {
        const mapped: TypeCinema[] = data.result.map((c: any) => ({
  id: c.id,
  name: c.name,
  address: c.address,
  status: c.status, // "đang hoạt động" / "Tạm ngừng hoạt động"
  // ⭐ backend trả cinemaTypeName
  cinemaType: c.cinemaTypeName || c.cinemaType || '',
}));
        setCinemas(mapped);
      } else {
        console.error('Reload cinemas error data:', data);
      }
    } catch (error) {
      console.error('Reload cinemas failed:', error);
    } finally {
      setLoadingList(false);
    }
  };

  // --- FETCH loại rạp ---
  useEffect(() => {
    const fetchTypes = async () => {
      setLoadingTypes(true);
      try {
        const res = await fetch(CINEMA_TYPES_API, {
          headers: {
            ...getAuthHeaders(),
          },
        });

        const data = await res.json();

        if (res.ok && Array.isArray(data.result)) {
          setCinemaTypes(
            data.result.map((t: any) => ({
              id: t.id,
              name: t.name,
            })) as TypeCinemaType[]
          );
        } else {
          console.error('Fetch cinema types wrong shape:', data);
        }
      } catch (error) {
        console.error('Fetch cinema types failed:', error);
      } finally {
        setLoadingTypes(false);
      }
    };

    fetchTypes();
  }, []);

  // --- FETCH provinces ---
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const res = await fetch(PROVINCES_API);
        const data = await res.json();
        if (Array.isArray(data)) {
          setProvinces(
            data.map((p: any) => ({
              code: p.code,
              name: p.name as string,
            }))
          );
        }
      } catch (error) {
        console.error('Fetch provinces failed:', error);
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  // --- Lấy list rạp lần đầu khi vào trang ---
  useEffect(() => {
    reloadCinemas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- FILTER + SEARCH + PAGINATION ---
  const filteredCinemas = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return cinemas.filter((cinema) => {
      const matchesStatus =
        filterStatus === 'All' || cinema.status === filterStatus;
      const matchesSearch =
        cinema.name.toLowerCase().includes(lowerSearch) ||
        cinema.address.toLowerCase().includes(lowerSearch);
      return matchesStatus && matchesSearch;
    });
  }, [cinemas, searchTerm, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredCinemas.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCinemas = filteredCinemas.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterStatus(e.target.value as any);
    setCurrentPage(1);
  };

  // --- MỞ MODAL DETAIL / EDIT ---
  const openCreateModal = () => {
    setSelectedCinema(null);
    setIsCreating(true);
    setIsDetailOpen(true);
    setFormName('');
    setFormCinemaTypeId('');
    setFormProvinceName('');
    setFormStatus('ACTIVE');
  };

  const openEditModal = (cinema: TypeCinema) => {
    setSelectedCinema(cinema);
    setIsCreating(false);
    setIsDetailOpen(true);

    setFormName(cinema.name || '');
    setFormStatus((cinema.status as any) || 'ACTIVE');

    // backend dùng city/tỉnh làm address trực tiếp
    setFormProvinceName(cinema.address || '');

    const matchedType = cinemaTypes.find(
      (t) => t.name === cinema.cinemaType
    );
    setFormCinemaTypeId(matchedType ? matchedType.id : '');
  };

  const closeModal = () => {
    setIsDetailOpen(false);
    setSelectedCinema(null);
  };

  // --- TẠO / UPDATE CINEMA ---
  const handleSaveCinema = async () => {
    if (!formName.trim()) {
      alert('Tên rạp không được để trống');
      return;
    }
    if (!formCinemaTypeId) {
      alert('Vui lòng chọn loại rạp');
      return;
    }
    if (!formProvinceName) {
      alert('Vui lòng chọn tỉnh/thành phố');
      return;
    }

    const body = {
      name: formName.trim(),
      cinemaTypeId: formCinemaTypeId,
      address: formProvinceName, // city
    };

    setIsSaving(true);
    try {
      if (isCreating) {
        const res = await fetch(CINEMA_ADMIN_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok || data.code !== 0) {
          throw new Error(data.message || 'Tạo rạp thất bại');
        }
      } else if (selectedCinema) {
        const res = await fetch(`${CINEMA_ADMIN_API}/${selectedCinema.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok || data.code !== 0) {
          throw new Error(data.message || 'Cập nhật rạp thất bại');
        }
      }

      await reloadCinemas();
      closeModal();
    } catch (error: any) {
      console.error('Save cinema error: ', error);
      alert(error.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setIsSaving(false);
    }
  };

  // --- XOÁ CINEMA ---
  const handleDeleteCinema = async (id: number) => {
    if (!confirm('Bạn chắc chắn muốn xoá rạp này?')) return;
    const previous = [...cinemas];
    setCinemas((prev) => prev.filter((c) => c.id !== id));

    try {
      const res = await fetch(`${CINEMA_ADMIN_API}/${id}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
        },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || (data && data.code && data.code !== 0)) {
        throw new Error('Delete failed');
      }
      await reloadCinemas();
    } catch (error) {
      console.error('Delete error: ', error);
      alert('Xoá thất bại!');
      setCinemas(previous);
    }
  };

  // --- RENDER ---
  return (
    <div className="w-full max-w-5xl mx-auto mt-8">
      {/* Thanh chức năng trên: search + filter + thêm mới */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 w-full sm:w-80 border rounded-lg px-3 py-2 bg-white">
          <Search size={18} className="text-slate-500" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc địa chỉ..."
            className="w-full outline-none text-sm"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center border rounded-lg px-2 py-1 bg-white">
            <Filter size={16} className="mr-1 text-slate-500" />
            <select
              className="text-sm bg-transparent outline-none"
              value={filterStatus}
              onChange={handleFilterChange}
            >
              <option value="All">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Ngừng hoạt động</option>
            </select>
            <ChevronDown size={14} className="ml-1 text-slate-500" />
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-black text-white text-sm hover:bg-slate-800 transition-colors"
          >
            <Plus size={16} />
            Thêm rạp
          </button>
        </div>
      </div>

      {/* Bảng danh sách rạp */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="font-semibold text-sm">Danh sách rạp</h2>
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
                  Tên rạp
                </th>
                <th className="px-4 py-2 text-left font-medium text-xs text-slate-500">
                  Loại rạp
                </th>
                <th className="px-4 py-2 text-left font-medium text-xs text-slate-500">
                  Địa chỉ
                </th>
                <th className="px-4 py-2 text-left font-medium text-xs text-slate-500">
                  Trạng thái
                </th>
                <th className="px-4 py-2 text-right font-medium text-xs text-slate-500">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody>
              {currentCinemas.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-sm text-slate-500"
                  >
                    Không có rạp nào phù hợp.
                  </td>
                </tr>
              ) : (
                currentCinemas.map((cinema, index) => (
                  <tr
                    key={cinema.id}
                    className="border-t hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-2 text-xs text-slate-500">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-4 py-2 font-medium text-slate-800">
                      {cinema.name}
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      {cinema.cinemaType || '-'}
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      {cinema.address}
                    </td>
                    <td className="px-4 py-2">
  <span
    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
      cinema.status === 'ACTIVE'
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
        : 'bg-slate-100 text-slate-600 border border-slate-200'
    }`}
  >
    {cinema.status === 'đang hoạt động'
      ? 'Đang hoạt động'
      : 'Ngừng hoạt động'}
  </span>
</td>

                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          className="px-2 py-1 text-xs rounded border bg-white hover:bg-slate-50"
                          onClick={() => openEditModal(cinema)}
                        >
                          Chi tiết
                        </button>
                        <button
                          className="px-2 py-1 text-xs rounded border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1"
                          onClick={() => handleDeleteCinema(cinema.id)}
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
              className="p-1 rounded border bg-white disabled:opacity-40"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="p-1 rounded border bg-white disabled:opacity-40"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal tạo / sửa rạp */}
      {isDetailOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold text-sm">
                {isCreating ? 'Thêm rạp mới' : 'Chi tiết rạp'}
              </h3>
              <button
                className="p-1 rounded-full hover:bg-slate-100"
                onClick={closeModal}
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-4 py-4 space-y-4 text-sm">
              <div className="space-y-1">
                <label className="font-medium text-xs text-slate-700">
                  Tên rạp
                </label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nhập tên rạp..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-medium text-xs text-slate-700">
                    Loại rạp
                  </label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400 bg-white"
                    value={formCinemaTypeId}
                    onChange={(e) =>
                      setFormCinemaTypeId(
                        e.target.value ? Number(e.target.value) : ''
                      )
                    }
                  >
                    <option value="">Chọn loại rạp</option>
                    {cinemaTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  {loadingTypes && (
                    <p className="text-xs text-slate-400">
                      <Loader2
                        size={12}
                        className="inline-block mr-1 animate-spin"
                      />
                      Đang tải loại rạp...
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-xs text-slate-700">
                    Trạng thái
                  </label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none bg-white"
                    value={formStatus}
                    onChange={(e) =>
                      setFormStatus(e.target.value as 'ACTIVE' | 'INACTIVE')
                    }
                    disabled // backend tự quản status
                  >
                    <option value="ACTIVE">Đang hoạt động</option>
                    <option value="INACTIVE">Ngừng hoạt động</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-xs text-slate-700">
                  Tỉnh / Thành phố
                </label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400 bg-white"
                  value={formProvinceName}
                  onChange={(e) => setFormProvinceName(e.target.value)}
                >
                  <option value="">Chọn tỉnh/thành</option>
                  {provinces.map((p) => (
                    <option key={p.code} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {loadingProvinces && (
                  <p className="text-xs text-slate-400">
                    <Loader2
                      size={12}
                      className="inline-block mr-1 animate-spin"
                    />
                    Đang tải danh sách tỉnh/thành...
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  Địa chỉ rạp sẽ được lưu là:{' '}
                  <span className="font-medium">
                    {formProvinceName || '<chưa chọn>'}
                  </span>
                </p>
              </div>
            </div>

            <div className="px-4 py-3 border-t flex justify-end gap-2">
              <button
                className="px-3 py-2 text-sm rounded-lg border bg-white hover:bg-slate-50"
                onClick={closeModal}
                disabled={isSaving}
              >
                Huỷ
              </button>
              <button
                className="px-3 py-2 text-sm rounded-lg bg-black text-white hover:bg-slate-800 flex items-center gap-2 disabled:opacity-60"
                onClick={handleSaveCinema}
                disabled={isSaving}
              >
                {isSaving && <Loader2 className="animate-spin" size={16} />}
                {isCreating ? 'Tạo rạp' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
