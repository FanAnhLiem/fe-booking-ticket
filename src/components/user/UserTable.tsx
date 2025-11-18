'use client';

import { useState } from 'react';
import { UserType } from '@/types/alltypes';
import {
  Filter,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function UserTable({ listUsers }: { listUsers: UserType[] }) {
  const [users, setUsers] = useState<UserType[]>(listUsers);
  const [filterRole, setFilterRole] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState<{
    id: number;
    field: keyof UserType;
  } | null>(null);

  // --- STATE PHÂN TRANG ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- XỬ LÝ KHI THAY ĐỔI TÌM KIẾM HOẶC LỌC ---
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset về trang 1 khi tìm kiếm
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterRole(e.target.value);
    setCurrentPage(1); // Reset về trang 1 khi lọc
  };

  // --- LOGIC LỌC DỮ LIỆU ---
  const filteredUsers = users.filter((user) => {
    const matchesRole =
      filterRole === 'All' ||
      user.roleName.toLowerCase() === filterRole.toLowerCase();
    const lowerSearch = searchTerm.toLowerCase();
    const matchesSearch =
      user.name.toLowerCase().includes(lowerSearch) ||
      user.email.toLowerCase().includes(lowerSearch) ||
      user.phone.toLowerCase().includes(lowerSearch) ||
      user.roleName.toLowerCase().includes(lowerSearch) ||
      user.birthday.toLowerCase().includes(lowerSearch) ||
      user.status.toLowerCase().includes(lowerSearch);

    return matchesRole && matchesSearch;
  });

  // --- TÍNH TOÁN PHÂN TRANG ---
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentUsers = filteredUsers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // --- LOGIC XÓA ---
  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa người dùng này không?')) return;
    const previousUsers = [...users];
    const newUsers = users.filter((u) => u.id !== id);
    setUsers(newUsers);

    try {
      const res = await fetch(
        `https://691a973a2d8d7855756f52b8.mockapi.io/api/user/${id}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error('Lỗi khi xóa');
    } catch (error) {
      alert('Xóa thất bại, đang khôi phục...');
      setUsers(previousUsers);
    }
  };

  // --- LOGIC SỬA (INLINE EDIT) ---
  const handleSaveInline = async (
    id: number,
    field: keyof UserType,
    newValue: string
  ) => {
    const currentUser = users.find((u) => u.id === id);
    if (!currentUser || currentUser[field] === newValue) {
      setEditingCell(null);
      return;
    }
    const updatedUser = { ...currentUser, [field]: newValue };
    const previousUsers = [...users];
    setUsers(users.map((u) => (u.id === id ? updatedUser : u)));
    setEditingCell(null);

    try {
      const res = await fetch(
        `https://691a973a2d8d7855756f52b8.mockapi.io/api/user/${id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedUser),
        }
      );
      if (!res.ok) throw new Error('Lỗi API');
    } catch (error) {
      setUsers(previousUsers);
      alert('Cập nhật thất bại!');
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    id: number,
    field: keyof UserType,
    value: string
  ) => {
    if (e.key === 'Enter') handleSaveInline(id, field, value);
  };

  const getRoleStyle = (role: string) => {
    const roleLower = role.toLowerCase();
    if (roleLower === 'admin' || roleLower === 'quản trị viên')
      return 'bg-red-100 text-red-700 border border-red-200';
    if (roleLower === 'staff' || roleLower === 'nhân viên')
      return 'bg-blue-100 text-blue-700 border border-blue-200';
    if (roleLower === 'user' || roleLower === 'người dùng')
      return 'bg-green-100 text-green-700 border border-green-200';
    return 'bg-gray-100 text-gray-700 border border-gray-200';
  };

  return (
    <div className="p-6 max-w-[1300px] w-full">
       <h1 className="text-2xl font-bold text-gray-800 mb-4 ml-6 text-center">Quản lý người dùng</h1>
      {/* --- TOOLBAR --- */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm tên, email, sđt..."
            value={searchTerm}
            onChange={handleSearchChange} // Dùng hàm handleSearchChange
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
          />
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg shadow-sm">
          <Filter size={18} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Lọc vai trò:
          </span>
          <select
            value={filterRole}
            onChange={handleFilterChange} // Dùng hàm handleFilterChange
            className="outline-none text-sm font-semibold text-blue-600 cursor-pointer bg-transparent"
          >
            <option value="All">Tất cả</option>
            <option value="ADMIN">Admin</option>
            <option value="STAFF">Staff</option>
            <option value="USER">User</option>
          </select>
        </div>
      </div>

      {/* --- TABLE --- */}
      <div className="bg-white outline outline-[#8b8b8b] rounded-lg overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 text-gray-700 font-semibold uppercase text-sm">
              <tr>
                <th className="px-6 py-4 border-b">STT</th>
                <th className="px-6 py-4 border-b">Họ tên</th>
                <th className="px-6 py-4 border-b">Email</th>
                <th className="px-6 py-4 border-b">Số điện thoại</th>
                <th className="px-6 py-4 border-b">Vai trò</th>
                <th className="px-6 py-4 border-b">Ngày sinh</th>
                <th className="px-6 py-4 border-b">Trạng thái</th>
                <th className="px-6 py-4 border-b w-[60px]"></th>
              </tr>
            </thead>

            <tbody className="text-gray-700 text-sm">
              {/* Duyệt qua currentUsers (đã phân trang) thay vì filteredUsers */}
              {currentUsers.map((user, index) => (
                <tr
                  key={user.id}
                  className="border-b hover:bg-blue-50 transition-colors duration-200 group"
                >
                  {/* Tính STT dựa trên trang hiện tại */}
                  <td className="px-6 py-4 font-medium text-gray-500">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>

                  <td
                    className="px-6 py-4 font-bold text-gray-900 cursor-pointer"
                    onDoubleClick={() =>
                      setEditingCell({ id: user.id, field: 'name' })
                    }
                  >
                    {editingCell?.id === user.id &&
                    editingCell.field === 'name' ? (
                      <input
                        autoFocus
                        defaultValue={user.name}
                        onBlur={(e) =>
                          handleSaveInline(user.id, 'name', e.target.value)
                        }
                        onKeyDown={(e) =>
                          handleKeyDown(
                            e,
                            user.id,
                            'name',
                            e.currentTarget.value
                          )
                        }
                        className="w-full px-2 py-1 border border-blue-500 rounded outline-none"
                      />
                    ) : (
                      user.name
                    )}
                  </td>
                  <td
                    className="px-6 py-4 cursor-pointer"
                    onDoubleClick={() =>
                      setEditingCell({ id: user.id, field: 'email' })
                    }
                  >
                    {editingCell?.id === user.id &&
                    editingCell.field === 'email' ? (
                      <input
                        autoFocus
                        defaultValue={user.email}
                        onBlur={(e) =>
                          handleSaveInline(user.id, 'email', e.target.value)
                        }
                        onKeyDown={(e) =>
                          handleKeyDown(
                            e,
                            user.id,
                            'email',
                            e.currentTarget.value
                          )
                        }
                        className="w-full px-2 py-1 border border-blue-500 rounded outline-none"
                      />
                    ) : (
                      user.email
                    )}
                  </td>
                  <td
                    className="px-6 py-4 cursor-pointer"
                    onDoubleClick={() =>
                      setEditingCell({ id: user.id, field: 'phone' })
                    }
                  >
                    {editingCell?.id === user.id &&
                    editingCell.field === 'phone' ? (
                      <input
                        autoFocus
                        defaultValue={user.phone}
                        onBlur={(e) =>
                          handleSaveInline(user.id, 'phone', e.target.value)
                        }
                        onKeyDown={(e) =>
                          handleKeyDown(
                            e,
                            user.id,
                            'phone',
                            e.currentTarget.value
                          )
                        }
                        className="w-full px-2 py-1 border border-blue-500 rounded outline-none"
                      />
                    ) : (
                      user.phone
                    )}
                  </td>
                  <td
                    className="px-6 py-4 cursor-pointer"
                    onDoubleClick={() =>
                      setEditingCell({ id: user.id, field: 'roleName' })
                    }
                  >
                    {editingCell?.id === user.id &&
                    editingCell.field === 'roleName' ? (
                      <select
                        autoFocus
                        defaultValue={user.roleName}
                        onChange={(e) =>
                          handleSaveInline(user.id, 'roleName', e.target.value)
                        }
                        onBlur={() => setEditingCell(null)}
                        className="w-[100px] px-2 py-1 border border-blue-500 rounded outline-none bg-white"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="USER">USER</option>
                        <option value="STAFF">STAFF</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-block w-[100px] text-center py-1 rounded-full text-xs font-bold ${getRoleStyle(
                          user.roleName
                        )}`}
                      >
                        {user.roleName}
                      </span>
                    )}
                  </td>
                  <td
                    className="px-6 py-4 cursor-pointer"
                    onDoubleClick={() =>
                      setEditingCell({ id: user.id, field: 'birthday' })
                    }
                  >
                    {editingCell?.id === user.id &&
                    editingCell.field === 'birthday' ? (
                      <input
                        type="date"
                        autoFocus
                        defaultValue={user.birthday}
                        onBlur={(e) =>
                          handleSaveInline(user.id, 'birthday', e.target.value)
                        }
                        onKeyDown={(e) =>
                          handleKeyDown(
                            e,
                            user.id,
                            'birthday',
                            e.currentTarget.value
                          )
                        }
                        className="w-full px-2 py-1 border border-blue-500 rounded outline-none"
                      />
                    ) : (
                      user.birthday
                    )}
                  </td>
                  <td
                    className={`px-6 py-4 font-medium ${
                      user.status === 'Đang Hoạt Động'
                        ? 'text-green-600'
                        : 'text-red-500'
                    }`}
                  >
                    {user.status}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition duration-200"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}

              {currentUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-8 text-gray-500 italic"
                  >
                    Không tìm thấy kết quả nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- FOOTER PHÂN TRANG --- */}
        {filteredUsers.length > 0 && (
          <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-t border-gray-200">
            <span className="text-sm text-gray-500">
              Hiển thị {startIndex + 1} -{' '}
              {Math.min(startIndex + itemsPerPage, filteredUsers.length)} trong
              tổng số {filteredUsers.length} kết quả
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
                Trang {currentPage} / {totalPages}
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

      <div className="p-4 text-xs text-gray-500 italic">
        * Click đúp chuột vào ô để chỉnh sửa.
      </div>
    </div>
  );
}
