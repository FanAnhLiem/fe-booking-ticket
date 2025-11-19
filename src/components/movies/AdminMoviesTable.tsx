'use client';

import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  X,
  Loader2,
  ChevronDown,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  Plus,
  Pencil,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Movie } from '@/types/alltypes';

interface MovieDetail {
  id: number;
  name: string;
  description: string;
  duration: number;
  category: string;
  country: string;
  director: string;
  actors: string;
  posterUrl: string;
  ageLimit: number;
  trailer: string;
  status: boolean;
  releaseDate: string;
  endDate: string;
  createAt: string;
}

// ====== URL backend ======
const BASE_API = 'http://localhost:8080/api';
const MOVIE_ADMIN_API = `${BASE_API}/admin/movie`; // list + CRUD admin
const MOVIE_DETAIL_API = `${BASE_API}/movie`; // dùng chung lấy detail

// Lấy Authorization header từ localStorage
const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('accessToken');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

export default function AdminMoviesTable() {
  const router = useRouter();

  // list + paging
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 8;

  // search + filter status
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'ACTIVE' | 'INACTIVE'>(
    'All',
  );

  // detail modal
  const [selectedMovie, setSelectedMovie] = useState<MovieDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // ====== FETCH LIST PHIM (ADMIN) ======
  const reloadMovies = async (page: number) => {
    setLoadingList(true);
    try {
      const res = await fetch(
        `${MOVIE_ADMIN_API}?page=${page}&limit=${itemsPerPage}`,
        {
          headers: {
            ...getAuthHeaders(),
          },
        },
      );

      const data = await res.json();

      // ApiResponse<MovieListPage>
      // result: { movieList: MoviePage[], totalPages: number }
      if (res.ok && data.code === 0 && data.result) {
        const result = data.result;
        const list: Movie[] = Array.isArray(result.movieList)
          ? result.movieList
          : [];
        const total =
          typeof result.totalPages === 'number' ? result.totalPages : 1;

        setMovies(list);
        setTotalPages(Math.max(1, total));
        setCurrentPage(page);
      } else {
        console.error('Reload movies wrong data: ', data);
      }
    } catch (error) {
      console.error('Reload movies failed: ', error);
    } finally {
      setLoadingList(false);
    }
  };

  // load lần đầu
  useEffect(() => {
    reloadMovies(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ====== FILTER + SEARCH client-side ======
  const filteredMovies = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();

    // gom status text từ backend thành ACTIVE / INACTIVE
    const statusKey = (s: string): 'ACTIVE' | 'INACTIVE' | '' => {
      const lower = (s || '').toLowerCase();
      if (lower.includes('đang') || lower.includes('active')) return 'ACTIVE';
      if (
        lower.includes('tạm') ||
        lower.includes('ngừng') ||
        lower.includes('inactive')
      )
        return 'INACTIVE';
      return '';
    };

    return movies.filter((movie) => {
      const sKey = statusKey(movie.status);
      const matchesStatus = filterStatus === 'All' || sKey === filterStatus;

      const matchesSearch =
        movie.name.toLowerCase().includes(lowerSearch) ||
        movie.category.toLowerCase().includes(lowerSearch);

      return matchesStatus && matchesSearch;
    });
  }, [movies, searchTerm, filterStatus]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterStatus(e.target.value as any);
  };

  // ====== DETAIL (dùng API chung: GET /api/movie/{id}) ======
  const openDetailModal = async (movie: Movie) => {
    setIsDetailOpen(true);
    setLoadingDetail(true);
    setSelectedMovie(null);

    try {
      const res = await fetch(`${MOVIE_DETAIL_API}/${movie.id}`);
      const data = await res.json();

      // ApiResponse<MovieDetailResponse>
      if (res.ok && data.result) {
        const m = data.result;
        const detail: MovieDetail = {
          id: m.id,
          name: movie.name, // name lấy từ list để đồng bộ
          description: m.description,
          duration: m.duration,
          category: m.category,
          country: m.country,
          director: m.director,
          actors: m.actors,
          posterUrl: m.posterUrl,
          ageLimit: m.ageLimit,
          trailer: m.trailer,
          status: m.status,
          releaseDate: m.releaseDate,
          endDate: m.endDate,
          createAt: m.createAt,
        };
        setSelectedMovie(detail);
      } else {
        console.error('Fetch movie detail wrong data: ', data);
      }
    } catch (error) {
      console.error('Fetch movie detail failed: ', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetailModal = () => {
    setIsDetailOpen(false);
    setSelectedMovie(null);
  };

  // ====== DELETE MOVIE (DELETE /api/admin/movie/{id}) ======
  const handleDeleteMovie = async (id: number) => {
    if (!confirm('Bạn chắc chắn muốn xoá phim này?')) return;

    const previous = [...movies];
    setMovies((prev) => prev.filter((m) => m.id !== id));

    try {
      const res = await fetch(`${MOVIE_ADMIN_API}/${id}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
        },
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || (data && data.code && data.code !== 0)) {
        throw new Error(data?.message || 'Xoá phim thất bại');
      }

      await reloadMovies(currentPage);
    } catch (error) {
      console.error('Delete movie error:', error);
      alert('Xoá phim thất bại, vui lòng thử lại!');
      setMovies(previous);
    }
  };

  // ====== RENDER ======
  return (
    <div className="w-full max-w-6xl mx-auto mt-8">
      {/* Thanh search + filter + nút thêm phim */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 w-full sm:w-80 border rounded-lg px-3 py-2 bg-white">
          <Search size={18} className="text-slate-500" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc thể loại..."
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
              <option value="ACTIVE">Đang chiếu / hoạt động</option>
              <option value="INACTIVE">Ngừng chiếu</option>
            </select>
            <ChevronDown size={14} className="ml-1 text-slate-500" />
          </div>

          {/* Nút điều hướng sang trang tạo phim */}
          <button
            type="button"
            onClick={() => router.push('/admin/movies/create')}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-black text-white text-sm hover:bg-slate-800 transition-colors"
          >
            <Plus size={16} />
            Thêm phim
          </button>
        </div>
      </div>

      {/* Bảng danh sách phim */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="font-semibold text-sm">Danh sách phim</h2>
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
                  Poster
                </th>
                <th className="px-4 py-2 text-left font-medium text-xs text-slate-500">
                  Tên phim
                </th>
                <th className="px-4 py-2 text-left font-medium text-xs text-slate-500">
                  Thể loại
                </th>
                <th className="px-4 py-2 text-left font-medium text-xs text-slate-500">
                  Năm
                </th>
                <th className="px-4 py-2 text-left font-medium text-xs text-slate-500">
                  Lịch chiếu
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
              {filteredMovies.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-6 text-center text-sm text-slate-500"
                  >
                    Không có phim nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredMovies.map((movie, index) => {
                  const overallIndex =
                    (currentPage - 1) * itemsPerPage + index + 1;

                  const lowerStatus = (movie.status || '').toLowerCase();
                  const isActive =
                    lowerStatus.includes('đang') ||
                    lowerStatus.includes('active');

                  return (
                    <tr
                      key={movie.id}
                      className="border-t hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-2 text-xs text-slate-500">
                        {overallIndex}
                      </td>
                      <td className="px-4 py-2">
                        {movie.posterUrl ? (
                          <div className="w-12 h-16 relative rounded overflow-hidden bg-slate-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={movie.posterUrl}
                              alt={movie.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            No image
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 font-medium text-slate-800">
                        {movie.name}
                      </td>
                      <td className="px-4 py-2 text-slate-700">
                        {movie.category}
                      </td>
                      <td className="px-4 py-2 text-slate-700">
                        {movie.yearRelease}
                      </td>
                      <td className="px-4 py-2 text-slate-700">
                        {movie.showSchedule}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {movie.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            className="px-2 py-1 text-xs rounded border bg-white hover:bg-slate-50 inline-flex items-center gap-1"
                            onClick={() => openDetailModal(movie)}
                          >
                            <Eye size={14} />
                            Chi tiết
                          </button>

                          {/* Nút SỬA → điều hướng tới trang update phim */}
                          <button
                            className="px-2 py-1 text-xs rounded border bg-white hover:bg-slate-50 inline-flex items-center gap-1"
                            onClick={() =>
                              router.push(`/admin/movies/${movie.id}/edit`)
                            }
                          >
                            <Pencil size={14} />
                            Sửa
                          </button>

                          <button
                            className="px-2 py-1 text-xs rounded border border-red-200 text-red-600 hover:bg-red-50 inline-flex items-center gap-1"
                            onClick={() => handleDeleteMovie(movie.id)}
                          >
                            <Trash2 size={14} />
                            Xoá
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
              onClick={() => currentPage > 1 && reloadMovies(currentPage - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="p-1 rounded border bg-white disabled:opacity-40"
              disabled={currentPage === totalPages}
              onClick={() =>
                currentPage < totalPages && reloadMovies(currentPage + 1)
              }
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal chi tiết phim (dùng /api/movie/{id}) */}
      {isDetailOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold text-sm">Chi tiết phim</h3>
              <button
                className="p-1 rounded-full hover:bg-slate-100"
                onClick={closeDetailModal}
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-4 py-4 overflow-y-auto text-sm space-y-4">
              {loadingDetail && (
                <div className="flex items-center justify-center py-8 text-slate-500 text-sm">
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Đang tải chi tiết phim...
                </div>
              )}

              {!loadingDetail && selectedMovie && (
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/3">
                    {selectedMovie.posterUrl ? (
                      <div className="relative w-full pb-[150%] rounded-lg overflow-hidden bg-slate-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedMovie.posterUrl}
                          alt={selectedMovie.name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full pb-[150%] rounded-lg bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="md:flex-1 space-y-3">
                    <div>
                      <h4 className="font-semibold text-base mb-1">
                        {selectedMovie.id}. {selectedMovie.name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Khởi tạo: {selectedMovie.createAt || '—'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p>
                        <span className="font-medium">Thể loại:</span>{' '}
                        {selectedMovie.category || '—'}
                      </p>
                      <p>
                        <span className="font-medium">Quốc gia:</span>{' '}
                        {selectedMovie.country || '—'}
                      </p>
                      <p>
                        <span className="font-medium">Đạo diễn:</span>{' '}
                        {selectedMovie.director || '—'}
                      </p>
                      <p>
                        <span className="font-medium">Diễn viên:</span>{' '}
                        {selectedMovie.actors || '—'}
                      </p>
                      <p>
                        <span className="font-medium">Thời lượng:</span>{' '}
                        {selectedMovie.duration
                          ? `${selectedMovie.duration} phút`
                          : '—'}
                      </p>
                      <p>
                        <span className="font-medium">Giới hạn tuổi:</span>{' '}
                        {selectedMovie.ageLimit
                          ? `Từ ${selectedMovie.ageLimit}+`
                          : '—'}
                      </p>
                      <p>
                        <span className="font-medium">Ngày khởi chiếu:</span>{' '}
                        {selectedMovie.releaseDate || '—'}
                      </p>
                      <p>
                        <span className="font-medium">Ngày kết thúc:</span>{' '}
                        {selectedMovie.endDate || '—'}
                      </p>
                      <p>
                        <span className="font-medium">Trạng thái:</span>{' '}
                        {selectedMovie.status
                          ? 'Đang chiếu / hoạt động'
                          : 'Ngừng chiếu'}
                      </p>
                      {selectedMovie.trailer && (
                        <p className="break-all">
                          <span className="font-medium">Trailer:</span>{' '}
                          <a
                            href={selectedMovie.trailer}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {selectedMovie.trailer}
                          </a>
                        </p>
                      )}
                    </div>

                    {selectedMovie.description && (
                      <div className="mt-2">
                        <p className="font-medium mb-1">Mô tả</p>
                        <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                          {selectedMovie.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!loadingDetail && !selectedMovie && (
                <div className="text-center text-sm text-slate-500 py-8">
                  Không tìm thấy thông tin phim.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
