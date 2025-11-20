'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Trash2,
} from 'lucide-react';

import {
  Province,
  CinemaSummary,
  ScreenRoomDetail,
  ScreenRoomType,
} from '@/types/alltypes';

// ====== CONST API ======
const BASE_API = 'http://localhost:8080/api';
const PROVINCES_API = 'https://provinces.open-api.vn/api/v2/p/';
const CINEMA_BY_ADDRESS_API = `${BASE_API}/cinema/address`;
const SCREENROOM_ADMIN_API = `${BASE_API}/admin/screenRoom`;
const SCREENROOM_TYPE_API = `${BASE_API}/admin/screenRoomType`;

// Lấy token cho admin
const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('accessToken');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

export default function AdminScreenRooms() {
  // ====== STATE CHÍNH ======
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);

  const [selectedProvinceName, setSelectedProvinceName] = useState<string>('');

  const [cinemas, setCinemas] = useState<CinemaSummary[]>([]);
  const [loadingCinemas, setLoadingCinemas] = useState(false);
  const [selectedCinemaId, setSelectedCinemaId] = useState<number | ''>('');

  const [screenRooms, setScreenRooms] = useState<ScreenRoomDetail[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const [screenRoomTypes, setScreenRoomTypes] = useState<ScreenRoomType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);

  // search + paging cho phòng chiếu
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // modal tạo / sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);

  const [formName, setFormName] = useState('');
  const [formTypeId, setFormTypeId] = useState<number | ''>('');

  // ====== FETCH PROVINCES ======
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const res = await fetch(PROVINCES_API);
        const data = await res.json();

        if (Array.isArray(data)) {
          const mapped: Province[] = data.map((p: any) => ({
            code: p.code,
            name: p.name as string, // vd: "Thành phố Hà Nội"
          }));
          setProvinces(mapped);
        }
      } catch (error) {
        console.error('Fetch provinces failed:', error);
      } finally {
        setLoadingProvinces(false);
      }
    };

    fetchProvinces();
  }, []);

  // ====== FETCH LOẠI PHÒNG CHIẾU ======
  useEffect(() => {
    const fetchScreenRoomTypes = async () => {
      setLoadingTypes(true);
      try {
        const res = await fetch(SCREENROOM_TYPE_API, {
          headers: {
            ...getAuthHeaders(),
          },
        });
        const data = await res.json();
        if (res.ok && data.code === 0 && Array.isArray(data.result)) {
          const mapped: ScreenRoomType[] = data.result.map((t: any) => ({
            id: t.id,
            name: t.name,
            priceFactor: t.priceFactor,
          }));
          setScreenRoomTypes(mapped);
        } else {
          console.error('Fetch screen room types wrong data:', data);
        }
      } catch (error) {
        console.error('Fetch screen room types failed:', error);
      } finally {
        setLoadingTypes(false);
      }
    };

    fetchScreenRoomTypes();
  }, []);

  // ====== FETCH CINEMA THEO TỈNH/THÀNH (POST /cinema/address với body {address}) ======
  const fetchCinemasByProvince = async (provinceName: string) => {
    if (!provinceName) {
      setCinemas([]);
      setSelectedCinemaId('');
      setScreenRooms([]);
      return;
    }

    setLoadingCinemas(true);
    setSelectedCinemaId('');
    setScreenRooms([]);

    try {
      const res = await fetch(CINEMA_BY_ADDRESS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Nếu endpoint yêu cầu token thì thêm:
          // ...getAuthHeaders(),
        },
        body: JSON.stringify({ address: provinceName }),
      });

      const data = await res.json();
      console.log('cinemas by address:', data);

      if (res.ok && data.code === 0 && Array.isArray(data.result)) {
        const mapped: CinemaSummary[] = data.result.map((c: any) => ({
          id: c.id,
          name: c.name,
        }));
        setCinemas(mapped);
      } else {
        console.error('Fetch cinemas by address wrong data:', data);
        setCinemas([]);
      }
    } catch (error) {
      console.error('Fetch cinemas by address failed:', error);
      setCinemas([]);
    } finally {
      setLoadingCinemas(false);
    }
  };

  // Khi chọn tỉnh -> gọi API lấy rạp
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedProvinceName(value);
    fetchCinemasByProvince(value);
  };

  // ====== FETCH PHÒNG CHIẾU THEO RẠP (GET /admin/screenRoom/cinema/{cinemaId}) ======
  const fetchScreenRooms = async (cinemaId: number) => {
    setLoadingRooms(true);
    try {
      const res = await fetch(
        `${SCREENROOM_ADMIN_API}/cinema/${cinemaId}`,
        {
          headers: {
            ...getAuthHeaders(),
          },
        },
      );

      const data = await res.json();
      if (res.ok && data.code === 0 && Array.isArray(data.result)) {
        const mapped: ScreenRoomDetail[] = data.result.map((r: any) => ({
          id: r.id,
          name: r.name,
          roomType: r.roomType,
          status: r.status, // ✅ LẤY THÊM STATUS TỪ BACKEND
        }));
        setScreenRooms(mapped);
        setCurrentPage(1);
      } else {
        console.error('Fetch screen rooms wrong data:', data);
        setScreenRooms([]);
      }
    } catch (error) {
      console.error('Fetch screen rooms failed:', error);
      setScreenRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleCinemaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!value) {
      setSelectedCinemaId('');
      setScreenRooms([]);
      return;
    }
    const id = Number(value);
    setSelectedCinemaId(id);
    fetchScreenRooms(id);
  };

  // ====== FILTER + PAGINATION ======
  const filteredRooms = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return screenRooms.filter((r) => {
      const n = r.name.toLowerCase();
      const t = r.roomType.toLowerCase();
      const s = (r.status || '').toLowerCase();
      return (
        n.includes(lower) ||
        t.includes(lower) ||
        s.includes(lower)
      );
    });
  }, [screenRooms, searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRooms.length / itemsPerPage),
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRooms = filteredRooms.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // ====== MỞ / ĐÓNG MODAL ======
  const openCreateModal = () => {
    if (!selectedCinemaId) {
      alert('Vui lòng chọn tỉnh/thành và rạp trước khi thêm phòng chiếu.');
      return;
    }
    setIsCreating(true);
    setEditingRoomId(null);
    setFormName('');
    setFormTypeId('');
    setIsModalOpen(true);
  };

  const openEditModal = (room: ScreenRoomDetail) => {
    if (!selectedCinemaId) return;
    setIsCreating(false);
    setEditingRoomId(room.id);
    setFormName(room.name);

    // tìm type id theo tên roomType (nếu trùng)
    const matchedType = screenRoomTypes.find(
      (t) => t.name === room.roomType,
    );
    setFormTypeId(matchedType ? matchedType.id : '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRoomId(null);
  };

  // ====== CREATE / UPDATE PHÒNG CHIẾU ======
  const handleSave = async () => {
    if (!selectedCinemaId) {
      alert('Vui lòng chọn rạp.');
      return;
    }
    if (!formName.trim()) {
      alert('Tên phòng chiếu không được để trống.');
      return;
    }
    if (!formTypeId) {
      alert('Vui lòng chọn loại phòng chiếu.');
      return;
    }

    const body = {
      name: formName.trim(),
      cinema_id: selectedCinemaId,
      screen_room_type_id: formTypeId,
    };

    setSaving(true);
    try {
      if (isCreating) {
        // POST /admin/screenRoom
        const res = await fetch(SCREENROOM_ADMIN_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok || data.code !== 0) {
          throw new Error(data.message || 'Tạo phòng chiếu thất bại');
        }
      } else if (editingRoomId != null) {
        // PUT /admin/screenRoom/{id}
        const res = await fetch(
          `${SCREENROOM_ADMIN_API}/${editingRoomId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(),
            },
            body: JSON.stringify(body),
          },
        );
        const data = await res.json();
        if (!res.ok || data.code !== 0) {
          throw new Error(data.message || 'Cập nhật phòng chiếu thất bại');
        }
      }

      // reload list screen room theo rạp hiện tại
      await fetchScreenRooms(selectedCinemaId);
      closeModal();
    } catch (error: any) {
      console.error('Save screen room error:', error);
      alert(error.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSaving(false);
    }
  };

  // ====== XOÁ PHÒNG CHIẾU ======
  const handleDelete = async (roomId: number) => {
    if (!confirm('Bạn chắc chắn muốn xoá phòng chiếu này?')) return;
    if (!selectedCinemaId) return;

    const previous = [...screenRooms];
    setScreenRooms((prev) => prev.filter((r) => r.id !== roomId));

    try {
      const res = await fetch(`${SCREENROOM_ADMIN_API}/${roomId}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
        },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || (data && data.code && data.code !== 0)) {
        throw new Error(data?.message || 'Xoá phòng chiếu thất bại');
      }
      await fetchScreenRooms(selectedCinemaId);
    } catch (error) {
      console.error('Delete screen room error:', error);
      alert('Xoá phòng chiếu thất bại, vui lòng thử lại.');
      setScreenRooms(previous);
    }
  };

  // ====== RENDER ======
  return (
    <div className="w-full max-w-6xl mx-auto mt-8">
      {/* Bộ lọc tỉnh / rạp */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6 space-y-4">
        <h2 className="font-semibold text-sm mb-2">
          Chọn khu vực &amp; rạp để quản lý phòng chiếu
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {/* Tỉnh / thành */}
          <div className="space-y-1">
            <label className="font-medium text-xs text-slate-700">
              Tỉnh / Thành phố
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none bg-white focus:ring-1 focus:ring-slate-400"
              value={selectedProvinceName}
              onChange={handleProvinceChange}
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
          </div>

          {/* Rạp */}
          <div className="space-y-1">
            <label className="font-medium text-xs text-slate-700">
              Rạp
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none bg-white focus:ring-1 focus:ring-slate-400"
              value={selectedCinemaId}
              onChange={handleCinemaChange}
              disabled={!selectedProvinceName || loadingCinemas}
            >
              <option value="">
                {selectedProvinceName
                  ? 'Chọn rạp theo tỉnh đã chọn'
                  : 'Vui lòng chọn tỉnh/thành trước'}
              </option>
              {cinemas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {loadingCinemas && (
              <p className="text-xs text-slate-400">
                <Loader2
                  size={12}
                  className="inline-block mr-1 animate-spin"
                />
                Đang tải danh sách rạp...
              </p>
            )}
          </div>

          {/* Search + nút thêm */}
          <div className="space-y-1 flex flex-col justify-between">
            <label className="font-medium text-xs text-slate-700">
              Tìm kiếm phòng chiếu
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 flex-1 border rounded-lg px-3 py-2 bg-white">
                <Search size={18} className="text-slate-500" />
                <input
                  type="text"
                  placeholder="Tìm theo tên / loại / trạng thái..."
                  className="w-full outline-none text-sm"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  disabled={!selectedCinemaId}
                />
              </div>

              <button
                type="button"
                onClick={openCreateModal}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-black text-white text-xs hover:bg-slate-800 transition-colors disabled:opacity-50"
                disabled={!selectedCinemaId}
              >
                <Plus size={14} />
                Thêm phòng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bảng danh sách phòng chiếu */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-semibold text-sm">Danh sách phòng chiếu</h3>
          {loadingRooms && (
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
                  Tên phòng
                </th>
                <th className="px-4 py-2 text-left font-medium text-xs text-slate-500">
                  Loại phòng
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
              {!selectedCinemaId ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-sm text-slate-500"
                  >
                    Vui lòng chọn tỉnh/thành và rạp để xem phòng chiếu.
                  </td>
                </tr>
              ) : currentRooms.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-sm text-slate-500"
                  >
                    Không có phòng chiếu nào.
                  </td>
                </tr>
              ) : (
                currentRooms.map((room, idx) => (
                  <tr
                    key={room.id}
                    className="border-t hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-2 text-xs text-slate-500">
                      {startIndex + idx + 1}
                    </td>
                    <td className="px-4 py-2 font-medium text-slate-800">
                      {room.name}
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      {room.roomType}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs border ${
                          room.status === 'Đang hoạt động'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}
                      >
                        {room.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          className="px-2 py-1 text-xs rounded border bg-white hover:bg-slate-50"
                          onClick={() => openEditModal(room)}
                        >
                          Sửa
                        </button>
                        <button
                          className="px-2 py-1 text-xs rounded border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1"
                          onClick={() => handleDelete(room.id)}
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
              onClick={() =>
                setCurrentPage((p) => Math.max(1, p - 1))
              }
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="p-1 rounded border bg-white disabled:opacity-40"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((p) =>
                  Math.min(totalPages, p + 1),
                )
              }
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal tạo / sửa phòng chiếu */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold text-sm">
                {isCreating ? 'Thêm phòng chiếu' : 'Chỉnh sửa phòng chiếu'}
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
                  Tên phòng <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nhập tên phòng chiếu..."
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-xs text-slate-700">
                  Loại phòng chiếu <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none bg-white focus:ring-1 focus:ring-slate-400"
                  value={formTypeId}
                  onChange={(e) =>
                    setFormTypeId(
                      e.target.value ? Number(e.target.value) : '',
                    )
                  }
                >
                  <option value="">Chọn loại phòng chiếu</option>
                  {screenRoomTypes.map((t) => (
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
                    Đang tải loại phòng chiếu...
                  </p>
                )}
              </div>
            </div>

            <div className="px-4 py-3 border-t flex justify-end gap-2">
              <button
                className="px-3 py-2 text-sm rounded-lg border bg-white hover:bg-slate-50"
                onClick={closeModal}
                disabled={saving}
              >
                Hủy
              </button>
              <button
                className="px-3 py-2 text-sm rounded-lg bg-black text-white hover:bg-slate-800 flex items-center gap-2 disabled:opacity-60"
                onClick={handleSave}
                disabled={saving}
              >
                {saving && (
                  <Loader2 className="animate-spin" size={16} />
                )}
                {isCreating ? 'Tạo phòng' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
