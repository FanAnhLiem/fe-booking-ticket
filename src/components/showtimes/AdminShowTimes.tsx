'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Loader2,
  MapPin,
  Building,
  MonitorPlay,
  Film,
  CalendarDays,
  Pencil,
  Trash2,
  X, // icon đóng modal
} from 'lucide-react';

import { Province, CinemaSummary, ScreenRoomDetail } from '@/types/alltypes';

// ====== CONST API ======
const BASE_API = 'http://localhost:8080/api';
const PROVINCES_API = 'https://provinces.open-api.vn/api/v2/p/';
const CINEMA_BY_ADDRESS_API = `${BASE_API}/cinema/address`;
const SCREENROOM_ADMIN_API = `${BASE_API}/admin/screenRoom`;
const MOVIE_NOW_SHOWING_API = `${BASE_API}/admin/movie/showday`;
const SHOWTIME_ADMIN_API = `${BASE_API}/admin/showtime`;

// ====== Kiểu dữ liệu cục bộ ======
interface ApiResponse<T> {
  code?: number;
  message?: string;
  result: T;
}

interface MovieShowDay {
  id: number;
  name: string;
}

interface MovieOption {
  id: number;
  name: string;
}

interface ShowTimeDTO {
  id: number;
  movieName: string;
  showDate: string; // 'dd/MM/yyyy'
  startTime: string; // 'HH:mm' hoặc 'HH:mm:ss'
  endTime: string;
  screenRoomId: number;
}

interface ShowTimeResponse {
  id: number;
  showDate: string; // 'dd/MM/yyyy'
  startTime: string; // 'HH:mm' hoặc 'HH:mm:ss'
  endTime: string;
  screenRoomId: number;
  movieId: number;
  movieName?: string;
}

// ====== STATE form edit riêng ======
interface EditShowTimeForm {
  id: number;
  screenRoomId: number;
  date: string; // yyyy-MM-dd cho <input type="date" />
  movieId: number;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

// Lấy Authorization header
const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('accessToken');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

// ====== Helper xử lý date/time ======
const toInputDate = (d: Date) => d.toISOString().slice(0, 10); // yyyy-MM-dd

// yyyy-MM-dd -> dd/MM/yyyy (body ShowTimeRequest)
const formatDateForPayload = (input: string): string => {
  if (!input) return '';
  const [y, m, d] = input.split('-');
  return `${d}/${m}/${y}`;
};

// yyyy-MM-dd -> dd-MM-yyyy (query param ?date=...)
const formatDateForQuery = (input: string): string => {
  if (!input) return '';
  const [y, m, d] = input.split('-');
  return `${d}-${m}-${y}`;
};

// dd/MM/yyyy hoặc dd-MM-yyyy -> yyyy-MM-dd (để set vào <input type="date" />)
const payloadDateToInputDate = (payloadDate: string): string => {
  if (!payloadDate) return '';
  const parts = payloadDate.split(/[-/]/);
  if (parts.length !== 3) return '';
  const [d, m, y] = parts;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
};

// HH:mm:ss -> HH:mm
const trimTime = (t: string | null | undefined): string => {
  if (!t) return '';
  const parts = t.split(':');
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
  return t;
};

export default function AdminShowTimes() {
  // ====== STATE chọn địa điểm & phòng ======
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cinemas, setCinemas] = useState<CinemaSummary[]>([]);
  const [screenRooms, setScreenRooms] = useState<ScreenRoomDetail[]>([]);

  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>('');
  const [selectedCinemaId, setSelectedCinemaId] = useState<number | null>(null);
  const [selectedScreenRoomId, setSelectedScreenRoomId] = useState<number | null>(
    null,
  );

  // ====== STATE phim & suất chiếu (tạo mới) ======
  const [movies, setMovies] = useState<MovieOption[]>([]);
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>(toInputDate(new Date()));
  const [startTimeInput, setStartTimeInput] = useState<string>('');
  const [endTimeInput, setEndTimeInput] = useState<string>('');

  const [showTimes, setShowTimes] = useState<ShowTimeDTO[]>([]);

  // ====== STATE edit modal ======
  const [editForm, setEditForm] = useState<EditShowTimeForm | null>(null);
  const [editMovies, setEditMovies] = useState<MovieOption[]>([]);
  const [loadingEditMovies, setLoadingEditMovies] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const [creatingOrUpdatingShowTime, setCreatingOrUpdatingShowTime] =
    useState(false);

  // ====== Loading & message ======
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCinemas, setLoadingCinemas] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [loadingShowTimes, setLoadingShowTimes] = useState(false);
  const [loadingShowTimeDetail, setLoadingShowTimeDetail] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
            name: p.name,
          }));
          setProvinces(mapped);
        }
      } catch (error) {
        console.error('Fetch provinces failed:', error);
        setErrorMessage('Không tải được danh sách tỉnh / thành.');
      } finally {
        setLoadingProvinces(false);
      }
    };

    fetchProvinces();
  }, []);

  // ====== HÀM LOAD MOVIES (cho form tạo mới) ======
  const loadMovies = async (dateInput: string) => {
    if (!dateInput) return;

    setLoadingMovies(true);
    setErrorMessage(null);

    try {
      const dateParam = formatDateForQuery(dateInput); // yyyy-MM-dd -> dd-MM-yyyy

      const res = await fetch(
        `${MOVIE_NOW_SHOWING_API}?date=${encodeURIComponent(dateParam)}`,
        {
          headers: {
            Accept: 'application/json',
            ...getAuthHeaders(),
          },
        },
      );

      const data: ApiResponse<MovieShowDay[]> = await res.json();

      if (!res.ok || !Array.isArray(data.result)) {
        throw new Error(data?.message || 'Không tải được danh sách phim.');
      }

      const list: MovieOption[] = data.result.map((m) => ({
        id: m.id,
        name: m.name,
      }));

      setMovies(list);
      setSelectedMovieId((prev) => (prev !== null ? prev : list[0]?.id ?? null));
    } catch (error: any) {
      console.error('Fetch movies failed:', error);
      setMovies([]);
      setSelectedMovieId(null);
      setErrorMessage(error?.message || 'Không tải được danh sách phim.');
    } finally {
      setLoadingMovies(false);
    }
  };

  // Lần đầu vào trang: load phim theo ngày hôm nay
  useEffect(() => {
    loadMovies(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ====== FETCH CINEMAS THEO TỈNH ======
  const handleProvinceChange = async (code: string) => {
    setSelectedProvinceCode(code);
    setSelectedCinemaId(null);
    setSelectedScreenRoomId(null);
    setCinemas([]);
    setScreenRooms([]);
    setShowTimes([]);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!code) return;

    const province = provinces.find((p) => String(p.code) === code);
    if (!province) return;

    setLoadingCinemas(true);
    try {
      const res = await fetch(CINEMA_BY_ADDRESS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: province.name }),
      });

      const data: ApiResponse<CinemaSummary[]> = await res.json();
      if (res.ok && Array.isArray(data.result)) {
        const list: CinemaSummary[] = data.result.map((c: any) => ({
          id: c.id,
          name: c.name,
        }));
        setCinemas(list);
      } else {
        setErrorMessage(data?.message || 'Không tải được danh sách rạp.');
      }
    } catch (error) {
      console.error('Fetch cinemas failed:', error);
      setErrorMessage('Không tải được danh sách rạp.');
    } finally {
      setLoadingCinemas(false);
    }
  };

  // ====== FETCH SCREEN ROOMS THEO RẠP ======
  const handleCinemaChange = async (cinemaIdStr: string) => {
    const id = cinemaIdStr ? Number(cinemaIdStr) : NaN;

    setSelectedScreenRoomId(null);
    setScreenRooms([]);
    setShowTimes([]);
    setErrorMessage(null);
    setSuccessMessage(null);
    setStartTimeInput('');
    setEndTimeInput('');

    if (Number.isNaN(id)) {
      setSelectedCinemaId(null);
      return;
    }

    setSelectedCinemaId(id);
    setLoadingRooms(true);
    try {
      const res = await fetch(`${SCREENROOM_ADMIN_API}/active/cinema/${id}`, {
        headers: {
          ...getAuthHeaders(),
        },
      });
      const data: ApiResponse<ScreenRoomDetail[]> = await res.json();
      if (res.ok && Array.isArray(data.result)) {
        const list: ScreenRoomDetail[] = data.result.map((sr: any) => ({
          id: sr.id,
          name: sr.name,
          roomType: sr.roomType,
        }));
        setScreenRooms(list);
      } else {
        setErrorMessage(data?.message || 'Không tải được danh sách phòng chiếu.');
      }
    } catch (error) {
      console.error('Fetch screen rooms failed:', error);
      setErrorMessage('Không tải được danh sách phòng chiếu.');
    } finally {
      setLoadingRooms(false);
    }
  };

  // ====== FETCH SUẤT CHIẾU THEO PHÒNG + NGÀY ======
  const loadShowTimes = async (screenRoomId: number, dateInput: string) => {
    if (!screenRoomId || !dateInput) return;

    setLoadingShowTimes(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const dateParam = formatDateForQuery(dateInput); // yyyy-MM-dd -> dd-MM-yyyy

    try {
      const res = await fetch(
        `${SHOWTIME_ADMIN_API}/screenroom/${screenRoomId}?date=${encodeURIComponent(
          dateParam,
        )}`,
        {
          headers: {
            ...getAuthHeaders(),
          },
        },
      );

      const data: ApiResponse<ShowTimeDTO[]> = await res.json();
      if (!res.ok) {
        setShowTimes([]);
        setErrorMessage(data?.message || 'Không lấy được danh sách suất chiếu.');
        return;
      }

      const list: ShowTimeDTO[] = Array.isArray(data.result)
        ? data.result.map((st: any) => ({
            id: st.id,
            movieName: st.movieName,
            showDate: st.showDate,
            startTime: st.startTime,
            endTime: st.endTime,
            screenRoomId: st.screenRoomId,
          }))
        : [];

      setShowTimes(list);
      if (list.length === 0) {
        setSuccessMessage('Ngày này chưa có suất chiếu nào.');
      }
    } catch (error) {
      console.error('Fetch showtimes failed:', error);
      setErrorMessage('Không lấy được danh sách suất chiếu.');
    } finally {
      setLoadingShowTimes(false);
    }
  };

  const handleScreenRoomChange = async (screenRoomIdStr: string) => {
    const id = screenRoomIdStr ? Number(screenRoomIdStr) : NaN;

    setSelectedScreenRoomId(null);
    setShowTimes([]);
    setErrorMessage(null);
    setSuccessMessage(null);
    setStartTimeInput('');
    setEndTimeInput('');

    if (Number.isNaN(id)) return;

    setSelectedScreenRoomId(id);
    await loadShowTimes(id, selectedDate);
  };

  const handleDateChange = async (value: string) => {
    setSelectedDate(value);
    setShowTimes([]);
    setErrorMessage(null);
    setSuccessMessage(null);
    setStartTimeInput('');
    setEndTimeInput('');
    setSelectedMovieId(null);

    await loadMovies(value);

    if (selectedScreenRoomId) {
      await loadShowTimes(selectedScreenRoomId, value);
    }
  };

  // ====== HÀM LOAD MOVIES RIÊNG CHO MODAL EDIT ======
  const loadEditMovies = async (dateInput: string, keepMovieId?: number) => {
    if (!dateInput) return;
    setLoadingEditMovies(true);

    try {
      const dateParam = formatDateForQuery(dateInput);
      const res = await fetch(
        `${MOVIE_NOW_SHOWING_API}?date=${encodeURIComponent(dateParam)}`,
        {
          headers: {
            Accept: 'application/json',
            ...getAuthHeaders(),
          },
        },
      );
      const data: ApiResponse<MovieShowDay[]> = await res.json();

      if (!res.ok || !Array.isArray(data.result)) {
        throw new Error(data?.message || 'Không tải được danh sách phim.');
      }

      const list: MovieOption[] = data.result.map((m) => ({
        id: m.id,
        name: m.name,
      }));
      setEditMovies(list);

      // Nếu movieId hiện tại không nằm trong list thì chọn phim đầu tiên
      setEditForm((prev) => {
        if (!prev) return prev;
        const exist = list.some((m) => m.id === (keepMovieId ?? prev.movieId));
        return {
          ...prev,
          movieId: exist ? keepMovieId ?? prev.movieId : list[0]?.id ?? prev.movieId,
        };
      });
    } catch (error) {
      console.error('Fetch edit movies failed:', error);
      setEditMovies([]);
    } finally {
      setLoadingEditMovies(false);
    }
  };

  // ====== Load chi tiết showtime để SỬA (mở modal) ======
  const handleEditShowTime = async (id: number) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoadingShowTimeDetail(true);

    try {
      const res = await fetch(`${SHOWTIME_ADMIN_API}/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      const data: ApiResponse<ShowTimeResponse> = await res.json();

      if (!res.ok || !data.result) {
        throw new Error(data?.message || 'Không tải được chi tiết suất chiếu.');
      }

      const st = data.result;
      const inputDate = payloadDateToInputDate(st.showDate); // yyyy-MM-dd

      const form: EditShowTimeForm = {
        id: st.id,
        screenRoomId: st.screenRoomId,
        date: inputDate || toInputDate(new Date()),
        movieId: st.movieId,
        startTime: trimTime(st.startTime),
        endTime: trimTime(st.endTime),
      };

      setEditForm(form);

      // Load danh sách phim cho ngày chiếu của suất này
      if (inputDate) {
        await loadEditMovies(inputDate, st.movieId);
      }
    } catch (error: any) {
      console.error('Load showtime detail failed:', error);
      setErrorMessage(error.message || 'Không tải được chi tiết suất chiếu.');
    } finally {
      setLoadingShowTimeDetail(false);
    }
  };

  const handleCloseEditModal = () => {
    setEditForm(null);
    setEditMovies([]);
    setSavingEdit(false);
  };

  const handleEditDateChange = async (value: string) => {
    setEditForm((prev) => (prev ? { ...prev, date: value } : prev));
    await loadEditMovies(value);
  };

  const handleEditSubmit = async () => {
    if (!editForm) return;

    if (!editForm.startTime || !editForm.endTime) {
      setErrorMessage('Hãy nhập giờ bắt đầu và kết thúc.');
      return;
    }
    if (editForm.startTime >= editForm.endTime) {
      setErrorMessage('Giờ bắt đầu phải nhỏ hơn giờ kết thúc.');
      return;
    }

    setSavingEdit(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const payload = {
      showDate: formatDateForPayload(editForm.date), // dd/MM/yyyy
      startTime: editForm.startTime,
      endTime: editForm.endTime,
      screen_room_id: editForm.screenRoomId,
      movie_id: editForm.movieId,
    };

    try {
      const res = await fetch(`${SHOWTIME_ADMIN_API}/${editForm.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const data: ApiResponse<ShowTimeResponse> | null = await res
        .json()
        .catch(() => null);

      if (!res.ok || (data && data.code && data.code !== 0)) {
        throw new Error(data?.message || 'Cập nhật suất chiếu thất bại.');
      }

      setSuccessMessage('Cập nhật suất chiếu thành công.');
      handleCloseEditModal();

      // Reload list theo filter hiện tại
      if (selectedScreenRoomId && selectedDate) {
        await loadShowTimes(selectedScreenRoomId, selectedDate);
      }
    } catch (error: any) {
      console.error('Update showtime failed:', error);
      setErrorMessage(error.message || 'Cập nhật suất chiếu thất bại.');
    } finally {
      setSavingEdit(false);
    }
  };

  // ====== Tạo suất chiếu mới ======
  const handleSubmitShowTime = async () => {
    if (!selectedScreenRoomId) {
      setErrorMessage('Hãy chọn phòng chiếu.');
      return;
    }
    if (!selectedMovieId) {
      setErrorMessage('Hãy chọn phim.');
      return;
    }
    if (!selectedDate) {
      setErrorMessage('Hãy chọn ngày chiếu.');
      return;
    }
    if (!startTimeInput || !endTimeInput) {
      setErrorMessage('Hãy nhập giờ bắt đầu và kết thúc.');
      return;
    }
    if (startTimeInput >= endTimeInput) {
      setErrorMessage('Giờ bắt đầu phải nhỏ hơn giờ kết thúc.');
      return;
    }

    setCreatingOrUpdatingShowTime(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const payload = {
      showDate: formatDateForPayload(selectedDate), // dd/MM/yyyy
      startTime: startTimeInput,
      endTime: endTimeInput,
      screen_room_id: selectedScreenRoomId,
      movie_id: selectedMovieId,
    };

    try {
      const res = await fetch(SHOWTIME_ADMIN_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const data: ApiResponse<ShowTimeResponse> | null = await res
        .json()
        .catch(() => null);

      if (!res.ok || (data && data.code && data.code !== 0)) {
        throw new Error(data?.message || 'Tạo suất chiếu thất bại.');
      }

      setSuccessMessage('Tạo suất chiếu thành công.');
      setStartTimeInput('');
      setEndTimeInput('');

      if (selectedScreenRoomId && selectedDate) {
        await loadShowTimes(selectedScreenRoomId, selectedDate);
      }
    } catch (error: any) {
      console.error('Submit showtime failed:', error);
      setErrorMessage(error.message || 'Tạo suất chiếu thất bại.');
    } finally {
      setCreatingOrUpdatingShowTime(false);
    }
  };

  // ====== Xóa mềm suất chiếu ======
  const handleDeleteShowTime = async (id: number) => {
    const confirmDelete = window.confirm('Bạn có chắc muốn xóa suất chiếu này?');
    if (!confirmDelete) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`${SHOWTIME_ADMIN_API}/${id}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
        },
      });

      let data: ApiResponse<null> | null = null;
      try {
        data = await res.json();
      } catch {
        // ignore parse error
      }

      if (!res.ok || (data && data.code && data.code !== 0)) {
        throw new Error(data?.message || 'Xóa suất chiếu thất bại.');
      }

      setSuccessMessage('Xóa suất chiếu thành công.');
      if (selectedScreenRoomId && selectedDate) {
        await loadShowTimes(selectedScreenRoomId, selectedDate);
      }
    } catch (error: any) {
      console.error('Delete showtime failed:', error);
      setErrorMessage(error.message || 'Xóa suất chiếu thất bại.');
    }
  };

  // ====== UI helper ======
  const currentRoom = useMemo(
    () => screenRooms.find((r) => r.id === selectedScreenRoomId) || null,
    [screenRooms, selectedScreenRoomId],
  );

  // group theo phim để hiển thị dạng thời gian biểu
  const groupedShowTimes = useMemo(() => {
    const map = new Map<string, ShowTimeDTO[]>();

    showTimes.forEach((st) => {
      const key = st.movieName || 'Không rõ tên phim';
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(st);
    });

    // sort từng nhóm theo giờ bắt đầu
    map.forEach((list) => {
      list.sort((a, b) =>
        trimTime(a.startTime).localeCompare(trimTime(b.startTime)),
      );
    });

    return map;
  }, [showTimes]);

  const isFormDisabled =
    !selectedScreenRoomId || loadingShowTimeDetail || loadingShowTimes;

  // ====== RENDER ======
  return (
    <div className="w-full max-w-6xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Quản lý suất chiếu</h1>
          <p className="text-sm text-slate-500 mt-1">
            Chọn rạp, phòng chiếu, ngày &amp; phim để cấu hình lịch chiếu. Dữ liệu hiển
            thị theo đúng logic backend (screenRoomId + ngày).
          </p>
        </div>
      </div>

      {/* Thông báo */}
      {(errorMessage || successMessage) && (
        <div className="space-y-2">
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {successMessage}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Cột trái: filter + form tạo mới */}
        <div className="col-span-12 md:col-span-4 space-y-4">
          {/* Chọn tỉnh / thành */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-slate-800">
              <MapPin size={18} />
              <span className="font-medium text-sm">Chọn Tỉnh / Thành phố</span>
            </div>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/40"
              value={selectedProvinceCode}
              onChange={(e) => handleProvinceChange(e.target.value)}
            >
              <option value="">-- Chọn tỉnh / thành --</option>
              {provinces.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
            {loadingProvinces && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="animate-spin" size={14} />
                Đang tải danh sách tỉnh / thành...
              </div>
            )}
          </div>

          {/* Chọn rạp */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-slate-800">
              <Building size={18} />
              <span className="font-medium text-sm">Chọn rạp</span>
            </div>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/40"
              value={selectedCinemaId ?? ''}
              onChange={(e) => handleCinemaChange(e.target.value)}
              disabled={!selectedProvinceCode}
            >
              <option value="">-- Chọn rạp --</option>
              {cinemas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {loadingCinemas && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="animate-spin" size={14} />
                Đang tải danh sách rạp...
              </div>
            )}
          </div>

          {/* Chọn phòng chiếu */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-slate-800">
              <MonitorPlay size={18} />
              <span className="font-medium text-sm">Chọn phòng chiếu</span>
            </div>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/40"
              value={selectedScreenRoomId ?? ''}
              onChange={(e) => handleScreenRoomChange(e.target.value)}
              disabled={!selectedCinemaId}
            >
              <option value="">-- Chọn phòng chiếu --</option>
              {screenRooms.map((sr) => (
                <option key={sr.id} value={sr.id}>
                  {sr.name} ({sr.roomType})
                </option>
              ))}
            </select>
            {loadingRooms && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="animate-spin" size={14} />
                Đang tải danh sách phòng chiếu...
              </div>
            )}
          </div>

          {/* Form tạo mới suất chiếu */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between text-slate-800">
              <div className="flex items-center gap-2">
                <CalendarDays size={18} />
                <span className="font-medium text-sm">Thêm suất chiếu mới</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-600">Ngày chiếu</label>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/40"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                disabled={!selectedScreenRoomId}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-600 flex items-center gap-1">
                <Film size={14} />
                Phim đang chiếu trong ngày
              </label>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/40"
                value={selectedMovieId ?? ''}
                onChange={(e) =>
                  setSelectedMovieId(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                disabled={loadingMovies || movies.length === 0}
              >
                {movies.length === 0 && (
                  <option value="">-- Không có phim đang chiếu --</option>
                )}
                {movies.length > 0 && <option value="">-- Chọn phim --</option>}
                {movies.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {loadingMovies && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="animate-spin" size={14} />
                  Đang tải danh sách phim...
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Giờ bắt đầu</label>
                <input
                  type="time"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/40"
                  value={startTimeInput}
                  onChange={(e) => setStartTimeInput(e.target.value)}
                  disabled={isFormDisabled}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Giờ kết thúc</label>
                <input
                  type="time"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/40"
                  value={endTimeInput}
                  onChange={(e) => setEndTimeInput(e.target.value)}
                  disabled={isFormDisabled}
                />
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSubmitShowTime}
                disabled={
                  creatingOrUpdatingShowTime ||
                  !selectedScreenRoomId ||
                  !selectedMovieId ||
                  !selectedDate ||
                  !startTimeInput ||
                  !endTimeInput
                }
                className="inline-flex items-center justify-center w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
              >
                {creatingOrUpdatingShowTime && (
                  <Loader2 className="mr-2 animate-spin" size={16} />
                )}
                Thêm suất chiếu
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              Suất chiếu được lưu bằng format ngày <b>dd/MM/yyyy</b> và giờ{' '}
              <b>HH:mm</b>, khớp với <code>ShowTimeRequest</code> của backend.&nbsp; API
              phim sử dụng cùng ngày với lịch chiếu:
              <code> /admin/movie/showday?date=dd-MM-yyyy</code>.
            </p>
          </div>
        </div>

        {/* Cột phải: danh sách suất chiếu (thời gian biểu theo phim) */}
        <div className="col-span-12 md:col-span-8">
          <div className="h-full rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-800">
                  Thời gian biểu chiếu phim
                </span>
                {(loadingShowTimes || loadingShowTimeDetail) && (
                  <Loader2 className="animate-spin" size={16} />
                )}
              </div>
              {currentRoom && (
                <span className="text-xs text-slate-500">
                  Phòng: <b>{currentRoom.name}</b> ({currentRoom.roomType}) – Ngày:{' '}
                  <b>{formatDateForPayload(selectedDate)}</b>
                </span>
              )}
            </div>

            <div className="flex-1 overflow-auto rounded-xl bg-white border border-slate-100">
              {(!selectedScreenRoomId || !selectedDate) && (
                <div className="h-full flex items-center justify-center text-sm text-slate-500 text-center px-6 py-10">
                  Hãy chọn rạp, phòng chiếu và ngày để xem thời gian biểu.
                </div>
              )}

              {selectedScreenRoomId &&
                selectedDate &&
                showTimes.length === 0 &&
                !loadingShowTimes && (
                  <div className="h-full flex items-center justify-center text-sm text-slate-500 text-center px-6 py-10">
                    Ngày này hiện chưa có suất chiếu nào cho phòng này.
                  </div>
                )}

              {selectedScreenRoomId && selectedDate && showTimes.length > 0 && (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from(groupedShowTimes.entries()).map(
                    ([movieName, list]) => (
                      <div
                        key={movieName}
                        className="rounded-xl border border-slate-200 bg-slate-50/80 overflow-hidden flex flex-col"
                      >
                        {/* Header phim */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-100/80">
                          <div className="flex items-center gap-2">
                            <Film size={16} className="text-slate-700" />
                            <span className="text-xs font-semibold text-slate-900 line-clamp-1">
                              {movieName}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {list.length} suất chiếu
                          </span>
                        </div>

                        {/* Danh sách khung giờ */}
                        <ul className="divide-y divide-slate-200">
                          {list.map((st) => (
                            <li
                              key={st.id}
                              className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-white/70"
                            >
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold text-slate-900">
                                  {trimTime(st.startTime)} – {trimTime(st.endTime)}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  Phòng #{st.screenRoomId}
                                </span>
                              </div>
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEditShowTime(st.id)}
                                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] hover:bg-slate-100"
                                >
                                  <Pencil size={11} />
                                  <span>Sửa</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteShowTime(st.id)}
                                  className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-[11px] text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 size={11} />
                                  <span>Xóa</span>
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>

            <p className="mt-3 text-[11px] text-slate-500">
              Thời gian biểu được lấy từ API{' '}
              <code>/admin/showtime/screenroom/&#123;id&#125;?date=dd-MM-yyyy</code> – trả
              về <code>ShowTimeDTO</code>. Chi tiết 1 suất chiếu dùng{' '}
              <code>/admin/showtime/&#123;id&#125;</code> – trả về{' '}
              <code>ShowTimeResponse</code> phục vụ chỉnh sửa &amp; xóa mềm.
            </p>
          </div>
        </div>
      </div>

      {/* ====== MODAL CHỈNH SỬA SUẤT CHIẾU ====== */}
      {editForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">
                Chỉnh sửa suất chiếu #{editForm.id}
              </h2>
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="p-1 rounded-full hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Ngày chiếu</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/40"
                  value={editForm.date}
                  onChange={(e) => handleEditDateChange(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-600 flex items-center gap-1">
                  <Film size={14} />
                  Phim
                </label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/40"
                  value={editForm.movieId}
                  onChange={(e) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, movieId: Number(e.target.value) } : prev,
                    )
                  }
                  disabled={loadingEditMovies || editMovies.length === 0}
                >
                  {editMovies.length === 0 && (
                    <option value="">-- Không có phim phù hợp ngày này --</option>
                  )}
                  {editMovies.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                {loadingEditMovies && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Loader2 className="animate-spin" size={14} />
                    Đang tải danh sách phim...
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-600">Giờ bắt đầu</label>
                  <input
                    type="time"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/40"
                    value={editForm.startTime}
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, startTime: e.target.value } : prev,
                      )
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600">Giờ kết thúc</label>
                  <input
                    type="time"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/40"
                    value={editForm.endTime}
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, endTime: e.target.value } : prev,
                      )
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleEditSubmit}
                disabled={savingEdit}
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
              >
                {savingEdit && <Loader2 className="mr-2 animate-spin" size={16} />}
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
