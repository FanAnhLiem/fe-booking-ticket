'use client';

import { useState } from 'react';
import { TypeCinema } from '@/types/alltypes';
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

// Import dữ liệu từ file constants vừa tạo
import { LIST_PROVINCES } from '@/constants/address';

export default function CinemasTable({
  listCinemas,
}: {
  listCinemas: TypeCinema[];
}) {
  const [cinemas, setCinemas] = useState<TypeCinema[]>(listCinemas);

  // --- STATE TÌM KIẾM & LỌC & PHÂN TRANG ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- STATE EDIT & CREATE ---
  const [editingCell, setEditingCell] = useState<{
    id: number;
    field: keyof TypeCinema;
  } | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCinemaData, setNewCinemaData] = useState({
    name: '',
    address: '',
    status: 'Đang Hoạt Động',
  });
  const [isSaving, setIsSaving] = useState(false);

  // --- LOGIC SEARCH / FILTER / PAGINATION ---
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterStatus(e.target.value);
    setCurrentPage(1);
  };
  const filteredCinemas = cinemas.filter((cinema) => {
    const matchesStatus =
      filterStatus === 'All' || cinema.status === filterStatus;
    const lowerSearch = searchTerm.toLowerCase();
    const matchesSearch =
      cinema.name.toLowerCase().includes(lowerSearch) ||
      cinema.address.toLowerCase().includes(lowerSearch);
    return matchesStatus && matchesSearch;
  });
  const totalPages = Math.ceil(filteredCinemas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCinemas = filteredCinemas.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // --- LOGIC EDIT / DELETE ---
  const handleSaveInline = async (
    id: number,
    field: keyof TypeCinema,
    newValue: string
  ) => {
    const currentCinema = cinemas.find((c) => c.id === id);
    if (!currentCinema || currentCinema[field] === newValue) {
      setEditingCell(null);
      return;
    }
    const updatedCinema = { ...currentCinema, [field]: newValue };
    const previousCinemas = [...cinemas];
    setCinemas(cinemas.map((item) => (item.id === id ? updatedCinema : item)));
    setEditingCell(null);
    try {
      const res = await fetch(
        `http://691a973a2d8d7855756f52b8.mockapi.io/api/cinemas/${id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedCinema),
        }
      );
      if (!res.ok) throw new Error('Update failed');
    } catch (error) {
      setCinemas(previousCinemas);
      alert('Cập nhật thất bại!');
    }
  };
  const handleKeyDown = (
    e: React.KeyboardEvent,
    id: number,
    field: keyof TypeCinema,
    value: string
  ) => {
    if (e.key === 'Enter') handleSaveInline(id, field, value);
  };
  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa rạp chiếu này không?'))
      return;
    const previousCinemas = [...cinemas];
    setCinemas(cinemas.filter((item) => item.id !== id));
    try {
      const res = await fetch(
        `http://691a973a2d8d7855756f52b8.mockapi.io/api/cinemas/${id}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error('Failed to delete');
    } catch (error) {
      setCinemas(previousCinemas);
      alert('Xóa thất bại!');
    }
  };

  // --- LOGIC CREATE ---
  const handleChangeCreate = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewCinemaData({ ...newCinemaData, [name]: value });
  };
  const handleCreate = async () => {
    if (!newCinemaData.name || !newCinemaData.address) {
      alert('Vui lòng nhập đủ tên và địa chỉ');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(
        'http://691a973a2d8d7855756f52b8.mockapi.io/api/cinemas',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCinemaData),
        }
      );
      if (!res.ok) throw new Error('Failed to create');
      const createdCinema = await res.json();
      setCinemas([...cinemas, createdCinema]);
      setNewCinemaData({ name: '', address: '', status: 'Đang Hoạt Động' });
      setIsCreateOpen(false);
    } catch (e) {
      alert('Có lỗi khi thêm mới');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-[1100px] w-full">
      {' '}
      {/* Tăng chiều rộng max một chút */}
      <h1 className="text-2xl font-bold text-gray-800 mb-10 text-center">
        Quản lý rạp phim
      </h1>
      {/* TOOLBAR */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center px-4 py-2 bg-[#0c46d6] text-white rounded-lg cursor-pointer hover:bg-[#0a3bb5] transition shadow-sm"
        >
          <span>Thêm rạp phim</span> <Plus className="ml-2" size={18} />
        </div>
        <div className="flex flex-1 justify-end gap-3">
          <div className="relative w-full max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm theo tên, địa chỉ..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-300 px-3 py-2 rounded-lg shadow-sm">
            <Filter size={18} className="text-gray-500" />
            <select
              value={filterStatus}
              onChange={handleFilterChange}
              className="outline-none text-sm font-semibold text-gray-700 cursor-pointer bg-transparent border-none focus:ring-0"
            >
              <option value="All">Tất cả trạng thái</option>
              <option value="Đang Hoạt Động">Đang Hoạt Động</option>
              <option value="Dừng Hoạt Động">Dừng Hoạt Động</option>
            </select>
          </div>
        </div>
      </div>
      {/* TABLE */}
      <div className="bg-white outline outline-[#8b8b8b] rounded-lg overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                {/* THÊM CỘT STT */}
                <th className="px-4 py-3 text-center font-semibold text-gray-700 w-[60px]">
                  STT
                </th>

                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                  Tên Rạp
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                  Địa Chỉ
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700 w-[200px]">
                  Trạng Thái
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700 w-[100px]"></th>
              </tr>
            </thead>
            <tbody>
              {currentCinemas.map((cinema, index) => (
                <tr
                  key={cinema.id}
                  className="border-t hover:bg-blue-50 transition-colors"
                >
                  {/* TÍNH TOÁN STT */}
                  <td className="px-4 py-4 text-center font-medium text-gray-500">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>

                  {/* NAME */}
                  <td
                    className="px-6 py-4 cursor-pointer"
                    onDoubleClick={() =>
                      setEditingCell({ id: cinema.id, field: 'name' })
                    }
                  >
                    {editingCell?.id === cinema.id &&
                    editingCell.field === 'name' ? (
                      <input
                        autoFocus
                        defaultValue={cinema.name}
                        onBlur={(e) =>
                          handleSaveInline(cinema.id, 'name', e.target.value)
                        }
                        onKeyDown={(e) =>
                          handleKeyDown(
                            e,
                            cinema.id,
                            'name',
                            e.currentTarget.value
                          )
                        }
                        className="w-full px-2 py-1 border border-blue-500 rounded outline-none"
                      />
                    ) : (
                      <span>{cinema.name}</span>
                    )}
                  </td>

                  {/* ADDRESS */}
                  <td
                    className="px-6 py-4 cursor-pointer"
                    onDoubleClick={() =>
                      setEditingCell({ id: cinema.id, field: 'address' })
                    }
                  >
                    {editingCell?.id === cinema.id &&
                    editingCell.field === 'address' ? (
                      <input
                        autoFocus
                        defaultValue={cinema.address}
                        onBlur={(e) =>
                          handleSaveInline(cinema.id, 'address', e.target.value)
                        }
                        onKeyDown={(e) =>
                          handleKeyDown(
                            e,
                            cinema.id,
                            'address',
                            e.currentTarget.value
                          )
                        }
                        className="w-full px-2 py-1 border border-blue-500 rounded outline-none"
                      />
                    ) : (
                      <span>{cinema.address}</span>
                    )}
                  </td>

                  {/* STATUS */}
                  <td
                    className="px-6 py-4 cursor-pointer"
                    onDoubleClick={() =>
                      setEditingCell({ id: cinema.id, field: 'status' })
                    }
                  >
                    {editingCell?.id === cinema.id &&
                    editingCell.field === 'status' ? (
                      <select
                        autoFocus
                        defaultValue={cinema.status}
                        onChange={(e) =>
                          handleSaveInline(cinema.id, 'status', e.target.value)
                        }
                        onBlur={() => setEditingCell(null)}
                        className="w-full px-2 py-1 border border-blue-500 rounded outline-none bg-white"
                      >
                        <option value="Đang Hoạt Động">Đang Hoạt Động</option>
                        <option value="Dừng Hoạt Động">Dừng Hoạt Động</option>
                      </select>
                    ) : (
                      <span
                        className={`font-medium ${
                          cinema.status === 'Đang Hoạt Động'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {cinema.status}
                      </span>
                    )}
                  </td>

                  {/* ACTION */}
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDelete(cinema.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                    >
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
              {currentCinemas.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-8 text-gray-500 italic"
                  >
                    Không tìm thấy kết quả nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* FOOTER */}
        {filteredCinemas.length > 0 && (
          <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-t border-gray-200">
            <span className="text-sm text-gray-500">
              Hiển thị {startIndex + 1} -{' '}
              {Math.min(startIndex + itemsPerPage, filteredCinemas.length)}{' '}
              trong {filteredCinemas.length} rạp
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-md border ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ChevronLeft size={20} />
              </button>
              <span className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className={`p-2 rounded-md border ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
      {/* MODAL CREATE (Giữ nguyên) */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">
                Thêm rạp phim mới
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition text-gray-500"
              >
                <X size={22} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên rạp
                </label>
                <input
                  type="text"
                  name="name"
                  value={newCinemaData.name}
                  onChange={handleChangeCreate}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="Nhập tên rạp..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ (Tỉnh/Thành phố)
                </label>
                <div className="relative">
                  <select
                    name="address"
                    value={newCinemaData.address}
                    onChange={handleChangeCreate}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 outline-none bg-white transition cursor-pointer pr-10"
                  >
                    <option value="">-- Chọn Tỉnh/Thành phố --</option>
                    {LIST_PROVINCES.map((province) => (
                      <option key={province.code} value={province.name}>
                        {province.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <ChevronDown size={18} />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <div className="relative">
                  <select
                    name="status"
                    value={newCinemaData.status}
                    onChange={handleChangeCreate}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 outline-none bg-white transition cursor-pointer pr-10"
                  >
                    <option value="Đang Hoạt Động">Đang Hoạt Động</option>
                    <option value="Dừng Hoạt Động">Dừng Hoạt Động</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <ChevronDown size={18} />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-5 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setIsCreateOpen(false)}
                className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg text-gray-700 font-medium transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleCreate}
                disabled={isSaving}
                className="px-5 py-2.5 bg-[#0c46d6] hover:bg-[#0a3bb5] text-white rounded-lg font-medium transition shadow-md flex items-center gap-2"
              >
                {isSaving ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Plus size={18} />
                )}{' '}
                Thêm mới
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
