'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { UserType } from '@/types/alltypes';

// ====== URL backend ======
const BASE_API = 'http://localhost:8080/api';
const ACCOUNT_ADMIN_API = `${BASE_API}/admin/account`;
const ROLE_ADMIN_API = `${ACCOUNT_ADMIN_API}/role`;

// Lấy Authorization header từ localStorage
const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('accessToken');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

interface RoleOption {
  id: number;
  name: string;
}

const getRoleBadgeClass = (roleName: string) => {
  const lower = (roleName || '').toLowerCase();
  if (lower === 'admin' || lower === 'quản trị viên') {
    return 'bg-red-50 text-red-700 border border-red-200';
  }
  if (lower === 'staff' || lower === 'nhân viên') {
    return 'bg-blue-50 text-blue-700 border border-blue-200';
  }
  if (lower === 'user' || lower === 'người dùng') {
    return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  }
  return 'bg-slate-50 text-slate-700 border border-slate-200';
};

const getStatusBadgeClass = (status: string) => {
  const lower = (status || '').toLowerCase();
  if (lower.includes('đang hoạt')) {
    return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  }
  if (lower.includes('ngừng') || lower.includes('khóa')) {
    return 'bg-rose-50 text-rose-700 border border-rose-200';
  }
  return 'bg-slate-50 text-slate-700 border border-slate-200';
};

export default function UserTable() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [assigningUserId, setAssigningUserId] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // ====== FETCH USERS ======
  const reloadUsers = async () => {
    setLoadingList(true);
    try {
      const res = await fetch(ACCOUNT_ADMIN_API, {
        headers: {
          ...getAuthHeaders(),
        },
      });

      const data = await res.json().catch(() => null);

      if (res.ok && Array.isArray(data?.result)) {
        const list: UserType[] = data.result.map((u: any) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          phone: u.phone,
          roleName: u.roleName,
          birthday: u.birthday,
          status: u.status,
        }));
        // Có thể sort theo id mới nhất
        list.sort((a, b) => (b.id || 0) - (a.id || 0));
        setUsers(list);
      } else {
        console.error('Get users wrong data: ', data);
      }
    } catch (error) {
      console.error('Get users failed: ', error);
    } finally {
      setLoadingList(false);
    }
  };

  // ====== FETCH ROLES ======
  const reloadRoles = async () => {
    setLoadingRoles(true);
    try {
      const res = await fetch(ROLE_ADMIN_API, {
        headers: {
          ...getAuthHeaders(),
        },
      });

      const data = await res.json().catch(() => null);

      if (res.ok && Array.isArray(data?.result)) {
        const list: RoleOption[] = data.result.map((r: any) => ({
          id: r.id,
          name: r.name,
        }));
        setRoles(list);
      } else {
        console.error('Get roles wrong data: ', data);
      }
    } catch (error) {
      console.error('Get roles failed: ', error);
    } finally {
      setLoadingRoles(false);
    }
  };

  useEffect(() => {
    void reloadUsers();
    void reloadRoles();
  }, []);

  // ====== FILTER OPTIONS ======
  const roleFilterOptions = useMemo(() => {
    const names = Array.from(
      new Set(users.map((u) => u.roleName).filter(Boolean)),
    );
    return names;
  }, [users]);

  // Roles có thể assign (ẩn ADMIN vì backend không cho set)
  const assignableRoles = useMemo(
    () => roles.filter((r) => r.name !== 'ADMIN'),
    [roles],
  );

  // ====== SEARCH + FILTER + PAGING ======
  const filteredUsers = useMemo(() => {
    const lower = searchTerm.toLowerCase().trim();

    return users.filter((u) => {
      const email = (u.email || '').toLowerCase();
      const name = (u.name || '').toLowerCase();
      const phone = (u.phone || '').toLowerCase();

      const matchSearch =
        !lower ||
        email.includes(lower) ||
        name.includes(lower) ||
        phone.includes(lower);

      const matchRole =
        filterRole === 'All' || u.roleName === filterRole;

      const matchStatus =
        filterStatus === 'All' || u.status === filterStatus;

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchTerm, filterRole, filterStatus]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / itemsPerPage),
  );

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole, filterStatus]);

  // ====== HANDLER ĐỔI ROLE ======
  const handleChangeRole = async (user: UserType, newRoleIdStr: string) => {
    if (!newRoleIdStr) return;
    const newRoleId = Number(newRoleIdStr);
    if (!Number.isFinite(newRoleId)) return;

    const newRole = roles.find((r) => r.id === newRoleId);
    const newRoleName = newRole?.name ?? '';

    const confirmMsg = `Bạn có chắc muốn đổi vai trò của ${user.email} thành "${newRoleName}"?`;
    if (!window.confirm(confirmMsg)) return;

    setAssigningUserId(user.id);
    try {
      const res = await fetch(
        `${ACCOUNT_ADMIN_API}/user/${user.id}/role/${newRoleId}`,
        {
          method: 'PUT',
          headers: {
            ...getAuthHeaders(),
          },
        },
      );

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.result) {
        throw new Error(
          data?.message || 'Cập nhật vai trò người dùng thất bại',
        );
      }

      // Cập nhật lại roleName phía client
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, roleName: newRoleName } : u,
        ),
      );
      alert('Cập nhật vai trò thành công');
    } catch (error: any) {
      console.error('Assign role error: ', error);
      alert(error.message || 'Cập nhật vai trò thất bại');
    } finally {
      setAssigningUserId(null);
    }
  };

  // ====== RENDER ======
  return (
    <div className="p-6 max-w-6xl w-full mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">
        Quản lý người dùng
      </h1>

      {/* --- TOOLBAR --- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        {/* Ô search */}
        <div className="flex items-center gap-2 w-full sm:w-80 border rounded-lg px-3 py-2 bg-white">
          <Search size={18} className="text-slate-500" />
          <input
            type="text"
            placeholder="Tìm theo email / tên / số điện thoại..."
            className="w-full outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter */}
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
          <Filter size={16} className="text-slate-500" />
          {/* Filter role */}
          <select
            className="border rounded-lg px-2 py-1 bg-white"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="All">Tất cả vai trò</option>
            {roleFilterOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>

          {/* Filter status */}
          <select
            className="border rounded-lg px-2 py-1 bg-white"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">Tất cả trạng thái</option>
            <option value="Đang hoạt động">Đang hoạt động</option>
            <option value="Ngừng hoạt động">Ngừng hoạt động</option>
          </select>

          {/* Reload */}
          <button
            type="button"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
            onClick={reloadUsers}
          >
            {loadingList && <Loader2 className="animate-spin" size={14} />}
            Làm mới
          </button>
        </div>
      </div>

      {/* --- BẢNG --- */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <span>Danh sách người dùng</span>
            {(loadingList || loadingRoles) && (
              <Loader2 className="animate-spin" size={16} />
            )}
          </div>
          <p className="text-xs text-slate-500">
            Admin chỉ được phép thay đổi vai trò (không được gán ADMIN cho người khác).
          </p>
        </div>

        <div className="overflow-x-auto max-h-[520px]">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2 text-left w-10">#</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Tên</th>
                <th className="px-4 py-2 text-left">SĐT</th>
                <th className="px-4 py-2 text-left">Ngày sinh</th>
                <th className="px-4 py-2 text-left">Vai trò</th>
                <th className="px-4 py-2 text-left">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length === 0 && !loadingList && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-slate-500 text-sm"
                  >
                    Chưa có người dùng nào.
                  </td>
                </tr>
              )}

              {paginatedUsers.map((user, index) => {
                const isAdminRole =
                  (user.roleName || '').toUpperCase() === 'ADMIN';

                const currentRole = roles.find(
                  (r) => r.name === user.roleName,
                );
                const currentRoleId = currentRole?.id ?? '';

                return (
                  <tr
                    key={user.id}
                    className="border-t last:border-b hover:bg-slate-50/60"
                  >
                    <td className="px-4 py-2 text-slate-500">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-4 py-2 text-slate-800 font-medium">
                      {user.email}
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      {user.name || '-'}
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      {user.phone || '-'}
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      {user.birthday || '-'}
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      <div className="flex items-center gap-2">
                        {/* Badge hiển thị */}
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${getRoleBadgeClass(
                            user.roleName,
                          )}`}
                        >
                          {user.roleName || '-'}
                        </span>

                        {/* Select đổi role – không cho đổi Admin */}
                        {!isAdminRole && assignableRoles.length > 0 && (
                          <select
                            className="text-xs border rounded px-2 py-1 bg-white"
                            value={currentRoleId}
                            disabled={
                              assigningUserId === user.id || loadingRoles
                            }
                            onChange={(e) =>
                              handleChangeRole(user, e.target.value)
                            }
                          >
                            <option value="">Đổi vai trò...</option>
                            {assignableRoles.map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${getStatusBadgeClass(
                          user.status,
                        )}`}
                      >
                        {user.status || '-'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* --- PHÂN TRANG --- */}
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

      <div className="mt-3 text-xs text-gray-500 italic">
        * Dữ liệu lấy từ API thật:
        <span className="font-mono">
          {' '}
          GET /api/admin/account, GET /api/admin/account/role, PUT
          /api/admin/account/user/&#123;userId&#125;/role/&#123;roleId&#125;
        </span>
      </div>
    </div>
  );
}
